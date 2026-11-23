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

## Trang chủ đa sự kiện (23.11.2026)
- Đã làm (có code, 32 test, build, kiểm tra trình duyệt 390px và 1280px): trang chủ không còn chỉ nói về Festival; ô tìm kiếm hiểu tên sự kiện, địa điểm, nghệ sĩ và ngày tháng; ba nút "Khám phá sự kiện", "Xem lịch trình", "Mở bản đồ"; mục "Đang diễn ra tại Đà Lạt" gộp Festival, sự kiện khác (data/happening.json) và show diễn; số liệu Festival (đếm ngược, thời gian, kỳ, số chương trình, trạng thái) lấy từ data/events.json.
- `data/happening.json` đổi cấu trúc: mỗi mục cần `start_date`, `end_date`, `venue`. Tác vụ cập nhật mỗi sáng CẦN sửa lời nhắc theo cấu trúc này.
- CẦN XÁC MINH / chờ: ảnh thật của lễ hội (đêm khai mạc, sân khấu âm nhạc); hiện dùng ảnh phong cảnh có sẵn.

## Lịch trình trên máy và nháp chính sách (23.11.2026)
- S4-4 (phần không cần tài khoản) xong trên web: thêm được chương trình Festival, sự kiện khác và show diễn vào Lịch trình từ mọi danh sách; xếp theo ngày; cảnh báo trùng giờ; xuất tệp lịch `.ics`; chia sẻ dạng văn bản. 7 kiểm thử tự động (`web/tests/itinerary.test.ts`), tổng 39. Chưa có: chia sẻ bằng link, đồng bộ giữa các máy (chờ S4-1 đến S4-3). Tệp `.ics` mới thử tải về và đọc nội dung, CHƯA thử mở trên iPhone thật.
- App iOS: nhắc lịch hiện chỉ áp dụng cho chương trình Festival, chưa cho show diễn.
- S1-6: có bản nháp `docs/privacy-policy-draft.md`, chưa công bố, còn 4 chỗ CẦN XÁC MINH.

## Chia sẻ bằng link, mã QR, khung nhúng (23.11.2026)
- F03: chia sẻ lịch trình bằng link (`#/lich-trinh?d=...`), người nhận xem rồi bấm lưu về máy mình. Link từ bên ngoài được kiểm tra từng trường (2 kiểm thử). Link dài khoảng 200 ký tự cho mỗi show.
- F04 (app iOS): nhắc trước 2 tiếng cho cả show diễn đã lưu, tối đa 40 mục. CHƯA thử trên máy thật.
- F23: mỗi chương trình Festival có link riêng (`#/chuong-trinh?xem=<mã>`) và mã QR tải được; trang `#/nhung-lich` cho đối tác lấy mã nhúng (iframe `#/nhung?n=&loai=`) và mã QR của site. Chưa có: QR cho từng show diễn, đo lượt quét, widget theo từng nhà tổ chức.
- Tổng 41 kiểm thử tự động.

## Tài khoản và đồng bộ lịch trình (23.11.2026)
- S4-1: đã đọc rules thật trên Console. Rules sẵn có đủ chặt, giữ nguyên; chỉ thêm khối `plans/{uid}` cho lịch trình (xem `docs/firebase/applied/2026-11-23.md`).
- S4-2, S4-3: trang Lịch trình có đăng nhập Google hoặc email (chung tài khoản với trò chơi) và đồng bộ lịch trình qua `plans/{uid}`. Thư viện Firebase chỉ tải khi người dùng mở phần tài khoản. 6 kiểm thử cho quy tắc gộp (`web/tests/sync.test.ts`), tổng 47.
- S4-5: mới có "Xóa lịch trình trên tài khoản". CHƯA có xóa hẳn tài khoản (sẽ xóa cả tiến trình trò chơi, cần chủ dự án quyết định cách làm).
- App iOS: đăng nhập Google bằng cửa sổ bật lên không chạy trong app, nên trong app chỉ hiện đăng nhập email. Chưa thử trên máy thật.

## Chính sách và xóa tài khoản (23.11.2026)
- S1-6: trang `#/quyen-rieng-tu` đã công bố; email liên hệ lấy từ biến `CONTACT_EMAIL` của GitHub Actions.
- S4-5: có nút "Xóa tài khoản" trong bảng tài khoản (trang Lịch trình): xác nhận lại danh tính (mật khẩu hoặc cửa sổ Google), xóa `plans`, `saves`, `board` của chính người dùng, dọn `presence` và `payouts`, rồi xóa tài khoản đăng nhập. CHƯA chạy thử thao tác xóa thật (không có tài khoản thử; không thử trên tài khoản của chủ dự án). Gian hàng trong trò chơi (`booths`) không xóa được từ phía người dùng do rules. Trong app iOS, tài khoản chỉ có Google phải xóa trên website.

## Ngoại tuyến, báo đổi lịch, báo sai thông tin (23.11.2026)
- F15 (một phần): service worker `web/public/sw.js` giữ khung trang, mất mạng vẫn mở được lịch, lịch trình và ảnh; có dải "Đang xem ngoại tuyến". Chỉ xử lý tệp của site tĩnh, không đụng `/game/` và WordPress. Bản đồ Google vẫn cần mạng. Site thêm được vào màn hình chính của điện thoại như một app.
- F03: trang Lịch trình báo khi chương trình Festival đã lưu bị đổi giờ, hoãn, hủy hoặc bị gỡ so với lúc lưu; nút "Đã biết". 5 kiểm thử (`web/tests/changes.test.ts`), tổng 52. Chỉ báo khi người dùng mở trang, chưa có thông báo đẩy.
- F25 (một phần): link "Thông tin chưa đúng? Báo cho DalatEvent" trong từng chương trình, mở email soạn sẵn tới `CONTACT_EMAIL`.
- Nút Đăng nhập ở góc trên bên phải mọi trang; bảng tài khoản có thẻ Đăng nhập / Đăng ký, quên mật khẩu, xóa tài khoản.

## Banner và ảnh minh họa (23.11.2026)
- Chủ dự án gửi 10 banner "Đà Lạt có gì vui?" (chữ nằm sẵn trong ảnh) và 10 ảnh cùng chủ đề không chữ, đều là ảnh tạo bằng AI. Trang chủ có băng chuyền 10 banner (`web/src/components/banners.tsx`); ảnh không chữ dùng cho khối Festival nổi bật, thư viện ảnh trang Festival và đầu trang Show diễn, đều ghi rõ "ảnh minh họa". Ảnh chia sẻ mạng xã hội (`og-image.jpg`) đổi sang banner "Săn ảnh đẹp".
- Vẫn CẦN ảnh chụp thật tại sự kiện cho từng chương trình Festival.

## Trang địa điểm (23.11.2026)
- F18 (một phần): mỗi địa điểm Festival và mỗi điểm diễn show có trang riêng `#/dia-diem/<mã>` (ví dụ `f-lam-vien`, `s-lululola-0`): chỉ đường, bản đồ, liên hệ, lịch 60 ngày tới tại đó, chia sẻ, mã QR. Vào từ tìm kiếm, bản đồ, bảng chương trình, trang Show diễn. 5 kiểm thử (`web/tests/places.test.ts`), tổng 57.
- F23: khung nhúng nhận thêm `noi=<mã địa điểm>` để một quán hoặc sân khấu chỉ nhúng lịch của mình; trang `#/nhung-lich` có ô chọn địa điểm.
- Chưa có: trang cho đơn vị tổ chức của Festival (dữ liệu `organizer` mới có ở 4 chương trình), ảnh và mô tả riêng cho từng địa điểm.
- Sửa lỗi: phần đầu trang bị mất lề phải trên điện thoại từ lúc thêm nút Đăng nhập (khoảng 11:27 đến lần cập nhật này).

## Trang quản trị nội dung (23.11.2026)
- F08 (bản đầu): xem `docs/admin.md`. Mã: `web/src/pages/admin.tsx` (tải riêng, khách thường không tải), `scripts/validate-core.mjs` (luật kiểm tra dùng chung), `scripts/cms-apply.mjs`, `scripts/cms-pull.mjs`, `.github/workflows/cms.yml`. 7 kiểm thử (`web/tests/cms.test.ts`), tổng 64.
- CHƯA chạy thử trọn vòng với tài khoản quản trị thật: chưa có tài khoản nào được cấp quyền (cần UID của chủ dự án).

## Hộ chiếu Đà Lạt (23.11.2026)
- F09/F17 (bản đầu): trang `#/ho-chieu`. Mỗi địa điểm có tọa độ là một dấu "đã đến"; mỗi chương trình Festival đã công bố (có tọa độ) là một dấu "đã dự". Bấm "Đóng dấu tại đây": đứng trong 300 m, dấu sự kiện chỉ đóng được từ 1 giờ trước tới 1 giờ sau. Máy chỉ lưu tên dấu và thời điểm, không lưu tọa độ. Đồng bộ theo tài khoản (trường `stamps` trong `plans/{uid}`), gộp không mất dấu. 6 kiểm thử (`web/tests/passport.test.ts`), tổng 70.
- Kiểm tra vị trí chạy trên máy người dùng nên có thể bị giả; KHÔNG dùng để phát quà có giá trị khi chưa có cách xác nhận phía máy chủ hoặc mã QR tại chỗ.
- Chưa có: dấu bằng mã QR tại sự kiện, quà/ưu đãi, bảng xếp hạng, dấu cho địa điểm chưa có tọa độ (Công viên Trần Quốc Toản, Mây Lang Thang Lang Biang).

## Trợ lý "Hôm nay đi đâu?" (23.11.2026)
- F11 (bản theo luật, KHÔNG dùng mô hình AI): trang `#/tro-ly`, vào từ trang chủ. `web/src/utils/assistant.ts` đọc câu tiếng Việt (thời gian, số người, ngân sách, sở thích, gần đâu) rồi lọc dữ liệu đã đối chiếu. Giá chỉ lấy từ dữ liệu (giá ghi ở đêm diễn; phiếu nước của sân khấu có lịch tuần); không có giá thì xếp vào nhóm "chưa rõ giá". 8 kiểm thử (`web/tests/assistant.test.ts`), tổng 78, gồm đúng câu mẫu trong PRD.
- Giới hạn: không hiểu câu ngoài các mẫu đã lập trình (ví dụ "chỗ nào lãng mạn", "tránh đông người"); không trò chuyện qua lại. Bản dùng AI thật cần máy chủ trung gian và khóa API có trả phí, phải được chủ dự án duyệt.
- Dữ liệu giá còn mỏng: Mây Lang Thang và các chương trình Festival chưa có giá trong dữ liệu.

## Trợ lý xếp lịch trình từ cẩm nang Đà Lạt Đi Đâu (23.11.2026)
- Theo yêu cầu chủ dự án: trợ lý không liệt kê chi tiết giá nữa mà xếp một lịch trình theo buổi (sáng, trưa, chiều, tối). Điểm tham quan và quán lấy từ `data/places.json` (438 địa điểm, đồng bộ từ https://sensegroup.vn/di-da-lat/ bằng `node scripts/sync-places.mjs`, bỏ nhóm Lưu trú); sự kiện và show đặt đúng giờ thật. Mã: `web/src/utils/daytrip.ts`, 7 kiểm thử (`web/tests/daytrip.test.ts`), tổng 85.
- Ngân sách chỉ còn dùng để bỏ show có giá vượt mức, không hiện bảng giá.
- Giới hạn: chưa tính quãng đường và thời gian di chuyển (danh mục không có tọa độ; điểm thứ hai buổi sáng dựa vào trường `related` của cẩm nang); quán ăn, cà phê chọn luân phiên trong khu Xuân Hương, chưa có đánh giá chất lượng; chưa xét giờ mở cửa.
- `data/places.json` không tự cập nhật: chạy lại script khi cẩm nang đổi.

## Dalat Deals (23.11.2026)
- F20 (bản đầu): trang `#/uu-dai`, thẻ "Ưu đãi" trong trang quản trị. Ưu đãi có đối tác, điều kiện, thời hạn, số lượt; chỉ hiện khi đã công bố và đối tác đã xác nhận (ghi rõ xác nhận với ai). Dùng ưu đãi cần đăng nhập, mỗi tài khoản một lần, có màn hình mã 6 ký tự kèm đồng hồ chạy để đưa nhân viên xem. Số đã dùng do máy chủ đếm (đo chuyển đổi). Quy chế ưu đãi ghi ngay trên trang. 5 kiểm thử (`web/tests/deals.test.ts`), tổng 90.
- CHƯA có ưu đãi thật nào: không tự tạo ưu đãi khi đối tác chưa xác nhận.
- CHƯA chạy thử các bước cần đăng nhập (tạo ưu đãi, dùng, chặn dùng lần hai, chặn vượt lượt).
- Chưa có: công cụ để đối tác tự tra mã, danh sách lượt dùng cho quản trị viên xem/xuất, ưu đãi gắn với sự kiện hoặc dấu hộ chiếu, hoàn lượt.

## Quản trị: lưu là hiện ngay (23.11.2026)
- Bỏ cách dùng token GitHub. Site tự đọc nội dung quản trị viên đã lưu (Firestore `cms`) mỗi lần khách mở trang và áp ngay; tác vụ GitHub chỉ còn vai trò lưu trữ vào repo. 9 kiểm thử cho luật áp nội dung, tổng 92; đã thử trên trình duyệt với dữ liệu giả lập (nội dung mới hiện ngay, nội dung ngoài phạm vi và nội dung lỗi bị bỏ, mất mạng thì dùng dữ liệu gốc).
- Mỗi lượt mở trang tốn thêm 3 lượt đọc Firestore (gói miễn phí 50.000 lượt đọc/ngày, tương đương khoảng 16.000 lượt mở trang/ngày). Vượt mức đó cần gộp `cms` thành một tài liệu hoặc nâng gói.

## App iOS (23.11.2026)
- Mỗi lần đẩy mã, GitHub Actions dựng app, cài lên máy ảo iPhone, mở app và chụp màn hình (artifact `ios-may-ao-anh-chup`).
- Trong app: đăng nhập chỉ bằng email (khởi tạo Firebase Auth bản gọn để không treo), khóa màn hình dọc.
- Sẵn cho phát hành: `.github/workflows/ios-release.yml` (CHƯA chạy thử, cần tài khoản Apple Developer và 4 secret), `docs/ios-release.md`, `docs/app-store-listing.md`, 6 ảnh nháp trong `docs/app-store-screenshots/`.
- CHƯA thử trên iPhone thật: nhắc lịch, định vị, đăng nhập email, chia sẻ.
