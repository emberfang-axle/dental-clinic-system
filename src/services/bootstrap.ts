import { onAuthStateChanged } from "firebase/auth";
import type { ClinicSettings, StaffPermission, User, Appointment, NotificationEntry, FeedbackEntry, Service, AuditLog } from "../shared/types";
import { auth } from "./firebase";
import { listenCollection, listenDoc, qOrderBy, qWhere } from "./firestore";
import { resetState, setState } from "../store/store";

/**
 * Bootstraps real-time Firestore listeners and pushes data into the app store.
 * Call once on app startup (e.g. in `main.tsx`).
 */
export function bootstrapRealtime() {
  let unsubUserProfile: (() => void) | null = null;
  let unsubs: Array<() => void> = [];

  const stopAll = () => {
    if (unsubUserProfile) {
      unsubUserProfile();
      unsubUserProfile = null;
    }
    unsubs.forEach((u) => u());
    unsubs = [];
  };

  // Public/global collections
  unsubs.push(
    listenCollection<Service>("services", (services) => setState({ services }), [qOrderBy("name", "asc")] as any)
  );

  // Clinic settings doc (single doc)
  unsubs.push(
    listenDoc<any>("settings", "clinic", (doc) => {
      if (!doc) return;
      const settings = doc as any as ClinicSettings;
      const staffPermissions = (doc as any).staffPermissions as StaffPermission[] | undefined;
      setState({
        settings,
        staffPermissions: staffPermissions || [],
      });
    })
  );

  // Auth-scoped data
  const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
    stopAll();
    resetState();

    // Reattach global listeners after reset
    unsubs.push(
      listenCollection<Service>("services", (services) => setState({ services }), [qOrderBy("name", "asc")] as any)
    );
    unsubs.push(
      listenDoc<any>("settings", "clinic", (doc) => {
        if (!doc) return;
        const settings = doc as any as ClinicSettings;
        const staffPermissions = (doc as any).staffPermissions as StaffPermission[] | undefined;
        setState({
          settings,
          staffPermissions: staffPermissions || [],
        });
      })
    );

    if (!firebaseUser) {
      setState({ user: null });
      return;
    }

    // Current user profile
    unsubUserProfile = listenDoc<User>("users", firebaseUser.uid, (profile) => {
      setState({ user: profile as any });
    });

    // Users list (doctor/staff only). If you want strict security, enforce via rules.
    unsubs.push(
      listenCollection<User>("users", (users) => setState({ users }), [qOrderBy("name", "asc")] as any)
    );

    // Appointments: patients see only theirs; staff/doctor see all.
    // We don't know role until profile arrives, so start conservative and upgrade.
    const startAppointments = (role: User["role"] | null) => {
      // clear old appointment listeners
      unsubs = unsubs.filter(Boolean);
      const base = [qOrderBy("date", "desc"), qOrderBy("time", "desc")] as any[];
      if (role === "patient") {
        unsubs.push(
          listenCollection<Appointment>(
            "appointments",
            (appointments) => setState({ appointments }),
            [qWhere("patientId", "==", firebaseUser.uid), ...base] as any
          )
        );
      } else {
        unsubs.push(
          listenCollection<Appointment>("appointments", (appointments) => setState({ appointments }), base)
        );
      }
    };

    // Notifications: filtered by userId always
    unsubs.push(
      listenCollection<NotificationEntry>(
        "notifications",
        (notifications) => setState({ notifications }),
        [qWhere("userId", "==", firebaseUser.uid), qOrderBy("at", "desc")] as any
      )
    );

    // Feedback: patients only theirs, staff/doctor all (simple)
    unsubs.push(
      listenCollection<FeedbackEntry>(
        "feedbacks",
        (feedbacks) => setState({ feedbacks }),
        [qWhere("userId", "==", firebaseUser.uid), qOrderBy("at", "desc")] as any
      )
    );

    // Logs (doctor only ideally). Here we keep recent logs for everyone who can read via rules.
    unsubs.push(listenCollection<AuditLog>("logs", (logs) => setState({ logs }), [qOrderBy("at", "desc")] as any));

    // When user profile arrives, adjust appointment listener.
    const unsubRoleWatcher = listenDoc<User>("users", firebaseUser.uid, (profile) => {
      startAppointments(profile?.role ?? null);
    });
    unsubs.push(unsubRoleWatcher);
  });

  return () => {
    unsubAuth();
    stopAll();
  };
}

