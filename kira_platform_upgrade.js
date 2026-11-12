// ============================================================================
// KIRA AI - LOCKET PLATFORM UPGRADE MODULE (QUOTA, VIETQR, 11A2 STUDIO, ADMIN)
// Bảo toàn 100% các chức năng cũ trong server.js
// ============================================================================
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'data', 'platform_db.json');
const CLASS_11A2_PATH = path.join(__dirname, 'data', 'class_11a2_config.json');

if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// Khởi tạo cấu hình Lớp 11A2 - THPT Ngô Quyền & Bộ Filter/Photobooth
const DEFAULT_11A2_CONFIG = {
  className: "11A2",
  schoolName: "THPT Ngô Quyền",
  slogans: [
    "11A2 – THPT NGÔ QUYỀN",
    "OUR YOUTH, OUR MEMORIES",
    "THANH XUÂN KHÔNG CÓ LẦN THỨ HAI"
  ],
  watermarkEnabled: true,
  members: [
    { id: "m1", name: "Trần Hải", nickname: "Admin 11A2", style: "cá tính" },
    { id: "m2", name: "Thành viên 11A2", nickname: "Bestie", style: "vui nhộn" }
  ],
  captions: {
    thanh_xuan_11a2: [
      "Những năm tháng đẹp nhất đôi khi chỉ gói gọn trong một lớp học mang tên 11A2.",
      "Sau này mỗi người một hướng, nhưng 11A2 vẫn là một phần thanh xuân.",
      "Có những khoảnh khắc không thể quay lại, chỉ có thể giữ trong album.",
      "Thanh xuân mang tên Ngô Quyền, kỷ niệm mang tên 11A2."
    ],
    hai_huoc_hoc_duong: [
      "Đi học vì tương lai, chụp ảnh vì đam mê.",
      "11A2 không thiếu nhân tài, chỉ thiếu người chịu làm bài tập.",
      "Học thì có thể quên, nhưng ảnh dìm thì không bao giờ mất.",
      "Lớp mình đoàn kết, nhất là lúc nghe tin được nghỉ học."
    ],
    tinh_ban: [
      "Không cần giống nhau, chỉ cần cùng nhau tạo nên những kỷ niệm.",
      "Mỗi người một cá tính, ghép lại thành một tập thể.",
      "Có thể không học cùng nhau mãi mãi, nhưng sẽ nhớ nhau thật lâu."
    ],
    ca_nhan_template: [
      "[Tên] – một mảnh ghép không thể thiếu của 11A2.",
      "11A2 có thể thiếu bài tập, nhưng không thể thiếu [Tên].",
      "Nhân vật chính của khung hình hôm nay: [Tên].",
      "[Tên] và những ngày tháng đáng nhớ tại THPT Ngô Quyền."
    ]
  },
  photoboothStyles: [
    { id: "korean_studio", name: "Hàn Quốc – Korean Studio", bg: "#FFF5F7", border: "#F8BBD0", text: "#880E4F", tag: "KOREAN STUDIO ♥" },
    { id: "japanese_retro", name: "Nhật Bản – Japanese Retro Purikura", bg: "#FFFDF2", border: "#FFD54F", text: "#5D4037", tag: "プリクラ ★ PURIKURA" },
    { id: "vintage_film", name: "Vintage Film – Kodak Moment", bg: "#181818", border: "#F5B041", text: "#F5B041", tag: "KODAK GOLD 400 • FILM" },
    { id: "y2k_chrome", name: "Y2K Chrome & Holographic", bg: "#E8DAEF", border: "#8E44AD", text: "#4A235A", tag: "✦ Y2K CYBER STUDIO ✦" },
    { id: "minimal_luxury", name: "Minimal Luxury", bg: "#111111", border: "#FFFFFF", text: "#FFFFFF", tag: "MINIMAL EDITORIAL" },
    { id: "school_11a2", name: "School Memories – 11A2 THPT Ngô Quyền", bg: "#1B4F3E", border: "#F4D03F", text: "#FFFFFF", tag: "11A2 – THPT NGÔ QUYỀN" },
    { id: "magazine_editorial", name: "Magazine Editorial", bg: "#F8F9F9", border: "#2C3E50", text: "#1A252F", tag: "VOGUE • 11A2 ISSUE" },
    { id: "polaroid_memories", name: "Polaroid Memories", bg: "#FFFFFF", border: "#E5E7E9", text: "#2C3E50", tag: "OUR YOUTH, OUR MEMORIES" }
  ],
  sharpFilters: [
    { id: "kodak_gold", name: "Kodak Gold", brightness: 1.05, saturation: 1.25, hue: 8 },
    { id: "fujifilm_classic", name: "Fujifilm Classic", brightness: 1.03, saturation: 0.92, hue: -5 },
    { id: "portra_film", name: "Portra Film", brightness: 1.06, saturation: 1.08, hue: 4 },
    { id: "vintage_90s", name: "Vintage 90s", brightness: 0.98, saturation: 0.78, hue: 12 },
    { id: "korean_soft", name: "Korean Soft", brightness: 1.12, saturation: 0.90, hue: 2 },
    { id: "japanese_film", name: "Japanese Film", brightness: 1.08, saturation: 0.85, hue: -8 },
    { id: "warm_sunset", name: "Warm Sunset", brightness: 1.04, saturation: 1.35, hue: 15 },
    { id: "flash_camera", name: "Flash Camera", brightness: 1.18, saturation: 1.05, hue: 0 },
    { id: "dreamy_glow", name: "Dreamy Glow", brightness: 1.14, saturation: 0.95, hue: 5 },
    { id: "cinematic", name: "Cinematic", brightness: 0.95, saturation: 0.88, hue: -10 },
    { id: "soft_pastel", name: "Soft Pastel", brightness: 1.10, saturation: 0.82, hue: 6 },
    { id: "retro_grain", name: "Retro Grain", brightness: 0.96, saturation: 0.75, hue: 10 },
    { id: "disposable_camera", name: "Disposable Camera", brightness: 1.02, saturation: 1.18, hue: -4 },
    { id: "night_flash", name: "Night Flash", brightness: 1.10, saturation: 1.20, hue: -6 },
    { id: "polaroid", name: "Polaroid", brightness: 1.05, saturation: 0.90, hue: 3 },
    { id: "black_white", name: "Black & White", grayscale: true },
    { id: "magazine_tone", name: "Magazine Tone", brightness: 1.02, saturation: 0.88, hue: 0 },
    { id: "y2k_chrome", name: "Y2K Chrome", brightness: 1.08, saturation: 1.30, hue: -18 }
  ]
};

if (!fs.existsSync(CLASS_11A2_PATH)) {
  fs.writeFileSync(CLASS_11A2_PATH, JSON.stringify(DEFAULT_11A2_CONFIG, null, 2), 'utf8');
}

const DEFAULT_DB = {
  settings: {
    dailyFreeLimit: 2,
    pricePerTurnVnd: 3000,
    bankId: "MB",
    bankName: "MB Bank",
    accountNo: "0917921802",
    accountName: "TRAN LAM TUONG HAI",
    estimatedCostPerAiImageVnd: 225
  },
  users: {
    "tranhai307": {
      userId: "tranhai307",
      username: "tranhai307",
      fullName: "Trần Lâm Tường Hải (Admin)",
      role: "admin",
      status: "active",
      unlimited: true,
      registeredAt: "2026-11-11T00:00:00+07:00",
      lastResetDate: "2026-11-12",
      dailyFreeUsed: 0,
      paidCredits: 999999,
      totalImagesCreated: 0,
      totalSpentVnd: 0,
      lastActiveAt: new Date().toISOString()
    }
  },
  transactions: {},
  history: []
};

function loadDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      return Object.assign({}, DEFAULT_DB, parsed, {
        settings: Object.assign({}, DEFAULT_DB.settings, parsed.settings || {})
      });
    }
  } catch (_) {}
  return JSON.parse(JSON.stringify(DEFAULT_DB));
}

function saveDb(db) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error("Save DB error:", e.message);
  }
}

function getVnDateString() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
}

const USER_LOCKS = new Set();

function extractUserIdentity(req) {
  const d = Object.assign({}, req.body?.data || {}, req.body || {}, req.query || {});
  const adminHeader = req.headers['x-locket-admin'] || '';
  const rawUid = String(
    d.user_id || d.uid || d.userId || d.username ||
    req.headers['x-user-id'] || req.headers['x-locket-user'] ||
    (adminHeader === 'TranHai307' ? 'tranhai307' : '') ||
    req.ip || 'guest_user'
  ).trim();
  return rawUid.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 64) || 'guest_user';
}

function getOrCreateUser(db, userId) {
  const today = getVnDateString();
  if (!db.users[userId]) {
    db.users[userId] = {
      userId,
      username: userId,
      fullName: userId,
      role: userId === "tranhai307" || userId === "ADMIN_TRANHAI307_UNLIMITED" ? "admin" : "user",
      status: "active",
      unlimited: userId === "tranhai307" || userId === "ADMIN_TRANHAI307_UNLIMITED",
      registeredAt: new Date().toISOString(),
      lastResetDate: today,
      dailyFreeUsed: 0,
      paidCredits: 0,
      totalImagesCreated: 0,
      totalSpentVnd: 0,
      lastActiveAt: new Date().toISOString()
    };
  }
  const u = db.users[userId];
  if (u.lastResetDate !== today) {
    u.lastResetDate = today;
    u.dailyFreeUsed = 0;
  }
  u.lastActiveAt = new Date().toISOString();
  return u;
}

function createOrGetPendingTransaction(db, userId) {
  const price = Number(db.settings.pricePerTurnVnd || 3000);
  const existing = Object.values(db.transactions).find(
    t => t.userId === userId && t.status === "PENDING" && t.amount === price
  );
  if (existing) return existing;

  const datePart = getVnDateString().replace(/-/g, "");
  const seq = String(Object.keys(db.transactions).length + 1).padStart(4, "0");
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  const txCode = `KIRA${datePart}${seq}${rand}`;

  const tx = {
    txCode,
    userId,
    amount: price,
    creditsToGrant: 1,
    bankId: db.settings.bankId,
    accountNo: db.settings.accountNo,
    accountName: db.settings.accountName,
    status: "PENDING",
    createdAt: new Date().toISOString(),
    paidAt: null
  };
  db.transactions[txCode] = tx;
  saveDb(db);
  return tx;
}

async function generatePaymentQrImageBuffer(sharpLib, axiosLib, tx, user, settings) {
  const qrUrl = `https://img.vietqr.io/image/${settings.bankId}-${settings.accountNo}-compact2.png?amount=${tx.amount}&addInfo=${encodeURIComponent(tx.txCode)}&accountName=${encodeURIComponent(settings.accountName)}`;
  const qrResp = await axiosLib.get(qrUrl, { responseType: "arraybuffer", timeout: 12000 });
  const qrPng = await sharpLib(Buffer.from(qrResp.data))
    .resize(540, 540, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  const limit = settings.dailyFreeLimit || 2;
  const svg = Buffer.from(`<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="#0F172A"/>
    <rect x="52" y="36" width="920" height="952" rx="32" fill="#1E293B" stroke="#F59E0B" stroke-width="4"/>
    <text x="512" y="102" text-anchor="middle" fill="#F59E0B" font-size="36" font-family="Arial, sans-serif" font-weight="bold">BẠN ĐÃ HẾT LƯỢT MIỄN PHÍ (${limit}/${limit} LƯỢT/NGÀY)</text>
    <text x="512" y="150" text-anchor="middle" fill="#F8FAFC" font-size="27" font-family="Arial, sans-serif">Quét mã QR để mua thêm lượt tạo ảnh AI: ${tx.amount.toLocaleString('vi-VN')} VNĐ / 1 lượt</text>
    <rect x="232" y="180" width="560" height="560" rx="20" fill="#FFFFFF"/>
    <text x="512" y="790" text-anchor="middle" fill="#38BDF8" font-size="26" font-family="Arial, sans-serif" font-weight="bold">${settings.bankName} (${settings.bankId}) • STK: ${settings.accountNo}</text>
    <text x="512" y="830" text-anchor="middle" fill="#E2E8F0" font-size="24" font-family="Arial, sans-serif">Chủ TK: ${settings.accountName}</text>
    <rect x="182" y="852" width="660" height="64" rx="14" fill="#064E3B" stroke="#10B981" stroke-width="2"/>
    <text x="512" y="894" text-anchor="middle" fill="#34D399" font-size="30" font-family="Arial, sans-serif" font-weight="bold">NỘI DUNG CK: ${tx.txCode}</text>
    <text x="512" y="955" text-anchor="middle" fill="#94A3B8" font-size="20" font-family="Arial, sans-serif">Hệ thống tự động mở khóa ngay sau khi nhận đúng số tiền &amp; mã GD</text>
  </svg>`);

  return await sharpLib(svg)
    .composite([{ input: qrPng, top: 190, left: 242 }])
    .jpeg({ quality: 92 })
    .toBuffer();
}

module.exports = {
  loadDb,
  saveDb,
  CLASS_11A2_PATH,
  DEFAULT_11A2_CONFIG,
  USER_LOCKS,
  extractUserIdentity,
  getOrCreateUser,
  createOrGetPendingTransaction,
  generatePaymentQrImageBuffer
};
