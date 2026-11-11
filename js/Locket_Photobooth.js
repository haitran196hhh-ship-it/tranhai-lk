// ============================================================
// Locket Photobooth & AI Filter Redirector -> Render
// Author: TranHai307
// ============================================================
const TARGET_HOST = "tranhai-lk.onrender.com";
const TARGET_URL = "https://tranhai-lk.onrender.com/generateFilteredImage";

if (typeof $response === "undefined") {
  try {
    if (!$request) {
      $done({});
    } else {
      let newUrl = TARGET_URL;
      if ($request.url && $request.url.includes("?")) {
        const qs = $request.url.split("?")[1];
        if (qs) newUrl += "?" + qs;
      }
      let headers = Object.assign({}, ($request && $request.headers) || {});
      headers["Host"] = TARGET_HOST;
      headers[":authority"] = TARGET_HOST;
      $done({ url: newUrl, headers: headers });
    }
  } catch (e) {
    $done({});
  }
} else {
  try {
    if ($response && $response.body) {
      let obj = {};
      try {
        obj = JSON.parse($response.body);
      } catch (e) {
        obj = {};
      }
      delete obj.error;
      delete obj.message;
      if (obj.result) {
        delete obj.result.error;
        delete obj.result.message;
      }
      let headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      };
      $done({ status: 200, headers: headers, body: JSON.stringify(obj) });
    } else {
      $done({});
    }
  } catch (e) {
    $done({});
  }
}

