import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.jpg";


function PatientDashboard() {

  const { userData } = useAuth();

  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    if (userData) {
      fetchAppointments();
    }
  }, [userData]);

  const fetchAppointments = async () => {
    try {

      const q = query(
        collection(db, "appointments"),
        where("patientId", "==", userData.uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setAppointments(data);

    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP"
    }).format(amount);
  };

  return (
    <div className="dashboard-page">

      <div className="page-header">
        <h1 className="page-title">Patient Dashboard</h1>
      </div>

      {/* If no appointment */}
      {appointments.length === 0 && (

        <div className="card" style={{ textAlign: "center", padding: "40px" }}>

          <h2>No Appointment Yet</h2>

          <p style={{ marginBottom: "20px", color: "var(--gray)" }}>
            You have not booked an appointment yet.
          </p>

          <a href="/patient/appointments" className="btn btn-primary btn-lg">
            Book Appointment
          </a>

        </div>
      )}

      {/* If appointment exists */}
      {appointments.length > 0 && (

        <div className="card">

          <div className="card-header">
            <h3 className="card-title">My Appointment</h3>
          </div>

          <div className="table-container">

            <table className="table">

              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Service</th>
                  <th>Doctor</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {appointments.map((apt) => (

                  <tr key={apt.id}>
                    <td>{apt.date}</td>
                    <td>{apt.time}</td>
                    <td>{apt.service}</td>
                    <td>{apt.doctorName}</td>
                    <td>{formatCurrency(apt.price)}</td>
                    <td>
                      <span className={`badge badge-${apt.status}`}>
                        {apt.status}
                      </span>
                    </td>
                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      )}

    </div>
  );
}

export default PatientDashboard;