import React, { FC, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Program } from "../data/festival";
import { getData, onDataChange } from "../data/store";
import { search, SearchPlace } from "../utils/search";
import { listPlaces } from "../utils/places";
import { AgendaRow, agendaFor } from "./agenda";
import { IconPin, IconSearch } from "./icons";
import { tr } from "../i18n";

const HINTS = () => [tr("Hôm nay", "Today"), tr("Cuối tuần", "Weekend"), "12.12", "Jazz", "Lâm Viên"];

function places(): SearchPlace[] {
  const d = getData();
  return listPlaces(d.events.venues, d.shows.stages).map((p) => ({ id: p.id, name: p.name, hint: p.kind === "festival" ? tr("Địa điểm Festival", "Festival venue") : tr("Điểm diễn show", "Show venue") + (p.stageName && p.stageName !== p.name ? " · " + p.stageName : "") }));
}

/** Ô tìm kiếm: sự kiện, địa điểm, nghệ sĩ, hoạt động; hiểu cả ngày tháng trong câu tìm */
export const SearchBox: FC<{ onOpenProgram: (p: Program) => void }> = ({ onOpenProgram }) => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [tick, setTick] = useState(0);
  useEffect(() => onDataChange(() => setTick((n) => n + 1)), []);
  const now = Date.now();
  const res = useMemo(() => search(q, now, (a, b) => agendaFor(a, b, now), places()), [q, tick, Math.floor(now / 60000)]);
  const active = q.trim().length >= 2;

  return (
    <div className="search" role="search">
      <label className="search-field">
        <IconSearch size={20} />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={tr("Tìm sự kiện, địa điểm, nghệ sĩ, ngày…", "Search events, places, artists, dates…")}
          aria-label={tr("Tìm sự kiện, địa điểm, nghệ sĩ hoặc hoạt động theo ngày", "Search events, places, artists or a date")}
          autoComplete="off"
          enterKeyHint="search"
        />
        {q && <button type="button" className="search-clear" aria-label={tr("Xóa câu tìm", "Clear search")} onClick={() => setQ("")}>×</button>}
      </label>
      {!active && (
        <div className="search-hints" aria-label={tr("Gợi ý tìm kiếm", "Search suggestions")}>
          {HINTS().map((h) => (
            <button key={h} type="button" className="search-hint" onClick={() => setQ(h)}>{h}</button>
          ))}
        </div>
      )}
      {active && (
        <div className="search-results" aria-live="polite">
          <p className="search-meta">
            {res.empty
              ? tr("Không tìm thấy kết quả. Thử tên nghệ sĩ, địa điểm, hoặc một ngày như 12.12.", "No results. Try an artist, a place, or a date like 12.12.")
              : `${res.items.length} ${tr("sự kiện", res.items.length === 1 ? "event" : "events")}${res.places.length ? ", " + res.places.length + tr(" địa điểm", " places") : ""}${res.date ? " · " + res.date.label : tr(" · từ hôm nay trở đi", " · from today on")}`}
          </p>
          {res.places.length > 0 && (
            <div className="search-places">
              {res.places.map((p) => (
                <button key={p.id} type="button" className="search-place" onClick={() => navigate("/dia-diem/" + p.id)}>
                  <IconPin size={18} /><span><b>{p.name}</b><i>{p.hint}</i></span>
                </button>
              ))}
            </div>
          )}
          {res.items.length > 0 && (
            <ul className="ag-list">
              {res.items.map((it) => <AgendaRow key={it.key} it={it} showDate now={now} onOpenProgram={onOpenProgram} />)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
