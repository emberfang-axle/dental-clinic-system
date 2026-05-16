import type { Appointment } from "../shared/types";
import { BOOKING } from "../shared/constants";

const BOOKING_SLOTS = BOOKING.TIME_SLOTS as readonly string[];

/**
 * Demo-safe Google Calendar integration facade.
 * Replace internals with Cloud Functions + Google Calendar API for production.
 */

type BlockedSlot = { date: string; time: string; reason?: string };

const BLOCKED_KEY = "clinic-calendar-blocked-slots";

function makeEventId() {
  return `gcal_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function readBlockedSlots(): BlockedSlot[] {
  try {
    const raw = localStorage.getItem(BLOCKED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBlockedSlots(slots: BlockedSlot[]) {
  localStorage.setItem(BLOCKED_KEY, JSON.stringify(slots));
}

export const calendarService = {
  listBlockedSlots() {
    return readBlockedSlots().sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  },

  isSlotBlocked(date: string, time: string) {
    return readBlockedSlots().some((slot) => slot.date === date && slot.time === time);
  },

  blockSlot(date: string, time: string, reason = "Doctor unavailable") {
    const slots = readBlockedSlots();
    if (!slots.some((s) => s.date === date && s.time === time)) {
      writeBlockedSlots([...slots, { date, time, reason }]);
    }
  },

  unblockDate(date: string) {
    writeBlockedSlots(readBlockedSlots().filter((s) => s.date !== date));
  },

  isDateBlocked(date: string) {
    const slots = readBlockedSlots();
    return BOOKING_SLOTS.every((t) => slots.some((s) => s.date === date && s.time === t));
  },

  unblockSlot(date: string, time: string) {
    writeBlockedSlots(readBlockedSlots().filter((s) => !(s.date === date && s.time === time)));
  },

  async createBookingEvent(appointment: Pick<Appointment, "patientName" | "serviceName" | "doctor" | "date" | "time">) {
    // Demo: synthesize an event id.
    // Production: call Cloud Function that writes to Google Calendar.
    void appointment;
    return makeEventId();
  },
};

