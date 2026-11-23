import test from "node:test";
import assert from "node:assert/strict";
import { catalogue, check, cleanStamps, stampHere, unionStamps } from "../src/utils/passport.ts";

const venues = [{ id: "lam-vien", name: "Quảng trường Lâm Viên", lat: 11.9382, lng: 108.4452 }, { id: "tqt", name: "Công viên Trần Quốc Toản", lat: null, lng: null }];
const stages = [{ id: "sense", name: "Sense", places: [{ name: "Sense Acoustic Cafe", lat: 11.952, lng: 108.4317 }, { name: "Chưa có tọa độ", lat: null, lng: null }] }];
const events = [
  { id: "khai-mac", title: "Khai mạc", status: "published", venue_id: "lam-vien", sessions: [{ start_at: "2026-12-12T20:00:00+07:00", end_at: "2026-12-12T22:00:00+07:00" }] },
  { id: "nhap", title: "Nháp", status: "draft", venue_id: "lam-vien", sessions: [{ start_at: "2026-12-12T20:00:00+07:00", end_at: "2026-12-12T22:00:00+07:00" }] },
  { id: "o-tqt", title: "Ở nơi chưa có tọa độ", status: "published", venue_id: "tqt", sessions: [{ start_at: "2026-12-12T20:00:00+07:00", end_at: "2026-12-12T22:00:00+07:00" }] },
];
const defs = catalogue(venues, stages, events);
const at = (s: string) => Date.parse(s + "+07:00");
const LV = { lat: 11.9382, lng: 108.4452, accuracy: 20 };
// khoảng 0,0027 độ vĩ ≈ 300 m
const north = (m: number, accuracy = 20) => ({ lat: 11.9382 + m / 111320, lng: 108.4452, accuracy });

test("danh mục: chỉ địa điểm có tọa độ và chương trình đã công bố có tọa độ", () => {
  assert.deepEqual(defs.map((d) => d.id), ["pl:f-lam-vien", "pl:s-sense-0", "ev:khai-mac"]);
});

test("dấu địa điểm: đứng trong 300 m thì đóng được, xa hơn thì không", () => {
  const d = defs[0];
  assert.equal(check(d, north(250), 0), "ok");
  assert.equal(check(d, north(600), 0), "far");
});

test("sai số của máy được trừ bớt nhưng tối đa 150 m; định vị quá mơ hồ thì từ chối", () => {
  const d = defs[0];
  assert.equal(check(d, north(420, 140), 0), "ok");
  assert.equal(check(d, north(700, 900), 0), "far");
  assert.equal(check(d, north(100, 5000), 0), "inaccurate");
  assert.equal(check(d, { lat: 11.9382, lng: 108.4452, accuracy: NaN }, 0), "inaccurate");
});

test("dấu sự kiện: chỉ đóng được từ 1 giờ trước tới 1 giờ sau khi diễn ra", () => {
  const d = defs[2];
  assert.equal(check(d, LV, at("2026-12-12T18:30:00")), "early");
  assert.equal(check(d, LV, at("2026-12-12T19:10:00")), "ok");
  assert.equal(check(d, LV, at("2026-12-12T22:50:00")), "ok");
  assert.equal(check(d, LV, at("2026-12-12T23:30:00")), "over");
});

test("đóng dấu tại chỗ: lấy mọi dấu đủ điều kiện, bỏ dấu đã có; không có thì báo dấu gần nhất và lý do", () => {
  const during = at("2026-12-12T20:30:00");
  assert.deepEqual(stampHere(defs, [], LV, during).earned.map((d) => d.id), ["pl:f-lam-vien", "ev:khai-mac"]);
  assert.deepEqual(stampHere(defs, [{ id: "pl:f-lam-vien", at: 1 }], LV, during).earned.map((d) => d.id), ["ev:khai-mac"]);
  const far = stampHere(defs, [], north(900), at("2026-11-23T10:00:00"));
  assert.equal(far.earned.length, 0);
  assert.equal(far.nearest!.def.id, "pl:f-lam-vien");
  assert.equal(far.nearest!.verdict, "far");
  assert.ok(Math.abs(far.nearest!.meters - 900) < 15);
});

test("gộp dấu hai máy giữ lần sớm nhất; dữ liệu lạ bị loại", () => {
  assert.deepEqual(unionStamps([{ id: "pl:a", at: 5 }], [{ id: "pl:a", at: 3 }, { id: "ev:b", at: 9 }]), [{ id: "pl:a", at: 3 }, { id: "ev:b", at: 9 }]);
  assert.deepEqual(cleanStamps([{ id: "pl:f-lam-vien", at: 1 }, { id: "xx:1", at: 1 }, { id: "pl:<b>", at: 1 }, { id: "ev:a", at: "x" }, null, 5]), [{ id: "pl:f-lam-vien", at: 1 }]);
  assert.deepEqual(cleanStamps("rác"), []);
});
