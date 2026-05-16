/**
 * Reminder email scheduler — runs on app load.
 * Uses localStorage to avoid sending duplicate emails.
 *
 * Sends:
 *  - 24-hour reminder for tomorrow's confirmed/pending appointments
 *  - 7-day follow-up after completed appointments
 */

import { emailService } from "./email";
import type { Appointment } from "../shared/types";

const STORAGE_KEY = "sent_reminders";

function getSent(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function markSent(key: string) {
  const sent = getSent();
  sent.add(key);
  // Keep only last 500 keys to avoid unbounded growth
  const arr = [...sent].slice(-500);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function wasSent(key: string): boolean {
  return getSent().has(key);
}

export const reminderService = {
  run(appointments: Appointment[]) {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // Tomorrow's date string
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    for (const appt of appointments) {
      if (!appt.patientEmail) continue;

      // 24-hour reminder — tomorrow's confirmed or pending appointments
      if (
        appt.date === tomorrowStr &&
        (appt.status === "confirmed" || appt.status === "pending")
      ) {
        const key = `reminder_24h_${appt.id}`;
        if (!wasSent(key)) {
          markSent(key);
          void emailService.sendReminder({
            patientEmail: appt.patientEmail,
            patientName: appt.patientName,
            serviceName: appt.serviceName,
            date: appt.date,
            time: appt.time,
            doctor: appt.doctor,
          });
        }
      }

      // 7-day follow-up — completed appointments from 7 days ago
      if (appt.status === "completed" && appt.updatedAt) {
        const completedDate = appt.updatedAt.slice(0, 10);
        const daysSince = Math.floor(
          (now.getTime() - new Date(completedDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSince === 7) {
          const key = `followup_7d_${appt.id}`;
          if (!wasSent(key)) {
            markSent(key);
            void emailService.sendFollowUp({
              patientEmail: appt.patientEmail,
              patientName: appt.patientName,
              serviceName: appt.serviceName,
            });
          }
        }
      }

      // Today's reminder — for appointments today that are still pending (walk-ins / same-day)
      if (
        appt.date === todayStr &&
        appt.status === "confirmed"
      ) {
        const key = `reminder_today_${appt.id}`;
        if (!wasSent(key)) {
          markSent(key);
          void emailService.sendReminder({
            patientEmail: appt.patientEmail,
            patientName: appt.patientName,
            serviceName: appt.serviceName,
            date: appt.date,
            time: appt.time,
            doctor: appt.doctor,
          });
        }
      }
    }
  },
};
