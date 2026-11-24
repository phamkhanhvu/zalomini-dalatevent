/**
 * Tài khoản DalatEvent: dùng chung Firebase Auth với trò chơi tại /game/ (cùng dự án, cùng UID).
 * Thư viện Firebase chỉ được tải khi người dùng mở phần tài khoản, hoặc khi máy này đã từng đăng nhập.
 * Chỉ đọc/ghi đúng một tài liệu: plans/{uid} (lịch trình). Không đụng tới dữ liệu của trò chơi.
 */
import type { Auth, User } from "firebase/auth";
import type { Firestore } from "firebase/firestore/lite";
import { registerPlugin } from "@capacitor/core";
import { IS_NATIVE, storage } from "../utils/device";
import { readPlan, replacePlan } from "../utils/plan";
import { readSaved, replaceSaved, SAVED_EVENT } from "../utils/saved";
import { cleanCloud, reconcile, toCloud } from "../utils/sync";
import { cleanStamps, unionStamps } from "../utils/passport";
import { readStamps, setStamps } from "../utils/stamps";

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
  "auth/missing-email": "Hãy nhập email trước.",
  "auth/cancelled-popup-request": "",
};
const message = (e: unknown) => {
  const code = (e as { code?: string })?.code || "";
  return code in ERRORS ? ERRORS[code] : "Chưa làm được, hãy thử lại sau.";
};

const local = () => ({ programIds: readSaved(), items: readPlan() });
/** Bản ghi lên tài khoản: lịch trình, kèm dấu mộc nếu có (dấu chỉ thêm, không bao giờ bớt) */
const cloudDoc = (now: number) => {
  const stamps = readStamps();
  return stamps.length ? { ...toCloud(local(), now), stamps } : toCloud(local(), now);
};

async function pull() {
  if (!db || !user) return;
  const uid = user.uid;
  set({ syncing: true, error: "" });
  try {
    const { doc, getDoc, setDoc } = await import("firebase/firestore/lite");
    const ref = doc(db, "plans", uid);
    const snap = await getDoc(ref);
    const remote = snap.exists() ? cleanCloud(snap.data()) : null;
    const remoteStamps = snap.exists() ? cleanStamps(snap.data().stamps) : [];
    const mine = readStamps();
    const allStamps = unionStamps(mine, remoteStamps);
    if (allStamps.length !== mine.length) setStamps(allStamps, true);
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
    if (r.push || allStamps.length !== remoteStamps.length) await setDoc(ref, cloudDoc(now));
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
    await setDoc(doc(db, "plans", uid), cloudDoc(now));
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
      // Trong app cài trên máy, getAuth() cố tải khung đăng nhập bật lên của Google và có thể treo;
      // ở đó chỉ dùng đăng nhập email nên khởi tạo bản gọn, lưu phiên bằng IndexedDB.
      auth = IS_NATIVE ? authMod.initializeAuth(app, { persistence: authMod.indexedDBLocalPersistence }) : authMod.getAuth(app);
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

/**
 * Đăng nhập Google: trên web dùng cửa sổ bật lên; trong app iOS dùng khung đăng nhập gốc của máy
 * (plugin @capacitor-firebase/authentication, chỉ lấy chứng thực rồi đăng nhập bằng Firebase JS như web).
 * Apple: chỉ có trong app iOS (Apple yêu cầu khi app có đăng nhập Google).
 */
type NativeCred = { credential?: { idToken?: string; accessToken?: string; nonce?: string; authorizationCode?: string } };
type NativeAuthPlugin = { signInWithGoogle(): Promise<NativeCred>; signInWithApple(): Promise<NativeCred>; signOut(): Promise<void> };
const NativeAuth = IS_NATIVE ? registerPlugin<NativeAuthPlugin>("FirebaseAuthentication") : null;
export const CAN_GOOGLE = true;
export const CAN_APPLE = IS_NATIVE;
let appleCode = "";

class Cancelled extends Error {}
async function nativeCredential(m: typeof import("firebase/auth"), kind: "google" | "apple") {
  try {
    if (kind === "google") {
      const r = await NativeAuth!.signInWithGoogle();
      return m.GoogleAuthProvider.credential(r.credential?.idToken || null, r.credential?.accessToken || null);
    }
    const r = await NativeAuth!.signInWithApple();
    appleCode = r.credential?.authorizationCode || "";
    return new m.OAuthProvider("apple.com").credential({ idToken: r.credential?.idToken || "", rawNonce: r.credential?.nonce || undefined });
  } catch (e) {
    const t = String((e as { message?: string; code?: string })?.message || "") + String((e as { code?: string })?.code || "");
    if (/cancel|1001|-5/i.test(t)) throw new Cancelled();
    throw e;
  }
}
async function signInWith(kind: "google" | "apple") {
  await loadAccount();
  if (!auth) return false;
  set({ error: "" });
  try {
    const m = await import("firebase/auth");
    if (!IS_NATIVE) await m.signInWithPopup(auth, new m.GoogleAuthProvider());
    else await m.signInWithCredential(auth, await nativeCredential(m, kind));
    return true;
  } catch (e) {
    if (!(e instanceof Cancelled)) set({ error: message(e) });
    return false;
  }
}
export const signInGoogle = () => signInWith("google");
export const signInApple = () => signInWith("apple");
export const signInEmail = (email: string, password: string) => run((m, a) => m.signInWithEmailAndPassword(a, email.trim(), password));
export const registerEmail = (email: string, password: string) => run((m, a) => m.createUserWithEmailAndPassword(a, email.trim(), password));

/** Gửi email đặt lại mật khẩu (Firebase gửi thư, không qua máy chủ của DalatEvent) */
export const resetPassword = (email: string) => run((m, a) => m.sendPasswordResetEmail(a, email.trim()));

/** Đăng xuất: lịch trình vẫn ở lại trên máy này, chỉ ngừng đồng bộ */
export async function signOutAccount() {
  window.clearTimeout(timer);
  writeMeta(null);
  if (NativeAuth) await NativeAuth.signOut().catch(() => undefined);
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
export function deleteNeeds(): "google" | "apple" | "password" | "web-only" {
  const ids = (user?.providerData || []).map((p) => p.providerId);
  if (ids.includes("password")) return "password";
  if (ids.includes("apple.com") && IS_NATIVE) return "apple";
  if (ids.includes("google.com")) return "google";
  return "web-only";
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
      set({ error: "Tài khoản này cần xóa trong app DalatEvent trên iPhone (mục Lịch trình)." });
      return false;
    }
    if (need === "password") await m.reauthenticateWithCredential(u, m.EmailAuthProvider.credential(u.email || "", password));
    else if (IS_NATIVE) await m.reauthenticateWithCredential(u, await nativeCredential(m, need));
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
    // Tài khoản Apple: thu hồi quyền đăng nhập Apple (Apple yêu cầu khi xóa tài khoản); lỗi thì vẫn xóa tiếp
    if (need === "apple" && appleCode) await m.revokeAccessToken(auth, appleCode).catch(() => undefined);
    await m.deleteUser(u);
    return true;
  } catch (e) {
    set({ error: message(e) });
    return false;
  }
}

/* ---------- Trang quản trị nội dung ---------- */
export const currentUid = () => (user ? user.uid : "");

/** Tài khoản đang đăng nhập có trong danh sách quản trị không (Firestore: admins/{uid}, do chủ dự án tạo trong Console) */
export async function isAdmin(): Promise<boolean> {
  if (!db || !user) return false;
  try {
    const { doc, getDoc } = await import("firebase/firestore/lite");
    return (await getDoc(doc(db, "admins", user.uid))).exists();
  } catch (e) {
    return false;
  }
}

export interface CmsDoc { json: string; savedAt: number; byName: string }
/** Bản quản trị viên đã lưu gần nhất cho một tệp (có thể chưa được đưa vào repo) */
export async function readCms(file: string): Promise<CmsDoc | null> {
  if (!db) return null;
  try {
    const { doc, getDoc } = await import("firebase/firestore/lite");
    const snap = await getDoc(doc(db, "cms", file));
    const d = snap.exists() ? snap.data() : null;
    return d && typeof d.json === "string" && typeof d.savedAt === "number" ? { json: d.json, savedAt: d.savedAt, byName: String(d.byName || "") } : null;
  } catch (e) {
    return null;
  }
}
/** Lưu nội dung để tác vụ trên GitHub nhận về. Rules chỉ cho quản trị viên ghi. */
export async function writeCms(file: string, json: string): Promise<number> {
  if (!db || !user) throw new Error("Chưa đăng nhập");
  const { doc, setDoc } = await import("firebase/firestore/lite");
  const savedAt = Date.now();
  await setDoc(doc(db, "cms", file), { json, savedAt, by: user.uid, byName: (user.displayName || "Quản trị viên").slice(0, 40) });
  return savedAt;
}

/** Cho các phần khác (ưu đãi) dùng chung kết nối đã mở. null nếu chưa tải hoặc chưa đăng nhập. */
export const session = () => (db && user ? { db, uid: user.uid, name: (user.displayName || "").slice(0, 40) } : null);
