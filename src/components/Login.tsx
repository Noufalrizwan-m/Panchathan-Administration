import React, { useState } from 'react';
import { Lock, ArrowRight, AlertTriangle, User as UserIcon, Shield, Truck } from 'lucide-react';
import { User } from '../types';
import { PanchathanLogo } from './BrandAssets';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

type RoleTab = 'admin' | 'employee';

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [role, setRole] = useState<RoleTab>('employee');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter your username and password.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Invalid username or password.');
      }

      const data = await response.json();
      if (data.success && data.user) {
        onLoginSuccess(data.user);
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSwitch = (newRole: RoleTab) => {
    setRole(newRole);
    setError('');
    setUsername('');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex bg-white">

      {/* LEFT PANEL — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f3d20] flex-col justify-between p-10 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#f9a825] rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10">
          <PanchathanLogo size="md" />
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-black text-white leading-tight">
              Courier Fleet<br />
              <span className="text-[#f9a825]">Management</span>
            </h1>
            <p className="text-emerald-300 mt-3 text-sm leading-relaxed max-w-sm">
              Real-time tracking, task management, and delivery monitoring for your entire courier team.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Live Tracking', desc: 'GPS route monitoring' },
              { label: 'Task Flow', desc: 'Pickup → Delivery' },
              { label: 'Fleet View', desc: 'All vehicles & docs' },
              { label: 'POD Ready', desc: 'Proof of delivery' },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-xl bg-white/10 border border-white/10">
                <div className="text-white font-bold text-xs">{item.label}</div>
                <div className="text-emerald-300 text-[11px] mt-0.5">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-emerald-400 text-[11px]">
          © {new Date().getFullYear()} Panchathan Logistics
        </div>
      </div>

      {/* RIGHT PANEL — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <PanchathanLogo size="sm" />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-1">Welcome back</h2>
            <p className="text-slate-500 text-sm mb-6">Sign in to your account</p>

            {/* Role Tabs */}
            <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => handleRoleSwitch('employee')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  role === 'employee'
                    ? 'bg-white text-[#0f3d20] shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Truck className="w-4 h-4" />
                Employee
              </button>
              <button
                type="button"
                onClick={() => handleRoleSwitch('admin')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  role === 'admin'
                    ? 'bg-white text-[#0f3d20] shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin
              </button>
            </div>

            {/* Role hint */}
            <div className={`flex items-center gap-2 p-3 rounded-lg mb-5 text-xs ${
              role === 'admin'
                ? 'bg-amber-50 border border-amber-200 text-amber-800'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}>
              {role === 'admin'
                ? <><Shield className="w-3.5 h-3.5 shrink-0" /> Admin access — full dashboard, employee &amp; vehicle management</>
                : <><Truck className="w-3.5 h-3.5 shrink-0" /> Employee access — your tasks, delivery flow &amp; location tracking</>
              }
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={role === 'admin' ? 'admin' : 'e.g. arun01'}
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-[#0f3d20] focus:ring-2 focus:ring-[#0f3d20]/10 transition-all placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-[#0f3d20] focus:ring-2 focus:ring-[#0f3d20]/10 transition-all placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#0f3d20] hover:bg-[#1a5c33] disabled:opacity-60 text-white font-semibold rounded-lg text-sm flex items-center justify-center gap-2 transition-all shadow-sm mt-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {role === 'employee' && (
              <p className="text-center text-xs text-slate-400 mt-4">
                Your password is set by your admin when your account is created.
              </p>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 mt-4">
            Panchathan Courier Fleet System • Secure Login
          </p>
        </div>
      </div>
    </div>
  );
};
