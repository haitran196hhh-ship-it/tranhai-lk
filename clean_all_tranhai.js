const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RENDER_HOST = 'https://tranhai-lk.onrender.com';
const RENDER_DOMAIN = 'tranhai-lk.onrender.com';
const WORKER_HOST = 'https://odd-bar-7839locket-vip-tranhai.haitran196hhh.workers.dev';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/haitran196hhh-ship-it/tranhai-lk/main/test-main';
const GITHUB_RAW_JS = `${GITHUB_RAW_BASE}/js`;
const VER = Date.now();

function replaceAllRefs(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/\/\/ 🛡️ MinhHiep08 Security Shield[^\r\n]*\r?\n?/g, '')
    .replace(/\/\/ Unauthorized copying or decompilation[^\r\n]*\r?\n?/g, '')
    .replace(/https?:\/\/locket-vip\.mhiep20077\.workers\.dev\/+js\//gi, `${GITHUB_RAW_JS}/`)
    .replace(/https?:\/\/odd-bar-7839locket-vip-tranhai\.haitran196hhh\.workers\.dev\/+js\//gi, `${GITHUB_RAW_JS}/`)
    .replace(/https?:\/\/raw\.githubusercontent\.com\/mhiep20077-byte\/test\/main\/test-main\//gi, `${GITHUB_RAW_BASE}/`)
    .replace(/https?:\/\/raw\.githubusercontent\.com\/mhiep20077-byte\/test\/main\//gi, `${GITHUB_RAW_BASE}/`)
    .replace(/https?:\/\/raw\.githubusercontent\.com\/haitran196hhh-ship-it\/tranhai-lk\/main\/js\//gi, `${GITHUB_RAW_JS}/`)
    .replace(/https?:\/\/locket-vip\.mhiep20077\.workers\.dev/gi, RENDER_HOST)
    .replace(/https?:\/\/locket-mod-backend\.onrender\.com/gi, RENDER_HOST)
    .replace(/locket-vip\.mhiep20077\.workers\.dev/gi, RENDER_DOMAIN)
    .replace(/locket-mod-backend\.onrender\.com/gi, RENDER_DOMAIN)
    .replace(/https?:\/\/i\.ibb\.co\/[^"'\s)\\]+/gi, `${RENDER_HOST}/assets/img/gold_welcome.jpg`)
    .replace(/instagram\.com\/[a-zA-Z0-9_.-]+/gi, 'github.com/haitran196hhh-ship-it')
    .replace(/tiktok\.com\/@[a-zA-Z0-9_.-]+/gi, 'github.com/haitran196hhh-ship-it')
    .replace(/mhiep20077-byte\/test/gi, 'haitran196hhh-ship-it/tranhai-lk')
    .replace(/mhiep20077/gi, 'TranHai307')
    .replace(/MinhHiep08/g, 'TranHai307')
    .replace(/minhhiep08/gi, 'TranHai307');
}

// 1. VIẾT MÃ SẠCH 100% CHO js/deleteHeader.js
const cleanDeleteHeader = `// ============================================================
// Delete ETag & Cache Headers (Clean Version)
// Author: TranHai307
// ============================================================
let headers = Object.assign({}, ($request && $request.headers) || {});
const stripKeys = [
  "if-none-match",
  "if-modified-since",
  "x-revenuecat-etag",
  "x-firebase-etag"
];
for (let k of Object.keys(headers)) {
  if (stripKeys.includes(k.toLowerCase())) {
    delete headers[k];
  }
}
$done({ headers });
`;
fs.writeFileSync('js/deleteHeader.js', cleanDeleteHeader, 'utf8');
console.log('✅ Da giai ma sach se js/deleteHeader.js');

// 2. VIẾT MÃ SẠCH 100% CHO js/Locket_minhhiep08.js
const cleanRevenueCat = `// ============================================================
// Locket RevenueCat Gold Unlocker (Full Subscriptions & Entitlements)
// Author: TranHai307
// ============================================================
let obj = {};
try {
  obj = JSON.parse(($response && $response.body) || "{}");
} catch (e) {
  obj = {};
}
if (!obj || typeof obj !== "object") obj = {};

obj.Attention = "Chúc mừng bạn đã mở khóa Locket Gold VIP thành công - TranHai307!";
obj.request_date = obj.request_date || "2026-11-11T00:00:00Z";
obj.request_date_ms = obj.request_date_ms || Date.now();

const purchaseDate = "2010-07-30T00:00:00Z";
const expiresDate = "2099-12-31T23:59:59Z";

const subRecord = {
  auto_resume_date: null,
  display_name: "locket_1600_1y",
  is_sandbox: false,
  ownership_type: "PURCHASED",
  billing_issues_detected_at: null,
  management_url: "https://apps.apple.com/account/subscriptions",
  period_type: "normal",
  price: { amount: 399000, currency: "VND" },
  expires_date: expiresDate,
  grace_period_expires_date: null,
  refunded_at: null,
  unsubscribe_detected_at: null,
  original_purchase_date: purchaseDate,
  purchase_date: purchaseDate,
  store: "app_store",
  store_transaction_id: "30072010999999"
};

const entRecord = {
  grace_period_expires_date: null,
  purchase_date: purchaseDate,
  original_purchase_date: purchaseDate,
  product_identifier: "locket_1600_1y",
  product_plan_identifier: "locket_1600_1y",
  ownership_type: "PURCHASED",
  store: "app_store",
  is_sandbox: false,
  unsubscribe_detected_at: null,
  billing_issues_detected_at: null,
  expires_date: expiresDate
};

obj.subscriber = obj.subscriber || {};
obj.subscriber.subscriptions = obj.subscriber.subscriptions || {};
obj.subscriber.entitlements = obj.subscriber.entitlements || {};
obj.subscriber.non_subscriptions = obj.subscriber.non_subscriptions || {};
obj.subscriber.other_purchases = obj.subscriber.other_purchases || {};

const subKeys = [
  "locket_1600_1y", "Gold", "locket_gold", "pro", "locket_199_1m",
  "Gold_yearly", "locket_3600_1y", "camera_filters", "camera_filter",
  "filters", "filter", "ai_filters", "ai_filter", "locket_gold_yearly", "holiday_filters"
];
subKeys.forEach(k => { obj.subscriber.subscriptions[k] = subRecord; });

const entKeys = [
  "Gold", "locket_gold", "pro", "locket_199_1m", "Gold_yearly",
  "locket_3600_1y", "camera_filters", "camera_filter", "locket_filter",
  "locket_filters", "overlays", "filters", "filter", "ai_filters",
  "ai_filter", "locket_gold_yearly", "holiday_filters"
];
entKeys.forEach(k => { obj.subscriber.entitlements[k] = entRecord; });

let respHeaders = Object.assign({}, ($response && $response.headers) || {}, {
  "Content-Type": "application/json; charset=utf-8"
});
$done({ status: 200, headers: respHeaders, body: JSON.stringify(obj) });
`;
fs.writeFileSync('js/Locket_minhhiep08.js', cleanRevenueCat, 'utf8');
console.log('✅ Da giai ma sach se js/Locket_minhhiep08.js');

// 3. VIẾT MÃ SẠCH 100% CHO js/locket_filter_unlock.js
const cleanFilterUnlock = `// ============================================================
// Locket Filter & Gold Profile Unlocker (Clean Deobfuscated Version)
// Author: TranHai307
// ============================================================
const WORKER_HOST = "${RENDER_HOST}";
const VIP_STORE_KEY = "LOCKET_VIP_COMMUNITY";
const SELF_UID_KEY = "LOCKET_SELF_UID";
const SELF_USERNAME_KEY = "LOCKET_SELF_USERNAME";
const BASE_VIP_USERS = ["TranHai307", "tranhai307"];

function applyGoldBadge(node) {
  if (!node || typeof node !== "object") return;
  node.badge = "locket_gold";
  node.badge_type = "gold";
  node.is_gold_badge = true;
  node.is_gold = true;
  node.has_gold = true;
  node.gold = true;
  node.is_celebrity = true;
  node.has_celebrity_badge = true;
  node.type = "gold";
  node.membership_status = "active";
  if (node.user && typeof node.user === "object" && node.user !== node) applyGoldBadge(node.user);
  if (node.data && typeof node.data === "object" && node.data !== node) applyGoldBadge(node.data);
  if (node.profile && typeof node.profile === "object" && node.profile !== node) applyGoldBadge(node.profile);
}

if (typeof $response === "undefined") {
  const reqUrl = (typeof $request !== "undefined" && $request.url) ? $request.url : "";
  if (reqUrl.includes("getUserGoldStatus")) {
    const headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*"
    };
    const goldPayload = { badge: "locket_gold", badge_type: "gold", is_gold: true, success: true };
    $done({
      response: {
        status: 200,
        headers,
        body: JSON.stringify({ result: goldPayload, data: goldPayload })
      }
    });
  } else {
    let headers = Object.assign({}, ($request && $request.headers) || {});
    for (let k of Object.keys(headers)) {
      if (["if-none-match", "if-modified-since", "x-revenuecat-etag"].includes(k.toLowerCase())) {
        delete headers[k];
      }
    }
    $done({ headers });
  }
} else {
  const reqUrl = (typeof $request !== "undefined" && $request.url) ? $request.url : "";
  if (reqUrl.includes("generateFilteredImage")) {
    $done({});
  } else {
    let body = $response.body;
    let status = $response.status || $response.statusCode || 200;

    function unlockSelfUser(node) {
      if (!node || typeof node !== "object") return;
      applyGoldBadge(node);
      node.can_use_filter = true;
      node.can_select_filter = true;
      node.filter_selection_enabled = true;
      node.camera_filters_enabled = true;
      node.ai_filters = true;
      node.holiday_filters = true;
    }

    function transformNode(node) {
      if (!node || typeof node !== "object") return;
      if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) transformNode(node[i]);
        return;
      }
      const falseKeys = [
        "is_locked", "locked", "requires_gold", "requiresGold",
        "gold_only", "goldOnly", "paywall", "is_paywall",
        "upsell", "disabled", "is_disabled", "premium_only", "is_gold"
      ];
      for (let k of falseKeys) {
        if (k in node) node[k] = false;
      }
      const trueKeys = [
        "is_new", "unlocked", "is_unlocked", "active",
        "free", "can_use_filter", "enabled", "can_select_filter",
        "selectable", "is_selectable", "is_ready"
      ];
      for (let k of trueKeys) {
        if (k in node) node[k] = true;
      }
      const validUrl = node.thumbnail_url || node.unlocked_url || node.data_url || node.image_url || node.url;
      if (validUrl && typeof validUrl === "string" && validUrl.startsWith("http")) {
        if ("disabled_url" in node) node.disabled_url = validUrl;
        if ("disabled_image_url" in node) node.disabled_image_url = validUrl;
        if ("locked_url" in node) node.locked_url = validUrl;
      }
      for (let k of Object.keys(node)) {
        if (typeof node[k] === "object" && node[k] !== null) {
          transformNode(node[k]);
        }
      }
    }

    if (body && typeof body === "string") {
      try {
        body = replaceAllRefs(body);
        let obj = JSON.parse(body);
        const isFriendsOrFeed = /getFriends|getUsers|fetchFriends|getRecipients|recipients|moments|fetchMoments|getMoments|contacts/i.test(reqUrl);
        if (!isFriendsOrFeed && (status === 401 || status === 403 || status === 402)) {
          status = 200;
        }
        transformNode(obj);
        if (!isFriendsOrFeed && obj && typeof obj === "object") {
          unlockSelfUser(obj.result || obj.data || obj.user || obj);
        }
        body = JSON.stringify(obj);
      } catch (e) {}
    }

    let respHeaders = Object.assign({}, ($response && $response.headers) || {});
    delete respHeaders["content-encoding"];
    delete respHeaders["Content-Encoding"];
    delete respHeaders["content-length"];
    delete respHeaders["Content-Length"];
    delete respHeaders["transfer-encoding"];
    delete respHeaders["Transfer-Encoding"];
    respHeaders["Content-Type"] = "application/json; charset=utf-8";

    $done({ status, headers: respHeaders, body });
  }
}
`;
fs.writeFileSync('js/locket_filter_unlock.js', cleanFilterUnlock, 'utf8');
console.log('✅ Da giai ma sach se js/locket_filter_unlock.js');

// 4. LÀM SẠCH HOÀN TOÀN js/Locket_Unlocked.js VÀ BỔ SUNG ĐẦY ĐỦ KHUNG TỪ ASSETS/FRAMES
try {
  let unlockedContent = fs.readFileSync('js/Locket_Unlocked.js', 'utf8');
  unlockedContent = replaceAllRefs(unlockedContent);
  let sandbox = {
    $request: { headers: { 'User-Agent': 'Locket/1.0' } },
    $response: { body: '{}' },
    $done: (res) => { sandbox._out = res; },
    Date, String, Object, Array, JSON, Math, Number, Boolean, RegExp, parseInt, parseFloat, decodeURIComponent, encodeURIComponent
  };
  vm.runInNewContext(unlockedContent, sandbox, { timeout: 10000 });
  if (sandbox._out && sandbox._out.body) {
    const cleanJsonStr = replaceAllRefs(sandbox._out.body);
    const parsed = JSON.parse(cleanJsonStr);
    parsed.Attention = "Hệ thống Locket Gold VIP & Photobooth AI - TranHai307";
    if (parsed.entries) {
      for (const k of Object.keys(parsed.entries)) {
        if (typeof parsed.entries[k] === 'string') {
          parsed.entries[k] = replaceAllRefs(parsed.entries[k]);
        }
      }
      if (parsed.entries.feature_discovery_popup_config) {
        try {
          let popup = JSON.parse(parsed.entries.feature_discovery_popup_config);
          popup.title = "Lên Locket Gold thành công! 😎";
          popup.campaign = "locket_gold_tranhai307";
          popup.feature_set = [{
            title: "Trần Hải VIP ✨",
            body: "Full Photobooth & 173 AI Filters 💛",
            imageURL: `${RENDER_HOST}/assets/img/gold_welcome.jpg`
          }];
          parsed.entries.feature_discovery_popup_config = JSON.stringify(popup);
        } catch (e) {}
      }
      if (parsed.entries.camera_filter_config) {
        try {
          let cfg = JSON.parse(parsed.entries.camera_filter_config);
          cfg.allows_custom_filters = true;
          cfg.show_filter_button = true;
          cfg.sheet_enabled = true;
          cfg.open_sheet_immediately = false;
          parsed.entries.camera_filter_config = JSON.stringify(cfg);
        } catch (e) {}
      }
    }
    const finalUnlocked = `// ============================================================
// Locket Remote Config (Full Clean Deobfuscated - TranHai307)
// Author: TranHai307
// ============================================================
const PREBUILT_ENTRIES = ${JSON.stringify(parsed.entries, null, 2)};

let obj = {};
try {
  obj = JSON.parse(($response && $response.body) || "{}");
} catch (e) {
  obj = {};
}
if (!obj || typeof obj !== "object") obj = {};

obj.Attention = "Hệ thống Locket Gold VIP & Photobooth AI - TranHai307";
obj.state = "UPDATE";
obj.template_version_number = String(Date.now());
obj.entries = Object.assign({}, obj.entries || {}, PREBUILT_ENTRIES);

$done({ body: JSON.stringify(obj) });
`;
    fs.writeFileSync('js/Locket_Unlocked.js', finalUnlocked, 'utf8');
    console.log('✅ Da lam sach 100% thong tin TranHai307 trong js/Locket_Unlocked.js');
  }
} catch (e) {
  console.error('⚠️ Locket_Unlocked error:', e.message);
}

// 5. GIẢI MÃ TỰ ĐỘNG CÁC FILE JS CÒN LẠI (MeiTuXiuXiu, spotify, youtube)
function deobfuscateOtherJsFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');
  if (!code.includes('MinhHiep08 Security Shield') && !code.includes('_0x')) {
    fs.writeFileSync(filePath, replaceAllRefs(code), 'utf8');
    return;
  }
  try {
    // Tim ten ham giai ma chinh (VD: const _0x4d3d4c=_0x1f41)
    const aliasMatch = code.match(/(?:const|var|let)\s+(_0x[a-f0-9]+)\s*=\s*(_0x[a-f0-9]+)/);
    if (!aliasMatch) {
      fs.writeFileSync(filePath, replaceAllRefs(code), 'utf8');
      return;
    }
    const mainDecoderName = aliasMatch[2];

    // Chay file trong sandbox voi mock $request/$response/$done de mang字串 xoay xong
    const sandbox = {
      $request: { url: 'https://example.com', headers: {}, body: '{}' },
      $response: { status: 200, headers: {}, body: '{}' },
      $done: () => {},
      $notification: { post: () => {} },
      $persistentStore: { read: () => null, write: () => true },
      $prefs: { valueForKey: () => null, setValueForKey: () => true },
      $httpClient: { get: () => {}, post: () => {} },
      console: { log: () => {}, error: () => {} },
      Date, String, Object, Array, JSON, Math, Number, Boolean, RegExp, Error,
      Uint8Array, ArrayBuffer, DataView, Promise, Set, Map,
      parseInt, parseFloat, isNaN, isFinite, decodeURIComponent, encodeURIComponent, setTimeout, clearTimeout
    };
    try {
      vm.runInNewContext(code, sandbox, { timeout: 5000 });
    } catch (e) {}

    const decoderFn = sandbox[mainDecoderName];
    if (typeof decoderFn === 'function') {
      // Tim tat ca alias cua decoderFn
      const aliases = new Set([mainDecoderName]);
      const aliasRegex = /(_0x[a-f0-9]+)\s*=\s*(_0x[a-f0-9]+)/g;
      let m;
      for (let pass = 0; pass < 4; pass++) {
        aliasRegex.lastIndex = 0;
        while ((m = aliasRegex.exec(code)) !== null) {
          if (aliases.has(m[2])) aliases.add(m[1]);
        }
      }

      // Giai ma cac object map {_0xabc: 0x123}
      const objMaps = {};
      const mapRegex = /(_0x[a-f0-9]+)\s*=\s*\{((?:_0x[a-f0-9]+\s*:\s*0x[a-f0-9]+\s*,?\s*)+)\}/g;
      while ((m = mapRegex.exec(code)) !== null) {
        const mapName = m[1];
        objMaps[mapName] = {};
        const pairs = m[2].split(',');
        for (const p of pairs) {
          const kv = p.split(':');
          if (kv.length === 2) {
            objMaps[mapName][kv[0].trim()] = parseInt(kv[1].trim(), 16);
          }
        }
      }

      let transformed = code;
      // Thay _0xmap._0xkey bang so hex
      for (const [mapName, mapObj] of Object.entries(objMaps)) {
        for (const [k, val] of Object.entries(mapObj)) {
          const re = new RegExp(`\\b${mapName}\\.${k}\\b`, 'g');
          transformed = transformed.replace(re, '0x' + val.toString(16));
        }
      }

      // Thay _0xalias(0x123) bang chuoi da giai ma
      for (const al of aliases) {
        const callRe = new RegExp(`\\b${al}\\(\\s*(0x[a-f0-9]+|\\d+)\\s*\\)`, 'g');
        transformed = transformed.replace(callRe, (full, numStr) => {
          try {
            const idx = numStr.startsWith('0x') ? parseInt(numStr, 16) : parseInt(numStr, 10);
            const decoded = decoderFn(idx);
            if (typeof decoded === 'string') {
              return JSON.stringify(replaceAllRefs(decoded));
            }
          } catch (e) {}
          return full;
        });
      }

      // Gop cac chuoi noi nhau "a" + "b" va 'a' + 'b'
      for (let i = 0; i < 6; i++) {
        transformed = transformed.replace(/"([^"\\]*)"\s*\+\s*"([^"\\]*)"/g, '"$1$2"');
        transformed = transformed.replace(/"([^"\\]*)"\s*\+\s*'([^'\\]*)'/g, '"$1$2"');
      }

      transformed = replaceAllRefs(transformed);
      const banner = `// ============================================================\n// File: ${path.basename(filePath)} (Processed & Synced)\n// Author: TranHai307\n// ============================================================\n`;
      const finalCode = banner + transformed;
      // Kiem tra cu phap hop le truoc khi ghi
      new vm.Script(finalCode);
      fs.writeFileSync(filePath, finalCode, 'utf8');
      console.log('✅ Da giai ma chuoi & doi ten mien trong: ' + filePath);
    }
  } catch (err) {
    console.error('⚠️ Loi xu ly ' + filePath + ':', err.message);
  }
}

const otherJsFiles = [
  'js/MeiTuXiuXiu.js',
  'js/spotify-json.js',
  'js/spotify-proto.js',
  'js/youtube.request.js',
  'js/youtube.response.js',
  'Spotify-Rules/js/spotify-json.js',
  'Spotify-Rules/js/spotify-lyric.js',
  'Spotify-Rules/js/spotify-proto.js',
  'Spotify-Rules/js/spotify-qx-header.js'
];
otherJsFiles.forEach(deobfuscateOtherJsFile);

// 6. QUÉT VÀ ĐỔI TÊN MIỀN TRONG TOÀN BỘ CÁC FILE CẤU HÌNH (.sgmodule, .conf, .yaml, .json, .md, worker.js, server.js)
function walkAndClean(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'assets') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkAndClean(fullPath);
    } else if (/\.(sgmodule|conf|yaml|plugin|module|stoverride|json|md|js)$/i.test(entry.name)) {
      if (entry.name === 'package-lock.json' || entry.name === 'clean_all_tranhai.js') continue;
      const content = fs.readFileSync(fullPath, 'utf8');
      const cleaned = replaceAllRefs(content);
      if (cleaned !== content) {
        fs.writeFileSync(fullPath, cleaned, 'utf8');
        console.log('🔄 Da cap nhat thong tin TranHai307 trong: ' + path.relative(process.cwd(), fullPath));
      }
    }
  }
}
walkAndClean(process.cwd());
console.log('🎉 HOAN TAT DONG BO 100% DU AN SANG TRANHAI307!');
