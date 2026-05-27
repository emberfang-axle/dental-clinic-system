import type { Appointment } from "../shared/types";
import { getSnapshot, setState } from "../store/store";
import { appointmentsService } from "./appointments";
import { notificationsService } from "./notifications";
import { updateDocTyped } from "./firestore";
import { writeAuditLog } from "./audit";

function nowISO() { return new Date().toISOString(); }

function addClinicalLog(
  actor: string,
  action: "Added clinical note" | "Updated clinical note" | "Deleted clinical note",
  patientName: string,
  patientNo: string,
  appointmentId: string,
  before?: Record<string, unknown>,
  after?: Record<string, unknown>,
) {
  void writeAuditLog(
    actor,
    action,
    `Patient ${patientNo} (${patientName}) — Clinical Records [${appointmentId}]`,
    before,
    after,
  );
}

export type ProgressNoteForm = Pick<
  Appointment,
  | "complaint"
  | "diagnosis"
  | "treatmentPlan"
  | "prescription"
  | "followUpDate"
  | "notes"
>;

export type TreatmentForm = Pick<
  Appointment,
  | "diagnosis"
  | "treatmentPlan"
  | "dentalHistory"
  | "notes"
>;

export const recordsService = {
  /** Save the full clinical workspace (diagnosis, plan, dental history, notes, photos). */
  async saveTreatment(
    appointmentId: string,
    form: TreatmentForm,
    actor: string,
  ) {
    const { appointments, users } = getSnapshot();
    const appt = appointments.find((a) => a.id === appointmentId);

    const before = appt ? {
      diagnosis:     appt.diagnosis     ?? "",
      treatmentPlan: appt.treatmentPlan ?? "",
      dentalHistory: appt.dentalHistory ?? "",
      notes:         appt.notes         ?? "",
    } : undefined;

    await appointmentsService.update(appointmentId, { ...form }, actor);

    if (appt) {
      const patientUser = users.find((u) => u.id === appt.patientId);
      const patientNo = patientUser?.patientNo ?? appt.patientId;
      const isNew = !appt.diagnosis && !appt.treatmentPlan && !appt.notes;

      addClinicalLog(
        actor,
        isNew ? "Added clinical note" : "Updated clinical note",
        appt.patientName,
        patientNo,
        appointmentId,
        isNew ? undefined : before,
        {
          diagnosis:     form.diagnosis     ?? "",
          treatmentPlan: form.treatmentPlan ?? "",
          dentalHistory: form.dentalHistory ?? "",
          notes:         form.notes         ?? "",
        },
      );

      await notificationsService.notify(
        appt.patientId,
        "Clinical Record Updated",
        `Your clinical notes for ${appt.serviceName} on ${appt.date} have been updated by ${actor}. You can download them from your Treatment Records tab.`,
        "appointment",
      );
    }
  },

  /**
   * Save a Progress Note for an appointment.
   * Automatically:
   *  - stamps progressNoteAt + progressNoteBy on first save
   *  - writes an audit log entry ("Added" vs "Updated")
   *  - notifies the patient
   */
  async saveProgressNote(
    appointmentId: string,
    form: ProgressNoteForm,
    actor: string,
  ) {
    const { appointments, users } = getSnapshot();
    const appt = appointments.find((a) => a.id === appointmentId);
    if (!appt) throw new Error("Appointment not found.");

    const isNew = !appt.progressNoteAt;
    const now = nowISO();

    const patch: Partial<Appointment> = {
      complaint:    form.complaint    ?? "",
      diagnosis:    form.diagnosis    ?? "",
      treatmentPlan: form.treatmentPlan ?? "",
      prescription: form.prescription ?? "",
      followUpDate: form.followUpDate ?? "",
      notes:        form.notes        ?? "",
      progressNoteBy: actor,
      ...(isNew ? { progressNoteAt: now } : {}),
    };

    await updateDocTyped<Appointment>("appointments", appointmentId, patch as any);

    const next = appointments.map((a) =>
      a.id === appointmentId ? { ...a, ...patch, updatedAt: now } as Appointment : a,
    );
    setState({ appointments: next });

    const patientUser = users.find((u) => u.id === appt.patientId);
    const patientNo = patientUser?.patientNo ?? appt.patientId;

    const before = isNew ? undefined : {
      complaint:    appt.complaint    ?? "",
      diagnosis:    appt.diagnosis    ?? "",
      treatmentPlan: appt.treatmentPlan ?? "",
      prescription: appt.prescription ?? "",
      followUpDate: appt.followUpDate ?? "",
      notes:        appt.notes        ?? "",
    };
    const after = {
      complaint:    patch.complaint,
      diagnosis:    patch.diagnosis,
      treatmentPlan: patch.treatmentPlan,
      prescription: patch.prescription,
      followUpDate: patch.followUpDate,
      notes:        patch.notes,
    };

    addClinicalLog(
      actor,
      isNew ? "Added clinical note" : "Updated clinical note",
      appt.patientName,
      patientNo,
      appointmentId,
      before,
      after as Record<string, unknown>,
    );

    await notificationsService.notify(
      appt.patientId,
      "Progress Note Saved",
      `${actor} recorded a progress note for your ${appt.serviceName} visit on ${appt.date}. View it in your Clinical Records.`,
      "appointment",
    );
  },

  /**
   * Delete a progress note (clears all progress-note fields).
   * Writes a "Deleted clinical note" audit log entry.
   */
  async deleteProgressNote(appointmentId: string, actor: string) {
    const { appointments, users } = getSnapshot();
    const appt = appointments.find((a) => a.id === appointmentId);
    if (!appt) throw new Error("Appointment not found.");

    const before = {
      complaint:    appt.complaint    ?? "",
      diagnosis:    appt.diagnosis    ?? "",
      treatmentPlan: appt.treatmentPlan ?? "",
      prescription: appt.prescription ?? "",
      followUpDate: appt.followUpDate ?? "",
      notes:        appt.notes        ?? "",
    };

    const patch: Partial<Appointment> = {
      complaint: "", diagnosis: "", treatmentPlan: "",
      prescription: "", followUpDate: "", notes: "",
      progressNoteAt: "", progressNoteBy: "",
    };

    await updateDocTyped<Appointment>("appointments", appointmentId, patch as any);

    const now = nowISO();
    const next = appointments.map((a) =>
      a.id === appointmentId ? { ...a, ...patch, updatedAt: now } as Appointment : a,
    );
    setState({ appointments: next });

    const patientUser = users.find((u) => u.id === appt.patientId);
    const patientNo = patientUser?.patientNo ?? appt.patientId;

    addClinicalLog(
      actor,
      "Deleted clinical note",
      appt.patientName,
      patientNo,
      appointmentId,
      before,
    );
  },
};
