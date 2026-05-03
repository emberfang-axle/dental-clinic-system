import { useState } from "react";
import { useStore } from "../../store/store";
import { ROUTES } from "../../shared/constants";
import { Button, Input, Label } from "../../components/ui";
import { authService } from "../../services/auth";

export function AdminDashboard({ navigate }: { navigate: (p: string) => void }) {
  const { user, users, services, appointments } = useStore();
  const [activeTab, setActiveTab] = useState("overview");

  // Both admin and doctor can access this dashboard
  if (!user || (user.role !== "admin" && user.role !== "doctor")) {
    return (
      <div className="min-h-screen bg-ink-950 text-gold-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif text-gold-shine mb-4">Access Denied</h1>
          <p className="text-gold-100/60 mb-6">You do not have admin or doctor privileges.</p>
          <Button onClick={() => navigate(ROUTES.home)}>Go Home</Button>
        </div>
      </div>
    );
  }

  const staffCount = users.filter((u) => u.role === "staff" || u.role === "doctor").length;
  const patientCount = users.filter((u) => u.role === "patient").length;
  const totalAppointments = appointments.length;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "staff", label: "Staff" },
    { id: "create-account", label: "Create Account" },
    { id: "appointments", label: "Appointments" },
  ];

  return (
    <div className="min-h-screen bg-ink-950 text-gold-50 pb-20">
      <header className="border-b border-gold-soft px-6 py-4 flex items-center justify-between bg-ink-950/70 backdrop-blur-xl">
        <h1 className="font-serif text-xl text-gold-shine">
          {user.role === "doctor" ? "Doctor Dashboard" : "Admin Dashboard"}
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gold-100/60">{user.name}</span>
          <Button variant="outline" size="sm" onClick={() => { authService.logout(); navigate(ROUTES.home); }}>
            Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "overview" && (
          <div>
            <h2 className="font-serif text-2xl text-gold-shine mb-6">System Overview</h2>
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
                <div className="font-serif text-3xl text-gold-shine">{totalAppointments}</div>
              </div>
            </div>

            <h3 className="font-serif text-xl text-gold-shine mt-8 mb-4">Services</h3>
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
        )}

        {activeTab === "staff" && (
          <div>
            <h2 className="font-serif text-2xl text-gold-shine mb-6">Staff & Doctors</h2>
            <div className="space-y-3">
              {users.filter((u) => u.role === "staff" || u.role === "doctor").map((u) => (
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
              {users.filter((u) => u.role === "staff" || u.role === "doctor").length === 0 && (
                <p className="text-gold-100/60">No staff or doctors registered yet.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "create-account" && (
          <CreateStaffAccountForm />
        )}

        {activeTab === "appointments" && (
          <div>
            <h2 className="font-serif text-2xl text-gold-shine mb-6">All Appointments</h2>
            <div className="space-y-3">
              {appointments.map((a) => (
                <div key={a.id} className="glass rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gold-100">{a.patientName}</div>
                      <div className="text-xs text-gold-100/60">{a.serviceName} · {a.date} {a.time}</div>
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${a.status === "completed" ? "bg-emerald-500/20 text-emerald-300" : a.status === "pending" ? "bg-yellow-500/20 text-yellow-300" : "bg-red-500/20 text-red-300"}`}>
                      {a.status}
                    </div>
                  </div>
                </div>
              ))}
              {appointments.length === 0 && (
                <p className="text-gold-100/60">No appointments yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-ink-950/90 backdrop-blur-xl border-t border-gold-soft px-6 py-3">
        <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm transition whitespace-nowrap ${activeTab === tab.id ? "bg-gold-500/20 text-gold-300" : "text-gold-100/60 hover:text-gold-100"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function CreateStaffAccountForm() {
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
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const u = await authService.createStaffAccount(name, email, phone, role, password);
      setSuccess(`Account created for ${u.name} (${u.role}). They can now log in at /admin-login.`);
      setName(""); setEmail(""); setPhone(""); setPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md">
      <h2 className="font-serif text-2xl text-gold-shine mb-2">Create Staff Account</h2>
      <p className="text-sm text-gold-100/60 mb-6">
        Create accounts for doctors and staff. They will use the Staff Portal (/admin-login) to sign in.
      </p>

      <div className="glass-strong rounded-2xl p-8 shadow-luxe">
        <form onSubmit={submit} className="space-y-5">
          <div>
            <Label>Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Dr. Juan Dela Cruz" />
          </div>
          <div>
            <Label>Email Address</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="staff@clinic.com" />
          </div>
          <div>
            <Label>Phone Number</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xx xxx xxxx" />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" minLength={6} />
          </div>
          <div>
            <Label>Role</Label>
            <div className="flex gap-3 mt-2">
              {(["staff", "doctor"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2 rounded-lg text-sm border transition capitalize ${role === r ? "border-gold-400 bg-gold-500/10 text-gold-200" : "border-gold-500/20 text-gold-100/60 hover:border-gold-400/50"}`}
                >
                  {r}
                </button>
              ))}
            </div>
            <p className="text-xs text-gold-100/40 mt-2">
              {role === "doctor" ? "Doctor has full access including clinical records and staff management." : "Staff has limited access: appointments, payments, and records support."}
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">{error}</div>
          )}
          {success && (
            <div className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-md px-3 py-2">{success}</div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
