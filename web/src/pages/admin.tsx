import React, { FC, useEffect, useMemo, useState } from "react";
// @ts-ignore — luật kiểm tra dùng chung với tác vụ trên GitHub
import { validate } from "../../../scripts/validate-core.mjs";
import { useSnackbar } from "../ui";
import { openAccount } from "../components/account-panel";
import { DealsEditor } from "../components/admin-deals";
import { currentUid, getAccount, isAdmin, loadAccount, onAccount, readCms, writeCms } from "../platform/account";
import type { EventRecord, EventsDoc, HappeningDoc, HappeningItem, ShowsDoc } from "../data/store";

const RAW = "https://raw.githubusercontent.com/phamkhanhvu/zalomini-dalatevent/main/data/";
const DISPATCH = "https://api.github.com/repos/phamkhanhvu/zalomini-dalatevent/actions/workflows/cms.yml/dispatches";
const TOKEN_KEY = "dalatevent.ghToken";
const readToken = () => {
  try {
    return window.localStorage.getItem(TOKEN_KEY) || "";
  } catch (e) {
    return "";
  }
};

/**
 * Yêu cầu GitHub chạy ngay tác vụ nhận nội dung, thay vì chờ lịch 10 phút (lịch của GitHub hay trễ).
 * Cần một token do chính quản trị viên tạo, chỉ có quyền Actions của đúng repo này; token chỉ nằm trong trình duyệt của họ.
 */
async function publishNow(token: string): Promise<"ok" | "denied" | "error"> {
  try {
    const res = await fetch(DISPATCH, { method: "POST", headers: { authorization: "Bearer " + token, accept: "application/vnd.github+json", "content-type": "application/json", "x-github-api-version": "2022-11-28" }, body: JSON.stringify({ ref: "main" }) });
    return res.status === 204 ? "ok" : res.status === 401 || res.status === 403 || res.status === 404 ? "denied" : "error";
  } catch (e) {
    return "error";
  }
}
type FileId = "happening" | "shows" | "events";
interface Status { savedAt: number; status: "applied" | "rejected"; at: string; by: string; errors?: string[] }
interface Loaded { events: EventsDoc; shows: ShowsDoc; happening: HappeningDoc; status: Partial<Record<FileId, Status>>; pending: Partial<Record<FileId, number>> }
type HapItem = HappeningItem & { manual?: boolean };

const STATUS_LABEL: Record<string, string> = { published: "Đang công bố", postponed: "Tạm hoãn", cancelled: "Đã hủy", draft: "Nháp (không hiện trên trang)", pending: "Chờ duyệt (không hiện)", completed: "Đã xong" };
const dm = (d: string) => d.slice(8, 10) + "." + d.slice(5, 7);
const dmy = (d: string) => dm(d) + "." + d.slice(0, 4);
const whenOf = (a: string, b: string, venue: string) => (a === b ? dmy(a) : a.slice(0, 4) === b.slice(0, 4) && a.slice(5, 7) === b.slice(5, 7) ? a.slice(8, 10) + " — " + dmy(b) : dm(a) + " — " + dmy(b)) + (venue ? " · " + venue : "");
const pad = (n: number) => String(n).padStart(2, "0");
const nowIso = () => {
  const d = new Date(Date.now() + 7 * 3600000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}+07:00`;
};
const clean = (s: string) => s.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();

async function getJson<T>(name: string): Promise<T> {
  const res = await fetch(RAW + name + "?t=" + Date.now(), { cache: "no-store" });
  if (!res.ok) throw new Error(name + ": HTTP " + res.status);
  return res.json();
}

/** Tải bản mới nhất trong repo; tệp nào quản trị viên đã lưu mà repo chưa nhận thì dùng bản đã lưu để sửa tiếp */
async function loadAll(): Promise<Loaded> {
  const [events, shows, happening, statusDoc] = await Promise.all([
    getJson<EventsDoc>("events.json"),
    getJson<ShowsDoc>("shows.json"),
    getJson<HappeningDoc>("happening.json"),
    getJson<{ files?: Partial<Record<FileId, Status>> }>("cms-status.json").catch(() => ({ files: {} })),
  ]);
  const out: Loaded = { events, shows, happening, status: statusDoc.files || {}, pending: {} };
  for (const f of ["happening", "shows", "events"] as FileId[]) {
    const c = await readCms(f);
    if (!c || (out.status[f] && out.status[f]!.savedAt >= c.savedAt)) continue;
    out.pending[f] = c.savedAt;
    try {
      const o = JSON.parse(c.json);
      if (f === "happening" && Array.isArray(o.items)) out.happening = { ...happening, items: o.items };
      if (f === "events" && Array.isArray(o.events)) out.events = { ...events, events: o.events };
      if (f === "shows") {
        const from = (o.stages || []).find((s: { id: string }) => s.id === "sense-acoustic");
        if (from) out.shows = { ...shows, stages: shows.stages.map((s) => (s.id === "sense-acoustic" ? { ...s, items: from.items } : s)) };
      }
    } catch (e) {
      /* bản đã lưu hỏng: dùng bản trong repo */
    }
  }
  return out;
}

const Field: FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="adm-field">{label}{children}</label>
);

const StatusLine: FC<{ file: FileId; data: Loaded; sentAt?: number }> = ({ file, data, sentAt }) => {
  const st = data.status[file];
  const pending = sentAt || data.pending[file];
  const t = (ms: number) => new Date(ms).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
  if (pending) return <p className="adm-status is-wait">Đã lưu lúc {t(pending)}, đang chờ đưa lên trang. Bấm "Tải lại dữ liệu mới nhất" sau vài phút để xem kết quả.</p>;
  if (st?.status === "rejected") return <div className="adm-status is-bad"><b>Lần lưu gần nhất bị từ chối:</b><ul>{(st.errors || []).map((e) => <li key={e}>{e}</li>)}</ul></div>;
  if (st?.status === "applied") return <p className="adm-status is-ok">Lần lưu gần nhất (bởi {st.by}) đã lên trang lúc {st.at.slice(11, 16)} ngày {dmy(st.at.slice(0, 10))}.</p>;
  return null;
};

/* ---------- Sự kiện khác ---------- */
const HappeningEditor: FC<{ data: Loaded; onSave: (file: FileId, doc: unknown, check: Loaded) => Promise<void> }> = ({ data, onSave }) => {
  const [items, setItems] = useState<HapItem[]>(() => data.happening.items.map((x) => ({ ...x })));
  const [open, setOpen] = useState<number | null>(null);
  const set = (i: number, patch: Partial<HapItem>) => setItems((list) => list.map((x, k) => (k === i ? { ...x, ...patch, manual: true } : x)));
  const add = () => {
    const today = nowIso().slice(0, 10);
    setItems((list) => [...list, { title: "", start_date: today, end_date: today, venue: "", when: "", desc: "", manual: true }]);
    setOpen(items.length);
  };
  const save = () => {
    const out = items
      .map((x) => ({ ...x, title: clean(x.title), venue: clean(x.venue || ""), desc: clean(x.desc), when: whenOf(x.start_date, x.end_date, "") }))
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
    const doc = { ...data.happening, items: out };
    return onSave("happening", doc, { ...data, happening: doc });
  };
  return (
    <div className="adm-list">
      <p className="muted small">Các sự kiện ngoài Festival Hoa. Mục bạn nhập ở đây được giữ lại khi hệ thống tự cập nhật mỗi sáng, và tự gỡ sau ngày kết thúc.</p>
      {items.map((it, i) => (
        <div className="adm-card" key={i}>
          <button type="button" className="adm-head" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
            <b>{it.title || "(chưa có tên)"}</b>
            <i>{it.start_date && it.end_date ? whenOf(it.start_date, it.end_date, "") : ""}{it.manual ? " · nhập tay" : " · tự động"}</i>
          </button>
          {open === i && (
            <div className="adm-body">
              <Field label="Tên sự kiện"><input value={it.title} maxLength={120} onChange={(e) => set(i, { title: e.target.value })} /></Field>
              <div className="adm-row">
                <Field label="Từ ngày"><input type="date" value={it.start_date} onChange={(e) => set(i, { start_date: e.target.value, end_date: it.end_date < e.target.value ? e.target.value : it.end_date })} /></Field>
                <Field label="Đến ngày"><input type="date" value={it.end_date} min={it.start_date} onChange={(e) => set(i, { end_date: e.target.value })} /></Field>
              </div>
              <Field label="Địa điểm"><input value={it.venue || ""} maxLength={120} onChange={(e) => set(i, { venue: e.target.value })} /></Field>
              <Field label="Mô tả (1 đến 3 câu)"><textarea rows={4} value={it.desc} maxLength={500} onChange={(e) => set(i, { desc: e.target.value })} /></Field>
              <button type="button" className="btn btn-line adm-del" onClick={() => { if (window.confirm("Gỡ sự kiện này khỏi danh sách?")) { setItems((l) => l.filter((_, k) => k !== i)); setOpen(null); } }}>Gỡ sự kiện này</button>
            </div>
          )}
        </div>
      ))}
      <button type="button" className="btn btn-line" onClick={add}>+ Thêm sự kiện</button>
      <button type="button" className="btn btn-ink btn-wide" onClick={save}>Lưu và đưa lên trang</button>
    </div>
  );
};

/* ---------- Lịch nhạc Sense Acoustic ---------- */
const BandEditor: FC<{ data: Loaded; onSave: (file: FileId, doc: unknown, check: Loaded) => Promise<void> }> = ({ data, onSave }) => {
  const stage = data.shows.stages.find((s) => s.id === "sense-acoustic");
  const [items, setItems] = useState(() => (stage ? stage.items.map((x) => ({ ...x })) : []));
  if (!stage) return <p className="muted">Không tìm thấy lịch Sense Acoustic trong dữ liệu.</p>;
  const set = (i: number, patch: Record<string, string>) => setItems((l) => l.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const save = () => {
    const out = items.map((x) => ({ ...x, title: clean(x.title), note: clean(x.note || ""), time: x.time.trim().replace(/\s*[-–]\s*/, " – ") }));
    const doc = { ...data.shows, stages: data.shows.stages.map((s) => (s.id === "sense-acoustic" ? { ...s, items: out } : s)) };
    return onSave("shows", doc, { ...data, shows: doc });
  };
  return (
    <div className="adm-list">
      <p className="muted small">Lịch band hằng tuần của Sense Acoustic Cafe. Lịch Mây Lang Thang và Lululola được lấy tự động mỗi sáng từ trang của họ nên không sửa ở đây.</p>
      {items.map((it, i) => (
        <div className="adm-card adm-body" key={i}>
          <b>{it.weekday_label}</b>
          <div className="adm-row">
            <Field label="Band"><input value={it.title} maxLength={80} onChange={(e) => set(i, { title: e.target.value })} /></Field>
            <Field label="Giờ (ví dụ 20:00 – 22:00)"><input value={it.time} maxLength={13} onChange={(e) => set(i, { time: e.target.value })} /></Field>
          </div>
          <Field label="Ghi chú"><input value={it.note || ""} maxLength={160} onChange={(e) => set(i, { note: e.target.value })} /></Field>
        </div>
      ))}
      <button type="button" className="btn btn-ink btn-wide" onClick={save}>Lưu và đưa lên trang</button>
    </div>
  );
};

/* ---------- Chương trình Festival ---------- */
const FestivalEditor: FC<{ data: Loaded; onSave: (file: FileId, doc: unknown, check: Loaded) => Promise<void> }> = ({ data, onSave }) => {
  const original = useMemo(() => JSON.stringify(data.events.events), [data]);
  const [events, setEvents] = useState<EventRecord[]>(() => JSON.parse(original));
  const [open, setOpen] = useState<number | null>(null);
  const set = (i: number, patch: Partial<EventRecord>) => setEvents((l) => l.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const setSession = (i: number, n: number, patch: { date?: string; time?: string; edate?: string; etime?: string; all_day?: boolean }) =>
    setEvents((l) =>
      l.map((x, k) => {
        if (k !== i) return x;
        const sessions = x.sessions.map((s, m) => {
          if (m !== n) return s;
          const all = patch.all_day ?? s.all_day;
          const sd = patch.date ?? s.start_at.slice(0, 10);
          const ed = patch.edate ?? s.end_at.slice(0, 10);
          const st = all ? "00:00" : patch.time ?? s.start_at.slice(11, 16);
          const et = all ? "23:59" : patch.etime ?? s.end_at.slice(11, 16);
          return { ...s, all_day: all, start_at: `${sd}T${st}:00+07:00`, end_at: `${ed}T${et}:${all ? "59" : "00"}+07:00` };
        });
        return { ...x, sessions };
      })
    );
  const save = () => {
    const before: EventRecord[] = JSON.parse(original);
    const stamp = nowIso();
    const out = events.map((e, i) => {
      // Chỉ đổi tên địa điểm khi người sửa chọn địa điểm khác; không thì giữ tên chi tiết đang có (ví dụ "Trên mặt hồ Xuân Hương")
      const venue = e.venue_id !== before[i].venue_id ? data.events.venues.find((v) => v.id === e.venue_id) : undefined;
      const next = { ...e, title: clean(e.title), description: clean(e.description), note: e.note ? clean(e.note) : undefined, venue_name: venue ? venue.name : e.venue_name };
      if (!next.note) delete next.note;
      return JSON.stringify(next) === JSON.stringify(before[i]) ? before[i] : { ...next, updated_at: stamp };
    });
    const doc = { ...data.events, events: out };
    return onSave("events", doc, { ...data, events: doc });
  };
  return (
    <div className="adm-list">
      <p className="muted small">Sửa giờ, địa điểm, trạng thái của chương trình Festival. Khi hoãn hoặc hủy, bắt buộc ghi lý do; người đã lưu chương trình sẽ thấy cảnh báo trong Lịch trình. Thêm chương trình mới chưa làm được ở đây.</p>
      {events.map((e, i) => (
        <div className="adm-card" key={e.id}>
          <button type="button" className="adm-head" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
            <b>{e.title}</b>
            <i>{dmy(e.sessions[0].start_at.slice(0, 10))} · {STATUS_LABEL[e.status] || e.status}{e.tentative ? " · dự kiến" : ""}</i>
          </button>
          {open === i && (
            <div className="adm-body">
              <Field label="Tên chương trình"><input value={e.title} maxLength={160} onChange={(ev) => set(i, { title: ev.target.value })} /></Field>
              <Field label="Mô tả"><textarea rows={4} value={e.description} maxLength={800} onChange={(ev) => set(i, { description: ev.target.value })} /></Field>
              <Field label="Địa điểm">
                <select value={e.venue_id || ""} onChange={(ev) => set(i, { venue_id: ev.target.value || null })}>
                  <option value="">(theo tên: {e.venue_name})</option>
                  {data.events.venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </Field>
              {e.sessions.map((s, n) => (
                <div className="adm-session" key={n}>
                  <b>Suất {n + 1}</b>
                  <label className="acc-check"><input type="checkbox" checked={s.all_day} onChange={(ev) => setSession(i, n, { all_day: ev.target.checked })} /><span>Cả ngày (không có giờ cụ thể)</span></label>
                  <div className="adm-row">
                    <Field label="Ngày bắt đầu"><input type="date" value={s.start_at.slice(0, 10)} onChange={(ev) => setSession(i, n, { date: ev.target.value, edate: s.end_at.slice(0, 10) < ev.target.value ? ev.target.value : undefined })} /></Field>
                    {!s.all_day && <Field label="Giờ bắt đầu"><input type="time" value={s.start_at.slice(11, 16)} onChange={(ev) => setSession(i, n, { time: ev.target.value })} /></Field>}
                  </div>
                  <div className="adm-row">
                    <Field label="Ngày kết thúc"><input type="date" value={s.end_at.slice(0, 10)} min={s.start_at.slice(0, 10)} onChange={(ev) => setSession(i, n, { edate: ev.target.value })} /></Field>
                    {!s.all_day && <Field label="Giờ kết thúc"><input type="time" value={s.end_at.slice(11, 16)} onChange={(ev) => setSession(i, n, { etime: ev.target.value })} /></Field>}
                  </div>
                </div>
              ))}
              <Field label="Trạng thái">
                <select value={e.status} onChange={(ev) => set(i, { status: ev.target.value })}>
                  {["published", "postponed", "cancelled", "draft"].map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                </select>
              </Field>
              {(e.status === "postponed" || e.status === "cancelled" || e.note) && (
                <Field label="Ghi chú cho khách (bắt buộc khi hoãn hoặc hủy)"><input value={e.note || ""} maxLength={240} onChange={(ev) => set(i, { note: ev.target.value })} /></Field>
              )}
              <label className="acc-check"><input type="checkbox" checked={e.tentative} onChange={(ev) => set(i, { tentative: ev.target.checked })} /><span>Lịch dự kiến (chưa chốt)</span></label>
            </div>
          )}
        </div>
      ))}
      <button type="button" className="btn btn-ink btn-wide" onClick={save}>Lưu và đưa lên trang</button>
    </div>
  );
};

type TabId = FileId | "deals";
const TABS: { id: TabId; label: string }[] = [
  { id: "happening", label: "Sự kiện khác" },
  { id: "shows", label: "Lịch nhạc Sense" },
  { id: "events", label: "Festival" },
  { id: "deals", label: "Ưu đãi" },
];

/** Trang quản trị nội dung: chỉ tài khoản có trong danh sách quản trị dùng được */
const AdminPage: FC = () => {
  const { openSnackbar } = useSnackbar();
  const [, force] = useState(0);
  useEffect(() => onAccount(() => force((n) => n + 1)), []);
  useEffect(() => {
    loadAccount();
  }, []);
  const acc = getAccount();
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [data, setData] = useState<Loaded | null>(null);
  const [loadErr, setLoadErr] = useState("");
  const [tab, setTab] = useState<TabId>("happening");
  const [errors, setErrors] = useState<string[]>([]);
  const [sent, setSent] = useState<Partial<Record<FileId, number>>>({});
  const [busy, setBusy] = useState(false);
  const [round, setRound] = useState(0);
  const [token, setToken] = useState(readToken);
  const [tokenDraft, setTokenDraft] = useState("");
  const [tokenOpen, setTokenOpen] = useState(false);
  const pushNow = async (quiet = false) => {
    if (!token) return false;
    const r = await publishNow(token);
    if (r === "ok") openSnackbar({ text: "Đã yêu cầu đưa lên trang. Thường xong sau 1 đến 2 phút", type: "success", duration: 3500 });
    else if (!quiet || r === "denied") openSnackbar({ text: r === "denied" ? "GitHub từ chối token (sai, hết hạn hoặc thiếu quyền Actions). Hãy tạo lại token" : "Chưa gọi được GitHub. Nội dung đã lưu, sẽ lên khi lịch tự chạy", duration: 4500 });
    return r === "ok";
  };
  const saveToken = () => {
    const t = tokenDraft.trim();
    if (!/^(github_pat_|ghp_)[A-Za-z0-9_]{20,}$/.test(t)) {
      openSnackbar({ text: "Token chưa đúng dạng (bắt đầu bằng github_pat_)", duration: 3000 });
      return;
    }
    try {
      window.localStorage.setItem(TOKEN_KEY, t);
    } catch (e) {
      /* bỏ qua */
    }
    setToken(t);
    setTokenDraft("");
    setTokenOpen(false);
    openSnackbar({ text: "Đã lưu token trên máy này", type: "success", duration: 2500 });
  };
  const dropToken = () => {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      /* bỏ qua */
    }
    setToken("");
  };

  useEffect(() => {
    setAdmin(null);
    if (acc.status === "in") isAdmin().then(setAdmin);
  }, [acc.status, acc.email]);
  useEffect(() => {
    if (!admin) return;
    setData(null);
    setLoadErr("");
    loadAll().then(setData).catch(() => setLoadErr("Chưa tải được dữ liệu. Hãy kiểm tra mạng rồi thử lại."));
  }, [admin, round]);

  const onSave = async (file: FileId, doc: unknown, check: Loaded) => {
    const r = validate(check.events, check.shows, check.happening) as { errors: string[] };
    setErrors(r.errors);
    if (r.errors.length) {
      openSnackbar({ text: "Chưa lưu được: còn " + r.errors.length + " lỗi cần sửa", duration: 3000 });
      window.scrollTo(0, 0);
      return;
    }
    setBusy(true);
    try {
      const at = await writeCms(file, JSON.stringify(doc));
      setSent((s) => ({ ...s, [file]: at }));
      if (!(await pushNow(true))) openSnackbar({ text: token ? "Đã lưu" : "Đã lưu. Chưa bật \"đưa lên ngay\" nên phải chờ lịch tự chạy", type: "success", duration: 3500 });
    } catch (e) {
      openSnackbar({ text: "Chưa lưu được. Hãy kiểm tra mạng hoặc quyền quản trị", duration: 3500 });
    }
    setBusy(false);
  };

  let body: React.ReactNode;
  if (acc.status === "loading" || acc.status === "off") body = <p className="muted pad">Đang tải…</p>;
  else if (acc.status === "out") body = (
    <div className="empty">
      <h2>Cần đăng nhập</h2>
      <p>Trang này dành cho người quản trị nội dung của DalatEvent.</p>
      <button type="button" className="btn btn-ink" onClick={openAccount}>Đăng nhập</button>
    </div>
  );
  else if (admin === null) body = <p className="muted pad">Đang kiểm tra quyền…</p>;
  else if (!admin) body = (
    <div className="empty">
      <h2>Tài khoản chưa có quyền quản trị</h2>
      <p>Gửi mã dưới đây cho chủ dự án để được cấp quyền:</p>
      <p className="adm-uid">{currentUid()}</p>
    </div>
  );
  else if (loadErr) body = <div className="empty"><p>{loadErr}</p><button type="button" className="btn btn-ink" onClick={() => setRound((n) => n + 1)}>Thử lại</button></div>;
  else if (!data) body = <p className="muted pad">Đang tải dữ liệu mới nhất…</p>;
  else body = (
    <div className={"pad adm" + (busy ? " is-busy" : "")}>
      <div className="filters" role="tablist" aria-label="Phần nội dung">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={"fb" + (tab === t.id ? " on" : "")} onClick={() => { setTab(t.id); setErrors([]); }}>{t.label}</button>
        ))}
      </div>
      {tab !== "deals" && <StatusLine file={tab} data={data} sentAt={sent[tab]} />}
      {errors.length > 0 && <div className="adm-status is-bad" role="alert"><b>Cần sửa trước khi lưu:</b><ul>{errors.map((e) => <li key={e}>{e}</li>)}</ul></div>}
      {tab === "happening" && <HappeningEditor key={"h" + round} data={data} onSave={onSave} />}
      {tab === "shows" && <BandEditor key={"s" + round} data={data} onSave={onSave} />}
      {tab === "events" && <FestivalEditor key={"e" + round} data={data} onSave={onSave} />}
      {tab === "deals" && <DealsEditor key={"d" + round} />}
      <button type="button" className="acc-switch" onClick={() => setRound((n) => n + 1)}>Tải lại dữ liệu mới nhất (bỏ thay đổi chưa lưu)</button>
      {tab !== "deals" && (
        <div className="adm-card adm-body adm-now">
          <b>Đưa lên trang ngay</b>
          {token ? (
            <React.Fragment>
              <p className="muted small">Đã bật trên máy này: mỗi lần lưu, nội dung lên trang sau khoảng 1 đến 2 phút. Bấm nút dưới đây để đưa lên cả nội dung người khác đã lưu.</p>
              <button type="button" className="btn btn-ink" onClick={() => pushNow()}>Đưa lên trang ngay</button>
              <button type="button" className="acc-switch link-left" onClick={dropToken}>Gỡ token khỏi máy này</button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <p className="muted small">Chưa bật. Hiện nội dung đã lưu phải chờ lịch tự chạy của GitHub, có khi rất lâu. Bật một lần trên máy này bằng token GitHub của chủ dự án.</p>
              {!tokenOpen ? (
                <button type="button" className="btn btn-line" onClick={() => setTokenOpen(true)}>Bật bằng token GitHub</button>
              ) : (
                <React.Fragment>
                  <ol className="adm-steps">
                    <li>Mở <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">trang tạo token của GitHub</a> (đăng nhập tài khoản chủ repo).</li>
                    <li>Token name: DalatEvent quan tri. Expiration: chọn thời hạn bạn muốn.</li>
                    <li>Repository access: Only select repositories → chọn zalomini-dalatevent.</li>
                    <li>Permissions → Repository permissions → Actions: Read and write. Không bật quyền nào khác.</li>
                    <li>Generate token, chép dãy bắt đầu bằng github_pat_ rồi dán vào ô dưới.</li>
                  </ol>
                  <Field label="Token (chỉ lưu trong trình duyệt của máy này)"><input type="password" autoComplete="off" value={tokenDraft} onChange={(e) => setTokenDraft(e.target.value)} /></Field>
                  <button type="button" className="btn btn-ink" onClick={saveToken}>Lưu token</button>
                </React.Fragment>
              )}
            </React.Fragment>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="scroll page">
      <header className="top">
        <p className="eyebrow">Dành cho quản trị viên</p>
        <h1 className="h1">Quản trị <em>nội dung</em></h1>
      </header>
      {body}
    </div>
  );
};

export default AdminPage;
