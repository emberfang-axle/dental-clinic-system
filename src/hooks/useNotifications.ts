import { useEffect, useMemo, useState } from "react";
import type { NotificationEntry } from "../shared/types";
import { listenCollection, qOrderBy, qWhere } from "../services/firestore";

export function useNotifications(userId?: string) {
  const [items, setItems] = useState<NotificationEntry[]>([]);

  const constraints = useMemo(() => {
    if (!userId) return [qOrderBy("at", "desc")] as any[];
    return [qWhere("userId", "==", userId), qOrderBy("at", "desc")] as any[];
  }, [userId]);

  useEffect(() => {
    return listenCollection<NotificationEntry>("notifications", setItems, constraints);
  }, [constraints]);

  return items;
}