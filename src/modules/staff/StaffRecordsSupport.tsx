import { useEffect, useState } from "react";
import { Badge, Button, Card, Input, Label, Select, Textarea } from "../../components/ui";
import { appointmentsService } from "../../services/appointments";
import { useStore } from "../../store/store";
import type { AppointmentStatus } from "../../shared/types";

export function StaffRecordsSupport() {
  const { appointments, user } = useStore();
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const sorted = [...appointments].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  const filtered = search.trim()
    ? sorted.filter((a) => `${a.patientName} ${a.serviceName}`.toLowerCase().includes(search.toLowerCase()))
    : sorted;

  const [selectedId, setSelectedId] = useState(filtered[0]?.id ?? "");
  const selected = filtered.find((a) => a.id === selectedId) ?? filtered[0];

  const [supportNote, setSupportNote] = useState(selected?.supportNote || "");
  const [status, setStatus] = useState<AppointmentStatus>(selected?.status || "pending");

  useEffect(() => {
    if (!selected) return;
    setSupportNote(selected.supportNote || "");
    setStatus(selected.status);
    setSaved(false);
    setSaveError("");
  }, [selected?.id, selected?.updatedAt]);

  if (!selected) return <Card><p className="text-sm text-gold-100/60">No appointment records available.</p></Card>;

  async function handleSave() {
    setSaving(true); setSaveError(""); setSaved(false);
    try {
      await appointmentsService.update(selected.id, { supportNote, status }, user!.name);
      setSaved(true);
    } catch (e: any) {
      setSaveError(e.message || "Save failed.");
    } finally { setSaving(false); }
  }

  async function handleConfirm() {
    setSaving(true); setSaveError("");
    try {
      await appointmentsService.update(selected.id, { status: "confirmed" }, user!.name);
    } catch (e: any) {
      setSaveError(e.message || "Failed.");
    } finally { setSaving(false); }
  }

  return (
    <div className="grid xl:grid-cols-[0.9fr_1.1fr] gap-6">
      {/* ── Left: record viewer ── */}
      <Card>
        <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Records & support</div>
        <h3 className="mt-2 font-serif text-2xl text-gold-gradient">Assist Patient Records</h3>

        <div className="mt-4 space-y-3">
          <Input
            placeholder="Search patient or service…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs"
          />
          <div>
            <Label>Appointment</Label>
            <Select value={selected.id} onChange={(e) => setSelectedId(e.target.value)}>
              {filtered.map((a) => (
                <option key={a.id} value={a.id}>{a.patientName} · {a.serviceName} · {a.date} {a.time}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-gold-500/15 bg-ink-900/55 p-4 space-y-2 text-sm text-gold-100/65">
          {[
            { label: "Patient",    value: selected.patientName },
            { label: "Service",    value: selected.serviceName },
            { label: "Doctor",     value: selected.doctor },
            { label: "Status",     value: selected.status },
            { label: "Diagnosis",  value: selected.diagnosis  || "Awaiting doctor update" },
            { label: "Notes",      value: selected.notes      || "No doctor note yet" },
          ].map(({ label, value }) => (
            <div key={label}><span className="text-gold-300/60">{label}:</span> {value}</div>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <Badge tone={selected.status as any}>{selected.status}</Badge>
        </div>
      </Card>

      {/* ── Right: support actions ── */}
      <Card>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Administrative support</div>
            <h3 className="font-serif text-2xl text-gold-gradient mt-1">Support Notes & Status</h3>
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
            placeholder="e.g. Patient arrived early, chart prepared, doctor informed…" />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button disabled={saving} onClick={handleSave}>
            {saving ? "Saving…" : "Save Support Update"}
          </Button>
          <Button variant="subtle" disabled={saving} onClick={handleConfirm}>
            Mark Confirmed
          </Button>
          {saveError && <p className="text-xs text-red-300">{saveError}</p>}
        </div>
      </Card>
    </div>
  );
}
