import React, { FC, useEffect, useState } from "react";
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

// Trang quản trị chỉ vài người dùng: tách thành tệp riêng, khách thường không phải tải
const AdminPage = React.lazy(() => import("../pages/admin"));
import { getData } from "../data/store";
import { AccountButton, AccountSheet } from "./account-panel";

const ScrollTop: FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    document.querySelectorAll(".scroll").forEach((el) => (el.scrollTop = 0));
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
  return <div className="offline" role="status">Đang xem ngoại tuyến{d ? " · dữ liệu cập nhật đến " + d : ""}</div>;
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
        <Route path="/quan-tri" element={<React.Suspense fallback={<p className="muted pad">Đang tải…</p>}><AdminPage /></React.Suspense>} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </div>
    <Navigation />
    <AccountButton />
    <AccountSheet />
  </div>
  );
};
