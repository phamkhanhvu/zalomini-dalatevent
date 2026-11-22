import { Happening } from "../data/festival";
import { getData, isFromNetwork } from "../data/store";

export interface LiveResult {
  items: Happening[];
  updated?: string;
  fromNetwork: boolean;
}

/** Mục "Đang diễn ra và sắp tới", lấy từ kho dữ liệu của site (data/happening.json) */
export async function loadHappening(): Promise<LiveResult> {
  const h = getData().happening;
  return { items: h.items, updated: h.updated_label, fromNetwork: isFromNetwork() };
}
