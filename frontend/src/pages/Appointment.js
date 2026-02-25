import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

function Appointments() {
  const [formData, setFormData] = useState({
    patientName: '',
    date: '',
    time: '',
    service: '',
    dentist: '',
    status: 'Pending'
  });

  const services = [
    'Check-up',
    'Cleaning',
    'Tooth Extraction',
    'Fillings',
    'Braces',
    'Root Canal',
    'Whitening'
  ];

  const dentists = [
    'Dr. Smith',
    'Dr. Garcia',
    'Dr. Lee',
    'Dr. Johnson'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'appointments'), formData);
      alert('Appointment added successfully!');
      setFormData({
        patientName: '',
        date: '',
        time: '',
        service: '',
        dentist: '',
        status: 'Pending'
      });
    } catch (error) {
      console.error('Error adding appointment:', error);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Appointments</h1>

      <div className="card">
        <h2>Add New Appointment</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Patient Name</label>
            <input
              type="text"
              name="patientName"
              value={formData.patientName}
              onChange={handleChange}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Service</label>
            <select name="service" value={formData.service} onChange={handleChange} required>
              <option value="">Select Service</option>
              {services.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Dentist</label>
            <select name="dentist" value={formData.dentist} onChange={handleChange} required>
              <option value="">Select Dentist</option>
              {dentists.map(dentist => (
                <option key={dentist} value={dentist}>{dentist}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Add Appointment</button>
        </form>
      </div>
    </div>
  );
}

export default Appointments;