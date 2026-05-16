import { useState } from "react";
import { Badge, Button, Card } from "../../components/ui";
import { useStore } from "../../store/store";
import { downloadInvoice } from "../../utils/invoice";
import { PaymentBadge, AppointmentTimeline } from "../appointment/AppointmentsList";
import { paymentsService } from "../../services/payments";
import { uploadFile } from "../../services/upload";

function GCashSubmitForm({ appointmentId, price }: { appointmentId: string; price: number }) {
  const { user, settings } = useStore();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function handleFile(f: File | null) {
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  }

  async function submit() {
    if (!file) { setError("Please upload your GCash receipt screenshot."); return; }
    setSaving(true); setError("");
    try {
      const screenshotUrl = await uploadFile(file, `gcash/${appointmentId}/${Date.now()}-${file.name}`);
      await paymentsService.saveProof(appointmentId, "", screenshotUrl, user?.name ?? "patient");
      setDone(true);
    } catch (e: any) {
      setError(e.message || "Failed to submit.");
    } finally {
      setSaving(false);
    }
  }

  if (done) return (
    <div className="rounded-xl border border-blue-500/30 bg-blue-500/8 p-4 text-sm text-blue-300">
      ✓ Receipt submitted. Staff will verify your payment shortly.
    </div>
  );

  return (
    <div className="rounded-xl border border-gold-500/20 bg-ink-900/50 p-4 space-y-4">
      <p className="text-xs uppercase tracking-wider text-gold-300/60">GCash Payment · ₱{price.toLocaleString()}</p>

      {/* Step 1: Scan QR */}
      {settings?.gcashQrUrl && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gold-200">Step 1 — Scan the clinic QR code</p>
          <img src={settings.gcashQrUrl} alt="GCash QR Code" className="w-40 h-40 object-contain rounded-lg border border-gold-500/20 bg-white p-1" />
          {settings.gcashNumber && (
            <p className="text-xs text-gold-100/55">GCash number: <span className="text-gold-300 font-mono">{settings.gcashNumber}</span></p>
          )}
        </div>
      )}
      {!settings?.gcashQrUrl && settings?.gcashNumber && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gold-200">Step 1 — Send payment via GCash</p>
          <p className="text-xs text-gold-100/55">GCash number: <span className="text-gold-300 font-mono">{settings.gcashNumber}</span></p>
        </div>
      )}

      {/* Step 2: Upload receipt */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gold-200">Step 2 — Upload your receipt screenshot</p>
        <input type="file" accept="image/*"
          className="w-full text-sm text-gold-100/70 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-gold-500/30 file:bg-ink-900/60 file:text-gold-200 file:text-xs file:cursor-pointer"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
        {preview && (
          <img src={preview} alt="Receipt preview" className="w-32 h-32 object-cover rounded-lg border border-gold-500/20" />
        )}
      </div>

      {error && <p className="text-xs text-red-300">{error}</p>}
      <Button size="sm" disabled={saving || !file} onClick={submit}>{saving ? "Uploading…" : "Submit Receipt"}</Button>
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
              {a.paymentStatus === "unpaid" && a.status === "completed" && (
                <GCashSubmitForm appointmentId={a.id} price={a.price} />
              )}
              {a.paymentStatus === "unpaid" && a.status !== "completed" && (
                <div className="rounded-xl border border-gold-500/15 bg-ink-900/55 p-4 text-sm text-gold-100/65">
                  Payment will be collected after your treatment is completed.
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
