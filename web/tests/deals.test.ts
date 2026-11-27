import test from "node:test";
import assert from "node:assert/strict";
import { cleanDeal, dealErrors, dealState, fromRest, makeCode, visibleDeals } from "../src/utils/deals.ts";

const T = Date.parse("2026-12-01T10:00:00+07:00");
const base = { title: "Mua 1 tặng 1", partner: "Quán Thử", summary: "s", terms: "Mỗi bàn một lần", place: "Đà Lạt", startAt: T - 1000, endAt: T + 86400000, limit: 50, count: 3, status: "published", confirmed: true, confirmedNote: "Chị A, 20.11" };
const mk = (o: Record<string, unknown> = {}, id = "thu-1") => cleanDeal(id, { ...base, ...o })!;

test("đọc tài liệu Firestore REST và làm sạch dữ liệu", () => {
  const r = fromRest({ name: "projects/x/databases/(default)/documents/deals/thu-1", fields: { title: { stringValue: "<b>Mua 1</b> tặng 1" }, partner: { stringValue: "Quán" }, startAt: { integerValue: "5" }, endAt: { doubleValue: 9 }, limit: { integerValue: "10" }, count: { integerValue: "0" }, confirmed: { booleanValue: true }, status: { stringValue: "published" } } })!;
  assert.equal(r.id, "thu-1");
  const d = cleanDeal(r.id, r.data)!;
  assert.ok(!/[<>]/.test(d.title));
  assert.equal(d.limit, 10);
  assert.equal(cleanDeal("Sai Mã", base), null);
  assert.equal(cleanDeal("x", { ...base, endAt: base.startAt }), null);
  assert.equal(cleanDeal("x", { ...base, limit: "nhiều" }), null);
  assert.equal(fromRest({}), null);
});

test("trạng thái: nháp và chưa xác nhận không bao giờ hiện với khách", () => {
  assert.equal(dealState(mk({ status: "draft" }), T), "hidden");
  assert.equal(dealState(mk({ confirmed: false }), T), "hidden");
  assert.equal(dealState(mk(), T), "active");
  assert.equal(dealState(mk({ startAt: T + 5000 }), T), "upcoming");
  assert.equal(dealState(mk({ count: 50 }), T), "soldout");
  assert.equal(dealState(mk({ endAt: T - 1, startAt: T - 5000 }), T), "ended");
  assert.equal(dealState(mk({ status: "paused" }), T), "paused");
});

test("danh sách cho khách: đang chạy trước, sắp mở, hết lượt; bỏ nháp, tạm dừng, đã kết thúc", () => {
  const list = [mk({ count: 50 }, "het"), mk({ startAt: T + 5000 }, "sap"), mk({}, "chay"), mk({ status: "draft" }, "nhap"), mk({ status: "paused" }, "dung"), mk({ status: "ended" }, "xong"), mk({ confirmed: false }, "chua-xn")];
  assert.deepEqual(visibleDeals(list, T).map((d) => d.id), ["chay", "sap", "het"]);
});

test("quản trị: không cho công bố khi đối tác chưa xác nhận; kiểm tra số lượt và thời gian", () => {
  assert.deepEqual(dealErrors(mk()), []);
  assert.equal(dealErrors({ ...mk(), confirmed: false }).length, 1);
  assert.equal(dealErrors({ ...mk(), confirmedNote: "" }).length, 1);
  assert.deepEqual(dealErrors({ ...mk(), status: "draft", confirmed: false, confirmedNote: "" }), []);
  assert.ok(dealErrors({ ...mk(), limit: 2 }).some((e) => e.includes("đã dùng")));
  assert.ok(dealErrors({ ...mk(), id: "Có Dấu" }).length >= 1);
});

test("mã đổi: 6 ký tự, không có chữ dễ nhầm", () => {
  for (let i = 0; i < 50; i++) assert.match(makeCode(), /^[A-HJ-NP-Z2-9]{6}$/);
});

test("mã đối tác cấp và trang đặt vé: làm sạch, chỉ nhận https", () => {
  const d = cleanDeal("mlt-10", { ...base, code: " DALATEVENT. MLT10 ", url: "https://maylangthang.com.vn/" })!;
  assert.equal(d.code, "DALATEVENT.MLT10");
  assert.equal(d.url, "https://maylangthang.com.vn/");
  assert.equal(cleanDeal("mlt-10", { ...base, url: "javascript:alert(1)" })!.url, "");
  assert.equal(cleanDeal("mlt-10", base)!.code, "");
});
