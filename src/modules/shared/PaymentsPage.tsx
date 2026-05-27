import { useCallback, useMemo, useState } from "react";
import { Badge, Button, Input } from "../../components/ui";
import { MarkPaymentDialog } from "../../components/ui/MarkPaymentDialog";
import { hasTreatmentRecord } from "../../shared/helpers";
import type { PaymentMethod } from "../../shared/types";
import { DataTable } from "../../components/ui/DataTable";
import { sortAppointmentsLatestFirst } from "../../shared/helpers";
import { paymentsService } from "../../services/payments";
import { useStore } from "../../store/store";
import { downloadInvoice } from "../../utils/invoice";
import { PaymentBadge } from "../appointment/AppointmentsList";
import type { Role, Appointment } from "../../shared/types";

export function PaymentsPage({ role: _role }: { role: Role }) {
  const { appointments, user } = useStore();
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [payTarget, setPayTarget] = useState<Appointment | null>(null);

  if (!user) return null;

  const q = search.toLowerCase();
  const match = (a: Appointment) =>
    !q || `${a.patientName}${a.serviceName}${a.receiptNumber ?? ""}`.toLowerCase().includes(q);

  const unpaid = useMemo(
    () => appointments.filter((a) => a.status === "completed" && a.paymentStatus === "unpaid" && match(a)),
    [appointments, q],
  );
  const paid = useMemo(
    () => appointments.filter((a) => a.paymentStatus === "paid" && match(a)),
    [appointments, q],
  );

  const recordPayment = useCallback(
    async (id: string, method: PaymentMethod, note: string) => {
      setBusy(id);
      setError("");
      try {
        await paymentsService.markPaid(id, user!.name, method, note);
        setPayTarget(null);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Action failed.");
        throw e;
      } finally {
        setBusy(null);
      }
    },
    [user],
  );

  const unpaidColumns = [
    {
      key: "patient",
      header: "Patient",
      render: (a: Appointment) => <span className="font-medium text-gold-100">{a.patientName}</span>,
    },
    {
      key: "service",
      header: "Service",
      render: (a: Appointment) => <span className="text-gold-100/70 text-xs">{a.serviceName}</span>,
    },
    { key: "date", header: "Date", render: (a: Appointment) => <span className="text-xs">{a.date}</span> },
    {
      key: "status",
      header: "Status",
      render: (a: Appointment) => <Badge tone={a.status as "completed"}>{a.status}</Badge>,
    },
    {
      key: "amount",
      header: "Amount",
      render: (a: Appointment) => (
        <span className="font-mono text-gold-300">₱{a.price.toLocaleString()}</span>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (a: Appointment) =>
        !hasTreatmentRecord(a) ? (
          <span className="text-[10px] text-amber-300/80">Awaiting dentist notes</span>
        ) : (
          <Button size="sm" disabled={!!busy} onClick={() => setPayTarget(a)}>
            {busy === a.id ? "…" : "Record Payment"}
          </Button>
        ),
    },
  ];

  const paidColumns = [
    {
      key: "patient",
      header: "Patient",
      render: (a: Appointment) => <span className="text-gold-100">{a.patientName}</span>,
    },
    {
      key: "service",
      header: "Service",
      render: (a: Appointment) => <span className="text-gold-100/70">{a.serviceName}</span>,
    },
    { key: "date", header: "Date", render: (a: Appointment) => <span className="text-xs">{a.date}</span> },
    {
      key: "receipt",
      header: "Receipt",
      render: (a: Appointment) => (
        <span className="font-mono text-xs text-gold-300">{a.receiptNumber || "—"}</span>
      ),
    },
    {
      key: "payment",
      header: "Payment",
      render: (a: Appointment) => <PaymentBadge status={a.paymentStatus} method={a.paymentMethod} />,
    },
    {
      key: "amount",
      header: "Amount",
      className: "text-right",
      render: (a: Appointment) => (
        <span className="font-mono text-gold-300">₱{a.price.toLocaleString()}</span>
      ),
    },
    {
      key: "invoice",
      header: "",
      className: "text-right",
      render: (a: Appointment) => (
        <button
          type="button"
          onClick={() => downloadInvoice(a)}
          className="text-xs px-3 py-1.5 rounded-md border border-gold-500/30 text-gold-300 hover:bg-gold-500/10"
        >
          Print Invoice
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Input
        placeholder="Search patient, service, receipt…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />
      {error && (
        <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-xl text-gold-gradient">Unpaid — Completed Visits</h3>
          <Badge tone="cancelled">{unpaid.length}</Badge>
        </div>
        <DataTable
          columns={unpaidColumns}
          rows={unpaid}
          rowKey={(a) => a.id}
          sortCompare={sortAppointmentsLatestFirst}
          emptyMessage="No unpaid completed appointments."
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif text-xl text-gold-gradient">Paid Transactions</h3>
          <Badge tone="paid">{paid.length}</Badge>
        </div>
        <DataTable
          columns={paidColumns}
          rows={paid}
          rowKey={(a) => a.id}
          sortCompare={sortAppointmentsLatestFirst}
          emptyMessage="No paid transactions yet."
          pageSize={10}
        />
      </div>

      {payTarget && (
        <MarkPaymentDialog
          appointment={payTarget}
          onCancel={() => setPayTarget(null)}
          onConfirm={(method, note) => recordPayment(payTarget.id, method, note)}
        />
      )}
    </div>
  );
}
