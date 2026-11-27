import React, { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useSnackbar } from "../ui";
import { openAccount } from "../components/account-panel";
import { getAccount, loadAccount, onAccount } from "../platform/account";
import { sendSubmission } from "../platform/submissions";
import { cleanInput, Repeat, submissionErrors, SubmissionInput, WEEKDAYS } from "../utils/submissions";
import { tr } from "../i18n";

const todayVn = () => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
const blank = (): SubmissionInput => ({ title: "", start_date: todayVn(), end_date: todayVn(), venue: "", desc: "", link: "", contact: "", repeat: "once", weekdays: [], time: "" });
const REPEATS = (): { id: Repeat; label: string }[] => [
  { id: "once", label: tr("Một lần / vài ngày liền", "Once / consecutive days") },
  { id: "daily", label: tr("Hằng đêm", "Every night") },
  { id: "weekly", label: tr("Hằng tuần", "Weekly") },
];

/** Trang cho mọi người gửi sự kiện ở Đà Lạt; quản trị viên duyệt rồi mới hiện trên trang */
const SubmitEventPage: FC = () => {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const [, force] = useState(0);
  useEffect(() => onAccount(() => force((n) => n + 1)), []);
  useEffect(() => {
    loadAccount();
  }, []);
  const [f, setF] = useState<SubmissionInput>(blank);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (p: Partial<SubmissionInput>) => setF((x) => ({ ...x, ...p }));
  const signedIn = getAccount().status === "in";

  const send = async () => {
    const c = cleanInput(f);
    const errs = submissionErrors(c, todayVn());
    setErrors(errs);
    if (errs.length) return;
    if (!signedIn) return openAccount();
    setBusy(true);
    const r = await sendSubmission(c);
    setBusy(false);
    if (r === "ok") {
      setDone(true);
      setF(blank());
      window.scrollTo(0, 0);
    } else if (r === "signin") openAccount();
    else openSnackbar({ text: tr("Chưa gửi được, hãy thử lại", "Couldn't send, please try again"), duration: 3000 });
  };

  if (done)
    return (
      <div className="scroll page">
        <div className="empty">
          <h2>{tr("Đã gửi, cảm ơn bạn!", "Sent, thank you!")}</h2>
          <p>{tr("DalatEvent sẽ xem và đưa sự kiện lên trang sau khi duyệt. Nếu cần thêm thông tin, chúng tôi sẽ liên hệ theo cách bạn để lại.", "DalatEvent will review it and publish it once approved. We'll reach out using the contact you left if we need more details.")}</p>
          <button type="button" className="btn btn-ink" onClick={() => setDone(false)}>{tr("Gửi thêm sự kiện", "Send another event")}</button>
          <button type="button" className="btn btn-line" onClick={() => navigate("/")}>{tr("Về trang chủ", "Back to home")}</button>
        </div>
      </div>
    );

  return (
    <div className="scroll page">
      <header className="top">
        <p className="eyebrow">{tr("Dành cho ban tổ chức, quán, điểm diễn", "For organisers, venues and cafés")}</p>
        <h1 className="h1">{tr("Gửi ", "Submit ")}<em>{tr("sự kiện", "an event")}</em></h1>
        <p className="muted">{tr("Sự kiện ở Đà Lạt được DalatEvent duyệt miễn phí trước khi hiện trên web và app.", "Events in Da Lat are reviewed for free before they appear on the website and app.")}</p>
      </header>
      <div className={"pad adm-list" + (busy ? " is-busy" : "")}>
        {errors.length > 0 && <div className="adm-status is-bad" role="alert"><b>{tr("Cần bổ sung:", "Please fix:")}</b><ul>{errors.map((e) => <li key={e}>{e}</li>)}</ul></div>}
        <label className="adm-field">{tr("Tên sự kiện", "Event name")}<input value={f.title} maxLength={120} onChange={(e) => set({ title: e.target.value })} /></label>
        <div className="adm-field">
          {tr("Diễn ra", "Happens")}
          <div className="sub-repeat" role="radiogroup">
            {REPEATS().map((r) => (
              <button key={r.id} type="button" role="radio" aria-checked={f.repeat === r.id} className={"fb" + (f.repeat === r.id ? " on" : "")} onClick={() => set({ repeat: r.id })}>{r.label}</button>
            ))}
          </div>
        </div>
        {f.repeat === "weekly" && (
          <div className="adm-field">
            {tr("Vào các thứ", "On")}
            <div className="sub-days">
              {WEEKDAYS.map((w, d) => (
                <button key={w} type="button" aria-pressed={f.weekdays.includes(d)} className={"sub-day" + (f.weekdays.includes(d) ? " on" : "")} onClick={() => set({ weekdays: f.weekdays.includes(d) ? f.weekdays.filter((x) => x !== d) : [...f.weekdays, d] })}>{w}</button>
              ))}
            </div>
          </div>
        )}
        <div className="adm-row">
          <label className="adm-field">{f.repeat === "once" ? tr("Từ ngày", "From") : tr("Bắt đầu từ ngày", "Starting")}<input type="date" value={f.start_date} min={todayVn()} onChange={(e) => set({ start_date: e.target.value, end_date: f.end_date < e.target.value ? e.target.value : f.end_date })} /></label>
          <label className="adm-field">{f.repeat === "once" ? tr("Đến ngày", "To") : tr("Lặp đến ngày", "Repeat until")}<input type="date" value={f.end_date} min={f.start_date} onChange={(e) => set({ end_date: e.target.value })} /></label>
        </div>
        <label className="adm-field">{tr("Giờ bắt đầu", "Start time")}{f.repeat === "once" ? tr(" (nếu có)", " (optional)") : ""}<input type="time" value={f.time} onChange={(e) => set({ time: e.target.value })} /></label>
        <label className="adm-field">{tr("Địa điểm", "Venue")}<input value={f.venue} maxLength={120} placeholder={tr("Tên nơi tổ chức và địa chỉ", "Venue name and address")} onChange={(e) => set({ venue: e.target.value })} /></label>
        <label className="adm-field">{tr("Giới thiệu sự kiện (giờ diễn ra, giá vé nếu có)", "About the event (time, ticket price if any)")}<textarea rows={5} value={f.desc} maxLength={800} onChange={(e) => set({ desc: e.target.value })} /></label>
        <label className="adm-field">{tr("Link Facebook, trang bán vé (nếu có)", "Facebook or ticket link (optional)")}<input value={f.link} maxLength={300} placeholder="https://" onChange={(e) => set({ link: e.target.value.trim() })} /></label>
        <label className="adm-field">{tr("Số điện thoại hoặc Zalo để liên hệ (không hiện công khai)", "Phone or Zalo to reach you (not shown publicly)")}<input value={f.contact} maxLength={120} onChange={(e) => set({ contact: e.target.value })} /></label>
        <button type="button" className="btn btn-ink btn-wide" onClick={send}>{signedIn ? tr("Gửi để duyệt", "Send for review") : tr("Đăng nhập để gửi", "Sign in to send")}</button>
        <p className="muted small">{tr("Cần đăng nhập để chống tin rác. Thông tin liên hệ chỉ quản trị viên DalatEvent thấy.", "Sign-in is required to prevent spam. Your contact details are only visible to DalatEvent admins.")}</p>
      </div>
    </div>
  );
};

export default SubmitEventPage;
