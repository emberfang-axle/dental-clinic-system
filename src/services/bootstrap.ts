import { onAuthStateChanged } from "firebase/auth";
import type { ClinicSettings, DoctorSchedule, StaffPermission, User, Appointment, NotificationEntry, FeedbackEntry, Service, AuditLog } from "../shared/types";
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

const DEFAULT_SERVICES: Omit<Service, "id">[] = [
  { name: "Oral Consultation",                 price: 300,   duration: 20, description: "Initial dental check-up and assessment. Required before most procedures." },
  { name: "Oral Prophylaxis (Cleaning)",       price: 700,   priceMax: 800,  duration: 45, description: "Professional scaling and polishing to remove plaque, tartar, and stains." },
  { name: "Tooth Extraction (Bunot)",          price: 700,   priceMax: 800,  duration: 45, description: "Careful removal of damaged, decayed, or problematic teeth." },
  { name: "Tooth Filling (Pasta)",             price: 600,   priceMax: 900,  duration: 30, description: "Tooth-colored composite resin filling to restore cavities and minor damage." },
  { name: "Orthodontics (Braces)",             price: 25000, priceMax: 35000, duration: 90, description: "Full orthodontic treatment with metal or ceramic braces for teeth alignment." },
  { name: "Braces Adjustment",                 price: 1000,  duration: 30, description: "Routine monthly tightening and wire adjustment for ongoing braces treatment." },
  { name: "Teeth Whitening",                   price: 3500,  priceMax: 5000,  duration: 60, description: "In-clinic bleaching treatment to brighten and whiten discolored teeth." },
  { name: "Removable Dentures",                price: 8000,  duration: 60, description: "Custom-fitted full or partial removable dentures for missing teeth." },
  { name: "Dentures",                          price: 4500,  duration: 60, description: "Standard acrylic dentures to replace missing teeth and restore function." },
  { name: "Ivocap Dentures",                   price: 15000, duration: 60, description: "Premium heat-cured Ivocap dentures for superior fit, strength, and comfort." },
  { name: "Fixed Bridge",                      price: 6000,  duration: 75, description: "Permanent prosthetic bridge anchored to adjacent teeth to fill gaps." },
  { name: "Crowns and Bridges",                price: 9000,  duration: 75, description: "Combined crown and bridge restoration for multiple missing or damaged teeth." },
  { name: "Dental Crowns",                     price: 8000,  duration: 60, description: "Full-coverage cap placed over a damaged or weakened tooth to restore shape and strength." },
  { name: "Porcelain Crowns",                  price: 9000,  duration: 60, description: "Natural-looking all-porcelain crowns that blend seamlessly with surrounding teeth." },
  { name: "Zirconia Crowns",                   price: 12000, duration: 60, description: "High-strength metal-free zirconia crowns for durability and superior aesthetics." },
  { name: "Root Canal Treatment",              price: 6500,  priceMax: 7000,  duration: 90, description: "Endodontic therapy to remove infected pulp and save a severely damaged tooth." },
  { name: "Odontectomy (3rd Molar Removal)",   price: 5500,  duration: 90, description: "Surgical extraction of impacted or partially erupted wisdom teeth." },
  { name: "Veneers",                           price: 6500,  duration: 90, description: "Thin porcelain or composite shells bonded to the front of teeth for a flawless smile." },
  { name: "Retainers",                         price: 3500,  duration: 30, description: "Custom removable or fixed retainers to maintain teeth position after braces." },
  { name: "Fluoride Application & Sealants",   price: 500,   duration: 30, description: "Preventive fluoride varnish and pit-and-fissure sealants to protect against decay." },
  { name: "Emergency Dental Services",         price: 1000,  duration: 30, description: "Immediate care for acute dental pain, trauma, broken teeth, or infections." },
];

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
  calendarService.listBlockedSlots();

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
    listenCollection<DoctorSchedule>("doctorSchedules", (d) => setState({ doctorSchedules: d }))
  );

  const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
    clearTimeout(authTimeout);
    stopAll();
    // Preserve public data that's managed by always-on listeners
    const { services, feedbacks, announcements, doctorSchedules } = getSnapshot();
    resetState();
    setState({ services, feedbacks, announcements, doctorSchedules, authReady: true });

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
          (a) => setState({ appointments: [...a].sort(byDateDesc) }),
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
