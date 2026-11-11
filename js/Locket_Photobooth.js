// ============================================================
// Locket Photobooth & AI Filter Direct Forwarder -> Render
// Author: TranHai307 (Admin Unlimited)
// ============================================================
const TARGET_HOST = "tranhai-lk.onrender.com";
const TARGET_URL = "https://tranhai-lk.onrender.com/generateFilteredImage";

function buildLocketSuccessResponse(rawBody) {
  let obj = {};
  try {
    obj = typeof rawBody === "string" ? JSON.parse(rawBody) : (rawBody || {});
  } catch (e) {
    obj = {};
  }
  delete obj.error;
  delete obj.message;
  if (obj.result) {
    delete obj.result.error;
    delete obj.result.message;
  }
  return {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*"
    },
    body: JSON.stringify(obj)
  };
}

if (typeof $response === "undefined") {
  if (!$request) {
    $done({});
  } else {
    let targetUrl = TARGET_URL;
    if ($request.url && $request.url.includes("?")) {
      const qs = $request.url.split("?")[1];
      if (qs) targetUrl += "?" + qs;
    }
    let forwardHeaders = Object.assign({}, $request.headers || {});
    delete forwardHeaders["Host"];
    delete forwardHeaders["host"];
    delete forwardHeaders[":authority"];
    delete forwardHeaders["content-length"];
    delete forwardHeaders["Content-Length"];
    forwardHeaders["Content-Type"] = forwardHeaders["Content-Type"] || forwardHeaders["content-type"] || "application/json";
    forwardHeaders["X-Locket-Admin"] = "TranHai307";

    if ($request.body && typeof $httpClient !== "undefined" && $httpClient.post) {
      $httpClient.post({
        url: targetUrl,
        headers: forwardHeaders,
        body: $request.body,
        timeout: 90
      }, function(err, resp, data) {
        if (err || !data) {
          let fallbackHeaders = Object.assign({}, $request.headers || {});
          fallbackHeaders["Host"] = TARGET_HOST;
          fallbackHeaders[":authority"] = TARGET_HOST;
          $done({ url: targetUrl, headers: fallbackHeaders });
          return;
        }
        $done({ response: buildLocketSuccessResponse(data) });
      });
    } else {
      let headers = Object.assign({}, $request.headers || {});
      headers["Host"] = TARGET_HOST;
      headers[":authority"] = TARGET_HOST;
      $done({ url: targetUrl, headers: headers });
    }
  }
} else {
  if ($response && $response.body) {
    $done(buildLocketSuccessResponse($response.body));
  } else {
    $done({});
  }
}
