import React, { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Sheet, useSnackbar } from "../ui";
import { CAN_GOOGLE, deleteAccount, deleteNeeds, getAccount, loadAccount, onAccount, registerEmail, resetPassword, signInEmail, signInGoogle, signOutAccount, wasLinked, wipeCloud } from "../platform/account";

function useAccount() {
  const [, force] = useState(0);
  useEffect(() => onAccount(() => force((n) => n + 1)), []);
  return getAccount();
}

/** Dải tài khoản trên trang Lịch trình: đăng nhập để đồng bộ giữa các máy */
export const AccountPanel: FC = () => {
  const acc = useAccount();
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
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

  const openSheet = () => {
    setDeleting(false);
    setAgree(false);
    setConfirmWipe(false);
    setPassword("");
    setOpen(true);
    loadAccount();
  };
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
  const who = acc.name || acc.email || "tài khoản của bạn";

  return (
    <React.Fragment>
      <button type="button" className={"acc-strip" + (signedIn ? " is-in" : "")} onClick={openSheet}>
        <span className="acc-dot" aria-hidden="true" />
        <span className="acc-text">
          {signedIn ? (
            <React.Fragment><b>{acc.syncing ? "Đang đồng bộ…" : acc.error ? "Chưa đồng bộ được" : "Đã đồng bộ"}</b><i>{who}</i></React.Fragment>
          ) : (
            <React.Fragment><b>Đăng nhập hoặc đăng ký</b><i>Để xem lịch trình này trên máy khác</i></React.Fragment>
          )}
        </span>
        <span className="acc-go">{signedIn ? "Tài khoản" : "Mở"}</span>
      </button>

      <Sheet visible={open} onClose={() => setOpen(false)}>
        <div className="ps acc">
          {acc.status === "loading" || acc.status === "off" ? (
            <p className="acc-note">{acc.error || "Đang tải…"}</p>
          ) : signedIn && deleting ? (
            <form
              className="acc-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (!agree) return;
                act(async () => {
                  const ok = await deleteAccount(password);
                  if (ok) openSnackbar({ text: "Đã xóa tài khoản. Lịch trình trên máy này vẫn được giữ", duration: 3200 });
                  return ok;
                });
              }}
            >
              <h2 className="ps-title">Xóa tài khoản</h2>
              <p className="ps-desc">Tài khoản <b>{who}</b> sẽ bị xóa hẳn và <b>không khôi phục được</b>. Những thứ bị xóa cùng:</p>
              <ul className="acc-list">
                <li>Lịch trình đã đồng bộ trên tài khoản</li>
                <li>Toàn bộ tiến trình trong trò chơi DalatEvent và dòng của bạn trên bảng xếp hạng</li>
              </ul>
              <p className="acc-note">Lịch trình trên máy này vẫn được giữ. Gian hàng bạn đang sở hữu trong trò chơi không tự xóa được; muốn xóa hãy liên hệ theo trang chính sách quyền riêng tư.</p>
              {deleteNeeds() === "password" && (
                <label>Nhập mật khẩu để xác nhận<input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
              )}
              {deleteNeeds() === "google" && <p className="acc-note">Bấm nút xóa sẽ mở cửa sổ Google để bạn xác nhận lại tài khoản.</p>}
              <label className="acc-check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /><span>Tôi hiểu việc này không hoàn tác được</span></label>
              {acc.error && <p className="acc-err" role="alert">{acc.error}</p>}
              <div className="ps-actions">
                <button type="button" className="btn btn-line" disabled={busy} onClick={() => setDeleting(false)}>Quay lại</button>
                <button type="submit" className="btn btn-danger" disabled={busy || !agree}>{busy ? "Đang xóa…" : "Xóa hẳn tài khoản"}</button>
              </div>
            </form>
          ) : signedIn ? (
            <React.Fragment>
              <h2 className="ps-title">Tài khoản</h2>
              <p className="ps-desc">Đang đăng nhập bằng <b>{who}</b>. Lịch trình của bạn được lưu trên tài khoản này và tự cập nhật giữa các máy.</p>
              {acc.error && <p className="acc-err" role="alert">{acc.error}</p>}
              <div className="ps-actions">
                <button type="button" className="btn btn-line" disabled={busy} onClick={() => act(async () => { await signOutAccount(); openSnackbar({ text: "Đã đăng xuất. Lịch trình vẫn còn trên máy này", duration: 2600 }); return true; })}>Đăng xuất</button>
                {!confirmWipe ? (
                  <button type="button" className="btn btn-line" onClick={() => setConfirmWipe(true)}>Xóa lịch trình trên tài khoản</button>
                ) : (
                  <button type="button" className="btn btn-danger" disabled={busy} onClick={() => act(async () => { const ok = await wipeCloud(); if (ok) openSnackbar({ text: "Đã xóa bản trên tài khoản và đăng xuất", duration: 2600 }); setConfirmWipe(false); return ok; })}>Bấm lần nữa để xóa</button>
                )}
              </div>
              <p className="acc-note">Xóa lịch trình trên tài khoản không xóa tài khoản và không ảnh hưởng tiến trình trong trò chơi. Bản trên máy này vẫn được giữ.</p>
              <button type="button" className="acc-switch acc-del" onClick={() => { setDeleting(true); setAgree(false); setPassword(""); }}>Xóa tài khoản</button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <div className="acc-tabs" role="tablist" aria-label="Đăng nhập hoặc đăng ký">
                <button type="button" role="tab" aria-selected={mode === "in"} className={mode === "in" ? "on" : ""} onClick={() => setMode("in")}>Đăng nhập</button>
                <button type="button" role="tab" aria-selected={mode === "new"} className={mode === "new" ? "on" : ""} onClick={() => setMode("new")}>Đăng ký</button>
              </div>
              <h2 className="ps-title">{mode === "in" ? "Đăng nhập" : "Đăng ký tài khoản mới"}</h2>
              <p className="ps-desc">Dùng chung tài khoản với trò chơi DalatEvent. Chúng tôi chỉ lưu danh sách mục bạn đã thêm vào lịch trình.</p>
              {CAN_GOOGLE && (
                <button type="button" className="btn btn-ink btn-wide" disabled={busy} onClick={() => act(signInGoogle)}>{mode === "in" ? "Đăng nhập bằng Google" : "Đăng ký bằng Google"}</button>
              )}
              <form
                className="acc-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  act(() => (mode === "in" ? signInEmail(email, password) : registerEmail(email, password)));
                }}
              >
                <label>Email<input type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
                <label>{mode === "in" ? "Mật khẩu" : "Đặt mật khẩu (ít nhất 6 ký tự)"}<input type="password" required minLength={6} autoComplete={mode === "in" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
                {acc.error && <p className="acc-err" role="alert">{acc.error}</p>}
                <button type="submit" className={"btn btn-wide " + (CAN_GOOGLE ? "btn-line" : "btn-ink")} disabled={busy}>{busy ? "Đang xử lý…" : mode === "in" ? "Đăng nhập bằng email" : "Đăng ký bằng email"}</button>
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
                    if (ok) openSnackbar({ text: "Đã gửi email đặt lại mật khẩu. Hãy kiểm tra hộp thư", type: "success", duration: 3200 });
                  }}
                >
                  Quên mật khẩu? Gửi email đặt lại
                </button>
              )}
<button type="button" className="acc-switch" onClick={() => setMode(mode === "in" ? "new" : "in")}>
                {mode === "in" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
              </button>
              <p className="acc-note">Khi đăng nhập hoặc đăng ký, bạn đồng ý với <button type="button" className="acc-link" onClick={() => { setOpen(false); navigate("/quyen-rieng-tu"); }}>chính sách quyền riêng tư</button>.</p>
            </React.Fragment>
          )}
        </div>
      </Sheet>
    </React.Fragment>
  );
};
