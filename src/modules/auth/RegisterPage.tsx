import { useState, useEffect } from "react";
import { Button, Input, Label, PasswordInput } from "../../components/ui";
import { authService } from "../../services/auth";
import { useStore } from "../../store/store";
import { dashboardPathFor } from "../../shared/helpers";
import { ROUTES } from "../../shared/constants";
import { AuthLayout, AuthHeader } from "./AuthLayout";

export function RegisterPage({ navigate }: { navigate: (p: string) => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const { user } = useStore();

  useEffect(() => {
    if (user) navigate(dashboardPathFor(user.role));
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!firstName.trim()) { setError("First name is required."); return; }
    if (!lastName.trim()) { setError("Last name is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email address."); return; }
    if (!/^09\d{9}$/.test(phone.replace(/\s/g, ""))) { setError("Phone must be a valid PH mobile number (e.g. 09xx xxx xxxx)."); return; }
    if (!address.trim()) { setError("Address / Barangay is required."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    try {
      await authService.register(fullName, email, phone, password, firstName.trim(), lastName.trim(), address.trim());
      // Sign out immediately — user must verify email before accessing the system
      await authService.logout();
      setVerifyEmail(email);
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Please sign in instead.");
      } else if (code === "auth/weak-password") {
        setError("Password is too weak. Use at least 6 characters.");
      } else {
        setError(err.message || "Registration failed. Please try again.");
      }
      setLoading(false);
    }
  }

  if (verifyEmail) {
    return (
      <AuthLayout navigate={navigate}>
        <div className="w-full max-w-md fade-up text-center space-y-5">
          <div className="text-5xl">✉️</div>
          <h2 className="font-serif text-2xl text-gold-shine">Check your email</h2>
          <p className="text-sm text-gold-100/60 leading-relaxed">
            We sent a verification link to{" "}
            <span className="text-gold-300 font-medium">{verifyEmail}</span>.
            Click the link in the email to activate your account, then sign in.
          </p>
          <Button className="w-full" onClick={() => navigate(ROUTES.login)}>Go to Sign In</Button>
          <p className="text-xs text-gold-100/40">Didn't receive it? Check your spam folder.</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout navigate={navigate}>
      <div className="w-full max-w-md fade-up">
        <AuthHeader
          title="Create Account"
          subtitle={<>Patient registration — for <span className="font-script italic text-gold-300">new patients</span> only</>}
        />
        <div className="glass-strong rounded-2xl p-5 sm:p-8 shadow-luxe">
          <form onSubmit={submit} className="space-y-5" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="reg-first">First Name</Label>
                <Input id="reg-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Juan" autoComplete="given-name" />
              </div>
              <div>
                <Label htmlFor="reg-last">Last Name</Label>
                <Input id="reg-last" value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="De La Cruz" autoComplete="family-name" />
              </div>
            </div>
            <div>
              <Label htmlFor="reg-email">Email Address</Label>
              <Input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" autoComplete="email" />
            </div>
            <div>
              <Label htmlFor="reg-phone">Phone Number</Label>
              <Input id="reg-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xx xxx xxxx" required type="tel" autoComplete="tel" />
            </div>
            <div>
              <Label htmlFor="reg-address">Address / Barangay</Label>
              <Input id="reg-address" value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="Brgy. Poblacion, Compostela, Davao De Oro" autoComplete="street-address" />
            </div>
            <div>
              <Label htmlFor="reg-password">Password</Label>
              <PasswordInput id="reg-password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="At least 6 characters" minLength={6} autoComplete="new-password" />
            </div>
            <div>
              <Label htmlFor="reg-confirm">Confirm Password</Label>
              <PasswordInput id="reg-confirm" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Repeat your password" autoComplete="new-password" />
            </div>
            {error && <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2" role="alert">{error}</div>}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Creating Account…" : "Create Account"}
            </Button>
          </form>
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
