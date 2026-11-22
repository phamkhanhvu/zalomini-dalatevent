# DalatEvent 2.0 — Ma trận GAP 25 tính năng

Ngày: 23.11.2026. Trạng thái: `Đã có` / `Có một phần` / `Chưa có` / `Chưa xác minh`. Công sức: S / M / L / XL (ước lượng cỡ, không phải cam kết thời gian).

Tổng: 0 Đã có · 10 Có một phần · 15 Chưa có.

| ID | Tính năng | Trạng thái | Đang có gì (bằng chứng) | Còn thiếu so với nghiệm thu | Giai đoạn | Cỡ | Phụ thuộc |
|---|---|---|---|---|---|---|---|
| F01 | Hôm nay Đà Lạt có gì? | Có một phần | Trang chủ có mục "Đang diễn ra", 3 lịch show, lọc thể loại cho 11 chương trình, ô tìm kiếm (trang 1337, khối 2–10, 18) | Lọc theo ngày/tối nay/cuối tuần; trạng thái hủy/hoãn; nguồn xác minh từng sự kiện; dữ liệu có cấu trúc | 1 | M | F08 |
| F02 | Bản đồ sự kiện gần tôi | Có một phần | Mục bản đồ trên web (khối 13); app có tab Bản đồ 7 địa điểm và nút chỉ đường (`src/pages/map.tsx`) | Ghim theo tọa độ, bán kính 1/3/5/10 km, xin vị trí tùy chọn, chọn điểm thủ công | 1 | M | F08, giấy phép bản đồ |
| F03 | Lịch trình của tôi | Có một phần | App lưu/bỏ lưu chương trình trên máy, chia sẻ (`src/utils/saved.ts`) | Đồng bộ tài khoản, lịch theo ngày, cảnh báo trùng giờ, thêm vào lịch điện thoại, báo khi đổi/hủy | 1 | M | F06, F08 |
| F04 | Thông báo thông minh | Có một phần | App iOS hẹn thông báo trên máy trước giờ diễn 2 tiếng cho mục đã lưu (`ios-app/src/reminders.ts`), chưa thử trên máy thật | Thông báo đẩy từ máy chủ, báo đổi/hủy, tùy chọn loại và giờ yên tĩnh, nhật ký gửi | 1 | L | F06, F08, Cloud Functions |
| F05 | Đăng ký và vé QR | Chưa có | Không có | Toàn bộ; phải xác thực phía máy chủ | 1/2 | L | F06, F08, Cloud Functions, nhà tổ chức đồng ý |
| F06 | DalatEvent ID | Có một phần | Game có Firebase Auth: Google và email/mật khẩu (`Game-Festival-Hoa-Dalat/index.html` dòng 603–718) | Web và app chưa có đăng nhập; hồ sơ chung; xóa tài khoản trong app | 1 | M | Trang quyền riêng tư |
| F07 | Cổng đăng sự kiện đối tác | Chưa có | Chỉ có mục liên hệ hợp tác | Form, bản nháp, chờ duyệt, chống spam | 2 | L | F06, F08 |
| F08 | Quản lý, xác thực, kiểm duyệt | Có một phần | Quản trị WordPress cho trang/bài; tác vụ tự cập nhật hằng ngày | Dữ liệu sự kiện có cấu trúc, 6 trạng thái, nguồn, `verified_at`, lịch sử sửa, phân quyền | 0/1 | L | Quyết định kiến trúc |
| F09 | Dalat Passport | Chưa có | Không có | Toàn bộ | 2 | L | F06, đối tác đồng ý |
| F10 | DalatVerse | Có một phần | Game 3D chạy ở `dalatevent.com/game/`: 2 bản đồ, gian hàng, bảng xếp hạng, người chơi trực tuyến qua RTDB | Liên kết với sự kiện thật; kiểm tra rules; thử trên iOS | 3 | L | Rules được duyệt |
| F11 | Trợ lý AI | Chưa có | Không có | Toàn bộ; chỉ trả lời từ dữ liệu đã duyệt | 3 | L | F08 |
| F12 | Check-in AR, bưu thiếp | Chưa có | Không có | Toàn bộ | 3 | L | Logo và tài sản được duyệt |
| F13 | Đà Lạt Live | Có một phần | Mục "Đang diễn ra" cập nhật mỗi ngày một lần, có ghi ngày cập nhật | Chưa phải thời gian thực; chưa có tình trạng vé, livestream | 3 | M | F08 |
| F14 | Tour sự kiện thông minh | Chưa có | Không có | Toàn bộ | 3 | L | F02, dữ liệu tuyến |
| F15 | Bản đồ ngoại tuyến | Có một phần | App đóng gói sẵn lịch và địa điểm, mất mạng vẫn xem được bản dự phòng | Lớp bản đồ ngoại tuyến có giấy phép, báo dữ liệu cũ, chính sách làm mới | 3 | M | F02 |
| F16 | Stories | Chưa có | Không có | Toàn bộ | 3 | L | Kiểm duyệt, bản quyền |
| F17 | Săn dấu mộc, nhiệm vụ | Có một phần | Trong game có thẻ câu đố và điểm check-in ảo | Nhiệm vụ ngoài đời bằng QR, chống gian lận | 2 | L | F09 |
| F18 | Trang nhà tổ chức | Chưa có | Không có | Toàn bộ | 2 | M | F07 |
| F19 | Vé và check-in B2B | Chưa có | Không có | Toàn bộ | 2 | XL | F05 |
| F20 | Dalat Deals | Chưa có | Không có | Toàn bộ | 3 | M | Đối tác xác nhận |
| F21 | Sự kiện được tài trợ | Chưa có | Không có; lịch Mây Lang Thang, Lululola, Sense Acoustic đang là nội dung thường, không gắn nhãn | Nhãn "Được tài trợ", thời hạn, báo cáo. Cần anh xác nhận 3 mục trên có phải tài trợ không | 3 | M | F08 |
| F22 | Organizer Dashboard | Chưa có | Web có gtag và Jetpack Stats ở mức toàn trang | Số liệu theo sự kiện và theo tổ chức | 2 | L | F08, đo lường |
| F23 | QR và widget nhúng | Chưa có | Không có | Toàn bộ | 2 | M | F08 |
| F24 | Đa ngôn ngữ | Có một phần | Trang chủ và Về chúng tôi có bản Anh, Hàn (trang 1412, 1418, 1416, 1417) | Dịch tay từng trang, các mục mới chưa có; app chỉ tiếng Việt; chưa có cơ chế dự phòng | 2 | M | F08 |
| F25 | Cộng đồng góp ý | Chưa có | Không có | Toàn bộ | 2 | M | F08 |

## Rủi ro chung

- Chưa xem được Firebase Rules: mọi tính năng dùng tài khoản (F03–F06, F09, F17) phải chờ kiểm tra này.
- Cloud Functions cần gói trả phí theo mức dùng: ảnh hưởng F04, F05, F09, F19.
- Lịch của bên thứ ba (Mây Lang Thang, Lululola) lấy từ website của họ mỗi ngày; cần ghi nguồn và giờ lấy cho từng dòng.
