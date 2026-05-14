import { useCallback, useState } from "react";
import { Badge, Button, Card, Input } from "../../components/ui";
import { appointmentsService } from "../../services/appointments";
import { useStore } from "../../store/store";
import { roleLabel } from "../../shared/helpers";
import { downloadInvoice } from "../../utils/invoice";
import type { Role, Appointment } from "../../shared/types";

function usePaymentAction() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const run = useCallback(async (key: string, fn: () => Promise<void>) => {
    setBusy(key); setError("");
    try { await fn(); }
    catch (e: any) { setError(e.message || "Action failed."); }
    finally { setBusy(null); }
  }, []);

  return { busy, error, run };
}

export function PaymentsPage({ role }: { role: Role }) {
  const { appointments, user } = useStore() as {
    appointments: Appointment[];
    user: { id: string; name: string; role: Role } | null;
  };
  const [search, setSearch] = useState("");
  const { busy, error, run } = usePaymentAction();

  if (!user) return null;

  const q = search.toLowerCase();
  const match = (a: Appointment) =>
    !q || `${a.patientName}${a.serviceName}${a.receiptNumber ?? ""}`.toLowerCase().includes(q);

  const pendingVerification = appointments.filter((a) => a.paymentStatus === "pending_verification" && match(a));
  const verified    = appointments.filter((a) => a.paymentStatus === "verified" && match(a));
  const unpaid      = appointments.filter((a) => a.status === "completed" && a.paymentStatus === "unpaid" && match(a));
  const partialPaid = appointments.filter((a) => a.paymentStatus === "partial_paid" && match(a));
  const paid        = appointments.filter((a) => a.paymentStatus === "paid" && match(a));

  const markPaid = (id: string, method: "cash" | "gcash") =>
    run(`paid-${id}-${method}`, () => appointmentsService.update(id, { paymentStatus: "paid", paymentMethod: method }, user.name));

  const verify = (id: string) =>
    run(`verify-${id}`, () => appointmentsService.update(id, { paymentStatus: "verified" }, user.name));

  const reject = (id: string) =>
    run(`reject-${id}`, () => appointmentsService.update(id, { paymentStatus: "unpaid" }, user.name));

  const markPaidFromVerified = (id: string) =>
    run(`vpaid-${id}`, () => appointmentsService.update(id, { paymentStatus: "paid" }, user.name));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Input placeholder="Search patient, service, receipt…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <span className="text-xs text-gold-100/40 ml-auto">{roleLabel(role)}</span>
      </div>

      {error && (
        <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* GCash pending verification */}
      {pendingVerification.length > 0 && (
        <Card>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="font-serif text-xl text-gold-gradient">GCash — Pending Verification</h3>
            <Badge tone="pending">{pendingVerification.length}</Badge>
          </div>
          <div className="space-y-3">
            {pendingVerification.map((a) => (
              <div key={a.id} className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-gold-100">{a.patientName}</div>
                  <div className="text-sm text-gold-100/60">{a.serviceName} · {a.date}</div>
                  <div className="text-xs text-gold-300/70 mt-1">Amount: ₱{a.price.toLocaleString()}</div>
                  {a.gcashRef && <div className="text-xs text-blue-300 mt-1">Ref: {a.gcashRef}</div>}
                  {(a.gcashScreenshotUrl || a.paymentScreenshotUrl) && (
                    <a href={a.gcashScreenshotUrl ?? a.paymentScreenshotUrl} target="_blank" rel="noreferrer"
                      className="text-xs text-gold-400 underline mt-1 block">View Screenshot →</a>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-mono text-gold-gradient text-lg">₱{a.price.toLocaleString()}</div>
                  <Button size="sm" disabled={!!busy} onClick={() => verify(a.id)}>
                    {busy === `verify-${a.id}` ? "…" : "Verify"}
                  </Button>
                  <Button size="sm" variant="ghost" disabled={!!busy} onClick={() => reject(a.id)}>
                    {busy === `reject-${a.id}` ? "…" : "Reject"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Verified — ready to mark paid */}
      {verified.length > 0 && (
        <Card>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="font-serif text-xl text-gold-gradient">Verified — Mark as Paid</h3>
            <Badge tone="confirmed">{verified.length}</Badge>
          </div>
          <div className="space-y-3">
            {verified.map((a) => (
              <div key={a.id} className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-gold-100">{a.patientName}</div>
                  <div className="text-sm text-gold-100/60">{a.serviceName} · {a.date}</div>
                  {a.gcashRef && <div className="text-xs text-purple-300 mt-1">Ref: {a.gcashRef}</div>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-mono text-gold-gradient text-lg">₱{a.price.toLocaleString()}</div>
                  <Button size="sm" disabled={!!busy} onClick={() => markPaidFromVerified(a.id)}>
                    {busy === `vpaid-${a.id}` ? "…" : "Mark Paid"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Unpaid completed appointments */}
      {unpaid.length > 0 && (
        <Card>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="font-serif text-xl text-gold-gradient">Unpaid — Completed</h3>
            <Badge tone="cancelled">{unpaid.length}</Badge>
          </div>
          <div className="space-y-3">
            {unpaid.map((a) => (
              <div key={a.id} className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-gold-100">{a.patientName}</div>
                  <div className="text-sm text-gold-100/60">{a.serviceName} · {a.date}</div>
                  <div className="text-xs text-gold-300/70 mt-1">Total due: ₱{a.price.toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-mono text-gold-gradient text-lg">₱{a.price.toLocaleString()}</div>
                  <Button size="sm" disabled={!!busy} onClick={() => markPaid(a.id, "cash")}>
                    {busy === `paid-${a.id}-cash` ? "…" : "Cash — Paid"}
                  </Button>
                  <Button size="sm" variant="subtle" disabled={!!busy} onClick={() => markPaid(a.id, "gcash")}>
                    {busy === `paid-${a.id}-gcash` ? "…" : "GCash — Paid"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Partial payments */}
      {partialPaid.length > 0 && (
        <Card>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="font-serif text-xl text-gold-gradient">Partial Payments — Balance Due</h3>
            <Badge tone="pending">{partialPaid.length}</Badge>
          </div>
          <div className="space-y-3">
            {partialPaid.map((a) => (
              <div key={a.id} className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-gold-100">{a.patientName}</div>
                  <div className="text-sm text-gold-100/60">{a.serviceName} · {a.date}</div>
                  <div className="text-xs text-gold-300/70 mt-1">
                    Deposit: ₱{(a.depositAmount ?? 0).toLocaleString()} · Balance: ₱{(a.price - (a.depositAmount ?? 0)).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-mono text-gold-gradient text-lg">₱{a.price.toLocaleString()}</div>
                  {a.status === "completed" ? (
                    <>
                      <Button size="sm" disabled={!!busy} onClick={() => markPaid(a.id, "cash")}>
                        {busy === `paid-${a.id}-cash` ? "…" : "Cash — Paid"}
                      </Button>
                      <Button size="sm" variant="subtle" disabled={!!busy} onClick={() => markPaid(a.id, "gcash")}>
                        {busy === `paid-${a.id}-gcash` ? "…" : "GCash — Paid"}
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-gold-100/40 italic">Awaiting treatment completion</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Paid transactions */}
      <Card>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-serif text-xl text-gold-gradient">Paid Transactions</h3>
          <Badge tone="paid">{paid.length}</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="text-left text-xs uppercase tracking-wider text-gold-200/70">
              <tr>
                <th className="py-2">Patient</th>
                <th>Service</th>
                <th>Date</th>
                <th>Method</th>
                <th>Receipt</th>
                <th className="text-right">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paid.map((a) => (
                <tr key={a.id} className="border-t border-gold-500/10 hover:bg-gold-500/5 transition">
                  <td className="py-3 text-gold-100">{a.patientName}</td>
                  <td className="text-gold-100/70">{a.serviceName}</td>
                  <td className="text-gold-100/60 text-xs">{a.date}</td>
                  <td className="capitalize text-gold-100/70">{a.paymentMethod}</td>
                  <td className="text-xs text-gold-300">{a.receiptNumber || "—"}</td>
                  <td className="text-right font-mono text-gold-300">₱{a.price.toLocaleString()}</td>
                  <td className="text-right">
                    <button
                      onClick={() => downloadInvoice(a)}
                      disabled={a.status !== "completed"}
                      className="text-xs px-3 py-1.5 rounded-md border border-gold-500/30 text-gold-300 hover:bg-gold-500/10 transition disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      Print Invoice
                    </button>
                  </td>
                </tr>
              ))}
              {paid.length === 0 && (
                <tr><td colSpan={7} className="py-4 text-sm text-gold-100/40">No paid transactions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
