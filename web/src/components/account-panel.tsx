import React, { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Sheet, useSnackbar } from "../ui";
import { CAN_APPLE, CAN_GOOGLE, deleteAccount, deleteNeeds, getAccount, loadAccount, onAccount, registerEmail, resetPassword, signInEmail, signInApple, signInGoogle, signOutAccount, wasLinked, wipeCloud } from "../platform/account";
import { tr } from "../i18n";

/** Trạng thái mở bảng tài khoản, dùng chung cho nút trên thanh đầu trang và dải ở trang Lịch trình */
let sheetOpen = false;
const openSubs = new Set<() => void>();
const setSheet = (v: boolean) => {
  sheetOpen = v;
  openSubs.forEach((fn) => fn());
};
export const openAccount = () => {
  setSheet(true);
  loadAccount();
};
function useSheetOpen() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    openSubs.add(fn);
    return () => {
      openSubs.delete(fn);
    };
  }, []);
  return sheetOpen;
}

function useAccount() {
  const [, force] = useState(0);
  useEffect(() => onAccount(() => force((n) => n + 1)), []);
  return getAccount();
}

const whoOf = (acc: ReturnType<typeof getAccount>) => acc.name || acc.email || tr("tài khoản của bạn", "your account");

/** Dải tài khoản trên trang Lịch trình */
export const AccountPanel: FC = () => {
  const acc = useAccount();
  const signedIn = acc.status === "in";
  return (
    <button type="button" className={"acc-strip" + (signedIn ? " is-in" : "")} onClick={openAccount}>
      <span className="acc-dot" aria-hidden="true" />
      <span className="acc-text">
        {signedIn ? (
          <React.Fragment><b>{acc.syncing ? tr("Đang đồng bộ…", "Syncing…") : acc.error ? tr("Chưa đồng bộ được", "Not synced yet") : tr("Đã đồng bộ", "Synced")}</b><i>{whoOf(acc)}</i></React.Fragment>
        ) : (
          <React.Fragment><b>{tr("Đăng nhập hoặc đăng ký", "Sign in or sign up")}</b><i>{tr("Để xem lịch trình này trên máy khác", "To see this plan on other devices")}</i></React.Fragment>
        )}
      </span>
      <span className="acc-go">{signedIn ? tr("Tài khoản", "Account") : tr("Mở", "Open")}</span>
    </button>
  );
};

/** Nút tài khoản ở góc trên bên phải, có trên mọi trang */
export const AccountButton: FC = () => {
  const acc = useAccount();
  const signedIn = acc.status === "in";
  const initial = (whoOf(acc).trim()[0] || "?").toUpperCase();
  return (
    <button type="button" className={"acc-top" + (signedIn ? " is-in" : "")} onClick={openAccount} aria-label={signedIn ? tr("Tài khoản: ", "Account: ") + whoOf(acc) : tr("Đăng nhập hoặc đăng ký", "Sign in or sign up")}>
      {signedIn ? <span className="acc-avatar" aria-hidden="true">{initial}</span> : tr("Đăng nhập", "Sign in")}
    </button>
  );
};

/** Bảng tài khoản: đăng nhập, đăng ký, đăng xuất, xóa. Chỉ đặt một lần trong khung trang. */
export const AccountSheet: FC = () => {
  const acc = useAccount();
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const open = useSheetOpen();
  const setOpen = setSheet;
  const [mode, setMode] = useState<"in" | "new">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [agree, setAgree] = useState(false);

  // Máy đã từng đăng nhập thì tải phần tài khoản ngay để đồng bộ; chưa thì chờ người dùng bấm
  useEffect(() => {
    if (wasLinked()) loadAccount();
  }, []);

  useEffect(() => {
    if (!open) return;
    setDeleting(false);
    setAgree(false);
    setConfirmWipe(false);
    setPassword("");
  }, [open]);
  const act = async (fn: () => Promise<boolean>) => {
    setBusy(true);
    const ok = await fn();
    setBusy(false);
    if (ok) {
      setPassword("");
      setOpen(false);
    }
  };
  const signedIn = acc.status === "in";
  const who = whoOf(acc);

  return (
    <React.Fragment>
      <Sheet visible={open} onClose={() => setOpen(false)}>
        <div className="ps acc">
          {acc.status === "loading" || acc.status === "off" ? (
            <p className="acc-note">{acc.error || tr("Đang tải…", "Loading…")}</p>
          ) : signedIn && deleting ? (
            <form
              className="acc-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!agree) return;
                act(async () => {
                  const ok = await deleteAccount(password);
                  if (ok) openSnackbar({ text: tr("Đã xóa tài khoản. Lịch trình trên máy này vẫn được giữ", "Account deleted. Your plan on this device is kept"), duration: 3200 });
                  return ok;
                });
              }}
            >
              <h2 className="ps-title">{tr("Xóa tài khoản", "Delete account")}</h2>
              <p className="ps-desc">{tr("Tài khoản ", "The account ")}<b>{who}</b>{tr(" sẽ bị xóa hẳn và ", " will be deleted permanently and ")}<b>{tr("không khôi phục được", "cannot be restored")}</b>{tr(". Những thứ bị xóa cùng:", ". Also deleted:")}</p>
              <ul className="acc-list">
                <li>{tr("Lịch trình đã đồng bộ trên tài khoản", "The plan synced to your account")}</li>
                <li>{tr("Toàn bộ tiến trình trong trò chơi DalatEvent và dòng của bạn trên bảng xếp hạng", "All progress in the DalatEvent game and your leaderboard entry")}</li>
              </ul>
              <p className="acc-note">{tr("Lịch trình trên máy này vẫn được giữ. Gian hàng bạn đang sở hữu trong trò chơi không tự xóa được; muốn xóa hãy liên hệ theo trang chính sách quyền riêng tư.", "Your plan on this device is kept. Stalls you own in the game cannot be removed automatically; contact us via the privacy policy page to remove them.")}</p>
              {deleteNeeds() === "password" && (
                <label>{tr("Nhập mật khẩu để xác nhận", "Enter your password to confirm")}<input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
              )}
              {deleteNeeds() === "google" && <p className="acc-note">{tr("Bấm nút xóa sẽ mở cửa sổ Google để bạn xác nhận lại tài khoản.", "Tapping delete opens Google so you can confirm your account.")}</p>}
              {deleteNeeds() === "apple" && <p className="acc-note">{tr("Bấm nút xóa sẽ mở bước xác nhận của Apple. Quyền đăng nhập bằng Apple của DalatEvent cũng được thu hồi.", "Tapping delete opens Apple's confirmation. DalatEvent's Sign in with Apple access is also revoked.")}</p>}
              <label className="acc-check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /><span>{tr("Tôi hiểu việc này không hoàn tác được", "I understand this cannot be undone")}</span></label>
              {acc.error && <p className="acc-err" role="alert">{acc.error}</p>}
              <div className="ps-actions">
                <button type="button" className="btn btn-line" disabled={busy} onClick={() => setDeleting(false)}>{tr("Quay lại", "Back")}</button>
                <button type="submit" className="btn btn-danger" disabled={busy || !agree}>{busy ? tr("Đang xóa…", "Deleting…") : tr("Xóa hẳn tài khoản", "Delete account permanently")}</button>
              </div>
            </form>
          ) : signedIn ? (
            <React.Fragment>
              <h2 className="ps-title">{tr("Tài khoản", "Account")}</h2>
              <p className="ps-desc">{tr("Đang đăng nhập bằng ", "Signed in as ")}<b>{who}</b>{tr(". Lịch trình của bạn được lưu trên tài khoản này và tự cập nhật giữa các máy.", ". Your plan is saved to this account and syncs across devices.")}</p>
              {acc.error && <p className="acc-err" role="alert">{acc.error}</p>}
              <div className="ps-actions">
                <button type="button" className="btn btn-line" disabled={busy} onClick={() => act(async () => { await signOutAccount(); openSnackbar({ text: tr("Đã đăng xuất. Lịch trình vẫn còn trên máy này", "Signed out. Your plan stays on this device"), duration: 2600 }); return true; })}>{tr("Đăng xuất", "Sign out")}</button>
                {!confirmWipe ? (
                  <button type="button" className="btn btn-line" onClick={() => setConfirmWipe(true)}>{tr("Xóa lịch trình trên tài khoản", "Delete plan from account")}</button>
                ) : (
                  <button type="button" className="btn btn-danger" disabled={busy} onClick={() => act(async () => { const ok = await wipeCloud(); if (ok) openSnackbar({ text: tr("Đã xóa bản trên tài khoản và đăng xuất", "Deleted the account copy and signed out"), duration: 2600 }); setConfirmWipe(false); return ok; })}>{tr("Bấm lần nữa để xóa", "Tap again to delete")}</button>
                )}
              </div>
              <p className="acc-note">{tr("Xóa lịch trình trên tài khoản không xóa tài khoản và không ảnh hưởng tiến trình trong trò chơi. Bản trên máy này vẫn được giữ.", "Deleting the plan does not delete your account or game progress. The copy on this device is kept.")}</p>
              <button type="button" className="acc-switch" onClick={() => { setOpen(false); navigate("/quan-tri"); }}>{tr("Quản trị nội dung", "Content admin")}</button>
              <button type="button" className="acc-switch acc-del" onClick={() => { setDeleting(true); setAgree(false); setPassword(""); }}>{tr("Xóa tài khoản", "Delete account")}</button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <div className="acc-tabs" role="tablist" aria-label={tr("Đăng nhập hoặc đăng ký", "Sign in or sign up")}>
                <button type="button" role="tab" aria-selected={mode === "in"} className={mode === "in" ? "on" : ""} onClick={() => setMode("in")}>{tr("Đăng nhập", "Sign in")}</button>
                <button type="button" role="tab" aria-selected={mode === "new"} className={mode === "new" ? "on" : ""} onClick={() => setMode("new")}>{tr("Đăng ký", "Sign up")}</button>
              </div>
              <h2 className="ps-title">{mode === "in" ? tr("Đăng nhập", "Sign in") : tr("Đăng ký tài khoản mới", "Create an account")}</h2>
              <p className="ps-desc">{tr("Dùng chung tài khoản với trò chơi DalatEvent. Chúng tôi chỉ lưu danh sách mục bạn đã thêm vào lịch trình.", "Shared with the DalatEvent game. We only store the items you add to your plan.")}</p>
              {CAN_APPLE && (
                <button type="button" className="btn btn-apple btn-wide" disabled={busy} onClick={() => act(signInApple)}>
                  <svg viewBox="0 0 17 20" width="15" height="18" aria-hidden="true"><path fill="currentColor" d="M14.1 10.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.7-1-2.7-4.1zM11.6 3c.7-.9 1.2-2 1.1-3.2-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.1 1.1.1 2.3-.6 3-1.5z"/></svg>
                  {mode === "in" ? tr("Đăng nhập bằng Apple", "Sign in with Apple") : tr("Đăng ký bằng Apple", "Sign up with Apple")}
                </button>
              )}
              {CAN_GOOGLE && (
                <button type="button" className={"btn btn-wide " + (CAN_APPLE ? "btn-line" : "btn-ink")} disabled={busy} onClick={() => act(signInGoogle)}>{mode === "in" ? tr("Đăng nhập bằng Google", "Sign in with Google") : tr("Đăng ký bằng Google", "Sign up with Google")}</button>
              )}
              <form
                className="acc-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  act(() => (mode === "in" ? signInEmail(email, password) : registerEmail(email, password)));
                }}
              >
                <label>Email<input type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
                <label>{mode === "in" ? tr("Mật khẩu", "Password") : tr("Đặt mật khẩu (ít nhất 6 ký tự)", "Choose a password (at least 6 characters)")}<input type="password" required minLength={6} autoComplete={mode === "in" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
                {acc.error && <p className="acc-err" role="alert">{acc.error}</p>}
                <button type="submit" className={"btn btn-wide " + (CAN_GOOGLE ? "btn-line" : "btn-ink")} disabled={busy}>{busy ? tr("Đang xử lý…", "Working…") : mode === "in" ? tr("Đăng nhập bằng email", "Sign in with email") : tr("Đăng ký bằng email", "Sign up with email")}</button>
              </form>
              {mode === "in" && (
                <button
                  type="button"
                  className="acc-switch"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    const ok = await resetPassword(email);
                    setBusy(false);
                    if (ok) openSnackbar({ text: tr("Đã gửi email đặt lại mật khẩu. Hãy kiểm tra hộp thư", "Password reset email sent. Check your inbox"), type: "success", duration: 3200 });
                  }}
                >
                  {tr("Quên mật khẩu? Gửi email đặt lại", "Forgot password? Send reset email")}
                </button>
              )}
<button type="button" className="acc-switch" onClick={() => setMode(mode === "in" ? "new" : "in")}>
                {mode === "in" ? tr("Chưa có tài khoản? Đăng ký", "No account yet? Sign up") : tr("Đã có tài khoản? Đăng nhập", "Have an account? Sign in")}
              </button>
              <p className="acc-note">{tr("Khi đăng nhập hoặc đăng ký, bạn đồng ý với ", "By signing in or signing up you agree to the ")}<button type="button" className="acc-link" onClick={() => { setOpen(false); navigate("/quyen-rieng-tu"); }}>{tr("chính sách quyền riêng tư", "privacy policy")}</button>{tr(" và ", " and ")}<button type="button" className="acc-link" onClick={() => { setOpen(false); navigate("/dieu-khoan"); }}>{tr("điều khoản sử dụng", "terms of use")}</button>.</p>
            </React.Fragment>
          )}
        </div>
      </Sheet>
    </React.Fragment>
  );
};
