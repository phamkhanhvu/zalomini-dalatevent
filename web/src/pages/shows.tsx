import React, { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { getData, onDataChange, ShowItem, Stage } from "../data/store";
import { callPhone, openUrl } from "../utils/device";
import { IconArrow, IconPhone } from "../components/icons";
import heroImg from "../static/img/md-dem-nhac-acoustic.jpg";
import { loc, tr, wdLong } from "../i18n";

const TINTS: Record<string, string> = { "may-lang-thang": "#DCEEFF", lululola: "#C9F2DA", "sense-acoustic": "#FFE0CC" };

/** Ngày hôm nay theo giờ Việt Nam, dạng 2026-11-23, và thứ trong tuần (0 = Chủ nhật) */
function todayVN(now = new Date()) {
  const vn = new Date(now.getTime() + 7 * 3600000);
  return { date: vn.toISOString().slice(0, 10), weekday: vn.getUTCDay() };
}
function weekdayOf(date: string) {
  return wdLong(new Date(date + "T00:00:00Z").getUTCDay());
}
const dmy = (iso: string) => iso.slice(8, 10) + "." + iso.slice(5, 7) + "." + iso.slice(0, 4);

const Row: FC<{ it: ShowItem; stage: Stage; today: { date: string; weekday: number } }> = ({ it, stage, today }) => {
  const weekly = stage.kind === "weekly";
  const isToday = weekly ? it.weekday === today.weekday : it.date === today.date;
  return (
    <li>
      <button type="button" className={"show-row" + (isToday ? " is-today" : "")} onClick={() => openUrl(it.url)}>
        <span className="show-date" style={{ background: TINTS[stage.id] || "#EFE2FA" }}>
          <b>{weekly ? it.weekday_label : it.date!.slice(8, 10) + "." + it.date!.slice(5, 7)}</b>
          <i>{weekly ? it.time : weekdayOf(it.date!) + " · " + it.time}</i>
        </span>
        <span className="show-body">
          {isToday && <span className="chip chip-live">{tr("Hôm nay", "Today")}</span>}
          <span className="show-title">{it.title}</span>
          <span className="show-sub">{it.place || it.price || it.note}</span>
        </span>
        <span className="show-go">{loc(stage, "cta_label")}<IconArrow size={16} /></span>
      </button>
    </li>
  );
};

const ShowsPage: FC = () => {
  const navigate = useNavigate();
  const [, setTick] = useState(0);
  useEffect(() => onDataChange(() => setTick((n) => n + 1)), []);
  const { stages } = getData().shows;
  const today = todayVN();

  return (
    <div className="scroll page">
      <header className="top">
        <p className="eyebrow">{tr("Đêm nhạc tại Đà Lạt", "Live music in Da Lat")}</p>
        <h1 className="h1">{tr("Lịch ", "Show ")}<em>{tr("show diễn", "schedule")}</em></h1>
        <p className="muted">{tr("Lịch và giá vé do từng điểm diễn công bố, có thể thay đổi. Bấm vào từng đêm diễn để mở trang gốc.", "Dates and prices are published by each venue and may change. Tap a show to open the venue's page.")}</p>
        <figure className="top-photo">
          <img src={heroImg} alt={tr("Đêm nhạc acoustic ngoài trời (ảnh minh họa)", "Outdoor acoustic night (illustration)")} />
          <figcaption>{tr("Ảnh minh họa", "Illustration")}</figcaption>
        </figure>
      </header>
      {stages.map((stage) => {
        const items = stage.kind === "dated" ? stage.items.filter((it) => (it.date || "") >= today.date) : stage.items;
        return (
          <section className="sec stage" key={stage.id}>
            <div className="sec-head">
              <h2 className="h2">{loc(stage, "name")}</h2>
              <button type="button" className="link" onClick={() => navigate("/dia-diem/s-" + stage.id + "-0")}>{tr("Địa điểm, chỉ đường", "Venue & directions")}</button>
            </div>
            <p className="muted small">{loc(stage, "intro")}</p>
            {items.length === 0 ? (
              <p className="show-empty">{tr("Chưa có đêm diễn sắp tới trong dữ liệu. Xem trang gốc để biết lịch mới nhất.", "No upcoming shows listed. See the venue's page for the latest schedule.")}</p>
            ) : (
              <ul className="show-list">
                {items.map((it, i) => (
                  <Row key={stage.id + i} it={it} stage={stage} today={today} />
                ))}
              </ul>
            )}
            {stage.phone && (
              <button type="button" className="btn btn-ink" onClick={() => callPhone(stage.phone!)}>
                <IconPhone size={20} />{stage.phone_label}
              </button>
            )}
            <p className="muted small">{loc(stage, "address")}{tr(" Đối chiếu ngày ", " Checked ")}{dmy(stage.verified_at)}.</p>
          </section>
        );
      })}
    </div>
  );
};

export default ShowsPage;
