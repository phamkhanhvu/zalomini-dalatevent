import test from "node:test";
import assert from "node:assert/strict";
import { arrangePlan, conflicts, planId, toIcs } from "../src/utils/itinerary.ts";
import type { PlanItem } from "../src/utils/itinerary.ts";

const at = (s: string) => Date.parse(s + "+07:00");
const mk = (id: string, start: string, end: string, extra: Partial<PlanItem> = {}): PlanItem => ({ id, kind: "show", title: id, label: "L", venue: "V", start: at(start), end: at(end), allDay: false, ...extra });
const NOW = at("2026-12-10T09:00:00");

test("hai suất chồng giờ được cảnh báo cả hai phía", () => {
  const c = conflicts([mk("a", "2026-12-12T20:00:00", "2026-12-12T22:00:00"), mk("b", "2026-12-12T21:00:00", "2026-12-12T23:00:00"), mk("c", "2026-12-13T20:00:00", "2026-12-13T22:00:00")]);
  assert.deepEqual(c.get("a"), ["b"]);
  assert.deepEqual(c.get("b"), ["a"]);
  assert.equal(c.has("c"), false);
});

test("nối đuôi nhau đúng một thời điểm không tính là trùng", () => {
  const c = conflicts([mk("a", "2026-12-12T18:00:00", "2026-12-12T20:00:00"), mk("b", "2026-12-12T20:00:00", "2026-12-12T22:00:00")]);
  assert.equal(c.size, 0);
});

test("mục cả ngày không gây trùng giờ", () => {
  const c = conflicts([mk("a", "2026-12-12T00:00:00", "2026-12-12T23:59:00", { allDay: true }), mk("b", "2026-12-12T20:00:00", "2026-12-12T22:00:00")]);
  assert.equal(c.size, 0);
});

test("một suất trùng với hai suất khác", () => {
  const c = conflicts([mk("a", "2026-12-12T19:00:00", "2026-12-12T23:00:00"), mk("b", "2026-12-12T20:00:00", "2026-12-12T21:00:00"), mk("c", "2026-12-12T21:30:00", "2026-12-12T22:00:00")]);
  assert.deepEqual(c.get("a"), ["b", "c"]);
  assert.deepEqual(c.get("b"), ["a"]);
});

test("xếp theo ngày Việt Nam, tách mục dài ngày và mục đã qua", () => {
  const v = arrangePlan(
    [
      mk("toi", "2026-12-12T20:00:00", "2026-12-12T22:00:00"),
      mk("khuya", "2026-12-12T00:30:00", "2026-12-12T01:30:00"),
      mk("ca-ngay", "2026-12-12T00:00:00", "2026-12-12T23:59:00", { allDay: true }),
      mk("dai", "2026-12-18T00:00:00", "2027-01-03T23:59:00", { allDay: true }),
      mk("cu", "2026-12-01T20:00:00", "2026-12-01T22:00:00"),
      mk("mai", "2026-12-13T08:00:00", "2026-12-13T09:00:00"),
    ],
    NOW
  );
  assert.deepEqual(v.days.map((d) => d.date), ["2026-12-12", "2026-12-13"]);
  assert.deepEqual(v.days[0].items.map((x) => x.id), ["khuya", "toi", "ca-ngay"]);
  assert.deepEqual(v.long.map((x) => x.id), ["dai"]);
  assert.deepEqual(v.past.map((x) => x.id), ["cu"]);
});

test("mã mục ổn định: festival theo mã chương trình, mục khác theo giờ và tên", () => {
  assert.equal(planId({ kind: "festival", programId: "khai-mac", start: 5, title: "x" }), "p:khai-mac:5");
  assert.equal(planId({ kind: "show", start: 5, title: "Hà Anh Tuấn" }), "x:show:5:Hà Anh Tuấn");
});

test("tệp lịch: giờ đổi sang UTC, mục cả ngày kết thúc ở ngày kế tiếp, bỏ mục đã qua", () => {
  const ics = toIcs(
    [
      mk("Khai mạc; đêm hội, hoa", "2026-12-12T20:00:00", "2026-12-12T22:00:00", { venue: "Quảng trường Lâm Viên" }),
      mk("Không gian hoa", "2026-12-18T00:00:00", "2027-01-03T23:59:00", { allDay: true }),
      mk("cu", "2026-12-01T20:00:00", "2026-12-01T22:00:00"),
    ],
    NOW
  );
  assert.match(ics, /DTSTART:20261212T130000Z\r\nDTEND:20261212T150000Z/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261218\r\nDTEND;VALUE=DATE:20270104/);
  assert.ok(ics.includes(String.raw`SUMMARY:Khai mạc\; đêm hội\, hoa`));
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 2);
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n") && ics.endsWith("END:VCALENDAR\r\n"));
  for (const line of ics.split("\r\n")) assert.ok(new TextEncoder().encode(line).length <= 75, "dòng quá dài: " + line);
});

import { decodeShare, encodeShare } from "../src/utils/itinerary.ts";

test("link chia sẻ: nén rồi đọc lại ra đúng lịch trình, giữ dấu tiếng Việt", () => {
  const items = [
    mk("p:khai-mac:1", "2026-12-12T20:00:00", "2026-12-12T22:00:00", { kind: "festival", programId: "khai-mac" }),
    mk("x", "2026-11-28T17:00:00", "2026-11-28T19:00:00", { title: "Lê Hiếu và Nguyên Hà", label: "Lululola Show", venue: "Lululola Show", url: "https://lululola.vn/show", endEstimated: true }),
  ];
  const code = encodeShare(items);
  assert.match(code, /^[A-Za-z0-9_-]+$/);
  const back = decodeShare(code)!;
  assert.deepEqual(back.programIds, ["khai-mac"]);
  assert.equal(back.items.length, 1);
  assert.equal(back.items[0].title, "Lê Hiếu và Nguyên Hà");
  assert.equal(back.items[0].start, items[1].start);
  assert.equal(back.items[0].url, "https://lululola.vn/show");
  assert.equal(back.items[0].endEstimated, true);
});

test("link chia sẻ hỏng hoặc cố ý cài dữ liệu xấu bị loại", () => {
  const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  assert.equal(decodeShare(""), null);
  assert.equal(decodeShare("@@@"), null);
  assert.equal(decodeShare(enc({ v: 2, p: [], x: [] })), null);
  const bad = decodeShare(enc({ v: 1, p: ["khai-mac", "../x", 5], x: [
    ["show", 1, 2, 0, "<img src=x onerror=alert(1)>Tên", "L", "V", "javascript:alert(1)", 0],
    ["festival", 1, 2, 0, "Giả festival", "L", "V", "", 0],
    ["show", 5, 2, 0, "Kết thúc trước bắt đầu", "L", "V", "", 0],
    ["show", "a", 2, 0, "Sai kiểu", "L", "V", "", 0],
    ["show", 1, 2, 0, "", "L", "V", "", 0],
  ] }))!;
  assert.deepEqual(bad.programIds, ["khai-mac"]);
  assert.equal(bad.items.length, 1);
  assert.equal(bad.items[0].url, undefined);
  assert.ok(!/[<>]/.test(bad.items[0].title));
});
