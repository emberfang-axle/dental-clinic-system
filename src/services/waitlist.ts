import { collection, doc, db } from "./firestore";
import { setDoc, deleteDoc } from "firebase/firestore";
import { getSnapshot, setState, showToast } from "../store/store";
import type { WaitlistEntry } from "../shared/types";

function makeId() { return `wl_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`; }

export const waitlistService = {
  async join(entry: Omit<WaitlistEntry, "id" | "createdAt">) {
    const { waitlist } = getSnapshot();
    const already = waitlist.find(
      (w) => w.patientId === entry.patientId && w.preferredDate === entry.preferredDate && w.doctor === entry.doctor
    );
    if (already) { showToast("You're already on the waitlist for this date.", "info"); return; }

    const id = makeId();
    const data: WaitlistEntry = { ...entry, id, createdAt: new Date().toISOString() };
    const ref = doc(collection(db, "waitlist"), id);
    await setDoc(ref, data);
    setState({ waitlist: [data, ...waitlist] });
    showToast("Added to waitlist. We'll notify you if a slot opens.", "success");
  },

  async leave(id: string) {
    await deleteDoc(doc(collection(db, "waitlist"), id));
    const { waitlist } = getSnapshot();
    setState({ waitlist: waitlist.filter((w) => w.id !== id) });
    showToast("Removed from waitlist.", "info");
  },
};
