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


function registerRoutes(app) {
  app.get('/api/user/quota', (req, res) => {
    const db = loadDb();
    const userId = String(req.query.userId || extractUserIdentity(req));
    const user = getOrCreateUser(db, userId);
    saveDb(db);
    const freeRemaining = user.unlimited ? 999999 : Math.max(0, db.settings.dailyFreeLimit - user.dailyFreeUsed);
    res.json({
      status: "ok",
      user: {
        userId: user.userId,
        username: user.username,
        status: user.status,
        unlimited: user.unlimited,
        dailyFreeLimit: db.settings.dailyFreeLimit,
        dailyFreeUsed: user.dailyFreeUsed,
        freeRemaining,
        paidCredits: user.paidCredits,
        totalAvailable: freeRemaining + user.paidCredits
      },
      pricing: db.settings
    });
  });

  app.post('/api/payment/create', (req, res) => {
    const db = loadDb();
    const userId = String(req.body?.userId || req.query?.userId || extractUserIdentity(req));
    const user = getOrCreateUser(db, userId);
    const tx = createOrGetPendingTransaction(db, userId);
    const qrImageUrl = "https://img.vietqr.io/image/" + db.settings.bankId + "-" + db.settings.accountNo + "-compact2.png?amount=" + tx.amount + "&addInfo=" + encodeURIComponent(tx.txCode) + "&accountName=" + encodeURIComponent(db.settings.accountName);
    res.json({ status: "ok", transaction: tx, qrImageUrl, user });
  });

  app.get('/api/payment/status/:txCode', (req, res) => {
    const db = loadDb();
    const tx = db.transactions[req.params.txCode];
    if (!tx) return res.status(404).json({ error: "Khong tim thay giao dich" });
    const user = getOrCreateUser(db, tx.userId);
    res.json({ status: "ok", transaction: tx, paidCredits: user.paidCredits });
  });

  app.post('/api/payment/webhook', (req, res) => {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET || process.env.ADMIN_KEY || "tranhai307";
    const authHeader = req.headers['authorization'] || req.headers['x-webhook-secret'] || req.query.secret || "";
    if (secret && !String(authHeader).includes(secret) && req.body?.adminKey !== secret) {
      return res.status(401).json({ error: "Unauthorized webhook" });
    }
    const content = String(req.body?.content || req.body?.description || req.body?.transferContent || req.body?.txCode || "").toUpperCase();
    const amount = Number(req.body?.transferAmount || req.body?.amount || 0);
    const bankTxId = String(req.body?.id || req.body?.referenceCode || req.body?.transactionId || Date.now());

    const db = loadDb();
    const matchCode = content.match(/KIRA\d{8}[A-Z0-9]+/);
    const txCode = matchCode ? matchCode[0] : content.trim();
    const tx = db.transactions[txCode];

    if (!tx) return res.status(404).json({ error: "Transaction code not found", txCode });
    if (tx.status === "PAID") return res.json({ status: "already_processed", transaction: tx });
    if (amount < tx.amount) return res.status(400).json({ error: "Insufficient amount received", expected: tx.amount, received: amount });

    tx.status = "PAID";
    tx.paidAt = new Date().toISOString();
    tx.bankTxId = bankTxId;
    tx.receivedAmount = amount;

    const turnsToAdd = Math.max(1, Math.floor(amount / db.settings.pricePerTurnVnd));
    const user = getOrCreateUser(db, tx.userId);
    user.paidCredits = (user.paidCredits || 0) + turnsToAdd;
    user.totalSpentVnd = (user.totalSpentVnd || 0) + amount;
    saveDb(db);
    res.json({ status: "ok", message: "Da cap +" + turnsToAdd + " luot cho " + tx.userId, transaction: tx, user });
  });

  app.get('/api/11a2/config', (req, res) => {
    const cfg = JSON.parse(fs.readFileSync(CLASS_11A2_PATH, 'utf8'));
    res.json({ status: "ok", config: cfg });
  });

  app.get('/api/11a2/caption', (req, res) => {
    const cfg = JSON.parse(fs.readFileSync(CLASS_11A2_PATH, 'utf8'));
    const category = req.query.category || "thanh_xuan_11a2";
    const memberName = String(req.query.name || "").trim();
    let pool = cfg.captions[category] || cfg.captions.thanh_xuan_11a2;
    if (memberName) {
      pool = cfg.captions.ca_nhan_template.map(t => t.replace(/\[Tên\]/g, memberName));
    }
    const picked = pool[Math.floor(Math.random() * pool.length)];
    res.json({ status: "ok", caption: picked, slogan: cfg.slogans[0] });
  });

  function checkAdminAuth(req, res, next) {
    const adminPass = process.env.ADMIN_KEY || "tranhai307";
    const provided = req.headers['x-admin-key'] || req.query.adminKey || req.body?.adminKey;
    if (provided !== adminPass) return res.status(401).json({ error: "Sai mat khau Admin" });
    next();
  }

  app.get('/api/admin/overview', checkAdminAuth, (req, res) => {
    const db = loadDb();
    const usersList = Object.values(db.users);
    const txList = Object.values(db.transactions);
    const today = getVnDateString();
    const paidTxs = txList.filter(t => t.status === "PAID");
    const revenueTotal = paidTxs.reduce((s, t) => s + (t.receivedAmount || t.amount || 0), 0);
    const revenueToday = paidTxs.filter(t => (t.paidAt || "").startsWith(today)).reduce((s, t) => s + (t.receivedAmount || t.amount || 0), 0);

    res.json({
      status: "ok",
      settings: db.settings,
      summary: {
        totalUsers: usersList.length,
        activeToday: usersList.filter(u => (u.lastActiveAt || "").startsWith(today)).length,
        revenueToday,
        revenueTotal
      },
      users: usersList,
      transactions: txList.slice(-100).reverse()
    });
  });

  app.post('/api/admin/user-action', checkAdminAuth, (req, res) => {
    const { userId, action, amount, dailyFreeLimit, pricePerTurnVnd } = req.body || {};
    const db = loadDb();
    if (action === "update_settings") {
      if (dailyFreeLimit !== undefined) db.settings.dailyFreeLimit = Math.min(2, Math.max(1, Number(dailyFreeLimit)));
      if (pricePerTurnVnd !== undefined) db.settings.pricePerTurnVnd = Number(pricePerTurnVnd);
      saveDb(db);
      return res.json({ status: "ok", settings: db.settings });
    }
    const u = getOrCreateUser(db, userId);
    if (action === "add_credits") u.paidCredits += Number(amount || 1);
    if (action === "sub_credits") u.paidCredits = Math.max(0, u.paidCredits - Number(amount || 1));
    if (action === "reset_free") u.dailyFreeUsed = 0;
    if (action === "toggle_ban") u.status = u.status === "banned" ? "active" : "banned";
    if (action === "toggle_unlimited") u.unlimited = !u.unlimited;
    saveDb(db);
    res.json({ status: "ok", user: u });
  });

  app.post('/api/admin/approve-tx', checkAdminAuth, (req, res) => {
    const { txCode } = req.body || {};
    const db = loadDb();
    const tx = db.transactions[txCode];
    if (!tx) return res.status(404).json({ error: "Khong tim thay ma giao dich" });
    if (tx.status === "PAID") return res.status(400).json({ error: "Giao dich nay da duoc duyet truoc do" });
    tx.status = "PAID";
    tx.paidAt = new Date().toISOString();
    const u = getOrCreateUser(db, tx.userId);
    u.paidCredits += (tx.creditsToGrant || 1);
    u.totalSpentVnd = (u.totalSpentVnd || 0) + tx.amount;
    saveDb(db);
    res.json({ status: "ok", transaction: tx, user: u });
  });

  app.get('/pay', (req, res) => {
    const db = loadDb();
    const userId = String(req.query.user || "khach");
    const user = getOrCreateUser(db, userId);
    const tx = createOrGetPendingTransaction(db, userId);
    const qrUrl = "https://img.vietqr.io/image/" + db.settings.bankId + "-" + db.settings.accountNo + "-compact2.png?amount=" + tx.amount + "&addInfo=" + encodeURIComponent(tx.txCode) + "&accountName=" + encodeURIComponent(db.settings.accountName);
    const html = [
      '<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Thanh Toán Lượt Tạo Ảnh AI</title>',
      '<style>body{background:#0f172a;color:#f8fafc;font-family:system-ui,sans-serif;display:flex;justify-content:center;padding:20px;margin:0}.card{max-width:440px;width:100%;background:#1e293b;border:2px solid #f59e0b;border-radius:20px;padding:24px;text-align:center}h2{color:#f59e0b;margin:0 0 8px}.qr{background:#fff;padding:12px;border-radius:16px;width:260px;height:260px;margin:16px auto;display:block}.box{background:#0f172a;padding:12px;border-radius:12px;margin:12px 0;text-align:left;font-size:15px}.code{color:#34d399;font-weight:700;font-size:20px}button{background:#f59e0b;color:#0f172a;border:none;padding:12px 20px;border-radius:10px;font-weight:700;cursor:pointer;width:100%;margin-top:8px;font-size:15px}.status{margin-top:14px;padding:10px;border-radius:10px;background:#334155;font-weight:600}</style></head>',
      '<body><div class="card"><h2>Bạn đã hết lượt miễn phí</h2><p>Giá mua thêm: <b>' + tx.amount.toLocaleString("vi-VN") + ' VNĐ / 1 lượt</b></p>',
      '<img class="qr" src="' + qrUrl + '" alt="VietQR MB Bank"/>',
      '<div class="box"><div>Ngân hàng: <b>' + db.settings.bankName + '</b></div><div>Số tài khoản: <b>' + db.settings.accountNo + '</b></div><div>Chủ tài khoản: <b>' + db.settings.accountName + '</b></div><div>Nội dung CK: <span class="code">' + tx.txCode + '</span></div></div>',
      '<button onclick="navigator.clipboard.writeText(\'' + tx.txCode + '\');alert(\'Đã sao chép: ' + tx.txCode + '\')">📋 Sao chép nội dung chuyển khoản</button>',
      '<div class="status" id="st">⏳ Đang chờ thanh toán... (Lượt hiện có: ' + user.paidCredits + ')</div></div>',
      '<script>setInterval(async()=>{const r=await fetch("/api/payment/status/' + tx.txCode + '");const d=await r.json();if(d.transaction&&d.transaction.status==="PAID"){document.getElementById("st").style.background="#065f46";document.getElementById("st").innerText="✅ Thanh toán thành công! Bạn đã được cộng +1 lượt.";}},4000);</script></body></html>'
    ].join("");
    res.send(html);
  });

  app.get('/admin', (req, res) => {
    const html = [
      '<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kira AI & Locket 11A2 Admin</title>',
      '<style>body{background:#0f172a;color:#f8fafc;font-family:system-ui,sans-serif;margin:0;padding:20px}h1{color:#f59e0b}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:20px}.stat{background:#1e293b;padding:16px;border-radius:14px;border:1px solid #334155}.stat b{font-size:24px;color:#38bdf8;display:block;margin-top:6px}table{width:100%;border-collapse:collapse;background:#1e293b;border-radius:12px;overflow:hidden;margin-bottom:24px}th,td{padding:10px 12px;border-bottom:1px solid #334155;text-align:left;font-size:14px}th{background:#0f172a;color:#94a3b8}button,input,select{padding:8px 12px;border-radius:8px;border:1px solid #475569;background:#0f172a;color:#fff}button{background:#2563eb;border:none;cursor:pointer;font-weight:600;margin-right:4px}button.green{background:#059669}button.orange{background:#d97706}</style></head>',
      '<body><h1>⚡ Admin Dashboard – Locket AI & Lớp 11A2 THPT Ngô Quyền</h1>',
      '<div style="margin-bottom:16px"><input id="key" type="password" value="tranhai307" style="width:240px"/> <button onclick="loadAll()">Làm mới dữ liệu</button></div>',
      '<div class="grid" id="stats"></div>',
      '<div style="background:#1e293b;padding:16px;border-radius:12px;margin-bottom:20px"><h3>⚙️ Cấu hình Giới hạn & Giá lượt (MB Bank: 0917921802 - TRAN LAM TUONG HAI)</h3>',
      'Giới hạn miễn phí/ngày (1-2): <input id="freeLim" type="number" min="1" max="2" value="2" style="width:60px"/> ',
      'Giá mỗi lượt (VNĐ): <select id="priceSel"><option value="2000">2.000 VNĐ</option><option value="3000" selected>3.000 VNĐ</option><option value="4000">4.000 VNĐ</option></select> ',
      '<button class="green" onclick="saveSettings()">Lưu cấu hình</button></div>',
      '<h3>💳 Giao dịch Thanh toán VietQR</h3><table id="txTable"><thead><tr><th>Mã GD</th><th>Tài khoản</th><th>Số tiền</th><th>Trạng thái</th><th>Thời gian</th><th>Duyệt</th></tr></thead><tbody></tbody></table>',
      '<h3>👥 Danh sách Người dùng</h3><table id="userTable"><thead><tr><th>User ID</th><th>Trạng thái</th><th>Lượt Free hôm nay</th><th>Lượt trả phí</th><th>Thao tác</th></tr></thead><tbody></tbody></table>',
      '<script>',
      'async function api(p,b){const k=document.getElementById("key").value;const r=await fetch(p,{method:b?"POST":"GET",headers:{"Content-Type":"application/json","x-admin-key":k},body:b?JSON.stringify(b):undefined});return r.json();}',
      'async function loadAll(){const d=await api("/api/admin/overview");if(d.error)return alert(d.error);',
      'document.getElementById("freeLim").value=d.settings.dailyFreeLimit;document.getElementById("priceSel").value=d.settings.pricePerTurnVnd;',
      'document.getElementById("stats").innerHTML="<div class=\"stat\">Tổng tài khoản<b>"+d.summary.totalUsers+"</b></div><div class=\"stat\">Hoạt động hôm nay<b>"+d.summary.activeToday+"</b></div><div class=\"stat\">Doanh thu hôm nay<b>"+d.summary.revenueToday.toLocaleString("vi-VN")+"đ</b></div><div class=\"stat\">Tổng doanh thu<b>"+d.summary.revenueTotal.toLocaleString("vi-VN")+"đ</b></div>";',
      'document.querySelector("#txTable tbody").innerHTML=d.transactions.map(t=>"<tr><td><b>"+t.txCode+"</b></td><td>"+t.userId+"</td><td>"+t.amount.toLocaleString("vi-VN")+"đ</td><td>"+t.status+"</td><td>"+t.createdAt.slice(0,19)+"</td><td>"+(t.status==="PENDING"?"<button class=\"green\" onclick=\"approveTx('"+t.txCode+"')\">✅ Duyệt +1 lượt</button>":"Đã duyệt")+"</td></tr>").join("");',
      'document.querySelector("#userTable tbody").innerHTML=d.users.map(u=>"<tr><td><b>"+u.userId+"</b> "+(u.unlimited?"(Unlimited)":"")+"</td><td>"+u.status+"</td><td>"+u.dailyFreeUsed+"/"+d.settings.dailyFreeLimit+"</td><td><b>"+u.paidCredits+"</b></td><td><button class=\"green\" onclick=\"uAct('"+u.userId+"','add_credits',1)\">+1 lượt</button><button class=\"orange\" onclick=\"uAct('"+u.userId+"','sub_credits',1)\">-1 lượt</button><button onclick=\"uAct('"+u.userId+"','reset_free')\">Reset Free</button><button onclick=\"uAct('"+u.userId+"','toggle_ban')\">Khóa/Mở</button></td></tr>").join("");}',
      'async function saveSettings(){await api("/api/admin/user-action",{action:"update_settings",dailyFreeLimit:document.getElementById("freeLim").value,pricePerTurnVnd:document.getElementById("priceSel").value});loadAll();}',
      'async function uAct(u,a,m){await api("/api/admin/user-action",{userId:u,action:a,amount:m});loadAll();}',
      'async function approveTx(c){await api("/api/admin/approve-tx",{txCode:c});loadAll();}',
      'loadAll();</script></body></html>'
    ].join("");
    res.send(html);
  });
}

module.exports = {
  registerRoutes,
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
