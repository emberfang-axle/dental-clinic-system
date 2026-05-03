import type { FeedbackEntry } from "../shared/types";
import { addDocTyped } from "./firestore";
import { getSnapshot, setState } from "../store/store";
import { notificationsService } from "./notifications";

function nowISO() { return new Date().toISOString(); }

export const feedbackService = {
  async submit(input: Omit<FeedbackEntry, "id" | "at">) {
    const entry: FeedbackEntry = { ...input, id: "", at: nowISO() };
    const id = await addDocTyped("feedbacks", { ...entry } as any);
    const saved = { ...entry, id } as FeedbackEntry;

    const snap = getSnapshot();
    setState({ feedbacks: [saved, ...snap.feedbacks] });

    // Notify all doctors and staff about the new feedback
    const targets = snap.users.filter((u) => u.role === "doctor" || u.role === "staff");
    const stars = "⭐".repeat(input.stars);
    await Promise.all(
      targets.map((d) =>
        notificationsService.notify(
          d.id,
          `New Patient Feedback ${stars}`,
          `${input.userName} left a ${input.stars}-star review: "${input.text.slice(0, 80)}${input.text.length > 80 ? "…" : ""}"`,
          "system"
        )
      )
    );

    return saved;
  },
};
