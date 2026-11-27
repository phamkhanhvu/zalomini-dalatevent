import React, { FC } from "react";
import { useNavigate } from "react-router";
import { CONTACT_EMAIL } from "../utils/contact";
import { isEn, tr } from "../i18n";

const UPDATED = "27.11.2026";
const Contact: FC = () =>
  CONTACT_EMAIL ? <a href={"mailto:" + CONTACT_EMAIL}>{CONTACT_EMAIL}</a> : <span>{tr("qua email trên website sensegroup.vn", "via the email on sensegroup.vn")}</span>;

const TermsVi: FC<{ privacy: () => void }> = ({ privacy }) => (
  <section className="sec prose">
    <h2 className="h2">1. Giới thiệu</h2>
    <p>DalatEvent (website dalatevent.com và ứng dụng DalatEvent trên iOS, Android) do Sense Group (Đà Lạt) vận hành, giúp người dân và du khách biết Đà Lạt đang có sự kiện, show diễn, địa điểm và ưu đãi gì. Khi dùng DalatEvent, bạn đồng ý với các điều khoản dưới đây. Cách chúng tôi xử lý dữ liệu cá nhân được nêu trong <button type="button" className="link-inline" onClick={privacy}>Chính sách quyền riêng tư</button>.</p>

    <h2 className="h2">2. Thông tin sự kiện</h2>
    <ul>
      <li>Lịch sự kiện, show diễn và địa điểm được tổng hợp từ nguồn chính thức, đối tác và người gửi, có ghi nguồn và ngày đối chiếu. Lịch có thể thay đổi, hoãn hoặc hủy mà DalatEvent không biết trước; bạn nên xem lại nguồn chính thức trước khi đi.</li>
      <li>Trừ khi được ghi rõ, DalatEvent không phải đơn vị tổ chức sự kiện, không bán vé và không chịu trách nhiệm về chất lượng, giá vé hay việc thay đổi chương trình của đơn vị tổ chức.</li>
      <li>Top list, gợi ý của trợ lý, Hộ chiếu Đà Lạt và thông tin thời tiết chỉ để tham khảo. Giờ mở cửa, giá và tình trạng thực tế có thể khác.</li>
    </ul>

    <h2 className="h2">3. Tài khoản</h2>
    <ul>
      <li>Đăng nhập là tùy chọn. Bạn chịu trách nhiệm giữ an toàn cho tài khoản của mình (Google, Apple hoặc email và mật khẩu).</li>
      <li>Bạn có thể xóa tài khoản bất cứ lúc nào ngay trong app hoặc website (mục Lịch trình → thẻ tài khoản → Xóa tài khoản).</li>
      <li>DalatEvent có thể tạm khóa tài khoản vi phạm điều khoản, gian lận ưu đãi hoặc gây hại cho người khác.</li>
    </ul>

    <h2 className="h2">4. Dalat Deals (ưu đãi đối tác)</h2>
    <ul>
      <li>Ưu đãi do đối tác cung cấp và chịu trách nhiệm thực hiện theo điều kiện ghi trong từng ưu đãi. DalatEvent chỉ đăng ưu đãi đã được đối tác xác nhận.</li>
      <li>Mỗi tài khoản dùng mỗi ưu đãi một lần, trong thời hạn và số lượt có hạn. Ưu đãi có thể kết thúc sớm khi hết lượt hoặc khi đối tác dừng chương trình.</li>
      <li>Ưu đãi không quy đổi thành tiền mặt và không chuyển nhượng. Mã đã dùng không hoàn lại.</li>
      <li>Nếu đối tác không áp dụng đúng ưu đãi, hãy báo cho DalatEvent để chúng tôi đối chiếu và làm việc với đối tác.</li>
    </ul>

    <h2 className="h2">5. Gửi sự kiện</h2>
    <ul>
      <li>Khi gửi sự kiện, bạn cam kết thông tin là đúng và bạn có quyền đăng thông tin, hình ảnh đó.</li>
      <li>DalatEvent được quyền duyệt, chỉnh sửa cho rõ ràng, từ chối hoặc gỡ sự kiện bất cứ lúc nào, nhất là nội dung sai sự thật, quảng cáo trá hình, vi phạm pháp luật hoặc thuần phong mỹ tục.</li>
      <li>Hiện việc gửi và duyệt sự kiện là miễn phí.</li>
    </ul>

    <h2 className="h2">6. Trò chơi và hành vi người dùng</h2>
    <p>Trong trò chơi và mọi phần có tương tác, bạn không được: dùng tên hoặc nội dung xúc phạm, khiêu dâm, kích động; quấy rối người khác; lừa đảo, spam; dùng công cụ gian lận hoặc can thiệp vào hệ thống. DalatEvent có thể xóa nội dung, đổi tên nhân vật hoặc khóa tài khoản vi phạm.</p>

    <h2 className="h2">7. Quảng cáo và nội dung tài trợ</h2>
    <p>Một số banner và nội dung là quảng cáo của Sense Group hoặc của đối tác và được ghi nhãn "Quảng cáo" hoặc "Được tài trợ". Sản phẩm, dịch vụ trong quảng cáo của đối tác do đối tác chịu trách nhiệm.</p>

    <h2 className="h2">8. Quyền sở hữu nội dung</h2>
    <ul>
      <li>Tên, logo DalatEvent, giao diện, minh họa và nội dung do Sense Group biên soạn thuộc quyền của Sense Group. Không sao chép để dùng vào mục đích thương mại khi chưa được đồng ý.</li>
      <li>Poster, hình ảnh của sự kiện và địa điểm thuộc về đơn vị tổ chức hoặc chủ sở hữu. Nếu bạn là chủ sở hữu và muốn gỡ hoặc sửa nội dung, hãy liên hệ <Contact />, chúng tôi xử lý trong thời gian sớm nhất.</li>
    </ul>

    <h2 className="h2">9. Liên kết bên ngoài</h2>
    <p>DalatEvent có liên kết tới trang bán vé, Google Maps, TikTok, trang của đối tác. Các trang đó có điều khoản riêng; DalatEvent không chịu trách nhiệm về nội dung và giao dịch trên đó.</p>

    <h2 className="h2">10. Giới hạn trách nhiệm</h2>
    <p>DalatEvent được cung cấp miễn phí theo hiện trạng. Trong phạm vi pháp luật cho phép, Sense Group không chịu trách nhiệm cho thiệt hại phát sinh từ việc dựa vào thông tin tham khảo, từ thay đổi lịch của đơn vị tổ chức, hoặc từ việc dịch vụ tạm gián đoạn.</p>

    <h2 className="h2">11. Thay đổi điều khoản và luật áp dụng</h2>
    <p>Điều khoản có thể được cập nhật; ngày cập nhật ghi ở đầu trang. Tiếp tục dùng DalatEvent sau khi cập nhật nghĩa là bạn đồng ý với bản mới. Điều khoản này theo pháp luật Việt Nam.</p>

    <h2 className="h2">12. Liên hệ</h2>
    <p>Sense Group, Đà Lạt, Lâm Đồng. Email: <Contact />. Website: <a href="https://www.sensegroup.vn" target="_blank" rel="noopener noreferrer">sensegroup.vn</a>.</p>
  </section>
);

const TermsEn: FC<{ privacy: () => void }> = ({ privacy }) => (
  <section className="sec prose">
    <h2 className="h2">1. About</h2>
    <p>DalatEvent (dalatevent.com and the DalatEvent app on iOS and Android) is run by Sense Group in Da Lat, Vietnam, to show residents and visitors what events, shows, places and offers are on in Da Lat. By using DalatEvent you agree to these terms. How we handle personal data is set out in the <button type="button" className="link-inline" onClick={privacy}>Privacy policy</button>.</p>

    <h2 className="h2">2. Event information</h2>
    <ul>
      <li>Event, show and venue information is compiled from official sources, partners and submitters, with the source and check date shown. Schedules can change, be postponed or cancelled without DalatEvent knowing in advance; please check the official source before you go.</li>
      <li>Unless stated, DalatEvent is not the organiser, does not sell tickets and is not responsible for the quality, ticket prices or programme changes of organisers.</li>
      <li>Top lists, assistant suggestions, the Da Lat Passport and weather information are for reference only. Actual opening hours, prices and conditions may differ.</li>
    </ul>

    <h2 className="h2">3. Accounts</h2>
    <ul>
      <li>Signing in is optional. You are responsible for keeping your account (Google, Apple or email and password) secure.</li>
      <li>You can delete your account at any time in the app or website (My plan → account strip → Delete account).</li>
      <li>DalatEvent may suspend accounts that break these terms, abuse offers or harm others.</li>
    </ul>

    <h2 className="h2">4. Dalat Deals (partner offers)</h2>
    <ul>
      <li>Offers are provided and honoured by partners under the conditions shown on each offer. DalatEvent only publishes offers confirmed by the partner.</li>
      <li>Each account can use each offer once, within the stated period and number of uses. Offers may end early when used up or when the partner stops them.</li>
      <li>Offers have no cash value and are not transferable. Used codes are not refunded.</li>
      <li>If a partner does not honour an offer, tell DalatEvent and we will follow up with the partner.</li>
    </ul>

    <h2 className="h2">5. Submitting events</h2>
    <ul>
      <li>When you submit an event, you confirm the information is accurate and you have the right to publish it and its images.</li>
      <li>DalatEvent may review, edit for clarity, reject or remove events at any time, especially false, misleading, unlawful or offensive content.</li>
      <li>Submitting and reviewing events is currently free.</li>
    </ul>

    <h2 className="h2">6. Game and user conduct</h2>
    <p>In the game and any interactive part, you must not use offensive, sexual or inciting names or content; harass others; scam or spam; or use cheats or interfere with the system. DalatEvent may remove content, rename characters or suspend accounts that do.</p>

    <h2 className="h2">7. Ads and sponsored content</h2>
    <p>Some banners and content are advertising by Sense Group or partners and are labelled "Ad" or "Sponsored". Partners are responsible for the products and services in their ads.</p>

    <h2 className="h2">8. Content ownership</h2>
    <ul>
      <li>The DalatEvent name, logo, interface, illustrations and content written by Sense Group belong to Sense Group. Do not copy them for commercial use without permission.</li>
      <li>Event posters and venue images belong to their organisers or owners. If you own content and want it removed or corrected, contact <Contact /> and we will act promptly.</li>
    </ul>

    <h2 className="h2">9. External links</h2>
    <p>DalatEvent links to ticket sites, Google Maps, TikTok and partner pages. Those sites have their own terms; DalatEvent is not responsible for their content or transactions.</p>

    <h2 className="h2">10. Limitation of liability</h2>
    <p>DalatEvent is provided free of charge and as is. To the extent permitted by law, Sense Group is not liable for losses from relying on reference information, from organisers' schedule changes, or from temporary service interruptions.</p>

    <h2 className="h2">11. Changes and governing law</h2>
    <p>These terms may be updated; the update date is shown at the top. Continuing to use DalatEvent after an update means you accept it. These terms are governed by Vietnamese law.</p>

    <h2 className="h2">12. Contact</h2>
    <p>Sense Group, Da Lat, Lam Dong. Email: <Contact />. Website: <a href="https://www.sensegroup.vn" target="_blank" rel="noopener noreferrer">sensegroup.vn</a>.</p>
  </section>
);

/** Điều khoản sử dụng DalatEvent */
const TermsPage: FC = () => {
  const navigate = useNavigate();
  const privacy = () => navigate("/quyen-rieng-tu");
  return (
    <div className="scroll page">
      <header className="top">
        <p className="eyebrow">{tr("Cập nhật ngày ", "Updated ")}{UPDATED}</p>
        <h1 className="h1">{tr("Điều khoản ", "Terms of ")}<em>{tr("sử dụng", "use")}</em></h1>
      </header>
      {isEn() ? <TermsEn privacy={privacy} /> : <TermsVi privacy={privacy} />}
    </div>
  );
};

export default TermsPage;
