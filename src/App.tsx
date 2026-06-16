import React, { useState } from 'react';
import { Login } from './components/Login';
import { AdminDashboard } from './components/AdminDashboard';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { AddVehicleWizard } from './components/AddVehicleWizard';
import { User as UserType } from './types';

export default function App() {
  const [sessionUser, setSessionUser] = useState<UserType | null>(() => {
    try {
      const stored = localStorage.getItem('panchathan_session_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [showAddVehicle, setShowAddVehicle] = useState(false);

  function handleLoginSuccess(user: UserType) {
    setSessionUser(user);
    try {
      localStorage.setItem('panchathan_session_user', JSON.stringify(user));
    } catch {}
  }

  function handleLogout() {
    setSessionUser(null);
    try {
      localStorage.removeItem('panchathan_session_user');
    } catch {}
  }

  if (!sessionUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Employee view
  if (sessionUser.role === 'driver') {
    return <EmployeeDashboard sessionUser={sessionUser} onLogout={handleLogout} />;
  }

  // Admin view
  if (showAddVehicle) {
    return (
      <AddVehicleWizard
        operatorName={sessionUser.fullName}
        onSuccess={() => setShowAddVehicle(false)}
      />
    );
  }

  return (
    <AdminDashboard
      sessionUser={sessionUser}
      onLogout={handleLogout}
      onAddVehicle={() => setShowAddVehicle(true)}
    />
  );
}
