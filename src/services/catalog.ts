import type { Service } from "../shared/types";
import { getSnapshot, setState } from "../store/store";

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export const catalogService = {
  setPrice(id: string, price: number) {
    this.update(id, { price });
  },

  add(service: Omit<Service, "id">) {
    const snap = getSnapshot();
    const next: Service = { ...service, id: makeId("svc") };
    setState({ services: [next, ...snap.services] });
    return next;
  },

  update(id: string, partial: Partial<Service>) {
    const snap = getSnapshot();
    setState({
      services: snap.services.map((s) => (s.id === id ? ({ ...s, ...partial } as Service) : s)),
    });
  },

  remove(id: string) {
    const snap = getSnapshot();
    setState({ services: snap.services.filter((s) => s.id !== id) });
  },
};

