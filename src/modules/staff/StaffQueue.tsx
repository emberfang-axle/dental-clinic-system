import { useState } from "react";
import { Badge, Button, Card } from "../../components/ui";
import { appointmentsService } from "../../services/appointments";
import { useStore, getSnapshot } from "../../store/store";
import type { AppointmentStatus } from "../../shared/types";
import { DepositForm } from "./DepositForm";

export function StaffQueue() {
  const { appointments, user, settings } = useStore();
  const today = new Date().toISOString().slice(0, 10);
  const [error, setError] = useState<string | null>(null);
  const [deduping, setDeduping] = useState(false);
  const [dedupMsg, setDedupMsg] = useState<string | null>(null);

  const tryUpdate = async (id: string, partial: Partial<Parameters<typeof appointmentsService.update>[1]>) => {
    setError(null);
    try { await appointmentsService.update(id, partial as any, user!.name); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Update failed."); }
  };

  const removeDuplicates = async () => {
    setDeduping(true); setDedupMsg(null); setError(null);
    try {
      const { appointments: all } = getSnapshot();
      const groups: Record<string, typeof all> = {};
      all.forEach((a) => {
        const key = `${a.patientId}__${a.serviceId}__${a.date}__${a.time}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(a);
      });
      const toDelete: string[] = [];
      Object.values(groups).forEach((group) => {
        if (group.length <= 1) return;
        [...group].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")).slice(1).forEach((a) => toDelete.push(a.id));
      });
      if (toDelete.length === 0) { setDedupMsg("No duplicates found."); }
      else {
        await Promise.all(toDelete.map((id) => appointmentsService.delete(id, user!.name)));
        setDedupMsg(`Removed ${toDelete.length} duplicate(s).`);
      }
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to remove duplicates."); }
    finally { setDeduping(false); }
  };

  const queue = appointments
    .filter((a) => a.status !== "cancelled" && (a.date >= today || a.status === "confirmed" || a.status === "completed"))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const todayCount = queue.filter((a) => a.date === today).length;
  const columns: { key: AppointmentStatus; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "confirmed", label: "Confirmed" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Appointment handling</div>
            <h3 className="font-serif text-2xl text-gold-gradient mt-1">Today's Clinic Queue</h3>
          </div>
          <Badge tone="neutral">{todayCount} today · {queue.length} upcoming</Badge>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button size="sm" variant="ghost" onClick={removeDuplicates} disabled={deduping}>
            {deduping ? "Removing…" : "🧹 Remove Duplicate Appointments"}
          </Button>
          {dedupMsg && <span className="text-xs text-emerald-400">{dedupMsg}</span>}
        </div>
        {error && <p className="mt-2 text-sm text-red-400">⚠ {error}</p>}
      </Card>

      <div className="grid xl:grid-cols-3 gap-4">
        {columns.map((col) => {
          const list = queue.filter((a) => a.status === col.key);
          return (
            <Card key={col.key}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <h4 className="font-serif text-xl text-gold-100">{col.label}</h4>
                <Badge tone={col.key as any}>{list.length}</Badge>
              </div>
              <div className="space-y-3">
                {list.length === 0 && <p className="text-sm text-gold-100/45">No patients in this stage.</p>}
                {list.map((a) => (
                  <div key={a.id} className="rounded-xl border border-gold-500/15 bg-ink-900/55 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-gold-100">{a.patientName}</div>
                        <div className="text-xs text-gold-100/50">{a.serviceName} · {a.date === today ? "Today" : a.date} · {a.time}</div>
                        <div className="text-xs text-gold-300/60 font-mono mt-0.5">₱{a.price.toLocaleString()}</div>
                      </div>
                      {a.emergency ? <Badge tone="emergency">Emergency</Badge> : <Badge tone="neutral">Regular</Badge>}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {a.status === "pending" && (
                        <Button size="sm" onClick={() => void tryUpdate(a.id, { status: "confirmed" })}>Confirm</Button>
                      )}
                      {a.status === "confirmed" && (
                        <Button size="sm" variant="subtle" onClick={() => void tryUpdate(a.id, { status: "completed" })}>Complete</Button>
                      )}
                      {a.status === "completed" && a.paymentStatus === "unpaid" && (
                        <div className="w-full space-y-2">
                          <p className="text-xs text-gold-100/60">Create bill — select payment method:</p>
                          {settings.gcashNumber && (
                            <p className="text-xs text-gold-300/70">Clinic GCash: <span className="font-mono font-semibold">{settings.gcashNumber}</span></p>
                          )}
                          <div className="flex gap-2 flex-wrap">
                            <Button size="sm" onClick={() => void tryUpdate(a.id, { paymentMethod: "cash", paymentStatus: "paid" })}>💵 Cash — Mark Paid</Button>
                            <Button size="sm" variant="subtle" onClick={() => void tryUpdate(a.id, { paymentMethod: "gcash", paymentStatus: "pending_verification" })}>📱 GCash — Await Patient</Button>
                          </div>
                          <DepositForm appointmentId={a.id} price={a.price} actor={user!.name} onDone={() => {}} />
                        </div>
                      )}
                      {a.status === "completed" && a.paymentStatus === "partial_paid" && (
                        <div className="w-full space-y-2">
                          <p className="text-xs text-yellow-400">💰 Deposit: ₱{(a.depositAmount ?? 0).toLocaleString()} — Balance: ₱{(a.price - (a.depositAmount ?? 0)).toLocaleString()}</p>
                          <Button size="sm" onClick={() => void tryUpdate(a.id, { paymentStatus: "paid" })}>Mark Balance Paid</Button>
                        </div>
                      )}
                      {a.status === "completed" && a.paymentStatus === "pending_verification" && <span className="text-xs text-yellow-400">⏳ Awaiting patient GCash reference</span>}
                      {a.status === "completed" && a.paymentStatus === "verified" && <span className="text-xs text-blue-300">✓ GCash verified — ready to post</span>}
                      {a.status === "completed" && a.paymentStatus === "paid" && <span className="text-xs text-emerald-400">✓ Paid via {a.paymentMethod}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
