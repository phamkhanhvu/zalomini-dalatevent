import React, { FC } from "react";
import { useNavigate } from "react-router";
import { FESTIVAL } from "../data/festival";
import { CONTACT_EMAIL } from "../utils/contact";
import { isEn, tr } from "../i18n";

const CONTACT = CONTACT_EMAIL;
const UPDATED = "27.11.2026";

const Contact: FC<{ subject?: string }> = ({ subject }) =>
  CONTACT ? (
    <a href={"mailto:" + CONTACT + (subject ? "?subject=" + encodeURIComponent(subject) : "")}>{CONTACT}</a>
  ) : (
    <span>{tr("qua email trên website sensegroup.vn", "via the email on sensegroup.vn")}</span>
  );

/** Bản tiếng Anh, cùng nội dung với bản tiếng Việt bên dưới */
const PrivacyEn: FC<{ home: () => void }> = ({ home }) => (
  <div className="scroll page">
    <header className="top">
      <p className="eyebrow">Updated {UPDATED}</p>
      <h1 className="h1">Privacy <em>policy</em></h1>
    </header>
    <section className="sec prose">
      <h2 className="h2">Who runs DalatEvent</h2>
      <p>DalatEvent (dalatevent.com) is run by Sense Group in Da Lat, Vietnam. For any request about personal data, contact <Contact />.</p>

      <h2 className="h2">Without signing in</h2>
      <p>You can use the whole site without an account. The site has no analytics or advertising code and sends none of your data to DalatEvent.</p>
      <ul>
        <li><b>Your plan</b> is stored in your browser on your device. Clearing browser data removes it.</li>
        <li><b>Plan share links</b> contain the list of items you saved. Anyone with the link can see that list; DalatEvent does not store these links.</li>
        <li><b>Location</b> is only requested when you tap "Use my location" on the Map page or "Stamp here" in the Da Lat Passport. It is used on your device to measure distance and is never sent or stored.</li>
        <li><b>Da Lat Passport</b>: your device records only the stamp name and time, not your coordinates.</li>
        <li><b>Language</b>: your choice of Vietnamese or English is stored in your browser.</li>
      </ul>

      <h2 className="h2">When you sign in (optional)</h2>
      <p>Signing in with Google, Apple (in the iOS app) or email uses Google's Firebase Authentication and shares one account with the game at dalatevent.com/game. We then store on Firebase:</p>
      <ul>
        <li>Your email and display name (display name only with Google; with Apple, the email may be Apple's private relay address).</li>
        <li>The items in your plan and the stamps in your Da Lat Passport, to sync across devices.</li>
        <li>When you rate a place: the stars and time, tied to your account so each person has one vote. Others only see the average and number of ratings, not who rated.</li>
        <li>When you submit an event on the "Submit an event" page: the event details, your display name and the contact you leave (phone, Zalo or email). Only DalatEvent admins see the contact, to ask about the event; it is never shown publicly.</li>
        <li>When you use a Dalat Deals offer: your display name, the time and the code, to reconcile with the partner.</li>
        <li>If you play the game: game progress, character name and leaderboard score (the leaderboard is public), your character's position while online and the stalls you own in the game.</li>
      </ul>
      <p>We do not sell or share this data with anyone else.</p>

      <h2 className="h2">Deleting your data</h2>
      <ul>
        <li>Delete the plan stored in your account: open My plan, tap the account strip, choose "Delete plan from account".</li>
        <li>Delete your account and all its data (including game progress): open My plan, tap the account strip, choose "Delete account". This cannot be undone.</li>
        <li>Stalls you own in the game cannot be removed from your side. To remove them, or if you cannot delete your account yourself, contact <Contact subject="DalatEvent account deletion request" /> with the email you signed up with.</li>
      </ul>

      <h2 className="h2">Third-party services</h2>
      <ul>
        <li><b>Google Maps</b>: the Map page embeds Google maps and the directions buttons open Google Maps.</li>
        <li><b>Firebase (Google)</b>: only used when you open sign-in or play the game.</li>
        <li><b>GitHub</b>: the latest event data is downloaded from GitHub's servers.</li>
        <li><b>Open-Meteo</b>: the Weather page and the weather strip on the home page load the Da Lat forecast from api.open-meteo.com. The request contains only the coordinates of central Da Lat, not your location.</li>
        <li><b>Website hosting</b> keeps technical access logs (IP address, time, page opened) like any web server.</li>
        <li>External links (ticket sites, venue sites, the festival portal) follow those sites' own policies.</li>
      </ul>

      <h2 className="h2">Children</h2>
      <p>The site is not directed at children and does not knowingly collect children's data.</p>

      <h2 className="h2">Changes</h2>
      <p>When this policy changes, the date at the top changes too. If the Vietnamese and English versions differ, the Vietnamese version applies.</p>
      <button type="button" className="btn btn-line" onClick={home}>Back to home</button>
    </section>
  </div>
);

const PrivacyPage: FC = () => {
  const navigate = useNavigate();
  if (isEn()) return <PrivacyEn home={() => navigate("/")} />;
  return (
    <div className="scroll page">
      <header className="top">
        <p className="eyebrow">Cập nhật ngày {UPDATED}</p>
        <h1 className="h1">Chính sách <em>quyền riêng tư</em></h1>
      </header>
      <section className="sec prose">
        <h2 className="h2">Ai vận hành</h2>
        <p>DalatEvent (dalatevent.com) do Sense Group (Đà Lạt) vận hành. Mọi yêu cầu về dữ liệu cá nhân xin liên hệ <Contact />.</p>

        <h2 className="h2">Khi bạn không đăng nhập</h2>
        <p>Bạn dùng được toàn bộ website mà không cần tài khoản. Website không gắn mã đo lường hay quảng cáo, và không gửi dữ liệu nào của bạn về cho DalatEvent.</p>
        <ul>
          <li><b>Lịch trình</b> bạn lưu nằm trong bộ nhớ trình duyệt trên máy bạn. Xóa dữ liệu trình duyệt là mất.</li>
          <li><b>Link chia sẻ lịch trình</b> chứa sẵn danh sách mục bạn đã lưu. Ai có link đều xem được danh sách đó; DalatEvent không lưu link này.</li>
          <li><b>Vị trí</b> chỉ được hỏi khi bạn bấm "Dùng vị trí của tôi" trên trang Bản đồ hoặc "Đóng dấu tại đây" trong Hộ chiếu Đà Lạt, chỉ dùng trên máy bạn để tính khoảng cách, không gửi đi và không lưu lại.</li>
          <li><b>Hộ chiếu Đà Lạt</b>: máy chỉ ghi tên dấu và thời điểm đóng dấu, không ghi tọa độ của bạn.</li>
          <li><b>Ngôn ngữ</b>: lựa chọn tiếng Việt hoặc tiếng Anh được lưu trong trình duyệt của bạn.</li>
        </ul>

        <h2 className="h2">Khi bạn đăng nhập (tùy chọn)</h2>
        <p>Đăng nhập bằng Google, Apple (trong app iOS) hoặc email dùng dịch vụ Firebase Authentication của Google, chung một tài khoản với trò chơi tại dalatevent.com/game. Khi đó chúng tôi lưu trên Firebase:</p>
        <ul>
          <li>Email và tên hiển thị của tài khoản (tên hiển thị chỉ có khi đăng nhập bằng Google; với Apple, email có thể là địa chỉ chuyển tiếp ẩn danh của Apple).</li>
          <li>Danh sách mục bạn đã thêm vào lịch trình và các dấu mộc đã đóng trong Hộ chiếu Đà Lạt, để đồng bộ giữa các máy.</li>
          <li>Khi bạn chấm sao một địa điểm: số sao và thời điểm chấm, gắn với tài khoản để mỗi người chỉ có một phiếu. Người khác chỉ thấy điểm trung bình và số lượt, không thấy ai chấm.</li>
          <li>Khi bạn gửi sự kiện qua trang "Gửi sự kiện": nội dung sự kiện, tên hiển thị và cách liên hệ bạn để lại (số điện thoại, Zalo hoặc email). Cách liên hệ chỉ quản trị viên DalatEvent xem, dùng để hỏi thêm về sự kiện, không hiện công khai.</li>
          <li>Khi bạn dùng một ưu đãi trong Dalat Deals: tên hiển thị của tài khoản, thời điểm và mã đổi, để đối soát với đối tác cung cấp ưu đãi.</li>
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
          <li><b>Open-Meteo</b>: trang Thời tiết và dải thời tiết trên trang chủ tải dự báo cho Đà Lạt từ api.open-meteo.com. Yêu cầu chỉ chứa tọa độ trung tâm Đà Lạt, không chứa vị trí của bạn.</li>
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
