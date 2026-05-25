import { useState, useMemo } from "react";
import { Card } from "../../components/ui";
import { StatGrid, TodaySchedule, AlertBanner, WeeklyMiniCalendar, RevenueSparkline, LatestAnnouncement, QuickActions, TodaySummaryWidget } from "../../components/ui/DashboardWidgets";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useStore } from "../../store/store";
import { DASHBOARD_TABS } from "../../shared/constants";
import { today, thisMonth, plural, formatDateTime } from "../../shared/helpers";
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
  const { user, appointments, notifications } = useStore();
  if (!user) return null;

  const todayStr = today();
  const monthStr = thisMonth();
  const unread   = notifications.filter((n) => n.userId === user.id && !n.read).length;

  const { todayAppts, pendingCount, treatedToday, monthTreated, monthRev } = useMemo(() => {
    const todayAppts: typeof appointments = [];
    let pendingCount = 0, treatedToday = 0, monthTreated = 0, monthRev = 0;

    for (const a of appointments) {
      const isToday = a.date === todayStr;
      const isMonth = a.date.startsWith(monthStr);

      if (isToday && a.status !== "cancelled") todayAppts.push(a);
      if (a.status === "pending") pendingCount++;
      if (isToday && a.status === "completed") treatedToday++;
      if (isMonth && a.status === "completed") monthTreated++;
      if (isMonth && a.paymentStatus === "paid") monthRev += a.price;
    }

    return { todayAppts, pendingCount, treatedToday, monthTreated, monthRev };
  }, [appointments, todayStr, monthStr]);

  return (
    <div className="space-y-6">
      {pendingCount > 0 && (
        <AlertBanner message={`${plural(pendingCount, "appointment")} awaiting confirmation`}
          action="Review" onAction={() => onTabChange("appointments")} />
      )}

      <StatGrid onTabChange={onTabChange} stats={[
        { label: "Today",         value: todayAppts.length,               sub: "appointments",                  tab: "appointments", color: "text-blue-300" },
        { label: "Treated Today", value: treatedToday,                    sub: "completed",                     tab: "clinical",     color: "text-emerald-300" },
        { label: "This Month",    value: `₱${monthRev.toLocaleString()}`, sub: `${monthTreated} treated`,       tab: "payments",     color: "text-gold-shine" },
        { label: "Pending",       value: pendingCount,                    sub: "need confirm",                  tab: "appointments", color: "text-amber-300" },
      ]} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <WeeklyMiniCalendar appointments={appointments} onTabChange={onTabChange} />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-gold-shine">Today's Schedule</h2>
              <span className="text-xs text-gold-100/40">{todayStr}</span>
            </div>
            <TodaySchedule appointments={todayAppts} onViewAll={() => onTabChange("appointments")} />
          </div>
          <RevenueSparkline appointments={appointments} />
        </div>

        <div className="space-y-4">
          <TodaySummaryWidget appointments={appointments} onTabChange={onTabChange} />
          <LatestAnnouncement onViewAll={() => onTabChange("announcements")} />
          <QuickActions actions={[
            { label: "Clinical Records", onClick: () => onTabChange("clinical") },
            { label: "View Analytics",   onClick: () => onTabChange("reports") },
            { label: "Patient Feedback", onClick: () => onTabChange("feedback") },
            ...(unread > 0 ? [{ label: `${plural(unread, "unread notification")}`, onClick: () => onTabChange("notifications") }] : []),
          ]} />
        </div>
      </div>
    </div>
  );
}

export function DoctorFeedbackView() {
  const { feedbacks } = useStore();

  const { sorted, avg } = useMemo(() => {
    const sorted = [...feedbacks].sort((a, b) => b.at.localeCompare(a.at));
    const avg = feedbacks.length
      ? (feedbacks.reduce((s, f) => s + f.stars, 0) / feedbacks.length).toFixed(1)
      : "—";
    return { sorted, avg };
  }, [feedbacks]);

  return (
    <div className="space-y-4">
      <div className="glass-strong rounded-xl p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Patient Feedback</p>
          <h2 className="font-serif text-2xl text-gold-shine mt-0.5">All Reviews</h2>
        </div>
        <div className="text-right">
          <div className="font-serif text-4xl text-gold-shine">{avg}</div>
          <div className="text-xs text-gold-100/50 mt-0.5">{plural(feedbacks.length, "review")}</div>
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
