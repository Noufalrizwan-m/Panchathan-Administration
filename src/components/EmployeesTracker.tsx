import React, { useEffect, useState } from 'react';
import { Eye, MapPin, User, Clock, CheckCircle2 } from 'lucide-react';
import { Driver, Trip } from '../types';

export const EmployeesTracker: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [selectedTrips, setSelectedTrips] = useState<Trip[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileDriverId, setProfileDriverId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/drivers');
        if (!res.ok) throw new Error('Failed fetching drivers');
        const data = await res.json();
        setDrivers(data.drivers || []);
      } catch (err) {
        console.error('[EmployeesTracker] load error', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openProfile = (d: Driver) => {
    setProfileDriverId(d.id);
    setShowProfileModal(true);
  };

  const openHistory = async (d: Driver) => {
    setSelectedDriver(d);
    setShowHistoryModal(true);
    try {
      const res = await fetch(`/api/drivers/${d.id}/trips`);
      if (!res.ok) throw new Error('Could not fetch trips');
      const data = await res.json();
      setSelectedTrips(data.trips || []);
    } catch (err) {
      console.error('[EmployeesTracker] failed to load trips', err);
      setSelectedTrips([]);
    }
  };

  if (loading) return <div className="p-4 text-sm">Loading employees…</div>;

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-black text-slate-800">Employees Tracking</h3>
      <p className="text-xs text-slate-500">Live list of employees, their active assignment and last known location.</p>

      <div className="grid grid-cols-1 gap-3">
        {drivers.map((d) => (
          <div key={d.id} className="rounded-md border p-3 flex items-center justify-between bg-white">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"><User className="w-5 h-5 text-slate-500" /></div>
                <div>
                  <div className="font-bold text-sm text-slate-800">{d.name}</div>
                  <div className="text-xs text-slate-500">{d.employeeCode || d.id} • {d.region || '—'}</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-600 flex gap-4">
                <div className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Last known: <span className="font-medium ml-1">{(d as any).lastKnownAddress || 'Unknown'}</span></div>
                <div className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> Status: <span className="font-medium ml-1">{d.status || 'Idle'}</span></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openHistory(d)} className="text-xs px-3 py-1 border rounded inline-flex items-center gap-2"><Eye className="w-3.5 h-3.5" /> History</button>
              <button onClick={() => openProfile(d)} className="text-xs px-3 py-1 border rounded inline-flex items-center gap-2">Profile</button>
            </div>
          </div>
        ))}
      </div>

      {showHistoryModal && selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowHistoryModal(false)}>
          <div className="max-w-3xl w-full bg-white rounded p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h4 className="font-bold">History — {selectedDriver.name}</h4>
              <button className="text-sm px-2 py-1 border rounded" onClick={() => setShowHistoryModal(false)}>Close</button>
            </div>
            <div className="mt-3 space-y-3 max-h-[60vh] overflow-y-auto">
              {selectedTrips.length === 0 ? (
                <p className="text-xs text-slate-500">No trips found for this employee.</p>
              ) : selectedTrips.map((t) => (
                <div key={t.id} className="border rounded p-2 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm">{t.origin} → {t.destination}</div>
                      <div className="text-xs text-slate-500">{t.lastUpdated ? new Date(t.lastUpdated).toLocaleString() : ''} • {t.status}</div>
                    </div>
                    <div className="text-xs text-slate-500">{t.totalKm || ''} km</div>
                  </div>
                  {t.proofPhotos?.length ? (
                    <div className="mt-2 flex gap-2 overflow-x-auto">
                      {t.proofPhotos.map((p, idx) => (
                        <img key={idx} src={p.dataUrl as any} alt={p.fileName} className="w-24 h-16 object-cover rounded cursor-pointer" onClick={() => window.open(p.dataUrl as any)} />
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showProfileModal && profileDriverId && (
        // lazy load modal component so file exists even if not mounted earlier
        <div>
          {/* EmployeeProfile loaded dynamically via import to keep bundle small */}
          <EmployeeProfileLoader driverId={profileDriverId} onClose={() => { setShowProfileModal(false); setProfileDriverId(null); }} />
        </div>
      )}
    </div>
  );
};

export default EmployeesTracker;

// Small loader wrapper to import EmployeeProfile dynamically
const EmployeeProfileLoader: React.FC<{ driverId: string; onClose: () => void }> = ({ driverId, onClose }) => {
  const [Comp, setComp] = useState<React.ComponentType<any> | null>(null);
  const [driverObj, setDriverObj] = useState<Driver | null>(null);

  useEffect(() => {
    let mounted = true;
    import('./EmployeeProfile').then(m => { if (mounted) setComp(() => m.default); }).catch(err => console.error('Failed to load EmployeeProfile', err));
    // fetch driver object from list endpoint
    (async () => {
      try {
        const res = await fetch('/api/drivers');
        if (!res.ok) throw new Error('Could not fetch drivers');
        const data = await res.json();
        const found = (data.drivers || []).find((d: Driver) => d.id === driverId) || null;
        if (mounted) setDriverObj(found);
      } catch (err) {
        console.error('[EmployeeProfileLoader] fetch driver', err);
      }
    })();
    return () => { mounted = false; };
  }, [driverId]);

  if (!Comp || !driverObj) return <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">Loading profile…</div>;
  const CompAny: any = Comp;
  return <CompAny driver={driverObj} onClose={onClose} />;
};
