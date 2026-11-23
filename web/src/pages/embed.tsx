import React, { FC, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { FESTIVAL } from "../data/festival";
import { onDataChange } from "../data/store";
import { agendaFor } from "../components/agenda";
import { programLink } from "../components/program-sheet";
import { itemsAt, listPlaces } from "../utils/places";
import { getData } from "../data/store";
import { Kind, UPCOMING_DAYS, upcomingOnly, vnDate, vnDayMonth, vnTime, vnMidnight } from "../utils/agenda";

const KINDS: Kind[] = ["festival", "event", "show"];

/**
 * Khung lịch để nhúng lên website khác bằng thẻ iframe.
 * Tham số: n = số dòng (3 đến 20, mặc định 6); loai = festival | event | show (bỏ trống là tất cả);
 * noi = mã địa điểm (ví dụ s-lululola-0) để chỉ hiện lịch tại một nơi.
 */
const EmbedPage: FC = () => {
  const [params] = useSearchParams();
  const n = Math.min(20, Math.max(3, parseInt(params.get("n") || "6", 10) || 6));
  const kind = KINDS.find((k) => k === params.get("loai"));
  const placeId = params.get("noi") || "";
  const [tick, setTick] = useState(0);
  useEffect(() => onDataChange(() => setTick((x) => x + 1)), []);
  const now = Date.now();
  const list = useMemo(() => {
    const from = vnMidnight(vnDate(now));
    const all = agendaFor(from, from + UPCOMING_DAYS * 86400000, now);
    const d = getData();
    const place = placeId ? listPlaces(d.events.venues, d.shows.stages).find((p) => p.id === placeId) : undefined;
    const scoped = place ? itemsAt(place, d.events.events, all) : all;
    return upcomingOnly(kind ? scoped.filter((x) => x.kind === kind) : scoped, now, n);
  }, [tick, n, kind, placeId, Math.floor(now / 600000)]);
  const placeName = useMemo(() => {
    const d = getData();
    return placeId ? listPlaces(d.events.venues, d.shows.stages).find((p) => p.id === placeId)?.name || "" : "";
  }, [placeId, tick]);

  return (
    <div className="embed">
      <p className="embed-head">{placeName ? "Sắp diễn ra tại " + placeName : "Sắp diễn ra tại Đà Lạt"}</p>
      {list.length === 0 ? (
        <p className="embed-empty">Chưa có sự kiện nào trong {UPCOMING_DAYS} ngày tới.</p>
      ) : (
        <ul className="embed-list">
          {list.map((it) => {
            const href = it.programId ? programLink(it.programId) : it.url || FESTIVAL.website;
            return (
              <li key={it.key}>
                <a href={href} target="_blank" rel="noopener noreferrer">
                  <span className="embed-when"><b>{vnDayMonth(it.start)}</b><i>{it.allDay ? (vnDate(it.start) === vnDate(it.end) ? "cả ngày" : "đến " + vnDayMonth(it.end)) : vnTime(it.start)}</i></span>
                  <span className="embed-body"><b>{it.title}</b><i>{it.venue}{it.tentative ? " · dự kiến" : ""}</i></span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
      <a className="embed-foot" href={FESTIVAL.website} target="_blank" rel="noopener noreferrer">Xem đầy đủ trên DalatEvent.com →</a>
    </div>
  );
};

export default EmbedPage;
