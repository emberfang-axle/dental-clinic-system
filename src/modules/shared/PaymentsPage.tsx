import { useCallback, useState } from "react";
import { Badge, Button, Card, Input } from "../../components/ui";
import { appointmentsService } from "../../services/appointments";
import { useStore } from "../../store/store";
import { downloadInvoice } from "../../utils/invoice";
import type { Role, Appointment } from "../../shared/types";

export function PaymentsPage({ role }: { role: Role }) {
  const { appointments, user } = useStore() as {
    appointments: Appointment[];
    user: { id: string; name: string; role: Role } | null;
  };
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (!user) return null;

  const q = search.toLowerCase();
  const match = (a: Appointment) =>
    !q || `${a.patientName}${a.serviceName}${a.receiptNumber ?? ""}`.toLowerCase().includes(q);

  const unpaid = appointments.filter((a) => a.status === "completed" && a.paymentStatus === "unpaid" && match(a));
  const paid   = appointments.filter((a) => a.paymentStatus === "paid" && match(a));

  const markPaid = useCallback(async (id: string) => {
    setBusy(id); setError("");
    try {
      await appointmentsService.update(id, { paymentStatus: "paid", paymentMethod: "cash" }, user.name);
    } catch (e: any) {
      setError(e.message || "Action failed.");
    } finally {
      setBusy(null);
    }
  }, [user.name]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Input placeholder="Search patient, service, receipt…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      {error && (
        <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Unpaid — completed appointments awaiting payment */}
      <Card>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-serif text-xl text-gold-gradient">Unpaid — Completed</h3>
          <Badge tone="cancelled">{unpaid.length}</Badge>
        </div>
        {unpaid.length === 0 && (
          <p className="text-sm text-gold-100/40">No unpaid appointments.</p>
        )}
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
                <Button size="sm" disabled={!!busy} onClick={() => markPaid(a.id)}>
                  {busy === a.id ? "…" : "Mark as Paid"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Paid transactions */}
      <Card>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-serif text-xl text-gold-gradient">Paid Transactions</h3>
          <Badge tone="paid">{paid.length}</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="text-left text-xs uppercase tracking-wider text-gold-200/70">
              <tr>
                <th className="py-2">Patient</th>
                <th>Service</th>
                <th>Date</th>
                <th>Receipt No.</th>
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
                  <td className="text-xs text-gold-300 font-mono">{a.receiptNumber || "—"}</td>
                  <td className="text-right font-mono text-gold-300">₱{a.price.toLocaleString()}</td>
                  <td className="text-right">
                    <button
                      onClick={() => downloadInvoice(a)}
                      className="text-xs px-3 py-1.5 rounded-md border border-gold-500/30 text-gold-300 hover:bg-gold-500/10 transition whitespace-nowrap"
                    >
                      Print Invoice
                    </button>
                  </td>
                </tr>
              ))}
              {paid.length === 0 && (
                <tr><td colSpan={6} className="py-4 text-sm text-gold-100/40">No paid transactions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
