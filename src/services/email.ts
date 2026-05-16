/**
 * Browser-side email service — intentionally no-op.
 * All transactional emails are handled by Firebase Cloud Functions (functions/src/email.ts)
 * which trigger automatically on Firestore writes. Sending from the browser would cause duplicates.
 *
 * This stub exists so existing imports don't break during the transition to fully server-side emails.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const noop = async (..._args: any[]) => {};

export const emailService = {
  sendBookingConfirmation: noop,
  sendConfirmation: noop,
  sendCompletion: noop,
  sendPaymentConfirmation: noop,
  sendCancellation: noop,
  sendReschedule: noop,
  sendAnnouncement: noop,
  sendReminder: noop,
  sendFollowUp: noop,
};
