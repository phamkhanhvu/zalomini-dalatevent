import React, { FC, useEffect, useMemo, useState } from "react";
import m_planner from "../static/img/mascots/planner.webp";
import { useNavigate, useSearchParams } from "react-router";
import { useSnackbar } from "../ui";
import { FESTIVAL, PROGRAMS } from "../data/festival";
import { getData, onDataChange } from "../data/store";
import { acknowledge, detectChanges, Snap, SnapMap } from "../utils/changes";
import { storage } from "../utils/device";
import { agendaFor } from "../components/agenda";
import { useProgramSheet } from "../components/use-program-sheet";
import { AccountPanel } from "../components/account-panel";
import { IconArrow, IconBookmark, IconPin, IconShare } from "../components/icons";
import { vnDate, vnDayMonth, vnTime, vnWeekday } from "../utils/agenda";
import { arrangePlan, conflicts, decodeShare, encodeShare, PlanItem, toIcs, toPlanItem } from "../utils/itinerary";
import { usePlan } from "../utils/plan";
import { IS_NATIVE, openUrl, shareText } from "../utils/device";
import { shareFail } from "../utils/platform";
import { tr, wdLong } from "../i18n";

const dmy = (d: string) => d.slice(8, 10) + "." + d.slice(5, 7) + "." + d.slice(0, 4);
const whenOf = (it: PlanItem) =>
  it.allDay
    ? vnDate(it.start) === vnDate(it.end) ? tr("Cả ngày ", "All day ") + vnDayMonth(it.start) : vnDayMonth(it.start) + " – " + vnDayMonth(it.end)
    : vnTime(it.start) + (it.endEstimated ? "" : " – " + vnTime(it.end)) + ", " + vnDayMonth(it.start);

const SNAP_KEY = "dalatevent.savedSnap.v1";
const readSnaps = (): SnapMap => {
  try {
    const o = JSON.parse(storage.get(SNAP_KEY) || "{}");
    return o && typeof o === "object" ? o : {};
  } catch (e) {
    return {};
  }
};
const CHANGE_TEXT = () => ({ time: tr("Đã đổi giờ", "Time changed"), postponed: tr("Tạm hoãn", "Postponed"), cancelled: tr("Đã hủy", "Cancelled"), removed: tr("Không còn trong lịch", "No longer listed") });

const SavedPage: FC = () => {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { sheet, openProgram, saved } = useProgramSheet();
  const plan = usePlan();
  const [params] = useSearchParams();
  const code = params.get("d") || "";
  // Mở từ link chia sẻ: chỉ xem, chưa đụng vào lịch trình của người mở
  const shared = useMemo(() => (code ? decodeShare(code) : null), [code]);
  const isShared = !!code;
  const [tick, setTick] = useState(0);
  useEffect(() => onDataChange(() => setTick((n) => n + 1)), []);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(t);
  }, []);

  // Chương trình Festival lấy giờ mới nhất từ dữ liệu (đổi lịch thì lịch trình đổi theo); mục khác dùng bản đã lưu
  const items = useMemo<PlanItem[]>(() => {
    const ids = isShared ? shared?.programIds || [] : saved.ids;
    const fest = agendaFor(0, 8.64e15, now).filter((x) => x.programId && ids.includes(x.programId)).map(toPlanItem);
    return [...fest, ...(isShared ? shared?.items || [] : plan.items)];
  }, [saved.ids, plan.items, shared, isShared, tick, Math.floor(now / 60000)]);
  const view = useMemo(() => arrangePlan(items, now), [items]);
  const clash = useMemo(() => conflicts(items.filter((x) => x.end >= now)), [items]);
  const upcoming = items.filter((x) => x.end >= now);

  // Chương trình Festival đã lưu có bị đổi giờ, hoãn, hủy so với lúc lưu không
  const [snapTick, setSnapTick] = useState(0);
  const currentMap = useMemo(() => {
    const m: Record<string, Snap | undefined> = {};
    for (const e of getData().events.events) if (e.sessions[0]) m[e.id] = { start: Date.parse(e.sessions[0].start_at), status: e.status };
    return m;
  }, [tick]);
  const changed = useMemo(() => {
    if (isShared) return new Map<string, { kind: keyof typeof CHANGE_TEXT; oldStart: number }>();
    const r = detectChanges(saved.ids, readSnaps(), currentMap);
    storage.set(SNAP_KEY, JSON.stringify(r.next));
    return new Map(r.changes.map((c) => [c.id, c]));
  }, [saved.ids, currentMap, snapTick, isShared]);
  const ackChanges = () => {
    storage.set(SNAP_KEY, JSON.stringify(acknowledge(readSnaps(), currentMap, [...changed.keys()])));
    setSnapTick((n) => n + 1);
  };

  const remove = (it: PlanItem) => {
    if (it.programId) saved.toggle(it.programId);
    else plan.toggle(it);
    openSnackbar({ text: tr("Đã bỏ khỏi Lịch trình", "Removed from My plan"), type: "success", duration: 2000 });
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
      openSnackbar({ text: tr("Chưa tạo được tệp lịch, hãy thử lại", "Couldn't create the calendar file, please try again"), duration: 2400 });
    }
  };
  const share = async () => {
    const lines = [...upcoming].sort((a, b) => a.start - b.start).map((it) => `• ${whenOf(it)}: ${it.title} (${it.venue})`);
    const link = FESTIVAL.website + "#/lich-trinh?d=" + encodeShare(upcoming);
    const ok = await shareText(tr(`Lịch trình Đà Lạt của tôi:\n${lines.join("\n")}\nMở lịch trình này: ${link}`, `My Da Lat plan:\n${lines.join("\n")}\nOpen this plan: ${link}`), tr("Lịch trình Đà Lạt", "Da Lat plan"));
    if (!ok) openSnackbar({ text: shareFail(), duration: 2200 });
  };

  const saveAll = () => {
    const n = saved.addMany(shared?.programIds || []) + plan.addMany(shared?.items || []);
    openSnackbar({ text: n ? tr(`Đã thêm ${n} mục vào Lịch trình của bạn`, `Added ${n} items to My plan`) : tr("Các mục này đã có trong Lịch trình của bạn", "These items are already in My plan"), type: "success", duration: 2600 });
    navigate("/da-luu");
  };

  const row = (it: PlanItem, past = false) => {
    const others = clash.get(it.id);
    const clickable = !!it.programId || !!it.url;
    const body = (
      <React.Fragment>
        <span className="ag-time"><b>{it.allDay ? (vnDate(it.start) === vnDate(it.end) ? tr("Cả ngày", "All day") : vnDayMonth(it.start)) : vnTime(it.start)}</b><i>{it.allDay ? (vnDate(it.start) === vnDate(it.end) ? vnDayMonth(it.start) : tr("đến ", "until ") + vnDayMonth(it.end)) : it.endEstimated ? tr("bắt đầu", "starts") : tr("đến ", "until ") + vnTime(it.end)}</i></span>
        <span className="ag-body">
          <span className="pc-tags">
            <span className="chip">{it.label}</span>
            {it.tentative && <span className="chip chip-muted">{tr("Dự kiến", "Tentative")}</span>}
            {past && <span className="chip chip-muted">{tr("Đã qua", "Past")}</span>}
          </span>
          <span className="pc-title">{it.title}</span>
          <span className="pc-venue"><IconPin size={15} />{it.venue}</span>
          {others && <span className="plan-warn">{tr("Trùng giờ với: ", "Clashes with: ")}{others.join(", ")}</span>}
          {it.programId && changed.has(it.programId) && (
            <span className="plan-warn plan-changed">{CHANGE_TEXT()[changed.get(it.programId)!.kind]}{tr(". Lúc bạn lưu: ", ". When you saved: ")}{vnTime(changed.get(it.programId)!.oldStart)}, {vnDayMonth(changed.get(it.programId)!.oldStart)}</span>
          )}
        </span>
      </React.Fragment>
    );
    const cls = "ag-row is-" + it.kind;
    return (
      <li key={it.id} className={"ag-item is-" + it.kind + (past ? " plan-past" : "")}>
        {clickable ? <button type="button" className={cls} onClick={() => open(it)}>{body}</button> : <div className={cls}>{body}</div>}
        {!isShared && (
          <button type="button" className="pc-save on" aria-label={tr("Bỏ " + it.title + " khỏi lịch trình", "Remove " + it.title + " from My plan")} onClick={() => remove(it)}>
            <IconBookmark size={22} filled />
          </button>
        )}
      </li>
    );
  };

  return (
    <div className="page page-col">
      <header className="top has-top-mascot">
        <img className="top-mascot" src={m_planner} alt="" aria-hidden="true" />
        <p className="eyebrow">{isShared ? tr(`Lịch trình được chia sẻ · ${upcoming.length} mục sắp tới`, `Shared plan · ${upcoming.length} upcoming`) : items.length ? tr(`${upcoming.length} mục sắp tới · lưu trên máy của bạn`, `${upcoming.length} upcoming · saved on this device`) : tr("Lưu trên máy của bạn", "Saved on this device")}</p>
        <h1 className="h1">{isShared ? tr("Lịch trình ", "Shared ") : tr("Lịch trình ", "My ")}<em>{isShared ? tr("được chia sẻ", "plan") : tr("của tôi", "plan")}</em></h1>
        {isShared && items.length > 0 && (
          <div className="plan-actions">
            <button type="button" className="btn btn-ink" onClick={saveAll}>{tr("Lưu vào lịch trình của tôi", "Save to My plan")}</button>
            <button type="button" className="btn btn-line" onClick={() => navigate("/da-luu")}>{tr("Xem lịch của tôi", "View My plan")}</button>
          </div>
        )}
        {!isShared && upcoming.length > 0 && (
          <div className="plan-actions">
            {!IS_NATIVE && (
              <button type="button" className="btn btn-ink" onClick={exportIcs}>{tr("Thêm vào lịch máy", "Add to calendar")}</button>
            )}
            <button type="button" className="btn btn-line" onClick={share}><IconShare size={18} />{tr("Chia sẻ lịch trình", "Share plan")}</button>
          </div>
        )}
      </header>
      <div className="scroll grow">
        {!isShared && <div className="pad acc-wrap"><AccountPanel /></div>}
        {items.length === 0 ? (
          <div className="empty">
            <span className="empty-ico"><IconBookmark size={30} /></span>
            <h2>{isShared ? tr("Link chia sẻ không đọc được", "This shared link can't be read") : tr("Chưa có mục nào", "Nothing saved yet")}</h2>
            <p>{isShared ? tr("Link có thể bị cắt mất một đoạn khi gửi. Hãy nhờ người gửi chia sẻ lại.", "The link may have been cut off. Ask the sender to share it again.") : tr("Bấm biểu tượng dấu trang ở chương trình, sự kiện hoặc show diễn để xếp vào lịch trình theo ngày.", "Tap the bookmark on any programme, event or show to add it to your day-by-day plan.")}</p>
            <button type="button" className="btn btn-ink" onClick={() => navigate("/")}>
              {tr("Khám phá sự kiện", "Explore events")} <IconArrow size={20} />
            </button>
          </div>
        ) : (
          <div className="pad plan">
            {changed.size > 0 && (
              <div className="plan-summary plan-alert">
                <span>{tr(`${changed.size} chương trình bạn lưu đã thay đổi so với lúc lưu. Xem dòng cảnh báo ở từng mục.`, `${changed.size} saved programmes have changed since you saved them. See the note on each item.`)}</span>
                <button type="button" className="btn btn-line" onClick={ackChanges}>{tr("Đã biết", "Got it")}</button>
              </div>
            )}
            {clash.size > 0 && <p className="plan-summary">{tr(`Có ${clash.size} mục bị trùng giờ. Xem dòng cảnh báo ở từng mục.`, `${clash.size} items clash. See the note on each item.`)}</p>}
            {view.days.map((d) => (
              <section key={d.date}>
                <h2 className="plan-day">{wdLong(vnWeekday(Date.parse(d.date + "T12:00:00+07:00")))}, {dmy(d.date)}</h2>
                <ul className="ag-list">{d.items.map((it) => row(it))}</ul>
              </section>
            ))}
            {view.long.length > 0 && (
              <section>
                <h2 className="plan-day">{tr("Diễn ra nhiều ngày", "Multi-day")}</h2>
                <ul className="ag-list">{view.long.map((it) => row(it))}</ul>
              </section>
            )}
            {view.past.length > 0 && (
              <section>
                <h2 className="plan-day">{tr("Đã qua", "Past")}</h2>
                <ul className="ag-list">{view.past.map((it) => row(it, true))}</ul>
              </section>
            )}
            <p className="muted small foot">{tr("Lịch có thể thay đổi. Chương trình Festival tự cập nhật theo dữ liệu mới nhất; show diễn giữ theo lúc bạn lưu.", "Schedules may change. Festival programmes update automatically; shows stay as they were when you saved them.")}</p>
          </div>
        )}
      </div>
      {sheet}
    </div>
  );
};

export default SavedPage;
