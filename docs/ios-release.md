# Đưa DalatEvent lên App Store

Tài khoản Apple Developer: cá nhân, nhóm Pham Hoang Khanh Vu, Team ID `LHRS82G34C`, có hiệu lực đến 24.11.2027 (đã ghi sẵn trong workflow và dự án Xcode).

Trạng thái ngày 23.11.2026: app dựng và chạy được trên máy ảo iPhone trong GitHub Actions (có ảnh chụp ở artifact `ios-may-ao-anh-chup` của workflow "Web và app iOS"). CHƯA ký, CHƯA lên TestFlight vì chưa có tài khoản Apple Developer. Workflow phát hành `.github/workflows/ios-release.yml` đã viết sẵn nhưng CHƯA chạy thử lần nào.

Mã định danh app: `vn.sensegroup.dalatevent`. Chỉ cho iPhone, iOS 15 trở lên, màn hình dọc.

## Việc chỉ chủ dự án làm được
1. **Đăng ký Apple Developer Program** (99 USD/năm) tại https://developer.apple.com/programs/enroll/ . Nên đăng ký dưới tên công ty (cần mã D-U-N-S) để tên người bán trên App Store là Sense Group; đăng ký cá nhân nhanh hơn nhưng tên người bán là tên cá nhân.
2. **Tạo app trong App Store Connect**: https://appstoreconnect.apple.com → Apps → dấu cộng → New App. Platform iOS, Name `DalatEvent`, Primary language Vietnamese, Bundle ID `vn.sensegroup.dalatevent` (nếu chưa có trong danh sách: developer.apple.com → Identifiers → dấu cộng → App IDs → nhập đúng mã này), SKU `dalatevent`.
3. **Tạo khóa API**: App Store Connect → Users and Access → Integrations → App Store Connect API → dấu cộng. Name `GitHub`, Access `Admin` (cần mức này để máy dựng tự tạo chứng chỉ ký). Tải tệp `.p8` về (chỉ tải được một lần), ghi lại Key ID và Issuer ID.
4. **Đặt 3 secret** tại https://github.com/phamkhanhvu/zalomini-dalatevent/settings/secrets/actions (New repository secret):
   - `ASC_KEY_ID`, `ASC_ISSUER_ID`: từ bước 3.
   - `ASC_KEY_P8`: mở tệp `.p8` bằng trình soạn văn bản, chép toàn bộ (cả dòng BEGIN và END).
   Không gửi các giá trị này qua chat hay email.
5. **Chạy phát hành**: GitHub → Actions → "Đưa app iOS lên TestFlight" → Run workflow → nhập số phiên bản (ví dụ 1.0). Khoảng 15 phút sau bản dựng xuất hiện ở App Store Connect → TestFlight. Cài app TestFlight trên iPhone để dùng thử.
6. **Nộp duyệt**: điền thông tin ở `docs/app-store-listing.md`, tải ảnh chụp màn hình, trả lời phần App Privacy, rồi Submit for Review. Việc nộp duyệt do chủ dự án quyết định và tự bấm.

## Những điểm Apple hay hỏi, đã chuẩn bị
- **Xóa tài khoản trong app** (bắt buộc khi có đăng ký tài khoản): Lịch trình → dải tài khoản → Xóa tài khoản.
- **Đăng nhập**: trong app chỉ có đăng nhập bằng email, không có đăng nhập Google, nên không bắt buộc "Sign in with Apple". Nếu sau này thêm Google vào app thì phải thêm cả Apple.
- **Vị trí**: chỉ xin khi người dùng bấm "Gần tôi" hoặc "Đóng dấu tại đây"; lời giải thích đã có trong Info.plist.
- **Thông báo**: chỉ xin quyền khi người dùng lưu một chương trình; nhắc trước 2 tiếng, hẹn ngay trên máy.
- **Chính sách quyền riêng tư**: https://dalatevent.com/#/quyen-rieng-tu
- **Mã hóa**: app chỉ dùng HTTPS của hệ điều hành; `ITSAppUsesNonExemptEncryption = false` đã khai.
- **Dalat Deals**: ưu đãi do đối tác cung cấp, không thanh toán trong app nên không dính quy định mua trong ứng dụng.

## Rủi ro bị từ chối cần biết trước
- Điều 4.2 (app chỉ là website bọc lại): app có nhắc lịch trên máy, xem ngoại tuyến bằng dữ liệu đóng gói sẵn, định vị, chia sẻ của hệ điều hành. Vẫn có khả năng bị hỏi; khi đó nêu các điểm này trong phần trả lời.
- Ảnh minh họa tạo bằng AI trong app: không vi phạm, nhưng ảnh chụp màn hình nộp lên phải đúng với app thật.
- Trang quản trị (`#/quan-tri`) có trong app nhưng chỉ tài khoản quản trị vào được.

## Chưa làm
- Đăng nhập Google và Apple trong app.
- Thông báo đẩy từ máy chủ (cần Firebase gói trả phí và chứng chỉ APNs).
- Bản Android.
