import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';

function StaffBilling() {
  const { userData } = useAuth();
  const [billings, setBillings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    service: '',
    amount: '',
    status: 'Pending'
  });

  useEffect(() => {
    fetchBillings();
  }, []);

  const fetchBillings = async () => {
    try {
      const q = query(collection(db, 'billings'), orderBy('patientName', 'asc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBillings(data);
    } catch (error) {
      console.error('Error fetching billings:', error);
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
      await addDoc(collection(db, 'billings'), {
        ...formData,
        createdAt: new Date().toISOString()
      });
      setShowModal(false);
      setFormData({ patientName: '', service: '', amount: '', status: 'Pending' });
      fetchBillings();
    } catch (error) {
      console.error('Error adding billing:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this billing record?')) {
      try {
        await deleteDoc(doc(db, 'billings', id));
        fetchBillings();
      } catch (error) {
        console.error('Error deleting billing:', error);
      }
    }
  };

  return (
    <div className="staff-billing-page">
      <div className="page-header">
        <h1 className="page-title">Billing Records</h1>
        {userData?.role === 'staff' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Add Billing
          </button>
        )}
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Service</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {billings.map((billing) => (
                <tr key={billing.id}>
                  <td>{billing.patientName}</td>
                  <td>{billing.service}</td>
                  <td>{billing.amount}</td>
                  <td>{billing.status}</td>
                  <td>
                    {userData?.role === 'staff' && (
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(billing.id)}
                      >
                        Delete
                      </button>
                    )}
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
              <h2>Add New Billing</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Patient Name</label>
                <input type="text" name="patientName" className="form-control" value={formData.patientName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Service</label>
                <input type="text" name="service" className="form-control" value={formData.service} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Amount</label>
                <input type="number" name="amount" className="form-control" value={formData.amount} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select name="status" className="form-control" value={formData.status} onChange={handleChange}>
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Billing</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffBilling;