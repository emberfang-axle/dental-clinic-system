import React, { useState, useEffect } from "react";
import logo from "../../assets/logo.jpg"; // adjust path if needed
import { db } from "../../services/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

export default function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "Active",
  });

  // Fetch patients from Firestore
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "patients"));
        const patientList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPatients(patientList);
      } catch (error) {
        console.error("Error fetching patients:", error);
      }
    };

    fetchPatients();
  }, []);

  // Handle form input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Add patient to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "patients"), formData);
      alert("Patient added successfully!");
      setFormData({ name: "", email: "", phone: "", status: "Active" });

      // Refresh patient list
      const querySnapshot = await getDocs(collection(db, "patients"));
      const patientList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPatients(patientList);
    } catch (error) {
      console.error("Error adding patient:", error);
    }
  };

  return (
    <div className="dashboard-container doctor-theme">
      <div className="dashboard-box">
        {/* Header */}
        <div className="dashboard-header">
          <img src={logo} alt="Clinic Logo" />
          <h2 className="dashboard-title">Doctor - Patient Management</h2>
          <p className="dashboard-subtitle">View and manage patient records</p>
        </div>

        {/* Patient List Section */}
        <div className="dashboard-section">
          <h3>Patient Records</h3>
          <div className="dashboard-card">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f3f4f6" }}>
                  <th style={{ padding: "12px", textAlign: "left" }}>Name</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Email</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Phone</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "12px" }}>{patient.name}</td>
                    <td style={{ padding: "12px" }}>{patient.email}</td>
                    <td style={{ padding: "12px" }}>{patient.phone}</td>
                    <td style={{ padding: "12px" }}>{patient.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Patient Section */}
        <div className="dashboard-section">
          <h3>Add New Patient</h3>
          <div className="dashboard-card">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter patient name"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter patient email"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input
                  type="text"
                  name="phone"
                  className="form-control"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter patient phone"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  name="status"
                  className="form-control"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="btn-container">
                <button type="submit" className="btn btn-primary btn-lg">
                  Add Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};