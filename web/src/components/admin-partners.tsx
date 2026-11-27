import React, { FC, useEffect, useState } from "react";
import { useSnackbar } from "../ui";
import { adminDealRequests, adminDecideDeal, adminDecidePartner, adminPartnerRequests, DealRequest, PartnerRequest } from "../platform/partners";

const dmy = (t: number) => (t ? new Date(t + 7 * 3600000).toISOString().slice(0, 10).split("-").reverse().join(".") : "");
const KIND: Record<string, string> = { cafe: "Quán cafe, nhà hàng", venue: "Điểm diễn, khu du lịch", organizer: "Nhà tổ chức", other: "Khác" };

/** Thẻ "Đối tác": duyệt đăng ký đối tác và ưu đãi đối tác đề xuất */
export const PartnersEditor: FC = () => {
  const { openSnackbar } = useSnackbar();
  const [reqs, setReqs] = useState<PartnerRequest[] | null>(null);
  const [deals, setDeals] = useState<DealRequest[] | null>(null);
  const [all, setAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = () => {
    adminPartnerRequests().then(setReqs).catch(() => setReqs([]));
    adminDealRequests().then(setDeals).catch(() => setDeals([]));
  };
  useEffect(load, []);
  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      openSnackbar({ text: ok, type: "success", duration: 2400 });
      load();
    } catch (e) {
      openSnackbar({ text: "Chưa làm được. Kiểm tra mạng hoặc quyền quản trị", duration: 3200 });
    }
    setBusy(false);
  };
  if (!reqs || !deals) return <p className="muted">Đang tải…</p>;
  const R = reqs.filter((r) => all || r.status === "new");
  const D = deals.filter((d) => all || d.status === "new");
  return (
    <div className={"adm-list" + (busy ? " is-busy" : "")}>
      <p className="muted small">Đối tác đăng ký ở dalatevent.com/#/doi-tac. Gọi số điện thoại để xác nhận trước khi duyệt. Ưu đãi duyệt xong sẽ hiện ngay trong Dalat Deals (đang công bố).</p>
      <h3>Đăng ký đối tác</h3>
      {R.length === 0 && <p className="muted">Không có đăng ký nào đang chờ.</p>}
      {R.map((r) => (
        <div className="adm-card" key={r.uid}>
          <div className="adm-body">
            <b>{r.name}</b>
            <span>{KIND[r.kind]} · {r.phone} · gửi {dmy(r.at)}{r.by ? " · tài khoản " + r.by : ""}</span>
            {r.note && <span className="muted small">{r.note}</span>}
            {r.status !== "new" && <span className="muted small">{r.status === "approved" ? "Đã duyệt" : "Đã từ chối"}</span>}
          </div>
          {r.status === "new" && (
            <div className="adm-acts">
              <button type="button" className="btn btn-ink btn-sm" onClick={() => run(() => adminDecidePartner(r, true), "Đã duyệt đối tác " + r.name)}>Duyệt</button>
              <button type="button" className="btn btn-line btn-sm" onClick={() => window.confirm("Từ chối " + r.name + "?") && run(() => adminDecidePartner(r, false), "Đã từ chối")}>Từ chối</button>
            </div>
          )}
        </div>
      ))}
      <h3>Ưu đãi đối tác đề xuất</h3>
      {D.length === 0 && <p className="muted">Không có ưu đãi nào đang chờ.</p>}
      {D.map((d) => (
        <div className="adm-card" key={d.id}>
          <div className="adm-body">
            <b>{d.title}</b>
            <span>{d.partner} · {dmy(d.startAt)} – {dmy(d.endAt)} · {d.limit} lượt{d.code ? " · mã " + d.code : " · app tự tạo mã"}</span>
            <span className="muted small">{d.summary}</span>
            <span className="muted small">Điều kiện: {d.terms}{d.place ? " · Nơi dùng: " + d.place : ""}{d.url ? " · " + d.url : ""}</span>
            {d.status !== "new" && <span className="muted small">{d.status === "approved" ? "Đã duyệt → " + d.dealId : "Đã từ chối"}</span>}
          </div>
          {d.status === "new" && (
            <div className="adm-acts">
              <button type="button" className="btn btn-ink btn-sm" onClick={() => window.confirm("Đăng ưu đãi này lên Dalat Deals?") && run(() => adminDecideDeal(d, true), "Đã đăng ưu đãi")}>Duyệt & đăng</button>
              <button type="button" className="btn btn-line btn-sm" onClick={() => window.confirm("Từ chối ưu đãi này?") && run(() => adminDecideDeal(d, false), "Đã từ chối")}>Từ chối</button>
            </div>
          )}
        </div>
      ))}
      <button type="button" className="link-inline" onClick={() => setAll(!all)}>{all ? "Chỉ hiện mục đang chờ" : "Hiện cả mục đã xử lý"}</button>
    </div>
  );
};
