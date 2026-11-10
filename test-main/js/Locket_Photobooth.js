/**
 * Locket Photobooth & AI Filter Redirector (Clean Version)
 * Author: TranHai307
 */

let url = $request.url || "";
let headers = $request.headers || {};
let body = $request.body;

const RENDER_HOST = "tranhai-lk.onrender.com";
const RENDER_BACKEND_URL = `https://${RENDER_HOST}/generateFilteredImage`;

if (url.includes("/generateFilteredImage")) {
    headers["Host"] = RENDER_HOST;
    headers["host"] = RENDER_HOST;
    $done({
        url: RENDER_BACKEND_URL,
        headers: headers,
        body: body
    });
} else {
    $done({});
}
