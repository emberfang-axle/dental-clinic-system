import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase";

const fn = httpsCallable(getFunctions(app), "sendEmail");

async function send(payload: Record<string, unknown>) {
  try {
    await fn(payload);
  } catch (err) {
    console.warn("Email send error:", err);
  }
}

export const emailService = {
  sendBookingConfirmation: (p: { patientEmail: string; patientName: string; serviceName: string; date: string; time: string; doctor: string }) =>
    send({ type: "booking", ...p }),

  sendConfirmation: (p: { patientEmail: string; patientName: string; serviceName: string; date: string; time: string }) =>
    send({ type: "confirmed", ...p }),

  sendCompletion: (p: { patientEmail: string; patientName: string; serviceName: string }) =>
    send({ type: "completed", ...p }),

  sendCancellation: (p: { patientEmail: string; patientName: string; serviceName: string; date: string; time: string }) =>
    send({ type: "cancelled", ...p }),

  sendReschedule: (p: { patientEmail: string; patientName: string; serviceName: string; date: string; time: string }) =>
    send({ type: "rescheduled", ...p }),

  sendPaymentConfirmation: (p: { patientEmail: string; patientName: string; serviceName: string; price: number; receiptNumber?: string }) =>
    send({ type: "payment", ...p }),

  sendReminder: (p: { patientEmail: string; patientName: string; serviceName: string; date: string; time: string; doctor?: string }) =>
    send({ type: "reminder", ...p }),

  sendFollowUp: (p: { patientEmail: string; patientName: string; serviceName: string }) =>
    send({ type: "followup", ...p }),

  sendAnnouncement: (toEmail: string, title: string, body: string) =>
    send({ type: "announcement", toEmail, title, body }),
};
