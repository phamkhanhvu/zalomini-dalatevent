import test from "node:test";
import assert from "node:assert/strict";
import { addDays, arrange, buildAgenda, upcomingOnly, vnDate, vnMidnight, vnWeekday, windowOf } from "../src/utils/agenda.ts";
import type { InEvent, InStage } from "../src/utils/agenda.ts";

const at = (iso: string) => Date.parse(iso);
const ev = (id: string, start: string, end: string, all_day: boolean, status = "published"): InEvent => ({
  id, title: id, category: "le-hoi", venue_name: "X", status, tentative: false,
  sessions: [{ start_at: start, end_at: end, all_day }], source_url: null, verified_at: null,
});
const EVENTS: InEvent[] = [
  ev("khai-mac", "2026-12-12T20:00:00+07:00", "2026-12-12T22:00:00+07:00", false),
  ev("trien-lam", "2026-12-01T00:00:00+07:00", "2026-12-25T23:59:00+07:00", true),
  ev("tho-cam", "2026-12-22T00:00:00+07:00", "2026-12-23T23:59:00+07:00", true),
  ev("da-huy", "2026-12-12T09:00:00+07:00", "2026-12-12T11:00:00+07:00", false, "cancelled"),
  ev("nhap", "2026-12-12T09:00:00+07:00", "2026-12-12T11:00:00+07:00", false, "draft"),
  ev("hoan", "2026-12-12T15:00:00+07:00", "2026-12-12T16:00:00+07:00", false, "postponed"),
  ev("qua-dem", "2026-12-12T23:00:00+07:00", "2026-12-13T01:00:00+07:00", false),
];
const STAGES: InStage[] = [
  { id: "mlt", name: "MLT", kind: "dated", source_url: "https://a", verified_at: "2026-11-23", items: [
    { date: "2026-12-12", time: "17:00", title: "Show chiều", url: "https://a/1" },
    { date: "2026-12-12", time: "19:00", title: "Show tối", url: "https://a/2" },
    { date: "2026-12-13", time: "17:00", title: "Show CN", url: "https://a/3" },
  ] },
  { id: "sense", name: "Sense", kind: "weekly", source_url: "https://b", verified_at: "2026-11-23", items: [
    { weekday: 6, time: "20:00 – 22:00", title: "Band thứ Bảy", url: "https://b" },
    { weekday: 0, time: "20:00 – 22:00", title: "Band Chủ nhật", url: "https://b" },
    { weekday: 1, time: "20:00 – 22:00", title: "Band thứ Hai", url: "https://b" },
  ] },
];
const titles = (preset: Parameters<typeof windowOf>[0], now: string, picked?: string) => {
  const w = windowOf(preset, at(now), picked);
  return buildAgenda(EVENTS, STAGES, w.from, w.to).map((x) => x.title).sort();
};

test("ngày Việt Nam không phụ thuộc múi giờ máy: 23:30 UTC ngày 11 là sáng ngày 12 ở Việt Nam", () => {
  assert.equal(vnDate(at("2026-12-11T23:30:00Z")), "2026-12-12");
  assert.equal(vnDate(at("2026-12-12T16:59:59Z")), "2026-12-12");
  assert.equal(vnDate(at("2026-12-12T17:00:00Z")), "2026-12-13");
  assert.equal(vnWeekday(at("2026-12-12T12:00:00+07:00")), 6); // 12.12.2026 là thứ Bảy
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(vnMidnight("2026-12-12"), at("2026-12-11T17:00:00Z"));
});

test("Hôm nay: lấy sự kiện có giờ trong ngày, sự kiện nhiều ngày đang chạy, show và band của đúng thứ", () => {
  assert.deepEqual(titles("today", "2026-12-12T08:00:00+07:00"), ["Band thứ Bảy", "Show chiều", "Show tối", "hoan", "khai-mac", "qua-dem", "trien-lam"]);
});

test("sự kiện đã hủy và bản nháp không bao giờ hiện; sự kiện hoãn hiện kèm trạng thái", () => {
  const w = windowOf("today", at("2026-12-12T08:00:00+07:00"));
  const list = buildAgenda(EVENTS, STAGES, w.from, w.to);
  assert.equal(list.some((x) => x.title === "da-huy" || x.title === "nhap"), false);
  assert.equal(list.find((x) => x.title === "hoan")?.status, "postponed");
});

test("Tối nay: từ 17:00, bỏ sự kiện đã xong trước đó, giữ sự kiện cả ngày đang chạy", () => {
  assert.deepEqual(titles("tonight", "2026-12-12T08:00:00+07:00"), ["Band thứ Bảy", "Show chiều", "Show tối", "khai-mac", "qua-dem", "trien-lam"]);
});

test("Ngày mai: sự kiện qua nửa đêm vẫn tính cho ngày hôm sau", () => {
  assert.deepEqual(titles("tomorrow", "2026-12-12T08:00:00+07:00"), ["Band Chủ nhật", "Show CN", "qua-dem", "trien-lam"]);
});

test("ranh giới nửa đêm: 23:59 vẫn là hôm nay, 00:00 là ngày mới", () => {
  assert.equal(windowOf("today", at("2026-12-12T23:59:59+07:00")).from, vnMidnight("2026-12-12"));
  assert.equal(windowOf("today", at("2026-12-13T00:00:00+07:00")).from, vnMidnight("2026-12-13"));
});

test("Cuối tuần: thứ Tư thì lấy thứ Bảy và Chủ nhật sắp tới", () => {
  const w = windowOf("weekend", at("2026-12-09T10:00:00+07:00"));
  assert.equal(vnDate(w.from), "2026-12-12");
  assert.equal(w.to - w.from, 2 * 86400000);
  assert.deepEqual(titles("weekend", "2026-12-09T10:00:00+07:00"), ["Band Chủ nhật", "Band thứ Bảy", "Show CN", "Show chiều", "Show tối", "hoan", "khai-mac", "qua-dem", "trien-lam"]);
});

test("Cuối tuần: thứ Bảy lấy hôm nay và mai; Chủ nhật chỉ còn hôm nay; thứ Hai nhảy sang cuối tuần tới", () => {
  const sat = windowOf("weekend", at("2026-12-12T10:00:00+07:00"));
  assert.deepEqual([vnDate(sat.from), vnDate(sat.to - 1)], ["2026-12-12", "2026-12-13"]);
  const sun = windowOf("weekend", at("2026-12-13T10:00:00+07:00"));
  assert.deepEqual([vnDate(sun.from), vnDate(sun.to - 1)], ["2026-12-13", "2026-12-13"]);
  const mon = windowOf("weekend", at("2026-12-14T10:00:00+07:00"));
  assert.deepEqual([vnDate(mon.from), vnDate(mon.to - 1)], ["2026-12-19", "2026-12-20"]);
});

test("Chọn ngày: lấy đúng ngày đã chọn; ngày sai định dạng thì dùng hôm nay", () => {
  assert.deepEqual(titles("date", "2026-12-01T08:00:00+07:00", "2026-12-22"), ["tho-cam", "trien-lam"]);
  assert.equal(windowOf("date", at("2026-12-01T08:00:00+07:00"), "22/12").from, vnMidnight("2026-12-01"));
});

test("ngày không có gì thì danh sách rỗng", () => {
  assert.deepEqual(titles("date", "2026-12-01T08:00:00+07:00", "2027-03-03"), []);
});

test("sắp xếp: có giờ theo giờ bắt đầu, cả ngày riêng, hoạt động dài hơn 14 ngày xuống nhóm dài ngày; lọc theo loại", () => {
  const w = windowOf("today", at("2026-12-12T08:00:00+07:00"));
  const v = arrange(buildAgenda(EVENTS, STAGES, w.from, w.to));
  assert.deepEqual(v.timed.map((x) => x.title), ["hoan", "Show chiều", "Show tối", "Band thứ Bảy", "khai-mac", "qua-dem"]);
  assert.deepEqual(v.longRunning.map((x) => x.title), ["trien-lam"]);
  assert.deepEqual(v.allDay, []);
  const shows = arrange(buildAgenda(EVENTS, STAGES, w.from, w.to), "show");
  assert.equal(shows.timed.every((x) => x.kind === "show"), true);
  assert.equal(shows.longRunning.length, 0);
});

test("lịch hằng tuần không được suy ra quá mốc cho phép", () => {
  const w = windowOf("date", at("2026-12-01T08:00:00+07:00"), "2027-03-06"); // một thứ Bảy xa
  const far = buildAgenda(EVENTS, STAGES, w.from, w.to, at("2026-12-15T08:00:00+07:00"));
  assert.deepEqual(far, []);
  const near = windowOf("date", at("2026-12-01T08:00:00+07:00"), "2026-12-05");
  assert.deepEqual(buildAgenda(EVENTS, STAGES, near.from, near.to, at("2026-12-15T08:00:00+07:00")).map((x) => x.title), ["trien-lam", "Band thứ Bảy"]);
});

test("sự kiện khác (có ngày bắt đầu, kết thúc) vào chung danh sách với loại 'event'", () => {
  const w = windowOf("today", at("2026-11-23T08:00:00+07:00"));
  const hap = [{ title: "Hội chợ", desc: "", when: "", start_date: "2026-11-20", end_date: "2026-11-24", venue: "Lâm Viên" }, { title: "Đã qua", desc: "", when: "", start_date: "2026-11-01", end_date: "2026-11-22" }, { title: "Sai ngày", desc: "", when: "", start_date: "20.11", end_date: "24.11" }];
  const list = buildAgenda([], [], w.from, w.to, Infinity, hap);
  assert.deepEqual(list.map((x) => [x.title, x.kind, x.allDay]), [["Hội chợ", "event", true]]);
});

test("Sắp diễn ra: từ ngày mai, trong 30 ngày, bỏ cái đang diễn ra và lịch hằng tuần", () => {
  const now = at("2026-12-10T08:00:00+07:00");
  const w = windowOf("upcoming", now);
  assert.equal(vnDate(w.from), "2026-12-11");
  assert.equal(vnDate(w.to - 1), "2027-01-09");
  const up = upcomingOnly(buildAgenda(EVENTS, STAGES, w.from, w.to), w.from, 12).map((x) => x.title);
  assert.deepEqual(up, ["hoan", "Show chiều", "Show tối", "khai-mac", "qua-dem", "Show CN", "tho-cam"]);
});
