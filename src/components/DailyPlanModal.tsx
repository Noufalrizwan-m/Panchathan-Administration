import React, { useState, useEffect } from 'react';
import { X, MapPin, Loader, Bike, Truck, Car, Navigation, CheckSquare, Square, User2, Users, CheckCircle, Package, Camera } from 'lucide-react';
import { Trip, Vehicle, Driver, WorkDay } from '../types';

interface DailyPlanModalProps {
  userId: string;
  employeeId: string;
  employeeName: string;
  assignedTrips: Trip[];
  vehicles: Vehicle[];
  drivers: Driver[];
  onSubmit: (workDay: WorkDay) => void;
  onClose: () => void;
}

type TransportMode = 'bike' | 'auto' | 'van' | 'truck' | 'porter' | 'other';

const TRANSPORT_OPTIONS: { mode: TransportMode; label: string; icon: React.ReactNode; bigIcon: React.ReactNode }[] = [
  { mode: 'bike',   label: 'Bike',   icon: <Bike size={22} />,        bigIcon: <Bike size={40} /> },
  { mode: 'truck',  label: 'Truck',  icon: <Truck size={22} />,       bigIcon: <Truck size={40} /> },
  { mode: 'van',    label: 'Van',    icon: <Car size={22} />,         bigIcon: <Car size={40} /> },
  { mode: 'auto',   label: 'Auto',   icon: <Navigation size={22} />,  bigIcon: <Navigation size={40} /> },
  { mode: 'porter', label: 'Porter', icon: <Package size={22} />,     bigIcon: <Package size={40} /> },
  { mode: 'other',  label: 'Other',  icon: <Car size={22} />,         bigIcon: <Car size={40} /> },
];

function getCurrentTimeISO(): string {
  return new Date().toISOString();
}

function formatTimeLocal(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function DailyPlanModal({ userId, employeeId, employeeName, assignedTrips, vehicles, drivers, onSubmit, onClose }: DailyPlanModalProps) {
  const [step, setStep] = useState(1);
  const [transport, setTransport] = useState<TransportMode | ''>('');
  const [role, setRole] = useState<'driver' | 'co-passenger' | ''>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [startTime] = useState(getCurrentTimeISO());
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  // Porter transport fields
  const [porterBookingId, setPorterBookingId] = useState('');
  const [porterVehicleNumber, setPorterVehicleNumber] = useState('');
  const [porterAmount, setPorterAmount] = useState('');
  const [porterVehiclePhoto, setPorterVehiclePhoto] = useState('');
  const [porterPhotoPreview, setPorterPhotoPreview] = useState('');

  const truckVehicles = vehicles.filter(v => v.vehicleType === 'Truck' && v.status !== 'Maintenance');
  const upcomingTrips = assignedTrips.filter(t => t.taskStage === 'Upcoming' || !t.taskStage);

  useEffect(() => {
    if (step === 3) detectLocation();
  }, [step]);

  function detectLocation() {
    setLocationLoading(true);
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by your browser.');
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let address = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          if (r.ok) {
            const data = await r.json();
            address = data.display_name || address;
          }
        } catch (_) { /* keep coords as fallback */ }
        setLocation({ latitude, longitude, address });
        setLocationLoading(false);
      },
      (err) => {
        setLocationError('Could not detect location: ' + err.message + '. Enter manually below.');
        setLocation({ latitude: 0, longitude: 0, address: '' });
        setLocationLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  function toggleTrip(id: string) {
    setSelectedTripIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  }

  async function handleSubmit() {
    if (!location) return;
    setSubmitting(true);
    try {
      const body = {
        userId,
        employeeId,
        employeeName,
        transportMode: transport,
        vehicleId: selectedVehicleId || undefined,
        role: role || undefined,
        partnerId: selectedPartnerId || undefined,
        porterBookingId: porterBookingId || undefined,
        porterVehicleNumber: porterVehicleNumber || undefined,
        porterAmount: porterAmount || undefined,
        porterVehiclePhoto: porterVehiclePhoto || undefined,
        startTime,
        startLocation: location,
        plannedTripIds: selectedTripIds
      };
      const res = await fetch('/api/workday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start work day');
      onSubmit(data.workDay);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  const canProceedStep1 = !!transport;
  const canProceedStep2 =
    (transport === 'truck'   && ((role === 'driver' && !!selectedVehicleId) || (role === 'co-passenger' && !!selectedPartnerId))) ||
    (transport === 'porter'  && !!porterVehicleNumber && !!porterAmount) ||
    (transport !== 'truck'   && transport !== 'porter');
  const canProceedStep3 = !!location && !locationLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Start Your Day</h2>
            <p className="text-xs text-gray-500">Step {step} of 4</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={18} /></button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div className="h-1 bg-blue-600 transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} />
        </div>

        <div className="p-5 space-y-4">

          {/* STEP 1: Transport mode */}
          {step === 1 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">How are you travelling today?</h3>
              <div className="grid grid-cols-3 gap-3">
                {TRANSPORT_OPTIONS.map(opt => (
                  <button
                    key={opt.mode}
                    onClick={() => setTransport(opt.mode)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 font-medium text-sm transition-all active:scale-95 ${transport === opt.mode ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Truck role (only if truck selected) */}
          {step === 2 && transport === 'truck' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white"><Truck size={20} /></div>
                <div>
                  <div className="text-sm font-bold text-gray-800">Truck</div>
                  <div className="text-xs text-gray-500">Selected transport</div>
                </div>
                <CheckCircle size={18} className="text-green-500 ml-auto" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700">What is your role in the truck?</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setRole('driver')}
                  className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 text-sm font-semibold transition-all active:scale-95 ${role === 'driver' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${role === 'driver' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <User2 size={24} />
                  </div>
                  Driver
                  {role === 'driver' && <span className="text-xs text-blue-500 font-normal">Selected</span>}
                </button>
                <button
                  onClick={() => setRole('co-passenger')}
                  className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 text-sm font-semibold transition-all active:scale-95 ${role === 'co-passenger' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${role === 'co-passenger' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <Users size={24} />
                  </div>
                  Co-Passenger
                  {role === 'co-passenger' && <span className="text-xs text-blue-500 font-normal">Selected</span>}
                </button>
              </div>

              {role === 'driver' && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-2">Select Your Truck</label>
                  <div className="space-y-2">
                    {truckVehicles.length === 0 && <p className="text-sm text-gray-400">No trucks available.</p>}
                    {truckVehicles.map(v => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVehicleId(v.id)}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all ${selectedVehicleId === v.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-sm text-gray-800">{v.plate}</div>
                            <div className="text-xs text-gray-500">{v.make} {v.model} · {v.payloadCapacity}kg</div>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.status === 'Idle' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{v.status}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {role === 'co-passenger' && (
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-2">Select Your Driver Partner</label>
                  <div className="space-y-2">
                    {drivers.filter(d => d.status === 'Active' || d.status === 'Available').map(d => (
                      <button
                        key={d.id}
                        onClick={() => setSelectedPartnerId(d.id)}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all ${selectedPartnerId === d.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-sm text-gray-800">{d.fullName}</div>
                            <div className="text-xs text-gray-500">{d.employeeCode || d.id}</div>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.status === 'Available' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{d.status}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2 for porter */}
          {step === 2 && transport === 'porter' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white"><Package size={20} /></div>
                <div><div className="text-sm font-bold text-gray-800">Porter</div><div className="text-xs text-gray-500">Selected transport</div></div>
                <CheckCircle size={18} className="text-green-500 ml-auto" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700">Porter Vehicle Details</h3>

              {/* Vehicle Number */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Vehicle Number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={porterVehicleNumber}
                  onChange={e => setPorterVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. TN 09 AB 1234"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Amount Paid (₹) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={porterAmount}
                  onChange={e => setPorterAmount(e.target.value)}
                  placeholder="e.g. 350"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Booking ID (optional) */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Booking ID <span className="text-gray-400">(optional)</span></label>
                <input
                  type="text"
                  value={porterBookingId}
                  onChange={e => setPorterBookingId(e.target.value)}
                  placeholder="Porter booking reference"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              {/* Vehicle Photo */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Vehicle Photo <span className="text-gray-400">(optional)</span></label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 group-hover:border-orange-400 transition-colors flex items-center justify-center shrink-0 bg-gray-50">
                    {porterPhotoPreview
                      ? <img src={porterPhotoPreview} alt="vehicle" className="w-full h-full object-cover" />
                      : <Camera size={24} className="text-gray-300" />}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-orange-600">{porterPhotoPreview ? 'Change photo' : 'Take vehicle photo'}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">Photo of Porter vehicle</div>
                  </div>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setPorterPhotoPreview(URL.createObjectURL(f));
                    const reader = new FileReader();
                    reader.onload = () => setPorterVehiclePhoto(reader.result as string);
                    reader.readAsDataURL(f);
                  }} />
                </label>
              </div>
            </div>
          )}

          {/* STEP 2 for non-truck, non-porter — show selection confirmation */}
          {step === 2 && transport !== 'truck' && transport !== 'porter' && (() => {
            const opt = TRANSPORT_OPTIONS.find(o => o.mode === transport);
            return (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Your transport for today</h3>
                <div className="flex flex-col items-center py-8 gap-4 rounded-2xl bg-blue-50 border-2 border-blue-300">
                  <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                    {opt?.bigIcon}
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-black text-blue-800 capitalize">{opt?.label || transport}</div>
                    <div className="text-sm text-blue-500 mt-1">Selected mode</div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-700 font-semibold bg-green-100 px-4 py-2 rounded-full">
                    <CheckCircle size={16} /> Confirmed
                  </div>
                </div>
              </div>
            );
          })()}

          {/* STEP 3: Location + time */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Start Time</label>
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                  <span className="text-sm font-semibold text-gray-800">{formatTimeLocal(startTime)}</span>
                  <span className="text-xs text-gray-400 ml-auto">Auto-set</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Starting Location</label>
                {locationLoading ? (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                    <Loader size={14} className="text-blue-500 animate-spin" />
                    <span className="text-sm text-gray-500">Detecting location...</span>
                  </div>
                ) : location ? (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex gap-2">
                      <MapPin size={14} className="text-blue-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-gray-700 leading-relaxed">{location.address || `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`}</p>
                    </div>
                    <button onClick={detectLocation} className="text-xs text-blue-600 mt-2 underline">Refresh location</button>
                  </div>
                ) : null}
                {locationError && (
                  <div className="text-xs text-red-600 mt-1">{locationError}</div>
                )}
                {location && !location.latitude && (
                  <input
                    type="text"
                    placeholder="Enter your starting location"
                    value={location.address}
                    onChange={e => setLocation({ ...location, address: e.target.value })}
                    className="w-full mt-2 border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Task selection */}
          {step === 4 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Which tasks will you handle today?</h3>
              {upcomingTrips.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No tasks assigned. Check with admin.</p>
              ) : (
                <div className="space-y-2">
                  {upcomingTrips.map(trip => {
                    const selected = selectedTripIds.includes(trip.id);
                    return (
                      <button
                        key={trip.id}
                        onClick={() => toggleTrip(trip.id)}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <div className="flex items-start gap-3">
                          {selected ? <CheckSquare size={18} className="text-blue-600 mt-0.5 shrink-0" /> : <Square size={18} className="text-gray-400 mt-0.5 shrink-0" />}
                          <div className="min-w-0">
                            <div className="flex gap-2 items-center mb-0.5 flex-wrap">
                              <span className={`text-xs font-bold ${trip.taskType === 'DELIVERY' ? 'text-green-600' : 'text-blue-600'}`}>{trip.taskType || 'PICKUP'}</span>
                              {trip.porter?.enabled && <span className="text-xs text-orange-600 font-bold">PORTER</span>}
                              {trip.courierName && <span className="text-xs text-gray-500">{trip.courierName}</span>}
                            </div>
                            <div className="text-sm font-medium text-gray-800 truncate">{trip.origin}</div>
                            {trip.podNumber && <div className="text-xs text-gray-400 font-mono">POD #{trip.podNumber}</div>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Driver vehicle summary card */}
          {step >= 2 && role === 'driver' && selectedVehicle && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <div className="text-xs font-bold text-blue-700 mb-1 flex items-center gap-1"><Truck size={12} /> My Truck</div>
              <div className="text-sm font-semibold text-gray-800">{selectedVehicle.plate}</div>
              <div className="text-xs text-gray-500">{selectedVehicle.make} {selectedVehicle.model} · {selectedVehicle.payloadCapacity}kg capacity</div>
              <div className="text-xs text-gray-400 mt-0.5">Next service: {selectedVehicle.nextService}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 sticky bottom-0 bg-white">
          <div className="flex gap-3">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="flex-1 py-3 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Back
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 1 ? !canProceedStep1 : step === 2 ? !canProceedStep2 : !canProceedStep3}
                className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-blue-700 active:scale-95 transition-all"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <><Loader size={14} className="animate-spin" /> Starting...</> : 'Start Work Day'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
