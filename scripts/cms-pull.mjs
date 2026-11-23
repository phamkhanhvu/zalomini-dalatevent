#!/usr/bin/env node
/**
 * Lấy nội dung mà quản trị viên đã lưu trên trang quản trị (Firestore, bộ sưu tập "cms", ai cũng đọc được,
 * chỉ quản trị viên ghi được) rồi áp vào data/*.json sau khi kiểm tra. Chạy bởi .github/workflows/cms.yml.
 * Không cần khóa bí mật nào.
 */
import fs from "node:fs";
import { applyCms, FILES } from "./cms-apply.mjs";

const BASE = "https://firestore.googleapis.com/v1/projects/quay-hang-da-lat/databases/(default)/documents/cms/";
const read = (p, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    return fallback;
  }
};
const write = (p, o) => fs.writeFileSync(p, JSON.stringify(o, null, 2) + "\n");

const incoming = {};
for (const f of FILES) {
  const res = await fetch(BASE + f);
  if (res.status === 404) continue;
  if (!res.ok) {
    console.error(`Không đọc được cms/${f}: HTTP ${res.status}. Dừng, không sửa gì.`);
    process.exit(1);
  }
  const d = (await res.json()).fields || {};
  incoming[f] = { json: d.json && d.json.stringValue, savedAt: Number((d.savedAt && (d.savedAt.integerValue || d.savedAt.doubleValue)) || NaN), byName: d.byName && d.byName.stringValue };
}

const current = { events: read("data/events.json"), shows: read("data/shows.json"), happening: read("data/happening.json") };
const status = read("data/cms-status.json", { schema: 1, files: {} });
const r = applyCms(current, incoming, status, Date.now());
for (const f of r.changed) write(`data/${f}.json`, r.next[f]);
if (r.statusChanged) write("data/cms-status.json", r.status);
console.log(r.notes.length ? r.notes.join("\n") : "Không có nội dung mới từ trang quản trị.");
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `message=Quản trị: ${r.notes.join("; ").slice(0, 180) || "cập nhật trạng thái"}\n`);
