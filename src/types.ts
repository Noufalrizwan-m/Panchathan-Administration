// ─── User (admin + employee, merged — no separate Driver collection) ───────────

export interface User {
  id: string;
  username: string;
  password?: string;
  role: 'admin' | 'driver';  // 'driver' = employee role
  fullName: string;
  enabled?: boolean;
  driverId?: string;  // for employees: equals id (backward compat)

  // Employee profile fields (role='driver')
  phone?: string;
  emergencyContact?: string;
  address?: string;
  city?: string;
  state?: string;
  employeeCode?: string;
  licenseNumber?: string;
  designation?: string;   // job title set by admin — e.g. "Executive", "Delivery Associate"
  shiftStart?: string;    // HH:MM — e.g. "09:30" — set by admin per employee
  shiftEnd?: string;      // HH:MM — e.g. "19:00"
  status?: 'Available' | 'Active' | 'On Leave';
  rating?: number;
  totalTrips?: number;
  onTimeRate?: number;
  avatar?: string;
}

// Backward-compat alias — all frontend code using Driver still works
export type Driver = User;

// ─── Vehicle ─────────────────────────────────────────────────────────────────

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
}

// ─── Task (was "Trip") ────────────────────────────────────────────────────────

export interface PorterDetails {
  enabled: boolean;
  bookingId?: string;
  trackingNumber?: string;
  contactNumber?: string;
  porterTaskType?: 'collect' | 'send';
}

export interface TripProofPhoto {
  kind: 'PACKAGE_REF' | 'PICKUP' | 'DELIVERY';
  fileName: string;
  uploadedBy?: 'admin' | 'driver';
  filePath?: string;
  dataUrl?: string;
  uploadedAt: string;
  location?: { latitude: number; longitude: number; address: string };
}

export interface Trip {
  id: string;
  driverId: string;      // = user.id of assigned employee
  coPassengerId?: string;
  origin: string;
  destination: string;
  status: 'Saved Draft' | 'In Progress' | 'Completed' | 'Incomplete';
  priority: 'High' | 'Medium' | 'Low';
  taskType?: 'PICKUP' | 'DELIVERY' | 'BOTH';
  taskStage?: 'Upcoming' | 'Ongoing' | 'Completed' | 'Incomplete';

  customerName?: string;
  podNumber?: string;
  courierName?: string;
  packagePhoto?: TripProofPhoto;
  proofPhotos?: TripProofPhoto[];   // PICKUP + DELIVERY photos from employee

  porter?: PorterDetails;
  pickupNotes?: string;
  deliveryNotes?: string;
  remark?: string;
  remarkAddedAt?: string;

  lastUpdated: string;
}

// ─── Activity log (stub — kept for UI compatibility, no longer stored in DB) ──

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
}

// ─── WorkDay (daily check-in/out) ────────────────────────────────────────────

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export interface WorkDay {
  id: string;
  userId: string;
  date: string;           // YYYY-MM-DD
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
