import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db, auth } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

function Profile() {
  const { user, userData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: userData?.fullName || '',
    phone: userData?.phone || '',
    address: userData?.address || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Update Firebase Auth profile
      if (formData.fullName !== user.displayName) {
        await updateProfile(auth.currentUser, {
          displayName: formData.fullName
        });
      }

      // Update Firestore user document
      await updateDoc(doc(db, 'users', user.uid), {
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        updatedAt: new Date().toISOString()
      });

      setMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'doctor': return 'Doctor';
      case 'staff': return 'Staff';
      case 'patient': return 'Patient';
      default: return 'User';
    }
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
      </div>

      <div className="card" style={{ maxWidth: '600px' }}>
        <div className="card-header">
          <h2 className="card-title">Profile Information</h2>
          {!isEditing && (
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
          )}
        </div>

        {message && (
          <div style={{ 
            padding: '10px', 
            marginBottom: '20px', 
            borderRadius: '8px',
            background: message.includes('Error') ? '#fee2e2' : '#d1fae5',
            color: message.includes('Error') ? '#dc2626' : '#059669'
          }}>
            {message}
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="fullName"
                className="form-control"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                value={user?.email || ''}
                disabled
                style={{ backgroundColor: '#f1f5f9' }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea
                name="address"
                className="form-control"
                value={formData.address}
                onChange={handleChange}
                rows="2"
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    fullName: userData?.fullName || '',
                    phone: userData?.phone || '',
                    address: userData?.address || ''
                  });
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                color: 'white',
                marginRight: '20px'
              }}>
                {userData?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 style={{ margin: 0 }}>{userData?.fullName || 'User'}</h3>
                <span className={`badge ${userData?.role === 'doctor' ? 'badge-info' : 'badge-success'}`}>
                  {getRoleLabel(userData?.role)}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#64748b', fontSize: '0.875rem' }}>Email</label>
              <p style={{ margin: '5px 0 0 0', fontWeight: '500' }}>{user?.email}</p>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#64748b', fontSize: '0.875rem' }}>Phone</label>
              <p style={{ margin: '5px 0 0 0', fontWeight: '500' }}>{userData?.phone || 'Not set'}</p>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#64748b', fontSize: '0.875rem' }}>Address</label>
              <p style={{ margin: '5px 0 0 0', fontWeight: '500' }}>{userData?.address || 'Not set'}</p>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ color: '#64748b', fontSize: '0.875rem' }}>Account Created</label>
              <p style={{ margin: '5px 0 0 0', fontWeight: '500' }}>
                {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;