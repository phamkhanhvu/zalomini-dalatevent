/*
 * Service worker của DalatEvent: giữ lại khung trang để mở được khi mất mạng (đồi núi, sóng yếu).
 * Chỉ xử lý đúng các tệp của website tĩnh. Mọi đường dẫn khác trên cùng tên miền
 * (trò chơi /game/, WordPress /wp-…, dữ liệu /data/) được để nguyên cho trình duyệt tự tải.
 */
const VERSION = "v1";
const SHELL = "dalatevent-shell-" + VERSION;
const ASSETS = "dalatevent-assets-" + VERSION;
const SCOPE = new URL(self.registration.scope).pathname;
const STATIC = ["favicon.png", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "manifest.webmanifest"];

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("dalatevent-") && k !== SHELL && k !== ASSETS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const ok = (res) => res && res.status === 200 && res.type === "basic";

/** Trang chính: lấy bản mới trên mạng trước (tối đa 4 giây), không được thì dùng bản đã giữ */
async function shell(request) {
  const cache = await caches.open(SHELL);
  const key = SCOPE;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(request, { signal: ctrl.signal });
    clearTimeout(timer);
    if (ok(res)) cache.put(key, res.clone());
    return res;
  } catch (e) {
    const hit = await cache.match(key);
    if (hit) return hit;
    throw e;
  }
}

/** Tệp trong assets/ có mã băm trong tên nên không bao giờ đổi nội dung: đã giữ thì dùng luôn */
async function asset(request) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (ok(res)) cache.put(request, res.clone());
  return res;
}

/** Biểu tượng, manifest: dùng bản đã giữ và tải bản mới ở nền */
async function refresh(request) {
  const cache = await caches.open(ASSETS);
  const hit = await cache.match(request);
  const net = fetch(request)
    .then((res) => {
      if (ok(res)) cache.put(request, res.clone());
      return res;
    })
    .catch(() => hit);
  return hit || net;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)) return;
  const rel = url.pathname.slice(SCOPE.length);
  if (req.mode === "navigate") {
    if (rel === "" || rel === "index.html") event.respondWith(shell(req));
    return;
  }
  if (rel.startsWith("assets/")) event.respondWith(asset(req));
  else if (STATIC.includes(rel)) event.respondWith(refresh(req));
});
