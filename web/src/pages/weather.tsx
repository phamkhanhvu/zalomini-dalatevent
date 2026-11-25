import React, { FC, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { getForecast, Forecast } from "../platform/weather";
import { vnDate, vnTime } from "../utils/agenda";
import { openUrl, mapsUrl } from "../utils/device";
import { afternoonLabel, bestCloudDay, cloudLabel, DayPlan, plan } from "../utils/weather";
import { tr, wdShort } from "../i18n";

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
            <button type="button" className="btn btn-ink" onClick={() => openUrl(mapsUrl(tr("điểm săn mây Đà Lạt", "Da Lat cloud hunting viewpoint")))}>{tr("Tìm điểm săn mây", "Find viewpoints")}</button>
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
    </div>
  );
};

export default WeatherPage;
