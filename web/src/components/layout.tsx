import React, { FC, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router";
import { Navigation } from "./navigation";
import HomePage from "../pages/home";
import ProgramPage from "../pages/program";
import MapPage from "../pages/map";
import SavedPage from "../pages/saved";
import ShowsPage from "../pages/shows";

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
        <Route path="/show" element={<ShowsPage />} />
        <Route path="/ban-do" element={<MapPage />} />
        <Route path="/da-luu" element={<SavedPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </div>
    <Navigation />
  </div>
);
