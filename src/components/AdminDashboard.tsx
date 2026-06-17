import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Truck, ClipboardList, Activity, Plus, Search, Edit, Trash2, X, Save,
  CheckCircle, AlertCircle, Package, LogOut, RefreshCw,
  ChevronDown, ChevronRight, ChevronUp, Eye, Camera, Loader, Shield,
  Building2, Star, Award, Filter, Phone, MapPin, Clock, Download,
  Calendar, ChevronLeft, CalendarDays
} from 'lucide-react';
import { User as UserType, Vehicle, Driver, Trip, ActivityLog, WorkDay } from '../types';

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

const DESIGNATIONS = [
  'Executive', 'Senior Executive', 'Delivery Associate', 'Senior Delivery Associate',
  'Field Agent', 'Team Lead', 'Supervisor', 'Driver', 'Coordinator', 'Other'
];

interface EmpForm {
  name: string; username: string; password: string; phone: string;
  employeeCode: string; city: string; state: string; licenseNumber: string;
  emergencyContact: string; designation: string;
  shiftStart: string; shiftEnd: string;
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
    city: initial?.city || '',
    state: initial?.state || '',
    licenseNumber: initial?.licenseNumber || '',
    emergencyContact: initial?.emergencyContact || '',
    designation: (initial as any)?.designation || '',
    shiftStart:  (initial as any)?.shiftStart  || '09:30',
    shiftEnd:    (initial as any)?.shiftEnd    || '19:00',
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
          body: JSON.stringify({ name: form.name, phone: form.phone, emergencyContact: form.emergencyContact, city: form.city, state: form.state, licenseNumber: form.licenseNumber, designation: form.designation, shiftStart: form.shiftStart, shiftEnd: form.shiftEnd, operatorName: 'Admin' }),
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
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Full Name <span className="text-red-500">*</span></label>
              <input type="text" value={form.name} onChange={e => set('name', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="Employee full name" autoComplete="off" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Designation <span className="text-red-500">*</span></label>
              <select value={form.designation} onChange={e => set('designation', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white">
                <option value="">Select designation…</option>
                {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Shift Start</label>
              <input type="time" value={form.shiftStart} onChange={e => set('shiftStart', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Shift End</label>
              <input type="time" value={form.shiftEnd} onChange={e => set('shiftEnd', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Username <span className="text-red-500">*</span></label>
              <input type="text" value={form.username} onChange={e => set('username', e.target.value)} disabled={mode === 'edit'} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:bg-gray-50 disabled:text-gray-400" placeholder="e.g. john.kumar" autoComplete="off" name="emp-username" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">
                {mode === 'edit' ? 'New Password (blank = keep)' : 'Password'} {mode === 'add' && <span className="text-red-500">*</span>}
              </label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder={mode === 'edit' ? 'Leave blank to keep current' : 'Set a password'} autoComplete="new-password" name="emp-password" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="+91 9876543210" autoComplete="off" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Emergency Contact</label>
              <input type="tel" value={form.emergencyContact} onChange={e => set('emergencyContact', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="+91 9876543210" autoComplete="off" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Employee Code</label>
              <input type="text" value={form.employeeCode} onChange={e => set('employeeCode', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="EMP-001" autoComplete="off" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">City</label>
              <input type="text" value={form.city} onChange={e => set('city', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="e.g. Chennai" autoComplete="off" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">State</label>
              <input type="text" value={form.state} onChange={e => set('state', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" placeholder="e.g. Tamil Nadu" autoComplete="off" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-600 block mb-1">License Number</label>
              <input type="text" value={form.licenseNumber} onChange={e => set('licenseNumber', e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-mono" placeholder="TN0120240012345" autoComplete="off" />
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
              {drivers.map(d => <option key={d.id} value={d.id}>{d.fullName} ({d.employeeCode || d.id})</option>)}
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
  const [activityFilter, setActivityFilter] = useState('');
  const [empActivities, setEmpActivities] = useState<Record<string, ActivityLog[]>>({});
  const [attendanceHistory, setAttendanceHistory] = useState<Record<string, WorkDay[]>>({});
  const [attendanceMonth, setAttendanceMonth] = useState<Record<string, { year: number; month: number }>>({});
  // Single open panel across all employee cards — prevents multiple sections opening at once
  const [openPanel, setOpenPanel] = useState<{ id: string; type: 'detail' | 'activity' | 'attendance' } | null>(null);
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [customerFilter, setCustomerFilter] = useState('');
  const [taskSearch, setTaskSearch] = useState('');
  const [taskDateFilter, setTaskDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [reassigningTripId, setReassigningTripId] = useState<string | null>(null);
  const [reassignTo, setReassignTo] = useState('');
  const [lightbox, setLightbox] = useState<{ src: string; fileName: string } | null>(null);

  function openPhoto(src: string, fileName = 'photo.jpg') {
    if (src) setLightbox({ src, fileName });
  }
  function downloadPhoto(src: string, fileName = 'photo.jpg') {
    const a = document.createElement('a');
    a.href = src;
    a.download = fileName;
    a.click();
  }

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

  async function loadEmpActivity(driverId: string, username: string) {
    if (!username) return;
    // Toggle close
    if (openPanel?.id === driverId && openPanel.type === 'activity') { setOpenPanel(null); return; }
    // Fetch (always refresh — don't serve stale cache)
    try {
      const res = await fetch(`/api/users/${username}/activity`);
      const data = await res.json();
      setEmpActivities(prev => ({ ...prev, [username]: data.logs || [] }));
      setOpenPanel({ id: driverId, type: 'activity' });
    } catch (err) { console.error('Activity fetch error:', err); }
  }

  async function loadAttendance(driverId: string, userId: string) {
    if (!userId) return;
    if (openPanel?.id === driverId && openPanel.type === 'attendance') { setOpenPanel(null); return; }
    try {
      const res = await fetch(`/api/workday/history/${userId}?limit=90`);
      const data = await res.json();
      setAttendanceHistory(prev => ({ ...prev, [userId]: data.history || [] }));
      const now = new Date();
      setAttendanceMonth(prev => ({ ...prev, [userId]: prev[userId] || { year: now.getFullYear(), month: now.getMonth() } }));
      setOpenPanel({ id: driverId, type: 'attendance' });
    } catch (err) { console.error('Attendance fetch error:', err); }
  }

  async function reassignTrip(tripId: string, newDriverId: string) {
    if (!newDriverId) return;
    try {
      await fetch(`/api/trips/${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: newDriverId, status: 'Saved Draft', taskStage: 'Upcoming', operatorName: 'Admin' }),
      });
      setReassigningTripId(null);
      setReassignTo('');
      load();
    } catch (err) { console.error('Reassign error', err); }
  }

  const filteredDrivers = drivers.filter(d =>
    !search ||
    (d.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.employeeCode || '').toLowerCase().includes(search.toLowerCase()) ||
    (userMap[d.id]?.username || '').toLowerCase().includes(search.toLowerCase())
  );

  const todayStr = new Date().toISOString().slice(0, 10);

  const pendingTrips = trips.filter(t => t.status !== 'Completed');
  const completedTrips = trips.filter(t => t.status === 'Completed' && inDateRange(t.lastUpdated));
  const incompleteTrips = trips.filter(t => t.status === 'Incomplete');

  // Today's stats
  const completedToday = completedTrips.filter(t => t.lastUpdated.startsWith(todayStr));
  const pickupsDoneToday = completedToday.filter(t => t.taskType === 'PICKUP' || t.taskType === 'BOTH').length;
  const deliveriesDoneToday = completedToday.filter(t => t.taskType === 'DELIVERY' || t.taskType === 'BOTH').length;
  const pendingPickups = pendingTrips.filter(t => t.taskType === 'PICKUP' || t.taskType === 'BOTH').length;
  const pendingDeliveries = pendingTrips.filter(t => t.taskType === 'DELIVERY' || t.taskType === 'BOTH').length;

  // Per-employee pending breakdown
  const pendingByEmployee = drivers.map(d => ({
    driver: d,
    tasks: pendingTrips.filter(t => t.driverId === d.id),
  })).filter(e => e.tasks.length > 0);

  // Customer filter helpers
  const allCustomers = [...new Set(trips.map(t => t.customerName).filter(Boolean))] as string[];

  function inDateRange(iso: string) {
    if (taskDateFilter === 'all') return true;
    const d = new Date(iso);
    const now = new Date();
    if (taskDateFilter === 'today') return d.toDateString() === now.toDateString();
    const cutoff = new Date(now);
    if (taskDateFilter === 'week') cutoff.setDate(now.getDate() - 7);
    else cutoff.setMonth(now.getMonth() - 1);
    return d >= cutoff;
  }

  // Active Tasks = everything not Completed (Incomplete shows here too, styled red + reassignable)
  const filteredActiveTasks = trips.filter(t => {
    if (t.status === 'Completed') return false;
    if (!inDateRange(t.lastUpdated)) return false;
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
      <div className="bg-white border-b border-gray-200 px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <img
            src="https://panchathanlogistics.com/logo.png"
            alt="Panchathan Logistics"
            className="h-12 sm:h-14 w-auto object-contain"
          />
          <div className="hidden sm:block border-l-2 border-[#0f3d20]/20 pl-4">
            <div className="text-gray-800 font-bold text-base leading-tight">{sessionUser.fullName}</div>
            <div className="text-[#0f3d20] text-sm font-medium">Administrator</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2.5 text-gray-500 hover:text-[#0f3d20] hover:bg-emerald-50 rounded-xl transition-colors" title="Refresh">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-gray-200">
            <LogOut size={18} /> <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-8 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-6xl mx-auto">
          {[
            { label: 'Employees', value: stats.totalEmployees, sub: `${stats.activeEmployees} active`, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Pending Tasks', value: stats.pendingTasks, sub: 'in progress', color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Done Today', value: stats.completedToday, sub: 'completed', color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Vehicles', value: stats.totalVehicles, sub: `${stats.idleVehicles} idle`, color: 'text-slate-600', bg: 'bg-slate-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-3 sm:p-4 text-center`}>
              <div className={`text-3xl sm:text-4xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-sm font-semibold text-gray-700 mt-0.5">{s.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="bg-white border-b border-gray-200 sticky top-[64px] sm:top-[68px] z-10">
        <div className="max-w-6xl mx-auto flex">
          {([
            { tab: 'employees', icon: <Users size={18} />, label: 'Employees' },
            { tab: 'vehicles',  icon: <Truck size={18} />, label: 'Vehicles' },
            { tab: 'tasks',     icon: <ClipboardList size={18} />, label: 'Tasks' },
            { tab: 'activity',  icon: <Activity size={18} />, label: 'Activity' },
          ] as { tab: Tab; icon: React.ReactNode; label: string }[]).map(item => (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${activeTab === item.tab ? 'border-[#0f3d20] text-[#0f3d20]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              {item.icon}<span className="hidden sm:inline">{item.label}</span><span className="sm:hidden">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-6xl mx-auto">

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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
                {filteredDrivers.map(driver => {
                  const empUsername = userMap[driver.id]?.username;
                  const driverTrips = trips.filter(t => t.driverId === driver.id || t.coPassengerId === driver.id);
                  const pendingCount = driverTrips.filter(t => t.taskStage === 'Upcoming' || t.taskStage === 'Ongoing').length;
                  const completedCount = driverTrips.filter(t => t.status === 'Completed').length;
                  const isDetailExpanded = openPanel?.id === driver.id && openPanel.type === 'detail';
                  const isActivityExpanded = !!empUsername && openPanel?.id === driver.id && openPanel.type === 'activity';
                  const isAttendanceExpanded = openPanel?.id === driver.id && openPanel.type === 'attendance';

                  const isAnyPanelOpen = openPanel?.id === driver.id;

                  return (
                    <div key={driver.id} className={`bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-200 ${isAnyPanelOpen ? 'border-2 border-emerald-400 shadow-emerald-100 shadow-md' : 'border border-gray-100'}`}>

                      {/* Card header */}
                      <div className="flex items-start gap-3 p-4">
                        <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg shrink-0">
                          {(driver.fullName || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900">{driver.fullName}</div>
                          <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-1 items-center">
                            <span className="font-mono">{driver.employeeCode || driver.id}</span>
                            {driver.phone && <span>· <Phone size={9} className="inline" /> {driver.phone}</span>}
                            {empUsername && <span className="text-emerald-600 font-semibold">@{empUsername}</span>}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {driver.designation && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                                {driver.designation}
                              </span>
                            )}
                            <StatusBadge status={driver.status} small />
                            {(driver.city || driver.state) && (
                              <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                                {[driver.city, driver.state].filter(Boolean).join(', ')}
                              </span>
                            )}
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
                            onClick={() => setOpenPanel(isDetailExpanded ? null : { id: driver.id, type: 'detail' })}
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
                            onClick={() => { if (empUsername) deleteEmployee(empUsername, driver.fullName); else alert('No login account linked to this employee.'); }}
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
                              <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Shift Hours</div>
                              <div className="text-xs font-semibold text-gray-700 mt-0.5 flex items-center gap-1">
                                <Clock size={10} className="text-emerald-600" />
                                {driver.shiftStart || '09:30'} – {driver.shiftEnd || '19:00'}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">License</div>
                              <div className="text-xs font-mono font-semibold text-gray-700 mt-0.5">{driver.licenseNumber || '—'}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">City</div>
                              <div className="text-xs font-semibold text-gray-700 mt-0.5">{[driver.city, driver.state].filter(Boolean).join(', ') || '—'}</div>
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

                      {/* Bottom action bar — Activity Log | Attendance */}
                      <div className="flex border-t border-gray-100">
                        <button
                          onClick={() => { if (empUsername) loadEmpActivity(driver.id, empUsername); }}
                          disabled={!empUsername}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-r border-gray-100"
                        >
                          <Activity size={12} />
                          <span className="font-medium">Activity Log</span>
                          {isActivityExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        </button>
                        <button
                          onClick={() => loadAttendance(driver.id, driver.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
                        >
                          <CalendarDays size={12} />
                          <span className="font-medium">Attendance</span>
                          {isAttendanceExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        </button>
                      </div>

                      {/* Activity log content */}
                      {isActivityExpanded && empUsername && (
                        <div className="border-t border-gray-100">
                          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border-b border-emerald-100">
                            <div className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {(driver.fullName || '?').charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-emerald-800">{driver.fullName}'s Activity Log</span>
                          </div>
                          <div className="px-4 pb-3">
                          {!empActivities[empUsername] ? (
                            <p className="text-xs text-gray-400 py-3 text-center">Loading…</p>
                          ) : empActivities[empUsername].length === 0 ? (
                            <p className="text-xs text-gray-400 py-3 text-center">No activity recorded yet. Activity will appear after the employee logs in or takes actions.</p>
                          ) : (
                            <div className="space-y-1.5 mt-2 max-h-48 overflow-y-auto">
                              {empActivities[empUsername].map(log => {
                                const isLogin = log.action.toLowerCase().includes('logged in');
                                const isLate = (() => {
                                  if (!isLogin) return false;
                                  const t = new Date(log.timestamp);
                                  const [sh, sm] = (driver.shiftStart || '09:30').split(':').map(Number);
                                  return t.getHours() > sh || (t.getHours() === sh && t.getMinutes() > sm);
                                })();
                                return (
                                  <div key={log.id} className="flex gap-2 text-xs items-start">
                                    <span className="text-gray-300 shrink-0 mt-0.5 w-28">
                                      {new Date(log.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className={`flex-1 ${isLogin && isLate ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                      {log.action}
                                      {isLogin && isLate && <span className="ml-1 text-[9px] bg-red-100 text-red-600 px-1 py-0.5 rounded font-bold">LATE</span>}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          </div>
                        </div>
                      )}

                      {/* Attendance calendar */}
                      {isAttendanceExpanded && (() => {
                        const userId = driver.id;
                        const wds: WorkDay[] = attendanceHistory[userId] || [];
                        const cur = attendanceMonth[userId] || { year: new Date().getFullYear(), month: new Date().getMonth() };
                        const { year, month } = cur;
                        const wdMap: Record<string, WorkDay> = {};
                        wds.forEach(w => { wdMap[w.date] = w; });

                        const [sh, sm] = (driver.shiftStart || '09:30').split(':').map(Number);
                        function getLateMinutes(wd: WorkDay): number {
                          const start = new Date(wd.startTime);
                          return (start.getHours() - sh) * 60 + (start.getMinutes() - sm);
                        }
                        function getDayStatus(wd: WorkDay | undefined): 'present' | 'late' | 'very-late' | 'absent' {
                          if (!wd) return 'absent';
                          const late = getLateMinutes(wd);
                          if (late <= 0) return 'present';
                          if (late <= 30) return 'late';
                          return 'very-late';
                        }

                        const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        const today = new Date().toISOString().slice(0, 10);
                        const monthName = new Date(year, month).toLocaleString('en-IN', { month: 'long', year: 'numeric' });

                        // Stats for this month
                        let present = 0, late = 0, veryLate = 0;
                        for (let d = 1; d <= daysInMonth; d++) {
                          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                          if (dateStr > today) continue;
                          const dayOfWeek = new Date(year, month, d).getDay();
                          if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends
                          const s = getDayStatus(wdMap[dateStr]);
                          if (s === 'present') present++;
                          else if (s === 'late') late++;
                          else if (s === 'very-late') { late++; veryLate++; }
                        }

                        const cells: (number | null)[] = [];
                        for (let i = 0; i < firstDay; i++) cells.push(null);
                        for (let d = 1; d <= daysInMonth; d++) cells.push(d);

                        return (
                          <div className="border-t border-gray-100 bg-gray-50/50">
                            {/* Header with employee name */}
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border-b border-emerald-100">
                              <div className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                                {(driver.fullName || '?').charAt(0).toUpperCase()}
                              </div>
                              <span className="text-xs font-bold text-emerald-800">{driver.fullName}'s Attendance</span>
                              <span className="ml-auto text-[10px] text-emerald-600">Shift: {driver.shiftStart || '09:30'} – {driver.shiftEnd || '19:00'}</span>
                            </div>
                            {/* Month nav */}
                            <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-100">
                              <button
                                onClick={() => {
                                  const prev = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
                                  setAttendanceMonth(p => ({ ...p, [userId]: prev }));
                                }}
                                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
                              ><ChevronLeft size={15} /></button>
                              <span className="text-xs font-bold text-gray-700">{monthName}</span>
                              <button
                                onClick={() => {
                                  const next = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
                                  setAttendanceMonth(p => ({ ...p, [userId]: next }));
                                }}
                                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
                              ><ChevronRight size={15} /></button>
                            </div>

                            {/* Stats pills */}
                            <div className="flex gap-2 px-4 py-2">
                              <span className="flex-1 text-center bg-emerald-50 text-emerald-700 rounded-lg py-1 text-[10px] font-bold">
                                <span className="block text-sm leading-none">{present}</span>Present
                              </span>
                              <span className="flex-1 text-center bg-amber-50 text-amber-700 rounded-lg py-1 text-[10px] font-bold">
                                <span className="block text-sm leading-none">{late}</span>Late
                              </span>
                              <span className="flex-1 text-center bg-red-50 text-red-700 rounded-lg py-1 text-[10px] font-bold">
                                <span className="block text-sm leading-none">{veryLate}</span>&gt;30 min
                              </span>
                              <span className="flex-1 text-center bg-gray-100 text-gray-500 rounded-lg py-1 text-[10px] font-bold">
                                <span className="block text-sm leading-none">{Math.max(0, (present + late) > 0 ? Math.round((present / (present + late)) * 100) : 0)}%</span>On-Time
                              </span>
                            </div>

                            {/* Day headers */}
                            <div className="grid grid-cols-7 px-2 pb-1">
                              {['S','M','T','W','T','F','S'].map((d, i) => (
                                <div key={i} className={`text-center text-[9px] font-bold py-1 ${i === 0 || i === 6 ? 'text-gray-300' : 'text-gray-400'}`}>{d}</div>
                              ))}
                            </div>

                            {/* Day cells */}
                            <div className="grid grid-cols-7 gap-0.5 px-2 pb-3">
                              {cells.map((day, idx) => {
                                if (!day) return <div key={idx} />;
                                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const isFuture = dateStr > today;
                                const isToday = dateStr === today;
                                const dayOfWeek = (idx) % 7;
                                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                                const wd = wdMap[dateStr];
                                const status = isFuture || isWeekend ? 'none' : getDayStatus(wd);
                                const lateMin = wd && !isFuture ? getLateMinutes(wd) : null;

                                const dotColor =
                                  status === 'present'   ? 'bg-emerald-400' :
                                  status === 'late'      ? 'bg-amber-400' :
                                  status === 'very-late' ? 'bg-red-400' :
                                  isWeekend              ? 'bg-transparent' :
                                  isFuture               ? 'bg-transparent' : 'bg-gray-200';

                                const cellBg =
                                  isToday                ? 'ring-2 ring-[#0f3d20] ring-offset-0' :
                                  status === 'present'   ? 'bg-emerald-50' :
                                  status === 'late'      ? 'bg-amber-50' :
                                  status === 'very-late' ? 'bg-red-50' :
                                  isWeekend              ? '' :
                                  isFuture               ? '' : 'bg-gray-50';

                                return (
                                  <div
                                    key={idx}
                                    title={wd ? `${wd.date}: Checked in ${new Date(wd.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}${lateMin !== null && lateMin > 0 ? ` (${lateMin}m late)` : ''}${wd.endTime ? `, Out: ${new Date(wd.endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}` : dateStr}
                                    className={`flex flex-col items-center justify-center rounded-xl py-1.5 cursor-default transition-all ${cellBg}`}
                                  >
                                    <span className={`text-[10px] font-semibold ${
                                      isToday ? 'text-[#0f3d20]' :
                                      isWeekend ? 'text-gray-300' :
                                      isFuture ? 'text-gray-300' :
                                      status === 'absent' ? 'text-gray-300' : 'text-gray-700'
                                    }`}>{day}</span>
                                    {!isWeekend && !isFuture && (
                                      <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${dotColor}`} />
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Legend */}
                            <div className="flex items-center gap-3 px-4 pb-3 text-[9px] text-gray-400">
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />On time</span>
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Late (&lt;30m)</span>
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />&gt;30m late</span>
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-200 inline-block" />Absent</span>
                            </div>
                          </div>
                        );
                      })()}
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

            {/* ── TODAY'S SCORE ── */}
            <div className="mb-5">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Today's Overview</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-center">
                  <div className="text-2xl font-black text-amber-600">{pendingTrips.length}</div>
                  <div className="text-[10px] font-semibold text-amber-700 mt-0.5">Pending Tasks</div>
                  <div className="text-[10px] text-amber-500 mt-0.5">{pendingPickups}P · {pendingDeliveries}D</div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-center">
                  <div className="text-2xl font-black text-blue-600">{pickupsDoneToday}</div>
                  <div className="text-[10px] font-semibold text-blue-700 mt-0.5">Pickups Done</div>
                  <div className="text-[10px] text-blue-400 mt-0.5">today</div>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-2xl p-3 text-center">
                  <div className="text-2xl font-black text-green-600">{deliveriesDoneToday}</div>
                  <div className="text-[10px] font-semibold text-green-700 mt-0.5">Deliveries Done</div>
                  <div className="text-[10px] text-green-400 mt-0.5">today</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-center">
                  <div className="text-2xl font-black text-emerald-600">{completedToday.length}</div>
                  <div className="text-[10px] font-semibold text-emerald-700 mt-0.5">Total Done</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">today</div>
                </div>
              </div>
            </div>

            {/* ── EMPLOYEE CHECKLIST ── */}
            {pendingByEmployee.length > 0 && (
              <div className="mb-5">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Who Has Pending Tasks</div>
                <div className="space-y-2">
                  {pendingByEmployee.map(({ driver, tasks }) => {
                    const isOpen = openPanel?.id === ('chk-' + driver.id) && openPanel.type === 'detail';
                    return (
                      <div key={driver.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <button
                          className="w-full flex items-center gap-3 p-3 text-left"
                          onClick={() => setOpenPanel(isOpen ? null : { id: 'chk-' + driver.id, type: 'detail' })}
                        >
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                            {(driver.fullName || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-800 text-sm leading-tight">{driver.fullName}</div>
                            {driver.designation && <div className="text-[10px] text-emerald-600 font-medium">{driver.designation}</div>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {tasks.filter(t => t.status === 'Incomplete').length > 0 && (
                              <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                                {tasks.filter(t => t.status === 'Incomplete').length} incomplete
                              </span>
                            )}
                            {tasks.filter(t => t.status !== 'Incomplete').length > 0 && (
                              <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                {tasks.filter(t => t.status !== 'Incomplete').length} pending
                              </span>
                            )}
                            <ChevronRight size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                          </div>
                        </button>
                        {isOpen && (
                          <div className="border-t border-gray-100 divide-y divide-gray-50">
                            {tasks.map(t => (
                              <div key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                  t.taskType === 'DELIVERY' ? 'bg-green-100 text-green-700' :
                                  t.taskType === 'BOTH'     ? 'bg-purple-100 text-purple-700' :
                                                              'bg-blue-100 text-blue-700'
                                }`}>
                                  {t.taskType === 'BOTH' ? 'P+D' : t.taskType || 'PICKUP'}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium text-gray-700 truncate">{t.origin}</div>
                                  {t.customerName && <div className="text-[10px] text-purple-600">{t.customerName}</div>}
                                  {t.courierName && <div className="text-[10px] text-gray-400">{t.courierName}{t.podNumber ? ` #${t.podNumber}` : ''}</div>}
                                  {t.remark && <div className="text-[10px] text-red-500 italic truncate">"{t.remark}"</div>}
                                </div>
                                {t.status === 'Incomplete' ? (
                                  <button
                                    onClick={() => reassignTrip(t.id, t.driverId)}
                                    className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all"
                                  >
                                    ↩ Start Again
                                  </button>
                                ) : (
                                  <span className={`text-[10px] shrink-0 px-1.5 py-0.5 rounded-full font-semibold ${
                                    t.taskStage === 'Ongoing' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    {t.taskStage === 'Ongoing' ? 'In Progress' : 'Not Started'}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Date filter */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {(['today', 'week', 'month', 'all'] as const).map(f => (
                <button key={f} onClick={() => setTaskDateFilter(f)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    taskDateFilter === f
                      ? 'bg-[#0f3d20] text-white border-[#0f3d20]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}>
                  {f === 'today' ? 'Today' : f === 'week' ? 'This Week' : f === 'month' ? 'This Month' : 'All Time'}
                </button>
              ))}
            </div>

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

            {/* Active + Incomplete tasks (all non-completed) */}
            {filteredActiveTasks.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-amber-500 rounded-full inline-block" />
                  Pending Tasks ({filteredActiveTasks.length})
                  {incompleteTrips.length > 0 && !customerFilter && !taskSearch && (
                    <span className="ml-1 text-[10px] text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full font-bold">
                      {incompleteTrips.length} incomplete
                    </span>
                  )}
                </h3>
                <div className="space-y-2">
                  {filteredActiveTasks.map(trip => {
                    const driver = drivers.find(d => d.id === trip.driverId);
                    const isExpanded = expandedTrip === trip.id;
                    const isIncomplete = trip.status === 'Incomplete';
                    const isReassigning = reassigningTripId === trip.id;
                    return (
                      <div key={trip.id} className={`rounded-2xl shadow-sm overflow-hidden ${isIncomplete ? 'border-2 border-red-300 bg-red-50' : 'border border-gray-100 bg-white'}`}>
                        {/* Incomplete banner */}
                        {isIncomplete && (
                          <div className="flex items-center justify-between px-4 py-2 bg-red-100 border-b border-red-200">
                            <span className="text-xs font-bold text-red-700 flex items-center gap-1">
                              <AlertCircle size={12} /> Marked Incomplete
                              {trip.remark && <span className="font-normal text-red-600"> — "{trip.remark}"</span>}
                            </span>
                            <button
                              onClick={() => { setReassigningTripId(isReassigning ? null : trip.id); setReassignTo(''); }}
                              className="text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              Reassign
                            </button>
                          </div>
                        )}

                        {/* Reassign panel */}
                        {isReassigning && (
                          <div className="px-4 py-3 bg-white border-b border-red-200 flex items-center gap-2 flex-wrap">
                            <select
                              value={reassignTo}
                              onChange={e => setReassignTo(e.target.value)}
                              className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                            >
                              <option value="">Select employee to reassign…</option>
                              {drivers.map(d => (
                                <option key={d.id} value={d.id}>
                                  {d.fullName}{d.designation ? ` (${d.designation})` : ''}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => reassignTrip(trip.id, reassignTo)}
                              disabled={!reassignTo}
                              className="shrink-0 px-3 py-2 bg-[#0f3d20] text-white text-xs font-bold rounded-xl disabled:opacity-40 hover:bg-emerald-900"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => { setReassigningTripId(null); setReassignTo(''); }}
                              className="shrink-0 px-3 py-2 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        <button className={`w-full text-left p-4 ${isIncomplete ? 'bg-red-50' : ''}`} onClick={() => setExpandedTrip(isExpanded ? null : trip.id)}>
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
                              {driver && <div className={`text-xs mt-0.5 font-medium ${isIncomplete ? 'text-red-500' : 'text-emerald-600'}`}>→ {driver.fullName}</div>}
                              {(trip.courierName || trip.podNumber) && (
                                <div className="text-xs text-gray-400 mt-0.5">
                                  {trip.courierName}{trip.podNumber ? ` #${trip.podNumber}` : ''}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 items-center shrink-0">
                              {trip.packagePhoto && (
                                <img
                                  src={trip.packagePhoto.dataUrl || (trip.packagePhoto.filePath ? `/${trip.packagePhoto.filePath.replace(/\\/g, '/')}` : '')}
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
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Proof Photos (tap to view)</div>
                                <div className="flex gap-2 flex-wrap">
                                  {trip.proofPhotos!.map((p, i) => {
                                    const src = p.dataUrl || (p.filePath ? `/${p.filePath.replace(/\\/g, '/')}` : '');
                                    if (!src) return null;
                                    return (
                                      <button key={i} onClick={() => openPhoto(src, p.fileName || 'photo.jpg')} className="relative group shrink-0">
                                        <img src={src} alt={p.kind} className="w-16 h-16 rounded-xl object-cover border border-gray-200 group-hover:border-emerald-400 transition-colors" />
                                        <span className={`absolute -bottom-0.5 left-0 right-0 text-center text-[8px] font-bold rounded-b-lg pb-0.5 ${p.kind === 'PICKUP' ? 'bg-blue-600/90 text-white' : 'bg-green-600/90 text-white'}`}>
                                          {p.kind}
                                        </span>
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-colors flex items-center justify-center">
                                          <Eye size={14} className="text-white opacity-0 group-hover:opacity-100 drop-shadow" />
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
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

            {/* Completed tasks — expandable with proof photos */}
            {completedTrips.length > 0 && !customerFilter && (
              <div className="mb-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
                  Completed ({completedTrips.length})
                </h3>
                <div className="space-y-1.5">
                  {completedTrips.map(trip => {
                    const driver = drivers.find(d => d.id === trip.driverId);
                    const isExpanded = expandedTrip === trip.id;
                    const allPhotos = [
                      ...(trip.packagePhoto ? [trip.packagePhoto] : []),
                      ...(trip.proofPhotos || []),
                    ];
                    const photoCount = allPhotos.length;
                    return (
                      <div key={trip.id} className="bg-white rounded-2xl border border-green-100 overflow-hidden">
                        <button
                          className="w-full flex items-center gap-3 p-3 text-left"
                          onClick={() => setExpandedTrip(isExpanded ? null : trip.id)}
                        >
                          <CheckCircle size={16} className="text-green-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            {trip.customerName && (
                              <div className="text-[10px] font-semibold text-purple-600 mb-0.5">{trip.customerName}</div>
                            )}
                            <div className="text-sm font-medium text-gray-700 truncate">{trip.origin}</div>
                            <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                              <span>{driver?.fullName}</span>
                              <span className={`font-medium ${trip.taskType === 'DELIVERY' ? 'text-green-600' : trip.taskType === 'BOTH' ? 'text-purple-600' : 'text-blue-600'}`}>
                                {trip.taskType === 'BOTH' ? 'P+D' : trip.taskType}
                              </span>
                              {photoCount > 0 && (
                                <span className="flex items-center gap-0.5 text-emerald-600 font-semibold">
                                  <Camera size={10} /> {photoCount} photo{photoCount > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Thumbnail strip preview */}
                            {allPhotos.slice(0, 2).map((p, i) => (
                              <img
                                key={i}
                                src={p.dataUrl || (p.filePath ? `/${p.filePath.replace(/\\/g, '/')}` : '')}
                                alt={p.kind}
                                className="w-8 h-8 rounded-lg object-cover border border-gray-200"
                              />
                            ))}
                            {photoCount > 2 && (
                              <span className="text-[10px] text-gray-400 font-medium">+{photoCount - 2}</span>
                            )}
                            <ChevronRight size={14} className={`text-gray-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-green-100 px-4 pb-4 pt-3 space-y-3">
                            {/* Package photo (admin uploaded) */}
                            {trip.packagePhoto && (() => {
                              const pkgSrc = trip.packagePhoto.dataUrl || (trip.packagePhoto.filePath ? `/${trip.packagePhoto.filePath.replace(/\\/g, '/')}` : '');
                              return pkgSrc ? (
                                <div>
                                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <Package size={10} /> Package Ref (Admin)
                                  </div>
                                  <button onClick={() => openPhoto(pkgSrc, trip.packagePhoto?.fileName || 'package.jpg')} className="relative group">
                                    <img src={pkgSrc} alt="Package" className="w-24 h-24 rounded-xl object-cover border border-gray-200 group-hover:border-emerald-400 transition-colors" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-colors flex items-center justify-center">
                                      <Eye size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                                    </div>
                                  </button>
                                </div>
                              ) : null;
                            })()}

                            {/* Proof photos (employee uploaded) */}
                            {(trip.proofPhotos || []).length > 0 && (
                              <div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                  <Camera size={10} /> Proof Photos (Employee)
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                  {trip.proofPhotos!.map((p, i) => {
                                    const src = p.dataUrl || (p.filePath ? `/${p.filePath.replace(/\\/g, '/')}` : '');
                                    if (!src) return null;
                                    return (
                                      <button key={i} onClick={() => openPhoto(src, p.fileName || 'photo.jpg')} className="relative group shrink-0">
                                        <img
                                          src={src}
                                          alt={p.kind}
                                          className="w-20 h-20 rounded-xl object-cover border border-gray-200 group-hover:border-emerald-400 transition-colors"
                                        />
                                        <span className={`absolute bottom-0 left-0 right-0 text-center text-[8px] font-bold py-0.5 rounded-b-xl ${
                                          p.kind === 'PICKUP' ? 'bg-blue-600/90 text-white' : 'bg-green-600/90 text-white'
                                        }`}>
                                          {p.kind}
                                        </span>
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-colors flex items-center justify-center">
                                          <Eye size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1.5">Tap any photo to view full size</p>
                              </div>
                            )}

                            {photoCount === 0 && (
                              <p className="text-xs text-gray-400 italic">No photos attached to this task.</p>
                            )}

                            {/* Notes / remarks */}
                            {trip.pickupNotes && (
                              <div className="text-xs text-gray-600 bg-gray-50 rounded-xl p-2.5">
                                <span className="font-semibold">Notes: </span>{trip.pickupNotes}
                              </div>
                            )}
                            {trip.remark && (
                              <div className="bg-amber-50 border border-amber-100 rounded-xl p-2.5 text-xs text-amber-800">
                                <span className="font-bold">Remark: </span>{trip.remark}
                              </div>
                            )}

                            <div className="text-[10px] text-gray-400">
                              Completed · {new Date(trip.lastUpdated).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              {trip.courierName && ` · ${trip.courierName}`}
                              {trip.podNumber && ` #${trip.podNumber}`}
                            </div>
                          </div>
                        )}
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

      {/* ── Photo Lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-black/60" onClick={e => e.stopPropagation()}>
            <span className="text-white/70 text-xs font-mono truncate max-w-[60%]">{lightbox.fileName}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadPhoto(lightbox.src, lightbox.fileName)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
              >
                <Download size={14} /> Download
              </button>
              <button
                onClick={() => setLightbox(null)}
                className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Image */}
          <img
            src={lightbox.src}
            alt={lightbox.fileName}
            className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl mt-14"
            onClick={e => e.stopPropagation()}
          />

          <p className="text-white/40 text-xs mt-3" onClick={e => e.stopPropagation()}>
            Tap outside to close
          </p>
        </div>
      )}

      {/* ── Modals ── */}
      {showAddEmp && (
        <EmployeeFormModal mode="add" onClose={() => setShowAddEmp(false)} onSaved={load} />
      )}
      {editingEmp && (
        <EmployeeFormModal
          mode="edit"
          initial={{
            id: editingEmp.id,
            name: editingEmp.fullName,
            username: editingEmp.username,
            phone: editingEmp.phone,
            employeeCode: editingEmp.employeeCode,
            city: editingEmp.city,
            state: editingEmp.state,
            licenseNumber: editingEmp.licenseNumber,
            emergencyContact: editingEmp.emergencyContact,
            designation: editingEmp.designation,
            shiftStart:  editingEmp.shiftStart,
            shiftEnd:    editingEmp.shiftEnd,
          } as any}
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
