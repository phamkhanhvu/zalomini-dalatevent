/**
 * Tài khoản DalatEvent: dùng chung Firebase Auth với trò chơi tại /game/ (cùng dự án, cùng UID).
 * Thư viện Firebase chỉ được tải khi người dùng mở phần tài khoản, hoặc khi máy này đã từng đăng nhập.
 * Chỉ đọc/ghi đúng một tài liệu: plans/{uid} (lịch trình). Không đụng tới dữ liệu của trò chơi.
 */
import type { Auth, User } from "firebase/auth";
import type { Firestore } from "firebase/firestore/lite";
import { IS_NATIVE, storage } from "../utils/device";
import { readPlan, replacePlan } from "../utils/plan";
import { readSaved, replaceSaved, SAVED_EVENT } from "../utils/saved";
import { cleanCloud, reconcile, toCloud } from "../utils/sync";

export interface AccountState {
  /** off: chưa tải; loading: đang tải; out: chưa đăng nhập; in: đã đăng nhập */
  status: "off" | "loading" | "out" | "in";
  name: string;
  email: string;
  syncing: boolean;
  syncedAt: number;
  error: string;
}

const META_KEY = "dalatevent.sync.v1";
let state: AccountState = { status: "off", name: "", email: "", syncing: false, syncedAt: 0, error: "" };
const subs = new Set<() => void>();
const set = (patch: Partial<AccountState>) => {
  state = { ...state, ...patch };
  subs.forEach((fn) => fn());
};
export const getAccount = () => state;
export const onAccount = (fn: () => void) => {
  subs.add(fn);
  return () => {
    subs.delete(fn);
  };
};

interface Meta { uid: string; dirty: boolean; syncedAt: number }
const readMeta = (): Meta | null => {
  try {
    const m = JSON.parse(storage.get(META_KEY) || "null");
    return m && typeof m.uid === "string" ? m : null;
  } catch (e) {
    return null;
  }
};
const writeMeta = (m: Meta | null) => storage.set(META_KEY, JSON.stringify(m));
/** Máy này đã từng nối với một tài khoản: tải Firebase ngay khi mở trang để đồng bộ */
export const wasLinked = () => !!readMeta();

let auth: Auth | null = null;
let db: Firestore | null = null;
let user: User | null = null;
let loading: Promise<void> | null = null;
let applying = false;
let timer = 0;

const ERRORS: Record<string, string> = {
  "auth/invalid-email": "Email chưa đúng định dạng.",
  "auth/invalid-credential": "Email hoặc mật khẩu chưa đúng.",
  "auth/wrong-password": "Email hoặc mật khẩu chưa đúng.",
  "auth/user-not-found": "Chưa có tài khoản với email này.",
  "auth/email-already-in-use": "Email này đã có tài khoản. Hãy đăng nhập.",
  "auth/weak-password": "Mật khẩu cần ít nhất 6 ký tự.",
  "auth/too-many-requests": "Thử quá nhiều lần. Hãy đợi vài phút rồi thử lại.",
  "auth/network-request-failed": "Mất kết nối mạng. Hãy thử lại.",
  "auth/popup-closed-by-user": "",
  "auth/user-mismatch": "Tài khoản vừa chọn không trùng với tài khoản đang đăng nhập.",
  "auth/requires-recent-login": "Cần xác nhận lại danh tính. Hãy thử lại.",
  "auth/missing-password": "Hãy nhập mật khẩu.",
  "auth/cancelled-popup-request": "",
};
const message = (e: unknown) => {
  const code = (e as { code?: string })?.code || "";
  return code in ERRORS ? ERRORS[code] : "Chưa làm được, hãy thử lại sau.";
};

const local = () => ({ programIds: readSaved(), items: readPlan() });

async function pull() {
  if (!db || !user) return;
  const uid = user.uid;
  set({ syncing: true, error: "" });
  try {
    const { doc, getDoc, setDoc } = await import("firebase/firestore/lite");
    const ref = doc(db, "plans", uid);
    const snap = await getDoc(ref);
    const remote = snap.exists() ? cleanCloud(snap.data()) : null;
    const meta = readMeta();
    const linked = !!meta && meta.uid === uid;
    const r = reconcile(local(), remote, { linked, dirty: linked ? meta!.dirty : false });
    if (r.changedLocal) {
      applying = true;
      try {
        replaceSaved(r.next.programIds);
        replacePlan(r.next.items.filter((x) => !x.programId));
      } finally {
        applying = false;
      }
    }
    const now = Date.now();
    if (r.push) await setDoc(ref, toCloud(local(), now));
    if (user && user.uid === uid) {
      writeMeta({ uid, dirty: false, syncedAt: now });
      set({ syncing: false, syncedAt: now });
    }
  } catch (e) {
    set({ syncing: false, error: "Chưa đồng bộ được. Lịch trình vẫn nằm trên máy này." });
  }
}

async function push() {
  if (!db || !user) return;
  const uid = user.uid;
  set({ syncing: true, error: "" });
  try {
    const { doc, setDoc } = await import("firebase/firestore/lite");
    const now = Date.now();
    await setDoc(doc(db, "plans", uid), toCloud(local(), now));
    writeMeta({ uid, dirty: false, syncedAt: now });
    set({ syncing: false, syncedAt: now });
  } catch (e) {
    set({ syncing: false, error: "Chưa đồng bộ được. Sẽ thử lại khi bạn mở lại trang." });
  }
}

function onLocalChange() {
  if (applying || !user) return;
  const meta = readMeta();
  if (meta && meta.uid === user.uid) writeMeta({ ...meta, dirty: true });
  window.clearTimeout(timer);
  timer = window.setTimeout(push, 1500);
}

/** Tải Firebase và theo dõi trạng thái đăng nhập. Gọi nhiều lần cũng chỉ tải một lần. */
export function loadAccount(): Promise<void> {
  if (loading) return loading;
  set({ status: "loading" });
  loading = (async () => {
    try {
      const [{ initializeApp }, authMod, { getFirestore }, { FB_CONFIG }] = await Promise.all([import("firebase/app"), import("firebase/auth"), import("firebase/firestore/lite"), import("./firebase-config")]);
      const app = initializeApp(FB_CONFIG);
      auth = authMod.getAuth(app);
      db = getFirestore(app);
      window.addEventListener(SAVED_EVENT, onLocalChange);
      await new Promise<void>((resolve) => {
        authMod.onAuthStateChanged(auth!, (u) => {
          user = u;
          if (u) {
            set({ status: "in", name: u.displayName || "", email: u.email || "", error: "" });
            pull();
          } else {
            set({ status: "out", name: "", email: "", syncing: false, syncedAt: 0 });
          }
          resolve();
        });
      });
    } catch (e) {
      loading = null;
      set({ status: "off", error: "Chưa tải được phần tài khoản. Hãy kiểm tra mạng rồi thử lại." });
    }
  })();
  return loading;
}

async function run(fn: (m: typeof import("firebase/auth"), a: Auth) => Promise<unknown>) {
  await loadAccount();
  if (!auth) return false;
  set({ error: "" });
  try {
    await fn(await import("firebase/auth"), auth);
    return true;
  } catch (e) {
    set({ error: message(e) });
    return false;
  }
}

/** Đăng nhập Google bằng cửa sổ bật lên; trong app cài trên máy không dùng được nên ẩn nút này */
export const CAN_GOOGLE = !IS_NATIVE;
export const signInGoogle = () => run((m, a) => m.signInWithPopup(a, new m.GoogleAuthProvider()));
export const signInEmail = (email: string, password: string) => run((m, a) => m.signInWithEmailAndPassword(a, email.trim(), password));
export const registerEmail = (email: string, password: string) => run((m, a) => m.createUserWithEmailAndPassword(a, email.trim(), password));

/** Đăng xuất: lịch trình vẫn ở lại trên máy này, chỉ ngừng đồng bộ */
export async function signOutAccount() {
  window.clearTimeout(timer);
  writeMeta(null);
  await run((m, a) => m.signOut(a));
}

/** Xóa bản lịch trình đã lưu trên tài khoản (không xóa tài khoản, không đụng dữ liệu trò chơi), rồi đăng xuất */
export async function wipeCloud(): Promise<boolean> {
  if (!db || !user) return false;
  window.clearTimeout(timer);
  try {
    const { doc, deleteDoc } = await import("firebase/firestore/lite");
    await deleteDoc(doc(db, "plans", user.uid));
  } catch (e) {
    set({ error: "Chưa xóa được bản trên tài khoản. Hãy thử lại." });
    return false;
  }
  await signOutAccount();
  return true;
}

/** Tài khoản này đăng nhập bằng cách nào: quyết định bước xác nhận lại trước khi xóa */
export function deleteNeeds(): "google" | "password" | "web-only" {
  const ids = (user?.providerData || []).map((p) => p.providerId);
  if (ids.includes("password")) return "password";
  return CAN_GOOGLE ? "google" : "web-only";
}

/**
 * Xóa hẳn tài khoản theo yêu cầu của chính người dùng. Thứ tự:
 * 1. Xác nhận lại danh tính trước (để không rơi vào cảnh đã xóa dữ liệu mà tài khoản còn).
 * 2. Xóa dữ liệu của chính họ: lịch trình, tiến trình trò chơi, dòng trên bảng xếp hạng, vị trí trực tuyến, các khoản hoàn xu.
 *    Rules chỉ cho mỗi người xóa dữ liệu của chính mình. Gian hàng trong trò chơi không xóa được từ phía người dùng.
 * 3. Xóa tài khoản đăng nhập.
 * Lịch trình trên máy này được giữ lại.
 */
export async function deleteAccount(password: string): Promise<boolean> {
  if (!auth || !db || !user) return false;
  const u = user;
  const uid = u.uid;
  window.clearTimeout(timer);
  set({ error: "" });
  try {
    const m = await import("firebase/auth");
    const need = deleteNeeds();
    if (need === "web-only") {
      set({ error: "Tài khoản Google cần xóa trên website dalatevent.com (mục Lịch trình)." });
      return false;
    }
    if (need === "password") await m.reauthenticateWithCredential(u, m.EmailAuthProvider.credential(u.email || "", password));
    else await m.reauthenticateWithPopup(u, new m.GoogleAuthProvider());

    const { doc, deleteDoc } = await import("firebase/firestore/lite");
    try {
      await Promise.all(["plans", "saves", "board"].map((c) => deleteDoc(doc(db!, c, uid))));
    } catch (e) {
      set({ error: "Chưa xóa được dữ liệu nên tài khoản vẫn được giữ nguyên. Hãy kiểm tra mạng rồi thử lại." });
      return false;
    }
    // Dữ liệu thời gian thực của trò chơi: cố gắng xóa, không chặn việc xóa tài khoản nếu lỗi
    try {
      const r = await import("firebase/database");
      const { getApp } = await import("firebase/app");
      const rt = r.getDatabase(getApp());
      await r.remove(r.ref(rt, "presence/" + uid)).catch(() => undefined);
      const pay = await r.get(r.ref(rt, "payouts/" + uid)).catch(() => null);
      const keys = pay && pay.exists() ? Object.keys(pay.val() || {}) : [];
      await Promise.all(keys.map((k) => r.remove(r.ref(rt, "payouts/" + uid + "/" + k)).catch(() => undefined)));
    } catch (e) {
      /* bỏ qua */
    }
    writeMeta(null);
    await m.deleteUser(u);
    return true;
  } catch (e) {
    set({ error: message(e) });
    return false;
  }
}
