import React, { useEffect, useState } from 'react';
import { Truck, MapPin, Clock, Download, Camera, User, ChevronLeft } from 'lucide-react';
import { Driver, Trip } from '../types';
import { ActiveTripTracker } from './ActiveTripTracker';

interface Props {
  driver: Driver;
  onClose: () => void;
}

const EmployeeProfile: React.FC<Props> = ({ driver, onClose }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res1 = await fetch(`/api/drivers/${driver.id}/trips`);
        if (res1.ok) {
          const d = await res1.json();
          setTrips(d.trips || []);
        }
        const res2 = await fetch(`/api/trips/active?driverId=${driver.id}`);
        if (res2.ok) {
          const d2 = await res2.json();
          setActiveTrip(d2.trip || null);
        }
      } catch (err) {
        console.error('[EmployeeProfile] load', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [driver.id]);

  const downloadWaybill = () => {
    const payload = {
      driver,
      activeTrip
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(activeTrip && activeTrip.id) || driver.id}-waybill.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center bg-black/40 p-6 overflow-auto">
      <div className="w-full max-w-6xl bg-transparent rounded-lg shadow-lg">
        <div className="flex items-center justify-between p-4 rounded-t-lg bg-gradient-to-r from-emerald-600 to-sky-600 text-white">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 rounded bg-white/10 hover:bg-white/20"><ChevronLeft className="w-4 h-4" /></button>
            <div>
              <div className="text-sm font-black">{activeTrip ? `TRIP ${activeTrip.id}` : `Employee: ${driver.name}`}</div>
              <div className="text-xs text-white/90">{activeTrip ? `${activeTrip.origin} → ${activeTrip.destination}` : driver.region}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => alert('Show emergency protocol')} className="px-3 py-2 border border-white/30 text-white rounded text-xs bg-white/5 hover:bg-white/10">Emergency Protocol</button>
            <button onClick={downloadWaybill} className="px-3 py-2 bg-white text-slate-900 rounded text-xs inline-flex items-center gap-2"><Download className="w-4 h-4" /> Download Waybill</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 bg-white rounded-b-lg">
          <div className="col-span-1 space-y-4">
            <div className="rounded-lg p-4 bg-gradient-to-br from-white to-slate-50 border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white border flex items-center justify-center text-emerald-600"><User className="w-6 h-6" /></div>
                <div>
                  <div className="font-bold text-slate-900">{driver.name}</div>
                  <div className="text-xs text-slate-500">{driver.employeeCode || driver.id}</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-600 space-y-1">
                <div><strong>Phone:</strong> {driver.phone || '—'}</div>
                <div><strong>Region:</strong> {driver.region || '—'}</div>
                <div><strong>Status:</strong> <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-100 text-emerald-800">{driver.status || 'Idle'}</span></div>
              </div>
            </div>

            <div className="rounded-lg p-4 bg-white border shadow-sm">
              <div className="text-xs font-bold mb-2 text-slate-700">Material Details</div>
              <div className="text-xs text-slate-600">FMCG Goods - Grade A • SKU: FMCG-990-LO</div>
              <div className="mt-3 text-xs text-slate-500">Total payload <strong>1,800 kg</strong> • Capacity <strong>92%</strong></div>
            </div>

            <div className="rounded-lg p-3 bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow">
              <div className="text-xs font-bold">Current Speed</div>
              <div className="mt-2 text-2xl font-black">{activeTrip ? `${activeTrip.telematics?.speed || 0} km/h` : '—'}</div>
              <div className="mt-1 text-xs opacity-90">Fuel: {activeTrip ? `${activeTrip.telematics?.fuelLevel || 0}%` : '—'}</div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="h-64 border rounded overflow-hidden">
              {activeTrip ? <ActiveTripTracker trip={activeTrip} driver={driver} onRefresh={() => {}} onEmergencyStop={() => {}} /> : (
                <div className="h-full flex items-center justify-center text-slate-400">No active trip to display map</div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="border rounded p-3 text-xs">
                <div className="font-bold">Arrival & Timing</div>
                <div className="mt-2 text-sm font-black">{activeTrip?.lastUpdated ? new Date(activeTrip.lastUpdated).toLocaleTimeString() : '—'}</div>
                <div className="text-xs text-slate-500">Actual in time</div>
              </div>
              <div className="border rounded p-3 text-xs">
                <div className="font-bold">Estimated Departure</div>
                <div className="mt-2 text-sm font-black">{activeTrip?.eta || '—'}</div>
                <div className="text-xs text-slate-500">Schedule adherence</div>
              </div>
              <div className="border rounded p-3 text-xs">
                <div className="font-bold">Trip Completion</div>
                <div className="mt-2 text-sm font-black">{activeTrip ? `${Math.round(((activeTrip.totalKm - (activeTrip.remainingKm||0)) / (activeTrip.totalKm||1)) * 100)}%` : '—'}</div>
                <div className="text-xs text-slate-500">{activeTrip ? `${activeTrip.totalKm - (activeTrip.remainingKm||0)} km of ${activeTrip.totalKm} km` : ''}</div>
              </div>
            </div>

            <div className="border rounded p-3 text-xs">
              <div className="font-bold mb-2">History</div>
              {loading ? <div className="text-xs text-slate-400">Loading trips…</div> : (
                trips.length === 0 ? <div className="text-xs text-slate-400">No past trips</div> : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {trips.map(t => (
                      <div key={t.id} className="flex items-center justify-between">
                        <div className="text-xs">{t.origin} → {t.destination}</div>
                        <div className="text-[11px] text-slate-500">{t.status}</div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;

