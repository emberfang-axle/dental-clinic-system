import { useState, useCallback, Fragment } from "react";
import { Badge, Button, Card, ConfirmDialog, Input, Select } from "../../components/ui";
import { appointmentsService } from "../../services/appointments";
import { useStore } from "../../store/store";
import { BOOKING, getSlotsForDate } from "../../shared/constants";
import { formatTime12h } from "../../shared/helpers";
import type { Appointment, AppointmentStatus, PaymentStatus, Role } from "../../shared/types";


const PAGE_SIZE = 10;

export function AppointmentsList({ role, patientOnly }: { role: Role | "admin"; patientOnly?: boolean }) {
  const { appointments = [], user } = useStore();
  const [filter, setFilter] = useState<"all" | AppointmentStatus>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const upcoming = patientOnly && user
    ? appointments.filter(
        (a) => a.patientId === user.id &&
          (a.date === todayStr || a.date === tomorrow) &&
          (a.status === "pending" || a.status === "confirmed")
      )
    : [];

  let list = patientOnly && user
    ? appointments.filter((a) => a.patientId === user.id)
    : [...appointments];

  if (filter !== "all") list = list.filter((a) => a.status === filter);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((a) => `${a.patientName}${a.serviceName}${a.doctor}`.toLowerCase().includes(q));
  }

  // Latest first (newest createdAt on top) — as requested by panel
  list = list.sort((a, b) => (b.createdAt ?? b.date + b.time).localeCompare(a.createdAt ?? a.date + a.time));

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function onFilterChange(val: string) { setFilter(val as any); setPage(1); }
  function onSearchChange(val: string) { setSearch(val); setPage(1); }

  return (
    <div className="space-y-4">
      {/* Reminder banners */}
      {upcoming.map((a) => (
        <div key={a.id} className={`rounded-xl border p-4 flex flex-wrap items-center justify-between gap-3 ${
          a.date === todayStr ? "border-red-500/40 bg-red-500/10" : "border-yellow-500/40 bg-yellow-500/10"
        }`}>
          <div>
            <p className={`text-sm font-semibold ${a.date === todayStr ? "text-red-300" : "text-yellow-300"}`}>
              {a.date === todayStr ? "Appointment Today!" : "Appointment Tomorrow"}
            </p>
            <p className="text-xs text-gold-100/60 mt-0.5">
              {a.serviceName} at {a.time} with {a.doctor}. Please arrive 10 minutes early.
            </p>
          </div>
          <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${
            a.date === todayStr ? "bg-red-500/20 text-red-300" : "bg-yellow-500/20 text-yellow-300"
          }`}>
            {a.date === todayStr ? "Today" : "Tomorrow"}
          </span>
        </div>
      ))}

      {/* Toolbar */}
      <Card className="!p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search patient, service, doctor…"
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
          <span className="text-xs text-gold-100/50 ml-auto">{list.length} appointment(s)</span>
        </div>
      </Card>

      {/* Data Table */}
      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="border-b border-gold-500/15 bg-ink-900/60">
              <tr className="text-left text-[10px] uppercase tracking-wider text-gold-300/60">
                <th className="px-4 py-3">Date & Time</th>
                {role !== "patient" && <th className="px-4 py-3">Patient</th>}
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Doctor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr>
                  <td colSpan={role !== "patient" ? 7 : 6} className="px-4 py-8 text-center text-sm text-gold-100/40">
                    {search || filter !== "all" ? "No appointments match your filter." : "No appointments yet."}
                  </td>
                </tr>
              )}
              {paged.map((a) => {
                const isToday = a.date === todayStr;
                const isTomorrow = a.date === tomorrow;
                const isOpen = expanded === a.id;
                return (
                  <Fragment key={a.id}>
                    <tr
                      className={`border-b border-gold-500/10 hover:bg-gold-500/5 transition cursor-pointer ${isOpen ? "bg-gold-500/5" : ""}`}
                      onClick={() => setExpanded(isOpen ? null : a.id)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-gold-100 font-medium">{a.date}</span>
                          {isToday && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-bold uppercase">Today</span>}
                          {isTomorrow && <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-bold uppercase">Tomorrow</span>}
                        </div>
                        <div className="text-xs text-gold-100/50">{formatTime12h(a.time)}</div>
                      </td>
                      {role !== "patient" && (
                        <td className="px-4 py-3">
                          <div className="text-gold-100 font-medium">{a.patientName}</div>
                        </td>
                      )}
                      <td className="px-4 py-3 text-gold-100/80">{a.serviceName}</td>
                      <td className="px-4 py-3 text-gold-100/70 text-xs">{a.doctor}</td>
                      <td className="px-4 py-3">
                        <Badge tone={a.status === "in-progress" ? "confirmed" : a.status === "no-show" ? "cancelled" : a.status === "rescheduled" ? "pending" : a.status as any}>
                          {a.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <PaymentBadge status={a.paymentStatus} method="Cash" />
                      </td>
                      <td className="px-4 py-3 text-right text-gold-100/40 text-xs select-none">
                        {isOpen ? "▲" : "▼"}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b border-gold-500/10 bg-ink-900/40">
                        <td colSpan={role !== "patient" ? 7 : 6} className="px-4 py-4">
                          <AppointmentDetail a={a} role={role} isSelf={a.patientId === user?.id} actor={user?.name || "system"} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

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

/** Expanded detail row shown when a table row is clicked */
function AppointmentDetail({ a, role, isSelf, actor }: { a: Appointment; role: Role | "admin"; isSelf: boolean; actor: string }) {
  const { appointments } = useStore();
  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState(a.date);
  const [newTime, setNewTime] = useState(a.time);
  const [saving, setSaving] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError, setActionError] = useState("");
  const [pendingAction, setPendingAction] = useState<{ label: string; data: Partial<Appointment> } | null>(null);

  const update = useCallback(async (data: Partial<Appointment>) => {
    setActionError("");
    try { await appointmentsService.update(a.id, data, actor); }
    catch (err: any) { setActionError(err.message || "Action failed."); }
  }, [a.id, actor]);

  const requestAction = (label: string, data: Partial<Appointment>) => setPendingAction({ label, data });

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
    if (isSlotTooSoon(newDate, newTime)) { setRescheduleError("New schedule must be at least 1 hour from now."); return; }
    setSaving(true);
    try { await appointmentsService.rescheduleAndNotify(a.id, newDate, newTime, actor); setRescheduling(false); }
    catch (err: any) { setRescheduleError(err.message || "Reschedule failed."); }
    finally { setSaving(false); }
  }

  const canReschedule = isSelf && !a.rescheduledAt && (a.status === "pending" || a.status === "confirmed");

  const STATUS_LABELS: Record<string, string> = {
    confirmed: "Confirm this appointment?",
    "in-progress": "Mark appointment as In Progress?",
    completed: "Mark appointment as Completed?",
    "no-show": "Mark patient as No Show?",
  };

  return (
    <div className="space-y-3">
      {/* Confirmation modal for status actions */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPendingAction(null)} />
          <div className="relative glass-strong rounded-2xl p-6 max-w-sm w-full shadow-luxe space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-2xl">✓</div>
            <h3 className="font-serif text-xl text-gold-shine">{STATUS_LABELS[pendingAction.data.status as string] ?? "Confirm action?"}</h3>
            <p className="text-sm text-gold-100/60">
              Patient: <span className="text-gold-200 font-medium">{a.patientName}</span><br />
              Service: <span className="text-gold-200 font-medium">{a.serviceName}</span><br />
              Date: <span className="text-gold-200 font-medium">{a.date} at {formatTime12h(a.time)}</span>
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => { update(pendingAction.data); setPendingAction(null); }}>Confirm</Button>
              <Button variant="ghost" onClick={() => setPendingAction(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Extra info */}
      <div className="flex flex-wrap gap-4 text-xs text-gold-100/55">
        {a.source && a.source !== "online" && <span>Source: <span className="text-gold-300 capitalize">{a.source}</span></span>}
        {a.status === "confirmed" || a.status === "in-progress" || a.status === "completed" ? (
          <span>Confirmed by: <span className="text-emerald-300">Staff / Doctor</span></span>
        ) : null}
        {a.notes && <span>Notes: <span className="text-gold-100/70">{a.notes}</span></span>}
        {a.receiptNumber && <span>Receipt: <span className="text-gold-300 font-mono">{a.receiptNumber}</span></span>}
        {a.calendarEventId && <span className="text-gold-300/50">Synced to Google Calendar</span>}
      </div>

      {actionError && (
        <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded px-2 py-1">{actionError}</p>
      )}

      {/* Action buttons — all go through confirmation modal */}
      <div className="flex flex-wrap gap-2">
        {(role === "doctor" || role === "admin") && a.status === "pending" && (
          <Button size="sm" onClick={() => requestAction("Confirm", { status: "confirmed" })}>Confirm</Button>
        )}
        {(role === "doctor" || role === "admin") && a.status === "confirmed" && (
          <Button size="sm" onClick={() => requestAction("Start", { status: "in-progress" })}>Start</Button>
        )}
        {(role === "doctor" || role === "admin") && a.status === "in-progress" && (
          <Button size="sm" onClick={() => requestAction("Complete", { status: "completed" })}>Complete</Button>
        )}
        {(role === "doctor" || role === "admin") && (a.status === "confirmed" || a.status === "in-progress") && (
          <Button size="sm" variant="ghost" onClick={() => requestAction("No Show", { status: "no-show" })}>No Show</Button>
        )}
        {role === "staff" && a.status === "pending" && (
          <Button size="sm" onClick={() => requestAction("Confirm", { status: "confirmed" })}>Confirm</Button>
        )}
        {(role === "admin" || role === "doctor" || role === "staff") && (
          <Button size="sm" variant="danger" onClick={() => setConfirmDelete(true)}>Delete</Button>
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
        <div className="p-4 rounded-xl border border-gold-500/20 bg-ink-900/50 space-y-3">
          <p className="text-xs uppercase tracking-wider text-gold-300/60">Pick a new date & time</p>
          <div className="flex flex-wrap gap-3">
            <Input type="date" value={newDate} min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => { setNewDate(e.target.value); setNewTime(""); setRescheduleError(""); }}
              className="max-w-[160px]" aria-label="New date" />
            <div className="flex flex-wrap gap-2" role="group" aria-label="Available time slots">
              {getSlotsForDate(newDate).map((t) => {
                const taken = takenTimes.includes(t);
                const tooSoon = isSlotTooSoon(newDate, t);
                const disabled = taken || tooSoon;
                return (
                  <button key={t} disabled={disabled} onClick={() => { setNewTime(t); setRescheduleError(""); }}
                    aria-pressed={newTime === t}
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
        message={`Are you sure you want to cancel your ${a.serviceName} appointment on ${a.date} at ${formatTime12h(a.time)}? This cannot be undone.`}
        confirmLabel="Yes, Cancel"
        danger
        onConfirm={() => { setConfirmCancel(false); appointmentsService.cancelAndNotify(a.id, actor); }}
        onCancel={() => setConfirmCancel(false)}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Appointment"
        message={`Permanently delete the ${a.serviceName} appointment for ${a.patientName} on ${a.date} at ${formatTime12h(a.time)}? This cannot be undone.`}
        confirmLabel="Yes, Delete"
        danger
        onConfirm={() => { setConfirmDelete(false); appointmentsService.delete(a.id, actor); }}
        onCancel={() => setConfirmDelete(false)}
      />

      {role === "patient" && a.status !== "cancelled" && (
        <AppointmentTimeline status={a.status} paymentStatus={a.paymentStatus} />
      )}
    </div>
  );
}

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
  return (
    <div className="flex flex-col items-start gap-0.5">
      <Badge tone={status === "paid" ? "paid" : "neutral"}>
        {status === "paid" ? "Paid" : "Unpaid"}
      </Badge>
      {status === "paid" && method && <span className="text-[10px] text-gold-100/45">{method}</span>}
    </div>
  );
}
