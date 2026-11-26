import React, { FC, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useSnackbar } from "../ui";
import { FESTIVAL, PROGRAMS } from "../data/festival";
import { onDataChange } from "../data/store";
import { countdown, statusOf } from "../utils/time";
import { shareText } from "../utils/device";
import { shareFail } from "../utils/platform";
import { Agenda } from "../components/agenda";
import { SearchBox } from "../components/search-box";
import { Banners } from "../components/banners";
import { useProgramSheet } from "../components/use-program-sheet";
import { IconArrow, IconBookmark, IconCompass, IconGlobe, IconPin, IconShare } from "../components/icons";

import f1 from "../static/img/md-vuon-hoa.jpg";
import f2 from "../static/img/md-dem-nhac-acoustic.jpg";
import f3 from "../static/img/md-cho-dem.jpg";
import logoImg from "../static/img/dalatevent-logo.png";
import passportSmall from "../static/img/passport-160.webp";
import { DealsBanner } from "../components/deals-banner";
import { WeatherCard } from "../components/weather-card";
import { ToplistBanner } from "../components/toplist-banner";
import { tr } from "../i18n";


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
        <h1 className="sr-only">{tr("Đà Lạt có gì vui?", "What's on in Da Lat?")}</h1>
        <Banners />
        <p className="lead">{tr("Lễ hội, sự kiện và show diễn đang và sắp diễn ra tại Đà Lạt, cập nhật mỗi ngày.", "Festivals, events and live shows happening now and coming up in Da Lat, updated daily.")}</p>
        <SearchBox onOpenProgram={openProgram} />
        <button type="button" className="as-entry" onClick={() => navigate("/tro-ly")}>
          <span><b>{tr("Hôm nay đi đâu?", "Where to go today?")}</b><i>{tr("Nhắn kiểu \"tối nay hai người, thích nghe nhạc\" để có ngay một lịch trình", "Type something like \"tonight, two people, live music\" to get a plan instantly")}</i></span>
          <IconArrow size={20} />
        </button>
        <div className="quick">
          <button type="button" className="quick-btn quick-main" onClick={toAgenda}>
            <IconCompass size={22} /><span>{tr("Khám phá sự kiện", "Explore events")}</span>
          </button>
          <button type="button" className="quick-btn" onClick={() => navigate("/da-luu")}>
            <IconBookmark size={22} /><span>{tr("Xem lịch trình", "My plan")}</span>
          </button>
          <button type="button" className="quick-btn" onClick={() => navigate("/ban-do")}>
            <IconPin size={22} /><span>{tr("Mở bản đồ", "Open map")}</span>
          </button>
        </div>
        <DealsBanner />
        <ToplistBanner />
        <WeatherCard />
      </header>

      <Agenda onOpenProgram={openProgram} />

      <section className="sec">
        <button type="button" className="pass-card" onClick={() => navigate("/ho-chieu")}>
          <img className="pass-card-art" src={passportSmall} alt="" width={56} height={70} />
          <span className="pass-card-text"><b>{tr("Hộ chiếu Đà Lạt", "Da Lat Passport")}</b><i>{tr("Đến nơi, đóng dấu, sưu tập đủ bộ dấu mộc của các địa điểm và chương trình.", "Visit, get stamped and collect the full set of stamps from venues and programmes.")}</i></span>
          <IconArrow size={20} />
        </button>
      </section>

      <section className="sec feat" aria-labelledby="feat-h">
        <p className="eyebrow">{tr("Sự kiện nổi bật", "Featured")}{FESTIVAL.editionShort ? " · " + FESTIVAL.editionShort : ""}</p>
        <h2 className="h1" id="feat-h">{FESTIVAL.name} <em>{FESTIVAL.start.slice(0, 4)}</em></h2>
        {FESTIVAL.theme && <p className="lead">{FESTIVAL.theme}.</p>}
        <div className="feat-photos">
          <img className="feat-a" src={f1} alt={tr("Du khách dạo chơi và chụp ảnh giữa vườn hoa (ảnh minh họa)", "Visitors strolling and taking photos in a flower garden (illustration)")} />
          <img className="feat-b" src={f2} alt={tr("Đêm nhạc acoustic ngoài trời (ảnh minh họa)", "Outdoor acoustic night (illustration)")} />
          <img className="feat-c" src={f3} alt={tr("Chợ đêm với món nướng và dâu tây (ảnh minh họa)", "Night market with grilled food and strawberries (illustration)")} loading="lazy" />
          <div className="count">
            <b>{cd.big}</b>
            <span>{cd.small}</span>
          </div>
        </div>
        <p className="muted small">{tr("Ảnh minh họa không khí mùa lễ hội, không phải ảnh chụp tại sự kiện.", "Illustrative photos of the festival season, not taken at the event.")}</p>
        <div className="tiles tiles-in">
          <div className="tile tile-pink">
            <span className="tile-k">{tr("Thời gian", "Dates")}</span>
            <b>{FESTIVAL.dateRange}</b>
            <span className="tile-s">{FESTIVAL.place}</span>
          </div>
          <div className="tile tile-mint">
            <span className="tile-k">{tr("Khai mạc", "Opening")}</span>
            <b>{FESTIVAL.openingLabel}</b>
            <span className="tile-s"><IconPin size={14} />{FESTIVAL.openingVenue}{FESTIVAL.openingTentative ? tr(" · dự kiến", " · tentative") : ""}</span>
          </div>
          <div className="tile tile-blue">
            <span className="tile-k">{tr("Quy mô", "Scale")}</span>
            <b>{total} {tr("chương trình chính", "main programmes")}</b>
            <span className="tile-s">{others > 0 ? tr(`cùng ${others} hoạt động khác`, `plus ${others} other activities`) : tr("theo cổng chính thức", "per the official portal")}</span>
          </div>
          <div className="tile tile-yellow">
            <span className="tile-k">{tr("Trạng thái", "Status")}</span>
            <b>{live > 0 ? tr(`${live} đang diễn ra`, `${live} happening now`) : done === total && total > 0 ? tr("Đã kết thúc", "Finished") : tr("Chưa bắt đầu", "Not started yet")}</b>
            <span className="tile-s">{total - live - done} {tr("sắp tới", "upcoming")}{done > 0 ? tr(` · ${done} đã xong`, ` · ${done} done`) : ""}</span>
          </div>
        </div>
        <div className="cta cta-in">
          <button type="button" className="btn btn-ink btn-wide" onClick={() => navigate("/chuong-trinh")}>
            {tr(`Xem ${total} chương trình`, `See ${total} programmes`)} <IconArrow size={20} />
          </button>
        </div>
      </section>

      <section className="sec about">
        <h2 className="h2">{tr("Về DalatEvent", "About DalatEvent")}</h2>
        <p>{tr("DalatEvent là cổng thông tin sự kiện Đà Lạt do Sense Group vận hành.", "DalatEvent is Da Lat's events guide, run by Sense Group.")}</p>
        <div className="actions">
          <button
            type="button"
            className="act"
            onClick={async () => {
              const ok = await shareText(tr(`Đà Lạt có gì vui? Lịch ${FESTIVAL.name} ${FESTIVAL.edition} (${FESTIVAL.dateRange}) và các show diễn tại Đà Lạt: ${FESTIVAL.website}`, `What's on in Da Lat? ${FESTIVAL.name} (${FESTIVAL.dateRange}) schedule and live shows in Da Lat: ${FESTIVAL.website}`), "DalatEvent");
              if (!ok) openSnackbar({ text: shareFail(), duration: 2200 });
            }}
          >
            <IconShare />{tr("Chia sẻ", "Share")}
          </button>
          <button type="button" className="act" onClick={() => navigate("/uu-dai")}>
            <IconBookmark />{tr("Dalat Deals: ưu đãi đối tác", "Dalat Deals: partner offers")}
          </button>
          <button type="button" className="act" onClick={() => navigate("/nhung-lich")}>
            <IconGlobe />{tr("Nhúng lịch và mã QR cho đối tác", "Embed the calendar and QR codes for partners")}
          </button>
        </div>
        <p className="muted small">© {new Date().getFullYear()} DalatEvent · Sense Group</p>
        <button type="button" className="acc-switch link-left" onClick={() => navigate("/quyen-rieng-tu")}>{tr("Chính sách quyền riêng tư", "Privacy policy")}</button>
      </section>
      {sheet}
    </div>
  );
};

export default HomePage;
