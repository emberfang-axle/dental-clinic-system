import { Card, StatCard } from "../../components/ui";
import { useStore } from "../../store/store";
import { BOOKING } from "../../shared/constants";
import type { Appointment, Service, FeedbackEntry } from "../../shared/types";

export function ReportsPage() {
  const { appointments, services, feedbacks } = useStore() as {
    appointments: Appointment[]; services: Service[]; feedbacks: FeedbackEntry[]; users: any[];
  };

  const paid = appointments.filter((a) => a.paymentStatus === "paid");
  const completed = appointments.filter((a) => a.status === "completed");
  const pending = appointments.filter((a) => a.status === "pending");
  const cancelled = appointments.filter((a) => a.status === "cancelled");
  const noShow = appointments.filter((a) => a.status === "no-show");
  const revenue = paid.reduce((sum, a) => sum + a.price, 0);
  const pendingRevenue = appointments.filter((a) => a.status !== "cancelled" && a.paymentStatus !== "paid").reduce((sum, a) => sum + a.price, 0);
  const avgRating = feedbacks.length ? (feedbacks.reduce((s, f) => s + f.stars, 0) / feedbacks.length).toFixed(1) : "—";
  const completionRate = appointments.length ? Math.round((completed.length / appointments.length) * 100) : 0;

  const byService = services.map((s) => ({
    name: s.name,
    count: appointments.filter((a) => a.serviceId === s.id).length,
    revenue: paid.filter((a) => a.serviceId === s.id).reduce((sum, a) => sum + a.price, 0),
  })).filter((s) => s.count > 0).sort((a, b) => b.revenue - a.revenue);
  const maxCount = Math.max(1, ...byService.map((b) => b.count));

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = d.toISOString().slice(0, 7);
    const rev = paid.filter((a) => a.date.startsWith(key)).reduce((sum, a) => sum + a.price, 0);
    return { label: d.toLocaleString("default", { month: "short" }), rev };
  });
  const maxRev = Math.max(1, ...months.map((m) => m.rev));

  const gcashCount = paid.filter((a) => a.paymentMethod === "gcash").length;
  const cashCount  = paid.filter((a) => a.paymentMethod === "cash").length;

  const patientMap: Record<string, { name: string; count: number; spent: number }> = {};
  appointments.forEach((a) => {
    if (!patientMap[a.patientId]) patientMap[a.patientId] = { name: a.patientName, count: 0, spent: 0 };
    patientMap[a.patientId].count++;
    if (a.paymentStatus === "paid") patientMap[a.patientId].spent += a.price;
  });
  const topPatients = Object.values(patientMap).sort((a, b) => b.count - a.count).slice(0, 5);

  // Missed slots
  const missedBySlot: Record<string, number> = {};
  appointments.filter((a) => a.status === "no-show" || a.status === "cancelled").forEach((a) => {
    missedBySlot[a.time] = (missedBySlot[a.time] || 0) + 1;
  });
  const missedSlots = BOOKING.TIME_SLOTS.map((t) => ({ time: t, missed: missedBySlot[t] || 0 })).sort((a, b) => b.missed - a.missed);
  const maxMissed = Math.max(1, ...missedSlots.map((s) => s.missed));

  // Staff workload
  const staffWorkload: Record<string, { name: string; confirmed: number; completed: number; noShow: number }> = {};
  appointments.forEach((a) => {
    if (!staffWorkload[a.doctor]) staffWorkload[a.doctor] = { name: a.doctor, confirmed: 0, completed: 0, noShow: 0 };
    if (a.status === "confirmed" || a.status === "in-progress") staffWorkload[a.doctor].confirmed++;
    if (a.status === "completed") staffWorkload[a.doctor].completed++;
    if (a.status === "no-show") staffWorkload[a.doctor].noShow++;
  });
  const workloadList = Object.values(staffWorkload).sort((a, b) => (b.confirmed + b.completed) - (a.confirmed + a.completed));

  // Patient retention
  const visitCounts = Object.values(patientMap);
  const returning = visitCounts.filter((p) => p.count >= 2).length;
  const retentionRate = visitCounts.length > 0 ? Math.round((returning / visitCounts.length) * 100) : 0;
  const newPatients = visitCounts.filter((p) => p.count === 1).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon="💰" label="Total Revenue"      value={`₱${revenue.toLocaleString()}`}  sub={`₱${pendingRevenue.toLocaleString()} pending`} />
        <StatCard icon="📋" label="Total Appointments" value={appointments.length.toString()}   sub={`${pending.length} pending · ${noShow.length} no-show`} />
        <StatCard icon="✅" label="Completion Rate"    value={`${completionRate}%`}             sub={`${completed.length} completed · ${cancelled.length} cancelled`} />
        <StatCard icon="⭐" label="Avg Rating"         value={avgRating}                        sub={`${feedbacks.length} review${feedbacks.length !== 1 ? "s" : ""}`} />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="!p-5 text-center">
          <div className="text-3xl font-serif text-gold-gradient">{retentionRate}%</div>
          <div className="text-xs uppercase tracking-wider text-gold-100/50 mt-1">Patient Retention</div>
          <div className="text-[11px] text-gold-100/40 mt-1">{returning} returning patients</div>
        </Card>
        <Card className="!p-5 text-center">
          <div className="text-3xl font-serif text-gold-gradient">{newPatients}</div>
          <div className="text-xs uppercase tracking-wider text-gold-100/50 mt-1">New Patients</div>
          <div className="text-[11px] text-gold-100/40 mt-1">First visit only</div>
        </Card>
        <Card className="!p-5 text-center">
          <div className="text-3xl font-serif text-gold-gradient">{noShow.length}</div>
          <div className="text-xs uppercase tracking-wider text-gold-100/50 mt-1">No-Shows</div>
          <div className="text-[11px] text-gold-100/40 mt-1">{appointments.length > 0 ? Math.round((noShow.length / appointments.length) * 100) : 0}% of total</div>
        </Card>
      </div>

      <Card>
        <h3 className="font-serif text-xl text-gold-gradient mb-5">Monthly Revenue (Last 6 Months)</h3>
        <div className="flex items-end gap-3 h-32">
          {months.map((m) => (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] text-gold-300/60 font-mono">{m.rev > 0 ? `₱${(m.rev / 1000).toFixed(0)}k` : ""}</span>
              <div className="w-full rounded-t-md bg-gold-gradient/80" style={{ height: `${(m.rev / maxRev) * 96}px`, minHeight: m.rev > 0 ? "4px" : "0" }} />
              <span className="text-[10px] text-gold-100/50">{m.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid xl:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-serif text-xl text-gold-gradient mb-4">Most Profitable Services</h3>
          {byService.length === 0 && <p className="text-sm text-gold-100/50">No bookings yet.</p>}
          <div className="space-y-3">
            {byService.map((b) => (
              <div key={b.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gold-100/80 truncate max-w-[60%]">{b.name}</span>
                  <span className="text-gold-300 font-mono text-xs">{b.count} · ₱{b.revenue.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-ink-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gold-gradient" style={{ width: `${(b.count / maxCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-serif text-xl text-gold-gradient mb-4">Most Missed Time Slots</h3>
          <p className="text-xs text-gold-100/40 mb-4">Slots with highest no-show + cancellation rate</p>
          <div className="space-y-2">
            {missedSlots.map((s) => (
              <div key={s.time}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gold-100/70 font-mono">{s.time}</span>
                  <span className="text-gold-300/70 text-xs">{s.missed} missed</span>
                </div>
                <div className="h-1.5 bg-ink-700 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500/60" style={{ width: `${(s.missed / maxMissed) * 100}%` }} />
                </div>
              </div>
            ))}
            {missedSlots.every((s) => s.missed === 0) && <p className="text-sm text-gold-100/50">No missed slots recorded yet.</p>}
          </div>
        </Card>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-serif text-xl text-gold-gradient mb-4">Staff Workload</h3>
          {workloadList.length === 0 && <p className="text-sm text-gold-100/50">No data yet.</p>}
          <div className="space-y-3">
            {workloadList.map((w) => (
              <div key={w.name} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-gold-100/80 truncate">{w.name}</span>
                <div className="flex gap-3 text-xs font-mono shrink-0">
                  <span className="text-blue-300">{w.confirmed} active</span>
                  <span className="text-emerald-300">{w.completed} done</span>
                  <span className="text-red-300/70">{w.noShow} no-show</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-serif text-xl text-gold-gradient mb-4">Payment Breakdown</h3>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="p-4 rounded-xl border border-gold-500/20 text-center">
              <div className="text-xs uppercase tracking-wider text-gold-300/60 mb-1">GCash</div>
              <div className="text-2xl font-serif text-gold-gradient">{gcashCount}</div>
              <div className="text-xs text-gold-100/50 mt-1">transactions</div>
            </div>
            <div className="p-4 rounded-xl border border-gold-500/20 text-center">
              <div className="text-xs uppercase tracking-wider text-gold-300/60 mb-1">Cash</div>
              <div className="text-2xl font-serif text-gold-gradient">{cashCount}</div>
              <div className="text-xs text-gold-100/50 mt-1">transactions</div>
            </div>
          </div>
          <h4 className="text-sm font-medium text-gold-100/70 mb-3">Top Patients</h4>
          <div className="space-y-2">
            {topPatients.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between text-sm">
                <span className="text-gold-100/70"><span className="text-gold-400 font-mono mr-2">#{i + 1}</span>{p.name}</span>
                <span className="text-gold-300 font-mono text-xs">{p.count} visits · ₱{p.spent.toLocaleString()}</span>
              </div>
            ))}
            {topPatients.length === 0 && <p className="text-sm text-gold-100/50">No patient data yet.</p>}
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="font-serif text-xl text-gold-gradient mb-4">Recent Patient Feedback</h3>
        {feedbacks.length === 0 && <p className="text-sm text-gold-100/50">No feedback submitted yet.</p>}
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {[...feedbacks].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6).map((f) => (
            <div key={f.id} className="rounded-xl border border-gold-500/15 bg-ink-900/55 p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-medium text-gold-100 text-sm truncate">{f.userName}</span>
                <span className="text-gold-400 text-sm shrink-0">{"★".repeat(f.stars)}<span className="text-gold-100/20">{"★".repeat(5 - f.stars)}</span></span>
              </div>
              <p className="text-xs text-gold-100/60 leading-relaxed line-clamp-3">{f.text}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}