import { storage } from "../utils/device";
import { forecastUrl, Hour, DayRaw, OpenMeteo, parseForecast } from "../utils/weather";

const KEY = "dlev.weather";
const FRESH_MS = 60 * 60 * 1000;

export interface Forecast {
  hours: Hour[];
  days: DayRaw[];
  fetchedAt: number;
}

/** Dự báo Open-Meteo cho Đà Lạt, giữ trên máy 1 giờ; mất mạng thì dùng bản đã lưu (kèm giờ lấy) */
export async function getForecast(): Promise<Forecast> {
  let cached: Forecast | null = null;
  try {
    cached = JSON.parse(storage.get(KEY) || "null");
  } catch (e) {
    cached = null;
  }
  if (cached && Date.now() - cached.fetchedAt < FRESH_MS) return cached;
  try {
    const res = await fetch(forecastUrl(7));
    if (!res.ok) throw new Error("HTTP " + res.status);
    const f: Forecast = { ...parseForecast((await res.json()) as OpenMeteo), fetchedAt: Date.now() };
    if (!f.days.length) throw new Error("empty");
    storage.set(KEY, JSON.stringify(f));
    return f;
  } catch (e) {
    if (cached) return cached;
    throw e;
  }
}
