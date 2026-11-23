/**
 * Hộ chiếu Đà Lạt: danh mục dấu mộc và điều kiện đóng dấu (đang đứng gần địa điểm, đúng thời gian sự kiện).
 * Không dùng gì của trình duyệt để chạy được trong kiểm thử tự động.
 * Lưu ý: kiểm tra vị trí chạy trên máy người dùng nên chỉ mang tính vui chơi, không dùng để phát thưởng có giá trị.
 */
import { distanceKm } from "./geo.ts";

export interface StampDef {
  id: string;
  kind: "place" | "event";
  title: string;
  place: string;
  lat: number | null;
  lng: number | null;
  /** Chỉ có ở dấu sự kiện: khoảng thời gian đóng được dấu (mili giây) */
  start?: number;
  end?: number;
  /** Mã để mở trang liên quan: mã địa điểm hoặc mã chương trình */
  ref: string;
}
export interface Stamp { id: string; at: number }
export interface Pos { lat: number; lng: number; accuracy: number }

interface InVenue { id: string; name: string; lat: number | null; lng: number | null }
interface InStage { id: string; name: string; places?: { name: string; lat: number | null; lng: number | null }[] }
interface InEvent { id: string; title: string; status: string; venue_id: string | null; sessions: { start_at: string; end_at: string }[] }

/** Đứng trong bán kính này (mét) quanh địa điểm thì đóng được dấu */
export const RADIUS_M = 300;
/** Được đóng dấu sự kiện sớm hoặc muộn hơn giờ diễn ra bấy nhiêu */
export const GRACE_MS = 3600000;

/** Danh mục dấu: mỗi địa điểm có tọa độ một dấu "đã đến", mỗi chương trình Festival đã công bố có tọa độ một dấu "đã dự" */
export function catalogue(venues: InVenue[], stages: InStage[], events: InEvent[]): StampDef[] {
  const out: StampDef[] = [];
  const has = (x: { lat: number | null; lng: number | null }) => typeof x.lat === "number" && typeof x.lng === "number";
  for (const v of venues) if (has(v)) out.push({ id: "pl:f-" + v.id, kind: "place", title: v.name, place: v.name, lat: v.lat, lng: v.lng, ref: "f-" + v.id });
  for (const st of stages) (st.places || []).forEach((pl, i) => {
    if (has(pl)) out.push({ id: "pl:s-" + st.id + "-" + i, kind: "place", title: pl.name, place: pl.name, lat: pl.lat, lng: pl.lng, ref: "s-" + st.id + "-" + i });
  });
  const byId = new Map(venues.map((v) => [v.id, v]));
  for (const e of events) {
    const v = e.venue_id ? byId.get(e.venue_id) : undefined;
    if (e.status !== "published" || !v || !has(v) || !e.sessions.length) continue;
    out.push({ id: "ev:" + e.id, kind: "event", title: e.title, place: v.name, lat: v.lat, lng: v.lng, start: Math.min(...e.sessions.map((s) => Date.parse(s.start_at))), end: Math.max(...e.sessions.map((s) => Date.parse(s.end_at))), ref: e.id });
  }
  return out;
}

export type Verdict = "ok" | "early" | "over" | "far" | "inaccurate";

/** Khoảng cách (mét) từ vị trí tới dấu */
export const metersTo = (def: StampDef, pos: Pos) => Math.round(distanceKm(pos, { lat: def.lat as number, lng: def.lng as number }) * 1000);

export function check(def: StampDef, pos: Pos, now: number): Verdict {
  if (def.kind === "event") {
    if (now < (def.start as number) - GRACE_MS) return "early";
    if (now > (def.end as number) + GRACE_MS) return "over";
  }
  // Định vị quá mơ hồ (ví dụ theo mạng, sai số hàng cây số) thì không đóng dấu
  if (!(pos.accuracy <= 1000)) return "inaccurate";
  // Trừ bớt sai số của máy, nhưng tối đa 150 m để không ai đứng xa vẫn đóng được
  return metersTo(def, pos) - Math.min(pos.accuracy, 150) <= RADIUS_M ? "ok" : "far";
}

export interface StampResult { earned: StampDef[]; nearest: { def: StampDef; meters: number; verdict: Verdict } | null }

/** Những dấu chưa có mà đóng được ngay tại vị trí này; nếu không có thì trả về dấu gần nhất kèm lý do */
export function stampHere(defs: StampDef[], have: Stamp[], pos: Pos, now: number): StampResult {
  const got = new Set(have.map((s) => s.id));
  const open = defs.filter((d) => !got.has(d.id));
  const earned = open.filter((d) => check(d, pos, now) === "ok");
  if (earned.length) return { earned, nearest: null };
  const ranked = open.map((def) => ({ def, meters: metersTo(def, pos), verdict: check(def, pos, now) })).sort((a, b) => a.meters - b.meters);
  return { earned: [], nearest: ranked[0] || null };
}

/** Gộp dấu của hai máy: không mất dấu nào, mỗi dấu giữ lần đóng sớm nhất */
export function unionStamps(a: Stamp[], b: Stamp[]): Stamp[] {
  const m = new Map<string, number>();
  for (const s of [...a, ...b]) m.set(s.id, Math.min(s.at, m.get(s.id) ?? Infinity));
  return [...m.entries()].map(([id, at]) => ({ id, at })).sort((x, y) => x.at - y.at || x.id.localeCompare(y.id));
}

/** Kiểm tra lại danh sách dấu đọc từ bộ nhớ máy hoặc từ tài khoản */
export function cleanStamps(raw: unknown): Stamp[] {
  if (!Array.isArray(raw)) return [];
  const out: Stamp[] = [];
  for (const r of raw.slice(0, 300)) {
    if (r && typeof r === "object" && typeof (r as Stamp).id === "string" && /^(pl|ev):[a-z0-9-]{1,80}$/.test((r as Stamp).id) && Number.isFinite((r as Stamp).at)) out.push({ id: (r as Stamp).id, at: (r as Stamp).at });
  }
  return unionStamps(out, []);
}
