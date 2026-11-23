import React, { FC, useEffect, useMemo, useState } from "react";
import { PROGRAMS, Program } from "../data/festival";
import { getData, onDataChange } from "../data/store";
import { AgendaItem, arrange, buildAgenda, Kind, Preset, upcomingOnly, vnDate, vnDayMonth, vnTime, windowOf } from "../utils/agenda";
import { openUrl } from "../utils/device";
import { IconArrow, IconPin } from "./icons";

const PRESETS: { id: Preset; label: string }[] = [
  { id: "today", label: "Hôm nay" },
  { id: "tonight", label: "Tối nay" },
  { id: "weekend", label: "Cuối tuần" },
  { id: "upcoming", label: "Sắp diễn ra" },
];
const KINDS: { id: Kind | "all"; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "festival", label: "Festival Hoa" },
  { id: "event", label: "Sự kiện khác" },
  { id: "show", label: "Show diễn" },
];
const dmy = (iso: string) => iso.slice(8, 10) + "." + iso.slice(5, 7) + "." + iso.slice(0, 4);

/** Dựng danh sách sự kiện trong một khoảng thời gian từ dữ liệu hiện có của site */
export function agendaFor(from: number, to: number, now: number): AgendaItem[] {
  const d = getData();
  return buildAgenda(d.events.events, d.shows.stages, from, to, now + 14 * 86400000, d.happening.items);
}

/** Một dòng sự kiện, dùng chung cho mục "Đang diễn ra" và kết quả tìm kiếm */
export const AgendaRow: FC<{ it: AgendaItem; showDate: boolean; now: number; onOpenProgram: (p: Program) => void }> = ({ it, showDate, now, onOpenProgram }) => {
  const live = it.status === "published" && it.start <= now && now <= it.end;
  const sameDay = vnDate(it.start) === vnDate(it.end);
  let big: string;
  let small: string;
  if (it.allDay) {
    const started = it.start <= now;
    big = sameDay ? (showDate ? vnDayMonth(it.start) : "Cả ngày") : started ? "Đến" : vnDayMonth(it.start);
    small = sameDay ? (showDate ? "cả ngày" : vnDayMonth(it.start)) : started ? vnDayMonth(it.end) : "đến " + vnDayMonth(it.end);
  } else {
    big = vnTime(it.start);
    small = showDate ? vnDayMonth(it.start) : it.endEstimated ? "bắt đầu" : "đến " + vnTime(it.end);
  }
  const program = it.programId ? PROGRAMS.find((x) => x.id === it.programId) : undefined;
  const action = program ? () => onOpenProgram(program) : it.url ? () => openUrl(it.url!) : undefined;
  const body = (
    <React.Fragment>
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
        {it.kind === "event" && it.desc && <span className="ag-desc">{it.desc}</span>}
        {it.verifiedAt && <span className="ag-src">{it.kind === "show" ? "Theo trang của điểm diễn" : "Theo cổng chính thức"}, đối chiếu {dmy(it.verifiedAt)}</span>}
      </span>
      {action && <span className="ag-go"><IconArrow size={18} /></span>}
    </React.Fragment>
  );
  const cls = "ag-row is-" + it.kind;
  return <li>{action ? <button type="button" className={cls} onClick={action}>{body}</button> : <div className={cls}>{body}</div>}</li>;
};

/** Mục "Đang diễn ra tại Đà Lạt": Festival, sự kiện khác và show diễn, lọc theo ngày (giờ Việt Nam) */
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

  const minute = Math.floor(now / 60000);
  const win = useMemo(() => windowOf(preset, now, picked), [preset, picked, minute]);
  const view = useMemo(() => {
    const all = agendaFor(win.from, win.to, now);
    if (preset === "upcoming") {
      const list = upcomingOnly(kind === "all" ? all : all.filter((x) => x.kind === kind), win.from, 12);
      return { timed: list, allDay: [], longRunning: [] };
    }
    return arrange(all, kind);
  }, [win.from, win.to, kind, tick, preset]);

  const showDate = preset === "upcoming" || win.to - win.from > 86400000;
  const total = view.timed.length + view.allDay.length + view.longRunning.length;
  const today = vnDate(now);
  const updated = getData().happening.updated_label;

  return (
    <section className="sec agenda" id="dang-dien-ra" aria-labelledby="ag-h">
      <p className="eyebrow">Giờ Việt Nam · {win.label}</p>
      <h2 className="h2" id="ag-h">Đang diễn ra <em>tại Đà Lạt</em></h2>
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
          <span>Thử chọn "Cuối tuần", "Sắp diễn ra" hoặc một ngày khác.</span>
        </div>
      ) : (
        <React.Fragment>
          {view.timed.length + view.allDay.length > 0 && (
            <ul className="ag-list">
              {view.timed.map((it) => <AgendaRow key={it.key} it={it} showDate={showDate} now={now} onOpenProgram={onOpenProgram} />)}
              {view.allDay.map((it) => <AgendaRow key={it.key} it={it} showDate={showDate} now={now} onOpenProgram={onOpenProgram} />)}
            </ul>
          )}
          {view.longRunning.length > 0 && (
            <React.Fragment>
              <p className="ag-sub">Đang diễn ra dài ngày</p>
              <ul className="ag-list">
                {view.longRunning.map((it) => <AgendaRow key={it.key} it={it} showDate={showDate} now={now} onOpenProgram={onOpenProgram} />)}
              </ul>
            </React.Fragment>
          )}
        </React.Fragment>
      )}
      {updated && <p className="muted small">Dữ liệu cập nhật đến ngày {updated}. Lịch có thể thay đổi, hãy kiểm tra lại trước khi đến.</p>}
    </section>
  );
};
