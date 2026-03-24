import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../../services/firebase";
import { useAuth } from "../../context/AuthContext";

import {
  FaTooth,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaMobileAlt,
  FaCheckCircle
} from "react-icons/fa";

function PatientAppointments() {
  const { userData } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    service: "",
    date: "",
    time: "",
    paymentMethod: "cash",
    notes: "",
    price: 0
  });

  // Professional services list
  const services = [
    {
      name: "Check-up",
      price: 500,
      desc: "Regular dental check-up",
      icon: <FaTooth size={28} />
    },
    {
      name: "Cleaning",
      price: 1500,
      desc: "Professional teeth cleaning",
      icon: <FaTooth size={28} />
    },
    {
      name: "Tooth Extraction",
      price: 2000,
      desc: "Simple tooth extraction",
      icon: <FaTooth size={28} />
    },
    {
      name: "Fillings",
      price: 1000,
      desc: "Dental filling procedure",
      icon: <FaTooth size={28} />
    },
    {
      name: "Root Canal",
      price: 5000,
      desc: "Root canal treatment",
      icon: <FaTooth size={28} />
    },
    {
      name: "Whitening",
      price: 3000,
      desc: "Teeth whitening",
      icon: <FaTooth size={28} />
    },
    {
      name: "Dental Crown",
      price: 8000,
      desc: "Dental crown placement",
      icon: <FaTooth size={28} />
    },
    {
      name: "Braces",
      price: 25000,
      desc: "Braces installation",
      icon: <FaTooth size={28} />
    },
    {
      name: "Implant",
      price: 15000,
      desc: "Dental implant",
      icon: <FaTooth size={28} />
    }
  ];

  const timeSlots = [
    "09:00 AM",
    "09:30 AM",
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "01:00 PM",
    "01:30 PM",
    "02:00 PM",
    "02:30 PM",
    "03:00 PM",
    "03:30 PM",
    "04:00 PM",
    "04:30 PM"
  ];

  useEffect(() => {
    fetchAppointments();
  }, [userData]);

  const fetchAppointments = async () => {
    try {
      let q;

      if (userData?.role === "patient") {
        q = query(
          collection(db, "appointments"),
          where("patientId", "==", userData.uid),
          orderBy("createdAt", "desc")
        );
      } else {
        q = query(collection(db, "appointments"), orderBy("createdAt", "desc"));
      }

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setAppointments(data);
    } catch (error) {
      console.error(error);
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

  const handleDateTimeSelect = (time) => {
    setFormData({
      ...formData,
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
        paymentStatus:
          formData.paymentMethod === "cash" ? "pending" : "paid",
        status: "pending",
        notes: formData.notes,
        doctorName: "Dr. Estandarte",
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "appointments"), appointmentData);

      alert("Appointment booked successfully!");

      setShowModal(false);
      resetBooking();

      fetchAppointments();
    } catch (error) {
      console.error(error);
      alert("Error booking appointment");
    }
  };

  const resetBooking = () => {
    setStep(1);

    setFormData({
      service: "",
      date: "",
      time: "",
      paymentMethod: "cash",
      notes: "",
      price: 0
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP"
    }).format(amount);
  };

  return (
    <div className="appointments-page">

      <div className="page-header">
        <h1>Book Appointment</h1>

        {!showModal && (
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <FaCalendarAlt style={{ marginRight: 8 }} />
            Book New Appointment
          </button>
        )}
      </div>

      {!showModal && (
        <div className="card">

          <h3>My Appointments</h3>

          {appointments.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Service</th>
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
                    <td>{formatCurrency(apt.price)}</td>
                    <td>{apt.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No appointments yet</p>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal">

          {step === 1 && (
            <>
              <h2>Select Service</h2>

              <div className="service-grid">
                {services.map((service, index) => (
                  <div
                    key={index}
                    className="service-card"
                    onClick={() => handleServiceSelect(service)}
                  >
                    <div className="icon">{service.icon}</div>

                    <h4>{service.name}</h4>

                    <p>{service.desc}</p>

                    <strong>{formatCurrency(service.price)}</strong>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2>Select Date & Time</h2>

              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />

              <div className="time-grid">
                {timeSlots.map((time, index) => (
                  <button
                    key={index}
                    onClick={() => handleDateTimeSelect(time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2>Payment Method</h2>

              <button onClick={() => handlePaymentSelect("cash")}>
                <FaMoneyBillWave /> Cash
              </button>

              <button onClick={() => handlePaymentSelect("gcash")}>
                <FaMobileAlt /> GCash
              </button>
            </>
          )}

          {step === 4 && (
            <>
              <h2>Confirm Booking</h2>

              <p>Service: {formData.service}</p>
              <p>Date: {formData.date}</p>
              <p>Time: {formData.time}</p>
              <p>Total: {formatCurrency(formData.price)}</p>

              <button onClick={handleSubmit}>
                <FaCheckCircle /> Confirm
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default PatientAppointments;