import { useState } from "react";
import { Badge, Button, Card } from "../../components/ui";
import { appointmentsService } from "../../services/appointments";
import { useStore } from "../../store/store";
import type { Appointment, AppointmentStatus } from "../../shared/types";
import { DepositForm } from "./DepositForm";

const COLUMNS: { key: AppointmentStatus; label: string }[] = [
  { key: "pending",     label: "Pending" },
  { key: "confirmed",   label: "Confirmed" },
  { key: "in-progress", label: "In Progress" },
  { key: "completed",   label: "Completed" },
];

export function StaffQueue() {
  const { appointments, user } = useStore();
  const today = new Date().toISOString().slice(0, 10);
  const [error, setError]     = useState<string | null>(null);
  const [deduping, setDeduping] = useState(false);
  const [dedupMsg, setDedupMsg] = useState<string | null>(null);

  const queue = appointments
    .filter((a) => a.status !== "cancelled")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {COLUMNS.map((col) => {
          const count = queue.filter((a) => a.status === col.key).length;
          return (
            <div key={col.key} className="glass-strong rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-wider text-gold-300/55 mb-1">{col.label}</div>
              <div className="font-serif text-2xl text-gold-shine">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Kanban columns */}
      <div className="grid xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const list = queue.filter((a) => a.status === col.key);
          return (
            <div key={col.key} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h4 className="font-medium text-gold-100 text-sm">{col.label}</h4>
                <Badge tone={col.key as any}>{list.length}</Badge>
              </div>
              {list.length === 0 && (
                <div className="rounded-xl border border-gold-500/10 bg-ink-900/30 p-4 text-xs text-gold-100/35 text-center">
                  No patients
                </div>
              )}
              {list.map((a) => (
                <QueueCard key={a.id} a={a} today={today} onUpdate={tryUpdate} actor={user!.name} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
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
        {a.emergency && <Badge tone="emergency">Priority</Badge>}
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
  const [imgOpen, setImgOpen] = useState(false);

  if (a.paymentStatus === "paid") {
    return <p className="text-xs text-emerald-400">✓ Paid via {a.paymentMethod === "gcash" ? "GCash" : "Cash"}</p>;
  }

  // Payment can only be collected after treatment is done
  if (a.status !== "completed") {
    return <p className="text-xs text-gold-100/35 italic">Payment available after treatment is completed.</p>;
  }

  // GCash receipt uploaded by patient — staff reviews and confirms
  if (a.paymentStatus === "pending_verification") {
    return (
      <div className="space-y-2">
        <p className="text-xs text-blue-300 font-medium">⏳ GCash receipt submitted — review and confirm</p>
        {a.paymentScreenshotUrl && (
          <div>
            <button
              type="button"
              onClick={() => setImgOpen(true)}
              className="text-xs text-gold-400 underline hover:text-gold-200 transition"
            >
              View receipt
            </button>
            {imgOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                onClick={() => setImgOpen(false)}
              >
                <img
                  src={a.paymentScreenshotUrl}
                  alt="GCash receipt"
                  className="max-w-[90vw] max-h-[85vh] rounded-xl border border-gold-500/30 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </div>
        )}
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={() => onUpdate(a.id, { paymentMethod: "gcash", paymentStatus: "paid" })}>
            ✓ Mark Paid (GCash)
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onUpdate(a.id, { paymentStatus: "unpaid" })}>
            Reject
          </Button>
        </div>
      </div>
    );
  }

  if (a.paymentStatus === "partial_paid") {
    return (
      <div className="space-y-1.5">
        <p className="text-xs text-yellow-400">
          Deposit: ₱{(a.depositAmount ?? 0).toLocaleString()} · Balance: ₱{(a.price - (a.depositAmount ?? 0)).toLocaleString()}
        </p>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={() => onUpdate(a.id, { paymentMethod: "cash", paymentStatus: "paid" })}>Cash — Paid</Button>
          <Button size="sm" variant="subtle" onClick={() => onUpdate(a.id, { paymentMethod: "gcash", paymentStatus: "paid" })}>GCash — Paid</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-gold-100/55">Confirm payment received:</p>
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" onClick={() => onUpdate(a.id, { paymentMethod: "cash", paymentStatus: "paid" })}>
          Cash — Mark Paid
        </Button>
        <Button size="sm" variant="subtle" onClick={() => onUpdate(a.id, { paymentMethod: "gcash", paymentStatus: "paid" })}>
          GCash — Mark Paid
        </Button>
      </div>
      <DepositForm appointmentId={a.id} price={a.price} actor={actor} onDone={() => {}} />
    </div>
  );
}
