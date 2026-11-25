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
    const msg = (json.errors || []).map((e) => `${e.status} ${e.code}: ${e.title} — ${e.detail || ""}`).join("\n");
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
• Bản đồ gần tôi và chỉ đường tới từng địa điểm
• Thời tiết và săn mây: gợi ý sáng nào nên đi săn mây, chiều nào nên ở trong nhà
• Hộ chiếu Đà Lạt: đến nơi, đóng dấu, sưu tập đủ bộ dấu mộc
• Dalat Deals: ưu đãi từ các quán và điểm diễn đối tác
• Song ngữ Việt – Anh, xem được cả khi sóng yếu

Không cần tài khoản để xem lịch. Đăng nhập (tùy chọn) bằng Apple, Google hoặc email để đồng bộ lịch trình giữa các máy.

Lịch có thể thay đổi; hãy xem lại trước khi đến.`,
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
• Map near me and directions to every venue
• Weather and cloud hunting: which mornings are worth an early start, which afternoons to stay indoors
• Da Lat Passport: visit, get stamped, collect the full set
• Dalat Deals: offers from partner cafés and venues
• Vietnamese and English, works on a weak connection

No account needed to browse. Optionally sign in with Apple, Google or email to sync your plan across devices.

Schedules can change; please check before you go.`,
  },
};
const SUPPORT_URL = "https://dalatevent.com/";
const COPYRIGHT = "© 2026 Sense Group";
const REVIEW_NOTES = `No sign-in is needed for the main features (calendar, search, map, assistant, weather, passport).
Sign-in is optional (Sign in with Apple, Google or email) and only syncs the user's saved plan and passport stamps across devices.
Account deletion: tab "My plan" (Lịch trình) → tap the account strip → "Delete account" (Xóa tài khoản).
Location is requested only when the user taps "Use my location" (Map) or "Stamp here" (Passport); it is processed on the device and never sent.
Language: tap EN/VI at the top of any page. No in-app purchases, no ads, no tracking.`;

/* ---------- Các bước ---------- */
async function main() {
  const apps = await api("GET", `/v1/apps?filter[bundleId]=${BUNDLE}`);
  const app = apps.data[0];
  if (!app) throw new Error("Không thấy app " + BUNDLE + " trong App Store Connect");
  log("App:", app.attributes.name, app.id, "ngôn ngữ chính", app.attributes.primaryLocale);
  const primary = app.attributes.primaryLocale; // "vi"

  // 1. Quyền nội dung bên thứ ba (bản đồ Google, dữ liệu OpenStreetMap: dùng theo điều khoản của họ)
  await api("PATCH", `/v1/apps/${app.id}`, { data: { type: "apps", id: app.id, attributes: { contentRightsDeclaration: "USES_THIRD_PARTY_CONTENT" } } });
  log("Đã khai báo quyền nội dung");

  // 2. App Info: danh mục, tên, phụ đề, link chính sách
  const infos = await api("GET", `/v1/apps/${app.id}/appInfos`);
  const info = infos.data.find((x) => !["READY_FOR_DISTRIBUTION", "REPLACED_WITH_NEW_INFO"].includes(x.attributes.appStoreState || x.attributes.state)) || infos.data[0];
  await api("PATCH", `/v1/appInfos/${info.id}`, {
    data: { type: "appInfos", id: info.id, relationships: { primaryCategory: { data: { type: "appCategories", id: "TRAVEL" } }, secondaryCategory: { data: { type: "appCategories", id: "ENTERTAINMENT" } } } },
  });
  log("Danh mục: Travel, Entertainment");
  const infoLocs = await api("GET", `/v1/appInfos/${info.id}/appInfoLocalizations`);
  for (const [loc, t] of Object.entries(TEXT)) {
    const locale = loc === "vi" ? primary : loc;
    const have = infoLocs.data.find((x) => x.attributes.locale === locale);
    const attributes = { name: t.name, subtitle: t.subtitle, privacyPolicyUrl: t.privacyPolicyUrl };
    if (have) await api("PATCH", `/v1/appInfoLocalizations/${have.id}`, { data: { type: "appInfoLocalizations", id: have.id, attributes } });
    else await api("POST", `/v1/appInfoLocalizations`, { data: { type: "appInfoLocalizations", attributes: { ...attributes, locale }, relationships: { appInfo: { data: { type: "appInfos", id: info.id } } } } });
    log("Thông tin app", locale);
  }

  // 3. Độ tuổi: app không có nội dung nào trong các nhóm này → 4+
  // Câu dạng mức độ ghi "NONE", câu có/không ghi false. Câu chưa rõ kiểu: thử "NONE", API báo sai kiểu thì đổi sang false.
  try {
    const decl = await api("GET", `/v1/appInfos/${info.id}/ageRatingDeclaration`);
    const SKIP = /^(kidsAgeBand|ageRatingOverride.*|koreaAgeRatingOverride|developerAgeRatingInfoUrl)$/;
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
    terr = terr.filter((t) => t !== "CHN");
    await api("POST", `/v2/appAvailabilities`, {
      data: {
        type: "appAvailabilities",
        attributes: { availableInNewTerritories: true },
        relationships: { app: { data: { type: "apps", id: app.id } }, territoryAvailabilities: { data: terr.map((_, i) => ({ type: "territoryAvailabilities", id: "${t" + i + "}" })) } },
      },
      included: terr.map((t, i) => ({ type: "territoryAvailabilities", id: "${t" + i + "}", attributes: { available: true }, relationships: { territory: { data: { type: "territories", id: t } } } })),
    });
    log("Vùng phát hành:", terr.length, "nước (trừ Trung Quốc đại lục)");
  } catch (e) {
    if (e.status === 409) log("Vùng phát hành đã đặt trước đó");
    else warn("Chưa đặt được vùng phát hành qua API:\n" + e.message);
  }

  // 6. Phiên bản: bản quyền, phát hành ngay sau khi duyệt, gắn bản build
  const vers = await api("GET", `/v1/apps/${app.id}/appStoreVersions?filter[platform]=IOS&limit=10`);
  let ver = vers.data.find((v) => v.attributes.versionString === VERSION) || vers.data[0];
  if (ver.attributes.versionString !== VERSION) {
    await api("PATCH", `/v1/appStoreVersions/${ver.id}`, { data: { type: "appStoreVersions", id: ver.id, attributes: { versionString: VERSION } } });
  }
  await api("PATCH", `/v1/appStoreVersions/${ver.id}`, { data: { type: "appStoreVersions", id: ver.id, attributes: { copyright: COPYRIGHT, releaseType: "AFTER_APPROVAL" } } });
  const builds = await api("GET", `/v1/builds?filter[app]=${app.id}&filter[processingState]=VALID&sort=-uploadedDate&limit=20` + (BUILD ? `&filter[version]=${BUILD}` : ""));
  const build = builds.data[0];
  if (!build) throw new Error("Chưa có bản build nào xử lý xong");
  await api("PATCH", `/v1/appStoreVersions/${ver.id}/relationships/build`, { data: { type: "builds", id: build.id } });
  log("Phiên bản", VERSION, "gắn bản build", build.attributes.version);

  // 7. Nội dung từng ngôn ngữ + ảnh chụp màn hình
  const verLocs = await api("GET", `/v1/appStoreVersions/${ver.id}/appStoreVersionLocalizations`);
  for (const [loc, t] of Object.entries(TEXT)) {
    const locale = loc === "vi" ? primary : loc;
    let vl = verLocs.data.find((x) => x.attributes.locale === locale);
    const attributes = { description: t.description, keywords: t.keywords, promotionalText: t.promotionalText, supportUrl: SUPPORT_URL, marketingUrl: SUPPORT_URL };
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
  if (rd) await api("PATCH", `/v1/appStoreReviewDetails/${rd.id}`, { data: { type: "appStoreReviewDetails", id: rd.id, attributes: reviewAttrs } });
  else await api("POST", `/v1/appStoreReviewDetails`, { data: { type: "appStoreReviewDetails", attributes: reviewAttrs, relationships: { appStoreVersion: { data: { type: "appStoreVersions", id: ver.id } } } } });
  log("Thông tin cho người duyệt" + (c.contactEmail && c.contactPhone ? "" : " (CHƯA có liên hệ: cần tên, số điện thoại, email)"));
  if (!(c.contactEmail && c.contactPhone && c.contactFirstName && c.contactLastName)) warn("Thiếu thông tin liên hệ cho người duyệt (App Review Information).");

  if (MODE !== "submit") {
    console.log("\nĐã chuẩn bị xong, CHƯA gửi duyệt. Việc còn lại trên web: App Privacy (nhãn quyền riêng tư).");
    return;
  }

  // 9. Gửi duyệt
  let sub;
  try {
    sub = (await api("POST", `/v1/reviewSubmissions`, { data: { type: "reviewSubmissions", attributes: { platform: "IOS" }, relationships: { app: { data: { type: "apps", id: app.id } } } } })).data;
  } catch (e) {
    const open = await api("GET", `/v1/reviewSubmissions?filter[app]=${app.id}&filter[platform]=IOS&filter[state]=READY_FOR_REVIEW`);
    sub = open.data[0];
    if (!sub) throw e;
  }
  try {
    await api("POST", `/v1/reviewSubmissionItems`, { data: { type: "reviewSubmissionItems", relationships: { reviewSubmission: { data: { type: "reviewSubmissions", id: sub.id } }, appStoreVersion: { data: { type: "appStoreVersions", id: ver.id } } } } });
  } catch (e) {
    if (e.status !== 409) throw e;
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
