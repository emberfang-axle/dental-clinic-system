import { StrictMode, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastContainer } from "./components/ToastContainer";
import { bootstrapRealtime } from "./services/bootstrap";
import { useStore } from "./store/store";
import { authService } from "./services/auth";
import { ROUTES } from "./shared/constants";
import { firebaseInitError, auth } from "./services/firebase";

import { getRedirectResult } from "firebase/auth";

function BootError({ message }: { message: string }) {
  return (
    <div style={{ minHeight: "100vh", background: "#060504", color: "#faf0c8", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 520, textAlign: "center" }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>Unable to start the app</h1>
        <p style={{ opacity: 0.75, marginBottom: 20, lineHeight: 1.6 }}>{message}</p>
        <p style={{ opacity: 0.55, fontSize: 14 }}>
          If this is on Vercel, add the <code>VITE_FIREBASE_*</code> environment variables, redeploy, and add your Vercel domain in Firebase Auth → Authorized domains.
        </p>
      </div>
    </div>
  );
}

if (!firebaseInitError && auth) {
  // Clear any stale redirect state left over from the old Google Sign-In flow
  try { getRedirectResult(auth).catch(() => {}); } catch { /* storage blocked */ }
  bootstrapRealtime();
}

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

function Root() {
  const { authReady, user } = useStore();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) return;

    function reset() {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        authService.logout().then(() => { window.location.hash = ROUTES.login; });
      }, IDLE_TIMEOUT_MS);
    }

    const events = ["mousemove", "keydown", "pointerdown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [user]);

  if (!authReady) {
    return (
      <div style={{ minHeight: "100vh", background: "#060504", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
          <p className="text-xs uppercase tracking-[0.3em] text-gold-300/60">Loading…</p>
        </div>
      </div>
    );
  }
  return <App />;
}

const root = document.getElementById("root")!;
if (firebaseInitError || !auth) {
  createRoot(root).render(<BootError message={firebaseInitError ?? "Firebase failed to initialize."} />);
} else {
  createRoot(root).render(
    <StrictMode>
      <ErrorBoundary>
        <Root />
        <ToastContainer />
      </ErrorBoundary>
    </StrictMode>
  );
}
