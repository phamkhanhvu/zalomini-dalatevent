import React, { FC, useEffect, useState } from "react";
import { useSnackbar } from "../ui";
import { adminListSubmissions, adminSetSubmission } from "../platform/submissions";
import type { Submission } from "../utils/submissions";

const dmy = (d: string) => d.slice(8, 10) + "." + d.slice(5, 7) + "." + d.slice(0, 4);

/** Thẻ "Chờ duyệt": sự kiện mọi người gửi lên. Duyệt = thêm vào "Sự kiện khác" và đưa lên trang. */
export const SubmissionsEditor: FC<{ onApprove: (s: Submission) => Promise<boolean> }> = ({ onApprove }) => {
  const { openSnackbar } = useSnackbar();
  const [list, setList] = useState<Submission[] | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const load = () => adminListSubmissions().then(setList).catch(() => setList([]));
  useEffect(() => {
    load();
  }, []);
  const act = async (s: Submission, ok: boolean) => {
    if (!ok && !window.confirm("Từ chối sự kiện này?")) return;
    setBusy(true);
    try {
      if (ok && !(await onApprove(s))) throw new Error("save");
      await adminSetSubmission(s.id, ok ? "approved" : "rejected");
      openSnackbar({ text: ok ? "Đã duyệt và đưa lên trang" : "Đã từ chối", type: "success", duration: 2600 });
      await load();
    } catch (e) {
      openSnackbar({ text: "Chưa làm được. Kiểm tra mạng hoặc quyền quản trị", duration: 3200 });
    }
    setBusy(false);
  };
  if (!list) return <p className="muted">Đang tải…</p>;
  const shown = list.filter((s) => showAll || s.status === "new");
  return (
    <div className={"adm-list" + (busy ? " is-busy" : "")}>
      <p className="muted small">Sự kiện mọi người gửi qua trang dalatevent.com/#/gui-su-kien. Bấm Duyệt là sự kiện vào mục "Sự kiện khác" và hiện trên trang ngay.</p>
      {shown.length === 0 && <p className="muted">{showAll ? "Chưa có sự kiện nào được gửi." : "Không có sự kiện nào đang chờ duyệt."}</p>}
      {shown.map((s) => (
        <div className="adm-card" key={s.id}>
          <div className="adm-body">
            <b>{s.title}</b>
            <p className="small">{s.start_date === s.end_date ? dmy(s.start_date) : dmy(s.start_date) + " — " + dmy(s.end_date)} · {s.venue}</p>
            <p className="small">{s.desc}</p>
            {s.link && <p className="small"><a href={s.link} target="_blank" rel="noopener noreferrer">{s.link}</a></p>}
            <p className="muted small">Gửi bởi {s.by || "(không tên)"} · liên hệ: {s.contact}{s.status !== "new" ? " · " + (s.status === "approved" ? "đã duyệt" : "đã từ chối") : ""}</p>
            {s.status === "new" && (
              <div className="adm-row">
                <button type="button" className="btn btn-ink" onClick={() => act(s, true)}>Duyệt</button>
                <button type="button" className="btn btn-line" onClick={() => act(s, false)}>Từ chối</button>
              </div>
            )}
          </div>
        </div>
      ))}
      <button type="button" className="acc-switch" onClick={() => setShowAll((v) => !v)}>{showAll ? "Chỉ xem sự kiện chờ duyệt" : "Xem cả sự kiện đã xử lý"}</button>
    </div>
  );
};
