import { useState, useMemo } from "react";
import { Button, Badge } from "../../components/ui";
import { StatGrid, TodaySchedule, AlertBanner, WeeklyMiniCalendar } from "../../components/ui/DashboardWidgets";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { useStore } from "../../store/store";
import { DASHBOARD_TABS } from "../../shared/constants";
import { today, plural } from "../../shared/helpers";
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
      {activeTab === "overview"      && <StaffOverview onTabChange={setTab} />}
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

function StaffOverview({ onTabChange }: { onTabChange: (t: string) => void }) {
  const { appointments } = useStore();

  const todayStr = today();

  const stats = useMemo(() => {
    let todayCount = 0, pendingCount = 0, unpaidCount = 0, noShows = 0, todayRevenue = 0;
    const todayList: typeof appointments = [];
    const confirmedList: typeof appointments = [];
    const sources: Record<string, number> = {};

    for (const a of appointments) {
      const isToday = a.date === todayStr;

      if (a.status === "pending") pendingCount++;

      if (isToday) {
        if (a.status !== "cancelled") {
          todayCount++;
          todayList.push(a);
          const src = a.source ?? "online";
          sources[src] = (sources[src] || 0) + 1;
        }
        if (a.status === "no-show")   noShows++;
        if (a.status === "confirmed") confirmedList.push(a);
        if (a.paymentStatus === "paid") todayRevenue += a.price;
      }

      if (a.status === "completed" && a.paymentStatus === "unpaid") unpaidCount++;
    }

    return { todayCount, pendingCount, unpaidCount, noShows, todayRevenue, todayList, confirmedList, sources };
  }, [appointments, todayStr]);

  const { todayCount, pendingCount, unpaidCount, noShows, todayRevenue, todayList, confirmedList, sources } = stats;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {pendingCount > 0 && (
          <AlertBanner message={`${plural(pendingCount, "appointment")} awaiting confirmation`}
            action="Go to Queue" onAction={() => onTabChange("queue")} />
        )}
        {unpaidCount > 0 && (
          <AlertBanner tone="red"
            message={`${plural(unpaidCount, "completed appointment")} with unpaid balance`}
            action="View Payments" onAction={() => onTabChange("payments")} />
        )}
      </div>

      <StatGrid onTabChange={onTabChange} stats={[
        { label: "Today",         value: todayCount,                          sub: "appointments", tab: "queue",    color: "text-blue-300" },
        { label: "Pending",       value: pendingCount,                        sub: "need confirm", tab: "queue",    color: "text-amber-300" },
        { label: "Today Revenue", value: `₱${todayRevenue.toLocaleString()}`, sub: "collected",    tab: "payments", color: "text-emerald-300" },
        { label: "Unpaid",        value: unpaidCount,                         sub: "completed",    tab: "payments", color: "text-red-300" },
      ]} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <WeeklyMiniCalendar appointments={appointments} onTabChange={onTabChange} />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-gold-shine">Today's Queue</h2>
              <button onClick={() => onTabChange("queue")} className="text-xs text-gold-400/60 hover:text-gold-300 transition">Full queue →</button>
            </div>
            <TodaySchedule appointments={todayList} onViewAll={() => onTabChange("queue")} showPayment />
          </div>
        </div>

        <div className="space-y-4">
          {todayList.length > 0 && (
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

          {confirmedList.length > 0 && (
            <div>
              <h2 className="font-serif text-xl text-gold-shine mb-3">Confirmed Today</h2>
              <div className="space-y-2">
                {confirmedList.slice(0, 5).map((a) => (
                  <div key={a.id} className="glass rounded-lg px-3 py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gold-100 truncate">{a.patientName}</p>
                      <p className="text-xs text-gold-100/45">{a.time} · {a.serviceName}</p>
                    </div>
                    {a.emergency && <Badge tone="emergency">!</Badge>}
                  </div>
                ))}
                {confirmedList.length > 5 && (
                  <button onClick={() => onTabChange("queue")} className="w-full py-1.5 text-xs text-gold-300/50 hover:text-gold-300 transition">
                    +{confirmedList.length - 5} more →
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
