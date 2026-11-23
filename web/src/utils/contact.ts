/**
 * Email liên hệ của DalatEvent. Không viết trong mã nguồn: chủ dự án đặt trong
 * GitHub → Settings → Secrets and variables → Actions → Variables, tên CONTACT_EMAIL.
 */
export const CONTACT_EMAIL: string = ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_CONTACT_EMAIL || "").trim();

export function mailto(subject: string, body = ""): string {
  return "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent(subject) + (body ? "&body=" + encodeURIComponent(body) : "");
}
