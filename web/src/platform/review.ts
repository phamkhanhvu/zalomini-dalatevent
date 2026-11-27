/**
 * Lời mời đánh giá app (khung chấm sao chuẩn của Apple/Google), chỉ trong app.
 * Mời sau khi khách đã có ít nhất 3 lần dùng thành công (lưu lịch trình, lấy mã ưu đãi, đóng dấu hộ chiếu)
 * và đã dùng app từ hôm trước trở đi; mỗi phiên bản mời tối đa một lần, cách nhau ít nhất 60 ngày.
 * Apple tự giới hạn thêm: mỗi người thấy tối đa 3 lần một năm.
 */
import { IS_NATIVE } from "../utils/device";

const KEY = "de-review";
const VERSION = (import.meta.env.VITE_APP_VERSION as string | undefined) || "";
interface State { first: number; count: number; askedVersion: string; askedAt: number }

function read(): State {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || "{}");
    return { first: +o.first || Date.now(), count: +o.count || 0, askedVersion: String(o.askedVersion || ""), askedAt: +o.askedAt || 0 };
  } catch (e) {
    return { first: Date.now(), count: 0, askedVersion: "", askedAt: 0 };
  }
}
function write(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch (e) {
    /* không có bộ nhớ thì thôi */
  }
}

/** Gọi sau mỗi lần khách dùng thành công một tính năng */
export function markGoodMoment(): void {
  if (!IS_NATIVE || !VERSION) return;
  const s = read();
  s.count += 1;
  const now = Date.now();
  const ready = s.count >= 3 && now - s.first > 20 * 3600000 && s.askedVersion !== VERSION && now - s.askedAt > 60 * 86400000;
  if (ready) {
    s.askedVersion = VERSION;
    s.askedAt = now;
    // Chờ một chút để khách thấy kết quả việc vừa làm trước khi hiện khung chấm sao
    window.setTimeout(() => {
      import("@capacitor-community/in-app-review").then((m) => m.InAppReview.requestReview()).catch(() => undefined);
    }, 1500);
  }
  write(s);
}
