import React, { FC } from "react";
import { useNavigate } from "react-router";
import { FESTIVAL } from "../data/festival";
import { callPhone } from "../utils/device";

/**
 * Email nhận yêu cầu về quyền riêng tư. Không viết trong mã nguồn: chủ dự án đặt trong
 * GitHub → Settings → Secrets and variables → Actions → Variables, tên CONTACT_EMAIL.
 * Chưa đặt thì trang chỉ hiện số điện thoại.
 */
const CONTACT: string = ((import.meta as unknown as { env?: Record<string, string> }).env?.VITE_CONTACT_EMAIL || "").trim();
const UPDATED = "23.11.2026";

const Contact: FC<{ subject?: string }> = ({ subject }) =>
  CONTACT ? (
    <a href={"mailto:" + CONTACT + (subject ? "?subject=" + encodeURIComponent(subject) : "")}>{CONTACT}</a>
  ) : (
    <button type="button" className="acc-link" onClick={() => callPhone(FESTIVAL.hotline)}>số {FESTIVAL.hotlineLabel}</button>
  );

const PrivacyPage: FC = () => {
  const navigate = useNavigate();
  return (
    <div className="scroll page">
      <header className="top">
        <p className="eyebrow">Cập nhật ngày {UPDATED}</p>
        <h1 className="h1">Chính sách <em>quyền riêng tư</em></h1>
      </header>
      <section className="sec prose">
        <h2 className="h2">Ai vận hành</h2>
        <p>DalatEvent (dalatevent.com) do Sense Group vận hành, địa chỉ 304 Hai Bà Trưng, Đà Lạt. Mọi yêu cầu về dữ liệu cá nhân xin liên hệ <Contact />.</p>

        <h2 className="h2">Khi bạn không đăng nhập</h2>
        <p>Bạn dùng được toàn bộ website mà không cần tài khoản. Website không gắn mã đo lường hay quảng cáo, và không gửi dữ liệu nào của bạn về cho DalatEvent.</p>
        <ul>
          <li><b>Lịch trình</b> bạn lưu nằm trong bộ nhớ trình duyệt trên máy bạn. Xóa dữ liệu trình duyệt là mất.</li>
          <li><b>Link chia sẻ lịch trình</b> chứa sẵn danh sách mục bạn đã lưu. Ai có link đều xem được danh sách đó; DalatEvent không lưu link này.</li>
          <li><b>Vị trí</b> chỉ được hỏi khi bạn bấm "Gần tôi" trên trang Bản đồ, chỉ dùng trên máy bạn để tính khoảng cách, không gửi đi và không lưu lại.</li>
        </ul>

        <h2 className="h2">Khi bạn đăng nhập (tùy chọn)</h2>
        <p>Đăng nhập bằng Google hoặc email dùng dịch vụ Firebase Authentication của Google, chung một tài khoản với trò chơi tại dalatevent.com/game. Khi đó chúng tôi lưu trên Firebase:</p>
        <ul>
          <li>Email và tên hiển thị của tài khoản (tên hiển thị chỉ có khi đăng nhập bằng Google).</li>
          <li>Danh sách mục bạn đã thêm vào lịch trình, để đồng bộ giữa các máy.</li>
          <li>Nếu bạn chơi trò chơi: tiến trình chơi, tên nhân vật và điểm trên bảng xếp hạng (bảng xếp hạng ai cũng xem được), vị trí nhân vật khi đang trực tuyến và gian hàng bạn sở hữu trong trò chơi.</li>
        </ul>
        <p>Chúng tôi không bán và không chia sẻ các dữ liệu này cho bên khác.</p>

        <h2 className="h2">Xóa dữ liệu</h2>
        <ul>
          <li>Xóa lịch trình trên tài khoản: vào trang Lịch trình, bấm vào dải tài khoản, chọn "Xóa lịch trình trên tài khoản".</li>
          <li>Xóa hẳn tài khoản cùng toàn bộ dữ liệu (kể cả tiến trình trò chơi): vào trang Lịch trình, bấm vào dải tài khoản, chọn "Xóa tài khoản". Việc này không hoàn tác được.</li>
          <li>Gian hàng bạn sở hữu trong trò chơi không tự xóa được từ phía bạn. Muốn xóa, hoặc không tự xóa tài khoản được, liên hệ <Contact subject="Yêu cầu xóa tài khoản DalatEvent" /> và cho biết email đã đăng ký.</li>
        </ul>

        <h2 className="h2">Dịch vụ của bên khác</h2>
        <ul>
          <li><b>Google Maps</b>: trang Bản đồ nhúng bản đồ của Google và nút chỉ đường mở Google Maps.</li>
          <li><b>Firebase (Google)</b>: chỉ được dùng khi bạn mở phần đăng nhập hoặc chơi trò chơi.</li>
          <li><b>GitHub</b>: dữ liệu lịch sự kiện mới nhất được tải từ máy chủ của GitHub.</li>
          <li><b>Máy chủ lưu trữ website</b> ghi nhật ký truy cập kỹ thuật (địa chỉ IP, thời gian, trang đã mở) như mọi máy chủ web.</li>
          <li>Các link ra ngoài (trang bán vé, trang của điểm diễn, cổng Festival) theo chính sách riêng của trang đó.</li>
        </ul>

        <h2 className="h2">Trẻ em</h2>
        <p>Website không hướng riêng tới trẻ em và không cố ý thu thập dữ liệu của trẻ em.</p>

        <h2 className="h2">Thay đổi</h2>
        <p>Khi chính sách thay đổi, ngày cập nhật ở đầu trang sẽ đổi theo.</p>
        <button type="button" className="btn btn-line" onClick={() => navigate("/")}>Về trang chủ</button>
      </section>
    </div>
  );
};

export default PrivacyPage;
