import React, { FC, useEffect, useMemo, useState } from "react";
import { PROGRAMS, Program } from "../data/festival";
import { getData, onDataChange } from "../data/store";
import { AgendaItem, arrange, buildAgenda, Kind, Preset, vnDate, vnDayMonth, vnTime, windowOf } from "../utils/agenda";
import { openUrl } from "../utils/device";
import { IconArrow, IconPin } from "./icons";

const PRESETS: { id: Preset; label: string }[] = [
  { id: "today", label: "Hôm nay" },
  { id: "tonight", label: "Tối nay" },
  { id: "tomorrow", label: "Ngày mai" },
  { id: "weekend", label: "Cuối tuần" },
];
const KINDS: { id: Kind | "all"; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "festival", label: "Festival và sự kiện" },
  { id: "show", label: "Show diễn" },
];
const dmy = (iso: string) => iso.slice(8, 10) + "." + iso.slice(5, 7) + "." + iso.slice(0, 4);

const Row: FC<{ it: AgendaItem; multiDay: boolean; now: number; onOpen: (it: AgendaItem) => void }> = ({ it, multiDay, now, onOpen }) => {
  const live = it.status === "published" && it.start <= now && now <= it.end;
  let big: string;
  let small: string;
  if (it.allDay) {
    big = vnDate(it.start) === vnDate(it.end) ? "Cả ngày" : "Đến";
    small = vnDate(it.start) === vnDate(it.end) ? vnDayMonth(it.start) : vnDayMonth(it.end);
  } else {
    big = vnTime(it.start);
    small = multiDay ? vnDayMonth(it.start) : it.endEstimated ? "bắt đầu" : "đến " + vnTime(it.end);
  }
  return (
    <li>
      <button type="button" className={"ag-row" + (it.kind === "show" ? " is-show" : "")} onClick={() => onOpen(it)}>
        <span className="ag-time"><b>{big}</b><i>{small}</i></span>
        <span className="ag-body">
          <span className="pc-tags">
            <span className="chip">{it.label}</span>
            {live && <span className="chip chip-live">Đang diễn ra</span>}
            {it.status === "postponed" && <span className="chip chip-warn">Tạm hoãn</span>}
            {it.tentative && <span className="chip chip-muted">Dự kiến</span>}
          </span>
          <span className="pc-title">{it.title}</span>
          <span className="pc-venue"><IconPin size={15} />{it.venue}</span>
          {it.verifiedAt && <span className="ag-src">{it.kind === "show" ? "Theo trang của điểm diễn" : "Theo cổng chính thức"}, đối chiếu {dmy(it.verifiedAt)}</span>}
        </span>
        <span className="ag-go"><IconArrow size={18} /></span>
      </button>
    </li>
  );
};

/** Mục "Đà Lạt có gì?": lọc sự kiện và show theo ngày, tính theo giờ Việt Nam */
export const Agenda: FC<{ onOpenProgram: (p: Program) => void }> = ({ onOpenProgram }) => {
  const [preset, setPreset] = useState<Preset>("today");
  const [picked, setPicked] = useState<string>("");
  const [kind, setKind] = useState<Kind | "all">("all");
  const [now, setNow] = useState(() => Date.now());
  const [tick, setTick] = useState(0);

  useEffect(() => onDataChange(() => setTick((n) => n + 1)), []);
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(t);
  }, []);

  const win = useMemo(() => windowOf(preset, now, picked), [preset, picked, Math.floor(now / 60000)]);
  const view = useMemo(() => {
    const d = getData();
    return arrange(buildAgenda(d.events.events, d.shows.stages, win.from, win.to, now + 14 * 86400000), kind);
  }, [win.from, win.to, kind, tick]);

  const multiDay = win.to - win.from > 86400000;
  const total = view.timed.length + view.allDay.length + view.longRunning.length;
  const open = (it: AgendaItem) => {
    if (it.programId) {
      const p = PROGRAMS.find((x) => x.id === it.programId);
      if (p) return onOpenProgram(p);
    }
    if (it.url) openUrl(it.url);
  };
  const today = vnDate(now);

  return (
    <section className="sec agenda" aria-labelledby="ag-h">
      <p className="eyebrow">Giờ Việt Nam · {win.label}</p>
      <h2 className="h2" id="ag-h">Đà Lạt <em>có gì?</em></h2>
      <div className="filters" role="tablist" aria-label="Chọn ngày">
        {PRESETS.map((p) => (
          <button key={p.id} type="button" role="tab" aria-selected={preset === p.id} className={"fb" + (preset === p.id ? " on" : "")} onClick={() => setPreset(p.id)}>
            {p.label}
          </button>
        ))}
        <label className={"fb fb-date" + (preset === "date" ? " on" : "")}>
          <span>{preset === "date" && picked ? dmy(picked) : "Chọn ngày"}</span>
          <input
            type="date"
            aria-label="Chọn ngày"
            min={today}
            value={picked}
            onChange={(e) => {
              setPicked(e.target.value);
              setPreset(e.target.value ? "date" : "today");
            }}
          />
        </label>
      </div>
      <div className="filters filters-sub" role="tablist" aria-label="Lọc theo loại">
        {KINDS.map((k) => (
          <button key={k.id} type="button" role="tab" aria-selected={kind === k.id} className={"fb fb-sm" + (kind === k.id ? " on" : "")} onClick={() => setKind(k.id)}>
            {k.label}
          </button>
        ))}
      </div>

      {total === 0 ? (
        <div className="ag-empty">
          <b>Chưa có sự kiện nào trong dữ liệu cho {win.label.toLowerCase()}.</b>
          <span>Thử chọn "Cuối tuần" hoặc một ngày khác. Lịch được cập nhật mỗi sáng.</span>
        </div>
      ) : (
        <React.Fragment>
          {view.timed.length + view.allDay.length > 0 && (
            <ul className="ag-list">
              {view.timed.map((it) => <Row key={it.key} it={it} multiDay={multiDay} now={now} onOpen={open} />)}
              {view.allDay.map((it) => <Row key={it.key} it={it} multiDay={multiDay} now={now} onOpen={open} />)}
            </ul>
          )}
          {view.longRunning.length > 0 && (
            <React.Fragment>
              <p className="ag-sub">Đang diễn ra dài ngày</p>
              <ul className="ag-list">
                {view.longRunning.map((it) => <Row key={it.key} it={it} multiDay={multiDay} now={now} onOpen={open} />)}
              </ul>
            </React.Fragment>
          )}
        </React.Fragment>
      )}
    </section>
  );
};
