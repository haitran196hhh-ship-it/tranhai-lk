/**
 * Locket Mod, AI Filter & Photobooth Full Backend Server
 * Author: TranHai307
 * Hỗ trợ: Quét toàn bộ assets/frames, assets/img, assets/stickers và 5 tệp data/*.json
 */

const express = require('express');
const cors = require('cors');
const sharp = require('sharp');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const PUBLIC_DIR = path.join(__dirname, 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const ASSETS_DIR = path.join(__dirname, 'assets');
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

// 1. TẢI VÀ HỢP NHẤT TOÀN BỘ 5 FILE PROMPT AI TRONG THƯ MỤC data/
let AI_PROMPTS = {};
const promptFiles = [
    'locket_all_ai_prompts.json',
    'matched_ai_prompts.json',
    'js_ai_prompts.json',
    'embedded.json',
    'ai_prompts.json'
];

for (const file of promptFiles) {
    try {
        const fullPath = path.join(DATA_DIR, file);
        if (fs.existsSync(fullPath)) {
            const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                for (const [k, v] of Object.entries(parsed)) {
                    if (typeof v === 'string' && v.trim()) {
                        AI_PROMPTS[k] = v.trim();
                        AI_PROMPTS[k.toLowerCase()] = v.trim();
                    } else if (v && typeof v === 'object' && (v.prompt || v.text)) {
                        const pText = String(v.prompt || v.text).trim();
                        AI_PROMPTS[k] = pText;
                        AI_PROMPTS[k.toLowerCase()] = pText;
                    }
                }
            }
        }
    } catch (e) {
        console.error(`Không thể đọc file ${file}:`, e.message);
    }
}
console.log(`Đã nạp tổng cộng ${Object.keys(AI_PROMPTS).length} khóa Prompt AI từ thư mục data/`);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Bộ nhớ ghi log 50 request gần nhất để kiểm tra lỗi trực tiếp
const requestLogs = [];
function addLog(type, details) {
    requestLogs.unshift({
        time: new Date().toISOString(),
        type,
        details
    });
    if (requestLogs.length > 50) requestLogs.pop();
}

app.use((req, res, next) => {
    if (req.path !== '/api/logs' && req.path !== '/health') {
        addLog("REQUEST", {
            method: req.method,
            url: req.url,
            ip: req.ip,
            bodyKeys: req.body ? Object.keys(req.body) : []
        });
    }
    next();
});

app.get('/api/logs', (req, res) => {
    res.json({ count: requestLogs.length, logs: requestLogs });
});

app.use('/images', express.static(IMAGES_DIR, { maxAge: '1d' }));
app.use('/assets', express.static(ASSETS_DIR, { maxAge: '1d' }));
app.use(express.static(PUBLIC_DIR));

const pbSessions = new Map();

// 2. BẢNG ÁNH XẠ ĐẦY ĐỦ KHUNG PHOTOBOOTH & KHUNG ĐƠN (assets/frames, assets/img, assets/)
const FRAME_MAP = {
    // Photobooth 4-cut, 3-cut, 2-cut
    "pb_strawberry": "pb_strawberry.png",
    "frame_berry_days": "pb_strawberry.png",
    "photobooth_berry_days": "photobooth_berry_days.png",
    "photobooth_berry_days_full": "photobooth_berry_days_full.png",
    "pb_vintage": "pb_vintage.png",
    "frame_happy_snap": "pb_vintage.png",
    "photobooth_happy_snap": "pb_vintage.png",
    "pb_galaxy": "pb_galaxy.png",
    "frame_sky_diary": "pb_galaxy.png",
    "photobooth_sky_diary": "photobooth_sky_diary.png",
    "pb_holo_4cut": "pb_holo_4cut.png",
    "pb_scrapbook_ripped_4cut": "pb_scrapbook_ripped_4cut.png",
    "pb_ripped_paper_4cut": "pb_ripped_paper_4cut.png",
    "pb_denim_ripped_2x2": "pb_denim_ripped_2x2.png",
    "frame_classic_pb": "photoboot.png",
    "photoboot": "photoboot.png",
    "photobooth_1": "photobooth_1.png",
    "photobooth_2": "photobooth_2.png",
    "photobooth_3": "photobooth_3.png",
    "photobooth_cute": "photobooth_cute.png",
    "photobooth_4cut": "photobooth_4cut.png",
    "photobooth_film": "photobooth_film.png",

    // Photobooth Tết & Noel
    "pb_tet_4cut": "pb_tet_4cut.png",
    "photobooth_tet": "pb_tet_4cut.png",
    "pb_lunar_newyear_4cut": "pb_lunar_newyear_4cut.png",
    "pb_sweet_moments_4cut": "pb_sweet_moments_4cut.png",
    "pb_hello_kitty_4cut": "pb_hello_kitty_4cut.png",
    "pb_so_fresh_4cut": "pb_so_fresh_4cut.png",
    "pb_long_phung_1": "pb_long_phung_1.png",
    "pb_long_phung_2": "pb_long_phung_2.png",
    "pb_long_phung_3": "pb_long_phung_3.png",
    "pb_long_phung_5": "pb_long_phung_5.png",
    "pb_long_phung_6": "pb_long_phung_6.png",
    "pb_long_phung_7": "pb_long_phung_7.png",
    "pb_long_phung_9": "pb_long_phung_9.png",
    "pb_diem_thap_4cut": "pb_diem_thap_4cut.png",
    "pb_xmas_4cut": "pb_xmas_4cut.png",
    "pb_xmas_3cut": "pb_xmas_3cut.png",
    "pb_xmas_2cut": "pb_xmas_2cut.png",

    // Khung Tết (Single Frames)
    "khung_tet_mai_vang": "khung_tet_mai_vang.png",
    "khung_tet_be_ran": "khung_tet_be_ran.png",
    "khung_tet_phao_hoa": "khung_tet_phao_hoa.png",
    "khung_tet_lan_su_rong": "khung_tet_lan_su_rong.png",
    "khung_tet_be_ran_li_xi": "khung_tet_be_ran_li_xi.png",
    "khung_tet_meo_than_tai": "khung_tet_meo_than_tai.png",

    // Khung đơn trong assets/frames, assets/img và assets/
    "pb_single_denim_ripped": "pb_single_denim_ripped.png",
    "pb_single_film_nostalgia": "pb_single_film_nostalgia.png",
    "pb_single_y2k_silver_holo": "pb_single_y2k_silver_holo.png",
    "cmt_locket": "cmt_locket.png",
    "khung_anh_o_kitty_v_sao": "khung_anh_o_kitty_v_sao.png",
    "khung_hello_kitty_h_ng_pastel": "khung_hello_kitty_h_ng_pastel.png",
    "khung_hello_kitty_pastel_ng_t_ng_o": "khung_hello_kitty_pastel_ng_t_ng_o.png",
    "khung_kh_ng_gian_xanh_pastel": "khung_kh_ng_gian_xanh_pastel.png",
    "khung_nh_hoa_pastel_vi_n_xanh_m_nh": "khung_nh_hoa_pastel_vi_n_xanh_m_nh.png",
    "khung_nh_n_pastel_vi_n_ren": "khung_nh_n_pastel_vi_n_ren.png",
    "khung_nh_pastel_vi_n_s_h_i_c_u": "khung_nh_pastel_vi_n_s_h_i_c_u.png",
    "khung_nh_shin_chan_vi_n_m_nh": "khung_nh_shin_chan_vi_n_m_nh.png",
    "khung_nh_vu_ng_m_ng_nh_n_b_c": "khung_nh_vu_ng_m_ng_nh_n_b_c.png",
    "khung_vu_ng_ng_i_sao_h_ng_pastel": "khung_vu_ng_ng_i_sao_h_ng_pastel.png",
    "khung_xanh_v_tay_sao_v_ng": "khung_xanh_v_tay_sao_v_ng.png",
    "sinh_nh_t_hello_kitty_ho_i_c": "sinh_nh_t_hello_kitty_ho_i_c.png",
    "sticker_b_nh_lu_n_minh_tu": "sticker_b_nh_lu_n_minh_tu.png",
    "custom_frame": "custom_frame.png",
    "custom_frame_640": "custom_frame_640.png",
    "custom_frame_v2": "custom_frame_v2.png",
    "frame_mon_640": "frame_mon_640.png",
    "frame_tue_640": "frame_tue_640.png",
    "frame_wed_640": "frame_wed_640.png",
    "frame_thu_640": "frame_thu_640.png",
    "frame_fri_640": "frame_fri_640.png",
    "frame_sat_640": "frame_sat_640.png",
    "frame_sun_640": "frame_sun_640.png",
    "crimson_mecha_gold": "crimson_mecha_gold_frame_clean_1024x1024.png",
    "cyber_valkyrie_violet": "cyber_valkyrie_violet_frame_ios_1024x1024.png"
};

// 3. BẢNG BỐ CỤC TỌA ĐỘ TỪNG Ô CHO CÁC KHUNG PHOTOBOOTH ĐẶC THÙ
const CUSTOM_PB_LAYOUTS = {
    "pb_lunar_newyear_4cut": {
        width: 1080, height: 1080,
        slots: [
            { left: 541, top: 178, width: 257, height: 228 },
            { left: 522, top: 428, width: 258, height: 236 },
            { left: 503, top: 678, width: 260, height: 245 },
            { left: 298, top: 544, width: 193, height: 195 }
        ]
    },
    "pb_sweet_moments_4cut": {
        width: 1080, height: 1080,
        slots: [
            { left: 250, top: 235, width: 280, height: 325 },
            { left: 550, top: 235, width: 280, height: 325 },
            { left: 250, top: 580, width: 280, height: 325 },
            { left: 550, top: 580, width: 280, height: 325 }
        ]
    },
    "pb_hello_kitty_4cut": {
        width: 1080, height: 1080,
        slots: [
            { left: 190, top: 45,  width: 350, height: 455 },
            { left: 540, top: 45,  width: 350, height: 455 },
            { left: 190, top: 500, width: 350, height: 455 },
            { left: 540, top: 490, width: 350, height: 530 }
        ]
    },
    "pb_so_fresh_4cut": {
        width: 1080, height: 1080,
        slots: [
            { left: 230, top: 160, width: 300, height: 290 },
            { left: 595, top: 200, width: 245, height: 245 },
            { left: 255, top: 565, width: 235, height: 235 },
            { left: 540, top: 635, width: 315, height: 305 }
        ]
    },
    "pb_diem_thap_4cut": {
        width: 1080, height: 1080,
        slots: [
            { left: 120, top: 160, width: 440, height: 400 },
            { left: 555, top: 160, width: 440, height: 400 },
            { left: 120, top: 555, width: 440, height: 430 },
            { left: 555, top: 555, width: 440, height: 430 }
        ]
    }
};

// Tự động thêm cấu hình 4 ô vuông cho toàn bộ dòng pb_long_phung_1 -> 9
["1", "2", "3", "5", "6", "7", "9"].forEach(num => {
    CUSTOM_PB_LAYOUTS[`pb_long_phung_${num}`] = {
        width: 1080, height: 1080,
        slots: [
            { left: 0,   top: 0,   width: 545, height: 545 },
            { left: 535, top: 0,   width: 545, height: 545 },
            { left: 0,   top: 535, width: 545, height: 545 },
            { left: 535, top: 535, width: 545, height: 545 }
        ]
    };
});

// 4. BẢNG ÁNH XẠ STICKER TRONG assets/stickers/
const STICKER_MAP = {
    'okay_wig': 'stk_dio_orange_wig.png',
    'disco_lights': 'stk_dio_disco.png',
    'cash_money': 'stk_dio_cash.png',
    'cowboy_cowgirl': 'stk_dio_cowboy.png',
    'looks_maxxing': 'stk_dio_looksmaxing.png',
    'blonde_bleached': 'stk_dio_bleached_hair.png',
    'bob_cut': 'stk_dio_bob.png',
    'beard': 'stk_dio_bearded.png',
    'bearded': 'stk_dio_bearded.png',
    'sweet_hearts': 'stk_dio_sweat_hearts.png',
    'elf_cutout': 'stk_dio_elf.png',
    'santa_cutout': 'stk_dio_santa.png',
    'easter_bunney_cutout': 'stk_dio_easter_bunny.png',
    'easter_chick_cutout': 'stk_dio_easter_chick.png',
    'toothless': 'stk_dio_toothless.png',
    'bye_brows': 'stk_dio_bye_brows.png',
    'bowling_ball': 'stk_dio_bowling_ball.png',
    'buns': 'stk_dio_buns.png',
    'tatted': 'stk_dio_tatted.png',
    'mohawk': 'stk_dio_mohawk.png',
    'braces': 'stk_dio_braces.png',
    'slimed': 'stk_dio_slimed.png',
    'princess': 'stk_dio_princess.png',
    'happy_birthday': 'stk_dio_happy_birthday.png',
    'cutesy': 'stk_dio_cutesy.png',
    'sticker_face': 'stk_dio_sticker_face.png',
    'flower_crown': 'stk_dio_flower_crown.png',
    'love_bug': 'stk_dio_love_bug.png',
    'giraffe': 'stk_dio_giraffe.png',
    'clown': 'stk_dio_clown.png',
    'leprechaun': 'stk_dio_leprechaun.png',
    'lucky_face': 'stk_dio_lucky_face.png',
    'frosty': 'stk_dio_frosty.png',
    'influencer': 'stk_dio_influencer.png',
    'christmas_bell': 'stk_christmas_bell.png',
    'cute_zombie': 'stk_cute_zombie.png'
};

function getPhotoboothTotalSteps(fid) {
    if (!fid) return 4;
    const lower = String(fid).toLowerCase();
    if (lower.includes("2cut") || lower.includes("2_cut") || lower.includes("2x1") || lower.includes("2_shot")) return 2;
    if (lower.includes("3cut") || lower.includes("3_cut") || lower.includes("3x1") || lower.includes("3_shot")) return 3;
    return 4;
}

function getPhotoboothCardUrl(stepNum, totalSteps, baseUrl) {
    let filename;
    if (totalSteps === 2) {
        filename = stepNum === 2 ? "pb_2cut_step2.jpg" : "pb_2cut_step1.jpg";
    } else if (totalSteps === 3) {
        filename = stepNum === 3 ? "pb_3cut_step3.jpg" : (stepNum === 2 ? "pb_3cut_step2.jpg" : "pb_3cut_step1.jpg");
    } else {
        filename = `pb_step${stepNum}.jpg`;
    }
    return `${baseUrl}/assets/img/${filename}`;
}

function isPhotoboothFilter(fid) {
    if (!fid) return false;
    const lower = String(fid).toLowerCase();
    if (lower.startsWith("pb_single_") || lower.startsWith("khung_") || lower.startsWith("custom_frame") || lower.includes("_640")) return false;
    return /photobooth|pb_|4cut|3cut|2cut|berry_days|happy_snap|sky_diary|photoboot|classic_pb|xmas/i.test(lower);
}

function isOverlayFrameFilter(fid) {
    if (!fid) return false;
    if (isPhotoboothFilter(fid)) return false;
    const lower = String(fid).toLowerCase();
    return /^khung_|^frame_|pb_single_|cmt_locket|custom_frame|sinh_nh_t|sticker_b_nh_lu_n|crimson_mecha|cyber_valkyrie/i.test(lower);
}

async function fetchImageBuffer(url) {
    if (!url) return null;
    if (Buffer.isBuffer(url)) return url;
    if (typeof url === 'string') {
        const trimmed = url.trim();
        if (trimmed.startsWith('data:')) {
            const base64Data = trimmed.split(',')[1] || trimmed;
            return Buffer.from(base64Data, 'base64');
        }
        if (/^[A-Za-z0-9+/=]{100,}$/.test(trimmed)) {
            return Buffer.from(trimmed, 'base64');
        }
    }
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 25000,
        headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)' }
    });
    return Buffer.from(res.data);
}

function resolveFramePath(fid) {
    const clean = String(fid).toLowerCase().replace(/^stk_/, "");
    const filename = FRAME_MAP[clean] || FRAME_MAP[fid] || `${clean}.png`;
    const searchDirs = [
        path.join(ASSETS_DIR, 'frames', filename),
        path.join(ASSETS_DIR, 'img', filename),
        path.join(ASSETS_DIR, filename)
    ];
    for (const p of searchDirs) {
        if (fs.existsSync(p)) return p;
    }
    return null;
}

function resolveStickerPath(fid) {
    if (!fid) return null;
    const clean = String(fid).toLowerCase().trim();
    if (STICKER_MAP[clean]) {
        const p = path.join(ASSETS_DIR, 'stickers', STICKER_MAP[clean]);
        if (fs.existsSync(p)) return p;
    }
    const withoutStk = clean.replace(/^stk_/, '').replace(/^dio_/, '');
    const candidates = [
        `${clean}.png`,
        `stk_${clean}.png`,
        `stk_dio_${withoutStk}.png`,
        `stk_${withoutStk}.png`,
        `${withoutStk}.png`
    ];
    for (const c of candidates) {
        const p = path.join(ASSETS_DIR, 'stickers', c);
        if (fs.existsSync(p)) return p;
    }
    return null;
}

function formatLocketResponse(outputUrl, extra = {}) {
    return {
        result: {
            outputUrl: outputUrl,
            output_url: outputUrl,
            url: outputUrl,
            imageUrl: outputUrl,
            image_url: outputUrl,
            status: 200,
            data: {
                outputUrl: outputUrl,
                output_url: outputUrl,
                url: outputUrl,
                imageUrl: outputUrl,
                image_url: outputUrl,
                ...extra
            },
            ...extra
        }
    };
}

function getBaseUrl(req) {
    if (req.get('x-public-base')) return req.get('x-public-base').replace(/\/+$/, "");
    if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/+$/, "");
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    return `${proto}://${req.get('host')}`;
}

app.get(['/', '/health'], (req, res) => {
    res.json({
        status: "ok",
        name: "Locket Mod & Photobooth Backend",
        author: "TranHai307",
        promptsLoaded: Object.keys(AI_PROMPTS).length,
        framesMapped: Object.keys(FRAME_MAP).length,
        stickersMapped: Object.keys(STICKER_MAP).length,
        uptime: Math.round(process.uptime()) + "s",
        time: new Date().toISOString()
    });
});

// API liệt kê toàn bộ danh sách file trong assets và data để kiểm tra
app.get('/api/catalog', (req, res) => {
    const baseUrl = getBaseUrl(req);
    const listFiles = (subDir) => {
        const dir = path.join(ASSETS_DIR, subDir);
        if (!fs.existsSync(dir)) return [];
        return fs.readdirSync(dir)
            .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
            .map(f => ({ id: f.replace(/\.[^.]+$/, ''), file: f, url: `${baseUrl}/assets/${subDir}/${f}` }));
    };
    res.json({
        frames: listFiles('frames'),
        img: listFiles('img'),
        stickers: listFiles('stickers'),
        aiPromptIds: Object.keys(AI_PROMPTS)
    });
});

// ROUTE XỬ LÝ CHÍNH: /generateFilteredImage
app.all(['/generateFilteredImage', '/api/generateFilteredImage'], async (req, res) => {
    try {
        const body = req.body || {};
        const d = body.data || body;
        const fid = String(
            d.filter_id || d.filterId || d.prompt || d.id || req.query.filterId || req.query.filter_id || ""
        ).toLowerCase().trim();
        const imgUrl = String(
            d.imageUrl || d.image_url || d.url || (d.image && d.image.url) || req.query.imageUrl || req.query.url || ""
        ).trim();

        if (!imgUrl) {
            addLog("WARN", { message: "Missing imageUrl", body });
            return res.status(200).json(formatLocketResponse(""));
        }

        const baseUrl = getBaseUrl(req);
        let rawClientId = "";
        if (d.user_id || d.uid) {
            rawClientId = String(d.user_id || d.uid);
        } else if (d.analytics && d.analytics.installation_id) {
            rawClientId = String(d.analytics.installation_id);
        } else {
            const matchUid = imgUrl.match(/filter_inputs%2F([a-zA-Z0-9_-]+)%2F/i);
            rawClientId = (matchUid && matchUid[1]) ? matchUid[1] : String(req.ip || "user_default");
        }
        const clientId = rawClientId.replace(/[^a-zA-Z0-9_-]/g, "");

        // A. PHOTOBOOTH NHIỀU Ô (2-CUT, 3-CUT, 4-CUT)
        if (isPhotoboothFilter(fid)) {
            const totalSteps = getPhotoboothTotalSteps(fid);
            const sessionKey = `${clientId}_${fid}`;
            let session = pbSessions.get(sessionKey);
            const now = Date.now();

            if (!session || (now - session.lastTime) > 180000 || session.step < 1 || session.step > totalSteps) {
                session = { step: 1, images: [], lastTime: now };
            }

            const currentStep = session.step;
            session.images[currentStep - 1] = imgUrl;
            session.lastTime = now;

            if (currentStep < totalSteps) {
                session.step = currentStep + 1;
                pbSessions.set(sessionKey, session);
                const cardUrl = getPhotoboothCardUrl(currentStep, totalSteps, baseUrl);
                addLog("PB_STEP", { fid, step: currentStep, totalSteps, cardUrl });
                return res.json(formatLocketResponse(cardUrl, { step: currentStep, nextStep: currentStep + 1, totalSteps }));
            }

            session.step = 1;
            pbSessions.set(sessionKey, session);

            const customLayout = CUSTOM_PB_LAYOUTS[fid];
            const canvasWidth = customLayout ? customLayout.width : 1254;
            const canvasHeight = customLayout ? customLayout.height : 1254;

            const framePath = resolveFramePath(fid) || path.join(ASSETS_DIR, 'frames', 'photobooth_4cut.png');
            let frameBuffer = null;
            if (fs.existsSync(framePath)) {
                frameBuffer = await sharp(framePath).resize(canvasWidth, canvasHeight).toBuffer();
            }

            let compositeList = [];

            if (customLayout) {
                const imgUrls = [
                    session.images[0] || imgUrl,
                    session.images[1] || imgUrl,
                    session.images[2] || imgUrl,
                    session.images[3] || imgUrl
                ];
                const bufs = await Promise.all(imgUrls.map(u => fetchImageBuffer(u).catch(() => null)));
                const fallbackBuf = bufs.find(b => b) || null;

                for (let i = 0; i < customLayout.slots.length; i++) {
                    const slot = customLayout.slots[i];
                    const b = bufs[i] || fallbackBuf;
                    if (b) {
                        const crop = await sharp(b).resize(slot.width, slot.height, { fit: 'cover' }).toBuffer();
                        compositeList.push({ input: crop, left: slot.left, top: slot.top });
                    }
                }
            } else if (totalSteps === 2) {
                const [b1, b2] = await Promise.all([
                    fetchImageBuffer(session.images[0] || imgUrl).catch(() => null),
                    fetchImageBuffer(imgUrl).catch(() => null)
                ]);
                const crop1 = await sharp(b1 || b2).resize(1000, 440, { fit: 'cover' }).toBuffer();
                const crop2 = await sharp(b2 || b1).resize(1000, 530, { fit: 'cover' }).toBuffer();
                compositeList = [
                    { input: crop1, left: 125, top: 195 },
                    { input: crop2, left: 125, top: 640 }
                ];
            } else if (totalSteps === 3) {
                const [b1, b2, b3] = await Promise.all([
                    fetchImageBuffer(session.images[0] || imgUrl).catch(() => null),
                    fetchImageBuffer(session.images[1] || imgUrl).catch(() => null),
                    fetchImageBuffer(imgUrl).catch(() => null)
                ]);
                const crop1 = await sharp(b1 || b3).resize(1000, 440, { fit: 'cover' }).toBuffer();
                const crop2 = await sharp(b2 || b3).resize(480, 530, { fit: 'cover' }).toBuffer();
                const crop3 = await sharp(b3 || b1).resize(480, 530, { fit: 'cover' }).toBuffer();
                compositeList = [
                    { input: crop1, left: 125, top: 195 },
                    { input: crop2, left: 125, top: 640 },
                    { input: crop3, left: 648, top: 640 }
                ];
            } else {
                const [b1, b2, b3, b4] = await Promise.all([
                    fetchImageBuffer(session.images[0] || imgUrl).catch(() => null),
                    fetchImageBuffer(session.images[1] || imgUrl).catch(() => null),
                    fetchImageBuffer(session.images[2] || imgUrl).catch(() => null),
                    fetchImageBuffer(imgUrl).catch(() => null)
                ]);
                const fb = b1 || b4;
                if (fid.includes("xmas") || fid.includes("tet")) {
                    const [c1, c2, c3, c4] = await Promise.all([
                        sharp(b1 || fb).resize(480, 450, { fit: 'cover' }).toBuffer(),
                        sharp(b2 || fb).resize(480, 450, { fit: 'cover' }).toBuffer(),
                        sharp(b3 || fb).resize(480, 540, { fit: 'cover' }).toBuffer(),
                        sharp(b4 || fb).resize(480, 540, { fit: 'cover' }).toBuffer()
                    ]);
                    compositeList = [
                        { input: c1, left: 125, top: 180 },
                        { input: c2, left: 648, top: 180 },
                        { input: c3, left: 125, top: 630 },
                        { input: c4, left: 648, top: 630 }
                    ];
                } else {
                    const [c1, c2, c3, c4] = await Promise.all([
                        sharp(b1 || fb).resize(542, 542, { fit: 'cover' }).toBuffer(),
                        sharp(b2 || fb).resize(542, 542, { fit: 'cover' }).toBuffer(),
                        sharp(b3 || fb).resize(542, 542, { fit: 'cover' }).toBuffer(),
                        sharp(b4 || fb).resize(542, 542, { fit: 'cover' }).toBuffer()
                    ]);
                    compositeList = [
                        { input: c1, left: 65, top: 65 },
                        { input: c2, left: 647, top: 65 },
                        { input: c3, left: 65, top: 647 },
                        { input: c4, left: 647, top: 647 }
                    ];
                }
            }

            if (frameBuffer) compositeList.push({ input: frameBuffer, left: 0, top: 0 });

            const fileName = `pb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
            const outPath = path.join(IMAGES_DIR, fileName);

            await sharp({
                create: {
                    width: canvasWidth,
                    height: canvasHeight,
                    channels: 4,
                    background: { r: 255, g: 255, b: 255, alpha: 1 }
                }
            })
            .composite(compositeList)
            .jpeg({ quality: 92 })
            .toFile(outPath);

            const finalUrl = `${baseUrl}/images/${fileName}`;
            addLog("RESPONSE", { fid, type: "photobooth", outputUrl: finalUrl });
            return res.json(formatLocketResponse(finalUrl, { type: `photobooth_${totalSteps}cut`, completed: true }));
        }

        // B. KHUNG ĐƠN (SINGLE FRAME OVERLAY)
        if (isOverlayFrameFilter(fid)) {
            const framePath = resolveFramePath(fid);
            if (framePath && fs.existsSync(framePath)) {
                const userBuf = await fetchImageBuffer(imgUrl);
                const userCrop = await sharp(userBuf).resize(1080, 1080, { fit: 'cover' }).toBuffer();
                const frameBuf = await sharp(framePath).resize(1080, 1080).toBuffer();

                const fileName = `frame_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
                const outPath = path.join(IMAGES_DIR, fileName);

                await sharp(userCrop)
                    .composite([{ input: frameBuf, left: 0, top: 0 }])
                    .jpeg({ quality: 92 })
                    .toFile(outPath);

                const finalUrl = `${baseUrl}/images/${fileName}`;
                addLog("RESPONSE", { fid, type: "frame_overlay", outputUrl: finalUrl });
                return res.json(formatLocketResponse(finalUrl, { type: "frame_overlay" }));
            }
        }

        // C. HIỆU ỨNG AI (KIRA AI) + DỰ PHÒNG GHÉP STICKER 3D TRONG assets/stickers/
        const rawFid = String(d.filter_id || d.filterId || d.prompt || d.id || req.query.filterId || "").trim();
        const cleanFid = rawFid.toLowerCase();
        const mappedFid = cleanFid.replace(/^stk_/, "");
        const promptText = AI_PROMPTS[rawFid] || AI_PROMPTS[cleanFid] || AI_PROMPTS[mappedFid] || "";

        if (promptText) {
            try {
                const fullPrompt = promptText.length > 3500 ? promptText.substring(0, 3500) : promptText;
                let aiBuf = null;
                const KIRA_KEY = (process.env.KIRA_API_KEY || "kira_ecd52009b0fb1973434aa883da5804cc").trim();

                if (KIRA_KEY) {
                    const userBuf = await fetchImageBuffer(imgUrl);
                    if (userBuf && userBuf.length > 0) {
                        const normJpeg = await sharp(userBuf)
                            .resize(1024, 1024, { fit: 'cover' })
                            .jpeg({ quality: 90 })
                            .toBuffer();

                        let facePrompt = fullPrompt;
                        if (!facePrompt.includes("Keep the background, pose, framing") && !facePrompt.includes("Do not change the overall composition")) {
                            facePrompt = `Show the persons in the photo with the exact same pose and background, but with ${fullPrompt}, captured with a modern iPhone camera look. Do not alter the overall head size, face shape, facial features, eyes, smile, expression, or identity.`;
                        }

                        const kRes = await axios.post('https://kiraai.vn/api/v1/images/generations', {
                            model: "agnes-image-2.1-flash",
                            prompt: facePrompt,
                            aspect_ratio: "1:1",
                            reference_images: [{ mime_type: "image/jpeg", data: normJpeg.toString('base64') }]
                        }, {
                            headers: { "Authorization": `Bearer ${KIRA_KEY}`, "Content-Type": "application/json" },
                            timeout: 35000
                        });

                        const item = kRes.data?.data?.[0];
                        if (item?.b64_json) aiBuf = Buffer.from(item.b64_json, 'base64');
                        else if (item?.url) aiBuf = await fetchImageBuffer(item.url);
                    }
                }

                if (aiBuf && aiBuf.length > 1000) {
                    const fileName = `ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
                    const outPath = path.join(IMAGES_DIR, fileName);
                    await sharp(aiBuf).resize(1024, 1024, { fit: 'cover' }).jpeg({ quality: 92 }).toFile(outPath);
                    const finalUrl = `${baseUrl}/images/${fileName}`;
                    addLog("RESPONSE", { fid, type: "ai_kira", outputUrl: finalUrl });
                    return res.json(formatLocketResponse(finalUrl, { type: "ai_generated" }));
                }
            } catch (aiErr) {
                addLog("AI_FALLBACK", { fid, error: aiErr.response?.data || aiErr.message });
            }
        }

        // D. DỰ PHÒNG: GHÉP STICKER 3D LÊN ẢNH GỐC NẾU AI LỖI HOẶC CHỌN STICKER
        const stkPath = resolveStickerPath(rawFid) || resolveStickerPath(cleanFid) || resolveStickerPath(mappedFid);
        if (stkPath && fs.existsSync(stkPath)) {
            const userBuf = await fetchImageBuffer(imgUrl);
            const userCrop = await sharp(userBuf).resize(1080, 1080, { fit: 'cover' }).toBuffer();

            let stkSize = 360;
            let leftPos = 680;
            let topPos = 680;

            if (/hat|crown|wig|mohawk|buns/i.test(cleanFid)) {
                stkSize = 420;
                leftPos = Math.round((1080 - stkSize) / 2);
                topPos = 40;
            } else if (/disco|cash|slimed|princess|happy_birthday|flower_crown|love_bug/i.test(cleanFid)) {
                stkSize = 520;
                leftPos = Math.round((1080 - stkSize) / 2);
                topPos = Math.round((1080 - stkSize) / 2);
            }

            const stkBuf = await sharp(stkPath).resize(stkSize, stkSize, { fit: 'inside' }).toBuffer();
            const fileName = `stk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
            const outPath = path.join(IMAGES_DIR, fileName);

            await sharp(userCrop)
                .composite([{ input: stkBuf, left: leftPos, top: topPos }])
                .jpeg({ quality: 93 })
                .toFile(outPath);

            const finalUrl = `${baseUrl}/images/${fileName}`;
            addLog("RESPONSE", { fid, type: "sticker_overlay", outputUrl: finalUrl });
            return res.json(formatLocketResponse(finalUrl, { type: "sticker_overlay" }));
        }

        addLog("RESPONSE", { fid, type: "fallback_original", outputUrl: imgUrl });
        return res.json(formatLocketResponse(imgUrl));
    } catch (err) {
        addLog("ERROR", { message: err.message });
        const fallbackUrl = req.body?.data?.imageUrl || req.body?.imageUrl || "";
        return res.status(200).json(formatLocketResponse(fallbackUrl));
    }
});

setInterval(() => {
    try {
        const now = Date.now();
        for (const file of fs.readdirSync(IMAGES_DIR)) {
            const filePath = path.join(IMAGES_DIR, file);
            if (now - fs.statSync(filePath).mtimeMs > 30 * 60 * 1000) fs.unlinkSync(filePath);
        }
    } catch (e) {}
}, 60 * 60 * 1000);

app.listen(PORT, () => {
    console.log(`Locket Backend Mod Server is running on port ${PORT}`);
});
