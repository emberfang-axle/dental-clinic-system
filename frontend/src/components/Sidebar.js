import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Sidebar() {
  const { userData } = useAuth();
  const role = userData?.role;

  const getMenuItems = () => {
    if (role === 'doctor') {
      return [
        { path: '/doctor', label: 'Dashboard', icon: '📊' },
        { path: '/doctor/appointments', label: 'Appointments', icon: '📅' },
        { path: '/doctor/patients', label: 'Patients', icon: '👥' },
        { path: '/feedback', label: 'Feedback', icon: '⭐' },
      ];
    }

    if (role === 'staff') {
      return [
        { path: '/staff', label: 'Dashboard', icon: '📊' },
        { path: '/staff/doctors', label: 'Doctors', icon: '🦷' },
        { path: '/staff/billing', label: 'Billing', icon: '💳' },
      ];
    }

    if (role === 'patient') {
      return [
        { path: '/patient', label: 'Dashboard', icon: '📊' },
        { path: '/patient/appointments', label: 'My Appointments', icon: '📅' },
        { path: '/patient/profile', label: 'Profile', icon: '👤' },
      ];
    }

    return [];
  };

  const menuItems = getMenuItems();

  return (
    <aside className="sidebar">
      <ul className="sidebar-menu">
        {menuItems.map((item) => (
          <li key={item.path} className="sidebar-item">
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                isActive ? 'sidebar-link active' : 'sidebar-link'
              }
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default Sidebar;