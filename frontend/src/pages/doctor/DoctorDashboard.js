import React from "react";
import logo from "../../assets/logo.jpg";

export default function DoctorDashboard() {
  return (
    <div className="dashboard-container doctor-theme">
      <div className="dashboard-box">
        {/* Header */}
        <div className="dashboard-header">
          <img src={logo} alt="Clinic Logo" />
          <h2 className="dashboard-title">Doctor Dashboard</h2>
          <p className="dashboard-subtitle">Manage patients, appointments, and billing</p>
        </div>

        {/* Appointments Section */}
        <div className="dashboard-section">
          <h3>Appointments</h3>
          <div className="dashboard-card">
            <p>View and manage all patient appointments here.</p>
          </div>
        </div>

        {/* Billing Section */}
        <div className="dashboard-section">
          <h3>Billing</h3>
          <div className="dashboard-card">
            <p>Access billing records, update charges, and review payments.</p>
          </div>
        </div>

        {/* Patient Management Section */}
        <div className="dashboard-section">
          <h3>Patient Records</h3>
          <div className="dashboard-card">
            <p>View patient profiles, medical history, and treatment plans.</p>
          </div>
        </div>

        {/* Reports Section */}
        <div className="dashboard-section">
          <h3>Reports</h3>
          <div className="dashboard-card">
            <p>Generate and review clinic performance reports.</p>
          </div>
        </div>
      </div>
    </div>
  );
};