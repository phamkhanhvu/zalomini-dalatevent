import test from "node:test";
import assert from "node:assert/strict";
import { acknowledge, detectChanges } from "../src/utils/changes.ts";

const pub = (start: number) => ({ start, status: "published" });

test("mục vừa lưu: ghi mốc, chưa báo gì", () => {
  const r = detectChanges(["a"], {}, { a: pub(100) });
  assert.deepEqual(r.changes, []);
  assert.deepEqual(r.next, { a: pub(100) });
});

test("đổi giờ: báo kèm giờ cũ và giữ mốc cũ cho tới khi người dùng xác nhận", () => {
  const r = detectChanges(["a"], { a: pub(100) }, { a: pub(200) });
  assert.deepEqual(r.changes, [{ id: "a", kind: "time", oldStart: 100 }]);
  assert.deepEqual(r.next.a, pub(100));
  const again = detectChanges(["a"], r.next, { a: pub(200) });
  assert.equal(again.changes.length, 1);
  const acked = acknowledge(r.next, { a: pub(200) }, ["a"]);
  assert.deepEqual(detectChanges(["a"], acked, { a: pub(200) }).changes, []);
});

test("hoãn, hủy và bị gỡ khỏi lịch đều được báo", () => {
  const snaps = { a: pub(1), b: pub(2), c: pub(3) };
  const r = detectChanges(["a", "b", "c"], snaps, { a: { start: 1, status: "postponed" }, b: { start: 2, status: "cancelled" } });
  assert.deepEqual(r.changes.map((x) => x.kind), ["postponed", "cancelled", "removed"]);
});

test("không đổi gì thì không báo; bỏ lưu thì bỏ mốc", () => {
  const r = detectChanges(["a"], { a: pub(1), b: pub(2) }, { a: pub(1), b: pub(9) });
  assert.deepEqual(r.changes, []);
  assert.deepEqual(Object.keys(r.next), ["a"]);
});

test("từ nháp sang công bố không phải là tin xấu: cập nhật mốc, không báo", () => {
  const r = detectChanges(["a"], { a: { start: 1, status: "draft" } }, { a: pub(1) });
  assert.deepEqual(r.changes, []);
  assert.equal(r.next.a.status, "published");
});
