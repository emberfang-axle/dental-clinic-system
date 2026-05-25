/**
 * Pure utility helpers used across modules.
 * No React, no side effects.
 */

import type { Role } from "./types";
import { ROUTES } from "./constants";

export function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export function shortRole(role: Role): string {
  const map: Record<Role, string> = { admin: "Admin", doctor: "Doctor", "co-doctor": "Co-Doctor", staff: "Staff", patient: "Patient" };
  return map[role] ?? role;
}

export function roleLabel(role: Role): string {
  const map: Record<Role, string> = {
    admin: "Admin · System Owner",
    doctor: "Doctor · Owner / Admin",
    "co-doctor": "Co-Doctor · Associate",
    staff: "Staff · Admin Support",
    patient: "Patient · Client",
  };
  return map[role] ?? role;
}

/** Returns today's date as YYYY-MM-DD in local time. */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Returns current month as YYYY-MM. */
export function thisMonth(): string {
  return today().slice(0, 7);
}

/** Pluralise a word: plural(3, "appointment") → "3 appointments" */
export function plural(n: number, word: string): string {
  return `${n} ${word}${n !== 1 ? "s" : ""}`;
}

/** Format a 24h time string to 12h display e.g. "09:00" → "9:00 AM" */
export function formatTime12h(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  return new Date(0, 0, 0, h, m).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-PH", { dateStyle: "medium" });
}

/** Map a role to its dashboard route. */
export function dashboardPathFor(role: Role): string {
  if (role === "admin")     return ROUTES.adminDashboard;
  if (role === "doctor")    return ROUTES.doctorDashboard;
  if (role === "co-doctor") return ROUTES.coDoctorDashboard;
  if (role === "staff")     return ROUTES.staffDashboard;
  return ROUTES.patientDashboard;
}

export function canAccessRoute(path: string, role: Role | undefined): boolean {
  if (!path.startsWith(ROUTES.dashboard)) return true;
  if (!role) return false;
  if (path === ROUTES.dashboard)          return true;
  if (path === ROUTES.adminDashboard)     return role === "admin" || role === "doctor";
  if (path === ROUTES.doctorDashboard)    return role === "doctor";
  if (path === ROUTES.coDoctorDashboard)  return role === "co-doctor";
  if (path === ROUTES.staffDashboard)     return role === "staff";
  if (path === ROUTES.patientDashboard)   return role === "patient";
  return false;
}
