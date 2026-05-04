import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";

const RESEND_URL = "https://api.resend.com/emails";
const FROM = "Estandarte Dental <noreply@estandartedental.com>";

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) { logger.warn("RESEND_API_KEY not set — email skipped"); return; }

  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  if (!res.ok) logger.error("Resend error", await res.text());
}

/**
 * Fires when an appointment is updated.
 * Sends email to patient on: confirmed, payment paid.
 *
 * Set secret: firebase functions:secrets:set RESEND_API_KEY
 */
export const appointmentEmail = onDocumentUpdated(
  { document: "appointments/{id}", secrets: ["RESEND_API_KEY"] },
  async (event) => {
    const before = event.data?.before.data();
    const after  = event.data?.after.data();
    if (!before || !after) return;

    const email: string | undefined = after.patientEmail;
    if (!email) return;

    if (before.status !== "confirmed" && after.status === "confirmed") {
      await sendEmail(
        email,
        "Your Appointment is Confirmed — Estandarte Dental",
        `<p>Hi <strong>${after.patientName}</strong>,</p>
         <p>Your <strong>${after.serviceName}</strong> appointment on <strong>${after.date}</strong> at <strong>${after.time}</strong> is confirmed.</p>
         <p>Please arrive 10 minutes early. See you soon!</p>
         <p>— Estandarte Dental Clinic</p>`
      );
    }

    if (before.paymentStatus !== "paid" && after.paymentStatus === "paid") {
      await sendEmail(
        email,
        `Payment Confirmed — ${after.receiptNumber ?? "Receipt"}`,
        `<p>Hi <strong>${after.patientName}</strong>,</p>
         <p>Your payment of <strong>PHP ${after.price?.toLocaleString()}</strong> for <strong>${after.serviceName}</strong> has been confirmed.</p>
         <p>Receipt No: <strong>${after.receiptNumber ?? "—"}</strong></p>
         <p>Thank you for choosing Estandarte Dental Clinic!</p>`
      );
    }
  }
);
