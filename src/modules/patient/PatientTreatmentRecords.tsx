import { Badge, Card } from "../../components/ui";
import { useStore } from "../../store/store";
import { receiptHref } from "../../shared/helpers";
import { downloadTreatmentNotes } from "../../utils/invoice";
import { ImagePreview, RecordBlock } from "../shared/SharedModules";

export function PatientTreatmentRecords() {
  const { appointments, user } = useStore();
  const mine = appointments
    .filter((a) => a.patientId === user!.id && (a.status === "completed" || a.diagnosis || a.notes))
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  if (mine.length === 0) {
    return (
      <Card>
        <p className="text-sm text-gold-100/60">Your treatment records will appear here after the doctor updates your completed procedures.</p>
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
                <Badge tone={a.status as any}>{a.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-gold-100/60">{a.date} · {a.time} · Doctor: {a.doctor}</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              {a.receiptNumber && (
                <a href={receiptHref(a)} download={`${a.receiptNumber}.txt`} className="text-sm text-gold-300 underline">Download Receipt</a>
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
  );
}
