import type { FeedbackEntry } from "../shared/types";
import { getSnapshot, setState } from "../store/store";

function nowISO() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export const feedbackService = {
  submit(input: Omit<FeedbackEntry, "id" | "at">) {
    const snap = getSnapshot();
    const entry: FeedbackEntry = { ...input, id: makeId("fb"), at: nowISO() };
    setState({ feedbacks: [entry, ...snap.feedbacks] });
    return entry;
  },

  submitLegacy(
    userId: string,
    userName: string,
    stars: number,
    text: string,
    appointmentId?: string
  ) {
    return this.submit({
      userId,
      userName,
      stars,
      text,
      appointmentId,
    });
  },
};

