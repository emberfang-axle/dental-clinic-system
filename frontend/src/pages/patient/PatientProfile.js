import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db, auth } from "../../services/firebase";
import { useAuth } from "../../context/AuthContext";

function PatientProfile() {

  const { user, userData } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [avatar, setAvatar] = useState(userData?.photoURL || "");

  const [formData, setFormData] = useState({
    fullName: userData?.fullName || "",
    phone: userData?.phone || "",
    address: userData?.address || ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // avatar upload preview
  const handleAvatarChange = (e) => {

    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setAvatar(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {

      // update firebase auth
      await updateProfile(auth.currentUser, {
        displayName: formData.fullName,
        photoURL: avatar
      });

      // update firestore
      await updateDoc(doc(db, "users", user.uid), {
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        photoURL: avatar,
        updatedAt: new Date().toISOString()
      });

      setMessage("Profile updated successfully!");
      setIsEditing(false);

    } catch (error) {

      console.error(error);
      setMessage("Error updating profile");

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="profile-page">

      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
      </div>

      <div className="card" style={{ maxWidth: "600px" }}>

        {/* Avatar Section */}

        <div style={{ textAlign: "center", marginBottom: "30px" }}>

          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              overflow: "hidden",
              margin: "0 auto",
              background: "#e2e8f0"
            }}
          >

            {avatar ? (

              <img
                src={avatar}
                alt="avatar"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }}
              />

            ) : (

              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "40px",
                  color: "#64748b"
                }}
              >
                {userData?.fullName?.charAt(0) || "U"}
              </div>

            )}

          </div>

          {isEditing && (

            <div style={{ marginTop: "10px" }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </div>

          )}

        </div>

        {/* Messages */}

        {message && (

          <div
            style={{
              padding: "10px",
              marginBottom: "20px",
              borderRadius: "6px",
              background: message.includes("Error")
                ? "#fee2e2"
                : "#dcfce7"
            }}
          >
            {message}
          </div>

        )}

        {/* EDIT FORM */}

        {isEditing ? (

          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label>Full Name</label>
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
              <label>Email</label>
              <input
                type="email"
                className="form-control"
                value={user?.email}
                disabled
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Address</label>
              <textarea
                name="address"
                className="form-control"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save"}
              </button>

              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>

            </div>

          </form>

        ) : (

          <div>

            <p><strong>Name:</strong> {userData?.fullName}</p>

            <p><strong>Email:</strong> {user?.email}</p>

            <p><strong>Phone:</strong> {userData?.phone || "Not set"}</p>

            <p><strong>Address:</strong> {userData?.address || "Not set"}</p>

            <button
              className="btn btn-outline"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>

          </div>

        )}

      </div>

    </div>
  );
}

export default PatientProfile;