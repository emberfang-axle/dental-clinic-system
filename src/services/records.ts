import type { Appointment } from "../shared/types";
import { getSnapshot } from "../store/store";
import { appointmentsService } from "./appointments";
import { notificationsService } from "./notifications";

export const recordsService = {
  async saveTreatment(
    appointmentId: string,
    form: Pick<
      Appointment,
      | "diagnosis"
      | "treatmentPlan"
      | "dentalHistory"
      | "notes"
      | "beforeImageUrl"
      | "afterImageUrl"
    >,
    actor: string
  ) {
    await appointmentsService.update(
      appointmentId,
      {
        diagnosis: form.diagnosis,
        treatmentPlan: form.treatmentPlan,
        dentalHistory: form.dentalHistory,
        notes: form.notes,
        beforeImageUrl: form.beforeImageUrl,
        afterImageUrl: form.afterImageUrl,
      },
      actor
    );

    // Notify the patient that their clinical record is ready
    const { appointments } = getSnapshot();
    const appt = appointments.find((a) => a.id === appointmentId);
    if (appt) {
      await notificationsService.notify(
        appt.patientId,
        "Clinical Record Updated",
        `Dr. ${actor} has saved your clinical notes for ${appt.serviceName} on ${appt.date}. You can now download your treatment notes from your Treatment Records tab.`,
        "appointment"
      );
    }
  },
};
