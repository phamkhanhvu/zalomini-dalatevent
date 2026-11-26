// Chuẩn bị và nộp bản iOS lên App Store qua App Store Connect API (chạy trong GitHub Actions).
// MODE=prepare: điền thông tin trang App Store, ảnh, độ tuổi, giá, vùng phát hành, gắn bản build, thông tin cho người duyệt.
// MODE=submit: làm như prepare rồi gửi duyệt.
// Phần "App Privacy" (nhãn quyền riêng tư) Apple KHÔNG cho làm qua API: chủ dự án điền trên web App Store Connect.
// Khóa API đọc từ biến môi trường ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_P8 (secret), không in ra nhật ký.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const { ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_P8 } = process.env;
const MODE = process.env.MODE || "prepare";
const BUNDLE = "vn.sensegroup.dalatevent";
const VERSION = process.env.APP_VERSION || "1.0";
const BUILD = process.env.BUILD_NUMBER || ""; // trống = bản build mới nhất đã xử lý xong
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

if (!ASC_KEY_ID || !ASC_ISSUER_ID || !ASC_KEY_P8) throw new Error("Thiếu khóa App Store Connect API");

const b64u = (b) => Buffer.from(b).toString("base64url");
function token() {
  const now = Math.floor(Date.now() / 1000);
  const head = b64u(JSON.stringify({ alg: "ES256", kid: ASC_KEY_ID, typ: "JWT" }));
  const body = b64u(JSON.stringify({ iss: ASC_ISSUER_ID, iat: now, exp: now + 15 * 60, aud: "appstoreconnect-v1" }));
  const sig = crypto.sign("sha256", Buffer.from(head + "." + body), { key: ASC_KEY_P8, dsaEncoding: "ieee-p1363" });
  return head + "." + body + "." + b64u(sig);
}

async function api(method, url, body) {
  const res = await fetch(url.startsWith("http") ? url : "https://api.appstoreconnect.apple.com" + url, {
    method,
    headers: { Authorization: "Bearer " + token(), "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const assoc = (e) => Object.entries(e.meta?.associatedErrors || {}).flatMap(([k, list]) => (list || []).map((x) => `\n   ↳ ${k}: ${x.code} — ${x.detail || x.title || ""}`)).join("");
    const msg = (json.errors || []).map((e) => `${e.status} ${e.code}: ${e.title} — ${e.detail || ""}${assoc(e)}`).join("\n");
    const err = new Error(`${method} ${url}\n${msg || text}`);
    err.status = res.status;
    err.json = json;
    throw err;
  }
  return json;
}
const log = (...a) => console.log("•", ...a);
const warnings = [];
const warn = (m) => {
  warnings.push(m);
  console.log("::warning::" + m);
};

/* ---------- Nội dung trang App Store ---------- */
const TEXT = {
  vi: {
    name: "DalatEvent",
    subtitle: "Đà Lạt có gì vui?",
    privacyPolicyUrl: "https://dalatevent.com/#/quyen-rieng-tu",
    promotionalText: "Lịch Festival Hoa Đà Lạt, sự kiện và show diễn mỗi ngày. Xếp lịch trình, nhắc giờ, chỉ đường và sưu tập dấu mộc Hộ chiếu Đà Lạt.",
    keywords: "đà lạt,dalat,sự kiện,festival hoa,lịch diễn,show,acoustic,lịch trình,du lịch,lễ hội",
    description: `DalatEvent trả lời câu hỏi "Đà Lạt có gì vui?" bằng lịch sự kiện được đối chiếu với nguồn chính thức và cập nhật mỗi ngày.

• Lịch Festival Hoa Đà Lạt cùng các sự kiện, triển lãm, show diễn đang và sắp diễn ra
• Lọc theo hôm nay, tối nay, cuối tuần hoặc một ngày bất kỳ
• Trợ lý "Hôm nay đi đâu?": nhắn một câu, nhận ngay lịch trình theo buổi
• Lịch trình của riêng bạn: cảnh báo trùng giờ, báo khi chương trình đổi lịch, nhắc trước 2 tiếng
• Top list Đà Lạt: hơn 1.000 địa điểm theo 127 chủ đề (săn mây, cà phê view đẹp, lẩu gà lá é, homestay…), có ảnh, tìm kiếm, xếp theo gần bạn và chỉ đường
• Bản đồ gần tôi và chỉ đường tới từng địa điểm
• Thời tiết và săn mây: gợi ý sáng nào nên đi săn mây, chiều nào nên ở trong nhà
• Hộ chiếu Đà Lạt: đến nơi, đóng dấu, sưu tập đủ bộ dấu mộc
• Dalat Deals: ưu đãi từ các quán và điểm diễn đối tác
• Song ngữ Việt – Anh, xem được cả khi sóng yếu

Không cần tài khoản để xem lịch. Đăng nhập (tùy chọn) bằng Apple, Google hoặc email để đồng bộ lịch trình giữa các máy.

Lịch có thể thay đổi; hãy xem lại trước khi đến.`,
    whatsNew: `• Mới: Top list Đà Lạt với hơn 1.000 địa điểm theo 127 chủ đề, có ảnh, tìm kiếm, xếp theo gần bạn và chỉ đường
• Mới: danh sách điểm săn mây trong trang Thời tiết, kèm chỉ đường
• Sửa lỗi nút Trợ lý che nút "Dùng ưu đãi"`,
  },
  "en-US": {
    name: "DalatEvent",
    subtitle: "What's on in Da Lat",
    privacyPolicyUrl: "https://dalatevent.com/#/quyen-rieng-tu?lang=en",
    promotionalText: "Da Lat Flower Festival schedule, events and live shows every day. Plan your days, get reminders and directions, and collect Da Lat Passport stamps.",
    keywords: "da lat,dalat,events,flower festival,live music,shows,acoustic,itinerary,travel,vietnam",
    description: `DalatEvent answers "What's on in Da Lat?" with an events calendar checked against official sources and updated daily.

• The Da Lat Flower Festival schedule plus events, exhibitions and live shows happening now and coming up
• Filter by today, tonight, this weekend or any date
• "Where to go today?" assistant: type one sentence and get a plan by time of day
• Your own plan: clash warnings, alerts when a programme changes, reminders 2 hours before
• Da Lat Top lists: 1,000+ places in 127 themes (cloud hunting, cafés with a view, local food, homestays…) with photos, search, nearest-first sorting and directions
• Map near me and directions to every venue
• Weather and cloud hunting: which mornings are worth an early start, which afternoons to stay indoors
• Da Lat Passport: visit, get stamped, collect the full set
• Dalat Deals: offers from partner cafés and venues
• Vietnamese and English, works on a weak connection

No account needed to browse. Optionally sign in with Apple, Google or email to sync your plan across devices.

Schedules can change; please check before you go.`,
    whatsNew: `• New: Da Lat Top lists with 1,000+ places in 127 themes, with photos, search, nearest-first sorting and directions
• New: cloud-hunting spots on the Weather page, with directions
• Fixed: the Assistant button no longer covers the "Use offer" button`,
  },
};
const SUPPORT_URL = "https://dalatevent.com/";
const COPYRIGHT = "© 2026 Sense Group";
const VIDEO_URL = process.env.REVIEW_VIDEO_URL || "";
const REVIEW_NOTES = `1) SCREEN RECORDING (physical iPhone, latest iOS): ${VIDEO_URL || "(link will be added)"}
It starts at app launch and shows browsing events, the assistant, map, passport, weather, language switch, and account registration, sign-in, sign-out and account deletion. It was recorded on version 1.0; what is new in this update is described in 3).

2) PURPOSE AND AUDIENCE
DalatEvent is a free events guide for Da Lat, Vietnam, run by Sense Group (a local Da Lat company). Audience: domestic and international visitors and residents. Problem it solves: event information in Da Lat (Flower Festival 2026, exhibitions, live music) is scattered across many sites; DalatEvent gathers it in one daily-updated, source-checked calendar and helps users plan their day.

3) HOW TO USE / ACCESS
No login is required for any core feature: Home (Today / Tonight / Weekend filters, search), Festival tab, Shows tab, Map tab ("Use my location" is optional), assistant (pink "Assistant" button: type e.g. "Saturday, two people, live music"), Weather & cloud forecast (strip on Home), Da Lat Passport (stamps only work within 300 m of a venue), Dalat Deals (offers from partner venues; browsing is open, using an offer needs sign-in).
New in this update: Top lists (green banner on Home). A directory of 1,000+ places in Da Lat in 127 themes (sights, cafés, food, stays, shopping) with one photo per place, search, optional "Sort by nearest" (location is used on the device only and not stored) and directions through Google Maps. "Watch clip" opens a public TikTok review link outside the app. The Weather page also lists cloud-hunting spots with directions.
Account is optional and only syncs the saved plan and passport stamps across devices. To test: tap "Sign in" (top right) → "Sign up" tab → create an account with any email and a 6+ character password, or use Sign in with Apple / Google.
Account deletion: "My plan" tab → tap the account strip → "Delete account" → confirm. This deletes the account and all its data.
Language: tap EN / VI at the top of any page.
There is no user-generated content shared with other users (a user's plan is private; a plan share link only contains the user's own list). No paid content, no in-app purchases, no ads, no tracking.

4) EXTERNAL SERVICES
- Firebase Authentication and Cloud Firestore (Google): optional accounts and plan sync.
- Sign in with Apple, Google Sign-In.
- GitHub (raw.githubusercontent.com): hosts the public event data files (updated daily by our team) and the Top list data and place photos.
- Open-Meteo (api.open-meteo.com): weather forecast for central Da Lat (no user location sent).
- Google Maps: embedded maps and directions links.
- OpenStreetMap: venue coordinates.
No AI services, no payment processors.

5) REGIONS
The app works the same in all regions. Content is about Da Lat, Vietnam, in Vietnamese and English. Not distributed in mainland China.

6) REGULATED INDUSTRY / THIRD-PARTY MATERIAL
Not a regulated industry. Event information is factual schedule data checked against public official sources (festival portal, venue websites) with links back to them. Top list entries are compiled by Sense Group's local content team; the place photos come from the media library that team gathered. Other artwork in the app is Sense Group's own illustration.`;

/* ---------- Các bước ---------- */
async function main() {
  const apps = await api("GET", `/v1/apps?filter[bundleId]=${BUNDLE}`);
  const app = apps.data[0];
  if (!app) throw new Error("Không thấy app " + BUNDLE + " trong App Store Connect");
  log("App:", app.attributes.name, app.id, "ngôn ngữ chính", app.attributes.primaryLocale);
  const primary = app.attributes.primaryLocale; // "vi"

  // 1. Quyền nội dung bên thứ ba (bản đồ Google, dữ liệu OpenStreetMap: dùng theo điều khoản của họ)
  try {
    await api("PATCH", `/v1/apps/${app.id}`, { data: { type: "apps", id: app.id, attributes: { contentRightsDeclaration: "USES_THIRD_PARTY_CONTENT" } } });
    log("Đã khai báo quyền nội dung");
  } catch (e) {
    warn("Chưa cập nhật được khai báo quyền nội dung (giữ như cũ):\n" + e.message);
  }

  // 1b. Phiên bản: dùng bản đúng số; chưa có thì đổi tên bản đang soạn, hoặc tạo bản mới (bản cập nhật)
  const EDITABLE = ["PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED", "METADATA_REJECTED", "INVALID_BINARY"];
  const stateOf = (v) => v.attributes.appVersionState || v.attributes.appStoreState || "";
  const vers = await api("GET", `/v1/apps/${app.id}/appStoreVersions?filter[platform]=IOS&limit=20`);
  for (const v of vers.data) console.log("  phiên bản", v.attributes.versionString, stateOf(v));
  let ver = vers.data.find((v) => v.attributes.versionString === VERSION);
  if (!ver) {
    const draft = vers.data.find((v) => EDITABLE.includes(stateOf(v)));
    if (draft) {
      ver = (await api("PATCH", `/v1/appStoreVersions/${draft.id}`, { data: { type: "appStoreVersions", id: draft.id, attributes: { versionString: VERSION } } })).data;
      log("Đổi số bản đang soạn thành", VERSION);
    } else {
      ver = (await api("POST", `/v1/appStoreVersions`, { data: { type: "appStoreVersions", attributes: { platform: "IOS", versionString: VERSION, copyright: COPYRIGHT, releaseType: "AFTER_APPROVAL" }, relationships: { app: { data: { type: "apps", id: app.id } } } } })).data;
      log("Đã tạo phiên bản mới", VERSION);
    }
  }
  const isUpdate = vers.data.some((v) => v.id !== ver.id);
  if (!EDITABLE.includes(stateOf(ver))) throw new Error("Phiên bản " + VERSION + " đang ở trạng thái " + stateOf(ver) + ", không sửa được. Hãy dùng số phiên bản mới.");

  // 2. App Info: danh mục, tên, phụ đề, link chính sách
  const infos = await api("GET", `/v1/apps/${app.id}/appInfos`);
  const LIVE = ["READY_FOR_DISTRIBUTION", "READY_FOR_SALE", "REPLACED_WITH_NEW_INFO", "REPLACED_WITH_NEW_VERSION"];
  for (const x of infos.data) console.log("  app info", x.id, x.attributes.state || "", x.attributes.appStoreState || "");
  const info = infos.data.find((x) => ![x.attributes.state, x.attributes.appStoreState].some((st) => LIVE.includes(st))) || infos.data[0];
  console.log("  app info dùng:", info.id, info.attributes.appStoreState || info.attributes.state);
  try {
    await api("PATCH", `/v1/appInfos/${info.id}`, {
      data: { type: "appInfos", id: info.id, relationships: { primaryCategory: { data: { type: "appCategories", id: "TRAVEL" } }, secondaryCategory: { data: { type: "appCategories", id: "ENTERTAINMENT" } } } },
    });
    log("Danh mục: Travel, Entertainment");
  } catch (e) {
    warn("Chưa đặt lại được danh mục (giữ như bản đang phát hành):\n" + e.message);
  }
  const infoLocs = await api("GET", `/v1/appInfos/${info.id}/appInfoLocalizations`);
  for (const [loc, t] of Object.entries(TEXT)) {
    const locale = loc === "vi" ? primary : loc;
    const have = infoLocs.data.find((x) => x.attributes.locale === locale);
    const attributes = { name: t.name, subtitle: t.subtitle, privacyPolicyUrl: t.privacyPolicyUrl };
    try {
      if (have) await api("PATCH", `/v1/appInfoLocalizations/${have.id}`, { data: { type: "appInfoLocalizations", id: have.id, attributes } });
      else await api("POST", `/v1/appInfoLocalizations`, { data: { type: "appInfoLocalizations", attributes: { ...attributes, locale }, relationships: { appInfo: { data: { type: "appInfos", id: info.id } } } } });
      log("Thông tin app", locale);
    } catch (e) {
      if (!isUpdate) throw e;
      warn("Chưa sửa được tên/phụ đề " + locale + " (giữ như bản đang phát hành):\n" + e.message);
    }
  }

  // 3. Độ tuổi: app không có nội dung nào trong các nhóm này → 4+
  // Câu dạng mức độ ghi "NONE", câu có/không ghi false. Câu chưa rõ kiểu: thử "NONE", API báo sai kiểu thì đổi sang false.
  try {
    const decl = await api("GET", `/v1/appInfos/${info.id}/ageRatingDeclaration`);
    const SKIP = /^(kidsAgeBand|ageRatingOverride.*|koreaAgeRatingOverride|developerAgeRatingInfoUrl|.*[Cc]lassification.*|.*Url)$/;
    const attrs = {};
    for (const [k, v] of Object.entries(decl.data.attributes || {})) {
      if (SKIP.test(k)) continue;
      attrs[k] = typeof v === "boolean" ? false : "NONE";
    }
    for (let tries = 0; tries < 12; tries++) {
      try {
        await api("PATCH", `/v1/ageRatingDeclarations/${decl.data.id}`, { data: { type: "ageRatingDeclarations", id: decl.data.id, attributes: attrs } });
        break;
      } catch (e) {
        const bad = (e.json?.errors || []).map((x) => (x.source?.pointer || "").split("/").pop()).filter((k) => k in attrs);
        if (!bad.length || tries === 11) throw e;
        for (const k of bad) attrs[k] = attrs[k] === "NONE" ? false : attrs[k] === false ? null : (delete attrs[k], undefined);
        for (const k of Object.keys(attrs)) if (attrs[k] === undefined || attrs[k] === null) delete attrs[k];
      }
    }
    log("Độ tuổi: không có nội dung hạn chế (" + Object.keys(attrs).length + " câu)");
  } catch (e) {
    warn("Chưa điền được độ tuổi qua API, cần điền tay ở App Information → Age Rating:\n" + e.message);
  }

  // 4. Giá: miễn phí
  try {
    const points = await api("GET", `/v1/apps/${app.id}/appPricePoints?filter[territory]=USA&limit=200`);
    const free = points.data.find((p) => Number(p.attributes.customerPrice) === 0);
    await api("POST", `/v1/appPriceSchedules`, {
      data: { type: "appPriceSchedules", relationships: { app: { data: { type: "apps", id: app.id } }, baseTerritory: { data: { type: "territories", id: "USA" } }, manualPrices: { data: [{ type: "appPrices", id: "${p0}" }] } } },
      included: [{ type: "appPrices", id: "${p0}", attributes: { startDate: null }, relationships: { appPricePoint: { data: { type: "appPricePoints", id: free.id } } } }],
    });
    log("Giá: miễn phí");
  } catch (e) {
    warn("Chưa đặt được giá miễn phí qua API:\n" + e.message);
  }

  // 5. Vùng phát hành: mọi nước trừ Trung Quốc đại lục (cần hồ sơ riêng)
  try {
    let terr = [];
    let next = `/v1/territories?limit=200`;
    while (next) {
      const r = await api("GET", next);
      terr = terr.concat(r.data.map((t) => t.id));
      next = r.links && r.links.next;
    }
    // API cần đủ mọi nước; Trung Quốc đại lục ghi available: false
    await api("POST", `/v2/appAvailabilities`, {
      data: {
        type: "appAvailabilities",
        attributes: { availableInNewTerritories: true },
        relationships: { app: { data: { type: "apps", id: app.id } }, territoryAvailabilities: { data: terr.map((_, i) => ({ type: "territoryAvailabilities", id: "${t" + i + "}" })) } },
      },
      included: terr.map((t, i) => ({ type: "territoryAvailabilities", id: "${t" + i + "}", attributes: { available: t !== "CHN" }, relationships: { territory: { data: { type: "territories", id: t } } } })),
    });
    log("Vùng phát hành:", terr.length - 1, "nước (trừ Trung Quốc đại lục)");
  } catch (e) {
    if (e.status !== 409) warn("Chưa đặt được vùng phát hành qua API:\n" + e.message);
    else {
      // Đã đặt trước đó: chỉ cần chắc Trung Quốc đại lục đang tắt
      try {
        const av = await api("GET", `/v1/apps/${app.id}/appAvailabilityV2`);
        let next = `/v2/appAvailabilities/${av.data.id}/territoryAvailabilities?limit=200&include=territory`;
        let chn = null;
        while (next && !chn) {
          const r = await api("GET", next);
          chn = r.data.find((t) => t.relationships?.territory?.data?.id === "CHN") || null;
          next = r.links && r.links.next;
        }
        if (chn && chn.attributes.available) {
          await api("PATCH", `/v1/territoryAvailabilities/${chn.id}`, { data: { type: "territoryAvailabilities", id: chn.id, attributes: { available: false } } });
          log("Vùng phát hành: đã tắt Trung Quốc đại lục");
        } else log("Vùng phát hành đã đặt, Trung Quốc đại lục đang tắt");
      } catch (e2) {
        warn("Chưa đặt được vùng phát hành:\n" + e.message + "\n" + e2.message);
      }
    }
  }

  // 6. Phiên bản: bản quyền, phát hành ngay sau khi duyệt, gắn bản build
  await api("PATCH", `/v1/appStoreVersions/${ver.id}`, { data: { type: "appStoreVersions", id: ver.id, attributes: { copyright: COPYRIGHT, releaseType: "AFTER_APPROVAL" } } });
  // Bản build vừa tải lên cần Apple xử lý vài phút: chờ tối đa 25 phút
  const buildUrl = `/v1/builds?filter[app]=${app.id}&filter[processingState]=VALID&sort=-uploadedDate&limit=20&filter[preReleaseVersion.version]=${VERSION}` + (BUILD ? `&filter[version]=${BUILD}` : "");
  let build = null;
  for (const until = Date.now() + 25 * 60 * 1000; ; ) {
    build = (await api("GET", buildUrl)).data[0];
    if (build || Date.now() > until) break;
    console.log("  chờ Apple xử lý bản build…");
    await new Promise((r) => setTimeout(r, 30000));
  }
  if (!build) throw new Error("Chưa có bản build nào của phiên bản " + VERSION + " xử lý xong");
  await api("PATCH", `/v1/appStoreVersions/${ver.id}/relationships/build`, { data: { type: "builds", id: build.id } });
  log("Phiên bản", VERSION, "gắn bản build", build.attributes.version);

  // 7. Nội dung từng ngôn ngữ + ảnh chụp màn hình
  const verLocs = await api("GET", `/v1/appStoreVersions/${ver.id}/appStoreVersionLocalizations`);
  for (const [loc, t] of Object.entries(TEXT)) {
    const locale = loc === "vi" ? primary : loc;
    let vl = verLocs.data.find((x) => x.attributes.locale === locale);
    const attributes = { description: t.description, keywords: t.keywords, promotionalText: t.promotionalText, supportUrl: SUPPORT_URL, marketingUrl: SUPPORT_URL };
    if (isUpdate && t.whatsNew) attributes.whatsNew = t.whatsNew;
    if (vl) await api("PATCH", `/v1/appStoreVersionLocalizations/${vl.id}`, { data: { type: "appStoreVersionLocalizations", id: vl.id, attributes } });
    else vl = (await api("POST", `/v1/appStoreVersionLocalizations`, { data: { type: "appStoreVersionLocalizations", attributes: { ...attributes, locale }, relationships: { appStoreVersion: { data: { type: "appStoreVersions", id: ver.id } } } } })).data;
    log("Mô tả", locale);
    await screenshots(vl.id, path.join(ROOT, "docs/app-store-screenshots", loc === "vi" ? "vi" : "en"));
  }

  // 8. Thông tin cho người duyệt
  const c = { contactFirstName: process.env.CONTACT_FIRST, contactLastName: process.env.CONTACT_LAST, contactPhone: process.env.CONTACT_PHONE, contactEmail: process.env.CONTACT_EMAIL };
  const reviewAttrs = { demoAccountRequired: false, notes: REVIEW_NOTES };
  for (const [k, v] of Object.entries(c)) if (v) reviewAttrs[k] = v;
  let rd = null;
  try {
    rd = (await api("GET", `/v1/appStoreVersions/${ver.id}/appStoreReviewDetail`)).data;
  } catch (e) {
    rd = null;
  }
  const hasContact = !!(c.contactEmail && c.contactPhone && c.contactFirstName && c.contactLastName);
  if (rd) await api("PATCH", `/v1/appStoreReviewDetails/${rd.id}`, { data: { type: "appStoreReviewDetails", id: rd.id, attributes: reviewAttrs } });
  else if (!hasContact) {
    warn("Thiếu thông tin liên hệ cho người duyệt (tên, họ, số điện thoại dạng +84…, email).");
    if (MODE === "submit") throw new Error("Không gửi duyệt được khi thiếu thông tin liên hệ cho người duyệt");
    console.log("\nĐã chuẩn bị xong phần còn lại, CHƯA gửi duyệt.");
    return;
  } else await api("POST", `/v1/appStoreReviewDetails`, { data: { type: "appStoreReviewDetails", attributes: reviewAttrs, relationships: { appStoreVersion: { data: { type: "appStoreVersions", id: ver.id } } } } });
  log("Thông tin cho người duyệt");

  if (MODE !== "submit") {
    console.log("\nĐã chuẩn bị xong, CHƯA gửi duyệt. Việc còn lại trên web: App Privacy (nhãn quyền riêng tư).");
    return;
  }

  // 9. Gửi duyệt
  let sub;
  // Tìm các lần nộp đang mở, kèm danh sách mục bên trong
  const open = await api("GET", `/v1/reviewSubmissions?filter[app]=${app.id}&filter[platform]=IOS&filter[state]=UNRESOLVED_ISSUES,READY_FOR_REVIEW,WAITING_FOR_REVIEW&include=items&limit=20`);
  const items = open.included || [];
  const itemsOf = (s) => (s.relationships?.items?.data || []).map((r) => items.find((i) => i.id === r.id)).filter(Boolean);
  for (const s of open.data) console.log("  lần nộp", s.id, s.attributes.state, "mục:", itemsOf(s).map((i) => i.attributes.state).join(",") || "(trống)");
  sub = open.data.find((s) => s.attributes.state === "UNRESOLVED_ISSUES") || open.data.find((s) => itemsOf(s).length) || open.data[0];
  // Huỷ các lần nộp rỗng thừa
  for (const s of open.data) {
    if (s.id !== sub?.id && s.attributes.state === "READY_FOR_REVIEW" && !itemsOf(s).length) {
      try { await api("PATCH", `/v1/reviewSubmissions/${s.id}`, { data: { type: "reviewSubmissions", id: s.id, attributes: { canceled: true } } }); console.log("  đã huỷ lần nộp rỗng", s.id); } catch (e) { console.log("  không huỷ được", s.id, e.message); }
    }
  }
  if (!sub) sub = (await api("POST", `/v1/reviewSubmissions`, { data: { type: "reviewSubmissions", attributes: { platform: "IOS" }, relationships: { app: { data: { type: "apps", id: app.id } } } } })).data;
  console.log("  dùng lần nộp", sub.id, sub.attributes.state);
  const mine = itemsOf(sub);
  // Mục bị trả về: đánh dấu đã xử lý
  for (const it of mine) {
    if (it.attributes.state !== "READY_FOR_REVIEW") {
      try { await api("PATCH", `/v1/reviewSubmissionItems/${it.id}`, { data: { type: "reviewSubmissionItems", id: it.id, attributes: { resolved: true } } }); console.log("  mục", it.id, "→ resolved"); } catch (e) { console.log("  mục", it.id, e.message); }
    }
  }
  if (!mine.length) {
    try {
      await api("POST", `/v1/reviewSubmissionItems`, { data: { type: "reviewSubmissionItems", relationships: { reviewSubmission: { data: { type: "reviewSubmissions", id: sub.id } }, appStoreVersion: { data: { type: "appStoreVersions", id: ver.id } } } } });
      console.log("  đã thêm phiên bản vào lần nộp");
    } catch (e) {
      console.log("  thêm mục lỗi:", e.message);
    }
  }
  await api("PATCH", `/v1/reviewSubmissions/${sub.id}`, { data: { type: "reviewSubmissions", id: sub.id, attributes: { submitted: true } } });
  console.log("\nĐÃ GỬI DUYỆT phiên bản " + VERSION + " (build " + build.attributes.version + ").");
}

async function screenshots(locId, dir) {
  if (!fs.existsSync(dir)) return warn("Không có thư mục ảnh " + dir);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".png")).sort();
  const sets = await api("GET", `/v1/appStoreVersionLocalizations/${locId}/appScreenshotSets`);
  let set = sets.data.find((s) => s.attributes.screenshotDisplayType === "APP_IPHONE_67");
  if (set) {
    const old = await api("GET", `/v1/appScreenshotSets/${set.id}/appScreenshots`);
    // Ảnh đang có trùng tên, trùng cỡ và đã xử lý xong: giữ nguyên, khỏi tải lại
    const same = old.data.length === files.length && files.every((f) => old.data.some((s) => s.attributes.fileName === f && s.attributes.fileSize === fs.statSync(path.join(dir, f)).size && s.attributes.assetDeliveryState?.state === "COMPLETE"));
    if (same) return log("Ảnh chụp màn hình: giữ nguyên " + files.length + " ảnh,", path.basename(dir));
    for (const s of old.data) await api("DELETE", `/v1/appScreenshots/${s.id}`);
  } else {
    set = (await api("POST", `/v1/appScreenshotSets`, { data: { type: "appScreenshotSets", attributes: { screenshotDisplayType: "APP_IPHONE_67" }, relationships: { appStoreVersionLocalization: { data: { type: "appStoreVersionLocalizations", id: locId } } } } })).data;
  }
  for (const f of files) {
    const buf = fs.readFileSync(path.join(dir, f));
    const shot = (await api("POST", `/v1/appScreenshots`, { data: { type: "appScreenshots", attributes: { fileName: f, fileSize: buf.length }, relationships: { appScreenshotSet: { data: { type: "appScreenshotSets", id: set.id } } } } })).data;
    for (const op of shot.attributes.uploadOperations) {
      const headers = Object.fromEntries((op.requestHeaders || []).map((h) => [h.name, h.value]));
      const r = await fetch(op.url, { method: op.method, headers, body: buf.subarray(op.offset, op.offset + op.length) });
      if (!r.ok) throw new Error("Tải ảnh " + f + " lỗi " + r.status);
    }
    const md5 = crypto.createHash("md5").update(buf).digest("hex");
    await api("PATCH", `/v1/appScreenshots/${shot.id}`, { data: { type: "appScreenshots", id: shot.id, attributes: { uploaded: true, sourceFileChecksum: md5 } } });
  }
  // Chờ Apple xử lý xong ảnh (tối đa 4 phút), nếu không sẽ chưa gửi duyệt được
  for (const until = Date.now() + 4 * 60 * 1000; ; ) {
    const now = await api("GET", `/v1/appScreenshotSets/${set.id}/appScreenshots`);
    const states = now.data.map((s) => s.attributes.assetDeliveryState?.state);
    if (states.every((st) => st === "COMPLETE") || Date.now() > until) {
      if (states.some((st) => st !== "COMPLETE")) warn("Ảnh chụp màn hình " + path.basename(dir) + " chưa xử lý xong: " + states.join(","));
      break;
    }
    await new Promise((r) => setTimeout(r, 10000));
  }
  log("Ảnh chụp màn hình:", files.length, "ảnh,", path.basename(dir));
}

main()
  .then(() => {
    if (warnings.length) console.log("\nCẦN LÀM TAY:\n- " + warnings.join("\n- "));
  })
  .catch((e) => {
    console.error("::error::" + e.message.split("\n")[0]);
    console.error(e.message);
    process.exit(1);
  });
