import { appointmentsService } from "./appointments";
import { notificationsService } from "./notifications";
import { getSnapshot } from "../store/store";

export const paymentsService = {
  async verify(appointmentId: string, actor: string) {
    await appointmentsService.update(appointmentId, { paymentStatus: "verified" }, actor);
  },

  async saveProof(
    appointmentId: string,
    gcashRef: string,
    paymentScreenshotUrl: string | undefined,
    actor: string
  ) {
    await appointmentsService.update(
      appointmentId,
      {
        gcashRef: gcashRef || undefined,
        paymentScreenshotUrl,
        paymentStatus: "pending_verification",
      },
      actor
    );

    // Notify all staff that a GCash receipt needs review
    const { appointments } = getSnapshot();
    const appt = appointments.find((a) => a.id === appointmentId);
    if (appt) {
      void notificationsService.notifyStaff(
        "GCash Receipt Submitted",
        `${appt.patientName} uploaded a GCash receipt for ${appt.serviceName}. Please review and confirm payment.`,
        "payment"
      );
    }
  },
};

