import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
  GoogleAuthProvider,
  signInWithPopup,
  getAuth,
} from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import type { Role, User } from "../shared/types";
import { auth, app } from "./firebase";
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

  async googleSignIn(): Promise<User> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      const res = await signInWithPopup(auth, provider);
      return upsertGoogleUser(res.user);
    } catch (err: any) {
      if (err.code === "auth/popup-blocked") {
        throw new Error("Popup blocked. Allow popups for this site in your browser and try again.");
      }
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        throw new Error("Sign-in cancelled.");
      }
      if (err.code === "auth/operation-not-allowed") {
        throw new Error("Google sign-in is not enabled in Firebase Console. Enable it under Authentication → Sign-in method → Google.");
      }
      if (err.code === "auth/unauthorized-domain") {
        throw new Error(`This domain is not authorized. Add it in Firebase Console → Authentication → Settings → Authorized domains.`);
      }
      // "auth/invalid-action-code" or internal errors usually mean the OAuth client
      // in Google Cloud Console is missing localhost as an authorized JavaScript origin.
      throw new Error(`Google sign-in failed (${err.code || "unknown"}). In Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Web Client → add http://localhost:5173 to Authorized JavaScript Origins.`);
    }
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

    // If name changed, sync it to all active appointments for this patient
    if (partial.name) {
      const { appointments } = getSnapshot();
      const active = appointments.filter(
        (a) => a.patientId === userId && a.status !== "cancelled" && a.status !== "completed"
      );
      await Promise.all(
        active.map((a) => updateDocTyped("appointments", a.id, { patientName: partial.name } as any))
      );
      // Update local store too
      setState({
        appointments: appointments.map((a) =>
          active.some((x) => x.id === a.id) ? { ...a, patientName: partial.name! } : a
        ),
      });
    }

    return getDocTyped<User>("users", userId);
  },
};
