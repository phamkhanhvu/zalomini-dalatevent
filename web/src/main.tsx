import React from "react";
import { startStats } from "./platform/stats";
import { markGoodMoment } from "./platform/review";
import { createRoot } from "react-dom/client";

import "@fontsource/be-vietnam-pro/vietnamese-400.css";
import "@fontsource/be-vietnam-pro/vietnamese-500.css";
import "@fontsource/be-vietnam-pro/vietnamese-600.css";
import "@fontsource/be-vietnam-pro/vietnamese-700.css";
import "@fontsource/be-vietnam-pro/latin-400.css";
import "@fontsource/be-vietnam-pro/latin-500.css";
import "@fontsource/be-vietnam-pro/latin-600.css";
import "@fontsource/be-vietnam-pro/latin-700.css";
import "./css/base.css";
import "./css/app.css";
import "./css/site.css";

import App from "./components/app";
import { initData } from "./data/store";
import { IS_NATIVE } from "./utils/device";
import { SAVED_EVENT, SAVED_KEY } from "./utils/saved";
import { syncReminders } from "./platform/reminders";
import { readPlan } from "./utils/plan";

function savedIds(): string[] {
  try {
    const arr = JSON.parse(window.localStorage.getItem(SAVED_KEY) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

async function start() {
  if (IS_NATIVE) document.documentElement.classList.add("is-native");
  await initData();
  // Nhắc lịch chỉ có trong app cài trên máy. Mở app: hẹn lại (không hỏi quyền). Lưu chương trình: hỏi quyền nếu cần.
  if (IS_NATIVE) {
    syncReminders(savedIds(), false, readPlan());
    window.addEventListener(SAVED_EVENT, () => {
      syncReminders(savedIds(), true, readPlan());
      markGoodMoment();
    });
  }
  startStats();
  createRoot(document.getElementById("app")!).render(<App />);
  // Giữ khung trang để mở được khi mất mạng. Không dùng trong app cài trên máy (app đã có sẵn tệp).
  if (!IS_NATIVE && "serviceWorker" in navigator && (window.location.protocol === "https:" || window.location.hostname === "localhost")) {
    const reg = () => navigator.serviceWorker.register("./sw.js").catch(() => undefined);
    // Sự kiện "load" có thể đã xảy ra trước khi dữ liệu nạp xong
    if (document.readyState === "complete") reg();
    else window.addEventListener("load", reg);
  }
}
start();
