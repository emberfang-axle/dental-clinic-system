import type { Appointment } from "../shared/types";
import { getSnapshot, setState } from "../store/store";
import { addDocTyped, updateDocTyped } from "./firestore";
import { calendarService } from "./calendar";

function nowISO() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function addLog(actor: string, action: string, target: string) {
  const { logs } = getSnapshot();
  setState({
    logs: [
      {
        id: makeId("log"),
        actor,
        action,
        target,
        at: nowISO(),
      },
      ...logs,
    ],
  });
}

export type NewAppointment = Omit<Appointment, "id" | "createdAt" | "updatedAt">;

export const appointmentsService = {
  isSlotTaken(date: string, time: string) {
    const { appointments } = getSnapshot();
    return appointments.some((a) => a.date === date && a.time === time && a.status !== "cancelled");
  },

  async book(input: NewAppointment) {
    if (calendarService.isSlotBlocked(input.date, input.time)) {
      throw new Error("Selected schedule is blocked in calendar.");
    }

    const createdAt = nowISO();
    const updatedAt = createdAt;
    const calendarEventId = await calendarService.createBookingEvent({
      patientName: input.patientName,
      serviceName: input.serviceName,
      doctor: input.doctor,
      date: input.date,
      time: input.time,
    });
    const id = await addDocTyped<
      NewAppointment & { calendarEventId?: string; createdAt: string; updatedAt: string }
    >("appointments", {
      ...input,
      calendarEventId,
      createdAt,
      updatedAt,
    });
    const ap: Appointment = { ...input, id, calendarEventId, createdAt, updatedAt };

    // Optimistic update; realtime listener will reconcile.
    const snap = getSnapshot();
    setState({ appointments: [ap, ...snap.appointments] });
    addLog(input.patientName, "Booked appointment", `${ap.serviceName} (${ap.date} ${ap.time})`);
    return ap;
  },

  async update(id: string, partial: Partial<Appointment>, actor = "system") {
    await updateDocTyped<Appointment>("appointments", id, {
      ...partial,
      updatedAt: nowISO(),
    } as any);

    const snap = getSnapshot();
    const next = snap.appointments.map((a) =>
      a.id === id ? ({ ...a, ...partial, updatedAt: nowISO() } as Appointment) : a
    );
    setState({ appointments: next });
    addLog(actor, "Updated appointment", id);
  },
};

