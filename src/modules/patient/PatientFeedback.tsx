import { useState } from "react";
import { Button, Card, Label, Select, Textarea } from "../../components/ui";
import { feedbackService } from "../../services/feedback";
import { useStore } from "../../store/store";
import { formatDateTime } from "../../shared/helpers";

export function PatientFeedback() {
  const { user, appointments, feedbacks } = useStore();
  const completed = appointments.filter((a) => a.patientId === user!.id && a.status === "completed");
  const mine = feedbacks.filter((f) => f.userId === user!.id);
  const [stars, setStars] = useState(5);
  const [text, setText] = useState("");
  const [appointmentId, setAppointmentId] = useState(completed[0]?.id || "");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (submitting) return;
    if (!text.trim()) { setFormError("Please write a comment before submitting."); return; }
    if (text.trim().length < 10) { setFormError("Comment must be at least 10 characters."); return; }
    if (appointmentId && mine.some((f) => f.appointmentId === appointmentId)) {
      setFormError("You have already submitted feedback for this appointment."); return;
    }
    setSubmitting(true); setFormError("");
    try {
      await feedbackService.submit({ userId: user!.id, userName: user!.name, stars, text: text.trim(), appointmentId: appointmentId || undefined });
      setSent(true); setText(""); setStars(5); setAppointmentId(completed[0]?.id || "");
    } finally { setSubmitting(false); }
  }

  return (
    <div className="grid xl:grid-cols-[0.9fr_1.1fr] gap-6">
      <Card>
        <h3 className="font-serif text-2xl text-gold-gradient">Submit Feedback</h3>
        <p className="text-sm text-gold-100/60 mt-2">Rate your experience and help the clinic improve service quality.</p>
        <form onSubmit={submit} className="mt-5 space-y-5" noValidate>
          <div>
            <Label htmlFor="feedback-appointment">Completed Appointment</Label>
            <Select
              id="feedback-appointment"
              value={appointmentId}
              onChange={(e) => setAppointmentId(e.target.value)}
            >
              <option value="">General feedback</option>
              {completed.map((a) => <option key={a.id} value={a.id}>{a.serviceName} · {a.date}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="feedback-rating">Your Rating</Label>
            <div id="feedback-rating" className="flex gap-1 text-3xl" role="group" aria-label="Star rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStars(n)}
                  className={n <= stars ? "text-gold-400" : "text-gold-100/20"}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="feedback-comments">Comments</Label>
            <Textarea
              id="feedback-comments"
              name="feedback-comments"
              value={text}
              onChange={(e) => { setText(e.target.value); setFormError(""); }}
              rows={6}
              disabled={submitting}
              autoComplete="off"
              placeholder="Tell us about the service quality, comfort, staff support, or suggestions."
            />
            {formError && <p className="mt-1 text-xs text-red-400" role="alert">{formError}</p>}
          </div>
          <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit Feedback"}
          </Button>
          {sent && <p className="text-emerald-400 text-sm" role="status">Thank you for your feedback.</p>}
        </form>
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
