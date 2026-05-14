import {onDocumentCreated, onDocumentUpdated} from "firebase-functions/v2/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
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
 * Fires when a new appointment is created.
 * Sends a booking-received SMS to the patient.
 */
export const appointmentBookedSms = onDocumentCreated(
  {document: "appointments/{id}", secrets: ["SEMAPHORE_API_KEY"]},
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const phone: string | undefined = data.patientPhone;
    if (!phone) return;

    await sendSms(phone,
      `Hi ${data.patientName}! Your request for ${data.serviceName} on ${data.date} at ${data.time} has been received and is pending confirmation. - Estandarte Dental`
    );
  }
);

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
    if (before.status !== "cancelled" && after.status === "cancelled") {
      await sendSms(phone,
        `Hi ${after.patientName}! Your ${after.serviceName} appointment on ${after.date} at ${after.time} has been cancelled. To rebook, visit our website or contact the clinic. - Estandarte Dental`
      );
    }

    if (before.status !== "rescheduled" && after.status === "rescheduled") {
      await sendSms(phone,
        `Hi ${after.patientName}! Your ${after.serviceName} appointment has been rescheduled to ${after.date} at ${after.time}. Please arrive 10 mins early. - Estandarte Dental`
      );
    }
  }
);

/**
 * Fires when a new announcement is created.
 * Sends the announcement to all patients who have a phone number.
 */
export const announcementSms = onDocumentCreated(
  {document: "announcements/{id}", secrets: ["SEMAPHORE_API_KEY"]},
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const db = admin.firestore();
    const patientsSnap = await db.collection("users").where("role", "==", "patient").get();
    if (patientsSnap.empty) return;

    await Promise.all(
      patientsSnap.docs.map((d) => {
        const phone: string | undefined = d.data().phone;
        if (!phone) return Promise.resolve();
        return sendSms(phone,
          `[Estandarte Dental] ${data.title}: ${data.body.slice(0, 120)}${data.body.length > 120 ? "..." : ""}`
        );
      })
    );
  }
);

/**
 * Runs every day at 8 AM Philippine Time.
 * Sends a 24-hour reminder SMS to patients with appointments tomorrow.
 */
export const appointmentReminderSms = onSchedule(
  {schedule: "0 0 * * *", timeZone: "Asia/Manila", secrets: ["SEMAPHORE_API_KEY"]},
  async () => {
    const db = admin.firestore();

    const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Manila"}));
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const snap = await db.collection("appointments")
      .where("date", "==", tomorrowStr)
      .where("status", "in", ["confirmed", "pending"])
      .get();

    if (snap.empty) {
      logger.info(`No SMS reminders for ${tomorrowStr}`);
      return;
    }

    await Promise.all(
      snap.docs.map((d) => {
        const appt = d.data();
        const phone: string | undefined = appt.patientPhone;
        if (!phone) return Promise.resolve();
        return sendSms(phone,
          `Hi ${appt.patientName}! Reminder: ${appt.serviceName} appointment tomorrow ${appt.date} at ${appt.time}. Please arrive 10 mins early. - Estandarte Dental`
        );
      })
    );

    logger.info(`Sent ${snap.size} SMS reminder(s) for ${tomorrowStr}`);
  }
);
