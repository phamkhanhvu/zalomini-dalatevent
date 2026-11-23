import React, { FC, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useSnackbar } from "../ui";
import { FESTIVAL, PROGRAMS } from "../data/festival";
import { onDataChange } from "../data/store";
import { agendaFor } from "../components/agenda";
import { useProgramSheet } from "../components/use-program-sheet";
import { IconArrow, IconBookmark, IconPin, IconShare } from "../components/icons";
import { vnDate, vnDayMonth, vnTime, vnWeekday } from "../utils/agenda";
import { arrangePlan, conflicts, PlanItem, toIcs, toPlanItem } from "../utils/itinerary";
import { usePlan } from "../utils/plan";
import { IS_NATIVE, openUrl, shareText } from "../utils/device";
import { SHARE_FAIL } from "../utils/platform";

const WEEKDAYS = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
const dmy = (d: string) => d.slice(8, 10) + "." + d.slice(5, 7) + "." + d.slice(0, 4);
const whenOf = (it: PlanItem) =>
  it.allDay
    ? vnDate(it.start) === vnDate(it.end) ? "Cả ngày " + vnDayMonth(it.start) : vnDayMonth(it.start) + " – " + vnDayMonth(it.end)
    : vnTime(it.start) + (it.endEstimated ? "" : " – " + vnTime(it.end)) + ", " + vnDayMonth(it.start);

const SavedPage: FC = () => {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { sheet, openProgram, saved } = useProgramSheet();
  const plan = usePlan();
  const [tick, setTick] = useState(0);
  useEffect(() => onDataChange(() => setTick((n) => n + 1)), []);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(t);
  }, []);

  // Chương trình Festival lấy giờ mới nhất từ dữ liệu (đổi lịch thì lịch trình đổi theo); mục khác dùng bản đã lưu
  const items = useMemo<PlanItem[]>(() => {
    const fest = agendaFor(0, 8.64e15, now).filter((x) => x.programId && saved.has(x.programId)).map(toPlanItem);
    return [...fest, ...plan.items];
  }, [saved.ids, plan.items, tick, Math.floor(now / 60000)]);
  const view = useMemo(() => arrangePlan(items, now), [items]);
  const clash = useMemo(() => conflicts(items.filter((x) => x.end >= now)), [items]);
  const upcoming = items.filter((x) => x.end >= now);

  const remove = (it: PlanItem) => {
    if (it.programId) saved.toggle(it.programId);
    else plan.toggle(it);
    openSnackbar({ text: "Đã bỏ khỏi Lịch trình", type: "success", duration: 2000 });
  };
  const open = (it: PlanItem) => {
    const p = it.programId ? PROGRAMS.find((x) => x.id === it.programId) : undefined;
    if (p) openProgram(p);
    else if (it.url) openUrl(it.url);
  };
  const exportIcs = () => {
    try {
      const blob = new Blob([toIcs(items, Date.now(), FESTIVAL.website)], { type: "text/calendar;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "lich-trinh-da-lat.ics";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch (e) {
      openSnackbar({ text: "Chưa tạo được tệp lịch, hãy thử lại", duration: 2400 });
    }
  };
  const share = async () => {
    const lines = [...upcoming].sort((a, b) => a.start - b.start).map((it) => `• ${whenOf(it)}: ${it.title} (${it.venue})`);
    const ok = await shareText(`Lịch trình Đà Lạt của tôi:\n${lines.join("\n")}\nXem lịch sự kiện Đà Lạt: ${FESTIVAL.website}`, "Lịch trình Đà Lạt");
    if (!ok) openSnackbar({ text: SHARE_FAIL, duration: 2200 });
  };

  const row = (it: PlanItem, past = false) => {
    const others = clash.get(it.id);
    const clickable = !!it.programId || !!it.url;
    const body = (
      <React.Fragment>
        <span className="ag-time"><b>{it.allDay ? (vnDate(it.start) === vnDate(it.end) ? "Cả ngày" : vnDayMonth(it.start)) : vnTime(it.start)}</b><i>{it.allDay ? (vnDate(it.start) === vnDate(it.end) ? vnDayMonth(it.start) : "đến " + vnDayMonth(it.end)) : it.endEstimated ? "bắt đầu" : "đến " + vnTime(it.end)}</i></span>
        <span className="ag-body">
          <span className="pc-tags">
            <span className="chip">{it.label}</span>
            {it.tentative && <span className="chip chip-muted">Dự kiến</span>}
            {past && <span className="chip chip-muted">Đã qua</span>}
          </span>
          <span className="pc-title">{it.title}</span>
          <span className="pc-venue"><IconPin size={15} />{it.venue}</span>
          {others && <span className="plan-warn">Trùng giờ với: {others.join(", ")}</span>}
        </span>
      </React.Fragment>
    );
    const cls = "ag-row is-" + it.kind;
    return (
      <li key={it.id} className={"ag-item is-" + it.kind + (past ? " plan-past" : "")}>
        {clickable ? <button type="button" className={cls} onClick={() => open(it)}>{body}</button> : <div className={cls}>{body}</div>}
        <button type="button" className="pc-save on" aria-label={"Bỏ " + it.title + " khỏi lịch trình"} onClick={() => remove(it)}>
          <IconBookmark size={22} filled />
        </button>
      </li>
    );
  };

  return (
    <div className="page page-col">
      <header className="top">
        <p className="eyebrow">{items.length ? `${upcoming.length} mục sắp tới · lưu trên máy của bạn` : "Lưu trên máy của bạn"}</p>
        <h1 className="h1">Lịch trình <em>của tôi</em></h1>
        {upcoming.length > 0 && (
          <div className="plan-actions">
            {!IS_NATIVE && (
              <button type="button" className="btn btn-ink" onClick={exportIcs}>Thêm vào lịch máy</button>
            )}
            <button type="button" className="btn btn-line" onClick={share}><IconShare size={18} />Chia sẻ lịch trình</button>
          </div>
        )}
      </header>
      <div className="scroll grow">
        {items.length === 0 ? (
          <div className="empty">
            <span className="empty-ico"><IconBookmark size={30} /></span>
            <h2>Chưa có mục nào</h2>
            <p>Bấm biểu tượng dấu trang ở chương trình, sự kiện hoặc show diễn để xếp vào lịch trình theo ngày.</p>
            <button type="button" className="btn btn-ink" onClick={() => navigate("/")}>
              Khám phá sự kiện <IconArrow size={20} />
            </button>
          </div>
        ) : (
          <div className="pad plan">
            {clash.size > 0 && <p className="plan-summary">Có {clash.size} mục bị trùng giờ. Xem dòng cảnh báo ở từng mục.</p>}
            {view.days.map((d) => (
              <section key={d.date}>
                <h2 className="plan-day">{WEEKDAYS[vnWeekday(Date.parse(d.date + "T12:00:00+07:00"))]}, {dmy(d.date)}</h2>
                <ul className="ag-list">{d.items.map((it) => row(it))}</ul>
              </section>
            ))}
            {view.long.length > 0 && (
              <section>
                <h2 className="plan-day">Diễn ra nhiều ngày</h2>
                <ul className="ag-list">{view.long.map((it) => row(it))}</ul>
              </section>
            )}
            {view.past.length > 0 && (
              <section>
                <h2 className="plan-day">Đã qua</h2>
                <ul className="ag-list">{view.past.map((it) => row(it, true))}</ul>
              </section>
            )}
            <p className="muted small foot">Lịch có thể thay đổi. Chương trình Festival tự cập nhật theo dữ liệu mới nhất; show diễn giữ theo lúc bạn lưu.</p>
          </div>
        )}
      </div>
      {sheet}
    </div>
  );
};

export default SavedPage;
