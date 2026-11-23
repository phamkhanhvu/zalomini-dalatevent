import React, { FC, useEffect, useMemo, useState } from "react";
import { getData, onDataChange } from "../data/store";
import { AgendaRow, agendaFor } from "../components/agenda";
import { useProgramSheet } from "../components/use-program-sheet";
import { IconRoute } from "../components/icons";
import { vnWeekday } from "../utils/agenda";
import { Ask, parseAsk, recommend } from "../utils/assistant";
import { buildPlan, DayPlan, GuidePlace, Part } from "../utils/daytrip";
import { openDirections, openUrl } from "../utils/device";
import { listPlaces } from "../utils/places";

const EXAMPLES = [
  "Tối nay hai người có 500.000đ, muốn nghe nhạc ở Đà Lạt",
  "Ngày mai hai người đi đâu?",
  "Cuối tuần gia đình 4 người thích hoa",
  "Thứ bảy nhóm 5 người, đi chơi rồi nghe nhạc",
];
const GUIDE = "https://sensegroup.vn/di-da-lat/";
const WEEKDAYS = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
const dmy = (d: string) => d.slice(8, 10) + "." + d.slice(5, 7) + "." + d.slice(0, 4);
const INTEREST_LABEL: Record<string, string> = { music: "nghe nhạc", flower: "ngắm hoa", exhibit: "triển lãm", sport: "thể thao", free: "miễn phí" };
const PART_CLASS: Record<Part, string> = { Sáng: "am", Trưa: "noon", Chiều: "pm", Tối: "eve" };

const PlaceLine: FC<{ p: GuidePlace; showName: boolean }> = ({ p, showName }) => (
  <div className="trip-place">
    {showName && <b>{p.name}</b>}
    <span>{p.address}{p.duration ? " · nên dành " + p.duration : ""}{p.timing ? " · mở " + p.timing : ""}</span>
    <span className="trip-links">
      <button type="button" onClick={() => openDirections(p.mapQuery)}><IconRoute size={16} />Chỉ đường</button>
      <button type="button" onClick={() => openUrl(GUIDE + p.id + "/")}>Xem chi tiết</button>
    </span>
  </div>
);

/** Trợ lý "Hôm nay đi đâu?": đọc câu hỏi tự nhiên rồi xếp một lịch trình theo buổi từ dữ liệu có sẵn */
const AssistantPage: FC = () => {
  const { sheet, openProgram } = useProgramSheet();
  const [text, setText] = useState("");
  const [asked, setAsked] = useState("");
  const [seed, setSeed] = useState(0);
  const [guide, setGuide] = useState<GuidePlace[] | null>(null);
  const [guideErr, setGuideErr] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => onDataChange(() => setTick((n) => n + 1)), []);
  // Danh mục địa điểm khá lớn nên chỉ tải khi mở trang này
  useEffect(() => {
    import("../data/bundled/places.json").then((m) => setGuide((m.default as { places: GuidePlace[] }).places)).catch(() => setGuideErr(true));
  }, []);

  const result = useMemo<{ ask: Ask; days: DayPlan[]; skipped: number; now: number } | null>(() => {
    if (!asked.trim() || !guide) return null;
    const d = getData();
    const now = Date.now();
    const venues = listPlaces(d.events.venues, d.shows.stages);
    const ask = parseAsk(asked, now, venues);
    const adv = recommend(ask, agendaFor(ask.from, ask.to, now), d.shows.stages, venues, d.events.events, null, now);
    const days = buildPlan(ask, [...adv.fits, ...adv.unknown].map((p) => p.item), guide, now, seed);
    return { ask, days, skipped: adv.over.length, now };
  }, [asked, seed, guide, tick]);

  const submit = (q: string) => {
    setText(q);
    setAsked(q);
    setSeed(0);
  };
  const ask = result?.ask;
  const understood = ask
    ? [ask.dateLabel + (ask.dateGiven ? "" : " (bạn chưa nói ngày)"), ask.people ? ask.people + " người" : "", ask.budget !== null ? (ask.budget === 0 ? "miễn phí" : "ngân sách khoảng " + ask.budget.toLocaleString("vi-VN") + "đ") : "", ...ask.interests.filter((k) => k !== "free").map((k) => INTEREST_LABEL[k])].filter(Boolean)
    : [];

  return (
    <div className="scroll page">
      <header className="top">
        <p className="eyebrow">Trợ lý gợi ý lịch trình</p>
        <h1 className="h1">Hôm nay <em>đi đâu?</em></h1>
        <p className="muted">Viết như đang nhắn cho bạn: khi nào, mấy người, thích gì. Trợ lý xếp sẵn một lịch trình theo buổi.</p>
        <form
          className="as-form"
          onSubmit={(e) => {
            e.preventDefault();
            submit(text);
          }}
        >
          <textarea rows={3} value={text} maxLength={300} placeholder={EXAMPLES[0]} aria-label="Câu hỏi của bạn" onChange={(e) => setText(e.target.value)} />
          <button type="submit" className="btn btn-ink btn-wide" disabled={!text.trim()}>Xếp lịch trình cho tôi</button>
        </form>
        <div className="search-hints" aria-label="Câu hỏi mẫu">
          {EXAMPLES.map((x) => <button key={x} type="button" className="search-hint" onClick={() => submit(x)}>{x}</button>)}
        </div>
      </header>

      {asked && !guide && <p className="muted pad">{guideErr ? "Chưa tải được danh mục địa điểm. Hãy kiểm tra mạng rồi thử lại." : "Đang tải danh mục địa điểm…"}</p>}

      {ask && result && (
        <section className="sec" aria-live="polite">
          <p className="as-understood">Em hiểu là: {understood.map((u) => <span className="chip" key={u}>{u}</span>)}</p>
          {result.days.length === 0 ? (
            <div className="ag-empty">
              <b>Khoảng thời gian này đã qua hoặc quá ngắn để xếp lịch.</b>
              <span>Thử hỏi cho "ngày mai" hoặc "cuối tuần".</span>
            </div>
          ) : (
            result.days.map((day) => (
              <div className="trip" key={day.date}>
                <h2 className="h2">{WEEKDAYS[vnWeekday(Date.parse(day.date + "T12:00:00+07:00"))]}, <em>{dmy(day.date)}</em></h2>
                <ol className="trip-list">
                  {day.stops.map((s, i) => (
                    <li key={i} className={"trip-stop is-" + PART_CLASS[s.part]}>
                      <span className="trip-time"><b>{s.time}</b><i>{s.part}</i></span>
                      <div className="trip-body">
                        {s.item ? (
                          <React.Fragment>
                            <ul className="ag-list"><AgendaRow it={s.item} showDate={false} now={result.now} onOpenProgram={openProgram} /></ul>
                            <p className="trip-note">{s.note}</p>
                          </React.Fragment>
                        ) : (
                          <React.Fragment>
                            <b className="trip-title">{s.title}</b>
                            <p className="trip-note">{s.note}</p>
                            {s.places.map((p) => <PlaceLine key={p.id} p={p} showName={s.places.length > 1 || s.kind === "walk"} />)}
                          </React.Fragment>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ))
          )}
          {result.days.length > 0 && <button type="button" className="btn btn-line btn-wide" onClick={() => setSeed((n) => n + 1)}>Gợi ý lịch trình khác</button>}
          {result.skipped > 0 && <p className="muted small">Đã bỏ qua {result.skipped} show có giá vé vượt ngân sách bạn nêu.</p>}
          <p className="muted small">Đây là gợi ý xếp tự động, chưa tính thời gian di chuyển giữa các điểm. Sự kiện và show lấy từ lịch DalatEvent đã đối chiếu với nguồn; điểm tham quan và quán lấy từ cẩm nang <button type="button" className="acc-link" onClick={() => openUrl(GUIDE)}>Đà Lạt Đi Đâu</button> của Sense Group (một phần vị trí © OpenStreetMap contributors). Quán ăn và cà phê được chọn luân phiên trong danh mục, chưa phải đánh giá chất lượng. Hãy xác nhận giờ mở cửa và giá tại nơi đến.</p>
        </section>
      )}
      {sheet}
    </div>
  );
};

export default AssistantPage;
