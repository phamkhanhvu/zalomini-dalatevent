# DalatEvent 2.0 — Kế hoạch chuyển đổi dữ liệu

Ngày: 23.11.2026. Nguyên tắc: không xóa gì, mỗi bước quay lui được, trang công khai không đổi cho tới khi anh duyệt.

## Bước 1 — Gom dữ liệu về một nguồn

| Việc | Trạng thái | Quay lui |
|---|---|---|
| Tạo `data/events.json` từ 11 chương trình và 7 địa điểm đang có trong app | Đã làm | Xóa tệp; app chưa dùng tới nên không ảnh hưởng |
| Trình kiểm tra dữ liệu và chạy tự động trên GitHub | Đã làm | Xóa workflow |
| Nhập lịch Mây Lang Thang, Lululola, Sense Acoustic và mục "Đang diễn ra" vào cùng tệp | Chưa làm | — |
| Bổ sung link nguồn và ngày xác minh cho 10 chương trình còn thiếu | Chưa làm, cần nguồn chính thức | — |
| Bổ sung tọa độ địa điểm | Chưa làm, cần xác minh trên bản đồ | — |

## Bước 2 — App đọc từ nguồn chung

Thay `src/data/festival.ts` bằng dữ liệu sinh ra từ `data/events.json` lúc build; thêm tải bản mới khi mở app. Bỏ đoạn bóc HTML từ trang web. Quay lui: `git revert`, cả Mini App lẫn iOS tự build lại.

## Bước 3 — Web đọc từ nguồn chung

Thêm một khối mới vào trang chủ (sau cờ bật tắt), không sửa các khối hiện có. Khi anh duyệt mới bật cho mọi người. Quay lui: tắt cờ, hoặc gỡ khối; WordPress cũng giữ bản sửa đổi của trang.

## Bước 4 — Tác vụ hằng ngày ghi vào dữ liệu

Hiện tác vụ 05:47 sửa thẳng HTML của ba trang. Chuyển thành: ghi sự kiện tìm được vào `data/events.json` ở trạng thái `pending` kèm link nguồn, và chỉ những mục đã `published` mới hiện ra. Việc này cần tác vụ có quyền ghi vào repo: `CẦN XÁC MINH` cách cấp quyền. Trong lúc chưa chuyển, giữ nguyên cách làm hiện tại.

## Bước 5 — Chuyển danh mục sự kiện sang Firestore (khi mở cổng đối tác)

Chỉ làm khi bắt đầu F07. Chạy lệnh nhập từ JSON vào các collection `events`, `venues`; giữ tệp JSON thêm một thời gian như bản sao. Trước khi làm: sao lưu Firestore, thử rules trên trình giả lập, anh duyệt rules.

## Dữ liệu sẽ không đụng tới

`saves`, `board`, `presence`, `booths`, `payouts` của game; tài khoản trong Firebase Authentication; bài viết và trang WordPress ngoài trang chủ.

## Việc cần anh làm hoặc quyết

1. Áp dụng rules trong `docs/firebase/` (hoặc cấp quyền xem để em đối chiếu rules hiện tại trước).
2. Cho nguồn chính thức của lịch Festival (văn bản, link) để điền `source_url` và `verified_at`.
3. Trang chính sách quyền riêng tư: em soạn nháp, anh duyệt nội dung pháp lý trước khi đăng.
