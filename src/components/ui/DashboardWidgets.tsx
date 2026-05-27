/**
 * Shared overview widgets — used by all role dashboards.
 * No role-specific logic here.
 */
import { useState, useMemo } from "react";
import { Badge } from "../ui";
import { appointmentsService } from "../../services/appointments";
import { useStore } from "../../store/store";
import type { Appointment, AppointmentStatus } from "../../shared/types";

// ── Stat tile grid ────────────────────────────────────────────────────────
interface Stat {
  label: string;
  value: string | number;
  sub: string;
  tab: string;
  color: string;
}
export function StatGrid({ stats, onTabChange }: { stats: Stat[]; onTabChange: (t: string) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((s) => (
        <button key={s.label} onClick={() => onTabChange(s.tab)}
          className="glass-strong rounded-xl p-4 text-left hover:border-gold-400/40 transition group">
          <div className="text-[10px] uppercase tracking-wider text-gold-300/55 mb-1">{s.label}</div>
          <div className={`font-serif text-2xl ${s.color} group-hover:brightness-125 transition`}>{s.value}</div>
          <div className="text-xs text-gold-100/35 mt-0.5">{s.sub}</div>
        </button>
      ))}
    </div>
  );
}

// ── Today's schedule list ─────────────────────────────────────────────────
export function TodaySchedule({ appointments, onViewAll, showPayment = false }: {
  appointments: Appointment[];
  onViewAll: () => void;
  showPayment?: boolean;
}) {
  const sorted  = [...appointments].sort((a, b) => a.time.localeCompare(b.time));
  const visible = sorted.slice(0, 6);

  if (sorted.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center">
        <p className="text-sm text-gold-100/50">No appointments today</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {visible.map((a) => (
        <div key={a.id} className="glass rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-gold-300 text-sm shrink-0">{a.time}</span>
            <div className="min-w-0">
              <p className="font-medium text-gold-100 text-sm truncate">{a.patientName}</p>
              <p className="text-xs text-gold-100/50 truncate">{a.serviceName} · {a.doctor}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {a.emergency && <Badge tone="emergency">Priority</Badge>}
            <Badge tone={a.status as any}>{a.status}</Badge>
            {showPayment && (
              <Badge tone={a.paymentStatus === "paid" ? "paid" : "neutral"}>
                {a.paymentStatus === "paid" ? "Paid" : "Unpaid"}
              </Badge>
            )}
          </div>
        </div>
      ))}
      {sorted.length > 6 && (
        <button onClick={onViewAll} className="w-full py-2 text-xs text-gold-300/50 hover:text-gold-300 transition">
          +{sorted.length - 6} more — view all
        </button>
      )}
    </div>
  );
}

// ── Alert banner ──────────────────────────────────────────────────────────
export function AlertBanner({ message, action, onAction, tone = "amber" }: {
  message: string;
  action: string;
  onAction: () => void;
  tone?: "amber" | "red" | "blue";
}) {
  const colors = {
    amber: "border-amber-500/40 bg-amber-500/8 text-amber-300",
    red:   "border-red-500/30   bg-red-500/8   text-red-300",
    blue:  "border-blue-500/40  bg-blue-500/8  text-blue-300",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-3 ${colors[tone]}`}>
      <p className="text-sm font-semibold">{message}</p>
      <button onClick={onAction} className="text-xs hover:brightness-125 transition whitespace-nowrap">{action} →</button>
    </div>
  );
}

// ── Latest announcement card ──────────────────────────────────────────────
export function LatestAnnouncement({ onViewAll }: { onViewAll: () => void }) {
  const { announcements } = useStore();
  const latest = announcements[0];
  if (!latest) return null;
  return (
    <div className="glass rounded-xl p-4 space-y-2">
      <p className="text-[10px] uppercase tracking-[0.2em] text-gold-300/55">Latest Announcement</p>
      {latest.pinned && <span className="text-[10px] text-amber-300/70 uppercase tracking-wider">Pinned</span>}
      <p className="font-medium text-gold-100 text-sm">{latest.title}</p>
      <p className="text-xs text-gold-100/55 line-clamp-3">{latest.body}</p>
      <button onClick={onViewAll} className="text-xs text-gold-400/60 hover:text-gold-300 transition">View all →</button>
    </div>
  );
}

// ── Quick action button list ──────────────────────────────────────────────
export function QuickActions({ actions }: { actions: { label: string; onClick: () => void }[] }) {
  return (
    <div className="glass rounded-xl p-4 space-y-2">
      <p className="text-[10px] uppercase tracking-[0.2em] text-gold-300/55">Quick Actions</p>
      {actions.map((a) => (
        <button key={a.label} onClick={a.onClick}
          className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-gold-100/70 hover:bg-gold-500/10 hover:text-gold-200 transition border border-gold-500/15">
          {a.label}
        </button>
      ))}
    </div>
  );
}

// ── Revenue sparkline ─────────────────────────────────────────────────────
export function RevenueSparkline({ appointments: appts }: { appointments: Appointment[] }) {
  const { data, months } = useMemo(() => {
    const now = new Date();
    const map: Record<string, number> = {};
    const labels: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      map[key] = 0;
      labels.push(d.toLocaleDateString("en-PH", { month: "short" }));
    }
    appts.filter((a) => a.paymentStatus === "paid").forEach((a) => {
      const m = a.date.slice(0, 7);
      if (m in map) map[m] += a.price;
    });
    return { data: Object.values(map), months: labels };
  }, [appts]);

  const max = Math.max(...data, 1);
  const points = data.map((v, i) => {
    const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
    const y = 100 - (v / max) * 80 - 10;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="glass rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-gold-300/55 mb-3">Revenue — Last 6 Months</p>
      <svg viewBox="0 0 100 60" className="w-full h-16" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dab23c" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#dab23c" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline fill="none" stroke="#dab23c" strokeWidth="1.5" strokeLinejoin="round" points={points} />
        <polygon fill="url(#sparkGrad)" points={`0,100 ${points} 100,100`} />
        {data.map((v, i) => {
          const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
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

// ── Appointment row with inline status actions (admin/doctor overview) ────
export function AppointmentActionRow({ appt: a }: { appt: Appointment }) {
  const { user } = useStore();
  const [updating, setUpdating] = useState<AppointmentStatus | null>(null);
  const [error, setError] = useState("");

  async function setStatus(status: AppointmentStatus) {
    setUpdating(status); setError("");
    try {
      await appointmentsService.update(a.id, { status }, user?.name ?? "admin");
    } catch (e: any) {
      setError(e.message || "Failed.");
    } finally { setUpdating(null); }
  }

  const nextActions: { label: string; status: AppointmentStatus }[] =
    a.status === "pending"     ? [{ label: "Confirm",  status: "confirmed"   }] :
    a.status === "confirmed"   ? [{ label: "Start",    status: "in-progress" }] :
    a.status === "in-progress" ? [{ label: "Complete", status: "completed"   }] : [];

  return (
    <div className="glass rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-mono text-gold-300 text-sm shrink-0">{a.time}</span>
        <div className="min-w-0">
          <p className="font-medium text-gold-100 text-sm truncate">{a.patientName}</p>
          <p className="text-xs text-gold-100/50 truncate">{a.serviceName} · {a.doctor}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        <Badge tone={a.status as any}>{a.status}</Badge>
        <Badge tone={a.paymentStatus === "paid" ? "paid" : "neutral"}>
          {a.paymentStatus === "paid" ? "Paid · Cash" : "Unpaid"}
        </Badge>
        {nextActions.map(({ label, status }) => (
          <button key={status} disabled={!!updating} onClick={() => setStatus(status)}
            className="text-[10px] px-2.5 py-1 rounded-full border border-gold-500/30 text-gold-300 hover:bg-gold-500/10 transition disabled:opacity-50">
            {updating === status ? "…" : label}
          </button>
        ))}
      </div>
      {error && <p className="w-full text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ── Weekly mini-calendar ──────────────────────────────────────────────────
function DayCell({ d, todayStr, appointments, onTabChange }: {
  d: Date;
  todayStr: string;
  appointments: Appointment[];
  onTabChange: (t: string) => void;
}) {
  const dateStr = d.toISOString().slice(0, 10);
  const isToday  = dateStr === todayStr;
  const isSunday = d.getDay() === 0;
  const dayAppts = appointments.filter((a) => a.date === dateStr && a.status !== "cancelled");
  const hasPending   = dayAppts.some((a) => a.status === "pending");
  const hasEmergency = dayAppts.some((a) => a.emergency);

  return (
    <button onClick={() => !isSunday && onTabChange("appointments")} disabled={isSunday}
      className={`relative rounded-xl p-2 text-center transition-all ${
        isToday    ? "border border-gold-400/60 bg-gold-500/12 shadow-luxe"
        : isSunday ? "border border-gold-500/8 opacity-40 cursor-not-allowed"
        : "border border-gold-500/15 hover:border-gold-400/40 hover:bg-gold-500/5"
      }`}>
      <div className={`text-[10px] uppercase tracking-wider mb-1 ${isToday ? "text-gold-300" : "text-gold-100/40"}`}>
        {d.toLocaleDateString("en-PH", { weekday: "short" })}
      </div>
      <div className={`font-serif text-lg leading-none ${isToday ? "text-gold-shine" : "text-gold-100/70"}`}>
        {d.getDate()}
      </div>
      {isSunday ? (
        <div className="text-[9px] text-gold-100/25 mt-1">Closed</div>
      ) : dayAppts.length > 0 ? (
        <div className="mt-1.5 space-y-0.5">
          <div className={`text-[10px] font-semibold ${isToday ? "text-gold-300" : "text-gold-100/60"}`}>
            {dayAppts.length} appt{dayAppts.length !== 1 ? "s" : ""}
          </div>
          <div className="flex justify-center gap-1">
            {hasEmergency && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
            {hasPending   && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
            {!hasEmergency && !hasPending && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </div>
        </div>
      ) : (
        <div className="text-[9px] text-gold-100/20 mt-1">—</div>
      )}
    </button>
  );
}

// ── Today's Summary widget (panel requirement: daily clients + revenue on dashboard) ──
export function TodaySummaryWidget({ appointments, onTabChange }: {
  appointments: Appointment[];
  onTabChange: (t: string) => void;
}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAppts = appointments.filter((a) => a.date === todayStr && a.status !== "cancelled");
  const completed  = todayAppts.filter((a) => a.status === "completed").length;
  const pending    = todayAppts.filter((a) => a.status === "pending").length;
  const confirmed  = todayAppts.filter((a) => a.status === "confirmed" || a.status === "in-progress").length;
  const revenue    = todayAppts.filter((a) => a.paymentStatus === "paid").reduce((s, a) => s + a.price, 0);
  const unpaid     = todayAppts.filter((a) => a.status === "completed" && a.paymentStatus !== "paid").length;

  return (
    <div className="glass-strong rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Today's Summary</p>
          <p className="text-xs text-gold-100/40">{todayStr}</p>
        </div>
        <button onClick={() => onTabChange("appointments")} className="text-xs text-gold-400/60 hover:text-gold-300 transition">View all →</button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Total Clients",  value: todayAppts.length, color: "text-blue-300",    tab: "appointments" },
          { label: "Revenue Today",  value: `₱${revenue.toLocaleString()}`, color: "text-gold-shine", tab: "payments" },
          { label: "Completed",      value: completed,          color: "text-emerald-300", tab: "appointments" },
          { label: "Pending",        value: pending + confirmed, color: "text-amber-300",  tab: "appointments" },
        ].map((s) => (
          <button key={s.label} onClick={() => onTabChange(s.tab)}
            className="rounded-lg border border-gold-500/15 bg-ink-900/40 p-3 text-left hover:border-gold-400/30 transition">
            <div className="text-[9px] uppercase tracking-wider text-gold-300/50 mb-0.5">{s.label}</div>
            <div className={`font-serif text-xl ${s.color}`}>{s.value}</div>
          </button>
        ))}
      </div>
      {unpaid > 0 && (
        <button onClick={() => onTabChange("payments")}
          className="mt-3 w-full text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-left hover:bg-amber-500/15 transition">
          ⚠ {unpaid} completed appointment{unpaid !== 1 ? "s" : ""} with unpaid balance
        </button>
      )}
    </div>
  );
}

/** Weekly cash sales — panel requirement for doctor reporting */
export function CashSalesReport({ appointments, onTabChange }: {
  appointments: Appointment[];
  onTabChange: (t: string) => void;
}) {
  const today = new Date();
  const days: { label: string; date: string; clients: number; revenue: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayAppts = appointments.filter((a) => a.date === dateStr && a.status !== "cancelled");
    const paid = dayAppts.filter((a) => a.paymentStatus === "paid");
    days.push({
      label: d.toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" }),
      date: dateStr,
      clients: dayAppts.length,
      revenue: paid.reduce((s, a) => s + a.price, 0),
    });
  }

  const weekRevenue = days.reduce((s, d) => s + d.revenue, 0);
  const weekClients = days.reduce((s, d) => s + d.clients, 0);

  return (
    <div className="glass-strong rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Cash Sales Report</p>
          <p className="text-xs text-gold-100/40">Last 7 days · clinic counter payments only</p>
        </div>
        <button type="button" onClick={() => onTabChange("reports")} className="text-xs text-gold-400 hover:text-gold-300">
          Full reports →
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border border-gold-500/15 bg-ink-900/40 p-3 text-center">
          <div className="text-[9px] uppercase text-gold-300/50">Week revenue</div>
          <div className="font-serif text-xl text-gold-shine">₱{weekRevenue.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border border-gold-500/15 bg-ink-900/40 p-3 text-center">
          <div className="text-[9px] uppercase text-gold-300/50">Week clients</div>
          <div className="font-serif text-xl text-blue-300">{weekClients}</div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gold-300/50 uppercase tracking-wider text-left">
              <th className="py-2">Day</th>
              <th className="py-2">Clients</th>
              <th className="py-2 text-right">Cash collected</th>
            </tr>
          </thead>
          <tbody>
            {[...days].reverse().map((d) => (
              <tr key={d.date} className="border-t border-gold-500/10">
                <td className="py-2 text-gold-100/70">{d.label}</td>
                <td className="py-2 text-gold-100">{d.clients}</td>
                <td className="py-2 text-right font-mono text-gold-300">₱{d.revenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function WeeklyMiniCalendar({ appointments, onTabChange }: {
  appointments: Appointment[];
  onTabChange: (t: string) => void;
}) {
  const [weekOffset, setWeekOffset] = useState(0);

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const monday = new Date(today);
  const dayOfWeek = today.getDay();
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + weekOffset * 7);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const weekLabel = `${days[0].toLocaleDateString("en-PH", { month: "short", day: "numeric" })} – ${days[6].toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="font-serif text-xl text-gold-shine">Weekly Dashboard</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => setWeekOffset((o) => o - 1)} className="h-7 w-7 rounded-lg border border-gold-500/25 text-gold-300 hover:bg-gold-500/10 transition text-sm flex items-center justify-center">‹</button>
          <span className="text-xs text-gold-100/50 text-center">{weekLabel}</span>
          <button onClick={() => setWeekOffset((o) => o + 1)} className="h-7 w-7 rounded-lg border border-gold-500/25 text-gold-300 hover:bg-gold-500/10 transition text-sm flex items-center justify-center">›</button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-[10px] uppercase tracking-wider text-gold-400/60 hover:text-gold-300 transition">Today</button>
          )}
        </div>
      </div>
      {/* Mobile: hide Sunday */}
      <div className="grid grid-cols-3 gap-1.5 sm:hidden">
        {days.filter((d) => d.getDay() !== 0).map((d) => (
          <DayCell key={d.toISOString()} d={d} todayStr={todayStr} appointments={appointments} onTabChange={onTabChange} />
        ))}
      </div>
      {/* Desktop: full 7 columns */}
      <div className="hidden sm:grid grid-cols-7 gap-1.5">
        {days.map((d) => (
          <DayCell key={d.toISOString()} d={d} todayStr={todayStr} appointments={appointments} onTabChange={onTabChange} />
        ))}
      </div>
      <div className="flex items-center gap-4 mt-2 px-1">
        <span className="flex items-center gap-1.5 text-[10px] text-gold-100/40"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Confirmed</span>
        <span className="flex items-center gap-1.5 text-[10px] text-gold-100/40"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Pending</span>
        <span className="flex items-center gap-1.5 text-[10px] text-gold-100/40"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />Priority</span>
      </div>
    </div>
  );
}
