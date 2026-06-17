import mongoose from 'mongoose';
import { Vehicle, Trip, User, WorkDay, ActivityLog } from '../src/types';

const bootstrapAdmin: User = {
  id: 'admin',
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PIN || '1234',
  role: 'admin',
  fullName: process.env.ADMIN_NAME || 'Panchathan Admin'
};

// ─── Schemas ─────────────────────────────────────────────────────────────────

const UserSchema = new mongoose.Schema<User>({
  id:             { type: String, required: true, unique: true },
  username:       { type: String, required: true, unique: true, lowercase: true, index: true },
  password:       { type: String },
  role:           { type: String, required: true, enum: ['admin', 'driver'] },
  fullName:       { type: String, required: true },
  enabled:        { type: Boolean, default: true },
  driverId:       { type: String },  // for employees: equals id

  // Employee profile
  phone:           { type: String },
  emergencyContact:{ type: String },
  address:         { type: String },
  city:            { type: String },
  state:           { type: String },
  employeeCode:    { type: String },
  licenseNumber:   { type: String },
  designation:     { type: String },  // job title assigned by admin
  shiftStart:      { type: String },  // HH:MM shift start, e.g. "09:30"
  shiftEnd:        { type: String },  // HH:MM shift end, e.g. "19:00"
  status:          { type: String, enum: ['Available', 'Active', 'On Leave'] },
  rating:          { type: Number },
  totalTrips:      { type: Number, default: 0 },
  onTimeRate:      { type: Number, default: 100 },
  avatar:          { type: String },
}, { timestamps: true });

const UserModel = (mongoose.models.User || mongoose.model<User>('User', UserSchema)) as mongoose.Model<User>;

const DocumentStatusSchema = new mongoose.Schema({
  file:      { type: String },
  status:    { type: String, required: true, enum: ['PENDING', 'UPLOADED'] },
  updatedAt: { type: String }
}, { _id: false });

const VehicleSchema = new mongoose.Schema<Vehicle>({
  id:              { type: String, required: true, unique: true },
  plate:           { type: String, required: true },
  vehicleType:     { type: String, enum: ['Truck', 'Bike', 'Van', 'Auto', 'Other'], default: 'Truck' },
  model:           { type: String, required: true },
  make:            { type: String, required: true },
  manufacturer:    { type: String, required: true },
  modelVariant:    { type: String, required: true },
  year:            { type: Number, required: true },
  payloadCapacity: { type: Number, required: true },
  engineNumber:    { type: String },
  chassisNumber:   { type: String },
  homeBase:        { type: String, required: true },
  serviceArea:     { type: String, required: true },
  status:          { type: String, required: true, enum: ['On Route', 'Idle', 'Maintenance'] },
  nextService:     { type: String, required: true },
  odometerKm:      { type: Number },
  serviceDueKm:    { type: Number },
  lastServiceDate: { type: String },
  insuranceExpiry: { type: String },
  fitnessExpiry:   { type: String },
  permitExpiry:    { type: String },
  completeness:    { type: Number, required: true },
  documents: {
    registrationCertificate: { type: DocumentStatusSchema, required: true },
    commercialInsurance:      { type: DocumentStatusSchema, required: true },
    fitnessCertificate:       { type: DocumentStatusSchema, required: true },
    nationalPermit:           { type: DocumentStatusSchema, required: true }
  },
  assignedDriverId: { type: String }
}, { timestamps: true });

const VehicleModel = (mongoose.models.Vehicle || mongoose.model<Vehicle>('Vehicle', VehicleSchema)) as mongoose.Model<Vehicle>;

const PhotoSchema = new mongoose.Schema({
  kind:       { type: String, enum: ['PACKAGE_REF', 'PICKUP', 'DELIVERY'], required: true },
  fileName:   { type: String, required: true },
  uploadedBy: { type: String },
  filePath:   { type: String },
  dataUrl:    { type: String },   // base64 image stored in MongoDB
  uploadedAt: { type: String, required: true },
  location: {
    latitude:  { type: Number },
    longitude: { type: Number },
    address:   { type: String }
  }
}, { _id: false });

const PorterSchema = new mongoose.Schema({
  enabled:        { type: Boolean, default: false },
  bookingId:      { type: String },
  trackingNumber: { type: String },
  contactNumber:  { type: String },
  porterTaskType: { type: String, enum: ['collect', 'send'] }
}, { _id: false });

// Tasks collection (renamed from trips — simplified, no telematics/manifest)
const TripSchema = new mongoose.Schema<Trip>({
  id:             { type: String, required: true, unique: true },
  driverId:       { type: String, required: true, index: true },  // = user.id
  coPassengerId:  { type: String },
  origin:         { type: String, required: true },
  destination:    { type: String, required: true },
  status:         { type: String, required: true, enum: ['Saved Draft', 'In Progress', 'Completed', 'Incomplete'] },
  priority:       { type: String, required: true, enum: ['High', 'Medium', 'Low'] },
  taskType:       { type: String, enum: ['PICKUP', 'DELIVERY', 'BOTH'] },
  taskStage:      { type: String, enum: ['Upcoming', 'Ongoing', 'Completed', 'Incomplete'] },
  customerName:   { type: String },
  podNumber:      { type: String },
  courierName:    { type: String },
  packagePhoto:   { type: PhotoSchema },
  proofPhotos:    { type: [PhotoSchema], default: [] },
  porter:         { type: PorterSchema },
  pickupNotes:    { type: String },
  deliveryNotes:  { type: String },
  remark:         { type: String },
  remarkAddedAt:  { type: String },
  lastUpdated:    { type: String, required: true },
}, { timestamps: true });

const TripModel = (mongoose.models.Trip || mongoose.model<Trip>('Trip', TripSchema)) as mongoose.Model<Trip>;

const GeoSchema = new mongoose.Schema({
  latitude:  { type: Number, required: true },
  longitude: { type: Number, required: true },
  address:   { type: String, required: true }
}, { _id: false });

const WorkDaySchema = new mongoose.Schema<WorkDay>({
  id:            { type: String, required: true, unique: true },
  userId:        { type: String, required: true, index: true },
  date:          { type: String, required: true },
  transportMode:       { type: String, required: true, enum: ['bike', 'auto', 'van', 'truck', 'porter', 'other'] },
  vehicleId:           { type: String },
  role:                { type: String, enum: ['driver', 'co-passenger'] },
  partnerId:           { type: String },
  porterBookingId:     { type: String },
  porterVehicleNumber: { type: String },
  porterAmount:        { type: String },
  porterVehiclePhoto:  { type: String },
  startTime:     { type: String, required: true },
  startLocation: { type: GeoSchema, required: true },
  endTime:       { type: String },
  endLocation:   { type: GeoSchema },
  plannedTripIds:{ type: [String], default: [] },
  eodSubmitted:  { type: Boolean, default: false },
  eodPhotos:     { type: [PhotoSchema], default: [] },
  eodNotes:      { type: String },
  createdAt:     { type: String, required: true }
}, { timestamps: true });

const WorkDayModel = (mongoose.models.WorkDay || mongoose.model<WorkDay>('WorkDay', WorkDaySchema)) as mongoose.Model<WorkDay>;

const ActivityLogSchema = new mongoose.Schema({
  id:        { type: String, required: true, unique: true },
  userId:    { type: String, required: true, index: true },
  userName:  { type: String, required: true },
  action:    { type: String, required: true },
  timestamp: { type: String, required: true },
}, { timestamps: true });

const ActivityLogModel = (mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema));

// ─── Database class ───────────────────────────────────────────────────────────

class Database {
  private memDb = {
    users:        [bootstrapAdmin] as User[],
    vehicles:     [] as Vehicle[],
    trips:        [] as Trip[],
    workDays:     [] as WorkDay[],
    activityLogs: [] as ActivityLog[],
  };
  private isMongoConnected = false;
  private mongoError: string | null = null;

  constructor() { this.init(); }

  isMongoDbConnected() { return this.isMongoConnected; }
  getMongoError()      { return this.mongoError; }

  getSeedStatus() {
    if (!this.isMongoConnected) {
      return {
        users:     { status: 'offline_local', count: this.memDb.users.length,    error: null },
        vehicles:  { status: 'offline_local', count: this.memDb.vehicles.length, error: null },
        drivers:   { status: 'offline_local', count: 0,                          error: null },
        trips:     { status: 'offline_local', count: this.memDb.trips.length,    error: null },
        activityLogs: { status: 'n/a',        count: 0,                          error: null },
      };
    }
    return {
      users:    { status: 'connected', count: 0, error: null },
      vehicles: { status: 'connected', count: 0, error: null },
      drivers:  { status: 'n/a',       count: 0, error: null },
      trips:    { status: 'connected', count: 0, error: null },
      activityLogs: { status: 'n/a',   count: 0, error: null },
    };
  }

  async clearAllData() {
    this.memDb.vehicles = [];
    this.memDb.trips    = [];
    this.memDb.workDays = [];
    this.memDb.users    = [bootstrapAdmin];
    if (this.isMongoConnected) {
      await VehicleModel.deleteMany({});
      await TripModel.deleteMany({});
      await WorkDayModel.deleteMany({});
      await UserModel.deleteMany({});
      await UserModel.create(bootstrapAdmin);
    }
  }

  private async init() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('[DB] ERROR: MONGODB_URI is required in .env');
      process.exit(1);
    }
    const masked = uri.replace(/\/\/([^:]+):([^@]+)@/, (_m, u) => `//${u}:[REDACTED]@`);
    console.log(`[DB] Connecting: ${masked}`);
    try {
      mongoose.set('strictQuery', false);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000, connectTimeoutMS: 15000 });
      this.isMongoConnected = true;
      console.log('[DB] MongoDB connected. Collections: users, vehicles, trips, workdays');
      await this.seedAdmin();
    } catch (err: any) {
      this.mongoError = err.message;
      console.error('[DB] Connection failed:', err.message);
      process.exit(1);
    }
  }

  private async seedAdmin() {
    await UserModel.findOneAndUpdate(
      { username: bootstrapAdmin.username },
      { $set: { id: bootstrapAdmin.id, password: bootstrapAdmin.password, role: bootstrapAdmin.role, fullName: bootstrapAdmin.fullName } },
      { upsert: true, returnDocument: 'after' }
    );
    console.log('[DB] Admin ready — username: admin, password: 1234');
  }

  // ── Users / Employees ────────────────────────────────────────────────────────

  async getUsers(): Promise<User[]> {
    if (this.isMongoConnected) {
      try { return (await UserModel.find({}).lean()) as unknown as User[]; } catch (e) { console.error(e); }
    }
    return this.memDb.users;
  }

  async getDrivers(): Promise<User[]> {
    if (this.isMongoConnected) {
      try { return (await UserModel.find({ role: 'driver' }).lean()) as unknown as User[]; } catch (e) { console.error(e); }
    }
    return this.memDb.users.filter(u => u.role === 'driver');
  }

  async findUserByUsername(username: string): Promise<User | undefined> {
    if (this.isMongoConnected) {
      try {
        const doc = await UserModel.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } }).lean();
        return doc ? (doc as unknown as User) : undefined;
      } catch (e) { console.error(e); }
    }
    return this.memDb.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  async findUserById(id: string): Promise<User | undefined> {
    if (this.isMongoConnected) {
      try {
        const doc = await UserModel.findOne({ id }).lean();
        return doc ? (doc as unknown as User) : undefined;
      } catch (e) { console.error(e); }
    }
    return this.memDb.users.find(u => u.id === id);
  }

  async createUser(data: Omit<User, 'id'> & { id?: string }): Promise<User> {
    const user: User = { ...data, id: data.id || ('u-' + Math.random().toString(36).substr(2, 9)) } as User;
    this.memDb.users.push(user);
    if (this.isMongoConnected) {
      try { await UserModel.create(user); } catch (e) { console.error('[DB] createUser error', e); }
    }
    return user;
  }

  async updateUser(username: string, updates: Partial<User>): Promise<User | undefined> {
    const idx = this.memDb.users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
    if (idx >= 0) this.memDb.users[idx] = { ...this.memDb.users[idx], ...updates } as User;
    if (this.isMongoConnected) {
      try {
        await UserModel.findOneAndUpdate({ username: { $regex: new RegExp(`^${username}$`, 'i') } }, updates, { new: true });
      } catch (e) { console.error('[DB] updateUser error', e); }
    }
    return this.memDb.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  async deleteUser(username: string): Promise<boolean> {
    const before = this.memDb.users.length;
    this.memDb.users = this.memDb.users.filter(u => u.username.toLowerCase() !== username.toLowerCase());
    if (this.isMongoConnected) {
      try { await UserModel.deleteOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } }); } catch (e) { console.error(e); }
    }
    return this.memDb.users.length < before;
  }

  // getDriverById / saveDriver / deleteDriver — work on UserModel (backward compat with server.ts)

  async getDriverById(id: string): Promise<User | undefined> {
    return this.findUserById(id);
  }

  async saveDriver(user: User): Promise<User> {
    const idx = this.memDb.users.findIndex(u => u.id === user.id);
    if (idx >= 0) this.memDb.users[idx] = user;
    else this.memDb.users.unshift(user);
    if (this.isMongoConnected) {
      try { await UserModel.findOneAndUpdate({ id: user.id }, user, { upsert: true, new: true }); } catch (e) { console.error('[DB] saveDriver error', e); }
    }
    return user;
  }

  async deleteDriver(id: string): Promise<boolean> {
    const before = this.memDb.users.length;
    this.memDb.users = this.memDb.users.filter(u => u.id !== id);
    if (this.isMongoConnected) {
      try { await UserModel.deleteOne({ id }); } catch (e) { console.error(e); }
    }
    return this.memDb.users.length < before;
  }

  // ── Vehicles ─────────────────────────────────────────────────────────────────

  async getVehicles(): Promise<Vehicle[]> {
    if (this.isMongoConnected) {
      try { return (await VehicleModel.find({}).lean()) as unknown as Vehicle[]; } catch (e) { console.error(e); }
    }
    return this.memDb.vehicles;
  }

  async getVehicleById(id: string): Promise<Vehicle | undefined> {
    if (this.isMongoConnected) {
      try {
        const doc = await VehicleModel.findOne({ id }).lean();
        return doc ? (doc as unknown as Vehicle) : undefined;
      } catch (e) { console.error(e); }
    }
    return this.memDb.vehicles.find(v => v.id === id);
  }

  async saveVehicle(vehicle: Vehicle): Promise<Vehicle> {
    const idx = this.memDb.vehicles.findIndex(v => v.id === vehicle.id);
    if (idx >= 0) this.memDb.vehicles[idx] = vehicle;
    else this.memDb.vehicles.unshift(vehicle);
    if (this.isMongoConnected) {
      try { await VehicleModel.findOneAndUpdate({ id: vehicle.id }, vehicle, { upsert: true, new: true }); } catch (e) { console.error(e); }
    }
    return vehicle;
  }

  // ── Trips (Tasks) ────────────────────────────────────────────────────────────

  private tripsCol() { return mongoose.connection.db!.collection('trips'); }

  async getTrips(): Promise<Trip[]> {
    if (this.isMongoConnected) {
      try {
        const docs = await this.tripsCol().find({}).sort({ lastUpdated: -1 }).toArray();
        return docs as unknown as Trip[];
      } catch (e) { console.error('[DB] getTrips error', e); }
    }
    return this.memDb.trips;
  }

  async getTripById(id: string): Promise<Trip | undefined> {
    if (this.isMongoConnected) {
      try {
        const doc = await this.tripsCol().findOne({ id });
        return doc ? (doc as unknown as Trip) : undefined;
      } catch (e) { console.error('[DB] getTripById error', e); }
    }
    return this.memDb.trips.find(t => t.id === id);
  }

  async getTripsByDriver(driverId: string, dateIso?: string): Promise<Trip[]> {
    if (this.isMongoConnected) {
      try {
        const q: any = { $or: [{ driverId }, { coPassengerId: driverId }] };
        if (dateIso) {
          q.lastUpdated = { $gte: dateIso + 'T00:00:00.000Z', $lte: dateIso + 'T23:59:59.999Z' };
        }
        const docs = await this.tripsCol().find(q).sort({ lastUpdated: -1 }).toArray();
        return docs as unknown as Trip[];
      } catch (e) { console.error('[DB] getTripsByDriver error', e); }
    }
    let trips = this.memDb.trips.filter(t => t.driverId === driverId || t.coPassengerId === driverId);
    if (dateIso) trips = trips.filter(t => t.lastUpdated.startsWith(dateIso));
    return trips.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
  }

  async getDriverActiveTrip(driverId: string): Promise<Trip | undefined> {
    if (this.isMongoConnected) {
      try {
        const doc = await this.tripsCol().findOne({
          $or: [{ driverId }, { coPassengerId: driverId }],
          status: { $in: ['In Progress', 'Saved Draft'] },
        });
        return doc ? (doc as unknown as Trip) : undefined;
      } catch (e) { console.error('[DB] getDriverActiveTrip error', e); }
    }
    return this.memDb.trips.find(t =>
      (t.driverId === driverId || t.coPassengerId === driverId) &&
      (t.status === 'In Progress' || t.status === 'Saved Draft')
    );
  }

  async saveTrip(trip: Trip): Promise<Trip> {
    const idx = this.memDb.trips.findIndex(t => t.id === trip.id);
    if (idx >= 0) this.memDb.trips[idx] = trip;
    else this.memDb.trips.unshift(trip);
    if (this.isMongoConnected) {
      try {
        const { _id, __v, ...clean } = trip as any;
        const result = await this.tripsCol().updateOne({ id: trip.id }, { $set: clean }, { upsert: true });
        console.log(`[DB] saveTrip id=${trip.id} matched=${result.matchedCount} modified=${result.modifiedCount} upserted=${result.upsertedCount} hasPkgDataUrl=${!!(clean.packagePhoto?.dataUrl)}`);
      } catch (e) { console.error('[DB] saveTrip error', e); }
    }
    return trip;
  }

  // ── WorkDays ─────────────────────────────────────────────────────────────────

  async getWorkDayByUserAndDate(userId: string, date: string): Promise<WorkDay | undefined> {
    if (this.isMongoConnected) {
      try {
        const doc = await WorkDayModel.findOne({ userId, date }).lean();
        return doc ? (doc as unknown as WorkDay) : undefined;
      } catch (e) { console.error(e); }
    }
    return this.memDb.workDays.find(w => w.userId === userId && w.date === date);
  }

  async getWorkDayById(id: string): Promise<WorkDay | undefined> {
    if (this.isMongoConnected) {
      try {
        const doc = await WorkDayModel.findOne({ id }).lean();
        return doc ? (doc as unknown as WorkDay) : undefined;
      } catch (e) { console.error(e); }
    }
    return this.memDb.workDays.find(w => w.id === id);
  }

  async getWorkDays(fromDate?: string): Promise<WorkDay[]> {
    if (this.isMongoConnected) {
      try {
        const q: any = fromDate ? { date: { $gte: fromDate } } : {};
        return (await WorkDayModel.find(q).sort({ date: -1 }).lean()) as unknown as WorkDay[];
      } catch (e) { console.error('[DB] getWorkDays error', e); }
    }
    const wds = fromDate ? this.memDb.workDays.filter(w => w.date >= fromDate) : this.memDb.workDays;
    return wds.sort((a, b) => b.date.localeCompare(a.date));
  }

  async getWorkDayHistory(userId: string, limit = 30): Promise<WorkDay[]> {
    if (this.isMongoConnected) {
      try { return (await WorkDayModel.find({ userId }).sort({ date: -1 }).limit(limit).lean()) as unknown as WorkDay[]; } catch (e) { console.error(e); }
    }
    return this.memDb.workDays
      .filter(w => w.userId === userId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit);
  }

  async saveWorkDay(workDay: WorkDay): Promise<WorkDay> {
    const idx = this.memDb.workDays.findIndex(w => w.id === workDay.id);
    if (idx >= 0) this.memDb.workDays[idx] = workDay;
    else this.memDb.workDays.unshift(workDay);
    if (this.isMongoConnected) {
      try { await WorkDayModel.findOneAndUpdate({ id: workDay.id }, workDay, { upsert: true, new: true }); } catch (e) { console.error('[DB] saveWorkDay error', e); }
    }
    return workDay;
  }

  async getTripsByEmployee(driverId: string, date?: string): Promise<Trip[]> {
    return this.getTripsByDriver(driverId, date);
  }

  async forceReseedMongoDB() { return this.clearAllData(); }

  async logActivity(userId: string, userName: string, action: string) {
    const log: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      userName,
      action,
      timestamp: new Date().toISOString(),
    };
    if (this.isMongoConnected) {
      try { await ActivityLogModel.create(log); } catch (e) { console.error('[DB] logActivity error', e); }
    } else {
      this.memDb.activityLogs.unshift(log);
      if (this.memDb.activityLogs.length > 500) this.memDb.activityLogs.pop();
    }
  }

  async getActivityLogs(limit = 100): Promise<ActivityLog[]> {
    if (this.isMongoConnected) {
      try {
        const docs = await ActivityLogModel.find().sort({ timestamp: -1 }).limit(limit).lean();
        return docs as unknown as ActivityLog[];
      } catch (e) { console.error('[DB] getActivityLogs error', e); }
    }
    return this.memDb.activityLogs.slice(0, limit);
  }

  async getActivityLogsByUser(userId: string, username?: string, fullName?: string): Promise<ActivityLog[]> {
    if (this.isMongoConnected) {
      try {
        const orClauses: any[] = [{ userId }];
        if (username) orClauses.push({ userName: { $regex: username, $options: 'i' } });
        if (fullName && fullName !== username) orClauses.push({ userName: { $regex: fullName, $options: 'i' } });
        const docs = await ActivityLogModel.find({ $or: orClauses } as any).sort({ timestamp: -1 }).limit(200).lean();
        return docs as unknown as ActivityLog[];
      } catch (e) { console.error('[DB] getActivityLogsByUser error', e); }
    }
    return this.memDb.activityLogs.filter(
      l => l.userId === userId ||
        (username && l.userName.toLowerCase().includes(username.toLowerCase())) ||
        (fullName && l.userName.toLowerCase().includes(fullName.toLowerCase()))
    );
  }

  async getLocationLogsForDriver(_driverId: string, _date?: string) { return []; }
}

export default new Database();
