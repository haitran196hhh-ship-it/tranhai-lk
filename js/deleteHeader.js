// ============================================================
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
