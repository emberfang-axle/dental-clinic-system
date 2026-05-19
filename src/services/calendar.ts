import type { Appointment } from "../shared/types";
import { BOOKING } from "../shared/constants";
import { listCollection, setDocTyped, deleteDocTyped } from "./firestore";

const BOOKING_SLOTS = BOOKING.TIME_SLOTS as readonly string[];

type BlockedSlot = { id: string; date: string; time: string; reason?: string };

// In-memory cache so UI reads are instant (populated on first load)
let cache: BlockedSlot[] | null = null;

function makeSlotId(date: string, time: string) {
  return `${date}_${time.replace(":", "")}`;
}

export const calendarService = {
  /** Sync read from cache (populated after first async call). Falls back to [] before loaded. */
  listBlockedSlots(): BlockedSlot[] {
    return (cache ?? []).slice().sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  },

  async loadBlockedSlots(): Promise<BlockedSlot[]> {
    cache = await listCollection<BlockedSlot>("blockedSlots");
    return cache;
  },

  isSlotBlocked(date: string, time: string): boolean {
    return (cache ?? []).some((s) => s.date === date && s.time === time);
  },

  isDateBlocked(date: string): boolean {
    return BOOKING_SLOTS.every((t) => (cache ?? []).some((s) => s.date === date && s.time === t));
  },

  async blockSlot(date: string, time: string, reason = "Doctor unavailable") {
    const id = makeSlotId(date, time);
    if ((cache ?? []).some((s) => s.id === id)) return;
    const slot: BlockedSlot = { id, date, time, reason };
    await setDocTyped("blockedSlots", id, slot as any);
    cache = [...(cache ?? []), slot];
  },

  async unblockSlot(date: string, time: string) {
    const id = makeSlotId(date, time);
    await deleteDocTyped("blockedSlots", id);
    cache = (cache ?? []).filter((s) => s.id !== id);
  },

  async unblockDate(date: string) {
    const toRemove = (cache ?? []).filter((s) => s.date === date);
    await Promise.all(toRemove.map((s) => deleteDocTyped("blockedSlots", s.id)));
    cache = (cache ?? []).filter((s) => s.date !== date);
  },

  /** Stub: returns a fake calendar event ID. Replace with real Google Calendar API call when ready. */
  async createBookingEvent(_appointment: Pick<Appointment, "patientName" | "serviceName" | "doctor" | "date" | "time">) {
    return `gcal_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
  },
};
