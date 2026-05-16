import { useState } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useStore } from "../../store/store";
import { DASHBOARD_TABS } from "../../shared/constants";
import { AppointmentsList } from "../appointment/AppointmentsList";
import { NotificationsCenter, ProfilePage } from "../shared/SharedModules";
import { ClinicalRecords } from "./ClinicalRecords";
import { AnnouncementsPage } from "./AnnouncementsPage";
import { StatGrid, TodaySchedule, AlertBanner, WeeklyMiniCalendar } from "../../components/ui/DashboardWidgets";

export function CoDoctorDashboard({ navigate }: { navigate: (p: string) => void }) {
  const { user } = useStore();
  const [tab, setTab] = useState("overview");
  if (!user || user.role !== "co-doctor") return null;

  return (
    <DashboardLayout user={user} tabs={DASHBOARD_TABS["co-doctor"]} activeTab={tab} onTabChange={setTab} navigate={navigate}>
      {tab === "overview"      && <CoDoctorOverview onTabChange={setTab} />}
      {tab === "clinical"      && <ClinicalRecords />}
      {tab === "appointments"  && <AppointmentsList role="doctor" />}
      {tab === "announcements" && <AnnouncementsPage />}
      {tab === "notifications" && <NotificationsCenter />}
      {tab === "profile"       && <ProfilePage />}
    </DashboardLayout>
  );
}

function CoDoctorOverview({ onTabChange }: { onTabChange: (t: string) => void }) {
  const { user, appointments, notifications, announcements } = useStore();
  if (!user) return null;

  const today      = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments.filter((a) => a.date === today && a.status !== "cancelled");
  const pending    = appointments.filter((a) => a.status === "pending");
  const inProgress = appointments.filter((a) => a.status === "in-progress");
  const unread     = notifications.filter((n) => n.userId === user.id && !n.read).length;
  const latest     = announcements[0];

  // This week completed
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().slice(0, 10);
  const weekCompleted = appointments.filter((a) => a.status === "completed" && a.date >= weekStartStr).length;

  return (
    <div className="space-y-6">
      {inProgress.length > 0 && (
        <AlertBanner tone="blue"
          message={`${inProgress.length} patient${inProgress.length > 1 ? "s" : ""} currently in progress`}
          action="View" onAction={() => onTabChange("appointments")} />
      )}
      {pending.length > 0 && (
        <AlertBanner
          message={`⚠ ${pending.length} appointment${pending.length > 1 ? "s" : ""} awaiting confirmation`}
          action="Review" onAction={() => onTabChange("appointments")} />
      )}

      <StatGrid onTabChange={onTabChange} stats={[
        { label: "Today",         value: todayAppts.length, sub: "appointments",   tab: "appointments",  color: "text-blue-300" },
        { label: "Pending",       value: pending.length,    sub: "need attention", tab: "appointments",  color: "text-amber-300" },
        { label: "This Week",     value: weekCompleted,     sub: "completed",      tab: "clinical",      color: "text-emerald-300" },
        { label: "Notifications", value: unread,            sub: "unread",         tab: "notifications", color: "text-gold-shine" },
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
              📋 Add Treatment Note
            </button>
            <button onClick={() => onTabChange("appointments")}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gold-100/70 hover:bg-gold-500/10 hover:text-gold-200 transition border border-gold-500/15">
              📅 View All Appointments
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
