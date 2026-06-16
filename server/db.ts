import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { Vehicle, Driver, Trip, User, ActivityLog, LocationLog, WorkDay } from '../src/types';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

const bootstrapAdmin: User = {
  id: 'admin',
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PIN || '1234',
  role: 'admin',
  fullName: process.env.ADMIN_NAME || 'Panchathan Admin'
};

const initialData = {
  users: [bootstrapAdmin] as User[],
  vehicles: [] as Vehicle[],
  drivers: [] as Driver[],
  trips: [] as Trip[],
  workDays: [] as WorkDay[],
  activityLogs: [] as ActivityLog[],
  locationLogs: [] as LocationLog[]
};

// ----------------------------------------
// Mongoose Schema Definitions
// ----------------------------------------

const UserSchema = new mongoose.Schema<User>({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String },
  role: { type: String, required: true, enum: ['admin', 'driver'] },
  fullName: { type: String, required: true },
  driverId: { type: String },
  enabled: { type: Boolean, default: true },
  allowedFeatures: { type: [String], default: [] }
}, { timestamps: true });

const UserModel = (mongoose.models.User || mongoose.model<User>('User', UserSchema)) as mongoose.Model<User>;

const DocumentStatusSchema = new mongoose.Schema({
  file: { type: String },
  status: { type: String, required: true, enum: ['PENDING', 'UPLOADED'] },
  updatedAt: { type: String }
}, { _id: false });

const VehicleSchema = new mongoose.Schema<Vehicle>({
  id: { type: String, required: true, unique: true },
  plate: { type: String, required: true },
  vehicleType: { type: String, enum: ['Truck', 'Bike', 'Van', 'Auto', 'Other'], default: 'Truck' },
  model: { type: String, required: true },
  make: { type: String, required: true },
  manufacturer: { type: String, required: true },
  modelVariant: { type: String, required: true },
  year: { type: Number, required: true },
  payloadCapacity: { type: Number, required: true },
  engineNumber: { type: String },
  chassisNumber: { type: String },
  homeBase: { type: String, required: true },
  serviceArea: { type: String, required: true },
  status: { type: String, required: true, enum: ['On Route', 'Idle', 'Maintenance'] },
  nextService: { type: String, required: true },
  odometerKm: { type: Number },
  serviceDueKm: { type: Number },
  lastServiceDate: { type: String },
  insuranceExpiry: { type: String },
  fitnessExpiry: { type: String },
  permitExpiry: { type: String },
  completeness: { type: Number, required: true },
  documents: {
    registrationCertificate: { type: DocumentStatusSchema, required: true },
    commercialInsurance: { type: DocumentStatusSchema, required: true },
    fitnessCertificate: { type: DocumentStatusSchema, required: true },
    nationalPermit: { type: DocumentStatusSchema, required: true }
  },
  assignedDriverId: { type: String },
  assignedRouteId: { type: String }
}, { timestamps: true });

const VehicleModel = (mongoose.models.Vehicle || mongoose.model<Vehicle>('Vehicle', VehicleSchema)) as mongoose.Model<Vehicle>;

const DriverSchema = new mongoose.Schema<Driver>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String },
  emergencyContact: { type: String },
  address: { type: String },
  employeeCode: { type: String },
  rating: { type: Number, required: true },
  licenseNumber: { type: String, required: true },
  experienceYears: { type: Number, required: true },
  region: { type: String, required: true },
  totalTrips: { type: Number, required: true },
  onTimeRate: { type: Number, required: true },
  fuelEfficiency: { type: Number, required: true },
  trend: { type: String, required: true, enum: ['up', 'down', 'stable'] },
  status: { type: String, required: true, enum: ['Available', 'Active', 'On Leave'] },
  avatar: { type: String }
}, { timestamps: true });

const DriverModel = (mongoose.models.Driver || mongoose.model<Driver>('Driver', DriverSchema)) as mongoose.Model<Driver>;

const ManifestItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  quantity: { type: String, required: true },
  status: { type: String, required: true, enum: ['LOADED', 'IDLE', 'PENDING'] }
}, { _id: false });

const ProofPhotoSchema = new mongoose.Schema({
  kind: { type: String, enum: ['PICKUP', 'DELIVERY', 'PICKUP_REF', 'DELIVERY_REF', 'PACKAGE_REF'], required: true },
  fileName: { type: String, required: true },
  uploadedBy: { type: String },
  dataUrl: { type: String },
  filePath: { type: String },
  uploadedAt: { type: String, required: true },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String }
  }
}, { _id: false });

const TripSchema = new mongoose.Schema<Trip>({
  id: { type: String, required: true, unique: true },
  truckId: { type: String, required: true },
  driverId: { type: String, required: true },
  coPassengerId: { type: String },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  status: { type: String, required: true, enum: ['Saved Draft', 'In Progress', 'Completed', 'Emergency', 'Incomplete'] },
  priority: { type: String, required: true, enum: ['High', 'Medium', 'Low'] },
  taskType: { type: String, enum: ['PICKUP', 'DELIVERY'] },
  manifest: { type: [ManifestItemSchema], default: [] },
  taskStage: { type: String, enum: ['Upcoming', 'Ongoing', 'Completed', 'Incomplete'] },
  podNumber: { type: String },
  courierName: { type: String },
  packagePhoto: { type: ProofPhotoSchema },
  porter: {
    enabled: { type: Boolean, default: false },
    bookingId: { type: String },
    trackingNumber: { type: String },
    contactNumber: { type: String },
    porterTaskType: { type: String, enum: ['collect', 'send'] }
  },
  pickupNotes: { type: String },
  deliveryNotes: { type: String },
  proofPhotos: { type: [ProofPhotoSchema], default: [] },
  telematics: {
    speed: { type: Number, default: 0 },
    fuelLevel: { type: Number, default: 100 },
    engineTemp: { type: Number, default: 0 },
    tirePressure: {
      frontLeft: { type: Number, default: 32 },
      frontRight: { type: Number, default: 32 },
      rearLeft: { type: Number, default: 32 },
      rearRight: { type: Number, default: 32 },
      warning: { type: String }
    },
    location: {
      latitude: { type: Number, default: 0 },
      longitude: { type: Number, default: 0 },
      address: { type: String, default: '' }
    }
  },
  lastUpdated: { type: String, required: true },
  selectedVehicleType: { type: String, enum: ['bike', 'truck', 'auto', 'van', 'other'] },
  selectedVehicleRole: { type: String, enum: ['driver', 'co-passenger'] },
  selectedVehicleId: { type: String },
  remark: { type: String },
  remarkAddedAt: { type: String }
}, { timestamps: true });

const TripModel = (mongoose.models.Trip || mongoose.model<Trip>('Trip', TripSchema)) as mongoose.Model<Trip>;

const GeoLocationSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  address: { type: String, required: true }
}, { _id: false });

const WorkDaySchema = new mongoose.Schema<WorkDay>({
  id: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true },
  userId: { type: String, required: true },
  date: { type: String, required: true },
  transportMode: { type: String, required: true, enum: ['bike', 'auto', 'van', 'truck', 'other'] },
  vehicleId: { type: String },
  role: { type: String, enum: ['driver', 'co-passenger'] },
  partnerId: { type: String },
  startTime: { type: String, required: true },
  startLocation: { type: GeoLocationSchema, required: true },
  endTime: { type: String },
  endLocation: { type: GeoLocationSchema },
  plannedTripIds: { type: [String], default: [] },
  eodSubmitted: { type: Boolean, default: false },
  eodPhotos: { type: [ProofPhotoSchema], default: [] },
  eodNotes: { type: String },
  createdAt: { type: String, required: true }
}, { timestamps: true });

const WorkDayModel = (mongoose.models.WorkDay || mongoose.model<WorkDay>('WorkDay', WorkDaySchema)) as mongoose.Model<WorkDay>;

const LocationLogSchema = new mongoose.Schema<LocationLog>({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  driverId: { type: String },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  address: { type: String },
  timestamp: { type: String, required: true },
  isOfficeTime: { type: Boolean },
  note: { type: String }
}, { timestamps: true });

const LocationLogModel = (mongoose.models.LocationLog || mongoose.model<LocationLog>('LocationLog', LocationLogSchema)) as mongoose.Model<LocationLog>;

const ActivityLogSchema = new mongoose.Schema<ActivityLog>({
  id: { type: String, required: true, unique: true },
  timestamp: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  action: { type: String, required: true }
}, { timestamps: true });

const ActivityLogModel = (mongoose.models.ActivityLog || mongoose.model<ActivityLog>('ActivityLog', ActivityLogSchema)) as mongoose.Model<ActivityLog>;

// ----------------------------------------
// Database class
// ----------------------------------------

class Database {
  private memoryDb = { ...initialData };
  private isMongoConnected = false;
  private mongoError: string | null = null;
  private seedStatus = {
    users: { status: 'pending', count: 0, error: null as string | null },
    vehicles: { status: 'pending', count: 0, error: null as string | null },
    drivers: { status: 'pending', count: 0, error: null as string | null },
    trips: { status: 'pending', count: 0, error: null as string | null },
    activityLogs: { status: 'pending', count: 0, error: null as string | null }
  };

  constructor() {
    this.init();
  }

  isMongoDbConnected() { return this.isMongoConnected; }
  getMongoError() { return this.mongoError; }

  getSeedStatus() {
    if (!this.isMongoConnected) {
      return {
        users: { status: 'offline_local', count: this.memoryDb.users.length, error: null },
        vehicles: { status: 'offline_local', count: this.memoryDb.vehicles.length, error: null },
        drivers: { status: 'offline_local', count: this.memoryDb.drivers.length, error: null },
        trips: { status: 'offline_local', count: this.memoryDb.trips.length, error: null },
        activityLogs: { status: 'offline_local', count: this.memoryDb.activityLogs.length, error: null }
      };
    }
    return this.seedStatus;
  }

  async clearAllData() {
    const defaultAdmins: User[] = [bootstrapAdmin];
    this.memoryDb.vehicles = [];
    this.memoryDb.drivers = [];
    this.memoryDb.trips = [];
    this.memoryDb.workDays = [];
    this.memoryDb.activityLogs = [];
    this.memoryDb.users = defaultAdmins;
    this.saveLocal();

    this.seedStatus = {
      users: { status: 'seeded', count: defaultAdmins.length, error: null },
      vehicles: { status: 'cleared', count: 0, error: null },
      drivers: { status: 'cleared', count: 0, error: null },
      trips: { status: 'cleared', count: 0, error: null },
      activityLogs: { status: 'cleared', count: 0, error: null }
    };

    if (this.isMongoConnected) {
      try {
        await VehicleModel.deleteMany({});
        await DriverModel.deleteMany({});
        await TripModel.deleteMany({});
        await WorkDayModel.deleteMany({});
        await ActivityLogModel.deleteMany({});
        await UserModel.deleteMany({});
        await UserModel.insertMany(defaultAdmins);
      } catch (err: any) {
        console.error('[DB] Failed clearing MongoDB:', err);
        throw err;
      }
    }
  }

  async forceReseedMongoDB() {
    if (!this.isMongoConnected) throw new Error('No active MongoDB connection.');
    await UserModel.deleteMany({});
    await VehicleModel.deleteMany({});
    await DriverModel.deleteMany({});
    await TripModel.deleteMany({});
    await WorkDayModel.deleteMany({});
    await ActivityLogModel.deleteMany({});
    this.seedStatus = {
      users: { status: 'pending', count: 0, error: null },
      vehicles: { status: 'pending', count: 0, error: null },
      drivers: { status: 'pending', count: 0, error: null },
      trips: { status: 'pending', count: 0, error: null },
      activityLogs: { status: 'pending', count: 0, error: null }
    };
    await this.seedDatabase();
  }

  private async init() {
    if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // migrate passwordPin → password for local JSON store
        if (parsed.users) {
          parsed.users = parsed.users.map((u: any) => {
            if (u.passwordPin && !u.password) {
              u.password = u.passwordPin;
              delete u.passwordPin;
            }
            return u;
          });
        }
        this.memoryDb = { ...initialData, ...parsed };
        if (!this.memoryDb.workDays) this.memoryDb.workDays = [];
      } catch (err) {
        console.error('[DB] Failed to parse local DB file, using defaults', err);
      }
    } else {
      this.saveLocal();
    }

    let uri = process.env.MONGODB_URI;
    if (uri && uri.includes('/panchathan')) uri = uri.replace('/panchathan', '/Panchathan');

    if (uri) {
      const masked = uri.replace(/\/\/([^:]+):([^@]+)@/, (_m, u) => `//${u}:[REDACTED]@`);
      console.log(`[DB] Connecting to MongoDB: ${masked}`);
      try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000, connectTimeoutMS: 15000 });
        this.isMongoConnected = true;
        this.mongoError = null;
        console.log('[DB] MongoDB connected.');
        await this.seedDatabase();
      } catch (err: any) {
        this.mongoError = err.message || String(err);
        console.error('[DB] MongoDB connection failed, using local store.', err);
      }
    } else {
      console.log('[DB] No MONGODB_URI set. Using local flat-file storage.');
    }
  }

  private async seedDatabase() {
    type SeedKey = 'users' | 'vehicles' | 'drivers' | 'trips' | 'activityLogs';
    const collections: Array<{ name: SeedKey; model: mongoose.Model<any>; data: any[] }> = [
      { name: 'users', model: UserModel, data: initialData.users },
      { name: 'vehicles', model: VehicleModel, data: initialData.vehicles },
      { name: 'drivers', model: DriverModel, data: initialData.drivers },
      { name: 'trips', model: TripModel, data: initialData.trips },
      { name: 'activityLogs', model: ActivityLogModel, data: initialData.activityLogs }
    ];

    for (const col of collections) {
      try {
        const count = await col.model.countDocuments();
        this.seedStatus[col.name].count = count;
        if (count === 0 && col.data.length > 0) {
          await col.model.insertMany(col.data);
          this.seedStatus[col.name].status = 'seeded';
          this.seedStatus[col.name].count = col.data.length;
        } else {
          this.seedStatus[col.name].status = 'already_populated';
        }
      } catch (err: any) {
        this.seedStatus[col.name].status = 'failed';
        this.seedStatus[col.name].error = err.message || String(err);
        console.error(`[DB] Failed seeding ${col.name}:`, err);
      }
    }
  }

  private saveLocal() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.memoryDb, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Error writing local DB file', err);
    }
  }

  // ---- Users ----

  async getUsers(): Promise<User[]> {
    if (this.isMongoConnected) {
      try { return (await UserModel.find({}).lean()) as unknown as User[]; } catch (e) { console.error(e); }
    }
    return this.memoryDb.users;
  }

  async findUserByUsername(username: string): Promise<User | undefined> {
    if (this.isMongoConnected) {
      try {
        const doc = await UserModel.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } }).lean();
        return doc ? (doc as unknown as User) : undefined;
      } catch (e) { console.error(e); }
    }
    return this.memoryDb.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  async findUserById(id: string): Promise<User | undefined> {
    if (this.isMongoConnected) {
      try {
        const doc = await UserModel.findOne({ id }).lean();
        return doc ? (doc as unknown as User) : undefined;
      } catch (e) { console.error(e); }
    }
    return this.memoryDb.users.find(u => u.id === id);
  }

  async createUser(user: Omit<User, 'id'>): Promise<User> {
    const newUser: User = { ...user, id: 'u-' + Math.random().toString(36).substr(2, 9) };
    this.memoryDb.users.push(newUser);
    this.saveLocal();
    if (this.isMongoConnected) {
      try { await UserModel.create(newUser); } catch (e) { console.error('[DB] createUser MongoDB error', e); }
    }
    return newUser;
  }

  async updateUser(username: string, updates: Partial<User>): Promise<User | undefined> {
    const idx = this.memoryDb.users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
    if (idx >= 0) {
      this.memoryDb.users[idx] = { ...this.memoryDb.users[idx], ...updates } as User;
      this.saveLocal();
    }
    if (this.isMongoConnected) {
      try {
        await UserModel.findOneAndUpdate({ username: { $regex: new RegExp(`^${username}$`, 'i') } }, updates, { new: true });
      } catch (e) { console.error('[DB] updateUser MongoDB error', e); }
    }
    return this.memoryDb.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  async deleteUser(username: string): Promise<boolean> {
    const before = this.memoryDb.users.length;
    this.memoryDb.users = this.memoryDb.users.filter(u => u.username.toLowerCase() !== username.toLowerCase());
    this.saveLocal();
    if (this.isMongoConnected) {
      try { await UserModel.deleteOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } }); } catch (e) { console.error('[DB] deleteUser MongoDB error', e); }
    }
    return this.memoryDb.users.length < before;
  }

  // ---- Vehicles ----

  async getVehicles(): Promise<Vehicle[]> {
    if (this.isMongoConnected) {
      try { return (await VehicleModel.find({}).lean()) as unknown as Vehicle[]; } catch (e) { console.error(e); }
    }
    return this.memoryDb.vehicles;
  }

  async getVehicleById(id: string): Promise<Vehicle | undefined> {
    if (this.isMongoConnected) {
      try {
        const doc = await VehicleModel.findOne({ id }).lean();
        return doc ? (doc as unknown as Vehicle) : undefined;
      } catch (e) { console.error(e); }
    }
    return this.memoryDb.vehicles.find(v => v.id === id);
  }

  async saveVehicle(vehicle: Vehicle): Promise<Vehicle> {
    const idx = this.memoryDb.vehicles.findIndex(v => v.id === vehicle.id);
    if (idx >= 0) this.memoryDb.vehicles[idx] = vehicle;
    else this.memoryDb.vehicles.unshift(vehicle);
    this.saveLocal();
    if (this.isMongoConnected) {
      try { await VehicleModel.findOneAndUpdate({ id: vehicle.id }, vehicle, { upsert: true, new: true }); } catch (e) { console.error('[DB] saveVehicle MongoDB error', e); }
    }
    return vehicle;
  }

  // ---- Drivers ----

  async getDrivers(): Promise<Driver[]> {
    if (this.isMongoConnected) {
      try { return (await DriverModel.find({}).lean()) as unknown as Driver[]; } catch (e) { console.error(e); }
    }
    return this.memoryDb.drivers;
  }

  async getDriverById(id: string): Promise<Driver | undefined> {
    if (this.isMongoConnected) {
      try {
        const doc = await DriverModel.findOne({ id }).lean();
        return doc ? (doc as unknown as Driver) : undefined;
      } catch (e) { console.error(e); }
    }
    return this.memoryDb.drivers.find(d => d.id === id);
  }

  async saveDriver(driver: Driver): Promise<Driver> {
    const idx = this.memoryDb.drivers.findIndex(d => d.id === driver.id);
    if (idx >= 0) this.memoryDb.drivers[idx] = driver;
    else this.memoryDb.drivers.unshift(driver);
    this.saveLocal();
    if (this.isMongoConnected) {
      try { await DriverModel.findOneAndUpdate({ id: driver.id }, driver, { upsert: true, new: true }); } catch (e) { console.error('[DB] saveDriver MongoDB error', e); }
    }
    return driver;
  }

  async deleteDriver(id: string): Promise<boolean> {
    const before = this.memoryDb.drivers.length;
    this.memoryDb.drivers = this.memoryDb.drivers.filter(d => d.id !== id);
    this.saveLocal();
    if (this.isMongoConnected) {
      try { await DriverModel.deleteOne({ id }); } catch (e) { console.error('[DB] deleteDriver MongoDB error', e); }
    }
    return this.memoryDb.drivers.length < before;
  }

  // ---- Trips ----

  async getTrips(): Promise<Trip[]> {
    if (this.isMongoConnected) {
      try { return (await TripModel.find({}).lean()) as unknown as Trip[]; } catch (e) { console.error(e); }
    }
    return this.memoryDb.trips;
  }

  async getTripById(id: string): Promise<Trip | undefined> {
    if (this.isMongoConnected) {
      try {
        const doc = await TripModel.findOne({ id }).lean();
        return doc ? (doc as unknown as Trip) : undefined;
      } catch (e) { console.error(e); }
    }
    return this.memoryDb.trips.find(t => t.id === id);
  }

  async getTripsByDriver(driverId: string, dateIso?: string): Promise<Trip[]> {
    if (this.isMongoConnected) {
      try {
        const query: any = { $or: [{ driverId }, { coPassengerId: driverId }] };
        if (dateIso) {
          const start = new Date(dateIso + 'T00:00:00.000Z');
          const end = new Date(dateIso + 'T23:59:59.999Z');
          query.lastUpdated = { $gte: start.toISOString(), $lte: end.toISOString() };
        }
        return (await TripModel.find(query).sort({ lastUpdated: -1 }).lean()) as unknown as Trip[];
      } catch (e) { console.error(e); }
    }
    let trips = this.memoryDb.trips.filter(t => t.driverId === driverId || t.coPassengerId === driverId);
    if (dateIso) {
      const start = new Date(dateIso + 'T00:00:00.000Z');
      const end = new Date(dateIso + 'T23:59:59.999Z');
      trips = trips.filter(t => { const tt = new Date(t.lastUpdated); return tt >= start && tt <= end; });
    }
    return trips.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }

  async getDriverActiveTrip(driverId: string): Promise<Trip | undefined> {
    if (this.isMongoConnected) {
      try {
        const q = { $or: [{ driverId }, { coPassengerId: driverId }] };
        const inProgress = await TripModel.findOne({ ...q, status: 'In Progress' }).lean();
        if (inProgress) return inProgress as unknown as Trip;
        const draft = await TripModel.findOne({ ...q, status: 'Saved Draft' }).sort({ lastUpdated: -1 }).lean();
        return draft ? (draft as unknown as Trip) : undefined;
      } catch (e) { console.error(e); }
    }
    const inProgress = this.memoryDb.trips.find(t => (t.driverId === driverId || t.coPassengerId === driverId) && t.status === 'In Progress');
    if (inProgress) return inProgress;
    return this.memoryDb.trips.find(t => (t.driverId === driverId || t.coPassengerId === driverId) && t.status === 'Saved Draft');
  }

  async getTripsByEmployee(employeeId: string): Promise<Trip[]> {
    if (this.isMongoConnected) {
      try {
        return (await TripModel.find({ $or: [{ driverId: employeeId }, { coPassengerId: employeeId }] }).sort({ lastUpdated: -1 }).lean()) as unknown as Trip[];
      } catch (e) { console.error(e); }
    }
    return this.memoryDb.trips
      .filter(t => t.driverId === employeeId || t.coPassengerId === employeeId)
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }

  async saveTrip(trip: Trip): Promise<Trip> {
    const idx = this.memoryDb.trips.findIndex(t => t.id === trip.id);
    if (idx >= 0) this.memoryDb.trips[idx] = trip;
    else this.memoryDb.trips.unshift(trip);
    this.saveLocal();
    if (this.isMongoConnected) {
      try { await TripModel.findOneAndUpdate({ id: trip.id }, trip, { upsert: true, new: true }); } catch (e) { console.error('[DB] saveTrip MongoDB error', e); }
    }
    return trip;
  }

  // ---- WorkDays ----

  async getWorkDayByUserAndDate(userId: string, date: string): Promise<WorkDay | undefined> {
    if (this.isMongoConnected) {
      try {
        const doc = await WorkDayModel.findOne({ userId, date }).lean();
        return doc ? (doc as unknown as WorkDay) : undefined;
      } catch (e) { console.error(e); }
    }
    return this.memoryDb.workDays.find(w => w.userId === userId && w.date === date);
  }

  async getWorkDayById(id: string): Promise<WorkDay | undefined> {
    if (this.isMongoConnected) {
      try {
        const doc = await WorkDayModel.findOne({ id }).lean();
        return doc ? (doc as unknown as WorkDay) : undefined;
      } catch (e) { console.error(e); }
    }
    return this.memoryDb.workDays.find(w => w.id === id);
  }

  async getWorkDayHistory(userId: string, limit = 30): Promise<WorkDay[]> {
    if (this.isMongoConnected) {
      try {
        return (await WorkDayModel.find({ userId }).sort({ date: -1 }).limit(limit).lean()) as unknown as WorkDay[];
      } catch (e) { console.error(e); }
    }
    return this.memoryDb.workDays
      .filter(w => w.userId === userId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit);
  }

  async saveWorkDay(workDay: WorkDay): Promise<WorkDay> {
    const idx = this.memoryDb.workDays.findIndex(w => w.id === workDay.id);
    if (idx >= 0) this.memoryDb.workDays[idx] = workDay;
    else this.memoryDb.workDays.unshift(workDay);
    this.saveLocal();
    if (this.isMongoConnected) {
      try { await WorkDayModel.findOneAndUpdate({ id: workDay.id }, workDay, { upsert: true, new: true }); } catch (e) { console.error('[DB] saveWorkDay MongoDB error', e); }
    }
    return workDay;
  }

  // ---- Location Logs ----

  async saveLocationLog(log: Omit<LocationLog, 'id'>): Promise<LocationLog> {
    const newLog: LocationLog = { ...log, id: 'loc-' + Math.random().toString(36).substr(2, 9) };
    this.memoryDb.locationLogs.unshift(newLog);
    if (this.memoryDb.locationLogs.length > 1000) this.memoryDb.locationLogs.pop();
    this.saveLocal();
    if (this.isMongoConnected) {
      try { await LocationLogModel.create(newLog); } catch (e) { console.error('[DB] saveLocationLog MongoDB error', e); }
    }
    return newLog;
  }

  async getLocationLogsForDriver(driverId: string, dateIso?: string): Promise<LocationLog[]> {
    if (this.isMongoConnected) {
      try {
        const query: any = { driverId };
        if (dateIso) {
          const start = new Date(dateIso + 'T00:00:00.000Z');
          const end = new Date(dateIso + 'T23:59:59.999Z');
          query.timestamp = { $gte: start.toISOString(), $lte: end.toISOString() };
        }
        return (await LocationLogModel.find(query).sort({ timestamp: 1 }).lean()) as unknown as LocationLog[];
      } catch (e) { console.error(e); }
    }
    let logs = this.memoryDb.locationLogs.filter(l => l.driverId === driverId);
    if (dateIso) {
      const start = new Date(dateIso + 'T00:00:00.000Z');
      const end = new Date(dateIso + 'T23:59:59.999Z');
      logs = logs.filter(l => { const t = new Date(l.timestamp); return t >= start && t <= end; });
    }
    return logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  // ---- Activity Logs ----

  async getActivityLogs(limit = 100): Promise<ActivityLog[]> {
    if (this.isMongoConnected) {
      try { return (await ActivityLogModel.find({}).sort({ timestamp: -1 }).limit(limit).lean()) as unknown as ActivityLog[]; } catch (e) { console.error(e); }
    }
    return this.memoryDb.activityLogs.slice(0, limit);
  }

  async getActivityLogsByUser(userId: string, username?: string, limit = 50): Promise<ActivityLog[]> {
    if (this.isMongoConnected) {
      try {
        const query = username
          ? { $or: [{ userId }, { userId: username }, { userName: username }] }
          : { userId };
        return (await ActivityLogModel.find(query).sort({ timestamp: -1 }).limit(limit).lean()) as unknown as ActivityLog[];
      } catch (e) { console.error(e); }
    }
    return this.memoryDb.activityLogs
      .filter(l => l.userId === userId || (username && (l.userId === username || l.userName === username)))
      .slice(0, limit);
  }

  async logActivity(userId: string, userName: string, action: string): Promise<ActivityLog> {
    const log: ActivityLog = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      userId,
      userName,
      action
    };
    this.memoryDb.activityLogs.unshift(log);
    if (this.memoryDb.activityLogs.length > 500) this.memoryDb.activityLogs.pop();
    this.saveLocal();
    if (this.isMongoConnected) {
      try { await ActivityLogModel.create(log); } catch (e) { console.error('[DB] logActivity MongoDB error', e); }
    }
    return log;
  }
}

export const dbInstance = new Database();
export default dbInstance;
