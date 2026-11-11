// ============================================================
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
