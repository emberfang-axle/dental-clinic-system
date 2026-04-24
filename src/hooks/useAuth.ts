import { useEffect, useState } from "react";
import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import type { User } from "../shared/types";
import { auth } from "../services/firebase";
import { getDocTyped, listenDoc } from "../services/firestore";

type AuthState =
  | { status: "loading"; firebaseUser: null; profile: null }
  | { status: "signed_out"; firebaseUser: null; profile: null }
  | { status: "signed_in"; firebaseUser: FirebaseUser; profile: User | null };

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    firebaseUser: null,
    profile: null,
  });

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (!firebaseUser) {
        setState({ status: "signed_out", firebaseUser: null, profile: null });
        return;
      }

      // Set optimistic signed-in state quickly.
      setState({ status: "signed_in", firebaseUser, profile: null });

      // Keep role/profile in sync in real-time.
      unsubProfile = listenDoc<User>("users", firebaseUser.uid, (profile) => {
        setState({ status: "signed_in", firebaseUser, profile: profile as any });
      });

      // If profile doc doesn't exist yet, we still show signed-in but no role.
      const existing = await getDocTyped<User>("users", firebaseUser.uid);
      if (!existing) {
        setState({ status: "signed_in", firebaseUser, profile: null });
      }
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  return state;
}