import { onAuthStateChanged } from "firebase/auth";
import type { ClinicSettings, DoctorSchedule, StaffPermission, User, Appointment, NotificationEntry, FeedbackEntry, Service, AuditLog, BlockedSlot } from "../shared/types";
import { DEFAULT_SERVICES } from "../shared/serviceCatalog";
import { sortAppointmentsLatestFirst } from "../shared/helpers";
import { auth } from "./firebase";
import { listenCollection, listenDoc, listCollection, setDocTyped, deleteDocTyped, qOrderBy, qWhere } from "./firestore";
import { resetState, setState, getSnapshot, showToast } from "../store/store";
import { scheduleAlertsService } from "./scheduleAlerts";
import { calendarService } from "./calendar";

export const KNOWN_DOCTOR_NAMES = new Set([
  "Dr. Mary Cris Estandarte",
  "Dr. Kim Precioso",
  "Dr. Mary Ann Ransas",
]);

async function purgeStaleDoctor() {
  try {
    const all = await listCollection<User>("users");
    for (const u of all) {
      if ((u.role === "doctor" || u.role === "co-doctor") && !KNOWN_DOCTOR_NAMES.has(u.name)) {
        await deleteDocTyped("users", u.id);
      }
    }
  } catch {
    // Silently skip — may fail if unauthenticated or rules block access
  }
}

async function seedServices() {
  const existing = await listCollection<Service>("services");
  // If all official services are already present, skip to avoid unnecessary reads/writes
  if (existing.length >= DEFAULT_SERVICES.length) return;

  const officialNames = new Set(DEFAULT_SERVICES.map((s) => s.name.toLowerCase()));

  // Remove any doc not in the official list, and track duplicates
  const seen = new Set<string>();
  for (const s of existing) {
    const key = s.name.toLowerCase();
    if (!officialNames.has(key) || seen.has(key)) {
      await deleteDocTyped("services", s.id);
    } else {
      seen.add(key);
    }
  }

  // Add any official services not yet in Firestore
  for (const s of DEFAULT_SERVICES) {
    if (!seen.has(s.name.toLowerCase())) {
      const id = `svc_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
      await setDocTyped("services", id, { ...s, id } as any);
    }
  }
}

// Sort helpers — avoids composite indexes by sorting in JS
const byName = (a: User, b: User) => a.name.localeCompare(b.name);
const byAppointmentLatest = sortAppointmentsLatestFirst;
const byAtDesc = <T extends { at: string }>(a: T, b: T) => b.at.localeCompare(a.at);

export function bootstrapRealtime() {
  let unsubProfile: (() => void) | null = null;
  let unsubs: (() => void)[] = [];

  const stopAll = () => {
    unsubProfile?.();
    unsubProfile = null;
    unsubs.forEach((u) => u());
    unsubs = [];
  };

  seedServices();
  void calendarService.loadBlockedSlots();

  // Safety timeout: if onAuthStateChanged never fires (network/config issue), unblock the UI
  const authTimeout = setTimeout(() => {
    if (!getSnapshot().authReady) {
      setState({ authReady: true, profileReady: true, user: null });
    }
  }, 6000);

  // Public listeners — always active, never torn down on auth change
  const publicUnsubs: (() => void)[] = [];
  publicUnsubs.push(
    listenCollection<Service>("services", (s) => setState({ services: [...s].sort(byName as any) })),
    listenCollection<FeedbackEntry>("feedbacks", (f) => setState({ feedbacks: [...f].sort(byAtDesc) })),
    listenCollection<any>("announcements", (a) => setState({ announcements: [...a].sort((x: any, y: any) => {
      if (x.pinned && !y.pinned) return -1;
      if (!x.pinned && y.pinned) return 1;
      return y.at.localeCompare(x.at);
    }) })),
    listenCollection<DoctorSchedule>("doctorSchedules", (d) => setState({ doctorSchedules: d })),
    listenCollection<BlockedSlot>("blockedSlots", (slots) => {
      calendarService.setBlockedSlotsFromRemote(slots);
      setState({ blockedSlots: calendarService.listBlockedSlots() });
    }),
  );

  const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
    clearTimeout(authTimeout);
    stopAll();
    // Preserve public data that's managed by always-on listeners
    const { services, feedbacks, announcements, doctorSchedules, blockedSlots } = getSnapshot();
    resetState();
    setState({ services, feedbacks, announcements, doctorSchedules, blockedSlots, authReady: true });

    // Settings
    unsubs.push(
      listenDoc<any>("settings", "clinic", (doc) => {
        if (!doc) return;
        setState({
          settings: doc as any as ClinicSettings,
          staffPermissions: (doc.staffPermissions as StaffPermission[]) || [],
        });
      })
    );

    if (!firebaseUser) {
      setState({ user: null, profileReady: true });
      return;
    }

    // Safety timeout: if Firestore doesn't respond in 4s, unblock the UI
    const profileTimeout = setTimeout(() => {
      if (!getSnapshot().profileReady) {
        setState({ profileReady: true });
      }
    }, 4000);

    let welcomeShown = false;

    // Profile
    unsubProfile = listenDoc<User>("users", firebaseUser.uid, (profile) => {
      clearTimeout(profileTimeout);
      setState({ user: profile as any, profileReady: true });
      attachRoleListeners(profile?.role ?? null);
      if (profile) {
        if (!welcomeShown) {
          welcomeShown = true;
          const label =
            profile.role === "staff"  ? `${profile.name} (Staff)` :
            profile.name;
          setTimeout(() => showToast(`Welcome back, ${label}!`, "success", 3500), 500);
        }
        // Only doctors/admins can write to users collection — purge stale docs on their login
        if (profile.role === "doctor" || profile.role === "admin") {
          purgeStaleDoctor();
        }
        setTimeout(() => {
          scheduleAlertsService.runForUser(profile);
        }, 3000);
      }
    });

    // Notifications — where only, no orderBy → no composite index needed
    unsubs.push(
      listenCollection<NotificationEntry>(
        "notifications",
        (n) => setState({ notifications: [...n].sort(byAtDesc) }),
        [qWhere("userId", "==", firebaseUser.uid)] as any
      )
    );

    // Logs — orderBy only, no where → single-field index (auto-created)
    unsubs.push(
      listenCollection<AuditLog>("logs", (logs) => setState({ logs: [...logs].sort(byAtDesc) }))
    );

    let appointmentUnsub: (() => void) | null = null;
    let usersUnsub: (() => void) | null = null;

    function attachRoleListeners(role: User["role"] | null) {
      appointmentUnsub?.();
      usersUnsub?.();

      if (role === "patient") {
        appointmentUnsub = listenCollection<Appointment>(
          "appointments",
          (a) => setState({ appointments: [...a].sort(byAppointmentLatest) }),
          [qWhere("patientId", "==", firebaseUser!.uid)] as any
        );
        // Patients need doctors list for booking
        usersUnsub = listenCollection<User>(
          "users",
          (u) => setState({ users: u.filter((x) => x.role === "doctor" || x.role === "co-doctor") }),
          [qWhere("role", "in", ["doctor", "co-doctor"])] as any
        );
      } else if (role) {
        // no where, orderBy only → single-field index
        appointmentUnsub = listenCollection<Appointment>(
          "appointments",
          (a) => setState({ appointments: [...a].sort(byAppointmentLatest) }),
          [qOrderBy("date", "desc")] as any
        );
        usersUnsub = listenCollection<User>(
          "users",
          (u) => setState({ users: [...u].sort(byName) }),
          [qOrderBy("name", "asc")] as any
        );
      }
    }
  });

  return () => {
    unsubAuth();
    stopAll();
    publicUnsubs.forEach((u) => u());
  };
}
