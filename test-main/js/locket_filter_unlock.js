/**
 * Locket Filter Catalog Injector & Force Unlock (Final Fix)
 * Author: TranHai307
 */

const BASE_RENDER = "https://tranhai-lk.onrender.com";

let body = $response.body;
if (body) {
    try {
        let obj = JSON.parse(body);
        let filterList = null;

        if (Array.isArray(obj)) {
            filterList = obj;
        } else if (Array.isArray(obj.filters)) {
            filterList = obj.filters;
        } else if (obj.result && Array.isArray(obj.result.filters)) {
            filterList = obj.result.filters;
        } else if (obj.data && Array.isArray(obj.data.filters)) {
            filterList = obj.data.filters;
        } else if (obj.data && Array.isArray(obj.data)) {
            filterList = obj.data;
        }

        // Danh sách các khung Photobooth được ép định dạng chuẩn để Locket cho phép bấm chọn
        const forcedPhotoboothFilters = [
            { id: "pb_hello_kitty_4cut", name: "Kitty 4 Ô", thumbnail_url: `${BASE_RENDER}/assets/frames/pb_hello_kitty_4cut.png` },
            { id: "pb_sweet_moments_4cut", name: "Sweet 4 Ô", thumbnail_url: `${BASE_RENDER}/assets/frames/pb_sweet_moments_4cut.png` },
            { id: "pb_lunar_newyear_4cut", name: "Tết 4 Ô", thumbnail_url: `${BASE_RENDER}/assets/frames/pb_lunar_newyear_4cut.png` },
            { id: "pb_so_fresh_4cut", name: "So Fresh 4 Ô", thumbnail_url: `${BASE_RENDER}/assets/frames/pb_so_fresh_4cut.png` },
            { id: "pb_diem_thap_4cut", name: "Điểm Thấp 4 Ô", thumbnail_url: `${BASE_RENDER}/assets/frames/pb_diem_thap_4cut.png` },
            { id: "pb_strawberry", name: "Berry Days", thumbnail_url: `${BASE_RENDER}/assets/frames/photobooth_berry_days_thumb.png` },
            { id: "pb_vintage", name: "Happy Snap", thumbnail_url: `${BASE_RENDER}/assets/frames/photobooth_happy_snap_thumb.png` },
            { id: "pb_galaxy", name: "Sky Diary", thumbnail_url: `${BASE_RENDER}/assets/frames/photobooth_sky_diary_thumb.png` },
            { id: "photobooth_4cut", name: "Classic 4 Ô", thumbnail_url: `${BASE_RENDER}/assets/frames/photobooth_4cut.png` },
            { id: "pb_xmas_4cut", name: "Noel 4 Ô", thumbnail_url: `${BASE_RENDER}/assets/frames/pb_xmas_4cut.png` }
        ];

        if (filterList) {
            filterList.forEach(f => {
                f.isLocked = false;
                f.isPremium = false;
                f.unlocked = true;
                f.enabled = true;
            });

            const existingIds = new Set(filterList.map(f => f.id || f.filter_id));
            forcedPhotoboothFilters.forEach(cf => {
                if (!existingIds.has(cf.id)) {
                    filterList.unshift({
                        id: cf.id,
                        filter_id: cf.id,
                        title: cf.name,
                        name: cf.name,
                        thumbnail_url: cf.thumbnail_url,
                        icon_url: cf.thumbnail_url,
                        image_url: cf.thumbnail_url,
                        isLocked: false,
                        isPremium: false,
                        unlocked: true,
                        enabled: true
                    });
                }
            });
        }

        // Nếu đối tượng trả về chứa cấu hình sheet_filters, ép nhồi toàn bộ ID vào
        if (obj.entries && obj.entries.camera_filter_config) {
            try {
                let cfConfig = JSON.parse(obj.entries.camera_filter_config);
                cfConfig.sheet_enabled = true;
                cfConfig.allows_custom_filters = true;
                if (cfConfig.sheet_filters && Array.isArray(cfConfig.sheet_filters)) {
                    cfConfig.sheet_filters.forEach(group => {
                        if (!group.filter_ids) group.filter_ids = [];
                        forcedPhotoboothFilters.forEach(cf => {
                            if (!group.filter_ids.includes(cf.id)) {
                                group.filter_ids.unshift(cf.id);
                            }
                        });
                    });
                }
                obj.entries.camera_filter_config = JSON.stringify(cfConfig);
            } catch (err) {}
        }

        $done({ body: JSON.stringify(obj) });
    } catch (e) {
        $done({});
    }
} else {
    $done({});
}
