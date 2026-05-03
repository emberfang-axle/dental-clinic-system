import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
  signInWithRedirect,
  getRedirectResult,
  getAuth,
} from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import type { Role, User } from "../shared/types";
import { auth, app, googleProvider } from "./firebase";
import { getDocTyped, setDocTyped, updateDocTyped } from "./firestore";
import { getSnapshot, setState } from "../store/store";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function upsertGoogleUser(firebaseUser: import("firebase/auth").User): Promise<User> {
  let profile = await getDocTyped<User>("users", firebaseUser.uid);
  if (!profile) {
    const user: User = {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || "Google User",
      email: normalizeEmail(firebaseUser.email || ""),
      phone: firebaseUser.phoneNumber || undefined,
      role: "patient" as Role,
      active: true,
    };
    await setDocTyped<User>("users", user.id, user as any);
    profile = user as User;
  }
  return profile;
}

export const authService = {
  async login(email: string, password: string) {
    const res = await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
    return getDocTyped<User>("users", res.user.uid);
  },

  async register(name: string, email: string, phone: string, password: string) {
    const res = await createUserWithEmailAndPassword(auth, normalizeEmail(email), password);
    if (name?.trim()) await updateFirebaseProfile(res.user, { displayName: name.trim() });
    const user: User = {
      id: res.user.uid,
      name: name.trim() || "New Patient",
      email: normalizeEmail(email),
      phone: phone?.trim() || undefined,
      role: "patient" as Role,
      active: true,
    };
    await setDocTyped<User>("users", user.id, user as any);
    return user;
  },

  async googleSignIn(): Promise<void> {
    await signInWithRedirect(auth, googleProvider);
  },

  async handleRedirectResult(): Promise<User | null> {
    const result = await getRedirectResult(auth);
    if (!result) return null;
    return upsertGoogleUser(result.user);
  },

  async logout() {
    await signOut(auth);
  },

  async createStaffAccount(name: string, email: string, phone: string, role: "staff" | "doctor", password: string) {
    // Use a secondary app instance so creating the account doesn't sign out the current doctor.
    const secondaryApp = initializeApp(app.options, `staff-create-${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);
    try {
      const res = await createUserWithEmailAndPassword(secondaryAuth, normalizeEmail(email), password);
      if (name?.trim()) await updateFirebaseProfile(res.user, { displayName: name.trim() });
      const user: User = {
        id: res.user.uid,
        name: name.trim() || "New Staff",
        email: normalizeEmail(email),
        phone: phone?.trim() || undefined,
        role: role as Role,
        active: true,
      };
      await setDocTyped<User>("users", user.id, user as any);
      return user;
    } finally {
      await deleteApp(secondaryApp);
    }
  },

  async updateProfile(userId: string, partial: Partial<User>, actor = "system") {
    void actor;
    await updateDocTyped<User>("users", userId, partial as any);

    const { appointments, user } = getSnapshot();

    // Update the logged-in user in the store
    if (user && user.id === userId) {
      setState({ user: { ...user, ...partial } });
    }

    // If name changed, sync it to all appointments for this patient (except cancelled)
    if (partial.name) {
      const toSync = appointments.filter(
        (a) => a.patientId === userId && a.status !== "cancelled"
      );
      await Promise.all(
        toSync.map((a) => updateDocTyped("appointments", a.id, { patientName: partial.name } as any))
      );
      setState({
        appointments: appointments.map((a) =>
          toSync.some((x) => x.id === a.id) ? { ...a, patientName: partial.name! } : a
        ),
      });
    }

    return getDocTyped<User>("users", userId);
  },
};
