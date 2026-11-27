import React, { FC, useEffect, useState } from "react";
import { useSnackbar } from "../ui";
import { adminListDeals, adminSaveDeal } from "../platform/deals";
import { Deal, dealErrors, dealState, DealStatus } from "../utils/deals";

const STATUS: { id: DealStatus; label: string }[] = [
  { id: "draft", label: "Nháp (khách không thấy)" },
  { id: "published", label: "Công bố" },
  { id: "paused", label: "Tạm dừng (khách không thấy, không dùng được)" },
  { id: "ended", label: "Kết thúc" },
];
const pad = (n: number) => String(n).padStart(2, "0");
/** mili giây ↔ giá trị của ô datetime-local, theo giờ Việt Nam */
const toLocal = (ms: number) => {
  const d = new Date(ms + 7 * 3600000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
};
const fromLocal = (s: string) => Date.parse(s + ":00+07:00");
const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
const blank = (): Deal => {
  const t = Date.now();
  return { id: "", title: "", partner: "", summary: "", terms: "", place: "", startAt: t, endAt: t + 7 * 86400000, limit: 50, count: 0, status: "draft", confirmed: false, confirmedNote: "", code: "", url: "" };
};
const Field: FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => <label className="adm-field">{label}{children}</label>;

/** Thẻ "Ưu đãi" của trang quản trị: tạo, sửa, công bố, tạm dừng. Lưu thẳng vào Firestore nên có hiệu lực ngay. */
export const DealsEditor: FC = () => {
  const { openSnackbar } = useSnackbar();
  const [list, setList] = useState<Deal[] | null>(null);
  const [edit, setEdit] = useState<{ deal: Deal; isNew: boolean } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const load = () => adminListDeals().then(setList).catch(() => setList([]));
  useEffect(() => {
    load();
  }, []);
  const set = (patch: Partial<Deal>) => setEdit((e) => (e ? { ...e, deal: { ...e.deal, ...patch } } : e));

  const save = async () => {
    if (!edit) return;
    const d = { ...edit.deal, id: edit.isNew ? edit.deal.id || slug(edit.deal.partner + " " + edit.deal.title) : edit.deal.id };
    const errs = dealErrors(d);
    if (edit.isNew && (list || []).some((x) => x.id === d.id)) errs.push("Đã có ưu đãi mang mã này. Hãy đổi mã.");
    setErrors(errs);
    if (errs.length) return;
    setBusy(true);
    try {
      await adminSaveDeal(d, edit.isNew);
      openSnackbar({ text: d.status === "published" ? "Đã lưu. Ưu đãi đang hiện với khách" : "Đã lưu", type: "success", duration: 2600 });
      setEdit(null);
      await load();
    } catch (e) {
      openSnackbar({ text: "Chưa lưu được. Kiểm tra mạng hoặc quyền quản trị", duration: 3200 });
    }
    setBusy(false);
  };

  if (edit) {
    const d = edit.deal;
    return (
      <div className={"adm-list" + (busy ? " is-busy" : "")}>
        {errors.length > 0 && <div className="adm-status is-bad" role="alert"><b>Cần sửa trước khi lưu:</b><ul>{errors.map((e) => <li key={e}>{e}</li>)}</ul></div>}
        <Field label="Đối tác (tên quán, điểm diễn)"><input value={d.partner} maxLength={80} onChange={(e) => set({ partner: e.target.value })} /></Field>
        <Field label="Tên ưu đãi"><input value={d.title} maxLength={120} onChange={(e) => set({ title: e.target.value })} /></Field>
        {edit.isNew && <Field label="Mã ưu đãi (để trống sẽ tự đặt theo tên)"><input value={d.id} maxLength={50} placeholder={slug(d.partner + " " + d.title)} onChange={(e) => set({ id: slug(e.target.value) })} /></Field>}
        <Field label="Mô tả ngắn"><textarea rows={2} value={d.summary} maxLength={300} onChange={(e) => set({ summary: e.target.value })} /></Field>
        <Field label="Điều kiện sử dụng"><textarea rows={3} value={d.terms} maxLength={800} onChange={(e) => set({ terms: e.target.value })} /></Field>
        <Field label="Mã đối tác cấp (để trống: app tự tạo mã riêng cho từng khách)"><input value={d.code} maxLength={40} placeholder="Ví dụ: DALATEVENT.MLT10" onChange={(e) => set({ code: e.target.value.replace(/\s+/g, "") })} /></Field>
        <Field label="Trang dùng mã (ví dụ trang đặt vé), bắt đầu bằng https://"><input value={d.url} maxLength={300} onChange={(e) => set({ url: e.target.value.trim() })} /></Field>
        <Field label="Địa chỉ dùng ưu đãi"><input value={d.place} maxLength={160} onChange={(e) => set({ place: e.target.value })} /></Field>
        <div className="adm-row">
          <Field label="Bắt đầu"><input type="datetime-local" value={toLocal(d.startAt)} onChange={(e) => e.target.value && set({ startAt: fromLocal(e.target.value) })} /></Field>
          <Field label="Kết thúc"><input type="datetime-local" value={toLocal(d.endAt)} onChange={(e) => e.target.value && set({ endAt: fromLocal(e.target.value) })} /></Field>
        </div>
        <Field label={"Tổng số lượt" + (edit.isNew ? "" : " (đã dùng " + d.count + ")")}><input type="number" min={Math.max(1, d.count)} max={100000} value={d.limit} onChange={(e) => set({ limit: Math.trunc(+e.target.value) || 0 })} /></Field>
        <label className="acc-check"><input type="checkbox" checked={d.confirmed} onChange={(e) => set({ confirmed: e.target.checked })} /><span>Đối tác đã xác nhận ưu đãi này</span></label>
        <Field label="Xác nhận với ai, ngày nào, qua kênh nào"><input value={d.confirmedNote} maxLength={200} placeholder="Ví dụ: chị Lan, quản lý quán, Zalo ngày 23.11" onChange={(e) => set({ confirmedNote: e.target.value })} /></Field>
        <Field label="Trạng thái">
          <select value={d.status} onChange={(e) => set({ status: e.target.value as DealStatus })}>{STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
        </Field>
        <button type="button" className="btn btn-ink btn-wide" onClick={save}>Lưu ưu đãi</button>
        <button type="button" className="btn btn-line" onClick={() => { setEdit(null); setErrors([]); }}>Quay lại danh sách</button>
      </div>
    );
  }

  const now = Date.now();
  const LABEL: Record<string, string> = { hidden: "Khách không thấy", active: "Đang áp dụng", upcoming: "Sắp mở", soldout: "Hết lượt", ended: "Đã kết thúc", paused: "Tạm dừng" };
  return (
    <div className="adm-list">
      <p className="muted small">Ưu đãi lưu ở đây có hiệu lực ngay, không phải chờ như các thẻ khác. Chỉ công bố sau khi đối tác đã xác nhận. Số "đã dùng" do hệ thống đếm, không sửa được.</p>
      {!list ? <p className="muted">Đang tải…</p> : list.length === 0 ? <p className="muted">Chưa có ưu đãi nào.</p> : list.map((d) => (
        <div className="adm-card" key={d.id}>
          <button type="button" className="adm-head" onClick={() => { setErrors([]); setEdit({ deal: d, isNew: false }); }}>
            <b>{d.title}</b>
            <i>{d.partner} · {LABEL[dealState(d, now)]} · đã dùng {d.count}/{d.limit}</i>
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-ink btn-wide" onClick={() => { setErrors([]); setEdit({ deal: blank(), isNew: true }); }}>+ Tạo ưu đãi</button>
    </div>
  );
};
