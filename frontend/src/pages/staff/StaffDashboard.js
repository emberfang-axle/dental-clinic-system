import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from "../../assets/logo.jpg";


function StaffDashboard() {
  const { userData } = useAuth();

  return (
    <div className="staff-dashboard">
      <h1>Welcome, {userData?.fullName || 'Staff Member'}</h1>
      <p>Role: {userData?.role}</p>

      <div className="dashboard-cards">
        <div className="card">
          <h2>Manage Doctors</h2>
          <p>View, add, and remove doctors in the system.</p>
          <Link to="/staff/doctors" className="btn btn-primary">Go to Doctors</Link>
        </div>

        <div className="card">
          <h2>Billing</h2>
          <p>Handle patient billing and payment records.</p>
          <Link to="/staff/billing" className="btn btn-primary">Go to Billing</Link>
        </div>

        <div className="card">
          <h2>Appointments</h2>
          <p>View and manage patient appointments.</p>
          <Link to="/staff/appointments" className="btn btn-primary">Go to Appointments</Link>
        </div>
        
        <div className="dashboard-container staff-theme">
        <div className="dashboard-box">
        <div className="dashboard-header">
      <img src={logo} alt="Clinic Logo" />
      <h2 className="dashboard-title">Staff Dashboard</h2>
      <p className="dashboard-subtitle">Assist with scheduling</p>
    </div>

    <div className="dashboard-section">
      <h3>Appointments</h3>
      <div className="dashboard-card">Assist with patient scheduling.</div>
    </div>
  </div>
</div>
      </div>
    </div>
  );
}

export default StaffDashboard;
