/** Public Firebase web config — safe to ship in the client bundle (restricted by Firebase console domains). */
export const PRODUCTION_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDT734g6_6LKd0NGLwFWeqL-0GuutRwgNA",
  authDomain: "dental-clinic-system-8ec1c.firebaseapp.com",
  projectId: "dental-clinic-system-8ec1c",
  storageBucket: "dental-clinic-system-8ec1c.firebasestorage.app",
  messagingSenderId: "925895588558",
  appId: "1:925895588558:web:4143bffe171c155493ae9f",
} as const;

export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

/** Prefer Vite env vars; fall back to production defaults so Vercel builds still work. */
export function getFirebaseWebConfig(): FirebaseWebConfig {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || PRODUCTION_FIREBASE_CONFIG.apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || PRODUCTION_FIREBASE_CONFIG.authDomain,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || PRODUCTION_FIREBASE_CONFIG.projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || PRODUCTION_FIREBASE_CONFIG.storageBucket,
    messagingSenderId:
      import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || PRODUCTION_FIREBASE_CONFIG.messagingSenderId,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || PRODUCTION_FIREBASE_CONFIG.appId,
  };
}

export function validateFirebaseConfig(config: FirebaseWebConfig): string | null {
  const missing = (Object.entries(config) as [keyof FirebaseWebConfig, string][])
    .filter(([, value]) => !value?.trim())
    .map(([key]) => key);
  if (missing.length === 0) return null;
  return `Missing Firebase config: ${missing.join(", ")}`;
}
