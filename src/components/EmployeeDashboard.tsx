import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList, History, User, LogOut, Play, StopCircle,
  Truck, Bike, Car, Navigation, Calendar, ChevronRight,
  CheckCircle, AlertCircle, Clock, Loader, Edit, Save, X, Phone, MapPin
} from 'lucide-react';
import { User as UserType, Driver, Trip, Vehicle, WorkDay } from '../types';
import { DailyPlanModal } from './DailyPlanModal';
import { EndOfDayReport } from './EndOfDayReport';
import { TaskCard } from './TaskCard';

interface Props {
  sessionUser: UserType;
  onLogout: () => void;
}

type Tab = 'today' | 'history' | 'profile';

const TRANSPORT_ICONS: Record<string, React.ReactNode> = {
  bike: <Bike size={14} />, truck: <Truck size={14} />, van: <Car size={14} />,
  auto: <Navigation size={14} />, other: <Car size={14} />
};

export function EmployeeDashboard({ sessionUser, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('today');
  const [driver, setDriver] = useState<Driver | null>(null);
  const [todayTrips, setTodayTrips] = useState<Trip[]>([]);
  const [allAssignedTrips, setAllAssignedTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [workDay, setWorkDay] = useState<WorkDay | null>(null);
  const [history, setHistory] = useState<WorkDay[]>([]);
  const [historyTrips, setHistoryTrips] = useState<Record<string, Trip[]>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Modals
  const [showDailyPlan, setShowDailyPlan] = useState(false);
  const [showEOD, setShowEOD] = useState(false);

  // Profile edit
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', emergencyContact: '', address: '' });

  // History expand
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  const driverId = sessionUser.driverId || '';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [driversRes, vehiclesRes, tripsRes, workDayRes] = await Promise.all([
        fetch('/api/drivers'),
        fetch('/api/fleet'),
        fetch(`/api/drivers/${driverId}/trips`),
        fetch(`/api/workday/today/${sessionUser.id}`)
      ]);

      const driversData = await driversRes.json();
      const vehiclesData = await vehiclesRes.json();
      const tripsData = await tripsRes.json();
      const workDayData = await workDayRes.json();

      const allDrivers: Driver[] = driversData.drivers || [];
      const me = allDrivers.find(d => d.id === driverId) || null;
      setDriver(me);
      setDrivers(allDrivers.filter(d => d.id !== driverId));
      setVehicles(vehiclesData.vehicles || []);
      setAllAssignedTrips(tripsData.trips || []);
      setWorkDay(workDayData.workDay || null);
      setTodayTrips(workDayData.trips || tripsData.trips || []);
    } catch (err) {
      console.error('Load error', err);
    } finally {
      setLoading(false);
    }
  }, [driverId, sessionUser.id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (driver) {
      setProfileForm({
        name: driver.name,
        phone: driver.phone || '',
        emergencyContact: driver.emergencyContact || '',
        address: driver.address || ''
      });
    }
  }, [driver]);

  async function loadHistory() {
    try {
      const res = await fetch(`/api/workday/history/${sessionUser.id}`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) { console.error(err); }
  }

  useEffect(() => {
    if (activeTab === 'history') loadHistory();
  }, [activeTab]);

  async function loadHistoryTrips(wd: WorkDay) {
    if (historyTrips[wd.id]) { setExpandedHistory(wd.id); return; }
    try {
      const res = await fetch(`/api/drivers/${driverId}/trips?date=${wd.date}`);
      const data = await res.json();
      setHistoryTrips(prev => ({ ...prev, [wd.id]: data.trips || [] }));
      setExpandedHistory(wd.id);
    } catch (err) { console.error(err); }
  }

  async function handleStartTask(tripId: string) {
    try {
      await fetch(`/api/trips/${tripId}/update-telematics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'In Progress', operatorName: sessionUser.fullName })
      });
      setTodayTrips(prev => prev.map(t => t.id === tripId ? { ...t, status: 'In Progress', taskStage: 'Ongoing' } : t));
    } catch (err) { console.error(err); }
  }

  async function handleMarkComplete(tripId: string) {
    try {
      await fetch(`/api/trips/${tripId}/update-telematics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Completed', operatorName: sessionUser.fullName })
      });
      setTodayTrips(prev => prev.map(t => t.id === tripId ? { ...t, status: 'Completed', taskStage: 'Completed' } : t));
    } catch (err) { console.error(err); }
  }

  async function handleUploadPhoto(tripId: string, kind: 'PICKUP' | 'DELIVERY', file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      fd.append('kind', kind);
      fd.append('uploadedBy', 'driver');
      fd.append('operatorName', sessionUser.fullName);
      const res = await fetch(`/api/trips/${tripId}/proof`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.trip) {
        setTodayTrips(prev => prev.map(t => t.id === tripId ? data.trip : t));
      }
    } catch (err) { console.error(err); } finally {
      setUploading(false);
    }
  }

  async function handleMarkIncomplete(tripId: string, reason: string) {
    try {
      await fetch(`/api/trips/${tripId}/remark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remark: reason, operatorName: sessionUser.fullName })
      });
      setTodayTrips(prev => prev.map(t => t.id === tripId ? { ...t, taskStage: 'Incomplete', status: 'Incomplete', remark: reason } : t));
    } catch (err) { console.error(err); }
  }

  async function handleSaveProfile() {
    if (!driverId) return;
    try {
      const res = await fetch(`/api/drivers/${driverId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profileForm, operatorName: sessionUser.fullName })
      });
      const data = await res.json();
      if (data.driver) setDriver(data.driver);
      setEditingProfile(false);
    } catch (err) { console.error(err); }
  }

  const myVehicle = workDay?.role === 'driver' && workDay.vehicleId
    ? vehicles.find(v => v.id === workDay.vehicleId)
    : null;

  const upcomingToday = todayTrips.filter(t => t.taskStage === 'Upcoming' || !t.taskStage);
  const ongoingToday = todayTrips.filter(t => t.taskStage === 'Ongoing');
  const completedToday = todayTrips.filter(t => t.taskStage === 'Completed');
  const incompleteToday = todayTrips.filter(t => t.taskStage === 'Incomplete');

  const dayComplete = workDay?.eodSubmitted;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader size={32} className="animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-4 pt-4 pb-3 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
              {sessionUser.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-gray-900 text-sm leading-tight">{sessionUser.fullName}</div>
              <div className="text-xs text-gray-500">{driver?.employeeCode || sessionUser.username}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {workDay && !dayComplete && (
              <button
                onClick={() => setShowEOD(true)}
                className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-red-700 active:scale-95 transition-all"
              >
                <StopCircle size={14} /> End Day
              </button>
            )}
            <button onClick={onLogout} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Work day status bar */}
        {workDay && !dayComplete && (
          <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
            {TRANSPORT_ICONS[workDay.transportMode]}
            <span className="text-xs font-semibold text-green-700 capitalize">{workDay.transportMode}</span>
            {workDay.role && <span className="text-xs text-green-600">· {workDay.role}</span>}
            <span className="text-xs text-green-500 ml-auto">Day started</span>
          </div>
        )}
        {dayComplete && (
          <div className="mt-3 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
            <CheckCircle size={14} className="text-blue-600" />
            <span className="text-xs font-semibold text-blue-700">Day completed and submitted</span>
          </div>
        )}

        {/* Driver truck card — only for drivers */}
        {myVehicle && (
          <div className="mt-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <Truck size={14} className="text-blue-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-blue-800">{myVehicle.plate}</div>
              <div className="text-xs text-blue-600 truncate">{myVehicle.make} {myVehicle.model} · Next svc: {myVehicle.nextService}</div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${myVehicle.status === 'Idle' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {myVehicle.status}
            </span>
          </div>
        )}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto pb-20">

        {/* TODAY TAB */}
        {activeTab === 'today' && (
          <div className="p-4">
            {!workDay && !dayComplete && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play size={32} className="text-blue-600 ml-1" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">Ready to Start?</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">Set your transport mode and select today's tasks to begin your work day.</p>
                <button
                  onClick={() => setShowDailyPlan(true)}
                  className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200"
                >
                  Start My Day
                </button>
              </div>
            )}

            {workDay && todayTrips.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No tasks assigned yet. Check with admin.</p>
              </div>
            )}

            {/* Ongoing tasks first */}
            {ongoingToday.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Clock size={12} /> In Progress ({ongoingToday.length})
                </h3>
                {ongoingToday.map(t => (
                  <TaskCard key={t.id} trip={t} onStartTask={handleStartTask} onUploadPhoto={handleUploadPhoto} onMarkIncomplete={handleMarkIncomplete} onMarkComplete={handleMarkComplete} uploading={uploading} />
                ))}
              </div>
            )}

            {/* Upcoming tasks */}
            {upcomingToday.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <ClipboardList size={12} /> Upcoming ({upcomingToday.length})
                </h3>
                {upcomingToday.map(t => (
                  <TaskCard key={t.id} trip={t} onStartTask={workDay ? handleStartTask : () => {}} onUploadPhoto={handleUploadPhoto} onMarkIncomplete={handleMarkIncomplete} uploading={uploading} />
                ))}
              </div>
            )}

            {/* Completed */}
            {completedToday.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <CheckCircle size={12} /> Completed ({completedToday.length})
                </h3>
                {completedToday.map(t => (
                  <TaskCard key={t.id} trip={t} onStartTask={handleStartTask} onUploadPhoto={handleUploadPhoto} onMarkIncomplete={handleMarkIncomplete} uploading={uploading} />
                ))}
              </div>
            )}

            {/* Incomplete */}
            {incompleteToday.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <AlertCircle size={12} /> Incomplete ({incompleteToday.length})
                </h3>
                {incompleteToday.map(t => (
                  <TaskCard key={t.id} trip={t} onStartTask={handleStartTask} onUploadPhoto={handleUploadPhoto} onMarkIncomplete={handleMarkIncomplete} uploading={uploading} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="p-4">
            <h2 className="text-sm font-bold text-gray-700 mb-3">Work History</h2>
            {history.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <History size={36} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No history yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map(wd => (
                  <div key={wd.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <button
                      className="w-full text-left p-4"
                      onClick={() => expandedHistory === wd.id ? setExpandedHistory(null) : loadHistoryTrips(wd)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-gray-800">
                            {new Date(wd.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {TRANSPORT_ICONS[wd.transportMode]}
                            <span className="text-xs text-gray-500 capitalize">{wd.transportMode}</span>
                            {wd.role && <span className="text-xs text-gray-400">· {wd.role}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${wd.eodSubmitted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {wd.eodSubmitted ? 'Submitted' : 'Incomplete'}
                          </span>
                          <ChevronRight size={16} className={`text-gray-400 transition-transform ${expandedHistory === wd.id ? 'rotate-90' : ''}`} />
                        </div>
                      </div>
                    </button>

                    {expandedHistory === wd.id && (
                      <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-gray-500">Start</span>
                            <div className="font-medium text-gray-800">{new Date(wd.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                            <div className="text-gray-400 truncate">{wd.startLocation.address}</div>
                          </div>
                          {wd.endTime && (
                            <div>
                              <span className="text-gray-500">End</span>
                              <div className="font-medium text-gray-800">{new Date(wd.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                              <div className="text-gray-400 truncate">{wd.endLocation?.address}</div>
                            </div>
                          )}
                        </div>
                        {wd.eodNotes && (
                          <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-600">{wd.eodNotes}</div>
                        )}
                        {historyTrips[wd.id] && historyTrips[wd.id].length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-gray-500 mb-2">Tasks ({historyTrips[wd.id].length})</div>
                            <div className="space-y-1">
                              {historyTrips[wd.id].map(t => (
                                <div key={t.id} className="flex items-center gap-2 text-xs p-2 bg-gray-50 rounded-lg">
                                  {t.taskStage === 'Completed' ? <CheckCircle size={12} className="text-green-500" /> : t.taskStage === 'Incomplete' ? <AlertCircle size={12} className="text-red-500" /> : <Clock size={12} className="text-amber-500" />}
                                  <span className="flex-1 truncate">{t.origin}</span>
                                  <span className={`font-medium ${t.taskType === 'DELIVERY' ? 'text-green-600' : 'text-blue-600'}`}>{t.taskType}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {wd.eodPhotos && wd.eodPhotos.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-gray-500 mb-2">EOD Photos</div>
                            <div className="flex gap-2 flex-wrap">
                              {wd.eodPhotos.map((p, i) => {
                                const src = p.filePath ? `/${p.filePath.replace(/\\/g, '/')}` : p.dataUrl;
                                return <img key={i} src={src} alt="EOD" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />;
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="p-4 space-y-4">
            {/* Avatar */}
            <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
              <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-3xl mx-auto mb-3">
                {sessionUser.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="text-lg font-bold text-gray-900">{driver?.name || sessionUser.fullName}</div>
              <div className="text-sm text-gray-500">{driver?.employeeCode || sessionUser.username}</div>
              <div className="flex justify-center gap-3 mt-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-800">{driver?.totalTrips || 0}</div>
                  <div className="text-xs text-gray-400">Tasks</div>
                </div>
                <div className="w-px bg-gray-200" />
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-800">{driver?.rating || '-'}</div>
                  <div className="text-xs text-gray-400">Rating</div>
                </div>
                <div className="w-px bg-gray-200" />
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-800">{driver?.onTimeRate || 0}%</div>
                  <div className="text-xs text-gray-400">On-time</div>
                </div>
              </div>
            </div>

            {/* Profile fields */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-700">Personal Details</h3>
                {!editingProfile ? (
                  <button onClick={() => setEditingProfile(true)} className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:underline">
                    <Edit size={13} /> Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingProfile(false); if (driver) setProfileForm({ name: driver.name, phone: driver.phone || '', emergencyContact: driver.emergencyContact || '', address: driver.address || '' }); }} className="text-xs text-gray-500">
                      <X size={16} />
                    </button>
                    <button onClick={handleSaveProfile} className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                      <Save size={13} /> Save
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Full Name', key: 'name', icon: <User size={14} className="text-gray-400" /> },
                  { label: 'Phone', key: 'phone', icon: <Phone size={14} className="text-gray-400" /> },
                  { label: 'Emergency Contact', key: 'emergencyContact', icon: <Phone size={14} className="text-gray-400" /> },
                  { label: 'Address', key: 'address', icon: <MapPin size={14} className="text-gray-400" /> },
                ].map(field => (
                  <div key={field.key}>
                    <label className="text-xs text-gray-500 block mb-1">{field.label}</label>
                    {editingProfile ? (
                      <input
                        type="text"
                        value={(profileForm as any)[field.key]}
                        onChange={e => setProfileForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    ) : (
                      <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-2.5">
                        {field.icon}
                        <span className="text-sm text-gray-700">{(profileForm as any)[field.key] || <span className="text-gray-400 italic">Not set</span>}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Read-only info */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-700 mb-4">Employment Info</h3>
              <div className="space-y-2">
                {[
                  ['License', driver?.licenseNumber],
                  ['Experience', driver ? `${driver.experienceYears} years` : ''],
                  ['Region', driver?.region],
                  ['Status', driver?.status],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm py-1 border-b border-gray-50">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-gray-800">{value || '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex max-w-lg mx-auto">
        {([
          { tab: 'today', icon: <ClipboardList size={20} />, label: 'Today' },
          { tab: 'history', icon: <History size={20} />, label: 'History' },
          { tab: 'profile', icon: <User size={20} />, label: 'Profile' },
        ] as { tab: Tab; icon: React.ReactNode; label: string }[]).map(item => (
          <button
            key={item.tab}
            onClick={() => setActiveTab(item.tab)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${activeTab === item.tab ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {item.icon}
            {item.label}
            {item.tab === 'today' && ongoingToday.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[9px] rounded-full flex items-center justify-center">
                {ongoingToday.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Modals */}
      {showDailyPlan && (
        <DailyPlanModal
          userId={sessionUser.id}
          employeeId={driverId}
          employeeName={sessionUser.fullName}
          assignedTrips={allAssignedTrips}
          vehicles={vehicles}
          drivers={drivers}
          onSubmit={(wd) => { setWorkDay(wd); setShowDailyPlan(false); load(); }}
          onClose={() => setShowDailyPlan(false)}
        />
      )}

      {showEOD && workDay && (
        <EndOfDayReport
          workDay={workDay}
          todayTrips={todayTrips}
          userId={sessionUser.id}
          onSubmit={(wd) => { setWorkDay(wd); setShowEOD(false); }}
          onClose={() => setShowEOD(false)}
        />
      )}
    </div>
  );
}
