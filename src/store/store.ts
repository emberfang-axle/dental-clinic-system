import { useSyncExternalStore } from "react";
import type {
  Appointment,
  AuditLog,
  ClinicSettings,
  FeedbackEntry,
  NotificationEntry,
  Service,
  StaffPermission,
  User,
  Announcement,
} from "../shared/types";

export interface AppState {
  authReady: boolean;
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
}

let state: AppState = {
  authReady: false,
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
};

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
  state = {
  authReady: false,
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
  };
  listeners.forEach((l) => l());
}

export function useStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

