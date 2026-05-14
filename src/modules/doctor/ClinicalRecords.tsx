import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Input, Label, Select, Textarea } from "../../components/ui";
import { recordsService } from "../../services/records";
import { uploadFile, treatmentPhotoPath } from "../../services/upload";
import { useStore } from "../../store/store";
import { ImagePreview } from "../shared/SharedModules";

export function ClinicalRecords() {
  const { appointments, user, users } = useStore();
  if (!user) return null;
  const editable = useMemo(() => appointments.filter((a) => a.status !== "cancelled"), [appointments]);
  const [selectedId, setSelectedId] = useState(editable[0]?.id ?? "");
  const selected = editable.find((a) => a.id === selectedId) || editable[0];
  const patientHistory = useMemo(
    () => appointments.filter((a) => a.patientId === selected?.patientId && a.id !== selected?.id).slice(0, 5),
    [appointments, selected],
  );
  const [form, setForm] = useState({ diagnosis: "", treatmentPlan: "", dentalHistory: "", notes: "", beforeImageUrl: "", afterImageUrl: "", toothChart: {} as Record<string, string> });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState<"notes" | "photos" | "history">("notes");

  const filtered = search.trim()
    ? editable.filter((a) => `${a.patientName} ${a.serviceName}`.toLowerCase().includes(search.toLowerCase()))
    : editable;

  const currentIndex = filtered.findIndex((a) => a.id === selectedId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < filtered.length - 1;
  function goNext() { if (hasNext) setSelectedId(filtered[currentIndex + 1].id); }
  function goPrev() { if (hasPrev) setSelectedId(filtered[currentIndex - 1].id); }

  useEffect(() => {
    if (!editable.find((a) => a.id === selectedId) && editable[0]) setSelectedId(editable[0].id);
  }, [editable, selectedId]);

  useEffect(() => {
    if (!selected) return;
    setForm({
      diagnosis: selected.diagnosis || "",
      treatmentPlan: selected.treatmentPlan || "",
      dentalHistory: selected.dentalHistory || "",
      notes: selected.notes || "",
      beforeImageUrl: selected.beforeImageUrl || "",
      afterImageUrl: selected.afterImageUrl || "",
      toothChart: selected.toothChart ?? {},
    });
    setSaved(false);
    setSaveError("");
  }, [selected?.id, selected?.updatedAt]);

  if (!selected) {
    return <Card><p className="text-sm text-gold-100/60">No appointment records available yet.</p></Card>;
  }

  const hasNotes = !!(form.diagnosis || form.treatmentPlan || form.dentalHistory || form.notes);
  const isReadOnly = selected.status === "completed" && user.role !== "admin" && user.role !== "doctor";

  const handleSave = async () => {
    setSaving(true); setSaveError("");
    try {
      await recordsService.saveTreatment(selected.id, form, user!.name);
      setSaved(true);
    } catch (e: any) {
      setSaveError(e.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* ── Patient selector bar ── */}
      <Card className="!p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search + dropdown */}
          <Input
            placeholder="Search patient or service…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-40 text-xs"
          />
          <Select value={selected.id} onChange={(e) => setSelectedId(e.target.value)} className="flex-1 min-w-[180px]">
            {filtered.map((a) => (
              <option key={a.id} value={a.id}>{a.patientName} — {a.serviceName} ({a.date})</option>
            ))}
          </Select>

          {/* Prev / Next */}
          <div className="flex items-center gap-1.5">
            <button onClick={goPrev} disabled={!hasPrev}
              className="h-8 w-8 rounded-lg border border-gold-500/25 text-gold-300 hover:border-gold-400 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center text-base">‹</button>
            <span className="text-xs text-gold-100/40 w-12 text-center">{currentIndex + 1} / {filtered.length}</span>
            <button onClick={goNext} disabled={!hasNext}
              className="h-8 w-8 rounded-lg border border-gold-500/25 text-gold-300 hover:border-gold-400 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center text-base">›</button>
          </div>

          {/* Status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone={selected.status as any}>{selected.status}</Badge>
            {selected.emergency && <Badge tone="emergency">Emergency</Badge>}
            {hasNotes && <Badge tone="paid">Has Notes</Badge>}
          </div>
        </div>

        {/* Patient info strip */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Patient",    value: selected.patientName },
            { label: "Service",    value: selected.serviceName },
            { label: "Date & Time", value: `${selected.date} · ${selected.time}` },
            { label: "Payment",    value: `${selected.paymentMethod.toUpperCase()} · ${selected.paymentStatus.replace(/_/g, " ")}` },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-gold-500/15 bg-ink-900/40 px-3 py-2">
              <div className="text-[9px] uppercase tracking-[0.2em] text-gold-300/50 mb-0.5">{item.label}</div>
              <div className="text-sm text-gold-100 font-medium truncate">{item.value}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 p-1 rounded-xl bg-ink-900/60 border border-gold-500/15 w-fit">
        {(["notes", "photos", "history"] as const).map((s) => (
          <button key={s} onClick={() => setActiveSection(s)}
            className={`px-4 py-2 rounded-lg text-xs uppercase tracking-[0.18em] font-semibold transition-all ${
              activeSection === s ? "bg-gold-gradient text-ink-950 shadow-gold" : "text-gold-100/50 hover:text-gold-200"
            }`}>
            {s === "notes" ? "Clinical Notes" : s === "photos" ? "Before / After" : "History"}
          </button>
        ))}
      </div>

      {/* ── NOTES TAB ── */}
      {activeSection === "notes" && (
        <Card>
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Clinical workspace</div>
              <h3 className="font-serif text-xl text-gold-gradient mt-0.5">
                {selected.patientName} — {selected.serviceName}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {isReadOnly && <Badge tone="completed">Completed · Read-only</Badge>}
              {saved && <Badge tone="paid">✓ Saved</Badge>}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Diagnosis</Label>
              <Textarea rows={4} placeholder="Enter diagnosis…" value={form.diagnosis} disabled={isReadOnly}
                onChange={(e) => setForm((p) => ({ ...p, diagnosis: e.target.value }))} />
            </div>
            <div>
              <Label>Treatment Plan</Label>
              <Textarea rows={4} placeholder="Describe the treatment plan…" value={form.treatmentPlan} disabled={isReadOnly}
                onChange={(e) => setForm((p) => ({ ...p, treatmentPlan: e.target.value }))} />
            </div>
            <div>
              <Label>Dental History</Label>
              <Textarea rows={4} placeholder="Relevant dental history…" value={form.dentalHistory} disabled={isReadOnly}
                onChange={(e) => setForm((p) => ({ ...p, dentalHistory: e.target.value }))} />
            </div>
            <div>
              <Label>Doctor Notes</Label>
              <Textarea rows={4} placeholder="Additional observations or instructions…" value={form.notes} disabled={isReadOnly}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>

          {/* Existing notes preview (read-only) */}
          {(selected.diagnosis || selected.notes || selected.treatmentPlan) && (
            <div className="mt-4 p-4 rounded-xl border border-gold-500/15 bg-ink-900/40 space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-gold-300/50">Last Saved Record</div>
              {selected.diagnosis && <p className="text-xs text-gold-100/60"><span className="text-gold-300/70">Diagnosis:</span> {selected.diagnosis}</p>}
              {selected.treatmentPlan && <p className="text-xs text-gold-100/60"><span className="text-gold-300/70">Plan:</span> {selected.treatmentPlan}</p>}
              {selected.notes && <p className="text-xs text-gold-100/60"><span className="text-gold-300/70">Notes:</span> {selected.notes}</p>}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-gold-500/15 flex flex-wrap items-center gap-3">
            {!isReadOnly && (
              <>
                <Button disabled={saving} onClick={handleSave}>{saving ? "Saving…" : "Save Clinical Record"}</Button>
                {saved && hasNext && (
                  <Button variant="outline" size="sm" onClick={() => { goNext(); setSaved(false); }}>Next Patient →</Button>
                )}
              </>
            )}
            <span className="text-xs text-gold-100/40">All actions are logged in the audit trail.</span>
            {saveError && <p className="text-sm text-red-400">{saveError}</p>}
          </div>
        </Card>
      )}

      {/* ── PHOTOS TAB ── */}
      {activeSection === "photos" && (
        <Card>
          <div className="mb-5">
            <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Visual documentation</div>
            <h3 className="font-serif text-xl text-gold-gradient mt-0.5">Before & After — {selected.patientName}</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {(["before", "after"] as const).map((type) => {
              const key = type === "before" ? "beforeImageUrl" : "afterImageUrl" as const;
              return (
                <div key={type}>
                  <Label>{type === "before" ? "Before Treatment" : "After Treatment"}</Label>
                  <input type="file" accept="image/*" disabled={isReadOnly}
                    className="mt-1 w-full text-sm text-gold-100/70 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-gold-500/30 file:bg-ink-900/60 file:text-gold-200 file:text-xs file:cursor-pointer hover:file:border-gold-400/60 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const url = await uploadFile(file, treatmentPhotoPath(selected.id, type, file.name));
                      setForm((p) => ({ ...p, [key]: url }));
                    }}
                  />
                  <div className="mt-3">
                    <ImagePreview title={type === "before" ? "Before" : "After"} src={form[key]} />
                    {form[key] && (
                      <button onClick={() => setForm((p) => ({ ...p, [key]: "" }))}
                        className="mt-2 text-xs text-red-400 hover:text-red-300 transition">Remove photo</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-gold-500/15 flex gap-3">
            {!isReadOnly && (
              <Button disabled={saving} onClick={handleSave}>{saving ? "Saving…" : "Save Photos"}</Button>
            )}
            {saveError && <p className="text-sm text-red-400">{saveError}</p>}
          </div>
        </Card>
      )}

      {/* ── HISTORY TAB ── */}
      {activeSection === "history" && (
        <Card>
          <div className="mb-5">
            <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Patient profile</div>
            <h3 className="font-serif text-xl text-gold-gradient mt-0.5">Visit History — {selected.patientName}</h3>
          </div>

          {/* Medical history from patient profile */}
          {(() => {
            const patient = users.find((u) => u.id === selected.patientId);
            const mh = patient?.medicalHistory;
            if (!mh) return null;
            return (
              <div className="mb-5 rounded-xl border border-gold-500/20 bg-gold-500/5 p-4 space-y-2">
                <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/70 mb-2">Patient Medical History</div>
                {mh.allergies && <MedRow label="Allergies" value={mh.allergies} />}
                {mh.currentMedications && <MedRow label="Medications" value={mh.currentMedications} />}
                {mh.medicalConditions && <MedRow label="Conditions" value={mh.medicalConditions} />}
                {mh.previousDentalWork && <MedRow label="Previous Dental Work" value={mh.previousDentalWork} />}
              </div>
            );
          })()}
          {patientHistory.length === 0 ? (
            <p className="text-sm text-gold-100/50">No previous visits found for this patient.</p>
          ) : (
            <div className="space-y-3">
              {patientHistory.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-gold-500/15 bg-ink-900/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <div>
                      <span className="font-medium text-gold-100">{entry.serviceName}</span>
                      <span className="ml-3 text-xs text-gold-300/50">{entry.date} · {entry.time}</span>
                    </div>
                    <Badge tone={entry.status as any}>{entry.status}</Badge>
                  </div>
                  {(entry.diagnosis || entry.notes) ? (
                    <div className="grid sm:grid-cols-2 gap-3 mt-2">
                      {entry.diagnosis && (
                        <div>
                          <div className="text-[9px] uppercase tracking-wider text-gold-300/50 mb-1">Diagnosis</div>
                          <p className="text-xs text-gold-100/65 leading-relaxed">{entry.diagnosis}</p>
                        </div>
                      )}
                      {entry.notes && (
                        <div>
                          <div className="text-[9px] uppercase tracking-wider text-gold-300/50 mb-1">Notes</div>
                          <p className="text-xs text-gold-100/65 leading-relaxed">{entry.notes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gold-100/40 mt-1">No clinical notes recorded for this visit.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}


function MedRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm">
      <span className="text-gold-300/60 text-xs uppercase tracking-wider">{label}: </span>
      <span className="text-gold-100/75">{value}</span>
    </div>
  );
}
