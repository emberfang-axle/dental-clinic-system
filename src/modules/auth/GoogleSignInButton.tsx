import { useState } from "react";
import { signInWithPopup, signInWithRedirect } from "firebase/auth";
import { auth, googleProvider } from "../../services/firebase";
import { getDocTyped, setDocTyped } from "../../services/firestore";
import type { User } from "../../shared/types";
import { Button } from "../../components/ui";

const GOOGLE_ICON = (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.6 4.9C9.8 39.8 16.4 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.8 35.5 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/>
  </svg>
);

function mapGoogleError(code: string, email?: string): string {
  switch (code) {
    case "auth/popup-blocked":
      return "Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.";
    case "auth/account-exists-with-different-credential":
      return `An account already exists for ${email ?? "this email"} using a different sign-in method. Please sign in with your email and password instead.`;
    case "auth/cancelled-popup-request":
    case "auth/popup-closed-by-user":
      return "";
    case "auth/network-request-failed":
      return "Network error. Please check your connection and try again.";
    default:
      return `Google sign-in failed (${code || "unknown"}). Please try again.`;
  }
}

interface Props {
  onSuccess: (user: User) => void;
  onError: (msg: string) => void;
  staffOnly?: boolean;
  disabled?: boolean;
}

export function GoogleSignInButton({ onSuccess, onError, staffOnly = false, disabled = false }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      let result;
      try {
        result = await signInWithPopup(auth, googleProvider);
      } catch (popupErr: any) {
        // Popup blocked or tracking prevention — fall back to redirect
        if (popupErr?.code === "auth/popup-blocked" || popupErr?.code === "auth/popup-closed-by-user") {
          await signInWithRedirect(auth, googleProvider);
          return; // page will reload; result handled in bootstrap
        }
        throw popupErr;
      }
      const fu = result.user;

      let profile = await getDocTyped<User>("users", fu.uid);

      if (!profile) {
        if (staffOnly) {
          await auth.signOut();
          onError("No staff account found for this Google account. Contact the administrator.");
          return;
        }
        const newUser: User = {
          id: fu.uid,
          name: fu.displayName || "Google User",
          email: (fu.email || "").toLowerCase(),
          phone: fu.phoneNumber || undefined,
          role: "patient",
          active: true,
        };
        await setDocTyped<User>("users", fu.uid, newUser as any);
        profile = newUser;
      }

      if (staffOnly && profile.role === "patient") {
        await auth.signOut();
        onError("No staff account found for this Google account. Contact the administrator.");
        return;
      }

      onSuccess(profile);
    } catch (err: any) {
      console.error("[GoogleSignIn] error:", err);
      const code: string = err?.code ?? "";
      if (code === "auth/account-exists-with-different-credential") {
        const email = err?.customData?.email as string | undefined;
        if (email) {
          onError(`An account for ${email} already exists. Please sign in with your email and password instead.`);
          return;
        }
      }
      const msg = mapGoogleError(code, err?.customData?.email);
      if (msg) onError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full flex items-center justify-center gap-2"
      disabled={disabled || loading}
      onClick={handleClick}
      aria-label="Continue with Google"
    >
      {GOOGLE_ICON}
      {loading ? "Signing in…" : "Continue with Google"}
    </Button>
  );
}
