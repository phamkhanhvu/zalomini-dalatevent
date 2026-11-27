/**
 * Thống kê ẩn danh của DalatEvent: chỉ đếm số lần (mở trang, bấm chỉ đường, lấy ưu đãi...) theo ngày và nền tảng.
 * Không cookie, không mã định danh người dùng hay thiết bị, không gửi vị trí. Ghi vào Realtime Database
 * (stats/<ngày>/<web|ios|android>/<sự kiện>/<mục>), gộp nhiều lượt trong một lần gửi để đỡ tốn.
 */
import { FB_CONFIG } from "./firebase-config";
import { IS_ANDROID, IS_IOS } from "../utils/device";

const DB = FB_CONFIG.databaseURL;
const PLATFORM = IS_IOS ? "ios" : IS_ANDROID ? "android" : "web";
const pending = new Map<string, number>();
let timer = 0;

const vnDay = () => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
/** Khóa hợp lệ của Realtime Database: bỏ ký tự cấm, cắt ngắn */
const clean = (s: string) => s.replace(/[.#$[\]/]/g, "-").replace(/\s+/g, "_").slice(0, 80) || "all";
const off = () => typeof location !== "undefined" && /^(localhost|127\.)/.test(location.hostname) && !location.port.startsWith("4173");

/** Đếm một lần sự kiện `ev` (chữ thường, gạch dưới), có thể kèm mục cụ thể như mã địa điểm */
export function track(ev: string, item = "all"): void {
  if (!/^[a-z_]{1,24}$/.test(ev) || off()) return;
  const key = ev + "/" + clean(item);
  pending.set(key, (pending.get(key) || 0) + 1);
  if (!timer) timer = window.setTimeout(flush, 8000);
}

export function flush(): void {
  if (timer) {
    window.clearTimeout(timer);
    timer = 0;
  }
  if (!pending.size || !DB) return;
  const body: Record<string, { ".sv": { increment: number } }> = {};
  pending.forEach((n, k) => (body[k] = { ".sv": { increment: Math.min(n, 50) } }));
  pending.clear();
  fetch(`${DB}/stats/${vnDay()}/${PLATFORM}.json`, { method: "PATCH", body: JSON.stringify(body), keepalive: true }).catch(() => undefined);
}

/** Gọi một lần khi mở app/trang: đếm thiết bị hoạt động trong ngày (chỉ đánh dấu trên máy, không gửi mã máy) */
export function startStats(): void {
  if (typeof window === "undefined") return;
  const today = vnDay();
  try {
    if (!localStorage.getItem("de-stat-first")) {
      localStorage.setItem("de-stat-first", today);
      track("new_users");
    }
    if (localStorage.getItem("de-stat-day") !== today) {
      localStorage.setItem("de-stat-day", today);
      track("users");
    }
  } catch (e) {
    /* không có bộ nhớ: bỏ qua phần đếm người */
  }
  track("opens");
  document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flush());
  window.addEventListener("pagehide", flush);
}

/** Đọc thống kê cho trang quản trị (cần mã đăng nhập của quản trị viên) */
export async function readStats(token: string, from: string, to: string): Promise<Record<string, Record<string, Record<string, Record<string, number>>>>> {
  const q = `orderBy=${encodeURIComponent('"$key"')}&startAt=${encodeURIComponent('"' + from + '"')}&endAt=${encodeURIComponent('"' + to + '"')}&auth=${encodeURIComponent(token)}`;
  const res = await fetch(`${DB}/stats.json?${q}`);
  if (!res.ok) throw new Error("HTTP " + res.status);
  return (await res.json()) || {};
}
