# DalatEvent 2.0 — Bước B: Kiến trúc đề xuất

Ngày: 23.11.2026. Tài liệu này là đề xuất; phần nào đã làm có ghi rõ "đã có".

## 1. Quyết định chính và lý do

Em chia dữ liệu thành ba miền, mỗi miền đặt ở nơi hợp với nó nhất:

| Miền | Gồm gì | Đặt ở đâu | Lý do |
|---|---|---|---|
| Danh mục sự kiện | Sự kiện, suất diễn, địa điểm, chuỗi sự kiện | Giai đoạn 1: một tệp `data/events.json` trong git. Giai đoạn 2 (khi mở cổng đối tác F07): chuyển vào Firestore, giữ nguyên các trường | Hiện chỉ có anh, em và tác vụ hằng ngày sửa lịch. Git cho sẵn lịch sử sửa (ai, lúc nào, sửa gì), quay lui một lệnh, không tốn phí, không phụ thuộc rules |
| Dữ liệu người dùng | Hồ sơ, mục đã lưu, lịch trình, cài đặt thông báo | Firestore của dự án `quay-hang-da-lat`, khóa theo UID | Dùng chung tài khoản với game (F06), không tạo hệ tài khoản thứ hai |
| Game | `saves`, `board`, `presence`, `booths`, `payouts` | Giữ nguyên như hiện tại | Đang chạy, không đụng |

So với bản audit: ở mục 7 của `audit.md` em nghiêng về đưa sự kiện vào Firestore ngay. Sau khi tính lại em đổi thành hai giai đoạn như trên, vì ba lý do: gói miễn phí của Firestore giới hạn 50.000 lượt đọc mỗi ngày (mỗi khách xem trang đọc vài chục bản ghi, mùa lễ hội dễ vượt); chưa có ai ngoài nhóm mình cần màn hình nhập liệu; và tệp JSON trong git thỏa đúng yêu cầu "thay đổi nhỏ, có thể đảo ngược" của PRD. Các trường dữ liệu đặt tên giống hệt mô hình Firestore sau này nên việc chuyển chỉ là chạy một lệnh nhập.

## 2. Sơ đồ

```
                 ┌──────────────────────────────┐
  Người sửa lịch │ data/events.json (git)       │  ← anh, em, tác vụ hằng ngày
                 │ + scripts/validate-events    │     (qua commit, có kiểm tra tự động)
                 └──────────────┬───────────────┘
                                │ đọc (tệp tĩnh, có cache)
        ┌───────────────────────┼────────────────────────┐
        ▼                       ▼                        ▼
  Web WordPress           App (Zalo + iOS)         Sau này: widget F23,
  dalatevent.com          dùng chung mã            trợ lý AI F11
  (HTML sẵn có làm        (bản đóng gói sẵn
   dự phòng và SEO)        làm dự phòng)
        │                       │
        └───────────┬───────────┘
                    ▼ đăng nhập (tùy chọn)
        ┌──────────────────────────────┐        ┌─────────────────────────┐
        │ Firebase quay-hang-da-lat    │        │ Game dalatevent.com/game │
        │ Auth  (một UID)              │◄──────►│ saves, board (Firestore) │
        │ Firestore: users/{uid}/…     │        │ presence, booths (RTDB)  │
        └──────────────────────────────┘        └─────────────────────────┘
```

## 3. Mô hình dữ liệu sự kiện (đã có, bản 1)

Tệp `data/events.json`, đã nhập 11 chương trình Festival và 7 địa điểm.

| Nhóm | Trường | Ghi chú |
|---|---|---|
| `series[]` | `id`, `name`, `start_at`, `end_at` | Chuỗi sự kiện, ví dụ Festival Hoa 2026. Sự kiện lẻ quanh năm không cần chuỗi |
| `venues[]` | `id`, `name`, `map_query`, `lat`, `lng` | Tọa độ đang trống: `CẦN XÁC MINH`, em không tự điền |
| `events[]` | `id`, `series`, `title`, `category`, `description`, `venue_id`, `venue_name`, `status`, `tentative`, `sessions[]`, `source_url`, `source_note`, `verified_at`, `updated_at`, `note` | `status`: `draft / pending / published / postponed / cancelled / completed` |
| `events[].sessions[]` | `start_at`, `end_at`, `all_day` | Một sự kiện nhiều suất. Giờ ghi kèm `+07:00` |

Ánh xạ sang bảng trong PRD mục 4: `events` ↔ events, `sessions` ↔ event_sessions, `venues` ↔ venues, lịch sử git ↔ audit_logs (giai đoạn 1). `organizations`, `event_media` thêm ở giai đoạn 2.

Trình kiểm tra `scripts/validate-events.mjs` (đã có, chạy tự động trên GitHub mỗi lần sửa dữ liệu) chặn: trùng mã, trạng thái lạ, giờ kết thúc trước giờ bắt đầu, trỏ tới địa điểm không tồn tại, sự kiện hoãn/hủy thiếu ghi chú, sự kiện công bố mà không có nguồn. Nó cảnh báo (không chặn): thiếu link nguồn, chưa xác minh, thiếu tọa độ. Hiện còn 28 cảnh báo, chủ yếu vì 10 trong 11 chương trình chưa có link nguồn và ngày xác minh.

## 4. Dữ liệu người dùng (đề xuất, chưa làm)

```
users/{uid}                      display_name, created_at, consent{…}
users/{uid}/favorites/{eventId}  created_at
users/{uid}/itineraries/{id}     name, session_refs[], sharing_mode
users/{uid}/notification_prefs   event_types[], quiet_hours, channels[]
```

Rules: mỗi người chỉ đọc/ghi nhánh `users/{uid}` của mình. Đây là phần bổ sung vào `docs/firebase/firestore.rules` khi làm F03/F06; chưa viết vào bản rules hiện tại vì chưa có tính năng dùng tới.

Khi chưa đăng nhập, app vẫn lưu trên máy như hiện nay. Đăng nhập xong thì gộp mục đã lưu trên máy lên tài khoản.

## 5. Phân quyền

| Vai trò | Giai đoạn 1 | Giai đoạn 2 |
|---|---|---|
| Khách | Xem mọi sự kiện đã công bố | Như cũ |
| Người dùng | Lưu, lịch trình, cài đặt của riêng mình | Thêm đăng ký, vé |
| Người sửa lịch | Ai có quyền ghi vào repo (hiện là anh) | Organizer theo tổ chức, gửi duyệt |
| Quản trị | Anh | Danh sách `admins/{uid}` trong Firestore, kiểm bằng rules |

## 6. Cách web và app đọc dữ liệu

- Tệp JSON phát từ GitHub (`raw.githubusercontent.com`, có cache khoảng 5 phút). Khả năng chịu tải mùa lễ hội: `CẦN XÁC MINH`; nếu không đủ thì đặt bản sao lên chính máy chủ dalatevent.com theo cách game đang được đưa lên.
- Web: giữ nguyên HTML hiện tại làm nội dung gốc cho Google và cho lúc mất mạng; đoạn mã nhỏ đọc JSON để lọc theo ngày và cập nhật trạng thái.
- App: đóng gói sẵn một bản dữ liệu lúc build, mở app thì tải bản mới; không tải được thì dùng bản đóng gói và ghi rõ ngày cập nhật.

## 7. Những gì cần máy chủ (để sau, cần gói Blaze)

Vé QR và check-in (F05, F19), thông báo đẩy khi đổi/hủy lịch (F04), đổi quà Passport (F09), chống gian lận điểm trong game. Trước khi tới đó, nhắc lịch trên máy (đã có trong app iOS) đáp ứng được phần "nhắc trước giờ".

## 8. Cờ bật tắt tính năng

Mỗi tính năng mới trên web gắn sau một khóa trong đoạn cấu hình đầu trang (ví dụ `today_filter: false`). Bật cho riêng mình bằng `?ff=today_filter` trên đường dẫn để thử trên trang thật trước khi mở cho mọi người.
