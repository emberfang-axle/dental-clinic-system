import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

function Appointments() {
  const { userData } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1); // 1=Service, 2=Date/Time, 3=Payment, 4=Confirm
  const [formData, setFormData] = useState({
    service: '',
    date: '',
    time: '',
    paymentMethod: 'cash',
    notes: '',
    price: 0
  });

  // Services with prices
  const services = [
    { name: 'Check-up', price: 500, icon: '🔍', desc: 'Regular dental check-up' },
    { name: 'Cleaning', price: 1500, icon: '✨', desc: 'Professional teeth cleaning' },
    { name: 'Tooth Extraction', price: 2000, icon: '🦷', desc: 'Simple tooth extraction' },
    { name: 'Fillings', price: 1000, icon: '🛠️', desc: 'Dental filling procedure' },
    { name: 'Root Canal', price: 5000, icon: '💉', desc: 'Root canal treatment' },
    { name: 'Whitening', price: 3000, icon: '✨', desc: 'Teeth whitening' },
    { name: 'Dental Crown', price: 8000, icon: '👑', desc: 'Dental crown placement' },
    { name: 'Braces', price: 25000, icon: '😬', desc: 'Braces installation' },
    { name: 'Implant', price: 15000, icon: '🔧', desc: 'Dental implant' }
  ];

  // Time slots
  const timeSlots = [
    { time: '09:00 AM', available: true },
    { time: '09:30 AM', available: true },
    { time: '10:00 AM', available: true },
    { time: '10:30 AM', available: true },
    { time: '11:00 AM', available: true },
    { time: '11:30 AM', available: true },
    { time: '01:00 PM', available: true },
    { time: '01:30 PM', available: true },
    { time: '02:00 PM', available: true },
    { time: '02:30 PM', available: true },
    { time: '03:00 PM', available: true },
    { time: '03:30 PM', available: true },
    { time: '04:00 PM', available: true },
    { time: '04:30 PM', available: true }
  ];

  useEffect(() => {
    fetchAppointments();
  }, [userData]);

  const fetchAppointments = async () => {
    try {
      let q;
      if (userData?.role === 'patient') {
        q = query(
          collection(db, 'appointments'),
          where('patientId', '==', userData.uid),
          orderBy('createdAt', 'desc')
        );
      } else {
        q = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'));
      }

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const handleServiceSelect = (service) => {
    setFormData({
      ...formData,
      service: service.name,
      price: service.price
    });
    setStep(2);
  };

  const handleDateTimeSelect = (date, time) => {
    setFormData({
      ...formData,
      date: date,
      time: time
    });
    setStep(3);
  };

  const handlePaymentSelect = (method) => {
    setFormData({
      ...formData,
      paymentMethod: method
    });
    setStep(4);
  };

  const handleSubmit = async () => {
    try {
      const appointmentData = {
        patientId: userData.uid,
        patientName: userData.fullName,
        patientEmail: userData.email,
        service: formData.service,
        price: formData.price,
        date: formData.date,
        time: formData.time,
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentMethod === 'cash' ? 'pending' : 'paid',
        status: 'pending',
        notes: formData.notes,
        doctorName: 'Dr. Estandarte',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'appointments'), appointmentData);
      
      alert('Appointment booked successfully!');
      setShowModal(false);
      setStep(1);
      setFormData({
        service: '',
        date: '',
        time: '',
        paymentMethod: 'cash',
        notes: '',
        price: 0
      });
      
      fetchAppointments();
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Error booking appointment. Please try again.');
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

  const resetBooking = () => {
    setStep(1);
    setFormData({
      service: '',
      date: '',
      time: '',
      paymentMethod: 'cash',
      notes: '',
      price: 0
    });
  };

  return (
    <div className="appointments-page">
      <div className="page-header">
        <h1 className="page-title">
          {userData?.role === 'patient' ? 'Book Appointment' : 'Appointments'}
        </h1>
        {userData?.role === 'patient' && !showModal && (
          <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
            📅 Book New Appointment
          </button>
        )}
      </div>

      {/* My Appointments List */}
      {!showModal && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              {userData?.role === 'patient' ? '📋 My Appointments' : '📋 All Appointments'}
            </h3>
          </div>

          {appointments.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    {userData?.role !== 'patient' && <th>Patient</th>}
                    <th>Service</th>
                    <th>Price</th>
                    <th>Payment</th>
                    <th>Status</th>
                    {userData?.role !== 'patient' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt) => (
                    <tr key={apt.id}>
                      <td>{apt.date}</td>
                      <td>{apt.time}</td>
                      {userData?.role !== 'patient' && <td>{apt.patientName}</td>}
                      <td>{apt.service}</td>
                      <td style={{ fontWeight: '600', color: 'var(--primary)' }}>
                        {formatCurrency(apt.price)}
                      </td>
                      <td>
                        <span className={`badge ${apt.paymentMethod === 'cash' ? 'badge-info' : 'badge-success'}`}>
                          {apt.paymentMethod === 'cash' ? '💵 Cash' : '📱 GCash'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(apt.status)}`}>
                          {apt.status}
                        </span>
                      </td>
                      {userData?.role !== 'patient' && (
                        <td>
                          <div className="table-actions">
                            {apt.status === 'pending' && (
                              <button 
                                className="btn btn-success btn-sm"
                                onClick={() => updateDoc(doc(db, 'appointments', apt.id), { status: 'confirmed' }).then(fetchAppointments)}
                              >
                                Confirm
                              </button>
                            )}
                            <button 
                              className="btn btn-danger btn-sm"
                              onClick={() => {
                                if (confirm('Cancel appointment?')) {
                                  updateDoc(doc(db, 'appointments', apt.id), { status: 'cancelled' }).then(fetchAppointments);
                                }
                              }}
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
          ) : (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <p style={{ color: 'var(--gray)', fontSize: '1.1rem', marginBottom: '20px' }}>
                No appointments yet
              </p>
              {userData?.role === 'patient' && (
                <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
                  📅 Book Your First Appointment
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Booking Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '700px', padding: '30px' }}>
            {/* Modal Header */}
            <div className="modal-header">
              <div>
                <h2 style={{ marginBottom: '5px' }}>
                  {step === 1 && '📅 Select Service'}
                  {step === 2 && '📆 Select Date & Time'}
                  {step === 3 && '💳 Payment Method'}
                  {step === 4 && '✅ Confirm Booking'}
                </h2>
                <p style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>
                  Step {step} of 4
                </p>
              </div>
              <button className="modal-close" onClick={() => { setShowModal(false); resetBooking(); }}>&times;</button>
            </div>

            {/* Progress Bar */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
              {[1, 2, 3, 4].map((s) => (
                <div 
                  key={s}
                  style={{ 
                    flex: 1, 
                    height: '8px', 
                    borderRadius: '4px',
                    background: s <= step ? 'var(--primary)' : 'var(--light)'
                  }}
                />
              ))}
            </div>

            {/* Step 1: Select Service */}
            {step === 1 && (
              <div>
                <p style={{ marginBottom: '20px', color: 'var(--gray)' }}>
                  Choose a dental service:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', maxHeight: '400px', overflowY: 'auto' }}>
                  {services.map((service, index) => (
                    <div 
                      key={index}
                      onClick={() => handleServiceSelect(service)}
                      style={{ 
                        padding: '20px', 
                        background: 'var(--light)', 
                        borderRadius: '12px',
                        cursor: 'pointer',
                        border: '2px solid transparent',
                        transition: 'all 0.3s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ fontSize: '2rem' }}>{service.icon}</div>
                        <div>
                          <div style={{ fontWeight: '600' }}>{service.name}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>{service.desc}</div>
                          <div style={{ color: 'var(--primary)', fontWeight: '700', marginTop: '5px' }}>
                            {formatCurrency(service.price)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Select Date & Time */}
            {step === 2 && (
              <div>
                <div className="form-group">
                  <label className="form-label">📅 Select Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">🕐 Select Time</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    {timeSlots.map((slot, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleDateTimeSelect(formData.date, slot.time)}
                        disabled={!formData.date}
                        style={{ 
                          padding: '12px',
                          border: formData.time === slot.time ? '2px solid var(--primary)' : '2px solid var(--light)',
                          borderRadius: '8px',
                          background: formData.time === slot.time ? 'var(--primary)' : 'white',
                          color: formData.time === slot.time ? '#000' : 'var(--dark)',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">📝 Notes (Optional)</label>
                  <textarea
                    className="form-control"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any special concerns or requests..."
                    rows="3"
                  />
                </div>

                <button 
                  className="btn btn-outline" 
                  onClick={() => setStep(1)}
                  style={{ marginTop: '10px' }}
                >
                  ← Back
                </button>
              </div>
            )}

            {/* Step 3: Payment Method */}
            {step === 3 && (
              <div>
                <p style={{ marginBottom: '20px', color: 'var(--gray)' }}>
                  Choose payment method:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '30px' }}>
                  {/* Cash Option */}
                  <div 
                    onClick={() => handlePaymentSelect('cash')}
                    style={{ 
                      padding: '30px', 
                      background: formData.paymentMethod === 'cash' ? 'var(--primary)' : 'var(--light)',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      border: '3px solid ' + (formData.paymentMethod === 'cash' ? 'var(--primary)' : 'transparent')
                    }}
                  >
                    <div style={{ fontSize: '3rem', marginBottom: '10px' }}>💵</div>
                    <div style={{ fontWeight: '600', fontSize: '1.2rem' }}>Pay with Cash</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '5px' }}>
                      Pay at the clinic
                    </div>
                  </div>

                  {/* GCash Option */}
                  <div 
                    onClick={() => handlePaymentSelect('gcash')}
                    style={{ 
                      padding: '30px', 
                      background: formData.paymentMethod === 'gcash' ? 'var(--primary)' : 'var(--light)',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      border: '3px solid ' + (formData.paymentMethod === 'gcash' ? 'var(--primary)' : 'transparent')
                    }}
                  >
                    <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📱</div>
                    <div style={{ fontWeight: '600', fontSize: '1.2rem' }}>Pay with GCash</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '5px' }}>
                      Pay online now
                    </div>
                  </div>
                </div>

                <button className="btn btn-outline" onClick={() => setStep(2)}>
                  ← Back
                </button>
              </div>
            )}

            {/* Step 4: Confirm Booking */}
            {step === 4 && (
              <div>
                {/* Booking Summary */}
                <div style={{ 
                  background: 'var(--light)', 
                  padding: '25px', 
                  borderRadius: '16px',
                  marginBottom: '25px'
                }}>
                  <h3 style={{ marginBottom: '20px', borderBottom: '2px solid var(--primary)', paddingBottom: '10px' }}>
                    📋 Booking Summary
                  </h3>
                  
                  <div style={{ display: 'grid', gap: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Service:</span>
                      <strong>{formData.service}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Date:</span>
                      <strong>{formData.date}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Time:</span>
                      <strong>{formData.time}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Dentist:</span>
                      <strong>Dr. Estandarte</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Payment:</span>
                      <strong>{formData.paymentMethod === 'cash' ? '💵 Cash' : '📱 GCash'}</strong>
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--gray)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem' }}>
                      <span>Total Amount:</span>
                      <strong style={{ color: 'var(--primary)' }}>{formatCurrency(formData.price)}</strong>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div style={{ 
                  background: 'var(--info-light)', 
                  padding: '15px', 
                  borderRadius: '12px',
                  marginBottom: '25px',
                  fontSize: '0.9rem'
                }}>
                  <p style={{ margin: 0 }}>
                    ℹ️ By confirming, you agree to our booking terms. 
                    {formData.paymentMethod === 'cash' 
                      ? ' Please arrive 15 minutes early and pay at the clinic.' 
                      : ' Your GCash payment will be processed immediately.'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button className="btn btn-outline" onClick={() => setStep(3)} style={{ flex: 1 }}>
                    ← Back
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleSubmit}
                    style={{ flex: 2 }}
                  >
                    ✅ Confirm Booking
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Appointments;