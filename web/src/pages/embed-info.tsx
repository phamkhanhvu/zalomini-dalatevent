import React, { FC, useEffect, useState } from "react";
import QRCode from "qrcode";
import { useSnackbar } from "../ui";
import { FESTIVAL } from "../data/festival";
import { getData } from "../data/store";
import { listPlaces } from "../utils/places";

const KINDS = [
  { id: "", label: "Tất cả" },
  { id: "festival", label: "Festival Hoa" },
  { id: "event", label: "Sự kiện khác" },
  { id: "show", label: "Show diễn" },
];

/** Trang hướng dẫn cho đối tác: mã nhúng lịch và mã QR của DalatEvent */
const EmbedInfoPage: FC = () => {
  const { openSnackbar } = useSnackbar();
  const [kind, setKind] = useState("");
  const [n, setN] = useState(6);
  const [place, setPlace] = useState("");
  const places = listPlaces(getData().events.venues, getData().shows.stages);
  const [qr, setQr] = useState("");
  useEffect(() => {
    QRCode.toDataURL(FESTIVAL.website, { width: 600, margin: 2, errorCorrectionLevel: "M", color: { dark: "#1b1440", light: "#ffffff" } }).then(setQr).catch(() => setQr(""));
  }, []);

  const query = "?n=" + n + (kind ? "&loai=" + kind : "") + (place ? "&noi=" + place : "");
  const src = FESTIVAL.website + "#/nhung" + query;
  const height = 96 + n * 64;
  const code = `<iframe src="${src}" title="Lịch sự kiện Đà Lạt từ DalatEvent" width="100%" height="${height}" style="border:0;max-width:480px" loading="lazy"></iframe>`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      openSnackbar({ text: "Đã chép mã nhúng", type: "success", duration: 2000 });
    } catch (e) {
      openSnackbar({ text: "Chưa chép được, hãy bôi đen và chép tay", duration: 2400 });
    }
  };

  return (
    <div className="scroll page">
      <header className="top">
        <p className="eyebrow">Dành cho khách sạn, quán, website đối tác</p>
        <h1 className="h1">Nhúng lịch <em>và mã QR</em></h1>
      </header>
      <section className="sec">
        <h2 className="h2">Nhúng lịch sự kiện</h2>
        <p>Dán đoạn mã dưới đây vào website của bạn. Lịch tự cập nhật theo dữ liệu của DalatEvent, miễn phí.</p>
        <div className="filters" role="tablist" aria-label="Loại sự kiện">
          {KINDS.map((k) => (
            <button key={k.id} type="button" role="tab" aria-selected={kind === k.id} className={"fb fb-sm" + (kind === k.id ? " on" : "")} onClick={() => setKind(k.id)}>{k.label}</button>
          ))}
        </div>
        <div className="filters" role="tablist" aria-label="Số dòng">
          {[4, 6, 10].map((x) => (
            <button key={x} type="button" role="tab" aria-selected={n === x} className={"fb fb-sm" + (n === x ? " on" : "")} onClick={() => setN(x)}>{x} dòng</button>
          ))}
        </div>
        <label className="embed-pick">Chỉ hiện lịch tại một địa điểm (ví dụ quán, sân khấu của bạn)
          <select value={place} onChange={(e) => setPlace(e.target.value)}>
            <option value="">Tất cả địa điểm</option>
            {places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <textarea className="embed-code" readOnly rows={5} value={code} aria-label="Mã nhúng" onFocus={(e) => e.currentTarget.select()} />
        <button type="button" className="btn btn-ink btn-wide" onClick={copy}>Chép mã nhúng</button>
        <p className="eyebrow">Xem trước</p>
        <iframe key={query} className="embed-preview" src={"#/nhung" + query} title="Xem trước khung nhúng" height={height} />
      </section>
      <section className="sec">
        <h2 className="h2">Mã QR của DalatEvent</h2>
        <p>In mã này ở quầy lễ tân, bàn hoặc tờ rơi để khách quét xem "Đà Lạt có gì vui?". Mỗi chương trình Festival cũng có mã QR riêng: mở chương trình rồi bấm "Mã QR".</p>
        {qr && (
          <div className="ps-qr">
            <img src={qr} alt="Mã QR mở dalatevent.com" width={220} height={220} />
            <a className="btn btn-line" href={qr} download="dalatevent-qr.png">Tải ảnh QR</a>
          </div>
        )}
      </section>
    </div>
  );
};

export default EmbedInfoPage;
