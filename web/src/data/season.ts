/** Tiện ích mùa lễ hội trên bản đồ: gửi xe, nhà vệ sinh, y tế, phân luồng (data/festival-map.json) */
import { DATA_URL } from "./store";

export type SeasonKind = "parking" | "wc" | "medical";
export interface SeasonPoint { id: string; kind: SeasonKind; name: string; name_en: string; lat: number; lng: number; note: string; note_en: string; source: string }
export interface Closure { id: string; text: string; text_en: string; from?: string; to?: string; source?: string }
export interface SeasonDoc { schema: 1; updated: string; closures: Closure[]; closures_note: string; closures_note_en: string; points: SeasonPoint[] }

let cache: Promise<SeasonDoc> | null = null;
export function loadSeason(): Promise<SeasonDoc> {
  if (!cache) {
    cache = fetch(DATA_URL + "festival-map.json", { cache: "no-cache" })
      .then((r) => {
        if (!r.ok) throw new Error("season " + r.status);
        return r.json();
      })
      .then((d: SeasonDoc) => {
        if (d.schema !== 1 || !Array.isArray(d.points)) throw new Error("season schema");
        return d;
      })
      .catch((e) => {
        cache = null;
        throw e;
      });
  }
  return cache;
}
