/**
 * Patient (Client) dashboard.
 * My appointments, payment center, treatment records, notifications, feedback, profile.
 */

import { useState } from "react";
import { Badge, Button, Card, Input, Label, Select, Textarea } from "../../components/ui";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { feedbackService } from "../../services/feedback";
import { paymentsService } from "../../services/payments";
import { useStore } from "../../store/store";
import { DASHBOARD_TABS, ROUTES } from "../../shared/constants";
import { formatDateTime, receiptHref } from "../../shared/helpers";
import type { Appointment } from "../../shared/types";
import { AppointmentsList } from "../appointment/AppointmentsList";
import { PaymentBadge } from "../appointment/AppointmentsList";
import {
  ImagePreview,
  NotificationsCenter,
  ProfilePage,
  RecordBlock,
} from "../shared/SharedModules";

type AppointmentDraftMap = Record<string, { ref: string; shot: string }>;

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
    .filter((a) => a.patientId === user!.id)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const [drafts, setDrafts] = useState<AppointmentDraftMap>({});

  const updateDraft = (appointment: Appointment, key: "ref" | "shot", value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [appointment.id]: {
        ref: prev[appointment.id]?.ref ?? appointment.gcashRef ?? "",
        shot: prev[appointment.id]?.shot ?? appointment.paymentScreenshotUrl ?? "",
        [key]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Payment process</div>
            <h3 className="font-serif text-2xl text-gold-gradient mt-1">GCash & Cash Payment Center</h3>
            <p className="mt-2 text-sm text-gold-100/60">
              Submit your GCash reference, attach screenshot proof, track payment status, and download receipts when available.
            </p>
          </div>
          <div className="rounded-xl border border-gold-500/15 bg-gold-500/5 px-4 py-3 text-sm text-gold-100">
            Clinic GCash: <span className="font-semibold text-gold-300">{settings.gcashNumber}</span>
          </div>
        </div>
      </Card>

      <div className="grid gap-4">
        {mine.map((a) => {
          const draft = drafts[a.id] || { ref: a.gcashRef || "", shot: a.paymentScreenshotUrl || "" };
          return (
            <Card key={a.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-serif text-xl text-gold-100">{a.serviceName}</h4>
                    <Badge tone={a.status as "pending" | "confirmed" | "completed" | "cancelled"}>{a.status}</Badge>
                    <PaymentBadge status={a.paymentStatus} method={a.paymentMethod === "gcash" ? "GCash" : "Cash"} />
                  </div>
                  <p className="mt-2 text-sm text-gold-100/60">{a.date} at {a.time} · Locked price ₱{a.price.toLocaleString()}</p>
                </div>
                {a.receiptNumber && (
                  <a href={receiptHref(a)} download={`${a.receiptNumber}.txt`} className="text-sm text-gold-300 underline">
                    Download Receipt
                  </a>
                )}
              </div>

              {a.paymentMethod === "gcash" ? (
                <div className="mt-5 grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>GCash Reference Number</Label>
                    <Input value={draft.ref} onChange={(e) => updateDraft(a, "ref", e.target.value)} placeholder="Enter reference number" />
                  </div>
                  <div>
                    <Label>Screenshot URL (optional)</Label>
                    <Input value={draft.shot} onChange={(e) => updateDraft(a, "shot", e.target.value)} placeholder="Paste uploaded proof URL" />
                  </div>
                  <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                    <Button onClick={() => paymentsService.saveProof(a.id, draft.ref, draft.shot || undefined, user!.name)}>
                      Submit / Update Proof
                    </Button>
                    {a.paymentScreenshotUrl && (
                      <a href={a.paymentScreenshotUrl} target="_blank" rel="noreferrer" className="text-sm text-gold-300 underline">
                        View current screenshot
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-gold-500/15 bg-ink-900/55 p-4 text-sm text-gold-100/65">
                  Cash appointments are settled at the clinic and will be updated by staff after treatment or upon payment confirmation.
                </div>
              )}
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
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="Tell us about the service quality, comfort, staff support, or suggestions."
          />
        </div>

        <Button
          className="mt-5"
          onClick={() => {
            if (!text.trim()) return;
            feedbackService.submit({
              userId: user!.id,
              userName: user!.name,
              stars,
              text,
              appointmentId: appointmentId || undefined,
            });
            setSent(true);
            setText("");
          }}
        >
          Submit Feedback
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
