import test from "node:test";
import assert from "node:assert/strict";
import { afternoon, bestCloudDay, cloudMorning, forecastUrl, parseForecast, plan } from "../src/utils/weather.ts";
import type { Hour } from "../src/utils/weather.ts";

function day(date: string, f: (h: number) => Partial<Hour>): Hour[] {
  return Array.from({ length: 24 }, (_, h) => ({
    time: `${date}T${String(h).padStart(2, "0")}:00`,
    temp: 15,
    rh: 80,
    dew: 11,
    pop: 0,
    rain: 0,
    low: 20,
    mid: 10,
    high: 10,
    wind: 10,
    code: 1,
    ...f(h),
  }));
}

test("sáng ẩm, lặng gió, trời trên quang, chiều trước có mưa: nhiều khả năng có mây", () => {
  const hours = [
    ...day("2026-12-01", (h) => (h >= 14 && h <= 17 ? { rain: 2, pop: 80 } : {})),
    ...day("2026-12-02", (h) => (h >= 4 && h <= 7 ? { rh: 97, dew: 14.6, wind: 4, low: 80, mid: 10, high: 5 } : {})),
  ];
  const c = cloudMorning(hours, "2026-12-02")!;
  assert.equal(c.level, "cao");
  assert.ok(c.score >= 90);
  assert.ok(c.reasons.includes("chiều tối hôm trước có mưa"));
});

test("sáng khô và gió mạnh: khó có mây", () => {
  const hours = day("2026-12-03", (h) => (h >= 4 && h <= 7 ? { rh: 70, dew: 8, wind: 25 } : {}));
  const c = cloudMorning(hours, "2026-12-03")!;
  assert.equal(c.level, "kho");
  assert.ok(c.score < 30);
});

test("mưa lúc sáng sớm kéo điểm xuống", () => {
  const dry = day("2026-12-04", (h) => (h >= 4 && h <= 7 ? { rh: 96, dew: 14.5, wind: 5, high: 5 } : {}));
  const wet = day("2026-12-04", (h) => (h >= 4 && h <= 7 ? { rh: 96, dew: 14.5, wind: 5, high: 5, rain: 1 } : {}));
  assert.ok(cloudMorning(wet, "2026-12-04")!.score < cloudMorning(dry, "2026-12-04")!.score);
});

test("thiếu dữ liệu buổi sáng thì không đoán", () => {
  assert.equal(cloudMorning(day("2026-12-05", () => ({})).filter((h) => Number(h.time.slice(11, 13)) > 8), "2026-12-05"), null);
});

test("chiều: dông thì ở trong nhà, mưa nhẹ thì mang áo mưa, khô thì đi chơi", () => {
  assert.equal(afternoon(day("2026-12-06", (h) => (h === 15 ? { code: 95, pop: 50 } : {})), "2026-12-06")!.kind, "indoor");
  assert.equal(afternoon(day("2026-12-06", (h) => (h === 15 ? { pop: 45 } : {})), "2026-12-06")!.kind, "raincoat");
  assert.equal(afternoon(day("2026-12-06", () => ({})), "2026-12-06")!.kind, "free");
});

test("đọc phản hồi Open-Meteo, lập kế hoạch và chọn sáng săn mây tốt nhất", () => {
  const h1 = day("2026-12-07", () => ({}));
  const h2 = day("2026-12-08", (h) => (h >= 4 && h <= 7 ? { rh: 96, dew: 14.6, wind: 4, high: 5, mid: 5 } : {}));
  const all = [...h1, ...h2];
  const j = {
    hourly: {
      time: all.map((h) => h.time),
      temperature_2m: all.map((h) => h.temp),
      relative_humidity_2m: all.map((h) => h.rh),
      dew_point_2m: all.map((h) => h.dew),
      precipitation_probability: all.map((h) => h.pop),
      precipitation: all.map((h) => h.rain),
      cloud_cover_low: all.map((h) => h.low),
      cloud_cover_mid: all.map((h) => h.mid),
      cloud_cover_high: all.map((h) => h.high),
      wind_speed_10m: all.map((h) => h.wind),
      weather_code: all.map((h) => h.code),
    },
    daily: { time: ["2026-12-07", "2026-12-08"], weather_code: [1, 3], temperature_2m_max: [22.4, 21.6], temperature_2m_min: [13.2, 12.5], precipitation_probability_max: [10, 20], sunrise: ["2026-12-07T05:58", "2026-12-08T05:59"] },
  };
  const { hours, days } = parseForecast(j);
  assert.equal(hours.length, 48);
  const p = plan(hours, days, "2026-12-07");
  assert.equal(p.length, 2);
  assert.equal(p[1].sunrise, "05:59");
  assert.equal(p[1].tmax, 22);
  assert.equal(bestCloudDay(p)!.date, "2026-12-08");
  assert.match(forecastUrl(), /timezone=Asia%2FBangkok/);
});

test("đã quá 7 giờ sáng thì không gợi ý săn mây sáng nay nữa", () => {
  const h = day("2026-12-09", (x) => (x >= 4 && x <= 7 ? { rh: 97, dew: 14.7, wind: 3, high: 5, mid: 5 } : {}));
  const p = plan(h, [{ date: "2026-12-09", code: 1, tmax: 22, tmin: 13, popMax: 0, sunrise: "2026-12-09T05:59" }], "2026-12-09");
  assert.equal(bestCloudDay(p, { date: "2026-12-09", hour: 9 }), null);
  assert.equal(bestCloudDay(p, { date: "2026-12-09", hour: 5 })!.date, "2026-12-09");
});
