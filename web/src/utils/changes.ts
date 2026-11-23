/**
 * Phát hiện chương trình đã lưu bị đổi giờ, hoãn hoặc hủy so với lúc người dùng lưu.
 * Không dùng gì của trình duyệt để chạy được trong kiểm thử tự động.
 */
export interface Snap { start: number; status: string }
export type SnapMap = Record<string, Snap>;
export interface Change { id: string; kind: "time" | "postponed" | "cancelled" | "removed"; oldStart: number }

/**
 * current: trạng thái hiện tại theo dữ liệu (không có nghĩa là chương trình đã bị gỡ khỏi lịch).
 * Trả về: các thay đổi cần báo, và bản ghi mới (thêm mốc cho mục vừa lưu, bỏ mốc của mục không còn lưu).
 * Mốc của mục đã đổi được GIỮ NGUYÊN cho tới khi người dùng bấm "Đã biết" (xem acknowledge).
 */
export function detectChanges(savedIds: string[], snaps: SnapMap, current: Record<string, Snap | undefined>): { changes: Change[]; next: SnapMap } {
  const changes: Change[] = [];
  const next: SnapMap = {};
  for (const id of savedIds) {
    const was = snaps[id];
    const now = current[id];
    if (!was) {
      if (now) next[id] = { start: now.start, status: now.status };
      continue;
    }
    next[id] = was;
    if (!now) changes.push({ id, kind: "removed", oldStart: was.start });
    else if (now.status !== was.status && (now.status === "cancelled" || now.status === "postponed")) changes.push({ id, kind: now.status, oldStart: was.start });
    else if (now.start !== was.start) changes.push({ id, kind: "time", oldStart: was.start });
    else if (now.status !== was.status) next[id] = { start: now.start, status: now.status };
  }
  return { changes, next };
}

/** Người dùng đã xem thay đổi: lấy trạng thái hiện tại làm mốc mới */
export function acknowledge(snaps: SnapMap, current: Record<string, Snap | undefined>, ids: string[]): SnapMap {
  const next = { ...snaps };
  for (const id of ids) {
    const now = current[id];
    if (now) next[id] = { start: now.start, status: now.status };
    else delete next[id];
  }
  return next;
}
