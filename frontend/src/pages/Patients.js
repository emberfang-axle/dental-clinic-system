import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

function Patients() {
  const { userData } = useAuth();
  const [patients, setPatients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [viewPatient, setViewPatient] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    address: '',
    medicalHistory: '',
    allergies: '',
    emergencyContact: '',
    emergencyPhone: ''
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const q = query(collection(db, 'patients'), orderBy('fullName', 'asc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'patients'), {
        ...formData,
        createdAt: new Date().toISOString()
      });
      setShowModal(false);
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        age: '',
        gender: '',
        address: '',
        medicalHistory: '',
        allergies: '',
        emergencyContact: '',
        emergencyPhone: ''
      });
      fetchPatients();
    } catch (error) {
      console.error('Error adding patient:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await deleteDoc(doc(db, 'patients', id));
        fetchPatients();
      } catch (error) {
        console.error('Error deleting patient:', error);
      }
    }
  };

  return (
    <div className="patients-page">
      <div className="page-header">
        <h1 className="page-title">Patients</h1>
        {(userData?.role === 'doctor' || userData?.role === 'staff') && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Add Patient
          </button>
        )}
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <td>{patient.fullName}</td>
                  <td>{patient.email}</td>
                  <td>{patient.phone}</td>
                  <td>{patient.age}</td>
                  <td>{patient.gender}</td>
                  <td>
                    <div className="table-actions">
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => setViewPatient(patient)}
                      >
                        View
                      </button>
                      {(userData?.role === 'doctor' || userData?.role === 'staff') && (
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(patient.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
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
              <h2>Add New Patient</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" name="fullName" className="form-control" value={formData.fullName} onChange={handleChange} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" name="email" className="form-control" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="tel" name="phone" className="form-control" value={formData.phone} onChange={handleChange} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input type="number" name="age" className="form-control" value={formData.age} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select name="gender" className="form-control" value={formData.gender} onChange={handleChange} required>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea name="address" className="form-control" value={formData.address} onChange={handleChange} rows="2" />
              </div>
              <div className="form-group">
                <label className="form-label">Medical History</label>
                <textarea name="medicalHistory" className="form-control" value={formData.medicalHistory} onChange={handleChange} rows="2" />
              </div>
              <div className="form-group">
                <label className="form-label">Allergies</label>
                <input type="text" name="allergies" className="form-control" value={formData.allergies} onChange={handleChange} placeholder="List any allergies" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Emergency Contact</label>
                  <input type="text" name="emergencyContact" className="form-control" value={formData.emergencyContact} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Emergency Phone</label>
                  <input type="tel" name="emergencyPhone" className="form-control" value={formData.emergencyPhone} onChange={handleChange} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Patient</button>
            </form>
          </div>
        </div>
      )}

      {viewPatient && (
        <div className="modal-overlay" onClick={() => setViewPatient(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Patient Details</h2>
              <button className="modal-close" onClick={() => setViewPatient(null)}>&times;</button>
            </div>
            <div style={{ marginTop: '20px' }}>
              <p><strong>Name:</strong> {viewPatient.fullName}</p>
              <p><strong>Email:</strong> {viewPatient.email}</p>
              <p><strong>Phone:</strong> {viewPatient.phone}</p>
              <p><strong>Age:</strong> {viewPatient.age}</p>
              <p><strong>Gender:</strong> {viewPatient.gender}</p>
              <p><strong>Address:</strong> {viewPatient.address}</p>
              <p><strong>Medical History:</strong> {viewPatient.medicalHistory || 'None'}</p>
              <p><strong>Allergies:</strong> {viewPatient.allergies || 'None'}</p>
              <p><strong>Emergency Contact:</strong> {viewPatient.emergencyContact} - {viewPatient.emergencyPhone}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Patients;