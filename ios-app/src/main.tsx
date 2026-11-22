import React from "react";
import { createRoot } from "react-dom/client";

import "@fontsource/be-vietnam-pro/vietnamese-400.css";
import "@fontsource/be-vietnam-pro/vietnamese-500.css";
import "@fontsource/be-vietnam-pro/vietnamese-600.css";
import "@fontsource/be-vietnam-pro/vietnamese-700.css";
import "@fontsource/be-vietnam-pro/latin-400.css";
import "@fontsource/be-vietnam-pro/latin-500.css";
import "@fontsource/be-vietnam-pro/latin-600.css";
import "@fontsource/be-vietnam-pro/latin-700.css";
import "@fontsource/playfair-display/vietnamese-700.css";
import "@fontsource/playfair-display/vietnamese-700-italic.css";
import "@fontsource/playfair-display/latin-700.css";
import "@fontsource/playfair-display/latin-700-italic.css";
import "./native.css";
import "@shared/css/app.css";

import App from "@shared/components/app";
import { SAVED_EVENT, SAVED_KEY } from "@shared/utils/saved";
import { syncReminders } from "./reminders";

function savedIds(): string[] {
  try {
    const arr = JSON.parse(window.localStorage.getItem(SAVED_KEY) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

// Mở app: hẹn lại thông báo (không hỏi quyền). Khi người dùng lưu chương trình: hỏi quyền nếu cần.
syncReminders(savedIds(), false);
window.addEventListener(SAVED_EVENT, () => syncReminders(savedIds(), true));

createRoot(document.getElementById("app")!).render(<App />);
