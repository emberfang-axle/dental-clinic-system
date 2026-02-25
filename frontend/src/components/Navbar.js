import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'doctor': return 'Doctor';
      case 'staff': return 'Staff';
      case 'patient': return 'Patient';
      default: return 'User';
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span>🦷</span>
        <span>Dental Clinic</span>
      </div>
      <div className="navbar-user">
        <div className="user-info">
          <div className="user-name">{userData?.fullName || user?.email}</div>
          <div className="user-role">{getRoleLabel(userData?.role)}</div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;