import { useSyncExternalStore } from "react";
import type {
  Appointment,
  AuditLog,
  ClinicSettings,
  DoctorSchedule,
  FeedbackEntry,
  NotificationEntry,
  Service,
  StaffPermission,
  User,
  Announcement,
  WaitlistEntry,
} from "../shared/types";

export interface ToastEntry {
  id: string;
  message: string;
  kind: "success" | "error" | "info";
}

export interface AppState {
  authReady: boolean;
  profileReady: boolean;
  user: User | null;
  users: User[];
  services: Service[];
  appointments: Appointment[];
  logs: AuditLog[];
  notifications: NotificationEntry[];
  feedbacks: FeedbackEntry[];
  settings: ClinicSettings;
  staffPermissions: StaffPermission[];
  announcements: Announcement[];
  toasts: ToastEntry[];
  waitlist: WaitlistEntry[];
  doctorSchedules: DoctorSchedule[];
}

const INITIAL_STATE: AppState = {
  authReady: false,
  profileReady: false,
  user: null,
  users: [],
  services: [],
  appointments: [],
  logs: [],
  notifications: [],
  feedbacks: [],
  settings: {} as ClinicSettings,
  staffPermissions: [],
  announcements: [],
  toasts: [],
  waitlist: [],
  doctorSchedules: [],
};

let state: AppState = { ...INITIAL_STATE };

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): AppState {
  return state;
}

export function setState(partial: Partial<AppState>) {
  state = { ...state, ...partial };
  listeners.forEach((l) => l());
}

export function resetState() {
  state = { ...INITIAL_STATE };
  listeners.forEach((l) => l());
}

let toastSeq = 0;
export function showToast(message: string, kind: ToastEntry["kind"] = "info", durationMs = 4000) {
  const id = `toast_${++toastSeq}`;
  setState({ toasts: [...state.toasts, { id, message, kind }] });
  setTimeout(() => {
    setState({ toasts: state.toasts.filter((t) => t.id !== id) });
  }, durationMs);
}

export function useStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
