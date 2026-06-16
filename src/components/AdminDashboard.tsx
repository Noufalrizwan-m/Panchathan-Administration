import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Truck, ClipboardList, Activity, Plus, Search, Edit, Trash2, X, Save,
  CheckCircle, AlertCircle, Package, LogOut, RefreshCw,
  ChevronDown, ChevronRight, ChevronUp, Eye, Camera, Loader, Shield,
  Building2, Star, Award, Filter, Phone, MapPin
} from 'lucide-react';
import { User as UserType, Vehicle, Driver, Trip, ActivityLog } from '../types';

interface Props {
  sessionUser: UserType;
  onLogout: () => void;
  onAddVehicle: () => void;
}

type Tab = 'employees' | 'vehicles' | 'tasks' | 'activity';

const COURIER_OPTIONS = [
  'BlueDart', 'DTDC', 'FedEx India', 'Delhivery', 'Ekart', 'Ecom Express',
  'India Post', 'Aramex', 'DHL Express', 'Xpressbees', 'Porter', 'Other',
];

function StatusBadge({ status, small }: { status: string; small?: boolean }) {
  const styles: Record<string, string> = {
    Available:   'bg-emerald-100 text-emerald-700',
    Active:      'bg-blue-100 text-blue-700',
    'On Leave':  'bg-slate-100 text-slate-600',
    Idle:        'bg-slate-100 text-slate-600',
    'On Route':  'bg-blue-100 text-blue-700',
    Maintenance: 'bg-amber-100 text-amber-700',
    'In Progress':'bg-blue-100 text-blue-700',
    Completed:   'bg-emerald-100 text-emerald-700',
    'Saved Draft':'bg-amber-100 text-amber-700',
    Incomplete:  'bg-red-100 text-red-700',
    Upcoming:    'bg-blue-100 text-blue-700',
    Ongoing:     'bg-amber-100 text-amber-700',
  };
  const cls = small ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-block rounded-full font-semibold ${cls} ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      {status === 'Saved Draft' ? 'Upcoming' : status}
    </span>
  );
}

// ── Employee Form Modal ──────────────────────────────────────────────────────

interface EmpForm {
  name: string; username: string; password: string; phone: string;
  employeeCode: string; region: string; licenseNumber: string; emergencyContact: string;
}

function EmployeeFormModal({
  mode, initial, onClose, onSaved,
}: {
  mode: 'add' | 'edit';
  initial?: Partial<EmpForm & { id: string }>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<EmpForm>({
    name: initial?.name || '',
    username: initial?.username || '',
    password: '',
    phone: initial?.phone || '',
    employeeCode: initial?.employeeCode || '',
    region: initial?.region || 'Central',
    licenseNumber: initial?.licenseNumber || '',
    emergencyContact: initial?.emergencyContact || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(k: keyof EmpForm, v: string) { setForm(p => ({ ...p, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.username || (!initial && !form.password)) {
      setError('Name, username, and password are required.');
      return;
    }
    setLoading(true); setError('');
    try {
      if (mode === 'add') {
        const res = await fetch('/api/drivers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, operatorName: 'Admin' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
      } else if (mode === 'edit' && initial?.id) {
        const patchRes = await fetch(`/api/drivers/${initial.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, phone: form.phone, emergencyContact: form.emergencyContact, region: form.region, licenseNumber: form.licenseNumber, operatorName: 'Admin' }),
        });
        if (!patchRes.ok) { const d = await patchRes.json(); throw new Error(d.error); }
        if (form.password && initial.username) {
          await fetch(`/api/users/${initial.username}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: form.password }),
          });
        }
      }
      onSaved(); onClose();
    } catch (err: any) {
      setError(err.message || 'Error saving employee');
    } finally { setLoading(false); }
  }

  const REGIONS = ['Central', 'North', 'South', 'East', 'West', 'North-East', 'Other'];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto">
        <div className="bg-[#0f3d20] px-5 py-4 flex items-center justify-between sticky top-0 rounded-t-2xl">
          <div>
            <h3 className="text-white font-bold text-sm">{mode === 'add' ? 'Add Employee' : 'Edit Employee'}</h3>
            <p className="text-emerald-300 text-xs mt-0.5">{mode === 'add' ? 'Create account & login access' : 'Update employee details'}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-600 block mb-1">Full Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="Employee full name" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Username <span className="text-red-500">*</span></label>
              <input type="text" value={form.username} onChange={e => set('username', e.target.value)} disabled={mode === 'edit'} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:bg-gray-50 disabled:text-gray-400" placeholder="login username" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                {mode === 'edit' ? 'New Password (blank = keep)' : 'Password'} {mode === 'add' && <span className="text-red-500">*</span>}
              </label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="••••••••" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="+91 9876543210" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Emergency Contact</label>
              <input type="tel" value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="+91 9876543210" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Employee Code</label>
              <input type="text" value={form.employeeCode} onChange={e => set('employeeCode', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="EMP-001" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Region / Area</label>
              <select value={form.region} onChange={e => set('region', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-600 block mb-1">License Number</label>
              <input type="text" value={form.licenseNumber} onChange={e => set('licenseNumber', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-mono" placeholder="TN0120240012345" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-[#0f3d20] text-white rounded-xl font-semibold text-sm hover:bg-emerald-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader size={14} className="animate-spin" /> Saving...</> : <><Save size={14} /> {mode === 'add' ? 'Create Employee' : 'Save Changes'}</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Task Dispatch Modal ──────────────────────────────────────────────────────

function TaskDispatchModal({
  drivers, onClose, onSaved,
}: {
  drivers: Driver[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    driverId: '',
    customerName: '',
    taskType: 'PICKUP' as 'PICKUP' | 'DELIVERY' | 'BOTH',
    origin: '',
    destination: '',
    podNumber: '',
    courierName: '',
    priority: 'High' as 'High' | 'Medium' | 'Low',
    pickupNotes: '',
    usePorter: false,
    porterBookingId: '',
    porterTracking: '',
    porterContact: '',
    porterTaskType: 'collect' as 'collect' | 'send',
  });
  const [packagePhotoFile, setPackagePhotoFile] = useState<File | null>(null);
  const [packagePhotoPreview, setPackagePhotoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(k: string, v: any) { setForm(p => ({ ...p, [k]: v })); }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPackagePhotoFile(file);
    setPackagePhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.driverId) { setError('Please select an employee.'); return; }
    if (!form.origin) { setError(form.taskType === 'DELIVERY' ? 'Delivery address is required.' : 'Pickup address is required.'); return; }
    if (form.taskType === 'BOTH' && !form.destination) { setError('Delivery address is required for Pickup + Delivery tasks.'); return; }
    setLoading(true); setError('');
    try {
      const payload = {
        driverId: form.driverId,
        truckId: 'DRIVER-SELECT',
        customerName: form.customerName,
        taskType: form.taskType,
        origin: form.origin,
        destination: form.taskType === 'BOTH' ? form.destination : (form.destination || form.origin),
        podNumber: form.podNumber,
        courierName: form.courierName,
        priority: form.priority,
        pickupNotes: form.pickupNotes,
        porter: form.usePorter ? {
          enabled: true,
          bookingId: form.porterBookingId,
          trackingNumber: form.porterTracking,
          contactNumber: form.porterContact,
          porterTaskType: form.porterTaskType,
        } : { enabled: false },
        operatorName: 'Admin',
      };

      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (packagePhotoFile && data.trip?.id) {
        const fd = new FormData();
        fd.append('photo', packagePhotoFile);
        fd.append('kind', 'PACKAGE_REF');
        fd.append('uploadedBy', 'admin');
        await fetch(`/api/trips/${data.trip.id}/proof`, { method: 'POST', body: fd });
      }

      onSaved(); onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <div className="bg-[#0f3d20] px-5 py-4 flex items-center justify-between sticky top-0 rounded-t-2xl">
          <div>
            <h3 className="text-white font-bold text-sm">Assign New Task</h3>
            <p className="text-emerald-300 text-xs mt-0.5">Dispatch pickup or delivery to an employee</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>}

          {/* Employee */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Employee <span className="text-red-500">*</span></label>
            <select value={form.driverId} onChange={e => set('driverId', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
              <option value="">Select employee...</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.employeeCode || d.id})</option>)}
            </select>
          </div>

          {/* Customer / Company Name */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">
              <Building2 size={11} className="inline mr-1 text-purple-500" />
              Customer / Company Name
            </label>
            <input
              type="text"
              value={form.customerName}
              onChange={e => set('customerName', e.target.value)}
              placeholder="e.g. Reliance Industries, ABC Corp..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {/* Task type — 3 options */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Task Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button" onClick={() => set('taskType', 'PICKUP')}
                className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${form.taskType === 'PICKUP' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                📦 PICKUP
              </button>
              <button
                type="button" onClick={() => set('taskType', 'DELIVERY')}
                className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${form.taskType === 'DELIVERY' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                🚚 DELIVERY
              </button>
              <button
                type="button" onClick={() => set('taskType', 'BOTH')}
                className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${form.taskType === 'BOTH' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                🔄 BOTH
              </button>
            </div>
            {form.taskType === 'BOTH' && (
              <p className="text-[11px] text-purple-600 mt-1.5">Employee will pick up AND deliver at this task</p>
            )}
          </div>

          {/* Pickup Address — shown for PICKUP and BOTH */}
          {(form.taskType === 'PICKUP' || form.taskType === 'BOTH') && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                {form.taskType === 'BOTH' ? '📦 Pickup From' : 'Pickup Address'} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.origin}
                onChange={e => set('origin', e.target.value)}
                placeholder="Pickup location / address..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows={2}
              />
            </div>
          )}

          {/* Delivery Address — shown for DELIVERY and BOTH */}
          {(form.taskType === 'DELIVERY' || form.taskType === 'BOTH') && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                {form.taskType === 'BOTH' ? '🚚 Deliver To' : 'Delivery Address'} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.taskType === 'DELIVERY' ? form.origin : form.destination}
                onChange={e => form.taskType === 'DELIVERY' ? set('origin', e.target.value) : set('destination', e.target.value)}
                placeholder="Delivery location / address..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
                rows={2}
              />
            </div>
          )}

          {/* Courier & POD */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Courier</label>
              <select value={form.courierName} onChange={e => set('courierName', e.target.value)} className="w-full border border-gray-200 rounded-xl px-2.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                <option value="">Select...</option>
                {COURIER_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">POD Number</label>
              <input type="text" value={form.podNumber} onChange={e => set('podNumber', e.target.value)} placeholder="e.g. BD123456" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-mono" />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Priority</label>
            <div className="flex gap-2">
              {(['High', 'Medium', 'Low'] as const).map(p => (
                <button
                  key={p} type="button" onClick={() => set('priority', p)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${form.priority === p ? (p === 'High' ? 'border-red-400 bg-red-50 text-red-700' : p === 'Medium' ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-gray-300 bg-gray-50 text-gray-600') : 'border-gray-200 text-gray-400'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Notes</label>
            <input type="text" value={form.pickupNotes} onChange={e => set('pickupNotes', e.target.value)} placeholder="Special instructions..." className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
          </div>

          {/* Package Photo */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Package Photo</label>
            <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-200 rounded-xl p-3 hover:border-emerald-400 transition-colors">
              <Camera size={16} className="text-gray-400 shrink-0" />
              <span className="text-sm text-gray-500 truncate">{packagePhotoFile ? packagePhotoFile.name : 'Upload package photo'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            </label>
            {packagePhotoPreview && (
              <div className="relative mt-2 w-20">
                <img src={packagePhotoPreview} alt="Package" className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
                <button type="button" onClick={() => { setPackagePhotoFile(null); setPackagePhotoPreview(''); }} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <X size={10} />
                </button>
              </div>
            )}
          </div>

          {/* Porter toggle */}
          <div className="border border-orange-200 bg-orange-50 rounded-xl p-4">
            <label className="flex items-center gap-3 cursor-pointer" onClick={() => set('usePorter', !form.usePorter)}>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${form.usePorter ? 'bg-orange-500 border-orange-500' : 'border-gray-300 bg-white'}`}>
                {form.usePorter && <CheckCircle size={12} className="text-white" />}
              </div>
              <div>
                <div className="text-sm font-semibold text-orange-800">Porter Task</div>
                <div className="text-xs text-orange-600">Involves Porter platform</div>
              </div>
            </label>

            {form.usePorter && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => set('porterTaskType', 'collect')} className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${form.porterTaskType === 'collect' ? 'border-orange-400 bg-orange-100 text-orange-700' : 'border-gray-200 bg-white text-gray-500'}`}>Collect from Porter</button>
                  <button type="button" onClick={() => set('porterTaskType', 'send')} className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${form.porterTaskType === 'send' ? 'border-orange-400 bg-orange-100 text-orange-700' : 'border-gray-200 bg-white text-gray-500'}`}>Send via Porter</button>
                </div>
                <input type="text" value={form.porterBookingId} onChange={e => set('porterBookingId', e.target.value)} placeholder="Porter Booking ID" className="w-full border border-orange-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white" />
                <input type="text" value={form.porterTracking} onChange={e => set('porterTracking', e.target.value)} placeholder="Porter Tracking Number" className="w-full border border-orange-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white" />
                <input type="tel" value={form.porterContact} onChange={e => set('porterContact', e.target.value)} placeholder="Porter Contact Number" className="w-full border border-orange-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white" />
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 bg-[#0f3d20] text-white rounded-xl font-semibold text-sm hover:bg-emerald-900 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader size={14} className="animate-spin" /> Creating...</> : <><ClipboardList size={14} /> Assign Task</>}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Admin Dashboard ──────────────────────────────────────────────────────

export function AdminDashboard({ sessionUser, onLogout, onAddVehicle }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('employees');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [userMap, setUserMap] = useState<Record<string, { username: string }>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [editingEmp, setEditingEmp] = useState<(Driver & { username?: string }) | null>(null);
  const [showDispatch, setShowDispatch] = useState(false);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState('');
  const [empActivities, setEmpActivities] = useState<Record<string, ActivityLog[]>>({});
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [customerFilter, setCustomerFilter] = useState('');
  const [taskSearch, setTaskSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, v, t, a, s, u] = await Promise.all([
        fetch('/api/drivers').then(r => r.json()),
        fetch('/api/fleet').then(r => r.json()),
        fetch('/api/trips').then(r => r.json()),
        fetch('/api/activity').then(r => r.json()),
        fetch('/api/db-status').then(r => r.json()),
        fetch('/api/users').then(r => r.json()),
      ]);
      setDrivers(d.drivers || []);
      setVehicles(v.vehicles || []);
      setTrips(t.trips || []);
      setActivities(a.logs || []);
      setDbStatus(s);

      // Build driverId → username map for sync lookups
      const map: Record<string, { username: string }> = {};
      (u.users || []).forEach((user: any) => {
        if (user.driverId) map[user.driverId] = { username: user.username };
      });
      setUserMap(map);
    } catch (err) { console.error('Admin load error', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteEmployee(username: string, driverName: string) {
    if (!window.confirm(`Delete employee "${driverName}"? This cannot be undone.`)) return;
    try {
      await fetch(`/api/users/${username}`, { method: 'DELETE' });
      load();
    } catch (err) { console.error(err); }
  }

  async function loadEmpActivity(username: string) {
    if (!username) return;
    // Toggle close
    if (expandedActivity === username) { setExpandedActivity(null); return; }
    // Already cached — just show
    if (empActivities[username]) { setExpandedActivity(username); return; }
    // Fetch then show
    try {
      const res = await fetch(`/api/users/${username}/activity`);
      const data = await res.json();
      setEmpActivities(prev => ({ ...prev, [username]: data.logs || [] }));
      setExpandedActivity(username);
    } catch (err) { console.error('Activity fetch error:', err); }
  }

  const filteredDrivers = drivers.filter(d =>
    !search ||
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.employeeCode || '').toLowerCase().includes(search.toLowerCase()) ||
    (userMap[d.id]?.username || '').toLowerCase().includes(search.toLowerCase())
  );

  const pendingTrips = trips.filter(t => t.status !== 'Completed' && t.status !== 'Incomplete');
  const completedTrips = trips.filter(t => t.status === 'Completed');
  const incompleteTrips = trips.filter(t => t.status === 'Incomplete');

  // Customer filter helpers
  const allCustomers = [...new Set(trips.map(t => t.customerName).filter(Boolean))] as string[];

  const filteredActiveTasks = pendingTrips.filter(t => {
    if (customerFilter && t.customerName !== customerFilter) return false;
    if (taskSearch) {
      const q = taskSearch.toLowerCase();
      if (!t.origin.toLowerCase().includes(q) &&
          !(t.customerName || '').toLowerCase().includes(q) &&
          !(t.courierName || '').toLowerCase().includes(q) &&
          !(t.podNumber || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const filteredActivity = activities.filter(a =>
    !activityFilter ||
    a.userName.toLowerCase().includes(activityFilter.toLowerCase()) ||
    a.action.toLowerCase().includes(activityFilter.toLowerCase())
  );

  const stats = {
    totalEmployees: drivers.length,
    activeEmployees: drivers.filter(d => d.status === 'Active').length,
    pendingTasks: pendingTrips.length,
    completedToday: completedTrips.filter(t => new Date(t.lastUpdated).toDateString() === new Date().toDateString()).length,
    totalVehicles: vehicles.length,
    idleVehicles: vehicles.filter(v => v.status === 'Idle').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top Bar ── */}
      <div className="bg-[#0f3d20] text-white px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-sm leading-tight">Panchathan Admin</div>
            <div className="text-emerald-300 text-xs hidden sm:block">{sessionUser.fullName}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={load} className="p-2 hover:bg-white/10 rounded-xl transition-colors" title="Refresh">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={onLogout} className="p-2 hover:bg-white/10 rounded-xl transition-colors" title="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-6xl mx-auto">
          {[
            { label: 'Employees', value: stats.totalEmployees, sub: `${stats.activeEmployees} active`, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Pending Tasks', value: stats.pendingTasks, sub: 'in progress', color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Done Today', value: stats.completedToday, sub: 'completed', color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Vehicles', value: stats.totalVehicles, sub: `${stats.idleVehicles} idle`, color: 'text-slate-600', bg: 'bg-slate-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-2.5 sm:p-3 text-center`}>
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs font-semibold text-gray-700">{s.label}</div>
              <div className="text-[10px] text-gray-400">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="bg-white border-b border-gray-200 sticky top-[52px] sm:top-[60px] z-10">
        <div className="max-w-6xl mx-auto flex">
          {([
            { tab: 'employees', icon: <Users size={14} />, label: 'Employees' },
            { tab: 'vehicles',  icon: <Truck size={14} />, label: 'Vehicles' },
            { tab: 'tasks',     icon: <ClipboardList size={14} />, label: 'Tasks' },
            { tab: 'activity',  icon: <Activity size={14} />, label: 'Activity' },
          ] as { tab: Tab; icon: React.ReactNode; label: string }[]).map(item => (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] sm:text-xs font-semibold border-b-2 transition-all ${activeTab === item.tab ? 'border-[#0f3d20] text-[#0f3d20]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              {item.icon}{item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 sm:p-4 max-w-6xl mx-auto">

        {/* ══════════════ EMPLOYEES TAB ══════════════ */}
        {activeTab === 'employees' && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, code or username..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <button
                onClick={() => setShowAddEmp(true)}
                className="flex items-center gap-1.5 bg-[#0f3d20] text-white px-3 sm:px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-900 active:scale-95 transition-all whitespace-nowrap shrink-0"
              >
                <Plus size={14} /> <span className="hidden sm:inline">Add Employee</span><span className="sm:hidden">Add</span>
              </button>
            </div>

            {loading ? (
              <div className="text-center py-16"><Loader size={28} className="animate-spin text-emerald-600 mx-auto" /></div>
            ) : filteredDrivers.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Users size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No employees found.</p>
                <button onClick={() => setShowAddEmp(true)} className="mt-3 text-sm text-emerald-600 font-semibold underline">Add first employee →</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {filteredDrivers.map(driver => {
                  const empUsername = userMap[driver.id]?.username;
                  const driverTrips = trips.filter(t => t.driverId === driver.id || t.coPassengerId === driver.id);
                  const pendingCount = driverTrips.filter(t => t.taskStage === 'Upcoming' || t.taskStage === 'Ongoing').length;
                  const completedCount = driverTrips.filter(t => t.status === 'Completed').length;
                  const isDetailExpanded = expandedEmployee === driver.id;
                  const isActivityExpanded = !!empUsername && expandedActivity === empUsername;

                  return (
                    <div key={driver.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                      {/* Card header */}
                      <div className="flex items-start gap-3 p-4">
                        <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg shrink-0">
                          {driver.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900">{driver.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-1 items-center">
                            <span className="font-mono">{driver.employeeCode || driver.id}</span>
                            {driver.phone && <span>· <Phone size={9} className="inline" /> {driver.phone}</span>}
                            {empUsername && <span className="text-emerald-600 font-semibold">@{empUsername}</span>}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <StatusBadge status={driver.status} small />
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{driver.region}</span>
                            {pendingCount > 0 && (
                              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">
                                {pendingCount} pending
                              </span>
                            )}
                            {completedCount > 0 && (
                              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                                {completedCount} done
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            title="View details"
                            onClick={() => setExpandedEmployee(isDetailExpanded ? null : driver.id)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            {isDetailExpanded ? <ChevronUp size={14} /> : <Eye size={14} />}
                          </button>
                          <button
                            title="Edit"
                            onClick={() => setEditingEmp({ ...driver, username: empUsername })}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            title="Delete"
                            onClick={() => { if (empUsername) deleteEmployee(empUsername, driver.name); else alert('No login account linked to this employee.'); }}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Full details expand */}
                      {isDetailExpanded && (
                        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                            <div>
                              <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">License</div>
                              <div className="text-xs font-mono font-semibold text-gray-700 mt-0.5">{driver.licenseNumber || '—'}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Experience</div>
                              <div className="text-xs font-semibold text-gray-700 mt-0.5">{driver.experienceYears || 0} yrs</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Emergency Contact</div>
                              <div className="text-xs font-semibold text-gray-700 mt-0.5">{driver.emergencyContact || '—'}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Rating</div>
                              <div className="text-xs font-semibold text-gray-700 mt-0.5 flex items-center gap-1">
                                <Star size={11} className="text-amber-400" />
                                {(driver.rating || 5).toFixed(1)}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Total Trips</div>
                              <div className="text-xs font-semibold text-gray-700 mt-0.5">{driver.totalTrips || 0}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">On-time Rate</div>
                              <div className="text-xs font-semibold text-gray-700 mt-0.5">{(driver.onTimeRate || 100).toFixed(0)}%</div>
                            </div>
                            {driver.address && (
                              <div className="col-span-2">
                                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Address</div>
                                <div className="text-xs text-gray-700 mt-0.5">{driver.address}</div>
                              </div>
                            )}
                          </div>

                          {/* Tasks assigned to employee */}
                          {driverTrips.length > 0 && (
                            <div className="pt-2 border-t border-gray-100">
                              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Assigned Tasks ({driverTrips.length})</div>
                              <div className="space-y-1.5">
                                {driverTrips.slice(0, 6).map(trip => (
                                  <div key={trip.id} className="flex items-center justify-between gap-2 text-xs bg-gray-50 rounded-lg px-2.5 py-1.5">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${trip.taskType === 'DELIVERY' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {trip.taskType || 'PICKUP'}
                                      </span>
                                      {trip.customerName && (
                                        <span className="text-purple-600 font-medium shrink-0">{trip.customerName}</span>
                                      )}
                                      <span className="text-gray-600 truncate">{trip.origin}</span>
                                    </div>
                                    <StatusBadge status={trip.taskStage || trip.status} small />
                                  </div>
                                ))}
                                {driverTrips.length > 6 && (
                                  <div className="text-[10px] text-gray-400 text-center">+{driverTrips.length - 6} more tasks</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Activity log button */}
                      <button
                        onClick={() => { if (empUsername) loadEmpActivity(empUsername); }}
                        disabled={!empUsername}
                        className="w-full flex items-center justify-between px-4 py-2 border-t border-gray-100 text-xs text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <span className="font-medium flex items-center gap-1.5">
                          <Activity size={12} />
                          Activity Log
                          {!empUsername && <span className="text-amber-500 text-[9px]">(no account)</span>}
                        </span>
                        {isActivityExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>

                      {/* Activity log content — FIXED: compare directly by username */}
                      {isActivityExpanded && empUsername && empActivities[empUsername] && (
                        <div className="px-4 pb-3 border-t border-gray-100">
                          {empActivities[empUsername].length === 0 ? (
                            <p className="text-xs text-gray-400 py-2 text-center">No activity recorded yet.</p>
                          ) : (
                            <div className="space-y-1.5 mt-2">
                              {empActivities[empUsername].slice(0, 8).map(log => (
                                <div key={log.id} className="flex gap-2 text-xs">
                                  <span className="text-gray-300 shrink-0 mt-0.5 w-28">
                                    {new Date(log.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <span className="text-gray-600 flex-1">{log.action}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ VEHICLES TAB ══════════════ */}
        {activeTab === 'vehicles' && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={onAddVehicle}
                className="flex items-center gap-1.5 bg-[#0f3d20] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-900 active:scale-95 transition-all"
              >
                <Plus size={15} /> Add Vehicle
              </button>
            </div>

            {vehicles.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Truck size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No vehicles registered.</p>
                <button onClick={onAddVehicle} className="mt-3 text-sm text-emerald-600 font-semibold underline">Register first vehicle →</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {vehicles.map(v => {
                  const kmLeft = (v.serviceDueKm || 0) - (v.odometerKm || 0);
                  const docsUploaded = Object.values(v.documents).filter((d: any) => d.status === 'UPLOADED').length;
                  return (
                    <div key={v.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-bold text-gray-900 text-base">{v.plate}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{v.make} {v.model}</div>
                          <div className="text-[10px] text-gray-400">{v.vehicleType} · {v.homeBase}</div>
                        </div>
                        <StatusBadge status={v.status} />
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center mb-3">
                        <div className="bg-gray-50 rounded-xl p-2">
                          <div className="text-sm font-bold text-gray-700">{(v.odometerKm || 0).toLocaleString()}</div>
                          <div className="text-[10px] text-gray-400">km odo</div>
                        </div>
                        <div className={`rounded-xl p-2 ${kmLeft <= 500 ? 'bg-red-50' : 'bg-gray-50'}`}>
                          <div className={`text-sm font-bold ${kmLeft <= 500 ? 'text-red-600' : 'text-gray-700'}`}>{kmLeft.toLocaleString()}</div>
                          <div className="text-[10px] text-gray-400">to service</div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-2">
                          <div className="text-sm font-bold text-gray-700">{v.completeness}%</div>
                          <div className="text-[10px] text-gray-400">docs</div>
                        </div>
                      </div>

                      <div className="flex gap-1">
                        {Object.entries(v.documents).map(([key, doc]: [string, any]) => (
                          <div key={key} title={key.replace(/([A-Z])/g, ' $1').trim()} className={`flex-1 h-1.5 rounded-full ${doc.status === 'UPLOADED' ? 'bg-green-500' : 'bg-gray-200'}`} />
                        ))}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1">Documents: {docsUploaded}/4 uploaded</div>

                      {v.insuranceExpiry && (
                        <div className="text-[10px] text-gray-400 mt-1">Insurance: {v.insuranceExpiry}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ TASKS TAB ══════════════ */}
        {activeTab === 'tasks' && (
          <div>
            {/* Top controls */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="flex-1 relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks by address, customer, courier..."
                  value={taskSearch}
                  onChange={e => setTaskSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <button
                onClick={() => setShowDispatch(true)}
                className="flex items-center gap-1.5 bg-[#0f3d20] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-900 active:scale-95 transition-all whitespace-nowrap shrink-0"
              >
                <Plus size={14} /> Assign Task
              </button>
            </div>

            {/* Customer / Company filter chips */}
            {allCustomers.length > 0 && (
              <div className="flex gap-2 mb-4 flex-wrap">
                <button
                  onClick={() => setCustomerFilter('')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${!customerFilter ? 'bg-[#0f3d20] text-white border-[#0f3d20]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
                >
                  All
                </button>
                {allCustomers.map(c => (
                  <button
                    key={c}
                    onClick={() => setCustomerFilter(customerFilter === c ? '' : c)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${customerFilter === c ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'}`}
                  >
                    <Building2 size={10} /> {c}
                  </button>
                ))}
              </div>
            )}

            {/* Active tasks */}
            {filteredActiveTasks.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-amber-500 rounded-full inline-block" />
                  Active Tasks ({filteredActiveTasks.length})
                </h3>
                <div className="space-y-2">
                  {filteredActiveTasks.map(trip => {
                    const driver = drivers.find(d => d.id === trip.driverId);
                    const isExpanded = expandedTrip === trip.id;
                    return (
                      <div key={trip.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <button className="w-full text-left p-4" onClick={() => setExpandedTrip(isExpanded ? null : trip.id)}>
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex gap-1.5 items-center mb-1 flex-wrap">
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                  trip.taskType === 'DELIVERY' ? 'bg-green-100 text-green-700' :
                                  trip.taskType === 'BOTH'     ? 'bg-purple-100 text-purple-700' :
                                                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {trip.taskType === 'BOTH' ? 'P+D' : trip.taskType || 'PICKUP'}
                                </span>
                                {trip.porter?.enabled && (
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">PORTER</span>
                                )}
                                <StatusBadge status={trip.taskStage || trip.status} small />
                                <span className={`text-[10px] font-semibold ${trip.priority === 'High' ? 'text-red-600' : trip.priority === 'Medium' ? 'text-amber-600' : 'text-gray-500'}`}>
                                  {trip.priority}
                                </span>
                              </div>
                              {trip.customerName && (
                                <div className="flex items-center gap-1 mb-1">
                                  <Building2 size={10} className="text-purple-500 shrink-0" />
                                  <span className="text-xs font-semibold text-purple-600">{trip.customerName}</span>
                                </div>
                              )}
                              <div className="text-sm font-medium text-gray-800 truncate">{trip.origin}</div>
                              {driver && <div className="text-xs text-emerald-600 mt-0.5 font-medium">→ {driver.name}</div>}
                              {(trip.courierName || trip.podNumber) && (
                                <div className="text-xs text-gray-400 mt-0.5">
                                  {trip.courierName}{trip.podNumber ? ` #${trip.podNumber}` : ''}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 items-center shrink-0">
                              {trip.packagePhoto && (
                                <img
                                  src={trip.packagePhoto.filePath ? `/${trip.packagePhoto.filePath.replace(/\\/g, '/')}` : trip.packagePhoto.dataUrl}
                                  alt="pkg"
                                  className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                                />
                              )}
                              <ChevronRight size={15} className={`text-gray-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </div>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-3">
                            {trip.porter?.enabled && (
                              <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 text-xs space-y-1">
                                <div className="font-bold text-orange-700 text-xs mb-1">
                                  Porter: {trip.porter.porterTaskType === 'collect' ? 'Collect from Porter' : 'Send via Porter'}
                                </div>
                                {trip.porter.bookingId && <div><span className="text-gray-500">Booking: </span><span className="font-mono font-semibold">{trip.porter.bookingId}</span></div>}
                                {trip.porter.trackingNumber && <div><span className="text-gray-500">Tracking: </span><span className="font-mono font-semibold">{trip.porter.trackingNumber}</span></div>}
                                {trip.porter.contactNumber && <div><span className="text-gray-500">Contact: </span><a href={`tel:${trip.porter.contactNumber}`} className="font-semibold text-orange-700">{trip.porter.contactNumber}</a></div>}
                              </div>
                            )}
                            {trip.pickupNotes && (
                              <div className="text-xs text-gray-600 bg-gray-50 rounded-xl p-2.5">{trip.pickupNotes}</div>
                            )}
                            {(trip.proofPhotos || []).length > 0 && (
                              <div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Proof Photos</div>
                                <div className="flex gap-2 flex-wrap">
                                  {trip.proofPhotos!.map((p, i) => {
                                    const src = p.filePath ? `/${p.filePath.replace(/\\/g, '/')}` : p.dataUrl;
                                    return (
                                      <div key={i} className="relative">
                                        <img src={src} alt={p.kind} className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                                        <span className={`absolute -bottom-0.5 left-0 right-0 text-center text-[8px] font-bold rounded-b-lg pb-0.5 ${p.kind === 'PICKUP' ? 'bg-blue-600/90 text-white' : 'bg-green-600/90 text-white'}`}>
                                          {p.kind}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            {trip.remark && (
                              <div className="bg-red-50 border border-red-100 rounded-xl p-2.5 text-xs text-red-700">
                                <span className="font-bold">Remark: </span>{trip.remark}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completed tasks */}
            {completedTrips.length > 0 && !customerFilter && (
              <div className="mb-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
                  Completed ({completedTrips.length})
                </h3>
                <div className="space-y-1.5">
                  {completedTrips.map(trip => {
                    const driver = drivers.find(d => d.id === trip.driverId);
                    return (
                      <div key={trip.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                        <CheckCircle size={15} className="text-green-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          {trip.customerName && (
                            <div className="text-[10px] font-semibold text-purple-600 mb-0.5">{trip.customerName}</div>
                          )}
                          <div className="text-sm font-medium text-gray-700 truncate">{trip.origin}</div>
                          <div className="text-xs text-gray-400">{driver?.name} · {trip.taskType}</div>
                        </div>
                        <div className="text-xs text-gray-400 shrink-0">
                          {new Date(trip.lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Incomplete tasks */}
            {incompleteTrips.length > 0 && !customerFilter && (
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-red-500 rounded-full inline-block" />
                  Incomplete ({incompleteTrips.length})
                </h3>
                <div className="space-y-1.5">
                  {incompleteTrips.map(trip => {
                    const driver = drivers.find(d => d.id === trip.driverId);
                    return (
                      <div key={trip.id} className="bg-white rounded-xl border border-red-100 p-3 flex items-center gap-3">
                        <AlertCircle size={15} className="text-red-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          {trip.customerName && (
                            <div className="text-[10px] font-semibold text-purple-600 mb-0.5">{trip.customerName}</div>
                          )}
                          <div className="text-sm font-medium text-gray-700 truncate">{trip.origin}</div>
                          <div className="text-xs text-gray-400">{driver?.name}</div>
                          {trip.remark && <div className="text-xs text-red-600 mt-0.5 italic">"{trip.remark}"</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {trips.length === 0 && !loading && (
              <div className="text-center py-16 text-gray-400">
                <ClipboardList size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No tasks assigned yet.</p>
                <button onClick={() => setShowDispatch(true)} className="mt-3 text-sm text-emerald-600 font-semibold underline">Assign first task →</button>
              </div>
            )}

            {filteredActiveTasks.length === 0 && (taskSearch || customerFilter) && (
              <div className="text-center py-8 text-gray-400">
                <Filter size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No tasks match the current filter.</p>
                <button onClick={() => { setCustomerFilter(''); setTaskSearch(''); }} className="mt-2 text-xs text-emerald-600 font-semibold underline">Clear filters</button>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ ACTIVITY TAB ══════════════ */}
        {activeTab === 'activity' && (
          <div>
            <div className="mb-4">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter by name or action..."
                  value={activityFilter}
                  onChange={e => setActivityFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>

            {/* DB status pill */}
            {dbStatus && (
              <div className={`flex items-center gap-2 text-xs p-3 rounded-xl mb-4 ${dbStatus.connected ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                <div className={`w-2 h-2 rounded-full shrink-0 ${dbStatus.connected ? 'bg-green-500' : 'bg-amber-500'}`} />
                {dbStatus.connected ? 'MongoDB connected' : 'Using local flat-file storage'}
              </div>
            )}

            {filteredActivity.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Activity size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No activity logged yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredActivity.slice(0, 100).map(log => (
                  <div key={log.id} className="bg-white rounded-xl border border-gray-100 p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {(log.userName || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                          <span className="text-xs font-semibold text-gray-700">{log.userName}</span>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {new Date(log.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5 leading-relaxed">{log.action}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredActivity.length > 100 && (
                  <div className="text-center text-xs text-gray-400 py-2">Showing 100 of {filteredActivity.length} entries</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showAddEmp && (
        <EmployeeFormModal mode="add" onClose={() => setShowAddEmp(false)} onSaved={load} />
      )}
      {editingEmp && (
        <EmployeeFormModal
          mode="edit"
          initial={{
            id: editingEmp.id,
            name: editingEmp.name,
            username: editingEmp.username,
            phone: editingEmp.phone,
            employeeCode: editingEmp.employeeCode,
            region: editingEmp.region,
            licenseNumber: editingEmp.licenseNumber,
            emergencyContact: editingEmp.emergencyContact,
          }}
          onClose={() => setEditingEmp(null)}
          onSaved={load}
        />
      )}
      {showDispatch && (
        <TaskDispatchModal drivers={drivers} onClose={() => setShowDispatch(false)} onSaved={load} />
      )}
    </div>
  );
}
