import { useState } from "react";
import { Button, Badge } from "../../components/ui";
import { StatGrid, TodaySchedule, AlertBanner, OverviewHeader } from "../../components/ui/DashboardWidgets";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useStore } from "../../store/store";
import { DASHBOARD_TABS } from "../../shared/constants";
import { AppointmentsList } from "../appointment/AppointmentsList";
import { NotificationsCenter, PaymentsPage, ProfilePage } from "../shared/SharedModules";
import { StaffQueue } from "./StaffQueue";
import { StaffRecordsSupport } from "./StaffRecordsSupport";
import { StaffManualBooking } from "./StaffManualBooking";

export function StaffDashboard({ navigate }: { navigate: (p: string) => void }) {
  const { user, staffPermissions } = useStore();
  const [tab, setTab] = useState("overview");
  const [showBooking, setShowBooking] = useState(false);
  if (!user) return null;

  const perms = staffPermissions.find((p) => p.staffId === user.id);
  const tabs = DASHBOARD_TABS.staff.filter((t) => {
    if (t.id === "appointments" && perms && !perms.appointments) return false;
    if (t.id === "payments"     && perms && !perms.payments)     return false;
    if (t.id === "records"      && perms && !perms.records)      return false;
    return true;
  });
  const activeTab = tabs.find((t) => t.id === tab) ? tab : (tabs[0]?.id ?? "overview");

  return (
    <DashboardLayout user={user} tabs={tabs} activeTab={activeTab} onTabChange={setTab} navigate={navigate}
      headerAction={<Button size="sm" onClick={() => setShowBooking(true)}>+ New Appointment</Button>}>
      {activeTab === "overview"      && <StaffOverview onTabChange={setTab} onNewBooking={() => setShowBooking(true)} />}
      {activeTab === "queue"         && <StaffQueue />}
      {activeTab === "appointments"  && <AppointmentsList role="staff" />}
      {activeTab === "payments"      && <PaymentsPage role="staff" />}
      {activeTab === "records"       && <StaffRecordsSupport />}
      {activeTab === "notifications" && <NotificationsCenter />}
      {activeTab === "profile"       && <ProfilePage />}

      {showBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBooking(false)} aria-label="Close" />
          <div className="relative glass-strong rounded-2xl p-6 w-full max-w-xl shadow-luxe max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-xl text-gold-shine mb-1">New Appointment</h3>
            <p className="text-xs text-gold-100/50 mb-5">Walk-in · Facebook · SMS</p>
            <StaffManualBooking onClose={() => setShowBooking(false)} />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function StaffOverview({ onTabChange, onNewBooking }: { onTabChange: (t: string) => void; onNewBooking: () => void }) {
  const { user, appointments } = useStore();
  if (!user) return null;

  const today      = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments.filter((a) => a.date === today && a.status !== "cancelled");
  const pending    = appointments.filter((a) => a.status === "pending");
  const inProgress = appointments.filter((a) => a.status === "in-progress");
  const unpaidDone = appointments.filter((a) => a.status === "completed" && a.paymentStatus === "unpaid");
  const noShows    = appointments.filter((a) => a.status === "no-show" && a.date === today).length;
  const confirmed  = appointments.filter((a) => a.status === "confirmed" && a.date === today);

  // Source breakdown for today
  const sources = todayAppts.reduce<Record<string, number>>((acc, a) => {
    const src = a.source ?? "online";
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <OverviewHeader role="Staff Panel" name={user.name}
        sub={new Date().toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" })}>
        <Button onClick={onNewBooking}>+ New Appointment</Button>
      </OverviewHeader>

      <div className="space-y-2">
        {pending.length > 0 && (
          <AlertBanner message={`⚠ ${pending.length} appointment${pending.length > 1 ? "s" : ""} awaiting confirmation`}
            action="Go to Queue" onAction={() => onTabChange("queue")} />
        )}
        {unpaidDone.length > 0 && (
          <AlertBanner tone="red"
            message={`₱ ${unpaidDone.length} completed appointment${unpaidDone.length > 1 ? "s" : ""} with unpaid balance`}
            action="View Payments" onAction={() => onTabChange("payments")} />
        )}
      </div>

      <StatGrid onTabChange={onTabChange} stats={[
        { label: "Today",       value: todayAppts.length, sub: "appointments", tab: "queue",    color: "text-blue-300" },
        { label: "Pending",     value: pending.length,    sub: "need confirm", tab: "queue",    color: "text-amber-300" },
        { label: "In Progress", value: inProgress.length, sub: "in chair",     tab: "queue",    color: "text-purple-300" },
        { label: "Unpaid",      value: unpaidDone.length, sub: "completed",    tab: "payments", color: "text-red-300" },
      ]} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-gold-shine">Today's Queue</h2>
            <button onClick={() => onTabChange("queue")} className="text-xs text-gold-400/60 hover:text-gold-300 transition">Full queue →</button>
          </div>
          <TodaySchedule appointments={todayAppts} onViewAll={() => onTabChange("queue")} showPayment />
        </div>

        <div className="space-y-4">
          {/* Source breakdown */}
          {todayAppts.length > 0 && (
            <div className="glass rounded-xl p-4 space-y-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold-300/55">Today's Sources</p>
              {Object.entries(sources).map(([src, count]) => (
                <div key={src} className="flex items-center justify-between text-sm">
                  <span className="text-gold-100/60 capitalize">{src}</span>
                  <span className="text-gold-200 font-medium">{count}</span>
                </div>
              ))}
              {noShows > 0 && (
                <div className="flex items-center justify-between text-sm border-t border-gold-500/15 pt-2">
                  <span className="text-red-300/70">No-shows</span>
                  <span className="text-red-300 font-medium">{noShows}</span>
                </div>
              )}
            </div>
          )}

          {confirmed.length > 0 && (
            <div>
              <h2 className="font-serif text-xl text-gold-shine mb-3">Confirmed Today</h2>
              <div className="space-y-2">
                {confirmed.slice(0, 5).map((a) => (
                  <div key={a.id} className="glass rounded-lg px-3 py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gold-100 truncate">{a.patientName}</p>
                      <p className="text-xs text-gold-100/45">{a.time} · {a.serviceName}</p>
                    </div>
                    {a.emergency && <Badge tone="emergency">!</Badge>}
                  </div>
                ))}
                {confirmed.length > 5 && (
                  <button onClick={() => onTabChange("queue")} className="w-full py-1.5 text-xs text-gold-300/50 hover:text-gold-300 transition">
                    +{confirmed.length - 5} more →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
