/**
 * Locket Mod & Photobooth 4-Shot Backend Server
 * Chuyên xử lý đồ họa, ghép khung, ghép 4 ô Photobooth & lưu trữ ảnh cho Locket iOS
 * Triển khai miễn phí trên Render.com
 */

const express = require('express');
const cors = require('cors');
const sharp = require('sharp');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Đảm bảo thư mục lưu ảnh tồn tại
const PUBLIC_DIR = path.join(__dirname, 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const ASSETS_DIR = path.join(__dirname, 'assets');

if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

// Tải 60 prompt AI chi tiết từ data/ai_prompts.json
let AI_PROMPTS = {};
try {
    const promptsFile = path.join(__dirname, 'data', 'ai_prompts.json');
    if (fs.existsSync(promptsFile)) {
        AI_PROMPTS = JSON.parse(fs.readFileSync(promptsFile, 'utf8'));
    }
} catch (e) {
    console.error("Could not load ai_prompts.json:", e);
}

require('./akirrai_sepay_bridge').installWebhook(app, express);
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Bộ nhớ ghi log 50 request gần nhất để chẩn đoán
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
            path: req.path,
            ip: req.ip,
            hasBody: Boolean(req.body && Object.keys(req.body).length)
        });
    }
    next();
});

app.get('/api/logs', (req, res) => {
    const expected = Buffer.from(String(process.env.AKIRRAI_LOG_SECRET || ''));
    const actual = Buffer.from(String(req.headers['x-akirrai-log-secret'] || ''));
    if (expected.length < 32 || expected.length !== actual.length ||
        !require('node:crypto').timingSafeEqual(expected,actual)) {
      return res.status(404).json({error:'Not found'});
    }
    res.setHeader('Cache-Control','no-store');
    return res.json({count:requestLogs.length,logs:requestLogs});
});

// Phục vụ ảnh tĩnh công khai
app.use('/images', express.static(IMAGES_DIR, { maxAge: '1d' }));


// __AI_TELEMETRY_STATS__
const AI_STATS = {
  total_requests: 0,
  kira_success: 0,
  kira_failed: 0,
  gemini_called: 0,
  gemini_success: 0,
  gemini_failed: 0,
  sticker_fallback: 0,
  original_fallback: 0,
  total_duration_ms: 0,
  avg_duration_ms: 0
};
const ACTIVE_RENDER_JOBS = new Map();

function logStep(reqId, stage, detail = "") {
  const cleanDetail = String(detail || "")
    .replace(/kira_[a-zA-Z0-9_-]+/g, "kira_***")
    .replace(/AIza[a-zA-Z0-9_-]+/g, "AIza***")
    .replace(/AQ.[a-zA-Z0-9_-]+/g, "AQ.***")
    .slice(0, 500);
  console.log(`[${new Date().toISOString()}] [${reqId}] ${stage}${cleanDetail ? " | " + cleanDetail : ""}`);
}

async function extractKiraImageBuffer(payload, axiosInstance, fetchImageBufferFn, kiraKey, reqId) {
  if (!payload) return null;
  const item = (Array.isArray(payload.data) && payload.data[0])
    || (Array.isArray(payload.output) && payload.output[0])
    || (Array.isArray(payload.images) && payload.images[0])
    || payload.data
    || payload;

  if (typeof item === "string") {
    if (item.startsWith("data:image")) {
      const b64 = item.split(",")[1];
      return b64 ? Buffer.from(b64, "base64") : null;
    }
    if (item.startsWith("http")) {
      return await fetchImageBufferFn(item);
    }
    if (item.length > 256) {
      return Buffer.from(item, "base64");
    }
  }

  const b64Data = item?.b64_json || item?.base64 || item?.image_base64 || payload?.b64_json || payload?.base64;
  if (b64Data && typeof b64Data === "string") {
    const cleanB64 = b64Data.includes(",") ? b64Data.split(",")[1] : b64Data;
    return Buffer.from(cleanB64, "base64");
  }

  const imgUrl = item?.url || item?.image_url || item?.output_url || payload?.url || payload?.image_url;
  if (imgUrl && typeof imgUrl === "string") {
    return await fetchImageBufferFn(imgUrl);
  }

  // Xu ly truong hop Kira tra ve job_id / task_id bat dong bo
  const jobId = payload?.job_id || payload?.task_id || payload?.id;
  if (jobId && (payload?.status === "processing" || payload?.status === "pending" || payload?.status === "queued")) {
    logStep(reqId, "KIRA_ASYNC_POLL", "JobID=" + jobId);
    for (let p = 0; p < 8; p++) {
      await new Promise(r => setTimeout(r, 2000));
      try {
        const pollRes = await axiosInstance.get("https://kiraai.vn/api/v1/images/generations/" + jobId, {
          headers: { "Authorization": "Bearer " + kiraKey },
          timeout: 10000
        });
        if (pollRes.data?.status === "succeeded" || pollRes.data?.status === "completed" || pollRes.data?.data) {
          return await extractKiraImageBuffer(pollRes.data, axiosInstance, fetchImageBufferFn, kiraKey, reqId);
        }
        if (pollRes.data?.status === "failed") break;
      } catch (_) {}
    }
  }
  return null;
}


app.get('/api/ai-stats', (req, res) => {
  res.json({ status: "ok", stats: AI_STATS });
});

const kiraPlatform = require("./kira_platform_upgrade");
require('./akirrai_sepay_bridge').installRoutes(app);
kiraPlatform.registerRoutes(app);
// __TRANHAI_STATIC_JS__
app.use('/js', express.static(path.join(__dirname, 'js'), {
  setHeaders: (res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
  }
}));
app.use('/modules', express.static(path.join(__dirname, 'modules')));
app.get('/Locket_Only_Cold.sgmodule', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'Locket_Only_Cold.sgmodule'));
});

const CMS_STAGE6 = require('./akirrai_cms_stage6_runtime').install(app, __dirname);
require('./akirrai_management').install(app,CMS_STAGE6,__dirname);
app.use('/assets', express.static(ASSETS_DIR, { maxAge: '1d' }));
app.use(express.static(PUBLIC_DIR));

// Bộ nhớ đệm phiên chụp Photobooth 4 ô (In-Memory Session Store)
const pbSessions = new Map();

// Bảng ánh xạ Frame File trong assets/frames/
const FRAME_MAP = {
    // Photobooth 4-cut
    "pb_strawberry": "pb_strawberry.png",
    "frame_berry_days": "pb_strawberry.png",
    "photobooth_berry_days": "pb_strawberry.png",
    "pb_vintage": "pb_vintage.png",
    "frame_happy_snap": "pb_vintage.png",
    "photobooth_happy_snap": "pb_vintage.png",
    "pb_galaxy": "pb_galaxy.png",
    "frame_sky_diary": "pb_galaxy.png",
    "photobooth_sky_diary": "pb_galaxy.png",
    "pb_holo_4cut": "pb_holo_4cut.png",
    "pb_scrapbook_ripped_4cut": "pb_scrapbook_ripped_4cut.png",
    "pb_ripped_paper_4cut": "pb_ripped_paper_4cut.png",
    "pb_denim_ripped_2x2": "pb_denim_ripped_2x2.png",
    "frame_classic_pb": "photoboot.png",
    "photoboot": "photoboot.png",
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

    // Khung đơn (Single Frames)
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
    "sticker_b_nh_lu_n_minh_tu": "sticker_b_nh_lu_n_minh_tu.png"
};

// Bảng layout tùy biến cho các khung Photobooth đặc thù (vị trí & kích thước từng ô)
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
    },
    "pb_long_phung_1": {
        width: 1080, height: 1080,
        slots: [
            { left: 0,   top: 0,   width: 545, height: 545 },
            { left: 535, top: 0,   width: 545, height: 545 },
            { left: 0,   top: 535, width: 545, height: 545 },
            { left: 535, top: 535, width: 545, height: 545 }
        ]
    },
    "pb_long_phung_2": {
        width: 1080, height: 1080,
        slots: [
            { left: 0,   top: 0,   width: 545, height: 545 },
            { left: 535, top: 0,   width: 545, height: 545 },
            { left: 0,   top: 535, width: 545, height: 545 },
            { left: 535, top: 535, width: 545, height: 545 }
        ]
    },
    "pb_long_phung_3": {
        width: 1080, height: 1080,
        slots: [
            { left: 0,   top: 0,   width: 545, height: 545 },
            { left: 535, top: 0,   width: 545, height: 545 },
            { left: 0,   top: 535, width: 545, height: 545 },
            { left: 535, top: 535, width: 545, height: 545 }
        ]
    },
    "pb_long_phung_5": {
        width: 1080, height: 1080,
        slots: [
            { left: 0,   top: 0,   width: 545, height: 545 },
            { left: 535, top: 0,   width: 545, height: 545 },
            { left: 0,   top: 535, width: 545, height: 545 },
            { left: 535, top: 535, width: 545, height: 545 }
        ]
    },
    "pb_long_phung_6": {
        width: 1080, height: 1080,
        slots: [
            { left: 0,   top: 0,   width: 545, height: 545 },
            { left: 535, top: 0,   width: 545, height: 545 },
            { left: 0,   top: 535, width: 545, height: 545 },
            { left: 535, top: 535, width: 545, height: 545 }
        ]
    },
    "pb_long_phung_7": {
        width: 1080, height: 1080,
        slots: [
            { left: 0,   top: 0,   width: 545, height: 545 },
            { left: 535, top: 0,   width: 545, height: 545 },
            { left: 0,   top: 535, width: 545, height: 545 },
            { left: 535, top: 535, width: 545, height: 545 }
        ]
    },
    "pb_long_phung_9": {
        width: 1080, height: 1080,
        slots: [
            { left: 0,   top: 0,   width: 545, height: 545 },
            { left: 535, top: 0,   width: 545, height: 545 },
            { left: 0,   top: 535, width: 545, height: 545 },
            { left: 535, top: 535, width: 545, height: 545 }
        ]
    }
};

// Tính số bước chụp của bộ lọc Photobooth (2 ô, 3 ô hoặc 4 ô)
function getPhotoboothTotalSteps(fid) {
    const cmsLayout = CMS_STAGE6.layout(fid);
    if (cmsLayout) return cmsLayout.slots.length;
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

// Kiểm tra bộ lọc Photobooth nhiều ô (2 cut, 3 cut, 4 cut)
function isPhotoboothFilter(fid) {
    if (CMS_STAGE6.has(fid, 'ptb')) return true;
    if (CMS_STAGE6.has(fid, 'frame') || CMS_STAGE6.has(fid, 'sticker')) return false;
    if (!fid) return false;
    const lower = String(fid).toLowerCase();
    if (lower.startsWith("pb_single_") || lower.startsWith("khung_")) return false;
    return /photobooth|pb_|frame_|4cut|3cut|2cut|cute|berry_days|happy_snap|sky_diary|photoboot|classic_pb|xmas/i.test(lower);
}

// Kiểm tra khung đơn 1 lượt chụp
function isOverlayFrameFilter(fid) {
    if (CMS_STAGE6.has(fid, 'frame') || CMS_STAGE6.has(fid, 'sticker')) return true;
    if (!fid) return false;
    if (isPhotoboothFilter(fid)) return false;
    const lower = String(fid).toLowerCase();
    return /^khung_|^frame_|pb_single_|cmt_locket|custom_frame|sinh_nh_t|sticker_b_nh_lu_n/i.test(lower);
}

// Tải ảnh từ URL về Buffer (hỗ trợ HTTP URL, Data URL Base64, và Base64 thuần)
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

// Tìm đường dẫn file khung PNG
function resolveFramePath(fid) {
    const cmsPath = CMS_STAGE6.asset(fid);
    if (cmsPath) return cmsPath;
    const clean = String(fid).toLowerCase().replace(/^stk_/, "");
    const filename = FRAME_MAP[clean] || FRAME_MAP[fid] || `${clean}.png`;
    const framePath = path.join(ASSETS_DIR, 'frames', filename);
    if (fs.existsSync(framePath)) return framePath;

    // Tìm trong assets/img
    const imgPath = path.join(ASSETS_DIR, 'img', filename);
    if (fs.existsSync(imgPath)) return imgPath;

    return null;
}

// Bảng ánh xạ Sticker File trong assets/stickers/
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
    'influencer': 'stk_dio_influencer.png'
};

// Tìm đường dẫn sticker PNG
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

// Helper chuẩn hóa phản hồi chuẩn Firebase Callable Functions cho Locket App
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

// Lấy Base URL của server (Ưu tiên qua Cloudflare Worker để bảo mật tuyệt đối 100% gốc Render)
function getBaseUrl(req) {
    if (req.get('x-public-base')) return req.get('x-public-base').replace(/\/+$/, "");
    return 'https://tranhai-lk.onrender.com';
}

// =========================================================================
// ROUTE KIỂM TRA TRẠNG THÁI (HEALTH CHECK)
// =========================================================================
app.get(['/', '/health'], (req, res) => {
    res.json({
        status: "ok",
        name: "Locket Mod & Photobooth Backend",
        author: "TranHai307",
        uptime: Math.round(process.uptime()) + "s",
        time: new Date().toISOString()
    });
});

// =========================================================================
// 1. ROUTE CHÍNH: /generateFilteredImage (TIẾP NHẬN & MOD ẢNH CHO LOCKET)
// =========================================================================
app.all(['/generateFilteredImage', '/api/generateFilteredImage'], async (req, res) => {
    try {
        const body = req.body || {};
        const d = body.data || body;
        const fid = String(
            d.filter_id || d.filterId || d.prompt || d.id || req.query.filterId || req.query.filter_id || ""
        ).toLowerCase();
        const imgUrl = String(
            d.imageUrl || d.image_url || d.url || (d.image && d.image.url) || req.query.imageUrl || req.query.url || ""
        );

        if (!imgUrl) {
            addLog("WARN", {message:"Missing imageUrl, returning empty result"});
            return res.status(200).json(formatLocketResponse(""));
        }

        const baseUrl = getBaseUrl(req);

        // Định danh thiết bị độc lập để phân tách phiên chụp Photobooth chuẩn xác 100%
        let rawClientId = "";
        if (d.user_id || d.uid) {
            rawClientId = String(d.user_id || d.uid);
        } else if (d.analytics && d.analytics.installation_id) {
            rawClientId = String(d.analytics.installation_id);
        } else if (d.analytics && d.analytics.amplitude && d.analytics.amplitude.device_id) {
            rawClientId = String(d.analytics.amplitude.device_id);
        } else {
            const matchUid = imgUrl.match(/filter_inputs%2F([a-zA-Z0-9_-]+)%2F/i);
            if (matchUid && matchUid[1]) {
                rawClientId = matchUid[1];
            } else {
                rawClientId = String(req.ip || "user_default");
            }
        }
        const clientId = rawClientId.replace(/[^a-zA-Z0-9_-]/g, "");

        // -------------------------------------------------------------
        // TRƯỜNG HỢP A: PHOTOBOOTH NHIỀU Ô (2 CUT, 3 CUT, HOẶC 4 CUT)
        // -------------------------------------------------------------
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
                // Chưa đủ số ảnh: Chuẩn bị bước kế tiếp và trả về thẻ thông báo
                session.step = currentStep + 1;
                pbSessions.set(sessionKey, session);

                const cardUrl = getPhotoboothCardUrl(currentStep, totalSteps, baseUrl);
                addLog("RESPONSE", { filter_id: fid, step: currentStep, nextStep: currentStep + 1, totalSteps, outputUrl: cardUrl });
                return res.json(formatLocketResponse(cardUrl, { step: currentStep, nextStep: currentStep + 1, totalSteps }));
            }

            // ĐỦ ẢNH (BƯỚC HOÀN TẤT): TIẾN HÀNH GHÉP ẢNH PHOTOBOOTH BẰNG SHARP NATIVE
            session.step = 1; // Reset cho lượt chơi kế tiếp
            pbSessions.set(sessionKey, session);

            // Tìm file khung Photobooth PNG
            const customLayout = CUSTOM_PB_LAYOUTS[fid] || CMS_STAGE6.layout(fid);
            const canvasWidth = customLayout ? customLayout.width : 1254;
            const canvasHeight = customLayout ? customLayout.height : 1254;

            const framePath = resolveFramePath(fid) || path.join(ASSETS_DIR, 'frames', 'photobooth_4cut.png');
            let frameBuffer = null;
            if (fs.existsSync(framePath)) {
                frameBuffer = await sharp(framePath).resize(canvasWidth, canvasHeight).toBuffer();
            }

            let compositeList = [];

            // A0. BỐ CỤC TÙY BIẾN THEO TỪNG KHUNG PHOTOBOOTH (CUSTOM LAYOUT)
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
            }
            // A1. BỐ CỤC 2-CUT (pb_xmas_2cut)
            else if (totalSteps === 2) {
                const img1Url = session.images[0] || imgUrl;
                const img2Url = imgUrl;
                const [b1, b2] = await Promise.all([
                    fetchImageBuffer(img1Url).catch(() => null),
                    fetchImageBuffer(img2Url).catch(() => null)
                ]);
                const crop1 = await sharp(b1 || b2).resize(1000, 440, { fit: 'cover' }).toBuffer();
                const crop2 = await sharp(b2 || b1).resize(1000, 530, { fit: 'cover' }).toBuffer();
                compositeList = [
                    { input: crop1, left: 125, top: 195 },
                    { input: crop2, left: 125, top: 640 }
                ];
            }
            // A2. BỐ CỤC 3-CUT (pb_xmas_3cut)
            else if (totalSteps === 3) {
                const img1Url = session.images[0] || imgUrl;
                const img2Url = session.images[1] || imgUrl;
                const img3Url = imgUrl;
                const [b1, b2, b3] = await Promise.all([
                    fetchImageBuffer(img1Url).catch(() => null),
                    fetchImageBuffer(img2Url).catch(() => null),
                    fetchImageBuffer(img3Url).catch(() => null)
                ]);
                const crop1 = await sharp(b1 || b3).resize(1000, 440, { fit: 'cover' }).toBuffer();
                const crop2 = await sharp(b2 || b3).resize(480, 530, { fit: 'cover' }).toBuffer();
                const crop3 = await sharp(b3 || b1).resize(480, 530, { fit: 'cover' }).toBuffer();
                compositeList = [
                    { input: crop1, left: 125, top: 195 },
                    { input: crop2, left: 125, top: 640 },
                    { input: crop3, left: 648, top: 640 }
                ];
            }
            // A3. BỐ CỤC 4-CUT (pb_xmas_4cut, pb_tet_4cut, photobooth_4cut, v.v.)
            else {
                const img1Url = session.images[0] || imgUrl;
                const img2Url = session.images[1] || imgUrl;
                const img3Url = session.images[2] || imgUrl;
                const img4Url = imgUrl;

                const [b1, b2, b3, b4] = await Promise.all([
                    fetchImageBuffer(img1Url).catch(() => null),
                    fetchImageBuffer(img2Url).catch(() => null),
                    fetchImageBuffer(img3Url).catch(() => null),
                    fetchImageBuffer(img4Url).catch(() => null)
                ]);

                const fallbackBuf = b1 || b4;
                const buf1 = b1 || fallbackBuf;
                const buf2 = b2 || fallbackBuf;
                const buf3 = b3 || fallbackBuf;
                const buf4 = b4 || fallbackBuf;

                if (fid.includes("xmas") || fid.includes("tet")) {
                    const [c1, c2, c3, c4] = await Promise.all([
                        sharp(buf1).resize(480, 450, { fit: 'cover' }).toBuffer(),
                        sharp(buf2).resize(480, 450, { fit: 'cover' }).toBuffer(),
                        sharp(buf3).resize(480, 540, { fit: 'cover' }).toBuffer(),
                        sharp(buf4).resize(480, 540, { fit: 'cover' }).toBuffer()
                    ]);
                    compositeList = [
                        { input: c1, left: 125, top: 180 },
                        { input: c2, left: 648, top: 180 },
                        { input: c3, left: 125, top: 630 },
                        { input: c4, left: 648, top: 630 }
                    ];
                } else {
                    const [crop1, crop2, crop3, crop4] = await Promise.all([
                        sharp(buf1).resize(542, 542, { fit: 'cover' }).toBuffer(),
                        sharp(buf2).resize(542, 542, { fit: 'cover' }).toBuffer(),
                        sharp(buf3).resize(542, 542, { fit: 'cover' }).toBuffer(),
                        sharp(buf4).resize(542, 542, { fit: 'cover' }).toBuffer()
                    ]);
                    compositeList = [
                        { input: crop1, left: 65, top: 65 },
                        { input: crop2, left: 647, top: 65 },
                        { input: crop3, left: 65, top: 647 },
                        { input: crop4, left: 647, top: 647 }
                    ];
                }
            }

            if (frameBuffer) {
                compositeList.push({ input: frameBuffer, left: 0, top: 0 });
            }

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
            addLog("RESPONSE", { filter_id: fid, step: totalSteps, outputUrl: finalUrl, type: `photobooth_${totalSteps}cut` });
            return res.json(formatLocketResponse(finalUrl, { type: `photobooth_${totalSteps}cut`, completed: true }));
        }

        // -------------------------------------------------------------
        // TRƯỜNG HỢP B: KHUNG ĐƠN (LỒNG KHUNG PNG LÊN ẢNH GỐC - 1 LƯỢT CHỤP)
        // -------------------------------------------------------------
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
                addLog("RESPONSE", { filter_id: fid, outputUrl: finalUrl, type: "frame_overlay" });
                return res.json(formatLocketResponse(finalUrl, { type: "frame_overlay" }));
            }

            // Nếu không tìm thấy file khung -> trả về ảnh gốc
            addLog("RESPONSE", { filter_id: fid, outputUrl: imgUrl, type: "frame_fallback_original" });
            return res.json(formatLocketResponse(imgUrl));
        }

        // -------------------------------------------------------------
        // TRƯỜNG HỢP C: FILTER & STICKER AI (TẠO ẢNH THEO PROMPT TÙY CHỈNH)
        // -------------------------------------------------------------
        const rawFid = String(d.filter_id || d.filterId || d.prompt || d.id || req.query.filterId || "").trim();
        const cleanFid = rawFid.toLowerCase();
        const mappedFid = cleanFid.replace(/^stk_/, "");
        const promptText = CMS_STAGE6.prompt(rawFid) || AI_PROMPTS[rawFid] || AI_PROMPTS[cleanFid] || AI_PROMPTS[mappedFid] || d.prompt || "";

        // 1. ƯU TIÊN SỐ 1: TẠO ẢNH AI TỪ PROMPT TRONG data/ai_prompts.json (SỬ DỤNG KIRA AI AGNES 2.1 FLASH - GIỮ KHUÔN MẶT)
        if (promptText) {
            let reservedAi = null;
            let deliveredAi = false;
            try {
                // Hỗ trợ prompt chi tiết đầy đủ (lên đến 3500 ký tự cho các prompt camera-lock)
                const fullPrompt = promptText.length > 3500 ? promptText.substring(0, 3500) : promptText;
                let aiBuf = null;

                // === HỆ THỐNG TẠO ẢNH CHÍNH KIRA AI & DỰ PHÒNG GEMINI (CHUẨN HÓA) ===
            const reqId = "REQ_" + Date.now().toString(36).toUpperCase() + "_" + Math.random().toString(36).substring(2, 6).toUpperCase();
            const reqStartMs = Date.now();
            AI_STATS.total_requests++;

            const faceLockInstruction = " [STRICT FACE IDENTITY LOCK: Preserve the exact facial identity, eyes, nose, mouth, smile, expression, head pose, and number of people from the reference image without alteration.]";
            const lockedPrompt = fullPrompt.includes("STRICT FACE IDENTITY") ? fullPrompt : (fullPrompt + faceLockInstruction);

            const secure = require('./akirrai_sepay_bridge');
            const currentUser = await secure.member(req);
            const requestKey = String(req.headers['idempotency-key'] || '');
            if (!/^[A-Za-z0-9_.:-]{8,128}$/.test(requestKey))
              return res.status(400).json({error:'Idempotency-Key required (8-128 characters)'});
            if (!/^[A-Za-z0-9_.:-]{2,100}$/.test(cleanFid))
              return res.status(400).json({error:'Select a configured AI effect'});
            const job = await secure.db('POST','rpc/akirrai_reserve_ai_job',{
              p_user_id:currentUser.internal_user_id,p_request_key:requestKey,p_filter_id:cleanFid
            });
            if (job.replayed) return res.status(409).json({error:'Request already submitted',job});
            reservedAi = {userId:currentUser.internal_user_id,jobId:job.jobId};
            const KIRA_KEY = (process.env.KIRA_API_KEY || '').trim();
            const GEMINI_KEY = (process.env.GEMINI_API_KEY || '').trim();

            // Chuan bị anh tham chieu (Reference Image) giu nguyen ty le khuon mat
            let refImages = [];
            let userNormalizedBuf = null;
            if (imgUrl) {
              try {
                const userBuf = await fetchImageBuffer(imgUrl);
                if (userBuf && userBuf.length > 0) {
                  userNormalizedBuf = await sharp(userBuf)
                    .rotate()
                    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
                    .jpeg({ quality: 90 })
                    .toBuffer();
                  refImages.push("data:image/jpeg;base64," + userNormalizedBuf.toString("base64"));
                }
              } catch (imgErr) {
                logStep(reqId, "INPUT_IMAGE_ERROR", imgErr.message);
              }
            }

            // BƯỚC 1: ƯU TIÊN GỌI KIRA AI (MODEL: agnes-image-2.1-flash)
            if (!KIRA_KEY) {
              logStep(reqId, "KIRA_FAILED", "CONFIG_ERROR: Missing process.env.KIRA_API_KEY on Render");
              AI_STATS.kira_failed++;
            } else {
              logStep(reqId, "KIRA_START", "model=agnes-image-2.1-flash | refImages=" + refImages.length);
              const maxKiraAttempts = 2;
              for (let attempt = 1; attempt <= maxKiraAttempts; attempt++) {
                try {
                  const kiraPayload = {
                    model: "agnes-image-2.1-flash",
                    prompt: lockedPrompt,
                    aspect_ratio: "1:1"
                  };
                  if (refImages.length > 0) {
                    kiraPayload.reference_images = refImages;
                  }

                  const kRes = await axios.post("https://kiraai.vn/api/v1/images/generations", kiraPayload, {
                    headers: {
                      "Authorization": `Bearer ${KIRA_KEY}`,
                      "Content-Type": "application/json"
                    },
                    timeout: 45000
                  });

                  const candidateBuf = await extractKiraImageBuffer(kRes.data, axios, fetchImageBuffer, KIRA_KEY, reqId);
                  if (candidateBuf && candidateBuf.length > 1000) {
                    aiBuf = candidateBuf;
                    AI_STATS.kira_success++;
                    logStep(reqId, "KIRA_SUCCESS", `attempt=${attempt} | bytes=${aiBuf.length} | ms=${Date.now() - reqStartMs}`);
                    break;
                  } else {
                    logStep(reqId, "KIRA_INVALID_RESPONSE", JSON.stringify(kRes.data || {}).slice(0, 300));
                  }
                } catch (kErr) {
                  const status = kErr.response?.status || "NETWORK_TIMEOUT";
                  const errBody = JSON.stringify(kErr.response?.data || kErr.message || "");
                  logStep(reqId, `KIRA_HTTP_${status}`, `attempt=${attempt} | ${errBody}`);

                  // Phan loai loi: Neu la AgnesAI_error (Upstream pool node het quota 5h), 429, hoac 5xx -> cho phep retry sang node khac
                  const isTransientPoolError = errBody.includes("AgnesAI_error") || status === 429 || (typeof status === "number" && status >= 500) || status === "NETWORK_TIMEOUT";
                  if (attempt < maxKiraAttempts && isTransientPoolError) {
                    await new Promise(r => setTimeout(r, 1500));
                    continue;
                  }
                  AI_STATS.kira_failed++;
                  logStep(reqId, "KIRA_FAILED", `status=${status}`);
                  break;
                }
              }
            }

            // BƯỚC 2: DỰ PHÒNG SANG GEMINI API KHI KIRA AI THỰC SỰ THẤT BẠI
            if (!aiBuf) {
              if (!GEMINI_KEY) {
                logStep(reqId, "GEMINI_FAILED", "CONFIG_ERROR: Missing process.env.GEMINI_API_KEY on Render");
              } else {
                AI_STATS.gemini_called++;
                logStep(reqId, "GEMINI_FALLBACK_START", "model=gemini-2.5-flash-image");
                try {
                  const geminiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=" + encodeURIComponent(GEMINI_KEY);
                  const parts = [{ text: lockedPrompt }];
                  if (userNormalizedBuf && userNormalizedBuf.length > 0) {
                    parts.push({ inlineData: { mimeType: "image/jpeg", data: userNormalizedBuf.toString("base64") } });
                  }

                  const gemRes = await fetch(geminiEndpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_KEY },
                    body: JSON.stringify({
                      contents: [{ parts }],
                      generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
                    })
                  });

                  const gemJson = await gemRes.json();
                  const candParts = gemJson?.candidates?.[0]?.content?.parts || [];
                  const imgPart = candParts.find(p => p.inlineData && p.inlineData.data);
                  if (imgPart) {
                    const gemBuf = Buffer.from(imgPart.inlineData.data, "base64");
                    if (gemBuf.length > 1000) {
                      aiBuf = gemBuf;
                      AI_STATS.gemini_success++;
                      logStep(reqId, "GEMINI_SUCCESS", `bytes=${aiBuf.length}`);
                    }
                  } else {
                    AI_STATS.gemini_failed++;
                    const errCode = gemJson?.error?.status || gemJson?.error?.code || gemRes.status;
                    logStep(reqId, "GEMINI_FAILED", `code=${errCode} | ${gemJson?.error?.message || "No image returned"}`);
                  }
                } catch (gemErr) {
                  AI_STATS.gemini_failed++;
                  logStep(reqId, "GEMINI_FAILED", gemErr.message);
                }
              }
            }

            if (!aiBuf) {
              AI_STATS.sticker_fallback++;
              logStep(reqId, "STICKER_FALLBACK", "Switching to Sticker Overlay / Frame pipeline");
            }
            const totalElapsed = Date.now() - reqStartMs;
            AI_STATS.total_duration_ms += totalElapsed;
            AI_STATS.avg_duration_ms = Math.round(AI_STATS.total_duration_ms / AI_STATS.total_requests);
          
          if (aiBuf && aiBuf.length > 1000) {
                    const fileName = `ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
                    const outPath = path.join(IMAGES_DIR, fileName);

                    // Chuẩn hóa ảnh JPEG bằng sharp
                    await sharp(aiBuf)
                        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
                        .jpeg({ quality: 92 })
                        .toFile(outPath);

                    const finalUrl = `${baseUrl}/images/${fileName}`;
                    addLog("RESPONSE", { filter_id: fid, outputUrl: finalUrl, type: "ai_generated_kira_agnes", prompt: fullPrompt.substring(0, 100) });
                    deliveredAi = true;
                    return res.json(formatLocketResponse(finalUrl, { type: "ai_generated", engine: "kira_agnes_2.1_flash", prompt: fullPrompt }));
                }
            } catch (aiErr) {
                console.error("AI generation failed:", aiErr.message);
                return res.status(aiErr.http || 503).json({error:aiErr.http ? aiErr.message : 'AI service unavailable'});
            } finally {
                if (reservedAi) {
                  try {
                    await require('./akirrai_sepay_bridge').db('POST','rpc/akirrai_settle_ai_job',{
                      p_user_id:reservedAi.userId,p_job_id:reservedAi.jobId,p_success:deliveredAi
                    });
                  } catch (_) { console.error('AI_SETTLEMENT_RECONCILE_REQUIRED',reservedAi.jobId); }
                }
            }
        }

        // 2. DỰ PHÒNG: NẾU KHÔNG CÓ PROMPT HOẶC AI TIMEOUT -> GHÉP STICKER 3D LÊN ẢNH GỐC
        const stkPath = resolveStickerPath(rawFid) || resolveStickerPath(cleanFid) || resolveStickerPath(mappedFid);
        if (stkPath && fs.existsSync(stkPath)) {
            try {
                const userBuf = await fetchImageBuffer(imgUrl);
                const userCrop = await sharp(userBuf).resize(1080, 1080, { fit: 'cover' }).toBuffer();
                
                // Xác định kích thước & vị trí sticker phù hợp từng loại
                let stkSize = 360;
                let leftPos = 680; // Mặc định: Góc dưới bên phải
                let topPos = 680;

                // Các sticker đội đầu / nón / vương miện
                if (/hat|crown|wig|mohawk|buns/i.test(cleanFid)) {
                    stkSize = 420;
                    leftPos = Math.round((1080 - stkSize) / 2);
                    topPos = 40;
                }
                // Các hiệu ứng bao trùm (bão mưa, pháo hoa, hoàng hôn, đại dương, dung nham)
                else if (/rain|fireworks|golden|ocean|volcano|watercolor|jungle/i.test(cleanFid)) {
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
                addLog("RESPONSE", { filter_id: fid, outputUrl: finalUrl, type: "sticker_overlay_fallback" });
                return res.json(formatLocketResponse(finalUrl, { type: "sticker_overlay_fallback" }));
            } catch (stkErr) {
                console.error("Sticker overlay error:", stkErr);
            }
        }

        // Fallback an toàn tuyệt đối: Trả về ảnh gốc
        addLog("RESPONSE", { filter_id: fid, outputUrl: imgUrl, type: "fallback_original" });
        return res.json(formatLocketResponse(imgUrl));

    } catch (err) {
        console.error("Filter processing error:", err);
        const fallbackUrl = req.body?.data?.imageUrl || req.body?.data?.image_url || req.body?.imageUrl || req.body?.image_url || "";
        addLog("ERROR", {message:err.message});
        return res.status(200).json(formatLocketResponse(fallbackUrl));
    }
});

// Tự động dọn dẹp ảnh tạm sau mỗi 60 phút (xóa file cũ hơn 30 phút để tiết kiệm bộ nhớ)
setInterval(() => {
    try {
        const now = Date.now();
        const files = fs.readdirSync(IMAGES_DIR);
        for (const file of files) {
            const filePath = path.join(IMAGES_DIR, file);
            const stat = fs.statSync(filePath);
            if (now - stat.mtimeMs > 30 * 60 * 1000) {
                fs.unlinkSync(filePath);
            }
        }
    } catch (e) {}
}, 60 * 60 * 1000);


// === [AUTO SYNC UPLOADED FRAMES & CATALOG TO GITHUB + DIRECT PUBLISH] ===
const ghAutoSync = require("./github_auto_sync");
const { analyzeAndPrepareFrame } = require("./auto_frame_analyzer");

app.post("/api/cms/direct-publish", express.json({ limit: "25mb" }), async (req, res) => {
  try {
    const draftPayload = req.body && req.body.draft ? req.body.draft : req.body;
    const rootReleasePath = path.join(__dirname, "cms_release.json");
    let currentRelease = {};
    if (fs.existsSync(rootReleasePath)) {
      try { currentRelease = JSON.parse(fs.readFileSync(rootReleasePath, "utf8")); } catch (_) {}
    }

    const rawItems = Array.isArray(draftPayload?.items) ? draftPayload.items : (Array.isArray(currentRelease?.draft?.items) ? currentRelease.draft.items : []);
    const rawCaptions = Array.isArray(draftPayload?.captions) ? draftPayload.captions : (Array.isArray(currentRelease?.draft?.captions) ? currentRelease.draft.captions : []);

    // Loc sach cac muc loi va tu dong khoet trong suot + do toa do slots cho cac khung PTB/Frame moi
    const cleanItems = [];
    for (const it of rawItems) {
      if (!it || !it.id) continue;
      if (it.type === "ai" && (!it.prompt || !String(it.prompt).trim())) continue;
      const assetRel = it.assetUrl || it.frameUrl || it.imageUrl;
      if ((it.type === "ptb" || it.type === "frame") && !assetRel) continue;

      if ((it.type === "ptb" || it.type === "frame") && assetRel && assetRel.startsWith("/")) {
        const localFile = path.join(__dirname, assetRel.replace(/^\/+/, ""));
        if (fs.existsSync(localFile)) {
          try {
            const layoutInfo = await analyzeAndPrepareFrame(localFile, it.type);
            it.layout = {
              canvasWidth: layoutInfo.canvasWidth,
              canvasHeight: layoutInfo.canvasHeight,
              slots: layoutInfo.slots
            };
          } catch (errAnalyze) {
            console.warn("Auto analyze frame warning:", errAnalyze.message);
          }
        }
      }
      it.enabled = it.enabled !== false;
      cleanItems.push(it);
    }

    const nowIso = new Date().toISOString();
    const versionId = "ver_" + Date.now();
    const updatedRelease = {
      ...currentRelease,
      version: versionId,
      updatedAt: nowIso,
      publishedAt: nowIso,
      items: cleanItems,
      captions: rawCaptions,
      draft: {
        items: cleanItems,
        captions: rawCaptions,
        updatedAt: nowIso
      },
      published: {
        version: versionId,
        publishedAt: nowIso,
        items: cleanItems,
        captions: rawCaptions
      }
    };

    fs.writeFileSync(rootReleasePath, JSON.stringify(updatedRelease, null, 2), "utf8");

    // Dong bo AI prompts moi vao AI_PROMPTS runtime neu co
    if (typeof AI_PROMPTS === "object" && AI_PROMPTS !== null) {
      for (const it of cleanItems) {
        if (it.type === "ai" && it.prompt && it.enabled !== false) {
          AI_PROMPTS[it.id] = it.prompt;
        }
      }
    }

    // Day cms_release.json va tat ca file anh khung trong cleanItems len GitHub
    const ghResults = [];
    const uploadedSet = new Set();
    const relBuf = fs.readFileSync(rootReleasePath);
    ghResults.push(await ghAutoSync.pushFileToGitHub("cms_release.json", relBuf, "feat(cms): publish cms_release.json (" + cleanItems.length + " items)"));

    for (const it of cleanItems) {
      const rawUrl = it.assetUrl || it.frameUrl || it.imageUrl;
      if (rawUrl && typeof rawUrl === "string" && rawUrl.startsWith("/")) {
        const cleanRel = rawUrl.replace(/^\/+/, "");
        const localPath = path.join(__dirname, cleanRel);
        if (fs.existsSync(localPath) && !uploadedSet.has(cleanRel)) {
          uploadedSet.add(cleanRel);
          ghResults.push(await ghAutoSync.pushFileToGitHub(cleanRel, fs.readFileSync(localPath), "feat(cms): sync transparent frame " + path.basename(cleanRel)));
        }
      }
    }

    return res.json({
      ok: true,
      version: versionId,
      publishedCount: cleanItems.length,
      captionsCount: rawCaptions.length,
      githubSynced: ghResults.some(r => r && r.pushed),
      draft: updatedRelease.draft
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});
app.listen(PORT, () => {
    console.log(`Locket Backend Mod Server is running on port ${PORT}`);
});


