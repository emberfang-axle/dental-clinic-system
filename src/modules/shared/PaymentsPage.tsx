import { useCallback } from "react";
import { Badge, Button, Card } from "../../components/ui";
import { appointmentsService } from "../../services/appointments";
import { paymentsService } from "../../services/payments";
import { useStore } from "../../store/store";
import { roleLabel } from "../../shared/helpers";
import { downloadInvoice } from "../../utils/invoice";
import type { Role, Appointment } from "../../shared/types";

export function PaymentsPage({ role }: { role: Role }) {
  const { appointments, user } = useStore() as {
    appointments: Appointment[];
    user: { id: string; name: string; role: Role } | null;
  };

  if (!user) return null;

  const pending = appointments.filter((a) => a.paymentStatus === "pending_verification");
  const partialPaid = appointments.filter((a) => a.paymentStatus === "partial_paid");
  const verified = appointments.filter((a) => a.paymentStatus === "verified");
  const paid = appointments.filter((a) => a.paymentStatus === "paid");
  const cashToCollect = appointments.filter(
    (a) => a.paymentMethod === "cash" && a.status === "completed" && a.paymentStatus === "unpaid",
  );

  const handleVerify = useCallback((appointmentId: string) => {
    paymentsService.verify(appointmentId, user.name);
  }, [user.name]);

  const handleMarkUnpaid = useCallback((appointmentId: string) => {
    appointmentsService.update(appointmentId, { paymentStatus: "unpaid" }, user.name);
  }, [user.name]);

  const handleMarkPaid = useCallback((appointmentId: string) => {
    appointmentsService.update(appointmentId, { paymentStatus: "paid" }, user.name);
  }, [user.name]);

  return (
    <div className="space-y-6">
      {/* Partial payments — deposit collected, balance outstanding */}
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
                  <Button size="sm" onClick={() => handleMarkPaid(a.id)}>Mark Balance Paid</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid xl:grid-cols-2 gap-6">
        {/* Pending GCash — patient submitted reference, staff verifies */}
        <Card>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="font-serif text-xl text-gold-gradient">Pending GCash Verification</h3>
            <Badge tone="pending">{pending.length}</Badge>
          </div>
          {pending.length === 0 ? (
            <p className="text-gold-100/50 text-sm">No pending GCash payments.</p>
          ) : (
            <div className="space-y-3">
              {pending.map((a) => (
                <div key={a.id} className="p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-gold-100">{a.patientName}</div>
                      <div className="text-sm text-gold-100/60">{a.serviceName} · {a.date} {a.time}</div>
                      <div className="text-xs text-gold-300/80 mt-1">
                        Reference: <span className="font-mono">{a.gcashRef || "—"}</span>
                      </div>
                      <div className="text-xs text-gold-100/45 mt-1">
                        Screenshot:{" "}
                        {a.paymentScreenshotUrl ? (
                          <a href={a.paymentScreenshotUrl} target="_blank" rel="noreferrer" className="underline text-gold-300">View proof</a>
                        ) : "Not provided"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-gold-gradient text-xl">₱{a.price.toLocaleString()}</div>
                      <div className="mt-2 flex gap-2 justify-end flex-wrap">
                        <Button size="sm" onClick={() => handleVerify(a.id)}>Verify</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleMarkUnpaid(a.id)}>Mark Unpaid</Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Verified GCash + Cash to collect */}
        <Card>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="font-serif text-xl text-gold-gradient">Verified / Ready to Post</h3>
            <Badge tone="confirmed">{verified.length + cashToCollect.length}</Badge>
          </div>
          <div className="space-y-3">
            {[...verified, ...cashToCollect].map((a) => (
              <div key={a.id} className="rounded-xl border border-gold-500/15 bg-ink-900/55 p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="font-medium text-gold-100">{a.patientName}</div>
                  <div className="text-sm text-gold-100/55">{a.serviceName} · {a.paymentMethod.toUpperCase()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-mono text-gold-300">₱{a.price.toLocaleString()}</div>
                  <Button size="sm" onClick={() => handleMarkPaid(a.id)}>Mark Paid</Button>
                </div>
              </div>
            ))}
            {verified.length + cashToCollect.length === 0 && (
              <p className="text-sm text-gold-100/50">Nothing waiting to be posted as paid.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Paid transactions */}
      <Card>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-serif text-xl text-gold-gradient">Paid Transactions</h3>
          <span className="text-xs uppercase tracking-[0.24em] text-gold-300/45">{roleLabel(role)}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="text-left text-xs uppercase tracking-wider text-gold-200/70">
              <tr>
                <th className="py-2">Patient</th>
                <th>Service</th>
                <th>Method</th>
                <th>Receipt</th>
                <th>Reference</th>
                <th className="text-right">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paid.map((a) => (
                <tr key={a.id} className="border-t border-gold-500/10">
                  <td className="py-3 text-gold-100">{a.patientName}</td>
                  <td className="text-gold-100/70">{a.serviceName}</td>
                  <td className="capitalize text-gold-100/70">{a.paymentMethod}</td>
                  <td className="text-xs text-gold-300">{a.receiptNumber || "—"}</td>
                  <td className="font-mono text-xs text-gold-100/55">{a.gcashRef || "—"}</td>
                  <td className="text-right font-mono text-gold-300">₱{a.price.toLocaleString()}</td>
                  <td className="text-right">
                    <button
                      onClick={() => downloadInvoice(a)}
                      disabled={a.status !== "completed" || a.paymentStatus !== "paid"}
                      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gold-500/30 text-gold-300 hover:bg-gold-500/10 hover:text-gold-100 transition disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      🖨 Print Invoice
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
