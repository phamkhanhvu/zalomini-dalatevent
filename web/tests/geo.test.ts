import test from "node:test";
import assert from "node:assert/strict";
import { distanceKm, formatKm, rankPlaces } from "../src/utils/geo.ts";

const LAM_VIEN = { lat: 11.93884, lng: 108.44501 };
const GA = { lat: 11.9416, lng: 108.45443 };
const PLACES = [
  { id: "ga", ...GA },
  { id: "lam-vien", ...LAM_VIEN },
  { id: "lululola", lat: 11.92012, lng: 108.44212 },
  { id: "chua-ro", lat: null, lng: null },
];

test("khoảng cách: Quảng trường Lâm Viên tới Ga Đà Lạt khoảng 1 km, cùng điểm là 0, đối xứng", () => {
  const d = distanceKm(LAM_VIEN, GA);
  assert.ok(d > 0.9 && d < 1.2, String(d));
  assert.equal(distanceKm(LAM_VIEN, LAM_VIEN), 0);
  assert.ok(Math.abs(distanceKm(GA, LAM_VIEN) - d) < 1e-9);
});

test("một độ vĩ khoảng 111 km", () => {
  const d = distanceKm({ lat: 11, lng: 108 }, { lat: 12, lng: 108 });
  assert.ok(d > 110.5 && d < 111.7, String(d));
});

test("chưa có điểm xuất phát: giữ nguyên thứ tự, không có khoảng cách, không ẩn gì", () => {
  const r = rankPlaces(PLACES, null, 1);
  assert.deepEqual(r.near.map((x) => x.place.id), ["ga", "lam-vien", "lululola"]);
  assert.equal(r.near.every((x) => x.km === null), true);
  assert.equal(r.hidden, 0);
});

test("có điểm xuất phát: xếp gần trước, lọc theo bán kính, đếm số bị ẩn", () => {
  const all = rankPlaces(PLACES, LAM_VIEN, null);
  assert.deepEqual(all.near.map((x) => x.place.id), ["lam-vien", "ga", "lululola"]);
  const r1 = rankPlaces(PLACES, LAM_VIEN, 1);
  assert.deepEqual(r1.near.map((x) => x.place.id), ["lam-vien"]);
  assert.equal(r1.hidden, 2);
  const r3 = rankPlaces(PLACES, LAM_VIEN, 3);
  assert.deepEqual(r3.near.map((x) => x.place.id), ["lam-vien", "ga", "lululola"]);
});

test("địa điểm chưa có tọa độ không bị loại, luôn nằm trong nhóm riêng", () => {
  assert.deepEqual(rankPlaces(PLACES, LAM_VIEN, 1).unknown.map((x) => x.id), ["chua-ro"]);
  assert.deepEqual(rankPlaces(PLACES, null, null).unknown.map((x) => x.id), ["chua-ro"]);
});

test("hiển thị khoảng cách", () => {
  assert.equal(formatKm(0.004), "10 m");
  assert.equal(formatKm(0.347), "350 m");
  assert.equal(formatKm(2.44), "2,4 km");
  assert.equal(formatKm(12.6), "13 km");
});
