import type { Appointment } from "../shared/types";
import { appointmentsService } from "./appointments";

export const recordsService = {
  saveTreatment(
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
    appointmentsService.update(
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
  },
};

