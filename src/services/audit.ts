import type { AuditLog } from "../shared/types";
import { getSnapshot, setState } from "../store/store";
import { addDocTyped } from "./firestore";

function nowISO() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

/** Writes audit entries to Firestore and mirrors them in local state for instant UI. */
export async function writeAuditLog(
  actor: string,
  action: string,
  target: string,
  before?: Record<string, unknown>,
  after?: Record<string, unknown>,
) {
  const at = nowISO();
  const entry: AuditLog = {
    id: makeId("log"),
    actor,
    action,
    target,
    at,
    before,
    after,
  };

  const { logs } = getSnapshot();
  setState({ logs: [entry, ...logs] });

  try {
    const id = await addDocTyped("logs", { actor, action, target, at, before, after });
    setState({
      logs: getSnapshot().logs.map((l) => (l.id === entry.id ? { ...entry, id } : l)),
    });
  } catch {
    // Local mirror remains; Firestore listener will reconcile when online
  }
}
