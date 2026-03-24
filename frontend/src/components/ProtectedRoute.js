import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from './Loading';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, userData, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading type="spinner" text="Verifying access..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = userData?.role;

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    if (role === "patient") return <Navigate to="/patient" replace />;
    if (role === "doctor") return <Navigate to="/doctor" replace />;
    if (role === "staff") return <Navigate to="/staff" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;