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
import { tr } from "../i18n";

/** Ảnh minh họa do chủ dự án cung cấp ngày 23.11.2026 (ảnh tạo bằng AI, không phải ảnh chụp tại sự kiện) */
const GALLERY = [
  { src: m0, alt: "Đón bình minh trên biển mây|Sunrise over a sea of clouds" },
  { src: m1, alt: "Dạo vườn hoa giữa mùa cẩm tú cầu|Hydrangea garden walk" },
  { src: m2, alt: "Chợ đêm: bắp nướng, sữa đậu nành, dâu tây|Night market: grilled corn, soy milk, strawberries" },
  { src: m3, alt: "Đêm nhạc acoustic bên đồi|Acoustic night on the hill" },
  { src: m4, alt: "Đạp xe quanh hồ|Cycling around the lake" },
  { src: m5, alt: "Cà phê sáng giữa rừng thông|Morning coffee in the pine forest" },
  { src: m6, alt: "Hái dâu tại vườn|Strawberry picking" },
  { src: m7, alt: "Cắm trại trên đồi thông|Camping on a pine hill" },
  { src: m8, alt: "Ngắm hoàng hôn trên đồi cỏ|Sunset on the grass hill" },
  { src: m9, alt: "Săn ảnh buổi sớm|Early morning photography" },
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
        <h1 className="h1">{PROGRAMS.length}{tr(" chương trình, ", " programmes, ")}<em>{tr("một mùa hoa", "one flower season")}</em></h1>
        <div className="filters" role="tablist" aria-label={tr("Lọc theo loại chương trình", "Filter by type")}>
          <button type="button" role="tab" aria-selected={cat === "all"} className={"fb" + (cat === "all" ? " on" : "")} onClick={() => setCat("all")}>
            {tr("Tất cả", "All")}
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
          {tr("Theo cổng thông tin chính thức festivaldalat.lamdongtructuyen.vn, đối chiếu ngày 23.11.2026. Lịch có thể thay đổi.", "Per the official portal festivaldalat.lamdongtructuyen.vn, checked 23.11.2026. Schedules may change.")}
        </p>
        <section className="sec sec-flush">
          <div className="sec-head pad">
            <h2 className="h2">{tr("Đà Lạt mùa hoa", "Da Lat in bloom")}</h2>
            <p className="muted small">{tr("Ảnh minh họa trải nghiệm tại Đà Lạt.", "Illustrative photos of things to do in Da Lat.")}</p>
          </div>
          <div className="gallery">
            {GALLERY.map((g) => (
              <figure key={g.alt}>
                <img src={g.src} alt={tr(g.alt.split("|")[0], g.alt.split("|")[1])} loading="lazy" />
                <figcaption>{tr(g.alt.split("|")[0], g.alt.split("|")[1])}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="band band-pink">
          <p className="eyebrow">{tr("Nhìn lại kỳ X · 2024", "Looking back · 10th edition, 2024")}</p>
          <h2 className="h2">{tr("Quy mô Festival Hoa Đà Lạt 2024", "Da Lat Flower Festival 2024 in numbers")}</h2>
          <div className="stats">
            {STATS_2024().map((s) => (
              <div key={s.label}>
                <b>{s.value}</b>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
          <p className="muted small">{tr("Nguồn: ", "Sources: ")}Thời báo Tài chính Việt Nam, VOV, Báo Văn hóa, Sài Gòn Giải Phóng.</p>
        </section>
      </div>
      {sheet}
    </div>
  );
};

export default ProgramPage;
