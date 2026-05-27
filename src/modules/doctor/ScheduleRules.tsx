import { useCallback, useEffect, useState } from "react";
import { Button, Card, Input, Label, Select, Textarea } from "../../components/ui";
import { calendarService } from "../../services/calendar";
import { settingsService } from "../../services/settings";
import { useStore, showToast } from "../../store/store";
import { BOOKING, getSlotsForDate } from "../../shared/constants";
import type { BlockedSlot, ClinicSettings } from "../../shared/types";

const DEFAULT_SETTINGS: ClinicSettings = {
  workingHoursStart: "09:00",
  workingHoursEnd: "17:00",
  bookingInterval: 60,
  maxAppointmentsPerDay: 7,
  bookingRules: "",
};

export function ScheduleRules() {
  const { settings, user, appointments, blockedSlots } = useStore();
  const [form, setForm] = useState<ClinicSettings>({ ...DEFAULT_SETTINGS, ...settings });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [blockError, setBlockError] = useState("");
  const [blockedDate, setBlockedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [blockedTime, setBlockedTime] = useState<string>("all");
  const [blockedReason, setBlockedReason] = useState("Doctor unavailable");

  useEffect(() => {
    setForm({ ...DEFAULT_SETTINGS, ...settings });
  }, [settings]);

  const refreshBlocked = useCallback(async () => {
    await calendarService.loadBlockedSlots();
  }, []);

  useEffect(() => {
    void refreshBlocked();
  }, [refreshBlocked]);

  const slots = blockedSlots.length > 0 ? blockedSlots : calendarService.listBlockedSlots();

  const today = new Date().toISOString().slice(0, 10);
  const todayBookings = appointments.filter((a) => a.date === today && a.status !== "cancelled").length;
  const capacity = form.maxAppointmentsPerDay || DEFAULT_SETTINGS.maxAppointmentsPerDay;
  const remaining = Math.max(0, capacity - todayBookings);

  async function handleSaveRules() {
    if (!user) return;
    setSaving(true);
    try {
      await settingsService.updateClinic(form, user.name);
      setSaved(true);
      showToast("Clinic schedule rules saved.", "success");
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Failed to save rules.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleBlock() {
    if (!blockedDate) {
      setBlockError("Please select a date.");
      return;
    }
    setBlockError("");
    setBlocking(true);
    try {
      if (blockedTime === "all") {
        await calendarService.blockSlot(blockedDate, "ALL", blockedReason.trim() || "Clinic closed");
      } else {
        await calendarService.blockSlot(blockedDate, blockedTime, blockedReason.trim() || "Doctor unavailable");
      }
      await refreshBlocked();
      showToast("Time slot blocked.", "success");
    } catch (e: unknown) {
      setBlockError(e instanceof Error ? e.message : "Failed to block slot.");
    } finally {
      setBlocking(false);
    }
  }

  function isFullDayBlocked(date: string, dateSlots: BlockedSlot[]) {
    if (dateSlots.some((s) => s.time === "ALL")) return true;
    const daySlots = getSlotsForDate(date);
    return daySlots.length > 0 && daySlots.every((t) => dateSlots.some((s) => s.time === t));
  }

  return (
    <div className="grid xl:grid-cols-[0.95fr_1.05fr] gap-6">
      <Card>
        <div className="text-[10px] uppercase tracking-[0.26em] text-gold-300/55">Appointment authority</div>
        <h3 className="mt-2 font-serif text-2xl text-gold-gradient">Clinic Working Hours & Booking Rules</h3>

        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Start of Clinic Hours</Label>
            <Input
              type="time"
              value={form.workingHoursStart || ""}
              onChange={(e) => setForm((p) => ({ ...p, workingHoursStart: e.target.value }))}
            />
          </div>
          <div>
            <Label>End of Clinic Hours</Label>
            <Input
              type="time"
              value={form.workingHoursEnd || ""}
              onChange={(e) => setForm((p) => ({ ...p, workingHoursEnd: e.target.value }))}
            />
          </div>
          <div>
            <Label>Booking Interval (minutes)</Label>
            <Input
              type="number"
              min={15}
              value={form.bookingInterval || DEFAULT_SETTINGS.bookingInterval}
              onChange={(e) => setForm((p) => ({ ...p, bookingInterval: Number(e.target.value) || 60 }))}
            />
          </div>
          <div>
            <Label>Max Appointments Per Day</Label>
            <Input
              type="number"
              min={1}
              value={form.maxAppointmentsPerDay || DEFAULT_SETTINGS.maxAppointmentsPerDay}
              onChange={(e) => setForm((p) => ({ ...p, maxAppointmentsPerDay: Number(e.target.value) || 1 }))}
            />
          </div>
        </div>

        <div className="mt-4">
          <Label>Booking Rules</Label>
          <Textarea
            rows={4}
            value={form.bookingRules || ""}
            onChange={(e) => setForm((p) => ({ ...p, bookingRules: e.target.value }))}
            placeholder="e.g. Arrive 10 minutes early. Payment is collected after treatment."
          />
        </div>

        <div className="mt-5 flex items-center gap-3 flex-wrap">
          <Button onClick={() => void handleSaveRules()} disabled={saving}>
            {saving ? "Saving…" : "Save Rules"}
          </Button>
          {saved && <span className="text-sm text-emerald-400">Saved.</span>}
        </div>

        <div className="mt-8 border-t border-gold-500/20 pt-6">
          <h4 className="font-serif text-xl text-gold-gradient mb-1">Block Time Slot</h4>
          <p className="text-sm text-gold-100/50 mb-4">Prevent patients from booking a specific date and time.</p>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={blockedDate}
                min={today}
                onChange={(e) => {
                  setBlockedDate(e.target.value);
                  setBlockError("");
                }}
              />
            </div>
            <div>
              <Label>Time</Label>
              <Select
                value={blockedTime}
                onChange={(e) => {
                  setBlockedTime(e.target.value);
                  setBlockError("");
                }}
              >
                <option value="all">All Day (Holiday / Closed)</option>
                {BOOKING.TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Reason</Label>
              <Input
                value={blockedReason}
                onChange={(e) => setBlockedReason(e.target.value)}
                placeholder="Doctor unavailable"
              />
            </div>
          </div>
          {blockError && <p className="mt-2 text-xs text-red-400">{blockError}</p>}
          <Button className="mt-3" onClick={() => void handleBlock()} disabled={blocking}>
            {blocking ? "Blocking…" : "Block Slot"}
          </Button>
        </div>
      </Card>

      <div className="space-y-6">
        <Card>
          <h3 className="font-serif text-2xl text-gold-gradient mb-5">Today&apos;s Dashboard</h3>
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
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="font-serif text-2xl text-gold-gradient">Blocked Slots</h3>
            <Button variant="ghost" size="sm" onClick={() => void refreshBlocked()}>
              Refresh
            </Button>
          </div>
          {slots.length === 0 ? (
            <p className="text-sm text-gold-100/50">No blocked slots.</p>
          ) : (
            <div className="space-y-2">
              {Array.from(new Set(slots.map((s) => s.date))).map((date) => {
                const dateSlots = slots.filter((s) => s.date === date);
                const isFullDay = isFullDayBlocked(date, dateSlots);
                return (
                  <div key={date} className="rounded-xl border border-gold-500/15 bg-ink-900/50 p-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div>
                        <div className="text-sm text-gold-100 font-medium">
                          {date}{" "}
                          {isFullDay && (
                            <span className="text-[10px] text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded px-1.5 py-0.5 ml-1">
                              All Day
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gold-100/50">{dateSlots[0]?.reason || "Unavailable"}</div>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={async () => {
                          await calendarService.unblockDate(date);
                          await refreshBlocked();
                          showToast("Day unblocked.", "success");
                        }}
                      >
                        Unblock Day
                      </Button>
                    </div>
                    {!isFullDay && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {dateSlots.map((slot) => (
                          <div
                            key={`${slot.date}-${slot.time}`}
                            className="flex items-center gap-1 text-xs bg-ink-800 border border-gold-500/15 rounded px-2 py-1"
                          >
                            <span className="text-gold-100/70">{slot.time}</span>
                            <button
                              type="button"
                              onClick={async () => {
                                await calendarService.unblockSlot(slot.date, slot.time);
                                await refreshBlocked();
                              }}
                              className="text-red-400/60 hover:text-red-400 ml-1"
                              aria-label={`Unblock ${slot.time}`}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
