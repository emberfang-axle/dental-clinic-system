/**
 * App-wide constants.
 * Centralized so they can be reused across modules.
 */

import type { DashboardTab, Role } from "./types";

export const CLINIC = {
  name: "Estandarte Dental Clinic",
  address: "Purok 12 J.P Laurel Street, Poblacion, Compostela, Davao de Oro (in front of Trubank)",
  phone: "0910 761 4956",
  email: "drkingestandarte2022@gmail.com",
  facebookUrl: "https://www.facebook.com/Estandartedentalclinic",
  hours: "Mon–Fri: 9:00 AM – 4:00 PM · Sat: 8:00 AM – 4:00 PM",
  yearFounded: 2022,
} as const;

export const BOOKING = {
  TIME_SLOTS: ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"] as const,
};

/** Sidebar tabs per role — used by DashboardLayout.
 *  Each list: pinned-first items → alphabetical middle → pinned-last items.
 */
export const DASHBOARD_TABS: Record<Role, DashboardTab[]> = {
  admin: [
    { id: "overview",      label: "Overview",          icon: "" },
    // ── alphabetical ──
    { id: "announcements", label: "Announcements",     icon: "" },
    { id: "appointments",  label: "Appointments",      icon: "" },
    { id: "audit",         label: "Audit Logs",        icon: "" },
    { id: "clinical",      label: "Clinical Records",  icon: "" },
    { id: "feedback",      label: "Patient Feedback",  icon: "" },
    { id: "notifications", label: "Notifications",     icon: "" },
    { id: "payments",      label: "Payments",          icon: "" },
    { id: "reports",       label: "Analytics",         icon: "" },
    { id: "schedule",      label: "Schedule & Rules",  icon: "" },
    { id: "services",      label: "Services & Pricing",icon: "" },
    { id: "staff",         label: "Staff Accounts",    icon: "" },
    // ── pinned last ──
    { id: "profile",       label: "Profile",           icon: "" },
    { id: "settings",      label: "Integrations",      icon: "" },
  ],
  doctor: [
    { id: "overview",      label: "Overview",          icon: "" },
    // ── alphabetical ──
    { id: "announcements", label: "Announcements",     icon: "" },
    { id: "appointments",  label: "Appointments",      icon: "" },
    { id: "audit",         label: "Audit Logs",        icon: "" },
    { id: "clinical",      label: "Clinical Records",  icon: "" },
    { id: "feedback",      label: "Patient Feedback",  icon: "" },
    { id: "notifications", label: "Notifications",     icon: "" },
    { id: "payments",      label: "Payments",          icon: "" },
    { id: "reports",       label: "Analytics",         icon: "" },
    { id: "schedule",      label: "Schedule & Rules",  icon: "" },
    { id: "services",      label: "Services & Pricing",icon: "" },
    { id: "staff",         label: "Staff Accounts",    icon: "" },
    // ── pinned last ──
    { id: "profile",       label: "Profile",           icon: "" },
  ],
  "co-doctor": [
    { id: "overview",      label: "Dashboard",       icon: "" },
    // ── alphabetical ──
    { id: "announcements", label: "Clinic Updates",  icon: "" },
    { id: "appointments",  label: "Appointments",    icon: "" },
    { id: "clinical",      label: "Patient Records", icon: "" },
    { id: "notifications", label: "Notifications",   icon: "" },
    // ── pinned last ──
    { id: "profile",       label: "My Profile",      icon: "" },
  ],
  staff: [
    { id: "overview",      label: "Overview",          icon: "" },
    // ── alphabetical ──
    { id: "appointments",  label: "Appointments",      icon: "" },
    { id: "queue",         label: "Daily Queue",       icon: "" },
    { id: "notifications", label: "Notifications",     icon: "" },
    { id: "payments",      label: "Payments",          icon: "" },
    { id: "records",       label: "Records Support",   icon: "" },
    // ── pinned last ──
    { id: "profile",       label: "Profile",           icon: "" },
  ],
  patient: [
    { id: "home",              label: "Home",              icon: "" },
    // ── alphabetical ──
    { id: "feedback",          label: "Feedback",          icon: "" },
    { id: "my-appointments",   label: "My Appointments",   icon: "" },
    { id: "notifications",     label: "Notifications",     icon: "" },
    { id: "payments",          label: "Payments",          icon: "" },
    { id: "treatment-records", label: "Treatment Records", icon: "" },
    // ── pinned last ──
    { id: "profile",           label: "Profile",           icon: "" },
  ],
};

export const ROUTES = {
  home: "/",
  login: "/login",
  adminLogin: "/admin-login",
  register: "/register",
  book: "/book",
  dashboard: "/dashboard",
  adminDashboard: "/dashboard/admin",
  doctorDashboard: "/dashboard/doctor",
  coDoctorDashboard: "/dashboard/co-doctor",
  staffDashboard: "/dashboard/staff",
  patientDashboard: "/dashboard/patient",
} as const;
