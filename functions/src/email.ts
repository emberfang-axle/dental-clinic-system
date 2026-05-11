import {onDocumentCreated, onDocumentUpdated} from "firebase-functions/v2/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

const RESEND_URL = "https://api.resend.com/emails";
const FROM = "Estandarte Dental <noreply@estandartedental.com>";

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    logger.warn("RESEND_API_KEY not set — email skipped"); return;
  }

  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {"Content-Type": "application/json", "Authorization": `Bearer ${key}`},
    body: JSON.stringify({from: FROM, to, subject, html}),
  });
  if (!res.ok) logger.error("Resend error", await res.text());
}

/**
 * Fires when a new appointment is created.
 * Sends a booking-received confirmation email to the patient.
 */
export const appointmentBookedEmail = onDocumentCreated(
  {document: "appointments/{id}", secrets: ["RESEND_API_KEY"]},
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const email: string | undefined = data.patientEmail;
    if (!email) return;

    await sendEmail(
      email,
      "Appointment Request Received — Estandarte Dental",
      `<p>Hi <strong>${data.patientName}</strong>,</p>
       <p>We've received your appointment request for <strong>${data.serviceName}</strong> on <strong>${data.date}</strong> at <strong>${data.time}</strong> with <strong>${data.doctor}</strong>.</p>
       <p>Your appointment is currently <strong>pending confirmation</strong>. We'll send you another email once it's confirmed by our staff.</p>
       <p>Please arrive 10 minutes early on the day of your appointment.</p>
       <p>— Estandarte Dental Clinic</p>`
    );
  }
);

/**
 * Fires when an appointment is updated.
 * Sends email to patient on: confirmed, completed, payment paid.
 *
 * Set secret: firebase functions:secrets:set RESEND_API_KEY
 */
export const appointmentEmail = onDocumentUpdated(
  {document: "appointments/{id}", secrets: ["RESEND_API_KEY"]},
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
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

    if (before.status !== "completed" && after.status === "completed") {
      await sendEmail(
        email,
        "Appointment Completed — Thank You! — Estandarte Dental",
        `<p>Hi <strong>${after.patientName}</strong>,</p>
         <p>Your <strong>${after.serviceName}</strong> appointment has been completed. Thank you for visiting Estandarte Dental Clinic!</p>
         <p>We hope to see you again soon.</p>
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

    if (before.status !== "cancelled" && after.status === "cancelled") {
      await sendEmail(
        email,
        "Appointment Cancelled — Estandarte Dental",
        `<p>Hi <strong>${after.patientName}</strong>,</p>
         <p>Your <strong>${after.serviceName}</strong> appointment on <strong>${after.date}</strong> at <strong>${after.time}</strong> has been cancelled.</p>
         <p>If you'd like to rebook, please visit our website or contact the clinic.</p>
         <p>— Estandarte Dental Clinic</p>`
      );
    }

    if (before.status !== "rescheduled" && after.status === "rescheduled") {
      await sendEmail(
        email,
        "Appointment Rescheduled — Estandarte Dental",
        `<p>Hi <strong>${after.patientName}</strong>,</p>
         <p>Your <strong>${after.serviceName}</strong> appointment has been rescheduled to <strong>${after.date}</strong> at <strong>${after.time}</strong>.</p>
         <p>Please arrive 10 minutes early. See you soon!</p>
         <p>— Estandarte Dental Clinic</p>`
      );
    }
  }
);

/**
 * Runs every day at 8 AM Philippine Time (UTC+8 = 00:00 UTC).
 * Sends a 24-hour reminder email to patients with appointments tomorrow.
 *
 * Set secret: firebase functions:secrets:set RESEND_API_KEY
 */
export const appointmentReminderEmail = onSchedule(
  {schedule: "0 0 * * *", timeZone: "Asia/Manila", secrets: ["RESEND_API_KEY"]},
  async () => {
    const db = admin.firestore();

    // Calculate tomorrow's date in PH time
    const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Manila"}));
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const snap = await db.collection("appointments")
      .where("date", "==", tomorrowStr)
      .where("status", "in", ["confirmed", "pending"])
      .get();

    if (snap.empty) {
      logger.info(`No appointments tomorrow (${tomorrowStr})`);
      return;
    }

    const sends = snap.docs.map(async (docSnap) => {
      const appt = docSnap.data();
      const email: string | undefined = appt.patientEmail;
      if (!email) return;

      await sendEmail(
        email,
        "⏰ Appointment Reminder — Tomorrow at Estandarte Dental",
        `<p>Hi <strong>${appt.patientName}</strong>,</p>
         <p>This is a friendly reminder that you have a <strong>${appt.serviceName}</strong> appointment <strong>tomorrow, ${appt.date}</strong> at <strong>${appt.time}</strong> with <strong>${appt.doctor}</strong>.</p>
         <p>Please arrive <strong>10 minutes early</strong>. If you need to reschedule or cancel, please do so as soon as possible.</p>
         <p>See you tomorrow!</p>
         <p>— Estandarte Dental Clinic</p>`
      );
    });

    await Promise.all(sends);
    logger.info(`Sent ${snap.size} reminder email(s) for ${tomorrowStr}`);
  }
);

/**
 * Fires when a new announcement is created.
 * Sends the announcement to all patients via email.
 */
export const announcementEmail = onDocumentCreated(
  {document: "announcements/{id}", secrets: ["RESEND_API_KEY"]},
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const db = admin.firestore();
    const patientsSnap = await db.collection("users").where("role", "==", "patient").get();
    if (patientsSnap.empty) return;

    await Promise.all(
      patientsSnap.docs.map((d) => {
        const email: string | undefined = d.data().email;
        if (!email) return Promise.resolve();
        return sendEmail(
          email,
          `📢 ${data.title} — Estandarte Dental`,
          `<p>${data.body}</p><p>— Estandarte Dental Clinic</p>`
        );
      })
    );
  }
);
