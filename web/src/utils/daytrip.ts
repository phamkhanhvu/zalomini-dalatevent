/**
 * Dựng lịch trình gợi ý theo buổi (sáng, trưa, chiều, tối) cho trợ lý "Hôm nay đi đâu?".
 * Điểm tham quan và quán lấy từ data/places.json (cẩm nang Đà Lạt Đi Đâu của Sense Group);
 * sự kiện và show lấy từ dữ liệu DalatEvent đã đối chiếu, đặt đúng giờ thật của chúng.
 * Không gọi mạng, không dùng gì của trình duyệt. Cùng một câu hỏi, cùng ngày, cùng "seed" thì ra cùng kết quả.
 */
import type { AgendaItem } from "./agenda.ts";
import { addDays, DAY_MS, vnDate, vnMidnight, vnTime } from "./agenda.ts";
import type { Ask } from "./assistant.ts";
import { fold } from "./search.ts";
import { tr } from "../i18n.ts";

export interface GuidePlace { id: string; name: string; cat: string; sub?: string; area?: string; address: string; mapQuery: string; duration?: string; timing?: string; intro: string; related: string[] }
export type Part = "Sáng" | "Trưa" | "Chiều" | "Tối";
const PART_EN: Record<Part, string> = { Sáng: "Morning", Trưa: "Noon", Chiều: "Afternoon", Tối: "Evening" };
/** Tên buổi theo ngôn ngữ hiện tại */
export const partLabel = (p: Part) => tr(p, PART_EN[p]);
/** Lời giới thiệu điểm tham quan chỉ có tiếng Việt (từ cẩm nang); ở tiếng Anh dùng câu chung */
const introOf = (p: { intro?: string }) => tr(p.intro || "", "A pick from the Da Lat Di Dau guide by Sense Group.");
export interface Stop {
  /** Thời điểm gợi ý (mili giây); với sự kiện là giờ bắt đầu thật */
  at: number;
  time: string;
  part: Part;
  kind: "sight" | "eat" | "cafe" | "event" | "walk";
  title: string;
  note: string;
  /** Một hoặc hai lựa chọn địa điểm cho điểm dừng này */
  places: GuidePlace[];
  /** Sự kiện hoặc show thật (kind = event) */
  item?: AgendaItem;
}
export interface DayPlan { date: string; stops: Stop[] }

const H = 3600000;
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
/** Xáo trộn có thể lặp lại: thứ tự chỉ phụ thuộc vào khóa */
const shuffled = <T extends { id: string }>(list: T[], key: string) => [...list].sort((a, b) => hash(key + a.id) - hash(key + b.id) || a.id.localeCompare(b.id));

const FLOWER = /\b(hoa|vuon|cam tu cau|mai anh dao|doi che|garden|co hong)\b/;
const CENTER = "Xuân Hương";

/**
 * ask: câu hỏi đã phân tích. events: sự kiện/show khớp câu hỏi (đã lọc theo sở thích, ngân sách, còn diễn ra).
 * Tối đa 2 ngày. Buổi nào đã qua (so với giờ hiện tại hoặc khoảng thời gian được hỏi) thì bỏ.
 */
export function buildPlan(ask: Ask, events: AgendaItem[], places: GuidePlace[], now: number, seed = 0): DayPlan[] {
  const from = Math.max(ask.from, now);
  const firstDay = vnDate(from);
  const days = [firstDay];
  if (ask.to - vnMidnight(firstDay) > DAY_MS + H) days.push(addDays(firstDay, 1));
  const byId = new Map(places.map((p) => [p.id, p]));
  const sights = places.filter((p) => p.cat !== "Ẩm thực" && p.duration);
  const food = (sub: string) => places.filter((p) => p.sub === sub && p.area === CENTER);
  const used = new Set<string>();
  const family = (ask.people || 0) >= 3;
  const wantsFlower = ask.interests.includes("flower");

  return days.map((date, di) => {
    const key = date + ":" + seed + ":" + di;
    const t0 = vnMidnight(date);
    const open = (hour: number, slack = 0.5) => t0 + hour * H >= from - slack * H && t0 + hour * H < ask.to;
    const stops: Stop[] = [];
    const add = (hour: number, part: Part, kind: Stop["kind"], title: string, note: string, list: GuidePlace[], item?: AgendaItem) => {
      const at = item && !item.allDay ? item.start : t0 + hour * H;
      stops.push({ at, time: vnTime(at), part, kind, title, note, places: list, item });
      for (const p of list) used.add(p.id);
    };
    const pickSight = (cats: string[], prefer?: (p: GuidePlace) => boolean) => {
      const pool = shuffled(sights.filter((p) => cats.includes(p.cat) && !used.has(p.id)), key + cats.join());
      return (prefer && pool.find(prefer)) || pool[0];
    };
    const pickFood = (sub: string, n: number, tag: string) => shuffled(food(sub).filter((p) => !used.has(p.id)), key + tag).slice(0, n);

    const today = events.filter((e) => e.end > Math.max(t0, from) && e.start < t0 + DAY_MS);
    const timed = today.filter((e) => !e.allDay && e.start >= t0).sort((a, b) => a.start - b.start);
    const evening = timed.find((e) => e.start >= t0 + 16.5 * H && e.start >= from);
    // Sự kiện cả ngày đáng ghé: bỏ các đợt kéo dài nhiều tuần (chiến dịch, mùa hoa) vì không phải một điểm đến trong ngày
    const allDay = today.filter((e) => e.allDay && e.end - e.start <= 14 * DAY_MS);

    // Sáng: một điểm tham quan, thêm một điểm liền kề nếu cẩm nang có ghi là gần nhau
    if (open(8.5)) {
      const a = pickSight(["Thiên nhiên", "Văn hóa"], wantsFlower ? (p) => FLOWER.test(fold(p.name)) : undefined);
      if (a) {
        add(8.5, "Sáng", "sight", a.name, introOf(a), [a]);
        const b = a.related.map((id) => byId.get(id)).find((p): p is GuidePlace => !!p && !!p.duration && p.cat !== "Ẩm thực" && !used.has(p.id));
        if (b && open(10.25)) add(10.25, "Sáng", "sight", b.name, introOf(b), [b]);
      }
    }
    if (open(11.75)) {
      const f = pickFood("eat", 2, "lunch");
      if (f.length) add(11.75, "Trưa", "eat", tr("Ăn trưa quanh trung tâm", "Lunch in the centre"), tr("Hai quán trong khu " + CENTER + " để bạn chọn. Xem thực đơn và hỏi chỗ trước khi ghé.", "Two places around " + CENTER + " to choose from. Check the menu and ask about seats before you go."), f);
    }
    // Chiều: ưu tiên sự kiện diễn ra cả ngày (triển lãm, không gian hoa); không có thì một điểm trải nghiệm
    if (open(13.5)) {
      const ev = allDay[0];
      if (ev) add(13.5, "Chiều", "event", ev.title, tr("Diễn ra cả ngày tại " + ev.venue + ". Ghé lúc nào trong buổi chiều cũng được.", "On all day at " + ev.venue + ". Drop in any time in the afternoon."), [], ev);
      else {
        const c = pickSight(family ? ["Trải nghiệm"] : ["Trải nghiệm", "Văn hóa", "Thiên nhiên"], wantsFlower ? (p) => FLOWER.test(fold(p.name)) : undefined);
        if (c) add(13.5, "Chiều", "sight", c.name, introOf(c), [c]);
      }
    }
    if (open(15.5) && !(evening && evening.start < t0 + 17.5 * H && evening.start - (t0 + 15.5 * H) < 1.25 * H)) {
      const f = pickFood("cafe", 2, "cafe");
      if (f.length) add(15.5, "Chiều", "cafe", tr("Nghỉ chân cà phê", "Coffee break"), tr("Hai quán cà phê ở trung tâm để bạn chọn.", "Two cafés in the centre to choose from."), f);
    }
    // Tối: show hoặc sự kiện có giờ là điểm chính. Show sớm (trước 18:30) thì ăn tối sau show.
    const early = !!evening && evening.start < t0 + 18.5 * H;
    const dinnerAt = early ? Math.min(21, (evening!.end - t0) / H + 0.25) : 18;
    const dinner = () => {
      if (!open(dinnerAt, early ? 3 : 0.5)) return;
      const f = pickFood("eat", 2, "dinner");
      if (f.length) add(dinnerAt, "Tối", "eat", early ? tr("Ăn tối sau buổi diễn", "Dinner after the show") : tr("Ăn tối", "Dinner"), tr("Hai quán trong khu " + CENTER + " để bạn chọn.", "Two places around " + CENTER + " to choose from."), f);
    };
    if (!early) dinner();
    if (evening) add(0, "Tối", "event", evening.title, evening.venue + (evening.endEstimated ? "" : tr(", đến ", ", until ") + vnTime(evening.end)) + tr(". Bấm vào để xem chi tiết và xác nhận giờ.", ". Tap for details and to confirm the time."), [], evening);
    if (early) dinner();
    if (!evening && open(19.5, 2)) {
      const walk = ["xuan-huong", "cho-da-lat"].map((id) => byId.get(id)).filter((p): p is GuidePlace => !!p);
      if (walk.length) add(19.5, "Tối", "walk", tr("Dạo hồ Xuân Hương và chợ đêm", "Stroll around Xuan Huong Lake and the night market"), tr("Dữ liệu chưa có show hay sự kiện nào khớp cho tối này, nên gợi ý một buổi dạo trung tâm.", "No matching show or event tonight, so here is an evening walk in the centre."), walk);
    }
    stops.sort((a, b) => a.at - b.at);
    return { date, stops };
  }).filter((d) => d.stops.length > 0);
}
