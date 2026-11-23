#!/usr/bin/env node
/**
 * Chép dữ liệu từ thư mục data/ ở gốc repo (nguồn chung cho web, app iOS, Zalo Mini App)
 * vào gói web: public/data (để web tải bản mới khi chạy) và src/data/bundled (bản đóng gói sẵn).
 * Nếu gói web được tách riêng, không có ../data, thì dùng luôn bản đang có trong gói.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(here, "../../data");
const targets = [path.join(here, "../public/data"), path.join(here, "../src/data/bundled")];
const files = ["events.json", "shows.json", "happening.json", "places.json"];

if (!fs.existsSync(src)) {
  console.log("Không thấy ../data, dùng dữ liệu đang có trong gói web.");
  process.exit(0);
}
for (const dir of targets) {
  fs.mkdirSync(dir, { recursive: true });
  for (const f of files) fs.copyFileSync(path.join(src, f), path.join(dir, f));
  // Trạng thái nội dung quản trị: chỉ cần cho bản tải khi chạy
  if (dir.endsWith("public/data") && fs.existsSync(path.join(src, "cms-status.json"))) fs.copyFileSync(path.join(src, "cms-status.json"), path.join(dir, "cms-status.json"));
}
console.log(`Đã chép ${files.length} tệp dữ liệu vào gói web.`);
