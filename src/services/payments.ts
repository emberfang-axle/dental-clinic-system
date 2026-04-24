import { appointmentsService } from "./appointments";

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
  },
};

