import React, { FC, useEffect, useRef, useState } from "react";
import san_mayL from "../static/img/bn-san-may-1280.jpg";
import san_mayS from "../static/img/bn-san-may-720.jpg";
import vuon_hoaL from "../static/img/bn-vuon-hoa-1280.jpg";
import vuon_hoaS from "../static/img/bn-vuon-hoa-720.jpg";
import cho_demL from "../static/img/bn-cho-dem-1280.jpg";
import cho_demS from "../static/img/bn-cho-dem-720.jpg";
import acousticL from "../static/img/bn-acoustic-1280.jpg";
import acousticS from "../static/img/bn-acoustic-720.jpg";
import ca_pheL from "../static/img/bn-ca-phe-1280.jpg";
import ca_pheS from "../static/img/bn-ca-phe-720.jpg";
import dap_xeL from "../static/img/bn-dap-xe-1280.jpg";
import dap_xeS from "../static/img/bn-dap-xe-720.jpg";
import cam_traiL from "../static/img/bn-cam-trai-1280.jpg";
import cam_traiS from "../static/img/bn-cam-trai-720.jpg";
import hai_dauL from "../static/img/bn-hai-dau-1280.jpg";
import hai_dauS from "../static/img/bn-hai-dau-720.jpg";
import san_anhL from "../static/img/bn-san-anh-1280.jpg";
import san_anhS from "../static/img/bn-san-anh-720.jpg";
import hoang_honL from "../static/img/bn-hoang-hon-1280.jpg";
import hoang_honS from "../static/img/bn-hoang-hon-720.jpg";
import { tr } from "../i18n";

/** Banner "Đà Lạt có gì vui?" do chủ dự án cung cấp ngày 23.11.2026 (ảnh minh họa, chữ nằm sẵn trong ảnh) */
const BANNERS = [
  { l: san_mayL, s: san_mayS, alt: "Đà Lạt có gì vui? Săn mây, đón bình minh" },
  { l: vuon_hoaL, s: vuon_hoaS, alt: "Đà Lạt có gì vui? Check-in vườn hoa rực rỡ" },
  { l: cho_demL, s: cho_demS, alt: "Đà Lạt có gì vui? Dạo chợ đêm, food tour" },
  { l: acousticL, s: acousticS, alt: "Đà Lạt có gì vui? Nghe acoustic giữa trời se lạnh" },
  { l: ca_pheL, s: ca_pheS, alt: "Đà Lạt có gì vui? Ngồi cà phê ngắm đồi" },
  { l: dap_xeL, s: dap_xeS, alt: "Đà Lạt có gì vui? Dạo hồ, đạp xe thư thả" },
  { l: cam_traiL, s: cam_traiS, alt: "Đà Lạt có gì vui? Cắm trại, picnic giữa đồi thông" },
  { l: hai_dauL, s: hai_dauS, alt: "Đà Lạt có gì vui? Tham quan nông trại, hái dâu" },
  { l: san_anhL, s: san_anhS, alt: "Đà Lạt có gì vui? Săn ảnh đẹp, khám phá góc xinh" },
  { l: hoang_honL, s: hoang_honS, alt: "Đà Lạt có gì vui? Ngắm hoàng hôn thật chill" },
];

/** Dải banner đầu trang chủ: vuốt ngang, tự chuyển sau 5 giây, dừng khi người dùng đang chạm */
export const Banners: FC = () => {
  const box = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const hold = useRef(false);
  const go = (i: number) => {
    const el = box.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onScroll = () => setIdx(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
    el.addEventListener("scroll", onScroll, { passive: true });
    const still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = still
      ? 0
      : window.setInterval(() => {
          if (hold.current || document.hidden) return;
          const next = (Math.round(el.scrollLeft / Math.max(1, el.clientWidth)) + 1) % BANNERS.length;
          el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
        }, 5000);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.clearInterval(t);
    };
  }, []);
  return (
    <div className="bn" role="region" aria-roledescription={tr("băng chuyền", "carousel")} aria-label={tr("Đà Lạt có gì vui?", "What's on in Da Lat?")}>
      <div
        className="bn-track"
        ref={box}
        onTouchStart={() => (hold.current = true)}
        onTouchEnd={() => window.setTimeout(() => (hold.current = false), 4000)}
        onMouseEnter={() => (hold.current = true)}
        onMouseLeave={() => (hold.current = false)}
      >
        {BANNERS.map((b, i) => (
          <img key={b.l} src={b.l} srcSet={b.s + " 720w, " + b.l + " 1280w"} sizes="(min-width: 900px) 960px, 100vw" alt={b.alt} width={1280} height={720} loading={i === 0 ? "eager" : "lazy"} draggable={false} />
        ))}
      </div>
      <div className="bn-dots">
        {BANNERS.map((b, i) => (
          <button key={b.l} type="button" className={i === idx ? "on" : ""} aria-label={"Banner " + (i + 1) + ": " + b.alt} aria-current={i === idx} onClick={() => go(i)} />
        ))}
      </div>
    </div>
  );
};
