import React, { FC, useEffect, useState } from "react";
import QRCode from "qrcode";
import { useSnackbar } from "../ui";
import { FESTIVAL } from "../data/festival";
import { getData } from "../data/store";
import { listPlaces } from "../utils/places";
import { isEn, tr } from "../i18n";

const KINDS = () => [
  { id: "", label: tr("Tất cả", "All") },
  { id: "festival", label: tr("Festival Hoa", "Flower Festival") },
  { id: "event", label: tr("Sự kiện khác", "Other events") },
  { id: "show", label: tr("Show diễn", "Shows") },
];

/** Trang hướng dẫn cho đối tác: mã nhúng lịch và mã QR của DalatEvent */
const EmbedInfoPage: FC = () => {
  const { openSnackbar } = useSnackbar();
  const [kind, setKind] = useState("");
  const [n, setN] = useState(6);
  const [place, setPlace] = useState("");
  const [en, setEn] = useState(isEn());
  const places = listPlaces(getData().events.venues, getData().shows.stages);
  const [qr, setQr] = useState("");
  useEffect(() => {
    QRCode.toDataURL(FESTIVAL.website, { width: 600, margin: 2, errorCorrectionLevel: "M", color: { dark: "#1b1440", light: "#ffffff" } }).then(setQr).catch(() => setQr(""));
  }, []);

  const query = "?n=" + n + (kind ? "&loai=" + kind : "") + (place ? "&noi=" + place : "") + (en ? "&lang=en" : "");
  const src = FESTIVAL.website + "#/nhung" + query;
  const height = 96 + n * 64;
  const code = `<iframe src="${src}" title="${en ? "Da Lat events from DalatEvent" : "Lịch sự kiện Đà Lạt từ DalatEvent"}" width="100%" height="${height}" style="border:0;max-width:480px" loading="lazy"></iframe>`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      openSnackbar({ text: tr("Đã chép mã nhúng", "Embed code copied"), type: "success", duration: 2000 });
    } catch (e) {
      openSnackbar({ text: tr("Chưa chép được, hãy bôi đen và chép tay", "Couldn't copy; please select and copy it manually"), duration: 2400 });
    }
  };

  return (
    <div className="scroll page">
      <header className="top">
        <p className="eyebrow">{tr("Dành cho khách sạn, quán, website đối tác", "For hotels, cafés and partner websites")}</p>
        <h1 className="h1">{tr("Nhúng lịch ", "Embed the calendar ")}<em>{tr("và mã QR", "and QR code")}</em></h1>
      </header>
      <section className="sec">
        <h2 className="h2">{tr("Nhúng lịch sự kiện", "Embed the events calendar")}</h2>
        <p>{tr("Dán đoạn mã dưới đây vào website của bạn. Lịch tự cập nhật theo dữ liệu của DalatEvent, miễn phí.", "Paste the code below into your website. The calendar updates itself from DalatEvent's data, free of charge.")}</p>
        <div className="filters" role="tablist" aria-label={tr("Loại sự kiện", "Event type")}>
          {KINDS().map((k) => (
            <button key={k.id} type="button" role="tab" aria-selected={kind === k.id} className={"fb fb-sm" + (kind === k.id ? " on" : "")} onClick={() => setKind(k.id)}>{k.label}</button>
          ))}
        </div>
        <div className="filters" role="tablist" aria-label={tr("Số dòng", "Rows")}>
          {[4, 6, 10].map((x) => (
            <button key={x} type="button" role="tab" aria-selected={n === x} className={"fb fb-sm" + (n === x ? " on" : "")} onClick={() => setN(x)}>{x}{tr(" dòng", " rows")}</button>
          ))}
        </div>
        <div className="filters" role="tablist" aria-label={tr("Ngôn ngữ của khung", "Widget language")}>
          <button type="button" role="tab" aria-selected={!en} className={"fb fb-sm" + (!en ? " on" : "")} onClick={() => setEn(false)}>Tiếng Việt</button>
          <button type="button" role="tab" aria-selected={en} className={"fb fb-sm" + (en ? " on" : "")} onClick={() => setEn(true)}>English</button>
        </div>
        <label className="embed-pick">{tr("Chỉ hiện lịch tại một địa điểm (ví dụ quán, sân khấu của bạn)", "Only show one venue (for example your café or stage)")}
          <select value={place} onChange={(e) => setPlace(e.target.value)}>
            <option value="">{tr("Tất cả địa điểm", "All venues")}</option>
            {places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <textarea className="embed-code" readOnly rows={5} value={code} aria-label={tr("Mã nhúng", "Embed code")} onFocus={(e) => e.currentTarget.select()} />
        <button type="button" className="btn btn-ink btn-wide" onClick={copy}>{tr("Chép mã nhúng", "Copy embed code")}</button>
        <p className="eyebrow">{tr("Xem trước", "Preview")}</p>
        <iframe key={query} className="embed-preview" src={"#/nhung" + query} title={tr("Xem trước khung nhúng", "Widget preview")} height={height} />
      </section>
      <section className="sec">
        <h2 className="h2">{tr("Mã QR của DalatEvent", "DalatEvent QR code")}</h2>
        <p>{tr("In mã này ở quầy lễ tân, bàn hoặc tờ rơi để khách quét xem \"Đà Lạt có gì vui?\". Mỗi chương trình Festival cũng có mã QR riêng: mở chương trình rồi bấm \"Mã QR\".", "Print this at reception, on tables or flyers so guests can scan to see what's on in Da Lat. Each festival programme also has its own QR code: open it and tap \"QR code\".")}</p>
        {qr && (
          <div className="ps-qr">
            <img src={qr} alt={tr("Mã QR mở dalatevent.com", "QR code for dalatevent.com")} width={220} height={220} />
            <a className="btn btn-line" href={qr} download="dalatevent-qr.png">{tr("Tải ảnh QR", "Download QR")}</a>
          </div>
        )}
      </section>
    </div>
  );
};

export default EmbedInfoPage;
