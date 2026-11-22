import React, { FC } from "react";
import { useNavigate } from "react-router";
import { PROGRAMS } from "../data/festival";
import { ProgramCard } from "../components/program-card";
import { useProgramSheet } from "../components/use-program-sheet";
import { IconArrow, IconBookmark } from "../components/icons";

const SavedPage: FC = () => {
  const navigate = useNavigate();
  const { sheet, openProgram, toggleSave, saved } = useProgramSheet();
  const list = PROGRAMS.filter((p) => saved.has(p.id)).sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  return (
    <div className="page page-col">
      <header className="top">
        <p className="eyebrow">Lịch của bạn</p>
        <h1 className="h1">Chương trình <em>đã lưu</em></h1>
      </header>
      <div className="scroll grow">
        {list.length === 0 ? (
          <div className="empty">
            <span className="empty-ico"><IconBookmark size={30} /></span>
            <h2>Chưa có chương trình nào</h2>
            <p>Bấm biểu tượng dấu trang ở mỗi chương trình để lưu lại và xem nhanh ở đây.</p>
            <button type="button" className="btn btn-ink" onClick={() => navigate("/chuong-trinh")}>
              Xem chương trình <IconArrow size={20} />
            </button>
          </div>
        ) : (
          <div className="list pad">
            {list.map((p) => (
              <ProgramCard key={p.id} program={p} saved onOpen={openProgram} onToggleSave={toggleSave} />
            ))}
          </div>
        )}
      </div>
      {sheet}
    </div>
  );
};

export default SavedPage;
