import React, { FC, useEffect, useState } from "react";
import { useSnackbar } from "../ui";
import { openAccount } from "./account-panel";
import { myStars, onRatings, rate, ratingOf } from "../platform/ratings";
import { getAccount } from "../platform/account";
import { tr } from "../i18n";

/** Điểm trung bình gọn, ví dụ "★ 4,6 (12)" */
export const RatingBadge: FC<{ id: string }> = ({ id }) => {
  const [, force] = useState(0);
  useEffect(() => onRatings(() => force((n) => n + 1)), []);
  const r = ratingOf(id);
  if (!r) return null;
  return (
    <span className="rt-badge" aria-label={tr(`${r.avg.toFixed(1)} trên 5 sao, ${r.count} lượt`, `${r.avg.toFixed(1)} out of 5, ${r.count} ratings`)}>
      ★ {r.avg.toFixed(1).replace(".", tr(",", "."))} <i>({r.count})</i>
    </span>
  );
};

/** Hàng 5 sao để khách chấm; chưa đăng nhập thì mở khung đăng nhập */
export const RateStars: FC<{ id: string }> = ({ id }) => {
  const { openSnackbar } = useSnackbar();
  const [mine, setMine] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (getAccount().status === "in") myStars(id).then(setMine);
  }, [id]);
  const pick = async (n: number) => {
    if (busy) return;
    setBusy(true);
    const r = await rate(id, n);
    setBusy(false);
    if (r === "ok") {
      setMine(n);
      openSnackbar({ text: tr("Cảm ơn bạn đã chấm " + n + " sao", "Thanks for rating " + n + " stars"), type: "success", duration: 2000 });
    } else if (r === "signin") openAccount();
    else openSnackbar({ text: tr("Chưa chấm được, hãy thử lại", "Couldn't save, please try again"), duration: 2500 });
  };
  return (
    <div className="rt-rate" role="radiogroup" aria-label={tr("Chấm sao địa điểm này", "Rate this place")}>
      <span>{mine ? tr("Bạn chấm", "Your rating") : tr("Chấm sao", "Rate")}</span>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={mine === n} aria-label={n + tr(" sao", " stars")} className={"rt-star" + (n <= mine ? " on" : "")} onClick={() => pick(n)} disabled={busy}>
          ★
        </button>
      ))}
    </div>
  );
};
