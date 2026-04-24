// src/services/auth.ts

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
} from "firebase/auth";
import type { Role, User } from "../shared/types";
import { auth } from "./firebase";
import { getDocTyped, setDocTyped, updateDocTyped } from "./firestore";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export const authService = {
  async login(email: string, password: string) {
    const res = await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
    const profile = await getDocTyped<User>("users", res.user.uid);
    return profile;
  },

  async register(name: string, email: string, phone: string, password: string) {
    const res = await createUserWithEmailAndPassword(auth, normalizeEmail(email), password);

    // Keep Auth displayName in sync for convenience.
    if (name?.trim()) {
      await updateFirebaseProfile(res.user, { displayName: name.trim() });
    }

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

  async logout() {
    await signOut(auth);
  },

  async updateProfile(userId: string, partial: Partial<User>, actor = "system") {
    // `actor` is kept for audit purposes by the caller if needed.
    void actor;
    await updateDocTyped<User>("users", userId, partial as any);
    return await getDocTyped<User>("users", userId);
  },
};