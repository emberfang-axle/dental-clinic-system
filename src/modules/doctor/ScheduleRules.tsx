import { useEffect, useState } from "react";
import { Button, Card, Input, Label, Select, StatCard, Textarea } from "../../components/ui";
import { calendarService } from "../../services/calendar";
import { settingsService } from "../../services/settings";
import { useStore } from "../../store/store";
import { BOOKING } from "../../shared/constants";
import type { ClinicSettings } from "../../shared/types";

export function ScheduleRules() {
  const { settings, user, appointments } = useStore();
  const [form, setForm] = useState<ClinicSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [blockedDate, setBlockedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [blockedTime, setBlockedTime] = useState<string>(BOOKING.TIME_SLOTS[0]);
  const [blockedReason, setBlockedReason] = useState("Doctor unavailable");
  const [blockedSlots, setBlockedSlots] = useState(() => calendarService.listBlockedSlots());

  useEffect(() => { setForm(settings); }, [settings]);

  const todayQueue = appointments.filter(
    (a) => a.date === new Date().toISOString().slice(0, 10) && a.status !== "cancelled",
  ).length;

  return (
    <div className="grid xl:grid-cols-[0.95fr_1.05fr] gap-6">
      <Card>
        <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Appointment authority</div>
        <h3 className="mt-2 font-serif text-2xl text-gold-gradient">Clinic Working Hours & Booking Rules</h3>
        <p className="mt-3 text-sm text-gold-100/60 leading-relaxed">
          Control schedule availability, emergency priority behavior, payment instructions, and the daily booking load.
        </p>

        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          <div><Label>Start of Clinic Hours</Label><Input type="time" value={form.workingHoursStart} onChange={(e) => setForm((p) => ({ ...p, workingHoursStart: e.target.value }))} /></div>
          <div><Label>End of Clinic Hours</Label><Input type="time" value={form.workingHoursEnd} onChange={(e) => setForm((p) => ({ ...p, workingHoursEnd: e.target.value }))} /></div>
          <div><Label>Booking Interval (minutes)</Label><Input type="number" value={form.bookingInterval} onChange={(e) => setForm((p) => ({ ...p, bookingInterval: Number(e.target.value) || 30 }))} /></div>
          <div><Label>Max Appointments Per Day</Label><Input type="number" value={form.maxAppointmentsPerDay} onChange={(e) => setForm((p) => ({ ...p, maxAppointmentsPerDay: Number(e.target.value) || 1 }))} /></div>
        </div>

        <div className="mt-4"><Label>Clinic GCash Number</Label><Input value={form.gcashNumber} onChange={(e) => setForm((p) => ({ ...p, gcashNumber: e.target.value }))} /></div>
        <div className="mt-4"><Label>Booking & Payment Rules</Label><Textarea rows={5} value={form.bookingRules} onChange={(e) => setForm((p) => ({ ...p, bookingRules: e.target.value }))} /></div>

        <label className="mt-5 flex items-center gap-3 rounded-xl border border-gold-500/15 bg-ink-900/50 p-4 cursor-pointer">
          <input type="checkbox" checked={form.allowEmergencyPriority} onChange={(e) => setForm((p) => ({ ...p, allowEmergencyPriority: e.target.checked }))} className="h-4 w-4 accent-[#d4af37]" />
          <div>
            <div className="text-sm font-medium text-gold-100">Allow emergency / priority overrides</div>
            <div className="text-xs text-gold-100/50">Doctor can insert urgent appointments ahead of regular queue slots.</div>
          </div>
        </label>

        <div className="mt-5 flex items-center gap-3 flex-wrap">
          <Button onClick={() => { settingsService.updateClinic(form, user!.name); setSaved(true); }}>Save Rules</Button>
          {saved && <span className="text-sm text-emerald-400">✓ Schedule rules updated successfully.</span>}
        </div>

        <div className="mt-8 border-t border-gold-500/20 pt-6">
          <h4 className="font-serif text-xl text-gold-gradient">Google Calendar Blocked Slots (Demo)</h4>
          <p className="mt-2 text-sm text-gold-100/55">
            Block a date/time so patients cannot book it. This simulates Google Calendar busy events.
          </p>
          <div className="mt-4 grid sm:grid-cols-3 gap-3">
            <div>
              <Label>Date</Label>
              <Input type="date" value={blockedDate} onChange={(e) => setBlockedDate(e.target.value)} />
            </div>
            <div>
              <Label>Time</Label>
              <Select value={blockedTime} onChange={(e) => setBlockedTime(e.target.value)}>
                {BOOKING.TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Reason</Label>
              <Input value={blockedReason} onChange={(e) => setBlockedReason(e.target.value)} placeholder="Reason" />
            </div>
          </div>
          <div className="mt-4">
            <Button
              onClick={() => {
                if (!blockedDate || !blockedTime) return;
                calendarService.blockSlot(blockedDate, blockedTime, blockedReason || "Doctor unavailable");
                setBlockedSlots(calendarService.listBlockedSlots());
              }}
            >
              Block Schedule Slot
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <Card>
          <h3 className="font-serif text-2xl text-gold-gradient">Live Schedule Summary</h3>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <StatCard label="Clinic Hours" value={`${form.workingHoursStart}–${form.workingHoursEnd}`} icon="🕒" />
            <StatCard label="Queue Today" value={todayQueue} icon="📅" />
            <StatCard label="Interval" value={`${form.bookingInterval} min`} icon="⏱" />
            <StatCard label="Daily Capacity" value={form.maxAppointmentsPerDay} icon="🪑" />
          </div>
        </Card>

        <Card>
          <h3 className="font-serif text-2xl text-gold-gradient">Authority Rules Applied</h3>
          <ul className="mt-4 space-y-3 text-sm text-gold-100/65">
            <li className="flex gap-3"><span className="text-gold-300">✦</span><span>Doctor can override schedule rules for emergency appointments when enabled.</span></li>
            <li className="flex gap-3"><span className="text-gold-300">✦</span><span>Price changes remain separate from locked prices on existing confirmed bookings.</span></li>
            <li className="flex gap-3"><span className="text-gold-300">✦</span><span>Staff follow working rules but cannot modify configuration or financial policies.</span></li>
          </ul>
        </Card>

        <Card>
          <h3 className="font-serif text-2xl text-gold-gradient">Blocked Schedule Slots</h3>
          <div className="mt-4 space-y-3">
            {blockedSlots.map((slot) => (
              <div key={`${slot.date}-${slot.time}`} className="rounded-xl border border-gold-500/15 bg-ink-900/50 p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-gold-100 font-medium">{slot.date} · {slot.time}</div>
                  <div className="text-xs text-gold-100/55">{slot.reason || "Doctor unavailable"}</div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    calendarService.unblockSlot(slot.date, slot.time);
                    setBlockedSlots(calendarService.listBlockedSlots());
                  }}
                >
                  Unblock
                </Button>
              </div>
            ))}
            {blockedSlots.length === 0 && (
              <p className="text-sm text-gold-100/55">No blocked slots configured.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ─────────── STAFF ACCOUNTS ─────────── */
