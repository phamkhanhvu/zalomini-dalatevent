#!/usr/bin/env python3
"""
Lấy 1 ảnh đại diện cho mỗi địa điểm trong data/toplist.json từ thư mục Google Drive của điểm đó
(thư mục phải để "Bất kỳ ai có đường liên kết đều xem được"). Ảnh được thu nhỏ thành WebP 720px,
lưu ở data/toplist-img/<id>.webp và ghi "img": true vào địa điểm.
Cách chạy (trên máy chủ GitHub Actions): python3 scripts/toplist-images.py [so_diem_toi_da]

Chạy lại bao nhiêu lần cũng được: điểm đã có ảnh hoặc đã đánh dấu lỗi thì bỏ qua.
Kết quả được lưu dần sau mỗi 25 ảnh và script tự dừng trước khi máy chủ hết giờ.
"""
import io, json, os, signal, sys, tempfile, time, urllib.request

import gdown
from PIL import Image, ImageOps

UA = {"User-Agent": "Mozilla/5.0"}

if len(sys.argv) > 1 and sys.argv[1].startswith("diag:"):
    # Kiểm tra quyền xem công khai: diag:<id thư mục>:<id ảnh>
    import re as _re

    _, fo, fi = sys.argv[1].split(":")
    for u in ("https://drive.google.com/drive/folders/" + fo, "https://lh3.googleusercontent.com/d/" + fi + "=w720"):
        try:
            r = urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30)
            b = r.read()
            t = _re.search(rb"<title>(.*?)</title>", b[:200000])
            print(r.status, r.headers.get("Content-Type"), len(b), t.group(1)[:80] if t else b"", r.geturl()[:80])
        except Exception as e:
            print("ERR", u, e)
    sys.exit(0)

LIMIT = int(sys.argv[1]) if len(sys.argv) > 1 else 50
MAX_SECONDS = 150 * 60  # tự dừng để còn thời gian lưu kết quả
PER_PLACE = 120  # giây tối đa cho một địa điểm
SOFT_STREAK = 8  # số lần liên tiếp không đọc được thư mục thì coi là bị Google giới hạn, dừng
OUT = "data/toplist-img"
EXT = (".jpg", ".jpeg", ".png", ".webp", ".heic", ".jfif")
START = time.time()

os.makedirs(OUT, exist_ok=True)
data = json.load(open("data/toplist.json", encoding="utf-8"))
done = fail = 0
failed = []  # lỗi chắc chắn (thư mục trống...), lần sau bỏ qua
streak = []  # lỗi "không đọc được thư mục" liên tiếp, có thể do bị giới hạn


class Slow(Exception):
    pass


def _alarm(*_):
    raise Slow()


signal.signal(signal.SIGALRM, _alarm)


def save():
    for q in data["places"]:
        if q["id"] in failed:
            q["img_failed"] = True
    with open("data/toplist.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write("\n")


def fetch(file_id):
    """Lấy bản đã thu nhỏ do Google tạo (nhanh, nhẹ); không được thì tải ảnh gốc."""
    try:
        req = urllib.request.Request("https://lh3.googleusercontent.com/d/" + file_id + "=w720", headers=UA)
        with urllib.request.urlopen(req, timeout=30) as r:
            b = r.read()
            if r.headers.get("Content-Type", "").startswith("image/") and len(b) > 2000:
                im = Image.open(io.BytesIO(b))
                im.load()
                return im
    except Slow:
        raise
    except Exception:
        pass
    with tempfile.TemporaryDirectory() as tmp:
        raw = gdown.download(id=file_id, output=os.path.join(tmp, "a"), quiet=True)
        if not raw:
            raise RuntimeError("không tải được ảnh")
        im = Image.open(raw)
        im.load()
        return im


for p in data["places"]:
    if done + fail >= LIMIT:
        break
    if time.time() - START > MAX_SECONDS:
        print("Gần hết giờ, dừng để lưu kết quả", flush=True)
        break
    if p.get("img") or p.get("img_failed") or not p.get("img_folder"):
        continue
    dest = os.path.join(OUT, p["id"] + ".webp")
    signal.alarm(PER_PLACE)
    try:
        try:
            files = gdown.download_folder(id=p["img_folder"], skip_download=True, quiet=True, remaining_ok=True) or []
        except Slow:
            raise
        except Exception as e:
            raise LookupError(str(e))
        imgs = [f for f in files if f.path.lower().endswith(EXT)]
        if not imgs:
            raise LookupError("thư mục không có ảnh hoặc không mở công khai")
        im = ImageOps.exif_transpose(fetch(imgs[0].id)).convert("RGB")
        im.thumbnail((720, 720))
        im.save(dest, "WEBP", quality=72, method=6)
        signal.alarm(0)
        p["img"] = True
        done += 1
        streak = []
        print("ok  ", p["id"], os.path.getsize(dest) // 1024, "KB", flush=True)
        if done % 25 == 0:
            save()
    except Slow:
        fail += 1  # quá chậm: không đánh dấu lỗi, lần chạy sau thử lại
        print("chậm", p["id"], flush=True)
    except LookupError as e:
        fail += 1
        failed.append(p["id"])
        streak.append(p["id"])
        print("lỗi ", p["id"], str(e)[:160], flush=True)
        if len(streak) >= SOFT_STREAK:
            # nhiều thư mục liên tiếp không đọc được: nhiều khả năng Google đang giới hạn, không phải thư mục hỏng
            failed = [x for x in failed if x not in streak]
            print("Dừng: Google có vẻ đang giới hạn truy cập, chạy lại sau", flush=True)
            break
    except Exception as e:  # ảnh hỏng, lỗi mạng...
        fail += 1
        print("lỗi ", p["id"], str(e)[:160], flush=True)
        if "quota" in str(e).lower() or "too many" in str(e).lower():
            break
        failed.append(p["id"])
    finally:
        signal.alarm(0)
    time.sleep(0.5)

save()
have = sum(1 for p in data["places"] if p.get("img"))
left = sum(1 for p in data["places"] if p.get("img_folder") and not p.get("img") and not p.get("img_failed"))
print(f"Xong: {done} ảnh mới, {fail} lỗi, tổng {have} điểm có ảnh, còn {left} điểm chưa thử", flush=True)
