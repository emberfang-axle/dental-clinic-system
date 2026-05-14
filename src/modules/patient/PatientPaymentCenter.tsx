import { useState } from "react";
import { Badge, Button, Card, Input, Label } from "../../components/ui";
import { useStore } from "../../store/store";
import { downloadInvoice } from "../../utils/invoice";
import { PaymentBadge } from "../appointment/AppointmentsList";
import { AppointmentTimeline } from "../appointment/AppointmentsList";
import { paymentsService } from "../../services/payments";
import { uploadFile } from "../../services/upload";

function GCashSubmitForm({ appointmentId, price }: { appointmentId: string; price: number }) {
  const { user } = useStore();
  const [ref, setRef] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit() {
    if (!ref.trim()) { setError("Please enter your GCash reference number."); return; }
    setSaving(true); setError("");
    try {
      let screenshotUrl: string | undefined;
      if (file) {
        screenshotUrl = await uploadFile(file, `gcash/${appointmentId}/${file.name}`);
      }
      await paymentsService.saveProof(appointmentId, ref.trim(), screenshotUrl, user?.name ?? "patient");
      setDone(true);
    } catch (e: any) {
      setError(e.message || "Failed to submit.");
    } finally {
      setSaving(false);
    }
  }

  if (done) return (
    <div className="rounded-xl border border-blue-500/30 bg-blue-500/8 p-4 text-sm text-blue-300">
      ✓ GCash reference submitted. Staff will verify your payment shortly.
    </div>
  );

  return (
    <div className="rounded-xl border border-gold-500/20 bg-ink-900/50 p-4 space-y-3">
      <p className="text-xs uppercase tracking-wider text-gold-300/60">Submit GCash Payment · ₱{price.toLocaleString()}</p>
      <div>
        <Label>GCash Reference Number</Label>
        <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. 1234567890" />
      </div>
      <div>
        <Label>Screenshot (optional)</Label>
        <input type="file" accept="image/*"
          className="mt-1 w-full text-sm text-gold-100/70 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gold-500/30 file:bg-ink-900/60 file:text-gold-200 file:text-xs file:cursor-pointer"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </div>
      {error && <p className="text-xs text-red-300">{error}</p>}
      <Button size="sm" disabled={saving} onClick={submit}>{saving ? "Submitting…" : "Submit Payment Proof"}</Button>
    </div>
  );
}

export function PatientPaymentCenter() {
  const { appointments, user } = useStore();
  const mine = appointments
    .filter((a) => a.patientId === user!.id && a.status !== "cancelled")
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
                  <PaymentBadge status={a.paymentStatus} method={a.paymentMethod === "gcash" ? "GCash" : "Cash"} />
                </div>
                <p className="mt-2 text-sm text-gold-100/60">{a.date} at {a.time} · ₱{a.price.toLocaleString()}</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button onClick={() => downloadInvoice(a)} disabled={a.status !== "completed"}
                  className="text-sm text-gold-300 hover:text-gold-100 underline transition disabled:opacity-30 disabled:cursor-not-allowed disabled:no-underline">
                  Download Invoice
                </button>
              </div>
            </div>

            <div className="mt-5">
              {a.paymentStatus === "paid" && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-400">
                  ✓ Payment confirmed via {a.paymentMethod === "gcash" ? "GCash" : "Cash"}.
                  {a.gcashRef && <span className="ml-2 text-emerald-300/70">Ref: {a.gcashRef}</span>}
                </div>
              )}
              {a.paymentStatus === "pending_verification" && (
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/8 p-4 text-sm text-blue-300">
                  ⏳ Payment proof submitted. Awaiting staff verification.
                  {a.gcashRef && <span className="ml-2 text-blue-300/60">Ref: {a.gcashRef}</span>}
                </div>
              )}
              {a.paymentStatus === "verified" && (
                <div className="rounded-xl border border-purple-500/30 bg-purple-500/8 p-4 text-sm text-purple-300">
                  ✓ Payment verified. Receipt will be issued after treatment completion.
                </div>
              )}
              {a.paymentStatus === "unpaid" && a.paymentMethod === "gcash" && (
                <GCashSubmitForm appointmentId={a.id} price={a.price} />
              )}
              {a.paymentStatus === "unpaid" && a.paymentMethod === "cash" && (
                <div className="rounded-xl border border-gold-500/15 bg-ink-900/55 p-4 text-sm text-gold-100/65">
                  Cash payment will be collected at the clinic.
                </div>
              )}
              {a.paymentStatus === "partial_paid" && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 p-4 text-sm text-amber-300">
                  Deposit paid: ₱{(a.depositAmount ?? 0).toLocaleString()} · Balance: ₱{(a.price - (a.depositAmount ?? 0)).toLocaleString()} due at clinic.
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
