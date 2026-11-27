import React, { FC, useEffect, useMemo, useState } from "react";
import m_cloud from "../static/img/mascots/cloud.webp";
import { useNavigate } from "react-router";
import { getForecast, Forecast } from "../platform/weather";
import { vnDate, vnTime } from "../utils/agenda";
import { afternoonLabel, bestCloudDay, cloudLabel, plan } from "../utils/weather";
import { tr, wdShort } from "../i18n";

/** Dải thời tiết gọn trên trang chủ: săn mây sáng tới và lời khuyên chiều nay */
export const WeatherCard: FC = () => {
  const navigate = useNavigate();
  const [f, setF] = useState<Forecast | null>(null);
  useEffect(() => {
    getForecast().then(setF).catch(() => undefined);
  }, []);
  const now = Date.now();
  const today = vnDate(now);
  const hour = Number(vnTime(now).slice(0, 2));
  const days = useMemo(() => (f ? plan(f.hours, f.days, today) : []), [f, today]);
  if (!f || !days.length) return null;
  const best = bestCloudDay(days, { date: today, hour });
  const todayPlan = days[0];
  const tomorrow = days[1] ? days[1].date : "";
  const morning = (date: string) => (date === today ? tr("Sáng nay", "This morning") : date === tomorrow ? tr("Sáng mai", "Tomorrow morning") : tr("Sáng ", "") + wdShort(new Date(date + "T12:00:00Z").getUTCDay()) + " " + date.slice(8, 10) + "." + date.slice(5, 7));
  const cloudText = best ? morning(best.date) + ": " + cloudLabel(best.cloud!.level).toLowerCase() : tr("mấy ngày tới ít khả năng có biển mây", "a sea of clouds is unlikely in the coming days");
  return (
    <button type="button" className="wx-card has-mascot" onClick={() => navigate("/thoi-tiet")}>
      <img className="mascot" src={m_cloud} alt="" aria-hidden="true" />
      <span className="wx-card-ico" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 18a4 4 0 1 1 .9-7.9A5.5 5.5 0 0 1 18.5 12 3 3 0 0 1 18 18z" /><path d="M3 21h18" /></svg>
      </span>
      <span className="wx-card-text">
        <b>{tr("Săn mây", "Cloud hunting")} · {cloudText}</b>
        <i>{todayPlan.label}, {todayPlan.tmin}–{todayPlan.tmax}°C{todayPlan.after && hour < 18 ? " · " + afternoonLabel(todayPlan.after.kind) : ""}</i>
      </span>
      <span className="wx-card-go" aria-hidden="true">→</span>
    </button>
  );
};
