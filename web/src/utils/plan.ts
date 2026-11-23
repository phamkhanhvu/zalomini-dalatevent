import { useCallback, useEffect, useState } from "react";
import { storage } from "./device";
import type { PlanItem } from "./itinerary";
import { SAVED_EVENT } from "./saved";

/** Show diễn và sự kiện khác mà người dùng thêm vào lịch trình, giữ trên máy của họ (chương trình Festival lưu ở utils/saved) */
const KEY = "dalatevent.plan.v1";
const listeners = new Set<() => void>();
let cache: PlanItem[] | null = null;

/** Đọc trực tiếp (dùng cho phần hẹn nhắc lịch của app) */
export function readPlan(): PlanItem[] {
  return current();
}

/** Thay toàn bộ (dùng khi đồng bộ từ tài khoản về) */
export function replacePlan(items: PlanItem[]) {
  commit(items);
}

function commit(next: PlanItem[]) {
  cache = next;
  storage.set(KEY, JSON.stringify(cache));
  listeners.forEach((fn) => fn());
  try {
    window.dispatchEvent(new Event(SAVED_EVENT));
  } catch (e) {
    /* bỏ qua */
  }
}

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
    commit(on ? [...cur, it] : cur.filter((x) => x.id !== it.id));
    return on;
  }, []);
  const addMany = useCallback((list: PlanItem[]) => {
    const cur = current();
    const fresh = list.filter((it) => !cur.some((x) => x.id === it.id));
    if (fresh.length) commit([...cur, ...fresh]);
    return fresh.length;
  }, []);
  return { items, toggle, addMany, has: (id: string) => items.some((x) => x.id === id) };
}
