# DalatEvent 2.0 — Bước A: Audit hiện trạng

Ngày audit: 23.11.2026 (giờ Việt Nam). Người làm: Claude. Phạm vi: chỉ đọc, không sửa production trong bước này.

Cách đọc: mỗi nhận định có ghi bằng chứng. Chỗ nào chưa kiểm tra được ghi `CẦN XÁC MINH`.

## 1. Kết luận nhanh

- DalatEvent hiện là **ba sản phẩm rời nhau**, chưa chung dữ liệu và chưa chung tài khoản: website (WordPress), game 3D (Firebase), và app (Zalo Mini App + iOS, dữ liệu viết sẵn trong code).
- **Chưa có cơ sở dữ liệu sự kiện.** Lịch đang là HTML viết tay trong một trang WordPress và một file TypeScript trong app. Đây là nút thắt của gần như cả 25 tính năng; phải giải quyết trước (F08) rồi mới làm F01–F04 cho đúng nghĩa.
- Trong 25 tính năng: 0 "Đã có" đầy đủ theo tiêu chí nghiệm thu, 10 "Có một phần", 15 "Chưa có". Chi tiết ở `feature-gap-matrix.md`.
- Có 3 việc P0 cần chủ sản phẩm quyết trước khi làm tiếp (mục 5).

## 2. Stack thực tế

| Thành phần | Thực tế | Bằng chứng |
|---|---|---|
| Website dalatevent.com | WordPress tự cài, máy chủ LiteSpeed/Plesk, nối WordPress.com qua Jetpack (site ID 258666013). Plugin SEO là SiteSEO, cache là SpeedyCache | Header HTTP `server: LiteSpeed`, `x-powered-by: PleskLin`, `x-speedycache-source`; meta `_siteseo_*` trên trang |
| Trang chủ | Một trang WordPress (ID 1337) gồm 19 khối HTML tùy chỉnh, CSS/JS viết tay trong từng khối. Không phải React/Next.js | Danh sách khối của trang 1337; HTML trang chủ ~185 KB |
| Bản tiếng Anh, Hàn | Hai trang riêng (ID 1412, 1418) và trang Về chúng tôi EN/KO (1416, 1417), dịch tay | API trang của site |
| Blog | Bài viết WordPress thường (dịch vụ sự kiện của Sense Group) | API bài viết |
| Thống kê | Có mã gtag (Google) và Jetpack Stats trên trang chủ. Chưa có sự kiện đo lường riêng theo mục 7 của PRD | `gtag` và `stats.wp.com` trong HTML trang chủ |
| Game "DalatEvent — Từ xe đẩy thành thương hiệu" | Web tĩnh thuần HTML/JS (`index.html` ~359 KB, `world.js`, `world_cho.js`, mô hình .glb), phát hành ở `dalatevent.com/game/` | Repo `phamkhanhvu/Game-Festival-Hoa-Dalat` (commit 23559b9); `dalatevent.com/game/` trả 200 |
| Zalo Mini App | React 18 + TypeScript + Vite + zmp-ui. Mỗi lần đẩy code lên `main`, GitHub Actions tự đưa bản **Testing** lên Zalo | Repo `phamkhanhvu/zalomini-dalatevent`, `.github/workflows/deploy.yml` |
| App iOS | Capacitor 8, dùng chung mã với Mini App (thư mục `ios-app/`). Đã biên dịch thử trên GitHub (chưa ký, chưa chạy máy thật, chưa nộp) | `.github/workflows/ios.yml`, lần chạy "iOS app" thành công ngày 23.11 |
| Tác vụ tự động | Mỗi sáng 05:47 một tác vụ cập nhật mục "Đang diễn ra", lịch Mây Lang Thang và Lululola trên trang chủ | Trang 1337/1412/1418 có giờ sửa 05:57–06:00 ngày 23.11 |

## 3. Firebase (chỉ đọc từ mã nguồn game)

Dự án Firebase: `quay-hang-da-lat`, SDK web 10.12.2 (compat). Cấu hình nằm ở `index.html` dòng ~590.

| Dịch vụ | Đang dùng cho | Đường dẫn dữ liệu thấy trong code |
|---|---|---|
| Authentication | Đăng nhập Google (popup, dự phòng redirect) và email/mật khẩu | `index.html` dòng 603–718 |
| Cloud Firestore | Lưu tiến trình chơi và bảng xếp hạng | `saves/{uid}`, `board/{uid}` |
| Realtime Database | Người chơi trực tuyến, chủ gian hàng, chi trả | `presence/{uid}` (có `onDisconnect().remove()`), `booths/…`, `payouts/…` |

Presence **đã tồn tại**. Theo đúng yêu cầu của PRD, em dừng ở đây và không đổi gì phần này.

`CẦN XÁC MINH` (em không có quyền vào Firebase Console, repo cũng không chứa file rules):
- Firestore Rules và Realtime Database Rules hiện tại.
- `board/{uid}` do máy người chơi tự ghi điểm; nếu rules không chặn thì bảng xếp hạng sửa được bằng tay.
- `booths/` và `payouts/` do client ghi; cần rules hoặc Cloud Functions kiểm soát.
- Gói Firebase (Spark hay Blaze), miền được phép đăng nhập, App Check.

Ghi chú: khóa `apiKey` web của Firebase nằm công khai trong repo là bình thường với Firebase web; việc bảo vệ nằm ở rules, không phải ở việc giấu khóa này.

Website và app **chưa dùng** Firebase: không có đăng nhập, không có Firestore.

## 4. Dữ liệu sự kiện đang nằm ở đâu

| Nơi | Nội dung | Vấn đề |
|---|---|---|
| Trang 1337, các khối HTML | 11 chương trình Festival, "Đang diễn ra", lịch Mây Lang Thang (10 dòng), Lululola (10 dòng), Sense Acoustic (7 dòng theo tuần) | Viết tay, không có trạng thái, không có nguồn/`verified_at` theo từng dòng |
| `src/data/festival.ts` trong repo app | 11 chương trình, 7 địa điểm, bản dự phòng "Đang diễn ra" | Bản sao thứ hai, phải sửa tay song song |
| App đọc lại từ web | App tải HTML trang 1337 qua API rồi bóc mục "Đang diễn ra" | Dễ gãy khi đổi HTML |

Ngày khai mạc đang **viết cứng và lệch nhau**: banner và đếm ngược trên web ghi 19.12.2026; mục "Đang diễn ra" và app ghi 12.12.2026 (dự kiến). PRD yêu cầu không viết cứng ngày dự kiến.

## 5. Vấn đề cần xử lý

### P0 — cần chủ sản phẩm quyết

1. **Logo đang dùng chưa đúng quy định logo khóa.** Hôm 23.11 em đã cắt riêng phần ghim từ logo để làm favicon, biểu tượng đầu trang web, đầu trang Mini App và icon app iOS; chữ "DalatEvent" ở đầu trang web là chữ serif màu hồng tự dựng, không phải chữ trong logo. Theo PRD, bản cắt vuông phải được duyệt và không được tự tạo chữ. Đề xuất: thay bằng đúng file `DalatEvent_LOGO_CHINH_THUC_KHOA.png` ở đầu trang; trình anh 2 phương án icon vuông (logo đầy đủ thu nhỏ trên nền trắng, hoặc chỉ phần ghim) để anh chọn.
2. **Ngày khai mạc 12.12 hay 19.12.** Cần nguồn chính thức; trước khi có, đề xuất bỏ đếm ngược và ghi "Tháng 12.2026, chờ công bố".
3. **Firebase Rules chưa ai kiểm tra.** Cần anh cấp quyền xem (Viewer) dự án `quay-hang-da-lat` hoặc gửi nội dung rules. Em không sửa rules khi chưa duyệt.

### P1 — làm trong Phase 1

4. Chưa có nguồn dữ liệu sự kiện duy nhất (mục 4).
5. Chưa có trang chính sách quyền riêng tư (`/privacy-policy/`, `/chinh-sach-quyen-rieng-tu/` đều 404). Bắt buộc trước khi có tài khoản, thông báo đẩy hoặc nộp App Store.
6. Web, app, game chưa chung tài khoản; app lưu "Đã lưu" trên máy, đổi máy là mất.
7. Mini App tự phát hành bản Testing mỗi lần đẩy code. Không ảnh hưởng người dùng công khai, nhưng nên thêm bước duyệt tay trước bản chính thức.
8. Bản EN/KO chưa có các mục mới (lịch show, thanh trượt, tìm kiếm, logo).
9. Trang chủ nặng (~185 KB HTML, CSS/JS lặp trong 19 khối); cần gọn lại khi chuyển sang đọc dữ liệu.
10. Tên website vừa đổi thành "DalatEvent – Festival Hoa Đà Lạt 2026 và lịch sự kiện Đà Lạt" để thẻ Facebook rõ hơn. Việc này gắn tên site với Festival, trái định hướng "Festival không phải phạm vi duy nhất". Nên đổi thành câu định vị quanh năm, ví dụ "DalatEvent – Đà Lạt có gì vui?".

### Đã làm vượt trước thứ tự PRD

App iOS (Capacitor) được dựng hôm 23.11 trước khi có audit. PRD muốn thử web/PWA trước. App chưa nộp và chưa ký nên không có rủi ro phát hành; đề xuất giữ làm vỏ, tạm dừng việc App Store cho tới khi Phase 1 có dữ liệu thật.

## 6. Phần nên giữ nguyên

- Game và toàn bộ dự án Firebase `quay-hang-da-lat` (Auth, `saves`, `board`, `presence`, `booths`, `payouts`).
- WordPress làm nơi đặt trang công khai, blog, SEO, bản EN/KO.
- Giao diện trang chủ hiện tại (màu, bố cục, thanh trượt, tìm kiếm), chỉ đổi nguồn dữ liệu phía sau.
- Mã app dùng chung cho Zalo và iOS; lớp `utils/zalo.ts` đã tách sẵn phần phụ thuộc nền tảng.
- Tác vụ cập nhật hằng ngày, chuyển từ "sửa HTML" sang "ghi vào dữ liệu sự kiện ở trạng thái chờ duyệt".

## 7. Kiến trúc đề xuất (bản tóm tắt, chi tiết ở Bước B)

Dùng tiếp dự án Firebase sẵn có làm lõi, tách miền dữ liệu:

- **Auth:** một UID cho web, app, game (F06). Không tạo hệ tài khoản thứ hai.
- **Firestore, miền sự kiện (mới):** `events`, `event_sessions`, `venues`, `organizations`, `user_favorites`, `audit_logs`. Trạng thái `draft/pending/published/postponed/cancelled/completed`, kèm `source_url`, `verified_at`.
- **Firestore + RTDB, miền game (giữ nguyên):** `saves`, `board`, `presence`, `booths`, `payouts`.
- **Web WordPress:** trang chủ đọc sự kiện đã duyệt qua một tệp JSON có cache (xuất từ Firestore), để trang vẫn nhanh và không phụ thuộc SDK.
- **App:** đọc cùng nguồn đó; "Đã lưu" đồng bộ theo UID khi đăng nhập, vẫn dùng được khi chưa đăng nhập.
- **Phần phải chạy phía máy chủ** (vé QR, check-in, đổi quà, gửi thông báo): Cloud Functions. Việc này cần gói Blaze trả theo mức dùng, là quyết định chi phí của anh.

Phương án thay thế đã cân nhắc: lưu sự kiện bằng loại bài viết riêng trong WordPress. Ưu điểm là có sẵn màn quản trị và lịch sử sửa; nhược điểm là không chung UID với game, và vé/check-in vẫn phải làm ở nơi khác. Em nghiêng về Firebase vì PRD đặt nặng tài khoản thống nhất.

## 8. MVP đầu tiên đề xuất (Phase 1, lát cắt 1)

Mục tiêu: "Hôm nay Đà Lạt có gì?" chạy bằng dữ liệu thật, có trạng thái và nguồn.

1. F08 tối thiểu: lược đồ `events`/`event_sessions`/`venues`, nhập 11 chương trình Festival và 3 lịch show hiện có, kèm nguồn và ngày xác minh. Cỡ M.
2. F01: thanh `Hôm nay / Tối nay / Ngày mai / Cuối tuần / Chọn ngày` và lọc thể loại, tính theo giờ Việt Nam, ẩn sự kiện đã hủy, có trạng thái rỗng. Cỡ M.
3. Trang chủ và app đọc chung nguồn; bỏ ngày viết cứng. Cỡ M.
4. Trang chính sách quyền riêng tư. Cỡ S.

Mọi thay đổi trang công khai làm trên bản nháp/nhánh riêng, anh duyệt rồi mới đưa lên. Cách quay lui: WordPress giữ bản sửa đổi của trang; app và game quay lui bằng git.

## 9. Quyền tối thiểu em cần thêm

- Quyền xem dự án Firebase `quay-hang-da-lat` (hoặc anh dán nội dung Firestore Rules và RTDB Rules).
- Xác nhận ngày khai mạc kèm nguồn.
- Quyết định về logo ở mục 5.1.

## 10. Quyết định của chủ sản phẩm ngày 23.11.2026 và việc đã làm

| Quyết định | Đã làm | Bằng chứng |
|---|---|---|
| Logo dùng đúng file đã gửi | Đầu trang web, favicon, đầu trang Mini App, icon và màn hình chờ app iOS đều dùng nguyên logo chính thức (chỉ thu nhỏ đều hai chiều, đặt trên nền trắng). Bỏ bản cắt riêng phần ghim và chữ tự dựng | Trang 1337 khối 1; media 1563, 1564; `src/static/img/dalatevent-logo.png`; `ios-app/assets/` |
| Khai mạc ấn định 19.12 | Sửa thẻ khai mạc trong mục "Đang diễn ra" trên web và dữ liệu app thành 20:00 ngày 19.12.2026; tác vụ cập nhật hằng ngày được dặn giữ ngày này | Trang 1337 khối 2; `src/data/festival.ts` |
| Em tự soạn quy tắc bảo mật Firebase | Đã soạn, chưa áp dụng lên Firebase | `docs/firebase/` |

Cập nhật cùng ngày: bản tiếng Anh, tiếng Hàn và ba trang Về chúng tôi đã hiện logo chính thức ở đầu trang.

## 11. Đối chiếu với cổng chính thức (23.11.2026)

Nguồn anh gửi: https://festivaldalat.lamdongtructuyen.vn (cơ quan chủ quản ghi trên trang: Trung tâm Xúc tiến Đầu tư, Thương mại và Du lịch tỉnh Lâm Đồng). Trang Chương trình có 34 mục, trong đó 12 mục "Lễ hội chính". Em đã ghi nguồn và ngày xác minh vào `data/events.json` cho 9 chương trình khớp.

| Điểm khác | Cổng chính thức | Web và app của mình đang ghi | Trạng thái |
|---|---|---|---|
| Khai mạc | 20:00 ngày 12.12.2026 | 20:00 ngày 19.12.2026 (anh ấn định sáng 23.11) | Chờ anh quyết |
| Thời gian Festival | 12.12.2026 – 03.01.2027 | 19.12 – 31.12.2026 | Chờ anh quyết |
| Triển lãm tại Công viên Trần Quốc Toản | "Trưng bày, triển lãm hoa, cây cảnh", 01–25.12 | "Triển lãm quốc tế hoa lan Hồ Điệp…" 01–25.12, và "Trưng bày hoa và cây cảnh quốc tế" tại Vườn hoa 18.12–03.01 | Chờ anh quyết |
| Lễ hội nhạc Jazz Việt Nam 2026 | 25–27.12, trên mặt hồ Xuân Hương | Chưa có | Chờ anh duyệt để thêm |
| Giờ Golf, Hội thảo, Carnival | 10:00 | Golf "trong ngày"; Hội thảo và Carnival chưa ghi giờ | Sẽ sửa cùng đợt |
| Chiến dịch trồng hoa | 01.06.2026 – 03.01.2027 | "Từ nay đến 03.01.2027" | Khớp về ý |

22 mục "hưởng ứng" còn lại trên cổng phần lớn mang ngày giờ giống nhau (30.11–31.12, 17:00), có vẻ là giá trị điền tạm, nên em chưa nhập.

Cập nhật 23.11.2026, sau khi anh yêu cầu sửa cho khớp cổng chính thức: trang chủ tiếng Việt, app (Mini App và iOS) và `data/events.json` đã theo cổng chính thức: khai mạc 20:00 ngày 12.12.2026, Festival 12.12.2026 – 03.01.2027, thêm Lễ hội nhạc Jazz 25–27.12, đổi tên triển lãm tại Công viên Trần Quốc Toản, thêm giờ 10:00 cho Golf, Hội thảo, Carnival. Quyết định 19.12 ở mục 10 không còn hiệu lực. Bản tiếng Anh và tiếng Hàn do tác vụ tự động sửa, cần kiểm tra lại.
