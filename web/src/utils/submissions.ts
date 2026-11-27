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
  by: string;
  status: "new" | "approved" | "rejected";
  createdAt: number;
}
export type SubmissionInput = Pick<Submission, "title" | "start_date" | "end_date" | "venue" | "desc" | "link" | "contact">;

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
  };
}
