import React, { FC, useEffect, useState } from "react";
import { DATA_URL } from "../data/store";
import { IS_ANDROID, IS_IOS, IS_NATIVE, openUrl } from "../utils/device";
import { tr } from "../i18n";
import { newer } from "../utils/version";

/** Số phiên bản của chính bản app này (đặt lúc đóng gói), trống khi chạy trên web */
const MINE = (import.meta.env.VITE_APP_VERSION as string | undefined) || "";

const KEY = "de-update-dismissed";

/** Lời mời cập nhật khi store đã có bản mới hơn bản app đang dùng. Đọc data/app-version.json nên không cần làm bản mới để bật. */
export const UpdateBanner: FC = () => {
  const [info, setInfo] = useState<{ latest: string; url: string } | null>(null);
  useEffect(() => {
    if (!IS_NATIVE || !MINE) return;
    let live = true;
    fetch(DATA_URL + "app-version.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const p = d && (IS_IOS ? d.ios : IS_ANDROID ? d.android : null);
        if (!live || !p || typeof p.latest !== "string" || typeof p.url !== "string" || !/^https:\/\//.test(p.url)) return;
        if (!newer(p.latest, MINE)) return;
        let dismissed = "";
        try {
          dismissed = localStorage.getItem(KEY) || "";
        } catch (e) {
          /* không có bộ nhớ thì vẫn hiện */
        }
        if (dismissed !== p.latest) setInfo({ latest: p.latest, url: p.url });
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);
  if (!info) return null;
  const close = () => {
    try {
      localStorage.setItem(KEY, info.latest);
    } catch (e) {
      /* bỏ qua */
    }
    setInfo(null);
  };
  return (
    <div className="upd" role="status">
      <span className="upd-text">
        <b>{tr("Đã có bản mới " + info.latest, "Version " + info.latest + " is out")}</b>
        <i>{tr("Cập nhật để dùng tính năng và giao diện mới nhất.", "Update for the latest features and look.")}</i>
      </span>
      <button type="button" className="upd-go" onClick={() => openUrl(info.url)}>{tr("Cập nhật", "Update")}</button>
      <button type="button" className="upd-x" aria-label={tr("Để sau", "Later")} onClick={close}>×</button>
    </div>
  );
};
