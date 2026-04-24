/**
 * App-wide constants.
 * Centralized so they can be reused across modules.
 */

import type { DashboardTab, Role } from "./types";

export const CLINIC = {
  name: "Estandarte Dental Clinic",
  address: "(infront of 1st trubank) Poblacion Compostela Davao De Oro, Compostela, Philippines, 8803",
  phone: "0910 761 4956",
  email: "drkingestandarte2022@gmail.com",
  facebookUrl: "https://www.facebook.com/Estandartedentalclinic",
  hours: "Mon — Fri : 9 AM — 4 PM",
  yearFounded: 2022,
} as const;

export const BOOKING = {
  TIME_SLOTS: ["09:00", "10:00", "11:00", "1:00", "2:00", "3:00", "4:00"] as const,
};

/** Sidebar tabs per role — used by DashboardLayout. */
export const DASHBOARD_TABS: Record<Role, DashboardTab[]> = {
  doctor: [
    { id: "clinical", label: "Clinical Records", icon: "🦷" },
    { id: "appointments", label: "Appointments", icon: "📅" },
    { id: "schedule", label: "Schedule & Rules", icon: "🕒" },
    { id: "payments", label: "Payments", icon: "💳" },
    { id: "services", label: "Services & Pricing", icon: "💰" },
    { id: "staff", label: "Staff Accounts", icon: "🧑‍💼" },
    { id: "reports", label: "Analytics", icon: "📈" },
    { id: "audit", label: "Audit Logs", icon: "🔐" },
    { id: "profile", label: "Profile", icon: "👤" },
  ],
  staff: [
    { id: "queue", label: "Daily Queue", icon: "🪑" },
    { id: "appointments", label: "Appointments", icon: "📅" },
    { id: "payments", label: "Payment Verification", icon: "💳" },
    { id: "records", label: "Records Support", icon: "🧾" },
    { id: "profile", label: "Profile", icon: "👤" },
  ],
  patient: [
    { id: "my-appointments", label: "My Appointments", icon: "📅" },
    { id: "payment-center", label: "Payment Center", icon: "💳" },
    { id: "treatment-records", label: "Treatment Records", icon: "📋" },
    { id: "notifications", label: "Notifications", icon: "🔔" },
    { id: "feedback", label: "Feedback", icon: "💬" },
    { id: "profile", label: "Profile", icon: "👤" },
  ],
};

export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  book: "/book",
  dashboard: "/dashboard",
  doctorDashboard: "/dashboard/doctor",
  staffDashboard: "/dashboard/staff",
  patientDashboard: "/dashboard/patient",
} as const;
