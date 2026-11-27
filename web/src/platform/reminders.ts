/**
 * Nhắc lịch: mỗi chương trình người dùng đã lưu được hẹn một thông báo trên máy
 * trước giờ bắt đầu (mặc định 1 tiếng, người dùng chọn được 30 phút / 1 tiếng / 2 tiếng / tắt).
 * Bỏ lưu thì thông báo cũng được gỡ.
 */
import { LocalNotifications } from "@capacitor/local-notifications";
import { PROGRAMS } from "../data/festival";
import type { PlanItem } from "../utils/itinerary";
import { tr } from "../i18n";
import { storage } from "../utils/device";

const LEAD_KEY = "dalatevent.remind.min";
export const LEAD_CHOICES = [0, 30, 60, 120];
/** Số phút nhắc trước; 0 = tắt */
export function remindLead(): number {
  const raw = storage.get(LEAD_KEY);
  const v = Number(raw);
  return raw !== null && LEAD_CHOICES.includes(v) ? v : 60;
}
export function setRemindLead(min: number) {
  storage.set(LEAD_KEY, String(min));
}
const leadText = (min: number) => (min >= 60 ? tr(min / 60 + " tiếng", min / 60 + (min === 60 ? " hour" : " hours")) : tr(min + " phút", min + " min"));

function idOf(programId: string) {
  let h = 0;
  for (let i = 0; i < programId.length; i++) h = (h * 31 + programId.charCodeAt(i)) % 2000000000;
  return h + 1;
}

export async function syncReminders(savedIds: string[], askPermission: boolean, plan: PlanItem[] = []) {
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) {
      await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
    }
    const LEAD_MS = remindLead() * 60000;
    if (!LEAD_MS) return;
    const now = Date.now();
    const list = PROGRAMS.filter((p) => savedIds.includes(p.id))
      .map((p) => ({ p, at: new Date(p.start).getTime() - LEAD_MS }))
      .filter((x) => x.at > now);
    // Show diễn và sự kiện khác trong lịch trình (mục có giờ cụ thể)
    const extra = plan.filter((x) => !x.allDay && x.start - LEAD_MS > now).sort((a, b) => a.start - b.start).slice(0, 40); // iOS giới hạn 64 thông báo chờ
    if (!list.length && !extra.length) return;

    let perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted" && askPermission) perm = await LocalNotifications.requestPermissions();
    if (perm.display !== "granted") return;

    await LocalNotifications.schedule({
      notifications: [
        ...extra.map((x) => {
          const d = new Date(x.start + 7 * 3600000).toISOString();
          return { id: idOf(x.id), title: x.title, body: tr(`Còn ${leadText(remindLead())} · bắt đầu ${d.slice(11, 16)} ngày ${d.slice(8, 10)}.${d.slice(5, 7)} tại ${x.venue}. Lịch có thể thay đổi, hãy kiểm tra lại trong app.`, `In ${leadText(remindLead())} · starts ${d.slice(11, 16)} on ${d.slice(8, 10)}.${d.slice(5, 7)} at ${x.venue}. Schedules may change; check the app.`), schedule: { at: new Date(x.start - LEAD_MS) } };
        }),
        ...list.map(({ p, at }) => ({
        id: idOf(p.id),
        title: p.title,
        body: tr(`Còn ${leadText(remindLead())} · bắt đầu ${p.day}${p.sub ? ", " + p.sub : ""} tại ${p.venue}.`, `In ${leadText(remindLead())} · starts ${p.day}${p.sub ? ", " + p.sub : ""} at ${p.venue}.`) + (p.tentative ? tr(" Lịch dự kiến, hãy kiểm tra lại trong app.", " Tentative; check the app.") : ""),
        schedule: { at: new Date(at) },
      })),
      ],
    });
  } catch (e) {
    /* chạy trên trình duyệt hoặc máy không cho thông báo: bỏ qua */
  }
}
