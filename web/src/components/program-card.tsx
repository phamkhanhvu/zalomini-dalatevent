import React, { FC } from "react";
import { CATEGORIES, Program } from "../data/festival";
import { statusOf } from "../utils/time";
import { IconBookmark, IconPin } from "./icons";

export const catOf = (id: Program["cat"]) => CATEGORIES.find((c) => c.id === id)!;

interface Props {
  program: Program;
  saved: boolean;
  onOpen: (p: Program) => void;
  onToggleSave: (p: Program) => void;
}

export const ProgramCard: FC<Props> = ({ program, saved, onOpen, onToggleSave }) => {
  const cat = catOf(program.cat);
  const status = statusOf(program);
  return (
    <article className={"pc" + (status === "ended" ? " is-ended" : "")}>
      <button type="button" className="pc-main" onClick={() => onOpen(program)}>
        <span className="pc-date" style={{ background: cat.tint, color: cat.color }}>
          <b>{program.day}</b>
          <i>{program.sub}</i>
        </span>
        <span className="pc-body">
          <span className="pc-tags">
            <span className="chip" style={{ color: cat.color }}>{cat.label}</span>
            {status === "live" && <span className="chip chip-live">Đang diễn ra</span>}
            {status === "ended" && <span className="chip chip-muted">Đã kết thúc</span>}
            {program.tentative && status !== "ended" && <span className="chip chip-muted">Dự kiến</span>}
          </span>
          <span className="pc-title">{program.title}</span>
          <span className="pc-venue"><IconPin size={15} />{program.venue}</span>
        </span>
      </button>
      <button
        type="button"
        className={"pc-save" + (saved ? " on" : "")}
        aria-label={saved ? "Bỏ lưu chương trình" : "Lưu chương trình"}
        aria-pressed={saved}
        onClick={() => onToggleSave(program)}
      >
        <IconBookmark size={22} filled={saved} />
      </button>
    </article>
  );
};
