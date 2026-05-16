/**
 * Shared overview widgets — used by all role dashboards.
 * No role-specific logic here.
 */
import { useState, type ReactNode } from "react";
import { Badge } from "../ui";
import type { Appointment } from "../../shared/types";

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

// ── Overview page header (date + optional action) ─────────────────────────
export function OverviewHeader({ role, name, sub, children }: {
  role: string;
  name: string;
  sub?: string;
  children?: ReactNode;
}) {
  return (
    <div className="glass-strong rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">{role}</p>
        <h2 className="font-serif text-3xl text-gold-shine mt-1">{name}</h2>
        {sub && <p className="text-sm text-gold-100/50 mt-1">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

// ── Reusable weekly mini-calendar ─────────────────────────────────────────
export function WeeklyMiniCalendar({ appointments, onTabChange }: {
  appointments: Appointment[];
  onTabChange: (t: string) => void;
}) {
  const [weekOffset, setWeekOffset] = useState(0);

  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + weekOffset * 7);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const weekLabel = `${days[0].toLocaleDateString("en-PH", { month: "short", day: "numeric" })} – ${days[6].toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}`;
  const todayStr = today.toISOString().slice(0, 10);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="font-serif text-xl text-gold-shine">Weekly Overview</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => setWeekOffset((o) => o - 1)} className="h-7 w-7 rounded-lg border border-gold-500/25 text-gold-300 hover:bg-gold-500/10 transition text-sm flex items-center justify-center">‹</button>
          <span className="text-xs text-gold-100/50 text-center">{weekLabel}</span>
          <button onClick={() => setWeekOffset((o) => o + 1)} className="h-7 w-7 rounded-lg border border-gold-500/25 text-gold-300 hover:bg-gold-500/10 transition text-sm flex items-center justify-center">›</button>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="text-[10px] uppercase tracking-wider text-gold-400/60 hover:text-gold-300 transition">Today</button>
          )}
        </div>
      </div>

      {/* Mobile: 3+3 grid (Mon–Wed / Thu–Sat), Sun hidden */}
      <div className="grid grid-cols-3 gap-1.5 sm:hidden">
        {days.filter((d) => d.getDay() !== 0).map((d) => {
          const dateStr = d.toISOString().slice(0, 10);
          const isToday = dateStr === todayStr;
          const dayAppts = appointments.filter((a) => a.date === dateStr && a.status !== "cancelled");
          const hasPending = dayAppts.some((a) => a.status === "pending");
          const hasEmergency = dayAppts.some((a) => a.emergency);
          return (
            <button key={dateStr} onClick={() => onTabChange("appointments")}
              className={`rounded-xl p-2 text-center transition-all ${
                isToday ? "border border-gold-400/60 bg-gold-500/12 shadow-luxe"
                : "border border-gold-500/15 hover:border-gold-400/40 hover:bg-gold-500/5"
              }`}>
              <div className={`text-[10px] uppercase tracking-wider mb-1 ${isToday ? "text-gold-300" : "text-gold-100/40"}`}>
                {d.toLocaleDateString("en-PH", { weekday: "short" })}
              </div>
              <div className={`font-serif text-base leading-none ${isToday ? "text-gold-shine" : "text-gold-100/70"}`}>
                {d.getDate()}
              </div>
              {dayAppts.length > 0 ? (
                <div className="mt-1 flex justify-center gap-1">
                  {hasEmergency && <span className="w-1.5 h-1.5 rounded-full bg-red-400" />}
                  {hasPending   && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  {!hasEmergency && !hasPending && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </div>
              ) : (
                <div className="text-[9px] text-gold-100/20 mt-1">—</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Desktop: full 7-column layout */}
      <div className="hidden sm:grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const dateStr = d.toISOString().slice(0, 10);
          const isToday = dateStr === todayStr;
          const isSunday = d.getDay() === 0;
          const dayAppts = appointments.filter((a) => a.date === dateStr && a.status !== "cancelled");
          const hasPending = dayAppts.some((a) => a.status === "pending");
          const hasEmergency = dayAppts.some((a) => a.emergency);
          return (
            <button key={dateStr} onClick={() => !isSunday && onTabChange("appointments")} disabled={isSunday}
              className={`relative rounded-xl p-2 text-center transition-all ${
                isToday ? "border border-gold-400/60 bg-gold-500/12 shadow-luxe"
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
        })}
      </div>

      <div className="flex items-center gap-4 mt-2 px-1">
        <span className="flex items-center gap-1.5 text-[10px] text-gold-100/40"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Confirmed</span>
        <span className="flex items-center gap-1.5 text-[10px] text-gold-100/40"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Pending</span>
        <span className="flex items-center gap-1.5 text-[10px] text-gold-100/40"><span className="w-1.5 h-1.5 rounded-full bg-red-400" />Priority</span>
      </div>
    </div>
  );
}
