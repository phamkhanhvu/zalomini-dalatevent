import React, { FC, useEffect, useState } from "react";
import { track } from "../platform/stats";
import { DATA_URL } from "../data/store";
import { openUrl } from "../utils/device";
import { isEn, tr } from "../i18n";

interface Ad { img: string; url: string; alt: string; alt_en?: string }

/** Quảng cáo của Sense Group ở cuối trang: đọc data/ads.json, mỗi lần mở trang hiện ngẫu nhiên một ảnh. Đổi ảnh không cần làm bản app mới. */
export const AdBanner: FC = () => {
  const [ad, setAd] = useState<Ad | null>(null);
  useEffect(() => {
    let live = true;
    fetch(DATA_URL + "ads.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { items?: Ad[] } | null) => {
        const list = (d?.items || []).filter((x) => x && typeof x.img === "string" && /^ads\/[\w.-]+\.(webp|jpg|png)$/.test(x.img) && /^https:\/\//.test(x.url || ""));
        if (live && list.length) setAd(list[Math.floor(Math.random() * list.length)]);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);
  if (!ad) return null;
  const alt = isEn() && ad.alt_en ? ad.alt_en : ad.alt;
  return (
    <section className="ad-slot" aria-label={tr("Quảng cáo", "Advertisement")}>
      <span className="ad-tag">{tr("Quảng cáo", "Ad")}</span>
      <button type="button" className="ad-banner" onClick={() => { track("ad_click", ad.img.replace(/^ads\//, "").replace(/\.\w+$/, "")); openUrl(ad.url); }}>
        <img src={DATA_URL + ad.img} alt={alt} loading="lazy" width={1400} height={467} />
      </button>
    </section>
  );
};
