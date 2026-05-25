import { Badge, Card } from "../../components/ui";
import { useStore } from "../../store/store";
import { downloadInvoice } from "../../utils/invoice";
import { formatTime12h } from "../../shared/helpers";
import { PaymentBadge, AppointmentTimeline } from "../appointment/AppointmentsList";

export function PatientPaymentCenter() {
  const { appointments, user } = useStore();
  if (!user) return null;

  const mine = appointments
    .filter((a) => a.patientId === user.id && a.status !== "cancelled")
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {mine.map((a) => (
          <Card key={a.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-serif text-xl text-gold-100">{a.serviceName}</h4>
                  <Badge tone={a.status as any}>{a.status}</Badge>
                  <PaymentBadge status={a.paymentStatus} method="Cash" />
                </div>
                <p className="mt-2 text-sm text-gold-100/60">
                  {a.date} at {formatTime12h(a.time)} · ₱{a.price.toLocaleString()}
                </p>
              </div>
              {a.paymentStatus === "paid" && (
                <button
                  onClick={() => downloadInvoice(a)}
                  className="text-sm text-gold-300 hover:text-gold-100 underline transition"
                >
                  Download Invoice
                </button>
              )}
            </div>

            <div className="mt-5">
              {a.paymentStatus === "paid" && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-400">
                  ✓ Payment confirmed — Cash · Receipt: <span className="font-mono text-emerald-300">{a.receiptNumber}</span>
                </div>
              )}
              {a.paymentStatus === "unpaid" && a.status === "completed" && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 p-4 text-sm text-amber-300">
                  Payment due: <span className="font-mono font-semibold">₱{a.price.toLocaleString()}</span> — please pay at the clinic counter.
                </div>
              )}
              {a.paymentStatus === "unpaid" && a.status !== "completed" && (
                <div className="rounded-xl border border-gold-500/15 bg-ink-900/55 p-4 text-sm text-gold-100/65">
                  Payment will be collected after your treatment is completed.
                </div>
              )}
            </div>

            <AppointmentTimeline status={a.status} paymentStatus={a.paymentStatus} />
          </Card>
        ))}
        {mine.length === 0 && <Card><p className="text-sm text-gold-100/60">No appointments yet.</p></Card>}
      </div>
    </div>
  );
}
