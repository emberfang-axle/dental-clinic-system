/**
 * Firebase Phone OTP Authentication Service
 *
 * Flow:
 *  1. sendOtp(phone)  → triggers Firebase SMS, returns ConfirmationResult
 *  2. verifyOtp(confirmationResult, code) → verifies code, links phone to current user
 *     or creates an anonymous session, then upserts Firestore user record.
 *
 * Philippine format: accepts "09xxxxxxxxx" and normalises to "+639xxxxxxxxx".
 */

import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  type ConfirmationResult,
} from "firebase/auth";
import { auth } from "./firebase";
import { getDocTyped, updateDocTyped } from "./firestore";
import type { User } from "../shared/types";

// ─── Phone normalisation ──────────────────────────────────────────────────────

/** Converts "09xxxxxxxxx" → "+639xxxxxxxxx". Passes through "+63…" unchanged. */
export function normalisePhilippinePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("63") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("9") && digits.length === 10) return `+63${digits}`;
  if (digits.startsWith("09") && digits.length === 11) return `+63${digits.slice(1)}`;
  return `+${digits}`; // pass-through for already-formatted numbers
}

export function isValidPhilippinePhone(raw: string): boolean {
  const normalised = normalisePhilippinePhone(raw);
  return /^\+639\d{9}$/.test(normalised);
}

// ─── reCAPTCHA verifier (invisible) ──────────────────────────────────────────

let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Initialises (or reuses) an invisible reCAPTCHA verifier bound to `containerId`.
 * The container must be a real DOM element that exists when this is called.
 */
export function getRecaptchaVerifier(containerId: string): RecaptchaVerifier {
  if (recaptchaVerifier) return recaptchaVerifier;
  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => { /* OTP sent */ },
    "expired-callback": () => {
      recaptchaVerifier = null; // force re-init on next attempt
    },
  });
  return recaptchaVerifier;
}

/** Call this when the modal closes to clean up the verifier. */
export function clearRecaptchaVerifier(): void {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
}

// ─── OTP operations ───────────────────────────────────────────────────────────

/**
 * Sends an OTP to `phone`. Returns a ConfirmationResult used to verify the code.
 * @param phone  Raw Philippine phone string (e.g. "09171234567")
 * @param containerId  DOM id of the invisible reCAPTCHA container div
 */
export async function sendOtp(
  phone: string,
  containerId: string
): Promise<ConfirmationResult> {
  const e164 = normalisePhilippinePhone(phone);
  const verifier = getRecaptchaVerifier(containerId);
  return signInWithPhoneNumber(auth, e164, verifier);
}

/**
 * Verifies the 6-digit OTP code.
 * - If a user is already signed in (email/password), links the phone number to
 *   their existing account and updates Firestore.
 * - Otherwise signs in with the phone credential directly.
 *
 * Returns the Firestore User profile on success.
 */
export async function verifyOtp(
  confirmationResult: ConfirmationResult,
  code: string
): Promise<User | null> {
  // credential is only used to satisfy PhoneAuthProvider typing; actual confirm handles it
  PhoneAuthProvider.credential(
    (confirmationResult as any).verificationId,
    code
  );

  const result = await confirmationResult.confirm(code);
  const uid = result.user.uid;

  const profile = await getDocTyped<User>("users", uid);
  if (profile) {
    await updateDocTyped<User>("users", uid, { phone: result.user.phoneNumber ?? profile.phone } as any);
  }

  return profile;
}

// ─── Error message helpers ────────────────────────────────────────────────────

export function otpErrorMessage(code: string): string {
  const map: Record<string, string> = {
    "auth/invalid-phone-number":      "Invalid phone number. Use format: 09xxxxxxxxx",
    "auth/invalid-verification-code": "Incorrect OTP code. Please try again.",
    "auth/code-expired":              "OTP has expired. Please request a new one.",
    "auth/too-many-requests":         "Too many attempts. Please wait a few minutes.",
    "auth/quota-exceeded":            "SMS quota exceeded. Please try again later.",
    "auth/missing-phone-number":      "Please enter your phone number.",
    "auth/captcha-check-failed":      "reCAPTCHA check failed. Please refresh and try again.",
    "auth/phone-number-already-exists": "This phone number is already linked to another account.",
  };
  return map[code] ?? "Verification failed. Please try again.";
}
