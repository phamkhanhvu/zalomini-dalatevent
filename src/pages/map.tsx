import React, { FC } from "react";
import { PROGRAMS, VENUES } from "../data/festival";
import { openDirections } from "../utils/zalo";
import { useProgramSheet } from "../components/use-program-sheet";
import { IconArrow, IconRoute } from "../components/icons";

const MapPage: FC = () => {
  const { sheet, openProgram } = useProgramSheet();
  return (
    <div className="page page-col">
      <header className="top">
        <p className="eyebrow">7 điểm đến</p>
        <h1 className="h1">Bản đồ <em>festival</em></h1>
        <p className="muted">Chọn địa điểm để xem chương trình và mở chỉ đường bằng Google Maps.</p>
      </header>
      <div className="scroll grow">
        <div className="list pad">
          {VENUES.map((v, i) => (
            <article className="venue" key={v.id}>
              <div className="venue-head">
                <span className="venue-no" style={{ background: v.color }}>{i + 1}</span>
                <h2>{v.name}</h2>
              </div>
              <ul>
                {v.programs.map((id) => {
                  const p = PROGRAMS.find((x) => x.id === id);
                  if (!p) return null;
                  return (
                    <li key={id}>
                      <button type="button" onClick={() => openProgram(p)}>
                        <span className="venue-day">{p.day}{p.sub && p.sub !== "trong ngày" ? " · " + p.sub : ""}</span>
                        <span className="venue-title">{p.title}{p.tentative ? " (dự kiến)" : ""}</span>
                        <IconArrow size={18} />
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button type="button" className="btn btn-line btn-wide" onClick={() => openDirections(v.mapQuery)}>
                <IconRoute size={20} />Chỉ đường đến đây
              </button>
            </article>
          ))}
        </div>
        <p className="muted small pad foot">Các mục dự kiến có thể thay đổi, vui lòng kiểm tra lại trước khi đến.</p>
      </div>
      {sheet}
    </div>
  );
};

export default MapPage;
