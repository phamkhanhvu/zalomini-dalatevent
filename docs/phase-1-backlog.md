# DalatEvent 2.0 — Backlog Phase 1

Ngày: 23.11.2026. Cỡ việc: S / M / L (ước lượng, không phải cam kết thời gian). Thứ tự từ trên xuống là thứ tự làm.

Mục tiêu Phase 1: người dùng xem được "Hôm nay Đà Lạt có gì?", tìm trên bản đồ, lưu lịch và được nhắc, bằng dữ liệu có nguồn.

## Sprint 1 — Nguồn dữ liệu chung (F08 tối thiểu)

| Mã | Việc | Cỡ | Phụ thuộc | Nghiệm thu | Trạng thái |
|---|---|---|---|---|---|
| S1-1 | Lược đồ và tệp `data/events.json` với 11 chương trình, 7 địa điểm | S | — | Tệp qua được trình kiểm tra, 0 lỗi | Đã xong |
| S1-2 | Trình kiểm tra dữ liệu, chạy tự động khi sửa | S | S1-1 | Dữ liệu sai làm GitHub báo đỏ; đã thử với 5 kiểu lỗi | Đã xong |
| S1-3 | Nhập 3 lịch show và mục "Đang diễn ra" vào tệp | M | S1-1 | Mỗi show là một sự kiện có suất diễn, có link nguồn của nhà tổ chức | Chưa |
| S1-4 | Điền nguồn và ngày xác minh cho chương trình Festival | S | Anh gửi nguồn | Không còn cảnh báo "chưa có link nguồn" cho mục đã công bố | Chờ anh |
| S1-5 | App sinh dữ liệu từ tệp chung, bỏ `festival.ts` viết tay | M | S1-1 | Mini App và iOS hiển thị như cũ; sửa một dòng trong JSON thì cả hai đổi | Chưa |
| S1-6 | Trang chính sách quyền riêng tư (nháp) | S | — | Có trang nháp để anh duyệt; chưa công bố | Chưa |

## Sprint 2 — Hôm nay Đà Lạt có gì? (F01)

| Mã | Việc | Cỡ | Phụ thuộc | Nghiệm thu |
|---|---|---|---|---|
| S2-1 | Hàm lọc theo `Hôm nay / Tối nay / Ngày mai / Cuối tuần / Chọn ngày`, tính theo giờ Việt Nam | M | S1-5 | Có kiểm thử tự động cho: sự kiện qua nửa đêm, sự kiện nhiều ngày, đúng ranh giới thứ Sáu–Chủ nhật, máy đặt múi giờ khác |
| S2-2 | Lọc thể loại, miễn phí/có vé; sắp theo giờ | S | S2-1 | Kết hợp được với lọc ngày |
| S2-3 | Trạng thái: ẩn `cancelled` khỏi danh sách đang diễn ra, gắn nhãn `postponed`, có màn hình rỗng | S | S2-1 | Sự kiện hủy không bao giờ hiện là đang hoạt động |
| S2-4 | Mỗi thẻ hiện nguồn và ngày xác minh | S | S1-4 | Bấm vào xem được nguồn |
| S2-5 | Đưa lên app | M | S2-1…4 | Chạy trên Mini App và bản xem thử iOS |
| S2-6 | Đưa lên web sau cờ `today_filter` | M | S2-1…4 | Chỉ thấy khi thêm `?ff=today_filter`; trang công khai không đổi cho tới khi anh duyệt |

## Sprint 3 — Bản đồ gần tôi (F02)

| Mã | Việc | Cỡ | Phụ thuộc | Nghiệm thu |
|---|---|---|---|---|
| S3-1 | Tọa độ địa điểm đã xác minh | S | Nguồn bản đồ | Mỗi địa điểm có lat/lng nằm trong vùng hợp lệ |
| S3-2 | Chọn nền bản đồ và kiểm tra điều khoản sử dụng, chi phí | S | Anh duyệt | Có bảng so sánh ít nhất 2 phương án |
| S3-3 | Bản đồ có ghim, lọc thời gian và thể loại | M | S3-1, S3-2 | Sự kiện thiếu tọa độ vẫn hiện trong danh sách bên dưới |
| S3-4 | "Gần tôi" 1/3/5/10 km: chỉ xin vị trí khi bấm; từ chối thì chọn điểm thủ công | M | S3-3 | Vị trí chỉ xử lý trên máy người dùng, không gửi đi đâu |

## Sprint 4 — Tài khoản và lịch trình (F06, F03)

| Mã | Việc | Cỡ | Phụ thuộc | Nghiệm thu |
|---|---|---|---|---|
| S4-1 | Áp dụng và kiểm tra rules Firebase | S | Anh áp dụng | Game chạy bình thường sau khi đổi rules |
| S4-2 | Đăng nhập trong app bằng Firebase Auth sẵn có (Google, email) | M | S4-1, S1-6 | Cùng tài khoản với game cho ra cùng UID |
| S4-3 | Đồng bộ mục đã lưu; gộp dữ liệu trên máy khi đăng nhập | M | S4-2 | Đăng nhập máy khác vẫn thấy mục đã lưu |
| S4-4 | Lịch trình theo ngày, cảnh báo trùng giờ, thêm vào lịch điện thoại, chia sẻ link | L | S4-3 | Hai suất chồng giờ được cảnh báo |
| S4-5 | Xóa tài khoản và dữ liệu ngay trong app | M | S4-2 | Bắt buộc trước khi nộp App Store |
| S4-6 | Báo cho người đã lưu khi sự kiện đổi giờ/hủy (hiện trong app khi mở) | M | S4-3 | Chưa cần thông báo đẩy |

## Sprint 5 — Thông báo (F04) và chuẩn bị phát hành

| Mã | Việc | Cỡ | Phụ thuộc | Nghiệm thu |
|---|---|---|---|---|
| S5-1 | Thử nhắc lịch trên iPhone thật qua TestFlight | S | Tài khoản Apple Developer | Thông báo đến đúng giờ, bấm vào mở đúng chương trình |
| S5-2 | Cài đặt thông báo: bật tắt theo loại, giờ yên tĩnh | M | S5-1 | Không nhắc nếu chưa cho phép |
| S5-3 | Thông báo đẩy khi đổi/hủy lịch | L | Gói Blaze, anh duyệt chi phí | Không gửi trùng, có nhật ký gửi |
| S5-4 | Đo lường các hành động chính (mục 7 PRD) | M | Chính sách quyền riêng tư | Dùng lại gtag đang có trên web |
| S5-5 | Ảnh chụp màn hình thật, mô tả, hồ sơ App Store | M | Các sprint trên | Chỉ nộp sau khi anh duyệt |

## Chưa đưa vào Phase 1

F05 đăng ký và vé QR: cần máy chủ và cần ít nhất một nhà tổ chức đồng ý dùng. Em để thiết kế ở Phase 2 cùng F19.

## Cần anh xác nhận

| Việc | Vì sao cần |
|---|---|
| Nguồn chính thức của lịch Festival | Điền nguồn cho 10 chương trình |
| Áp dụng rules Firebase | Mở đường cho Sprint 4 |
| Tài khoản Apple Developer | Thử trên iPhone thật |
| Lịch Mây Lang Thang, Lululola, Sense Acoustic có phải nội dung tài trợ không | Nếu có thì phải gắn nhãn (F21) |
| Gói Blaze cho Firebase | Chỉ cần khi tới S5-3 hoặc vé QR |

## Cập nhật 23.11.2026

- Chủ dự án quyết định: làm xong các chức năng dự kiến trên website tĩnh (tiếng Việt) trước; bản tiếng Anh, tiếng Hàn và việc đưa sang các app (Zalo Mini App, App Store) làm sau.
- Website tĩnh nằm ở `web/`, đã thay trang chủ dalatevent.com. Dữ liệu ở `data/`.
- Sprint 1: S1-3 (lịch show và "Đang diễn ra" vào dữ liệu chung) xong; S1-4 xong cho 10 trên 11 chương trình (theo cổng chính thức); S1-5 xong cho web và vỏ iOS, Zalo Mini App vẫn dùng mã riêng.
- Sprint 2 (F01 "Đà Lạt có gì?"): S2-1 đến S2-4 và S2-6 xong trên web. Lọc Hôm nay / Tối nay / Ngày mai / Cuối tuần / Chọn ngày theo giờ Việt Nam, lọc Festival hoặc Show diễn, ẩn sự kiện đã hủy, gắn nhãn tạm hoãn, có màn hình rỗng, mỗi dòng ghi nguồn và ngày đối chiếu. 12 kiểm thử tự động (`web/tests/agenda.test.ts`), chạy mỗi lần đẩy code. Chưa có lọc "miễn phí/có vé" vì dữ liệu chưa có trường giá cho sự kiện Festival.
- Sprint 3 (F02 bản đồ gần tôi): xong trên web. Chỉ hỏi vị trí khi bấm nút; từ chối thì chọn điểm xuất phát thủ công; bán kính 1/3/5/10 km; lọc Festival hoặc Show diễn; địa điểm chưa có tọa độ vẫn hiện ở nhóm riêng. Nền bản đồ: khung nhúng Google Maps không cần khóa API (như trang cũ đã dùng), nên không phát sinh phí; chưa có nhiều ghim trên cùng một bản đồ. Tọa độ 8 trên 10 địa điểm lấy từ OpenStreetMap ngày 23.11.2026; còn thiếu Công viên Trần Quốc Toản và Mây Lang Thang (Lang Biang). 6 kiểm thử tự động (`web/tests/geo.test.ts`).
