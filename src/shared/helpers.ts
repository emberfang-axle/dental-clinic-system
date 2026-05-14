/**
 * Pure utility helpers used across modules.
 * No React, no side effects.
 */

import type { Appointment, Role } from "./types";
import { ROUTES } from "./constants";

export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function shortRole(role: Role): string {
  if (role === "admin") return "Admin";
  if (role === "doctor") return "Doctor";
  if (role === "co-doctor") return "Co-Doctor";
  if (role === "staff") return "Staff";
  return "Patient";
}

export function roleLabel(role: Role): string {
  if (role === "admin") return "Admin · System Owner";
  if (role === "doctor") return "Doctor · Owner / Admin";
  if (role === "co-doctor") return "Co-Doctor · Associate";
  if (role === "staff") return "Staff · Admin Support";
  return "Patient · Client";
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-PH", { dateStyle: "medium" });
}

/** Convert a paid appointment into a downloadable receipt — opens print dialog. */
export function receiptHref(_a: Appointment): string {
  // Kept for backward compat — callers should use downloadInvoice() instead
  return "#";
}

/** Map a role to its dashboard route. */
export function dashboardPathFor(role: Role): string {
  if (role === "admin") return ROUTES.adminDashboard;
  if (role === "doctor") return ROUTES.doctorDashboard;
  if (role === "co-doctor") return ROUTES.coDoctorDashboard;
  if (role === "staff") return ROUTES.staffDashboard;
  return ROUTES.patientDashboard;
}

export function canAccessRoute(path: string, role: Role | undefined): boolean {
  if (!path.startsWith(ROUTES.dashboard)) return true;
  if (!role) return false;
  if (path === ROUTES.dashboard) return true;
  if (path === ROUTES.adminDashboard) return role === "admin" || role === "doctor";
  if (path === ROUTES.doctorDashboard) return role === "doctor";
  if (path === ROUTES.coDoctorDashboard) return role === "co-doctor";
  if (path === ROUTES.staffDashboard) return role === "staff";
  if (path === ROUTES.patientDashboard) return role === "patient";
  return false;
}
