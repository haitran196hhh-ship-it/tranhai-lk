/**
 * Locket RevenueCat Gold Unlocker (Full Product IDs)
 * Author: TranHai307
 */
let obj = {};
try {
  obj = JSON.parse($response.body || "{}");
} catch (e) {
  obj = {};
}

if (!obj.subscriber) {
  obj.subscriber = {};
}
if (!obj.subscriber.entitlements) {
  obj.subscriber.entitlements = {};
}
if (!obj.subscriber.subscriptions) {
  obj.subscriber.subscriptions = {};
}

const purchaseDate = "2024-01-01T00:00:00Z";
const expiresDate = "2099-12-31T23:59:59Z";

const subscriptionData = {
  is_sandbox: false,
  ownership_type: "PURCHASED",
  billing_issues_detected_at: null,
  period_type: "normal",
  expires_date: expiresDate,
  grace_period_expires_date: null,
  unsubscribe_detected_at: null,
  original_purchase_date: purchaseDate,
  purchase_date: purchaseDate,
  store: "app_store"
};

const productIds = [
  "locket_1600_1y",
  "locket_199_1m",
  "locket_3600_1y",
  "locket_gold_yearly"
];

for (const pid of productIds) {
  obj.subscriber.subscriptions[pid] = subscriptionData;
}

const entitlementData = {
  grace_period_expires_date: null,
  purchase_date: purchaseDate,
  product_identifier: "locket_1600_1y",
  expires_date: expiresDate
};

obj.subscriber.entitlements["Gold"] = entitlementData;
obj.subscriber.entitlements["locket_gold"] = entitlementData;
obj.subscriber.entitlements["pro"] = entitlementData;

$done({
  status: 200,
  body: JSON.stringify(obj)
});
