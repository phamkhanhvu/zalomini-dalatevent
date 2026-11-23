#!/usr/bin/env node
/**
 * Kiểm tra data/events.json, shows.json, happening.json trước khi đưa lên web và app.
 * Lỗi (thoát mã 1): sai cấu trúc, trùng id, sai trạng thái, sai giờ, trỏ tới địa điểm không tồn tại.
 * Cảnh báo (không chặn): thiếu nguồn, chưa xác minh, thiếu tọa độ.
 * Luật kiểm tra nằm ở scripts/validate-core.mjs.
 */
import fs from "node:fs";
import { validate } from "./validate-core.mjs";

const file = process.argv[2] || "data/events.json";
const dir = file.replace(/[^/]*$/, "");
const pre = [];
const read = (path, name) => {
  try {
    return JSON.parse(fs.readFileSync(path, "utf8"));
  } catch (e) {
    pre.push(`${name}: không đọc được (${e.message})`);
    return null;
  }
};
const doc = read(file, "events.json");
const shows = read(dir + "shows.json", "shows.json");
const hap = read(dir + "happening.json", "happening.json");
const r = validate(doc, shows, hap);
const errors = [...pre, ...r.errors];
for (const w of r.warnings) console.log(`cảnh báo  ${w}`);
for (const m of errors) console.error(`LỖI       ${m}`);
console.log(`\n${file}: ${((doc && doc.events) || []).length} sự kiện, ${((doc && doc.venues) || []).length} địa điểm, ${r.showCount} dòng lịch show, ${hap ? (hap.items || []).length : 0} mục đang diễn ra, ${errors.length} lỗi, ${r.warnings.length} cảnh báo`);
process.exit(errors.length ? 1 : 0);
