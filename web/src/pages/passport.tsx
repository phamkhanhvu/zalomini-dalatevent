import React, { FC, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useSnackbar } from "../ui";
import { FESTIVAL } from "../data/festival";
import { getData, onDataChange } from "../data/store";
import { openAccount } from "../components/account-panel";
import { getAccount, onAccount } from "../platform/account";
import { vnDayMonth, vnTime } from "../utils/agenda";
import { shareText } from "../utils/device";
import { catalogue, GRACE_MS, RADIUS_M, StampDef, stampHere } from "../utils/passport";
import { SHARE_FAIL } from "../utils/platform";
import { addStamps, useStamps } from "../utils/stamps";
import passportImg from "../static/img/passport-560.webp";

const meters = (m: number) => (m >= 1000 ? (m / 1000).toFixed(m >= 10000 ? 0 : 1).replace(".", ",") + " km" : m + " m");
const initials = (s: string) => s.split(/\s+/).filter((w) => /^[\p{L}\p{N}]/u.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

/** Hộ chiếu Đà Lạt: sưu tập dấu mộc bằng cách có mặt tại địa điểm hoặc sự kiện */
const PassportPage: FC = () => {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const stamps = useStamps();
  const [tick, setTick] = useState(0);
  useEffect(() => onDataChange(() => setTick((n) => n + 1)), []);
  const [, force] = useState(0);
  useEffect(() => onAccount(() => force((n) => n + 1)), []);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const defs = useMemo(() => {
    const d = getData();
    return catalogue(d.events.venues, d.shows.stages, d.events.events);
  }, [tick]);
  const got = new Map(stamps.map((s) => [s.id, s.at]));
  const have = defs.filter((d) => got.has(d.id)).length;
  const now = Date.now();

  const stampNow = () => {
    if (!("geolocation" in navigator)) {
      setMsg("Thiết bị này không hỗ trợ định vị nên chưa đóng dấu được.");
      return;
    }
    setBusy(true);
    setMsg("");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setBusy(false);
        const t = Date.now();
        const r = stampHere(defs, stamps, { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }, t);
        if (r.earned.length) {
          addStamps(r.earned.map((d) => d.id), t);
          setMsg("");
          openSnackbar({ text: "Đã đóng " + r.earned.length + " dấu: " + r.earned.map((d) => d.title).join(", "), type: "success", duration: 4000 });
        } else if (!r.nearest) setMsg("Bạn đã có đủ mọi dấu hiện có.");
        else if (r.nearest.verdict === "inaccurate") setMsg("Định vị đang quá mơ hồ. Hãy ra chỗ thoáng, bật GPS rồi thử lại.");
        else if (r.nearest.verdict === "far") setMsg(`Chưa đủ gần. Dấu gần nhất là "${r.nearest.def.title}", cách khoảng ${meters(r.nearest.meters)}. Cần đứng trong ${RADIUS_M} m.`);
        else setMsg(`Bạn đang ở gần "${r.nearest.def.title}" nhưng ${r.nearest.verdict === "early" ? "sự kiện chưa tới giờ" : "sự kiện đã kết thúc"}.`);
      },
      (err) => {
        setBusy(false);
        setMsg(err.code === 1 ? "Bạn chưa cho phép định vị. Hãy cho phép trong cài đặt trình duyệt rồi thử lại." : "Chưa lấy được vị trí. Hãy thử lại.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const hint = (d: StampDef) => {
    const at = got.get(d.id);
    if (at) return "Đã đóng " + vnTime(at) + ", " + vnDayMonth(at);
    if (d.kind === "place") return "Đến nơi rồi bấm Đóng dấu";
    if (now > (d.end as number) + GRACE_MS) return "Đã kết thúc";
    return vnDayMonth(d.start as number) + (vnDayMonth(d.start as number) === vnDayMonth(d.end as number) ? ", " + vnTime(d.start as number) : " – " + vnDayMonth(d.end as number)) + " · " + d.place;
  };
  const card = (d: StampDef) => {
    const on = got.has(d.id);
    const missed = !on && d.kind === "event" && now > (d.end as number) + GRACE_MS;
    return (
      <li key={d.id}>
        <button type="button" className={"stamp" + (on ? " on" : "") + (missed ? " missed" : "")} onClick={() => navigate(d.kind === "place" ? "/dia-diem/" + d.ref : "/chuong-trinh?xem=" + d.ref)}>
          <span className="stamp-mark" aria-hidden="true">{on ? initials(d.title) : "?"}</span>
          <b>{d.title}</b>
          <i>{hint(d)}</i>
        </button>
      </li>
    );
  };
  const places = defs.filter((d) => d.kind === "place");
  const events = defs.filter((d) => d.kind === "event");
  const signedIn = getAccount().status === "in";

  return (
    <div className="scroll page">
      <header className="top">
        <div className="pass-head">
          <div>
            <p className="eyebrow">Sưu tập dấu mộc</p>
            <h1 className="h1">Hộ chiếu <em>Đà Lạt</em></h1>
          </div>
          <img className="pass-art" src={passportImg} alt="" width={112} height={141} />
        </div>
        <p className="muted">Đến một địa điểm hoặc dự một chương trình, bấm Đóng dấu để ghi lại. Cần cho phép định vị; vị trí chỉ dùng trên máy bạn để kiểm tra khoảng cách, không được gửi đi.</p>
        <div className="pass-bar" role="img" aria-label={`Đã có ${have} trên ${defs.length} dấu`}>
          <span style={{ width: (defs.length ? (have / defs.length) * 100 : 0) + "%" }} />
        </div>
        <p className="pass-count"><b>{have}</b> / {defs.length} dấu</p>
        <div className="plan-actions">
          <button type="button" className="btn btn-ink" disabled={busy} onClick={stampNow}>{busy ? "Đang định vị…" : "Đóng dấu tại đây"}</button>
          <button
            type="button"
            className="btn btn-line"
            onClick={async () => {
              const ok = await shareText(`Tôi đã sưu tập ${have}/${defs.length} dấu trong Hộ chiếu Đà Lạt. Thử xem bạn được mấy dấu: ${FESTIVAL.website}#/ho-chieu`, "Hộ chiếu Đà Lạt");
              if (!ok) openSnackbar({ text: SHARE_FAIL, duration: 2200 });
            }}
          >
            Khoe hộ chiếu
          </button>
        </div>
        {msg && <p className="plan-summary" role="status">{msg}</p>}
        {!signedIn && have > 0 && (
          <button type="button" className="acc-switch link-left" onClick={openAccount}>Đăng nhập để giữ dấu khi đổi máy</button>
        )}
      </header>
      <section className="sec">
        <h2 className="h2">Địa điểm</h2>
        <ul className="stamps">{places.map(card)}</ul>
      </section>
      {events.length > 0 && (
        <section className="sec">
          <h2 className="h2">{FESTIVAL.name}</h2>
          <p className="muted small">Dấu sự kiện chỉ đóng được tại nơi diễn ra, từ 1 giờ trước tới 1 giờ sau chương trình.</p>
          <ul className="stamps">{events.map(card)}</ul>
        </section>
      )}
      <p className="muted small pad foot">Hộ chiếu là trò sưu tập cho vui, chưa gắn với quà tặng hay ưu đãi nào.</p>
    </div>
  );
};

export default PassportPage;
