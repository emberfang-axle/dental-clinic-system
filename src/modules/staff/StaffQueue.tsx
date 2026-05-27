import { useMemo, useState } from "react";
import { Badge, Button } from "../../components/ui";
import { MarkPaymentDialog } from "../../components/ui/MarkPaymentDialog";
import { DataTable } from "../../components/ui/DataTable";
import { hasTreatmentRecord, sortAppointmentsLatestFirst } from "../../shared/helpers";
import { paymentsService } from "../../services/payments";
import { appointmentsService } from "../../services/appointments";
import { useStore } from "../../store/store";
import type { Appointment, AppointmentStatus } from "../../shared/types";
import { DepositForm } from "./DepositForm";

const STATUS_COLUMNS: { key: AppointmentStatus; label: string; short: string }[] = [
  { key: "pending", label: "Pending", short: "Pend." },
  { key: "confirmed", label: "Confirmed", short: "Conf." },
  { key: "in-progress", label: "In Progress", short: "Active" },
  { key: "completed", label: "Completed", short: "Done" },
];

export function StaffQueue() {
  const { appointments, user } = useStore();
  const today = new Date().toISOString().slice(0, 10);
  const [error, setError] = useState<string | null>(null);
  const [deduping, setDeduping] = useState(false);
  const [dedupMsg, setDedupMsg] = useState<string | null>(null);
  const [confirmDedup, setConfirmDedup] = useState(false);

  const queue = useMemo(
    () => appointments.filter((a) => a.status !== "cancelled"),
    [appointments],
  );

  const todayQueue = useMemo(() => queue.filter((a) => a.date === today), [queue, today]);

  async function tryUpdate(id: string, data: Partial<Appointment>) {
    setError(null);
    try {
      await appointmentsService.update(id, data as Partial<Appointment>, user!.name);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Update failed.");
    }
  }

  async function removeDuplicates() {
    setDeduping(true);
    setDedupMsg(null);
    setError(null);
    try {
      const seen = new Map<string, string>();
      const toDelete: string[] = [];
      [...appointments]
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
        .forEach((a) => {
          const key = `${a.patientId}__${a.serviceId}__${a.date}__${a.time}__${a.doctor}`;
          if (seen.has(key)) toDelete.push(a.id);
          else seen.set(key, a.id);
        });
      if (toDelete.length === 0) setDedupMsg("No duplicates found.");
      else {
        await Promise.all(toDelete.map((id) => appointmentsService.delete(id, user!.name)));
        setDedupMsg(`Removed ${toDelete.length} duplicate(s).`);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed.");
    } finally {
      setDeduping(false);
    }
  }

  const columns = [
    {
      key: "patient",
      header: "Patient",
      render: (a: Appointment) => (
        <div>
          <div className="font-medium text-gold-100">{a.patientName}</div>
          {a.patientPhone && <div className="text-xs text-gold-100/40">{a.patientPhone}</div>}
        </div>
      ),
    },
    {
      key: "service",
      header: "Service",
      render: (a: Appointment) => <span className="text-xs text-gold-100/70">{a.serviceName}</span>,
    },
    {
      key: "datetime",
      header: "Date · Time",
      render: (a: Appointment) => (
        <span className="text-xs whitespace-nowrap">
          <span className={a.date === today ? "text-amber-300 font-medium" : "text-gold-100/60"}>
            {a.date === today ? "Today" : a.date}
          </span>
          <span className="text-gold-100/40"> · {a.time}</span>
        </span>
      ),
    },
    {
      key: "doctor",
      header: "Doctor",
      render: (a: Appointment) => <span className="text-xs text-gold-100/60">{a.doctor}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (a: Appointment) => (
        <Badge tone={a.status === "in-progress" ? "confirmed" : (a.status as "pending")}>
          {a.status}
        </Badge>
      ),
    },
    {
      key: "payment",
      header: "Payment",
      render: (a: Appointment) => (
        <span className={`text-xs font-medium ${a.paymentStatus === "paid" ? "text-emerald-400" : "text-amber-300/80"}`}>
          {a.paymentStatus === "paid" ? "Paid" : "Unpaid"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (a: Appointment) => (
        <QueueActions a={a} today={today} onUpdate={tryUpdate} actor={user!.name} />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="glass-strong rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-gold-shine">Appointment Queue</h2>
          <p className="text-xs text-gold-100/45 mt-1">
            {todayQueue.length} today · {queue.length} active · Latest bookings shown first
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setConfirmDedup(true)} disabled={deduping}>
          {deduping ? "Removing…" : "Remove Duplicates"}
        </Button>
        {confirmDedup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDedup(false)} aria-label="Close" />
            <div className="relative glass-strong rounded-2xl p-6 max-w-sm w-full shadow-luxe space-y-4 text-center">
              <h3 className="font-serif text-xl text-gold-shine">Remove duplicate appointments?</h3>
              <p className="text-sm text-gold-100/60">This permanently deletes duplicate rows. This cannot be undone.</p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="danger"
                  onClick={() => {
                    setConfirmDedup(false);
                    void removeDuplicates();
                  }}
                >
                  Yes, Remove
                </Button>
                <Button variant="ghost" onClick={() => setConfirmDedup(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}
        {dedupMsg && <span className="text-xs text-emerald-400 w-full">{dedupMsg}</span>}
        {error && <p className="w-full text-sm text-red-400">{error}</p>}
      </div>

      <div className="grid grid-cols-4 gap-2 max-w-xl">
        {STATUS_COLUMNS.map((col) => {
          const count = queue.filter((a) => a.status === col.key).length;
          return (
            <div key={col.key} className="glass-strong rounded-lg px-2 py-2 text-center" title={col.label}>
              <div className="text-[8px] sm:text-[9px] uppercase tracking-wider text-gold-300/55 truncate">
                <span className="sm:hidden">{col.short}</span>
                <span className="hidden sm:inline">{col.label}</span>
              </div>
              <div className="font-serif text-lg sm:text-xl text-gold-shine leading-tight">{count}</div>
            </div>
          );
        })}
      </div>

      <DepositForm />

      <DataTable
        columns={columns}
        rows={queue}
        rowKey={(a) => a.id}
        sortCompare={sortAppointmentsLatestFirst}
        pageSize={10}
        emptyMessage="No appointments in queue."
      />
    </div>
  );
}

function QueueActions({ a, today, onUpdate, actor }: {
  a: Appointment;
  today: string;
  onUpdate: (id: string, data: Partial<Appointment>) => Promise<void>;
  actor: string;
}) {
  const [pending, setPending] = useState<{ label: string; data: Partial<Appointment> } | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const canMarkPaid = a.status === "completed" && a.paymentStatus !== "paid" && hasTreatmentRecord(a);

  return (
    <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPending(null)} />
          <div className="relative glass-strong rounded-2xl p-6 max-w-sm w-full shadow-luxe space-y-4 text-center">
            <h3 className="font-serif text-xl text-gold-shine">{pending.label}?</h3>
            <p className="text-sm text-gold-100/60">
              {a.patientName} — {a.serviceName}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => {
                  onUpdate(a.id, pending.data);
                  setPending(null);
                }}
              >
                Yes
              </Button>
              <Button variant="ghost" onClick={() => setPending(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      {a.status === "pending" && (
        <Button size="sm" onClick={() => setPending({ label: "Confirm", data: { status: "confirmed" } })}>
          Confirm
        </Button>
      )}
      {a.status === "confirmed" && (
        <Button size="sm" onClick={() => setPending({ label: "Check in", data: { status: "in-progress" } })}>
          Check In
        </Button>
      )}
      {a.status === "in-progress" && (
        <span className="text-[10px] text-gold-100/45 px-1">With dentist</span>
      )}
      {a.status === "completed" && a.paymentStatus !== "paid" && (
        <>
          {!hasTreatmentRecord(a) ? (
            <span className="text-[10px] text-amber-300/80 px-1" title="Dentist must save notes first">
              Awaiting dentist notes
            </span>
          ) : (
            <Button size="sm" onClick={() => setPayOpen(true)}>
              Record Payment
            </Button>
          )}
        </>
      )}
      {payOpen && canMarkPaid && (
        <MarkPaymentDialog
          appointment={a}
          onCancel={() => setPayOpen(false)}
          onConfirm={async (method, note) => {
            await paymentsService.markPaid(a.id, actor, method, note);
            setPayOpen(false);
          }}
        />
      )}
    </div>
  );
}
