/**
 * Ảnh chia sẻ dọc 1080×1920 (vừa story Facebook/Instagram, Zalo): nền màu nhận diện, ảnh, tiêu đề,
 * vài dòng thông tin, mã QR mở đúng trang trên DalatEvent và logo. Vẽ hoàn toàn trên máy người dùng.
 */
import QRCode from "qrcode";
import { Share } from "@capacitor/share";
import logoUrl from "../static/img/dalatevent-logo.png";
import { IS_NATIVE } from "./device";
import { tr } from "../i18n";

export interface ShareCard {
  /** Dòng nhỏ phía trên tiêu đề, ví dụ "FESTIVAL HOA ĐÀ LẠT 2026" */
  kicker: string;
  title: string;
  /** Mỗi dòng một thông tin: ngày giờ, địa điểm, mã ưu đãi… */
  lines: string[];
  /** Ảnh lớn (tuỳ chọn) */
  image?: string;
  /** Huy hiệu nổi bật, ví dụ "★ 4,8 · 12 lượt" hoặc "GIẢM 10%" */
  badge?: string;
  link: string;
  /** Tên tệp không đuôi */
  name: string;
}

const W = 1080;
const H = 1920;
const INK = "#1b1440";
const ORANGE = "#f15a25";

function loadImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((res) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => res(im);
    im.onerror = () => res(null);
    im.src = src;
    setTimeout(() => res(null), 8000);
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Ngắt dòng theo bề ngang, tối đa maxLines dòng (dòng cuối thêm "…") */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? cur + " " + w : w;
    if (ctx.measureText(next).width <= maxW) cur = next;
    else {
      if (cur) out.push(cur);
      cur = w;
    }
    if (out.length === maxLines) break;
  }
  if (out.length < maxLines && cur) out.push(cur);
  if (out.length === maxLines && words.join(" ") !== out.join(" ")) {
    let last = out[maxLines - 1];
    while (last && ctx.measureText(last + "…").width > maxW) last = last.slice(0, -1);
    out[maxLines - 1] = last.trimEnd() + "…";
  }
  return out;
}

/** Cắt ảnh phủ kín khung (giống object-fit: cover) */
function cover(ctx: CanvasRenderingContext2D, im: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const s = Math.max(w / im.width, h / im.height);
  const sw = w / s;
  const sh = h / s;
  ctx.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, x, y, w, h);
}

export async function drawShareCard(c: ShareCard): Promise<HTMLCanvasElement> {
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;
  const font = (wgt: number, px: number) => `${wgt} ${px}px "Be Vietnam Pro", "Segoe UI", system-ui, -apple-system, sans-serif`;

  // Nền: các mảng màu nhận diện
  ctx.fillStyle = "#fff6ee";
  ctx.fillRect(0, 0, W, H);
  const blob = (x: number, y: number, r: number, col: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  };
  blob(80, 120, 900, "rgba(241,90,37,.85)");
  blob(1040, 520, 820, "rgba(41,188,231,.75)");
  blob(60, 1500, 900, "rgba(29,174,121,.7)");
  blob(1000, 1800, 800, "rgba(252,177,27,.8)");

  const [logo, photo, qr] = await Promise.all([
    loadImg(logoUrl),
    c.image ? loadImg(c.image) : Promise.resolve(null),
    QRCode.toDataURL(c.link, { width: 360, margin: 1, errorCorrectionLevel: "M", color: { dark: INK, light: "#ffffff" } }).then(loadImg),
  ]);

  // Logo
  if (logo) {
    const lh = 120;
    ctx.drawImage(logo, 64, 56, (logo.width / logo.height) * lh, lh);
  } else {
    ctx.fillStyle = INK;
    ctx.font = font(800, 64);
    ctx.fillText("DalatEvent", 72, 140);
  }

  // Thẻ kính trắng chứa nội dung
  const cx = 56;
  const cy = 220;
  const cw = W - 112;
  const ch = H - 220 - 120;
  ctx.save();
  ctx.shadowColor = "rgba(27,20,64,.18)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 12;
  roundRect(ctx, cx, cy, cw, ch, 56);
  ctx.fillStyle = "rgba(255,255,255,.9)";
  ctx.fill();
  ctx.restore();

  let y = cy + 40;
  const pad = 48;
  const iw = cw - pad * 2;
  if (photo) {
    const ih = 720;
    ctx.save();
    roundRect(ctx, cx + pad, y, iw, ih, 36);
    ctx.clip();
    cover(ctx, photo, cx + pad, y, iw, ih);
    ctx.restore();
    if (c.badge) {
      ctx.font = font(800, 44);
      const bw = ctx.measureText(c.badge).width + 56;
      roundRect(ctx, cx + pad + 28, y + 28, bw, 84, 42);
      ctx.fillStyle = ORANGE;
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillText(c.badge, cx + pad + 56, y + 86);
    }
    y += ih + 56;
  } else {
    y += 40;
    if (c.badge) {
      ctx.font = font(800, 56);
      const bw = ctx.measureText(c.badge).width + 72;
      roundRect(ctx, cx + pad, y, bw, 104, 52);
      ctx.fillStyle = ORANGE;
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillText(c.badge, cx + pad + 36, y + 72);
      y += 104 + 48;
    }
  }

  // Dòng nhỏ + tiêu đề
  ctx.fillStyle = ORANGE;
  ctx.font = font(800, 34);
  ctx.fillText(c.kicker.toUpperCase(), cx + pad, y + 30);
  y += 70;
  ctx.fillStyle = INK;
  const big = photo ? 76 : 96;
  ctx.font = font(800, big);
  const tl = wrap(ctx, c.title, iw, photo ? 3 : 4);
  for (const line of tl) {
    y += big * 1.12;
    ctx.fillText(line, cx + pad, y);
  }
  y += 36;

  // Thông tin (để chừa chỗ cho QR ở đáy thẻ)
  const qrTop = cy + ch - pad - 300;
  ctx.fillStyle = "#3d3a52";
  ctx.font = font(500, 42);
  for (const raw of c.lines.filter(Boolean)) {
    for (const line of wrap(ctx, raw, iw, 2)) {
      if (y + 60 > qrTop - 24) break;
      y += 60;
      ctx.fillText(line, cx + pad, y);
    }
  }

  // QR + lời kêu gọi
  if (qr) ctx.drawImage(qr, cx + pad, qrTop, 300, 300);
  ctx.fillStyle = INK;
  ctx.font = font(800, 46);
  ctx.fillText(tr("Quét để xem chi tiết", "Scan for details"), cx + pad + 340, qrTop + 120);
  ctx.fillStyle = "#3d3a52";
  ctx.font = font(500, 38);
  ctx.fillText(tr("Lịch sự kiện, show diễn,", "Events, live shows and"), cx + pad + 340, qrTop + 185);
  ctx.fillText(tr("ưu đãi Đà Lạt mỗi ngày", "offers in Da Lat, daily"), cx + pad + 340, qrTop + 235);

  // Chân trang
  ctx.fillStyle = INK;
  ctx.font = font(800, 44);
  ctx.textAlign = "center";
  ctx.fillText("dalatevent.com", W / 2, H - 52);
  ctx.textAlign = "left";
  return cv;
}

const toBlob = (cv: HTMLCanvasElement) => new Promise<Blob | null>((res) => cv.toBlob((b) => res(b), "image/png"));

/** Vẽ và mở bảng chia sẻ của máy với ảnh; máy không hỗ trợ thì tải ảnh về. Trả "shared" | "saved" | "error". */
/** Thông báo sau khi chia sẻ ảnh; trả câu để hiện cho người dùng, hoặc "" nếu không cần */
export function shareCardMessage(r: "shared" | "saved" | "error", vi: (a: string, b: string) => string): string {
  if (r === "saved") return vi("Đã tải ảnh về máy, đăng kèm link nhé", "Image downloaded, post it with the link");
  if (r === "error") return vi("Chưa tạo được ảnh, hãy thử lại", "Couldn't create the image, please try again");
  return "";
}

export async function shareCard(c: ShareCard, text: string): Promise<"shared" | "saved" | "error"> {
  try {
    const cv = await drawShareCard(c);
    const file = c.name.replace(/[^a-z0-9-]+/gi, "-").slice(0, 60) + ".png";
    if (IS_NATIVE) {
      const { Filesystem, Directory } = await import("@capacitor/filesystem");
      const data = cv.toDataURL("image/png").split(",")[1];
      const w = await Filesystem.writeFile({ path: file, data, directory: Directory.Cache });
      try {
        await Share.share({ files: [w.uri], text });
      } catch (e) {
        /* người dùng đóng bảng chia sẻ */
      }
      return "shared";
    }
    const blob = await toBlob(cv);
    if (!blob) return "error";
    const f = new File([blob], file, { type: "image/png" });
    if (typeof navigator.canShare === "function" && navigator.canShare({ files: [f] })) {
      try {
        await navigator.share({ files: [f], text });
        return "shared";
      } catch (e) {
        if ((e as Error).name === "AbortError") return "shared";
      }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = file;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return "saved";
  } catch (e) {
    return "error";
  }
}
