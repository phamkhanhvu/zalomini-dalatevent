/**
 * Trợ lý "Hôm nay đi đâu?": đọc một câu tiếng Việt tự nhiên (thời gian, số người, ngân sách, sở thích, gần đâu)
 * rồi lọc trong dữ liệu sự kiện đã đối chiếu. Đây là bộ phân tích theo luật, chạy ngay trên máy người dùng:
 * không gọi mô hình AI nào và không bao giờ tự nghĩ ra giá vé hay lịch diễn. Mục nào dữ liệu không có giá
 * thì nói rõ là chưa có. Không dùng gì của trình duyệt để chạy được trong kiểm thử tự động.
 */
import type { AgendaItem } from "./agenda.ts";
import { DAY_MS, vnDate, vnMidnight } from "./agenda.ts";
import { distanceKm } from "./geo.ts";
import type { PlaceInfo } from "./places.ts";
import { itemsAt } from "./places.ts";
import { fold, parseDateQuery } from "./search.ts";
import { tr } from "../i18n.ts";

export type Interest = "music" | "flower" | "exhibit" | "sport" | "free";
export interface Ask {
  from: number;
  to: number;
  /** Chữ mô tả khoảng thời gian; dateGiven = false nghĩa là người dùng không nói ngày và trợ lý tự lấy mặc định */
  dateLabel: string;
  dateGiven: boolean;
  people: number | null;
  /** Tổng ngân sách cho cả nhóm, đồng; null = không nói */
  budget: number | null;
  interests: Interest[];
  /** Địa điểm người dùng muốn ở gần (nếu nhắc tên) */
  near: PlaceInfo | null;
  nearMe: boolean;
}

const NUM: Record<string, number> = { mot: 1, hai: 2, ba: 3, bon: 4, tu: 4, nam: 5, sau: 6, bay: 7, tam: 8, chin: 9, muoi: 10, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const num = (w: string) => (/^\d+$/.test(w) ? +w : NUM[w] ?? NaN);

/** Số người: "hai người", "2 người", "cặp đôi", "một mình", "gia đình 4 người", "nhóm 5", "3 đứa" */
export function parsePeople(q: string): number | null {
  if (/\b(mot minh|di mot minh|solo|alone|by myself|just me)\b/.test(q)) return 1;
  const en = q.match(/\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten) (people|persons|adults|friends|guests|of us|pax)\b/) || q.match(/\b(?:family of|group of|party of) (\d{1,2}|two|three|four|five|six|seven|eight|nine|ten)\b/);
  if (en) {
    const n = num(en[1]);
    if (n >= 1 && n <= 50) return n;
  }
  const m = q.match(/\b(\d{1,2}|mot|hai|ba|bon|nam|sau|bay|tam|chin|muoi) (nguoi|dua|ban|khach|ve)\b/) || q.match(/\b(?:nhom|gia dinh|ca nha|tui minh|bon minh|chung minh) (\d{1,2}|hai|ba|bon|nam|sau|bay|tam|chin|muoi)\b/);
  if (m) {
    const n = num(m[1]);
    if (n >= 1 && n <= 50) return n;
  }
  if (/\b(cap doi|hai dua|hai vo chong|vo chong|nguoi yeu|hen ho|2 dua|couple|date night|my partner|my wife|my husband|girlfriend|boyfriend)\b/.test(q)) return 2;
  return null;
}

/**
 * Ngân sách (đồng) đọc từ câu gốc: "500.000đ", "500k", "500 nghìn", "500 ngàn", "1 triệu", "1,5tr", "1tr2".
 * Có chữ "mỗi người" thì nhân với số người (nếu biết). "miễn phí" là 0.
 */
export function parseBudget(raw: string, people: number | null): number | null {
  const s = raw.toLowerCase().replace(/\s+/g, " ");
  let v: number | null = null;
  let m = s.match(/(\d+)(?:[.,](\d))?\s*(?:triệu|trieu|tr|củ|million|mil|m)(?:\s*(\d))?(?![a-zà-ỹ])/);
  if (m) v = (+m[1] + (m[2] ? +m[2] / 10 : m[3] ? +m[3] / 10 : 0)) * 1000000;
  if (v === null) {
    m = s.match(/(\d{1,3}(?:[.,]\d{3})+)\s*(?:đ|d|vnd|vnđ|đồng|dong)?(?![\d])/);
    if (m) v = +m[1].replace(/[.,]/g, "");
  }
  if (v === null) {
    m = s.match(/(\d{2,4})\s*(?:k|nghìn|nghin|ngàn|ngan)(?![a-zà-ỹ])/);
    if (m) v = +m[1] * 1000;
  }
  if (v === null) return null;
  if ((/(mỗi|moi|một|mot|\/)\s*(người|nguoi|ng|đứa|dua|vé|ve)\b/.test(s) || /\b(per person|each|per head|pp)\b/.test(s)) && people) v *= people;
  return v >= 10000 && v <= 100000000 ? v : null;
}

const INTERESTS: [Interest, RegExp][] = [
  ["music", /\b(nghe nhac|nhac|acoustic|ca si|band|show|jazz|hoa nhac|live|san khau|concert|music|gig|singer)\b/],
  ["flower", /\b(hoa|ngam hoa|vuon hoa|duong hoa|festival hoa|flowers?|garden|bloom)\b/],
  ["exhibit", /\b(trien lam|trung bay|tranh|nghe thuat|bao tang|exhibition|gallery|art|museum)\b/],
  ["sport", /\b(the thao|golf|chay bo|marathon|dap xe|giai dau|sports?|running|cycling|race)\b/],
  ["free", /\b(mien phi|free|khong ton tien|khong mat tien|no cost)\b/],
];

/** Đọc câu hỏi. Không nói ngày thì lấy từ bây giờ tới hết ngày mai. */
export function parseAsk(text: string, now: number, places: PlaceInfo[]): Ask {
  const date = parseDateQuery(text, now);
  const q = fold(text);
  const people = parsePeople(q);
  let budget = parseBudget(text, people);
  const interests = INTERESTS.filter(([, re]) => re.test(q)).map(([k]) => k);
  // "hoa nhạc" là nhạc, không phải hoa
  if (interests.includes("music") && /\bhoa nhac\b/.test(q) && !/\b(ngam hoa|vuon hoa|duong hoa|festival hoa)\b/.test(q)) interests.splice(interests.indexOf("flower"), interests.includes("flower") ? 1 : 0);
  if (interests.includes("free") && budget === null) budget = 0;
  const t0 = vnMidnight(vnDate(now));
  const nearMe = /\b(gan toi|gan day|gan minh|gan cho toi|quanh day|gan em|gan anh|near me|nearby|around here|close to me)\b/.test(q);
  let near: PlaceInfo | null = null;
  const after = q.match(/\b(?:gan|o gan|quanh|canh|o|near|around|close to) (.+)$/);
  if (after && !nearMe) {
    const tail = after[1];
    // Chấm điểm theo số từ trong tên địa điểm xuất hiện sau chữ "gần": trùng cả tên, hoặc trùng quá nửa số từ, hoặc trùng một từ riêng đủ dài
    const GENERIC = new Set(["show", "cafe", "quang", "truong", "duong", "cong", "vien", "khu", "acoustic", "heritage", "lang"]);
    let best = 0;
    for (const p of places.filter((x) => typeof x.lat === "number")) {
      const n = fold(p.name);
      const words = n.split(" ").filter((w) => w.length > 1);
      const hit = words.filter((w) => new RegExp("\\b" + w + "\\b").test(tail));
      const score = tail.includes(n) ? 100 : hit.length * 2 > words.length ? 10 + hit.length : hit.some((w) => w.length >= 5 && !GENERIC.has(w)) ? 5 : 0;
      if (score > best) {
        best = score;
        near = p;
      }
    }
  }
  return { from: date ? Math.max(date.from, date.to > now ? Math.min(now, date.to) : date.from) : now, to: date ? date.to : t0 + 2 * DAY_MS, dateLabel: date ? date.label : tr("Từ bây giờ đến hết ngày mai", "From now until the end of tomorrow"), dateGiven: !!date, people, budget, interests, near, nearMe };
}

interface InStage { id: string; name: string; kind: string; address: string; items: { url?: string; price?: string }[] }
export interface Price { perPerson: number; source: string }
const money = (s: string) => {
  const m = s.match(/(\d{1,3}(?:\.\d{3})+)\s*đ/);
  return m ? +m[1].replace(/\./g, "") : null;
};

/**
 * Giá thấp nhất cho một người, CHỈ lấy từ dữ liệu: giá ghi ở đúng đêm diễn; hoặc, với sân khấu có lịch hằng tuần,
 * mức phiếu nước ghi trong phần địa chỉ. Không có thì trả về null, không suy đoán.
 */
export function priceOf(it: AgendaItem, stages: InStage[]): Price | null {
  if (it.kind !== "show") return null;
  const st = stages.find((s) => s.name === it.label);
  if (!st) return null;
  const row = st.items.find((x) => x.url && x.url === it.url && x.price);
  const direct = row && row.price ? money(row.price) : null;
  if (direct) return { perPerson: direct, source: row!.price! };
  if (st.kind === "weekly") {
    const v = money(st.address);
    const m = st.address.match(/[^.]*\d{1,3}(?:\.\d{3})+\s*đ[^.]*/);
    if (v && m) return { perPerson: v, source: m[0].trim() };
  }
  return null;
}

export interface Pick { item: AgendaItem; price: Price | null; total: number | null; km: number | null }
export interface Advice { fits: Pick[]; unknown: Pick[]; over: Pick[]; matched: number }

const TOPIC: Record<Exclude<Interest, "free">, (x: AgendaItem, f: string) => boolean> = {
  music: (x, f) => x.kind === "show" || /\b(nhac|jazz|acoustic|hoa nhac|ca si|music|concert)\b/.test(f),
  flower: (x, f) => x.kind === "festival" || /\b(hoa|festival|flowers?)\b/.test(f),
  exhibit: (_x, f) => /\b(trien lam|trung bay|tranh|exhibition|art)\b/.test(f),
  sport: (_x, f) => /\b(the thao|golf|chay|dap xe|sports?|run|marathon|cycling)\b/.test(f),
};

/**
 * Chọn sự kiện hợp với câu hỏi. agenda là các mục trong khoảng thời gian đã hỏi (đã dựng từ dữ liệu).
 * - fits: có giá trong dữ liệu và vừa ngân sách (hoặc người dùng không nói ngân sách).
 * - unknown: dữ liệu không có giá, người dùng cần tự kiểm tra ở trang gốc.
 * - over: có giá và vượt ngân sách (chỉ để báo số lượng, không gợi ý).
 */
export function recommend(ask: Ask, agenda: AgendaItem[], stages: InStage[], places: PlaceInfo[], events: { id: string; venue_id: string | null; venue_ids?: string[] }[], origin: { lat: number; lng: number } | null, now: number): Advice {
  const topics = ask.interests.filter((k): k is Exclude<Interest, "free"> => k !== "free");
  const seen = new Set<string>();
  const pool = agenda
    .filter((x) => x.status === "published" && x.end >= now && x.end > ask.from && x.start < ask.to)
    .filter((x) => {
      // Chỉ so với tên và loại sự kiện, không so với đoạn mô tả (mô tả hay nhắc lướt tới đủ thứ)
      const f = fold(x.title + " " + x.label);
      return !topics.length || topics.some((k) => TOPIC[k](x, f));
    })
    .filter((x) => {
      const k = x.weekly ? "w:" + x.title + vnDate(x.start) : x.key;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  const from = ask.near && typeof ask.near.lat === "number" ? { lat: ask.near.lat, lng: ask.near.lng as number } : origin;
  const whereOf = (x: AgendaItem) => places.find((p) => typeof p.lat === "number" && itemsAt(p, events, [x]).length > 0);
  const people = ask.people || 1;
  const picks: Pick[] = pool.map((item) => {
    const price = priceOf(item, stages);
    const pl = from ? whereOf(item) : undefined;
    return { item, price, total: price ? price.perPerson * people : null, km: from && pl ? distanceKm(from, { lat: pl.lat as number, lng: pl.lng as number }) : null };
  });
  const order = (a: Pick, b: Pick) => (from ? (a.km ?? 1e9) - (b.km ?? 1e9) : 0) || Math.max(a.item.start, now) - Math.max(b.item.start, now) || a.item.title.localeCompare(b.item.title, "vi");
  const known = picks.filter((p) => p.total !== null);
  const fits = known.filter((p) => ask.budget === null || (p.total as number) <= ask.budget).sort(order);
  const over = known.filter((p) => ask.budget !== null && (p.total as number) > ask.budget).sort(order);
  const unknown = picks.filter((p) => p.total === null).sort(order);
  return { fits: fits.slice(0, 8), unknown: unknown.slice(0, 8), over, matched: pool.length };
}
