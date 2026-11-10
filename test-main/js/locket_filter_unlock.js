/**
 * Locket Filter & Profile Unblock (Clean Version)
 * Author: TranHai307
 * Description: Mở khóa các Filter/Khung Photobooth bị khóa quyền Premium trong ứng dụng.
 */

let body = $response.body;

if (body) {
    try {
        let obj = JSON.parse(body);

        // 1. Quét và bẻ khóa toàn bộ mảng Filters (Nếu có trả về)
        if (Array.isArray(obj.filters)) {
            obj.filters.forEach(filter => {
                if (filter.hasOwnProperty('isLocked')) filter.isLocked = false;
                if (filter.hasOwnProperty('isPremium')) filter.isPremium = false;
                if (filter.hasOwnProperty('unlocked')) filter.unlocked = true;
            });
            console.log("Đã mở khóa thành công danh sách Filter trả phí!");
        }

        // 2. Ép quyền Gold/Premium cho User profile (dự phòng)
        if (obj.user) {
            obj.user.is_premium = true;
            obj.user.is_gold = true;
        }

        // Trả kết quả đã mod về cho điện thoại
        $done({ body: JSON.stringify(obj) });
        
    } catch (error) {
        // Bỏ qua lỗi nếu gói tin không phải định dạng JSON chuẩn
        console.log("Lỗi Parse JSON Filter: " + error);
        $done({});
    }
} else {
    $done({});
}