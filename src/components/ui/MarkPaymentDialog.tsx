import { useState } from "react";
import { Button, Label, Textarea } from "./index";
import { treatmentNotesPreview } from "../../shared/helpers";
import type { Appointment, PaymentMethod } from "../../shared/types";

type Props = {
  appointment: Appointment;
  onConfirm: (method: PaymentMethod, staffNote: string) => Promise<void>;
  onCancel: () => void;
};

export function MarkPaymentDialog({ appointment: a, onConfirm, onCancel }: Props) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [staffNote, setStaffNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await onConfirm(method, staffNote);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not record payment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} aria-label="Close" />
      <div className="relative glass-strong rounded-2xl p-6 max-w-md w-full shadow-luxe space-y-4">
        <h3 className="font-serif text-xl text-gold-shine">Record Payment</h3>
        <p className="text-sm text-gold-100/60">
          <span className="text-gold-200 font-medium">{a.patientName}</span> · {a.serviceName}
        </p>
        <p className="text-lg font-mono text-gold-300">₱{a.price.toLocaleString()}</p>

        <div className="rounded-lg border border-gold-500/20 bg-ink-900/50 p-3 text-xs text-gold-100/65 leading-relaxed">
          <p className="text-[10px] uppercase tracking-wider text-gold-400/70 mb-1">Dentist notes</p>
          {treatmentNotesPreview(a)}
        </div>

        <div>
          <Label>Payment method</Label>
          <div className="flex gap-2 mt-2">
            {(["cash", "gcash"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition ${
                  method === m
                    ? "border-gold-400 bg-gold-500/15 text-gold-100"
                    : "border-gold-500/25 text-gold-100/60 hover:border-gold-400/50"
                }`}
              >
                {m === "cash" ? "Cash" : "GCash"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="pay-staff-note">Staff note (optional)</Label>
          <Textarea
            id="pay-staff-note"
            rows={2}
            value={staffNote}
            onChange={(e) => setStaffNote(e.target.value)}
            placeholder="e.g. Paid at front desk, GCash ref #1234"
          />
        </div>

        {error && <p className="text-xs text-red-400" role="alert">{error}</p>}

        <div className="flex gap-3 justify-end pt-1">
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={busy}>
            {busy ? "Saving…" : "Confirm Payment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
