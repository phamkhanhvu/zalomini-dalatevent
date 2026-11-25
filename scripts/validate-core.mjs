/**
 * Lõi kiểm tra dữ liệu, dùng chung cho dòng lệnh (scripts/validate-events.mjs), tác vụ nhận nội dung
 * từ trang quản trị (scripts/cms-pull.mjs) và chính trang quản trị trong trình duyệt.
 * Không đọc tệp, không dùng gì riêng của Node.
 */
const STATUS = ["draft", "pending", "published", "postponed", "cancelled", "completed"];
const CATEGORY = ["le-hoi", "trien-lam", "khong-gian-hoa", "hoi-thao-the-thao", "am-nhac", "workshop", "the-thao", "khac"];
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+07:00$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** doc = events.json, shows = shows.json, hap = happening.json (hai tệp sau có thể là null nếu không đọc được) */
export function validate(doc, shows, hap) {
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);
  if (!doc || typeof doc !== "object") return { errors: ["events.json: không đọc được"], warnings, showCount: 0 };

  if (doc.schema !== 1) err(`schema phải là 1`);
  if (doc.timezone !== "Asia/Ho_Chi_Minh") err(`timezone phải là Asia/Ho_Chi_Minh`);
  if (!ISO.test(doc.updated_at || "")) err(`updated_at phải có dạng 2026-11-23T06:30:00+07:00`);
  for (const k of ["series", "venues", "events"]) if (!Array.isArray(doc[k])) err(`thiếu danh sách ${k}`);

  const unique = (list, name) => {
    const seen = new Set();
    for (const x of list || []) {
      if (!ID.test(x.id || "")) err(`${name}: id "${x.id}" phải là chữ thường không dấu, nối bằng gạch ngang`);
      if (seen.has(x.id)) err(`${name}: trùng id "${x.id}"`);
      seen.add(x.id);
    }
    return seen;
  };
  const seriesIds = unique(doc.series, "series");
  const venueIds = unique(doc.venues, "venues");
  unique(doc.events, "events");

  for (const v of doc.venues || []) {
    if (!v.name) err(`venue ${v.id}: thiếu name`);
    const hasLat = typeof v.lat === "number", hasLng = typeof v.lng === "number";
    if (hasLat !== hasLng) err(`venue ${v.id}: lat và lng phải cùng có hoặc cùng trống`);
    if (hasLat && (v.lat < 11 || v.lat > 13 || v.lng < 107 || v.lng > 109.5)) err(`venue ${v.id}: tọa độ nằm ngoài vùng Lâm Đồng`);
    if (!hasLat) warn(`venue ${v.id}: chưa có tọa độ (cần cho bản đồ gần tôi)`);
  }

  for (const e of doc.events || []) {
    const at = `event ${e.id}`;
    if (!e.title) err(`${at}: thiếu title`);
    if (!STATUS.includes(e.status)) err(`${at}: status "${e.status}" không hợp lệ (${STATUS.join(", ")})`);
    if (!CATEGORY.includes(e.category)) err(`${at}: category "${e.category}" không hợp lệ (${CATEGORY.join(", ")})`);
    if (e.series && !seriesIds.has(e.series)) err(`${at}: series "${e.series}" không tồn tại`);
    if (e.venue_id && !venueIds.has(e.venue_id)) err(`${at}: venue_id "${e.venue_id}" không tồn tại`);
    for (const v of e.venue_ids || []) if (!venueIds.has(v)) err(`${at}: venue_ids có "${v}" không tồn tại`);
    if (!e.venue_id && !e.venue_name) err(`${at}: cần venue_id hoặc venue_name`);
    // Bản tiếng Anh (tùy chọn): nếu có thì phải là chữ thường, không có thẻ HTML
    for (const k of ["title_en", "description_en", "venue_name_en", "note_en"]) {
      if (e[k] === undefined || e[k] === null) continue;
      if (typeof e[k] !== "string") err(`${at}: ${k} phải là chữ`);
      else if (/[<>]/.test(e[k])) err(`${at}: ${k} không được chứa thẻ HTML`);
    }
    if (typeof e.tentative !== "boolean") err(`${at}: tentative phải là true hoặc false`);
    if (!Array.isArray(e.sessions) || !e.sessions.length) err(`${at}: cần ít nhất một suất trong sessions`);
    for (const [i, s] of (e.sessions || []).entries()) {
      if (!ISO.test(s.start_at || "") || !ISO.test(s.end_at || "")) err(`${at}: suất ${i + 1} sai dạng giờ (phải kết thúc bằng +07:00)`);
      else if (new Date(s.end_at) < new Date(s.start_at)) err(`${at}: suất ${i + 1} kết thúc trước khi bắt đầu`);
    }
    if (e.source_url != null && !/^https:\/\//.test(e.source_url)) err(`${at}: source_url phải bắt đầu bằng https://`);
    if (e.verified_at != null && !DAY.test(e.verified_at)) err(`${at}: verified_at phải có dạng 2026-11-23`);
    if (!ISO.test(e.updated_at || "")) err(`${at}: thiếu hoặc sai updated_at`);
    if ((e.status === "postponed" || e.status === "cancelled") && !e.note) err(`${at}: sự kiện hoãn/hủy phải có note giải thích`);
    if (e.status === "published") {
      if (!e.source_url && !e.source_note) err(`${at}: sự kiện đã công bố phải có source_url hoặc source_note`);
      if (!e.source_url) warn(`${at}: chưa có link nguồn (source_url)`);
      if (!e.verified_at) warn(`${at}: chưa xác minh (verified_at)`);
    }
  }

  const DATE = /^\d{4}-\d{2}-\d{2}$/;
  const TIME = /^\d{2}:\d{2}( – \d{2}:\d{2})?$/;
  let showCount = 0;
  if (shows) {
    if (shows.schema !== 1) err(`shows.json: schema phải là 1`);
    if (!ISO.test(shows.updated_at || "")) err(`shows.json: updated_at sai dạng`);
    if (!Array.isArray(shows.stages) || !shows.stages.length) err(`shows.json: thiếu stages`);
    const seen = new Set();
    for (const st of shows.stages || []) {
      const at = `shows.json ${st.id}`;
      if (!ID.test(st.id || "") || seen.has(st.id)) err(`${at}: id sai hoặc trùng`);
      seen.add(st.id);
      if (!["dated", "weekly"].includes(st.kind)) err(`${at}: kind phải là dated hoặc weekly`);
      for (const k of ["name", "intro", "address", "cta_label"]) if (!st[k]) err(`${at}: thiếu ${k}`);
      if (!/^https:\/\//.test(st.source_url || "")) err(`${at}: source_url phải bắt đầu bằng https://`);
      if (!DATE.test(st.verified_at || "")) err(`${at}: verified_at phải có dạng 2026-11-23`);
      for (const [i, pl] of (st.places || []).entries()) {
        if (!pl.name || !pl.map_query) err(`${at} places ${i + 1}: thiếu name hoặc map_query`);
        const a = typeof pl.lat === "number", b = typeof pl.lng === "number";
        if (a !== b) err(`${at} places ${i + 1}: lat và lng phải cùng có hoặc cùng trống`);
        if (a && (pl.lat < 11 || pl.lat > 13 || pl.lng < 107 || pl.lng > 109.5)) err(`${at} places ${i + 1}: tọa độ nằm ngoài vùng Lâm Đồng`);
      }
      if (!Array.isArray(st.items)) { err(`${at}: thiếu items`); continue; }
      let prev = "";
      for (const [i, it] of st.items.entries()) {
        const ia = `${at} dòng ${i + 1}`;
        showCount++;
        if (!it.title) err(`${ia}: thiếu title`);
        if (/[<>]/.test(it.title || "")) err(`${ia}: title không được chứa thẻ HTML`);
        if (!/^https:\/\//.test(it.url || "")) err(`${ia}: url phải bắt đầu bằng https://`);
        if (!TIME.test(it.time || "")) err(`${ia}: time phải có dạng 17:00 hoặc 20:00 – 22:00`);
        if (st.kind === "dated") {
          if (!DATE.test(it.date || "")) err(`${ia}: date phải có dạng 2026-12-12`);
          const key = (it.date || "") + " " + (it.time || "");
          if (key < prev) err(`${ia}: các dòng phải sắp theo ngày rồi giờ`);
          prev = key;
        } else if (!(Number.isInteger(it.weekday) && it.weekday >= 0 && it.weekday <= 6) || !it.weekday_label) err(`${ia}: cần weekday (0–6) và weekday_label`);
      }
    }
  }
  if (hap) {
    if (hap.schema !== 1) err(`happening.json: schema phải là 1`);
    if (!ISO.test(hap.updated_at || "")) err(`happening.json: updated_at sai dạng`);
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(hap.updated_label || "")) err(`happening.json: updated_label phải có dạng 23.11.2026`);
    if (!Array.isArray(hap.items)) err(`happening.json: thiếu items`);
    for (const [i, it] of (hap.items || []).entries()) {
      for (const k of ["when", "title", "desc"]) if (!it[k] || typeof it[k] !== "string") err(`happening.json mục ${i + 1}: thiếu ${k}`);
      if (it.manual !== undefined && typeof it.manual !== "boolean") err(`happening.json mục ${i + 1}: manual phải là true hoặc false`);
      if (/[<>]/.test((it.title || "") + (it.desc || "") + (it.when || "") + (it.venue || "") + (it.title_en || "") + (it.desc_en || "") + (it.venue_en || ""))) err(`happening.json mục ${i + 1}: không được chứa thẻ HTML`);
      for (const k of ["title_en", "desc_en", "venue_en"]) if (it[k] !== undefined && typeof it[k] !== "string") err(`happening.json mục ${i + 1}: ${k} phải là chữ`);
      if (!DATE.test(it.start_date || "") || !DATE.test(it.end_date || "")) err(`happening.json mục ${i + 1}: cần start_date và end_date dạng 2026-11-23`);
      else if (it.end_date < it.start_date) err(`happening.json mục ${i + 1}: end_date trước start_date`);
      if (it.venue !== undefined && typeof it.venue !== "string") err(`happening.json mục ${i + 1}: venue phải là chữ`);
    }
  }


  return { errors, warnings, showCount };
}
