import React, { FC } from "react";
import { useNavigate } from "react-router";
import { tr } from "../i18n";

/** Các chủ đề hay được tìm nhất, bấm vào mở thẳng danh sách */
const HOT: { id: string; vi: string; en: string; icon: string }[] = [
  { id: "san-may", vi: "Săn mây", en: "Cloud hunting", icon: "☁️" },
  { id: "cafe-view-dep", vi: "Cafe view đẹp", en: "Cafés with a view", icon: "☕" },
  { id: "lau-ga-la-e", vi: "Lẩu gà lá é", en: "Chicken hotpot", icon: "🍲" },
  { id: "banh-can", vi: "Bánh căn", en: "Banh can", icon: "🥘" },
  { id: "thac-nuoc", vi: "Thác nước", en: "Waterfalls", icon: "💧" },
  { id: "homestay-san-may", vi: "Homestay săn mây", en: "Cloud-view stays", icon: "🏡" },
  { id: "vuon-dau-tay", vi: "Vườn dâu tây", en: "Strawberry farms", icon: "🍓" },
  { id: "show-nhac", vi: "Show nhạc", en: "Live music", icon: "🎶" },
];

/** Khối nổi bật ở trang chủ dẫn vào Top list Đà Lạt */
export const ToplistBanner: FC = () => {
  const navigate = useNavigate();
  return (
    <section className="tlb" aria-label={tr("Top list Đà Lạt", "Da Lat top lists")}>
      <button type="button" className="tlb-main" onClick={() => navigate("/top-list")}>
        <span className="tlb-badge" aria-hidden="true">TOP</span>
        <span className="tlb-text">
          <span className="tlb-kicker">{tr("Top list Đà Lạt", "Da Lat top lists")}</span>
          <b>{tr("1.001 địa điểm, 127 chủ đề", "1,001 places, 127 topics")}</b>
          <i>{tr("Đi đâu, ăn gì, ở đâu — đội Sense Group đã chọn sẵn", "Where to go, eat and stay, picked by Sense Group")}</i>
        </span>
        <span className="tlb-go">{tr("Xem", "Open")}</span>
      </button>
      <div className="tlb-chips">
        {HOT.map((h) => (
          <button key={h.id} type="button" className="tlb-chip" onClick={() => navigate("/top-list/" + h.id)}>
            <span aria-hidden="true">{h.icon}</span>
            {tr(h.vi, h.en)}
          </button>
        ))}
      </div>
    </section>
  );
};
