import {onDocumentCreated, onDocumentUpdated} from "firebase-functions/v2/firestore";
import {onSchedule} from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {Resend} from "resend";

const FROM = "Estandarte Dental <noreply@estandartedental.com>";
const CLINIC_EMAIL = "drkingestandarte2022@gmail.com";

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  return new Resend(key);
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    const resend = getResend();
    const {error} = await resend.emails.send({from: FROM, to: [to], subject, html});
    if (error) logger.error("Resend error", error);
  } catch (err) {
    logger.warn("Email skipped:", err);
  }
}

function clinicSignature(): string {
  return `<p style="margin-top:24px;color:#888;font-size:13px;">— Estandarte Dental Clinic<br>
    <a href="https://estandartedental.com" style="color:#b8860b;">estandartedental.com</a></p>`;
}

/**
 * New appointment created → confirmation email to patient + alert to clinic.
 */
export const appointmentBookedEmail = onDocumentCreated(
  {document: "appointments/{id}", secrets: ["RESEND_API_KEY"]},
  async (event) => {
    const data = event.data?.data();
    if (!data?.patientEmail) return;

    await Promise.all([
      // Patient confirmation
      sendEmail(
        data.patientEmail,
        "Appointment Request Received — Estandarte Dental",
        `<p>Hi <strong>${data.patientName}</strong>,</p>
         <p>We've received your appointment request for <strong>${data.serviceName}</strong> on
         <strong>${data.date}</strong> at <strong>${data.time}</strong> with <strong>${data.doctor}</strong>.</p>
         <p>Your appointment is currently <strong>pending confirmation</strong>. We'll email you once it's confirmed.</p>
         <p>Please arrive 10 minutes early on the day of your appointment.</p>
         ${clinicSignature()}`
      ),
      // Clinic alert
      sendEmail(
        CLINIC_EMAIL,
        `${data.emergency ? "🚨 EMERGENCY — " : ""}New Booking: ${data.patientName} — ${data.serviceName}`,
        `<p>A new appointment has been booked${data.emergency ? " <strong style='color:red'>EMERGENCY</strong>" : ""}:</p>
         <ul>
           <li><strong>Patient:</strong> ${data.patientName} (${data.patientEmail})</li>
           <li><strong>Service:</strong> ${data.serviceName}</li>
           <li><strong>Doctor:</strong> ${data.doctor}</li>
           <li><strong>Date &amp; Time:</strong> ${data.date} at ${data.time}</li>
           ${data.emergency ? "<li><strong style='color:red'>⚠ Marked as EMERGENCY — priority handling required.</strong></li>" : ""}
         </ul>
         <p>Please confirm or manage this appointment in the admin dashboard.</p>
         ${clinicSignature()}`
      ),
    ]);
  }
);

/**
 * Appointment updated → status/payment emails to patient.
 */
export const appointmentEmail = onDocumentUpdated(
  {document: "appointments/{id}", secrets: ["RESEND_API_KEY"]},
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after || !after.patientEmail) return;

    const email: string = after.patientEmail;

    if (before.status !== "confirmed" && after.status === "confirmed") {
      await sendEmail(email,
        "Your Appointment is Confirmed — Estandarte Dental",
        `<p>Hi <strong>${after.patientName}</strong>,</p>
         <p>Your <strong>${after.serviceName}</strong> appointment on <strong>${after.date}</strong>
         at <strong>${after.time}</strong> is confirmed.</p>
         <p>Please arrive 10 minutes early. See you soon!</p>
         ${clinicSignature()}`
      );
    }

    if (before.status !== "completed" && after.status === "completed") {
      await sendEmail(email,
        "Appointment Completed — Thank You! — Estandarte Dental",
        `<p>Hi <strong>${after.patientName}</strong>,</p>
         <p>Your <strong>${after.serviceName}</strong> appointment has been completed.
         Thank you for visiting Estandarte Dental Clinic!</p>
         <p>We hope to see you again soon.</p>
         ${clinicSignature()}`
      );
    }

    if (before.paymentStatus !== "paid" && after.paymentStatus === "paid") {
      await sendEmail(email,
        `Payment Confirmed — ${after.receiptNumber ?? "Receipt"} — Estandarte Dental`,
        `<p>Hi <strong>${after.patientName}</strong>,</p>
         <p>Your payment of <strong>PHP ${after.price?.toLocaleString()}</strong> for
         <strong>${after.serviceName}</strong> has been confirmed.</p>
         <p>Receipt No: <strong>${after.receiptNumber ?? "—"}</strong></p>
         <p>Thank you for choosing Estandarte Dental Clinic!</p>
         ${clinicSignature()}`
      );
    }

    if (before.status !== "cancelled" && after.status === "cancelled") {
      await Promise.all([
        sendEmail(email,
          "Appointment Cancelled — Estandarte Dental",
          `<p>Hi <strong>${after.patientName}</strong>,</p>
           <p>Your <strong>${after.serviceName}</strong> appointment on <strong>${after.date}</strong>
           at <strong>${after.time}</strong> has been cancelled.</p>
           <p>If you'd like to rebook, please visit our website or contact the clinic.</p>
           ${clinicSignature()}`
        ),
        sendEmail(CLINIC_EMAIL,
          `Appointment Cancelled: ${after.patientName} — ${after.date} at ${after.time}`,
          `<p>An appointment has been <strong>cancelled</strong>:</p>
           <ul>
             <li><strong>Patient:</strong> ${after.patientName}</li>
             <li><strong>Service:</strong> ${after.serviceName}</li>
             <li><strong>Doctor:</strong> ${after.doctor}</li>
             <li><strong>Date & Time:</strong> ${after.date} at ${after.time}</li>
           </ul>
           <p>This slot is now available for rebooking.</p>
           ${clinicSignature()}`
        ),
      ]);
    }

    if (before.status !== "rescheduled" && after.status === "rescheduled") {
      await sendEmail(email,
        "Appointment Rescheduled — Estandarte Dental",
        `<p>Hi <strong>${after.patientName}</strong>,</p>
         <p>Your <strong>${after.serviceName}</strong> appointment has been rescheduled to
         <strong>${after.date}</strong> at <strong>${after.time}</strong>.</p>
         <p>Please arrive 10 minutes early. See you soon!</p>
         ${clinicSignature()}`
      );
    }
  }
);

/**
 * Daily 8 AM PH time — 24-hour reminder to patients with appointments tomorrow.
 */
export const appointmentReminderEmail = onSchedule(
  {schedule: "0 0 * * *", timeZone: "Asia/Manila", secrets: ["RESEND_API_KEY"]},
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
      logger.info(`No appointments tomorrow (${tomorrowStr})`);
      return;
    }

    await Promise.all(snap.docs.map(async (docSnap) => {
      const appt = docSnap.data();
      if (!appt.patientEmail) return;
      await sendEmail(
        appt.patientEmail,
        "⏰ Appointment Reminder — Tomorrow at Estandarte Dental",
        `<p>Hi <strong>${appt.patientName}</strong>,</p>
         <p>This is a friendly reminder that you have a <strong>${appt.serviceName}</strong> appointment
         <strong>tomorrow, ${appt.date}</strong> at <strong>${appt.time}</strong>
         with <strong>${appt.doctor}</strong>.</p>
         <p>Please arrive <strong>10 minutes early</strong>. If you need to reschedule or cancel,
         please do so as soon as possible.</p>
         <p>See you tomorrow!</p>
         ${clinicSignature()}`
      );
    }));

    logger.info(`Sent ${snap.size} reminder email(s) for ${tomorrowStr}`);
  }
);

/**
 * New announcement created → email all patients AND staff/doctors.
 */
export const announcementEmail = onDocumentCreated(
  {document: "announcements/{id}", secrets: ["RESEND_API_KEY"]},
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const db = admin.firestore();
    const usersSnap = await db.collection("users")
      .where("role", "in", ["patient", "staff", "doctor", "co-doctor", "admin"])
      .get();

    if (usersSnap.empty) return;

    const emails = usersSnap.docs
      .map((d) => d.data().email as string | undefined)
      .filter((e): e is string => !!e)
      .map((to) => ({
        from: FROM,
        to: [to],
        subject: `📢 ${data.title} — Estandarte Dental`,
        html: `<p>${data.body}</p>${clinicSignature()}`,
      }));

    if (emails.length === 0) return;

    try {
      const resend = getResend();
      const {error} = await resend.batch.send(emails);
      if (error) logger.error("Resend batch error", error);
    } catch (err) {
      logger.warn("Batch email skipped:", err);
    }

    logger.info(`Announcement "${data.title}" emailed to ${emails.length} users`);
  }
);
