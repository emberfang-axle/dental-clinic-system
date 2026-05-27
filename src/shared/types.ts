/**
 * Shared TypeScript domain types.
 * Used across modules, services and components.
 */

export type Role = "admin" | "doctor" | "co-doctor" | "staff" | "patient";
export type StaffSubRole = "billing_specialist" | "appointment_scheduler" | "general";

export interface MedicalHistory {
  allergies: string;
  currentMedications: string;
  previousDentalWork: string;
  medicalConditions: string;
}

export interface User {
  id: string;
  patientNo?: string;        // Human-readable ID e.g. "PT-0001" — patients only
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: Role;
  subRole?: StaffSubRole;
  phone?: string;
  address?: string;
  active?: boolean;
  avatarUrl?: string;
  medicalHistory?: MedicalHistory;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  priceMax?: number;
  duration: number;
  description: string;
  /** Shown on landing/booking for high-value treatments (e.g. braces). */
  requiresDeposit?: boolean;
}

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "no-show"
  | "rescheduled";

export type PaymentStatus = "unpaid" | "paid";

export type PaymentMethod = "cash" | "gcash";
export type AppointmentSource = "online" | "facebook" | "sms" | "walk-in";

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  serviceId: string;
  serviceName: string;
  price: number;
  doctor: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  source?: AppointmentSource;
  notes?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  dentalHistory?: string;
  complaint?: string;
  prescription?: string;
  followUpDate?: string;
  progressNoteAt?: string;
  progressNoteBy?: string;
  toothChart?: Record<string, string>;
  supportNote?: string;
  receiptNumber?: string;
  calendarEventId?: string;
  rescheduledAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt?: string;
}

/** Per-doctor schedule overrides. If absent, clinic defaults apply. */
export interface DoctorSchedule {
  doctorName: string;
  timeSlots: string[];       // e.g. ["09:00","10:00"]
  blockedDates: string[];    // YYYY-MM-DD
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
  /** When true, name and text may appear on the public landing page (4+ stars). */
  showOnLanding?: boolean;
}

export interface BlockedSlot {
  id?: string;
  date: string;
  time: string;
  reason?: string;
}

export interface ClinicSettings {
  workingHoursStart: string;
  workingHoursEnd: string;
  bookingInterval: number;
  maxAppointmentsPerDay: number;
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
