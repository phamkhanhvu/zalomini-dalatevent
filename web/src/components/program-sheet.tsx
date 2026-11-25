import React, { FC, useEffect, useState } from "react";
import QRCode from "qrcode";
import { useNavigate } from "react-router";
import { getData } from "../data/store";
import { CONTACT_EMAIL, mailto } from "../utils/contact";
import { Sheet } from "../ui";
import { FESTIVAL, Program } from "../data/festival";
import { openDirections, shareText } from "../utils/device";
import { statusOf } from "../utils/time";
import { catOf } from "./program-card";
import { IconBookmark, IconPin, IconRoute, IconShare } from "./icons";
import { tr } from "../i18n";

/** Link mở thẳng một chương trình */
export const programLink = (id: string) => FESTIVAL.website + "#/chuong-trinh?xem=" + encodeURIComponent(id);

interface Props {
  program: Program | null;
  saved: boolean;
  onClose: () => void;
  onToggleSave: (p: Program) => void;
  onShared?: (ok: boolean) => void;
}

export const ProgramSheet: FC<Props> = ({ program, saved, onClose, onToggleSave, onShared }) => {
  const p = program;
  const cat = p ? catOf(p.cat) : null;
  const status = p ? statusOf(p) : "upcoming";
  const navigate = useNavigate();
  const venueId = p ? getData().events.events.find((e) => e.id === p.id)?.venue_id : null;
  const [qr, setQr] = useState("");
  const [showQr, setShowQr] = useState(false);
  useEffect(() => {
    setShowQr(false);
    setQr("");
  }, [p?.id]);
  const toggleQr = async () => {
    if (!p) return;
    if (!qr) {
      try {
        setQr(await QRCode.toDataURL(programLink(p.id), { width: 480, margin: 2, errorCorrectionLevel: "M", color: { dark: "#1b1440", light: "#ffffff" } }));
      } catch (e) {
        return;
      }
    }
    setShowQr((v) => !v);
  };
  return (
    <Sheet visible={!!p} onClose={onClose} autoHeight mask handler swipeToClose>
      {p && cat && (
        <div className="ps">
          <div className="ps-head" style={{ background: cat.tint }}>
            <span className="ps-day" style={{ color: cat.color }}>{p.day}</span>
            <span className="ps-sub">{p.sub}{p.tentative ? tr(" · dự kiến", " · tentative") : ""}</span>
          </div>
          <div className="pc-tags">
            <span className="chip" style={{ color: cat.color }}>{cat.label}</span>
            {status === "live" && <span className="chip chip-live">{tr("Đang diễn ra", "Live now")}</span>}
            {status === "ended" && <span className="chip chip-muted">{tr("Đã kết thúc", "Ended")}</span>}
          </div>
          <h2 className="ps-title">{p.title}</h2>
          <p className="ps-desc">{p.desc}</p>
          {venueId ? (
            <button type="button" className="ps-venue ps-venue-link" onClick={() => { onClose(); navigate("/dia-diem/f-" + venueId); }}><IconPin size={18} />{p.venue}</button>
          ) : (
            <p className="ps-venue"><IconPin size={18} />{p.venue}</p>
          )}
          {p.note && <p className="ps-note">{p.note}</p>}
          {p.tentative && !p.note && (
            <p className="ps-note">{tr("Lịch dự kiến, có thể thay đổi. Vui lòng kiểm tra lại trước khi đến.", "Tentative schedule, subject to change. Please check before you go.")}</p>
          )}
          <div className="ps-actions">
            <button type="button" className={"btn " + (saved ? "btn-soft" : "btn-ink")} onClick={() => onToggleSave(p)}>
              <IconBookmark size={20} filled={saved} />
              {saved ? tr("Đã lưu", "Saved") : tr("Lưu chương trình", "Save")}
            </button>
            {p.mapQuery && (
              <button type="button" className="btn btn-line" onClick={() => openDirections(p.mapQuery!)}>
                <IconRoute size={20} />{tr("Chỉ đường", "Directions")}
              </button>
            )}
            <button
              type="button"
              className="btn btn-line"
              onClick={async () => {
                const ok = await shareText(
                  tr(`${p.title} — ${p.day}${p.sub ? ", " + p.sub : ""} tại ${p.venue}. Xem chi tiết: ${programLink(p.id)}`, `${p.title} — ${p.day}${p.sub ? ", " + p.sub : ""} at ${p.venue}. Details: ${programLink(p.id)}`),
                  FESTIVAL.name + " " + FESTIVAL.edition
                );
                onShared?.(ok);
              }}
            >
              <IconShare size={20} />{tr("Chia sẻ", "Share")}
            </button>
            <button type="button" className="btn btn-line" aria-expanded={showQr} onClick={toggleQr}>
              {showQr ? tr("Ẩn mã QR", "Hide QR") : tr("Mã QR", "QR code")}
            </button>
          </div>
          {CONTACT_EMAIL && (
            <a className="ps-report" href={mailto("Báo sai thông tin: " + p.title, "Chương trình: " + p.title + "\nLink: " + programLink(p.id) + "\n\nThông tin sai hoặc thiếu:\n\nNguồn đúng (nếu có):\n")}>{tr("Thông tin chưa đúng? Báo cho DalatEvent", "Something wrong? Tell DalatEvent")}</a>
          )}
          {showQr && qr && (
            <div className="ps-qr">
              <img src={qr} alt={tr("Mã QR mở chương trình ", "QR code for ") + p.title} width={200} height={200} />
              <p>{tr("Quét để mở chương trình này trên DalatEvent.", "Scan to open this programme on DalatEvent.")}</p>
              <a className="btn btn-line" href={qr} download={"dalatevent-" + p.id + "-qr.png"}>{tr("Tải ảnh QR", "Download QR")}</a>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
};
