import React, { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import logo from "../assets/logo.jpg"; // adjust path if needed

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="login-container">
        <div className="login-box">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="login-container">
        <div className="login-box">
          <p>No profile data found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Logo + Clinic Branding */}
        <div className="login-logo">
          <img src={logo} alt="Estandarte Dental Clinic Logo" className="logo-img" />
          <h2 className="clinic-title">Estandarte Dental Clinic</h2>
          <p className="clinic-subtitle">Appointment & Billing System</p>
          <h3 style={{ marginTop: "15px", fontWeight: "600", color: "#111" }}>
            Profile
          </h3>
        </div>

        {/* Profile Details */}
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <p className="form-control">{userData.fullName}</p>
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <p className="form-control">{userData.email}</p>
        </div>

        <div className="form-group">
          <label className="form-label">Phone</label>
          <p className="form-control">{userData.phone}</p>
        </div>

        <div className="form-group">
          <label className="form-label">Role</label>
          <p className="form-control">{userData.role}</p>
        </div>
      </div>
    </div>
  );
};