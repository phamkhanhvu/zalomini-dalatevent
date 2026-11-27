/**
 * Chấm sao địa điểm (Firestore "placeRatings/{placeId}" giữ tổng điểm và số lượt, "votes/{uid}" giữ số sao của từng người).
 * Ai cũng đọc được điểm trung bình; phải đăng nhập mới chấm, mỗi tài khoản một phiếu mỗi địa điểm (chấm lại thì sửa phiếu cũ).
 * Tổng và phiếu được ghi cùng một lệnh; rules kiểm tra tổng khớp với phiếu.
 */
import { loadAccount, session } from "./account";

const REST = "https://firestore.googleapis.com/v1/projects/quay-hang-da-lat/databases/(default)/documents";
const NAME = "projects/quay-hang-da-lat/databases/(default)/documents/placeRatings/";
export interface Rating { avg: number; count: number }

const cache = new Map<string, Rating | null>();
const listeners = new Set<() => void>();
export const onRatings = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
export const ratingOf = (id: string) => cache.get(id) || null;

/** Lấy điểm của nhiều địa điểm một lần (đọc công khai, không cần đăng nhập) */
export async function loadRatings(ids: string[]): Promise<void> {
  const need = ids.filter((id) => !cache.has(id));
  for (let i = 0; i < need.length; i += 100) {
    const part = need.slice(i, i + 100);
    part.forEach((id) => cache.set(id, null));
    try {
      const res = await fetch(REST + ":batchGet", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ documents: part.map((id) => NAME + id) }) });
      if (!res.ok) continue;
      const rows = (await res.json()) as { found?: { name: string; fields?: Record<string, { integerValue?: string }> } }[];
      for (const r of rows) {
        if (!r.found) continue;
        const id = r.found.name.slice(NAME.length);
        const sum = Number(r.found.fields?.sum?.integerValue || 0);
        const count = Number(r.found.fields?.count?.integerValue || 0);
        if (count > 0) cache.set(id, { avg: sum / count, count });
      }
    } catch (e) {
      /* mất mạng: không hiện điểm */
    }
  }
  listeners.forEach((f) => f());
}

/** Số sao chính mình đã chấm (0 nếu chưa) */
export async function myStars(id: string): Promise<number> {
  await loadAccount();
  const s = session();
  if (!s) return 0;
  try {
    const { doc, getDoc } = await import("firebase/firestore/lite");
    const v = await getDoc(doc(s.db, "placeRatings", id, "votes", s.uid));
    return v.exists() ? Number(v.data().stars) || 0 : 0;
  } catch (e) {
    return 0;
  }
}

export type RateResult = "ok" | "signin" | "error";

/** Chấm (hoặc chấm lại) 1–5 sao */
export async function rate(id: string, stars: number): Promise<RateResult> {
  if (!(stars >= 1 && stars <= 5)) return "error";
  await loadAccount();
  const s = session();
  if (!s) return "signin";
  try {
    const { doc, getDoc, writeBatch } = await import("firebase/firestore/lite");
    const pRef = doc(s.db, "placeRatings", id);
    const vRef = doc(s.db, "placeRatings", id, "votes", s.uid);
    const [p, v] = await Promise.all([getDoc(pRef), getDoc(vRef)]);
    const sum = p.exists() ? Number(p.data().sum) || 0 : 0;
    const count = p.exists() ? Number(p.data().count) || 0 : 0;
    const old = v.exists() ? Number(v.data().stars) || 0 : 0;
    const next = { sum: sum - old + stars, count: count + (old ? 0 : 1) };
    const batch = writeBatch(s.db);
    batch.set(pRef, next);
    batch.set(vRef, { stars, at: Date.now() });
    await batch.commit();
    cache.set(id, { avg: next.sum / next.count, count: next.count });
    listeners.forEach((f) => f());
    return "ok";
  } catch (e) {
    return "error";
  }
}
