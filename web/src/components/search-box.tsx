import React, { FC, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Program, VENUES } from "../data/festival";
import { getData, onDataChange } from "../data/store";
import { search, SearchPlace } from "../utils/search";
import { AgendaRow, agendaFor } from "./agenda";
import { IconPin, IconSearch } from "./icons";

const HINTS = ["Hôm nay", "Cuối tuần", "12.12", "Jazz", "Lâm Viên"];

function places(): SearchPlace[] {
  const out: SearchPlace[] = VENUES.map((v) => ({ id: "f:" + v.id, name: v.name, hint: "Địa điểm Festival" }));
  for (const st of getData().shows.stages) {
    for (const pl of st.places && st.places.length ? st.places : [{ name: st.name }]) out.push({ id: "s:" + st.id + ":" + pl.name, name: pl.name, hint: "Điểm diễn show · " + st.name });
  }
  return out;
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
          placeholder="Tìm sự kiện, địa điểm, nghệ sĩ, ngày…"
          aria-label="Tìm sự kiện, địa điểm, nghệ sĩ hoặc hoạt động theo ngày"
          autoComplete="off"
          enterKeyHint="search"
        />
        {q && <button type="button" className="search-clear" aria-label="Xóa câu tìm" onClick={() => setQ("")}>×</button>}
      </label>
      {!active && (
        <div className="search-hints" aria-label="Gợi ý tìm kiếm">
          {HINTS.map((h) => (
            <button key={h} type="button" className="search-hint" onClick={() => setQ(h)}>{h}</button>
          ))}
        </div>
      )}
      {active && (
        <div className="search-results" aria-live="polite">
          <p className="search-meta">
            {res.empty
              ? "Không tìm thấy kết quả. Thử tên nghệ sĩ, địa điểm, hoặc một ngày như 12.12."
              : `${res.items.length} sự kiện${res.places.length ? ", " + res.places.length + " địa điểm" : ""}${res.date ? " · " + res.date.label : " · từ hôm nay trở đi"}`}
          </p>
          {res.places.length > 0 && (
            <div className="search-places">
              {res.places.map((p) => (
                <button key={p.id} type="button" className="search-place" onClick={() => navigate("/ban-do")}>
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
