/**
 * Tính khoảng cách và lọc địa điểm theo bán kính. Vị trí người dùng chỉ nằm trong bộ nhớ của trang,
 * không lưu lại và không gửi đi đâu. File này không dùng gì của trình duyệt để chạy được trong kiểm thử.
 */
export interface LatLng { lat: number; lng: number }
export interface GeoPlace { id: string; lat: number | null; lng: number | null }

/** Khoảng cách đường chim bay giữa hai điểm, tính bằng km */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371.0088;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface Ranked<T> { place: T; km: number | null }

/**
 * Xếp địa điểm theo khoảng cách tới điểm xuất phát và lọc theo bán kính (km; null = không giới hạn).
 * Địa điểm chưa có tọa độ không bị loại: trả về riêng trong `unknown` để vẫn hiển thị.
 */
export function rankPlaces<T extends GeoPlace>(places: T[], origin: LatLng | null, radiusKm: number | null): { near: Ranked<T>[]; unknown: T[]; hidden: number } {
  const known = places.filter((p) => typeof p.lat === "number" && typeof p.lng === "number");
  const unknown = places.filter((p) => !(typeof p.lat === "number" && typeof p.lng === "number"));
  if (!origin) return { near: known.map((place) => ({ place, km: null })), unknown, hidden: 0 };
  const ranked = known
    .map((place) => ({ place, km: distanceKm(origin, { lat: place.lat as number, lng: place.lng as number }) }))
    .sort((a, b) => a.km - b.km);
  const near = radiusKm == null ? ranked : ranked.filter((r) => r.km <= radiusKm);
  return { near, unknown, hidden: ranked.length - near.length };
}

/** "350 m" hoặc "2,4 km" */
export function formatKm(km: number): string {
  if (km < 1) return Math.max(10, Math.round((km * 1000) / 10) * 10) + " m";
  return (km < 10 ? km.toFixed(1) : String(Math.round(km))).replace(".", ",") + " km";
}
