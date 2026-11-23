/**
 * Địa điểm: gom địa điểm Festival và điểm diễn show thành một danh sách có mã dùng được trong link,
 * và lọc những gì diễn ra tại một địa điểm. Không dùng gì của trình duyệt để chạy được trong kiểm thử.
 */
import type { AgendaItem } from "./agenda.ts";
import { fold } from "./search.ts";

export interface PlaceInfo {
  /** Mã trong link, ví dụ f-lam-vien, s-may-lang-thang-1 */
  id: string;
  kind: "festival" | "show";
  name: string;
  mapQuery: string;
  lat: number | null;
  lng: number | null;
  /** Với điểm diễn show: mã và tên sân khấu, nhãn của địa điểm trong lịch diễn */
  stageId?: string;
  stageName?: string;
  placeLabel?: string;
  /** Sân khấu chỉ có một địa điểm */
  only?: boolean;
}
interface InVenue { id: string; name: string; map_query: string; lat: number | null; lng: number | null }
interface InStage { id: string; name: string; places?: { label: string; name: string; map_query: string; lat: number | null; lng: number | null }[] }
interface InEvent { id: string; venue_id: string | null; venue_ids?: string[] }

export function listPlaces(venues: InVenue[], stages: InStage[]): PlaceInfo[] {
  const out: PlaceInfo[] = venues.map((v) => ({ id: "f-" + v.id, kind: "festival", name: v.name, mapQuery: v.map_query, lat: v.lat, lng: v.lng }));
  for (const st of stages) {
    const places = st.places && st.places.length ? st.places : [{ label: "", name: st.name, map_query: st.name + ", Đà Lạt", lat: null, lng: null }];
    places.forEach((pl, i) => out.push({ id: "s-" + st.id + "-" + i, kind: "show", name: pl.name, mapQuery: pl.map_query, lat: pl.lat, lng: pl.lng, stageId: st.id, stageName: st.name, placeLabel: pl.label, only: places.length === 1 }));
  }
  return out;
}

/**
 * Những mục trong lịch diễn ra tại địa điểm này.
 * - Địa điểm Festival: chương trình có venue_id hoặc venue_ids trỏ tới, và sự kiện khác có tên địa điểm chứa tên này.
 * - Điểm diễn show: các đêm của đúng sân khấu đó; sân khấu nhiều địa điểm thì so thêm nhãn địa điểm.
 */
export function itemsAt(place: PlaceInfo, events: InEvent[], agenda: AgendaItem[]): AgendaItem[] {
  if (place.kind === "show") {
    return agenda.filter((x) => x.kind === "show" && x.label === place.stageName && (place.only || x.venue === place.placeLabel));
  }
  const vid = place.id.slice(2);
  const here = new Set(events.filter((e) => e.venue_id === vid || (e.venue_ids || []).includes(vid)).map((e) => e.id));
  const name = fold(place.name);
  return agenda.filter((x) => (x.programId ? here.has(x.programId) : x.kind === "event" && fold(x.venue).includes(name)));
}
