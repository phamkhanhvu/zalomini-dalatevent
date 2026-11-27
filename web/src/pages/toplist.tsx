import React, { FC, useEffect, useMemo, useState } from "react";
import { track } from "../platform/stats";
import { RateStars, RatingBadge } from "../components/stars";
import { loadRatings } from "../platform/ratings";
import m_coffee from "../static/img/mascots/coffee.webp";
import { useNavigate, useParams } from "react-router";
import { loadToplist, TopDoc, TopPlace, topImage } from "../data/toplist";
import { distanceKm, LatLng } from "../utils/geo";
import { fold } from "../utils/search";
import { mapsUrl, openUrl } from "../utils/device";
import { isEn, tr } from "../i18n";

// Vị trí chỉ giữ trong bộ nhớ của trang, không lưu và không gửi đi
let myPos: LatLng | null = null;

const kmText = (km: number) => (km < 1 ? Math.round(km * 1000) + " m" : (km < 10 ? km.toFixed(1) : Math.round(km)) + " km");

function useToplist() {
  const [doc, setDoc] = useState<TopDoc | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let live = true;
    loadToplist()
      .then((d) => live && setDoc(d))
      .catch(() => live && setErr(true));
    return () => {
      live = false;
    };
  }, []);
  return { doc, err };
}

function useLocate() {
  const [pos, setPos] = useState<LatLng | null>(myPos);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const locate = () => {
    if (!("geolocation" in navigator)) {
      setMsg(tr("Thiết bị không hỗ trợ định vị.", "This device can't share location."));
      return;
    }
    setBusy(true);
    setMsg("");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setBusy(false);
        myPos = { lat: p.coords.latitude, lng: p.coords.longitude };
        setPos(myPos);
      },
      (e) => {
        setBusy(false);
        setMsg(e.code === 1 ? tr("Bạn chưa cho phép định vị.", "Location not allowed.") : tr("Chưa lấy được vị trí, hãy thử lại.", "Couldn't get your location, try again."));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };
  return { pos, busy, msg, locate };
}

const PlaceCard: FC<{ p: TopPlace; km: number | null; listName?: string }> = ({ p, km, listName }) => {
  const [open, setOpen] = useState(false);
  const img = topImage(p);
  const desc = (isEn() && p.desc_en) || p.desc;
  const where = p.lat !== null && p.lng !== null ? p.lat + "," + p.lng : p.name + ", " + p.address;
  return (
    <li className="tl-place">
      {img && <img className="tl-img" src={img} alt="" loading="lazy" onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")} />}
      <div className="tl-body">
        <div className="tl-head">
          <b>{p.name}</b>
          {km !== null && <i>{kmText(km)}</i>}
        </div>
        <RatingBadge id={p.id} />
        {listName && <span className="tl-tag">{listName}</span>}
        {p.address && <p className="tl-addr">{p.address}</p>}
        {desc && (
          <p className={"tl-desc" + (open ? " is-open" : "")} onClick={() => setOpen(!open)}>
            {desc}
          </p>
        )}
        <RateStars id={p.id} />
        <div className="tl-acts">
          <button type="button" className="btn btn-ink" onClick={() => { track("place_dir", p.id); openUrl(mapsUrl(where)); }}>{tr("Chỉ đường", "Directions")}</button>
          {p.clip && <button type="button" className="btn btn-line" onClick={() => { track("place_clip", p.id); openUrl(p.clip); }}>{tr("Xem clip", "Watch clip")}</button>}
        </div>
      </div>
    </li>
  );
};

const NearButton: FC<{ loc: ReturnType<typeof useLocate> }> = ({ loc }) => (
  <div className="tl-near">
    <button type="button" className={"fb" + (loc.pos ? " on" : "")} onClick={loc.locate} disabled={loc.busy}>
      {loc.busy ? tr("Đang lấy vị trí…", "Locating…") : loc.pos ? tr("Đang xếp theo gần tôi", "Sorted by distance") : tr("Xếp theo gần tôi", "Sort by distance")}
    </button>
    {loc.msg && <span className="muted small">{loc.msg}</span>}
  </div>
);

/** Trang tổng: chọn nhóm, chọn danh sách, hoặc tìm theo tên quán */
export const ToplistPage: FC = () => {
  const navigate = useNavigate();
  const { doc, err } = useToplist();
  const [group, setGroup] = useState("all");
  const [q, setQ] = useState("");
  const loc = useLocate();
  const en = isEn();

  const listName = useMemo(() => {
    const m: Record<string, string> = {};
    (doc?.lists || []).forEach((l) => (m[l.id] = en ? l.name_en : l.name));
    return m;
  }, [doc, en]);

  const found = useMemo(() => {
    const f = fold(q.trim());
    if (!doc || f.length < 2) return null;
    const hits = doc.places.filter((p) => fold(p.name + " " + p.address + " " + (listName[p.list] || "")).includes(f));
    const withKm = hits.map((p) => ({ p, km: loc.pos && p.lat !== null && p.lng !== null ? distanceKm(loc.pos, { lat: p.lat, lng: p.lng }) : null }));
    if (loc.pos) withKm.sort((a, b) => (a.km ?? 999) - (b.km ?? 999));
    return withKm.slice(0, 60);
  }, [doc, q, loc.pos, listName]);

  const lists = (doc?.lists || []).filter((l) => group === "all" || l.group === group);

  return (
    <div className="scroll page">
      <header className="top has-top-mascot">
        <img className="top-mascot" src={m_coffee} alt="" aria-hidden="true" />
        <p className="eyebrow">{tr("Top list Đà Lạt", "Da Lat top lists")}</p>
        <h1 className="h1">{doc ? doc.places.length.toLocaleString(en ? "en" : "vi") : "…"}{tr(" địa điểm, ", " places, ")}<em>{doc ? doc.lists.length : "…"}{tr(" chủ đề", " topics")}</em></h1>
        <p className="muted">{tr("Săn mây, cafe, quán ngon, chỗ ở, chỗ chơi… do đội Sense Group đi và chọn lọc.", "Cloud hunting, cafés, food, stays and things to do, picked by the Sense Group team.")}</p>
        <label className="search-field tl-search">
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("Tìm quán, món, địa điểm…", "Search places, dishes…")} />
        </label>
        {doc && (
          <div className="filters" role="tablist" aria-label={tr("Lọc theo nhóm", "Filter by group")}>
            <button type="button" role="tab" aria-selected={group === "all"} className={"fb" + (group === "all" ? " on" : "")} onClick={() => setGroup("all")}>{tr("Tất cả", "All")}</button>
            {doc.groups.map((g) => (
              <button key={g.id} type="button" role="tab" aria-selected={group === g.id} className={"fb" + (group === g.id ? " on" : "")} onClick={() => setGroup(g.id)}>
                {en ? g.name_en : g.name}
              </button>
            ))}
          </div>
        )}
      </header>
      <section className="sec">
        {!doc && !err && <p className="muted">{tr("Đang tải danh sách…", "Loading…")}</p>}
        {err && <p className="muted">{tr("Chưa tải được danh sách. Hãy kiểm tra mạng rồi thử lại.", "Couldn't load the lists. Check your connection and try again.")}</p>}
        {found && (
          <>
            <NearButton loc={loc} />
            <p className="muted small">{found.length ? found.length + tr(" kết quả", " results") : tr("Không thấy địa điểm phù hợp.", "No matching places.")}</p>
            <ul className="tl-places" ref={() => loadRatings(found.map((x) => x.p.id))}>{found.map(({ p, km }) => <PlaceCard key={p.id} p={p} km={km} listName={listName[p.list]} />)}</ul>
          </>
        )}
        {doc && !found && (
          <ul className="tl-lists">
            {lists.map((l) => (
              <li key={l.id}>
                <button type="button" className="tl-list" onClick={() => navigate("/top-list/" + l.id)}>
                  <b>{en ? l.name_en : l.name}</b>
                  <i>{l.count}{tr(" địa điểm", l.count === 1 ? " place" : " places")}</i>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

/** Một danh sách theo chủ đề */
export const ToplistDetailPage: FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { doc, err } = useToplist();
  const loc = useLocate();
  const en = isEn();
  const list = doc?.lists.find((l) => l.id === id);
  const items = useMemo(() => {
    const ps = (doc?.places || []).filter((p) => p.list === id).map((p) => ({ p, km: loc.pos && p.lat !== null && p.lng !== null ? distanceKm(loc.pos, { lat: p.lat, lng: p.lng }) : null }));
    if (loc.pos) ps.sort((a, b) => (a.km ?? 999) - (b.km ?? 999));
    return ps;
  }, [doc, id, loc.pos]);
  const group = doc?.groups.find((g) => g.id === list?.group);

  return (
    <div className="scroll page">
      <header className="top">
        <button type="button" className="acc-switch link-left" onClick={() => navigate("/top-list")}>← {tr("Tất cả top list", "All top lists")}</button>
        <p className="eyebrow">{group ? (en ? group.name_en : group.name) : tr("Top list Đà Lạt", "Da Lat top lists")}</p>
        <h1 className="h1">{list ? (en ? list.name_en : list.name) : "…"}</h1>
        {list && <p className="muted">{list.count}{tr(" địa điểm do đội Sense Group chọn lọc.", " places picked by the Sense Group team.")}</p>}
        {list && <NearButton loc={loc} />}
      </header>
      <section className="sec">
        {!doc && !err && <p className="muted">{tr("Đang tải danh sách…", "Loading…")}</p>}
        {err && <p className="muted">{tr("Chưa tải được danh sách. Hãy kiểm tra mạng rồi thử lại.", "Couldn't load the lists. Check your connection and try again.")}</p>}
        {doc && !list && <p className="muted">{tr("Không tìm thấy danh sách này.", "List not found.")}</p>}
        <ul className="tl-places" ref={() => loadRatings(items.map((x) => x.p.id))}>{items.map(({ p, km }) => <PlaceCard key={p.id} p={p} km={km} />)}</ul>
      </section>
    </div>
  );
};
