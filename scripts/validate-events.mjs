#!/usr/bin/env node
/**
 * Kiểm tra data/events.json trước khi đưa lên web và app.
 * Lỗi (thoát mã 1): sai cấu trúc, trùng id, sai trạng thái, sai giờ, trỏ tới địa điểm không tồn tại.
 * Cảnh báo (không chặn): thiếu nguồn, chưa xác minh, thiếu tọa độ.
 * Chạy: npm run validate:data
 */
import fs from "node:fs";

const file = process.argv[2] || "data/events.json";
const STATUS = ["draft", "pending", "published", "postponed", "cancelled", "completed"];
const CATEGORY = ["le-hoi", "trien-lam", "khong-gian-hoa", "hoi-thao-the-thao", "am-nhac", "workshop", "the-thao", "khac"];
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+07:00$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

let doc;
try {
  doc = JSON.parse(fs.readFileSync(file, "utf8"));
} catch (e) {
  console.error(`Không đọc được ${file}: ${e.message}`);
  process.exit(1);
}

if (doc.schema !== 1) err(`schema phải là 1`);
if (doc.timezone !== "Asia/Ho_Chi_Minh") err(`timezone phải là Asia/Ho_Chi_Minh`);
if (!ISO.test(doc.updated_at || "")) err(`updated_at phải có dạng 2026-11-23T06:30:00+07:00`);
for (const k of ["series", "venues", "events"]) if (!Array.isArray(doc[k])) err(`thiếu danh sách ${k}`);

const unique = (list, name) => {
  const seen = new Set();
  for (const x of list || []) {
    if (!ID.test(x.id || "")) err(`${name}: id "${x.id}" phải là chữ thường không dấu, nối bằng gạch ngang`);
    if (seen.has(x.id)) err(`${name}: trùng id "${x.id}"`);
    seen.add(x.id);
  }
  return seen;
};
const seriesIds = unique(doc.series, "series");
const venueIds = unique(doc.venues, "venues");
unique(doc.events, "events");

for (const v of doc.venues || []) {
  if (!v.name) err(`venue ${v.id}: thiếu name`);
  const hasLat = typeof v.lat === "number", hasLng = typeof v.lng === "number";
  if (hasLat !== hasLng) err(`venue ${v.id}: lat và lng phải cùng có hoặc cùng trống`);
  if (hasLat && (v.lat < 11 || v.lat > 13 || v.lng < 107 || v.lng > 109.5)) err(`venue ${v.id}: tọa độ nằm ngoài vùng Lâm Đồng`);
  if (!hasLat) warn(`venue ${v.id}: chưa có tọa độ (cần cho bản đồ gần tôi)`);
}

for (const e of doc.events || []) {
  const at = `event ${e.id}`;
  if (!e.title) err(`${at}: thiếu title`);
  if (!STATUS.includes(e.status)) err(`${at}: status "${e.status}" không hợp lệ (${STATUS.join(", ")})`);
  if (!CATEGORY.includes(e.category)) err(`${at}: category "${e.category}" không hợp lệ (${CATEGORY.join(", ")})`);
  if (e.series && !seriesIds.has(e.series)) err(`${at}: series "${e.series}" không tồn tại`);
  if (e.venue_id && !venueIds.has(e.venue_id)) err(`${at}: venue_id "${e.venue_id}" không tồn tại`);
  for (const v of e.venue_ids || []) if (!venueIds.has(v)) err(`${at}: venue_ids có "${v}" không tồn tại`);
  if (!e.venue_id && !e.venue_name) err(`${at}: cần venue_id hoặc venue_name`);
  if (typeof e.tentative !== "boolean") err(`${at}: tentative phải là true hoặc false`);
  if (!Array.isArray(e.sessions) || !e.sessions.length) err(`${at}: cần ít nhất một suất trong sessions`);
  for (const [i, s] of (e.sessions || []).entries()) {
    if (!ISO.test(s.start_at || "") || !ISO.test(s.end_at || "")) err(`${at}: suất ${i + 1} sai dạng giờ (phải kết thúc bằng +07:00)`);
    else if (new Date(s.end_at) < new Date(s.start_at)) err(`${at}: suất ${i + 1} kết thúc trước khi bắt đầu`);
  }
  if (e.source_url != null && !/^https:\/\//.test(e.source_url)) err(`${at}: source_url phải bắt đầu bằng https://`);
  if (e.verified_at != null && !DAY.test(e.verified_at)) err(`${at}: verified_at phải có dạng 2026-11-23`);
  if (!ISO.test(e.updated_at || "")) err(`${at}: thiếu hoặc sai updated_at`);
  if ((e.status === "postponed" || e.status === "cancelled") && !e.note) err(`${at}: sự kiện hoãn/hủy phải có note giải thích`);
  if (e.status === "published") {
    if (!e.source_url && !e.source_note) err(`${at}: sự kiện đã công bố phải có source_url hoặc source_note`);
    if (!e.source_url) warn(`${at}: chưa có link nguồn (source_url)`);
    if (!e.verified_at) warn(`${at}: chưa xác minh (verified_at)`);
  }
}

for (const w of warnings) console.log(`cảnh báo  ${w}`);
for (const m of errors) console.error(`LỖI       ${m}`);
console.log(`\n${file}: ${(doc.events || []).length} sự kiện, ${(doc.venues || []).length} địa điểm, ${errors.length} lỗi, ${warnings.length} cảnh báo`);
process.exit(errors.length ? 1 : 0);
