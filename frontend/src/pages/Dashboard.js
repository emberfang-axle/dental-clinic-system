import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { userData } = useAuth();
  const [myAppointments, setMyAppointments] = useState([]);

  useEffect(() => {
    if (userData?.role === 'patient') {
      fetchMyAppointments();
    }
  }, [userData]);

  const fetchMyAppointments = async () => {
    try {
      const q = query(
        collection(db, 'appointments'),
        where('patientId', '==', userData.uid)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyAppointments(data.slice(0, 3)); // Latest 3
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      completed: 'badge-success',
      cancelled: 'badge-danger'
    };
    return badges[status] || 'badge-info';
  };

  // PATIENT DASHBOARD
  if (userData?.role === 'patient') {
    return (
      <div className="dashboard-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Welcome, {userData?.fullName}!</h1>
            <p className="page-subtitle">Book your dental appointment today</p>
          </div>
          <button 
            className="btn btn-primary btn-lg"
            onClick={() => window.location.href = '/appointments'}
            style={{ fontSize: '1.1rem', padding: '15px 30px' }}
          >
            📅 Book Appointment Now
          </button>
        </div>

        {/* Quick Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>{myAppointments.length}</h3>
              <p>My Appointments</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{myAppointments.filter(a => a.status === 'completed').length}</h3>
              <p>Completed</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <h3>{myAppointments.filter(a => a.status === 'pending').length}</h3>
              <p>Pending</p>
            </div>
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📋 My Recent Appointments</h3>
          </div>
          {myAppointments.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Service</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myAppointments.map((apt) => (
                    <tr key={apt.id}>
                      <td>{apt.date}</td>
                      <td>{apt.time}</td>
                      <td>{apt.service}</td>
                      <td style={{ fontWeight: '600', color: 'var(--primary)' }}>
                        {formatCurrency(apt.price)}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(apt.status)}`}>
                          {apt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--gray)', marginBottom: '20px' }}>
                No appointments yet
              </p>
              <button 
                className="btn btn-primary"
                onClick={() => window.location.href = '/appointments'}
              >
                Book Your First Appointment
              </button>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="card" style={{ background: 'var(--info-light)', border: '1px solid var(--info)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ fontSize: '3rem' }}>👨‍⚕️</div>
            <div>
              <h3 style={{ marginBottom: '5px' }}>Dr. Estandarte</h3>
              <p style={{ color: 'var(--gray)', margin: 0 }}>
                General Dentist | Monday - Friday: 9AM - 5PM | Contact: 0912 345 6789
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STAFF/DOCTOR DASHBOARD (keep existing)
  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, {userData?.fullName}!</p>
      </div>
      {/* Staff dashboard content... */}
    </div>
  );
}

export default Dashboard;