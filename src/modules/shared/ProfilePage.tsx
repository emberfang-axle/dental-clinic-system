import { useEffect, useState } from "react";
import { Button, Card, Label, Textarea } from "../../components/ui";
import { useStore, getSnapshot, setState } from "../../store/store";
import { initials, roleLabel } from "../../shared/helpers";
import { updateDocTyped } from "../../services/firestore";
import type { MedicalHistory, Role } from "../../shared/types";

export function ProfilePage() {
  const { user } = useStore() as {
    user: { id: string; name: string; email: string; phone: string; role: Role; medicalHistory?: MedicalHistory } | null;
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gold-gradient flex items-center justify-center text-ink-950 font-bold text-2xl shadow-gold">
            {initials(user.name)}
          </div>
          <div>
            <div className="text-2xl font-serif text-gold-gradient">{user.name}</div>
            <div className="text-sm text-gold-300/70">{roleLabel(user.role)}</div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full Name" value={user.name} />
          <Field label="Email" value={user.email} />
          <div className="sm:col-span-2"><Field label="Phone" value={user.phone || "—"} /></div>
        </div>
      </Card>

      {user.role === "patient" && (
        <LoyaltySummary userId={user.id} />
      )}

      {user.role === "patient" && (
        <MedicalHistoryForm userId={user.id} history={user.medicalHistory} />
      )}
    </div>
  );
}

function LoyaltySummary({ userId }: { userId: string }) {
  const { appointments } = useStore();
  const mine = appointments.filter((a) => a.patientId === userId && a.status !== "cancelled");
  const paid = mine.filter((a) => a.paymentStatus === "paid");
  const totalSpent = paid.reduce((s, a) => s + a.price, 0);
  const lastVisit = [...mine].sort((a, b) => b.date.localeCompare(a.date))[0];

  return (
    <Card>
      <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55 mb-1">Your activity</div>
      <h3 className="font-serif text-xl text-gold-gradient mb-5">Loyalty Summary</h3>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="rounded-xl border border-gold-500/15 bg-ink-900/40 p-4">
          <div className="text-3xl font-serif text-gold-gradient">{mine.length}</div>
          <div className="text-xs text-gold-100/50 mt-1 uppercase tracking-wider">Total Visits</div>
        </div>
        <div className="rounded-xl border border-gold-500/15 bg-ink-900/40 p-4">
          <div className="text-2xl font-serif text-gold-gradient">₱{totalSpent.toLocaleString()}</div>
          <div className="text-xs text-gold-100/50 mt-1 uppercase tracking-wider">Total Spent</div>
        </div>
        <div className="rounded-xl border border-gold-500/15 bg-ink-900/40 p-4">
          <div className="text-lg font-serif text-gold-gradient">{lastVisit ? lastVisit.date : "—"}</div>
          <div className="text-xs text-gold-100/50 mt-1 uppercase tracking-wider">Last Visit</div>
        </div>
      </div>
    </Card>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.2em] text-gold-300/55 mb-1">{label}</div>
      <div className="rounded-lg border border-gold-500/15 bg-ink-900/40 px-3 py-2.5 text-sm text-gold-100/80">{value}</div>
    </div>
  );
}

function MedicalHistoryForm({ userId, history }: { userId: string; history?: MedicalHistory }) {
  const [form, setForm] = useState<MedicalHistory>({
    allergies: history?.allergies || "",
    currentMedications: history?.currentMedications || "",
    previousDentalWork: history?.previousDentalWork || "",
    medicalConditions: history?.medicalConditions || "",
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      allergies: history?.allergies || "",
      currentMedications: history?.currentMedications || "",
      previousDentalWork: history?.previousDentalWork || "",
      medicalConditions: history?.medicalConditions || "",
    });
  }, [history]);

  const handleSave = async () => {
    setSaving(true);
    await updateDocTyped("users", userId, { medicalHistory: form } as any);
    const snap = getSnapshot();
    if (snap.user) setState({ user: { ...snap.user, medicalHistory: form } });
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Card>
      <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55 mb-1">Medical Information</div>
      <h3 className="font-serif text-xl text-gold-gradient mb-5">Medical History</h3>
      <div className="space-y-4">
        <MedField label="Allergies" placeholder="e.g. Penicillin, latex, ibuprofen — or None" value={form.allergies} onChange={(v) => setForm((p) => ({ ...p, allergies: v }))} />
        <MedField label="Current Medications" placeholder="e.g. Metformin 500mg, Amlodipine — or None" value={form.currentMedications} onChange={(v) => setForm((p) => ({ ...p, currentMedications: v }))} />
        <MedField label="Medical Conditions" placeholder="e.g. Diabetes, hypertension, heart disease — or None" value={form.medicalConditions} onChange={(v) => setForm((p) => ({ ...p, medicalConditions: v }))} />
        <MedField label="Previous Dental Work" placeholder="e.g. Extraction 2022, braces 2019 — or None" value={form.previousDentalWork} onChange={(v) => setForm((p) => ({ ...p, previousDentalWork: v }))} />
      </div>
      <Button className="mt-5" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save Medical History"}
      </Button>
      {saved && <p className="mt-3 text-emerald-400 text-sm">✓ Medical history saved.</p>}
    </Card>
  );
}

function MedField({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Textarea rows={2} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
