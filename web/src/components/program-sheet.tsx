import React, { FC } from "react";
import { Sheet } from "../ui";
import { FESTIVAL, Program } from "../data/festival";
import { openDirections, shareText } from "../utils/device";
import { statusOf } from "../utils/time";
import { catOf } from "./program-card";
import { IconBookmark, IconPin, IconRoute, IconShare } from "./icons";

interface Props {
  program: Program | null;
  saved: boolean;
  onClose: () => void;
  onToggleSave: (p: Program) => void;
  onShared?: (ok: boolean) => void;
}

export const ProgramSheet: FC<Props> = ({ program, saved, onClose, onToggleSave, onShared }) => {
  const p = program;
  const cat = p ? catOf(p.cat) : null;
  const status = p ? statusOf(p) : "upcoming";
  return (
    <Sheet visible={!!p} onClose={onClose} autoHeight mask handler swipeToClose>
      {p && cat && (
        <div className="ps">
          <div className="ps-head" style={{ background: cat.tint }}>
            <span className="ps-day" style={{ color: cat.color }}>{p.day}</span>
            <span className="ps-sub">{p.sub}{p.tentative ? " · dự kiến" : ""}</span>
          </div>
          <div className="pc-tags">
            <span className="chip" style={{ color: cat.color }}>{cat.label}</span>
            {status === "live" && <span className="chip chip-live">Đang diễn ra</span>}
            {status === "ended" && <span className="chip chip-muted">Đã kết thúc</span>}
          </div>
          <h2 className="ps-title">{p.title}</h2>
          <p className="ps-desc">{p.desc}</p>
          <p className="ps-venue"><IconPin size={18} />{p.venue}</p>
          {p.note && <p className="ps-note">{p.note}</p>}
          {p.tentative && !p.note && (
            <p className="ps-note">Lịch dự kiến, có thể thay đổi. Vui lòng kiểm tra lại trước khi đến.</p>
          )}
          <div className="ps-actions">
            <button type="button" className={"btn " + (saved ? "btn-soft" : "btn-ink")} onClick={() => onToggleSave(p)}>
              <IconBookmark size={20} filled={saved} />
              {saved ? "Đã lưu" : "Lưu chương trình"}
            </button>
            {p.mapQuery && (
              <button type="button" className="btn btn-line" onClick={() => openDirections(p.mapQuery!)}>
                <IconRoute size={20} />Chỉ đường
              </button>
            )}
            <button
              type="button"
              className="btn btn-line"
              onClick={async () => {
                const ok = await shareText(
                  `${p.title} — ${p.day}${p.sub ? ", " + p.sub : ""} tại ${p.venue}. Xem lịch sự kiện Đà Lạt: ${FESTIVAL.website}`,
                  FESTIVAL.name + " " + FESTIVAL.edition
                );
                onShared?.(ok);
              }}
            >
              <IconShare size={20} />Chia sẻ
            </button>
          </div>
        </div>
      )}
    </Sheet>
  );
};
