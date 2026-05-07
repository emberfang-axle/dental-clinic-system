import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
  verifyBeforeUpdateEmail,
  sendPasswordResetEmail,
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

    // If email is changing, send verification first — do NOT save new email to Firestore yet.
    // Firestore email stays as the current one until the user verifies and re-logs in.
    const emailChanging = !!(partial.email && auth.currentUser?.uid === userId
      && partial.email !== auth.currentUser.email);

    if (emailChanging) {
      await verifyBeforeUpdateEmail(auth.currentUser!, partial.email!);
    }

    // Save everything except the new unverified email
    const { email: _e, ...restPartial } = partial as any;
    const firestoreUpdate = emailChanging ? restPartial : partial;

    if (Object.keys(firestoreUpdate).length > 0) {
      await updateDocTyped<User>("users", userId, firestoreUpdate as any);
    }

    const { appointments, user } = getSnapshot();

    // Update store (excluding unverified email)
    if (user && user.id === userId) {
      setState({ user: { ...user, ...firestoreUpdate } });
    }

    // Sync name to appointments
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

  async resetPassword(email: string) {
    const continueUrl = window.location.origin + window.location.pathname + "#/login";
    await sendPasswordResetEmail(auth, email.trim().toLowerCase(), { url: continueUrl, handleCodeInApp: false });
  },
};
