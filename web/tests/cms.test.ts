import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
// @ts-ignore — tệp .mjs dùng chung với tác vụ trên GitHub
import { applyCms, vnIso } from "../../scripts/cms-apply.mjs";

const load = (f: string) => JSON.parse(fs.readFileSync(new URL("../../data/" + f, import.meta.url), "utf8"));
const current = () => ({ events: load("events.json"), shows: load("shows.json"), happening: load("happening.json") });
const NOW = Date.parse("2026-11-24T09:15:00+07:00");
// Mặc định: lưu lúc 09:00 ngày 24.11, sau mọi mốc cập nhật đang có trong repo
const SAVED = Date.parse("2026-11-24T09:00:00+07:00");
const send = (o: unknown, savedAt = SAVED, byName = "Vũ") => ({ json: JSON.stringify(o), savedAt, byName });
const item = { title: "Hội chợ thử", start_date: "2026-12-01", end_date: "2026-12-03", venue: "Quảng trường Lâm Viên", when: "01 — 03.12.2026", desc: "Mô tả.", manual: true };

test("giờ Việt Nam đúng dạng dữ liệu yêu cầu", () => {
  assert.equal(vnIso(NOW), "2026-11-24T09:15:00+07:00");
});

test("sự kiện khác: nhận danh sách mới, tự ghi ngày cập nhật", () => {
  const cur = current();
  const r = applyCms(cur, { happening: send({ items: [...cur.happening.items, item] }) }, null, NOW);
  assert.deepEqual(r.changed, ["happening"]);
  assert.equal(r.next.happening.items.at(-1).title, "Hội chợ thử");
  assert.equal(r.next.happening.updated_label, "24.11.2026");
  assert.equal(r.status.files.happening.status, "applied");
  assert.equal(r.status.files.happening.by, "Vũ");
});

test("nội dung có lỗi bị từ chối, dữ liệu cũ giữ nguyên, lý do được ghi lại", () => {
  const cur = current();
  const r = applyCms(cur, { happening: send({ items: [{ ...item, title: "<script>x</script>", end_date: "2026-11-01" }] }) }, null, NOW);
  assert.deepEqual(r.changed, []);
  assert.deepEqual(r.next.happening, cur.happening);
  assert.equal(r.status.files.happening.status, "rejected");
  assert.ok(r.status.files.happening.errors.length >= 2);
});

test("lần gửi đã xử lý không bị áp lại (tác vụ mỗi sáng sửa sau đó không bị ghi đè)", () => {
  const cur = current();
  const first = applyCms(cur, { happening: send({ items: [item] }) }, null, NOW);
  const morning = { ...first.next, happening: { ...first.next.happening, items: [] } };
  const again = applyCms(morning, { happening: send({ items: [item] }) }, first.status, NOW + 600000);
  assert.deepEqual(again.changed, []);
  assert.equal(again.statusChanged, false);
  const newer = applyCms(morning, { happening: send({ items: [item] }, SAVED + 5000) }, first.status, NOW + 600000);
  assert.deepEqual(newer.changed, ["happening"]);
});

test("lịch show: chỉ nhận lịch Sense Acoustic, các sân khấu khác không đổi dù nội dung gửi lên có sửa", () => {
  const cur = current();
  const sent = JSON.parse(JSON.stringify(cur.shows));
  sent.stages.find((s: { id: string }) => s.id === "sense-acoustic").items[0].title = "Band Mới";
  sent.stages.find((s: { id: string }) => s.id === "lululola").items = [];
  sent.stages.find((s: { id: string }) => s.id === "lululola").name = "Sửa bậy";
  const r = applyCms(cur, { shows: send(sent) }, null, NOW);
  assert.deepEqual(r.changed, ["shows"]);
  const st = (id: string) => r.next.shows.stages.find((s: { id: string }) => s.id === id);
  assert.equal(st("sense-acoustic").items[0].title, "Band Mới");
  assert.equal(st("sense-acoustic").verified_at, "2026-11-24");
  assert.deepEqual(st("lululola"), cur.shows.stages.find((s: { id: string }) => s.id === "lululola"));
});

test("chương trình Festival: nhận thay đổi hợp lệ; hoãn mà thiếu ghi chú thì từ chối; không sửa được địa điểm", () => {
  const cur = current();
  const ok = JSON.parse(JSON.stringify(cur.events));
  ok.events.find((e: { id: string }) => e.id === "khai-mac").sessions[0].start_at = "2026-12-12T19:30:00+07:00";
  ok.venues = [];
  const r = applyCms(cur, { events: send(ok) }, null, NOW);
  assert.deepEqual(r.changed, ["events"]);
  assert.equal(r.next.events.venues.length, cur.events.venues.length);
  assert.equal(r.next.events.events.find((e: { id: string }) => e.id === "khai-mac").sessions[0].start_at, "2026-12-12T19:30:00+07:00");
  const bad = JSON.parse(JSON.stringify(cur.events));
  bad.events.find((e: { id: string }) => e.id === "khai-mac").status = "postponed";
  const r2 = applyCms(cur, { events: send(bad) }, null, NOW);
  assert.equal(r2.status.files.events.status, "rejected");
  assert.deepEqual(r2.changed, []);
});

test("chuỗi không phải JSON hoặc quá lớn bị từ chối an toàn", () => {
  const cur = current();
  const r = applyCms(cur, { happening: { json: "{hỏng", savedAt: SAVED, byName: "<b>x</b>" } }, null, NOW);
  assert.equal(r.status.files.happening.status, "rejected");
  assert.ok(!/[<>]/.test(r.status.files.happening.by));
});

test("ngày cập nhật hiển thị là ngày quản trị viên lưu, không phải lúc nội dung được áp", () => {
  const cur = current();
  const r = applyCms(cur, { happening: send({ items: [item] }) }, null, NOW + 3 * 86400000);
  assert.equal(r.next.happening.updated_label, "24.11.2026");
  assert.equal(r.next.happening.updated_at, "2026-11-24T09:00:00+07:00");
});

test("repo được tác vụ mỗi sáng cập nhật SAU lần lưu chưa kịp nhận: giữ mục tự động mới, vẫn lấy mục nhập tay của quản trị viên", () => {
  const cur = current();
  const auto = { title: "Sự kiện tự động mới", start_date: "2026-11-27", end_date: "2026-11-28", venue: "V", when: "27 — 28.11.2026", desc: "d" };
  const morning = { ...cur, happening: { ...cur.happening, updated_at: "2026-11-25T05:50:00+07:00", updated_label: "25.11.2026", items: [auto] } };
  const r = applyCms(morning, { happening: send({ items: [{ ...cur.happening.items[0] }, item] }) }, null, NOW + 86400000);
  const titles = r.next.happening.items.map((x: { title: string }) => x.title);
  assert.deepEqual(titles, ["Sự kiện tự động mới", "Hội chợ thử"]);
  assert.equal(r.next.happening.updated_label, "25.11.2026");
});
