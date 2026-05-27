import { useState, useMemo } from "react";
import { Button, Input, Card, EmptyState } from "../../components/ui";
import { AlertBanner, WeeklyMiniCalendar, RevenueSparkline, AppointmentActionRow, StatGrid, TodaySummaryWidget } from "../../components/ui/DashboardWidgets";
import { useStore } from "../../store/store";
import { ROUTES, DASHBOARD_TABS } from "../../shared/constants";
import { today, thisMonth, plural } from "../../shared/helpers";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { AppointmentsList } from "../appointment/AppointmentsList";
import { ClinicalRecords } from "../doctor/ClinicalRecords";
import { ScheduleRules } from "../doctor/ScheduleRules";
import { AnnouncementsPage } from "../doctor/AnnouncementsPage";
import { NotificationsCenter, PaymentsPage, ProfilePage, ReportsPage, ServicesPage, AuditLogsPage } from "../shared/SharedModules";
import { DoctorFeedbackView } from "../doctor/DoctorDashboard";
import { StaffAccounts } from "../doctor/StaffAccounts";

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
  const { users, appointments } = useStore();

  const stats = useMemo(() => {
    const todayStr  = today();
    const monthStr  = thisMonth();
    let todayCount = 0, pendingCount = 0, unpaidCount = 0;
    let monthRevenue = 0, allRevenue = 0, completedAll = 0, noShows = 0, totalNonCanc = 0;
    const serviceMap: Record<string, number> = {};
    const todayList: typeof appointments = [];

    for (const a of appointments) {
      const isToday   = a.date === todayStr;
      const isMonth   = a.date.startsWith(monthStr);
      const cancelled = a.status === "cancelled";

      if (isToday && !cancelled) { todayCount++; todayList.push(a); }
      if (a.status === "pending")  pendingCount++;
      if (a.status === "completed" && a.paymentStatus === "unpaid") unpaidCount++;
      if (a.paymentStatus === "paid") {
        allRevenue += a.price;
        if (isMonth) monthRevenue += a.price;
      }
      if (a.status === "completed") completedAll++;
      if (a.status === "no-show")   noShows++;
      if (!cancelled) {
        totalNonCanc++;
        if (isMonth) serviceMap[a.serviceName] = (serviceMap[a.serviceName] || 0) + 1;
      }
    }

    const completionPct = totalNonCanc > 0 ? Math.round((completedAll / totalNonCanc) * 100) : 0;
    const patientCount  = users.filter((u) => u.role === "patient").length;
    const staffCount    = users.filter((u) => u.role === "staff" || u.role === "doctor" || u.role === "co-doctor").length;
    const topServices   = Object.entries(serviceMap).sort((a, b) => b[1] - a[1]).slice(0, 3) as [string, number][];
    const todaySorted   = todayList.sort((a, b) => a.time.localeCompare(b.time));

    return { todayStr, todayCount, pendingCount, unpaidCount, monthRevenue, allRevenue, completedAll, noShows, totalNonCanc, completionPct, patientCount, staffCount, topServices, todaySorted };
  }, [appointments, users]);

  const { todayStr, todayCount, pendingCount, unpaidCount, monthRevenue, allRevenue, completedAll, noShows, totalNonCanc, completionPct, patientCount, staffCount, topServices, todaySorted } = stats;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        {pendingCount > 0 && (
          <AlertBanner message={`${plural(pendingCount, "appointment")} awaiting confirmation`}
            action="Review Now" onAction={() => onTabChange("appointments")} />
        )}
        {unpaidCount > 0 && (
          <AlertBanner tone="red"
            message={`${plural(unpaidCount, "completed appointment")} with unpaid balance`}
            action="View Payments" onAction={() => onTabChange("payments")} />
        )}
      </div>

      {/* Generate Report button — panel requirement */}
      <div className="flex justify-end">
        <button
          onClick={() => onTabChange("reports")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gold-500/30 bg-gold-500/10 text-gold-200 text-sm font-medium hover:bg-gold-500/20 hover:border-gold-400/50 transition"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          Generate Report
        </button>
      </div>

      <StatGrid onTabChange={onTabChange} stats={[
        { label: "Today",      value: todayCount,                          sub: `${pendingCount} pending`,                      tab: "appointments", color: "text-blue-300" },
        { label: "This Month", value: `₱${monthRevenue.toLocaleString()}`, sub: `₱${allRevenue.toLocaleString()} all-time`,      tab: "payments",     color: "text-gold-shine" },
        { label: "Completion", value: `${completionPct}%`,                 sub: `${completedAll} of ${totalNonCanc} done`,       tab: "reports",      color: "text-emerald-300" },
        { label: "No-Shows",   value: noShows,                             sub: `${patientCount} patients · ${staffCount} staff`, tab: "appointments", color: "text-purple-300" },
      ]} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <WeeklyMiniCalendar appointments={appointments} onTabChange={onTabChange} />

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-xl text-gold-shine">Today's Schedule</h2>
              <span className="text-xs text-gold-100/40">{todayStr}</span>
            </div>
            {todaySorted.length === 0 ? (
              <Card><EmptyState icon="—" title="No appointments today" subtitle="Enjoy the quiet day!" /></Card>
            ) : (
              <div className="space-y-2">
                {todaySorted.map((a) => <AppointmentActionRow key={a.id} appt={a} />)}
              </div>
            )}
          </div>

          <RevenueSparkline appointments={appointments} />
        </div>

        <div className="space-y-6">
          <TodaySummaryWidget appointments={appointments} onTabChange={onTabChange} />
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

          <RecentPatients onTabChange={onTabChange} />
        </div>
      </div>
    </div>
  );
}

function RecentPatients({ onTabChange }: { onTabChange: (t: string) => void }) {
  const { appointments } = useStore();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "alpha">("recent");

  const patients = useMemo(() => {
    const seen = new Set<string>();
    const list: { id: string; name: string; lastService: string; lastDate: string; visits: number }[] = [];
    [...appointments]
      .sort((a, b) => (b.createdAt ?? b.date).localeCompare(a.createdAt ?? a.date))
      .forEach((a) => {
        if (!seen.has(a.patientId)) {
          seen.add(a.patientId);
          list.push({
            id: a.patientId, name: a.patientName,
            lastService: a.serviceName, lastDate: a.date,
            visits: appointments.filter((x) => x.patientId === a.patientId).length,
          });
        }
      });
    return list;
  }, [appointments]);

  const sorted = sort === "alpha" ? [...patients].sort((a, b) => a.name.localeCompare(b.name)) : patients;
  const filtered = search
    ? sorted.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : sorted.slice(0, 8);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl text-gold-shine">Recent Patients</h2>
        <button onClick={() => onTabChange("appointments")} className="text-xs text-gold-400/60 hover:text-gold-300 transition">View all →</button>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Input placeholder="Search patient…" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 min-w-0" />
        <div className="flex rounded-lg border border-gold-500/20 overflow-hidden text-xs shrink-0">
          {(["recent", "alpha"] as const).map((s, i) => (
            <button key={s} onClick={() => setSort(s)}
              className={`px-2.5 py-1.5 transition ${i > 0 ? "border-l border-gold-500/20" : ""} ${sort === s ? "bg-gold-500/15 text-gold-200" : "text-gold-100/50 hover:text-gold-200"}`}>
              {s === "recent" ? "Recent" : "A→Z"}
            </button>
          ))}
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
            <span className="text-xs text-gold-300/60 shrink-0">{plural(p.visits, "visit")}</span>
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

  const integrations: {
    name: string;
    description: string;
    triggers: string[];
    stat?: string;
    status: "active" | "planned";
  }[] = [
    { name: "Email Notifications", status: "active", description: "Booking confirmations, reminders & payment receipts (Firebase Cloud Functions + Gmail)", triggers: ["On appointment created", "On confirmed / completed / cancelled", "Daily reminder for tomorrow's patients"] },
    { name: "SMS Notifications", status: "planned", description: "Planned: SMS alerts via Semaphore API (Philippine numbers) — panel noted as future enhancement", triggers: ["On appointment created", "On confirmed / completed / cancelled", "On payment confirmed"] },
    { name: "Google Calendar Sync", status: "active", description: "Auto-creates and deletes calendar events on booking/cancellation", triggers: ["On appointment created → event added", "On appointment cancelled → event deleted"], stat: total > 0 ? `${withCalendar}/${total} appointments synced` : "Ready" },
    { name: "Firestore Security Rules", status: "active", description: "Server-side access control — patients cannot escalate their own appointment status or forge payments", triggers: ["Patients: create pending only, cancel/reschedule", "Staff/Doctor: full appointment management"] },
  ];

  const roles = [
    { title: "Patient",        color: "text-gold-300",   can: ["Book & manage own appointments", "View treatment records & invoices", "Submit feedback"] },
    { title: "Staff",          color: "text-amber-300",  can: ["Manage queue & appointments", "Record cash payments", "View permitted records"] },
    { title: "Co-Doctor",      color: "text-purple-300", can: ["View assigned patients", "Add treatment notes", "Access clinical records"] },
    { title: "Admin / Doctor", color: "text-blue-300",   can: ["Full system access", "Manage all accounts", "Analytics & audit logs"] },
  ];

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="font-serif text-2xl text-gold-shine mb-1">System Integrations</h2>
        <p className="text-sm text-gold-100/60 mb-5">All backend functions are deployed on Firebase Cloud Functions and trigger automatically.</p>
        <div className="space-y-3">
          {integrations.map((s) => (
            <div key={s.name} className="glass-strong rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-gold-100">{s.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${s.status === "active" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/15 text-amber-300/90"}`}>
                  {s.status === "active" ? "Active" : "Planned"}
                </span>
              </div>
              <p className="text-xs text-gold-100/55 mb-2">{s.description}</p>
              {"stat" in s && s.stat && <p className="text-xs text-gold-300/70 mb-2 font-mono">{s.stat}</p>}
              <div className="space-y-0.5">
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
