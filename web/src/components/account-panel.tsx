import React, { FC, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Sheet, useSnackbar } from "../ui";
import { CAN_GOOGLE, getAccount, loadAccount, onAccount, registerEmail, signInEmail, signInGoogle, signOutAccount, wasLinked, wipeCloud } from "../platform/account";

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

  // Máy đã từng đăng nhập thì tải phần tài khoản ngay để đồng bộ; chưa thì chờ người dùng bấm
  useEffect(() => {
    if (wasLinked()) loadAccount();
  }, []);

  const openSheet = () => {
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
            <React.Fragment><b>Đăng nhập để đồng bộ</b><i>Xem lịch trình này trên máy khác</i></React.Fragment>
          )}
        </span>
        <span className="acc-go">{signedIn ? "Tài khoản" : "Đăng nhập"}</span>
      </button>

      <Sheet visible={open} onClose={() => setOpen(false)}>
        <div className="ps acc">
          {acc.status === "loading" || acc.status === "off" ? (
            <p className="acc-note">{acc.error || "Đang tải…"}</p>
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
            </React.Fragment>
          ) : (
            <React.Fragment>
              <h2 className="ps-title">{mode === "in" ? "Đăng nhập" : "Tạo tài khoản"}</h2>
              <p className="ps-desc">Dùng chung tài khoản với trò chơi DalatEvent. Chúng tôi chỉ lưu danh sách mục bạn đã thêm vào lịch trình.</p>
              {CAN_GOOGLE && (
                <button type="button" className="btn btn-ink btn-wide" disabled={busy} onClick={() => act(signInGoogle)}>Tiếp tục với Google</button>
              )}
              <form
                className="acc-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  act(() => (mode === "in" ? signInEmail(email, password) : registerEmail(email, password)));
                }}
              >
                <label>Email<input type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
                <label>Mật khẩu<input type="password" required minLength={6} autoComplete={mode === "in" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
                {acc.error && <p className="acc-err" role="alert">{acc.error}</p>}
                <button type="submit" className={"btn btn-wide " + (CAN_GOOGLE ? "btn-line" : "btn-ink")} disabled={busy}>{busy ? "Đang xử lý…" : mode === "in" ? "Đăng nhập bằng email" : "Tạo tài khoản"}</button>
              </form>
              <button type="button" className="acc-switch" onClick={() => setMode(mode === "in" ? "new" : "in")}>
                {mode === "in" ? "Chưa có tài khoản? Tạo tài khoản" : "Đã có tài khoản? Đăng nhập"}
              </button>
              <p className="acc-note">Khi đăng nhập, bạn đồng ý với <button type="button" className="acc-link" onClick={() => { setOpen(false); navigate("/quyen-rieng-tu"); }}>chính sách quyền riêng tư</button>.</p>
            </React.Fragment>
          )}
        </div>
      </Sheet>
    </React.Fragment>
  );
};
