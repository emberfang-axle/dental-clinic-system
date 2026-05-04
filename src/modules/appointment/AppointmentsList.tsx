import { useState } from "react";
import { Badge, Button, Card, Input, Select } from "../../components/ui";
import { appointmentsService } from "../../services/appointments";
import { paymentsService } from "../../services/payments";
import { useStore } from "../../store/store";
import { BOOKING } from "../../shared/constants";
import type { Appointment, AppointmentStatus, PaymentStatus, Role } from "../../shared/types";

const PAGE_SIZE = 10;

export function AppointmentsList({ role, patientOnly }: { role: Role; patientOnly?: boolean }) {
  const { appointments = [], user } = useStore();
  const [filter, setFilter] = useState<"all" | AppointmentStatus>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  let list = patientOnly && user
    ? appointments.filter((a) => a.patientId === user.id)
    : [...appointments];

  if (filter !== "all") list = list.filter((a) => a.status === filter);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((a) => `${a.patientName}${a.serviceName}${a.gcashRef || ""}`.toLowerCase().includes(q));
  }
  list = list.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = list.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function onFilterChange(val: string) { setFilter(val as any); setPage(1); }
  function onSearchChange(val: string) { setSearch(val); setPage(1); }

  return (
    <div className="space-y-4">
      <Card className="!p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input placeholder="Search patient, service…" value={search} onChange={(e) => onSearchChange(e.target.value)} className="max-w-xs" />
          <Select value={filter} onChange={(e) => onFilterChange(e.target.value)} className="max-w-[160px]">
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

      {paged.length === 0 && <Card><p className="text-sm text-gold-100/50 text-center py-4">No appointments found.</p></Card>}

      <div className="space-y-3">
        {paged.map((a) => (
          <AppointmentCard key={a.id} a={a} role={role} isSelf={a.patientId === user?.id} actor={user?.name || "system"} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button size="sm" variant="ghost" disabled={safePage === 1} onClick={() => setPage(safePage - 1)}>← Prev</Button>
          <span className="text-xs text-gold-100/50">{safePage} / {totalPages}</span>
          <Button size="sm" variant="ghost" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)}>Next →</Button>
        </div>
      )}
    </div>
  );
}

function AppointmentCard({ a, role, isSelf, actor }: { a: Appointment; role: Role; isSelf: boolean; actor: string }) {
  const { appointments } = useStore();
  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState(a.date);
  const [newTime, setNewTime] = useState(a.time);
  const [rescheduling2, setRescheduling2] = useState(false);

  const update = (data: Partial<Appointment>) => appointmentsService.update(a.id, data, actor);

  const takenTimes = appointments
    .filter((x) => x.date === newDate && x.id !== a.id && x.status !== "cancelled")
    .map((x) => x.time);

  async function confirmReschedule() {
    if (!newDate || !newTime) return;
    setRescheduling2(true);
    await appointmentsService.rescheduleAndNotify(a.id, newDate, newTime, actor);
    setRescheduling(false);
    setRescheduling2(false);
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {role !== "patient" && <p className="font-semibold text-gold-100">{a.patientName}</p>}
          <p className="text-gold-100/80 font-medium">{a.serviceName}</p>
          <p className="text-sm text-gold-100/55 mt-0.5">{a.date} · {a.time} · {a.doctor}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {reminderBadge && (a.status === "pending" || a.status === "confirmed") && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${reminderBadge === "Today" ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"}`}>
              {reminderBadge}
            </span>
          )}
          {a.emergency && <Badge tone="emergency">Priority</Badge>}
          <Badge tone={a.status === "in-progress" ? "confirmed" : a.status === "no-show" ? "cancelled" : a.status === "rescheduled" ? "pending" : a.status as any}>{a.status}</Badge>
          <PaymentBadge status={a.paymentStatus} method={a.paymentMethod === "gcash" ? "GCash" : "Cash"} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {role === "doctor" && a.status === "pending" && (
          <Button size="sm" onClick={() => update({ status: "confirmed" })}>Confirm</Button>
        )}
        {role === "doctor" && a.status === "confirmed" && (
          <Button size="sm" onClick={() => update({ status: "in-progress" })}>Start</Button>
        )}
        {role === "doctor" && a.status === "in-progress" && (
          <Button size="sm" onClick={() => update({ status: "completed" })}>Complete</Button>
        )}
        {role === "doctor" && (a.status === "confirmed" || a.status === "in-progress") && (
          <Button size="sm" variant="ghost" onClick={() => update({ status: "no-show" })}>No Show</Button>
        )}
        {(role === "doctor" || role === "staff") && a.paymentStatus === "pending_verification" && (
          <Button size="sm" onClick={() => paymentsService.verify(a.id, actor)}>Verify Payment</Button>
        )}
        {role === "staff" && a.status === "pending" && (
          <Button size="sm" onClick={() => update({ status: "confirmed" })}>Confirm</Button>
        )}
        {role === "patient" && isSelf && (a.status === "pending" || a.status === "confirmed") && (
          <Button size="sm" variant="outline" onClick={() => setRescheduling((v) => !v)}>
            {rescheduling ? "Cancel Reschedule" : "Reschedule"}
          </Button>
        )}
        {role === "patient" && isSelf && (a.status === "pending" || a.status === "confirmed") && (
          <Button size="sm" variant="ghost" onClick={() => appointmentsService.cancelAndNotify(a.id, actor)}>Cancel Appointment</Button>
        )}
      </div>

      {rescheduling && (
        <div className="mt-4 p-4 rounded-xl border border-gold-500/20 bg-ink-900/50 space-y-3">
          <p className="text-xs uppercase tracking-wider text-gold-300/60">Pick a new date & time</p>
          <div className="flex flex-wrap gap-3">
            <Input type="date" value={newDate} min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => { setNewDate(e.target.value); setNewTime(""); }}
              className="max-w-[160px]" />
            <div className="flex flex-wrap gap-2">
              {BOOKING.TIME_SLOTS.map((t) => {
                const taken = takenTimes.includes(t);
                return (
                  <button key={t} disabled={taken} onClick={() => setNewTime(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition ${newTime === t ? "bg-gold-gradient text-ink-950 border-gold-400" : taken ? "border-red-500/30 text-red-400/40 line-through cursor-not-allowed" : "border-gold-500/30 text-gold-100/80 hover:border-gold-400"}`}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          <Button size="sm" disabled={!newTime || rescheduling2} onClick={confirmReschedule}>
            {rescheduling2 ? "Saving…" : "Confirm Reschedule"}
          </Button>
        </div>
      )}
    </Card>
  );
}

export function PaymentBadge({ status, method }: { status: PaymentStatus; method: string }) {
  const map: Record<PaymentStatus, { tone: any; text: string }> = {
    unpaid:               { tone: "neutral",   text: "Unpaid" },
    partial_paid:         { tone: "pending",   text: "Partial" },
    pending_verification: { tone: "pending",   text: "Pending" },
    verified:             { tone: "confirmed", text: "Verified" },
    paid:                 { tone: "paid",      text: "Paid" },
  };
  const s = map[status] || { tone: "neutral", text: status };
  return (
    <div className="flex flex-col items-start gap-0.5">
      <Badge tone={s.tone}>{s.text}</Badge>
      <span className="text-[10px] text-gold-100/45">{method}</span>
    </div>
  );
}
