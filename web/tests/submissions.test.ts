import test from "node:test";
import assert from "node:assert/strict";
import { cleanInput, submissionErrors } from "../src/utils/submissions.ts";

const ok = { title: "Đêm nhạc", start_date: "2026-12-05", end_date: "2026-12-05", venue: "Quán A, Đà Lạt", desc: "Đêm nhạc acoustic từ 19h, vé 150.000đ", link: "https://facebook.com/events/1", contact: "0900000000" };

test("sự kiện gửi lên: hợp lệ và các lỗi thường gặp", () => {
  assert.deepEqual(submissionErrors(cleanInput(ok), "2026-11-27"), []);
  assert.equal(submissionErrors({ ...ok, end_date: "2026-12-01" }, "2026-11-27").length, 1);
  assert.equal(submissionErrors({ ...ok, start_date: "2026-11-01", end_date: "2026-11-02" }, "2026-11-27").length, 1);
  assert.equal(submissionErrors({ ...ok, link: "javascript:x" }, "2026-11-27").length, 1);
  assert.equal(submissionErrors({ ...ok, desc: "ngắn" }, "2026-11-27").length, 1);
  assert.equal(cleanInput({ ...ok, title: "  <b>Tên</b>  " }).title, "b Tên /b");
});
