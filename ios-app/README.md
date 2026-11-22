# DalatEvent — vỏ app iOS

Dự án Capacitor chỉ chứa phần iOS (thư mục `ios/`, icon, màn hình chờ). Giao diện lấy từ gói website tĩnh ở `../web`.

```
npm install
npm run sync    # build ../web rồi chép vào dự án Xcode
npm run open    # mở Xcode (cần máy Mac)
```

Mã định danh app: `vn.sensegroup.dalatevent`. Icon và màn hình chờ sinh từ `assets/` bằng `npx capacitor-assets generate --ios`.

Chưa làm: ký app và đưa lên TestFlight (cần tài khoản Apple Developer).
