import React, { FC, useEffect, useMemo, useState } from "react";
import { getData, onDataChange } from "../data/store";
import { AgendaRow, agendaFor } from "../components/agenda";
import { useProgramSheet } from "../components/use-program-sheet";
import { Advice, Ask, parseAsk, Pick, recommend } from "../utils/assistant";
import { listPlaces } from "../utils/places";

const EXAMPLES = [
  "Tối nay hai người có 500.000đ, muốn nghe nhạc ở Đà Lạt",
  "Cuối tuần gia đình 4 người đi đâu?",
  "Ngày mai một mình, 200k, nghe acoustic",
  "12.12 hai người xem hoa gần Quảng trường Lâm Viên",
];
const vnd = (n: number) => n.toLocaleString("vi-VN") + "đ";
const km = (k: number) => (k < 1 ? Math.round(k * 1000) + " m" : k.toFixed(1).replace(".", ",") + " km");
const INTEREST_LABEL: Record<string, string> = { music: "nghe nhạc", flower: "ngắm hoa", exhibit: "triển lãm", sport: "thể thao", free: "miễn phí" };

/** Trợ lý "Hôm nay đi đâu?": hiểu câu hỏi tự nhiên, gợi ý từ dữ liệu đã đối chiếu, không tự nghĩ ra giá hay lịch */
const AssistantPage: FC = () => {
  const { sheet, openProgram } = useProgramSheet();
  const [text, setText] = useState("");
  const [asked, setAsked] = useState("");
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [geoMsg, setGeoMsg] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => onDataChange(() => setTick((n) => n + 1)), []);

  const result = useMemo<{ ask: Ask; advice: Advice; now: number } | null>(() => {
    if (!asked.trim()) return null;
    const d = getData();
    const now = Date.now();
    const places = listPlaces(d.events.venues, d.shows.stages);
    const ask = parseAsk(asked, now, places);
    const advice = recommend(ask, agendaFor(ask.from, ask.to, now), d.shows.stages, places, d.events.events, origin, now);
    return { ask, advice, now };
  }, [asked, origin, tick]);

  const submit = (q: string) => {
    setText(q);
    setAsked(q);
    setGeoMsg("");
  };
  const locate = () => {
    if (!("geolocation" in navigator)) return setGeoMsg("Thiết bị này không hỗ trợ định vị.");
    navigator.geolocation.getCurrentPosition(
      (p) => setOrigin({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setGeoMsg("Chưa lấy được vị trí. Bạn có thể ghi tên nơi muốn ở gần, ví dụ: gần hồ Xuân Hương."),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  const row = (p: Pick, now: number, ask: Ask) => (
    <React.Fragment key={p.item.key}>
      <AgendaRow it={p.item} showDate now={now} onOpenProgram={openProgram} />
      <li className={"as-note" + (p.price ? "" : " is-unknown")}>
        {p.price
          ? `${p.price.source}${ask.people && ask.people > 1 ? ` · ${ask.people} người từ ${vnd(p.total as number)}` : ""}`
          : "Dữ liệu chưa có giá cho mục này. Bấm vào để xem trang gốc trước khi đi."}
        {p.km !== null ? " · cách khoảng " + km(p.km) : ""}
      </li>
    </React.Fragment>
  );

  const ask = result?.ask;
  const adv = result?.advice;
  const understood = ask
    ? [ask.dateLabel + (ask.dateGiven ? "" : " (bạn chưa nói ngày)"), ask.people ? ask.people + " người" : "", ask.budget !== null ? (ask.budget === 0 ? "miễn phí" : "tối đa " + vnd(ask.budget)) : "", ...ask.interests.filter((k) => k !== "free").map((k) => INTEREST_LABEL[k]), ask.near ? "gần " + ask.near.name : origin ? "gần vị trí của bạn" : ""].filter(Boolean)
    : [];

  return (
    <div className="scroll page">
      <header className="top">
        <p className="eyebrow">Trợ lý gợi ý</p>
        <h1 className="h1">Hôm nay <em>đi đâu?</em></h1>
        <p className="muted">Viết như đang nhắn cho bạn: khi nào, mấy người, bao nhiêu tiền, thích gì.</p>
        <form
          className="as-form"
          onSubmit={(e) => {
            e.preventDefault();
            submit(text);
          }}
        >
          <textarea rows={3} value={text} maxLength={300} placeholder={EXAMPLES[0]} aria-label="Câu hỏi của bạn" onChange={(e) => setText(e.target.value)} />
          <button type="submit" className="btn btn-ink btn-wide" disabled={!text.trim()}>Gợi ý cho tôi</button>
        </form>
        <div className="search-hints" aria-label="Câu hỏi mẫu">
          {EXAMPLES.map((x) => <button key={x} type="button" className="search-hint" onClick={() => submit(x)}>{x}</button>)}
        </div>
      </header>

      {ask && adv && result && (
        <section className="sec" aria-live="polite">
          <p className="as-understood">Em hiểu là: {understood.map((u) => <span className="chip" key={u}>{u}</span>)}</p>
          {(ask.nearMe || (!ask.near && !origin)) && !origin && (
            <button type="button" className="acc-switch link-left" onClick={locate}>Xếp theo nơi gần tôi nhất</button>
          )}
          {geoMsg && <p className="muted small">{geoMsg}</p>}

          {adv.fits.length > 0 && (
            <React.Fragment>
              <h2 className="h2">{ask.budget !== null ? "Vừa ngân sách" : "Gợi ý cho bạn"}</h2>
              <ul className="ag-list">{adv.fits.map((p) => row(p, result.now, ask))}</ul>
            </React.Fragment>
          )}
          {adv.unknown.length > 0 && (
            <React.Fragment>
              <h2 className="h2">{adv.fits.length ? "Cũng đúng ý, nhưng chưa rõ giá" : "Đúng ý bạn, chưa rõ giá"}</h2>
              <ul className="ag-list">{adv.unknown.map((p) => row(p, result.now, ask))}</ul>
            </React.Fragment>
          )}
          {adv.over.length > 0 && (
            <p className="plan-summary">Có {adv.over.length} mục đúng ý nhưng vượt ngân sách, rẻ nhất là "{adv.over.slice().sort((a, b) => (a.total as number) - (b.total as number))[0].item.title}" ({vnd(Math.min(...adv.over.map((p) => p.total as number)))}{ask.people && ask.people > 1 ? " cho " + ask.people + " người" : ""}).</p>
          )}
          {adv.matched === 0 && (
            <div className="ag-empty">
              <b>Chưa có sự kiện nào trong dữ liệu khớp với câu này.</b>
              <span>Thử đổi ngày (ví dụ "cuối tuần") hoặc bỏ bớt điều kiện.</span>
            </div>
          )}
          <p className="muted small">Trợ lý chỉ lọc trong dữ liệu DalatEvent đã đối chiếu với nguồn, không tự nghĩ ra giá vé hay lịch diễn. Giá là mức thấp nhất được công bố và có thể thay đổi: bấm vào từng mục để xác nhận trước khi đi.</p>
        </section>
      )}
      {sheet}
    </div>
  );
};

export default AssistantPage;
