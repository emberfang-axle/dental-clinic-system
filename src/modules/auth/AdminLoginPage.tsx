import { useState, useEffect } from "react";
import { Logo, LogoMark } from "../../components/Logo";
import { Button, Input, Label, Ornament } from "../../components/ui";
import { authService } from "../../services/auth";
import { useStore } from "../../store/store";
import { dashboardPathFor } from "../../shared/helpers";
import { ROUTES } from "../../shared/constants";

export function AdminLoginPage({ navigate }: { navigate: (p: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { user } = useStore();

  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "doctor" || user.role === "staff")) {
      navigate(dashboardPathFor(user.role));
    }
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const u = await authService.login(email, password);
      if (!u) {
        setError("Invalid credentials.");
        setLoading(false);
        return;
      }
      if (u.role === "patient") {
        setError("Patients must use the Patient Login.");
        setLoading(false);
        return;
      }
      navigate(dashboardPathFor(u.role));
    } catch (err: any) {
      setError(err.message || "Login failed.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink-950 relative overflow-hidden flex items-center justify-center p-6">
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gold-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gold-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 sm:px-6 py-4">
        <button onClick={() => navigate(ROUTES.home)} className="no-min hover:opacity-80 transition flex items-center gap-2 text-gold-200/80 hover:text-gold-100">
          <Logo size={36} showText={false} />
        </button>
        <button onClick={() => navigate(ROUTES.home)} className="no-min text-xs text-gold-300/70 hover:text-gold-200 transition flex items-center gap-2 px-3 py-2 rounded-full border border-gold-500/20 bg-ink-900/60 backdrop-blur">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Back to home</span>
        </button>
      </div>

      <div className="relative w-full max-w-md fade-up">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full glass-strong flex items-center justify-center shadow-luxe border border-gold-400/30">
              <LogoMark size={44} />
            </div>
          </div>
          <Ornament className="w-24 h-3 mx-auto mb-5" />
          <h2 className="font-serif text-4xl text-gold-shine font-light">Staff Portal</h2>
          <p className="text-sm text-gold-100/55 mt-3 font-light">
            Doctor, Admin & Staff Access
          </p>
        </div>

        <div className="glass-strong rounded-2xl p-8 shadow-luxe border border-gold-500/20">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <Label>Email Address</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@clinic.com" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            {error && (
              <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">{error}</div>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-5">
            <div className="divider-gold mb-5">
              <span className="text-[10px] uppercase tracking-[0.3em] text-gold-300/70 font-semibold">Or</span>
            </div>
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                setError("");
                try {
                  const u = await authService.googleSignIn();
                  if (u.role === "patient") {
                    await authService.logout();
                    setError("Patients must use the Patient Login.");
                    setLoading(false);
                    return;
                  }
                  navigate(dashboardPathFor(u.role));
                } catch (err: any) {
                  setError(err.message || "Google sign-in failed.");
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-gold-500/20 hover:border-gold-400/60 hover:bg-gold-500/5 transition text-gold-100"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-medium">Sign in with Google</span>
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-gold-100/55 mt-6 font-light">
          Patient?{" "}
          <button onClick={() => navigate(ROUTES.login)} className="text-gold-300 hover:text-gold-100 font-medium underline-offset-4 hover:underline transition">
            Use Patient Login
          </button>
        </p>
      </div>
    </div>
  );
}
