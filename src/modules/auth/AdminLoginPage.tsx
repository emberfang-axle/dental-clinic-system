import { useState, useEffect } from "react";
import { Logo, LogoMark } from "../../components/Logo";
import { Button, Input, Label, Ornament, PasswordInput } from "../../components/ui";
import { authService } from "../../services/auth";
import { useStore } from "../../store/store";
import { dashboardPathFor } from "../../shared/helpers";
import { ROUTES } from "../../shared/constants";

export function AdminLoginPage({ navigate }: { navigate: (p: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const { user } = useStore();

  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "doctor" || user.role === "co-doctor" || user.role === "staff")) {
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
        setError("Account not found. Please contact the clinic administrator.");
        setLoading(false);
        return;
      }
      if (u.active === false) {
        await authService.logout();
        setError("This account has been removed. Please contact the administrator.");
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
      const code = err?.code ?? "";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setError("Incorrect email or password. Please try again.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please reset your password or try again later.");
      } else if (code === "auth/user-disabled") {
        setError("This account has been disabled. Please contact the administrator.");
      } else {
        setError(err.message || "Login failed.");
      }
      setLoading(false);
    }
  }


  async function sendReset() {
    if (!email) { setError("Enter your email address first, then click Forgot Password."); return; }
    setError(""); setLoading(true);
    try {
      await authService.resetPassword(email);
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email.");
    } finally { setLoading(false); }
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

        <div className="glass-strong rounded-2xl p-5 sm:p-8 shadow-luxe border border-gold-500/20">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <Label>Email Address</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@clinic.com" />
            </div>
            <div>
              <Label>Password</Label>
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            {error && (
              <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">{error}</div>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <button type="button" onClick={sendReset} disabled={loading} className="text-xs text-gold-400/60 hover:text-gold-300 transition text-center w-full">
              Forgot Password? Send reset link
            </button>
          </form>
        </div>
        {resetSent && (<div className="mt-4 rounded-xl border border-gold-500/30 bg-gold-500/8 p-4 text-center space-y-2"><div className="text-2xl">✉</div><p className="text-sm font-semibold text-gold-200">Reset link sent!</p><p className="text-xs text-gold-100/60">We sent a password reset link to <span className="text-gold-300 font-medium">{email}</span>. Check your inbox and click the link to set a new password.</p><p className="text-[10px] text-gold-100/40">After resetting, return here to sign in. Check spam if not received.</p></div>)}

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
