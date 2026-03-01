import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

function Doctors() {
  const { userData } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

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

  const filteredDoctors = doctors.filter(doctor =>
    doctor.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="doctors-page">
      <div className="page-header">
        <h1 className="page-title">Find a Doctor</h1>
      </div>

      <div className="card">
        <div className="form-group">
          <input
            type="text"
            className="form-control"
            placeholder="Search doctor by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="doctor-grid">
          {filteredDoctors.map((doctor) => (
            <div key={doctor.id} className="doctor-card">
              <div className="doctor-avatar">👨‍⚕️</div>
              <h3 className="doctor-name">{doctor.fullName}</h3>
              <p className="doctor-specialty">General Dentist</p>
              <p style={{ color: '#64748b', marginBottom: '15px' }}>{doctor.email}</p>
              <button 
                className="btn btn-primary"
                onClick={() => setSelectedDoctor(doctor)}
              >
                Book Appointment
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedDoctor && (
        <div className="modal-overlay" onClick={() => setSelectedDoctor(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Book Appointment</h2>
              <button className="modal-close" onClick={() => setSelectedDoctor(null)}>&times;</button>
            </div>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <div className="doctor-avatar" style={{ margin: '0 auto 15px' }}>👨‍⚕️</div>
              <h3>{selectedDoctor.fullName}</h3>
              <p style={{ color: '#64748b' }}>{selectedDoctor.email}</p>
              <p style={{ marginTop: '15px' }}>
                <strong>Specialty:</strong> General Dentistry
              </p>
              <p style={{ marginTop: '10px' }}>
                <strong>Availability:</strong> Mon-Fri, 9AM-5PM
              </p>
              <button 
                className="btn btn-primary" 
                style={{ marginTop: '20px' }}
                onClick={() => {
                  setSelectedDoctor(null);
                  window.location.href = '/appointments';
                }}
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Doctors;