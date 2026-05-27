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

import { getRedirectResult } from "firebase/auth";
import { auth } from "./services/firebase";

// Clear any stale redirect state left over from the old Google Sign-In flow
try { getRedirectResult(auth).catch(() => {}); } catch { /* storage blocked */ }

bootstrapRealtime();

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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <Root />
      <ToastContainer />
    </ErrorBoundary>
  </StrictMode>
);
