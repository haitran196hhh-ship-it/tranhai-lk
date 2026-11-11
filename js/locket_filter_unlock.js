// ============================================================
// Locket Filter & Gold Profile Unlocker (Clean Deobfuscated Version)
// Author: TranHai307
// ============================================================
const WORKER_HOST = "https://tranhai-lk.onrender.com";
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

