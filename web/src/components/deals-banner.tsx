import React, { FC, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { fetchPublicDeals } from "../platform/deals";
import { Deal, dealState, remaining, visibleDeals } from "../utils/deals";
import { tr } from "../i18n";

const Ticket: FC = () => (
  <span className="deals-badge" aria-hidden="true">
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z" />
      <path d="M9.5 9.5l5 5M9.5 9.6h.01M14.5 14.4h.01" />
    </svg>
  </span>
);

/** Dalat Deals trên trang chủ: mỗi ưu đãi đang mở là một slide, tự chuyển sau vài giây, vuốt được */
export const DealsBanner: FC = () => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[] | null>(null);
  const [idx, setIdx] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  useEffect(() => {
    let live = true;
    fetchPublicDeals()
      .then((l) => live && setDeals(visibleDeals(l, Date.now())))
      .catch(() => live && setDeals([]));
    return () => {
      live = false;
    };
  }, []);
  const now = Date.now();
  const list = (deals || []).filter((d) => dealState(d, now) === "active" || dealState(d, now) === "upcoming");
  const n = list.length;

  // Tự chuyển slide, dừng khi khách đang chạm hoặc vuốt
  useEffect(() => {
    if (n < 2) return;
    const t = window.setInterval(() => {
      const el = track.current;
      if (!el || paused.current) return;
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % n;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, 4500);
    return () => window.clearInterval(t);
  }, [n]);
  const onScroll = () => {
    const el = track.current;
    if (el) setIdx(Math.round(el.scrollLeft / el.clientWidth));
  };

  if (n === 0)
    return (
      <button type="button" className="deals-banner" onClick={() => navigate("/uu-dai")}>
        <Ticket />
        <span className="deals-text">
          <span className="deals-kicker">Dalat Deals</span>
          <b>{tr("Ưu đãi từ quán và điểm diễn đối tác", "Offers from partner cafés and venues")}</b>
          <i>{tr("Đăng nhập, bấm dùng, nhận mã. Mỗi tài khoản một lượt.", "Sign in, tap Use, get the code. One use per account.")}</i>
        </span>
        <span className="deals-go">{tr("Xem ưu đãi", "See offers")}</span>
      </button>
    );

  return (
    <section className="deals-slider" aria-label="Dalat Deals" aria-roledescription="carousel">
      <div className="deals-track" ref={track} onScroll={onScroll} onPointerDown={() => (paused.current = true)} onPointerUp={() => window.setTimeout(() => (paused.current = false), 6000)}>
        {list.map((d, i) => (
          <button key={d.id} type="button" className={"deals-banner deals-slide v" + (i % 3)} aria-label={d.title} onClick={() => navigate("/uu-dai?d=" + encodeURIComponent(d.id))}>
            <Ticket />
            <span className="deals-text">
              <span className="deals-kicker">Dalat Deals · {i + 1}/{n}</span>
              <b>{d.title}</b>
              <i>{d.partner}{dealState(d, now) === "upcoming" ? tr(" · sắp mở", " · coming soon") : tr(" · còn " + remaining(d) + " lượt", " · " + remaining(d) + " left")}</i>
            </span>
            <span className="deals-go">{tr("Lấy mã", "Get code")}</span>
          </button>
        ))}
      </div>
      <div className="deals-foot">
        <span className="deals-dots" aria-hidden="true">{list.map((d, i) => <i key={d.id} className={i === idx ? "on" : ""} />)}</span>
        <button type="button" className="deals-all" onClick={() => navigate("/uu-dai")}>{tr("Xem tất cả " + n + " ưu đãi", "See all " + n + " offers")} →</button>
      </div>
    </section>
  );
};
