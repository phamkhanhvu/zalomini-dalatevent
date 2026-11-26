/**
 * Top list Đà Lạt: danh sách địa điểm theo chủ đề (data/toplist.json, nhập từ bảng "200 Top List").
 * Tệp khá lớn nên chỉ tải khi mở trang Top list, không đóng gói sẵn vào app.
 */
import { DATA_URL } from "./store";

export interface TopGroup { id: string; name: string; name_en: string }
export interface TopList { id: string; group: string; name: string; name_en: string; count: number }
export interface TopPlace {
  id: string;
  list: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  desc: string;
  desc_en?: string;
  clip: string;
  img?: boolean;
}
export interface TopDoc { schema: number; updated_at: string; groups: TopGroup[]; lists: TopList[]; places: TopPlace[] }

let cache: Promise<TopDoc> | null = null;

export function loadToplist(): Promise<TopDoc> {
  if (!cache) {
    cache = fetch(DATA_URL + "toplist.json", { cache: "no-cache" })
      .then((r) => {
        if (!r.ok) throw new Error("toplist " + r.status);
        return r.json() as Promise<TopDoc>;
      })
      .then((d) => {
        if (d.schema !== 1 || !Array.isArray(d.places)) throw new Error("toplist schema");
        return d;
      })
      .catch((e) => {
        cache = null;
        throw e;
      });
  }
  return cache;
}

export const topImage = (p: TopPlace) => (p.img ? DATA_URL + "toplist-img/" + p.id + ".webp" : "");
