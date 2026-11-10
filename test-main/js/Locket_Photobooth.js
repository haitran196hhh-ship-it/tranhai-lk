/**
 * Locket Photobooth & AI Filter Direct Relay
 * Author: TranHai307
 */

const RENDER_URL = "https://tranhai-lk.onrender.com/generateFilteredImage";

if ($request.url && $request.url.includes("generateFilteredImage")) {
    $httpClient.post({
        url: RENDER_URL,
        headers: {
            "Content-Type": "application/json",
            "x-public-base": "https://tranhai-lk.onrender.com"
        },
        body: $request.body,
        timeout: 45
    }, function (error, response, data) {
        if (error || !data) {
            $done({});
        } else {
            $done({
                response: {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                        "Access-Control-Allow-Origin": "*"
                    },
                    body: data
                }
            });
        }
    });
} else {
    $done({});
}
