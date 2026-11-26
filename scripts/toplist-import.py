#!/usr/bin/env python3
"""
Nhập bảng "200 Top List" (xuất từ Google Sheets dạng .xlsx) thành data/toplist.json.
Cách chạy: python3 scripts/toplist-import.py <duong-dan-file.xlsx>
Chỉ lấy các tab trong TABS (du lịch, cafe, ăn uống, lưu trú, vui chơi, mua sắm); tab dịch vụ dân sinh để đợt sau.
"""
import json, re, sys, unicodedata
from datetime import datetime, timezone, timedelta

import openpyxl

# nhóm lớn: (id, tên VI, tên EN)
GROUPS = [
    ("tham-quan", "Tham quan", "Sightseeing"),
    ("trai-nghiem", "Trải nghiệm & vui chơi", "Experiences"),
    ("cafe", "Cafe", "Cafes"),
    ("an-uong", "Ăn uống", "Food"),
    ("dem", "Bar & nhạc đêm", "Nightlife & music"),
    ("luu-tru", "Lưu trú", "Stays"),
    ("mua-sam", "Chợ & mua sắm", "Markets & shopping"),
]

# tên tab trong bảng (đã bỏ khoảng trắng thừa) -> (nhóm, tên hiển thị VI, tên EN)
TABS = {
    "Săn mây": ("tham-quan", "Săn mây", "Cloud hunting"),
    "Hoàng Hôn": ("tham-quan", "Ngắm hoàng hôn", "Sunset spots"),
    "Ngắm ĐL từ trên cao": ("tham-quan", "Ngắm Đà Lạt từ trên cao", "Views from above"),
    "Cổng Trời": ("tham-quan", "Cổng trời", "Sky gates"),
    "View Hồ Xuân Hương": ("tham-quan", "View hồ Xuân Hương", "Xuan Huong Lake views"),
    "Thác Nước": ("tham-quan", "Thác nước", "Waterfalls"),
    "Hồ Nước": ("tham-quan", "Hồ nước", "Lakes"),
    "Vườn Hoa": ("tham-quan", "Vườn hoa", "Flower gardens"),
    "Biệt Thự Cổ": ("tham-quan", "Biệt thự cổ", "Old villas"),
    "Nhà Thờ": ("tham-quan", "Nhà thờ", "Churches"),
    "Chùa": ("tham-quan", "Chùa", "Pagodas"),
    "Bảo Tàng Nghê Thuật": ("tham-quan", "Bảo tàng & nghệ thuật", "Museums & art"),
    "Check-in Vintage": ("tham-quan", "Check-in vintage", "Vintage photo spots"),
    "Góc checkin đậm chất Đà Lạt": ("tham-quan", "Góc check-in đậm chất Đà Lạt", "Classic Da Lat photo spots"),
    "Du Lịch Sinh Thái": ("tham-quan", "Du lịch sinh thái", "Eco parks"),
    "Làng Nghề": ("tham-quan", "Làng nghề", "Craft villages"),
    "Vườn Dâu Tây": ("trai-nghiem", "Vườn dâu tây", "Strawberry farms"),
    "Vườn Hồng(trái)": ("trai-nghiem", "Vườn hồng (trái)", "Persimmon gardens"),
    "Vườn Rau Thuỷ Canh": ("trai-nghiem", "Vườn rau thủy canh", "Hydroponic farms"),
    "Farm Thú": ("trai-nghiem", "Farm thú", "Animal farms"),
    "Camping": ("trai-nghiem", "Camping", "Camping"),
    "Cắm trại, cafe bên Suối": ("trai-nghiem", "Cắm trại, cafe bên suối", "Streamside camping & cafes"),
    "Chèo KayakSUP": ("trai-nghiem", "Chèo kayak, SUP", "Kayak & SUP"),
    "đạp vịt": ("trai-nghiem", "Đạp vịt", "Swan pedal boats"),
    "Khu vui chơi cho trẻ em": ("trai-nghiem", "Khu vui chơi trẻ em", "Kids' play areas"),
    "Cồng Chiêng": ("trai-nghiem", "Cồng chiêng", "Gong culture shows"),
    "Workshop": ("trai-nghiem", "Workshop", "Workshops"),
    "Hồ câu cá": ("trai-nghiem", "Hồ câu cá", "Fishing ponds"),
    "Danh sách các sân Golf": ("trai-nghiem", "Sân golf", "Golf courses"),
    "SpaMassage trị liệu": ("trai-nghiem", "Spa & massage", "Spa & massage"),
    "Gội đầu dưỡng sinh": ("trai-nghiem", "Gội đầu dưỡng sinh", "Herbal hair wash"),
    "Photobooth": ("trai-nghiem", "Photobooth", "Photo booths"),
    "Thuê Trang Phục": ("trai-nghiem", "Thuê trang phục chụp ảnh", "Costume rental"),
    "Cafe rừng thông": ("cafe", "Cafe rừng thông", "Pine forest cafes"),
    "Cafe mộng mơ": ("cafe", "Cafe mộng mơ", "Dreamy cafes"),
    "cà phê view đẹp": ("cafe", "Cafe view đẹp", "Cafes with a view"),
    "Hidden Cafe": ("cafe", "Cafe ẩn mình", "Hidden cafes"),
    "Cafe Local": ("cafe", "Cafe local", "Local cafes"),
    "Cafe Làm Việc": ("cafe", "Cafe làm việc", "Work-friendly cafes"),
    "Cafe 2424": ("cafe", "Cafe 24/24", "24-hour cafes"),
    "Cafe trẻ em": ("cafe", "Cafe cho trẻ em", "Kid-friendly cafes"),
    "Vibe Nhật Bản": ("cafe", "Vibe Nhật Bản", "Japanese vibe"),
    "Vibe Hàn Quốc": ("cafe", "Vibe Hàn Quốc", "Korean vibe"),
    "Trà Chiều Cao Cấp": ("cafe", "Trà chiều cao cấp", "Afternoon tea"),
    "Matcha": ("cafe", "Matcha", "Matcha"),
    "Trà Sữa": ("cafe", "Trà sữa", "Milk tea"),
    "Trà Trái Cây": ("cafe", "Trà trái cây", "Fruit tea"),
    "Nước ép": ("cafe", "Nước ép", "Juice bars"),
    "Tiệm Bánh Ngọt": ("cafe", "Tiệm bánh ngọt", "Patisseries"),
    "bánh sừng bò": ("cafe", "Bánh sừng bò", "Croissants"),
    "Tiệm Bánh Local": ("cafe", "Tiệm bánh local", "Local bakeries"),
    "Bánh Căn": ("an-uong", "Bánh căn", "Banh can"),
    "Bánh Ướt Lòng Gà": ("an-uong", "Bánh ướt lòng gà", "Chicken rice rolls"),
    "Bánh Tráng Nướng": ("an-uong", "Bánh tráng nướng", "Grilled rice paper"),
    "Nem Nướng": ("an-uong", "Nem nướng", "Grilled pork rolls"),
    "Bánh Mì Xíu Mại": ("an-uong", "Bánh mì xíu mại", "Meatball banh mi"),
    "Xe Bánh Mì": ("an-uong", "Xe bánh mì", "Banh mi carts"),
    "Bánh Mì Chảo": ("an-uong", "Bánh mì chảo", "Pan banh mi"),
    "Ốc Nhồi Thịt": ("an-uong", "Ốc nhồi thịt", "Stuffed snails"),
    "Sữa Đậu Nành": ("an-uong", "Sữa đậu nành", "Soy milk"),
    "Kem Bơ": ("an-uong", "Kem bơ", "Avocado ice cream"),
    "Chè": ("an-uong", "Chè", "Sweet soups"),
    "Tào Phớ": ("an-uong", "Tào phớ", "Tofu pudding"),
    "Ăn Vặt": ("an-uong", "Ăn vặt", "Street snacks"),
    "Bột Chiên": ("an-uong", "Bột chiên", "Fried rice cake"),
    "Lẩu Gà Lá É": ("an-uong", "Lẩu gà lá é", "Chicken hotpot with e leaves"),
    "Lẩu Bò": ("an-uong", "Lẩu bò", "Beef hotpot"),
    "Lẩu Cá Tầm": ("an-uong", "Lẩu cá tầm", "Sturgeon hotpot"),
    "Quán lẩu dê": ("an-uong", "Lẩu dê", "Goat hotpot"),
    "Quán Nướng": ("an-uong", "Quán nướng", "BBQ"),
    "Nướng Ngói": ("an-uong", "Nướng ngói", "Tile-grilled BBQ"),
    "Gà Nướng Cơm Lam": ("an-uong", "Gà nướng cơm lam", "Grilled chicken & bamboo rice"),
    "Phở": ("an-uong", "Phở", "Pho"),
    "Bún Bò Huế": ("an-uong", "Bún bò Huế", "Hue beef noodles"),
    "Mì Quảng": ("an-uong", "Mì Quảng", "Quang noodles"),
    "Bánh Canh": ("an-uong", "Bánh canh", "Thick noodle soup"),
    "bánh canh cá lóc": ("an-uong", "Bánh canh cá lóc", "Snakehead fish noodle soup"),
    "Bún Riêu": ("an-uong", "Bún riêu", "Crab noodle soup"),
    "Bún cá": ("an-uong", "Bún cá", "Fish noodle soup"),
    "Bún Chả": ("an-uong", "Bún chả", "Bun cha"),
    "Bún Đậu": ("an-uong", "Bún đậu", "Bun dau"),
    "Hủ Tiếu - Hoành Thánh": ("an-uong", "Hủ tiếu, hoành thánh", "Hu tieu & wontons"),
    "hủ tiếu": ("an-uong", "Hủ tiếu", "Hu tieu"),
    "cháo vịt": ("an-uong", "Cháo vịt", "Duck congee"),
    "cháo hàu": ("an-uong", "Cháo hàu", "Oyster congee"),
    "Cháo ếch Singapore": ("an-uong", "Cháo ếch Singapore", "Singapore frog congee"),
    "Cơm Niêu": ("an-uong", "Cơm niêu", "Clay pot rice"),
    "Cơm Tấm": ("an-uong", "Cơm tấm", "Broken rice"),
    "Cơm gia đình": ("an-uong", "Cơm gia đình", "Home-style meals"),
    "Cơm Gà Xối Mỡ": ("an-uong", "Cơm gà xối mỡ", "Crispy chicken rice"),
    "Cơm Văn Phòng": ("an-uong", "Cơm văn phòng", "Lunch sets"),
    "Vịt Quay": ("an-uong", "Vịt quay", "Roast duck"),
    "Heo Quay": ("an-uong", "Heo quay", "Roast pork"),
    "Dimsum": ("an-uong", "Dimsum", "Dim sum"),
    "Mì Cay": ("an-uong", "Mì cay", "Spicy noodles"),
    "ramen": ("an-uong", "Ramen", "Ramen"),
    "hải sản tươi": ("an-uong", "Hải sản tươi", "Fresh seafood"),
    "Quán chay": ("an-uong", "Quán chay", "Vegetarian"),
    "Buffet": ("an-uong", "Buffet", "Buffets"),
    "Quán Nhậu": ("an-uong", "Quán nhậu", "Drinking spots"),
    "Nhà hàng Âu": ("an-uong", "Nhà hàng Âu", "European restaurants"),
    "Nhà Hàng Ý - Pizza": ("an-uong", "Nhà hàng Ý, pizza", "Italian & pizza"),
    "Nhà hàng Hàn Quốc": ("an-uong", "Nhà hàng Hàn Quốc", "Korean restaurants"),
    "Nhà hàng Nhật Bản": ("an-uong", "Nhà hàng Nhật Bản", "Japanese restaurants"),
    "nhà hàng thái": ("an-uong", "Nhà hàng Thái", "Thai restaurants"),
    "Nhà Hàng Ấn": ("an-uong", "Nhà hàng Ấn", "Indian restaurants"),
    "Nhà Hàng Hoa": ("an-uong", "Nhà hàng hoa", "Flower-themed restaurants"),
    "Fastfood": ("an-uong", "Fastfood", "Fast food"),
    "Rượu V": ("an-uong", "Rượu vang", "Wine"),
    "BarPub": ("dem", "Bar, pub", "Bars & pubs"),
    "Show Nhạc": ("dem", "Show nhạc", "Live music shows"),
    "Cafe Acoustic": ("dem", "Cafe acoustic", "Acoustic cafes"),
    "Homestay Trung Tâm": ("luu-tru", "Homestay trung tâm", "Central homestays"),
    "Homestay View đẹp": ("luu-tru", "Homestay view đẹp", "Homestays with a view"),
    "Homestay săn mây": ("luu-tru", "Homestay săn mây", "Cloud-view homestays"),
    "Khách Sạn Gần Chợ": ("luu-tru", "Khách sạn gần chợ", "Hotels near the market"),
    "Khách sạn đường Bùi Thị Xuân": ("luu-tru", "Khách sạn đường Bùi Thị Xuân", "Hotels on Bui Thi Xuan St"),
    "khách sạn khu vực hồ tuyền lâm": ("luu-tru", "Khách sạn hồ Tuyền Lâm", "Tuyen Lam Lake hotels"),
    "Villa Nguyên Căn": ("luu-tru", "Villa nguyên căn", "Whole villas"),
    "Bungalow": ("luu-tru", "Bungalow", "Bungalows"),
    "Chợ": ("mua-sam", "Chợ", "Markets"),
    "Khu chợ mới Đà Lạt": ("mua-sam", "Khu chợ mới Đà Lạt", "New Da Lat market area"),
    "Đặc Sản": ("mua-sam", "Đặc sản mang về", "Local specialties"),
    "Quà lưu niệm": ("mua-sam", "Quà lưu niệm", "Souvenirs"),
    "Cửa hàng đồ len": ("mua-sam", "Đồ len", "Knitwear"),
    "second hand": ("mua-sam", "Đồ second hand", "Second-hand"),
    "Cửa hàng trái cây": ("mua-sam", "Trái cây", "Fruit shops"),
}

# vùng hợp lệ quanh Đà Lạt – Lâm Đồng
EN = {}
BOX = (11.3, 12.4, 107.5, 108.9)


def slug(s):
    s = unicodedata.normalize("NFD", s.replace("đ", "d").replace("Đ", "D"))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def clean(v):
    if v is None:
        return ""
    s = str(v).replace("\r", "").strip()
    s = re.sub(r"[<>]", "", s)
    return re.sub(r"[ \t]+", " ", s)


def coords(v):
    """Đọc tọa độ, sửa các lỗi gõ hay gặp: dấu phẩy thay dấu chấm, thiếu dấu chấm, 208 thay 108, dạng độ-phút-giây."""
    s = str(v or "")
    d = re.findall(r"(\d+)°\s*(\d+)'\s*([\d.]+)\"?\s*([NSEW])", s)
    if len(d) == 2:
        vals = [int(a) + int(b) / 60 + float(c) / 3600 for a, b, c, _ in d]
        a, b = vals
    else:
        m = re.search(r"(1[12])\s*[.,]\s*(\d{3,})\D+?(10[78]|208)\s*[.,]?\s*,?\s*(\d{3,})", s)
        if not m:
            return None, None
        a = float(m.group(1) + "." + m.group(2))
        b = float(("108" if m.group(3) == "208" else m.group(3)) + "." + m.group(4))
    if BOX[0] <= a <= BOX[1] and BOX[2] <= b <= BOX[3]:
        return round(a, 6), round(b, 6)
    return None, None


# Câu ghi chú nội bộ lẫn trong mô tả (không đưa lên web)
INTERNAL = re.compile(r"Sense Media|dự án|TVC|bạn đã đề cập|giới thiệu cho khách hàng", re.I)


def clean_desc(v):
    s = clean(v)
    parts = re.split(r"(?<=[.!?])\s+", s)
    return " ".join(p for p in parts if not INTERNAL.search(p)).strip()


def folder_id(cell):
    t = (cell.hyperlink.target if cell.hyperlink else "") or str(cell.value or "")
    m = re.search(r"/folders/([A-Za-z0-9_-]{10,})", t)
    return m.group(1) if m else ""


def clip(v):
    s = str(v or "").strip()
    m = re.search(r"https?://\S+", s)
    if not m:
        return ""
    u = m.group(0)
    if "tiktok.com" in u:
        u = u.split("?")[0]
    return u


def main(path):
    wb = openpyxl.load_workbook(path)
    # bản tiếng Anh của mô tả (data/toplist-en.json, theo id địa điểm)
    global EN
    try:
        EN = json.load(open("data/toplist-en.json", encoding="utf-8"))
    except (OSError, ValueError):
        EN = {}
    # giữ lại trạng thái ảnh đã lấy ở lần trước
    prev = {}
    try:
        for q in json.load(open("data/toplist.json", encoding="utf-8"))["places"]:
            prev[q["id"]] = {k: q[k] for k in ("img", "img_failed") if q.get(k)}
    except (OSError, ValueError, KeyError):
        pass
    lists, places, problems = [], [], []
    seen_ids = set()
    for ws in wb.worksheets:
        key = re.sub(r"\s+", " ", ws.title).strip()
        if key not in TABS:
            continue
        group, name, name_en = TABS[key]
        lid = slug(name)
        count = 0
        for i, row in enumerate(ws.iter_rows()):
            if i == 0 or not row or not row[0].value:
                continue
            cells = list(row) + [None] * 6
            nm = clean(cells[0].value)
            if not nm:
                continue
            lat, lng = coords(cells[2].value if cells[2] else None)
            if lat is None:
                problems.append(f"{key} / {nm}: tọa độ '{clean(cells[2].value if cells[2] else '')}'")
            pid = lid + "--" + slug(nm)[:48]
            n = 2
            while pid in seen_ids:
                pid = lid + "--" + slug(nm)[:44] + "-" + str(n)
                n += 1
            seen_ids.add(pid)
            places.append({
                "id": pid,
                "list": lid,
                "name": nm,
                "address": clean(cells[1].value if cells[1] else ""),
                "lat": lat,
                "lng": lng,
                "desc": clean_desc(cells[3].value if cells[3] else ""),
                "desc_en": EN.get(pid, ""),
                "clip": clip(cells[5].value if cells[5] else ""),
                "img_folder": folder_id(cells[4]) if cells[4] is not None else "",
                **prev.get(pid, {}),
            })
            count += 1
        if count:
            lists.append({"id": lid, "group": group, "name": name, "name_en": name_en, "count": count})
    missing = sorted(set(TABS) - {re.sub(r"\s+", " ", ws.title).strip() for ws in wb.worksheets})
    now = datetime.now(timezone(timedelta(hours=7))).replace(microsecond=0).isoformat()
    out = {
        "schema": 1,
        "updated_at": now,
        "source": "Bảng 200 Top List (Sense Group)",
        "groups": [{"id": g, "name": n, "name_en": e} for g, n, e in GROUPS],
        "lists": lists,
        "places": places,
    }
    with open("data/toplist.json", "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"{len(lists)} danh sách, {len(places)} địa điểm")
    if missing:
        print("Tab không tìm thấy:", missing)
    print(f"{len(problems)} điểm thiếu/sai tọa độ")
    for p in problems:
        print("  -", p)


if __name__ == "__main__":
    main(sys.argv[1])
