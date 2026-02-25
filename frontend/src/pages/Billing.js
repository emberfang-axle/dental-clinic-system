import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

function Billing() {
  const { userData } = useAuth();
  const [bills, setBills] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    appointmentId: '',
    service: '',
    amount: '',
    paymentMethod: 'cash',
    paymentStatus: 'pending',
    notes: ''
  });

  const services = [
    { name: 'Check-up', price: 500 },
    { name: 'Cleaning', price: 1500 },
    { name: 'Tooth Extraction', price: 2000 },
    { name: 'Fillings', price: 1000 },
    { name: 'Braces', price: 25000 },
    { name: 'Root Canal', price: 5000 },
    { name: 'Whitening', price: 3000 },
    { name: 'Dental Crown', price: 8000 },
    { name: 'Implant', price: 15000 }
  ];

  useEffect(() => {
    fetchBills();
    fetchPatients();
    fetchAppointments();
  }, [userData]);

  const fetchBills = async () => {
    try {
      let q = query(collection(db, 'billing'), orderBy('createdAt', 'desc'));
      
      if (userData?.role === 'patient') {
        q = query(collection(db, 'billing'));
        const snapshot = await getDocs(q);
        const allBills = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBills(allBills.filter(bill => bill.patientId === userData.uid));
      } else {
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBills(data);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  };

  const fetchPatients = async () => {
    try {
      const q = query(collection(db, 'patients'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const q = query(collection(db, 'appointments'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppointments(data.filter(apt => apt.status === 'completed'));
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleServiceChange = (e) => {
    const service = services.find(s => s.name === e.target.value);
    setFormData({
      ...formData,
      service: e.target.value,
      amount: service ? service.price : ''
    });
  };

  const handlePatientChange = (e) => {
    const patient = patients.find(p => p.id === e.target.value);
    setFormData({
      ...formData,
      patientId: e.target.value,
      patientName: patient?.fullName || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'billing'), {
        ...formData,
        createdAt: new Date().toISOString()
      });
      setShowModal(false);
      setFormData({
        patientId: '',
        patientName: '',
        appointmentId: '',
        service: '',
        amount: '',
        paymentMethod: 'cash',
        paymentStatus: 'pending',
        notes: ''
      });
      fetchBills();
    } catch (error) {
      console.error('Error creating bill:', error);
    }
  };

  const handlePayment = async (id) => {
    try {
      await updateDoc(doc(db, 'billing', id), { 
        paymentStatus: 'paid',
        paymentDate: new Date().toISOString()
      });
      fetchBills();
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    return status === 'paid' ? 'badge-success' : 'badge-warning';
  };

  const getTotalRevenue = () => {
    return bills
      .filter(bill => bill.paymentStatus === 'paid')
      .reduce((sum, bill) => sum + parseFloat(bill.amount || 0), 0);
  };

  const getPendingAmount = () => {
    return bills
      .filter(bill => bill.paymentStatus === 'pending')
      .reduce((sum, bill) => sum + parseFloat(bill.amount || 0), 0);
  };

  return (
    <div className="billing-page">
      <div className="page-header">
        <h1 className="page-title">Billing</h1>
        {(userData?.role === 'doctor' || userData?.role === 'staff') && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Create Bill
          </button>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green">💰</div>
          <div className="stat-content">
            <h3>{formatCurrency(getTotalRevenue())}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">⏳</div>
          <div className="stat-content">
            <h3>{formatCurrency(getPendingAmount())}</h3>
            <p>Pending Payments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">📋</div>
          <div className="stat-content">
            <h3>{bills.length}</h3>
            <p>Total Bills</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">All Bills</h2>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Service</th>
                <th>Amount</th>
                <th>Payment Method</th>
                <th>Status</th>
                {(userData?.role === 'doctor' || userData?.role === 'staff') && (
                  <th>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id}>
                  <td>{bill.createdAt ? new Date(bill.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td>{bill.patientName}</td>
                  <td>{bill.service}</td>
                  <td>{formatCurrency(bill.amount)}</td>
                  <td>{bill.paymentMethod}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(bill.paymentStatus)}`}>
                      {bill.paymentStatus}
                    </span>
                  </td>
                  {(userData?.role === 'doctor' || userData?.role === 'staff') && (
                    <td>
                      <div className="table-actions">
                        {bill.paymentStatus === 'pending' && (
                          <button 
                            className="btn btn-success btn-sm"
                            onClick={() => handlePayment(bill.id)}
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Bill</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Patient</label>
                <select name="patientId" className="form-control" value={formData.patientId} onChange={handlePatientChange} required>
                  <option value="">Select Patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>{patient.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Service</label>
                <select name="service" className="form-control" value={formData.service} onChange={handleServiceChange} required>
                  <option value="">Select Service</option>
                  {services.map((service) => (
                    <option key={service.name} value={service.name}>{service.name} - {formatCurrency(service.price)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (PHP)</label>
                <input type="number" name="amount" className="form-control" value={formData.amount} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select name="paymentMethod" className="form-control" value={formData.paymentMethod} onChange={handleChange}>
                  <option value="cash">Cash</option>
                  <option value="gcash">GCash</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea name="notes" className="form-control" value={formData.notes} onChange={handleChange} rows="2" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Bill</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Billing;