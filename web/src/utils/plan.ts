import { useCallback, useEffect, useState } from "react";
import { storage } from "./device";
import type { PlanItem } from "./itinerary";

/** Show diễn và sự kiện khác mà người dùng thêm vào lịch trình, giữ trên máy của họ (chương trình Festival lưu ở utils/saved) */
const KEY = "dalatevent.plan.v1";
const listeners = new Set<() => void>();
let cache: PlanItem[] | null = null;

function current(): PlanItem[] {
  if (!cache) {
    try {
      const arr = JSON.parse(storage.get(KEY) || "[]");
      cache = Array.isArray(arr) ? arr.filter((x) => x && typeof x.id === "string" && typeof x.start === "number" && typeof x.end === "number") : [];
    } catch (e) {
      cache = [];
    }
  }
  return cache!;
}

export function usePlan() {
  const [items, setItems] = useState<PlanItem[]>(current());
  useEffect(() => {
    const fn = () => setItems([...current()]);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  const toggle = useCallback((it: PlanItem) => {
    const cur = current();
    const on = !cur.some((x) => x.id === it.id);
    cache = on ? [...cur, it] : cur.filter((x) => x.id !== it.id);
    storage.set(KEY, JSON.stringify(cache));
    listeners.forEach((fn) => fn());
    return on;
  }, []);
  return { items, toggle, has: (id: string) => items.some((x) => x.id === id) };
}
