import type { Appointment, BlockedSlot } from "../shared/types";
import { BOOKING, getSlotsForDate } from "../shared/constants";
import { deleteDocTyped, listCollection, setDocTyped } from "./firestore";
import { getSnapshot } from "../store/store";

const BLOCKED_KEY = "clinic-calendar-blocked-slots";

let cache: BlockedSlot[] = [];

function slotDocId(date: string, time: string) {
  return `${date}_${time.replace(":", "")}`;
}

function readLocal(): BlockedSlot[] {
  try {
    const raw = localStorage.getItem(BLOCKED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocal(slots: BlockedSlot[]) {
  localStorage.setItem(BLOCKED_KEY, JSON.stringify(slots));
}

function setCache(slots: BlockedSlot[]) {
  cache = slots.sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  writeLocal(cache);
  return cache;
}

function makeEventId() {
  return `gcal_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export const calendarService = {
  listBlockedSlots(): BlockedSlot[] {
    const fromStore = getSnapshot().blockedSlots;
    if (fromStore.length > 0) return fromStore;
    if (cache.length > 0) return cache;
    return readLocal();
  },

  setBlockedSlotsFromRemote(slots: BlockedSlot[]) {
    setCache(slots);
  },

  async loadBlockedSlots(): Promise<BlockedSlot[]> {
    try {
      const remote = await listCollection<BlockedSlot>("blockedSlots");
      const normalized = remote.map((s) => ({
        id: s.id,
        date: s.date,
        time: s.time,
        reason: s.reason,
      }));
      if (normalized.length > 0) return setCache(normalized);
    } catch {
      // Offline or rules — use local cache
    }
    return setCache(readLocal());
  },

  isSlotBlocked(date: string, time: string) {
    const slots = this.listBlockedSlots();
    if (slots.some((s) => s.date === date && s.time === "ALL")) return true;
    return slots.some((s) => s.date === date && s.time === time);
  },

  isDateBlocked(date: string) {
    const slots = this.listBlockedSlots().filter((s) => s.date === date);
    if (slots.some((s) => s.time === "ALL")) return true;
    const daySlots = getSlotsForDate(date);
    return daySlots.length > 0 && daySlots.every((t) => slots.some((s) => s.time === t));
  },

  async blockSlot(date: string, time: string, reason = "Doctor unavailable") {
    const slots = this.listBlockedSlots();
    if (slots.some((s) => s.date === date && s.time === time)) return;

    const entry: BlockedSlot = { date, time, reason };
    try {
      const id = slotDocId(date, time);
      await setDocTyped("blockedSlots", id, { date, time, reason } as any);
      entry.id = id;
    } catch {
      // Persist locally when Firestore unavailable
    }
    setCache([...slots, entry]);
  },

  async unblockDate(date: string) {
    const toRemove = this.listBlockedSlots().filter((s) => s.date === date);
    await Promise.all(
      toRemove.map(async (s) => {
        if (s.id) {
          try {
            await deleteDocTyped("blockedSlots", s.id);
          } catch {
            /* local only */
          }
        }
      }),
    );
    setCache(this.listBlockedSlots().filter((s) => s.date !== date));
  },

  async unblockSlot(date: string, time: string) {
    const existing = this.listBlockedSlots().find((s) => s.date === date && s.time === time);
    if (existing?.id) {
      try {
        await deleteDocTyped("blockedSlots", existing.id);
      } catch {
        /* local only */
      }
    }
    setCache(this.listBlockedSlots().filter((s) => !(s.date === date && s.time === time)));
  },

  async createBookingEvent(
    appointment: Pick<Appointment, "patientName" | "serviceName" | "doctor" | "date" | "time">,
  ) {
    void appointment;
    return makeEventId();
  },
};
