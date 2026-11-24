import React, { FC, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { getForecast, Forecast } from "../platform/weather";
import { vnDate, vnTime } from "../utils/agenda";
import { openUrl, mapsUrl } from "../utils/device";
import { AFTERNOON_LABEL, bestCloudDay, CLOUD_LABEL, DayPlan, plan } from "../utils/weather";

const WD = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const dayName = (date: string, today: string) => {
  if (date === today) return "Hôm nay";
  const t = new Date(today + "T12:00:00Z");
  t.setUTCDate(t.getUTCDate() + 1);
  if (date === t.toISOString().slice(0, 10)) return "Ngày mai";
  return WD[new Date(date + "T12:00:00Z").getUTCDay()] + " " + date.slice(8, 10) + "." + date.slice(5, 7);
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
          <span><b>Săn mây sáng: {CLOUD_LABEL[d.cloud.level]}</b>{d.sunrise ? " · mặt trời mọc " + d.sunrise : ""}</span>
          {d.cloud.reasons.length > 0 && <small>{d.cloud.reasons.join(", ")}</small>}
        </div>
      )}
      {d.after && <p className={"wx-after af-" + d.after.kind}>{AFTERNOON_LABEL[d.after.kind]}{d.after.pop ? " · khả năng mưa " + d.after.pop + "%" : ""}{d.after.thunder ? " · có dông" : ""}</p>}
    </li>
  );

  return (
    <div className="scroll page">
      <header className="top">
        <p className="eyebrow">Thời tiết Đà Lạt</p>
        <h1 className="h1">Săn mây <em>&amp; trời mưa</em></h1>
        <p className="muted">Gợi ý sáng nào nên dậy sớm săn mây, chiều nào nên chọn chỗ trong nhà. Đây là ước tính từ dự báo độ ẩm, gió và mây, không chắc chắn 100%.</p>
        {best && (
          <div className="wx-best" role="status">
            <span className="wx-best-k">Sáng nên đi săn mây</span>
            <b>{dayName(best.date, today)}{best.sunrise ? ", có mặt trên đồi trước " + best.sunrise : ""}</b>
            <button type="button" className="btn btn-ink" onClick={() => openUrl(mapsUrl("điểm săn mây Đà Lạt"))}>Tìm điểm săn mây</button>
          </div>
        )}
        {f && !best && <p className="wx-none">Mấy ngày tới ít khả năng có biển mây. Hãy xem lại sau, dự báo đổi mỗi ngày.</p>}
      </header>
      <section className="sec">
        {!f && !err && <p className="muted">Đang lấy dự báo…</p>}
        {err && <p className="muted">Chưa lấy được dự báo. Hãy kiểm tra mạng rồi thử lại.</p>}
        {f && <ul className="wx-list">{days.map(row)}</ul>}
        {days.some((d) => d.after && d.after.kind !== "free") && (
          <button type="button" className="acc-switch link-left" onClick={() => navigate("/show")}>Chiều mưa? Xem show diễn và triển lãm trong nhà</button>
        )}
        {f && <p className="muted small">Nguồn dự báo: Open-Meteo, cập nhật lúc {vnTime(f.fetchedAt)}.</p>}
      </section>
    </div>
  );
};

export default WeatherPage;
