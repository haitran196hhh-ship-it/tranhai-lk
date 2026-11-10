/**
 * Locket Filter Catalog Injector & Unlocker
 * Author: TranHai307
 */

const BASE_RENDER = "https://tranhai-lk.onrender.com";

const CUSTOM_FRAMES = [
    { id: "pb_hello_kitty_4cut", title: "Kitty 4 Ô", thumbnail_url: `${BASE_RENDER}/assets/frames/pb_hello_kitty_4cut.png` },
    { id: "pb_sweet_moments_4cut", title: "Sweet 4 Ô", thumbnail_url: `${BASE_RENDER}/assets/frames/pb_sweet_moments_4cut.png` },
    { id: "pb_lunar_newyear_4cut", title: "Tết 4 Ô", thumbnail_url: `${BASE_RENDER}/assets/frames/pb_lunar_newyear_4cut.png` },
    { id: "pb_so_fresh_4cut", title: "So Fresh 4 Ô", thumbnail_url: `${BASE_RENDER}/assets/frames/pb_so_fresh_4cut.png` },
    { id: "pb_diem_thap_4cut", title: "Điểm Thấp 4 Ô", thumbnail_url: `${BASE_RENDER}/assets/frames/pb_diem_thap_4cut.png` },
    { id: "pb_strawberry", title: "Berry Days", thumbnail_url: `${BASE_RENDER}/assets/frames/photobooth_berry_days_thumb.png` },
    { id: "pb_vintage", title: "Happy Snap", thumbnail_url: `${BASE_RENDER}/assets/frames/photobooth_happy_snap_thumb.png` },
    { id: "pb_galaxy", title: "Sky Diary", thumbnail_url: `${BASE_RENDER}/assets/frames/photobooth_sky_diary_thumb.png` },
    { id: "photobooth_4cut", title: "Classic 4 Ô", thumbnail_url: `${BASE_RENDER}/assets/frames/photobooth_4cut.png` },
    { id: "pb_xmas_4cut", title: "Noel 4 Ô", thumbnail_url: `${BASE_RENDER}/assets/frames/pb_xmas_4cut.png` },
    { id: "pb_xmas_3cut", title: "Noel 3 Ô", thumbnail_url: `${BASE_RENDER}/assets/frames/pb_xmas_3cut.png` },
    { id: "pb_xmas_2cut", title: "Noel 2 Ô", thumbnail_url: `${BASE_RENDER}/assets/frames/pb_xmas_2cut.png` },
    { id: "khung_tet_mai_vang", title: "Mai Vàng", thumbnail_url: `${BASE_RENDER}/assets/frames/khung_tet_mai_vang.png` },
    { id: "khung_tet_meo_than_tai", title: "Mèo Thần Tài", thumbnail_url: `${BASE_RENDER}/assets/frames/khung_tet_meo_than_tai.png` },
    { id: "khung_hello_kitty_h_ng_pastel", title: "Kitty Pastel", thumbnail_url: `${BASE_RENDER}/assets/frames/khung_hello_kitty_h_ng_pastel.png` },
    { id: "khung_nh_shin_chan_vi_n_m_nh", title: "Shin-chan", thumbnail_url: `${BASE_RENDER}/assets/frames/khung_nh_shin_chan_vi_n_m_nh.png` }
];

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

        if (filterList) {
            filterList.forEach(f => {
                f.isLocked = false;
                f.isPremium = false;
                f.unlocked = true;
            });

            const existingIds = new Set(filterList.map(f => f.id || f.filter_id));
            CUSTOM_FRAMES.forEach(cf => {
                if (!existingIds.has(cf.id)) {
                    filterList.unshift({
                        id: cf.id,
                        filter_id: cf.id,
                        title: cf.title,
                        name: cf.title,
                        thumbnail_url: cf.thumbnail_url,
                        isLocked: false,
                        isPremium: false,
                        unlocked: true
                    });
                }
            });
        }

        $done({ body: JSON.stringify(obj) });
    } catch (e) {
        $done({});
    }
} else {
    $done({});
}
