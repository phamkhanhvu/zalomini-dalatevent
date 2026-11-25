import React, { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { fetchPublicDeals } from "../platform/deals";
import { Deal, dealState, visibleDeals } from "../utils/deals";
import { tr } from "../i18n";

/** Khung Dalat Deals nổi bật trên trang chủ: nói rõ đang có bao nhiêu ưu đãi mở và một ưu đãi tiêu biểu */
export const DealsBanner: FC = () => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[] | null>(null);
  useEffect(() => {
    let live = true;
    fetchPublicDeals()
      .then((l) => live && setDeals(visibleDeals(l, Date.now())))
      .catch(() => live && setDeals([]));
    return () => {
      live = false;
    };
  }, []);
  const now = Date.now();
  const active = (deals || []).filter((d) => dealState(d, now) === "active");
  const top = active[0] || (deals || [])[0];
  return (
    <button type="button" className="deals-banner" onClick={() => navigate("/uu-dai")}>
      <span className="deals-badge" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z" />
          <path d="M9.5 9.5l5 5M9.5 9.6h.01M14.5 14.4h.01" />
        </svg>
      </span>
      <span className="deals-text">
        <span className="deals-kicker">Dalat Deals{active.length ? " · " + active.length + tr(" ưu đãi đang mở", active.length === 1 ? " offer open" : " offers open") : ""}</span>
        <b>{top ? top.title : tr("Ưu đãi từ quán và điểm diễn đối tác", "Offers from partner cafés and venues")}</b>
        <i>{top ? top.partner + (top.place ? " · " + top.place : "") : tr("Đăng nhập, bấm dùng, đưa mã cho nhân viên. Mỗi tài khoản một lượt.", "Sign in, tap Use, show the code to staff. One use per account.")}</i>
      </span>
      <span className="deals-go">{tr("Xem ưu đãi", "See offers")}</span>
    </button>
  );
};
