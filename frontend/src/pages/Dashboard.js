import React from 'react';

function Dashboard() {
  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Dashboard</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>150</h3>
          <p>Total Patients</p>
        </div>
        <div className="stat-card">
          <h3>45</h3>
          <p>Today's Appointments</p>
        </div>
        <div className="stat-card">
          <h3>12</h3>
          <p>Pending Bills</p>
        </div>
        <div className="stat-card">
          <h3>₱15,000</h3>
          <p>Today's Revenue</p>
        </div>
      </div>

      <div className="card">
        <h2>Today's Appointments</h2>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Patient Name</th>
              <th>Service</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>9:00 AM</td>
              <td>John Smith</td>
              <td>Check-up</td>
              <td><span style={{ color: 'green' }}>Completed</span></td>
            </tr>
            <tr>
              <td>10:00 AM</td>
              <td>Maria Garcia</td>
              <td>Cleaning</td>
              <td><span style={{ color: 'blue' }}>In Progress</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;