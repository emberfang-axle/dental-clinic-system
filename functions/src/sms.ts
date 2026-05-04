import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";

const SEMAPHORE_URL = "https://api.semaphore.co/api/v4/messages";

async function sendSms(to: string, message: string): Promise<void> {
  const key = process.env.SEMAPHORE_API_KEY;
  if (!key) {
    logger.warn("SEMAPHORE_API_KEY not set — SMS skipped"); return;
  }

  const res = await fetch(SEMAPHORE_URL, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({apikey: key, number: to, message, sendername: "ESTANDARTE"}),
  });
  if (!res.ok) logger.error("Semaphore error", await res.text());
}

/**
 * Fires when an appointment is updated.
 * Sends SMS to patient on: confirmed, completed, payment paid.
 *
 * Set secret: firebase functions:secrets:set SEMAPHORE_API_KEY
 */
export const appointmentSms = onDocumentUpdated(
  {document: "appointments/{id}", secrets: ["SEMAPHORE_API_KEY"]},
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    const phone: string | undefined = after.patientPhone;
    if (!phone) return;

    if (before.status !== "confirmed" && after.status === "confirmed") {
      await sendSms(phone,
        `Hi ${after.patientName}! Your ${after.serviceName} appointment on ${after.date} at ${after.time} is CONFIRMED. Please arrive 10 mins early. - Estandarte Dental`
      );
    }

    if (before.status !== "completed" && after.status === "completed") {
      await sendSms(phone,
        `Hi ${after.patientName}! Your ${after.serviceName} appointment is done. Thank you for visiting Estandarte Dental Clinic!`
      );
    }

    if (before.paymentStatus !== "paid" && after.paymentStatus === "paid") {
      await sendSms(phone,
        `Hi ${after.patientName}! Payment of PHP ${after.price} for ${after.serviceName} confirmed. Receipt: ${after.receiptNumber ?? "—"}. Thank you!`
      );
    }
  }
);
