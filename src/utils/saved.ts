import { useCallback, useEffect, useState } from "react";
import { storage } from "./zalo";

const KEY = "dalatevent.saved.v1";
const listeners = new Set<() => void>();

function read(): string[] {
  try {
    const raw = storage.get(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

let cache: string[] | null = null;

function current() {
  if (!cache) cache = read();
  return cache;
}

/** Danh sách chương trình người dùng đã lưu, giữ trên máy của họ */
export function useSaved() {
  const [ids, setIds] = useState<string[]>(current());

  useEffect(() => {
    const fn = () => setIds([...current()]);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    const cur = current();
    cache = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    storage.set(KEY, JSON.stringify(cache));
    listeners.forEach((fn) => fn());
    return cache.includes(id);
  }, []);

  return { ids, toggle, has: (id: string) => ids.includes(id) };
}
