/**
 * Áp nội dung gửi từ trang quản trị vào dữ liệu của repo. Không đọc tệp, không gọi mạng (để kiểm thử được).
 *
 * Phạm vi được phép sửa, ngoài phạm vi này nội dung gửi lên bị bỏ qua:
 * - happening: danh sách "items" (sự kiện khác).
 * - shows: chỉ "items" của sân khấu sense-acoustic (lịch band hằng tuần). Mây Lang Thang và Lululola do tác vụ mỗi sáng cập nhật.
 * - events: danh sách "events" (chương trình Festival). Không sửa series và venues.
 * Mỗi tệp được kiểm tra bằng validate-core trước khi nhận; có lỗi thì giữ nguyên bản cũ và ghi lại lý do.
 */
import { validate } from "./validate-core.mjs";

export const FILES = ["happening", "shows", "events"];
const pad = (n) => String(n).padStart(2, "0");
/** Thời điểm theo giờ Việt Nam, dạng 2026-11-23T06:30:00+07:00 */
export function vnIso(ms) {
  const d = new Date(ms + 7 * 3600000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}+07:00`;
}
const clone = (x) => JSON.parse(JSON.stringify(x));
/** Tên người sửa đi vào thông điệp commit: chỉ giữ chữ, số, dấu cách và vài dấu thông dụng */
const cleanName = (s) => (typeof s === "string" ? s.replace(/[^\p{L}\p{N} ._-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 40) : "") || "quản trị viên";

function merge(file, current, incoming, now) {
  const next = clone(current);
  const stamp = vnIso(now);
  if (file === "happening") {
    if (!Array.isArray(incoming.items)) throw new Error("thiếu items");
    next.items = incoming.items;
    next.updated_at = stamp;
    next.updated_label = `${stamp.slice(8, 10)}.${stamp.slice(5, 7)}.${stamp.slice(0, 4)}`;
  } else if (file === "shows") {
    const from = (incoming.stages || []).find((s) => s.id === "sense-acoustic");
    const to = next.stages.find((s) => s.id === "sense-acoustic");
    if (!from || !to || !Array.isArray(from.items)) throw new Error("thiếu lịch sense-acoustic");
    to.items = from.items;
    to.verified_at = stamp.slice(0, 10);
    next.updated_at = stamp;
  } else {
    if (!Array.isArray(incoming.events)) throw new Error("thiếu events");
    next.events = incoming.events;
    next.updated_at = stamp;
  }
  return next;
}

/**
 * current: { events, shows, happening } đang có trong repo.
 * incoming: { [file]: { json: string, savedAt: number, byName?: string } } đọc từ Firestore.
 * status: nội dung data/cms-status.json hiện tại (lần gửi nào đã xử lý).
 * Trả về dữ liệu mới, danh sách tệp đã đổi và trạng thái mới.
 */
export function applyCms(current, incoming, status, now) {
  const next = { events: current.events, shows: current.shows, happening: current.happening };
  const files = { ...((status && status.files) || {}) };
  const changed = [];
  const notes = [];
  for (const file of FILES) {
    const inc = incoming[file];
    if (!inc || !Number.isFinite(inc.savedAt)) continue;
    if (files[file] && files[file].savedAt >= inc.savedAt) continue; // lần gửi này đã xử lý rồi
    const by = cleanName(inc.byName);
    const entry = { savedAt: inc.savedAt, at: vnIso(now), by };
    try {
      if (typeof inc.json !== "string" || inc.json.length > 400000) throw new Error("nội dung quá lớn hoặc sai dạng");
      const candidate = merge(file, next[file], JSON.parse(inc.json), now);
      const trial = { ...next, [file]: candidate };
      const { errors } = validate(trial.events, trial.shows, trial.happening);
      if (errors.length) {
        files[file] = { ...entry, status: "rejected", errors: errors.slice(0, 10) };
        notes.push(`${file}: từ chối (${errors.length} lỗi)`);
        continue;
      }
      const same = JSON.stringify({ ...candidate, updated_at: 0, updated_label: 0 }) === JSON.stringify({ ...next[file], updated_at: 0, updated_label: 0 });
      files[file] = { ...entry, status: "applied" };
      if (!same) {
        next[file] = candidate;
        changed.push(file);
        notes.push(`${file}: đã nhận (bởi ${by})`);
      }
    } catch (e) {
      files[file] = { ...entry, status: "rejected", errors: [String(e.message || e).slice(0, 200)] };
      notes.push(`${file}: từ chối (${e.message})`);
    }
  }
  return { next, changed, status: { schema: 1, files }, notes, statusChanged: JSON.stringify(files) !== JSON.stringify((status && status.files) || {}) };
}
