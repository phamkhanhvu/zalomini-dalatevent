import { IS_NATIVE } from "./device";
import { tr } from "../i18n";

/** Câu báo khi chia sẻ không thành công (đọc lúc dùng để theo ngôn ngữ hiện tại) */
export const shareFail = () => tr("Chưa chia sẻ được, hãy thử lại", "Couldn't share, please try again");
/** Câu báo sau khi lưu chương trình */
export const savedMsg = () => (IS_NATIVE ? tr("Đã lưu. App sẽ nhắc bạn trước giờ diễn 2 tiếng", "Saved. The app will remind you 2 hours before") : tr("Đã thêm vào Lịch trình", "Added to My plan"));
