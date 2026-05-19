import { useEffect, useState } from "react";
import { Button, Card, Input, Label, Textarea } from "../../components/ui";
import { useStore } from "../../store/store";
import { authService } from "../../services/auth";
import { initials, roleLabel } from "../../shared/helpers";
import type { MedicalHistory } from "../../shared/types";

export function ProfilePage() {
  const { user } = useStore();
  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <ProfileCard />
      {user.role === "patient" && <LoyaltySummary userId={user.id} />}
      {user.role === "patient" && <MedicalHistoryForm userId={user.id} history={user.medicalHistory} />}
    </div>
  );
}

function ProfileCard() {
  const { user } = useStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) { setName(user.name); setPhone(user.phone || ""); setAddress(user.address || ""); }
  }, [user]);

  if (!user) return null;

  async function save() {
    if (!name.trim()) { setError("Name is required."); return; }
    setError(""); setSaving(true);
    try {
      await authService.updateProfile(user!.id, { name: name.trim(), phone: phone.trim() || undefined, address: address.trim() || undefined }, user!.name);
      setSuccess(true);
      setEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-gold-gradient flex items-center justify-center text-ink-950 font-bold text-2xl shadow-gold shrink-0" aria-hidden="true">
          {initials(user.name)}
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-serif text-gold-gradient truncate">{user.name}</div>
          <div className="text-sm text-gold-300/70">{roleLabel(user.role)}</div>
          {user.patientNo && (
            <div className="mt-1 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-gold-300/60 bg-gold-500/10 border border-gold-500/20 rounded px-2 py-0.5">
              Patient ID: <span className="text-gold-300 font-semibold">{user.patientNo}</span>
            </div>
          )}
        </div>
        <Button size="sm" variant="outline" className="ml-auto shrink-0" onClick={() => { setEditing((v) => !v); setError(""); }}>
          {editing ? "Cancel" : "Edit"}
        </Button>
      </div>

      {editing ? (
        <div className="space-y-4">
          <div>
            <Label htmlFor="profile-name">Full Name</Label>
            <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required />
          </div>
          <div>
            <Label htmlFor="profile-phone">Phone Number</Label>
            <Input id="profile-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xx xxx xxxx" type="tel" />
          </div>
          {user.role === "patient" && (
            <div>
              <Label htmlFor="profile-address">Address</Label>
              <Input id="profile-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Your address" />
            </div>
          )}
          <div>
            <Label>Email Address</Label>
            <div className="rounded-lg border border-gold-500/15 bg-ink-900/40 px-3 py-2.5 text-sm text-gold-100/50">{user.email}</div>
            <p className="text-xs text-gold-100/40 mt-1">Email changes require verification. Contact admin to update.</p>
          </div>
          {error && <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded px-3 py-2" role="alert">{error}</p>}
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full Name" value={user.name} />
          <Field label="Email" value={user.email} />
          <Field label="Phone" value={user.phone || "—"} />
          {user.address && <Field label="Address" value={user.address} />}
        </div>
      )}

      {success && <p className="mt-3 text-emerald-400 text-sm" role="status">Profile updated successfully.</p>}
    </Card>
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
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      allergies: history?.allergies || "",
      currentMedications: history?.currentMedications || "",
      previousDentalWork: history?.previousDentalWork || "",
      medicalConditions: history?.medicalConditions || "",
    });
  }, [history]);

  const handleSave = async () => {
    setError(""); setSaving(true);
    try {
      await authService.updateProfile(userId, { medicalHistory: form });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55 mb-1">Medical Information</div>
      <h3 className="font-serif text-xl text-gold-gradient mb-5">Medical History</h3>
      <div className="space-y-4">
        <MedField label="Allergies" placeholder="e.g. Penicillin, latex — or None" value={form.allergies} onChange={(v) => setForm((p) => ({ ...p, allergies: v }))} />
        <MedField label="Current Medications" placeholder="e.g. Metformin 500mg — or None" value={form.currentMedications} onChange={(v) => setForm((p) => ({ ...p, currentMedications: v }))} />
        <MedField label="Medical Conditions" placeholder="e.g. Diabetes, hypertension — or None" value={form.medicalConditions} onChange={(v) => setForm((p) => ({ ...p, medicalConditions: v }))} />
        <MedField label="Previous Dental Work" placeholder="e.g. Extraction 2022 — or None" value={form.previousDentalWork} onChange={(v) => setForm((p) => ({ ...p, previousDentalWork: v }))} />
      </div>
      {error && <p className="mt-3 text-sm text-red-300" role="alert">{error}</p>}
      <Button className="mt-5" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save Medical History"}
      </Button>
      {saved && <p className="mt-3 text-emerald-400 text-sm" role="status">Medical history saved.</p>}
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
