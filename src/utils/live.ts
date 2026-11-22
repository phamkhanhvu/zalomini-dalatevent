import { Happening, HAPPENING_FALLBACK, LIVE_SOURCE } from "../data/festival";

export interface LiveResult {
  items: Happening[];
  updated?: string;
  fromNetwork: boolean;
}

/**
 * Lấy mục "Đang diễn ra và sắp tới" từ dalatevent.com (trang được cập nhật mỗi ngày).
 * Không tải được thì dùng bản dự phòng trong data/festival.ts.
 */
export async function loadHappening(): Promise<LiveResult> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(LIVE_SOURCE, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error("http " + res.status);
    const json = await res.json();
    const html: string = json?.content?.rendered ?? "";
    const doc = new DOMParser().parseFromString(html, "text/html");
    const section = doc.getElementById("dang-dien-ra");
    if (!section) throw new Error("no section");
    const items: Happening[] = [];
    section.querySelectorAll("article").forEach((a) => {
      const title = a.querySelector("h3")?.textContent?.trim();
      const desc = a.querySelector("p")?.textContent?.trim() ?? "";
      const spans = Array.from(a.querySelectorAll("span")).map((s) => (s.textContent || "").trim());
      const live = spans.some((s) => /đang diễn ra/i.test(s));
      const when = spans.filter((s) => s && !/đang diễn ra/i.test(s)).join(" · ");
      if (title) items.push({ title, desc, when, live });
    });
    if (!items.length) throw new Error("empty");
    const intro = section.querySelector("p")?.textContent ?? "";
    const m = intro.match(/(\d{1,2}\.\d{1,2}\.\d{4})/);
    return { items, updated: m ? m[1] : undefined, fromNetwork: true };
  } catch (e) {
    return { items: HAPPENING_FALLBACK, fromNetwork: false };
  }
}
