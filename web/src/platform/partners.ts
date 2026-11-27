/**
 * Trang cho đối tác (quán, điểm diễn, nhà tổ chức).
 * - partnerRequests/{uid}: người đã đăng nhập xin làm đối tác; quản trị viên duyệt.
 * - partners/{uid}: hồ sơ đối tác do quản trị viên tạo khi duyệt; chỉ chính chủ và quản trị viên đọc.
 * - dealRequests/{id}: đối tác đề xuất ưu đãi; quản trị viên duyệt thì tạo ưu đãi thật trong "deals".
 * - Sự kiện đối tác gửi dùng chung "submissions"; đối tác đọc được sự kiện của chính mình.
 * - Lượt xem, lượt lấy mã của từng ưu đãi: Realtime Database pviews/<ưu đãi>/<ngày>/<deal_view|deal_use>.
 */
import { idToken, loadAccount, session } from "./account";
import { FB_CONFIG } from "./firebase-config";
import { adminSaveDeal } from "./deals";
import type { Deal } from "../utils/deals";

export type PartnerKind = "venue" | "cafe" | "organizer" | "other";
export interface PartnerRequest { uid: string; name: string; phone: string; kind: PartnerKind; note: string; status: "new" | "approved" | "rejected"; at: number; by: string }
export interface Partner { uid: string; name: string; since: number }
export interface DealRequest {
  id: string;
  uid: string;
  partner: string;
  title: string;
  summary: string;
  terms: string;
  place: string;
  startAt: number;
  endAt: number;
  limit: number;
  code: string;
  url: string;
  status: "new" | "approved" | "rejected";
  dealId: string;
  at: number;
}
export interface MySubmission { id: string; title: string; start_date: string; end_date: string; status: "new" | "approved" | "rejected" }

const str = (v: unknown, n: number) => String(v ?? "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, n);
const ms = (v: unknown) => {
  const t = v as { toMillis?: () => number } | number | undefined;
  return typeof t === "number" ? t : t && t.toMillis ? t.toMillis() : 0;
};
const st = (v: unknown): "new" | "approved" | "rejected" => (v === "approved" || v === "rejected" ? v : "new");

export type Me = { kind: "out" } | { kind: "none" } | { kind: "pending"; req: PartnerRequest } | { kind: "rejected"; req: PartnerRequest } | { kind: "partner"; partner: Partner };

/** Mình đang là gì: chưa đăng nhập / chưa xin / đang chờ / bị từ chối / đối tác */
export async function whoAmI(): Promise<Me> {
  await loadAccount();
  const s = session();
  if (!s) return { kind: "out" };
  const { doc, getDoc } = await import("firebase/firestore/lite");
  const p = await getDoc(doc(s.db, "partners", s.uid));
  if (p.exists()) {
    const d = p.data();
    return { kind: "partner", partner: { uid: s.uid, name: str(d.name, 80), since: ms(d.since) } };
  }
  const r = await getDoc(doc(s.db, "partnerRequests", s.uid));
  if (!r.exists()) return { kind: "none" };
  const req = toRequest(s.uid, r.data());
  return req.status === "rejected" ? { kind: "rejected", req } : { kind: "pending", req };
}

function toRequest(uid: string, d: Record<string, unknown>): PartnerRequest {
  const kind = (["venue", "cafe", "organizer", "other"].includes(String(d.kind)) ? d.kind : "other") as PartnerKind;
  return { uid, name: str(d.name, 80), phone: str(d.phone, 20), kind, note: str(d.note, 300), status: st(d.status), at: ms(d.at), by: str(d.by, 40) };
}

export async function requestPartner(input: { name: string; phone: string; kind: PartnerKind; note: string }): Promise<"ok" | "signin" | "error"> {
  await loadAccount();
  const s = session();
  if (!s) return "signin";
  try {
    const { doc, serverTimestamp, setDoc } = await import("firebase/firestore/lite");
    await setDoc(doc(s.db, "partnerRequests", s.uid), { name: str(input.name, 80), phone: str(input.phone, 20), kind: input.kind, note: str(input.note, 300), status: "new", at: serverTimestamp(), by: s.name });
    return "ok";
  } catch (e) {
    return "error";
  }
}

export async function mySubmissions(): Promise<MySubmission[]> {
  const s = session();
  if (!s) return [];
  const { collection, getDocs, query, where } = await import("firebase/firestore/lite");
  const snap = await getDocs(query(collection(s.db, "submissions"), where("uid", "==", s.uid)));
  const out: MySubmission[] = [];
  snap.forEach((d) => {
    const o = d.data();
    out.push({ id: d.id, title: str(o.title, 120), start_date: str(o.start_date, 10), end_date: str(o.end_date, 10), status: st(o.status) });
  });
  return out.sort((a, b) => b.start_date.localeCompare(a.start_date));
}

function toDealRequest(id: string, o: Record<string, unknown>): DealRequest {
  return {
    id,
    uid: str(o.uid, 128),
    partner: str(o.partner, 80),
    title: str(o.title, 120),
    summary: str(o.summary, 300),
    terms: str(o.terms, 500),
    place: str(o.place, 120),
    startAt: Number(o.startAt) || 0,
    endAt: Number(o.endAt) || 0,
    limit: Number(o.limit) || 0,
    code: str(o.code, 40),
    url: str(o.url, 300),
    status: st(o.status),
    dealId: str(o.dealId, 80),
    at: ms(o.at),
  };
}

export async function myDealRequests(): Promise<DealRequest[]> {
  const s = session();
  if (!s) return [];
  const { collection, getDocs, query, where } = await import("firebase/firestore/lite");
  const snap = await getDocs(query(collection(s.db, "dealRequests"), where("uid", "==", s.uid)));
  const out: DealRequest[] = [];
  snap.forEach((d) => out.push(toDealRequest(d.id, d.data())));
  return out.sort((a, b) => b.at - a.at);
}

export type DealDraft = Pick<DealRequest, "title" | "summary" | "terms" | "place" | "startAt" | "endAt" | "limit" | "code" | "url">;

export function dealDraftErrors(d: DealDraft): string[] {
  const e: string[] = [];
  if (d.title.trim().length < 6) e.push("title");
  if (d.summary.trim().length < 10) e.push("summary");
  if (d.terms.trim().length < 10) e.push("terms");
  if (!(d.startAt > 0 && d.endAt > d.startAt)) e.push("dates");
  if (!(d.limit >= 1 && d.limit <= 5000)) e.push("limit");
  if (d.url && !/^https:\/\//.test(d.url.trim())) e.push("url");
  return e;
}

export async function proposeDeal(partner: Partner, d: DealDraft): Promise<"ok" | "error"> {
  const s = session();
  if (!s) return "error";
  try {
    const { addDoc, collection, serverTimestamp } = await import("firebase/firestore/lite");
    await addDoc(collection(s.db, "dealRequests"), {
      uid: s.uid,
      partner: partner.name,
      title: str(d.title, 120),
      summary: str(d.summary, 300),
      terms: str(d.terms, 500),
      place: str(d.place, 120),
      startAt: Math.round(d.startAt),
      endAt: Math.round(d.endAt),
      limit: Math.round(d.limit),
      code: str(d.code, 40),
      url: str(d.url, 300),
      status: "new",
      dealId: "",
      at: serverTimestamp(),
    });
    return "ok";
  } catch (e) {
    return "error";
  }
}

/** Lượt xem và lượt lấy mã của một ưu đãi trong N ngày gần đây */
export async function dealViews(dealId: string, days = 30): Promise<{ views: number; uses: number }> {
  const tok = await idToken();
  if (!tok || !FB_CONFIG.databaseURL) return { views: 0, uses: 0 };
  const key = dealId.replace(/[.#$[\]/]/g, "-").replace(/\s+/g, "_").slice(0, 80);
  try {
    const r = await fetch(`${FB_CONFIG.databaseURL}/pviews/${encodeURIComponent(key)}.json?auth=${encodeURIComponent(tok)}`);
    if (!r.ok) return { views: 0, uses: 0 };
    const d = ((await r.json()) || {}) as Record<string, { deal_view?: number; deal_use?: number }>;
    const from = new Date(Date.now() + 7 * 3600000 - days * 86400000).toISOString().slice(0, 10);
    let views = 0;
    let uses = 0;
    for (const [day, v] of Object.entries(d)) {
      if (day < from) continue;
      views += Number(v.deal_view) || 0;
      uses += Number(v.deal_use) || 0;
    }
    return { views, uses };
  } catch (e) {
    return { views: 0, uses: 0 };
  }
}

/* ---------- Quản trị ---------- */
export async function adminPartnerRequests(): Promise<PartnerRequest[]> {
  const s = session();
  if (!s) return [];
  const { collection, getDocs } = await import("firebase/firestore/lite");
  const snap = await getDocs(collection(s.db, "partnerRequests"));
  const out: PartnerRequest[] = [];
  snap.forEach((d) => out.push(toRequest(d.id, d.data())));
  return out.sort((a, b) => b.at - a.at);
}

export async function adminDecidePartner(req: PartnerRequest, ok: boolean): Promise<void> {
  const s = session();
  if (!s) throw new Error("Chưa đăng nhập");
  const { doc, serverTimestamp, setDoc, updateDoc } = await import("firebase/firestore/lite");
  if (ok) await setDoc(doc(s.db, "partners", req.uid), { name: req.name, since: serverTimestamp() });
  await updateDoc(doc(s.db, "partnerRequests", req.uid), { status: ok ? "approved" : "rejected" });
}

export async function adminDealRequests(): Promise<DealRequest[]> {
  const s = session();
  if (!s) return [];
  const { collection, getDocs } = await import("firebase/firestore/lite");
  const snap = await getDocs(collection(s.db, "dealRequests"));
  const out: DealRequest[] = [];
  snap.forEach((d) => out.push(toDealRequest(d.id, d.data())));
  return out.sort((a, b) => b.at - a.at);
}

const slug = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);

/** Duyệt: tạo ưu đãi thật (đang công bố) rồi đánh dấu đề xuất đã duyệt */
export async function adminDecideDeal(r: DealRequest, ok: boolean): Promise<void> {
  const s = session();
  if (!s) throw new Error("Chưa đăng nhập");
  const { doc, updateDoc } = await import("firebase/firestore/lite");
  if (!ok) {
    await updateDoc(doc(s.db, "dealRequests", r.id), { status: "rejected" });
    return;
  }
  const id = (slug(r.partner + "-" + r.title) || "uu-dai") + "-" + r.id.slice(0, 4).toLowerCase();
  const deal: Deal = {
    id,
    title: r.title,
    partner: r.partner,
    summary: r.summary,
    terms: r.terms,
    place: r.place,
    startAt: r.startAt,
    endAt: r.endAt,
    limit: r.limit,
    count: 0,
    status: "published",
    confirmed: true,
    confirmedNote: "Đối tác " + r.partner + " tự gửi qua trang đối tác",
    code: r.code,
    url: r.url,
  } as Deal;
  await adminSaveDeal(deal, true);
  await updateDoc(doc(s.db, "dealRequests", r.id), { status: "approved", dealId: id });
}
