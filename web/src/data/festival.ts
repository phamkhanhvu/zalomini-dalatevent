/**
 * Lớp chuyển dữ liệu: đọc sự kiện từ kho (data/events.json) và đưa về dạng các trang đang dùng.
 * Muốn sửa lịch, sửa data/events.json ở gốc repo, không sửa file này.
 */
import { EventRecord, getData, onDataChange } from "./store";

export type CatId = "le" | "tl" | "kg" | "ht";

export interface Category {
  id: CatId;
  label: string;
  color: string;
  tint: string;
}

export const CATEGORIES: Category[] = [
  { id: "le", label: "Lễ hội", color: "#E0218A", tint: "#FFE3F1" },
  { id: "tl", label: "Triển lãm", color: "#7B2CBF", tint: "#EFE2FA" },
  { id: "kg", label: "Không gian hoa", color: "#0B7A4B", tint: "#C9F2DA" },
  { id: "ht", label: "Hội thảo và thể thao", color: "#1D5FA8", tint: "#DCEEFF" },
];

const CAT_OF: Record<string, CatId> = {
  "le-hoi": "le",
  "am-nhac": "le",
  "trien-lam": "tl",
  "khong-gian-hoa": "kg",
  "hoi-thao-the-thao": "ht",
  "the-thao": "ht",
  workshop: "ht",
};

export interface Program {
  id: string;
  cat: CatId;
  title: string;
  desc: string;
  venue: string;
  /** Từ khoá tìm trên Google Maps. Bỏ trống nếu không có địa điểm cụ thể. */
  mapQuery?: string;
  /** ISO, giờ Việt Nam */
  start: string;
  end: string;
  /** Nhãn ngày hiển thị lớn, ví dụ "12.12" */
  day: string;
  /** Dòng phụ dưới ngày, ví dụ "đến 25.12" hoặc "20:00" */
  sub: string;
  tentative: boolean;
  note?: string;
  /** Link nguồn chính thức và ngày đối chiếu, nếu có */
  sourceUrl?: string;
  verifiedAt?: string;
}

export interface Venue {
  id: string;
  name: string;
  mapQuery: string;
  /** id các chương trình diễn ra tại đây */
  programs: string[];
  color: string;
  lat: number | null;
  lng: number | null;
}

export interface Happening {
  when: string;
  title: string;
  desc: string;
  live?: boolean;
}

const SERIES = "festival-hoa-da-lat-2026";
const dm = (iso: string) => iso.slice(8, 10) + "." + iso.slice(5, 7);
const dmy = (iso: string) => dm(iso) + "." + iso.slice(0, 4);

function toProgram(e: EventRecord, mapQuery: string | undefined, now: number): Program {
  const s = e.sessions[0];
  const start = new Date(s.start_at).getTime();
  const end = new Date(s.end_at).getTime();
  const sameDay = s.start_at.slice(0, 10) === s.end_at.slice(0, 10);
  const longRunning = s.all_day && end - start > 60 * 86400000 && start <= now && now <= end;
  let sub: string;
  if (!s.all_day) sub = s.start_at.slice(11, 16);
  else if (sameDay) sub = "trong ngày";
  else sub = "đến " + (s.start_at.slice(0, 4) === s.end_at.slice(0, 4) ? dm(s.end_at) : dmy(s.end_at));
  return {
    id: e.id,
    cat: CAT_OF[e.category] || "le",
    title: e.title,
    desc: e.description,
    venue: e.venue_name,
    mapQuery,
    start: s.start_at,
    end: s.end_at,
    day: longRunning ? "Từ nay" : dm(s.start_at),
    sub,
    tentative: e.tentative,
    note: e.note,
    sourceUrl: e.source_url || undefined,
    verifiedAt: e.verified_at || undefined,
  };
}

/** Thông tin Festival, lấy toàn bộ từ data/events.json (mục series và sự kiện khai mạc). Không viết cứng ở đây. */
export const FESTIVAL = {
  name: "Festival Hoa Đà Lạt",
  edition: "",
  editionShort: "",
  theme: "",
  place: "",
  /** Tổng số chương trình, hoạt động theo nguồn chính thức (0 nếu chưa có số liệu) */
  totalActivities: 0,
  /** Khoảng thời gian, ví dụ "12.12.2026 – 03.01.2027" */
  dateRange: "",
  start: "",
  opening: "",
  openingLabel: "",
  openingVenue: "",
  openingTentative: false,
  end: "",
  website: "https://dalatevent.com/",
  sourceUrl: "https://festivaldalat.lamdongtructuyen.vn/chuong-trinh/",
  hotline: "0986338656",
  hotlineLabel: "0986 338 656",
  updated: "",
};

/** Số liệu kỳ X (2024) để giới thiệu */
export const STATS_2024 = [
  { value: "2 triệu", label: "lượt khách" },
  { value: "3.600 tỷ", label: "đồng doanh thu xã hội (ước tính)" },
  { value: "10", label: "chương trình chính" },
  { value: "Gần 1 triệu", label: "chậu hoa trưng bày" },
];

export const PROGRAMS: Program[] = [];
export const VENUES: Venue[] = [];
export const HAPPENING_FALLBACK: Happening[] = [];

/** Dựng lại các danh sách từ kho dữ liệu (gọi lúc khởi động và mỗi khi có bản dữ liệu mới) */
export function rebuild(now = Date.now()) {
  const { events, happening } = getData();
  const venueById = new Map(events.venues.map((v) => [v.id, v]));
  const list = events.events.filter((e) => e.status === "published" && e.series === SERIES && e.sessions.length);

  const programs = list
    .map((e) => toProgram(e, e.venue_id ? venueById.get(e.venue_id)?.map_query : undefined, now))
    .sort((a, b) => a.start.localeCompare(b.start));
  PROGRAMS.splice(0, PROGRAMS.length, ...programs);

  const venues: Venue[] = [];
  for (const v of events.venues) {
    const at = list.filter((e) => e.venue_id === v.id || (e.venue_ids || []).includes(v.id));
    if (!at.length) continue;
    const cat = CATEGORIES.find((c) => c.id === (CAT_OF[at[0].category] || "le"))!;
    venues.push({ id: v.id, name: v.name, mapQuery: v.map_query, programs: at.map((e) => e.id), color: cat.color, lat: v.lat, lng: v.lng });
  }
  VENUES.splice(0, VENUES.length, ...venues);

  HAPPENING_FALLBACK.splice(0, HAPPENING_FALLBACK.length, ...happening.items);

  const series = events.series.find((x) => x.id === SERIES) as (typeof events.series)[number] & { edition?: string; edition_short?: string; theme?: string; place?: string; total_activities?: number } | undefined;
  const opening = list.find((e) => e.id === "khai-mac");
  FESTIVAL.name = series ? series.name.replace(/\s+lần thứ.*$/i, "") : FESTIVAL.name;
  FESTIVAL.edition = series?.edition || "";
  FESTIVAL.editionShort = series?.edition_short || "";
  FESTIVAL.theme = series?.theme || "";
  FESTIVAL.place = series?.place || "";
  FESTIVAL.totalActivities = series?.total_activities || 0;
  FESTIVAL.start = series ? series.start_at : "";
  FESTIVAL.end = series ? series.end_at : "";
  FESTIVAL.dateRange = series ? dmy(series.start_at) + " – " + dmy(series.end_at) : "";
  FESTIVAL.opening = opening ? opening.sessions[0].start_at : FESTIVAL.start;
  FESTIVAL.openingLabel = FESTIVAL.opening ? FESTIVAL.opening.slice(11, 16) + " · " + dmy(FESTIVAL.opening) : "";
  FESTIVAL.openingVenue = opening ? opening.venue_name : "";
  FESTIVAL.openingTentative = opening ? opening.tentative : false;
  FESTIVAL.updated = happening.updated_label || dmy(events.updated_at);
}

rebuild();
onDataChange(() => rebuild());
