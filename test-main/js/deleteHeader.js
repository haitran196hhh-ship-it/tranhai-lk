/**
 * Anti-Cache 304 Header Cleaner - TranHai307
 */
const headers = $request.headers;
delete headers["x-revenuecat-etag"];
delete headers["X-RevenueCat-ETag"];
delete headers["if-none-match"];
delete headers["If-None-Match"];
delete headers["if-modified-since"];
delete headers["If-Modified-Since"];
delete headers["x-goog-if-none-match"];
$done({ headers });