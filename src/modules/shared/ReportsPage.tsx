import { useMemo, useState } from "react";
import { Card, StatCard } from "../../components/ui";
import { useStore } from "../../store/store";
import { BOOKING } from "../../shared/constants";
import type { Appointment, FeedbackEntry, Service } from "../../shared/types";

// ── helpers ──────────────────────────────────────────────────────────────────

function exportCSV(rows: Record<string, string | number>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(",")),
  ].join("\n");
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })),
    download: filename,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── sub-components ────────────────────────────────────────────────────────────

function Bar({ pct, color = "bg-gold-gradient" }: { pct: number; color?: string }) {
  return (
    <div className="h-2 bg-ink-700 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** SVG donut showing appointment status breakdown */
function StatusDonut({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <p className="text-sm text-gold-100/50 py-4 text-center">No data yet.</p>;

  let offset = 0;
  const R = 40, C = 2 * Math.PI * R;
  const slices = data.map((d) => {
    const pct = d.value / total;
    const dash = pct * C;
    const slice = { ...d, dash, offset };
    offset += dash;
    return slice;
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 100 100" className="w-32 h-32 shrink-0 -rotate-90">
        {slices.map((s) => (
          <circle key={s.label} cx="50" cy="50" r={R} fill="none"
            stroke={s.color} strokeWidth="18"
            strokeDasharray={`${s.dash} ${C - s.dash}`}
            strokeDashoffset={-s.offset}
          />
        ))}
      </svg>
      <div className="space-y-2 w-full">
        {data.map((d) => (
          <div key={d.label} className="flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
              <span className="text-gold-100/70 capitalize">{d.label}</span>
            </div>
            <span className="font-mono text-gold-300">{d.value} ({total ? Math.round((d.value / total) * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Bar chart for monthly revenue */
function RevenueChart({ months }: { months: { label: string; rev: number }[] }) {
  const max = Math.max(1, ...months.map((m) => m.rev));
  return (
    <div className="flex items-end gap-2 h-36 pt-4">
      {months.map((m) => {
        const h = Math.max(m.rev > 0 ? 4 : 0, (m.rev / max) * 112);
        return (
          <div key={m.label} className="flex-1 flex flex-col items-center gap-1 group">
            <span className="text-[9px] text-gold-300/60 font-mono opacity-0 group-hover:opacity-100 transition">
              {m.rev > 0 ? `₱${(m.rev / 1000).toFixed(1)}k` : ""}
            </span>
            <div className="w-full relative">
              <div className="w-full rounded-t-md bg-gold-gradient/80 transition-all" style={{ height: h }} />
              {/* always-visible label above bar */}
              <span className="absolute -top-5 left-0 right-0 text-center text-[9px] text-gold-300/50 font-mono">
                {m.rev > 0 ? `₱${(m.rev / 1000).toFixed(0)}k` : ""}
              </span>
            </div>
            <span className="text-[10px] text-gold-100/50">{m.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Heatmap of bookings by day-of-week */
function DayHeatmap({ appointments }: { appointments: Appointment[] }) {
  const counts = Array(7).fill(0);
  appointments.forEach((a) => {
    const d = new Date(a.date + "T00:00:00").getDay();
    counts[d]++;
  });
  const max = Math.max(1, ...counts);
  return (
    <div className="flex gap-2">
      {DAYS.map((day, i) => {
        const pct = counts[i] / max;
        const opacity = pct === 0 ? "opacity-10" : pct < 0.33 ? "opacity-30" : pct < 0.66 ? "opacity-60" : "opacity-100";
        return (
          <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
            <div className={`w-full aspect-square rounded-lg bg-gold-gradient ${opacity}`} />
            <span className="text-[9px] text-gold-100/50">{day}</span>
            <span className="text-[9px] text-gold-300/60 font-mono">{counts[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const { appointments: all, services, feedbacks } = useStore() as {
    appointments: Appointment[]; services: Service[]; feedbacks: FeedbackEntry[];
  };

  const [filterMonth, setFilterMonth] = useState("");

  const appointments = filterMonth ? all.filter((a) => a.date.startsWith(filterMonth)) : all;

  const monthOptions = useMemo(
    () => Array.from(new Set(all.map((a) => a.date.slice(0, 7)))).sort().reverse(),
    [all]
  );

  // ── core metrics ──
  const paid       = appointments.filter((a) => a.paymentStatus === "paid");
  const completed  = appointments.filter((a) => a.status === "completed");
  const pending    = appointments.filter((a) => a.status === "pending");
  const cancelled  = appointments.filter((a) => a.status === "cancelled");
  const noShow     = appointments.filter((a) => a.status === "no-show");
  const inProgress = appointments.filter((a) => a.status === "in-progress");
  const confirmed  = appointments.filter((a) => a.status === "confirmed");

  const revenue        = paid.reduce((s, a) => s + a.price, 0);
  const pendingRevenue = appointments.filter((a) => a.status !== "cancelled" && a.paymentStatus !== "paid").reduce((s, a) => s + a.price, 0);
  const avgRating      = feedbacks.length ? (feedbacks.reduce((s, f) => s + f.stars, 0) / feedbacks.length).toFixed(1) : "—";
  const completionRate = appointments.length ? Math.round((completed.length / appointments.length) * 100) : 0;
  const avgRevenuePerAppt = completed.length ? Math.round(revenue / Math.max(paid.length, 1)) : 0;

  // ── monthly revenue (last 6 months, always uses all data) ──
  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = d.toISOString().slice(0, 7);
      const rev = all.filter((a) => a.paymentStatus === "paid" && a.date.startsWith(key)).reduce((s, a) => s + a.price, 0);
      return { label: d.toLocaleString("default", { month: "short" }), rev };
    });
  }, [all]);

  // ── status donut ──
  const statusData = [
    { label: "completed",  value: completed.length,  color: "#34d399" },
    { label: "confirmed",  value: confirmed.length,  color: "#60a5fa" },
    { label: "pending",    value: pending.length,    color: "#fbbf24" },
    { label: "in-progress",value: inProgress.length, color: "#a78bfa" },
    { label: "no-show",    value: noShow.length,     color: "#f87171" },
    { label: "cancelled",  value: cancelled.length,  color: "#6b7280" },
  ].filter((d) => d.value > 0);

  // ── services ──
  const byService = useMemo(() => services.map((s) => ({
    name: s.name,
    count: appointments.filter((a) => a.serviceId === s.id).length,
    revenue: paid.filter((a) => a.serviceId === s.id).reduce((s, a) => s + a.price, 0),
  })).filter((s) => s.count > 0).sort((a, b) => b.revenue - a.revenue), [appointments, paid, services]);
  const maxServiceCount = Math.max(1, ...byService.map((b) => b.count));

  // ── missed slots ──
  const missedSlots = useMemo(() => {
    const map: Record<string, number> = {};
    appointments.filter((a) => a.status === "no-show" || a.status === "cancelled").forEach((a) => {
      map[a.time] = (map[a.time] || 0) + 1;
    });
    return BOOKING.TIME_SLOTS.map((t) => ({ time: t, missed: map[t] || 0 })).sort((a, b) => b.missed - a.missed);
  }, [appointments]);
  const maxMissed = Math.max(1, ...missedSlots.map((s) => s.missed));

  // ── doctor workload ──
  const workloadList = useMemo(() => {
    const map: Record<string, { name: string; confirmed: number; completed: number; noShow: number; revenue: number }> = {};
    appointments.forEach((a) => {
      if (!map[a.doctor]) map[a.doctor] = { name: a.doctor, confirmed: 0, completed: 0, noShow: 0, revenue: 0 };
      if (a.status === "confirmed" || a.status === "in-progress") map[a.doctor].confirmed++;
      if (a.status === "completed") map[a.doctor].completed++;
      if (a.status === "no-show") map[a.doctor].noShow++;
      if (a.paymentStatus === "paid") map[a.doctor].revenue += a.price;
    });
    return Object.values(map).sort((a, b) => b.completed - a.completed);
  }, [appointments]);

  // ── patients ──
  const patientMap = useMemo(() => {
    const map: Record<string, { name: string; count: number; spent: number; billed: number }> = {};
    appointments.forEach((a) => {
      if (!map[a.patientId]) map[a.patientId] = { name: a.patientName, count: 0, spent: 0, billed: 0 };
      map[a.patientId].count++;
      if (a.paymentStatus === "paid") map[a.patientId].spent += a.price;
      if (a.status !== "cancelled") map[a.patientId].billed += a.price;
    });
    return map;
  }, [appointments]);

  const visitCounts  = Object.values(patientMap);
  const returning    = visitCounts.filter((p) => p.count >= 2).length;
  const retentionRate = visitCounts.length ? Math.round((returning / visitCounts.length) * 100) : 0;
  const topPatients  = [...visitCounts].sort((a, b) => b.billed - a.billed || b.count - a.count).slice(0, 5);

  // ── payment ──
  const gcashCount = paid.filter((a) => a.paymentMethod === "gcash").length;
  const cashCount  = paid.filter((a) => a.paymentMethod === "cash").length;
  const gcashRev   = paid.filter((a) => a.paymentMethod === "gcash").reduce((s, a) => s + a.price, 0);
  const cashRev    = paid.filter((a) => a.paymentMethod === "cash").reduce((s, a) => s + a.price, 0);

  return (
    <div className="space-y-6">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Analytics & Reports</p>
        <div className="flex flex-wrap items-center gap-2">
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-gold-500/30 bg-ink-900 text-gold-200 focus:outline-none focus:border-gold-400">
            <option value="">All Time</option>
            {monthOptions.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <button onClick={() => exportCSV(appointments.map((a) => ({
            Date: a.date, Time: a.time, Patient: a.patientName, Service: a.serviceName,
            Doctor: a.doctor, Status: a.status, Payment: a.paymentStatus,
            Method: a.paymentMethod, Amount: a.price, Reference: a.gcashRef || "",
          })), `appointments-${new Date().toISOString().slice(0, 10)}.csv`)}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gold-500/30 text-gold-300 hover:bg-gold-500/10 transition">
            ↓ Appointments
          </button>
          <button onClick={() => exportCSV(paid.map((a) => ({
            Date: a.date, Patient: a.patientName, Service: a.serviceName,
            Method: a.paymentMethod, Reference: a.gcashRef || "", Amount: a.price, Receipt: a.receiptNumber || "",
          })), `revenue-${new Date().toISOString().slice(0, 10)}.csv`)}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gold-500/30 text-gold-300 hover:bg-gold-500/10 transition">
            ↓ Revenue
          </button>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon="₱" label="Total Revenue"      value={`₱${revenue.toLocaleString()}`}       sub={`₱${pendingRevenue.toLocaleString()} pending`} />
        <StatCard icon="#" label="Appointments"        value={appointments.length.toString()}        sub={`${pending.length} pending · ${noShow.length} no-show`} />
        <StatCard icon="%" label="Completion Rate"     value={`${completionRate}%`}                  sub={`${completed.length} done · ${cancelled.length} cancelled`} />
        <StatCard icon="★" label="Avg Rating"          value={avgRating}                             sub={`${feedbacks.length} review${feedbacks.length !== 1 ? "s" : ""}`} />
      </div>

      {/* ── Secondary KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Retention",      value: `${retentionRate}%`, sub: `${returning} returning` },
          { label: "New Patients",   value: visitCounts.filter((p) => p.count === 1).length, sub: "first visit" },
          { label: "Avg per Visit",  value: `₱${avgRevenuePerAppt.toLocaleString()}`, sub: "paid appointments" },
          { label: "No-Show Rate",   value: `${appointments.length ? Math.round((noShow.length / appointments.length) * 100) : 0}%`, sub: `${noShow.length} total` },
        ].map((k) => (
          <div key={k.label} className="glass-strong rounded-xl p-4 text-center">
            <div className="font-serif text-2xl text-gold-shine">{k.value}</div>
            <div className="text-[10px] uppercase tracking-wider text-gold-100/50 mt-1">{k.label}</div>
            <div className="text-[10px] text-gold-100/35 mt-0.5">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Revenue chart + Status donut ── */}
      <div className="grid xl:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-serif text-xl text-gold-gradient mb-1">Monthly Revenue</h3>
          <p className="text-xs text-gold-100/40 mb-4">Last 6 months · paid appointments only</p>
          <RevenueChart months={months} />
        </Card>

        <Card>
          <h3 className="font-serif text-xl text-gold-gradient mb-1">Appointment Status</h3>
          <p className="text-xs text-gold-100/40 mb-4">Breakdown of all {appointments.length} appointments</p>
          <StatusDonut data={statusData} />
        </Card>
      </div>

      {/* ── Day heatmap ── */}
      <Card>
        <h3 className="font-serif text-xl text-gold-gradient mb-1">Busiest Days of the Week</h3>
        <p className="text-xs text-gold-100/40 mb-5">Total bookings per day — darker = more appointments</p>
        <DayHeatmap appointments={appointments} />
      </Card>

      {/* ── Services + Missed slots ── */}
      <div className="grid xl:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-serif text-xl text-gold-gradient mb-4">Top Services by Revenue</h3>
          {byService.length === 0 && <p className="text-sm text-gold-100/50">No bookings yet.</p>}
          <div className="space-y-3">
            {byService.slice(0, 8).map((b) => (
              <div key={b.name}>
                <div className="flex items-center justify-between text-xs mb-1 gap-2">
                  <span className="text-gold-100/80 truncate">{b.name}</span>
                  <span className="text-gold-300 font-mono shrink-0">{b.count}× · ₱{b.revenue.toLocaleString()}</span>
                </div>
                <Bar pct={(b.count / maxServiceCount) * 100} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="font-serif text-xl text-gold-gradient mb-1">Most Missed Time Slots</h3>
          <p className="text-xs text-gold-100/40 mb-4">No-shows + cancellations per slot</p>
          <div className="space-y-2">
            {missedSlots.every((s) => s.missed === 0)
              ? <p className="text-sm text-gold-100/50">No missed slots recorded yet.</p>
              : missedSlots.map((s) => (
                <div key={s.time}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gold-100/70 font-mono">{s.time}</span>
                    <span className="text-gold-300/70">{s.missed} missed</span>
                  </div>
                  <Bar pct={(s.missed / maxMissed) * 100} color="bg-red-500/60" />
                </div>
              ))
            }
          </div>
        </Card>
      </div>

      {/* ── Doctor workload ── */}
      <Card>
        <h3 className="font-serif text-xl text-gold-gradient mb-4">Doctor Performance</h3>
        {workloadList.length === 0
          ? <p className="text-sm text-gold-100/50">No data yet.</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-gold-200/60 border-b border-gold-500/15">
                    <th className="pb-2">Doctor</th>
                    <th className="pb-2 text-blue-300">Active</th>
                    <th className="pb-2 text-emerald-300">Completed</th>
                    <th className="pb-2 text-red-300/70">No-Show</th>
                    <th className="pb-2 text-right text-gold-300">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {workloadList.map((w) => (
                    <tr key={w.name} className="border-b border-gold-500/10 hover:bg-gold-500/5 transition">
                      <td className="py-2.5 text-gold-100/80 truncate max-w-[160px]">{w.name}</td>
                      <td className="py-2.5 text-blue-300 font-mono">{w.confirmed}</td>
                      <td className="py-2.5 text-emerald-300 font-mono">{w.completed}</td>
                      <td className="py-2.5 text-red-300/70 font-mono">{w.noShow}</td>
                      <td className="py-2.5 text-right text-gold-300 font-mono">₱{w.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </Card>

      {/* ── Payment breakdown + Top patients ── */}
      <div className="grid xl:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-serif text-xl text-gold-gradient mb-4">Payment Breakdown</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: "GCash", count: gcashCount, rev: gcashRev, color: "text-blue-300" },
              { label: "Cash",  count: cashCount,  rev: cashRev,  color: "text-emerald-300" },
            ].map((p) => (
              <div key={p.label} className="rounded-xl border border-gold-500/20 p-4 text-center">
                <div className={`text-xs uppercase tracking-wider mb-1 ${p.color}`}>{p.label}</div>
                <div className="text-2xl font-serif text-gold-gradient">{p.count}</div>
                <div className="text-xs text-gold-100/50 mt-1">₱{p.rev.toLocaleString()}</div>
              </div>
            ))}
          </div>
          {/* GCash vs Cash bar */}
          {(gcashCount + cashCount) > 0 && (
            <div>
              <div className="flex justify-between text-[10px] text-gold-100/40 mb-1">
                <span>GCash {Math.round((gcashCount / (gcashCount + cashCount)) * 100)}%</span>
                <span>Cash {Math.round((cashCount / (gcashCount + cashCount)) * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-ink-700 overflow-hidden flex">
                <div className="h-full bg-blue-500/70" style={{ width: `${(gcashCount / (gcashCount + cashCount)) * 100}%` }} />
                <div className="h-full bg-emerald-500/70 flex-1" />
              </div>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="font-serif text-xl text-gold-gradient mb-4">Top Patients by Visits</h3>
          {topPatients.length === 0
            ? <p className="text-sm text-gold-100/50">No patient data yet.</p>
            : (
              <div className="space-y-2">
                {topPatients.map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between text-sm gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-gold-400/60 font-mono text-xs shrink-0">#{i + 1}</span>
                      <span className="text-gold-100/75 truncate">{p.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-gold-300 font-mono text-xs">{p.count} visit{p.count !== 1 ? "s" : ""} · ₱{p.billed.toLocaleString()}</div>
                      {p.spent < p.billed && (
                        <div className="text-[10px] text-amber-400/70">₱{(p.billed - p.spent).toLocaleString()} unpaid</div>
                      )}
                      {p.spent === p.billed && p.billed > 0 && (
                        <div className="text-[10px] text-emerald-400/70">fully paid</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </Card>
      </div>

      {/* ── Feedback ── */}
      {feedbacks.length > 0 && (
        <Card>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="font-serif text-xl text-gold-gradient">Recent Feedback</h3>
            <div className="text-right">
              <span className="font-serif text-2xl text-gold-shine">{avgRating}</span>
              <span className="text-xs text-gold-100/40 ml-1">/ 5</span>
            </div>
          </div>
          {/* Star distribution */}
          <div className="space-y-1 mb-5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = feedbacks.filter((f) => f.stars === star).length;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="text-gold-400 w-3">{star}★</span>
                  <div className="flex-1 h-1.5 bg-ink-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gold-gradient" style={{ width: `${feedbacks.length ? (count / feedbacks.length) * 100 : 0}%` }} />
                  </div>
                  <span className="text-gold-100/40 w-4 text-right">{count}</span>
                </div>
              );
            })}
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {[...feedbacks].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6).map((f) => (
              <div key={f.id} className="rounded-xl border border-gold-500/15 bg-ink-900/55 p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-medium text-gold-100 text-sm truncate">{f.userName}</span>
                  <span className="text-gold-400 text-sm shrink-0">
                    {"★".repeat(f.stars)}<span className="text-gold-100/20">{"★".repeat(5 - f.stars)}</span>
                  </span>
                </div>
                <p className="text-xs text-gold-100/60 leading-relaxed line-clamp-3">{f.text}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
