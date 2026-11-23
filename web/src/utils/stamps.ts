import { useEffect, useState } from "react";
import { storage } from "./device";
import { cleanStamps, Stamp, unionStamps } from "./passport";
import { SAVED_EVENT } from "./saved";

/** Dấu mộc đã đóng, giữ trên máy người dùng (và trên tài khoản nếu họ đăng nhập) */
const KEY = "dalatevent.passport.v1";
const listeners = new Set<() => void>();
let cache: Stamp[] | null = null;

export function readStamps(): Stamp[] {
  if (!cache) {
    try {
      cache = cleanStamps(JSON.parse(storage.get(KEY) || "[]"));
    } catch (e) {
      cache = [];
    }
  }
  return cache;
}

/** silent = true khi thay đổi đến từ việc đồng bộ (không cần đẩy ngược lên tài khoản) */
export function setStamps(next: Stamp[], silent = false) {
  cache = unionStamps(next, []);
  storage.set(KEY, JSON.stringify(cache));
  listeners.forEach((fn) => fn());
  if (!silent) {
    try {
      window.dispatchEvent(new Event(SAVED_EVENT));
    } catch (e) {
      /* bỏ qua */
    }
  }
}

export const addStamps = (ids: string[], at: number) => setStamps(unionStamps(readStamps(), ids.map((id) => ({ id, at }))));

export function useStamps(): Stamp[] {
  const [list, setList] = useState<Stamp[]>(readStamps());
  useEffect(() => {
    const fn = () => setList([...readStamps()]);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return list;
}
