/**
 * Đồng bộ lịch trình giữa các máy: quyết định giữ gì khi máy này và bản trên tài khoản khác nhau.
 * Không dùng gì của trình duyệt hay Firebase để chạy được trong kiểm thử tự động.
 */
import type { PlanItem } from "./itinerary.ts";
import { planId } from "./itinerary.ts";

export interface PlanState { programIds: string[]; items: PlanItem[] }
export interface CloudPlan extends PlanState { updatedAt: number }
const MAX = 100;
const DAY = 86400000;
const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001f<>]/g, " ").trim().slice(0, max) : "");

/** Dữ liệu đọc từ tài khoản về cũng được kiểm tra lại từng trường trước khi dùng */
export function cleanCloud(raw: unknown): CloudPlan | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const programIds = (Array.isArray(o.programIds) ? o.programIds : []).filter((s): s is string => typeof s === "string" && /^[a-z0-9-]{1,60}$/.test(s)).slice(0, MAX);
  const items: PlanItem[] = [];
  for (const r of (Array.isArray(o.items) ? o.items : []).slice(0, MAX)) {
    if (!r || typeof r !== "object") continue;
    const x = r as Record<string, unknown>;
    const start = x.start as number;
    const end = x.end as number;
    if ((x.kind !== "show" && x.kind !== "event") || !Number.isFinite(start) || !Number.isFinite(end) || end < start || end - start > 400 * DAY) continue;
    const title = text(x.title, 160);
    if (!title) continue;
    const url = text(x.url, 300);
    const it: PlanItem = { id: "", kind: x.kind, title, label: text(x.label, 60), venue: text(x.venue, 120), start, end, allDay: x.allDay === true };
    if (x.endEstimated === true) it.endEstimated = true;
    if (/^https:\/\/\S+$/.test(url)) it.url = url;
    it.id = planId(it);
    if (!items.some((y) => y.id === it.id)) items.push(it);
  }
  return { programIds: [...new Set(programIds)], items, updatedAt: Number.isFinite(o.updatedAt as number) ? (o.updatedAt as number) : 0 };
}

/** Bản gọn để ghi lên tài khoản (bỏ trường trống, bỏ chương trình Festival vì đã có trong programIds) */
export function toCloud(s: PlanState, now: number): CloudPlan {
  return {
    programIds: [...new Set(s.programIds)].slice(0, MAX),
    items: s.items.filter((x) => !x.programId).slice(0, MAX).map((x) => {
      const o: PlanItem = { id: x.id, kind: x.kind, title: x.title, label: x.label, venue: x.venue, start: x.start, end: x.end, allDay: x.allDay };
      if (x.endEstimated) o.endEstimated = true;
      if (x.url) o.url = x.url;
      return o;
    }),
    updatedAt: now,
  };
}

export function union(a: PlanState, b: PlanState): PlanState {
  const items = [...a.items];
  for (const it of b.items) if (!items.some((x) => x.id === it.id)) items.push(it);
  return { programIds: [...new Set([...a.programIds, ...b.programIds])], items };
}

export const same = (a: PlanState, b: PlanState) =>
  a.programIds.length === b.programIds.length && a.items.length === b.items.length && a.programIds.every((x) => b.programIds.includes(x)) && a.items.every((x) => b.items.some((y) => y.id === x.id));

export interface Reconciled { next: PlanState; push: boolean; changedLocal: boolean }

/**
 * - Tài khoản chưa có gì: đưa lịch trình của máy này lên.
 * - Lần đầu máy này nối với tài khoản (linked = false): gộp cả hai, không mất mục nào.
 * - Đã nối, máy này không có thay đổi chưa gửi (dirty = false): lấy theo tài khoản, để mục đã xóa ở máy khác cũng biến mất ở đây.
 * - Đã nối, máy này có thay đổi chưa gửi: gộp cả hai rồi gửi lên.
 */
export function reconcile(local: PlanState, remote: CloudPlan | null, meta: { linked: boolean; dirty: boolean }): Reconciled {
  if (!remote) return { next: local, push: local.programIds.length + local.items.length > 0, changedLocal: false };
  if (meta.linked && !meta.dirty) return { next: remote, push: false, changedLocal: !same(local, remote) };
  const next = union(local, remote);
  return { next, push: !same(next, remote), changedLocal: !same(next, local) };
}
