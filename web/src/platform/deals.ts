/**
 * Dalat Deals trên Firestore (bộ sưu tập "deals").
 * - Khách xem danh sách qua REST công khai, không cần tải Firebase, không cần đăng nhập. Rules chỉ cho đọc ưu đãi đã công bố.
 * - Dùng ưu đãi: phải đăng nhập. Một lệnh ghi gộp (batch) vừa tạo deals/{id}/redemptions/{uid} vừa tăng deals/{id}.count thêm 1.
 *   Rules bảo đảm: mỗi tài khoản một lần cho mỗi ưu đãi, không vượt số lượt, đúng thời hạn, và hai việc ghi phải đi cùng nhau.
 * - Quản trị viên (admins/{uid}) tạo, sửa, tạm dừng ưu đãi; không sửa được số đã dùng.
 */
import { cleanDeal, Deal, fromRest, makeCode } from "../utils/deals";
import { loadAccount, session } from "./account";

const REST = "https://firestore.googleapis.com/v1/projects/quay-hang-da-lat/databases/(default)/documents";

/** Ưu đãi đã công bố, đọc công khai */
export async function fetchPublicDeals(): Promise<Deal[]> {
  const res = await fetch(REST + ":runQuery", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "deals" }], where: { fieldFilter: { field: { fieldPath: "status" }, op: "EQUAL", value: { stringValue: "published" } } }, limit: 50 } }),
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const rows = (await res.json()) as { document?: { name?: string; fields?: Record<string, Record<string, unknown>> } }[];
  const out: Deal[] = [];
  for (const r of rows) {
    const d = r.document ? fromRest(r.document) : null;
    const deal = d ? cleanDeal(d.id, d.data) : null;
    if (deal) out.push(deal);
  }
  return out;
}

export interface Redemption { code: string; at: number }

/** Lượt dùng của chính người đang đăng nhập cho một ưu đãi (null nếu chưa dùng hoặc chưa đăng nhập) */
export async function myRedemption(dealId: string): Promise<Redemption | null> {
  await loadAccount();
  const s = session();
  if (!s) return null;
  const { doc, getDoc } = await import("firebase/firestore/lite");
  const snap = await getDoc(doc(s.db, "deals", dealId, "redemptions", s.uid));
  const d = snap.exists() ? snap.data() : null;
  return d && typeof d.code === "string" && typeof d.at === "number" ? { code: d.code, at: d.at } : null;
}

export type RedeemResult = { ok: true; redemption: Redemption } | { ok: false; reason: "signin" | "already" | "unavailable" | "network" };

/** Dùng ưu đãi. Không hoàn tác được. */
export async function redeem(dealId: string): Promise<RedeemResult> {
  await loadAccount();
  const s = session();
  if (!s) return { ok: false, reason: "signin" };
  try {
    const had = await myRedemption(dealId);
    if (had) return { ok: true, redemption: had };
    const { doc, increment, writeBatch } = await import("firebase/firestore/lite");
    const r: Redemption = { code: makeCode(), at: Date.now() };
    const batch = writeBatch(s.db);
    batch.set(doc(s.db, "deals", dealId, "redemptions", s.uid), { ...r, name: s.name });
    batch.update(doc(s.db, "deals", dealId), { count: increment(1) });
    await batch.commit();
    return { ok: true, redemption: r };
  } catch (e) {
    const code = (e as { code?: string })?.code || "";
    // Rules từ chối: hết lượt, hết hạn, tạm dừng, hoặc đã dùng ở máy khác
    if (code === "permission-denied" || code === "failed-precondition" || code === "not-found") {
      const had = await myRedemption(dealId).catch(() => null);
      return had ? { ok: true, redemption: had } : { ok: false, reason: "unavailable" };
    }
    return { ok: false, reason: "network" };
  }
}

/* ---------- Quản trị ---------- */
export async function adminListDeals(): Promise<Deal[]> {
  const s = session();
  if (!s) return [];
  const { collection, getDocs } = await import("firebase/firestore/lite");
  const snap = await getDocs(collection(s.db, "deals"));
  const out: Deal[] = [];
  snap.forEach((d) => {
    const deal = cleanDeal(d.id, d.data());
    if (deal) out.push(deal);
  });
  return out.sort((a, b) => b.startAt - a.startAt);
}

/** Tạo mới (count = 0) hoặc sửa (giữ nguyên count đang có trên máy chủ) */
export async function adminSaveDeal(d: Deal, isNew: boolean): Promise<void> {
  const s = session();
  if (!s) throw new Error("Chưa đăng nhập");
  const { doc, setDoc, updateDoc } = await import("firebase/firestore/lite");
  const body = { title: d.title, partner: d.partner, summary: d.summary, terms: d.terms, place: d.place, startAt: d.startAt, endAt: d.endAt, limit: d.limit, status: d.status, confirmed: d.confirmed, confirmedNote: d.confirmedNote };
  if (isNew) await setDoc(doc(s.db, "deals", d.id), { ...body, count: 0 });
  else await updateDoc(doc(s.db, "deals", d.id), body);
}
