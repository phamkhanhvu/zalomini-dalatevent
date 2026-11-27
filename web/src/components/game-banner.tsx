import React, { FC } from "react";
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
export const GameBanner: FC = () => (
  <button type="button" className="gmb" onClick={openGame} aria-label={tr("Chơi game Khám phá sự kiện Đà Lạt", "Play the Explore Da Lat events game")}>
    <span className="gmb-icon" aria-hidden="true">🎮</span>
    <span className="gmb-text">
      <span className="gmb-kicker">{tr("Game 3D · Thử nghiệm", "3D game · Beta")}</span>
      <b>{tr("Khám phá sự kiện Đà Lạt", "Explore Da Lat events")}</b>
      <i>{tr("Dạo Quảng trường Lâm Viên và Chợ Đà Lạt, tìm thẻ câu hỏi, gặp người chơi khác", "Roam Lam Vien Square and Da Lat Market, find quiz cards, meet other players")}</i>
    </span>
    <span className="gmb-go">{tr("Chơi", "Play")}</span>
  </button>
);
