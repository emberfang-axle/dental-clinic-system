import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Dashboard() {
  const { userData } = useAuth();
  if (userData?.role === 'doctor') return <Navigate to="/doctor" />;
  if (userData?.role === 'staff') return <Navigate to="/staff" />;
  return <Navigate to="/patient" />;
}

export default Dashboard;
