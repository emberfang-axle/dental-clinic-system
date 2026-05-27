import type { PaymentMethod } from "../shared/types";
import { appointmentsService } from "./appointments";

export const paymentsService = {
  async markPaid(
    appointmentId: string,
    actor: string,
    paymentMethod: PaymentMethod,
    supportNote?: string,
  ) {
    await appointmentsService.update(
      appointmentId,
      {
        paymentStatus: "paid",
        paymentMethod,
        ...(supportNote?.trim() ? { supportNote: supportNote.trim() } : {}),
      },
      actor,
    );
  },
};
