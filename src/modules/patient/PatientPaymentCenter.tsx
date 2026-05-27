import { Badge, Card } from "../../components/ui";
import { useStore } from "../../store/store";
import { downloadInvoice } from "../../utils/invoice";
import { formatTime12h, sortAppointmentsLatestFirst } from "../../shared/helpers";
import { PaymentBadge, AppointmentTimeline } from "../appointment/AppointmentsList";
import { DataTable } from "../../components/ui/DataTable";
import type { Appointment } from "../../shared/types";

export function PatientPaymentCenter() {
  const { appointments, user } = useStore();
  if (!user) return null;

  const mine = appointments.filter((a) => a.patientId === user.id && a.status !== "cancelled");

  const columns = [
    {
      key: "date",
      header: "Date & Time",
      render: (a: Appointment) => (
        <div>
          <div className="text-gold-100 font-medium">{a.date}</div>
          <div className="text-xs text-gold-100/50">{formatTime12h(a.time)}</div>
        </div>
      ),
    },
    {
      key: "service",
      header: "Service",
      render: (a: Appointment) => <span className="text-gold-100/80">{a.serviceName}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (a: Appointment) => <Badge tone={a.status as "pending"}>{a.status}</Badge>,
    },
    {
      key: "payment",
      header: "Payment",
      render: (a: Appointment) => <PaymentBadge status={a.paymentStatus} method={a.paymentMethod} />,
    },
    {
      key: "amount",
      header: "Amount",
      render: (a: Appointment) => (
        <span className="font-mono text-gold-300">₱{a.price.toLocaleString()}</span>
      ),
    },
    {
      key: "invoice",
      header: "",
      render: (a: Appointment) =>
        a.paymentStatus === "paid" ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              downloadInvoice(a);
            }}
            className="text-xs text-gold-300 hover:text-gold-100 underline"
          >
            Invoice
          </button>
        ) : (
          <span className="text-xs text-gold-100/40">Cash at clinic</span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gold-100/60">
        All payments are recorded as cash at the clinic. Invoices are available after staff confirms payment.
      </p>
      <DataTable
        columns={columns}
        rows={mine}
        rowKey={(a) => a.id}
        sortCompare={sortAppointmentsLatestFirst}
        emptyMessage="No appointments yet."
      />
    </div>
  );
}
