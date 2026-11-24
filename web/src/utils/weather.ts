/**
 * Thời tiết và săn mây Đà Lạt: đọc dự báo theo giờ của Open-Meteo (miễn phí, không cần khóa)
 * rồi ước tính khả năng có biển mây buổi sáng và lời khuyên cho buổi chiều.
 * Đây là ƯỚC TÍNH theo quy tắc kinh nghiệm (độ ẩm, điểm sương, gió, mây), không phải dự báo chính thức.
 * Không dùng gì của trình duyệt để chạy được trong kiểm thử tự động.
 */

export const DALAT = { lat: 11.9404, lon: 108.4583 };

export function forecastUrl(days = 7): string {
  const hourly = ["temperature_2m", "relative_humidity_2m", "dew_point_2m", "precipitation_probability", "precipitation", "cloud_cover_low", "cloud_cover_mid", "cloud_cover_high", "wind_speed_10m", "weather_code"].join(",");
  const daily = ["weather_code", "temperature_2m_max", "temperature_2m_min", "precipitation_probability_max", "sunrise"].join(",");
  return `https://api.open-meteo.com/v1/forecast?latitude=${DALAT.lat}&longitude=${DALAT.lon}&hourly=${hourly}&daily=${daily}&timezone=Asia%2FBangkok&forecast_days=${days}&past_days=1`;
}

export interface Hour {
  time: string; // "2026-11-25T05:00" giờ Việt Nam
  temp: number;
  rh: number;
  dew: number;
  pop: number;
  rain: number;
  low: number;
  mid: number;
  high: number;
  wind: number;
  code: number;
}

export interface DayRaw {
  date: string;
  code: number;
  tmax: number;
  tmin: number;
  popMax: number;
  sunrise: string; // "2026-11-25T05:52"
}

type Num = (number | null)[];
export interface OpenMeteo {
  hourly?: Record<string, Num | string[]>;
  daily?: Record<string, Num | string[]>;
}

const n = (v: unknown, d = NaN) => (typeof v === "number" && Number.isFinite(v) ? v : d);

/** Đọc phản hồi Open-Meteo thành danh sách giờ và ngày; bỏ những dòng thiếu dữ liệu chính */
export function parseForecast(j: OpenMeteo): { hours: Hour[]; days: DayRaw[] } {
  const h = j.hourly || {};
  const t = (h.time as string[]) || [];
  const col = (k: string) => (h[k] as Num) || [];
  const hours: Hour[] = [];
  t.forEach((time, i) => {
    const rh = n(col("relative_humidity_2m")[i]);
    const temp = n(col("temperature_2m")[i]);
    if (!Number.isFinite(rh) || !Number.isFinite(temp)) return;
    hours.push({
      time,
      temp,
      rh,
      dew: n(col("dew_point_2m")[i], temp - 3),
      pop: n(col("precipitation_probability")[i], 0),
      rain: n(col("precipitation")[i], 0),
      low: n(col("cloud_cover_low")[i], 0),
      mid: n(col("cloud_cover_mid")[i], 0),
      high: n(col("cloud_cover_high")[i], 0),
      wind: n(col("wind_speed_10m")[i], 0),
      code: n(col("weather_code")[i], 0),
    });
  });
  const d = j.daily || {};
  const dt = (d.time as string[]) || [];
  const dc = (k: string) => (d[k] as Num) || [];
  const days: DayRaw[] = dt.map((date, i) => ({
    date,
    code: n(dc("weather_code")[i], 0),
    tmax: n(dc("temperature_2m_max")[i]),
    tmin: n(dc("temperature_2m_min")[i]),
    popMax: n(dc("precipitation_probability_max")[i], 0),
    sunrise: String(((d.sunrise as string[]) || [])[i] || ""),
  }));
  return { hours, days };
}

const avg = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
const hourOf = (h: Hour) => Number(h.time.slice(11, 13));
const inRange = (hours: Hour[], date: string, from: number, to: number) => hours.filter((h) => h.time.slice(0, 10) === date && hourOf(h) >= from && hourOf(h) <= to);
function prevDate(date: string): string {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export type CloudLevel = "cao" | "kha" | "thap" | "kho";
export interface CloudMorning {
  score: number; // 0–100
  level: CloudLevel;
  reasons: string[];
}

/**
 * Khả năng có biển mây sáng sớm (4h–7h) của một ngày.
 * Mây thường hình thành khi đêm lặng gió, không khí gần bão hòa (độ ẩm cao, nhiệt độ sát điểm sương),
 * trời phía trên quang để thấy bình minh, và thường dễ có hơn sau một chiều tối có mưa.
 * Trả null nếu thiếu dữ liệu buổi sáng của ngày đó.
 */
export function cloudMorning(hours: Hour[], date: string): CloudMorning | null {
  const m = inRange(hours, date, 4, 7);
  if (m.length < 2) return null;
  const rh = avg(m.map((h) => h.rh));
  const spread = avg(m.map((h) => h.temp - h.dew));
  const wind = avg(m.map((h) => h.wind));
  const low = avg(m.map((h) => h.low));
  const upper = avg(m.map((h) => Math.max(h.mid, h.high)));
  const rainNow = m.reduce((s, h) => s + h.rain, 0);
  const rainBefore = inRange(hours, prevDate(date), 12, 23).reduce((s, h) => s + h.rain, 0);

  let score = 0;
  const reasons: string[] = [];
  if (rh >= 95) { score += 35; reasons.push("độ ẩm rất cao"); }
  else if (rh >= 90) { score += 25; reasons.push("độ ẩm cao"); }
  else if (rh >= 85) score += 10;
  else reasons.push("không khí khá khô");

  if (spread <= 1) score += 15;
  else if (spread <= 2) score += 8;

  if (wind <= 8) { score += 15; reasons.push("lặng gió"); }
  else if (wind <= 14) score += 7;
  else if (wind > 20) { score -= 10; reasons.push("gió mạnh"); }

  if (low >= 60) score += 10;

  if (upper <= 30) { score += 15; reasons.push("trời phía trên quang"); }
  else if (upper >= 70) { score -= 10; reasons.push("mây dày phía trên, khó thấy bình minh"); }

  if (rainNow > 0.5) { score -= 25; reasons.push("có mưa lúc sáng sớm"); }
  if (rainBefore >= 1) { score += 10; reasons.push("chiều tối hôm trước có mưa"); }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const level: CloudLevel = score >= 70 ? "cao" : score >= 50 ? "kha" : score >= 30 ? "thap" : "kho";
  return { score, level, reasons };
}

export const CLOUD_LABEL: Record<CloudLevel, string> = { cao: "Nhiều khả năng có mây", kha: "Có thể có mây", thap: "Ít khả năng", kho: "Khó có mây" };

export type Afternoon = "indoor" | "raincoat" | "free";
export interface AfternoonAdvice {
  kind: Afternoon;
  pop: number;
  thunder: boolean;
}
/** Buổi chiều (13h–18h): nên ở trong nhà, mang áo mưa, hay đi chơi thoải mái */
export function afternoon(hours: Hour[], date: string): AfternoonAdvice | null {
  const a = inRange(hours, date, 13, 18);
  if (a.length < 2) return null;
  const pop = Math.max(...a.map((h) => h.pop));
  const rain = a.reduce((s, h) => s + h.rain, 0);
  const thunder = a.some((h) => h.code >= 95);
  const kind: Afternoon = thunder || pop >= 70 || rain >= 5 ? "indoor" : pop >= 40 || rain >= 1 ? "raincoat" : "free";
  return { kind, pop, thunder };
}
export const AFTERNOON_LABEL: Record<Afternoon, string> = { indoor: "Chiều nên ở trong nhà", raincoat: "Chiều mang theo áo mưa", free: "Chiều đi chơi thoải mái" };

/** Mô tả ngắn theo mã thời tiết WMO */
export function codeLabel(code: number): string {
  if (code === 0) return "Trời quang";
  if (code <= 2) return "Ít mây";
  if (code === 3) return "Nhiều mây";
  if (code === 45 || code === 48) return "Sương mù";
  if (code >= 51 && code <= 57) return "Mưa phùn";
  if (code >= 61 && code <= 67) return "Mưa";
  if (code >= 80 && code <= 82) return "Mưa rào";
  if (code >= 95) return "Dông";
  return "Nhiều mây";
}

export interface DayPlan {
  date: string;
  sunrise: string; // "05:52"
  tmin: number;
  tmax: number;
  label: string;
  cloud: CloudMorning | null;
  after: AfternoonAdvice | null;
}
/** Kế hoạch từng ngày từ hôm nay (theo ngày `today` giờ Việt Nam) trở đi */
export function plan(hours: Hour[], days: DayRaw[], today: string): DayPlan[] {
  return days
    .filter((d) => d.date >= today)
    .map((d) => ({
      date: d.date,
      sunrise: d.sunrise.slice(11, 16),
      tmin: Math.round(d.tmin),
      tmax: Math.round(d.tmax),
      label: codeLabel(d.code),
      cloud: cloudMorning(hours, d.date),
      after: afternoon(hours, d.date),
    }));
}

/** Sáng nên đi săn mây nhất trong các ngày tới (điểm cao nhất, ít nhất "Có thể"); không có thì null */
export function bestCloudDay(days: DayPlan[], afterNow?: { date: string; hour: number }): DayPlan | null {
  const ok = days.filter((d) => d.cloud && d.cloud.score >= 50 && !(afterNow && d.date === afterNow.date && afterNow.hour >= 7));
  return ok.sort((a, b) => b.cloud!.score - a.cloud!.score || a.date.localeCompare(b.date))[0] || null;
}
