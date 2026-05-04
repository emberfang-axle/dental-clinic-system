import type { Appointment } from "../shared/types";

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

  blockDate(date: string, reason = "Doctor unavailable") {
    const slots = readBlockedSlots().filter((s) => s.date !== date);
    const allSlots = ["09:00","10:00","11:00","1:00","2:00","3:00","4:00"];
    writeBlockedSlots([...slots, ...allSlots.map((time) => ({ date, time, reason }))]);
  },

  unblockDate(date: string) {
    writeBlockedSlots(readBlockedSlots().filter((s) => s.date !== date));
  },

  isDateBlocked(date: string) {
    const allSlots = ["09:00","10:00","11:00","1:00","2:00","3:00","4:00"];
    return allSlots.every((t) => readBlockedSlots().some((s) => s.date === date && s.time === t));
  },

  blockDate(date: string, reason = "Doctor unavailable") {
    // Block all time slots for the given date
    const slots = readBlockedSlots().filter((s) => s.date !== date);
    const allSlots = ["09:00","10:00","11:00","1:00","2:00","3:00","4:00"];
    writeBlockedSlots([...slots, ...allSlots.map((time) => ({ date, time, reason }))]);
  },

  unblockDate(date: string) {
    writeBlockedSlots(readBlockedSlots().filter((s) => s.date !== date));
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

