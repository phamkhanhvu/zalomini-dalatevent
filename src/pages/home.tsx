import React, { FC, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useSnackbar } from "zmp-ui";
import { FESTIVAL, Happening, HAPPENING_FALLBACK, PROGRAMS, STATS_2024 } from "../data/festival";
import { countdown, statusOf } from "../utils/time";
import { loadHappening } from "../utils/live";
import { addFavorite, callPhone, openUrl, shareText } from "../utils/zalo";
import { ProgramCard } from "../components/program-card";
import { useProgramSheet } from "../components/use-program-sheet";
import { IconArrow, IconGlobe, IconHeart, IconPhone, IconPin, IconShare } from "../components/icons";

import heroImg from "../static/img/ga-da-lat-cam-tu-cau.jpg";
import g1 from "../static/img/quang-truong-lam-vien-hoa.jpg";
import g2 from "../static/img/ho-xuan-huong-suong-som.jpg";
import g3 from "../static/img/cho-da-lat-mua-hoa.jpg";
import g4 from "../static/img/ho-xuan-huong-hoang-hon.jpg";
import g5 from "../static/img/ga-da-lat-vuon-hoa.jpg";

const GALLERY = [
  { src: g1, alt: "Quảng trường Lâm Viên mùa hoa" },
  { src: g2, alt: "Hồ Xuân Hương trong sương sớm" },
  { src: g3, alt: "Chợ Đà Lạt mùa hoa" },
  { src: g4, alt: "Hồ Xuân Hương lúc hoàng hôn" },
  { src: g5, alt: "Vườn hoa trước ga Đà Lạt" },
];

const HomePage: FC = () => {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { sheet, openProgram, toggleSave, saved } = useProgramSheet();
  const [happening, setHappening] = useState<Happening[]>(HAPPENING_FALLBACK);
  const [updated, setUpdated] = useState<string>(FESTIVAL.updated);

  useEffect(() => {
    let alive = true;
    loadHappening().then((r) => {
      if (!alive) return;
      setHappening(r.items);
      if (r.updated) setUpdated(r.updated);
    });
    return () => {
      alive = false;
    };
  }, []);

  const cd = useMemo(
    () => countdown(FESTIVAL.opening, FESTIVAL.end, FESTIVAL.openingTentative),
    []
  );

  const next = useMemo(
    () =>
      PROGRAMS.filter((p) => statusOf(p) !== "ended")
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .filter((p) => p.id !== "trong-hoa")
        .slice(0, 3),
    []
  );

  return (
    <div className="scroll page">
      <header className="hero">
        <div className="brand">
          <span className="brand-name">Dalat<b>Event</b></span>
          <span className="brand-tag">Kỳ thứ XI</span>
        </div>
        <p className="eyebrow">Tháng 12.2026 · Đà Lạt, Lâm Đồng</p>
        <h1 className="display">
          Festival Hoa <em>Đà Lạt</em> 2026
        </h1>
        <p className="lead">{FESTIVAL.theme}.</p>
        <div className="hero-photo">
          <img src={heroImg} alt="Ga Đà Lạt giữa mùa cẩm tú cầu" />
          <div className="count">
            <b>{cd.big}</b>
            <span>{cd.small}</span>
          </div>
        </div>
      </header>

      <section className="tiles">
        <div className="tile tile-pink">
          <span className="tile-k">Khai mạc</span>
          <b>{FESTIVAL.openingLabel}</b>
          <span className="tile-s"><IconPin size={14} />Quảng trường Lâm Viên{FESTIVAL.openingTentative ? " · dự kiến" : ""}</span>
        </div>
        <div className="tile tile-mint">
          <span className="tile-k">Quy mô</span>
          <b>11 chương trình chính</b>
          <span className="tile-s">cùng 25 hoạt động hưởng ứng</span>
        </div>
      </section>

      <div className="cta">
        <button type="button" className="btn btn-ink btn-wide" onClick={() => navigate("/chuong-trinh")}>
          Xem 11 chương trình <IconArrow size={20} />
        </button>
        <button type="button" className="btn btn-line" onClick={() => navigate("/ban-do")}>
          <IconPin size={20} />Bản đồ
        </button>
      </div>

      <section className="band band-blue">
        <p className="eyebrow">Tại Đà Lạt lúc này</p>
        <h2 className="h2">Đang diễn ra và sắp tới</h2>
        <p className="muted">Cập nhật đến ngày {updated}. Lịch có thể thay đổi, hãy kiểm tra lại trước khi đến.</p>
        <div className="hap">
          {happening.slice(0, 6).map((h, i) => (
            <article className="hap-item" key={i}>
              <div className="hap-when">
                {h.live && <span className="chip chip-live">Đang diễn ra</span>}
                <span>{h.when}</span>
              </div>
              <h3>{h.title}</h3>
              <p>{h.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {next.length > 0 && (
        <section className="sec">
          <div className="sec-head">
            <h2 className="h2">Sắp tới trong festival</h2>
            <button type="button" className="link" onClick={() => navigate("/chuong-trinh")}>Tất cả</button>
          </div>
          <div className="list">
            {next.map((p) => (
              <ProgramCard key={p.id} program={p} saved={saved.has(p.id)} onOpen={openProgram} onToggleSave={toggleSave} />
            ))}
          </div>
        </section>
      )}

      <section className="sec sec-flush">
        <div className="sec-head pad">
          <h2 className="h2">Đà Lạt mùa hoa</h2>
        </div>
        <div className="gallery">
          {GALLERY.map((g) => (
            <figure key={g.alt}>
              <img src={g.src} alt={g.alt} loading="lazy" />
              <figcaption>{g.alt}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="band band-pink">
        <p className="eyebrow">Nhìn lại kỳ X · 2024</p>
        <h2 className="h2">Quy mô Festival Hoa Đà Lạt 2024</h2>
        <div className="stats">
          {STATS_2024.map((s) => (
            <div key={s.label}>
              <b>{s.value}</b>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
        <p className="muted small">Nguồn: Thời báo Tài chính Việt Nam, VOV, Báo Văn hóa, Sài Gòn Giải Phóng.</p>
      </section>

      <section className="sec about">
        <h2 className="h2">Về DalatEvent</h2>
        <p>
          DalatEvent là cổng thông tin sự kiện Đà Lạt do Sense Group vận hành — đơn vị truyền thông chính thức của
          Festival Hoa Đà Lạt lần thứ XI.
        </p>
        <div className="actions">
          <button type="button" className="act" onClick={() => openUrl(FESTIVAL.website)}>
            <IconGlobe />dalatevent.com
          </button>
          <button type="button" className="act" onClick={() => callPhone(FESTIVAL.hotline)}>
            <IconPhone />{FESTIVAL.hotlineLabel}
          </button>
          <button
            type="button"
            className="act"
            onClick={async () => {
              const ok = await shareText(
                `Lịch ${FESTIVAL.name} ${FESTIVAL.edition}: 11 chương trình chính, khai mạc ${FESTIVAL.openingLabel.toLowerCase()}${FESTIVAL.openingTentative ? " (dự kiến)" : ""}. ${FESTIVAL.website}`,
                "DalatEvent"
              );
              if (!ok) openSnackbar({ text: "Chưa chia sẻ được, hãy thử lại trong Zalo", duration: 2200 });
            }}
          >
            <IconShare />Chia sẻ
          </button>
          <button
            type="button"
            className="act"
            onClick={async () => {
              const ok = await addFavorite();
              openSnackbar({
                text: ok ? "Đã thêm DalatEvent vào mục yêu thích" : "Chưa thêm được, hãy thử lại trong Zalo",
                type: ok ? "success" : undefined,
                duration: 2200,
              });
            }}
          >
            <IconHeart />Yêu thích
          </button>
        </div>
        <p className="muted small">© 2026 DalatEvent · Sense Group · 304 Hai Bà Trưng, Đà Lạt</p>
      </section>
      {sheet}
    </div>
  );
};

export default HomePage;
