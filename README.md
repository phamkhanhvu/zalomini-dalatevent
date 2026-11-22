# DalatEvent – Festival Hoa Đà Lạt lần thứ XI (Zalo Mini App)

Mini app xem lịch Festival Hoa Đà Lạt 2026 ngay trong Zalo. Viết bằng React + TypeScript, dùng bộ giao diện `zmp-ui` và `zmp-sdk` của Zalo.

## Có gì trong app

| Tab | Nội dung |
| --- | --- |
| Trang chủ | Đếm ngược đến đêm khai mạc, mục "Đang diễn ra và sắp tới" (tự lấy từ dalatevent.com), 3 chương trình gần nhất, ảnh Đà Lạt mùa hoa, số liệu kỳ 2024, nút gọi hotline / chia sẻ / yêu thích |
| Chương trình | 11 chương trình chính, lọc theo 4 nhóm, bấm vào để xem chi tiết, lưu, chỉ đường, chia sẻ |
| Bản đồ | 7 địa điểm, chương trình tại từng nơi, nút chỉ đường Google Maps |
| Đã lưu | Các chương trình người dùng đã lưu (giữ trên máy của họ) |

## Đưa lên Zalo (làm một lần)

1. Mini App đã tạo trên https://mini.zalo.me, ID: **2398145058980083349**.
2. Cài Node.js (bản 18 trở lên), rồi mở Terminal trong thư mục này:
   ```bash
   npm install -g zmp-cli
   npm install
   ```
3. Đăng nhập và chạy thử trên máy tính (Mini App ID `2398145058980083349` đã ghi sẵn trong file `.env`):
   ```bash
   zmp login     # quét mã QR bằng Zalo của tài khoản quản lý mini app
   zmp start     # mở bản chạy thử trên trình duyệt
   ```
4. Đưa bản thử lên Zalo:
   ```bash
   zmp deploy    # chọn bản Development hoặc Testing
   ```
   Lệnh này in ra mã QR. Quét bằng Zalo để mở mini app trên điện thoại.
5. Trong trang quản lý Mini App: đặt tên, logo, mô tả, rồi gửi Zalo xét duyệt để công khai.

## Tự động đưa lên Zalo khi đẩy code (GitHub Actions)

File `.github/workflows/deploy.yml` chạy mỗi lần có code mới trên nhánh `main`: kiểm tra lỗi, đóng gói, rồi đưa bản **Testing** lên Zalo.

Cần làm một lần:

1. Trên máy tính, chạy `zmp login` và quét mã QR. Lệnh này ghi `ZMP_TOKEN=...` vào file `.env`.
2. Trên GitHub: Settings > Secrets and variables > Actions > New repository secret, tên `ZMP_TOKEN`, dán giá trị token vào.

Chưa có secret thì workflow chỉ build và báo cảnh báo, không deploy. Token là bí mật: không dán vào code, không gửi qua chat.

## Sửa nội dung

Toàn bộ lịch, địa điểm, mô tả nằm ở **`src/data/festival.ts`**. Sửa xong chạy lại `zmp deploy`.

- `FESTIVAL.opening` / `openingLabel` / `openingTentative`: ngày giờ khai mạc và có ghi "dự kiến" hay không.
- `PROGRAMS`: 11 chương trình. `tentative: true` sẽ hiện nhãn "Dự kiến".
- `VENUES`: địa điểm trên tab Bản đồ.
- Mục "Đang diễn ra" lấy trực tiếp từ trang chủ dalatevent.com mỗi lần mở app. Nếu không tải được, app dùng danh sách dự phòng `HAPPENING_FALLBACK`.

## Lưu ý

- Ngày khai mạc đang ghi **tối 12.12.2026 (dự kiến)** theo phương án họp ngày 18.11.2026 của UBND tỉnh Lâm Đồng; poster trước đó ghi 19.12. Khi có lịch chính thức, sửa ở `festival.ts`.
- Chỉ ngày khai mạc và bế mạc có giờ cụ thể (20:00). Các chương trình khác chỉ có ngày.
- Các nút Chỉ đường, Chia sẻ, Yêu thích, Gọi điện chỉ chạy đầy đủ bên trong Zalo. Trên trình duyệt chúng dùng phương án thay thế.
- Bản này chỉ có tiếng Việt.

## Lệnh khác

```bash
npm run dev        # chạy thử bằng Vite, không cần đăng nhập Zalo
npm run build      # đóng gói ra thư mục www/
npm run typecheck  # kiểm tra lỗi TypeScript
```
