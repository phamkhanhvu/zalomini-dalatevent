# Trang quản trị nội dung

Địa chỉ: `https://dalatevent.com/#/quan-tri` (hoặc bảng tài khoản → "Quản trị nội dung").

## Sửa được gì
| Thẻ | Dữ liệu | Ghi chú |
|---|---|---|
| Sự kiện khác | `data/happening.json` → `items` | Thêm, sửa, gỡ. Mục nhập tay có `manual: true`, tác vụ mỗi sáng giữ lại. |
| Lịch nhạc Sense | `data/shows.json` → sân khấu `sense-acoustic` | 7 tối trong tuần. Mây Lang Thang, Lululola do tác vụ mỗi sáng lấy tự động. |
| Festival | `data/events.json` → `events` | Sửa tên, mô tả, giờ, địa điểm, trạng thái. Chưa thêm được chương trình mới, chưa sửa danh sách địa điểm. |

| Ưu đãi | Firestore `deals` | Dalat Deals. Lưu là có hiệu lực ngay (không qua GitHub). Chỉ công bố khi đối tác đã xác nhận. |

## Đường đi của một lần lưu
1. Trang kiểm tra dữ liệu ngay trong trình duyệt (`scripts/validate-core.mjs`). Có lỗi thì không cho lưu.
2. Lưu vào Firestore `cms/<tệp>` (chỉ tài khoản có trong `admins` ghi được).
3. **Hiện ngay trên trang:** mỗi khi khách mở dalatevent.com, site đọc `cms` (một yêu cầu, không cần đăng nhập) và áp lên dữ liệu vừa tải, theo đúng luật ở `scripts/cms-apply.mjs` (phạm vi sửa hẹp, kiểm tra lại, lỗi thì bỏ qua). Mã: `withCms` trong `web/src/data/store.ts`. Không cần token, không phải chờ.
4. **Lưu trữ vào repo:** tác vụ GitHub `.github/workflows/cms.yml` chép nội dung đó vào `data/` kèm tên người sửa. Lịch 10 phút của GitHub không đáng tin, nên quy trình cập nhật mỗi sáng (`docs/morning-update.md`) gọi tác vụ này trước khi làm việc khác. Việc lưu trữ chậm không ảnh hưởng tới những gì khách thấy.

Lịch sử sửa và hoàn tác: xem lịch sử commit của thư mục `data/` trên GitHub.

## Cấp và thu hồi quyền
1. Người cần quyền đăng nhập trên dalatevent.com rồi mở `#/quan-tri`. Trang hiện "Tài khoản chưa có quyền quản trị" kèm một mã.
2. Chủ dự án mở Firebase Console → Firestore → Data → bộ sưu tập `admins` → thêm tài liệu có Document ID đúng bằng mã đó (trường tùy ý, ví dụ `name`).
3. Thu hồi: xóa tài liệu đó.

## Giới hạn hiện tại
- Mọi quản trị viên có quyền như nhau, chưa có vai trò "biên tập" và "duyệt".
- Chưa có tải ảnh, chưa sửa lịch Mây Lang Thang và Lululola, chưa thêm chương trình Festival mới.
- Hai người sửa cùng một thẻ cùng lúc: bản lưu sau thắng.
