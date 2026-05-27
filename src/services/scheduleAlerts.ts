/**
 * Schedule Alert Service
 * Sends role-based notifications based on daily schedule events.
 * Called once per session from bootstrap when the user logs in.
 */

import type { User } from "../shared/types";
import { getSnapshot } from "../store/store";
import { notificationsService } from "./notifications";

function todayStr() { return new Date().toISOString().slice(0, 10); }
function tomorrowStr() {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Guard against re-running on profile listener re-fires within the same day */
const ranForUser = new Map<string, string>(); // userId → date

/** Check if a notification with this exact title was already sent today */
function alreadySentToday(userId: string, title: string): boolean {
  const today = todayStr();
  const { notifications } = getSnapshot();
  return notifications.some(
    (n) => n.userId === userId && n.title === title && n.at.startsWith(today)
  );
}

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

      const scheduleTitle = `📋 Today's Schedule — ${todayAppts.length} appointment${todayAppts.length !== 1 ? "s" : ""}`;
      if (todayAppts.length > 0 && !alreadySentToday(user.id, scheduleTitle)) {
        const names = todayAppts.map((a) => `${a.patientName} (${a.time})`).join(", ");
        await notificationsService.notify(user.id, scheduleTitle, `Patients today: ${names}`, "reminder");
      }

      const missedTitle = `⚠️ ${missed.length} No-Show${missed.length !== 1 ? "s" : ""} Today`;
      if (missed.length > 0 && !alreadySentToday(user.id, missedTitle)) {
        const names = missed.map((a) => `${a.patientName} (${a.time})`).join(", ");
        await notificationsService.notify(user.id, missedTitle, `Patients who did not show up: ${names}`, "reminder");
      }
    }

    // ── STAFF alerts ─────────────────────────────────────────────────
    if (user.role === "staff") {
      const todayAppts = appointments.filter((a) => a.date === today && a.status !== "cancelled");
      const pending = todayAppts.filter((a) => a.status === "pending");
      const queueTitle = `🗓️ Daily Queue — ${todayAppts.length} appointment${todayAppts.length !== 1 ? "s" : ""} today`;
      if (todayAppts.length > 0 && !alreadySentToday(user.id, queueTitle)) {
        await notificationsService.notify(
          user.id, queueTitle,
          `${pending.length} pending confirmation. First appointment at ${todayAppts[0]?.time ?? "—"}.`,
          "reminder"
        );
      }
    }

    // ── PATIENT alerts ───────────────────────────────────────────────
    if (user.role === "patient") {
      const tomorrowAppts = appointments.filter(
        (a) => a.patientId === user.id && a.date === tomorrow && (a.status === "confirmed" || a.status === "pending")
      );
      for (const appt of tomorrowAppts) {
        const title = "⏰ Appointment Tomorrow";
        if (!alreadySentToday(user.id, title)) {
          await notificationsService.notify(
            user.id, title,
            `Reminder: Your ${appt.serviceName} appointment is tomorrow (${appt.date}) at ${appt.time} with ${appt.doctor}. Please arrive 10 minutes early.`,
            "reminder"
          );
        }
      }

      const { feedbacks } = getSnapshot();
      const threeDaysAgo = new Date(); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const recentCompleted = appointments.filter((a) =>
        a.patientId === user.id &&
        a.status === "completed" &&
        new Date(a.date) >= threeDaysAgo &&
        !feedbacks.some((f) => f.appointmentId === a.id)
      );
      for (const appt of recentCompleted) {
        const title = "💬 How was your visit?";
        const { notifications } = getSnapshot();
        const alreadySent = notifications.some((n) => n.userId === user.id && n.title === title && n.message.includes(appt.serviceName));
        if (!alreadySent) {
          await notificationsService.notify(
            user.id, title,
            `We hope your ${appt.serviceName} appointment went well! Share your feedback to help us improve our service.`,
            "reminder"
          );
        }
      }
    }
  },
};
