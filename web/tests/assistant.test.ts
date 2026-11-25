import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { buildAgenda } from "../src/utils/agenda.ts";
import { parseAsk, parseBudget, parsePeople, priceOf, recommend } from "../src/utils/assistant.ts";
import { listPlaces } from "../src/utils/places.ts";
import { fold } from "../src/utils/search.ts";

const load = (f: string) => JSON.parse(fs.readFileSync(new URL("../../data/" + f, import.meta.url), "utf8"));
const events = load("events.json");
const shows = load("shows.json");
const places = listPlaces(events.venues, shows.stages);
const at = (s: string) => Date.parse(s + "+07:00");
// Thứ Hai 23.11.2026, 14:00
const NOW = at("2026-11-23T14:00:00");
const run = (text: string, now = NOW) => {
  const ask = parseAsk(text, now, places);
  const agenda = buildAgenda(events.events, shows.stages, ask.from, ask.to, now + 14 * 86400000, []);
  return { ask, advice: recommend(ask, agenda, shows.stages, places, events.events, null, now) };
};

test("số người: chữ, số, cặp đôi, một mình, nhóm", () => {
  const p = (s: string) => parsePeople(fold(s));
  assert.equal(p("hai người"), 2);
  assert.equal(p("gia đình 4 người"), 4);
  assert.equal(p("đi một mình"), 1);
  assert.equal(p("cặp đôi muốn hẹn hò"), 2);
  assert.equal(p("nhóm 6 muốn đi chơi"), 6);
  assert.equal(p("muốn nghe nhạc"), null);
});

test("ngân sách: nhiều cách viết tiền Việt; mỗi người thì nhân lên", () => {
  assert.equal(parseBudget("có 500.000đ", 2), 500000);
  assert.equal(parseBudget("tầm 500k thôi", 2), 500000);
  assert.equal(parseBudget("khoảng 300 nghìn", null), 300000);
  assert.equal(parseBudget("ngân sách 1 triệu", null), 1000000);
  assert.equal(parseBudget("1,5 triệu", null), 1500000);
  assert.equal(parseBudget("1tr2", null), 1200000);
  assert.equal(parseBudget("200k mỗi người", 3), 600000);
  assert.equal(parseBudget("tối nay đi đâu 2 người", 2), null);
  assert.equal(parseBudget("ngày 12.12 có gì", null), null);
});

test("câu mẫu của chủ dự án: tối nay, hai người, 500.000đ, nghe nhạc", () => {
  const { ask, advice } = run("Tối nay hai người có 500.000đ, muốn nghe nhạc ở Đà Lạt");
  assert.equal(ask.dateLabel, "Tối nay");
  assert.equal(ask.people, 2);
  assert.equal(ask.budget, 500000);
  assert.deepEqual(ask.interests, ["music"]);
  assert.ok(advice.fits.length >= 1);
  const first = advice.fits[0];
  assert.equal(first.item.label, "Sense Acoustic Cafe");
  assert.equal(first.price!.perPerson, 115000);
  assert.equal(first.total, 230000);
  assert.ok(advice.fits.every((p) => p.item.kind === "show" && (p.total as number) <= 500000));
});

test("giá chỉ lấy từ dữ liệu: đêm có ghi giá dùng giá đó, không có thì để trống chứ không đoán", () => {
  const { advice } = run("cuối tuần hai người muốn nghe nhạc, 500k");
  const lulu = [...advice.fits, ...advice.over].find((p) => p.item.label === "Lululola Show");
  assert.ok(lulu, "phải thấy show Lululola cuối tuần");
  assert.equal(lulu!.price!.source, "Vé từ 490.000đ");
  assert.equal(lulu!.total, 980000);
  assert.ok(advice.over.includes(lulu!), "980.000đ vượt 500.000đ");
  const may = advice.unknown.find((p) => p.item.label === "Mây Lang Thang");
  assert.ok(may, "Mây Lang Thang không có giá trong dữ liệu nên nằm ở nhóm chưa rõ giá");
  assert.equal(may!.price, null);
  assert.equal(priceOf({ ...may!.item, label: "Sân khấu không có" }, shows.stages), null);
});

test("không nói ngân sách thì không loại ai vì giá; không nói ngày thì lấy từ bây giờ đến hết ngày mai", () => {
  const { ask, advice } = run("muốn nghe nhạc");
  assert.equal(ask.dateGiven, false);
  assert.equal(ask.budget, null);
  assert.equal(advice.over.length, 0);
  assert.ok(advice.fits.concat(advice.unknown).every((p) => p.item.start < ask.to));
});

test("hỏi theo ngày Festival và sở thích khác", () => {
  const { ask, advice } = run("12.12 gia đình 4 người đi xem hoa");
  assert.equal(ask.people, 4);
  assert.deepEqual(ask.interests, ["flower"]);
  assert.ok(advice.unknown.some((p) => p.item.programId === "khai-mac"));
  assert.ok(advice.unknown.every((p) => p.price === null));
});

test("gần một địa điểm có tên: xếp theo khoảng cách", () => {
  const { ask, advice } = run("cuối tuần nghe nhạc gần Lululola");
  assert.equal(ask.near!.id, "s-lululola-0");
  const all = [...advice.fits, ...advice.unknown];
  const kms = all.map((p) => p.km).filter((k): k is number => k !== null);
  assert.ok(kms.length >= 1);
  assert.deepEqual(kms, [...kms].sort((a, b) => a - b));
});

test("show đã qua giờ không được gợi ý", () => {
  const { advice } = run("tối nay nghe nhạc", at("2026-11-23T22:30:00"));
  assert.ok(advice.fits.concat(advice.unknown).every((p) => p.item.end >= at("2026-11-23T22:30:00")));
});

test("hiểu câu hỏi tiếng Anh: số người, ngân sách, sở thích, gần đâu", () => {
  const now = Date.parse("2026-12-05T10:00:00+07:00");
  const a = parseAsk("Tonight two people with 500k, want live music near me", now, []);
  assert.equal(a.people, 2);
  assert.equal(a.budget, 500000);
  assert.ok(a.interests.includes("music"));
  assert.equal(a.nearMe, true);
  assert.equal(a.dateGiven, true);
  const b = parseAsk("This weekend, family of 4, we love flowers, 1 million per person", now, []);
  assert.equal(b.people, 4);
  assert.equal(b.budget, 4000000);
  assert.ok(b.interests.includes("flower"));
  assert.equal(parseAsk("Mây Lang Thang tối nay", now, []).dateGiven, true);
});
