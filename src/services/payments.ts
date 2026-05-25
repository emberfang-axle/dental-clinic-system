import { appointmentsService } from "./appointments";

export const paymentsService = {
  async markPaid(appointmentId: string, actor: string) {
    await appointmentsService.update(appointmentId, { paymentStatus: "paid", paymentMethod: "cash" }, actor);
  },
};
