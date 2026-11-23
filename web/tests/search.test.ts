import test from "node:test";
import assert from "node:assert/strict";
import { buildAgenda, vnDate } from "../src/utils/agenda.ts";
import type { InEvent, InHappening, InStage } from "../src/utils/agenda.ts";
import { fold, parseDateQuery, search } from "../src/utils/search.ts";

const at = (iso: string) => Date.parse(iso);
const NOW = at("2026-11-23T08:00:00+07:00"); // thứ Hai
const EVENTS: InEvent[] = [
  { id: "khai-mac", series: "f", title: "Khai mạc Festival Hoa Đà Lạt lần thứ XI", category: "le-hoi", venue_name: "Quảng trường Lâm Viên", status: "published", tentative: false, sessions: [{ start_at: "2026-12-12T20:00:00+07:00", end_at: "2026-12-12T22:00:00+07:00", all_day: false }], source_url: null, verified_at: null },
  { id: "jazz", series: "f", title: "Lễ hội nhạc Jazz Việt Nam 2026", category: "am-nhac", venue_name: "Trên mặt hồ Xuân Hương", status: "published", tentative: false, sessions: [{ start_at: "2026-12-25T00:00:00+07:00", end_at: "2026-12-27T23:59:00+07:00", all_day: true }], source_url: null, verified_at: null },
  { id: "huy", series: "f", title: "Đêm nhạc đã hủy", category: "am-nhac", venue_name: "X", status: "cancelled", tentative: false, sessions: [{ start_at: "2026-12-12T20:00:00+07:00", end_at: "2026-12-12T22:00:00+07:00", all_day: false }], source_url: null, verified_at: null },
];
const STAGES: InStage[] = [
  { id: "mlt", name: "Mây Lang Thang", kind: "dated", source_url: "https://a", verified_at: "2026-11-23", items: [
    { date: "2026-11-28", time: "17:00", title: "Trung Quân", url: "https://a/1", place: "Mây Lang Thang · Lang Biang" },
    { date: "2026-12-12", time: "17:00", title: "Phan Mạnh Quỳnh", url: "https://a/2", place: "Mây Lang Thang · Lang Biang" },
  ] },
  { id: "sense", name: "Sense Acoustic Cafe", kind: "weekly", source_url: "https://b", verified_at: "2026-11-23", items: [
    { weekday: 1, time: "20:00 – 22:00", title: "Sharky Band", url: "https://b" },
    { weekday: 6, time: "20:00 – 22:00", title: "Sense Band", url: "https://b" },
  ] },
];
const HAP: InHappening[] = [{ title: "Mùa hội cỏ hồng Lang Biang năm 2026", desc: "Đua ngựa không yên", when: "", start_date: "2026-11-21", end_date: "2026-12-12", venue: "Đồi cỏ hồng Đạ Nghịt" }];
const PLACES = [{ id: "lv", name: "Quảng trường Lâm Viên", hint: "Địa điểm Festival" }, { id: "hxh", name: "Hồ Xuân Hương", hint: "Địa điểm Festival" }];
const agendaFor = (from: number, to: number) => buildAgenda(EVENTS, STAGES, from, to, NOW + 14 * 86400000, HAP);
const find = (q: string) => search(q, NOW, agendaFor, PLACES);
const titles = (q: string) => find(q).items.map((x) => x.title);

test("bỏ dấu và hoa thường", () => {
  assert.equal(fold("Đà Lạt – Quảng trường “Lâm Viên”"), "da lat quang truong lam vien");
});

test("tìm theo nghệ sĩ, không cần gõ dấu", () => {
  assert.deepEqual(titles("phan manh quynh"), ["Phan Mạnh Quỳnh"]);
  assert.deepEqual(titles("Trung Quân"), ["Trung Quân"]);
});

test("tìm theo tên sự kiện, loại hoạt động và mô tả", () => {
  assert.deepEqual(titles("jazz"), ["Lễ hội nhạc Jazz Việt Nam 2026"]);
  assert.deepEqual(titles("đua ngựa"), ["Mùa hội cỏ hồng Lang Biang năm 2026"]);
});

test("tìm theo địa điểm: ra cả sự kiện tại đó và chính địa điểm", () => {
  const r = find("lâm viên");
  assert.deepEqual(r.items.map((x) => x.title), ["Khai mạc Festival Hoa Đà Lạt lần thứ XI"]);
  assert.deepEqual(r.places.map((p) => p.id), ["lv"]);
});

test("sự kiện đã hủy không bao giờ ra trong kết quả", () => {
  assert.deepEqual(titles("đêm nhạc đã hủy"), []);
});

test("lịch hằng tuần chỉ ra một lần cho mỗi band khi không hỏi ngày", () => {
  assert.deepEqual(titles("sense"), ["Sharky Band", "Sense Band"]);
});

test("ngày dạng số: 12.12, 12/12, 12-12-2026 đều là 12.12.2026", () => {
  for (const q of ["12.12", "12/12", "ngày 12-12-2026"]) {
    const d = parseDateQuery(q, NOW)!;
    assert.equal(vnDate(d.from), "2026-12-12", q);
    assert.equal(d.rest, "", q);
  }
  assert.deepEqual(titles("12.12").sort(), ["Khai mạc Festival Hoa Đà Lạt lần thứ XI", "Mùa hội cỏ hồng Lang Biang năm 2026", "Phan Mạnh Quỳnh"]);
});

test("ngày đã qua trong năm thì hiểu là năm sau; ngày vô lý thì không coi là ngày", () => {
  assert.equal(vnDate(parseDateQuery("03.01", NOW)!.from), "2027-01-03");
  assert.equal(parseDateQuery("31.02", NOW), null);
  assert.equal(parseDateQuery("45.99", NOW), null);
});

test("kết hợp ngày và tên: 'jazz 26.12', 'show 12.12 phan'", () => {
  assert.deepEqual(titles("jazz 26.12"), ["Lễ hội nhạc Jazz Việt Nam 2026"]);
  assert.deepEqual(titles("12.12 phan"), ["Phan Mạnh Quỳnh"]);
});

test("ngày bằng chữ: hôm nay, tối nay, cuối tuần, thứ bảy", () => {
  assert.deepEqual(titles("hôm nay").sort(), ["Mùa hội cỏ hồng Lang Biang năm 2026", "Sharky Band"]);
  assert.equal(parseDateQuery("tối nay", NOW)!.label, "Tối nay");
  const sat = parseDateQuery("thứ bảy", NOW)!;
  assert.equal(vnDate(sat.from), "2026-11-28");
  assert.deepEqual(titles("thu bay").sort(), ["Mùa hội cỏ hồng Lang Biang năm 2026", "Sense Band", "Trung Quân"]);
  const wk = parseDateQuery("nhạc cuối tuần", NOW)!;
  assert.equal(wk.rest, "nhac");
  assert.equal(vnDate(wk.from), "2026-11-28");
});

test("tháng: 'tháng 12' lấy cả tháng", () => {
  const d = parseDateQuery("tháng 12", NOW)!;
  assert.deepEqual([vnDate(d.from), vnDate(d.to - 1)], ["2026-12-01", "2026-12-31"]);
});

test("câu quá ngắn không tìm; không có gì thì báo rỗng", () => {
  assert.equal(find("a").empty, false);
  assert.equal(find("a").items.length, 0);
  assert.equal(find("bóng đá").empty, true);
});
