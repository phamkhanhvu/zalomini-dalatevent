import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildAgenda } from "../src/utils/agenda.ts";
import { parseAsk, recommend } from "../src/utils/assistant.ts";
import { buildPlan } from "../src/utils/daytrip.ts";
import { listPlaces } from "../src/utils/places.ts";

const load = (f: string) => JSON.parse(fs.readFileSync(new URL("../../data/" + f, import.meta.url), "utf8"));
const events = load("events.json");
const shows = load("shows.json");
const guide = load("places.json").places;
const venues = listPlaces(events.venues, shows.stages);
const at = (s: string) => Date.parse(s + "+07:00");
const plan = (text: string, now: number, seed = 0) => {
  const ask = parseAsk(text, now, venues);
  const adv = recommend(ask, buildAgenda(events.events, shows.stages, ask.from, ask.to, now + 14 * 86400000, []), shows.stages, venues, events.events, null, now);
  return buildPlan(ask, [...adv.fits, ...adv.unknown].map((p) => p.item), guide, now, seed);
};
const MON14 = at("2026-11-23T14:00:00");

test("câu mẫu: tối nay nghe nhạc → chỉ có buổi tối, ăn tối trước rồi tới đêm nhạc đúng giờ thật", () => {
  const days = plan("Tối nay hai người có 500.000đ, muốn nghe nhạc ở Đà Lạt", MON14);
  assert.equal(days.length, 1);
  const s = days[0].stops;
  assert.ok(s.every((x) => x.part === "Tối"));
  assert.deepEqual(s.map((x) => x.kind), ["eat", "event"]);
  assert.equal(s[1].time, "20:00");
  assert.equal(s[1].item!.label, "Sense Acoustic Cafe");
  assert.equal(s[0].places.length, 2);
});

test("cả ngày mai: đủ sáng, trưa, chiều, tối theo thứ tự giờ; không lặp địa điểm", () => {
  const days = plan("ngày mai hai người đi chơi", MON14);
  assert.equal(days.length, 1);
  const s = days[0].stops;
  assert.deepEqual([...new Set(s.map((x) => x.part))], ["Sáng", "Trưa", "Chiều", "Tối"]);
  assert.deepEqual(s.map((x) => x.at), [...s.map((x) => x.at)].sort((a, b) => a - b));
  const ids = s.flatMap((x) => x.places.map((p) => p.id));
  assert.equal(new Set(ids).size, ids.length);
});

test("buổi đã qua trong hôm nay không được gợi ý", () => {
  const days = plan("hôm nay đi đâu", at("2026-11-23T16:00:00"));
  assert.ok(days[0].stops.every((x) => x.at >= at("2026-11-23T15:30:00")));
  assert.ok(!days[0].stops.some((x) => x.part === "Sáng" || x.part === "Trưa"));
});

test("điểm thứ hai buổi sáng phải là điểm cẩm nang ghi là liên quan tới điểm thứ nhất", () => {
  for (let seed = 0; seed < 12; seed++) {
    const morning = plan("ngày mai đi chơi", MON14, seed)[0].stops.filter((x) => x.part === "Sáng");
    if (morning.length === 2) assert.ok(morning[0].places[0].related.includes(morning[1].places[0].id));
  }
});

test("show diễn sớm 17:00: ăn tối xếp sau show, không xếp cà phê sát giờ diễn", () => {
  const days = plan("thứ bảy nghe nhạc", MON14);
  const s = days[0].stops;
  const ev = s.find((x) => x.kind === "event" && x.time === "17:00");
  assert.ok(ev, "thứ bảy 28.11 có show 17:00");
  const dinner = s.find((x) => x.kind === "eat" && x.part === "Tối")!;
  assert.ok(dinner.at > ev!.at);
});

test("cuối tuần cho ra hai ngày; bấm gợi ý khác (seed khác) thì đổi địa điểm nhưng giữ nguyên sự kiện thật", () => {
  const a = plan("cuối tuần gia đình 4 người", MON14, 0);
  const b = plan("cuối tuần gia đình 4 người", MON14, 1);
  assert.equal(a.length, 2);
  assert.notDeepEqual(a[0].stops.flatMap((x) => x.places.map((p) => p.id)), b[0].stops.flatMap((x) => x.places.map((p) => p.id)));
  const evs = (d: typeof a) => d.flatMap((x) => x.stops.filter((s) => s.item).map((s) => s.item!.key));
  assert.deepEqual(evs(a), evs(b));
  assert.deepEqual(plan("cuối tuần gia đình 4 người", MON14, 0), a);
});

test("thích hoa: buổi sáng ưu tiên vườn hoa; ngày Festival thì sự kiện cả ngày vào buổi chiều", () => {
  const s = plan("12.12 gia đình 4 người đi xem hoa", MON14)[0].stops;
  assert.match(s.find((x) => x.part === "Sáng")!.title.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(), /hoa|vuon|cam tu cau|che|garden/);
  assert.ok(s.some((x) => x.kind === "event"));
});
