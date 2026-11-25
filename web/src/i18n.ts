/**
 * Song ngữ Việt / Anh, gọn nhẹ: không dùng bảng khóa, viết thẳng hai câu tại chỗ dùng: tr("Trang chủ", "Home").
 * Ngôn ngữ lưu trên máy; lần đầu theo ngôn ngữ của trình duyệt (tiếng Việt thì "vi", còn lại "en").
 * Đổi ngôn ngữ thì gốc ứng dụng vẽ lại toàn bộ (xem app.tsx), nên tr() là hàm thường, dùng được cả trong utils.
 * Trong kiểm thử tự động (không có window) luôn là tiếng Việt.
 */
export type Lang = "vi" | "en";
const KEY = "dlev.lang";

function initial(): Lang {
  if (typeof window === "undefined") return "vi";
  try {
    const q = new URLSearchParams(window.location.search || window.location.hash.split("?")[1] || "").get("lang");
    if (q === "en" || q === "vi") return q;
    // Khung nhúng trên web đối tác: mặc định tiếng Việt, muốn tiếng Anh thì thêm &lang=en
    if (/^#\/nhung(\?|$)/.test(window.location.hash)) return "vi";
    const s = window.localStorage.getItem(KEY);
    if (s === "en" || s === "vi") return s;
  } catch (e) {
    /* bỏ qua */
  }
  const nav = (typeof navigator !== "undefined" && (navigator.languages?.[0] || navigator.language)) || "vi";
  return /^vi\b/i.test(nav) ? "vi" : "en";
}

let current: Lang = initial();
const subs = new Set<() => void>();
if (typeof document !== "undefined") document.documentElement.lang = current;

export const lang = (): Lang => current;
export const isEn = (): boolean => current === "en";
export function setLang(l: Lang) {
  if (l === current) return;
  current = l;
  try {
    window.localStorage.setItem(KEY, l);
  } catch (e) {
    /* bỏ qua */
  }
  if (typeof document !== "undefined") document.documentElement.lang = l;
  subs.forEach((f) => f());
}
export function subscribeLang(f: () => void) {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
}

/** Câu theo ngôn ngữ hiện tại */
export const tr = (vi: string, en: string): string => (current === "en" ? en : vi);

/** Trường dữ liệu có bản tiếng Anh: đọc `${k}_en` khi đang ở tiếng Anh, thiếu thì dùng bản tiếng Việt */
export function loc<T extends object>(o: T | null | undefined, k: string): string {
  if (!o) return "";
  const r = o as Record<string, unknown>;
  if (current === "en" && typeof r[k + "_en"] === "string" && r[k + "_en"]) return r[k + "_en"] as string;
  return typeof r[k] === "string" ? (r[k] as string) : "";
}

const WD_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const WD_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WDL_VI = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"];
const WDL_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
/** Thứ viết tắt: T2 / Mon */
export const wdShort = (i: number) => (current === "en" ? WD_EN : WD_VI)[i];
/** Thứ đầy đủ: Thứ hai / Monday */
export const wdLong = (i: number) => (current === "en" ? WDL_EN : WDL_VI)[i];
