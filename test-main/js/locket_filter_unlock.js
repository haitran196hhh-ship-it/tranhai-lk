/**
 * Locket Filter Catalog Injector & Unlocker
 * Author: TranHai307
 */

const BASE_RENDER = "https://tranhai-lk.onrender.com";

const CUSTOM_FRAMES = [
    { id: "pb_hello_kitty_4cut", title: "Kitty 4 Ô", thumb: `${BASE_RENDER}/assets/frames/pb_hello_kitty_4cut.png` },
    { id: "pb_sweet_moments_4cut", title: "Sweet 4 Ô", thumb: `${BASE_RENDER}/assets/frames/pb_sweet_moments_4cut.png` },
    { id: "pb_lunar_newyear_4cut", title: "Tết 4 Ô", thumb: `${BASE_RENDER}/assets/frames/pb_lunar_newyear_4cut.png` },
    { id: "pb_so_fresh_4cut", title: "So Fresh 4 Ô", thumb: `${BASE_RENDER}/assets/frames/pb_so_fresh_4cut.png` },
    { id: "pb_diem_thap_4cut", title: "Điểm Thấp 4 Ô", thumb: `${BASE_RENDER}/assets/frames/pb_diem_thap_4cut.png` },
    { id: "pb_long_phung_1", title: "Long Phụng 1", thumb: `${BASE_RENDER}/assets/frames/pb_long_phung_1.png` },
    { id: "pb_strawberry", title: "Berry Days", thumb: `${BASE_RENDER}/assets/frames/photobooth_berry_days_thumb.png` },
    { id: "pb_vintage", title: "Happy Snap", thumb: `${BASE_RENDER}/assets/frames/photobooth_happy_snap_thumb.png` },
    { id: "pb_galaxy", title: "Sky Diary", thumb: `${BASE_RENDER}/assets/frames/photobooth_sky_diary_thumb.png` },
    { id: "photobooth_4cut", title: "Classic 4 Ô", thumb: `${BASE_RENDER}/assets/frames/photobooth_4cut.png` },
    { id: "pb_xmas_4cut", title: "Noel 4 Ô", thumb: `${BASE_RENDER}/assets/frames/pb_xmas_4cut.png` },
    { id: "pb_xmas_3cut", title: "Noel 3 Ô", thumb: `${BASE_RENDER}/assets/frames/pb_xmas_3cut.png` },
    { id: "pb_xmas_2cut", title: "Noel 2 Ô", thumb: `${BASE_RENDER}/assets/frames/pb_xmas_2cut.png` },
    { id: "khung_tet_mai_vang", title: "Mai Vàng", thumb: `${BASE_RENDER}/assets/frames/khung_tet_mai_vang.png` },
    { id: "khung_tet_meo_than_tai", title: "Mèo Thần Tài", thumb: `${BASE_RENDER}/assets/frames/khung_tet_meo_than_tai.png` },
    { id: "khung_hello_kitty_h_ng_pastel", title: "Kitty Pastel", thumb: `${BASE_RENDER}/assets/frames/khung_hello_kitty_h_ng_pastel.png` },
    { id: "khung_nh_pastel_vi_n_s_h_i_c_u", title: "Hải Âu Xanh", thumb: `${BASE_RENDER}/assets/frames/khung_nh_pastel_vi_n_s_h_i_c_u.png` },
    { id: "khung_nh_shin_chan_vi_n_m_nh", title: "Shin-chan", thumb: `${BASE_RENDER}/assets/frames/khung_nh_shin_chan_vi_n_m_nh.png` },
    { id: "crimson_mecha_gold", title: "Crimson Mecha", thumb: `${BASE_RENDER}/assets/crimson_mecha_gold_frame_clean_1024x1024.png` },
    { id: "cyber_valkyrie_violet", title: "Cyber Valkyrie", thumb: `${BASE_RENDER}/assets/cyber_valkyrie_violet_frame_ios_1024x1024.png` }
];

let body = $response.body;
if (body) {
    try {
        let obj = JSON.parse(body);
        const list = obj.filters || (obj.result && obj.result.filters) || (obj.data && obj.data.filters);

        if (Array.isArray(list)) {
            list.forEach(f => {
                f.isLocked = false;
                f.isPremium = false;
                f.unlocked = true;
            });

            const existingIds = new Set(list.map(f => f.id || f.filter_id));
            CUSTOM_FRAMES.forEach(cf => {
                if (!existingIds.has(cf.id)) {
                    list.unshift({
                        id: cf.id,
                        filter_id: cf.id,
                        title: cf.title,
                        name: cf.title,
                        thumbnail_url: cf.thumb,
                        icon_url: cf.thumb,
                        image_url: cf.thumb,
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
