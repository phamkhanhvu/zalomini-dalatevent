import React, { FC, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { getForecast, Forecast } from "../platform/weather";
import { vnDate, vnTime } from "../utils/agenda";
import { openUrl, mapsUrl } from "../utils/device";
import { afternoonLabel, bestCloudDay, cloudLabel, DayPlan, plan } from "../utils/weather";
import { tr, wdShort, isEn } from "../i18n";
import { CLOUD_SPOTS, CloudSpot } from "../data/cloud-spots";
import { distanceKm } from "../utils/geo";

const CENTER = { lat: 11.9416, lng: 108.4419 }; // Hồ Xuân Hương
const kmOf = (s: CloudSpot) => (s.lat !== null && s.lng !== null ? Math.round(distanceKm(CENTER, { lat: s.lat, lng: s.lng })) : null);
const spotQuery = (s: CloudSpot) => (s.lat !== null && s.lng !== null ? s.lat + "," + s.lng : s.query || s.name);


const dayName = (date: string, today: string) => {
  if (date === today) return tr("Hôm nay", "Today");
  const t = new Date(today + "T12:00:00Z");
  t.setUTCDate(t.getUTCDate() + 1);
  if (date === t.toISOString().slice(0, 10)) return tr("Ngày mai", "Tomorrow");
  return wdShort(new Date(date + "T12:00:00Z").getUTCDay()) + " " + date.slice(8, 10) + "." + date.slice(5, 7);
};

/** Thời tiết và săn mây: sáng nào nên đi săn mây, chiều nào nên ở trong nhà */
const WeatherPage: FC = () => {
  const navigate = useNavigate();
  const [f, setF] = useState<Forecast | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    getForecast().then(setF).catch(() => setErr(true));
  }, []);
  const now = Date.now();
  const today = vnDate(now);
  const hour = Number(vnTime(now).slice(0, 2));
  const days = useMemo(() => (f ? plan(f.hours, f.days, today) : []), [f, today]);
  const best = useMemo(() => bestCloudDay(days, { date: today, hour }), [days, today, hour]);

  const row = (d: DayPlan) => (
    <li key={d.date} className={"wx-day" + (best && best.date === d.date ? " is-best" : "")}>
      <div className="wx-when">
        <b>{dayName(d.date, today)}</b>
        <i>{d.label} · {d.tmin}–{d.tmax}°C</i>
      </div>
      {d.cloud && (
        <div className={"wx-cloud lv-" + d.cloud.level}>
          <span className="wx-meter" aria-hidden="true"><span style={{ width: d.cloud.score + "%" }} /></span>
          <span><b>{tr("Săn mây sáng: ", "Morning clouds: ")}{cloudLabel(d.cloud.level)}</b>{d.sunrise ? tr(" · mặt trời mọc ", " · sunrise ") + d.sunrise : ""}</span>
          {d.cloud.reasons.length > 0 && <small>{d.cloud.reasons.join(", ")}</small>}
        </div>
      )}
      {d.after && <p className={"wx-after af-" + d.after.kind}>{afternoonLabel(d.after.kind)}{d.after.pop ? tr(" · khả năng mưa ", " · chance of rain ") + d.after.pop + "%" : ""}{d.after.thunder ? tr(" · có dông", " · thunderstorms") : ""}</p>}
    </li>
  );

  return (
    <div className="scroll page">
      <header className="top">
        <p className="eyebrow">{tr("Thời tiết Đà Lạt", "Da Lat weather")}</p>
        <h1 className="h1">{tr("Săn mây ", "Clouds ")}<em>{tr("& trời mưa", "& rain")}</em></h1>
        <p className="muted">{tr("Gợi ý sáng nào nên dậy sớm săn mây, chiều nào nên chọn chỗ trong nhà. Đây là ước tính từ dự báo độ ẩm, gió và mây, không chắc chắn 100%.", "Which mornings are worth an early start to see the sea of clouds, and which afternoons to spend indoors. An estimate from humidity, wind and cloud forecasts, not a guarantee.")}</p>
        {best && (
          <div className="wx-best" role="status">
            <span className="wx-best-k">{tr("Sáng nên đi săn mây", "Best morning for clouds")}</span>
            <b>{dayName(best.date, today)}{best.sunrise ? tr(", có mặt trên đồi trước ", ", be on the hill before ") + best.sunrise : ""}</b>
            <button type="button" className="btn btn-ink" onClick={() => document.getElementById("diem-san-may")?.scrollIntoView({ behavior: "smooth" })}>{tr("Xem điểm săn mây", "See viewpoints")}</button>
          </div>
        )}
        {f && !best && <p className="wx-none">{tr("Mấy ngày tới ít khả năng có biển mây. Hãy xem lại sau, dự báo đổi mỗi ngày.", "A sea of clouds is unlikely in the coming days. Check back later; the forecast changes daily.")}</p>}
      </header>
      <section className="sec">
        {!f && !err && <p className="muted">{tr("Đang lấy dự báo…", "Loading forecast…")}</p>}
        {err && <p className="muted">{tr("Chưa lấy được dự báo. Hãy kiểm tra mạng rồi thử lại.", "Couldn't load the forecast. Check your connection and try again.")}</p>}
        {f && <ul className="wx-list">{days.map(row)}</ul>}
        {days.some((d) => d.after && d.after.kind !== "free") && (
          <button type="button" className="acc-switch link-left" onClick={() => navigate("/show")}>{tr("Chiều mưa? Xem show diễn và triển lãm trong nhà", "Rainy afternoon? See indoor shows and exhibitions")}</button>
        )}
        {f && <p className="muted small">{tr("Nguồn dự báo: Open-Meteo, cập nhật lúc ", "Forecast: Open-Meteo, updated ")}{vnTime(f.fetchedAt)}.</p>}
      </section>
      <section className="sec" id="diem-san-may">
        <h2 className="h2">{tr("Điểm săn mây gợi ý", "Cloud-hunting spots")}</h2>
        <p className="muted small">{tr("Xếp từ gần đến xa trung tâm (hồ Xuân Hương). Nên có mặt trước giờ mặt trời mọc 20–30 phút.", "Sorted from nearest to farthest from the centre (Xuan Huong Lake). Arrive 20–30 minutes before sunrise.")}</p>
        <ul className="spot-list">
          {CLOUD_SPOTS.map((sp) => ({ sp, km: kmOf(sp) }))
            .sort((a, b) => (a.km ?? 25) - (b.km ?? 25))
            .map(({ sp, km }) => (
              <li key={sp.id} className="spot">
                <div className="spot-head">
                  <b>{sp.name}</b>
                  <i>{"~" + (km ?? 25) + " km"}</i>
                </div>
                <p className="spot-area">{isEn() ? sp.area_en : sp.area}</p>
                <p className="spot-note">{isEn() ? sp.note_en : sp.note}</p>
                <div className="spot-acts">
                  <button type="button" className="btn btn-ink" onClick={() => openUrl(mapsUrl(spotQuery(sp)))}>{tr("Chỉ đường", "Directions")}</button>
                  {sp.clip && <button type="button" className="btn btn-line" onClick={() => openUrl(sp.clip as string)}>{tr("Xem clip", "Watch clip")}</button>}
                </div>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
};

export default WeatherPage;
