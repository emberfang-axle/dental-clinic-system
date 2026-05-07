import { useEffect, useState } from "react";
import { Button, Card, Input, Label, Select, Textarea } from "../../components/ui";
import { calendarService } from "../../services/calendar";
import { settingsService } from "../../services/settings";
import { useStore } from "../../store/store";
import { BOOKING } from "../../shared/constants";
import type { ClinicSettings } from "../../shared/types";

const DEFAULT_SETTINGS: ClinicSettings = {
  workingHoursStart: "09:00",
  workingHoursEnd: "17:00",
  bookingInterval: 60,
  maxAppointmentsPerDay: 7,
  allowEmergencyPriority: true,
  gcashNumber: "",
  bookingRules: "",
};

export function ScheduleRules() {
  const { settings, user, appointments } = useStore();
  const [form, setForm] = useState<ClinicSettings>({ ...DEFAULT_SETTINGS, ...settings });
  const [saved, setSaved] = useState(false);
  const [blockError, setBlockError] = useState("");
  const [blockedDate, setBlockedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [blockedTime, setBlockedTime] = useState<string>(BOOKING.TIME_SLOTS[0]);
  const [blockedReason, setBlockedReason] = useState("Doctor unavailable");
  const [blockedSlots, setBlockedSlots] = useState(() => calendarService.listBlockedSlots());

  useEffect(() => { setForm({ ...DEFAULT_SETTINGS, ...settings }); }, [settings]);

  const today = new Date().toISOString().slice(0, 10);
  const todayBookings = appointments.filter((a) => a.date === today && a.status !== "cancelled").length;
  const capacity = form.maxAppointmentsPerDay || DEFAULT_SETTINGS.maxAppointmentsPerDay;
  const remaining = Math.max(0, capacity - todayBookings);

  function handleBlock() {
    if (!blockedDate) { setBlockError("Please select a date."); return; }
    if (!blockedTime) { setBlockError("Please select a time."); return; }
    setBlockError("");
    calendarService.blockSlot(blockedDate, blockedTime, blockedReason.trim() || "Doctor unavailable");
    setBlockedSlots(calendarService.listBlockedSlots());
  }

  return (
    <div className="grid xl:grid-cols-[0.95fr_1.05fr] gap-6">
      {/* ── LEFT: Settings form ── */}
      <Card>
        <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Appointment authority</div>
        <h3 className="mt-2 font-serif text-2xl text-gold-gradient">Clinic Working Hours & Booking Rules</h3>

        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Start of Clinic Hours</Label>
            <Input type="time" value={form.workingHoursStart || ""} onChange={(e) => setForm((p) => ({ ...p, workingHoursStart: e.target.value }))} />
          </div>
          <div>
            <Label>End of Clinic Hours</Label>
            <Input type="time" value={form.workingHoursEnd || ""} onChange={(e) => setForm((p) => ({ ...p, workingHoursEnd: e.target.value }))} />
          </div>
          <div>
            <Label>Booking Interval (minutes)</Label>
            <Input type="number" min={15} value={form.bookingInterval || DEFAULT_SETTINGS.bookingInterval} onChange={(e) => setForm((p) => ({ ...p, bookingInterval: Number(e.target.value) || 60 }))} />
          </div>
          <div>
            <Label>Max Appointments Per Day</Label>
            <Input type="number" min={1} value={form.maxAppointmentsPerDay || DEFAULT_SETTINGS.maxAppointmentsPerDay} onChange={(e) => setForm((p) => ({ ...p, maxAppointmentsPerDay: Number(e.target.value) || 1 }))} />
          </div>
        </div>

        <div className="mt-4">
          <Label>Clinic GCash Number</Label>
          <Input value={form.gcashNumber || ""} onChange={(e) => setForm((p) => ({ ...p, gcashNumber: e.target.value }))} placeholder="e.g. 09107614956" />
        </div>

        <div className="mt-4">
          <Label>Booking & Payment Rules</Label>
          <Textarea rows={4} value={form.bookingRules || ""} onChange={(e) => setForm((p) => ({ ...p, bookingRules: e.target.value }))} placeholder="e.g. Arrive 10 minutes early. GCash payment must be submitted within 24 hours." />
        </div>

        <label className="mt-5 flex items-center gap-3 rounded-xl border border-gold-500/15 bg-ink-900/50 p-4 cursor-pointer">
          <input type="checkbox" checked={!!form.allowEmergencyPriority} onChange={(e) => setForm((p) => ({ ...p, allowEmergencyPriority: e.target.checked }))} className="h-4 w-4 accent-[#d4af37]" />
          <div>
            <div className="text-sm font-medium text-gold-100">Allow emergency / priority overrides</div>
            <div className="text-xs text-gold-100/50">Doctor can insert urgent appointments ahead of regular queue slots.</div>
          </div>
        </label>

        <div className="mt-5 flex items-center gap-3 flex-wrap">
          <Button onClick={async () => { await settingsService.updateClinic(form, user!.name); setSaved(true); setTimeout(() => setSaved(false), 3000); }}>
            Save Rules
          </Button>
          {saved && <span className="text-sm text-emerald-400">✓ Saved.</span>}
        </div>

        {/* ── Block Time Slot ── */}
        <div className="mt-8 border-t border-gold-500/20 pt-6">
          <h4 className="font-serif text-xl text-gold-gradient mb-1">Block Time Slot</h4>
          <p className="text-sm text-gold-100/50 mb-4">Prevent patients from booking a specific date and time.</p>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label>Date</Label>
              <Input type="date" value={blockedDate} min={today} onChange={(e) => { setBlockedDate(e.target.value); setBlockError(""); }} />
            </div>
            <div>
              <Label>Time</Label>
              <Select value={blockedTime} onChange={(e) => { setBlockedTime(e.target.value); setBlockError(""); }}>
                {BOOKING.TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Reason</Label>
              <Input value={blockedReason} onChange={(e) => setBlockedReason(e.target.value)} placeholder="Doctor unavailable" />
            </div>
          </div>
          {blockError && <p className="mt-2 text-xs text-red-400">{blockError}</p>}
          <Button className="mt-3" onClick={handleBlock}>Block Slot</Button>
        </div>
      </Card>

      {/* ── RIGHT: Today overview + blocked slots ── */}
      <div className="space-y-6">
        <Card>
          <h3 className="font-serif text-2xl text-gold-gradient mb-5">Today's Overview</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-gold-500/15 bg-ink-900/40 p-4 text-center">
              <div className="text-3xl font-serif text-gold-gradient">{todayBookings}</div>
              <div className="text-xs text-gold-100/50 mt-1 uppercase tracking-wider">Bookings Today</div>
            </div>
            <div className="rounded-xl border border-gold-500/15 bg-ink-900/40 p-4 text-center">
              <div className="text-3xl font-serif text-gold-gradient">{remaining}</div>
              <div className="text-xs text-gold-100/50 mt-1 uppercase tracking-wider">Slots Remaining</div>
            </div>
            <div className="rounded-xl border border-gold-500/15 bg-ink-900/40 p-4 text-center">
              <div className="text-lg font-serif text-gold-gradient">
                {form.workingHoursStart && form.workingHoursEnd
                  ? `${form.workingHoursStart} – ${form.workingHoursEnd}`
                  : "Not set"}
              </div>
              <div className="text-xs text-gold-100/50 mt-1 uppercase tracking-wider">Clinic Hours</div>
            </div>
            <div className="rounded-xl border border-gold-500/15 bg-ink-900/40 p-4 text-center">
              <div className="text-3xl font-serif text-gold-gradient">
                {form.bookingInterval ? `${form.bookingInterval}m` : "—"}
              </div>
              <div className="text-xs text-gold-100/50 mt-1 uppercase tracking-wider">Interval</div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-serif text-2xl text-gold-gradient mb-4">Blocked Slots</h3>
          {blockedSlots.length === 0 ? (
            <p className="text-sm text-gold-100/50">No blocked slots.</p>
          ) : (
            <div className="space-y-2">
              {blockedSlots.map((slot) => (
                <div key={`${slot.date}-${slot.time}`} className="rounded-xl border border-gold-500/15 bg-ink-900/50 p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-gold-100 font-medium">{slot.date} · {slot.time}</div>
                    <div className="text-xs text-gold-100/50">{slot.reason || "Doctor unavailable"}</div>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      calendarService.unblockSlot(slot.date, slot.time);
                      setBlockedSlots(calendarService.listBlockedSlots());
                    }}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ─────────── STAFF ACCOUNTS ─────────── */
