import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

function Feedback() {
  const { userData } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [formData, setFormData] = useState({
    doctorId: '',
    doctorName: '',
    rating: 5,
    comment: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFeedbacks();
    fetchDoctors();
  }, [userData]);

  const fetchFeedbacks = async () => {
    try {
      let q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
      
      if (userData?.role === 'patient') {
        q = query(collection(db, 'feedback'), where('patientId', '==', userData.uid));
      } else if (userData?.role === 'doctor') {
        q = query(collection(db, 'feedback'), where('doctorId', '==', userData.uid));
      }

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFeedbacks(data);
    } catch (error) {
      console.error('Error fetching feedback:', error);
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
    setLoading(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        ...formData,
        patientId: userData.uid,
        patientName: userData.fullName,
        createdAt: new Date().toISOString()
      });
      setShowModal(false);
      setFormData({
        doctorId: '',
        doctorName: '',
        rating: 5,
        comment: ''
      });
      fetchFeedbacks();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <span key={index} style={{ 
        color: index < rating ? '#fbbf24' : '#e2e8f0',
        fontSize: '1.2rem'
      }}>
        ★
      </span>
    ));
  };

  return (
    <div className="feedback-page">
      <div className="page-header">
        <h1 className="page-title">Feedback</h1>
        {userData?.role === 'patient' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Give Feedback
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            {userData?.role === 'doctor' ? 'Patient Feedback' : 'My Feedback'}
          </h2>
        </div>

        {feedbacks.length > 0 ? (
          feedbacks.map((feedback) => (
            <div key={feedback.id} className="feedback-card">
              <div className="feedback-header">
                <div>
                  <strong>{feedback.patientName}</strong>
                  <span style={{ marginLeft: '10px', color: '#64748b' }}>
                    to {feedback.doctorName}
                  </span>
                </div>
                <div className="feedback-stars">
                  {renderStars(feedback.rating)}
                </div>
              </div>
              <p style={{ marginTop: '10px', color: '#334155' }}>{feedback.comment}</p>
              <p style={{ marginTop: '10px', fontSize: '0.8rem', color: '#94a3b8' }}>
                {feedback.createdAt ? new Date(feedback.createdAt).toLocaleDateString() : ''}
              </p>
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>
            No feedback yet
          </p>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Give Feedback</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Select Doctor</label>
                <select 
                  name="doctorId" 
                  className="form-control" 
                  value={formData.doctorId} 
                  onChange={handleDoctorChange}
                  required
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>{doctor.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Rating</label>
                <select 
                  name="rating" 
                  className="form-control" 
                  value={formData.rating} 
                  onChange={handleChange}
                >
                  <option value="5">★★★★★ (5)</option>
                  <option value="4">★★★★☆ (4)</option>
                  <option value="3">★★★☆☆ (3)</option>
                  <option value="2">★★☆☆☆ (2)</option>
                  <option value="1">★☆☆☆☆ (1)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Your Feedback</label>
                <textarea 
                  name="comment" 
                  className="form-control" 
                  value={formData.comment} 
                  onChange={handleChange}
                  rows="4"
                  placeholder="Share your experience..."
                  required
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Feedback;