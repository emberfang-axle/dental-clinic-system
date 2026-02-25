import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Sidebar() {
  const { userData } = useAuth();

  const getMenuItems = () => {
    const role = userData?.role;
    
    const commonItems = [
      { path: '/', label: 'Dashboard', icon: '📊' },
    ];

    const doctorItems = [
      { path: '/appointments', label: 'Appointments', icon: '📅' },
      { path: '/patients', label: 'Patients', icon: '👥' },
      { path: '/billing', label: 'Billing', icon: '💰' },
      { path: '/feedback', label: 'Feedback', icon: '⭐' },
    ];

    const staffItems = [
      { path: '/appointments', label: 'Appointments', icon: '📅' },
      { path: '/patients', label: 'Patients', icon: '👥' },
      { path: '/billing', label: 'Billing', icon: '💰' },
    ];

    const patientItems = [
      { path: '/appointments', label: 'My Appointments', icon: '📅' },
      { path: '/doctors', label: 'Find Doctors', icon: '👨‍⚕️' },
      { path: '/billing', label: 'My Bills', icon: '💰' },
      { path: '/feedback', label: 'Feedback', icon: '⭐' },
    ];

    if (role === 'doctor') return [...commonItems, ...doctorItems];
    if (role === 'staff') return [...commonItems, ...staffItems];
    if (role === 'patient') return [...commonItems, ...patientItems];
    return commonItems;
  };

  const menuItems = getMenuItems();

  return (
    <aside className="sidebar">
      <ul className="sidebar-menu">
        {menuItems.map((item, index) => (
          <li key={index} className="sidebar-item">
            <NavLink 
              to={item.path} 
              className={({ isActive }) => isActive ? 'sidebar-link active' : 'sidebar-link'}
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