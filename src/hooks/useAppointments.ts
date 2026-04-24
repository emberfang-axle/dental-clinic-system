import { useEffect, useMemo, useState } from "react";
import type { Appointment, Role } from "../shared/types";
import { listenCollection, qOrderBy, qWhere } from "../services/firestore";

export function useAppointments(opts: { role: Role; userId?: string }) {
  const { role, userId } = opts;
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const constraints = useMemo(() => {
    const base = [qOrderBy("date", "desc"), qOrderBy("time", "desc")] as any[];
    if (role === "patient" && userId) return [qWhere("patientId", "==", userId), ...base];
    return base;
  }, [role, userId]);

  useEffect(() => {
    return listenCollection<Appointment>("appointments", setAppointments, constraints);
  }, [constraints]);

  return appointments;
}

