import test from "node:test";
import assert from "node:assert/strict";
import { cleanInput, submissionErrors } from "../src/utils/submissions.ts";

const ok = { title: "Đêm nhạc", start_date: "2026-12-05", end_date: "2026-12-05", venue: "Quán A, Đà Lạt", desc: "Đêm nhạc acoustic từ 19h, vé 150.000đ", link: "https://facebook.com/events/1", contact: "0900000000", repeat: "once" as const, weekdays: [] as number[], time: "" };

test("sự kiện gửi lên: hợp lệ và các lỗi thường gặp", () => {
  assert.deepEqual(submissionErrors(cleanInput(ok), "2026-11-27"), []);
  assert.equal(submissionErrors({ ...ok, end_date: "2026-12-01" }, "2026-11-27").length, 1);
  assert.equal(submissionErrors({ ...ok, start_date: "2026-11-01", end_date: "2026-11-02" }, "2026-11-27").length, 1);
  assert.equal(submissionErrors({ ...ok, link: "javascript:x" }, "2026-11-27").length, 1);
  assert.equal(submissionErrors({ ...ok, desc: "ngắn" }, "2026-11-27").length, 1);
  assert.equal(cleanInput({ ...ok, title: "  <b>Tên</b>  " }).title, "b Tên /b");
});

test("sự kiện lặp: kiểm tra và nhãn lịch", async () => {
  const { repeatLabel } = await import("../src/utils/submissions.ts");
  const w = cleanInput({ ...ok, repeat: "weekly", weekdays: [6, 5, 5], time: "19:30", end_date: "2026-12-31" });
  assert.deepEqual(w.weekdays, [5, 6]);
  assert.deepEqual(submissionErrors(w, "2026-11-27"), []);
  assert.equal(repeatLabel(w), "Hằng tuần vào thứ 6, thứ 7 · 19:30");
  assert.ok(submissionErrors({ ...w, time: "" }, "2026-11-27").length >= 1);
  assert.ok(submissionErrors({ ...w, weekdays: [] }, "2026-11-27").length >= 1);
  assert.ok(submissionErrors({ ...w, end_date: "2027-12-31" }, "2026-11-27").length >= 1);
});

test("so sánh phiên bản app", async () => {
  const { newer } = await import("../src/utils/version.ts");
  assert.equal(newer("1.0.2", "1.0.1"), true);
  assert.equal(newer("1.0.10", "1.0.9"), true);
  assert.equal(newer("1.0.1", "1.0.1"), false);
  assert.equal(newer("1.0.1", "1.1"), false);
});
