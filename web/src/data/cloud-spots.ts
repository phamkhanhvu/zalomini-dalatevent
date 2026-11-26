/**
 * Điểm săn mây gợi ý, lấy từ bảng "200 Top List" (trang Săn mây) của anh Vũ, 26.11.2026.
 * Tọa độ để mở chỉ đường; điểm nào chưa có tọa độ chắc chắn thì tìm theo tên trên bản đồ.
 */
export interface CloudSpot {
  id: string;
  name: string;
  area: string;
  area_en: string;
  lat: number | null;
  lng: number | null;
  /** Từ khóa tìm trên bản đồ khi chưa có tọa độ chắc chắn */
  query?: string;
  note: string;
  note_en: string;
  clip?: string;
}

export const CLOUD_SPOTS: CloudSpot[] = [
  {
    id: "binh-minh-oi",
    name: "Tiệm Cà Phê Bình Minh Ơi",
    area: "89 Hoàng Hoa Thám",
    area_en: "89 Hoang Hoa Tham St",
    lat: 11.93364,
    lng: 108.464786,
    note: "Gần trung tâm, view thung lũng thoáng, vườn cúc họa mi; có show acoustic sáng sớm và chiều tối.",
    note_en: "Close to the centre, open valley view and a daisy garden; acoustic sets early morning and evening.",
    clip: "https://www.tiktok.com/@tiktokgapgiquaydo/video/7524243858117496071",
  },
  {
    id: "thien-phuc-duc",
    name: "Đồi Thiên Phúc Đức",
    area: "Phường Lang Biang - Đà Lạt",
    area_en: "Lang Biang Ward, Da Lat",
    lat: 11.99481,
    lng: 108.42855,
    note: "Nhìn thẳng đỉnh Langbiang trong mây; đẹp cả bình minh lẫn hoàng hôn, đồi rộng, hợp picnic.",
    note_en: "Faces Langbiang peak in the clouds; good at both sunrise and sunset, wide hill for a picnic.",
    clip: "https://www.tiktok.com/@ducdodalat/video/7291973238610070802",
  },
  {
    id: "da-phu",
    name: "Đồi Đa Phú",
    area: "Hẻm 1 Đa Phú, Phường Lang Biang - Đà Lạt",
    area_en: "Lane 1 Da Phu, Lang Biang Ward, Da Lat",
    lat: 11.98702,
    lng: 108.40755,
    note: "Đồi thông thoai thoải, mây sáng sớm luồn qua tán thông, mỏng và mờ ảo; tối nhìn xuống nhà kính sáng đèn.",
    note_en: "Gentle pine hill; thin morning mist drifts through the pines. At night the greenhouses below light up.",
    clip: "https://www.tiktok.com/@haristudalat/video/7539162945670941959",
  },
  {
    id: "hon-bo",
    name: "Đỉnh Hòn Bồ",
    area: "30 Dốc Hòn Bồ, Lâm Viên - Đà Lạt",
    area_en: "30 Hon Bo Slope, Lam Vien, Da Lat",
    lat: 11.973906,
    lng: 108.489403,
    note: "Cao 1.709 m, nhìn xuống làng hoa Thái Phiên; sáng sớm hay có tia nắng xuyên sương, đêm trong ngắm được Ngân Hà.",
    note_en: "1,709 m up, overlooking Thai Phien flower village; light rays through the morning fog, Milky Way on clear nights.",
    clip: "https://www.tiktok.com/@haristudalat/video/7519862069034831112",
  },
  {
    id: "pinhatt",
    name: "Đỉnh Pinhatt",
    area: "Phường Xuân Hương - Đà Lạt",
    area_en: "Xuan Huong Ward, Da Lat",
    lat: 11.879692,
    lng: 108.429984,
    note: "Mây trên mặt hồ Tuyền Lâm, thấy Thiền viện Trúc Lâm; phải trekking xuyên rừng để lên đỉnh.",
    note_en: "Clouds over Tuyen Lam Lake with Truc Lam Monastery below; a forest trek to reach the top.",
    clip: "https://www.tiktok.com/@nhanphepha/video/6976870158199459073",
  },
  {
    id: "binh-yen-house",
    name: "Bình Yên House",
    area: "Tổ 7, Đa Lộc, Phường Xuân Trường - Đà Lạt",
    area_en: "Group 7, Da Loc, Xuan Truong Ward, Da Lat",
    lat: 11.940228,
    lng: 108.522919,
    note: "Nhà gỗ mái chữ A lưng chừng đồi khu Trại Mát; ở lại qua đêm, sáng mở cửa là thấy biển mây.",
    note_en: "A-frame wooden house on the hillside near Trai Mat; stay overnight and wake up to the sea of clouds.",
    clip: "https://www.tiktok.com/@binhyen.homestay/video/7450324470742453512",
  },
  {
    id: "langbiang",
    name: "Khu du lịch Đỉnh Langbiang",
    area: "Phường Lang Biang - Đà Lạt",
    area_en: "Lang Biang Ward, Da Lat",
    lat: 12.04835,
    lng: 108.440807,
    note: "Đỉnh Ra-đa 1.929 m, đi xe Jeep lên; nhìn được Suối Vàng, Suối Bạc và toàn cảnh Đà Lạt.",
    note_en: "Radar Peak at 1,929 m by jeep; views over Suoi Vang, Suoi Bac and all of Da Lat.",
    clip: "https://www.tiktok.com/@didalatcungtruc/video/7452303396519841032",
  },
  {
    id: "cau-go-binh-minh",
    name: "Cầu Gỗ Săn Mây Bình Minh",
    area: "Đồi chè Cầu Đất, Đà Lạt",
    area_en: "Cau Dat tea hills, Da Lat",
    lat: 11.89184,
    lng: 108.5742,
    note: "Biển mây dày nhất khoảng 5:30 – 6:30 sáng, ở độ cao khoảng 1.600 m; cầu gỗ giữa đồi chè.",
    note_en: "Thickest sea of clouds around 5:30 – 6:30 am at about 1,600 m; a wooden bridge above the tea hills.",
  },
  {
    id: "thien-duong-san-may",
    name: "Thiên Đường Săn Mây Cầu Đất",
    area: "Đồi chè Cầu Đất, Phường Xuân Trường - Đà Lạt",
    area_en: "Cau Dat tea hills, Xuan Truong Ward, Da Lat",
    lat: null,
    lng: null,
    query: "Thiên Đường Săn Mây Cầu Đất",
    note: "Khu săn mây nổi tiếng trên đồi chè Cầu Đất, cao hơn 1.600 m, cách trung tâm khoảng 25 km.",
    note_en: "Well-known cloud-hunting park on the Cau Dat tea hills, over 1,600 m, about 25 km from the centre.",
  },
];
