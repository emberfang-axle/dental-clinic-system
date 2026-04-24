import { useState } from "react";

// Replace with your actual UI components
import { Badge, Button, Card, Input, Select } from "../../components/ui";

import { appointmentsService } from "../../services/appointments";
import { paymentsService } from "../../services/payments";

// Replace with your actual store hook
import { useStore } from "../../store/store";

// Replace with your actual types
import type { Appointment, AppointmentStatus, PaymentStatus, Role } from "../../shared/types";

/* =========================
   MAIN LIST COMPONENT
========================= */
export function AppointmentsList({
  role,
  patientOnly,
}: {
  role: Role;
  patientOnly?: boolean;
}) {
  const { appointments = [], user } = useStore() || {}; // ✅ safe fallback

  const [filter, setFilter] = useState<"all" | AppointmentStatus>("all");
  const [search, setSearch] = useState("");

  if (!appointments || !Array.isArray(appointments)) {
    return <Card>Loading appointments...</Card>;
  }

  let list = patientOnly && user
    ? appointments.filter((a) => a.patientId === user.id)
    : appointments;

  if (filter !== "all") {
    list = list.filter((a) => a.status === filter);
  }

  if (search) {
    list = list.filter((a) =>
      `${a.patientName}${a.serviceName}${a.gcashRef || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }

  // sort latest first
  list = [...list].sort((a, b) =>
    (b.date + b.time).localeCompare(a.date + a.time)
  );

  return (
    <div className="space-y-4">
      {/* FILTER BAR */}
      <Card className="!p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Input
            placeholder="Search patient, service, or reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />

          <Select
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value as "all" | AppointmentStatus)
            }
            className="max-w-[180px]"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>

          <span className="text-xs text-gold-100/50 ml-auto">
            {list.length} appointment(s)
          </span>
        </div>
      </Card>

      {/* TABLE */}
      <Card className="!p-0 overflow-hidden">
        <AppointmentTable appointments={list} role={role} />
      </Card>
    </div>
  );
}

/* =========================
   TABLE
========================= */
export function AppointmentTable({
  appointments,
  role,
  compact,
}: {
  appointments: Appointment[];
  role: Role;
  compact?: boolean;
}) {
  const { user } = useStore() || {};

  if (!appointments || !appointments.length) {
    return (
      <div className="p-8 text-center text-gold-100/50">
        No appointments found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[760px]">
        <thead className="bg-ink-800/60 text-left text-xs uppercase tracking-wider text-gold-200/70">
          <tr>
            {!compact && <th className="px-4 py-3">Patient</th>}
            <th className="px-4 py-3">Service</th>
            <th className="px-4 py-3">Date / Time</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Payment</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {appointments.map((a) => (
            <tr
              key={a.id}
              className="border-t border-gold-500/10 hover:bg-gold-500/5"
            >
              {!compact && (
                <td className="px-4 py-3">
                  {a.emergency && <Badge tone="emergency">Priority</Badge>}
                  <div>{a.patientName}</div>
                </td>
              )}

              <td className="px-4 py-3">{a.serviceName}</td>

              <td className="px-4 py-3">
                {a.date}
                <br />
                <span className="text-xs text-gold-100/50">
                  {a.time}
                </span>
              </td>

              <td className="px-4 py-3 font-mono">
                ₱{a.price?.toLocaleString?.() ?? "0"}
              </td>

              <td className="px-4 py-3">
                <Badge tone={a.status}>{a.status}</Badge>
              </td>

              <td className="px-4 py-3">
                <PaymentBadge
                  status={a.paymentStatus}
                  method={a.paymentMethod === "gcash" ? "GCash" : "Cash"}
                />
              </td>

              <td className="px-4 py-3 text-right">
                <ApptActions
                  a={a}
                  role={role}
                  self={a.patientId === user?.id}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* =========================
   PAYMENT BADGE
========================= */
export function PaymentBadge({
  status,
  method,
}: {
  status: PaymentStatus;
  method: string;
}) {
  const map: Record<
    PaymentStatus,
    { tone: any; text: string }
  > = {
    unpaid: { tone: "neutral", text: "Unpaid" },
    pending_verification: { tone: "pending", text: "Pending" },
    verified: { tone: "confirmed", text: "Verified" },
    paid: { tone: "paid", text: "Paid" },
  };

  const s = map[status] || { tone: "neutral", text: "Unknown" };

  return (
    <div>
      <Badge tone={s.tone}>{s.text}</Badge>
      <div className="text-xs opacity-60">{method}</div>
    </div>
  );
}

/* =========================
   ACTION BUTTONS
========================= */
function ApptActions({
  a,
  role,
  self,
}: {
  a: Appointment;
  role: Role;
  self: boolean;
}) {
  const { user } = useStore() || {};
  const actor = user?.name || "System";

  const update = (data: Partial<Appointment>) => {
    if (appointmentsService?.update) {
      appointmentsService.update(a.id, data, actor);
    }
  };

  const verify = () => {
    if (paymentsService?.verify) {
      paymentsService.verify(a.id, actor);
    }
  };

  const buttons: React.ReactNode[] = [];

  // DOCTOR
  if (role === "doctor") {
    if (a.status === "pending")
      buttons.push(<Button size="sm" onClick={() => update({ status: "confirmed" })}>Confirm</Button>);

    if (a.status === "confirmed")
      buttons.push(<Button size="sm" onClick={() => update({ status: "completed" })}>Complete</Button>);

    if (a.paymentStatus === "pending_verification")
      buttons.push(<Button size="sm" onClick={verify}>Verify</Button>);

    if (a.paymentStatus === "verified")
      buttons.push(<Button size="sm" onClick={() => update({ paymentStatus: "paid" })}>Mark Paid</Button>);
  }

  // STAFF
  if (role === "staff") {
    if (a.paymentStatus === "pending_verification")
      buttons.push(<Button size="sm" onClick={verify}>Verify</Button>);
  }

  // PATIENT
  if (role === "patient" && self && a.status === "pending") {
    buttons.push(
      <Button size="sm" onClick={() => update({ status: "cancelled" })}>
        Cancel
      </Button>
    );
  }

  return <div className="flex gap-2 justify-end">{buttons}</div>;
}
