/**
 * Tìm kiếm trên trang chủ: sự kiện, địa điểm, nghệ sĩ, hoạt động, và hiểu cả ngày tháng trong câu tìm
 * ("12.12", "hôm nay", "cuối tuần", "thứ bảy"). Không phân biệt hoa thường và dấu tiếng Việt.
 * File này không dùng gì của trình duyệt để chạy được trong kiểm thử.
 */
import { addDays, DAY_MS, vnDate, vnMidnight, vnWeekday, windowOf } from "./agenda.ts";
import type { AgendaItem } from "./agenda.ts";
import { tr, wdLong } from "../i18n.ts";

/** Bỏ dấu, viết thường, gom khoảng trắng */
export function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[“”"'’.,;:()–—-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface DateQuery { from: number; to: number; label: string; rest: string }

const WEEKDAY_WORDS: [RegExp, number][] = [
  [/\b(chu nhat|cn)\b/, 0],
  [/\bthu (hai|2)\b/, 1],
  [/\bthu (ba|3)\b/, 2],
  [/\bthu (tu|4)\b/, 3],
  [/\bthu (nam|5)\b/, 4],
  [/\bthu (sau|6)\b/, 5],
  [/\bthu (bay|7)\b/, 6],
];
const WEEKDAY_EN: [RegExp, number][] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map((w, i) => [new RegExp("\\b" + w + "\\b"), i]);
const MONTHS_EN = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const dmy = (d: string) => d.slice(8, 10) + "." + d.slice(5, 7) + "." + d.slice(0, 4);

/**
 * Tách phần ngày tháng khỏi câu tìm. Trả về null nếu câu không nhắc tới ngày nào.
 * `rest` là phần chữ còn lại (đã bỏ dấu) để tìm tiếp theo tên.
 */
export function parseDateQuery(query: string, now: number): DateQuery | null {
  // Ngày dạng số phải tách trước khi bỏ dấu chấm: 12.12, 12/12, 12-12, 12.12.2026
  const m = query.match(/(?:^|[^\d])(\d{1,2})[./-](\d{1,2})(?:[./-](\d{4}))?(?!\d)/);
  if (m) {
    const today = vnDate(now);
    const dd = +m[1], mm = +m[2];
    if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12) {
      let year = m[3] ? +m[3] : +today.slice(0, 4);
      const mk = (y: number) => `${y}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
      if (!m[3] && mk(year) < today) year += 1; // ngày đã qua trong năm nay thì hiểu là năm sau
      const d = mk(year);
      if (vnDate(vnMidnight(d)) === d) {
        const from = vnMidnight(d);
        const rest = fold(query.replace(m[0], " ").replace(/\bngày\b/gi, " "));
        return { from, to: from + DAY_MS, label: dmy(d), rest };
      }
    }
  }
  let q = fold(query);
  const take = (re: RegExp) => {
    if (!re.test(q)) return false;
    q = q.replace(re, " ").replace(/\s+/g, " ").trim();
    return true;
  };
  if (take(/\b(toi nay|dem nay|tonight)\b/)) return { ...windowOf("tonight", now), rest: q };
  if (take(/\b(hom nay|today)\b/)) return { ...windowOf("today", now), rest: q };
  if (take(/\b(ngay mai|toi mai|mai|tomorrow)\b/)) return { ...windowOf("tomorrow", now), rest: q };
  if (take(/\b(cuoi tuan|this weekend|weekend)\b/)) return { ...windowOf("weekend", now), rest: q };
  for (const [re, wd] of [...WEEKDAY_WORDS, ...WEEKDAY_EN]) {
    if (take(re)) {
      const today = vnDate(now);
      const delta = (wd - vnWeekday(now) + 7) % 7; // hôm nay đúng thứ đó thì lấy hôm nay
      const d = addDays(today, delta);
      const from = vnMidnight(d);
      return { from, to: from + DAY_MS, label: wdLong(wd) + " " + dmy(d), rest: q };
    }
  }
  // "may" trùng chữ "mây" khi bỏ dấu nên không nhận tháng 5 bằng tiếng Anh
  const en = MONTHS_EN.findIndex((m) => m !== "may" && new RegExp("\\b" + m + "\\b").test(q));
  if (en >= 0) q = q.replace(new RegExp("\\b" + MONTHS_EN[en] + "\\b"), "thang " + (en + 1));
  const mo = q.match(/\bthang (\d{1,2})\b/);
  if (mo && +mo[1] >= 1 && +mo[1] <= 12) {
    const today = vnDate(now);
    let y = +today.slice(0, 4);
    const mm = String(+mo[1]).padStart(2, "0");
    if (`${y}-${mm}-31` < today) y += 1;
    const from = vnMidnight(`${y}-${mm}-01`);
    const next = +mo[1] === 12 ? `${y + 1}-01-01` : `${y}-${String(+mo[1] + 1).padStart(2, "0")}-01`;
    q = q.replace(mo[0], " ").replace(/\s+/g, " ").trim();
    return { from, to: vnMidnight(next), label: tr("Tháng " + +mo[1] + "." + y, MONTHS_EN[+mo[1] - 1].replace(/^./, (c) => c.toUpperCase()) + " " + y), rest: q };
  }
  return null;
}

export interface SearchPlace { id: string; name: string; hint: string; to?: string }
export interface SearchResult { date: DateQuery | null; items: AgendaItem[]; places: SearchPlace[]; empty: boolean }

function matches(hay: string, tokens: string[]) {
  return tokens.every((t) => hay.includes(t));
}

/**
 * @param agendaFor hàm dựng danh sách sự kiện trong một khoảng thời gian (trang truyền vào, dùng dữ liệu hiện có)
 * @param places danh sách địa điểm để tìm theo tên
 */
export function search(
  query: string,
  now: number,
  agendaFor: (from: number, to: number) => AgendaItem[],
  places: SearchPlace[],
  horizonDays = 90
): SearchResult {
  const raw = query.trim();
  if (raw.length < 2) return { date: null, items: [], places: [], empty: false };
  const date = parseDateQuery(raw, now);
  const tokens = (date ? date.rest : fold(raw)).split(" ").filter(Boolean);
  const t0 = vnMidnight(vnDate(now));
  const pool = date ? agendaFor(date.from, date.to) : agendaFor(t0, t0 + horizonDays * DAY_MS);
  // Không có ngày: lịch hằng tuần lặp lại nhiều lần, chỉ giữ lần gần nhất của mỗi band
  const seen = new Set<string>();
  const items = pool
    .filter((x) => matches(fold([x.title, x.label, x.venue, x.desc || ""].join(" ")), tokens))
    .sort((a, b) => a.start - b.start || a.title.localeCompare(b.title, "vi"))
    .filter((x) => {
      if (date || !x.weekly) return true;
      const k = x.label + "|" + x.title;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 20);
  const foundPlaces = tokens.length ? places.filter((p) => matches(fold(p.name + " " + p.hint), tokens)).slice(0, 8) : [];
  return { date, items, places: foundPlaces, empty: items.length === 0 && foundPlaces.length === 0 };
}
