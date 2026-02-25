import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

function Billing() {
  const [formData, setFormData] = useState({
    patientName: '',
    service: '',
    amount: '',
    paymentMethod: '',
    status: 'Pending',
    date: new Date().toISOString().split('T')[0]
  });

  const services = [
    { name: 'Check-up', price: 500 },
    { name: 'Cleaning', price: 1500 },
    { name: 'Tooth Extraction', price: 2000 },
    { name: 'Fillings', price: 1000 },
    { name: 'Root Canal', price: 5000 },
    { name: 'Whitening', price: 3000 }
  ];

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'billing'), formData);
      alert('Bill created successfully!');
      setFormData({
        patientName: '',
        service: '',
        amount: '',
        paymentMethod: '',
        status: 'Pending',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error creating bill:', error);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Billing</h1>

      <div className="card">
        <h2>Create New Bill</h2>
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
          <div className="form-group">
            <label>Service</label>
            <select name="service" value={formData.service} onChange={handleServiceChange} required>
              <option value="">Select Service</option>
              {services.map(service => (
                <option key={service.name} value={service.name}>
                  {service.name} - ₱{service.price}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Amount (₱)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Payment Method</label>
            <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} required>
              <option value="">Select Payment Method</option>
              <option value="Cash">Cash</option>
              <option value="Credit Card">Credit Card</option>
              <option value="GCash">GCash</option>
            </select>
          </div>
          <button type="submit" className="btn btn-success">Create Bill</button>
        </form>
      </div>
    </div>
  );
}

export default Billing;