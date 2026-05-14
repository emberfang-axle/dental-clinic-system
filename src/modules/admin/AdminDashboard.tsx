import { useState, useMemo, type ReactNode } from "react";
import { Button, Input, Badge, Card, EmptyState } from "../../components/ui";
import { AlertBanner, OverviewHeader, WeeklyMiniCalendar } from "../../components/ui/DashboardWidgets";
import { useStore } from "../../store/store";
import { ROUTES, DASHBOARD_TABS } from "../../shared/constants";
import { appointmentsService } from "../../services/appointments";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { AppointmentsList } from "../appointment/AppointmentsList";
import { ClinicalRecords } from "../doctor/ClinicalRecords";
import { ScheduleRules } from "../doctor/ScheduleRules";
import { AnnouncementsPage } from "../doctor/AnnouncementsPage";
import { NotificationsCenter, PaymentsPage, ProfilePage, ReportsPage, ServicesPage, AuditLogsPage } from "../shared/SharedModules";
import { DoctorFeedbackView } from "../doctor/DoctorDashboard";
import { StaffAccounts } from "../doctor/StaffAccounts";
import type { Appointment, AppointmentStatus } from "../../shared/types";

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
      {tab === "overview"       && <AdminOverview onTabChange={setTab} />}
      {tab === "appointments"   && <AppointmentsList role="admin" />}
      {tab === "clinical"       && <ClinicalRecords />}
      {tab === "payments"       && <PaymentsPage role="admin" />}
      {tab === "services"       && <ServicesPage role="admin" />}
      {tab === "staff"          && <StaffAccounts />}
      {tab === "schedule"       && <ScheduleRules />}
      {tab === "announcements"  && <AnnouncementsPage />}
      {tab === "reports"        && <ReportsPage />}
      {tab === "feedback"       && <DoctorFeedbackView />}
      {tab === "audit"          && <AuditLogsPage />}
      {tab === "notifications"  && <NotificationsCenter />}
      {tab === "profile"        && <ProfilePage />}
      {tab === "settings"       && <SystemIntegrationStatus />}
    </DashboardLayout>
  );
}

function AdminOverview({ onTabChange }: { onTabChange: (t: string) => void }) {
  const { user, users, appointments } = useStore();
  const today     = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);

  const staffCount    = users.filter((u) => u.role === "staff" || u.role === "doctor" || u.role === "co-doctor").length;
  const patientCount  = users.filter((u) => u.role === "patient").length;
  const todayAppts    = appointments.filter((a) => a.date === today && a.status !== "cancelled");
  const pending       = appointments.filter((a) => a.status === "pending");
  const unpaidCount   = appointments.filter((a) => a.paymentStatus === "unpaid" && a.status === "completed").length;
  const monthRevenue  = appointments.filter((a) => a.paymentStatus === "paid" && a.date.startsWith(thisMonth)).reduce((s, a) => s + a.price, 0);
  const allRevenue    = appointments.filter((a) => a.paymentStatus === "paid").reduce((s, a) => s + a.price, 0);
  const completedAll  = appointments.filter((a) => a.status === "completed").length;
  const noShows       = appointments.filter((a) => a.status === "no-show").length;
  const totalNonCanc  = appointments.filter((a) => a.status !== "cancelled").length;
  const completionPct = totalNonCanc > 0 ? Math.round((completedAll / totalNonCanc) * 100) : 0;
  const todaySorted = [...todayAppts].sort((a, b) =>
    (b.createdAt ?? b.date + b.time).localeCompare(a.createdAt ?? a.date + a.time)
  );

  // Last 6 months revenue for sparkline
  const monthlyRevenue = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      map[d.toISOString().slice(0, 7)] = 0;
    }
    appointments.filter((a) => a.paymentStatus === "paid").forEach((a) => {
      const m = a.date.slice(0, 7);
      if (m in map) map[m] += a.price;
    });
    return Object.values(map);
  }, [appointments]);

  // Top 3 services by appointment count this month
  const topServices = useMemo((): [string, number][] => {
    const map: Record<string, number> = {};
    appointments.filter((a) => a.date.startsWith(thisMonth) && a.status !== "cancelled")
      .forEach((a) => { map[a.serviceName] = (map[a.serviceName] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [appointments, thisMonth]);

  return (
    <div className="space-y-6">

      <OverviewHeader role="Admin Panel" name={user?.name ?? "Doctor"}
        sub={`${new Date().toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" })} · ${todayAppts.length} appointment${todayAppts.length !== 1 ? "s" : ""} today`}>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => onTabChange("appointments")}
            className="px-4 py-2 rounded-lg text-sm border border-gold-500/30 text-gold-200 hover:border-gold-400/60 hover:bg-gold-500/10 transition">
            Appointments
          </button>
          <button onClick={() => onTabChange("staff")}
            className="px-4 py-2 rounded-lg text-sm border border-gold-500/30 text-gold-200 hover:border-gold-400/60 hover:bg-gold-500/10 transition">
            + Add Account
          </button>
        </div>
      </OverviewHeader>

      <div className="flex flex-col gap-2">
        {pending.length > 0 && (
          <AlertBanner message={`⚠ ${pending.length} appointment${pending.length > 1 ? "s" : ""} awaiting confirmation`}
            action="Review Now" onAction={() => onTabChange("appointments")} />
        )}
        {unpaidCount > 0 && (
          <AlertBanner tone="red"
            message={`₱ ${unpaidCount} completed appointment${unpaidCount > 1 ? "s" : ""} with unpaid balance`}
            action="View Payments" onAction={() => onTabChange("payments")} />
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="Today"       value={todayAppts.length}                   sub={`${pending.length} pending`}               onClick={() => onTabChange("appointments")} accent="blue" />
        <StatTile label="This Month"  value={`₱${monthRevenue.toLocaleString()}`} sub={`₱${allRevenue.toLocaleString()} all-time`} onClick={() => onTabChange("payments")}     accent="gold" />
        <StatTile label="Completion"  value={`${completionPct}%`}                 sub={`${completedAll} of ${totalNonCanc} done`}  onClick={() => onTabChange("reports")}      accent="green" />
        <StatTile label="No-Shows"    value={noShows}                             sub={`${patientCount} patients · ${staffCount} staff`} onClick={() => onTabChange("appointments")} accent="purple" />
      </div>

      {/* ── Main grid ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left col */}
        <div className="lg:col-span-2 space-y-6">
          <WeeklyMiniCalendar appointments={appointments} onTabChange={onTabChange} />

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-xl text-gold-shine">Today's Schedule</h2>
              <span className="text-xs text-gold-100/40">{today}</span>
            </div>
            {todaySorted.length === 0 ? (
              <Card><EmptyState icon="—" title="No appointments today" subtitle="Enjoy the quiet day!" /></Card>
            ) : (
              <div className="space-y-2">
                {todaySorted.map((a) => (
                  <TodayAppointmentRow key={a.id} appt={a} />
                ))}
              </div>
            )}
          </div>

          <RevenueSparkline data={monthlyRevenue} />
        </div>

        {/* Right col */}
        <div className="space-y-6">
          {topServices.length > 0 && (
            <div>
              <h2 className="font-serif text-xl text-gold-shine mb-3">Top Services</h2>
              <div className="glass rounded-xl p-4 space-y-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gold-300/50 -mb-1">This month</p>
                {topServices.map(([name, count], i) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-gold-300/40 w-4">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gold-100/80 truncate">{name}</p>
                      <div className="mt-1 h-1 rounded-full bg-gold-500/10 overflow-hidden">
                        <div className="h-full rounded-full bg-gold-gradient"
                          style={{ width: `${Math.round((count / (topServices[0][1] || 1)) * 100)}%` }} />
                      </div>
                    </div>
                    <span className="text-xs text-gold-300/60 shrink-0">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-xl text-gold-shine">Recent Patients</h2>
              <button onClick={() => onTabChange("appointments")} className="text-xs text-gold-400/60 hover:text-gold-300 transition">View all →</button>
            </div>
            <RecentPatients />
          </div>
        </div>
      </div>
    </div>
  );
}

function TodayAppointmentRow({ appt: a }: { appt: Appointment }) {
  const { user } = useStore();
  const [updating, setUpdating] = useState<AppointmentStatus | null>(null);

  async function setStatus(status: AppointmentStatus) {
    setUpdating(status);
    try {
      await appointmentsService.update(a.id, { status }, user?.name ?? "admin");
    } finally { setUpdating(null); }
  }

  const nextActions: { label: string; status: AppointmentStatus }[] =
    a.status === "pending"      ? [{ label: "Confirm",  status: "confirmed"   }] :
    a.status === "confirmed"    ? [{ label: "Start",    status: "in-progress" }] :
    a.status === "in-progress"  ? [{ label: "Complete", status: "completed"   }] :
    [];

  return (
    <div className="glass rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-mono text-gold-300 text-sm shrink-0">{a.time}</span>
        <div className="min-w-0">
          <p className="font-medium text-gold-100 text-sm truncate">{a.patientName}</p>
          <p className="text-xs text-gold-100/50 truncate">{a.serviceName} · {a.doctor}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        {a.emergency && <Badge tone="emergency">Priority</Badge>}
        <Badge tone={a.status as any}>{a.status}</Badge>
        <Badge tone={a.paymentStatus === "paid" ? "paid" : "neutral"}>
          {a.paymentStatus === "paid" ? `Paid · ${a.paymentMethod === "gcash" ? "GCash" : "Cash"}` : "Unpaid"}
        </Badge>
        {nextActions.map(({ label, status }) => (
          <button key={status} disabled={!!updating} onClick={() => setStatus(status)}
            className="text-[10px] px-2.5 py-1 rounded-full border border-gold-500/30 text-gold-300 hover:bg-gold-500/10 transition disabled:opacity-50">
            {updating === status ? "…" : label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RevenueSparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const months = useMemo((): string[] => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
      return d.toLocaleDateString("en-PH", { month: "short" });
    });
  }, []);

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (v / max) * 80 - 10;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="glass rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-gold-300/55 mb-3">Revenue — Last 6 Months</p>
      <svg viewBox="0 0 100 60" className="w-full h-16" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dab23c" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#dab23c" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline fill="none" stroke="#dab23c" strokeWidth="1.5" strokeLinejoin="round" points={points} />
        <polygon fill="url(#sparkGrad)" points={`0,100 ${points} 100,100`} />
        {data.map((v, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = 100 - (v / max) * 80 - 10;
          return <circle key={i} cx={x} cy={y} r="2" fill="#dab23c" />;
        })}
      </svg>
      <div className="flex justify-between mt-1">
        {months.map((m) => (
          <span key={m} className="text-[9px] text-gold-100/30">{m}</span>
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {data.map((v, i) => (
          <span key={i} className="text-[9px] text-gold-300/50 font-mono">
            {v >= 1000 ? `₱${(v / 1000).toFixed(0)}k` : v > 0 ? `₱${v}` : "—"}
          </span>
        ))}
      </div>
    </div>
  );
}




function StatTile({ label, value, sub, onClick, accent = "gold" }: {
  label: string; value: string | number; sub: string; onClick: () => void;
  accent?: "gold" | "blue" | "green" | "purple";
}) {
  const accents = {
    gold:   "text-gold-shine",
    blue:   "text-blue-300",
    green:  "text-emerald-300",
    purple: "text-purple-300",
  };
  return (
    <button onClick={onClick} className="glass-strong rounded-xl p-5 text-left hover:border-gold-400/40 transition group w-full">
      <div className="text-gold-300/60 text-[10px] uppercase tracking-wider mb-1">{label}</div>
      <div className={`font-serif text-2xl ${accents[accent]} group-hover:brightness-125 transition`}>{value}</div>
      <div className="text-xs text-gold-100/35 mt-1">{sub}</div>
    </button>
  );
}

function RecentPatients() {
  const { appointments } = useStore();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "alpha">("recent");

  const seen = new Set<string>();
  const patients: { id: string; name: string; lastService: string; lastDate: string; visits: number }[] = [];
  [...appointments]
    .sort((a, b) => (b.createdAt ?? b.date).localeCompare(a.createdAt ?? a.date))
    .forEach((a) => {
      if (!seen.has(a.patientId)) {
        seen.add(a.patientId);
        patients.push({
          id: a.patientId,
          name: a.patientName,
          lastService: a.serviceName,
          lastDate: a.date,
          visits: appointments.filter((x) => x.patientId === a.patientId).length,
        });
      }
    });

  const sorted = sort === "alpha"
    ? [...patients].sort((a, b) => a.name.localeCompare(b.name))
    : patients; // already sorted by recent

  const filtered = search
    ? sorted.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : sorted.slice(0, 8);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Input placeholder="Search patient…" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 min-w-0" />
        <div className="flex rounded-lg border border-gold-500/20 overflow-hidden text-xs shrink-0">
          <button onClick={() => setSort("recent")} className={`px-2.5 py-1.5 transition ${sort === "recent" ? "bg-gold-500/15 text-gold-200" : "text-gold-100/50 hover:text-gold-200"}`}>Recent</button>
          <button onClick={() => setSort("alpha")} className={`px-2.5 py-1.5 border-l border-gold-500/20 transition ${sort === "alpha" ? "bg-gold-500/15 text-gold-200" : "text-gold-100/50 hover:text-gold-200"}`}>A→Z</button>
        </div>
      </div>
      {filtered.length === 0 && <p className="text-sm text-gold-100/50">No patients found.</p>}
      <div className="grid sm:grid-cols-2 gap-2">
        {filtered.map((p) => (
          <div key={p.id} className="glass rounded-lg px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-gold-100 text-sm truncate">{p.name}</p>
              <p className="text-xs text-gold-100/45 truncate">{p.lastService} · {p.lastDate}</p>
            </div>
            <span className="text-xs text-gold-300/60 shrink-0">{p.visits} visit{p.visits !== 1 ? "s" : ""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SystemIntegrationStatus() {
  const { appointments } = useStore();
  const withCalendar = appointments.filter((a) => a.calendarEventId).length;
  const total = appointments.filter((a) => a.status !== "cancelled").length;

  const integrations: { name: string; description: string; triggers: string[]; icon: ReactNode; stat?: string }[] = [
    {
      name: "Email Notifications",
      description: "Booking confirmations, reminders & payment receipts via Resend API",
      triggers: ["On appointment created", "On confirmed / completed / cancelled", "Daily 8AM reminder for tomorrow's patients", "On announcement posted"],
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    },
    {
      name: "SMS Notifications",
      description: "Real-time SMS alerts via Semaphore API (Philippine numbers)",
      triggers: ["On appointment created", "On confirmed / completed / cancelled / rescheduled", "On payment confirmed"],
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
    },
    {
      name: "Google Calendar Sync",
      description: "Auto-creates and deletes calendar events on booking/cancellation",
      triggers: ["On appointment created → event added", "On appointment cancelled → event deleted"],
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
      stat: total > 0 ? `${withCalendar}/${total} appointments synced` : "Ready",
    },
    {
      name: "Firestore Security Rules",
      description: "Server-side access control — patients cannot escalate their own appointment status or forge payments",
      triggers: ["Patients: create pending only, cancel/reschedule/submit GCash proof", "Staff/Doctor: full appointment management", "Admin/Doctor: user & service management"],
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    },
  ];

  const roles = [
    { title: "Patient",       color: "text-gold-300",   can: ["Book & manage own appointments", "View treatment records & invoices", "Submit feedback"] },
    { title: "Staff",         color: "text-amber-300",  can: ["Manage queue & appointments", "Verify payments", "View permitted records"] },
    { title: "Co-Doctor",     color: "text-purple-300", can: ["View assigned patients", "Add treatment notes", "Access clinical records"] },
    { title: "Admin / Doctor",color: "text-blue-300",   can: ["Full system access", "Manage all accounts", "Analytics & audit logs"] },
  ];

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="font-serif text-2xl text-gold-shine mb-1">System Integrations</h2>
        <p className="text-sm text-gold-100/60 mb-5">All backend functions are deployed on Firebase Cloud Functions and trigger automatically.</p>
        <div className="space-y-3">
          {integrations.map((s) => (
            <div key={s.name} className="glass-strong rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-9 h-9 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 shrink-0">{s.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gold-100">{s.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold uppercase tracking-wider">Active</span>
                  </div>
                  <p className="text-xs text-gold-100/55">{s.description}</p>
                  {s.stat && <p className="text-xs text-gold-300/70 mt-0.5 font-mono">{s.stat}</p>}
                </div>
              </div>
              <div className="space-y-0.5 pl-9">
                {s.triggers.map((t) => (
                  <div key={t} className="flex items-center gap-2 text-xs text-gold-100/40">
                    <span className="text-gold-500/40">→</span> {t}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-serif text-2xl text-gold-shine mb-4">Role Permissions</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {roles.map((r) => (
            <div key={r.title} className="glass rounded-xl p-4">
              <p className={`font-semibold text-sm mb-2 ${r.color}`}>{r.title}</p>
              <ul className="space-y-1">
                {r.can.map((c) => (
                  <li key={c} className="text-xs text-gold-100/55 flex gap-1.5">
                    <span className="text-emerald-400 shrink-0">+</span>{c}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}




