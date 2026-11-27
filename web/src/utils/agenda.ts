/**
 * "Đà Lạt có gì?" — gom sự kiện và show diễn thành một danh sách rồi lọc theo ngày.
 * Mọi phép tính ngày giờ đều theo giờ Việt Nam (UTC+7, không đổi giờ mùa), không phụ thuộc múi giờ của máy.
 * File này không dùng gì của trình duyệt để chạy được trong kiểm thử tự động.
 */
import { loc, tr } from "../i18n.ts";

export const VN_OFFSET_MS = 7 * 3600000;
export const DAY_MS = 86400000;
/** Sự kiện cả ngày kéo dài hơn ngần này ngày được xếp vào nhóm "dài ngày" */
export const LONG_RUNNING_DAYS = 14;
/** "Tối nay" tính từ 17:00 */
export const EVENING_HOUR = 17;

export type Preset = "today" | "tonight" | "tomorrow" | "weekend" | "upcoming" | "date";
/** festival: chương trình thuộc một chuỗi lễ hội; event: sự kiện khác; show: đêm diễn của điểm diễn */
export type Kind = "festival" | "event" | "show";
/** "Sắp diễn ra" nhìn trước ngần này ngày */
export const UPCOMING_DAYS = 30;

export interface AgendaItem {
  key: string;
  kind: Kind;
  title: string;
  /** Nhãn loại, ví dụ "Lễ hội" hoặc tên điểm diễn */
  label: string;
  venue: string;
  /** Thời điểm bắt đầu và kết thúc, tính bằng mili giây */
  start: number;
  end: number;
  allDay: boolean;
  /** Chỉ biết giờ bắt đầu; giờ kết thúc là ước lượng */
  endEstimated?: boolean;
  status: "published" | "postponed";
  tentative?: boolean;
  /** Link trang gốc (show diễn) */
  url?: string;
  /** Mã chương trình festival, để mở bảng chi tiết */
  programId?: string;
  sourceUrl?: string;
  verifiedAt?: string;
  /** Mô tả ngắn (sự kiện khác) */
  desc?: string;
  /** Dòng sinh ra từ lịch hằng tuần */
  weekly?: boolean;
}

/* ---------- Dữ liệu đầu vào (cùng dạng với data/events.json và data/shows.json) ---------- */
export interface InSession { start_at: string; end_at: string; all_day: boolean; end_estimated?: boolean }
export interface InHappening { title: string; desc: string; when: string; start_date: string; end_date: string; venue?: string; /** Lặp hằng tuần vào các thứ này (0 = Chủ nhật) */ days?: number[]; /** Giờ bắt đầu mỗi buổi, "19:30" */ time?: string }
export interface InEvent { series?: string; description?: string; id: string; title: string; category: string; venue_name: string; status: string; tentative: boolean; sessions: InSession[]; source_url: string | null; verified_at: string | null }
export interface InShow { date?: string; time: string; title: string; url: string; place?: string; price?: string; weekday?: number; note?: string }
export interface InStage { id: string; name: string; kind: "dated" | "weekly"; source_url: string; verified_at: string; items: InShow[] }

/* ---------- Ngày giờ Việt Nam ---------- */
/** "2026-11-23" của một thời điểm, theo giờ Việt Nam */
export function vnDate(ms: number): string {
  return new Date(ms + VN_OFFSET_MS).toISOString().slice(0, 10);
}
/** 00:00 giờ Việt Nam của ngày "2026-11-23", tính bằng mili giây */
export function vnMidnight(date: string): number {
  return Date.parse(date + "T00:00:00+07:00");
}
/** Thứ trong tuần theo giờ Việt Nam: 0 = Chủ nhật … 6 = Thứ Bảy */
export function vnWeekday(ms: number): number {
  return new Date(ms + VN_OFFSET_MS).getUTCDay();
}
export function addDays(date: string, n: number): string {
  return vnDate(vnMidnight(date) + n * DAY_MS + DAY_MS / 2);
}

export interface Window { from: number; to: number; label: string }

/** Khoảng thời gian [from, to) ứng với từng lựa chọn */
export function windowOf(preset: Preset, now: number, pickedDate?: string): Window {
  const today = vnDate(now);
  const t0 = vnMidnight(today);
  if (preset === "today") return { from: t0, to: t0 + DAY_MS, label: tr("Hôm nay", "Today") };
  if (preset === "tonight") return { from: t0 + EVENING_HOUR * 3600000, to: t0 + DAY_MS, label: tr("Tối nay", "Tonight") };
  if (preset === "tomorrow") return { from: t0 + DAY_MS, to: t0 + 2 * DAY_MS, label: tr("Ngày mai", "Tomorrow") };
  if (preset === "upcoming") return { from: t0 + DAY_MS, to: t0 + (UPCOMING_DAYS + 1) * DAY_MS, label: tr("Sắp diễn ra", "Coming up") };
  if (preset === "weekend") {
    const wd = vnWeekday(now);
    // Thứ Bảy và Chủ nhật của tuần này; nếu hôm nay là Chủ nhật thì chỉ còn hôm nay
    const sat = wd === 0 ? t0 - DAY_MS : t0 + (6 - wd) * DAY_MS;
    return { from: Math.max(sat, t0), to: sat + 2 * DAY_MS, label: tr("Cuối tuần", "This weekend") };
  }
  const d = pickedDate && /^\d{4}-\d{2}-\d{2}$/.test(pickedDate) ? pickedDate : today;
  const m = vnMidnight(d);
  return { from: m, to: m + DAY_MS, label: d.slice(8, 10) + "." + d.slice(5, 7) + "." + d.slice(0, 4) };
}

/* ---------- Dựng danh sách ---------- */
const CAT_LABEL: Record<string, [string, string]> = {
  "le-hoi": ["Lễ hội", "Festival"],
  "am-nhac": ["Âm nhạc", "Music"],
  "trien-lam": ["Triển lãm", "Exhibition"],
  "khong-gian-hoa": ["Không gian hoa", "Flower space"],
  "hoi-thao-the-thao": ["Hội thảo và thể thao", "Talks & sports"],
  "the-thao": ["Thể thao", "Sports"],
  workshop: ["Workshop", "Workshop"],
  khac: ["Sự kiện", "Event"],
};
const catLabel = (c: string) => {
  const l = CAT_LABEL[c] || CAT_LABEL.khac;
  return tr(l[0], l[1]);
};
/** Show chỉ công bố giờ bắt đầu: coi như kéo dài 2 tiếng khi cần so khoảng thời gian */
const SHOW_LENGTH_MS = 2 * 3600000;

function parseTimeRange(time: string): [number, number] {
  const m = time.match(/^(\d{2}):(\d{2})(?: – (\d{2}):(\d{2}))?$/);
  if (!m) return [0, DAY_MS];
  const s = (+m[1] * 60 + +m[2]) * 60000;
  const e = m[3] ? (+m[3] * 60 + +m[4]) * 60000 : s + SHOW_LENGTH_MS;
  return [s, e];
}

/**
 * Gom sự kiện đã công bố (và đã hoãn) cùng các đêm show rơi vào khoảng [from, to).
 * Lịch hằng tuần chỉ được suy ra tới mốc `weeklyUntil` (lịch band đổi theo tuần, không nên đoán xa).
 */
export function buildAgenda(events: InEvent[], stages: InStage[], from: number, to: number, weeklyUntil = Infinity, happening: InHappening[] = []): AgendaItem[] {
  const out: AgendaItem[] = [];
  happening.forEach((h, i) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(h.start_date || "") || !/^\d{4}-\d{2}-\d{2}$/.test(h.end_date || "")) return;
    const start = vnMidnight(h.start_date);
    const end = vnMidnight(h.end_date) + DAY_MS - 60000;
    if (!(start < to && end >= from)) return;
    const days = Array.isArray(h.days) && h.days.length ? h.days : null;
    const hm = /^(\d{2}):(\d{2})$/.exec(h.time || "");
    if (days || hm) {
      // Sự kiện lặp (hằng đêm hoặc hằng tuần): mỗi buổi là một dòng riêng, chỉ trong khoảng đang xem
      const offset = hm ? (+hm[1] * 60 + +hm[2]) * 60000 : 0;
      for (let d = Math.max(start, vnMidnight(vnDate(from))); d <= end && d < to; d += DAY_MS) {
        const wd = new Date(d + VN_OFFSET_MS).getUTCDay();
        if (days && !days.includes(wd)) continue;
        const s = d + offset;
        const e = hm ? s + 3 * 3600000 : d + DAY_MS - 60000;
        if (!(s < to && e >= from)) continue;
        out.push({ key: "h:" + i + ":" + vnDate(d), kind: "event", title: loc(h, "title"), label: tr("Sự kiện", "Event"), venue: loc(h, "venue") || tr("Đà Lạt", "Da Lat"), start: s, end: e, allDay: !hm, status: "published", desc: loc(h, "desc"), weekly: true });
      }
      return;
    }
    out.push({ key: "h:" + i + ":" + h.start_date, kind: "event", title: loc(h, "title"), label: tr("Sự kiện", "Event"), venue: loc(h, "venue") || tr("Đà Lạt", "Da Lat"), start, end, allDay: true, status: "published", desc: loc(h, "desc") });
  });
  for (const e of events) {
    if (e.status !== "published" && e.status !== "postponed") continue; // nháp, chờ duyệt, đã hủy, đã xong: không hiện
    e.sessions.forEach((s, i) => {
      const start = Date.parse(s.start_at);
      const end = Date.parse(s.end_at);
      if (!(start < to && end >= from)) return;
      out.push({
        key: e.id + ":" + i,
        kind: e.series ? "festival" : "event",
        title: loc(e, "title"),
        desc: loc(e, "description") || undefined,
        label: catLabel(e.category),
        venue: loc(e, "venue_name"),
        start,
        end,
        allDay: s.all_day,
        endEstimated: s.end_estimated,
        status: e.status as "published" | "postponed",
        tentative: e.tentative,
        programId: e.id,
        sourceUrl: e.source_url || undefined,
        verifiedAt: e.verified_at || undefined,
      });
    });
  }
  for (const st of stages) {
    const push = (it: InShow, date: string, n: number, weekly = false) => {
      const [s, e] = parseTimeRange(it.time);
      const start = vnMidnight(date) + s;
      if (!(start < to && start >= from)) return; // show tính theo giờ bắt đầu
      out.push({
        key: st.id + ":" + date + ":" + n,
        kind: "show",
        title: loc(it, "title"),
        label: loc(st, "name"),
        venue: loc(it, "place") || loc(st, "name"),
        start,
        end: vnMidnight(date) + e,
        allDay: false,
        endEstimated: !/–/.test(it.time),
        status: "published",
        url: it.url,
        weekly: weekly || undefined,
        sourceUrl: st.source_url,
        verifiedAt: st.verified_at,
      });
    };
    if (st.kind === "dated") st.items.forEach((it, n) => it.date && push(it, it.date, n));
    else {
      // Lịch hằng tuần: sinh một dòng cho mỗi ngày trong khoảng (tối đa 14 ngày)
      for (let d = vnDate(from), k = 0; vnMidnight(d) < to && vnMidnight(d) < weeklyUntil && k < 14; d = addDays(d, 1), k++) {
        const wd = vnWeekday(vnMidnight(d));
        st.items.forEach((it, n) => it.weekday === wd && push(it, d, n, true));
      }
    }
  }
  return out;
}

export function isLongRunning(it: AgendaItem): boolean {
  return it.allDay && it.end - it.start > LONG_RUNNING_DAYS * DAY_MS;
}

export interface AgendaView { timed: AgendaItem[]; allDay: AgendaItem[]; longRunning: AgendaItem[] }

/** Chia nhóm và sắp thứ tự để hiển thị: có giờ (theo giờ), cả ngày, rồi các hoạt động dài ngày */
export function arrange(items: AgendaItem[], kind: Kind | "all" = "all"): AgendaView {
  const list = kind === "all" ? items : items.filter((x) => x.kind === kind);
  const byStart = (a: AgendaItem, b: AgendaItem) => a.start - b.start || a.title.localeCompare(b.title, "vi");
  return {
    timed: list.filter((x) => !x.allDay).sort(byStart),
    allDay: list.filter((x) => x.allDay && !isLongRunning(x)).sort(byStart),
    longRunning: list.filter(isLongRunning).sort(byStart),
  };
}

/** Giờ hiển thị "20:00" theo giờ Việt Nam */
export function vnTime(ms: number): string {
  return new Date(ms + VN_OFFSET_MS).toISOString().slice(11, 16);
}
/** "12.12" theo giờ Việt Nam */
export function vnDayMonth(ms: number): string {
  const d = vnDate(ms);
  return d.slice(8, 10) + "." + d.slice(5, 7);
}

/** "Sắp diễn ra": chỉ những gì bắt đầu trong khoảng, bỏ lịch hằng tuần, xếp theo ngày, lấy tối đa `limit` */
export function upcomingOnly(items: AgendaItem[], from: number, limit = 12): AgendaItem[] {
  return items
    .filter((x) => x.start >= from && !x.weekly)
    .sort((a, b) => a.start - b.start || a.title.localeCompare(b.title, "vi"))
    .slice(0, limit);
}
