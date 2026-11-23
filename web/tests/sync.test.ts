import test from "node:test";
import assert from "node:assert/strict";
import { cleanCloud, reconcile, toCloud } from "../src/utils/sync.ts";
import type { PlanItem } from "../src/utils/itinerary.ts";

const it = (title: string, start = 1000): PlanItem => ({ id: "x:show:" + start + ":" + title, kind: "show", title, label: "L", venue: "V", start, end: start + 10, allDay: false });
const L = (p: string[], i: PlanItem[] = []) => ({ programIds: p, items: i });
const R = (p: string[], i: PlanItem[] = []) => ({ programIds: p, items: i, updatedAt: 5 });

test("tài khoản chưa có gì: đưa lịch trình của máy lên; máy cũng trống thì không ghi", () => {
  assert.deepEqual(reconcile(L(["a"]), null, { linked: false, dirty: false }), { next: L(["a"]), push: true, changedLocal: false });
  assert.equal(reconcile(L([]), null, { linked: false, dirty: false }).push, false);
});

test("lần đầu nối máy với tài khoản: gộp cả hai, không mất mục nào", () => {
  const r = reconcile(L(["a"], [it("A")]), R(["b"], [it("B")]), { linked: false, dirty: false });
  assert.deepEqual(r.next.programIds.sort(), ["a", "b"]);
  assert.equal(r.next.items.length, 2);
  assert.equal(r.push, true);
  assert.equal(r.changedLocal, true);
});

test("đã nối, máy không có thay đổi: lấy theo tài khoản, mục xóa ở máy khác cũng mất ở đây", () => {
  const r = reconcile(L(["a", "b"], [it("A")]), R(["a"]), { linked: true, dirty: false });
  assert.deepEqual(r.next.programIds, ["a"]);
  assert.equal(r.next.items.length, 0);
  assert.equal(r.push, false);
  assert.equal(r.changedLocal, true);
});

test("đã nối, máy có thay đổi chưa gửi: gộp rồi gửi lên", () => {
  const r = reconcile(L(["a", "c"]), R(["a", "b"]), { linked: true, dirty: true });
  assert.deepEqual(r.next.programIds.sort(), ["a", "b", "c"]);
  assert.equal(r.push, true);
});

test("hai bên giống nhau: không ghi gì", () => {
  const r = reconcile(L(["a"], [it("A")]), R(["a"], [it("A")]), { linked: false, dirty: true });
  assert.equal(r.push, false);
  assert.equal(r.changedLocal, false);
});

test("dữ liệu từ tài khoản được kiểm tra lại; bản ghi lên không có trường trống", () => {
  const c = cleanCloud({ programIds: ["khai-mac", "../x", 3, "khai-mac"], items: [{ kind: "show", start: 1, end: 2, title: "<b>Tên</b>", label: "L", venue: "V", url: "javascript:x" }, { kind: "festival", start: 1, end: 2, title: "Giả" }, "rác"], updatedAt: 9 })!;
  assert.deepEqual(c.programIds, ["khai-mac"]);
  assert.equal(c.items.length, 1);
  assert.equal(c.items[0].url, undefined);
  assert.ok(!/[<>]/.test(c.items[0].title));
  assert.equal(cleanCloud(null), null);
  const up = toCloud({ programIds: ["a", "a"], items: [it("A"), { ...it("F"), programId: "khai-mac" }] }, 7);
  assert.deepEqual(up.programIds, ["a"]);
  assert.equal(up.items.length, 1);
  assert.ok(Object.values(up.items[0]).every((v) => v !== undefined));
  assert.equal(up.updatedAt, 7);
});
