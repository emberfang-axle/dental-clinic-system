/**
 * Shared TypeScript domain types.
 * Used across modules, services and components.
 */

export type Role = "admin" | "doctor" | "staff" | "patient";
export type StaffSubRole = "billing_specialist" | "appointment_scheduler" | "general";

export interface MedicalHistory {
  allergies: string;
  currentMedications: string;
  previousDentalWork: string;
  medicalConditions: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  subRole?: StaffSubRole;
  phone?: string;
  active?: boolean;
  medicalHistory?: MedicalHistory;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // minutes
  description: string;
}

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "no-show"
  | "rescheduled";

export type PaymentStatus =
  | "unpaid"
  | "partial_paid"
  | "pending_verification"
  | "verified"
  | "paid";

export type PaymentMethod = "gcash" | "cash";

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  serviceId: string;
  serviceName: string;
  price: number; // locked at booking time
  doctor: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: AppointmentStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  gcashRef?: string;
  paymentScreenshotUrl?: string;
  depositAmount?: number;
  depositPaidAt?: string;
  notes?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  dentalHistory?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  supportNote?: string;
  receiptNumber?: string;
  calendarEventId?: string;
  emergency?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  before?: Record<string, unknown>; // snapshot before change
  after?: Record<string, unknown>;  // snapshot after change
  at: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  author: string;
  authorRole: Role;
  at: string;
  pinned?: boolean;
}

export type NotificationKind = "appointment" | "payment" | "reminder" | "system";

export interface NotificationEntry {
  id: string;
  userId: string;
  title: string;
  message: string;
  kind: NotificationKind;
  at: string;
  read?: boolean;
}

export interface FeedbackEntry {
  id: string;
  userId: string;
  userName: string;
  appointmentId?: string;
  stars: number;
  text: string;
  at: string;
}

export interface ClinicSettings {
  workingHoursStart: string;
  workingHoursEnd: string;
  bookingInterval: number;
  maxAppointmentsPerDay: number;
  allowEmergencyPriority: boolean;
  gcashNumber: string;
  bookingRules: string;
}

/** Action-level permissions per feature area */
export interface ActionPermissions {
  payments:     { view: boolean; verify: boolean };
  appointments: { create: boolean; reschedule: boolean; confirm: boolean };
  records:      { view: boolean; edit: boolean };
}

export interface StaffPermission {
  staffId: string;
  subRole?: StaffSubRole;
  // Legacy module-level (kept for backward compat)
  appointments: boolean;
  payments: boolean;
  records: boolean;
  adminSupport: boolean;
  // Action-level (new)
  actions?: ActionPermissions;
}

/** Sidebar navigation tab definition. */
export interface DashboardTab {
  id: string;
  label: string;
  icon: string;
}
