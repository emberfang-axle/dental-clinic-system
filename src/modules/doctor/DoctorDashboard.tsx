import { useState, useMemo } from "react";
import { Card } from "../../components/ui";
import { StatGrid, TodaySchedule, AlertBanner, WeeklyMiniCalendar } from "../../components/ui/DashboardWidgets";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useStore } from "../../store/store";
import { DASHBOARD_TABS } from "../../shared/constants";
import { formatDateTime } from "../../shared/helpers";
import { AppointmentsList } from "../appointment/AppointmentsList";
import { AuditLogsPage, NotificationsCenter, PaymentsPage, ProfilePage, ReportsPage, ServicesPage } from "../shared/SharedModules";
import { ClinicalRecords } from "./ClinicalRecords";
import { ScheduleRules } from "./ScheduleRules";
import { StaffAccounts } from "./StaffAccounts";
import { AnnouncementsPage } from "./AnnouncementsPage";

export function DoctorDashboard({ navigate }: { navigate: (p: string) => void }) {
  const { user } = useStore();
  const [tab, setTab] = useState("overview");
  if (!user) return null;

  return (
    <DashboardLayout user={user} tabs={DASHBOARD_TABS.doctor} activeTab={tab} onTabChange={setTab} navigate={navigate}>
      {tab === "overview"      && <DoctorOverview onTabChange={setTab} />}
      {tab === "announcements" && <AnnouncementsPage />}
      {tab === "appointments"  && <AppointmentsList role="doctor" />}
      {tab === "audit"         && <AuditLogsPage />}
      {tab === "clinical"      && <ClinicalRecords />}
      {tab === "feedback"      && <DoctorFeedbackView />}
      {tab === "notifications" && <NotificationsCenter />}
      {tab === "payments"      && <PaymentsPage role="doctor" />}
      {tab === "reports"       && <ReportsPage />}
      {tab === "schedule"      && <ScheduleRules />}
      {tab === "services"      && <ServicesPage role="doctor" />}
      {tab === "staff"         && <StaffAccounts />}
      {tab === "profile"       && <ProfilePage />}
    </DashboardLayout>
  );
}

function DoctorOverview({ onTabChange }: { onTabChange: (t: string) => void }) {
  const { user, appointments, notifications, announcements } = useStore();
  if (!user) return null;

  const today     = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);
  const todayAppts = appointments.filter((a) => a.date === today && a.status !== "cancelled");
  const pending    = appointments.filter((a) => a.status === "pending");
  const monthRev   = appointments.filter((a) => a.paymentStatus === "paid" && a.date.startsWith(thisMonth)).reduce((s, a) => s + a.price, 0);
  const noShows    = appointments.filter((a) => a.status === "no-show").length;
  const unread     = notifications.filter((n) => n.userId === user.id && !n.read).length;
  const latest     = announcements[0];

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

  const months = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i));
    return d.toLocaleDateString("en-PH", { month: "short" });
  }), []);

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <AlertBanner message={`⚠ ${pending.length} appointment${pending.length > 1 ? "s" : ""} awaiting confirmation`}
          action="Review" onAction={() => onTabChange("appointments")} />
      )}

      <StatGrid onTabChange={onTabChange} stats={[
        { label: "Today",         value: todayAppts.length,               sub: "appointments", tab: "appointments",  color: "text-blue-300" },
        { label: "Pending",       value: pending.length,                  sub: "need confirm", tab: "appointments",  color: "text-amber-300" },
        { label: "This Month",    value: `₱${monthRev.toLocaleString()}`, sub: "revenue",      tab: "payments",      color: "text-gold-shine" },
        { label: "No-Shows",      value: noShows,                         sub: "all time",     tab: "appointments",  color: "text-red-300" },
      ]} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <WeeklyMiniCalendar appointments={appointments} onTabChange={onTabChange} />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-gold-shine">Today's Schedule</h2>
              <span className="text-xs text-gold-100/40">{today}</span>
            </div>
            <TodaySchedule appointments={todayAppts} onViewAll={() => onTabChange("appointments")} />
          </div>

          {/* Revenue sparkline */}
          <DoctorRevenueSparkline data={monthlyRevenue} months={months} />
        </div>

        <div className="space-y-4">
          {latest && (
            <div className="glass rounded-xl p-4 space-y-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold-300/55">Latest Announcement</p>
              {latest.pinned && <span className="text-[10px] text-amber-300/70">📌 Pinned</span>}
              <p className="font-medium text-gold-100 text-sm">{latest.title}</p>
              <p className="text-xs text-gold-100/55 line-clamp-3">{latest.body}</p>
              <button onClick={() => onTabChange("announcements")} className="text-xs text-gold-400/60 hover:text-gold-300 transition">View all →</button>
            </div>
          )}

          <div className="glass rounded-xl p-4 space-y-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold-300/55">Quick Actions</p>
            <button onClick={() => onTabChange("clinical")}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gold-100/70 hover:bg-gold-500/10 hover:text-gold-200 transition border border-gold-500/15">
              📋 Clinical Records
            </button>
            <button onClick={() => onTabChange("reports")}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gold-100/70 hover:bg-gold-500/10 hover:text-gold-200 transition border border-gold-500/15">
              📊 View Analytics
            </button>
            <button onClick={() => onTabChange("feedback")}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gold-100/70 hover:bg-gold-500/10 hover:text-gold-200 transition border border-gold-500/15">
              ⭐ Patient Feedback
            </button>
            {unread > 0 && (
              <button onClick={() => onTabChange("notifications")}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gold-100/70 hover:bg-gold-500/10 hover:text-gold-200 transition border border-amber-500/30 bg-amber-500/5">
                🔔 {unread} unread notification{unread !== 1 ? "s" : ""}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DoctorRevenueSparkline({ data, months }: { data: number[]; months: string[] }) {
  const max = Math.max(...data, 1);
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
          <linearGradient id="docSparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dab23c" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#dab23c" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline fill="none" stroke="#dab23c" strokeWidth="1.5" strokeLinejoin="round" points={points} />
        <polygon fill="url(#docSparkGrad)" points={`0,100 ${points} 100,100`} />
        {data.map((v, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = 100 - (v / max) * 80 - 10;
          return <circle key={i} cx={x} cy={y} r="2" fill="#dab23c" />;
        })}
      </svg>
      <div className="flex justify-between mt-1">
        {months.map((m) => <span key={m} className="text-[9px] text-gold-100/30">{m}</span>)}
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

export function DoctorFeedbackView() {
  const { feedbacks } = useStore();
  const sorted = [...feedbacks].sort((a, b) => b.at.localeCompare(a.at));
  const avg = feedbacks.length ? (feedbacks.reduce((s, f) => s + f.stars, 0) / feedbacks.length).toFixed(1) : "—";

  return (
    <div className="space-y-4">
      <div className="glass-strong rounded-xl p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Patient Feedback</p>
          <h2 className="font-serif text-2xl text-gold-shine mt-0.5">All Reviews</h2>
        </div>
        <div className="text-right">
          <div className="font-serif text-4xl text-gold-shine">{avg}</div>
          <div className="text-xs text-gold-100/50 mt-0.5">{feedbacks.length} review{feedbacks.length !== 1 ? "s" : ""}</div>
        </div>
      </div>
      {sorted.length === 0 ? (
        <Card><p className="text-sm text-gold-100/50 text-center py-4">No feedback submitted yet.</p></Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {sorted.map((f) => (
            <div key={f.id} className="glass rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-gold-100 text-sm">{f.userName}</span>
                <span className="text-gold-400 text-sm">{"★".repeat(f.stars)}<span className="text-gold-100/20">{"★".repeat(5 - f.stars)}</span></span>
              </div>
              <p className="text-sm text-gold-100/65 leading-relaxed">{f.text}</p>
              <p className="text-[10px] text-gold-100/35">{formatDateTime(f.at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
