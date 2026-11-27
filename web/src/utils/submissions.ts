/** Sự kiện do mọi người gửi lên để quản trị viên duyệt. Phần kiểm tra không dùng Firebase để chạy được trong kiểm thử. */
export interface Submission {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  venue: string;
  desc: string;
  /** Link Facebook, trang bán vé... (https) */
  link: string;
  /** Cách liên hệ người gửi (số điện thoại, Zalo, email) — chỉ quản trị viên thấy */
  contact: string;
  /** once: một lần hoặc nhiều ngày liền; daily: hằng đêm; weekly: hằng tuần vào các thứ trong weekdays */
  repeat: Repeat;
  /** 0 = Chủ nhật … 6 = Thứ bảy */
  weekdays: number[];
  /** Giờ bắt đầu "19:30" hoặc "" */
  time: string;
  by: string;
  status: "new" | "approved" | "rejected";
  createdAt: number;
}
export type Repeat = "once" | "daily" | "weekly";
export type SubmissionInput = Pick<Submission, "title" | "start_date" | "end_date" | "venue" | "desc" | "link" | "contact" | "repeat" | "weekdays" | "time">;
export const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const WD_LONG = ["Chủ nhật", "thứ 2", "thứ 3", "thứ 4", "thứ 5", "thứ 6", "thứ 7"];
const WD_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DATE = /^\d{4}-\d{2}-\d{2}$/;
export const cleanText = (s: string, max: number) => s.replace(/[\u0000-\u0008\u000b-\u001f<>]/g, " ").replace(/[ \t]+/g, " ").trim().slice(0, max);

/** Làm sạch rồi kiểm tra; trả về danh sách lỗi (rỗng là hợp lệ) */
export function submissionErrors(s: SubmissionInput, today: string): string[] {
  const e: string[] = [];
  if (!s.title) e.push("Chưa có tên sự kiện");
  if (!DATE.test(s.start_date) || !DATE.test(s.end_date)) e.push("Chưa chọn ngày");
  else {
    if (s.end_date < s.start_date) e.push("Ngày kết thúc phải sau ngày bắt đầu");
    if (s.end_date < today) e.push("Sự kiện đã kết thúc");
  }
  if (!s.venue) e.push("Chưa có địa điểm");
  if (s.desc.length < 20) e.push("Mô tả cần ít nhất 20 ký tự");
  if (s.link && !/^https:\/\/[^\s<>"']+$/.test(s.link)) e.push("Link phải bắt đầu bằng https://");
  if (!s.contact) e.push("Chưa có cách liên hệ");
  if (s.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(s.time)) e.push("Giờ bắt đầu chưa đúng");
  if (s.repeat !== "once") {
    if (s.start_date === s.end_date) e.push("Sự kiện lặp lại cần chọn ngày kết thúc (lặp đến ngày nào)");
    if (DATE.test(s.start_date) && DATE.test(s.end_date) && Date.parse(s.end_date) - Date.parse(s.start_date) > 184 * 86400000) e.push("Sự kiện lặp lại chỉ đăng tối đa 6 tháng mỗi lần");
    if (!s.time) e.push("Sự kiện lặp lại cần giờ bắt đầu");
  }
  if (s.repeat === "weekly" && !s.weekdays.length) e.push("Chọn ít nhất một thứ trong tuần");
  return e;
}

export function cleanInput(s: SubmissionInput): SubmissionInput {
  return {
    title: cleanText(s.title, 120),
    start_date: s.start_date,
    end_date: s.end_date,
    venue: cleanText(s.venue, 120),
    desc: cleanText(s.desc, 800),
    link: s.link.trim().slice(0, 300),
    contact: cleanText(s.contact, 120),
    repeat: s.repeat === "daily" || s.repeat === "weekly" ? s.repeat : "once",
    weekdays: s.repeat === "weekly" ? [...new Set(s.weekdays.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6))].sort() : [],
    time: /^\d{2}:\d{2}$/.test(s.time) ? s.time : "",
  };
}

/** Dòng mô tả lịch lặp, ví dụ "Tối thứ 6, thứ 7 hằng tuần · 19:30" */
export function repeatLabel(s: Pick<Submission, "repeat" | "weekdays" | "time">, en = false): string {
  const t = s.time ? " · " + s.time : "";
  if (s.repeat === "daily") return (en ? "Every day" : "Hằng ngày") + t;
  if (s.repeat === "weekly") return (en ? "Every " + s.weekdays.map((d) => WD_EN[d]).join(", ") : "Hằng tuần vào " + s.weekdays.map((d) => WD_LONG[d]).join(", ")) + t;
  return s.time ? (en ? "From " : "Từ ") + s.time : "";
}
