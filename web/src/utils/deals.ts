/**
 * Dalat Deals: kiểu dữ liệu ưu đãi, đọc bản ghi Firestore (REST) thành ưu đãi đã kiểm tra, và tính trạng thái.
 * Không dùng gì của trình duyệt hay Firebase để chạy được trong kiểm thử tự động.
 */
export type DealStatus = "draft" | "published" | "paused" | "ended";
export interface Deal {
  id: string;
  title: string;
  partner: string;
  /** Mô tả ngắn ưu đãi là gì */
  summary: string;
  /** Điều kiện sử dụng */
  terms: string;
  /** Địa chỉ hoặc tên nơi dùng ưu đãi */
  place: string;
  startAt: number;
  endAt: number;
  /** Tổng số lượt được dùng và số lượt đã dùng */
  limit: number;
  count: number;
  status: DealStatus;
  /** Đối tác đã xác nhận ưu đãi này; ghi chú xác nhận với ai, khi nào */
  confirmed: boolean;
  confirmedNote: string;
  /** Mã do đối tác cấp (dùng chung, ví dụ nhập khi đặt vé online). Trống thì app tự tạo mã riêng cho từng khách. */
  code: string;
  /** Trang dùng mã (ví dụ trang đặt vé của đối tác) */
  url: string;
}
export const DEAL_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const txt = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b-\u001f<>]/g, " ").trim().slice(0, max) : "");
const int = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : NaN);

/** Kiểm tra lại một ưu đãi đọc từ máy chủ. Sai dạng thì trả về null (bỏ qua, không hiển thị). */
export function cleanDeal(id: string, o: Record<string, unknown> | null | undefined): Deal | null {
  if (!o || !DEAL_ID.test(id)) return null;
  const d: Deal = {
    id,
    title: txt(o.title, 120),
    partner: txt(o.partner, 80),
    summary: txt(o.summary, 300),
    terms: txt(o.terms, 800),
    place: txt(o.place, 160),
    startAt: int(o.startAt),
    endAt: int(o.endAt),
    limit: int(o.limit),
    count: int(o.count),
    status: (["draft", "published", "paused", "ended"] as const).find((s) => s === o.status) || "draft",
    confirmed: o.confirmed === true,
    confirmedNote: txt(o.confirmedNote, 200),
    code: txt(o.code, 40).replace(/\s+/g, ""),
    url: typeof o.url === "string" && /^https:\/\/[^\s<>"']+$/.test(o.url) ? o.url.slice(0, 300) : "",
  };
  if (!d.title || !d.partner || !(d.endAt > d.startAt) || !(d.limit >= 1) || !(d.count >= 0)) return null;
  return d;
}

/** Đổi một tài liệu trả về từ Firestore REST ({ name, fields: { x: { stringValue } } }) thành đối tượng thường */
export function fromRest(doc: { name?: string; fields?: Record<string, Record<string, unknown>> }): { id: string; data: Record<string, unknown> } | null {
  if (!doc || !doc.name || !doc.fields) return null;
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(doc.fields)) {
    if ("stringValue" in v) data[k] = v.stringValue;
    else if ("integerValue" in v) data[k] = Number(v.integerValue);
    else if ("doubleValue" in v) data[k] = Number(v.doubleValue);
    else if ("booleanValue" in v) data[k] = v.booleanValue;
  }
  return { id: doc.name.split("/").pop() || "", data };
}

export type DealState = "upcoming" | "active" | "soldout" | "ended" | "paused" | "hidden";
/** Trạng thái hiển thị với khách. hidden = không được hiện (nháp, hoặc đã công bố mà đối tác chưa xác nhận). */
export function dealState(d: Deal, now: number): DealState {
  if (d.status === "draft" || !d.confirmed) return "hidden";
  if (d.status === "paused") return "paused";
  if (d.status === "ended" || now > d.endAt) return "ended";
  if (d.count >= d.limit) return "soldout";
  return now < d.startAt ? "upcoming" : "active";
}
export const remaining = (d: Deal) => Math.max(0, d.limit - d.count);

/** Ưu đãi hiện cho khách: đang chạy trước, rồi sắp mở, rồi hết lượt; bỏ nháp, tạm dừng và đã kết thúc */
export function visibleDeals(list: Deal[], now: number): Deal[] {
  const rank: Record<string, number> = { active: 0, upcoming: 1, soldout: 2 };
  return list
    .filter((d) => dealState(d, now) in rank)
    .sort((a, b) => rank[dealState(a, now)] - rank[dealState(b, now)] || a.endAt - b.endAt || a.id.localeCompare(b.id));
}

/** Những lỗi quản trị viên cần sửa trước khi lưu một ưu đãi */
export function dealErrors(d: Deal): string[] {
  const e: string[] = [];
  if (!DEAL_ID.test(d.id)) e.push("Mã ưu đãi chỉ gồm chữ thường không dấu, số và gạch ngang (ví dụ sense-mua-1-tang-1).");
  if (!d.title) e.push("Thiếu tên ưu đãi.");
  if (!d.partner) e.push("Thiếu tên đối tác.");
  if (!d.terms) e.push("Thiếu điều kiện sử dụng.");
  if (!(d.endAt > d.startAt)) e.push("Thời điểm kết thúc phải sau thời điểm bắt đầu.");
  if (!(d.limit >= 1 && d.limit <= 100000)) e.push("Số lượt phải từ 1 đến 100.000.");
  if (d.limit < d.count) e.push("Số lượt không được nhỏ hơn số đã dùng (" + d.count + ").");
  if (d.status === "published" && !(d.confirmed && d.confirmedNote)) e.push("Muốn công bố phải đánh dấu đối tác đã xác nhận và ghi rõ xác nhận với ai, ngày nào.");
  return e;
}

/** Mã đổi 6 ký tự, bỏ các chữ dễ nhầm (0/O, 1/I) */
export function makeCode(rand: () => number = Math.random): string {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += A[Math.floor(rand() * A.length)];
  return s;
}
