/**
 * Locket Universal Filter & Photobooth Injector (Full Sync)
 * Author: TranHai307
 */

const BASE_RENDER = "https://tranhai-lk.onrender.com";

let body = $response.body;
if (body) {
    try {
        let obj = JSON.parse(body);

        // Chuẩn hóa định dạng dữ liệu trả về dù ở bất kỳ cấp độ nào của JSON
        let targetList = null;
        if (Array.isArray(obj)) {
            targetList = obj;
        } else if (obj.filters && Array.isArray(obj.filters)) {
            targetList = obj.filters;
        } else if (obj.result && obj.result.filters && Array.isArray(obj.result.filters)) {
            targetList = obj.result.filters;
        } else if (obj.data && obj.data.filters && Array.isArray(obj.data.filters)) {
            targetList = obj.data.filters;
        } else if (obj.data && Array.isArray(obj.data)) {
            targetList = obj.data;
        } else {
            // Nếu là dạng object thuần, tự chuyển đổi thành cấu trúc chứa mảng filters
            if (!obj.filters) obj.filters = [];
            targetList = obj.filters;
        }

        // Khai báo danh sách toàn bộ khung Photobooth và Khung đơn tích hợp sẵn trên Render
        const masterPhotoboothCatalog = [
            { id: "pb_hello_kitty_4cut", name: "Kitty 4 Ô", category: "photobooth", thumb: `${BASE_RENDER}/assets/frames/pb_hello_kitty_4cut.png` },
            { id: "pb_sweet_moments_4cut", name: "Sweet 4 Ô", category: "photobooth", thumb: `${BASE_RENDER}/assets/frames/pb_sweet_moments_4cut.png` },
            { id: "pb_lunar_newyear_4cut", name: "Tết 4 Ô", category: "photobooth", thumb: `${BASE_RENDER}/assets/frames/pb_lunar_newyear_4cut.png` },
            { id: "pb_so_fresh_4cut", name: "So Fresh 4 Ô", category: "photobooth", thumb: `${BASE_RENDER}/assets/frames/pb_so_fresh_4cut.png` },
            { id: "pb_diem_thap_4cut", name: "Điểm Thấp 4 Ô", category: "photobooth", thumb: `${BASE_RENDER}/assets/frames/pb_diem_thap_4cut.png` },
            { id: "pb_strawberry", name: "Berry Days", category: "photobooth", thumb: `${BASE_RENDER}/assets/frames/photobooth_berry_days_thumb.png` },
            { id: "pb_vintage", name: "Happy Snap", category: "photobooth", thumb: `${BASE_RENDER}/assets/frames/photobooth_happy_snap_thumb.png` },
            { id: "pb_galaxy", name: "Sky Diary", category: "photobooth", thumb: `${BASE_RENDER}/assets/frames/photobooth_sky_diary_thumb.png` },
            { id: "photobooth_4cut", name: "Classic 4 Ô", category: "photobooth", thumb: `${BASE_RENDER}/assets/frames/photobooth_4cut.png` },
            { id: "pb_xmas_4cut", name: "Noel 4 Ô", category: "photobooth", thumb: `${BASE_RENDER}/assets/frames/pb_xmas_4cut.png` },
            { id: "khung_tet_mai_vang", name: "Mai Vàng", category: "frames", thumb: `${BASE_RENDER}/assets/frames/khung_tet_mai_vang.png` },
            { id: "khung_tet_meo_than_tai", name: "Mèo Thần Tài", category: "frames", thumb: `${BASE_RENDER}/assets/frames/khung_tet_meo_than_tai.png` }
        ];

        if (targetList) {
            // Mở khóa toàn bộ các filter sẵn có để tránh bị trạng thái locked/mờ không bấm được
            targetList.forEach(f => {
                f.isLocked = false;
                f.isPremium = false;
                f.unlocked = true;
                f.enabled = true;
                f.status = "active";
            });

            // Kiểm tra và chèn bù đắp những khung Photobooth còn thiếu vào mảng
            const existingIds = new Set(targetList.map(f => f.id || f.filter_id || f.name));
            masterPhotoboothCatalog.forEach(item => {
                if (!existingIds.has(item.id)) {
                    targetList.unshift({
                        id: item.id,
                        filter_id: item.id,
                        name: item.name,
                        title: item.name,
                        category: item.category,
                        thumbnail_url: item.thumb,
                        icon_url: item.thumb,
                        image_url: item.thumb,
                        isLocked: false,
                        isPremium: false,
                        unlocked: true,
                        enabled: true
                    });
                }
            });
        }

        // Can thiệp sâu vào Remote Config nếu API gọi đến file cấu hình camera
        if (obj.entries && obj.entries.camera_filter_config) {
            try {
                let cfg = JSON.parse(obj.entries.camera_filter_config);
                cfg.sheet_enabled = true;
                cfg.allows_custom_filters = true;
                cfg.show_filter_button = true;
                cfg.open_sheet_immediately = true;
                
                if (!cfg.sheet_filters) cfg.sheet_filters = [];
                // Ép đưa toàn bộ ID Photobooth vào nhóm hiển thị chính
                cfg.sheet_filters.unshift({
                    id: "tranhai_photobooth_group",
                    title: { en: "📸 Trần Hải Photobooth AI", vn: "📸 Khung Photobooth" },
                    filter_ids: masterPhotoboothCatalog.map(x => x.id)
                });
                
                obj.entries.camera_filter_config = JSON.stringify(cfg);
            } catch (err) {}
        }

        $done({ body: JSON.stringify(obj) });
    } catch (e) {
        $done({});
    }
} else {
    $done({});
}
