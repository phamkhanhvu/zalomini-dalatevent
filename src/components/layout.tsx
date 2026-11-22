import React, { FC, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router";
import { getSystemInfo } from "zmp-sdk";
import { Navigation } from "./navigation";
import HomePage from "../pages/home";
import ProgramPage from "../pages/program";
import MapPage from "../pages/map";
import SavedPage from "../pages/saved";

// Chừa chỗ cho thanh trạng thái của máy (vì app tự vẽ phần đầu trang)
try {
  if (import.meta.env.DEV) {
    document.body.style.setProperty("--zaui-safe-area-inset-top", "24px");
  } else if (getSystemInfo().platform === "android") {
    const h = window.ZaloJavaScriptInterface?.getStatusBarHeight() ?? 0;
    document.body.style.setProperty(
      "--zaui-safe-area-inset-top",
      `${Math.round(h / window.devicePixelRatio)}px`
    );
  }
} catch (e) {
  /* chạy ngoài Zalo: bỏ qua */
}

const ScrollTop: FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    document.querySelectorAll(".scroll").forEach((el) => (el.scrollTop = 0));
  }, [pathname]);
  return null;
};

export const Layout: FC = () => (
  <div className="shell">
    <ScrollTop />
    <div className="shell-main">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chuong-trinh" element={<ProgramPage />} />
        <Route path="/ban-do" element={<MapPage />} />
        <Route path="/da-luu" element={<SavedPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </div>
    <Navigation />
  </div>
);
