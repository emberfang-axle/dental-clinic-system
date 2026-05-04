import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { google } from "googleapis";

function getCalendar() {
  const key = process.env.GOOGLE_CALENDAR_KEY;
  const email = process.env.GOOGLE_CALENDAR_EMAIL;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!key || !email || !calendarId) return null;

  const auth = new google.auth.JWT(email, undefined, key.replace(/\\n/g, "\n"), [
    "https://www.googleapis.com/auth/calendar",
  ]);
  return { calendar: google.calendar({ version: "v3", auth }), calendarId };
}

function toDateTime(date: string, time: string): string {
  // date: YYYY-MM-DD, time: HH:MM or H:MM
  const [h, m] = time.split(":").map(Number);
  return new Date(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+08:00`).toISOString();
}

/**
 * Creates a Google Calendar event when a new appointment is booked.
 *
 * Set secrets:
 *   firebase functions:secrets:set GOOGLE_CALENDAR_KEY   (service account private key)
 *   firebase functions:secrets:set GOOGLE_CALENDAR_EMAIL (service account email)
 *   firebase functions:secrets:set GOOGLE_CALENDAR_ID    (calendar ID, e.g. primary)
 */
export const calendarCreate = onDocumentCreated(
  { document: "appointments/{id}", secrets: ["GOOGLE_CALENDAR_KEY", "GOOGLE_CALENDAR_EMAIL", "GOOGLE_CALENDAR_ID"] },
  async (event) => {
    const data = event.data?.data();
    if (!data || data.status === "cancelled") return;

    const cal = getCalendar();
    if (!cal) { logger.warn("Google Calendar secrets not set — skipped"); return; }

    const start = toDateTime(data.date, data.time);
    const end   = new Date(new Date(start).getTime() + 60 * 60 * 1000).toISOString();

    try {
      const res = await cal.calendar.events.insert({
        calendarId: cal.calendarId,
        requestBody: {
          summary: `${data.patientName} — ${data.serviceName}`,
          description: `Doctor: ${data.doctor}\nPatient: ${data.patientName}`,
          start: { dateTime: start, timeZone: "Asia/Manila" },
          end:   { dateTime: end,   timeZone: "Asia/Manila" },
        },
      });
      // Store the Google Calendar event ID back on the appointment
      await event.data?.ref.update({ calendarEventId: res.data.id });
    } catch (e) {
      logger.error("Calendar create error", e);
    }
  }
);

/**
 * Deletes the Google Calendar event when an appointment is cancelled.
 */
export const calendarDelete = onDocumentUpdated(
  { document: "appointments/{id}", secrets: ["GOOGLE_CALENDAR_KEY", "GOOGLE_CALENDAR_EMAIL", "GOOGLE_CALENDAR_ID"] },
  async (event) => {
    const before = event.data?.before.data();
    const after  = event.data?.after.data();
    if (!before || !after) return;
    if (before.status === after.status) return;
    if (after.status !== "cancelled") return;

    const cal = getCalendar();
    if (!cal || !after.calendarEventId) return;

    try {
      await cal.calendar.events.delete({ calendarId: cal.calendarId, eventId: after.calendarEventId });
    } catch (e) {
      logger.error("Calendar delete error", e);
    }
  }
);
