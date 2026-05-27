import type { Appointment, PaymentMethod } from "../shared/types";
import { hasTreatmentRecord } from "../shared/helpers";
import { getSnapshot, setState, showToast } from "../store/store";
import { updateDocTyped, deleteDocTyped, setDocTyped } from "./firestore";
import { calendarService } from "./calendar";
import { notificationsService } from "./notifications";
import { emailService } from "./email";
import { writeAuditLog } from "./audit";

function nowISO() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function stripUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

function sanitizeStr(s: string, max = 200): string {
  return s.trim().slice(0, max);
}

function activeAppointments(appointments: Appointment[], excludeId?: string) {
  return appointments.filter(
    (a) => a.status !== "cancelled" && a.id !== excludeId
  );
}

export type NewAppointment = Omit<Appointment, "id" | "createdAt" | "updatedAt">;

function notifyDoctorsForAppointment(appt: Appointment, title: string, message: string) {
  const { users } = getSnapshot();
  const targets = users.filter(
    (u) =>
      (u.role === "doctor" || u.role === "co-doctor" || u.role === "admin") &&
      (u.name === appt.doctor || u.role === "admin"),
  );
  return Promise.all(
    targets.map((u) => notificationsService.notify(u.id, title, message, "appointment")),
  );
}

export const appointmentsService = {
  /** Returns true if the doctor already has a booking at date + time. */
  isSlotTaken(date: string, time: string, doctor: string, excludeId?: string) {
    const { appointments } = getSnapshot();
    return activeAppointments(appointments, excludeId).some(
      (a) => a.date === date && a.time === time && a.doctor === doctor
    );
  },

  async book(input: NewAppointment) {
    const sanitized: NewAppointment = {
      ...input,
      patientName: sanitizeStr(input.patientName, 100),
      notes: input.notes ? sanitizeStr(input.notes, 1000) : undefined,
      diagnosis: input.diagnosis ? sanitizeStr(input.diagnosis, 1000) : undefined,
      treatmentPlan: input.treatmentPlan ? sanitizeStr(input.treatmentPlan, 1000) : undefined,
    };
    if (!sanitized.patientName) throw new Error("Patient name is required.");
    if (!sanitized.doctor) throw new Error("Please select a dentist.");

    if (calendarService.isSlotBlocked(sanitized.date, sanitized.time)) {
      throw new Error("Selected schedule is blocked in calendar.");
    }

    if (this.isSlotTaken(sanitized.date, sanitized.time, sanitized.doctor)) {
      throw new Error("This time slot is no longer available for the selected dentist.");
    }

    const now = nowISO();
    const newId = makeId("appt");
    const data = stripUndefined({ ...sanitized, id: newId, createdAt: now, updatedAt: now });

    await setDocTyped("appointments", newId, data as any);

    const calendarEventId = await calendarService.createBookingEvent({
      patientName: sanitized.patientName,
      serviceName: sanitized.serviceName,
      doctor: sanitized.doctor,
      date: sanitized.date,
      time: sanitized.time,
    });
    if (calendarEventId) {
      await updateDocTyped("appointments", newId, { calendarEventId } as any);
    }

    const ap: Appointment = { ...data, calendarEventId };
    void writeAuditLog(
      sanitized.patientName,
      "Booked appointment",
      `${ap.serviceName} with ${ap.doctor} (${ap.date} ${ap.time})`,
      undefined,
      { status: ap.status, date: ap.date, time: ap.time, doctor: ap.doctor },
    );
    showToast(`Appointment booked for ${ap.date} at ${ap.time}.`, "success");

    await notificationsService.notifyStaff(
      "New Appointment Request",
      `${sanitized.patientName} requested ${sanitized.serviceName} on ${sanitized.date} at ${sanitized.time} with ${sanitized.doctor} (pending confirmation).`,
      "appointment",
    );

    if (sanitized.patientId) {
      await notificationsService.notify(
        sanitized.patientId,
        "Booking Received — Pending Confirmation",
        `Your request for ${sanitized.serviceName} on ${sanitized.date} at ${sanitized.time} was received. Clinic staff will confirm your appointment shortly.`,
        "appointment",
      );
    }

    if (sanitized.patientEmail) {
      void emailService.sendBookingConfirmation({
        patientEmail: sanitized.patientEmail,
        patientName: sanitized.patientName,
        serviceName: sanitized.serviceName,
        date: sanitized.date,
        time: sanitized.time,
        doctor: sanitized.doctor,
      });
    }

    return ap;
  },

  async delete(id: string, actor = "system") {
    const { appointments } = getSnapshot();
    const before = appointments.find((a) => a.id === id);
    await deleteDocTyped("appointments", id);
    setState({ appointments: appointments.filter((a) => a.id !== id) });
    void writeAuditLog(
      actor,
      "Deleted appointment",
      id,
      before ? { status: before.status, date: before.date, time: before.time } : undefined,
    );
  },

  async cancelAndNotify(id: string, actor: string) {
    const { appointments, users } = getSnapshot();
    const appt = appointments.find((a) => a.id === id);
    if (!appt) return;
    if (appt.status === "cancelled") return;

    const now = nowISO();
    await this.update(
      id,
      { status: "cancelled", cancelledAt: now },
      actor,
    );

    await Promise.all(
      users
        .filter((u) => u.role === "staff" || u.role === "doctor" || u.role === "co-doctor")
        .map((u) =>
          notificationsService.notify(
            u.id,
            "Appointment Cancelled",
            `${appt.patientName} cancelled ${appt.serviceName} on ${appt.date} at ${appt.time}.`,
            "appointment",
          ),
        ),
    );

    if (appt.patientEmail) {
      void emailService.sendCancellation({
        patientEmail: appt.patientEmail,
        patientName: appt.patientName,
        serviceName: appt.serviceName,
        date: appt.date,
        time: appt.time,
      });
    }
  },

  async rescheduleAndNotify(id: string, newDate: string, newTime: string, actor: string) {
    const { appointments, users } = getSnapshot();
    const appt = appointments.find((a) => a.id === id);
    if (!appt) throw new Error("Appointment not found.");

    if (calendarService.isSlotBlocked(newDate, newTime)) {
      throw new Error("Selected schedule is blocked in calendar.");
    }
    if (this.isSlotTaken(newDate, newTime, appt.doctor, id)) {
      throw new Error("This time slot is no longer available for your dentist.");
    }

    await this.update(
      id,
      { date: newDate, time: newTime, status: "rescheduled", rescheduledAt: nowISO() },
      actor,
    );

    await Promise.all(
      users
        .filter((u) => u.role === "staff" || u.role === "doctor" || u.role === "co-doctor")
        .map((u) =>
          notificationsService.notify(
            u.id,
            "Appointment Rescheduled",
            `${appt.patientName} rescheduled ${appt.serviceName} to ${newDate} at ${newTime}.`,
            "appointment",
          ),
        ),
    );

    if (appt.patientEmail) {
      void emailService.sendReschedule({
        patientEmail: appt.patientEmail,
        patientName: appt.patientName,
        serviceName: appt.serviceName,
        date: newDate,
        time: newTime,
      });
    }
  },

  async update(id: string, partial: Partial<Appointment>, actor = "system") {
    const snap = getSnapshot();
    const current = snap.appointments.find((a) => a.id === id);

    if (partial.date && partial.time && current) {
      const doctor = partial.doctor ?? current.doctor;
      if (this.isSlotTaken(partial.date, partial.time, doctor, id)) {
        throw new Error("This time slot is no longer available for the selected dentist.");
      }
    }

    if (partial.status === "completed") {
      const merged = { ...current, ...partial };
      if (!merged.diagnosis && !merged.notes && !merged.treatmentPlan) {
        throw new Error(
          "Cannot complete appointment: no treatment record has been saved yet. Please add a diagnosis or notes first.",
        );
      }
    }

    if (partial.paymentStatus === "paid") {
      if (current?.status !== "completed") {
        throw new Error("Cannot mark payment as paid: the dentist must mark the visit as completed first.");
      }
      if (current && !hasTreatmentRecord({ ...current, ...partial })) {
        throw new Error(
          "Cannot record payment: treatment notes are missing. The dentist must save notes in Clinical Records first.",
        );
      }
      if (partial.paymentMethod && !["cash", "gcash"].includes(partial.paymentMethod)) {
        throw new Error("Payment method must be Cash or GCash.");
      }
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

    const updatedAt = nowISO();
    await updateDocTyped<Appointment>("appointments", id, stripUndefined({ ...partial, updatedAt }) as any);

    const next = snap.appointments.map((a) =>
      a.id === id ? ({ ...a, ...partial, updatedAt } as Appointment) : a,
    );
    setState({ appointments: next });

    const updated = next.find((a) => a.id === id);
    const before = current
      ? {
          status: current.status,
          paymentStatus: current.paymentStatus,
          date: current.date,
          time: current.time,
        }
      : undefined;

    void writeAuditLog(actor, "Updated appointment", id, before, { ...before, ...partial });

    const notify = (fn: () => Promise<unknown>) => {
      fn().catch(() => {});
    };

    if (partial.status === "confirmed" && current) {
      showToast("Appointment confirmed.", "success");
      notify(() =>
        notificationsService.notify(
          current.patientId,
          "Appointment Confirmed ✓",
          `Your ${current.serviceName} on ${current.date} at ${current.time} has been confirmed.`,
          "appointment",
        ),
      );
      if (current.patientEmail) {
        void emailService.sendConfirmation({
          patientEmail: current.patientEmail,
          patientName: current.patientName,
          serviceName: current.serviceName,
          date: current.date,
          time: current.time,
        });
      }
    }

    if (partial.status === "in-progress" && current) {
      notify(() =>
        notificationsService.notify(
          current.patientId,
          "Your Appointment Has Started",
          `Your ${current.serviceName} appointment is now in progress.`,
          "appointment",
        ),
      );
      notify(() =>
        notifyDoctorsForAppointment(
          current,
          "Patient Checked In",
          `${current.patientName} checked in for ${current.serviceName} (${current.date} ${current.time}). Please add treatment notes in Clinical Records when done.`,
        ),
      );
      notify(() =>
        notificationsService.notifyStaff(
          "Patient Checked In",
          `${current.patientName} is with ${current.doctor} — ${current.serviceName}.`,
          "appointment",
        ),
      );
    }

    if (partial.status === "completed" && current) {
      notify(() =>
        notificationsService.notify(
          current.patientId,
          "Appointment Completed",
          `Your ${current.serviceName} appointment has been completed. Thank you for visiting Estandarte Dental Clinic!`,
          "appointment",
        ),
      );
      if (current.patientEmail) {
        void emailService.sendCompletion({
          patientEmail: current.patientEmail,
          patientName: current.patientName,
          serviceName: current.serviceName,
        });
      }
    }

    if (partial.status === "no-show" && current) {
      notify(() =>
        notificationsService.notifyStaff(
          "Patient No-Show",
          `${current.patientName} did not show for ${current.serviceName} on ${current.date}.`,
          "appointment",
        ),
      );
    }

    if (partial.paymentStatus === "paid" && updated) {
      const methodLabel = updated.paymentMethod === "gcash" ? "GCash" : "Cash";
      notify(() =>
        notificationsService.notify(
          updated.patientId,
          "Payment Confirmed",
          `Your ${methodLabel} payment for ${updated.serviceName} is confirmed. Receipt: ${updated.receiptNumber ?? "—"}.`,
          "payment",
        ),
      );
      if (updated.patientEmail) {
        void emailService.sendPaymentConfirmation({
          patientEmail: updated.patientEmail,
          patientName: updated.patientName,
          serviceName: updated.serviceName,
          price: updated.price,
          receiptNumber: updated.receiptNumber,
        });
      }
    }
  },
};
