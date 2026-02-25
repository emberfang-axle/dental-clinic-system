import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

function Appointments() {
  const { userData } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState({
    patientName: '',
    patientId: '',
    date: '',
    time: '',
    service: '',
    doctorId: '',
    doctorName: '',
    status: 'pending',
    notes: ''
  });

  const services = [
    'Check-up',
    'Cleaning',
    'Tooth Extraction',
    'Fillings',
    'Braces',
    'Root Canal',
    'Whitening',
    'Dental Crown',
    'Implant'
  ];

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, [userData]);

  const fetchAppointments = async () => {
    try {
      let q = query(collection(db, 'appointments'), orderBy('date', 'desc'));
      
      if (userData?.role === 'patient') {
        q = query(
          collection(db, 'appointments'),
          where('patientId', '==', userData.uid),
          orderBy('date', 'desc')
        );
      } else if (userData?.role === 'doctor') {
        q = query(
          collection(db, 'appointments'),
          where('doctorId', '==', userData.uid),
          orderBy('date', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'doctor'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDoctors(data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDoctorChange = (e) => {
    const doctor = doctors.find(d => d.id === e.target.value);
    setFormData({
      ...formData,
      doctorId: e.target.value,
      doctorName: doctor?.fullName || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const appointmentData = {
        ...formData,
        patientId: userData?.role === 'patient' ? userData.uid : formData.patientId,
        patientName: userData?.role === 'patient' ? userData.fullName : formData.patientName,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'appointments'), appointmentData);
      setShowModal(false);
      setFormData({
        patientName: '',
        patientId: '',
        date: '',
        time: '',
        service: '',
        doctorId: '',
        doctorName: '',
        status: 'pending',
        notes: ''
      });
      fetchAppointments();
    } catch (error) {
      console.error('Error creating appointment:', error);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'appointments', id), { status: newStatus });
      fetchAppointments();
    } catch (error) {
      console.error('Error updating status:', error);
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

  return (
    <div className="appointments-page">
      <div className="page-header">
        <h1 className="page-title">Appointments</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + New Appointment
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Patient</th>
                <th>Service</th>
                <th>Doctor</th>
                <th>Status</th>
                {(userData?.role === 'doctor' || userData?.role === 'staff') && (
                  <th>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => (
                <tr key={apt.id}>
                  <td>{apt.date}</td>
                  <td>{apt.time}</td>
                  <td>{apt.patientName}</td>
                  <td>{apt.service}</td>
                  <td>{apt.doctorName}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(apt.status)}`}>
                      {apt.status}
                    </span>
                  </td>
                  {(userData?.role === 'doctor' || userData?.role === 'staff') && (
                    <td>
                      <div className="table-actions">
                        {apt.status === 'pending' && (
                          <button 
                            className="btn btn-success btn-sm"
                            onClick={() => handleStatusChange(apt.id, 'confirmed')}
                          >
                            Confirm
                          </button>
                        )}
                        {apt.status === 'confirmed' && (
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => handleStatusChange(apt.id, 'completed')}
                          >
                            Complete
                          </button>
                        )}
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleStatusChange(apt.id, 'cancelled')}
                        >
                          Cancel
                        </button>
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
              <h2>New Appointment</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              {userData?.role !== 'patient' && (
                <div className="form-group">
                  <label className="form-label">Patient Name</label>
                  <input
                    type="text"
                    name="patientName"
                    className="form-control"
                    value={formData.patientName}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    name="date"
                    className="form-control"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input
                    type="time"
                    name="time"
                    className="form-control"
                    value={formData.time}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Service</label>
                <select
                  name="service"
                  className="form-control"
                  value={formData.service}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Service</option>
                  {services.map((service) => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Doctor</label>
                <select
                  name="doctorId"
                  className="form-control"
                  value={formData.doctorId}
                  onChange={handleDoctorChange}
                  required
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  className="form-control"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Create Appointment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Appointments;