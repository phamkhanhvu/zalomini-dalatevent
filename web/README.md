# DalatEvent — gói website tĩnh

Website độc lập, không dùng WordPress. Build ra một thư mục `dist/` gồm HTML, CSS, JS, ảnh và dữ liệu; chép thư mục đó lên bất kỳ máy chủ web nào là chạy. Cũng chính `dist/` này là phần giao diện của app iOS (thư mục `../ios-app`).

## Có gì trong site

| Mục | Đường dẫn | Dữ liệu |
|---|---|---|
| Trang chủ: Festival, đếm ngược, "Đang diễn ra và sắp tới" | `#/` | `events.json`, `happening.json` |
| Festival: các chương trình chính, lọc theo loại, lưu | `#/chuong-trinh` | `events.json` |
| Show diễn: Mây Lang Thang, Lululola, Sense Acoustic Cafe | `#/show` | `shows.json` |
| Bản đồ: địa điểm và chỉ đường | `#/ban-do` | `events.json` |
| Đã lưu | `#/da-luu` | lưu trên máy người dùng |

## Lệnh

```
npm install
npm run dev        # chạy thử trên máy
npm run build      # tạo dist/
npm run typecheck
```

## Sửa lịch ở đâu

Sửa các tệp trong `../data/` (gốc repo): `events.json`, `shows.json`, `happening.json`. Lệnh build tự chép chúng vào gói. Không sửa `src/data/bundled/` và `public/data/` bằng tay.

Site đã lên mạng thì có hai cách cập nhật lịch:
- Build lại và chép `dist/` lên.
- Hoặc chỉ chép đè ba tệp trong `dist/data/` trên máy chủ: mỗi lần mở, site tự tải bản mới (không cần build lại).

## Đưa lên máy chủ

Chép toàn bộ nội dung `dist/` vào thư mục gốc của tên miền (hoặc một thư mục con, site dùng đường dẫn tương đối). Không cần PHP, không cần cơ sở dữ liệu, không cần cấu hình chuyển hướng vì site dùng đường dẫn dạng `#/`.

Mỗi lần đẩy code lên GitHub, bản `dist/` đã build cũng có sẵn ở mục Artifacts của lần chạy "Web và app iOS", tên `dalatevent-web`.

## Dùng cho app iOS

```
cd ../ios-app
npm install
npm run sync       # build gói web rồi chép vào dự án Xcode
npm run open       # mở Xcode (cần máy Mac)
```

Trong app cài trên máy có thêm: nhắc lịch trước giờ diễn 2 tiếng cho chương trình đã lưu, chia sẻ và mở bản đồ bằng app của máy. App tải dữ liệu mới từ địa chỉ trong biến `VITE_DATA_URL` lúc build; mặc định là thư mục `data/` công khai của repo trên GitHub. Khi site có tên miền, đặt `VITE_DATA_URL=https://<tên miền>/data/`.

## Giới hạn hiện tại

- Chỉ có tiếng Việt.
- Chưa có tài khoản, bộ lọc theo ngày và bản đồ "gần tôi" (xem `../docs/phase-1-backlog.md`).
- Nội dung do JavaScript vẽ ra; Google đọc được nhưng nếu cần tối ưu tìm kiếm kỹ hơn thì nên thêm bước xuất HTML sẵn.
- Lịch show và mục "Đang diễn ra" là bản chụp ngày 23.11.2026; việc cập nhật hằng ngày vào `data/` chưa được nối.
