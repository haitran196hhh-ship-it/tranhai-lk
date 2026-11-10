/**
 * Anti-Cache 304 & Firebase Force Fetch - TranHai307
 */
let headers = $request.headers || {};

const blockedHeaders = [
  "x-revenuecat-etag",
  "if-none-match",
  "if-modified-since",
  "x-goog-if-none-match"
];

for (let key of Object.keys(headers)) {
  if (blockedHeaders.includes(key.toLowerCase())) {
    delete headers[key];
  }
}

// Nếu là request gửi lên Firebase Remote Config, xóa digest cũ để ép server trả về full config
let body = $request.body;
if ($request.url && $request.url.includes("firebaseremoteconfig.googleapis.com") && body) {
  try {
    let obj = JSON.parse(body);
    delete obj.digest;
    delete obj.last_fetch_time;
    body = JSON.stringify(obj);
    $done({ headers, body });
  } catch (e) {
    $done({ headers });
  }
} else {
  $done({ headers });
}
