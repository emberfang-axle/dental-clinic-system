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
  if (role === "doctor") return "Doctor";
  if (role === "staff") return "Staff";
  return "Patient";
}

export function roleLabel(role: Role): string {
  if (role === "doctor") return "Doctor · Owner / Admin";
  if (role === "staff") return "Staff · Admin Support";
  return "Patient · Client";
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString();
}

/** Convert a paid appointment into a downloadable text-based receipt URL. */
export function receiptHref(a: Appointment): string {
  const body = [
    "Estandarte Dental Clinic",
    `Receipt No: ${a.receiptNumber || "Pending"}`,
    `Patient: ${a.patientName}`,
    `Service: ${a.serviceName}`,
    `Date: ${a.date} ${a.time}`,
    `Payment Method: ${a.paymentMethod.toUpperCase()}`,
    `Amount: ₱${a.price.toLocaleString()}`,
  ].join("\n");
  return `data:text/plain;charset=utf-8,${encodeURIComponent(body)}`;
}

/** Map a role to its dashboard route. */
export function dashboardPathFor(role: Role): string {
  if (role === "doctor") return ROUTES.doctorDashboard;
  if (role === "staff") return ROUTES.staffDashboard;
  return ROUTES.patientDashboard;
}

export function canAccessRoute(path: string, role: Role | undefined): boolean {
  if (!path.startsWith(ROUTES.dashboard)) return true;
  if (!role) return false;
  if (path === ROUTES.dashboard) return true;
  if (path === ROUTES.doctorDashboard) return role === "doctor";
  if (path === ROUTES.staffDashboard) return role === "staff";
  if (path === ROUTES.patientDashboard) return role === "patient";
  return false;
}
