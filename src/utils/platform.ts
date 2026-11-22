/** true khi chạy trong Zalo Mini App; false khi đóng gói thành app iOS (thư mục ios-app) */
export const IS_ZALO = import.meta.env.VITE_TARGET !== "native";

/** Câu báo khi chia sẻ không thành công */
export const SHARE_FAIL = IS_ZALO ? "Chưa chia sẻ được, hãy thử lại trong Zalo" : "Chưa chia sẻ được, hãy thử lại";
