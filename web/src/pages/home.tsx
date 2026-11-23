import React, { FC, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useSnackbar } from "../ui";
import { FESTIVAL, PROGRAMS } from "../data/festival";
import { onDataChange } from "../data/store";
import { countdown, statusOf } from "../utils/time";
import { callPhone, openUrl, shareText } from "../utils/device";
import { SHARE_FAIL } from "../utils/platform";
import { Agenda } from "../components/agenda";
import { SearchBox } from "../components/search-box";
import { Banners } from "../components/banners";
import { useProgramSheet } from "../components/use-program-sheet";
import { IconArrow, IconBookmark, IconCompass, IconGlobe, IconPhone, IconPin, IconShare } from "../components/icons";

import f1 from "../static/img/md-vuon-hoa.jpg";
import f2 from "../static/img/md-dem-nhac-acoustic.jpg";
import f3 from "../static/img/md-cho-dem.jpg";
import logoImg from "../static/img/dalatevent-logo.png";


const HomePage: FC = () => {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { sheet, openProgram } = useProgramSheet();
  const [tick, setTick] = useState(0);
  useEffect(() => onDataChange(() => setTick((n) => n + 1)), []);
  const [minute, setMinute] = useState(() => Math.floor(Date.now() / 60000));
  useEffect(() => {
    const t = window.setInterval(() => setMinute(Math.floor(Date.now() / 60000)), 60000);
    return () => window.clearInterval(t);
  }, []);

  // Mọi con số dưới đây tính từ dữ liệu (data/events.json), không viết cứng
  const cd = useMemo(() => countdown(FESTIVAL.opening, FESTIVAL.end, FESTIVAL.openingTentative), [tick, minute]);
  const total = PROGRAMS.length;
  const live = useMemo(() => PROGRAMS.filter((p) => statusOf(p) === "live").length, [tick, minute]);
  const done = useMemo(() => PROGRAMS.filter((p) => statusOf(p) === "ended").length, [tick, minute]);
  const others = Math.max(0, FESTIVAL.totalActivities - total);
  const toAgenda = () => document.getElementById("dang-dien-ra")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="scroll page">
      <header className="hero">
        <div className="brand">
          <img className="brand-logo" src={logoImg} alt="DalatEvent.com" width={90} height={72} />
        </div>
        <h1 className="sr-only">Đà Lạt có gì vui?</h1>
        <Banners />
        <p className="lead">Lễ hội, sự kiện và show diễn đang và sắp diễn ra tại Đà Lạt, cập nhật mỗi ngày.</p>
        <SearchBox onOpenProgram={openProgram} />
        <button type="button" className="as-entry" onClick={() => navigate("/tro-ly")}>
          <span><b>Hôm nay đi đâu?</b><i>Nhắn kiểu "tối nay hai người, 500k, nghe nhạc" để được gợi ý</i></span>
          <IconArrow size={20} />
        </button>
        <div className="quick">
          <button type="button" className="quick-btn quick-main" onClick={toAgenda}>
            <IconCompass size={22} /><span>Khám phá sự kiện</span>
          </button>
          <button type="button" className="quick-btn" onClick={() => navigate("/da-luu")}>
            <IconBookmark size={22} /><span>Xem lịch trình</span>
          </button>
          <button type="button" className="quick-btn" onClick={() => navigate("/ban-do")}>
            <IconPin size={22} /><span>Mở bản đồ</span>
          </button>
        </div>
      </header>

      <Agenda onOpenProgram={openProgram} />

      <section className="sec">
        <button type="button" className="pass-card" onClick={() => navigate("/ho-chieu")}>
          <span className="stamp-mark" aria-hidden="true">ĐL</span>
          <span className="pass-card-text"><b>Hộ chiếu Đà Lạt</b><i>Đến nơi, đóng dấu, sưu tập đủ bộ dấu mộc của các địa điểm và chương trình.</i></span>
          <IconArrow size={20} />
        </button>
      </section>

      <section className="sec feat" aria-labelledby="feat-h">
        <p className="eyebrow">Sự kiện nổi bật{FESTIVAL.editionShort ? " · " + FESTIVAL.editionShort : ""}</p>
        <h2 className="h1" id="feat-h">{FESTIVAL.name} <em>{FESTIVAL.start.slice(0, 4)}</em></h2>
        {FESTIVAL.theme && <p className="lead">{FESTIVAL.theme}.</p>}
        <div className="feat-photos">
          <img className="feat-a" src={f1} alt="Du khách dạo chơi và chụp ảnh giữa vườn hoa (ảnh minh họa)" />
          <img className="feat-b" src={f2} alt="Đêm nhạc acoustic ngoài trời (ảnh minh họa)" />
          <img className="feat-c" src={f3} alt="Chợ đêm với món nướng và dâu tây (ảnh minh họa)" loading="lazy" />
          <div className="count">
            <b>{cd.big}</b>
            <span>{cd.small}</span>
          </div>
        </div>
        <p className="muted small">Ảnh minh họa không khí mùa lễ hội, không phải ảnh chụp tại sự kiện.</p>
        <div className="tiles tiles-in">
          <div className="tile tile-pink">
            <span className="tile-k">Thời gian</span>
            <b>{FESTIVAL.dateRange}</b>
            <span className="tile-s">{FESTIVAL.place}</span>
          </div>
          <div className="tile tile-mint">
            <span className="tile-k">Khai mạc</span>
            <b>{FESTIVAL.openingLabel}</b>
            <span className="tile-s"><IconPin size={14} />{FESTIVAL.openingVenue}{FESTIVAL.openingTentative ? " · dự kiến" : ""}</span>
          </div>
          <div className="tile tile-blue">
            <span className="tile-k">Quy mô</span>
            <b>{total} chương trình chính</b>
            <span className="tile-s">{others > 0 ? `cùng ${others} hoạt động khác` : "theo cổng chính thức"}</span>
          </div>
          <div className="tile tile-yellow">
            <span className="tile-k">Trạng thái</span>
            <b>{live > 0 ? `${live} đang diễn ra` : done === total && total > 0 ? "Đã kết thúc" : "Chưa bắt đầu"}</b>
            <span className="tile-s">{total - live - done} sắp tới{done > 0 ? ` · ${done} đã xong` : ""}</span>
          </div>
        </div>
        <div className="cta cta-in">
          <button type="button" className="btn btn-ink btn-wide" onClick={() => navigate("/chuong-trinh")}>
            Xem {total} chương trình <IconArrow size={20} />
          </button>
        </div>
      </section>

      <section className="sec about">
        <h2 className="h2">Về DalatEvent</h2>
        <p>DalatEvent là cổng thông tin sự kiện Đà Lạt do Sense Group vận hành.</p>
        <div className="actions">
          <button type="button" className="act" onClick={() => openUrl(FESTIVAL.sourceUrl)}>
            <IconGlobe />Cổng Festival chính thức
          </button>
          <button type="button" className="act" onClick={() => callPhone(FESTIVAL.hotline)}>
            <IconPhone />{FESTIVAL.hotlineLabel}
          </button>
          <button
            type="button"
            className="act"
            onClick={async () => {
              const ok = await shareText(`Đà Lạt có gì vui? Lịch ${FESTIVAL.name} ${FESTIVAL.edition} (${FESTIVAL.dateRange}) và các show diễn tại Đà Lạt: ${FESTIVAL.website}`, "DalatEvent");
              if (!ok) openSnackbar({ text: SHARE_FAIL, duration: 2200 });
            }}
          >
            <IconShare />Chia sẻ
          </button>
          <button type="button" className="act" onClick={() => navigate("/nhung-lich")}>
            <IconGlobe />Nhúng lịch và mã QR cho đối tác
          </button>
        </div>
        <p className="muted small">© {new Date().getFullYear()} DalatEvent · Sense Group · 304 Hai Bà Trưng, Đà Lạt</p>
        <button type="button" className="acc-switch link-left" onClick={() => navigate("/quyen-rieng-tu")}>Chính sách quyền riêng tư</button>
      </section>
      {sheet}
    </div>
  );
};

export default HomePage;
