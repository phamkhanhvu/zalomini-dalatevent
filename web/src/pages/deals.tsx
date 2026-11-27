import React, { FC, useEffect, useMemo, useState } from "react";
import { Sheet, useSnackbar } from "../ui";
import { openAccount } from "../components/account-panel";
import { getAccount, onAccount } from "../platform/account";
import { fetchPublicDeals, myRedemption, redeem, Redemption } from "../platform/deals";
import { vnDayMonth, vnTime } from "../utils/agenda";
import { Deal, dealState, remaining, visibleDeals } from "../utils/deals";
import { openDirections, openUrl } from "../utils/device";
import { tr } from "../i18n";

const STATE_LABEL = (): Record<string, string> => ({ active: tr("Đang áp dụng", "Active"), upcoming: tr("Sắp mở", "Coming soon"), soldout: tr("Đã hết lượt", "All used") });
const span = (d: Deal) => vnDayMonth(d.startAt) + " – " + vnDayMonth(d.endAt) + "." + new Date(d.endAt + 7 * 3600000).getUTCFullYear();

/** Màn hình đưa cho nhân viên xem: mã, giờ đổi và đồng hồ đang chạy (để phân biệt với ảnh chụp màn hình) */
const Voucher: FC<{ deal: Deal; r: Redemption }> = ({ deal, r }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  const clock = new Date(now + 7 * 3600000).toISOString().slice(11, 19);
  if (deal.code) {
    // Mã đối tác cấp: khách nhập khi đặt vé trên trang của đối tác
    const copy = () => navigator.clipboard?.writeText(deal.code).catch(() => undefined);
    return (
      <div className="voucher" role="status">
        <p className="eyebrow">{tr("Nhập mã này khi đặt vé tại ", "Enter this code when booking with ")}{deal.partner}</p>
        <b className="voucher-code">{deal.code}</b>
        <p>{deal.title}</p>
        <div className="voucher-actions">
          <button type="button" className="btn btn-line" onClick={copy}>{tr("Chép mã", "Copy code")}</button>
          {deal.url && <button type="button" className="btn btn-ink" onClick={() => openUrl(deal.url)}>{tr("Đặt vé", "Book tickets")}</button>}
        </div>
      </div>
    );
  }
  return (
    <div className="voucher" role="status">
      <p className="eyebrow">{tr("Đưa màn hình này cho nhân viên ", "Show this screen to the staff at ")}{deal.partner}</p>
      <b className="voucher-code">{r.code}</b>
      <p>{deal.title}</p>
      <p className="muted small">{tr("Đã dùng lúc ", "Used at ")}{vnTime(r.at)}{tr(" ngày ", ", ")}{vnDayMonth(r.at)}{tr(" · Bây giờ là ", " · Now ")}<span className="voucher-clock">{clock}</span></p>
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
    else openSnackbar({ text: r.reason === "unavailable" ? tr("Ưu đãi này vừa hết lượt hoặc đã ngừng", "This offer just ran out or was stopped") : tr("Mất kết nối, hãy thử lại", "Connection lost, please try again"), duration: 3200 });
  };
  const st = open ? dealState(open, now) : "hidden";

  return (
    <div className="scroll page">
      <header className="top">
        <p className="eyebrow">{tr("Ưu đãi từ đối tác", "Partner offers")}</p>
        <h1 className="h1">Dalat <em>Deals</em></h1>
        <p className="muted">{tr("Ưu đãi do các quán, điểm diễn và điểm tham quan tại Đà Lạt dành cho người dùng DalatEvent. Mỗi tài khoản dùng mỗi ưu đãi một lần.", "Offers from cafés, venues and attractions in Da Lat for DalatEvent users. Each account can use each offer once.")}</p>
      </header>
      <section className="sec">
        {err ? (
          <div className="ag-empty"><b>{tr("Chưa tải được danh sách ưu đãi.", "Couldn't load offers.")}</b><button type="button" className="btn btn-line" onClick={load}>{tr("Thử lại", "Retry")}</button></div>
        ) : !deals ? (
          <p className="muted">{tr("Đang tải…", "Loading…")}</p>
        ) : list.length === 0 ? (
          <div className="ag-empty">
            <b>{tr("Hiện chưa có ưu đãi nào.", "No offers right now.")}</b>
            <span>{tr("Ưu đãi chỉ xuất hiện ở đây sau khi đối tác xác nhận. Bạn là quán, điểm diễn muốn tham gia? Liên hệ theo trang chính sách quyền riêng tư.", "Offers appear here once a partner confirms them. Run a café or venue and want to join? Contact us via the privacy policy page.")}</span>
          </div>
        ) : (
          <ul className="deal-list">
            {list.map((d) => {
              const s = dealState(d, now);
              return (
                <li key={d.id}>
                  <button type="button" className={"deal is-" + s} onClick={() => show(d)}>
                    <span className="pc-tags"><span className="chip">{tr("Ưu đãi đối tác", "Partner offer")}</span><span className={"chip " + (s === "active" ? "chip-live" : "chip-muted")}>{STATE_LABEL()[s]}</span></span>
                    <b className="deal-title">{d.title}</b>
                    <span className="deal-partner">{d.partner}{d.place ? " · " + d.place : ""}</span>
                    {d.summary && <span className="deal-sum">{d.summary}</span>}
                    <span className="deal-meta">{span(d)}{tr(" · còn ", " · ")}{remaining(d)}/{d.limit}{tr(" lượt", " left")}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section className="sec prose">
        <h2 className="h2">{tr("Quy chế ưu đãi", "Offer rules")}</h2>
        <ul>
          <li>{tr("Ưu đãi do đối tác cung cấp và chịu trách nhiệm thực hiện. DalatEvent không thu tiền của người dùng và không bán ưu đãi.", "Offers are provided and honoured by partners. DalatEvent does not charge users or sell offers.")}</li>
          <li>{tr("Chỉ bấm \"Dùng ưu đãi\" khi đang ở quầy của đối tác. Mỗi tài khoản dùng mỗi ưu đãi một lần; đã bấm thì không hoàn lại lượt.", "Only tap \"Use offer\" at the partner's counter. Each account can use each offer once; a use cannot be undone.")}</li>
          <li>{tr("Ưu đãi có thể hết lượt hoặc bị tạm dừng trước hạn. Nếu đối tác từ chối một ưu đãi đang hiển thị là còn hiệu lực, hãy báo cho DalatEvent theo trang chính sách quyền riêng tư để chúng tôi làm việc với đối tác.", "Offers may run out or be paused early. If a partner refuses an offer shown as active, tell DalatEvent via the privacy policy page and we will follow up.")}</li>
          <li>{tr("Khi bạn dùng ưu đãi, chúng tôi lưu tên hiển thị của tài khoản, thời điểm và mã đổi để đối soát với đối tác.", "When you use an offer we store your display name, the time and the code to reconcile with the partner.")}</li>
        </ul>
      </section>

      <Sheet visible={!!open} onClose={() => setOpen(null)}>
        {open && (
          <div className="ps acc">
            <span className="pc-tags"><span className="chip">{tr("Ưu đãi đối tác", "Partner offer")}</span>{STATE_LABEL()[st] && <span className={"chip " + (st === "active" ? "chip-live" : "chip-muted")}>{STATE_LABEL()[st]}</span>}</span>
            <h2 className="ps-title">{open.title}</h2>
            <p className="ps-desc"><b>{open.partner}</b>{open.place ? " · " + open.place : ""}</p>
            {open.summary && <p className="ps-desc">{open.summary}</p>}
            <p className="acc-note"><b>{tr("Điều kiện:", "Terms:")}</b> {open.terms}</p>
            <p className="acc-note">{tr("Áp dụng ", "Valid ")}{vnTime(open.startAt)} {vnDayMonth(open.startAt)}{tr(" đến ", " to ")}{vnTime(open.endAt)} {vnDayMonth(open.endAt)}{tr(" · còn ", " · ")}{remaining(open)}/{open.limit}{tr(" lượt", " left")}</p>
            {mine ? (
              <Voucher deal={open} r={mine} />
            ) : st !== "active" ? (
              <p className="plan-summary">{st === "upcoming" ? tr("Ưu đãi chưa mở.", "This offer hasn't opened yet.") : st === "soldout" ? tr("Ưu đãi đã hết lượt.", "This offer is all used.") : tr("Ưu đãi không còn áp dụng.", "This offer is no longer valid.")}</p>
            ) : !signedIn ? (
              <button type="button" className="btn btn-ink btn-wide" onClick={openAccount}>{tr("Đăng nhập để dùng ưu đãi", "Sign in to use this offer")}</button>
            ) : (
              <React.Fragment>
                <label className="acc-check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /><span>{tr("Tôi đang ở quầy của ", "I'm at the counter of ")}{open.partner}{tr(" và hiểu rằng bấm rồi không hoàn lại lượt", " and understand a use can't be undone")}</span></label>
                <button type="button" className="btn btn-ink btn-wide" disabled={!agree || busy} onClick={use}>{busy ? tr("Đang xử lý…", "Working…") : tr("Dùng ưu đãi", "Use offer")}</button>
              </React.Fragment>
            )}
            {open.place && <button type="button" className="btn btn-line" onClick={() => openDirections(open.partner + ", " + open.place + ", Đà Lạt")}>{tr("Chỉ đường", "Directions")}</button>}
          </div>
        )}
      </Sheet>
    </div>
  );
};

export default DealsPage;
