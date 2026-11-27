import React, { FC, useEffect, useState } from "react";
import { track } from "../platform/stats";
import { Route, Routes, useLocation } from "react-router";
import { Navigation } from "./navigation";
import HomePage from "../pages/home";
import ProgramPage from "../pages/program";
import MapPage from "../pages/map";
import SavedPage from "../pages/saved";
import ShowsPage from "../pages/shows";
import EmbedPage from "../pages/embed";
import EmbedInfoPage from "../pages/embed-info";
import PrivacyPage from "../pages/privacy";
import PlacePage from "../pages/place";
import PassportPage from "../pages/passport";
import AssistantPage from "../pages/assistant";
import DealsPage from "../pages/deals";
import WeatherPage from "../pages/weather";
import { ToplistPage, ToplistDetailPage } from "../pages/toplist";
import SubmitEventPage from "../pages/submit-event";
import PartnerPage from "../pages/partner";
import TermsPage from "../pages/terms";

// Trang quản trị chỉ vài người dùng: tách thành tệp riêng, khách thường không phải tải
const AdminPage = React.lazy(() => import("../pages/admin"));
import { getData } from "../data/store";
import { AccountButton, AccountSheet } from "./account-panel";
import { AssistantFab } from "./assistant-fab";
import { isEn, setLang, tr } from "../i18n";

/** Nút đổi ngôn ngữ cạnh nút tài khoản: đang tiếng Việt thì ghi EN, đang tiếng Anh thì ghi VI */
const LangButton: FC = () => (
  <button type="button" className="lang-top" onClick={() => setLang(isEn() ? "vi" : "en")} aria-label={tr("Switch to English", "Chuyển sang tiếng Việt")} lang={isEn() ? "vi" : "en"}>
    {isEn() ? "VI" : "EN"}
  </button>
);

const ScrollTop: FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    document.querySelectorAll(".scroll").forEach((el) => (el.scrollTop = 0));
    // Đếm lượt xem theo trang (chỉ tên trang, không kèm gì khác)
    const parts = pathname.split("/").filter(Boolean);
    track("view", parts[0] || "home");
    if (parts[0] === "top-list" && parts[1]) track("toplist", parts[1]);
  }, [pathname]);
  return null;
};

/** Dải báo đang xem ngoại tuyến, kèm ngày dữ liệu được cập nhật gần nhất */
const OfflineBar: FC = () => {
  const [off, setOff] = useState(() => typeof navigator !== "undefined" && navigator.onLine === false);
  useEffect(() => {
    const on = () => setOff(false);
    const no = () => setOff(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", no);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", no);
    };
  }, []);
  if (!off) return null;
  const d = getData().happening.updated_label;
  return <div className="offline" role="status">{tr("Đang xem ngoại tuyến", "Offline")}{d ? tr(" · dữ liệu cập nhật đến ", " · data as of ") + d : ""}</div>;
};

export const Layout: FC = () => {
  const { pathname } = useLocation();
  // Khung nhúng trên website của đối tác: chỉ có danh sách, không có thanh điều hướng
  if (pathname === "/nhung") return <EmbedPage />;
  return (
  <div className="shell">
    <OfflineBar />
    <ScrollTop />
    <div className="shell-main">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chuong-trinh" element={<ProgramPage />} />
        <Route path="/show" element={<ShowsPage />} />
        <Route path="/ban-do" element={<MapPage />} />
        <Route path="/da-luu" element={<SavedPage />} />
        <Route path="/lich-trinh" element={<SavedPage />} />
        <Route path="/nhung-lich" element={<EmbedInfoPage />} />
        <Route path="/quyen-rieng-tu" element={<PrivacyPage />} />
        <Route path="/dia-diem/:id" element={<PlacePage />} />
        <Route path="/ho-chieu" element={<PassportPage />} />
        <Route path="/tro-ly" element={<AssistantPage />} />
        <Route path="/uu-dai" element={<DealsPage />} />
        <Route path="/thoi-tiet" element={<WeatherPage />} />
        <Route path="/top-list" element={<ToplistPage />} />
        <Route path="/top-list/:id" element={<ToplistDetailPage />} />
        <Route path="/gui-su-kien" element={<SubmitEventPage />} />
        <Route path="/doi-tac" element={<PartnerPage />} />
        <Route path="/dieu-khoan" element={<TermsPage />} />
        <Route path="/quan-tri" element={<React.Suspense fallback={<p className="muted pad">{tr("Đang tải…", "Loading…")}</p>}><AdminPage /></React.Suspense>} />
        <Route path="*" element={<HomePage />} />
      </Routes>
      <AssistantFab />
    </div>
    <Navigation />
    {/* Trang chủ: logo ở giữa nên nút ngôn ngữ nằm góc trái; các trang khác nằm cạnh nút tài khoản */}
    {pathname === "/" && <div className="top-left"><LangButton /></div>}
    <div className="top-actions">
      {pathname !== "/" && <LangButton />}
      <AccountButton />
    </div>
    <AccountSheet />
  </div>
  );
};
