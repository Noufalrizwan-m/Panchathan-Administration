export interface User {
  id: string;
  username: string;
  password?: string;
  role: 'admin' | 'driver';
  fullName: string;
  driverId?: string;
  enabled?: boolean;
  allowedFeatures?: string[];
}

export interface DocumentStatus {
  file?: string;
  status: 'PENDING' | 'UPLOADED';
  updatedAt?: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  vehicleType?: 'Truck' | 'Bike' | 'Van' | 'Auto' | 'Other';
  model: string;
  make: string;
  manufacturer: string;
  modelVariant: string;
  year: number;
  payloadCapacity: number;
  engineNumber?: string;
  chassisNumber?: string;
  homeBase: string;
  serviceArea: string;
  status: 'On Route' | 'Idle' | 'Maintenance';
  nextService: string;
  odometerKm?: number;
  serviceDueKm?: number;
  lastServiceDate?: string;
  insuranceExpiry?: string;
  fitnessExpiry?: string;
  permitExpiry?: string;
  completeness: number;
  documents: {
    registrationCertificate: DocumentStatus;
    commercialInsurance: DocumentStatus;
    fitnessCertificate: DocumentStatus;
    nationalPermit: DocumentStatus;
  };
  assignedDriverId?: string;
  assignedRouteId?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone?: string;
  emergencyContact?: string;
  address?: string;
  employeeCode?: string;
  rating: number;
  licenseNumber: string;
  experienceYears: number;
  region: string;
  totalTrips: number;
  onTimeRate: number;
  fuelEfficiency: number;
  trend: 'up' | 'down' | 'stable';
  status: 'Available' | 'Active' | 'On Leave';
  avatar?: string;
}

export interface ManifestItem {
  name: string;
  type: string;
  quantity: string;
  status: 'LOADED' | 'IDLE' | 'PENDING';
}

export interface TripProofPhoto {
  // PICKUP_REF = admin's parcel reference photo (uploaded at task creation)
  // DELIVERY_REF = admin's delivery reference image
  // PACKAGE_REF = admin's package photo (uploaded when creating the task)
  // PICKUP = employee's pickup confirmation photo
  // DELIVERY = employee's delivery POD photo
  kind: 'PICKUP_REF' | 'DELIVERY_REF' | 'PACKAGE_REF' | 'PICKUP' | 'DELIVERY';
  fileName: string;
  uploadedBy?: 'admin' | 'driver';
  dataUrl?: string;
  filePath?: string;
  uploadedAt: string;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface PorterDetails {
  enabled: boolean;
  bookingId?: string;
  trackingNumber?: string;
  contactNumber?: string;
  porterTaskType?: 'collect' | 'send';
}

export interface Telematics {
  speed: number;
  fuelLevel: number;
  engineTemp: number;
  tirePressure: {
    frontLeft: number;
    frontRight: number;
    rearLeft: number;
    rearRight: number;
    warning?: string;
  };
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface Trip {
  id: string;
  truckId: string;
  driverId: string;
  coPassengerId?: string;
  origin: string;
  destination: string;
  status: 'Saved Draft' | 'In Progress' | 'Completed' | 'Emergency' | 'Incomplete';
  priority: 'High' | 'Medium' | 'Low';
  taskType?: 'PICKUP' | 'DELIVERY' | 'BOTH';
  manifest: ManifestItem[];
  taskStage?: 'Upcoming' | 'Ongoing' | 'Completed' | 'Incomplete';
  // Admin-assigned task details
  customerName?: string;
  podNumber?: string;
  courierName?: string;
  packagePhoto?: TripProofPhoto;
  porter?: PorterDetails;
  pickupNotes?: string;
  deliveryNotes?: string;
  proofPhotos?: TripProofPhoto[];
  telematics: Telematics;
  lastUpdated: string;
  selectedVehicleType?: 'bike' | 'truck' | 'auto' | 'van' | 'other';
  selectedVehicleRole?: 'driver' | 'co-passenger';
  selectedVehicleId?: string;
  remark?: string;
  remarkAddedAt?: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export interface WorkDay {
  id: string;
  employeeId: string;
  userId: string;
  date: string;
  transportMode: 'bike' | 'auto' | 'van' | 'truck' | 'other';
  vehicleId?: string;
  role?: 'driver' | 'co-passenger';
  partnerId?: string;
  startTime: string;
  startLocation: GeoLocation;
  endTime?: string;
  endLocation?: GeoLocation;
  plannedTripIds: string[];
  eodSubmitted: boolean;
  eodPhotos?: TripProofPhoto[];
  eodNotes?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
}

export interface LocationLog {
  id: string;
  userId: string;
  driverId?: string;
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: string;
  isOfficeTime?: boolean;
  note?: string;
}
