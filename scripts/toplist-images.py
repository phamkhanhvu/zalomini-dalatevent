#!/usr/bin/env python3
"""
Lấy 1 ảnh đại diện cho mỗi địa điểm trong data/toplist.json từ thư mục Google Drive của điểm đó
(thư mục phải để "Bất kỳ ai có đường liên kết đều xem được"). Ảnh được thu nhỏ thành WebP 720px,
lưu ở data/toplist-img/<id>.webp và ghi "img": true vào địa điểm.
Cách chạy (trên máy chủ GitHub Actions): python3 scripts/toplist-images.py [so_diem_toi_da]
"""
import json, os, sys, tempfile, time

import gdown
from PIL import Image, ImageOps

if len(sys.argv) > 1 and sys.argv[1].startswith("diag:"):
    # Kiểm tra quyền xem công khai: diag:<id thư mục>:<id ảnh>
    import urllib.request
    _, fo, fi = sys.argv[1].split(":")
    for u in ("https://drive.google.com/drive/folders/" + fo, "https://drive.google.com/thumbnail?id=" + fi + "&sz=w720", "https://lh3.googleusercontent.com/d/" + fi + "=w720"):
        try:
            r = urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"}), timeout=30)
            b = r.read()
            import re as _re
            t = _re.search(rb"<title>(.*?)</title>", b[:200000])
            print(r.status, r.headers.get("Content-Type"), len(b), t.group(1)[:80] if t else b"", r.geturl()[:80])
        except Exception as e:
            print("ERR", u.split("?")[0], e)
    sys.exit(0)
LIMIT = int(sys.argv[1]) if len(sys.argv) > 1 else 50
OUT = "data/toplist-img"
EXT = (".jpg", ".jpeg", ".png", ".webp", ".heic", ".jfif")

os.makedirs(OUT, exist_ok=True)
data = json.load(open("data/toplist.json", encoding="utf-8"))
done = fail = 0
failed = []
for p in data["places"]:
    if done + fail >= LIMIT:
        break
    if p.get("img") or p.get("img_failed") or not p.get("img_folder"):
        continue
    dest = os.path.join(OUT, p["id"] + ".webp")
    try:
        files = gdown.download_folder(id=p["img_folder"], skip_download=True, quiet=True) or []
        imgs = [f for f in files if f.path.lower().endswith(EXT)]
        if not imgs:
            raise RuntimeError("thư mục không có ảnh hoặc không mở công khai")
        with tempfile.TemporaryDirectory() as tmp:
            raw = gdown.download(id=imgs[0].id, output=os.path.join(tmp, "a"), quiet=True)
            if not raw:
                raise RuntimeError("không tải được ảnh")
            im = ImageOps.exif_transpose(Image.open(raw)).convert("RGB")
            im.thumbnail((720, 720))
            im.save(dest, "WEBP", quality=72, method=6)
        p["img"] = True
        done += 1
        print("ok  ", p["id"], os.path.getsize(dest) // 1024, "KB")
    except Exception as e:  # thư mục riêng tư, hết hạn mức, ảnh lỗi...
        fail += 1
        failed.append(p["id"])
        print("lỗi ", p["id"], str(e)[:160])
        if "quota" in str(e).lower() or "too many" in str(e).lower():
            break
    time.sleep(1)

# Đánh dấu điểm lỗi để lần sau bỏ qua (xóa "img_failed" để thử lại)
for p in data["places"]:
    if p["id"] in failed:
        p["img_failed"] = True
with open("data/toplist.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=1)
    f.write("\n")
left = sum(1 for p in data["places"] if p.get("img_folder") and not p.get("img") and not p.get("img_failed"))
print(f"Xong: {done} ảnh mới, {fail} lỗi, còn {left} điểm chưa thử")
