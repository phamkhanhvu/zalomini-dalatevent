import React, { FC, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { onDataChange } from "../data/store";
import { CATEGORIES, CatId, FESTIVAL, PROGRAMS, STATS_2024 } from "../data/festival";
import f1 from "../static/img/quang-truong-lam-vien-hoa.jpg";
import f2 from "../static/img/ho-xuan-huong-hoang-hon.jpg";
import f3 from "../static/img/cho-da-lat-mua-hoa.jpg";
import g2 from "../static/img/ho-xuan-huong-suong-som.jpg";
import g5 from "../static/img/ga-da-lat-vuon-hoa.jpg";
import g6 from "../static/img/ga-da-lat-cam-tu-cau.jpg";
import { ProgramCard } from "../components/program-card";
import { useProgramSheet } from "../components/use-program-sheet";

const GALLERY = [
  { src: f1, alt: "Quảng trường Lâm Viên mùa hoa" },
  { src: g2, alt: "Hồ Xuân Hương trong sương sớm" },
  { src: f3, alt: "Chợ Đà Lạt mùa hoa" },
  { src: f2, alt: "Hồ Xuân Hương lúc hoàng hôn" },
  { src: g5, alt: "Vườn hoa trước ga Đà Lạt" },
  { src: g6, alt: "Ga Đà Lạt giữa mùa cẩm tú cầu" },
];

const ProgramPage: FC = () => {
  const [cat, setCat] = useState<CatId | "all">("all");
  const { sheet, openProgram, toggleSave, saved } = useProgramSheet();
  // Link có ?xem=<mã> (từ mã QR hoặc chia sẻ) mở thẳng chương trình đó
  const [params] = useSearchParams();
  const want = params.get("xem");
  const [tick, setTick] = useState(0);
  useEffect(() => onDataChange(() => setTick((n) => n + 1)), []);
  useEffect(() => {
    const p = want ? PROGRAMS.find((x) => x.id === want) : undefined;
    if (p) openProgram(p);
  }, [want, tick]);

  const list = useMemo(
    () =>
      PROGRAMS.filter((p) => cat === "all" || p.cat === cat).sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      ),
    [cat]
  );

  return (
    <div className="page page-col">
      <header className="top">
        <p className="eyebrow">{FESTIVAL.name} {FESTIVAL.edition} · {FESTIVAL.dateRange}</p>
        <h1 className="h1">{PROGRAMS.length} chương trình, <em>một mùa hoa</em></h1>
        <div className="filters" role="tablist" aria-label="Lọc theo loại chương trình">
          <button type="button" role="tab" aria-selected={cat === "all"} className={"fb" + (cat === "all" ? " on" : "")} onClick={() => setCat("all")}>
            Tất cả
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" role="tab" aria-selected={cat === c.id} className={"fb" + (cat === c.id ? " on" : "")} onClick={() => setCat(c.id)}>
              <i style={{ background: c.color }} />{c.label}
            </button>
          ))}
        </div>
      </header>
      <div className="scroll grow">
        <div className="list pad">
          {list.map((p) => (
            <ProgramCard key={p.id} program={p} saved={saved.has(p.id)} onOpen={openProgram} onToggleSave={toggleSave} />
          ))}
        </div>
        <p className="muted small pad foot">
          Theo cổng thông tin chính thức festivaldalat.lamdongtructuyen.vn, đối chiếu ngày 23.11.2026. Lịch có thể thay đổi.
        </p>
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
      </div>
      {sheet}
    </div>
  );
};

export default ProgramPage;
