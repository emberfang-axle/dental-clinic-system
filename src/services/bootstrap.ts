import { onAuthStateChanged } from "firebase/auth";
import type { ClinicSettings, StaffPermission, User, Appointment, NotificationEntry, FeedbackEntry, Service, AuditLog } from "../shared/types";
import { auth } from "./firebase";
import { listenCollection, listenDoc, listCollection, setDocTyped, qOrderBy, qWhere } from "./firestore";
import { resetState, setState, getSnapshot } from "../store/store";
import { scheduleAlertsService } from "./scheduleAlerts";

const DEFAULT_SERVICES: Omit<Service, "id">[] = [
  { name: "Tooth Extraction",         price: 800,   duration: 45, description: "Safe and gentle removal of damaged or decayed teeth." },
  { name: "Tooth Filling",            price: 600,   duration: 30, description: "Restore cavities with tooth-colored composite fillings." },
  { name: "Oral Prophylaxis (Cleaning)", price: 700, duration: 45, description: "Professional cleaning to remove plaque and tartar buildup." },
  { name: "Teeth Whitening",          price: 3500,  duration: 60, description: "Brighten your smile with safe in-clinic whitening." },
  { name: "Braces",                   price: 25000, duration: 90, description: "Orthodontic treatment for properly aligned teeth." },
  { name: "Dentures",                 price: 8000,  duration: 60, description: "Comfortable, custom-fitted full or partial dentures." },
  { name: "Root Canal Treatment",     price: 6500,  duration: 90, description: "Save infected teeth with modern endodontic care." },
  { name: "Crowns and Bridges",       price: 9000,  duration: 75, description: "Restore strength and appearance with quality crowns." },
  { name: "Veneers",                  price: 12000, duration: 90, description: "Cosmetic shells for a perfect, natural-looking smile." },
  { name: "Odontectomy",              price: 5500,  duration: 90, description: "Surgical removal of impacted wisdom teeth." },
];

async function seedServices() {
  const existing = await listCollection<Service>("services");
  if (existing.length > 0) return;
  for (const s of DEFAULT_SERVICES) {
    const id = `svc_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
    await setDocTyped("services", id, { ...s, id } as any);
  }
}

// Sort helpers — avoids composite indexes by sorting in JS
const byName = (a: User, b: User) => a.name.localeCompare(b.name);
const byDateDesc = (a: Appointment, b: Appointment) => (b.date + b.time).localeCompare(a.date + a.time);
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

  // Public listeners — always active, never torn down on auth change
  const publicUnsubs: (() => void)[] = [];
  publicUnsubs.push(
    listenCollection<Service>("services", (s) => setState({ services: [...s].sort(byName as any) })),
    listenCollection<FeedbackEntry>("feedbacks", (f) => setState({ feedbacks: [...f].sort(byAtDesc) })),
    listenCollection<any>("announcements", (a) => setState({ announcements: [...a].sort((x: any, y: any) => {
      if (x.pinned && !y.pinned) return -1;
      if (!x.pinned && y.pinned) return 1;
      return y.at.localeCompare(x.at);
    }) }))
  );

  const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
    stopAll();
    // Preserve public data that's managed by always-on listeners
    const { services, feedbacks, announcements } = getSnapshot();
    resetState();
    setState({ services, feedbacks, announcements, authReady: true });

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
      setState({ user: null });
      return;
    }

    // Profile
    unsubProfile = listenDoc<User>("users", firebaseUser.uid, (profile) => {
      setState({ user: profile as any });
      attachRoleListeners(profile?.role ?? null);
      if (profile) setTimeout(() => scheduleAlertsService.runForUser(profile), 3000);
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
        // where only, sort in JS
        appointmentUnsub = listenCollection<Appointment>(
          "appointments",
          (a) => setState({ appointments: [...a].sort(byDateDesc) }),
          [qWhere("patientId", "==", firebaseUser!.uid)] as any
        );
      } else if (role) {
        // no where, orderBy only → single-field index
        appointmentUnsub = listenCollection<Appointment>(
          "appointments",
          (a) => setState({ appointments: [...a].sort(byDateDesc) }),
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
