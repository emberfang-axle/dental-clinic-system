import { useState } from "react";
import { Button } from "../../components/ui";
import { appointmentsService } from "../../services/appointments";

export function DepositForm({ appointmentId, price, actor, onDone }: {
  appointmentId: string; price: number; actor: string; onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-xs text-gold-300/70 underline hover:text-gold-300 transition">
      + Accept partial deposit
    </button>
  );

  return (
    <div className="mt-2 p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5 space-y-2">
      <p className="text-xs text-gold-100/60">Deposit amount (total: ₱{price.toLocaleString()})</p>
      <div className="flex gap-2 items-center">
        <input type="number" min={1} max={price - 1} placeholder="e.g. 500" value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-32 rounded-lg border border-gold-500/25 bg-ink-900/60 px-3 py-1.5 text-sm text-gold-100 focus:outline-none focus:border-gold-400"
        />
        <Button size="sm" disabled={saving || !amount} onClick={async () => {
          const dep = Number(amount);
          if (!dep || dep >= price) return;
          setSaving(true);
          await appointmentsService.update(appointmentId, { depositAmount: dep, depositPaidAt: new Date().toISOString(), paymentStatus: "partial_paid" }, actor);
          setSaving(false); setOpen(false); onDone();
        }}>
          {saving ? "Saving…" : "Record Deposit"}
        </Button>
        <button onClick={() => setOpen(false)} className="text-xs text-gold-100/40 hover:text-gold-100/70">Cancel</button>
      </div>
    </div>
  );
}
