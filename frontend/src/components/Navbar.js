import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.jpg';

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
    if (role === 'doctor') return 'Doctor';
    if (role === 'staff') return 'Staff';
    if (role === 'patient') return 'Patient';
    return 'User';
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img
          src={logo}
          alt="Estandarte Dental"
          className="nav-logo"
        />
        <span>Estandarte Dental Clinic</span>
      </div>

      <div className="navbar-user">
        <div className="user-info">
          <div className="user-name">
            {userData?.fullName || user?.displayName || user?.email?.split('@')[0] || 'User'}
          </div>
          <div className="user-role">
            {getRoleLabel(userData?.role)}
          </div>
        </div>

        <button
          className="btn btn-outline"
          onClick={handleLogout}
          style={{ padding: '8px 15px', fontSize: '0.85rem' }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;