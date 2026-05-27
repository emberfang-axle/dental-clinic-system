import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, ConfirmDialog, Input, Label, Textarea } from "../../components/ui";
import { DataTable } from "../../components/ui/DataTable";
import { ToothChart } from "../../components/ui/ToothChart";
import { recordsService } from "../../services/records";
import { useStore } from "../../store/store";
import { formatDateTime, sortAppointmentsLatestFirst } from "../../shared/helpers";
import type { Appointment } from "../../shared/types";

function MedRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm">
      <span className="text-gold-300/60 text-xs uppercase tracking-wider">{label}: </span>
      <span className="text-gold-100/75">{value}</span>
    </div>
  );
}

type RecordForm = {
  diagnosis: string;
  treatmentPlan: string;
  dentalHistory: string;
  notes: string;
  toothChart: Record<string, string>;
};

type ProgressForm = {
  complaint: string;
  diagnosis: string;
  treatmentPlan: string;
  prescription: string;
  followUpDate: string;
  notes: string;
};

const EMPTY_FORM: RecordForm = {
  diagnosis: "", treatmentPlan: "", dentalHistory: "",
  notes: "", toothChart: {},
};

const EMPTY_PROGRESS: ProgressForm = {
  complaint: "", diagnosis: "", treatmentPlan: "",
  prescription: "", followUpDate: "", notes: "",
};

const TABS = [
  { id: "progress",   label: "Progress Notes" },
  { id: "toothchart", label: "Tooth Chart" },
  { id: "notes",      label: "Clinical Notes" },
  { id: "history",    label: "Patient History" },
] as const;

type TabId = typeof TABS[number]["id"];

export function ClinicalRecords() {
  const { appointments, user, users } = useStore();
  if (!user) return null;

  const editable = useMemo(() => {
    const base = appointments.filter((a) => a.status !== "cancelled");
    // Admin can see all records; doctors/co-doctors should only see appointments assigned to them.
    if (user.role === "admin") return base;
    return base.filter((a) => (a.doctor ?? "").trim() === user.name.trim());
  }, [appointments, user.role, user.name]);

  const [selectedId, setSelectedId] = useState(editable[0]?.id ?? "");
  const [form, setForm] = useState<RecordForm>(EMPTY_FORM);
  const [progressForm, setProgressForm] = useState<ProgressForm>(EMPTY_PROGRESS);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("progress");
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteProgress, setConfirmDeleteProgress] = useState(false);

  const filtered = useMemo(() => {
    const list = search.trim()
      ? editable.filter((a) =>
          `${a.patientName} ${a.serviceName}`.toLowerCase().includes(search.toLowerCase()),
        )
      : editable;
    return [...list].sort(sortAppointmentsLatestFirst);
  }, [editable, search]);

  const selected = filtered.find((a) => a.id === selectedId) ?? filtered[0];
  const currentIndex = filtered.findIndex((a) => a.id === selected?.id);
  const hasNext = currentIndex < filtered.length - 1;

  const patientHistory = useMemo(() => {
    if (!selected) return [];
    return appointments
      .filter((a) =>
        a.patientId === selected.patientId &&
        a.id !== selected.id &&
        a.status !== "cancelled" &&
        // Doctors/co-doctors should only see history entries assigned to them.
        (user.role === "admin" ? true : (a.doctor ?? "").trim() === user.name.trim()),
      )
      .sort(sortAppointmentsLatestFirst);
  }, [appointments, selected, user.role, user.name]);

  function toothSummary(chart?: Record<string, string>) {
    if (!chart) return "—";
    const marked = Object.entries(chart).filter(([, v]) => v && v !== "Healthy");
    if (!marked.length) return "—";
    return marked.map(([t, c]) => `#${t} ${c}`).join(", ");
  }

  useEffect(() => {
    if (!editable.find((a) => a.id === selectedId) && editable[0]) {
      setSelectedId(editable[0].id);
    }
  }, [editable, selectedId]);

  useEffect(() => {
    if (!selected) return;
    setForm({
      diagnosis:      selected.diagnosis      || "",
      treatmentPlan:  selected.treatmentPlan  || "",
      dentalHistory:  selected.dentalHistory  || "",
      notes:          selected.notes          || "",
      toothChart:     selected.toothChart ?? {},
    });
    setProgressForm({
      complaint:     selected.complaint     || "",
      diagnosis:     selected.diagnosis     || "",
      treatmentPlan: selected.treatmentPlan || "",
      prescription:  selected.prescription  || "",
      followUpDate:  selected.followUpDate  || "",
      notes:         selected.notes         || "",
    });
    setSaved(false);
    setSaveError("");
  }, [selected?.id, selected?.updatedAt]);

  if (!selected) {
    return <Card><p className="text-sm text-gold-100/60">No appointment records available yet.</p></Card>;
  }

  const isReadOnly = selected.status === "completed"
    && user.role !== "admin" && user.role !== "doctor" && user.role !== "co-doctor";
  const hasNotes = !!(form.diagnosis || form.treatmentPlan || form.dentalHistory || form.notes);

  async function handleSave() {
    setSaving(true); setSaveError("");
    try {
      await recordsService.saveTreatment(selected.id, form, user!.name);
      setSaved(true);
    } catch (e: any) {
      setSaveError(e.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProgress() {
    setSaving(true); setSaveError("");
    try {
      await recordsService.saveProgressNote(selected.id, progressForm, user!.name);
      setSaved(true);
    } catch (e: any) {
      setSaveError(e.message || "Failed to save progress note.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProgress() {
    setDeleting(true); setSaveError("");
    try {
      await recordsService.deleteProgressNote(selected.id, user!.name);
      setSaved(false);
    } catch (e: any) {
      setSaveError(e.message || "Failed to delete progress note.");
    } finally {
      setDeleting(false);
    }
  }

  const patient = users.find((u) => u.id === selected.patientId);
  const mh = patient?.medicalHistory;

  return (
    <div className="space-y-4">

      <Card className="!p-4 space-y-4">
        <Input
          placeholder="Search patient or service…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <DataTable
          columns={[
            {
              key: "patient",
              header: "Patient",
              render: (a) => <span className="font-medium text-gold-100">{a.patientName}</span>,
            },
            {
              key: "service",
              header: "Service",
              render: (a) => <span className="text-xs text-gold-100/70">{a.serviceName}</span>,
            },
            {
              key: "date",
              header: "Date",
              render: (a) => <span className="text-xs">{a.date} · {a.time}</span>,
            },
            {
              key: "status",
              header: "Status",
              render: (a) => <Badge tone={a.status as "pending"}>{a.status}</Badge>,
            },
            {
              key: "payment",
              header: "Payment",
              render: (a) => (
                <span className="text-xs capitalize">
                  {a.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                </span>
              ),
            },
            {
              key: "chart",
              header: "Tooth chart",
              render: (a) => (
                <span className="text-[10px] text-gold-100/50 max-w-[140px] truncate block">
                  {toothSummary(a.toothChart)}
                </span>
              ),
            },
          ]}
          rows={filtered}
          rowKey={(a) => a.id}
          selectedKey={selected.id}
          onRowClick={(a) => setSelectedId(a.id)}
          pageSize={8}
          emptyMessage="No appointments to record."
        />
        <div className="flex items-center gap-2 flex-wrap">
          <Badge tone={selected.status as any}>{selected.status}</Badge>
          {hasNotes && <Badge tone="paid">Has Notes</Badge>}
        </div>

        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Patient",     value: selected.patientName },
            { label: "Service",     value: selected.serviceName },
            { label: "Date & Time", value: `${selected.date} · ${selected.time}` },
            { label: "Payment",     value: `${selected.paymentMethod.toUpperCase()} · ${selected.paymentStatus.replace(/_/g, " ")}` },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-gold-500/15 bg-ink-900/40 px-3 py-2">
              <div className="text-[9px] uppercase tracking-[0.2em] text-gold-300/50 mb-0.5">{item.label}</div>
              <div className="text-sm text-gold-100 font-medium truncate">{item.value}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-ink-900/60 border border-gold-500/15 w-fit flex-wrap">
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`px-4 py-2 rounded-lg text-xs uppercase tracking-[0.18em] font-semibold transition-all ${
              activeTab === id ? "bg-gold-gradient text-ink-950 shadow-gold" : "text-gold-100/50 hover:text-gold-200"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* PROGRESS NOTES TAB */}
      {activeTab === "progress" && (
        <Card>
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Clinical Records · Progress Notes</div>
              <h3 className="font-serif text-xl text-gold-gradient mt-0.5">
                {selected.patientName} — {selected.serviceName}
              </h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isReadOnly && <Badge tone="completed">Read-only</Badge>}
              {saved && <Badge tone="paid">Saved</Badge>}
              {selected.progressNoteAt && (
                <div className="text-right">
                  <div className="text-[10px] text-gold-100/50 font-medium">{selected.progressNoteBy ?? "Doctor"}</div>
                  <div className="text-[10px] text-gold-100/35">{formatDateTime(selected.progressNoteAt)}</div>
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {([
              { field: "complaint",     label: "Chief Complaint",     placeholder: "Patient's main complaint…",          rows: 3 },
              { field: "diagnosis",     label: "Diagnosis",           placeholder: "Enter diagnosis…",                   rows: 3 },
              { field: "treatmentPlan", label: "Treatment Performed", placeholder: "Describe the treatment performed…",  rows: 3 },
              { field: "prescription",  label: "Prescription",        placeholder: "Medications prescribed, dosage…",    rows: 3 },
              { field: "followUpDate",  label: "Follow-up Schedule",  placeholder: "e.g. 2026-06-15 or 'In 2 weeks'",   rows: 1 },
              { field: "notes",         label: "Additional Notes",    placeholder: "Other observations or instructions…", rows: 3 },
            ] as const).map(({ field, label, placeholder, rows }) => (
              <div key={field}>
                <Label>{label}</Label>
                <Textarea
                  rows={rows}
                  placeholder={placeholder}
                  value={progressForm[field]}
                  disabled={isReadOnly}
                  onChange={(e) => setProgressForm((p) => ({ ...p, [field]: e.target.value }))}
                />
              </div>
            ))}
          </div>

          {selected.progressNoteAt && (
            <div className="mt-5 rounded-xl border border-gold-500/15 bg-ink-900/40 p-4 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase tracking-wider text-gold-300/55">Last Saved Progress Note</div>
                <div className="text-[10px] text-gold-100/35">
                  Recorded by <span className="text-gold-200/60">{selected.progressNoteBy ?? "Doctor"}</span> · {formatDateTime(selected.progressNoteAt)}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {selected.complaint     && <MedRow label="Complaint"    value={selected.complaint} />}
                {selected.diagnosis     && <MedRow label="Diagnosis"    value={selected.diagnosis} />}
                {selected.treatmentPlan && <MedRow label="Treatment"    value={selected.treatmentPlan} />}
                {selected.prescription  && <MedRow label="Prescription" value={selected.prescription} />}
                {selected.followUpDate  && <MedRow label="Follow-up"    value={selected.followUpDate} />}
                {selected.notes         && <MedRow label="Notes"        value={selected.notes} />}
              </div>
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-gold-500/15 flex flex-wrap items-center gap-3">
            {!isReadOnly && (
              <>
                <Button disabled={saving} onClick={handleSaveProgress}>
                  {saving ? "Saving…" : selected.progressNoteAt ? "Update Progress Note" : "Save Progress Note"}
                </Button>
                {selected.progressNoteAt && (
                  <Button variant="outline" size="sm" disabled={deleting} onClick={() => setConfirmDeleteProgress(true)}>
                    {deleting ? "Deleting…" : "Delete Note"}
                  </Button>
                )}
              </>
            )}
            <span className="text-xs text-gold-100/40">Saved notes are logged in the audit trail.</span>
            {saveError && <p className="text-sm text-red-400">{saveError}</p>}
          </div>
        </Card>
      )}

      {/* CLINICAL NOTES TAB */}
      {activeTab === "notes" && (
        <Card>
          <div className="flex items-center justify-between gap-3 mb-5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Clinical workspace</div>
              <h3 className="font-serif text-xl text-gold-gradient mt-0.5">
                {selected.patientName} — {selected.serviceName}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {isReadOnly && <Badge tone="completed">Read-only</Badge>}
              {saved && <Badge tone="paid">Saved</Badge>}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {([
              { field: "diagnosis",     label: "Diagnosis",     placeholder: "Enter diagnosis…" },
              { field: "treatmentPlan", label: "Treatment Plan", placeholder: "Describe the treatment plan…" },
              { field: "dentalHistory", label: "Dental History", placeholder: "Relevant dental history…" },
              { field: "notes",         label: "Doctor Notes",   placeholder: "Additional observations or instructions…" },
            ] as const).map(({ field, label, placeholder }) => (
              <div key={field}>
                <Label>{label}</Label>
                <Textarea rows={4} placeholder={placeholder} value={form[field]} disabled={isReadOnly}
                  onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))} />
              </div>
            ))}
          </div>

          {(selected.diagnosis || selected.notes || selected.treatmentPlan) && (
            <div className="mt-4 p-4 rounded-xl border border-gold-500/15 bg-ink-900/40 space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-gold-300/50">Last Saved Record</div>
              {selected.diagnosis     && <p className="text-xs text-gold-100/60"><span className="text-gold-300/70">Diagnosis:</span> {selected.diagnosis}</p>}
              {selected.treatmentPlan && <p className="text-xs text-gold-100/60"><span className="text-gold-300/70">Plan:</span> {selected.treatmentPlan}</p>}
              {selected.notes         && <p className="text-xs text-gold-100/60"><span className="text-gold-300/70">Notes:</span> {selected.notes}</p>}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-gold-500/15 flex flex-wrap items-center gap-3">
            {!isReadOnly && (
              <>
                <Button disabled={saving} onClick={handleSave}>{saving ? "Saving…" : "Save Clinical Record"}</Button>
                {saved && hasNext && (
                  <Button variant="outline" size="sm" onClick={() => { setSelectedId(filtered[currentIndex + 1].id); setSaved(false); }}>
                    Next Patient
                  </Button>
                )}
              </>
            )}
            <span className="text-xs text-gold-100/40">All actions are logged in the audit trail.</span>
            {saveError && <p className="text-sm text-red-400">{saveError}</p>}
          </div>
        </Card>
      )}

      {/* TOOTH CHART TAB */}
      {activeTab === "toothchart" && (
        <Card>
          <div className="mb-5">
            <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Odontogram</div>
            <h3 className="font-serif text-xl text-gold-gradient mt-0.5">Tooth Chart — {selected.patientName}</h3>
            <p className="text-xs text-gold-100/40 mt-1">
              Choose a condition, then click teeth to mark (e.g. Extraction). Saved to patient history.
            </p>
          </div>
          <ToothChart
            value={form.toothChart}
            readOnly={isReadOnly}
            onChange={(updated) => {
              const updatedForm = { ...form, toothChart: updated };
              setForm(updatedForm);
              recordsService.saveTreatment(selected.id, updatedForm, user!.name)
                .then(() => setSaved(true))
                .catch((e: any) => setSaveError(e.message || "Failed to save tooth chart."));
            }}
          />
          {saveError && <p className="mt-3 text-sm text-red-400">{saveError}</p>}
          {saved && <p className="mt-3 text-sm text-emerald-400">Tooth chart saved.</p>}
        </Card>
      )}

      {/* HISTORY TAB */}
      {activeTab === "history" && (
        <Card>
          <div className="mb-5">
            <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Clinical Records · Patient Profile</div>
            <h3 className="font-serif text-xl text-gold-gradient mt-0.5">Visit History — {selected.patientName}</h3>
          </div>

          {mh && (
            <div className="mb-5 rounded-xl border border-gold-500/20 bg-gold-500/5 p-4 space-y-2">
              <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/70 mb-2">Medical History</div>
              {mh.allergies          && <MedRow label="Allergies"            value={mh.allergies} />}
              {mh.currentMedications && <MedRow label="Current Medications"  value={mh.currentMedications} />}
              {mh.medicalConditions  && <MedRow label="Medical Conditions"   value={mh.medicalConditions} />}
              {mh.previousDentalWork && <MedRow label="Previous Dental Work" value={mh.previousDentalWork} />}
            </div>
          )}

          {selected.dentalHistory && (
            <div className="mb-5 rounded-xl border border-gold-500/20 bg-ink-900/40 p-4">
              <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/70 mb-2">Dental History</div>
              <p className="text-sm text-gold-100/70 leading-relaxed">{selected.dentalHistory}</p>
            </div>
          )}

          <DataTable
            columns={[
              {
                key: "date",
                header: "Date",
                render: (e) => <span className="text-xs">{e.date}</span>,
              },
              {
                key: "service",
                header: "Service",
                render: (e) => <span className="text-gold-100/80">{e.serviceName}</span>,
              },
              {
                key: "status",
                header: "Status",
                render: (e) => <Badge tone={e.status as "completed"}>{e.status}</Badge>,
              },
              {
                key: "diagnosis",
                header: "Diagnosis",
                render: (e) => (
                  <span className="text-xs text-gold-100/60 truncate max-w-[160px] block">
                    {e.diagnosis || "—"}
                  </span>
                ),
              },
              {
                key: "teeth",
                header: "Tooth markings",
                render: (e) => (
                  <span className="text-[10px] text-gold-100/50">{toothSummary(e.toothChart)}</span>
                ),
              },
            ]}
            rows={patientHistory}
            rowKey={(e) => e.id}
            sortCompare={sortAppointmentsLatestFirst}
            pageSize={5}
            emptyMessage="No previous visits for this patient."
          />
        </Card>
      )}

      <ConfirmDialog
        open={confirmDeleteProgress}
        title="Delete progress note?"
        message="This action will be logged. The progress note will be permanently removed from this appointment."
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirmDeleteProgress(false)}
        onConfirm={() => {
          setConfirmDeleteProgress(false);
          void handleDeleteProgress();
        }}
      />
    </div>
  );
}
