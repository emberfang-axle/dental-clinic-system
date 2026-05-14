import type { Appointment } from "../shared/types";
import { getSnapshot, setState, showToast } from "../store/store";
import { updateDocTyped, deleteDocTyped, collection, doc, db, runTransaction } from "./firestore";
import { getDocs, query, where } from "firebase/firestore";
import { calendarService } from "./calendar";
import { notificationsService } from "./notifications";

function nowISO() { return new Date().toISOString(); }
function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

/** Remove undefined values so Firestore never receives them. */
function stripUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

function addLog(actor: string, action: string, target: string, before?: Partial<Appointment>, after?: Partial<Appointment>) {
  const { logs } = getSnapshot();
  setState({
    logs: [{
      id: makeId("log"), actor, action, target, at: nowISO(),
      before: before as Record<string, unknown> | undefined,
      after:  after  as Record<string, unknown> | undefined,
    }, ...logs],
  });
}

export type NewAppointment = Omit<Appointment, "id" | "createdAt" | "updatedAt">;

function sanitizeStr(s: string, max = 200): string {
  return s.trim().slice(0, max);
}

export const appointmentsService = {
  isSlotTaken(date: string, time: string) {
    const { appointments } = getSnapshot();
    return appointments.some((a) => a.date === date && a.time === time && a.status !== "cancelled");
  },

  async book(input: NewAppointment) {
    const sanitized: NewAppointment = {
      ...input,
      patientName: sanitizeStr(input.patientName, 100),
      notes:         input.notes         ? sanitizeStr(input.notes, 1000)         : undefined,
      diagnosis:     input.diagnosis     ? sanitizeStr(input.diagnosis, 1000)     : undefined,
      treatmentPlan: input.treatmentPlan ? sanitizeStr(input.treatmentPlan, 1000) : undefined,
    };
    if (!sanitized.patientName) throw new Error("Patient name is required.");

    if (calendarService.isSlotBlocked(sanitized.date, sanitized.time)) {
      throw new Error("Selected schedule is blocked in calendar.");
    }

    const now = nowISO();
    const newRef = doc(collection(db, "appointments"));
    const data = stripUndefined({ ...sanitized, id: newRef.id, createdAt: now, updatedAt: now });

    // Transactional slot claim — prevents two simultaneous bookings on the same slot
    await runTransaction(db, async (tx) => {
      const existing = await getDocs(
        query(collection(db, "appointments"),
          where("date", "==", sanitized.date),
          where("time", "==", sanitized.time)
        )
      );
      const taken = existing.docs.some((d) => d.data().status !== "cancelled");
      if (taken) throw new Error("This time slot was just taken. Please pick another.");
      tx.set(newRef, data);
    });

    const calendarEventId = await calendarService.createBookingEvent({
      patientName: sanitized.patientName, serviceName: sanitized.serviceName,
      doctor: sanitized.doctor, date: sanitized.date, time: sanitized.time,
    });
    if (calendarEventId) {
      await updateDocTyped("appointments", newRef.id, { calendarEventId } as any);
    }

    const ap: Appointment = { ...data, calendarEventId };
    addLog(sanitized.patientName, "Booked appointment", `${ap.serviceName} (${ap.date} ${ap.time})`, undefined, { status: ap.status, date: ap.date, time: ap.time });
    showToast(`Appointment booked for ${ap.date} at ${ap.time}.`, "success");

    await notificationsService.notifyStaff(
      "New Appointment Booked",
      `${sanitized.patientName} booked ${sanitized.serviceName} on ${sanitized.date} at ${sanitized.time}. Please review and confirm.`,
      "appointment"
    );
    return ap;
  },

  async delete(id: string, actor = "system") {
    const { appointments } = getSnapshot();
    const before = appointments.find((a) => a.id === id);
    await deleteDocTyped("appointments", id);
    setState({ appointments: appointments.filter((a) => a.id !== id) });
    addLog(actor, "Deleted appointment", id, before ? { status: before.status, date: before.date, time: before.time } : undefined);
  },

  /** Cancel (delete) an appointment and notify all staff/doctors. Used by patient cancel button. */
  async cancelAndNotify(id: string, actor: string) {
    const { appointments, users } = getSnapshot();
    const appt = appointments.find((a) => a.id === id);
    await this.delete(id, actor);
    if (appt) {
      await Promise.all(
        users
          .filter((u) => u.role === "staff" || u.role === "doctor")
          .map((u) => notificationsService.notify(u.id, "Appointment Cancelled",
            `${appt.patientName} cancelled their ${appt.serviceName} appointment on ${appt.date} at ${appt.time}.`, "appointment"))
      );
    }
  },

  /** Reschedule and notify all staff/doctors. Used by patient reschedule. */
  async rescheduleAndNotify(id: string, newDate: string, newTime: string, actor: string) {
    const { appointments, users } = getSnapshot();
    const appt = appointments.find((a) => a.id === id);
    await this.update(id, { date: newDate, time: newTime, status: "rescheduled", rescheduledAt: nowISO() }, actor);
    if (appt) {
      await Promise.all(
        users
          .filter((u) => u.role === "staff" || u.role === "doctor")
          .map((u) => notificationsService.notify(u.id, "Appointment Rescheduled",
            `${appt.patientName} rescheduled ${appt.serviceName} to ${newDate} at ${newTime}.`, "appointment"))
      );
    }
  },

  async update(id: string, partial: Partial<Appointment>, actor = "system") {
    const snap = getSnapshot();
    const current = snap.appointments.find((a) => a.id === id);

    // ── Business rules ──────────────────────────────────────────────
    if (partial.status === "completed") {
      const merged = { ...current, ...partial };
      if (!merged.diagnosis && !merged.notes && !merged.treatmentPlan) {
        throw new Error("Cannot complete appointment: no treatment record has been saved yet. Please add a diagnosis or notes first.");
      }
    }
    if (partial.paymentStatus === "paid") {
      if (current?.status !== "completed") {
        throw new Error("Cannot mark payment as paid: treatment must be completed first.");
      }
      // Auto-assign sequential OR number if not already set
      if (!current?.receiptNumber && !partial.receiptNumber) {
        const year = new Date().getFullYear();
        const paid = snap.appointments.filter((a) => a.receiptNumber?.startsWith(`OR-${year}-`));
        const maxSeq = paid.reduce((max, a) => {
          const n = parseInt(a.receiptNumber!.split("-")[2] ?? "0", 10);
          return n > max ? n : max;
        }, 0);
        partial = { ...partial, receiptNumber: `OR-${year}-${String(maxSeq + 1).padStart(4, "0")}` };
      }
    }
    // ────────────────────────────────────────────────────────────────

    const updatedAt = nowISO();
    await updateDocTyped<Appointment>("appointments", id, stripUndefined({ ...partial, updatedAt }) as any);

    const next = snap.appointments.map((a) =>
      a.id === id ? { ...a, ...partial, updatedAt } as Appointment : a
    );
    setState({ appointments: next });

    // Capture before/after for audit
    const before = current ? { status: current.status, paymentStatus: current.paymentStatus, date: current.date, time: current.time } : undefined;
    const after  = { ...before, ...partial };
    addLog(actor, "Updated appointment", id, before, after);

    if (partial.status === "confirmed") {
      showToast("Appointment confirmed.", "success");
      if (current) {
        await notificationsService.notify(current.patientId, "Appointment Confirmed ✓",
          `Your ${current.serviceName} appointment on ${current.date} at ${current.time} has been confirmed. Please arrive 10 minutes early.`, "appointment");
        await notificationsService.notifyStaff("Appointment Confirmed",
          `${current.patientName}'s ${current.serviceName} on ${current.date} at ${current.time} was confirmed by ${actor}.`, "appointment");
      }
    }
    if (partial.status === "in-progress" && current) {
      await notificationsService.notify(current.patientId, "Your Appointment Has Started",
        `Your ${current.serviceName} appointment is now in progress. The doctor is ready for you.`, "appointment");
    }
    if (partial.status === "completed" && current) {
      await notificationsService.notify(current.patientId, "Appointment Completed",
        `Your ${current.serviceName} appointment has been completed. Thank you for visiting Estandarte Dental Clinic!`, "appointment");
    }
    if (partial.status === "no-show" && current) {
      await notificationsService.notifyStaff("Patient No-Show",
        `${current.patientName} did not show up for ${current.serviceName} on ${current.date} at ${current.time}.`, "appointment");
    }
  },
};
