/**
 * Patient (Client) dashboard.
 * My appointments, payment center, treatment records, notifications, feedback, profile.
 */

import { useState } from "react";import { Badge, Button, Card, Input, Label, Select, Textarea } from "../../components/ui";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { feedbackService } from "../../services/feedback";
import { paymentsService } from "../../services/payments";
import { uploadFile, gcashScreenshotPath } from "../../services/upload";
import { useStore } from "../../store/store";
import { DASHBOARD_TABS, ROUTES } from "../../shared/constants";
import { formatDateTime, receiptHref } from "../../shared/helpers";
import { downloadInvoice, downloadTreatmentNotes } from "../../utils/invoice";
import type { Appointment } from "../../shared/types";
import { AppointmentsList } from "../appointment/AppointmentsList";
import { PaymentBadge } from "../appointment/AppointmentsList";
import {
  ImagePreview,
  NotificationsCenter,
  ProfilePage,
  RecordBlock,
} from "../shared/SharedModules";


export function PatientDashboard({ navigate }: { navigate: (p: string) => void }) {
  const { user } = useStore();
  const tabs = DASHBOARD_TABS.patient;
  const [tab, setTab] = useState<string>(tabs[0].id);

  if (!user) return null;

  // Patient-only header action: "+ Book Appointment"
  const headerAction = (
    <Button size="sm" onClick={() => navigate(ROUTES.book)} className="whitespace-nowrap">
      <span className="hidden sm:inline">+ Book Appointment</span>
      <span className="sm:hidden">+ Book</span>
    </Button>
  );

  return (
    <DashboardLayout user={user} tabs={tabs} activeTab={tab} onTabChange={setTab} navigate={navigate} headerAction={headerAction}>
      {tab === "my-appointments" && <AppointmentsList role="patient" patientOnly />}
      {tab === "payment-center" && <PatientPaymentCenter />}
      {tab === "treatment-records" && <PatientTreatmentRecords />}
      {tab === "notifications" && <NotificationsCenter />}
      {tab === "feedback" && <FeedbackPage />}
      {tab === "profile" && <ProfilePage />}
    </DashboardLayout>
  );
}

/* ─────────── PAYMENT CENTER ─────────── */

function PatientPaymentCenter() {
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
      const url = await uploadFile(
        file,
        gcashScreenshotPath(appointmentId, file.name),
        (pct) => setUploading((p) => ({ ...p, [appointmentId]: pct }))
      );
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
    try {
      await paymentsService.saveProof(a.id, ref, screenshot, user!.name);
    } finally {
      setSubmitting((p) => ({ ...p, [a.id]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Payment process</div>
            <h3 className="font-serif text-2xl text-gold-gradient mt-1">Payment Center</h3>
            <p className="mt-2 text-sm text-gold-100/60">
              For GCash: send payment to the clinic number below, then submit your reference number here for staff to confirm.
            </p>
          </div>
          <div className="rounded-xl border border-gold-500/15 bg-gold-500/5 px-4 py-3 text-sm text-gold-100">
            Clinic GCash: <span className="font-semibold text-gold-300">{settings.gcashNumber}</span>
          </div>
        </div>
      </Card>

      <div className="grid gap-4">
        {mine.map((a) => {
          return (
            <Card key={a.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-serif text-xl text-gold-100">{a.serviceName}</h4>
                    <Badge tone={a.status as "pending" | "confirmed" | "completed" | "cancelled"}>{a.status}</Badge>
                    <PaymentBadge status={a.paymentStatus} method={a.paymentMethod === "gcash" ? "GCash" : "Cash"} />
                  </div>
                  <p className="mt-2 text-sm text-gold-100/60">{a.date} at {a.time} · ₱{a.price.toLocaleString()}</p>
                </div>
                {a.receiptNumber && (
                  <a href={receiptHref(a)} download={`${a.receiptNumber}.txt`} className="text-sm text-gold-300 underline">
                    Download Receipt
                  </a>
                )}
                <button
                  onClick={() => downloadInvoice(a)}
                  disabled={a.status !== "completed" || a.paymentStatus !== "paid"}
                  className="text-sm text-gold-300 hover:text-gold-100 underline transition disabled:opacity-30 disabled:cursor-not-allowed disabled:no-underline"
                >
                  Download Invoice
                </button>
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
                        <Input
                          value={refs[a.id] ?? a.gcashRef ?? ""}
                          onChange={(e) => setRefs((p) => ({ ...p, [a.id]: e.target.value }))}
                          placeholder="e.g. 1234567890"
                        />
                      </div>
                      <div>
                        <Label>Upload Screenshot <span className="text-gold-100/40 text-xs">(optional)</span></Label>
                        <input
                          type="file" accept="image/*"
                          disabled={!!uploading[a.id]}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(a.id, file);
                          }}
                          className="mt-1 w-full text-sm text-gold-100/70 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-gold-500/30 file:bg-ink-900/60 file:text-gold-200 file:text-xs file:cursor-pointer hover:file:border-gold-400/60"
                        />
                        {uploading[a.id] != null && (
                          <div className="mt-2 h-1.5 bg-ink-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gold-gradient transition-all" style={{ width: `${uploading[a.id]}%` }} />
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                        <Button
                          disabled={!!uploading[a.id] || !!submitting[a.id] || (!(refs[a.id] ?? a.gcashRef) && !(screenshots[a.id] ?? a.paymentScreenshotUrl))}
                          onClick={() => handleSubmit(a)}
                        >
                          {submitting[a.id] ? "Submitting…" : "Submit Reference"}
                        </Button>
                        {(screenshots[a.id] ?? a.paymentScreenshotUrl) && (
                          <a href={screenshots[a.id] ?? a.paymentScreenshotUrl} target="_blank" rel="noreferrer" className="text-sm text-gold-300 underline">
                            View submitted screenshot
                          </a>
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

                {a.paymentStatus === "unpaid" && a.status === "completed" && a.paymentMethod === "cash" && (
                  <div className="rounded-xl border border-gold-500/15 bg-ink-900/55 p-4 text-sm text-gold-100/50">
                    Awaiting staff to create your bill.
                  </div>
                )}
              </div>
            </Card>
          );
        })}
        {mine.length === 0 && <Card><p className="text-sm text-gold-100/60">No appointments yet.</p></Card>}
      </div>
    </div>
  );
}

/* ─────────── TREATMENT RECORDS ─────────── */

function PatientTreatmentRecords() {
  const { appointments, user } = useStore();
  const mine = appointments
    .filter((a) => a.patientId === user!.id && (a.status === "completed" || a.diagnosis || a.notes))
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  if (mine.length === 0) {
    return (
      <Card>
        <p className="text-sm text-gold-100/60">
          Your treatment records will appear here after the doctor updates your completed procedures.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {mine.map((a) => (
        <Card key={a.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif text-2xl text-gold-gradient">{a.serviceName}</h3>
                <Badge tone={a.status as "pending" | "confirmed" | "completed" | "cancelled"}>{a.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-gold-100/60">{a.date} · {a.time} · Doctor: {a.doctor}</p>
            </div>
            {a.receiptNumber && (
              <a href={receiptHref(a)} download={`${a.receiptNumber}.txt`} className="text-sm text-gold-300 underline">
                Download Receipt
              </a>
            )}
            {(a.diagnosis || a.notes || a.treatmentPlan || a.dentalHistory) && (
              <button
                onClick={() => downloadTreatmentNotes(a)}
                className="text-sm text-gold-300 hover:text-gold-100 underline transition"
              >
                Download Notes
              </button>
            )}
          </div>

          <div className="mt-5 grid md:grid-cols-2 gap-4">
            <RecordBlock title="Diagnosis" value={a.diagnosis || "Not yet recorded"} />
            <RecordBlock title="Treatment Plan" value={a.treatmentPlan || "Not yet recorded"} />
            <RecordBlock title="Dental History" value={a.dentalHistory || "Not yet recorded"} />
            <RecordBlock title="Doctor Notes" value={a.notes || "No note added yet"} />
          </div>

          {(a.beforeImageUrl || a.afterImageUrl) && (
            <div className="mt-5 grid md:grid-cols-2 gap-4">
              <ImagePreview title="Before Treatment" src={a.beforeImageUrl} />
              <ImagePreview title="After Treatment" src={a.afterImageUrl} />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

/* ─────────── FEEDBACK ─────────── */

function FeedbackPage() {
  const { user, appointments, feedbacks } = useStore();
  const completed = appointments.filter((a) => a.patientId === user!.id && a.status === "completed");
  const mine = feedbacks.filter((f) => f.userId === user!.id);
  const [stars, setStars] = useState(5);
  const [text, setText] = useState("");
  const [appointmentId, setAppointmentId] = useState(completed[0]?.id || "");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  return (
    <div className="grid xl:grid-cols-[0.9fr_1.1fr] gap-6">
      <Card>
        <h3 className="font-serif text-2xl text-gold-gradient">Submit Feedback</h3>
        <p className="text-sm text-gold-100/60 mt-2">Rate your experience and help the clinic improve service quality.</p>

        <div className="mt-5">
          <Label>Completed Appointment</Label>
          <Select value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)}>
            <option value="">General feedback</option>
            {completed.map((a) => (
              <option key={a.id} value={a.id}>{a.serviceName} · {a.date}</option>
            ))}
          </Select>
        </div>

        <div className="mt-5">
          <Label>Your Rating</Label>
          <div className="flex gap-1 text-3xl">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setStars(n)} className={n <= stars ? "text-gold-400" : "text-gold-100/20"}>★</button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <Label>Comments</Label>
          <Textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setFormError(""); }}
            rows={6}
            placeholder="Tell us about the service quality, comfort, staff support, or suggestions."
          />
          {formError && <p className="mt-1 text-xs text-red-400">{formError}</p>}
        </div>

        <Button
          className="mt-5"
          disabled={submitting}
          onClick={async () => {
            if (submitting) return;
            if (!text.trim()) { setFormError("Please write a comment before submitting."); return; }
            if (text.trim().length < 10) { setFormError("Comment must be at least 10 characters."); return; }
            setSubmitting(true);
            setFormError("");
            try {
              await feedbackService.submit({
                userId: user!.id,
                userName: user!.name,
                stars,
                text: text.trim(),
                appointmentId: appointmentId || undefined,
              });
              setSent(true);
              setText("");
              setStars(5);
              setAppointmentId(completed[0]?.id || "");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {submitting ? "Submitting…" : "Submit Feedback"}
        </Button>
        {sent && <p className="mt-3 text-emerald-400 text-sm">✓ Thank you for your feedback.</p>}
      </Card>

      <Card>
        <h3 className="font-serif text-2xl text-gold-gradient">Your Previous Feedback</h3>
        <div className="mt-5 space-y-3">
          {mine.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-gold-500/15 bg-ink-900/55 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-gold-400">{"★".repeat(entry.stars)}</div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-gold-300/45">{formatDateTime(entry.at)}</div>
              </div>
              <p className="mt-2 text-sm text-gold-100/65 leading-relaxed">{entry.text}</p>
            </div>
          ))}
          {mine.length === 0 && <p className="text-sm text-gold-100/50">You haven't submitted any feedback yet.</p>}
        </div>
      </Card>
    </div>
  );
}
