/**
 * Authentication module — FIXED VERSION
 */

import { useState, useEffect } from "react";
import { Logo, LogoMark } from "../../components/Logo";
import { Button, Input, Label, Ornament } from "../../components/ui";
import { authService } from "../../services/auth";
import { useStore } from "../../store/store";
import { dashboardPathFor } from "../../shared/helpers";
import { ROUTES } from "../../shared/constants";

/* ─────────────── LOGIN PAGE ─────────────── */

export function LoginPage({ navigate }: { navigate: (p: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { user } = useStore();

  useEffect(() => {
    if (user) navigate(dashboardPathFor(user.role));
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const u = await authService.login(email, password);
      if (!u) {
        setError("Invalid credentials. Please try again.");
        setLoading(false);
        return;
      }
      navigate(dashboardPathFor(u.role));
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthLayout navigate={navigate}>
      <div className="w-full max-w-md fade-up">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full glass-strong flex items-center justify-center shadow-luxe">
              <LogoMark size={44} />
            </div>
          </div>
          <Ornament className="w-24 h-3 mx-auto mb-5" />
          <h2 className="font-serif text-4xl text-gold-shine font-light">Welcome Back</h2>
          <p className="text-sm text-gold-100/55 mt-3 font-light">
            Sign in to continue your <span className="font-script italic text-gold-300">journey</span>
          </p>
        </div>

        <div className="glass-strong rounded-2xl p-8 shadow-luxe">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <Label>Email Address</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Password</Label>
                <button type="button" className="text-[10px] uppercase tracking-wider text-gold-400 hover:text-gold-300 transition">
                  Forgot?
                </button>
              </div>
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
          New patient?{" "}
          <button onClick={() => navigate(ROUTES.register)} className="text-gold-300 hover:text-gold-100 font-medium underline-offset-4 hover:underline transition">
            Create an account
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}

/* ─────────────── REGISTER PAGE ─────────────── */

export function RegisterPage({ navigate }: { navigate: (p: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { user } = useStore();

  useEffect(() => {
    if (user) {
      navigate(dashboardPathFor(user.role));
    }
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const u = await authService.register(name, email, phone, password);
      navigate(dashboardPathFor(u.role));
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthLayout navigate={navigate}>
      <div className="w-full max-w-md fade-up">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full glass-strong flex items-center justify-center shadow-luxe">
              <LogoMark size={44} />
            </div>
          </div>
          <Ornament className="w-24 h-3 mx-auto mb-5" />
          <h2 className="font-serif text-4xl text-gold-shine font-light">Create Account</h2>
          <p className="text-sm text-gold-100/55 mt-3 font-light">
            Patient registration — for <span className="font-script italic text-gold-300">new patients</span> only
          </p>
        </div>

        <div className="glass-strong rounded-2xl p-8 shadow-luxe">
          <form onSubmit={submit} className="space-y-5">
            <div>
              <Label>Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Juan De La Cruz" />
            </div>
            <div>
              <Label>Email Address</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xx xxx xxxx" required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" minLength={6} />
            </div>
            {error && (
              <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">{error}</div>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
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
              <span className="text-sm font-medium">Continue with Google</span>
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-gold-100/55 mt-6 font-light">
          Already a member?{" "}
          <button onClick={() => navigate(ROUTES.login)} className="text-gold-300 hover:text-gold-100 font-medium underline-offset-4 hover:underline transition">
            Sign in
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}

/* ─────────────── SHARED LAYOUT ─────────────── */

function AuthLayout({ children, navigate }: { children: React.ReactNode; navigate: (p: string) => void }) {
  return (
    <div className="min-h-screen bg-ink-950 relative overflow-hidden">
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

      <div className="grid lg:grid-cols-2 min-h-screen relative">
        <div className="hidden lg:flex relative overflow-hidden items-end">
          <img src="/images/doctor-login.png" alt="Estandarte Dental Clinic doctor" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-ink-950/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-ink-950/70" />
          <div className="relative z-10 p-10 xl:p-16 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-gold-200/90 font-semibold">Trusted Dental Care</span>
            </div>
            <h2 className="font-serif text-4xl xl:text-5xl text-gold-shine leading-tight">
              Premium dental care, <br />
              <span className="font-script italic text-gold-200">made simple.</span>
            </h2>
            <p className="mt-5 text-gold-100/70 leading-relaxed">
              Welcome to Estandarte Dental Clinic — where modern systems meet professional care.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div><div className="text-[11px] uppercase tracking-[0.2em] text-gold-300/70 font-semibold">Online</div><div className="mt-1 text-sm text-gold-100/80">Booking</div></div>
              <div><div className="text-[11px] uppercase tracking-[0.2em] text-gold-300/70 font-semibold">Secure</div><div className="mt-1 text-sm text-gold-100/80">GCash + Cash</div></div>
              <div><div className="text-[11px] uppercase tracking-[0.2em] text-gold-300/70 font-semibold">Real-time</div><div className="mt-1 text-sm text-gold-100/80">Schedule</div></div>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center p-6 sm:p-10 pt-24 lg:pt-10">
          <div className="absolute inset-0 lg:hidden">
            <img src="/images/clinic-interior.jpg" alt="" className="w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-br from-ink-950/95 via-ink-950/85 to-ink-950/95" />
          </div>
          <div className="relative w-full flex justify-center">{children}</div>
        </div>
      </div>
    </div>
  );
}