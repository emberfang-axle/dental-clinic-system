import { useState } from "react";
import { Button, Input, Label, PasswordInput } from "../../components/ui";
import { useStore } from "../../store/store";
import { ROUTES } from "../../shared/constants";
import { authService } from "../../services/auth";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { DASHBOARD_TABS } from "../../shared/constants";
import { AppointmentsList } from "../appointment/AppointmentsList";
import { NotificationsCenter, PaymentsPage, ProfilePage, ReportsPage, ServicesPage } from "../shared/SharedModules";

export function AdminDashboard({ navigate }: { navigate: (p: string) => void }) {
  const { user } = useStore();
  const [tab, setTab] = useState("overview");

  if (!user || (user.role !== "admin" && user.role !== "doctor")) {
    return (
      <div className="min-h-screen bg-ink-950 text-gold-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-gold-shine mb-4">Access Denied</h1>
          <p className="text-gold-100/60 mb-6">You do not have admin privileges.</p>
          <Button onClick={() => navigate(ROUTES.home)}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout user={user} tabs={DASHBOARD_TABS.admin} activeTab={tab} onTabChange={setTab} navigate={navigate}>
      {tab === "overview"       && <AdminOverview />}
      {tab === "appointments"   && <AppointmentsList role="admin" />}
      {tab === "payments"       && <PaymentsPage role="admin" />}
      {tab === "services"       && <ServicesPage role="admin" />}
      {tab === "staff"          && <AdminStaffList />}
      {tab === "reports"        && <ReportsPage />}
      {tab === "notifications"  && <NotificationsCenter />}
      {tab === "profile"        && <ProfilePage />}
      {tab === "settings"       && <AdminCreateAccount />}
    </DashboardLayout>
  );
}

function AdminOverview() {
  const { users, services, appointments } = useStore();
  const staffCount = users.filter((u) => u.role === "staff" || u.role === "doctor").length;
  const patientCount = users.filter((u) => u.role === "patient").length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-strong rounded-xl p-6">
          <div className="text-gold-300/60 text-xs uppercase tracking-wider mb-2">Total Staff</div>
          <div className="font-serif text-3xl text-gold-shine">{staffCount}</div>
        </div>
        <div className="glass-strong rounded-xl p-6">
          <div className="text-gold-300/60 text-xs uppercase tracking-wider mb-2">Total Patients</div>
          <div className="font-serif text-3xl text-gold-shine">{patientCount}</div>
        </div>
        <div className="glass-strong rounded-xl p-6">
          <div className="text-gold-300/60 text-xs uppercase tracking-wider mb-2">Appointments</div>
          <div className="font-serif text-3xl text-gold-shine">{appointments.length}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {services.map((s) => (
          <div key={s.id} className="glass rounded-lg p-4 flex items-center justify-between">
            <div>
              <div className="font-medium text-gold-100">{s.name}</div>
              <div className="text-xs text-gold-100/60">{s.duration} min</div>
            </div>
            <div className="font-mono text-gold-300">₱{s.price.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminStaffList() {
  const { users } = useStore();
  const staff = users.filter((u) => u.role === "staff" || u.role === "doctor");
  return (
    <div className="space-y-3">
      {staff.map((u) => (
        <div key={u.id} className="glass rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="font-medium text-gold-100">{u.name}</div>
            <div className="text-xs text-gold-100/60">{u.email} · {u.role}</div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-1 rounded ${u.active ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
              {u.active ? "Active" : "Inactive"}
            </span>
            <div className="text-xs text-gold-300/60">{u.phone || "No phone"}</div>
          </div>
        </div>
      ))}
      {staff.length === 0 && <p className="text-gold-100/60 text-sm">No staff or doctors registered yet.</p>}
    </div>
  );
}

function AdminCreateAccount() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"staff" | "doctor">("staff");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      const u = await authService.createStaffAccount(name, email, phone, role, password);
      setSuccess(`Account created for ${u.name} (${u.role}). They can now log in at /admin-login.`);
      setName(""); setEmail(""); setPhone(""); setPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md">
      <h2 className="font-serif text-2xl text-gold-shine mb-2">Create Staff Account</h2>
      <p className="text-sm text-gold-100/60 mb-6">Create accounts for doctors and staff. They will use the Staff Portal (/admin-login) to sign in.</p>
      <div className="glass-strong rounded-2xl p-8 shadow-luxe">
        <form onSubmit={submit} className="space-y-5">
          <div><Label>Full Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Dr. Juan Dela Cruz" /></div>
          <div><Label>Email Address</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="staff@clinic.com" /></div>
          <div><Label>Phone Number</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xx xxx xxxx" /></div>
          <div><Label>Password</Label><PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" minLength={6} /></div>
          <div>
            <Label>Role</Label>
            <div className="flex gap-3 mt-2">
              {(["staff", "doctor"] as const).map((r) => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`flex-1 py-2 rounded-lg text-sm border transition capitalize ${role === r ? "border-gold-400 bg-gold-500/10 text-gold-200" : "border-gold-500/20 text-gold-100/60 hover:border-gold-400/50"}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          {error && <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">{error}</div>}
          {success && <div className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-md px-3 py-2">{success}</div>}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
