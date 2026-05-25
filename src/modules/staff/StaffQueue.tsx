import { useState } from "react";
import { Badge, Button, Card } from "../../components/ui";
import { appointmentsService } from "../../services/appointments";
import { useStore } from "../../store/store";
import type { Appointment, AppointmentStatus } from "../../shared/types";
import { DepositForm } from "./DepositForm";

const COLUMNS: { key: AppointmentStatus; label: string; short: string }[] = [
  { key: "pending",     label: "Pending",     short: "Pending" },
  { key: "confirmed",   label: "Confirmed",   short: "Confirmed" },
  { key: "in-progress", label: "In Progress", short: "In Progress" },
  { key: "completed",   label: "Completed",   short: "Completed" },
];

export function StaffQueue() {
  const { appointments, user } = useStore();
  const today = new Date().toISOString().slice(0, 10);
  const [error, setError]     = useState<string | null>(null);
  const [deduping, setDeduping] = useState(false);
  const [dedupMsg, setDedupMsg] = useState<string | null>(null);

  // FIFO: oldest createdAt first (first booked = first served)
  const queue = appointments
    .filter((a) => a.status !== "cancelled")
    .sort((a, b) => (a.createdAt ?? a.date + a.time).localeCompare(b.createdAt ?? b.date + b.time));

  const todayQueue = queue.filter((a) => a.date === today);

  async function tryUpdate(id: string, data: Partial<Appointment>) {
    setError(null);
    try { await appointmentsService.update(id, data as any, user!.name); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Update failed."); }
  }

  async function removeDuplicates() {
    setDeduping(true); setDedupMsg(null); setError(null);
    try {
      const seen = new Map<string, string>();
      const toDelete: string[] = [];
      [...appointments]
        .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
        .forEach((a) => {
          const key = `${a.patientId}__${a.serviceId}__${a.date}__${a.time}`;
          if (seen.has(key)) toDelete.push(a.id);
          else seen.set(key, a.id);
        });
      if (toDelete.length === 0) { setDedupMsg("No duplicates found."); }
      else {
        await Promise.all(toDelete.map((id) => appointmentsService.delete(id, user!.name)));
        setDedupMsg(`Removed ${toDelete.length} duplicate(s).`);
      }
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed."); }
    finally { setDeduping(false); }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-strong rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-gold-shine">Daily Queue</h2>
          <p className="text-xs text-gold-100/45 mt-1">
            {todayQueue.length} appointment{todayQueue.length !== 1 ? "s" : ""} today · {queue.length} total
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button size="sm" variant="ghost" onClick={removeDuplicates} disabled={deduping}>
            {deduping ? "Removing…" : "Remove Duplicates"}
          </Button>
          {dedupMsg && <span className="text-xs text-emerald-400">{dedupMsg}</span>}
        </div>
        {error && <p className="w-full text-sm text-red-400">{error}</p>}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        {COLUMNS.map((col) => {
          const count = queue.filter((a) => a.status === col.key).length;
          return (
            <div key={col.key} className="glass-strong rounded-xl p-2.5 text-center">
              <div className="text-[9px] uppercase tracking-wider text-gold-300/55 mb-0.5 truncate">{col.short}</div>
              <div className="font-serif text-xl text-gold-shine">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Queue as table */}
      <div className="glass-strong rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="border-b border-gold-500/15 bg-ink-900/60">
              <tr className="text-left text-[10px] uppercase tracking-wider text-gold-300/60">
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Date · Time</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {queue.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gold-100/40">No appointments in queue.</td></tr>
              )}
              {queue.map((a) => (
                <tr key={a.id} className="border-b border-gold-500/10 hover:bg-gold-500/5 transition">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gold-100">{a.patientName}</div>
                    {a.patientPhone && <div className="text-xs text-gold-100/40">{a.patientPhone}</div>}
                  </td>
                  <td className="px-4 py-3 text-gold-100/70 text-xs">{a.serviceName}</td>
                  <td className="px-4 py-3 text-xs text-gold-100/60 whitespace-nowrap">
                    <span className={a.date === today ? "text-amber-300 font-medium" : ""}>{a.date === today ? "Today" : a.date}</span>
                    <span className="text-gold-100/40"> · {a.time}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={a.status === "in-progress" ? "confirmed" : a.status as any}>
                      {a.status === "in-progress" ? "In Prog." : a.status === "confirmed" ? "Confirmed" : a.status === "pending" ? "Pending" : a.status === "completed" ? "Done" : a.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${a.paymentStatus === "paid" ? "text-emerald-400" : "text-gold-100/50"}`}>
                      {a.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <QueueActions a={a} today={today} onUpdate={tryUpdate} actor={user!.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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

  return (
    <>
      {pending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPending(null)} />
          <div className="relative glass-strong rounded-2xl p-6 max-w-sm w-full shadow-luxe space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-2xl">✓</div>
            <h3 className="font-serif text-xl text-gold-shine">{pending.label} this appointment?</h3>
            <p className="text-sm text-gold-100/60">
              <span className="text-gold-200 font-medium">{a.patientName}</span> — {a.serviceName}<br />
              <span className="text-gold-100/50">{a.date === today ? "Today" : a.date} at {a.time}</span>
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => { onUpdate(a.id, pending.data); setPending(null); }}>Yes, Confirm</Button>
              <Button variant="ghost" onClick={() => setPending(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {a.status === "pending" && (
          <Button size="sm" onClick={() => setPending({ label: "Confirm", data: { status: "confirmed" } })}>Confirm</Button>
        )}
        {a.status === "confirmed" && (
          <Button size="sm" onClick={() => setPending({ label: "Check In", data: { status: "in-progress" } })}>Check In</Button>
        )}
        {a.status === "in-progress" && (
          <Button size="sm" onClick={() => setPending({ label: "Complete", data: { status: "completed" } })}>Complete</Button>
        )}
        {a.status === "completed" && a.paymentStatus !== "paid" && (
          <Button size="sm" onClick={() => setPending({ label: "Mark as Paid", data: { paymentMethod: "cash", paymentStatus: "paid" } })}>Mark as Paid</Button>
        )}
      </div>
    </>
  );
}

function QueueCard({ a, today, onUpdate, actor }: {
  a: Appointment;
  today: string;
  onUpdate: (id: string, data: Partial<Appointment>) => Promise<void>;
  actor: string;
}) {
  return (
    <Card className="space-y-3">
      {/* Patient info */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gold-100 text-sm truncate">{a.patientName}</p>
          <p className="text-xs text-gold-100/50 mt-0.5">{a.serviceName}</p>
          <p className="text-xs text-gold-100/40">{a.date === today ? "Today" : a.date} · {a.time}</p>
          <p className="text-xs text-gold-300/60 font-mono mt-0.5">₱{a.price.toLocaleString()}</p>
          {a.patientPhone && (
            <a href={`tel:${a.patientPhone}`} className="text-xs text-gold-400/70 hover:text-gold-300 transition mt-0.5 block">
              {a.patientPhone}
            </a>
          )}
        </div>
      </div>

      {/* Status progression buttons */}
      <div className="flex flex-wrap gap-2">
        {a.status === "pending" && (
          <Button size="sm" onClick={() => onUpdate(a.id, { status: "confirmed" })}>Confirm</Button>
        )}
        {a.status === "confirmed" && (
          <Button size="sm" onClick={() => onUpdate(a.id, { status: "in-progress" })}>Check In</Button>
        )}
        {a.status === "in-progress" && (
          <Button size="sm" onClick={() => onUpdate(a.id, { status: "completed" })}>Mark Completed</Button>
        )}
      </div>

      {/* Payment — available at any stage once unpaid */}
      <PaymentActions a={a} onUpdate={onUpdate} actor={actor} />
    </Card>
  );
}

function PaymentActions({ a, onUpdate, actor }: {
  a: Appointment;
  onUpdate: (id: string, data: Partial<Appointment>) => Promise<void>;
  actor: string;
}) {
  if (a.paymentStatus === "paid") {
    return <p className="text-xs text-emerald-400">Paid — Cash</p>;
  }
  if (a.status !== "completed") {
    return <p className="text-xs text-gold-100/35 italic">Payment available after treatment is completed.</p>;
  }
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-gold-100/55">Confirm cash payment received:</p>
      <Button size="sm" onClick={() => onUpdate(a.id, { paymentMethod: "cash", paymentStatus: "paid" })}>
        Mark as Paid
      </Button>
    </div>
  );
}
