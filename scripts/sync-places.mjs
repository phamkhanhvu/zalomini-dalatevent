#!/usr/bin/env node
/**
 * Lấy danh mục địa điểm từ cẩm nang "Đà Lạt Đi Đâu" của Sense Group (https://sensegroup.vn/di-da-lat/)
 * về data/places.json để trợ lý "Hôm nay đi đâu?" gợi ý lịch trình. Chỉ giữ các trường cần dùng, bỏ nhóm Lưu trú.
 * Chạy tay khi cẩm nang đổi nhiều: node scripts/sync-places.mjs
 */
import fs from "node:fs";

const ROOT = "https://sensegroup.vn/di-da-lat/";
const get = async (u) => {
  const r = await fetch(u, { headers: { "user-agent": "Mozilla/5.0 (DalatEvent data sync)" } });
  if (!r.ok) throw new Error(u + ": HTTP " + r.status);
  return r.text();
};
const html = await get(ROOT);
const hash = (html.match(/app-([0-9a-f]+)\.js/) || [])[1];
if (!hash) throw new Error("Không tìm thấy tệp app-<mã>.js trên trang");
const js = await get(ROOT + "places-" + hash + ".js");
const m = js.match(/export const places\s*=\s*(\[[\s\S]*\])\s*;?\s*$/);
if (!m) throw new Error("Không đọc được danh sách places");
const places = JSON.parse(m[1]);

const txt = (s, max) => String(s || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
const fold = (x) => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
/** Phân loại nhóm Ẩm thực: shop = mua đặc sản, quà; cafe = cà phê, trà; snack = món ăn vặt, đồ ngọt, đồ uống; eat = quán ăn hợp cho bữa chính */
const subOf = (p) => {
  if (p.cat !== "Ẩm thực") return undefined;
  const name = fold(p.name);
  const t = fold(p.desc.slice(0, 40)) + " " + name;
  if (/diem mua dac san|dac san|qua tang|\bmut\b|cho da lat/.test(t)) return "shop";
  if (/ca phe|cafe|coffee|tiem tra|\btra\b|\btea\b|\bpub\b|\bbar\b/.test(t)) return "cafe";
  if (/\b(che|sua|kem|tra sua|banh trang|yaourt|sinh to|nuoc ep|banh ngot|bakery|banh mi|banh bao|xien|an vat|dau tay|bap nuong|khoai)\b/.test(name)) return "snack";
  return "eat";
};
const ids = new Set(places.map((p) => p.id));
const out = places
  .filter((p) => p.cat !== "Lưu trú" && /^[a-z0-9-]+$/.test(p.id))
  .map((p) => {
    const o = { id: p.id, name: txt(p.name, 80), cat: p.cat, sub: subOf(p), area: p.area ? txt(p.area, 40) : undefined, address: txt(p.address, 140), mapQuery: txt(p.mapQuery, 200), duration: p.duration ? txt(p.duration, 60) : undefined, timing: p.timing ? txt(p.timing, 80) : undefined, intro: txt(p.intro || p.desc, 200), related: (p.related || []).filter((r) => ids.has(r)).slice(0, 3) };
    for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k];
    return o;
  });
const d = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
fs.writeFileSync("data/places.json", JSON.stringify({ schema: 1, source: ROOT, source_note: "Cẩm nang Đà Lạt Đi Đâu của Sense Group. Một phần vị trí lấy từ OpenStreetMap.", attribution: "© OpenStreetMap contributors (ODbL 1.0)", synced_at: d, places: out }) + "\n");
const by = {};
for (const p of out) by[p.cat + (p.sub ? "/" + p.sub : "")] = (by[p.cat + (p.sub ? "/" + p.sub : "")] || 0) + 1;
console.log(`Đã ghi data/places.json: ${out.length} địa điểm`, by);
