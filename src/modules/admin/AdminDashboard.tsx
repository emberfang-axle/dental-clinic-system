import { useState, useMemo, useEffect } from "react";
import { Button, Input, Card, EmptyState } from "../../components/ui";
import { AlertBanner, WeeklyMiniCalendar, RevenueSparkline, AppointmentActionRow, StatGrid } from "../../components/ui/DashboardWidgets";
import { useStore } from "../../store/store";
import { ROUTES, DASHBOARD_TABS } from "../../shared/constants";
import { today, thisMonth, plural } from "../../shared/helpers";
import { settingsService } from "../../services/settings";
import { uploadFile } from "../../services/upload";
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
  const { appointments, settings } = useStore();
  const withCalendar = appointments.filter((a) => a.calendarEventId).length;
  const total = appointments.filter((a) => a.status !== "cancelled").length;
  const [qrUploading, setQrUploading] = useState(false);
  const [gcashNum, setGcashNum] = useState(settings?.gcashNumber ?? "");
  const [gcashSaving, setGcashSaving] = useState(false);
  const [gcashSaved, setGcashSaved] = useState(false);

  // Sync gcashNum when settings load from Firestore
  useEffect(() => {
    setGcashNum(settings?.gcashNumber ?? "");
  }, [settings?.gcashNumber]);

  const integrations = [
    { name: "Email Notifications", description: "Booking confirmations, reminders & payment receipts via Resend API", triggers: ["On appointment created", "On confirmed / completed / cancelled", "Daily 8AM reminder for tomorrow's patients"] },
    { name: "SMS Notifications", description: "Real-time SMS alerts via Semaphore API (Philippine numbers)", triggers: ["On appointment created", "On confirmed / completed / cancelled / rescheduled", "On payment confirmed"] },
    { name: "Google Calendar Sync", description: "Auto-creates and deletes calendar events on booking/cancellation", triggers: ["On appointment created → event added", "On appointment cancelled → event deleted"], stat: total > 0 ? `${withCalendar}/${total} appointments synced` : "Ready" },
    { name: "Firestore Security Rules", description: "Server-side access control — patients cannot escalate their own appointment status or forge payments", triggers: ["Patients: create pending only, cancel/reschedule/submit GCash proof", "Staff/Doctor: full appointment management"] },
  ];

  const roles = [
    { title: "Patient",        color: "text-gold-300",   can: ["Book & manage own appointments", "View treatment records & invoices", "Submit feedback"] },
    { title: "Staff",          color: "text-amber-300",  can: ["Manage queue & appointments", "Verify payments", "View permitted records"] },
    { title: "Co-Doctor",      color: "text-purple-300", can: ["View assigned patients", "Add treatment notes", "Access clinical records"] },
    { title: "Admin / Doctor", color: "text-blue-300",   can: ["Full system access", "Manage all accounts", "Analytics & audit logs"] },
  ];

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="font-serif text-2xl text-gold-shine mb-1">GCash Payment Settings</h2>
        <p className="text-sm text-gold-100/60 mb-4">Upload the clinic's GCash QR code and number so patients can scan and pay directly.</p>
        <div className="glass-strong rounded-xl p-5">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="shrink-0">
              {settings?.gcashQrUrl ? (
                <img src={settings.gcashQrUrl} alt="GCash QR" className="w-36 h-36 object-contain rounded-xl border border-gold-500/20" />
              ) : (
                <div className="w-36 h-36 rounded-xl border border-dashed border-gold-500/30 bg-ink-900/50 flex items-center justify-center text-gold-100/30 text-xs text-center px-3">No QR uploaded yet</div>
              )}
              <label className="mt-2 block">
                <span className="text-xs text-gold-300 hover:text-gold-100 cursor-pointer underline transition">
                  {qrUploading ? "Uploading…" : "Upload QR Image"}
                </span>
                <input type="file" accept="image/*" className="hidden" disabled={qrUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    setQrUploading(true);
                    try {
                      const url = await uploadFile(file, `clinic/gcash-qr.${file.name.split(".").pop()}`);
                      await settingsService.updateClinic({ gcashQrUrl: url }, "admin");
                    } finally { setQrUploading(false); }
                  }} />
              </label>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-gold-300/60 block mb-1">GCash Number</label>
                <div className="flex gap-2">
                  <input value={gcashNum} onChange={(e) => { setGcashNum(e.target.value); setGcashSaved(false); }} placeholder="e.g. 09XXXXXXXXX"
                    className="flex-1 rounded-md bg-ink-900/60 border border-gold-500/15 px-4 py-3 text-gold-50 placeholder:text-gold-100/25 text-sm focus:outline-none focus:border-gold-400/60 transition" />
                  <Button size="sm" disabled={gcashSaving} onClick={async () => {
                    setGcashSaving(true); setGcashSaved(false);
                    try {
                      await settingsService.updateClinic({ gcashNumber: gcashNum }, "admin");
                      setGcashSaved(true);
                      setTimeout(() => setGcashSaved(false), 3000);
                    } finally { setGcashSaving(false); }
                  }}>
                    {gcashSaving ? "Saving…" : gcashSaved ? "Saved" : "Save"}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gold-100/40 leading-relaxed">Patients will see this QR code and number when submitting GCash payment proof.</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-serif text-2xl text-gold-shine mb-1">System Integrations</h2>
        <p className="text-sm text-gold-100/60 mb-5">All backend functions are deployed on Firebase Cloud Functions and trigger automatically.</p>
        <div className="space-y-3">
          {integrations.map((s) => (
            <div key={s.name} className="glass-strong rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-gold-100">{s.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold uppercase tracking-wider">Active</span>
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
