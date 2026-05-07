import { useState, useEffect } from "react";
import { Button, Input, Label, PasswordInput } from "../../components/ui";
import { authService } from "../../services/auth";
import { useStore } from "../../store/store";
import { dashboardPathFor } from "../../shared/helpers";
import { ROUTES } from "../../shared/constants";
import { AuthLayout, AuthHeader } from "./AuthLayout";

export function RegisterPage({ navigate }: { navigate: (p: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
    if (!name.trim()) { setError("Full name is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email address."); return; }
    if (!/^09\d{9}$/.test(phone.replace(/\s/g, ""))) { setError("Phone must be a valid PH mobile number (e.g. 09xx xxx xxxx)."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
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
        <AuthHeader
          title="Create Account"
          subtitle={<>Patient registration — for <span className="font-script italic text-gold-300">new patients</span> only</>}
        />
        <div className="glass-strong rounded-2xl p-5 sm:p-8 shadow-luxe">
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
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" minLength={6} />
            </div>
            {error && <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">{error}</div>}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
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
