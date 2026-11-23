import React, { FC, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { onDataChange } from "../data/store";
import { CATEGORIES, CatId, FESTIVAL, PROGRAMS, STATS_2024 } from "../data/festival";
import m0 from "../static/img/md-san-may-binh-minh.jpg";
import m1 from "../static/img/md-vuon-hoa.jpg";
import m2 from "../static/img/md-cho-dem.jpg";
import m3 from "../static/img/md-dem-nhac-acoustic.jpg";
import m4 from "../static/img/md-dap-xe-ho.jpg";
import m5 from "../static/img/md-ca-phe-doi-thong.jpg";
import m6 from "../static/img/md-hai-dau.jpg";
import m7 from "../static/img/md-cam-trai.jpg";
import m8 from "../static/img/md-hoang-hon-doi-co.jpg";
import m9 from "../static/img/md-sang-ben-ho.jpg";
import { ProgramCard } from "../components/program-card";
import { useProgramSheet } from "../components/use-program-sheet";

/** Ảnh minh họa do chủ dự án cung cấp ngày 23.11.2026 (ảnh tạo bằng AI, không phải ảnh chụp tại sự kiện) */
const GALLERY = [
  { src: m0, alt: "Đón bình minh trên biển mây" },
  { src: m1, alt: "Dạo vườn hoa giữa mùa cẩm tú cầu" },
  { src: m2, alt: "Chợ đêm: bắp nướng, sữa đậu nành, dâu tây" },
  { src: m3, alt: "Đêm nhạc acoustic bên đồi" },
  { src: m4, alt: "Đạp xe quanh hồ" },
  { src: m5, alt: "Cà phê sáng giữa rừng thông" },
  { src: m6, alt: "Hái dâu tại vườn" },
  { src: m7, alt: "Cắm trại trên đồi thông" },
  { src: m8, alt: "Ngắm hoàng hôn trên đồi cỏ" },
  { src: m9, alt: "Săn ảnh buổi sớm" },
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
            <p className="muted small">Ảnh minh họa trải nghiệm tại Đà Lạt.</p>
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
