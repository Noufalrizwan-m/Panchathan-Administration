import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import db from './server/db';
import multer from 'multer';
import fs from 'fs';
import { Trip, WorkDay } from './src/types';
import cors from 'cors';


const publicUser = (user: any) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '12mb' }));
  app.use(cors({
    origin: 'https://panchathan-administration.vercel.app',
    credentials: true
  }));
  app.use((req, res, next) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);
    next();
  });

  // ---- Upload setup (memory → base64 in MongoDB, no disk dependency) ----
  const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
  });

  // Still serve any legacy disk files that exist
  app.use('/uploads', express.static(UPLOAD_DIR));

  // ----------------------------------------------------------------
  // AUTH
  // ----------------------------------------------------------------

  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username) return res.status(400).json({ error: 'Username is required.' });
    const normUser = username.trim().toLowerCase();
    const normPass = password ? password.trim() : '';
    if (!normPass) return res.status(400).json({ error: 'Password is required.' });

    try {
      const user = await db.findUserByUsername(normUser);
      if (!user) return res.status(401).json({ error: 'Account not found. Ask admin to create your credentials.' });

      const expected = user.password || (user.username === (process.env.ADMIN_USERNAME || 'admin') ? (process.env.ADMIN_PIN || '1234') : '');
      if (expected !== normPass) return res.status(401).json({ error: 'Incorrect username or password.' });

      await db.logActivity(user.id, user.fullName, `${user.fullName} logged in`);
      return res.json({ success: true, user: publicUser(user) });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/auth/me', async (req, res) => {
    const username = req.query.username as string || req.headers['authorization'] as string;
    if (!username) return res.status(401).json({ error: 'Not authenticated.' });
    const user = await db.findUserByUsername(username);
    if (!user) return res.status(401).json({ error: 'Session expired or not found.' });
    return res.json({ user: publicUser(user) });
  });

  // ----------------------------------------------------------------
  // ADMIN
  // ----------------------------------------------------------------

  app.post('/api/admin/clear-all', async (req, res) => {
    try {
      await db.clearAllData();
      res.json({ success: true, message: 'All data cleared. Admin account preserved.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });


  // ----------------------------------------------------------------
  // FLEET / VEHICLES
  // ----------------------------------------------------------------

  app.get('/api/fleet', async (_req, res) => {
    const vehicles = await db.getVehicles();
    return res.json({ vehicles });
  });

  app.post('/api/fleet', async (req, res) => {
    const d = req.body;
    if (!d.id || !d.plate || !d.model) return res.status(400).json({ error: 'Vehicle ID, plate, and model are required.' });
    try {
      const v = await db.saveVehicle({
        ...d,
        vehicleType: d.vehicleType || 'Truck',
        odometerKm: Number(d.odometerKm) || 0,
        serviceDueKm: Number(d.serviceDueKm) || 10000,
        completeness: d.completeness || 25,
        documents: d.documents || {
          registrationCertificate: { status: 'PENDING' },
          commercialInsurance: { status: 'PENDING' },
          fitnessCertificate: { status: 'PENDING' },
          nationalPermit: { status: 'PENDING' }
        }
      });
      await db.logActivity('1', d.operatorName || 'Admin', `Registered vehicle ${v.id} (${v.plate})`);
      return res.json({ success: true, vehicle: v });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/fleet/:id/upload', async (req, res) => {
    const { id } = req.params;
    const { documentType, fileName } = req.body;
    if (!documentType || !fileName) return res.status(400).json({ error: 'documentType and fileName are required.' });
    try {
      const vehicle = await db.getVehicleById(id);
      if (!vehicle) return res.status(404).json({ error: 'Vehicle not found.' });
      const docs = { ...vehicle.documents };
      if (!(documentType in docs)) return res.status(400).json({ error: `Invalid documentType: ${documentType}` });
      (docs as any)[documentType] = { file: fileName, status: 'UPLOADED', updatedAt: new Date().toISOString() };
      const uploadedCount = Object.values(docs).filter((d: any) => d.status === 'UPLOADED').length;
      const updated = await db.saveVehicle({ ...vehicle, documents: docs, completeness: Math.max(25, Math.floor((uploadedCount / 4) * 100)) });
      await db.logActivity('1', req.body.operatorName || 'Admin', `Uploaded ${documentType} for vehicle ${id}`);
      return res.json({ success: true, vehicle: updated });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/fleet/:id/daily-update', async (req, res) => {
    const { id } = req.params;
    const { fuelLevel, odometer, vehicleStatus, tireNotes, reportNotes, operatorName } = req.body;
    try {
      const vehicle = await db.getVehicleById(id);
      if (!vehicle) return res.status(404).json({ error: 'Vehicle not found.' });
      let updatedStatus = vehicle.status;
      if (vehicleStatus === 'Needs Maintenance' || vehicleStatus === 'Critical Faults') updatedStatus = 'Maintenance';
      else if (vehicleStatus === 'Excellent' && vehicle.status === 'Maintenance') updatedStatus = 'Idle';
      const finalOdo = Number(odometer) || 0;
      const updated = await db.saveVehicle({
        ...vehicle,
        status: updatedStatus,
        odometerKm: finalOdo || vehicle.odometerKm,
        serviceDueKm: vehicle.serviceDueKm && vehicle.serviceDueKm > finalOdo ? vehicle.serviceDueKm : finalOdo + 10000,
        nextService: finalOdo > 0 ? `At ${vehicle.serviceDueKm && vehicle.serviceDueKm > finalOdo ? vehicle.serviceDueKm : finalOdo + 10000} KM` : vehicle.nextService
      });
      await db.logActivity('1', operatorName || 'Driver', `Daily check ${id}: Status=${vehicleStatus}, Fuel=${fuelLevel}%, Odo=${finalOdo}km. ${reportNotes || ''} ${tireNotes ? 'Tires: ' + tireNotes : ''}`);
      return res.json({ success: true, vehicle: updated });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------------------
  // EMPLOYEES / DRIVERS
  // ----------------------------------------------------------------

  app.get('/api/drivers', async (_req, res) => {
    const drivers = await db.getDrivers();
    return res.json({ drivers });
  });

  app.post('/api/drivers', async (req, res) => {
    const d = req.body;
    if (!d.name) return res.status(400).json({ error: 'Employee name is required.' });
    if (!d.username || !d.password) return res.status(400).json({ error: 'Username and password are required.' });
    try {
      const username = String(d.username).trim().toLowerCase();
      const existing = await db.findUserByUsername(username);
      if (existing) return res.status(409).json({ error: 'Username already taken. Choose another.' });

      const id = d.id || 'EMP-' + Math.floor(1000 + Math.random() * 9000);
      const newUser = await db.createUser({
        id,
        username,
        password: String(d.password).trim(),
        role: 'driver',
        fullName: d.name,
        driverId: id,
        phone: d.phone || '',
        emergencyContact: d.emergencyContact || '',
        address: d.address || '',
        city: d.city || '',
        state: d.state || '',
        employeeCode: d.employeeCode || id,
        licenseNumber: d.licenseNumber || ('DL' + Math.floor(100000 + Math.random() * 900000) + 'A'),
        designation: d.designation || '',
        shiftStart: d.shiftStart || '09:30',
        shiftEnd: d.shiftEnd || '19:00',
        status: 'Available',
        rating: 5.0,
        totalTrips: 0,
        onTimeRate: 100,
        avatar: d.avatar
      });

      await db.logActivity('1', d.operatorName || 'Admin', `Created employee: ${d.name} (${username})`);
      return res.json({ success: true, driver: newUser });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/drivers/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const driver = await db.getDriverById(id);
      if (!driver) return res.status(404).json({ error: 'Employee not found.' });
      const { name, operatorName, ...rest } = req.body;
      const updates = { ...rest, ...(name ? { fullName: name } : {}) };
      const updated = await db.saveDriver({ ...driver, ...updates });
      await db.logActivity('admin', operatorName || 'Admin', `Updated employee: ${updated.fullName}`);
      return res.json({ success: true, driver: updated });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/drivers/:id', async (req, res) => {
    const { id } = req.params;
    try {
      await db.deleteDriver(id);
      await db.logActivity('admin', 'Admin', `Deleted employee ${id}`);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/drivers/:driverId/trips', async (req, res) => {
    const { driverId } = req.params;
    const date = req.query.date as string | undefined;
    try {
      const trips = await db.getTripsByDriver(driverId, date);
      return res.json({ trips });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------------------
  // TRIPS
  // ----------------------------------------------------------------

  app.get('/api/trips', async (_req, res) => {
    const trips = await db.getTrips();
    return res.json({ trips });
  });

  app.get('/api/trips/active', async (req, res) => {
    const { driverId } = req.query;
    if (!driverId) return res.status(400).json({ error: 'driverId is required.' });
    try {
      const trip = await db.getDriverActiveTrip(driverId as string);
      return res.json({ trip });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/trips', async (req, res) => {
    const d = req.body;
    if (!d.driverId || !d.origin || !d.destination) {
      return res.status(400).json({ error: 'driverId, origin, and destination are required.' });
    }
    try {
      const tripId = 'TRIP-' + Math.floor(1000 + Math.random() * 9000);
      const newTrip: Trip = {
        id: tripId,
        driverId: d.driverId,
        coPassengerId: d.coPassengerId,
        origin: d.origin,
        destination: d.destination,
        status: 'Saved Draft',
        taskStage: 'Upcoming',
        taskType: d.taskType || 'PICKUP',
        priority: d.priority || 'High',
        customerName: d.customerName || '',
        podNumber: d.podNumber || '',
        courierName: d.courierName || '',
        porter: d.porter || { enabled: false },
        pickupNotes: d.pickupNotes || '',
        deliveryNotes: d.deliveryNotes || '',
        proofPhotos: [],
        lastUpdated: new Date().toISOString()
      };
      const created = await db.saveTrip(newTrip);
      await db.logActivity('1', d.operatorName || 'Admin', `Dispatched task ${tripId} (${d.origin} → ${d.destination}) to employee ${d.driverId}`);
      return res.json({ success: true, trip: created });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/trips/:id/update-telematics', async (req, res) => {
    const { id } = req.params;
    const update = req.body;
    try {
      const trip = await db.getTripById(id);
      if (!trip) return res.status(404).json({ error: 'Trip not found.' });

      const newStatus = update.status || trip.status;
      const newTaskStage = newStatus === 'Completed' ? 'Completed' : newStatus === 'Incomplete' ? 'Incomplete' : newStatus === 'In Progress' ? 'Ongoing' : 'Upcoming';

      const updatedTrip = await db.saveTrip({
        ...trip,
        status: newStatus,
        taskStage: newTaskStage,
        lastUpdated: new Date().toISOString()
      });

      if (update.status === 'In Progress' && trip.status !== 'In Progress') {
        const d = await db.getDriverById(trip.driverId);
        if (d) await db.saveDriver({ ...d, status: 'Active' });
      }

      if (update.status === 'Completed' || update.status === 'Incomplete') {
        const d = await db.getDriverById(trip.driverId);
        if (d) await db.saveDriver({ ...d, status: 'Available', totalTrips: (d.totalTrips || 0) + (update.status === 'Completed' ? 1 : 0) });
      }

      return res.json({ success: true, trip: updatedTrip });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/trips/:id/proof', async (req, res) => {
    const { id } = req.params;
    try {
      const trip = await db.getTripById(id);
      if (!trip) return res.status(404).json({ error: 'Trip not found.' });

      const kind = String(req.body.kind || '').toUpperCase();
      const validKinds = ['PICKUP', 'DELIVERY', 'PICKUP_REF', 'DELIVERY_REF', 'PACKAGE_REF'];
      if (!validKinds.includes(kind)) return res.status(400).json({ error: `Invalid kind. Must be one of: ${validKinds.join(', ')}` });

      console.log(`[PROOF] trip=${id} kind=${kind} hasDataUrl=${!!req.body.dataUrl} bodyKeys=${Object.keys(req.body || {}).join(',')}`);

      const dataUrlBody = req.body.dataUrl ? String(req.body.dataUrl) : null;
      if (!dataUrlBody) return res.status(400).json({ error: 'No dataUrl provided.' });

      const approxBytes = Math.ceil(((dataUrlBody.split(',')[1] || '').length * 3) / 4);
      if (approxBytes > 10 * 1024 * 1024) return res.status(413).json({ error: 'Image too large. Max 10 MB.' });

      const photoRecord: any = {
        kind,
        fileName: String(req.body.fileName || `photo-${Date.now()}.jpg`),
        uploadedBy: String(req.body.uploadedBy || req.body.operatorName || 'driver'),
        dataUrl: dataUrlBody,
        uploadedAt: new Date().toISOString()
      };

      if (kind === 'PACKAGE_REF') {
        const updatedTrip = await db.saveTrip({ ...trip, packagePhoto: photoRecord, lastUpdated: new Date().toISOString() });
        return res.json({ success: true, trip: updatedTrip });
      }

      const updatedTrip = await db.saveTrip({ ...trip, proofPhotos: [...(trip.proofPhotos || []), photoRecord], lastUpdated: new Date().toISOString() });
      const photoDriver = await db.getDriverById(trip.driverId);
      await db.logActivity(photoDriver?.id || trip.driverId, photoDriver?.fullName || req.body.operatorName || 'Employee', `${kind} photo uploaded for task ${id}`);
      return res.json({ success: true, trip: updatedTrip });
    } catch (err: any) {
      if (err?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'Image too large. Max 10 MB.' });
      return res.status(500).json({ error: err.message || String(err) });
    }
  });

  // Reassign or reset a task (admin use: change driverId, reset to pending)
  app.patch('/api/trips/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const trip = await db.getTripById(id);
      if (!trip) return res.status(404).json({ error: 'Trip not found.' });
      const { driverId, status, taskStage, operatorName, ...rest } = req.body;
      const isReassign = !!(driverId || taskStage === 'Upcoming');
      const updatedTrip = await db.saveTrip({
        ...trip,
        ...rest,
        ...(driverId   ? { driverId }   : {}),
        ...(status     ? { status }     : {}),
        ...(taskStage  ? { taskStage }  : {}),
        // Clear the incomplete remark when reassigning so the new employee starts fresh
        ...(isReassign ? { remark: undefined, remarkAddedAt: undefined } : {}),
        lastUpdated: new Date().toISOString(),
      });
      const newDriver = driverId ? await db.getDriverById(driverId) : null;
      await db.logActivity('admin', operatorName || 'Admin',
        `Task ${id} reassigned to ${newDriver?.fullName || driverId || 'same employee'}, status → ${updatedTrip.status}`);
      return res.json({ success: true, trip: updatedTrip });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/trips/:id/remark', async (req, res) => {
    const { id } = req.params;
    const { remark, operatorName } = req.body;
    if (!remark?.trim()) return res.status(400).json({ error: 'Remark text is required.' });
    try {
      const trip = await db.getTripById(id);
      if (!trip) return res.status(404).json({ error: 'Trip not found.' });
      const updated = await db.saveTrip({ ...trip, remark: remark.trim(), remarkAddedAt: new Date().toISOString(), taskStage: 'Incomplete', status: 'Incomplete', lastUpdated: new Date().toISOString() });
      const remarkDriver = await db.getDriverById(trip.driverId);
      await db.logActivity(remarkDriver?.id || trip.driverId, remarkDriver?.fullName || operatorName || 'Employee', `Marked task ${id} incomplete: ${remark.trim()}`);
      return res.json({ success: true, trip: updated });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------------------
  // WORK DAYS
  // ----------------------------------------------------------------

  app.get('/api/workdays', async (_req, res) => {
    try {
      const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const workDays = await db.getWorkDays(from);
      return res.json({ workDays });
    } catch (err: any) { return res.status(500).json({ error: err.message }); }
  });

  app.get('/api/workday/today/:userId', async (req, res) => {
    const { userId } = req.params;
    const date = new Date().toISOString().slice(0, 10);
    try {
      const workDay = await db.getWorkDayByUserAndDate(userId, date);
      if (!workDay) return res.json({ workDay: null });

      // If co-passenger, attach partner's trips
      let trips: Trip[] = [];
      const targetDriverId = workDay.partnerId || (await db.findUserById(userId))?.driverId || '';
      if (workDay.role === 'co-passenger' && workDay.partnerId) {
        const partnerUser = await db.findUserById(workDay.partnerId);
        const partnerDriverId = partnerUser?.driverId || workDay.partnerId;
        trips = await db.getTripsByDriver(partnerDriverId);
      } else if (targetDriverId) {
        trips = await db.getTripsByDriver(targetDriverId);
      }

      return res.json({ workDay, trips });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/workday/history/:userId', async (req, res) => {
    const { userId } = req.params;
    const limit = Number(req.query.limit) || 30;
    try {
      const history = await db.getWorkDayHistory(userId, limit);
      return res.json({ history });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/workday', async (req, res) => {
    const d = req.body;
    if (!d.userId || !d.transportMode || !d.startLocation) {
      return res.status(400).json({ error: 'userId, transportMode, and startLocation are required.' });
    }
    const date = new Date().toISOString().slice(0, 10);
    try {
      const existing = await db.getWorkDayByUserAndDate(d.userId, date);
      if (existing && existing.eodSubmitted) {
        return res.status(409).json({ error: 'Work day already submitted for today.' });
      }
      if (existing) {
        return res.json({ workDay: existing });
      }
      const newWorkDay: WorkDay = {
        id: 'WD-' + Math.random().toString(36).substr(2, 9),
        userId: d.userId,
        date,
        transportMode: d.transportMode,
        vehicleId: d.vehicleId,
        role: d.role,
        partnerId: d.partnerId,
        startTime: d.startTime || new Date().toISOString(),
        startLocation: d.startLocation,
        plannedTripIds: d.plannedTripIds || [],
        eodSubmitted: false,
        createdAt: new Date().toISOString()
      };
      const saved = await db.saveWorkDay(newWorkDay);
      await db.logActivity(d.userId, d.employeeName || 'Employee', `Started work day: ${d.transportMode}${d.role ? ' as ' + d.role : ''} from ${d.startLocation.address}`);
      return res.json({ workDay: saved });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/workday/:id/transport', async (req, res) => {
    const { id } = req.params;
    const { transportMode, role, vehicleId, partnerId,
            porterBookingId, porterVehicleNumber, porterAmount, porterVehiclePhoto } = req.body;
    const valid = ['bike', 'auto', 'van', 'truck', 'porter', 'other'];
    if (!valid.includes(transportMode)) return res.status(400).json({ error: 'Invalid transport mode.' });
    try {
      const wd = await db.getWorkDayById(id);
      if (!wd) return res.status(404).json({ error: 'Workday not found.' });
      const updated = await db.saveWorkDay({
        ...wd,
        transportMode,
        ...(role                !== undefined ? { role }                : {}),
        ...(vehicleId           !== undefined ? { vehicleId }           : {}),
        ...(partnerId           !== undefined ? { partnerId }           : {}),
        ...(porterBookingId     !== undefined ? { porterBookingId }     : {}),
        ...(porterVehicleNumber !== undefined ? { porterVehicleNumber } : {}),
        ...(porterAmount        !== undefined ? { porterAmount }        : {}),
        ...(porterVehiclePhoto  !== undefined ? { porterVehiclePhoto }  : {}),
      });
      return res.json({ success: true, workDay: updated });
    } catch (err: any) { return res.status(500).json({ error: err.message }); }
  });

  app.patch('/api/workday/:id/end', async (req, res) => {
    const { id } = req.params;
    const { endTime, endLocation, eodNotes, userId } = req.body;
    if (!endTime || !endLocation) return res.status(400).json({ error: 'endTime and endLocation are required.' });
    try {
      const workDay = await db.getWorkDayById(id);
      if (!workDay) return res.status(404).json({ error: 'Work day not found.' });
      const updated = await db.saveWorkDay({ ...workDay, endTime, endLocation, eodNotes: eodNotes || '', eodSubmitted: true });
      const eodUser = await db.findUserById(userId || workDay.userId);
      await db.logActivity(userId || workDay.userId, eodUser?.fullName || 'Employee', `Submitted end-of-day report at ${endLocation.address}`);
      return res.json({ workDay: updated });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/workday/:id/eod-photos', upload.single('photo'), async (req, res) => {
    const { id } = req.params;
    try {
      const workDay = await db.getWorkDayById(id);
      if (!workDay) return res.status(404).json({ error: 'Work day not found.' });

      let photoRecord: any = null;
      if ((req as any).file) {
        const file = (req as any).file;
        const base64 = file.buffer.toString('base64');
        const dataUrl = `data:${file.mimetype || 'image/jpeg'};base64,${base64}`;
        photoRecord = { kind: 'DELIVERY', fileName: file.originalname, uploadedBy: 'driver', dataUrl, uploadedAt: new Date().toISOString() };
      } else if (req.body.dataUrl) {
        photoRecord = { kind: 'DELIVERY', fileName: String(req.body.fileName || `eod-${Date.now()}.jpg`), uploadedBy: 'driver', dataUrl: req.body.dataUrl, uploadedAt: new Date().toISOString() };
      } else {
        return res.status(400).json({ error: 'No photo provided.' });
      }

      const updated = await db.saveWorkDay({ ...workDay, eodPhotos: [...(workDay.eodPhotos || []), photoRecord] });
      return res.json({ workDay: updated });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------------------
  // USERS
  // ----------------------------------------------------------------

  app.get('/api/users', async (_req, res) => {
    try {
      const users = await db.getUsers();
      return res.json({ users: users.map(publicUser) });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/users/:username', async (req, res) => {
    const { username } = req.params;
    try {
      const updated = await db.updateUser(username, req.body);
      if (!updated) return res.status(404).json({ error: 'User not found.' });
      await db.logActivity('admin', 'Admin', `Updated user settings for ${username}`);
      return res.json({ success: true, user: publicUser(updated) });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/users/:username', async (req, res) => {
    const { username } = req.params;
    if (username === 'admin') return res.status(403).json({ error: 'Cannot delete the admin account.' });
    try {
      const user = await db.findUserByUsername(username);
      if (!user) return res.status(404).json({ error: 'User not found.' });
      await db.deleteUser(username);
      await db.logActivity('admin', 'Admin', `Deleted employee account: ${username}`);
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/users/:username/activity', async (req, res) => {
    const { username } = req.params;
    try {
      const user = await db.findUserByUsername(username);
      if (!user) return res.status(404).json({ error: 'User not found.' });
      const logs = await db.getActivityLogsByUser(user.id, username, user.fullName);
      return res.json({ logs });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // ----------------------------------------------------------------
  // MISC
  // ----------------------------------------------------------------

  app.get('/api/activity', async (_req, res) => {
    const logs = await db.getActivityLogs();
    res.json({ logs });
  });

  app.get('/api/db-status', (_req, res) => {
    res.json({ connected: db.isMongoDbConnected(), error: db.getMongoError(), seedStatus: db.getSeedStatus() });
  });

  app.post('/api/db-status/reseed', async (_req, res) => {
    try {
      await db.forceReseedMongoDB();
      res.json({ success: true, message: 'Database re-seeded successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  // ----------------------------------------------------------------
  // STATIC / VITE
  // ----------------------------------------------------------------

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }


  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SERVER] Panchathan running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[CRITICAL] Server failed to start:', err);
});
