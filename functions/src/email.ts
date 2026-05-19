import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as nodemailer from "nodemailer";

const GMAIL_FROM = defineSecret("GMAIL_FROM");
const GMAIL_CLIENT_ID = defineSecret("GMAIL_CLIENT_ID");
const GMAIL_CLIENT_SECRET = defineSecret("GMAIL_CLIENT_SECRET");
const GMAIL_REFRESH_TOKEN = defineSecret("GMAIL_REFRESH_TOKEN");

function makeTransport() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: GMAIL_FROM.value(),
      clientId: GMAIL_CLIENT_ID.value(),
      clientSecret: GMAIL_CLIENT_SECRET.value(),
      refreshToken: GMAIL_REFRESH_TOKEN.value(),
    },
  } as any);
}

export type EmailPayload =
  | { type: "booking";       patientEmail: string; patientName: string; serviceName: string; date: string; time: string; doctor: string }
  | { type: "confirmed";     patientEmail: string; patientName: string; serviceName: string; date: string; time: string }
  | { type: "completed";     patientEmail: string; patientName: string; serviceName: string }
  | { type: "cancelled";     patientEmail: string; patientName: string; serviceName: string; date: string; time: string }
  | { type: "rescheduled";   patientEmail: string; patientName: string; serviceName: string; date: string; time: string }
  | { type: "payment";       patientEmail: string; patientName: string; serviceName: string; price: number; receiptNumber?: string }
  | { type: "reminder";      patientEmail: string; patientName: string; serviceName: string; date: string; time: string; doctor?: string }
  | { type: "followup";      patientEmail: string; patientName: string; serviceName: string }
  | { type: "announcement";  toEmail: string; title: string; body: string };

function buildEmail(p: EmailPayload): { subject: string; html: string } {
  const clinic = "Estandarte Dental Clinic";
  const wrap = (subject: string, body: string) => ({
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <div style="background:#0b0a08;padding:24px;text-align:center">
          <h1 style="color:#dab23c;margin:0;font-size:22px">${clinic}</h1>
        </div>
        <div style="padding:32px">
          ${body}
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
          <p style="color:#6b7280;font-size:12px;margin:0">This is an automated message from ${clinic}. Please do not reply to this email.</p>
        </div>
      </div>`,
  });

  switch (p.type) {
    case "booking":
      return wrap(`Appointment Request Received — ${p.serviceName}`, `
        <p>Hi <strong>${p.patientName}</strong>,</p>
        <p>We received your appointment request. Here are the details:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;color:#6b7280;width:40%">Service</td><td style="padding:8px"><strong>${p.serviceName}</strong></td></tr>
          <tr style="background:#f9fafb"><td style="padding:8px;color:#6b7280">Date</td><td style="padding:8px"><strong>${p.date}</strong></td></tr>
          <tr><td style="padding:8px;color:#6b7280">Time</td><td style="padding:8px"><strong>${p.time}</strong></td></tr>
          <tr style="background:#f9fafb"><td style="padding:8px;color:#6b7280">Doctor</td><td style="padding:8px"><strong>${p.doctor}</strong></td></tr>
        </table>
        <p>Your appointment is <strong>pending confirmation</strong>. We will notify you once it is confirmed.</p>
        <p>Please arrive <strong>10 minutes early</strong> on the day of your appointment.</p>`);

    case "confirmed":
      return wrap(`Appointment Confirmed ✓ — ${p.serviceName}`, `
        <p>Hi <strong>${p.patientName}</strong>,</p>
        <p>Your appointment has been <strong style="color:#16a34a">confirmed</strong>!</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;color:#6b7280;width:40%">Service</td><td style="padding:8px"><strong>${p.serviceName}</strong></td></tr>
          <tr style="background:#f9fafb"><td style="padding:8px;color:#6b7280">Date</td><td style="padding:8px"><strong>${p.date}</strong></td></tr>
          <tr><td style="padding:8px;color:#6b7280">Time</td><td style="padding:8px"><strong>${p.time}</strong></td></tr>
        </table>
        <p>Please arrive <strong>10 minutes early</strong>. See you soon!</p>`);

    case "completed":
      return wrap(`Thank You for Your Visit — ${p.serviceName}`, `
        <p>Hi <strong>${p.patientName}</strong>,</p>
        <p>Your <strong>${p.serviceName}</strong> appointment has been completed.</p>
        <p>Thank you for choosing ${clinic}! We hope to see you again soon.</p>`);

    case "cancelled":
      return wrap(`Appointment Cancelled — ${p.serviceName}`, `
        <p>Hi <strong>${p.patientName}</strong>,</p>
        <p>Your appointment has been <strong style="color:#dc2626">cancelled</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;color:#6b7280;width:40%">Service</td><td style="padding:8px"><strong>${p.serviceName}</strong></td></tr>
          <tr style="background:#f9fafb"><td style="padding:8px;color:#6b7280">Date</td><td style="padding:8px"><strong>${p.date}</strong></td></tr>
          <tr><td style="padding:8px;color:#6b7280">Time</td><td style="padding:8px"><strong>${p.time}</strong></td></tr>
        </table>
        <p>To rebook, please visit our website or contact the clinic.</p>`);

    case "rescheduled":
      return wrap(`Appointment Rescheduled — ${p.serviceName}`, `
        <p>Hi <strong>${p.patientName}</strong>,</p>
        <p>Your appointment has been <strong>rescheduled</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;color:#6b7280;width:40%">Service</td><td style="padding:8px"><strong>${p.serviceName}</strong></td></tr>
          <tr style="background:#f9fafb"><td style="padding:8px;color:#6b7280">New Date</td><td style="padding:8px"><strong>${p.date}</strong></td></tr>
          <tr><td style="padding:8px;color:#6b7280">New Time</td><td style="padding:8px"><strong>${p.time}</strong></td></tr>
        </table>
        <p>Please arrive <strong>10 minutes early</strong>.</p>`);

    case "payment":
      return wrap(`Payment Confirmed — ${p.serviceName}`, `
        <p>Hi <strong>${p.patientName}</strong>,</p>
        <p>Your payment has been <strong style="color:#16a34a">confirmed</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;color:#6b7280;width:40%">Service</td><td style="padding:8px"><strong>${p.serviceName}</strong></td></tr>
          <tr style="background:#f9fafb"><td style="padding:8px;color:#6b7280">Amount</td><td style="padding:8px"><strong>PHP ${p.price.toLocaleString()}</strong></td></tr>
          ${p.receiptNumber ? `<tr><td style="padding:8px;color:#6b7280">Receipt No.</td><td style="padding:8px"><strong>${p.receiptNumber}</strong></td></tr>` : ""}
        </table>
        <p>Thank you for your payment!</p>`);

    case "reminder":
      return wrap(`Appointment Reminder — Tomorrow: ${p.serviceName}`, `
        <p>Hi <strong>${p.patientName}</strong>,</p>
        <p>This is a reminder that you have an appointment <strong>tomorrow</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:8px;color:#6b7280;width:40%">Service</td><td style="padding:8px"><strong>${p.serviceName}</strong></td></tr>
          <tr style="background:#f9fafb"><td style="padding:8px;color:#6b7280">Date</td><td style="padding:8px"><strong>${p.date}</strong></td></tr>
          <tr><td style="padding:8px;color:#6b7280">Time</td><td style="padding:8px"><strong>${p.time}</strong></td></tr>
          ${p.doctor ? `<tr style="background:#f9fafb"><td style="padding:8px;color:#6b7280">Doctor</td><td style="padding:8px"><strong>${p.doctor}</strong></td></tr>` : ""}
        </table>
        <p>Please arrive <strong>10 minutes early</strong>.</p>`);

    case "followup":
      return wrap(`How Was Your Visit? — ${p.serviceName}`, `
        <p>Hi <strong>${p.patientName}</strong>,</p>
        <p>We hope your <strong>${p.serviceName}</strong> appointment went well!</p>
        <p>Your feedback helps us improve our service. Please log in to our website to leave a review.</p>`);

    case "announcement":
      return wrap(p.title, `
        <p><strong>${p.title}</strong></p>
        <p>${p.body.replace(/\n/g, "<br/>")}</p>`);
  }
}

export const sendEmail = onCall({ secrets: [GMAIL_FROM, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN] }, async (request) => {
  const payload = request.data as EmailPayload;
  if (!payload?.type) throw new HttpsError("invalid-argument", "Missing email type.");

  const to = "patientEmail" in payload ? payload.patientEmail : (payload as any).toEmail;
  if (!to) throw new HttpsError("invalid-argument", "Missing recipient email.");

  const { subject, html } = buildEmail(payload);
  const transport = makeTransport();

  try {
    await transport.sendMail({
      from: `"Estandarte Dental Clinic" <${GMAIL_FROM.value()}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (err: any) {
    console.error("sendEmail error:", err);
    throw new HttpsError("internal", "Failed to send email.");
  }
});
