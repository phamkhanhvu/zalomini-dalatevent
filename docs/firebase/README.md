# Quy tắc bảo mật Firebase cho dự án `quay-hang-da-lat`

Bản soạn ngày 23.11.2026, dựa trên đúng những gì mã nguồn game đang đọc/ghi (`Game-Festival-Hoa-Dalat/index.html`, commit 23559b9). **Chưa áp dụng lên Firebase**: em không có quyền vào Console, và việc đổi rules cần anh duyệt.

| File | Dán vào đâu trong Firebase Console |
|---|---|
| `firestore.rules` | Firestore Database → Rules |
| `database.rules.json` | Realtime Database → Rules |

## Trước khi dán

1. Sao chép rules hiện tại ra một file để quay lui được.
2. Dán bản mới, bấm Publish.
3. Mở `dalatevent.com/game/`, thử: đăng nhập, chơi vài phút (lưu tiến trình), mở bảng xếp hạng, thấy người chơi khác, mua một gian, đổi tên thương hiệu, trang trí gian.
4. Nếu có lỗi, dán lại rules cũ là xong.

## Rules này cho phép gì

**Firestore**
- `saves/{uid}`: chỉ chính chủ đọc/ghi; chỉ hai trường `savedAt`, `state`.
- `board/{uid}`: ai cũng xem được (tối đa 50 dòng mỗi lần truy vấn); mỗi người chỉ ghi dòng của mình, đúng 5 trường, điểm không âm.
- Mọi nơi khác: khóa.

**Realtime Database**
- `presence/{uid}`: người đã đăng nhập mới xem được ai đang trực tuyến; mỗi người chỉ ghi/xóa vị trí của mình; kiểm kiểu và độ dài từng trường.
- `booths/{sự kiện}/{gian}`: ai cũng xem được. Mua gian trống phải ghi đúng `uid` của mình. Chủ gian được đổi tên, màu, trang trí nhưng không đổi được giá. Người khác chỉ mua lại được khi trả từ 1,5 lần giá cũ. Không ai xóa được gian.
- `payouts/{uid}/{mã}`: chỉ chủ đọc và xóa; người đã đăng nhập được tạo mới một khoản hoàn (tối đa 50 triệu xu), không sửa được khoản đã có.
- Mọi nơi khác: khóa.

## Đã kiểm thử đến đâu

- Realtime Database: chạy 32 tình huống trên trình mô phỏng rules (thư viện targaryen), cả 32 đạt. Gồm cả các thao tác game đang làm và các thao tác phải bị chặn.
- Firestore: **chưa chạy thử được** (trình giả lập Firestore không tải về được trong môi trường làm việc của em). Rules ngắn và đã đối chiếu với code, nhưng anh nên thử theo bước 3 ở trên, hoặc dùng Rules Playground trong Console.

## Những gì rules không chặn được

Rules chỉ kiểm tra ai ghi và ghi đúng dạng hay không, không biết người chơi có thật sự kiếm được số đó. Cụ thể:
- Điểm trên bảng xếp hạng và số xu trong tiến trình do máy người chơi tự khai, người rành kỹ thuật vẫn sửa được.
- Người đã đăng nhập có thể tự tạo khoản hoàn xu cho người khác, hoặc mua gian trống với giá thấp hơn giá niêm yết.
- Luật "mỗi người một gian" chỉ được kiểm ở phía game.

Muốn chặn hẳn phải chuyển các thao tác mua gian, hoàn tiền, ghi điểm sang Cloud Functions (cần gói Blaze). Em đề xuất để ở Phase 3 cùng DalatVerse, trừ khi anh định trao thưởng thật theo bảng xếp hạng.
