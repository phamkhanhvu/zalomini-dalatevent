import React, { FC, useEffect, useMemo, useState } from "react";
import { Sheet, useSnackbar } from "../ui";
import { openAccount } from "../components/account-panel";
import { getAccount, onAccount } from "../platform/account";
import { fetchPublicDeals, myRedemption, redeem, Redemption } from "../platform/deals";
import { vnDayMonth, vnTime } from "../utils/agenda";
import { Deal, dealState, remaining, visibleDeals } from "../utils/deals";
import { openDirections } from "../utils/device";

const STATE_LABEL: Record<string, string> = { active: "Đang áp dụng", upcoming: "Sắp mở", soldout: "Đã hết lượt" };
const span = (d: Deal) => vnDayMonth(d.startAt) + " – " + vnDayMonth(d.endAt) + "." + new Date(d.endAt + 7 * 3600000).getUTCFullYear();

/** Màn hình đưa cho nhân viên xem: mã, giờ đổi và đồng hồ đang chạy (để phân biệt với ảnh chụp màn hình) */
const Voucher: FC<{ deal: Deal; r: Redemption }> = ({ deal, r }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const clock = new Date(now + 7 * 3600000).toISOString().slice(11, 19);
  return (
    <div className="voucher" role="status">
      <p className="eyebrow">Đưa màn hình này cho nhân viên {deal.partner}</p>
      <b className="voucher-code">{r.code}</b>
      <p>{deal.title}</p>
      <p className="muted small">Đã dùng lúc {vnTime(r.at)} ngày {vnDayMonth(r.at)} · Bây giờ là <span className="voucher-clock">{clock}</span></p>
    </div>
  );
};

/** Dalat Deals: ưu đãi từ đối tác, mỗi tài khoản dùng một lần */
const DealsPage: FC = () => {
  const { openSnackbar } = useSnackbar();
  const [, force] = useState(0);
  useEffect(() => onAccount(() => force((n) => n + 1)), []);
  const [deals, setDeals] = useState<Deal[] | null>(null);
  const [err, setErr] = useState(false);
  const [open, setOpen] = useState<Deal | null>(null);
  const [mine, setMine] = useState<Redemption | null>(null);
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = () => {
    setErr(false);
    fetchPublicDeals().then(setDeals).catch(() => setErr(true));
  };
  useEffect(load, []);
  const now = Date.now();
  const list = useMemo(() => (deals ? visibleDeals(deals, now) : []), [deals, Math.floor(now / 60000)]);
  const signedIn = getAccount().status === "in";

  const show = (d: Deal) => {
    setOpen(d);
    setMine(null);
    setAgree(false);
    if (getAccount().status === "in" || getAccount().status === "off") myRedemption(d.id).then(setMine).catch(() => undefined);
  };
  useEffect(() => {
    if (open && signedIn && !mine) myRedemption(open.id).then(setMine).catch(() => undefined);
  }, [signedIn]);
  const use = async () => {
    if (!open) return;
    setBusy(true);
    const r = await redeem(open.id);
    setBusy(false);
    if (r.ok) {
      setMine(r.redemption);
      load();
    } else if (r.reason === "signin") openAccount();
    else openSnackbar({ text: r.reason === "unavailable" ? "Ưu đãi này vừa hết lượt hoặc đã ngừng" : "Mất kết nối, hãy thử lại", duration: 3200 });
  };
  const st = open ? dealState(open, now) : "hidden";

  return (
    <div className="scroll page">
      <header className="top">
        <p className="eyebrow">Ưu đãi từ đối tác</p>
        <h1 className="h1">Dalat <em>Deals</em></h1>
        <p className="muted">Ưu đãi do các quán, điểm diễn và điểm tham quan tại Đà Lạt dành cho người dùng DalatEvent. Mỗi tài khoản dùng mỗi ưu đãi một lần.</p>
      </header>
      <section className="sec">
        {err ? (
          <div className="ag-empty"><b>Chưa tải được danh sách ưu đãi.</b><button type="button" className="btn btn-line" onClick={load}>Thử lại</button></div>
        ) : !deals ? (
          <p className="muted">Đang tải…</p>
        ) : list.length === 0 ? (
          <div className="ag-empty">
            <b>Hiện chưa có ưu đãi nào.</b>
            <span>Ưu đãi chỉ xuất hiện ở đây sau khi đối tác xác nhận. Bạn là quán, điểm diễn muốn tham gia? Liên hệ theo trang chính sách quyền riêng tư.</span>
          </div>
        ) : (
          <ul className="deal-list">
            {list.map((d) => {
              const s = dealState(d, now);
              return (
                <li key={d.id}>
                  <button type="button" className={"deal is-" + s} onClick={() => show(d)}>
                    <span className="pc-tags"><span className="chip">Ưu đãi đối tác</span><span className={"chip " + (s === "active" ? "chip-live" : "chip-muted")}>{STATE_LABEL[s]}</span></span>
                    <b className="deal-title">{d.title}</b>
                    <span className="deal-partner">{d.partner}{d.place ? " · " + d.place : ""}</span>
                    {d.summary && <span className="deal-sum">{d.summary}</span>}
                    <span className="deal-meta">{span(d)} · còn {remaining(d)}/{d.limit} lượt</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section className="sec prose">
        <h2 className="h2">Quy chế ưu đãi</h2>
        <ul>
          <li>Ưu đãi do đối tác cung cấp và chịu trách nhiệm thực hiện. DalatEvent không thu tiền của người dùng và không bán ưu đãi.</li>
          <li>Chỉ bấm "Dùng ưu đãi" khi đang ở quầy của đối tác. Mỗi tài khoản dùng mỗi ưu đãi một lần; đã bấm thì không hoàn lại lượt.</li>
          <li>Ưu đãi có thể hết lượt hoặc bị tạm dừng trước hạn. Nếu đối tác từ chối một ưu đãi đang hiển thị là còn hiệu lực, hãy báo cho DalatEvent theo trang chính sách quyền riêng tư để chúng tôi làm việc với đối tác.</li>
          <li>Khi bạn dùng ưu đãi, chúng tôi lưu tên hiển thị của tài khoản, thời điểm và mã đổi để đối soát với đối tác.</li>
        </ul>
      </section>

      <Sheet visible={!!open} onClose={() => setOpen(null)}>
        {open && (
          <div className="ps acc">
            <span className="pc-tags"><span className="chip">Ưu đãi đối tác</span>{STATE_LABEL[st] && <span className={"chip " + (st === "active" ? "chip-live" : "chip-muted")}>{STATE_LABEL[st]}</span>}</span>
            <h2 className="ps-title">{open.title}</h2>
            <p className="ps-desc"><b>{open.partner}</b>{open.place ? " · " + open.place : ""}</p>
            {open.summary && <p className="ps-desc">{open.summary}</p>}
            <p className="acc-note"><b>Điều kiện:</b> {open.terms}</p>
            <p className="acc-note">Áp dụng {vnTime(open.startAt)} {vnDayMonth(open.startAt)} đến {vnTime(open.endAt)} {vnDayMonth(open.endAt)} · còn {remaining(open)}/{open.limit} lượt</p>
            {mine ? (
              <Voucher deal={open} r={mine} />
            ) : st !== "active" ? (
              <p className="plan-summary">{st === "upcoming" ? "Ưu đãi chưa mở." : st === "soldout" ? "Ưu đãi đã hết lượt." : "Ưu đãi không còn áp dụng."}</p>
            ) : !signedIn ? (
              <button type="button" className="btn btn-ink btn-wide" onClick={openAccount}>Đăng nhập để dùng ưu đãi</button>
            ) : (
              <React.Fragment>
                <label className="acc-check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /><span>Tôi đang ở quầy của {open.partner} và hiểu rằng bấm rồi không hoàn lại lượt</span></label>
                <button type="button" className="btn btn-ink btn-wide" disabled={!agree || busy} onClick={use}>{busy ? "Đang xử lý…" : "Dùng ưu đãi"}</button>
              </React.Fragment>
            )}
            {open.place && <button type="button" className="btn btn-line" onClick={() => openDirections(open.partner + ", " + open.place + ", Đà Lạt")}>Chỉ đường</button>}
          </div>
        )}
      </Sheet>
    </div>
  );
};

export default DealsPage;
