import { Program } from "../data/festival";

export type Status = "upcoming" | "live" | "ended";

export function statusOf(p: Pick<Program, "start" | "end">, now = Date.now()): Status {
  const s = new Date(p.start).getTime();
  const e = new Date(p.end).getTime();
  if (now < s) return "upcoming";
  if (now <= e) return "live";
  return "ended";
}

export function daysUntil(iso: string, now = Date.now()) {
  return Math.ceil((new Date(iso).getTime() - now) / 86400000);
}

export interface Countdown {
  big: string;
  small: string;
}

export function countdown(openIso: string, endIso: string, tentative: boolean, now = Date.now()): Countdown {
  const open = new Date(openIso).getTime();
  const end = new Date(endIso).getTime();
  if (now < open) {
    const d = Math.ceil((open - now) / 86400000);
    return {
      big: d <= 1 ? "Ngày mai" : `Còn ${d} ngày`,
      small: tentative ? "đến đêm khai mạc (dự kiến)" : "đến đêm khai mạc",
    };
  }
  if (now <= end) return { big: "Đang diễn ra", small: "mùa festival đã bắt đầu" };
  return { big: "Đã bế mạc", small: "hẹn gặp ở kỳ XII" };
}
