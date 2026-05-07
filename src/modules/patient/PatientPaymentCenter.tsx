import { useState } from "react";
import { Badge, Button, Card, Input, Label } from "../../components/ui";
import { paymentsService } from "../../services/payments";
import { uploadFile, gcashScreenshotPath } from "../../services/upload";
import { useStore } from "../../store/store";
import { receiptHref } from "../../shared/helpers";
import { downloadInvoice } from "../../utils/invoice";
import type { Appointment } from "../../shared/types";
import { PaymentBadge } from "../appointment/AppointmentsList";

export function PatientPaymentCenter() {
  const { appointments, user, settings } = useStore();
  const mine = appointments
    .filter((a) => a.patientId === user!.id && a.status !== "cancelled")
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const [refs, setRefs] = useState<Record<string, string>>({});
  const [screenshots, setScreenshots] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<Record<string, number | null>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  const handleUpload = async (appointmentId: string, file: File) => {
    setUploading((p) => ({ ...p, [appointmentId]: 0 }));
    try {
      const url = await uploadFile(file, gcashScreenshotPath(appointmentId, file.name),
        (pct) => setUploading((p) => ({ ...p, [appointmentId]: pct })));
      setScreenshots((p) => ({ ...p, [appointmentId]: url }));
    } finally {
      setUploading((p) => ({ ...p, [appointmentId]: null }));
    }
  };

  const handleSubmit = async (a: Appointment) => {
    const ref = refs[a.id] ?? a.gcashRef ?? "";
    const screenshot = screenshots[a.id] ?? a.paymentScreenshotUrl;
    if (!ref && !screenshot) return;
    setSubmitting((p) => ({ ...p, [a.id]: true }));
    try { await paymentsService.saveProof(a.id, ref, screenshot, user!.name); }
    finally { setSubmitting((p) => ({ ...p, [a.id]: false })); }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Payment process</div>
            <h3 className="font-serif text-2xl text-gold-gradient mt-1">Payment Center</h3>
            <p className="mt-2 text-sm text-gold-100/60">For GCash: send payment to the clinic number below, then submit your reference number here.</p>
          </div>
          <div className="rounded-xl border border-gold-500/15 bg-gold-500/5 px-4 py-3 text-sm text-gold-100">
            Clinic GCash: <span className="font-semibold text-gold-300">{settings.gcashNumber}</span>
          </div>
        </div>
      </Card>

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
                {a.receiptNumber && (
                  <a href={receiptHref(a)} download={`${a.receiptNumber}.txt`} className="text-sm text-gold-300 underline">Download Receipt</a>
                )}
                <button onClick={() => downloadInvoice(a)} disabled={a.status !== "completed" || a.paymentStatus !== "paid"}
                  className="text-sm text-gold-300 hover:text-gold-100 underline transition disabled:opacity-30 disabled:cursor-not-allowed disabled:no-underline">
                  Download Invoice
                </button>
              </div>
            </div>

            <div className="mt-5">
              {a.paymentStatus === "paid" && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-400">
                  ✓ Payment confirmed via {a.paymentMethod === "gcash" ? "GCash" : "Cash"}.
                </div>
              )}
              {a.paymentStatus === "verified" && (
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-sm text-blue-300">
                  ✓ GCash verified by staff — awaiting final posting.
                </div>
              )}
              {a.paymentMethod === "gcash" && (a.paymentStatus === "unpaid" || a.paymentStatus === "pending_verification") && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 text-xs text-gold-100/70">
                    Send ₱{a.price.toLocaleString()} to GCash <span className="font-semibold text-gold-300">{settings.gcashNumber}</span>, then submit your reference number and screenshot below.
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>GCash Reference Number</Label>
                      <Input value={refs[a.id] ?? a.gcashRef ?? ""} onChange={(e) => setRefs((p) => ({ ...p, [a.id]: e.target.value }))} placeholder="e.g. 1234567890" />
                    </div>
                    <div>
                      <Label>Upload Screenshot <span className="text-gold-100/40 text-xs">(optional)</span></Label>
                      <input type="file" accept="image/*" disabled={!!uploading[a.id]}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(a.id, f); }}
                        className="mt-1 w-full text-sm text-gold-100/70 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-gold-500/30 file:bg-ink-900/60 file:text-gold-200 file:text-xs file:cursor-pointer hover:file:border-gold-400/60"
                      />
                      {uploading[a.id] != null && (
                        <div className="mt-2 h-1.5 bg-ink-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gold-gradient transition-all" style={{ width: `${uploading[a.id]}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                      <Button disabled={!!uploading[a.id] || !!submitting[a.id] || (!(refs[a.id] ?? a.gcashRef) && !(screenshots[a.id] ?? a.paymentScreenshotUrl))}
                        onClick={() => handleSubmit(a)}>
                        {submitting[a.id] ? "Submitting…" : "Submit Reference"}
                      </Button>
                      {(screenshots[a.id] ?? a.paymentScreenshotUrl) && (
                        <a href={screenshots[a.id] ?? a.paymentScreenshotUrl} target="_blank" rel="noreferrer" className="text-sm text-gold-300 underline">View screenshot</a>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {a.paymentMethod === "cash" && a.paymentStatus !== "paid" && (
                <div className="rounded-xl border border-gold-500/15 bg-ink-900/55 p-4 text-sm text-gold-100/65">
                  Cash payment will be collected at the clinic and confirmed by staff.
                </div>
              )}
            </div>
          </Card>
        ))}
        {mine.length === 0 && <Card><p className="text-sm text-gold-100/60">No appointments yet.</p></Card>}
      </div>
    </div>
  );
}
