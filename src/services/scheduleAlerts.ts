/**
 * Schedule Alert Service
 * Sends role-based notifications based on daily schedule events.
 * Called once per session from bootstrap when the user logs in.
 *
 * Doctor  → daily overview, missed appointments summary
 * Staff   → daily queue reminder, new bookings
 * Patient → 24h reminder, post-visit follow-up
 */

import type { User } from "../shared/types";
import { getSnapshot } from "../store/store";
import { notificationsService } from "./notifications";

function todayStr() { return new Date().toISOString().slice(0, 10); }
function tomorrowStr() {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Already sent this session — avoid duplicate alerts on re-renders */
const sentThisSession = new Set<string>();

function once(key: string, fn: () => void) {
  if (sentThisSession.has(key)) return;
  sentThisSession.add(key);
  fn();
}

/** Guard against re-running on profile listener re-fires within the same day */
const ranForUser = new Map<string, string>(); // userId → date

export const scheduleAlertsService = {
  async runForUser(user: User) {
    const today = todayStr();
    if (ranForUser.get(user.id) === today) return;
    ranForUser.set(user.id, today);
    const { appointments } = getSnapshot();
    const tomorrow = tomorrowStr();

    // ── DOCTOR alerts ────────────────────────────────────────────────
    if (user.role === "doctor") {
      const todayAppts = appointments.filter((a) => a.date === today && a.status !== "cancelled");
      const missed = appointments.filter((a) => a.date === today && a.status === "no-show");

      // Daily schedule overview (once per day)
      once(`doctor-daily-${today}`, async () => {
        if (todayAppts.length === 0) return;
        const names = todayAppts.map((a) => `${a.patientName} (${a.time})`).join(", ");
        await notificationsService.notify(
          user.id,
          `📋 Today's Schedule — ${todayAppts.length} appointment${todayAppts.length !== 1 ? "s" : ""}`,
          `Patients today: ${names}`,
          "reminder"
        );
      });

      // Missed appointments report
      once(`doctor-missed-${today}`, async () => {
        if (missed.length === 0) return;
        const names = missed.map((a) => `${a.patientName} (${a.time})`).join(", ");
        await notificationsService.notify(
          user.id,
          `⚠️ ${missed.length} No-Show${missed.length !== 1 ? "s" : ""} Today`,
          `Patients who did not show up: ${names}`,
          "reminder"
        );
      });
    }

    // ── STAFF alerts ─────────────────────────────────────────────────
    if (user.role === "staff") {
      const todayAppts = appointments.filter((a) => a.date === today && a.status !== "cancelled");
      const pending = todayAppts.filter((a) => a.status === "pending");

      once(`staff-daily-${today}-${user.id}`, async () => {
        if (todayAppts.length === 0) return;
        await notificationsService.notify(
          user.id,
          `🗓️ Daily Queue — ${todayAppts.length} appointment${todayAppts.length !== 1 ? "s" : ""} today`,
          `${pending.length} pending confirmation. First appointment at ${todayAppts[0]?.time ?? "—"}.`,
          "reminder"
        );
      });
    }

    // ── PATIENT alerts ───────────────────────────────────────────────
    if (user.role === "patient") {
      // 24h reminder — appointments tomorrow
      const tomorrowAppts = appointments.filter(
        (a) => a.patientId === user.id && a.date === tomorrow && (a.status === "confirmed" || a.status === "pending")
      );
      for (const appt of tomorrowAppts) {
        once(`patient-24h-${appt.id}`, async () => {
          await notificationsService.notify(
            user.id,
            "⏰ Appointment Tomorrow",
            `Reminder: Your ${appt.serviceName} appointment is tomorrow (${appt.date}) at ${appt.time} with ${appt.doctor}. Please arrive 10 minutes early.`,
            "reminder"
          );
        });
      }

      // Post-visit follow-up — completed appointments in last 3 days with no feedback
      const { feedbacks } = getSnapshot();
      const threeDaysAgo = new Date(); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const recentCompleted = appointments.filter((a) =>
        a.patientId === user.id &&
        a.status === "completed" &&
        new Date(a.date) >= threeDaysAgo &&
        !feedbacks.some((f) => f.appointmentId === a.id)
      );
      for (const appt of recentCompleted) {
        once(`patient-followup-${appt.id}`, async () => {
          await notificationsService.notify(
            user.id,
            "💬 How was your visit?",
            `We hope your ${appt.serviceName} appointment went well! Share your feedback to help us improve our service.`,
            "reminder"
          );
        });
      }
    }
  },
};
