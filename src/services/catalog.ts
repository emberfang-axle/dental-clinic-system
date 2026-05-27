import type { Service } from "../shared/types";
import { getSnapshot, setState } from "../store/store";
import { updateDocTyped, setDocTyped, deleteDocTyped } from "./firestore";

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export const catalogService = {
  async add(service: Omit<Service, "id">) {
    const snap = getSnapshot();
    const next: Service = { ...service, id: makeId("svc") };
    await setDocTyped("services", next.id, next as any);
    setState({ services: [next, ...snap.services] });
    return next;
  },

  async update(id: string, partial: Partial<Service>) {
    await updateDocTyped<Service>("services", id, partial as any);
    const snap = getSnapshot();
    setState({
      services: snap.services.map((s) => (s.id === id ? ({ ...s, ...partial } as Service) : s)),
    });
  },

  async remove(id: string) {
    await deleteDocTyped("services", id);
    const snap = getSnapshot();
    setState({ services: snap.services.filter((s) => s.id !== id) });
  },
};

