import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "../../services/firebase";
import { Button, Input, Label, PasswordInput } from "../../components/ui";
import { authService } from "../../services/auth";
import { useStore } from "../../store/store";
import { dashboardPathFor } from "../../shared/helpers";
import { ROUTES } from "../../shared/constants";
import { AuthLayout, AuthHeader } from "./AuthLayout";

export function LoginPage({ navigate }: { navigate: (p: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const { user } = useStore();

  useEffect(() => {
    if (user) navigate(dashboardPathFor(user.role));
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setUnverified(false); setLoading(true);
    try {
      const u = await authService.login(email, password);
      if (!u) { setError("Account not found. Please register first."); setLoading(false); return; }
      if (u.role === "patient" && !authService.isEmailVerified()) {
        await authService.logout();
        setUnverified(true);
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
        setError("This account has been disabled. Please contact the clinic.");
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
      setLoading(false);
    }
  }

  async function resendVerification() {
    setResendSent(false); setLoading(true);
    try {
      // Sign in temporarily to get the user object, then send verification
      const res = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      await sendEmailVerification(res.user, {
        url: window.location.origin + window.location.pathname + "#/login",
        handleCodeInApp: false,
      });
      await authService.logout();
      setResendSent(true);
    } catch {
      setError("Could not resend. Please try again.");
    } finally { setLoading(false); }
  }

  async function sendReset() {
    if (!email) { setError("Enter your email address first, then click Forgot."); return; }
    setError(""); setLoading(true);
    try { await authService.resetPassword(email); setResetSent(true); }
    catch (err: any) { setError(err.message || "Failed to send reset email."); }
    finally { setLoading(false); }
  }

  return (
    <AuthLayout navigate={navigate}>
      <div className="w-full max-w-md fade-up">
        <AuthHeader title="Welcome Back" subtitle={<>Sign in to continue your <span className="font-script italic text-gold-300">journey</span></>} />
        <div className="glass-strong rounded-2xl p-5 sm:p-8 shadow-luxe">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <Label>Email Address</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div>
              <Label>Password</Label>
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
              <button type="button" onClick={sendReset} disabled={loading} className="mt-2 w-full text-center text-[11px] text-gold-400/70 hover:text-gold-300 transition">
                Forgot password?
              </button>
            </div>
            {error && <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">{error}</div>}
            {unverified && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/8 p-4 space-y-3">
                <p className="text-sm font-semibold text-amber-300">Email not verified</p>
                <p className="text-xs text-amber-200/70">Please check your inbox and click the verification link before signing in.</p>
                {resendSent
                  ? <p className="text-xs text-emerald-400">Verification email resent! Check your inbox.</p>
                  : <button type="button" onClick={resendVerification} disabled={loading} className="text-xs text-amber-300 underline hover:text-amber-200 transition">
                      Resend verification email
                    </button>
                }
              </div>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            {resetSent && (
              <div className="rounded-xl border border-gold-500/30 bg-gold-500/8 p-4 text-center space-y-2">
                <div className="text-2xl">✉</div>
                <p className="text-sm font-semibold text-gold-200">Reset link sent!</p>
                <p className="text-xs text-gold-100/60">Check your inbox at <span className="text-gold-300 font-medium">{email}</span>.</p>
              </div>
            )}
          </form>
        </div>
        <p className="text-center text-sm text-gold-100/55 mt-6 font-light">
          New patient?{" "}
          <button onClick={() => navigate(ROUTES.register)} className="text-gold-300 hover:text-gold-100 font-medium underline-offset-4 hover:underline transition">
            Create an account
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}
