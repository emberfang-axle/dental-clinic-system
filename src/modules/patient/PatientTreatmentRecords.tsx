import { Badge, Button, Card } from "../../components/ui";
import { useStore } from "../../store/store";
import { downloadInvoice, downloadTreatmentNotes } from "../../utils/invoice";
import { ImagePreview, RecordBlock } from "../shared/SharedModules";
import { ROUTES } from "../../shared/constants";

export function PatientTreatmentRecords({ navigate }: { navigate?: (p: string) => void }) {
  const { appointments, user } = useStore();

  // All non-cancelled appointments for timeline
  const allMine = appointments
    .filter((a) => a.patientId === user!.id && a.status !== "cancelled")
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  // Only completed ones with clinical data for records
  const withRecords = allMine.filter(
    (a) => a.status === "completed" || a.diagnosis || a.notes
  );

  const hasCompleted = allMine.some((a) => a.status === "completed");

  return (
    <div className="space-y-6">
      {/* Follow-up prompt — shown when patient has at least one completed appointment */}
      {hasCompleted && navigate && (
        <div className="rounded-xl border border-gold-500/30 bg-gold-500/8 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gold-200">Ready for your next visit?</p>
            <p className="text-xs text-gold-100/55 mt-0.5">Regular check-ups keep your smile healthy. Book a follow-up anytime.</p>
          </div>
          <Button size="sm" onClick={() => navigate(ROUTES.book)}>Book Follow-up →</Button>
        </div>
      )}

      {/* Visit Timeline */}
      <div>
        <h3 className="font-serif text-xl text-gold-gradient mb-3">Visit Timeline</h3>
        {allMine.length === 0 ? (
          <Card><p className="text-sm text-gold-100/60">No visits recorded yet.</p></Card>
        ) : (
          <div className="relative space-y-3 pl-5 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-gold-500/20">
            {allMine.map((a) => (
              <div key={a.id} className="relative">
                <span className="absolute -left-5 top-3 w-2.5 h-2.5 rounded-full border-2 border-gold-400 bg-ink-950" />
                <div className="glass rounded-xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-medium text-gold-100 text-sm">{a.serviceName}</span>
                      <span className="ml-2 text-xs text-gold-100/45">{a.date} · {a.time}</span>
                    </div>
                    <Badge tone={a.status as any}>{a.status}</Badge>
                  </div>
                  {a.diagnosis && (
                    <p className="text-xs text-gold-100/55 mt-1.5">
                      <span className="text-gold-300/60">Diagnosis:</span> {a.diagnosis}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full clinical records */}
      {withRecords.length > 0 && (
        <div>
          <h3 className="font-serif text-xl text-gold-gradient mb-3">Clinical Records</h3>
          <div className="space-y-4">
            {withRecords.map((a) => (
              <Card key={a.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-serif text-2xl text-gold-gradient">{a.serviceName}</h3>
                      <Badge tone={a.status as any}>{a.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-gold-100/60">{a.date} · {a.time} · Doctor: {a.doctor}</p>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {a.receiptNumber && a.paymentStatus === "paid" && (
                      <button onClick={() => downloadInvoice(a)} className="text-sm text-gold-300 hover:text-gold-100 underline transition">
                        Download Receipt
                      </button>
                    )}
                    {(a.diagnosis || a.notes || a.treatmentPlan || a.dentalHistory) && (
                      <button onClick={() => downloadTreatmentNotes(a)} className="text-sm text-gold-300 hover:text-gold-100 underline transition">
                        Download Notes
                      </button>
                    )}
                  </div>
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
        </div>
      )}
    </div>
  );
}
