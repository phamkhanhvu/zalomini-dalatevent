import { useNavigate } from "react-router";
import React, { FC, useEffect, useMemo, useState } from "react";
import { PROGRAMS, Program, VENUES } from "../data/festival";
import { getData, onDataChange } from "../data/store";
import { callPhone, openDirections, openUrl } from "../utils/device";
import { formatKm, LatLng, rankPlaces } from "../utils/geo";
import { vnDate } from "../utils/agenda";
import { statusOf } from "../utils/time";
import { useProgramSheet } from "../components/use-program-sheet";
import { IconArrow, IconPin, IconRoute } from "../components/icons";
import { loc, tr } from "../i18n";
const ME = () => tr("vị trí của bạn", "your location");

type Kind = "festival" | "show";
interface Line { when: string; title: string; program?: Program; url?: string }
interface Place { id: string; kind: Kind; name: string; mapQuery: string; lat: number | null; lng: number | null; color: string; lines: Line[]; more?: string }

const RADII = [1, 3, 5, 10];
const SHOW_COLOR = "#1D5FA8";
const dm = (iso: string) => iso.slice(8, 10) + "." + iso.slice(5, 7);

/** Gom địa điểm Festival và điểm diễn show thành một danh sách */
function buildPlaces(today: string, weekday: number): Place[] {
  const out: Place[] = VENUES.map((v) => ({
    id: "f:" + v.id,
    kind: "festival" as Kind,
    name: v.name,
    mapQuery: v.mapQuery,
    lat: v.lat,
    lng: v.lng,
    color: v.color,
    lines: v.programs
      .map((id) => PROGRAMS.find((p) => p.id === id))
      .filter((p): p is Program => !!p && statusOf(p) !== "ended")
      .map((p) => ({ when: p.day + (p.sub && p.sub !== tr("trong ngày", "all day") ? " · " + p.sub : ""), title: p.title + (p.tentative ? tr(" (dự kiến)", " (tentative)") : ""), program: p })),
  }));
  for (const st of getData().shows.stages) {
    const places = st.places && st.places.length ? st.places : [{ label: "", name: loc(st, "name"), map_query: st.name + ", Đà Lạt", lat: null, lng: null }];
    places.forEach((pl, i) => {
      let lines: Line[];
      let more: string | undefined;
      if (st.kind === "weekly") {
        const it = st.items.find((x) => x.weekday === weekday);
        lines = it ? [{ when: tr("Tối nay · ", "Tonight · ") + it.time, title: it.title, url: it.url }] : [];
        more = tr("Nhạc sống mỗi tối, lịch band đổi theo tuần", "Live music every night; bands change weekly");
      } else {
        const mine = st.items.filter((x) => (x.date || "") >= today && (places.length === 1 || x.place === pl.label));
        lines = mine.slice(0, 3).map((x) => ({ when: dm(x.date!) + " · " + x.time, title: x.title, url: x.url }));
        if (mine.length > 3) more = tr("và " + (mine.length - 3) + " đêm diễn khác", "and " + (mine.length - 3) + " more shows");
      }
      out.push({ id: "s:" + st.id + ":" + i, kind: "show", name: pl.name, mapQuery: pl.map_query, lat: pl.lat, lng: pl.lng, color: SHOW_COLOR, lines, more });
    });
  }
  return out;
}

const MapPage: FC = () => {
  const { sheet, openProgram } = useProgramSheet();
  const navigate = useNavigate();
  const [, setTick] = useState(0);
  useEffect(() => onDataChange(() => setTick((n) => n + 1)), []);

  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [originLabel, setOriginLabel] = useState("");
  const [radius, setRadius] = useState<number | null>(null);
  const [kind, setKind] = useState<Kind | "all">("all");
  const [geoMsg, setGeoMsg] = useState("");
  const [locating, setLocating] = useState(false);
  const [selected, setSelected] = useState<string>("");

  const now = Date.now();
  const today = vnDate(now);
  const weekday = new Date(now + 7 * 3600000).getUTCDay();
  const places = useMemo(() => buildPlaces(today, weekday), [today, weekday, getData()]);
  const shown = kind === "all" ? places : places.filter((p) => p.kind === kind);
  const ranked = rankPlaces(shown, origin, origin ? radius : null);
  const withCoords = places.filter((p) => typeof p.lat === "number");
  const current = places.find((p) => p.id === selected) || ranked.near[0]?.place || places[0];

  // Chỉ hỏi vị trí khi người dùng bấm nút. Vị trí chỉ giữ trong trang, không lưu và không gửi đi.
  const locate = () => {
    if (!("geolocation" in navigator)) {
      setGeoMsg(tr("Thiết bị không hỗ trợ định vị. Hãy chọn một điểm xuất phát bên dưới.", "This device can't share location. Pick a starting point below."));
      return;
    }
    setLocating(true);
    setGeoMsg("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setOriginLabel(ME());
        setSelected("");
        if (radius === null) setRadius(5);
      },
      (err) => {
        setLocating(false);
        setGeoMsg(err.code === 1 ? tr("Bạn chưa cho phép định vị. Không sao, hãy chọn một điểm xuất phát bên dưới.", "Location not allowed. No problem: pick a starting point below.") : tr("Chưa lấy được vị trí. Hãy thử lại hoặc chọn một điểm xuất phát bên dưới.", "Couldn't get your location. Try again or pick a starting point below."));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };
  const pickOrigin = (id: string) => {
    const p = withCoords.find((x) => x.id === id);
    setGeoMsg("");
    setSelected("");
    if (!p) {
      setOrigin(null);
      setOriginLabel("");
      return;
    }
    setOrigin({ lat: p.lat as number, lng: p.lng as number });
    setOriginLabel(p.name);
    if (radius === null) setRadius(5);
  };

  const mapSrc = current
    ? "https://www.google.com/maps?q=" + encodeURIComponent(typeof current.lat === "number" ? current.lat + "," + current.lng : current.mapQuery) + "&z=15&output=embed&hl=vi"
    : "";

  const Card: FC<{ p: Place; km: number | null; n: number }> = ({ p, km, n }) => (
    <article className={"venue" + (current && current.id === p.id ? " is-current" : "")}>
      <div className="venue-head">
        <span className="venue-no" style={{ background: p.color }}>{n}</span>
        <h2>{p.name}</h2>
        {km !== null && <span className="venue-km">{km < 0.03 ? tr("Tại đây", "Here") : formatKm(km)}</span>}
      </div>
      <p className="venue-kind">{p.kind === "festival" ? tr("Địa điểm Festival", "Festival venue") : tr("Điểm diễn show", "Show venue")}</p>
      {p.lines.length > 0 ? (
        <ul>
          {p.lines.map((l, i) => (
            <li key={i}>
              <button type="button" onClick={() => (l.program ? openProgram(l.program) : l.url && openUrl(l.url))}>
                <span className="venue-day">{l.when}</span>
                <span className="venue-title">{l.title}</span>
                <IconArrow size={18} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small">{tr("Chưa có lịch sắp tới trong dữ liệu.", "Nothing upcoming listed.")}</p>
      )}
      {p.more && <p className="muted small">{p.more}</p>}
      <div className="venue-actions">
        <button type="button" className="btn btn-line" onClick={() => setSelected(p.id)}>
          <IconPin size={20} />{tr("Xem trên bản đồ", "Show on map")}
        </button>
        <button type="button" className="btn btn-line" onClick={() => navigate("/dia-diem/" + p.id.replace(/:/g, "-"))}>
          {tr("Trang địa điểm", "Venue page")}
        </button>
        <button type="button" className="btn btn-ink" onClick={() => openDirections(typeof p.lat === "number" ? p.lat + "," + p.lng : p.mapQuery)}>
          <IconRoute size={20} />{tr("Chỉ đường", "Directions")}
        </button>
      </div>
    </article>
  );

  return (
    <div className="page page-col">
      <header className="top">
        <p className="eyebrow">{places.length}{tr(" điểm đến", " places")}</p>
        <h1 className="h1">{tr("Bản đồ ", "Map ")}<em>{tr("gần tôi", "near me")}</em></h1>
      </header>
      <div className="scroll grow">
        <section className="near pad">
          <div className="near-row">
            <button type="button" className="btn btn-ink" onClick={locate} disabled={locating}>
              <IconPin size={20} />{locating ? tr("Đang tìm vị trí…", "Locating…") : tr("Dùng vị trí của tôi", "Use my location")}
            </button>
            <label className="near-pick">
              <span>{tr("hoặc tính từ", "or measure from")}</span>
              <select value={origin && originLabel !== ME() ? withCoords.find((x) => x.name === originLabel)?.id || "" : ""} onChange={(e) => pickOrigin(e.target.value)} aria-label={tr("Chọn điểm xuất phát", "Pick a starting point")}>
                <option value="">{tr("Chọn một địa điểm", "Choose a place")}</option>
                {withCoords.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
          </div>
          {geoMsg && <p className="near-msg" role="status">{geoMsg}</p>}
          {origin && (
            <React.Fragment>
              <p className="muted small">
                {tr("Khoảng cách đường chim bay tính từ ", "Straight-line distance from ")}{originLabel}.{" "}
                <button type="button" className="link-inline" onClick={() => { setOrigin(null); setOriginLabel(""); setRadius(null); }}>{tr("Bỏ chọn", "Clear")}</button>
              </p>
              <div className="filters" role="tablist" aria-label={tr("Bán kính", "Radius")}>
                {RADII.map((r) => (
                  <button key={r} type="button" role="tab" aria-selected={radius === r} className={"fb fb-sm" + (radius === r ? " on" : "")} onClick={() => setRadius(r)}>
                    {r} km
                  </button>
                ))}
                <button type="button" role="tab" aria-selected={radius === null} className={"fb fb-sm" + (radius === null ? " on" : "")} onClick={() => setRadius(null)}>
                  {tr("Tất cả", "All")}
                </button>
              </div>
            </React.Fragment>
          )}
          <div className="filters filters-sub" role="tablist" aria-label={tr("Loại địa điểm", "Place type")}>
            {([["all", tr("Tất cả", "All")], ["festival", "Festival"], ["show", tr("Show diễn", "Shows")]] as [Kind | "all", string][]).map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={kind === id} className={"fb fb-sm" + (kind === id ? " on" : "")} onClick={() => setKind(id)}>
                {label}
              </button>
            ))}
          </div>
        </section>

        {current && (
          <div className="pad">
            <iframe className="mapframe" title={tr("Bản đồ: ", "Map: ") + current.name} src={mapSrc} loading="lazy" referrerPolicy="no-referrer" allowFullScreen />
            <p className="muted small">{tr("Đang xem: ", "Showing: ")}{current.name}{tr(". Bản đồ do Google Maps cung cấp.", ". Map by Google Maps.")}</p>
          </div>
        )}

        <div className="list pad">
          {ranked.near.map((r, i) => (
            <Card key={r.place.id} p={r.place} km={r.km} n={i + 1} />
          ))}
        </div>
        {origin && ranked.near.length === 0 && (
          <p className="near-msg pad">{tr(`Không có địa điểm nào trong bán kính ${radius} km. Hãy chọn bán kính lớn hơn.`, `No places within ${radius} km. Try a larger radius.`)}</p>
        )}
        {origin && ranked.hidden > 0 && ranked.near.length > 0 && (
          <p className="muted small pad">{tr(`Còn ${ranked.hidden} địa điểm nằm ngoài bán kính ${radius} km.`, `${ranked.hidden} more places beyond ${radius} km.`)}</p>
        )}
        {ranked.unknown.length > 0 && (
          <React.Fragment>
            <p className="ag-sub pad">{tr("Chưa có vị trí chính xác", "No exact location yet")}</p>
            <div className="list pad">
              {ranked.unknown.map((p, i) => (
                <Card key={p.id} p={p} km={null} n={ranked.near.length + i + 1} />
              ))}
            </div>
          </React.Fragment>
        )}
        <p className="muted small pad foot">
          {tr("Vị trí của bạn chỉ dùng để tính khoảng cách ngay trên máy, không được lưu hay gửi đi. Tọa độ địa điểm: © OpenStreetMap contributors. Các mục dự kiến có thể thay đổi.", "Your location is only used on this device to measure distance; it is never stored or sent. Venue coordinates: © OpenStreetMap contributors. Tentative items may change.")}
        </p>
      </div>
      {sheet}
    </div>
  );
};

export default MapPage;
