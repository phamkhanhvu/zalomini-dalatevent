import React, { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useSnackbar } from "../ui";
import { openAccount } from "../components/account-panel";
import { getAccount, loadAccount, onAccount } from "../platform/account";
import { fetchPublicDeals } from "../platform/deals";
import { DealDraft, dealDraftErrors, DealRequest, dealViews, Me, MySubmission, myDealRequests, mySubmissions, PartnerKind, proposeDeal, requestPartner, whoAmI } from "../platform/partners";
import type { Deal } from "../utils/deals";
import { tr } from "../i18n";

const todayVn = () => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
const dayMs = (d: string, end = false) => new Date(d + (end ? "T23:59:00+07:00" : "T00:00:00+07:00")).getTime();
const dmy = (d: string) => (d ? d.slice(8, 10) + "." + d.slice(5, 7) + "." + d.slice(0, 4) : "");
const dmyMs = (t: number) => dmy(new Date(t + 7 * 3600000).toISOString().slice(0, 10));
const STATUS = () => ({ new: tr("Chờ duyệt", "Pending"), approved: tr("Đã duyệt", "Approved"), rejected: tr("Chưa duyệt được", "Not approved") });
const KINDS = (): [PartnerKind, string][] => [
  ["cafe", tr("Quán cafe, nhà hàng", "Café, restaurant")],
  ["venue", tr("Điểm diễn, khu du lịch", "Venue, attraction")],
  ["organizer", tr("Nhà tổ chức sự kiện", "Event organiser")],
  ["other", tr("Khác", "Other")],
];

/** Trang cho đối tác: xin làm đối tác, đăng sự kiện, đề xuất ưu đãi, xem lượt xem và lượt dùng mã */
const PartnerPage: FC = () => {
  const [, force] = useState(0);
  const [me, setMe] = useState<Me | null>(null);
  const [round, setRound] = useState(0);
  useEffect(() => onAccount(() => force((n) => n + 1)), []);
  const status = getAccount().status;
  useEffect(() => {
    let live = true;
    loadAccount().then(() => whoAmI().then((m) => live && setMe(m)).catch(() => live && setMe({ kind: "none" })));
    return () => {
      live = false;
    };
  }, [status, round]);

  return (
    <div className="scroll page">
      <header className="top">
        <p className="eyebrow">{tr("Dành cho quán, điểm diễn, nhà tổ chức", "For cafés, venues and organisers")}</p>
        <h1 className="h1">{tr("Trang ", "Partner ")}<em>{tr("đối tác", "page")}</em></h1>
        <p className="muted">{tr("Đăng sự kiện, tạo ưu đãi cho khách DalatEvent và xem có bao nhiêu người xem, lấy mã. Miễn phí, DalatEvent duyệt trước khi hiện.", "Post events, create offers for DalatEvent users and see how many people view and use them. Free; DalatEvent reviews everything before it goes live.")}</p>
      </header>
      <div className="pad pt-wrap">
        {!me && <p className="muted">{tr("Đang tải…", "Loading…")}</p>}
        {me?.kind === "out" && (
          <div className="pt-card">
            <b>{tr("Đăng nhập để bắt đầu", "Sign in to start")}</b>
            <p className="muted small">{tr("Dùng tài khoản DalatEvent (Google, Apple hoặc email) của người phụ trách.", "Use the DalatEvent account (Google, Apple or email) of the person in charge.")}</p>
            <button type="button" className="btn btn-ink" onClick={openAccount}>{tr("Đăng nhập", "Sign in")}</button>
          </div>
        )}
        {me?.kind === "none" && <RequestForm onDone={() => setRound((n) => n + 1)} />}
        {me?.kind === "pending" && (
          <div className="pt-card">
            <b>{tr("Đã nhận yêu cầu của ", "Request received for ")}{me.req.name}</b>
            <p className="muted small">{tr("DalatEvent sẽ liên hệ số ", "DalatEvent will contact ")}{me.req.phone}{tr(" để xác nhận rồi mở trang đối tác cho bạn. Trong lúc chờ, bạn vẫn gửi sự kiện được.", " to confirm and then open your partner page. Meanwhile you can still submit events.")}</p>
            <SubmitButton />
          </div>
        )}
        {me?.kind === "rejected" && (
          <div className="pt-card">
            <b>{tr("Yêu cầu chưa được duyệt", "Request not approved")}</b>
            <p className="muted small">{tr("Hãy gửi lại với tên và số điện thoại chính xác, hoặc liên hệ DalatEvent.", "Please resend with the correct name and phone number, or contact DalatEvent.")}</p>
            <RequestForm onDone={() => setRound((n) => n + 1)} initial={me.req} />
          </div>
        )}
        {me?.kind === "partner" && <Dashboard name={me.partner.name} partner={me.partner} />}
      </div>
    </div>
  );
};

const SubmitButton: FC = () => {
  const navigate = useNavigate();
  return <button type="button" className="btn btn-line" onClick={() => navigate("/gui-su-kien")}>{tr("Gửi sự kiện", "Submit an event")}</button>;
};

const RequestForm: FC<{ onDone: () => void; initial?: { name: string; phone: string; kind: PartnerKind; note: string } }> = ({ onDone, initial }) => {
  const { openSnackbar } = useSnackbar();
  const [f, setF] = useState(initial || { name: "", phone: "", kind: "cafe" as PartnerKind, note: "" });
  const [busy, setBusy] = useState(false);
  const ok = f.name.trim().length >= 3 && /^[0-9+ .]{8,20}$/.test(f.phone.trim());
  const send = async () => {
    if (!ok) return openSnackbar({ text: tr("Nhập tên và số điện thoại hợp lệ", "Enter a name and a valid phone number"), duration: 2400 });
    setBusy(true);
    const r = await requestPartner(f);
    setBusy(false);
    if (r === "ok") onDone();
    else if (r === "signin") openAccount();
    else openSnackbar({ text: tr("Chưa gửi được, hãy thử lại", "Couldn't send, please try again"), duration: 2600 });
  };
  return (
    <div className={"pt-card adm-list" + (busy ? " is-busy" : "")}>
      <b>{tr("Đăng ký làm đối tác", "Become a partner")}</b>
      <label className="adm-field">{tr("Tên quán / đơn vị", "Business name")}<input value={f.name} maxLength={80} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
      <label className="adm-field">{tr("Số điện thoại / Zalo (không công khai)", "Phone / Zalo (not public)")}<input value={f.phone} maxLength={20} inputMode="tel" onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
      <div className="adm-field">
        {tr("Loại hình", "Type")}
        <div className="sub-repeat">
          {KINDS().map(([k, l]) => (
            <button key={k} type="button" className={"fb" + (f.kind === k ? " on" : "")} aria-pressed={f.kind === k} onClick={() => setF({ ...f, kind: k })}>{l}</button>
          ))}
        </div>
      </div>
      <label className="adm-field">{tr("Địa chỉ, link Facebook, ghi chú", "Address, Facebook link, notes")}<textarea rows={3} maxLength={300} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></label>
      <button type="button" className="btn btn-ink btn-wide" onClick={send}>{tr("Gửi đăng ký", "Send")}</button>
    </div>
  );
};

const Dashboard: FC<{ name: string; partner: { uid: string; name: string; since: number } }> = ({ name, partner }) => {
  const navigate = useNavigate();
  const [subs, setSubs] = useState<MySubmission[] | null>(null);
  const [reqs, setReqs] = useState<DealRequest[] | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [views, setViews] = useState<Record<string, { views: number; uses: number }>>({});
  const [form, setForm] = useState(false);
  const [round, setRound] = useState(0);
  useEffect(() => {
    mySubmissions().then(setSubs).catch(() => setSubs([]));
    myDealRequests()
      .then(async (rs) => {
        setReqs(rs);
        const ids = rs.filter((r) => r.dealId).map((r) => r.dealId);
        const v: Record<string, { views: number; uses: number }> = {};
        await Promise.all(ids.map(async (id) => (v[id] = await dealViews(id))));
        setViews(v);
      })
      .catch(() => setReqs([]));
    fetchPublicDeals().then(setDeals).catch(() => undefined);
  }, [round]);
  const S = STATUS();
  // Ưu đãi đang chạy mang tên đối tác (kể cả ưu đãi do DalatEvent tạo hộ)
  const mine = deals.filter((d) => d.partner.toLowerCase() === name.toLowerCase());
  const linked = new Set((reqs || []).map((r) => r.dealId));
  const extra = mine.filter((d) => !linked.has(d.id));
  useEffect(() => {
    extra.forEach((d) => {
      if (!views[d.id]) dealViews(d.id).then((v) => setViews((x) => ({ ...x, [d.id]: v })));
    });
  }, [deals.length, reqs?.length]);

  return (
    <React.Fragment>
      <div className="pt-card pt-hello">
        <b>{name}</b>
        <span className="muted small">{tr("Đối tác DalatEvent", "DalatEvent partner")}{partner.since ? tr(" từ ", " since ") + dmyMs(partner.since) : ""}</span>
      </div>

      <section className="pt-sec">
        <div className="pt-sec-head"><h2>{tr("Ưu đãi", "Offers")}</h2><button type="button" className="btn btn-ink btn-sm" onClick={() => setForm(!form)}>{form ? tr("Đóng", "Close") : tr("+ Đề xuất ưu đãi", "+ Propose an offer")}</button></div>
        {form && <DealForm partner={partner} onDone={() => { setForm(false); setRound((n) => n + 1); }} />}
        {[...mine.map((d) => ({ key: d.id, title: d.title, state: S.approved, dealId: d.id, limit: d.limit, count: d.count, end: d.endAt })), ...(reqs || []).filter((r) => !r.dealId).map((r) => ({ key: r.id, title: r.title, state: S[r.status], dealId: "", limit: r.limit, count: 0, end: r.endAt }))].map((x) => (
          <div key={x.key} className="pt-row">
            <div><b>{x.title}</b><span className="muted small">{x.state}{x.end ? tr(" · đến ", " · until ") + dmyMs(x.end) : ""}</span></div>
            {x.dealId && (
              <div className="pt-nums">
                <span><i>{tr("Lượt xem 30 ngày", "Views, 30 days")}</i><b>{views[x.dealId]?.views ?? "…"}</b></span>
                <span><i>{tr("Đã lấy mã", "Codes taken")}</i><b>{x.count}/{x.limit}</b></span>
              </div>
            )}
          </div>
        ))}
        {reqs && !mine.length && !reqs.length && !form && <p className="muted small">{tr("Chưa có ưu đãi. Bấm Đề xuất ưu đãi để gửi DalatEvent duyệt.", "No offers yet. Tap Propose an offer to send one for review.")}</p>}
      </section>

      <section className="pt-sec">
        <div className="pt-sec-head"><h2>{tr("Sự kiện đã gửi", "Submitted events")}</h2><button type="button" className="btn btn-ink btn-sm" onClick={() => navigate("/gui-su-kien")}>{tr("+ Gửi sự kiện", "+ Submit event")}</button></div>
        {subs === null ? <p className="muted small">{tr("Đang tải…", "Loading…")}</p> : subs.length ? subs.map((s) => (
          <div key={s.id} className="pt-row"><div><b>{s.title}</b><span className="muted small">{dmy(s.start_date)}{s.end_date !== s.start_date ? " — " + dmy(s.end_date) : ""} · {S[s.status]}</span></div></div>
        )) : <p className="muted small">{tr("Chưa gửi sự kiện nào.", "No events submitted yet.")}</p>}
      </section>
      <p className="muted small">{tr("Lượt xem là số lần khách mở ưu đãi trên web và app, đếm ẩn danh. Cần đổi tên hiển thị hay gỡ ưu đãi, hãy liên hệ DalatEvent.", "Views are how many times people opened the offer on the website and app, counted anonymously. To rename or remove an offer, contact DalatEvent.")}</p>
    </React.Fragment>
  );
};

const DealForm: FC<{ partner: { uid: string; name: string; since: number }; onDone: () => void }> = ({ partner, onDone }) => {
  const { openSnackbar } = useSnackbar();
  const [f, setF] = useState({ title: "", summary: "", terms: "", place: "", start: todayVn(), end: todayVn(), limit: "50", code: "", url: "" });
  const [busy, setBusy] = useState(false);
  const [errs, setErrs] = useState<string[]>([]);
  const LABEL: Record<string, string> = { title: tr("Tên ưu đãi (ít nhất 6 ký tự)", "Offer name (6+ characters)"), summary: tr("Mô tả ưu đãi", "Offer description"), terms: tr("Điều kiện áp dụng", "Terms"), dates: tr("Ngày kết thúc phải sau ngày bắt đầu", "End must be after start"), limit: tr("Số lượt từ 1 đến 5.000", "Uses between 1 and 5,000"), url: tr("Link phải bắt đầu bằng https://", "Link must start with https://") };
  const send = async () => {
    const d: DealDraft = { title: f.title, summary: f.summary, terms: f.terms, place: f.place, startAt: dayMs(f.start), endAt: dayMs(f.end, true), limit: Number(f.limit), code: f.code.trim(), url: f.url.trim() };
    const e = dealDraftErrors(d);
    setErrs(e);
    if (e.length) return;
    setBusy(true);
    const r = await proposeDeal(partner, d);
    setBusy(false);
    if (r === "ok") {
      openSnackbar({ text: tr("Đã gửi ưu đãi, DalatEvent sẽ duyệt sớm", "Offer sent; DalatEvent will review it soon"), type: "success", duration: 2600 });
      onDone();
    } else openSnackbar({ text: tr("Chưa gửi được, hãy thử lại", "Couldn't send, please try again"), duration: 2600 });
  };
  return (
    <div className={"pt-card adm-list" + (busy ? " is-busy" : "")}>
      {errs.length > 0 && <div className="adm-status is-bad" role="alert"><ul>{errs.map((e) => <li key={e}>{LABEL[e]}</li>)}</ul></div>}
      <label className="adm-field">{tr("Tên ưu đãi", "Offer name")}<input value={f.title} maxLength={120} placeholder={tr("Ví dụ: Giảm 10% đồ uống cho khách DalatEvent", "E.g. 10% off drinks for DalatEvent users")} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
      <label className="adm-field">{tr("Mô tả", "Description")}<textarea rows={2} maxLength={300} value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} /></label>
      <label className="adm-field">{tr("Điều kiện (áp dụng cho ai, món nào, khung giờ nào)", "Terms (who, what, when)")}<textarea rows={3} maxLength={500} value={f.terms} onChange={(e) => setF({ ...f, terms: e.target.value })} /></label>
      <label className="adm-field">{tr("Nơi dùng ưu đãi", "Where to use it")}<input value={f.place} maxLength={120} placeholder={tr("Địa chỉ quán", "Address")} onChange={(e) => setF({ ...f, place: e.target.value })} /></label>
      <div className="adm-row">
        <label className="adm-field">{tr("Từ ngày", "From")}<input type="date" value={f.start} min={todayVn()} onChange={(e) => setF({ ...f, start: e.target.value, end: f.end < e.target.value ? e.target.value : f.end })} /></label>
        <label className="adm-field">{tr("Đến ngày", "To")}<input type="date" value={f.end} min={f.start} onChange={(e) => setF({ ...f, end: e.target.value })} /></label>
      </div>
      <label className="adm-field">{tr("Tổng số lượt", "Total uses")}<input type="number" min={1} max={5000} value={f.limit} onChange={(e) => setF({ ...f, limit: e.target.value })} /></label>
      <label className="adm-field">{tr("Mã giảm giá của bạn (nếu khách nhập mã khi đặt online). Bỏ trống thì app tự tạo mã riêng cho từng khách để đưa nhân viên.", "Your discount code (if customers type it online). Leave empty and the app gives each customer a unique code to show staff.")}<input value={f.code} maxLength={40} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} /></label>
      <label className="adm-field">{tr("Link đặt chỗ / mua vé (nếu có)", "Booking / ticket link (optional)")}<input value={f.url} maxLength={300} placeholder="https://" onChange={(e) => setF({ ...f, url: e.target.value })} /></label>
      <button type="button" className="btn btn-ink btn-wide" onClick={send}>{tr("Gửi để duyệt", "Send for review")}</button>
    </div>
  );
};

export default PartnerPage;
