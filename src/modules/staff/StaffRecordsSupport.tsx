import { useEffect, useState } from "react";
import { Badge, Button, Card, Label, Select, Textarea } from "../../components/ui";
import { appointmentsService } from "../../services/appointments";
import { useStore } from "../../store/store";
import type { AppointmentStatus } from "../../shared/types";

export function StaffRecordsSupport() {
  const { appointments, user } = useStore();
  const sorted = [...appointments].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const [selectedId, setSelectedId] = useState(sorted[0]?.id ?? "");
  const selected = sorted.find((a) => a.id === selectedId) || sorted[0];
  const [supportNote, setSupportNote] = useState(selected?.supportNote || "");
  const [status, setStatus] = useState<AppointmentStatus>(selected?.status || "pending");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (!selected) return;
    setSupportNote(selected.supportNote || "");
    setStatus(selected.status);
    setSaved(false);
    setSaveError("");
  }, [selected?.id, selected?.updatedAt]);

  if (!selected) return <Card><p className="text-sm text-gold-100/60">No appointment records available.</p></Card>;

  return (
    <div className="grid xl:grid-cols-[0.9fr_1.1fr] gap-6">
      <Card>
        <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Records & support</div>
        <h3 className="mt-2 font-serif text-2xl text-gold-gradient">Assist Patient Records</h3>
        <div className="mt-5">
          <Label>Appointment</Label>
          <Select value={selected.id} onChange={(e) => setSelectedId(e.target.value)}>
            {sorted.map((a) => (
              <option key={a.id} value={a.id}>{a.patientName} · {a.serviceName} · {a.date} {a.time}</option>
            ))}
          </Select>
        </div>
        <div className="mt-5 rounded-xl border border-gold-500/15 bg-ink-900/55 p-4 space-y-2 text-sm text-gold-100/65">
          <div><span className="text-gold-300/60">Patient:</span> {selected.patientName}</div>
          <div><span className="text-gold-300/60">Service:</span> {selected.serviceName}</div>
          <div><span className="text-gold-300/60">Doctor:</span> {selected.doctor}</div>
          <div><span className="text-gold-300/60">Diagnosis:</span> {selected.diagnosis || "Awaiting doctor update"}</div>
          <div><span className="text-gold-300/60">Doctor Notes:</span> {selected.notes || "No doctor note yet"}</div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Administrative support</div>
            <h3 className="font-serif text-2xl text-gold-gradient mt-1">Support Notes & Status Updates</h3>
          </div>
          {saved && <Badge tone="paid">Saved</Badge>}
        </div>
        <div>
          <Label>Appointment Status</Label>
          <Select value={status} onChange={(e) => setStatus(e.target.value as AppointmentStatus)}>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in-progress">In Progress</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
        <div className="mt-4">
          <Label>Staff Support Note</Label>
          <Textarea rows={8} value={supportNote} onChange={(e) => setSupportNote(e.target.value)}
            placeholder="Example: Patient arrived early, chart prepared, GCash ref checked, doctor informed..." />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button disabled={saving} onClick={async () => {
            setSaving(true); setSaveError(""); setSaved(false);
            try {
              await appointmentsService.update(selected.id, { supportNote, status }, user!.name);
              setSaved(true);
            } catch (e: any) {
              setSaveError(e.message || "Save failed.");
            } finally { setSaving(false); }
          }}>
            {saving ? "Saving…" : "Save Support Update"}
          </Button>
          <Button variant="subtle" disabled={saving} onClick={async () => {
            setSaving(true); setSaveError("");
            try {
              await appointmentsService.update(selected.id, { status: "confirmed" }, user!.name);
            } catch (e: any) {
              setSaveError(e.message || "Failed.");
            } finally { setSaving(false); }
          }}>
            Mark Confirmed
          </Button>
          {saveError && <p className="text-xs text-red-300">{saveError}</p>}
        </div>
      </Card>
    </div>
  );
}
