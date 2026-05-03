/**
 * Shared TypeScript domain types.
 * Used across modules, services and components.
 */

export type Role = "admin" | "doctor" | "staff" | "patient";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  active?: boolean;
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
  | "completed"
  | "cancelled";

export type PaymentStatus =
  | "unpaid"
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
  at: string;
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

export interface StaffPermission {
  staffId: string;
  appointments: boolean;
  payments: boolean;
  records: boolean;
  adminSupport: boolean;
}

/** Sidebar navigation tab definition. */
export interface DashboardTab {
  id: string;
  label: string;
  icon: string;
}
