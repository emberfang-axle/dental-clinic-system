import { Badge, Button, Card, EmptyState } from "../../components/ui";
import { StatGrid, AlertBanner } from "../../components/ui/DashboardWidgets";
import { useStore } from "../../store/store";
import { ROUTES } from "../../shared/constants";

export function PatientHome({
  navigate,
  onTabChange,
}: {
  navigate: (p: string) => void;
  onTabChange: (t: string) => void;
}) {
  const { user, appointments, notifications } = useStore();
  if (!user) return null;

  const today    = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const mine     = appointments.filter((a) => a.patientId === user.id);

  const upcoming = [...mine]
    .filter((a) => a.date >= today && a.status !== "cancelled")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];

  const unpaid = mine.filter((a) => a.status === "completed" && a.paymentStatus === "unpaid");
  const unread = notifications.filter((n) => n.userId === user.id && !n.read).length;

  const isToday    = upcoming?.date === today;
  const isTomorrow = upcoming?.date === tomorrow;

  const completed    = mine.filter((a) => a.status === "completed");
  const recentSorted = [...mine]
    .sort((a, b) => (b.createdAt ?? b.date + b.time).localeCompare(a.createdAt ?? a.date + a.time))
    .slice(0, 5);

  const serviceCount: Record<string, number> = {};
  mine.forEach((a) => { serviceCount[a.serviceName] = (serviceCount[a.serviceName] || 0) + 1; });
  const topService = Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0];

  // Show feedback prompt if last completed appointment has no feedback yet
  const lastCompleted = completed.sort((a, b) => b.date.localeCompare(a.date))[0];
  const { feedbacks } = useStore();
  const hasGivenFeedback = feedbacks.some((f) => f.userId === user.id);
  const showFeedbackPrompt = lastCompleted && !hasGivenFeedback;

  return (
    <div className="space-y-6">

      {/* ── Alerts ── */}
      {upcoming && (
        <div className={`rounded-xl border p-4 flex flex-wrap items-center justify-between gap-3 ${
          isToday    ? "border-red-500/40 bg-red-500/10" :
          isTomorrow ? "border-yellow-500/40 bg-yellow-500/10" :
                       "border-gold-500/30 bg-gold-500/8"
        }`}>
          <div>
            <p className={`text-sm font-semibold ${isToday ? "text-red-300" : isTomorrow ? "text-yellow-300" : "text-gold-200"}`}>
              {isToday ? "🦷 Appointment Today!" : isTomorrow ? "📅 Appointment Tomorrow" : "📅 Next Appointment"}
            </p>
            <p className="text-xs text-gold-100/60 mt-1">
              <span className="font-medium text-gold-200">{upcoming.serviceName}</span>
              {" · "}{upcoming.date} at {upcoming.time} · {upcoming.doctor}
            </p>
            {(isToday || isTomorrow) && (
              <p className="text-xs text-gold-100/40 mt-0.5">Please arrive 10 minutes early.</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone={upcoming.status as any}>{upcoming.status}</Badge>
            {(upcoming.status === "pending" || upcoming.status === "confirmed") && !upcoming.rescheduledAt && (
              <Button size="sm" variant="outline" onClick={() => onTabChange("my-appointments")}>Reschedule</Button>
            )}
            {(upcoming.status === "pending" || upcoming.status === "confirmed") && (
              <Button size="sm" variant="danger" onClick={() => onTabChange("my-appointments")}>Cancel</Button>
            )}
          </div>
        </div>
      )}

      {unpaid.length > 0 && (
        <AlertBanner
          message={`₱ ${unpaid.length} completed appointment${unpaid.length > 1 ? "s" : ""} with outstanding payment`}
          action="Go to Payments"
          onAction={() => onTabChange("payments")}
          tone="amber"
        />
      )}

      {showFeedbackPrompt && (
        <div className="rounded-xl border border-gold-500/30 bg-gold-500/8 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gold-200">How was your visit?</p>
            <p className="text-xs text-gold-100/55 mt-0.5">Share your experience to help us improve our service.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => onTabChange("feedback")}>Leave Feedback ⭐</Button>
        </div>
      )}

      {/* ── Stats ── */}
      <StatGrid onTabChange={onTabChange} stats={[
        { label: "Total Visits",    value: mine.filter((a) => a.status !== "cancelled").length, sub: "all time",        tab: "my-appointments",   color: "text-gold-shine" },
        { label: "Completed",       value: completed.length,                                    sub: "treatments done", tab: "treatment-records", color: "text-emerald-300" },
        { label: "Pending Payment", value: unpaid.length,                                       sub: "needs attention", tab: "payments",          color: "text-amber-300" },
        { label: "Notifications",   value: unread,                                              sub: "unread",          tab: "notifications",     color: "text-blue-300" },
      ]} />

      {/* ── Main content ── */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-gold-shine">Recent Appointments</h2>
            <button onClick={() => onTabChange("my-appointments")} className="text-xs text-gold-400/60 hover:text-gold-300 transition">View all →</button>
          </div>
          {mine.length === 0 ? (
            <Card>
              <EmptyState icon="📅" title="No appointments yet" subtitle="Book your first appointment to get started." />
              <div className="flex justify-center mt-4">
                <Button onClick={() => navigate(ROUTES.book)}>Book Appointment</Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentSorted.map((a) => (
                <div key={a.id} className="glass rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gold-100 text-sm truncate">{a.serviceName}</p>
                    <p className="text-xs text-gold-100/45">{a.date} · {a.time} · {a.doctor}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge tone={a.status as any}>{a.status}</Badge>
                    <Badge tone={a.paymentStatus === "paid" ? "paid" : a.paymentStatus === "partial_paid" ? "pending" : "neutral"}>
                      {a.paymentStatus === "paid" ? "Paid" : a.paymentStatus === "partial_paid" ? "Partial" : "Unpaid"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {mine.length > 0 && (
            <div className="glass rounded-xl p-4 space-y-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold-300/55">Your Summary</p>
              <div className="space-y-2">
                {topService && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gold-100/60">Most visited</span>
                    <span className="text-gold-200 font-medium truncate max-w-[140px]">{topService[0]}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gold-100/60">Last visit</span>
                  <span className="text-gold-200 font-medium">{recentSorted[0]?.date ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gold-100/60">Next visit</span>
                  <span className="text-gold-200 font-medium">{upcoming?.date ?? "Not scheduled"}</span>
                </div>
                {unpaid.length > 0 && (
                  <div className="flex items-center justify-between text-sm border-t border-gold-500/15 pt-2">
                    <span className="text-amber-300/80">Outstanding</span>
                    <button onClick={() => onTabChange("payments")} className="text-amber-300 font-medium hover:text-amber-200 transition">
                      {unpaid.length} unpaid →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <button onClick={() => onTabChange("treatment-records")}
              className="w-full py-2.5 rounded-xl border border-gold-500/20 text-sm text-gold-300/70 hover:bg-gold-500/10 hover:text-gold-200 hover:border-gold-400/40 transition">
              📋 View Treatment Records
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
