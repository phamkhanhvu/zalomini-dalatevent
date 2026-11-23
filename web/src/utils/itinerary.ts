/**
 * Lịch trình cá nhân: gom mục đã lưu theo ngày, phát hiện trùng giờ, xuất tệp lịch (.ics).
 * Không dùng gì của trình duyệt để chạy được trong kiểm thử tự động. Giờ tính theo Việt Nam.
 */
import type { AgendaItem } from "./agenda.ts";
import { DAY_MS, vnDate, vnMidnight } from "./agenda.ts";

/** Bản chụp một mục trong lịch trình, lưu trên máy người dùng */
export interface PlanItem {
  id: string;
  kind: AgendaItem["kind"];
  title: string;
  label: string;
  venue: string;
  start: number;
  end: number;
  allDay: boolean;
  endEstimated?: boolean;
  tentative?: boolean;
  url?: string;
  programId?: string;
}

/** Mã ổn định của một mục: chương trình festival theo mã và buổi; mục khác theo loại, giờ bắt đầu và tên */
export function planId(it: Pick<AgendaItem, "kind" | "programId" | "start" | "title">): string {
  return it.programId ? "p:" + it.programId + ":" + it.start : "x:" + it.kind + ":" + it.start + ":" + it.title;
}

export function toPlanItem(it: AgendaItem): PlanItem {
  return { id: planId(it), kind: it.kind, title: it.title, label: it.label, venue: it.venue, start: it.start, end: it.end, allDay: it.allDay, endEstimated: it.endEstimated, tentative: it.tentative, url: it.url, programId: it.programId };
}

const isLong = (it: PlanItem) => it.allDay && it.end - it.start > DAY_MS;

export interface PlanDay { date: string; items: PlanItem[] }
export interface PlanView { days: PlanDay[]; long: PlanItem[]; past: PlanItem[] }

/**
 * Chia lịch trình thành: các ngày (mục có giờ và mục cả ngày trong một ngày), mục kéo dài nhiều ngày, mục đã qua.
 * Trong một ngày: mục có giờ trước, theo giờ bắt đầu; mục cả ngày sau.
 */
export function arrangePlan(items: PlanItem[], now: number): PlanView {
  const past: PlanItem[] = [];
  const long: PlanItem[] = [];
  const map = new Map<string, PlanItem[]>();
  for (const it of items) {
    if (it.end < now) past.push(it);
    else if (isLong(it)) long.push(it);
    else {
      const d = vnDate(it.start);
      map.set(d, [...(map.get(d) || []), it]);
    }
  }
  const order = (a: PlanItem, b: PlanItem) => Number(a.allDay) - Number(b.allDay) || a.start - b.start || a.title.localeCompare(b.title, "vi");
  const days = [...map.keys()].sort().map((date) => ({ date, items: map.get(date)!.sort(order) }));
  long.sort((a, b) => a.start - b.start);
  past.sort((a, b) => b.end - a.end);
  return { days, long, past };
}

/**
 * Mã các mục có giờ bị chồng lên nhau. Mục cả ngày không tính là trùng (đến lúc nào cũng được).
 * Hai mục chỉ chạm nhau ở đúng một thời điểm (một mục kết thúc 20:00, mục kia bắt đầu 20:00) không tính là trùng.
 */
export function conflicts(items: PlanItem[]): Map<string, string[]> {
  const timed = items.filter((x) => !x.allDay).sort((a, b) => a.start - b.start);
  const out = new Map<string, string[]>();
  for (let i = 0; i < timed.length; i++) {
    for (let j = i + 1; j < timed.length && timed[j].start < timed[i].end; j++) {
      out.set(timed[i].id, [...(out.get(timed[i].id) || []), timed[j].title]);
      out.set(timed[j].id, [...(out.get(timed[j].id) || []), timed[i].title]);
    }
  }
  return out;
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/([,;])/g, "\\$1");
const utc = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const ymd = (date: string) => date.replace(/-/g, "");
function uid(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h.toString(36) + "-" + id.length + "@dalatevent.com";
}
/** Gập dòng dài theo chuẩn iCalendar (tối đa 75 byte mỗi dòng) */
function fold(line: string): string {
  const enc = new TextEncoder();
  let out = "";
  let cur = "";
  let size = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    if (size + n > (out ? 74 : 75)) {
      out += (out ? "\r\n " : "") + cur;
      cur = "";
      size = 0;
    }
    cur += ch;
    size += n;
  }
  return out + (out ? "\r\n " : "") + cur;
}

/** Tệp lịch (.ics) cho các mục còn sắp diễn ra; mở tệp là thêm được vào lịch điện thoại */
export function toIcs(items: PlanItem[], now: number, site = "https://dalatevent.com/"): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//DalatEvent//Lich trinh//VI", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:Lịch trình Đà Lạt"];
  for (const it of items) {
    if (it.end < now) continue;
    lines.push("BEGIN:VEVENT", "UID:" + uid(it.id), "DTSTAMP:" + utc(now));
    if (it.allDay) {
      // Ngày kết thúc trong iCalendar là ngày kế tiếp ngày cuối
      lines.push("DTSTART;VALUE=DATE:" + ymd(vnDate(it.start)), "DTEND;VALUE=DATE:" + ymd(vnDate(vnMidnight(vnDate(it.end)) + DAY_MS)));
    } else {
      lines.push("DTSTART:" + utc(it.start), "DTEND:" + utc(it.end));
    }
    const notes = [it.label, it.tentative ? "Lịch dự kiến, hãy kiểm tra lại trước khi đi." : "", it.endEstimated ? "Giờ kết thúc là ước lượng." : "", "Xem tại " + (it.url || site)].filter(Boolean).join("\n");
    lines.push("SUMMARY:" + esc(it.title), "LOCATION:" + esc(it.venue), "DESCRIPTION:" + esc(notes), "URL:" + (it.url || site), "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
