import React, { FC, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import QRCode from "qrcode";
import { useSnackbar } from "../ui";
import { FESTIVAL } from "../data/festival";
import { getData, onDataChange } from "../data/store";
import { AgendaRow, agendaFor } from "../components/agenda";
import { useProgramSheet } from "../components/use-program-sheet";
import { IconArrow, IconPhone, IconRoute, IconShare } from "../components/icons";
import { vnDate, vnMidnight } from "../utils/agenda";
import { callPhone, openDirections, openUrl, shareText } from "../utils/device";
import { itemsAt, listPlaces } from "../utils/places";
import { SHARE_FAIL } from "../utils/platform";

const DAYS = 60;
export const placeLink = (id: string) => FESTIVAL.website + "#/dia-diem/" + encodeURIComponent(id);

/** Trang riêng của một địa điểm hoặc điểm diễn: chỉ đường, thông tin liên hệ, những gì sắp diễn ra tại đó */
const PlacePage: FC = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const { sheet, openProgram } = useProgramSheet();
  const [tick, setTick] = useState(0);
  useEffect(() => onDataChange(() => setTick((n) => n + 1)), []);
  const [qr, setQr] = useState("");
  const [showQr, setShowQr] = useState(false);
  useEffect(() => {
    setQr("");
    setShowQr(false);
  }, [id]);

  const data = getData();
  const place = useMemo(() => listPlaces(data.events.venues, data.shows.stages).find((p) => p.id === id), [id, tick]);
  const stage = place?.stageId ? data.shows.stages.find((s) => s.id === place.stageId) : undefined;
  const now = Date.now();
  const items = useMemo(() => {
    if (!place) return [];
    const from = vnMidnight(vnDate(now));
    const seen = new Set<string>();
    return itemsAt(place, data.events.events, agendaFor(from, from + DAYS * 86400000, now))
      .filter((x) => x.end >= now)
      .sort((a, b) => Math.max(a.start, now) - Math.max(b.start, now) || a.start - b.start)
      .filter((x) => {
        // Lịch band hằng tuần lặp lại: mỗi band chỉ hiện đêm gần nhất
        const k = x.weekly ? "w:" + x.title : x.key;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, 20);
  }, [place, tick, Math.floor(now / 600000)]);

  if (!place) {
    return (
      <div className="page page-col">
        <div className="empty">
          <h2>Không tìm thấy địa điểm này</h2>
          <p>Link có thể đã cũ. Xem tất cả địa điểm trên bản đồ.</p>
          <button type="button" className="btn btn-ink" onClick={() => navigate("/ban-do")}>Mở bản đồ <IconArrow size={20} /></button>
        </div>
      </div>
    );
  }

  const dest = typeof place.lat === "number" ? place.lat + "," + place.lng : place.mapQuery;
  const mapSrc = "https://www.google.com/maps?q=" + encodeURIComponent(dest) + "&z=15&output=embed&hl=vi";
  const link = placeLink(place.id);
  const toggleQr = async () => {
    if (!qr) {
      try {
        setQr(await QRCode.toDataURL(link, { width: 480, margin: 2, errorCorrectionLevel: "M", color: { dark: "#1b1440", light: "#ffffff" } }));
      } catch (e) {
        return;
      }
    }
    setShowQr((v) => !v);
  };

  return (
    <div className="scroll page">
      <header className="top">
        <p className="eyebrow">{place.kind === "show" ? "Điểm diễn show" + (stage && stage.name !== place.name ? " · " + stage.name : "") : "Địa điểm " + FESTIVAL.name}</p>
        <h1 className="h1">{place.name}</h1>
        {stage && <p className="muted">{stage.intro}</p>}
        {stage?.address && <p className="muted small">{stage.address}</p>}
        <div className="ps-actions">
          <button type="button" className="btn btn-ink" onClick={() => openDirections(dest)}><IconRoute size={20} />Chỉ đường</button>
          {stage?.phone && <button type="button" className="btn btn-line" onClick={() => callPhone(stage.phone!)}><IconPhone size={20} />{stage.phone_label}</button>}
          <button
            type="button"
            className="btn btn-line"
            onClick={async () => {
              const ok = await shareText(`${place.name}: xem những gì sắp diễn ra tại đây ${link}`, place.name);
              if (!ok) openSnackbar({ text: SHARE_FAIL, duration: 2200 });
            }}
          >
            <IconShare size={20} />Chia sẻ
          </button>
          <button type="button" className="btn btn-line" aria-expanded={showQr} onClick={toggleQr}>{showQr ? "Ẩn mã QR" : "Mã QR"}</button>
        </div>
        {showQr && qr && (
          <div className="ps-qr">
            <img src={qr} alt={"Mã QR mở trang " + place.name} width={200} height={200} />
            <p>Quét để xem lịch tại {place.name} trên DalatEvent.</p>
            <a className="btn btn-line" href={qr} download={"dalatevent-" + place.id + "-qr.png"}>Tải ảnh QR</a>
          </div>
        )}
      </header>

      <section className="sec">
        <h2 className="h2">Sắp diễn ra <em>tại đây</em></h2>
        {items.length === 0 ? (
          <div className="ag-empty">
            <b>Chưa có lịch nào trong {DAYS} ngày tới.</b>
            {stage && <span>Xem trang của điểm diễn để biết lịch mới nhất.</span>}
          </div>
        ) : (
          <ul className="ag-list">
            {items.map((it) => <AgendaRow key={it.key} it={it} showDate now={now} onOpenProgram={openProgram} />)}
          </ul>
        )}
        {stage && <button type="button" className="btn btn-line" onClick={() => openUrl(stage.source_url)}>Trang của {stage.name} <IconArrow size={18} /></button>}
      </section>

      <section className="sec">
        <h2 className="h2">Bản đồ</h2>
        <iframe className="mapframe" title={"Bản đồ: " + place.name} src={mapSrc} loading="lazy" referrerPolicy="no-referrer" allowFullScreen />
        <p className="muted small">{typeof place.lat === "number" ? "Bản đồ do Google Maps cung cấp." : "Chưa có tọa độ chính xác, bản đồ tìm theo tên địa điểm. Bản đồ do Google Maps cung cấp."}</p>
      </section>
      {sheet}
    </div>
  );
};

export default PlacePage;
