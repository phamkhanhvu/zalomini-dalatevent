/**
 * DỮ LIỆU FESTIVAL — sửa lịch, địa điểm, mô tả ở file này.
 * Nguồn: dalatevent.com (poster chính thức Festival Hoa Đà Lạt lần thứ XI).
 * Mục có `tentative: true` là "dự kiến", có thể thay đổi.
 */

export type CatId = "le" | "tl" | "kg" | "ht";

export interface Category {
  id: CatId;
  label: string;
  color: string;
  tint: string;
}

export const CATEGORIES: Category[] = [
  { id: "le", label: "Lễ hội", color: "#E0218A", tint: "#FFE3F1" },
  { id: "tl", label: "Triển lãm", color: "#7B2CBF", tint: "#EFE2FA" },
  { id: "kg", label: "Không gian hoa", color: "#0B7A4B", tint: "#C9F2DA" },
  { id: "ht", label: "Hội thảo và thể thao", color: "#1D5FA8", tint: "#DCEEFF" },
];

export interface Program {
  id: string;
  cat: CatId;
  title: string;
  desc: string;
  venue: string;
  /** Từ khoá tìm trên Google Maps. Bỏ trống nếu không có địa điểm cụ thể. */
  mapQuery?: string;
  /** ISO, giờ Việt Nam */
  start: string;
  end: string;
  /** Nhãn ngày hiển thị lớn, ví dụ "19.12" */
  day: string;
  /** Dòng phụ dưới ngày, ví dụ "đến 25.12" hoặc "20:00" */
  sub: string;
  tentative: boolean;
  /** Ghi chú thêm (thay đổi lịch, truyền hình...) */
  note?: string;
}

export const FESTIVAL = {
  name: "Festival Hoa Đà Lạt",
  edition: "lần thứ XI",
  year: 2026,
  theme: "Bản giao hòa của sắc hoa và âm nhạc",
  /** Đêm khai mạc — phương án dự kiến theo cuộc họp ngày 18.11.2026 của UBND tỉnh Lâm Đồng */
  opening: "2026-12-12T20:00:00+07:00",
  openingLabel: "Tối 12.12.2026",
  openingTentative: true,
  closing: "2026-12-31T22:00:00+07:00",
  end: "2027-01-03T23:59:59+07:00",
  website: "https://dalatevent.com/",
  registerUrl: "https://dalatevent.com/#lien-he",
  hotline: "0986338656",
  hotlineLabel: "0986 338 656",
  updated: "22.11.2026",
};

export const PROGRAMS: Program[] = [
  {
    id: "hoa-lan",
    cat: "tl",
    title: "Triển lãm quốc tế hoa lan Hồ Điệp Lâm Đồng và triển lãm hoa tươi nghệ thuật quốc tế",
    desc: "Quy tụ đơn vị trong và ngoài nước.",
    venue: "Công viên Trần Quốc Toản",
    mapQuery: "Công viên Trần Quốc Toản, Đà Lạt",
    start: "2026-12-01T00:00:00+07:00",
    end: "2026-12-25T23:59:00+07:00",
    day: "01.12",
    sub: "đến 25.12",
    tentative: true,
  },
  {
    id: "trong-hoa",
    cat: "kg",
    title: "Chiến dịch “Người người trồng hoa, nhà nhà trồng hoa, cây xanh”",
    desc: "Chiến dịch chào mừng Festival Hoa Đà Lạt lần thứ XI.",
    venue: "Toàn tỉnh Lâm Đồng",
    start: "2026-11-01T00:00:00+07:00",
    end: "2027-01-03T23:59:00+07:00",
    day: "Từ nay",
    sub: "đến 03.01.2027",
    tentative: false,
  },
  {
    id: "khai-mac",
    cat: "le",
    title: "Khai mạc Festival Hoa Đà Lạt lần thứ XI",
    desc: "Đêm khai mạc kết hợp âm nhạc, ánh sáng và công nghệ trình diễn tại Quảng trường Lâm Viên. Truyền hình trực tiếp trên VTV.",
    venue: "Quảng trường Lâm Viên",
    mapQuery: "Quảng trường Lâm Viên, Đà Lạt",
    start: "2026-12-12T20:00:00+07:00",
    end: "2026-12-12T22:00:00+07:00",
    day: "12.12",
    sub: "20:00",
    tentative: true,
    note: "Theo cuộc họp ngày 18.11 của UBND tỉnh Lâm Đồng, lễ khai mạc dự kiến tổ chức tối 12.12, sớm hơn một tuần so với kế hoạch trước (19.12). Lịch chính thức có thể còn thay đổi.",
  },
  {
    id: "khong-gian-hoa",
    cat: "kg",
    title: "Không gian hoa quanh hồ Xuân Hương",
    desc: "Các tiểu công viên Trần Hưng Đạo, Trần Quốc Toản, Yersin và nhiều tuyến đường có bờ kè.",
    venue: "Quanh hồ Xuân Hương",
    mapQuery: "Hồ Xuân Hương, Đà Lạt",
    start: "2026-12-18T00:00:00+07:00",
    end: "2027-01-03T23:59:00+07:00",
    day: "18.12",
    sub: "đến 03.01.2027",
    tentative: true,
  },
  {
    id: "cay-canh",
    cat: "tl",
    title: "Trưng bày, triển lãm hoa và cây cảnh quốc tế",
    desc: "Hoa và cây cảnh từ nhiều quốc gia.",
    venue: "Vườn hoa Đà Lạt",
    mapQuery: "Vườn hoa thành phố Đà Lạt",
    start: "2026-12-18T00:00:00+07:00",
    end: "2027-01-03T23:59:00+07:00",
    day: "18.12",
    sub: "đến 03.01.2027",
    tentative: false,
  },
  {
    id: "golf",
    cat: "ht",
    title: "Dalat Palace Floral Golf Invitational",
    desc: "Giải golf mang chủ đề hoa.",
    venue: "Dalat Palace Golf Club",
    mapQuery: "Dalat Palace Golf Club, Đà Lạt",
    start: "2026-12-19T00:00:00+07:00",
    end: "2026-12-19T23:59:00+07:00",
    day: "19.12",
    sub: "trong ngày",
    tentative: false,
  },
  {
    id: "hoi-thao",
    cat: "ht",
    title: "Hội thảo khoa học, công nghệ và đổi mới sáng tạo",
    desc: "Phát triển bền vững chuỗi giá trị hoa Đà Lạt.",
    venue: "Khách sạn Sài Gòn – Đà Lạt",
    mapQuery: "Khách sạn Sài Gòn Đà Lạt, Đà Lạt",
    start: "2026-12-22T00:00:00+07:00",
    end: "2026-12-22T23:59:00+07:00",
    day: "22.12",
    sub: "trong ngày",
    tentative: true,
  },
  {
    id: "tho-cam",
    cat: "le",
    title: "Lễ hội Văn hóa Thổ cẩm Việt Nam lần thứ III",
    desc: "Lễ hội văn hóa thổ cẩm Việt Nam năm 2026.",
    venue: "Quảng trường Lâm Viên",
    mapQuery: "Quảng trường Lâm Viên, Đà Lạt",
    start: "2026-12-22T00:00:00+07:00",
    end: "2026-12-23T23:59:00+07:00",
    day: "22.12",
    sub: "đến 23.12",
    tentative: true,
  },
  {
    id: "pho-tra",
    cat: "kg",
    title: "Phố trà, cà phê, rượu vang, OCOP và Phiên chợ rau – hoa",
    desc: "Giới thiệu thương hiệu “Đà Lạt kết tinh kỳ diệu từ đất lành”.",
    venue: "Quảng trường Lâm Viên, đường Hồ Tùng Mậu",
    mapQuery: "Đường Hồ Tùng Mậu, Đà Lạt",
    start: "2026-12-24T00:00:00+07:00",
    end: "2027-01-03T23:59:00+07:00",
    day: "24.12",
    sub: "đến 03.01.2027",
    tentative: true,
  },
  {
    id: "carnival",
    cat: "le",
    title: "Carnival ban nhạc và nhóm nhảy hiện đại",
    desc: "Âm nhạc và vũ đạo đường phố.",
    venue: "Quanh hồ Xuân Hương",
    mapQuery: "Hồ Xuân Hương, Đà Lạt",
    start: "2026-12-31T00:00:00+07:00",
    end: "2026-12-31T23:59:00+07:00",
    day: "31.12",
    sub: "trong ngày",
    tentative: true,
  },
  {
    id: "be-mac",
    cat: "le",
    title: "Chào năm mới 2027 kết hợp bế mạc Festival",
    desc: "Truyền hình trực tiếp trên Báo và Phát thanh, Truyền hình Lâm Đồng.",
    venue: "Quảng trường Lâm Viên",
    mapQuery: "Quảng trường Lâm Viên, Đà Lạt",
    start: "2026-12-31T20:00:00+07:00",
    end: "2026-12-31T22:00:00+07:00",
    day: "31.12",
    sub: "20:00",
    tentative: false,
  },
];

export interface Venue {
  id: string;
  name: string;
  mapQuery: string;
  /** id các chương trình diễn ra tại đây */
  programs: string[];
  color: string;
}

export const VENUES: Venue[] = [
  { id: "lam-vien", name: "Quảng trường Lâm Viên", mapQuery: "Quảng trường Lâm Viên, Đà Lạt", programs: ["khai-mac", "tho-cam", "pho-tra", "be-mac"], color: "#E0218A" },
  { id: "xuan-huong", name: "Hồ Xuân Hương", mapQuery: "Hồ Xuân Hương, Đà Lạt", programs: ["khong-gian-hoa", "carnival"], color: "#0B7A4B" },
  { id: "vuon-hoa", name: "Vườn hoa Đà Lạt", mapQuery: "Vườn hoa thành phố Đà Lạt", programs: ["cay-canh"], color: "#7B2CBF" },
  { id: "tqt", name: "Công viên Trần Quốc Toản", mapQuery: "Công viên Trần Quốc Toản, Đà Lạt", programs: ["hoa-lan"], color: "#C2410C" },
  { id: "golf", name: "Dalat Palace Golf Club", mapQuery: "Dalat Palace Golf Club, Đà Lạt", programs: ["golf"], color: "#1D5FA8" },
  { id: "sgdl", name: "Khách sạn Sài Gòn – Đà Lạt", mapQuery: "Khách sạn Sài Gòn Đà Lạt, Đà Lạt", programs: ["hoi-thao"], color: "#1D5FA8" },
  { id: "htm", name: "Đường Hồ Tùng Mậu", mapQuery: "Đường Hồ Tùng Mậu, Đà Lạt", programs: ["pho-tra"], color: "#0B7A4B" },
];

export interface Happening {
  when: string;
  title: string;
  desc: string;
  live?: boolean;
}

/** Bản dự phòng khi không tải được danh sách mới từ dalatevent.com */
export const HAPPENING_FALLBACK: Happening[] = [
  {
    when: "20 — 24.11.2026 · Quảng trường Lâm Viên",
    title: "K-Vietnam Wellness Festa & Expo in Đà Lạt 2026",
    desc: "Khoảng 200 gian hàng của doanh nghiệp Việt Nam và Hàn Quốc, 5 đêm biểu diễn nghệ thuật giao lưu Việt – Hàn, trình diễn hanbok – áo dài, lễ hội ẩm thực và âm nhạc đường phố.",
    live: true,
  },
  {
    when: "16 — 26.11.2026 · Quảng trường Lâm Viên",
    title: "Triển lãm tranh cổ động Ngày Văn hóa Việt Nam",
    desc: "150 tranh cổ động tấm lớn trưng bày tại khu vực đài phun nước Quảng trường Lâm Viên và quanh hồ Xuân Hương.",
  },
  {
    when: "21.11 — 12.12.2026 · Đồi cỏ hồng Đạ Nghịt",
    title: "Mùa hội cỏ hồng Lang Biang năm 2026",
    desc: "Hội thi trình diễn trang phục truyền thống các dân tộc, giải đua ngựa không yên cùng nhiều hoạt động văn hóa, thể thao, du lịch.",
  },
];

export const STATS_2024 = [
  { value: "2 triệu", label: "lượt khách" },
  { value: "3.600 tỷ", label: "đồng doanh thu xã hội (ước tính)" },
  { value: "10", label: "chương trình chính" },
  { value: "Gần 1 triệu", label: "chậu hoa trưng bày" },
];

/** Trang WordPress chứa mục "Đang diễn ra" được cập nhật mỗi ngày */
export const LIVE_SOURCE =
  "https://public-api.wordpress.com/wp/v2/sites/258666013/pages/1337?_fields=content";
