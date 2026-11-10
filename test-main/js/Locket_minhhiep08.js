/**
 * Locket RevenueCat Gold Unlocker (Clean Version)
 * Author: TranHai307
 */
let obj = JSON.parse($response.body || "{}");

const goldEntitlement = {
  grace_period_expires_date: null,
  purchase_date: "2024-01-01T00:00:00Z",
  product_identifier: "locket_gold_yearly",
  expires_date: "2099-12-31T23:59:59Z"
};

const goldSubscription = {
  is_sandbox: false,
  ownership_type: "PURCHASED",
  billing_issues_detected_at: null,
  period_type: "normal",
  expires_date: "2099-12-31T23:59:59Z",
  grace_period_expires_date: null,
  unsubscribe_detected_at: null,
  original_purchase_date: "2024-01-01T00:00:00Z",
  purchase_date: "2024-01-01T00:00:00Z",
  store: "app_store"
};

obj.subscriber = obj.subscriber || {};
obj.subscriber.entitlements = obj.subscriber.entitlements || {};
obj.subscriber.subscriptions = obj.subscriber.subscriptions || {};

obj.subscriber.entitlements["Gold"] = goldEntitlement;
obj.subscriber.entitlements["pro"] = goldEntitlement;
obj.subscriber.subscriptions["locket_gold_yearly"] = goldSubscription;

$done({ body: JSON.stringify(obj) });