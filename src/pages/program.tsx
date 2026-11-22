import React, { FC, useMemo, useState } from "react";
import { CATEGORIES, CatId, PROGRAMS } from "../data/festival";
import { ProgramCard } from "../components/program-card";
import { useProgramSheet } from "../components/use-program-sheet";

const ProgramPage: FC = () => {
  const [cat, setCat] = useState<CatId | "all">("all");
  const { sheet, openProgram, toggleSave, saved } = useProgramSheet();

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
        <p className="eyebrow">Chương trình chung của tỉnh Lâm Đồng</p>
        <h1 className="h1">Mười một chương trình, <em>một mùa hoa</em></h1>
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
          Theo poster chính thức của Festival Hoa Đà Lạt lần thứ XI. Các mục ghi “dự kiến” có thể thay đổi.
        </p>
      </div>
      {sheet}
    </div>
  );
};

export default ProgramPage;
