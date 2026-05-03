import { useState } from "react";
import { Badge, Button, Card, Input, Select } from "../../components/ui";
import { appointmentsService } from "../../services/appointments";
import { paymentsService } from "../../services/payments";
import { notificationsService } from "../../services/notifications";
import { useStore } from "../../store/store";
import { getSnapshot } from "../../store/store";
import type { Appointment, AppointmentStatus, PaymentStatus, Role } from "../../shared/types";

export function AppointmentsList({ role, patientOnly }: { role: Role; patientOnly?: boolean }) {
  const { appointments = [], user } = useStore();
  const [filter, setFilter] = useState<"all" | AppointmentStatus>("all");
  const [search, setSearch] = useState("");

  let list = patientOnly && user
    ? appointments.filter((a) => a.patientId === user.id)
    : [...appointments];

  if (filter !== "all") list = list.filter((a) => a.status === filter);
  if (search) {
    const q = search.toLowerCase();
    list = list.filter((a) => `${a.patientName}${a.serviceName}${a.gcashRef || ""}`.toLowerCase().includes(q));
  }
  list = list.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  return (
    <div className="space-y-4">
      <Card className="!p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input placeholder="Search patient, service…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <Select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="max-w-[160px]">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <span className="text-xs text-gold-100/50 ml-auto">{list.length} appointment(s)</span>
        </div>
      </Card>

      {list.length === 0 && <Card><p className="text-sm text-gold-100/50 text-center py-4">No appointments found.</p></Card>}

      <div className="space-y-3">
        {list.map((a) => (
          <AppointmentCard key={a.id} a={a} role={role} isSelf={a.patientId === user?.id} actor={user?.name || "system"} />
        ))}
      </div>
    </div>
  );
}

function AppointmentCard({ a, role, isSelf, actor }: { a: Appointment; role: Role; isSelf: boolean; actor: string }) {
  const update = (data: Partial<Appointment>) => appointmentsService.update(a.id, data, actor);

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {role !== "patient" && <p className="font-semibold text-gold-100">{a.patientName}</p>}
          <p className="text-gold-100/80 font-medium">{a.serviceName}</p>
          <p className="text-sm text-gold-100/55 mt-0.5">{a.date} · {a.time} · {a.doctor}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {a.emergency && <Badge tone="emergency">Priority</Badge>}
          <Badge tone={a.status as any}>{a.status}</Badge>
          <PaymentBadge status={a.paymentStatus} method={a.paymentMethod === "gcash" ? "GCash" : "Cash"} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {role === "doctor" && a.status === "pending" && (
          <Button size="sm" onClick={() => update({ status: "confirmed" })}>Confirm</Button>
        )}
        {role === "doctor" && a.status === "confirmed" && (
          <Button size="sm" onClick={() => update({ status: "completed" })}>Complete</Button>
        )}
        {(role === "doctor" || role === "staff") && a.paymentStatus === "pending_verification" && (
          <Button size="sm" onClick={() => paymentsService.verify(a.id, actor)}>Verify Payment</Button>
        )}
        {role === "staff" && a.status === "pending" && (
          <Button size="sm" onClick={() => update({ status: "confirmed" })}>Confirm</Button>
        )}
        {role === "patient" && isSelf && (a.status === "pending" || a.status === "confirmed") && (
          <Button size="sm" variant="ghost" onClick={async () => {
            await update({ status: "cancelled" });
            const { users } = getSnapshot();
            const targets = users.filter((u) => u.role === "staff" || u.role === "doctor");
            await Promise.all(targets.map((u) =>
              notificationsService.notify(u.id, "Appointment Cancelled",
                `${a.patientName} cancelled their ${a.serviceName} appointment on ${a.date} at ${a.time}.`, "appointment")
            ));
          }}>
            Cancel
          </Button>
        )}
      </div>
    </Card>
  );
}

export function PaymentBadge({ status, method }: { status: PaymentStatus; method: string }) {
  const map: Record<PaymentStatus, { tone: any; text: string }> = {
    unpaid:               { tone: "neutral",   text: "Unpaid" },
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
