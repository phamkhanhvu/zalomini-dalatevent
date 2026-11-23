/**
 * Kho dữ liệu của site: sự kiện, lịch show, mục "đang diễn ra".
 * Thứ tự ưu tiên: bản tải mới nhất đã lưu trên máy > bản đóng gói sẵn lúc build.
 * Mỗi lần mở, site tải bản mới ở nền để dùng cho lần sau (và dùng ngay nếu tải kịp).
 */
import eventsBundled from "./bundled/events.json";
import showsBundled from "./bundled/shows.json";
import happeningBundled from "./bundled/happening.json";
import { IS_NATIVE } from "../utils/device";

export interface EventSession { start_at: string; end_at: string; all_day: boolean; end_estimated?: boolean }
export interface EventRecord {
  id: string; series?: string; title: string; category: string; description: string;
  venue_id: string | null; venue_ids?: string[]; venue_name: string;
  status: string; tentative: boolean; sessions: EventSession[];
  source_url: string | null; source_note?: string; verified_at: string | null; updated_at: string;
  note?: string; organizer?: string;
}
export interface VenueRecord { id: string; name: string; map_query: string; lat: number | null; lng: number | null }
export interface EventsDoc { schema: number; updated_at: string; series: { id: string; name: string; start_at: string; end_at: string }[]; venues: VenueRecord[]; events: EventRecord[] }

export interface ShowItem { date?: string; time: string; title: string; url: string; place?: string; price?: string; weekday?: number; weekday_label?: string; note?: string }
export interface StagePlace { label: string; name: string; map_query: string; lat: number | null; lng: number | null }
export interface Stage { places?: StagePlace[]; id: string; name: string; kind: "dated" | "weekly"; source_url: string; verified_at: string; intro: string; address: string; phone?: string; phone_label?: string; cta_label: string; items: ShowItem[] }
export interface ShowsDoc { schema: number; updated_at: string; stages: Stage[] }

export interface HappeningItem { when: string; title: string; desc: string; start_date: string; end_date: string; venue?: string }
export interface HappeningDoc { schema: number; updated_at: string; updated_label: string; items: HappeningItem[] }

export interface DataSet { events: EventsDoc; shows: ShowsDoc; happening: HappeningDoc }

const CACHE_KEY = "dalatevent.data.v1";
/** Nơi tải dữ liệu mới. Web: cùng máy chủ với site. App iOS: bản công khai trên GitHub (đổi bằng VITE_DATA_URL khi site đã có tên miền). */
const DATA_URL: string =
  (import.meta.env.VITE_DATA_URL as string | undefined) ||
  (IS_NATIVE ? "https://raw.githubusercontent.com/phamkhanhvu/zalomini-dalatevent/main/data/" : "./data/");

const bundled: DataSet = {
  events: eventsBundled as unknown as EventsDoc,
  shows: showsBundled as unknown as ShowsDoc,
  happening: happeningBundled as unknown as HappeningDoc,
};

let current: DataSet = bundled;
/** true khi dữ liệu đang dùng là bản tải từ mạng (không phải bản đóng gói) */
let fromNetwork = false;
const listeners = new Set<() => void>();

export function getData(): DataSet {
  return current;
}
export function isFromNetwork() {
  return fromNetwork;
}
export function onDataChange(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function valid(d: Partial<DataSet> | null): d is DataSet {
  return !!d && d.events?.schema === 1 && Array.isArray(d.events.events) && d.shows?.schema === 1 && Array.isArray(d.shows.stages) && d.happening?.schema === 1 && Array.isArray(d.happening.items);
}
function stamp(d: DataSet) {
  return [d.events.updated_at, d.shows.updated_at, d.happening.updated_at].sort().pop() as string;
}
function apply(d: DataSet, network: boolean) {
  current = d;
  fromNetwork = network;
  listeners.forEach((fn) => fn());
}

async function fetchJson(name: string, signal: AbortSignal) {
  const res = await fetch(DATA_URL + name, { signal, cache: "no-cache" });
  if (!res.ok) throw new Error(name + " " + res.status);
  return res.json();
}

async function refresh(): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 8000);
  try {
    const [events, shows, happening] = await Promise.all([
      fetchJson("events.json", ctrl.signal),
      fetchJson("shows.json", ctrl.signal),
      fetchJson("happening.json", ctrl.signal),
    ]);
    const d = { events, shows, happening };
    if (!valid(d)) return false;
    if (stamp(d) < stamp(bundled)) return false; // bản trên mạng cũ hơn bản đóng gói: bỏ qua
    try {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(d));
    } catch (e) {
      /* hết chỗ lưu: vẫn dùng được cho lần mở này */
    }
    apply(d, true);
    return true;
  } catch (e) {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * Gọi một lần trước khi vẽ giao diện. Dùng ngay bản đã lưu (nếu mới hơn bản đóng gói),
 * rồi chờ bản mới tối đa `waitMs`; quá hạn thì vẽ luôn, bản mới sẽ áp dụng khi về tới.
 */
export async function initData(waitMs = 1500) {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    const cached = raw ? JSON.parse(raw) : null;
    if (valid(cached) && stamp(cached) >= stamp(bundled)) apply(cached, true);
  } catch (e) {
    /* bản lưu hỏng: bỏ qua */
  }
  await Promise.race([refresh(), new Promise((r) => window.setTimeout(r, waitMs))]);
}
