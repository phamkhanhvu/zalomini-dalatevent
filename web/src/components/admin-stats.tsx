import React, { FC, useEffect, useMemo, useState } from "react";
import { idToken } from "../platform/account";
import { readStats } from "../platform/stats";

type Raw = Record<string, Record<string, Record<string, Record<string, number>>>>;
const day = (offset: number) => new Date(Date.now() + 7 * 3600000 - offset * 86400000).toISOString().slice(0, 10);
const PLAT: Record<string, string> = { web: "Web", ios: "iPhone", android: "Android" };
const VIEW: Record<string, string> = { home: "Trang chủ", "chuong-trinh": "Festival", show: "Show diễn", "ban-do": "Bản đồ", "lich-trinh": "Lịch trình", "da-luu": "Lịch trình", "top-list": "Top list", "uu-dai": "Ưu đãi", "tro-ly": "Trợ lý", "thoi-tiet": "Thời tiết", "ho-chieu": "Hộ chiếu", "gui-su-kien": "Gửi sự kiện", "dia-diem": "Trang địa điểm", "quan-tri": "Quản trị" };
const nice = (k: string) => k.split("--").pop()!.replace(/-/g, " ");

/** Thẻ "Thống kê" trong trang quản trị: số liệu ẩn danh theo ngày */
export const StatsPanel: FC = () => {
  const [range, setRange] = useState(7);
  const [raw, setRaw] = useState<Raw | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    setRaw(null);
    setErr("");
    idToken()
      .then((t) => readStats(t, day(range - 1), day(0)))
      .then(setRaw)
      .catch(() => setErr("Chưa đọc được thống kê. Tài khoản cần được cấp quyền xem thống kê, hoặc kiểm tra mạng."));
  }, [range]);

  const s = useMemo(() => {
    const sum = (ev: string, item?: string) => {
      let n = 0;
      for (const d of Object.values(raw || {})) for (const p of Object.values(d)) for (const [k, v] of Object.entries(p[ev] || {})) if (!item || k === item) n += v;
      return n;
    };
    const top = (ev: string, n = 8) => {
      const m = new Map<string, number>();
      for (const d of Object.values(raw || {})) for (const p of Object.values(d)) for (const [k, v] of Object.entries(p[ev] || {})) m.set(k, (m.get(k) || 0) + v);
      return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
    };
    const byPlat = (ev: string) => {
      const m: Record<string, number> = {};
      for (const d of Object.values(raw || {})) for (const [pl, p] of Object.entries(d)) m[pl] = (m[pl] || 0) + Object.values(p[ev] || {}).reduce((a, b) => a + b, 0);
      return m;
    };
    const days = Array.from({ length: range }, (_, i) => day(range - 1 - i)).map((d) => {
      let users = 0;
      for (const p of Object.values((raw || {})[d] || {})) users += (p.users && p.users.all) || 0;
      return { d, users };
    });
    return { sum, top, byPlat, days };
  }, [raw, range]);

  const max = Math.max(1, ...s.days.map((x) => x.users));
  const Top: FC<{ title: string; ev: string; label?: (k: string) => string }> = ({ title, ev, label = nice }) => {
    const rows = s.top(ev);
    return (
      <div className="st-box">
        <b>{title}</b>
        {rows.length === 0 ? <p className="muted small">Chưa có số liệu.</p> : (
          <ol>{rows.map(([k, v]) => <li key={k}><span>{label(k)}</span><i>{v.toLocaleString("vi-VN")}</i></li>)}</ol>
        )}
      </div>
    );
  };

  return (
    <div className="adm-list st">
      <p className="muted small">Số liệu ẩn danh: chỉ đếm số lần, không lưu ai làm gì. "Người dùng" là số thiết bị mở web/app trong ngày, cộng dồn qua các ngày.</p>
      <div className="filters">
        {[7, 30, 90].map((r) => <button key={r} type="button" className={"fb" + (range === r ? " on" : "")} onClick={() => setRange(r)}>{r} ngày</button>)}
      </div>
      {err ? <p className="adm-status is-bad">{err}</p> : !raw ? <p className="muted">Đang tải…</p> : (
        <>
          <div className="st-kpis">
            <div><i>Người dùng</i><b>{s.sum("users").toLocaleString("vi-VN")}</b></div>
            <div><i>Người mới</i><b>{s.sum("new_users").toLocaleString("vi-VN")}</b></div>
            <div><i>Lượt mở</i><b>{s.sum("opens").toLocaleString("vi-VN")}</b></div>
            <div><i>Lượt xem trang</i><b>{s.sum("view").toLocaleString("vi-VN")}</b></div>
            <div><i>Bấm chỉ đường</i><b>{(s.sum("place_dir") + s.sum("venue_dir")).toLocaleString("vi-VN")}</b></div>
            <div><i>Mã ưu đãi đã lấy</i><b>{s.sum("deal_use").toLocaleString("vi-VN")}</b></div>
          </div>
          <div className="st-box">
            <b>Người dùng mỗi ngày</b>
            <div className="st-bars">
              {s.days.map((x) => (
                <span key={x.d} title={x.d + ": " + x.users}>
                  <em style={{ height: (x.users / max) * 100 + "%" }} />
                  {range <= 30 && <small>{x.d.slice(8)}</small>}
                </span>
              ))}
            </div>
          </div>
          <div className="st-box">
            <b>Theo nền tảng (người dùng)</b>
            <ol>{Object.entries(s.byPlat("users")).sort((a, b) => b[1] - a[1]).map(([k, v]) => <li key={k}><span>{PLAT[k] || k}</span><i>{v.toLocaleString("vi-VN")}</i></li>)}</ol>
          </div>
          <Top title="Trang được xem nhiều" ev="view" label={(k) => VIEW[k] || k} />
          <Top title="Chủ đề Top list được mở nhiều" ev="toplist" label={(k) => k.replace(/-/g, " ")} />
          <Top title="Địa điểm được bấm chỉ đường nhiều" ev="place_dir" />
          <Top title="Ưu đãi được xem" ev="deal_view" label={(k) => k.replace(/-/g, " ")} />
          <Top title="Ưu đãi được lấy mã" ev="deal_use" label={(k) => k.replace(/-/g, " ")} />
          <Top title="Banner quảng cáo được bấm" ev="ad_click" label={(k) => k} />
          <div className="st-box">
            <b>Khác</b>
            <ol>
              <li><span>Mở game</span><i>{s.sum("game_open")}</i></li>
              <li><span>Sự kiện được gửi</span><i>{s.sum("submit_event")}</i></li>
              <li><span>Lượt chấm sao</span><i>{s.sum("rate")}</i></li>
              <li><span>Xem clip địa điểm</span><i>{s.sum("place_clip")}</i></li>
            </ol>
          </div>
        </>
      )}
    </div>
  );
};
