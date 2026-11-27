import React, { FC } from "react";
import m_explore from "../static/img/mascots/explore.webp";
import m_concert from "../static/img/mascots/concert.webp";
import { Browser } from "@capacitor/browser";
import { IS_NATIVE } from "../utils/device";
import { tr } from "../i18n";

/** Game 3D chạy ở dalatevent.com/game (repo riêng), sửa game không cần làm bản app mới */
export const GAME_URL = "https://dalatevent.com/game/";

async function openGame() {
  if (IS_NATIVE) {
    try {
      // Mở toàn màn hình ngay trong app, có nút Xong để quay lại
      await Browser.open({ url: GAME_URL, presentationStyle: "fullscreen" });
      return;
    } catch (e) {
      /* rơi xuống cách mở thường */
    }
  }
  window.location.href = GAME_URL;
}

/** Thẻ trang chủ dẫn vào game "Khám phá sự kiện Đà Lạt" */
export const GameBanner: FC = () =>
  // Trong app chưa hiện: game có người chơi gặp nhau, Apple yêu cầu nút báo cáo/chặn trước khi đưa vào
  IS_NATIVE ? null : (
  <button type="button" className="gmb has-mascot" onClick={openGame} aria-label={tr("Chơi game Khám phá sự kiện Đà Lạt", "Play the Explore Da Lat events game")}>
    <span className="gmb-icon" aria-hidden="true">🎮</span>
    <img className="mascot" src={m_explore} alt="" aria-hidden="true" />
    <span className="gmb-text">
      <span className="gmb-kicker">{tr("Game 3D · Thử nghiệm", "3D game · Beta")}</span>
      <b>{tr("Khám phá sự kiện Đà Lạt", "Explore Da Lat events")}</b>
      <i>{tr("Dạo Quảng trường Lâm Viên và Chợ Đà Lạt, tìm thẻ câu hỏi, gặp người chơi khác", "Roam Lam Vien Square and Da Lat Market, find quiz cards, meet other players")}</i>
    </span>
    <span className="gmb-go">{tr("Chơi", "Play")}</span>
  </button>
);

/** Lời mời gửi sự kiện cho ban tổ chức, quán, điểm diễn */
export const SubmitEventCard: FC<{ onOpen: () => void }> = ({ onOpen }) => (
  <button type="button" className="sbe has-mascot" onClick={onOpen}>
    <img className="mascot" src={m_concert} alt="" aria-hidden="true" />
    <span aria-hidden="true">📣</span>
    <span className="sbe-text">
      <b>{tr("Bạn tổ chức sự kiện ở Đà Lạt?", "Hosting an event in Da Lat?")}</b>
      <i>{tr("Gửi cho DalatEvent, duyệt miễn phí", "Send it to DalatEvent, free review")}</i>
    </span>
    <span className="sbe-go" aria-hidden="true">→</span>
  </button>
);
