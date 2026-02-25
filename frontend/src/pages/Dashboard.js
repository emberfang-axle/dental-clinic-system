import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const { user, userData } = useAuth();
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingBills: 0,
    totalRevenue: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [userData]);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const appointmentsQuery = query(
        collection(db, 'appointments'),
        orderBy('createdAt', 'desc')
      );
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      const allAppointments = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const todayAppointments = allAppointments.filter(apt => apt.date === today);
      
      const patientsQuery = query(collection(db, 'patients'));
      const patientsSnapshot = await getDocs(patientsQuery);
      
      const billsQuery = query(collection(db, 'billing'));
      const billsSnapshot = await getDocs(billsQuery);
      const bills = billsSnapshot.docs.map(doc => doc.data());
      
      const pendingBills = bills.filter(bill => bill.paymentStatus === 'pending');
      const totalRevenue = bills
        .filter(bill => bill.paymentStatus === 'paid')
        .reduce((sum, bill) => sum + (bill.total || 0), 0);

      setStats({
        totalPatients: patientsSnapshot.size,
        todayAppointments: todayAppointments.length,
        pendingBills: pendingBills.length,
        totalRevenue: totalRevenue
      });

      setRecentAppointments(todayAppointments.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Welcome back, {userData?.fullName || 'User'}!</h1>
        <p className="page-subtitle">Here's what's happening today</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">👥</div>
          <div className="stat-content">
            <h3>{stats.totalPatients}</h3>
            <p>Total Patients</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">📅</div>
          <div className="stat-content">
            <h3>{stats.todayAppointments}</h3>
            <p>Today's Appointments</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">💳</div>
          <div className="stat-content">
            <h3>{stats.pendingBills}</h3>
            <p>Pending Bills</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">💰</div>
          <div className="stat-content">
            <h3>{formatCurrency(stats.totalRevenue)}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Today's Appointments</h2>
        </div>
        
        {recentAppointments.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Patient</th>
                  <th>Service</th>
                  <th>Doctor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAppointments.map((apt) => (
                  <tr key={apt.id}>
                    <td>{apt.time}</td>
                    <td>{apt.patientName}</td>
                    <td>{apt.service}</td>
                    <td>{apt.doctorName}</td>
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
          <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
            No appointments for today
          </p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;