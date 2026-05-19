import { useState } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useStore } from "../../store/store";
import { DASHBOARD_TABS } from "../../shared/constants";
import { today, plural } from "../../shared/helpers";
import { AppointmentsList } from "../appointment/AppointmentsList";
import { NotificationsCenter, ProfilePage } from "../shared/SharedModules";
import { ClinicalRecords } from "./ClinicalRecords";
import { AnnouncementsPage } from "./AnnouncementsPage";
import { StatGrid, TodaySchedule, AlertBanner, WeeklyMiniCalendar, LatestAnnouncement, QuickActions } from "../../components/ui/DashboardWidgets";

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
  const { user, appointments, notifications } = useStore();
  if (!user) return null;

  const todayStr   = today();
  const todayAppts = appointments.filter((a) => a.date === todayStr && a.status !== "cancelled");
  const pending    = appointments.filter((a) => a.status === "pending");
  const inProgress = appointments.filter((a) => a.status === "in-progress");
  const unread     = notifications.filter((n) => n.userId === user.id && !n.read).length;

  const weekStart = new Date();
  const dow = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() - (dow === 0 ? 6 : dow - 1)); // Monday-based
  const weekCompleted = appointments.filter((a) => a.status === "completed" && a.date >= weekStart.toISOString().slice(0, 10)).length;

  return (
    <div className="space-y-6">
      {inProgress.length > 0 && (
        <AlertBanner tone="blue"
          message={`${plural(inProgress.length, "patient")} currently in progress`}
          action="View" onAction={() => onTabChange("appointments")} />
      )}
      {pending.length > 0 && (
        <AlertBanner
          message={`${plural(pending.length, "appointment")} awaiting confirmation`}
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
              <span className="text-xs text-gold-100/40">{todayStr}</span>
            </div>
            <TodaySchedule appointments={todayAppts} onViewAll={() => onTabChange("appointments")} />
          </div>
        </div>

        <div className="space-y-4">
          <LatestAnnouncement onViewAll={() => onTabChange("announcements")} />
          <QuickActions actions={[
            { label: "Add Treatment Note",    onClick: () => onTabChange("clinical") },
            { label: "View All Appointments", onClick: () => onTabChange("appointments") },
            ...(unread > 0 ? [{ label: `${plural(unread, "unread notification")}`, onClick: () => onTabChange("notifications") }] : []),
          ]} />
        </div>
      </div>
    </div>
  );
}
