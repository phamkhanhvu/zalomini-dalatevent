/**
 * Nhắc lịch: mỗi chương trình người dùng đã lưu được hẹn một thông báo trên máy
 * trước giờ bắt đầu 2 tiếng. Bỏ lưu thì thông báo cũng được gỡ.
 */
import { LocalNotifications } from "@capacitor/local-notifications";
import { PROGRAMS } from "@shared/data/festival";

const LEAD_MS = 2 * 60 * 60 * 1000;

function idOf(programId: string) {
  let h = 0;
  for (let i = 0; i < programId.length; i++) h = (h * 31 + programId.charCodeAt(i)) % 2000000000;
  return h + 1;
}

export async function syncReminders(savedIds: string[], askPermission: boolean) {
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length) {
      await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
    }
    const now = Date.now();
    const list = PROGRAMS.filter((p) => savedIds.includes(p.id))
      .map((p) => ({ p, at: new Date(p.start).getTime() - LEAD_MS }))
      .filter((x) => x.at > now);
    if (!list.length) return;

    let perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted" && askPermission) perm = await LocalNotifications.requestPermissions();
    if (perm.display !== "granted") return;

    await LocalNotifications.schedule({
      notifications: list.map(({ p, at }) => ({
        id: idOf(p.id),
        title: p.title,
        body: `Bắt đầu ${p.day}${p.sub ? ", " + p.sub : ""} tại ${p.venue}.` + (p.tentative ? " Lịch dự kiến, hãy kiểm tra lại trong app." : ""),
        schedule: { at: new Date(at) },
      })),
    });
  } catch (e) {
    /* chạy trên trình duyệt hoặc máy không cho thông báo: bỏ qua */
  }
}
