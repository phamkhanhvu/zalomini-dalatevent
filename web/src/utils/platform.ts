import { IS_NATIVE } from "./device";

/** Câu báo khi chia sẻ không thành công */
export const SHARE_FAIL = "Chưa chia sẻ được, hãy thử lại";
/** Câu báo sau khi lưu chương trình */
export const SAVED_MSG = IS_NATIVE ? "Đã lưu. App sẽ nhắc bạn trước giờ diễn 2 tiếng" : "Đã lưu vào mục Đã lưu";
