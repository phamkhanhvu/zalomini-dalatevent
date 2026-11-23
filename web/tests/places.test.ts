import test from "node:test";
import assert from "node:assert/strict";
import { itemsAt, listPlaces } from "../src/utils/places.ts";
import type { AgendaItem } from "../src/utils/agenda.ts";

const venues = [{ id: "lam-vien", name: "Quảng trường Lâm Viên", map_query: "q", lat: 1, lng: 2 }, { id: "htm", name: "Đường Hồ Tùng Mậu", map_query: "q", lat: null, lng: null }];
const stages = [
  { id: "may", name: "Mây Lang Thang", places: [{ label: "Mây · Lang Biang", name: "Mây Lang Thang", map_query: "q", lat: null, lng: null }, { label: "Mây Heritage · Ga", name: "Mây Heritage", map_query: "q", lat: 1, lng: 2 }] },
  { id: "lulu", name: "Lululola Show" },
];
const events = [{ id: "khai-mac", venue_id: "lam-vien" }, { id: "pho-tra", venue_id: "lam-vien", venue_ids: ["lam-vien", "htm"] }, { id: "golf", venue_id: "golf" }];
const mk = (o: Partial<AgendaItem>): AgendaItem => ({ key: "k", kind: "festival", title: "t", label: "l", venue: "v", start: 1, end: 2, allDay: false, status: "published", ...o });
const agenda = [
  mk({ title: "Khai mạc", programId: "khai-mac" }),
  mk({ title: "Phố trà", programId: "pho-tra" }),
  mk({ title: "Golf", programId: "golf" }),
  mk({ title: "K-Festa", kind: "event", venue: "Quang truong Lam Vien, Đà Lạt" }),
  mk({ title: "Cỏ hồng", kind: "event", venue: "Đồi cỏ hồng" }),
  mk({ title: "Đêm A", kind: "show", label: "Mây Lang Thang", venue: "Mây · Lang Biang" }),
  mk({ title: "Đêm B", kind: "show", label: "Mây Lang Thang", venue: "Mây Heritage · Ga" }),
  mk({ title: "Đêm C", kind: "show", label: "Lululola Show", venue: "Lululola Show" }),
];
const places = listPlaces(venues, stages);
const at = (id: string) => itemsAt(places.find((p) => p.id === id)!, events, agenda).map((x) => x.title);

test("mã địa điểm dùng được trong link và không trùng nhau", () => {
  assert.deepEqual(places.map((p) => p.id), ["f-lam-vien", "f-htm", "s-may-0", "s-may-1", "s-lulu-0"]);
  assert.ok(places.every((p) => /^[a-z0-9-]+$/.test(p.id)));
});

test("địa điểm Festival: lấy chương trình theo mã địa điểm và sự kiện khác theo tên (không phân biệt dấu)", () => {
  assert.deepEqual(at("f-lam-vien"), ["Khai mạc", "Phố trà", "K-Festa"]);
});

test("chương trình diễn ra ở nhiều nơi hiện ở cả địa điểm phụ", () => {
  assert.deepEqual(at("f-htm"), ["Phố trà"]);
});

test("sân khấu có hai địa điểm: mỗi nơi chỉ hiện đêm diễn của mình", () => {
  assert.deepEqual(at("s-may-0"), ["Đêm A"]);
  assert.deepEqual(at("s-may-1"), ["Đêm B"]);
});

test("sân khấu một địa điểm: hiện mọi đêm của sân khấu đó, không lẫn sân khấu khác", () => {
  assert.deepEqual(at("s-lulu-0"), ["Đêm C"]);
});
