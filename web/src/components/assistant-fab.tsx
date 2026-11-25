import React, { FC, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { storage } from "../utils/device";
import { tr } from "../i18n";

const HIDE_ON = ["/tro-ly", "/quan-tri", "/nhung-lich", "/quyen-rieng-tu"];
const TIP_KEY = "dlev.fabTip";

/**
 * Nút Trợ lý nổi ở góc dưới bên phải, đi theo mọi trang.
 * Lần đầu (tối đa 3 lần mở app) kèm bong bóng giới thiệu; bấm × thì không hiện lại.
 */
export const AssistantFab: FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [tip, setTip] = useState(false);

  useEffect(() => {
    const n = Number(storage.get(TIP_KEY) || "0");
    if (n >= 0 && n < 3) {
      storage.set(TIP_KEY, String(n + 1));
      const t = window.setTimeout(() => setTip(true), 1200);
      const h = window.setTimeout(() => setTip(false), 9000);
      return () => {
        window.clearTimeout(t);
        window.clearTimeout(h);
      };
    }
    return undefined;
  }, []);

  if (HIDE_ON.includes(pathname)) return null;
  const go = () => {
    setTip(false);
    navigate("/tro-ly");
  };
  return (
    <div className="fab-wrap">
      {tip && (
        <div className="fab-tip" role="status">
          <button type="button" className="fab-tip-body" onClick={go}>
            <b>{tr("Hôm nay đi đâu?", "Where to go today?")}</b>
            <span>{tr("Nhắn trợ lý một câu, có ngay lịch trình", "Ask the assistant and get a plan instantly")}</span>
          </button>
          <button type="button" className="fab-tip-x" aria-label={tr("Ẩn gợi ý", "Hide tip")} onClick={() => { setTip(false); storage.set(TIP_KEY, "-1"); }}>×</button>
        </div>
      )}
      <button type="button" className="fab" onClick={go} aria-label={tr("Mở Trợ lý: hôm nay đi đâu?", "Open the assistant: where to go today?")}>
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
          <path d="M12 8.2l.9 1.9 1.9.9-1.9.9-.9 1.9-.9-1.9-1.9-.9 1.9-.9z" fill="currentColor" stroke="none" />
        </svg>
        <span className="fab-label">{tr("Trợ lý", "Assistant")}</span>
      </button>
    </div>
  );
};
