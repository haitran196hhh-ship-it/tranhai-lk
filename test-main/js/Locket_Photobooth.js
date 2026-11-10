/**
 * Locket Photobooth & AI Filter Redirector (Clean Version)
 * Author: TranHai307
 * Description: Bắt gói tin tạo ảnh AI gốc và chuyển tiếp sang máy chủ Render riêng.
 */

let url = $request.url;
let headers = $request.headers;
let body = $request.body;

// ⚠️ QUAN TRỌNG: Thay đường link này bằng link web Render của riêng anh (nếu có). 
// Hiện tại đang để mặc định là máy chủ mượn của cộng đồng.
const RENDER_BACKEND_URL = "https://tranhai-lk.onrender.com/generateFilteredImage";

// Nếu phát hiện Locket đang gửi yêu cầu tạo ảnh AI
if (url.includes("/generateFilteredImage")) {
    console.log("Đã bắt được gói tin AI, đang bẻ lái sang trạm Render: " + RENDER_BACKEND_URL);
    
    // Yêu cầu Shadowrocket đổi đích đến, giữ nguyên toàn bộ ảnh (body) và chứng chỉ (headers)
    $done({
        url: RENDER_BACKEND_URL,
        headers: headers,
        body: body
    });
} else {
    // Các gói tin khác cho qua bình thường
    $done({});
}