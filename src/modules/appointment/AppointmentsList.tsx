import { memo, useState, useCallback } from "react";
import { Badge, Button, Card, ConfirmDialog, EmptyState, Input, Select } from "../../components/ui";
import { appointmentsService } from "../../services/appointments";
import { useStore } from "../../store/store";
import { BOOKING } from "../../shared/constants";
import type { Appointment, AppointmentStatus, PaymentStatus, Role } from "../../shared/types";

const PAGE_SIZE = 10;

export function AppointmentsList({ role, patientOnly }: { role: Role | "admin"; patientOnly?: boolean }) {
  const { appointments = [], user } = useStore();
  const [filter, setFilter] = useState<"all" | AppointmentStatus>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "alpha">("recent");
  const [page, setPage] = useState(1);

  // Reminder banner — upcoming appointments today or tomorrow for patients
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const upcoming = patientOnly && user
    ? appointments.filter(
        (a) => a.patientId === user.id &&
          (a.date === today || a.date === tomorrow) &&
          (a.status === "pending" || a.status === "confirmed")
      )
    : [];

  let list = patientOnly && user
    ? appointments.filter((a) => a.patientId === user.id)
    : [...appointments];

  if (filter !== "all") list = list.filter((a) => a.status === filter);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((a) => `${a.patientName}${a.serviceName}`.toLowerCase().includes(q));
  }

  // Sort: recently booked (createdAt desc) or alphabetical (patientName A→Z)
  list = sort === "alpha"
    ? list.sort((a, b) => a.patientName.localeCompare(b.patientName))
    : list.sort((a, b) => (b.createdAt ?? b.date + b.time).localeCompare(a.createdAt ?? a.date + a.time));

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function onFilterChange(val: string) { setFilter(val as any); setPage(1); }
  function onSearchChange(val: string) { setSearch(val); setPage(1); }
  function onSortChange(val: "recent" | "alpha") { setSort(val); setPage(1); }

  return (
    <div className="space-y-4">
      {/* Reminder banner for today/tomorrow appointments */}
      {upcoming.map((a) => (
        <div key={a.id} className={`rounded-xl border p-4 flex flex-wrap items-center justify-between gap-3 ${
          a.date === today
            ? "border-red-500/40 bg-red-500/10"
            : "border-yellow-500/40 bg-yellow-500/10"
        }`}>
          <div>
            <p className={`text-sm font-semibold ${a.date === today ? "text-red-300" : "text-yellow-300"}`}>
              {a.date === today ? "Appointment Today!" : "Appointment Tomorrow"}
            </p>
            <p className="text-xs text-gold-100/60 mt-0.5">
              {a.serviceName} at {a.time} with {a.doctor}. Please arrive 10 minutes early.
            </p>
          </div>
          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${
            a.date === today ? "bg-red-500/20 text-red-300" : "bg-yellow-500/20 text-yellow-300"
          }`}>
            {a.date === today ? "Today" : "Tomorrow"}
          </span>
        </div>
      ))}
      <Card className="!p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search patient, service…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-xs"
            aria-label="Search appointments"
          />
          <Select
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="max-w-[160px]"
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="in-progress">In Progress</option>
            <option value="no-show">No Show</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          {/* Sort toggle */}
          <div className="flex rounded-lg border border-gold-500/20 overflow-hidden text-xs">
            <button
              onClick={() => onSortChange("recent")}
              className={`px-3 py-2 transition ${sort === "recent" ? "bg-gold-500/15 text-gold-200" : "text-gold-100/50 hover:text-gold-200"}`}
            >
              Recently Booked
            </button>
            <button
              onClick={() => onSortChange("alpha")}
              className={`px-3 py-2 border-l border-gold-500/20 transition ${sort === "alpha" ? "bg-gold-500/15 text-gold-200" : "text-gold-100/50 hover:text-gold-200"}`}
            >
              A → Z
            </button>
          </div>
          <span className="text-xs text-gold-100/50 ml-auto">{list.length} appointment(s)</span>
        </div>
      </Card>

      {paged.length === 0 && (
        <Card>
          <EmptyState
            icon="—"
            title="No appointments found"
            subtitle={search || filter !== "all" ? "Try adjusting your search or filter." : "No appointments have been booked yet."}
          />
        </Card>
      )}

      <div className="space-y-3">
        {paged.map((a) => (
          <AppointmentCard key={a.id} a={a} role={role} isSelf={a.patientId === user?.id} actor={user?.name || "system"} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2" role="navigation" aria-label="Pagination">
          <Button size="sm" variant="ghost" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>← Prev</Button>
          <span className="text-xs text-gold-100/50">{safePage} / {totalPages}</span>
          <Button size="sm" variant="ghost" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>Next →</Button>
        </div>
      )}
    </div>
  );
}

const AppointmentCard = memo(function AppointmentCard({ a, role, isSelf, actor }: { a: Appointment; role: Role | "admin"; isSelf: boolean; actor: string }) {
  const { appointments } = useStore();
  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState(a.date);
  const [newTime, setNewTime] = useState(a.time);
  const [saving, setSaving] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [actionError, setActionError] = useState("");

  const update = useCallback(async (data: Partial<Appointment>) => {
    setActionError("");
    try {
      await appointmentsService.update(a.id, data, actor);
    } catch (err: any) {
      setActionError(err.message || "Action failed.");
    }
  }, [a.id, actor]);

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const reminderBadge = a.date === today ? "Today" : a.date === tomorrow ? "Tomorrow" : null;

  const takenTimes = appointments
    .filter((x) => x.date === newDate && x.id !== a.id && x.status !== "cancelled")
    .map((x) => x.time);

  function isSlotTooSoon(date: string, time: string) {
    const [h, m] = time.split(":").map(Number);
    const slot = new Date(date);
    slot.setHours(h, m, 0, 0);
    return slot.getTime() - Date.now() < 60 * 60 * 1000;
  }

  async function confirmReschedule() {
    if (!newDate || !newTime) return;
    setRescheduleError("");
    if (isSlotTooSoon(newDate, newTime)) {
      setRescheduleError("New schedule must be at least 1 hour from now.");
      return;
    }
    setSaving(true);
    try {
      await appointmentsService.rescheduleAndNotify(a.id, newDate, newTime, actor);
      setRescheduling(false);
    } catch (err: any) {
      setRescheduleError(err.message || "Reschedule failed.");
    } finally {
      setSaving(false);
    }
  }

  const canReschedule = isSelf && !a.rescheduledAt && (a.status === "pending" || a.status === "confirmed");

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {role !== "patient" && <p className="font-semibold text-gold-100 text-sm">{a.patientName}</p>}
          <p className="text-gold-100/80 font-medium text-sm">{a.serviceName}</p>
          <p className="text-xs text-gold-100/55 mt-0.5">{a.date} · {a.time} · {a.doctor}</p>
          {a.source && a.source !== "online" && (
            <p className="text-[10px] text-gold-300/50 mt-0.5 uppercase tracking-wider">via {a.source}</p>
          )}
          {a.calendarEventId && (
            <p className="text-[10px] text-gold-300/50 mt-0.5">Synced to Google Calendar</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {reminderBadge && (a.status === "pending" || a.status === "confirmed") && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${reminderBadge === "Today" ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"}`}>
              {reminderBadge}
            </span>
          )}
          {a.emergency && <Badge tone="emergency">Priority</Badge>}
          <Badge tone={a.status === "in-progress" ? "confirmed" : a.status === "no-show" ? "cancelled" : a.status === "rescheduled" ? "pending" : a.status as any}>{a.status}</Badge>
          <PaymentBadge status={a.paymentStatus} method={a.paymentMethod === "gcash" ? "GCash" : ""} />
        </div>
      </div>

      {actionError && (
        <p className="mt-2 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded px-2 py-1">{actionError}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {(role === "doctor" || role === "admin") && a.status === "pending" && (
          <Button size="sm" onClick={() => update({ status: "confirmed" })}>Confirm</Button>
        )}
        {(role === "doctor" || role === "admin") && a.status === "confirmed" && (
          <Button size="sm" onClick={() => update({ status: "in-progress" })}>Start</Button>
        )}
        {(role === "doctor" || role === "admin") && a.status === "in-progress" && (
          <Button size="sm" onClick={() => update({ status: "completed" })}>Complete</Button>
        )}
        {(role === "doctor" || role === "admin") && (a.status === "confirmed" || a.status === "in-progress") && (
          <Button size="sm" variant="ghost" onClick={() => update({ status: "no-show" })}>No Show</Button>
        )}
        {role === "staff" && a.status === "pending" && (
          <Button size="sm" onClick={() => update({ status: "confirmed" })}>Confirm</Button>
        )}
        {role === "patient" && isSelf && (a.status === "pending" || a.status === "confirmed") && (
          canReschedule ? (
            <Button size="sm" variant="outline" onClick={() => { setRescheduling((v) => !v); setRescheduleError(""); }}>
              {rescheduling ? "Cancel Reschedule" : "Reschedule"}
            </Button>
          ) : a.rescheduledAt ? (
            <span className="text-xs text-gold-100/40 italic">Already rescheduled</span>
          ) : null
        )}
        {role === "patient" && isSelf && (a.status === "pending" || a.status === "confirmed") && (
          <Button size="sm" variant="danger" onClick={() => setConfirmCancel(true)}>Cancel</Button>
        )}
      </div>

      {rescheduling && (
        <div className="mt-4 p-4 rounded-xl border border-gold-500/20 bg-ink-900/50 space-y-3">
          <p className="text-xs uppercase tracking-wider text-gold-300/60">Pick a new date & time</p>
          <div className="flex flex-wrap gap-3">
            <Input type="date" value={newDate} min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => { setNewDate(e.target.value); setNewTime(""); setRescheduleError(""); }}
              className="max-w-[160px]"
              aria-label="New date"
            />
            <div className="flex flex-wrap gap-2" role="group" aria-label="Available time slots">
              {BOOKING.TIME_SLOTS.map((t) => {
                const taken = takenTimes.includes(t);
                const tooSoon = isSlotTooSoon(newDate, t);
                const disabled = taken || tooSoon;
                return (
                  <button key={t} disabled={disabled} onClick={() => { setNewTime(t); setRescheduleError(""); }}
                    aria-pressed={newTime === t}
                    aria-label={`${t}${taken ? " (taken)" : tooSoon ? " (too soon)" : ""}`}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition ${newTime === t ? "bg-gold-gradient text-ink-950 border-gold-400" : disabled ? "border-red-500/30 text-red-400/40 line-through cursor-not-allowed" : "border-gold-500/30 text-gold-100/80 hover:border-gold-400"}`}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          {rescheduleError && <p className="text-xs text-red-300" role="alert">{rescheduleError}</p>}
          <Button size="sm" disabled={!newTime || saving} onClick={confirmReschedule}>
            {saving ? "Saving…" : "Confirm Reschedule"}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel Appointment"
        message={`Are you sure you want to cancel your ${a.serviceName} appointment on ${a.date} at ${a.time}? This cannot be undone. Note: repeated cancellations may affect future bookings.`}
        confirmLabel="Yes, Cancel"
        danger
        onConfirm={() => { setConfirmCancel(false); appointmentsService.cancelAndNotify(a.id, actor); }}
        onCancel={() => setConfirmCancel(false)}
      />

      {/* Status timeline — visible to patients */}
      {role === "patient" && a.status !== "cancelled" && (
        <AppointmentTimeline status={a.status} paymentStatus={a.paymentStatus} />
      )}
    </Card>
  );
});

export function AppointmentTimeline({ status, paymentStatus }: { status: AppointmentStatus; paymentStatus: PaymentStatus }) {
  const steps = [
    { id: "pending",     label: "Booked",     done: true },
    { id: "confirmed",   label: "Confirmed",  done: ["confirmed","in-progress","completed"].includes(status) },
    { id: "in-progress", label: "In Progress",done: ["in-progress","completed"].includes(status) },
    { id: "completed",   label: "Completed",  done: status === "completed" },
    { id: "paid",        label: "Paid",       done: paymentStatus === "paid" },
  ];
  const activeIdx = steps.reduce((last, s, i) => s.done ? i : last, -1);

  return (
    <div className="mt-4 pt-4 border-t border-gold-500/10">
      <div className="flex items-center gap-0">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                s.done
                  ? "border-gold-400 bg-gold-400/20"
                  : i === activeIdx + 1
                  ? "border-gold-500/40 bg-transparent"
                  : "border-gold-500/20 bg-transparent"
              }`}>
                {s.done && <span className="text-gold-400 text-[9px]">✓</span>}
              </div>
              <span className={`text-[9px] uppercase tracking-wider whitespace-nowrap ${s.done ? "text-gold-300/70" : "text-gold-100/25"}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-1 mb-4 transition-all ${s.done && steps[i + 1].done ? "bg-gold-400/40" : "bg-gold-500/15"}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PaymentBadge({ status, method }: { status: PaymentStatus; method: string }) {
  const map: Record<PaymentStatus, { tone: any; text: string }> = {
    unpaid:               { tone: "neutral", text: "Unpaid" },
    partial_paid:         { tone: "pending", text: "Partial" },
    pending_verification: { tone: "pending", text: "Pending" },
    verified:             { tone: "confirmed", text: "Verified" },
    paid:                 { tone: "paid",    text: "Paid" },
  };
  const s = map[status] || { tone: "neutral", text: status };
  return (
    <div className="flex flex-col items-start gap-0.5">
      <Badge tone={s.tone}>{s.text}</Badge>
      {status === "paid" && method && <span className="text-[10px] text-gold-100/45">{method}</span>}
    </div>
  );
}
