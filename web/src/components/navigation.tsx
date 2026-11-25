import React, { FC } from "react";
import { useLocation, useNavigate } from "react-router";
import { BottomNavigation } from "../ui";
import { tr } from "../i18n";
import { IconBookmark, IconCalendar, IconHome, IconMusic, IconPin } from "./icons";

const tabs = () => [
  { path: "/", label: tr("Trang chủ", "Home"), icon: <IconHome /> },
  { path: "/chuong-trinh", label: "Festival", icon: <IconCalendar /> },
  { path: "/show", label: tr("Show diễn", "Shows"), icon: <IconMusic /> },
  { path: "/ban-do", label: tr("Bản đồ", "Map"), icon: <IconPin /> },
  { path: "/da-luu", label: tr("Lịch trình", "My plan"), icon: <IconBookmark />, activeIcon: <IconBookmark filled /> },
];

export const Navigation: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <BottomNavigation id="footer" activeKey={location.pathname} onChange={(key) => navigate(key)}>
      {tabs().map((t) => (
        <BottomNavigation.Item key={t.path} label={t.label} icon={t.icon} activeIcon={t.activeIcon} />
      ))}
    </BottomNavigation>
  );
};
