import React from 'react';
import { NavLink } from 'react-router-dom';

function Sidebar() {
  return (
    <div className="sidebar">
      <ul>
        <li>
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
            Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/appointments" className={({ isActive }) => isActive ? 'active' : ''}>
            Appointments
          </NavLink>
        </li>
        <li>
          <NavLink to="/patients" className={({ isActive }) => isActive ? 'active' : ''}>
            Patients
          </NavLink>
        </li>
        <li>
          <NavLink to="/billing" className={({ isActive }) => isActive ? 'active' : ''}>
            Billing
          </NavLink>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;