const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'data', 'platform_db.json');
const CLASS_11A2_PATH = path.join(__dirname, 'data', 'class_11a2_config.json');

if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
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
  transactions: {}
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

function extractUserIdentity(req) {
  const d = Object.assign({}, (req.body && req.body.data) || {}, req.body || {}, req.query || {});
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
    const isAdm = (userId === "tranhai307" || userId === "ADMIN_TRANHAI307_UNLIMITED");
    db.users[userId] = {
      userId: userId,
      username: userId,
      fullName: userId,
      role: isAdm ? "admin" : "user",
      status: "active",
      unlimited: isAdm,
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
    function(t) { return t.userId === userId && t.status === "PENDING" && t.amount === price; }
  );
  if (existing) return existing;

  const datePart = getVnDateString().replace(/-/g, "");
  const seq = String(Object.keys(db.transactions).length + 1).padStart(4, "0");
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  const txCode = "KIRA" + datePart + seq + rand;

  const tx = {
    txCode: txCode,
    userId: userId,
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
  const qrUrl = "[https://img.vietqr.io/image/](https://img.vietqr.io/image/)" + settings.bankId + "-" + settings.accountNo + "-compact2.png?amount=" + tx.amount + "&addInfo=" + encodeURIComponent(tx.txCode) + "&accountName=" + encodeURIComponent(settings.accountName);
  const qrResp = await axiosLib.get(qrUrl, { responseType: "arraybuffer", timeout: 12000 });
  const qrPng = await sharpLib(Buffer.from(qrResp.data))
    .resize(540, 540, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toBuffer();

  const limit = settings.dailyFreeLimit || 2;
  const svgStr = [
    '<svg width="1024" height="1024" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)">',
    '<rect width="1024" height="1024" fill="#0F172A"/>',
    '<rect x="52" y="36" width="920" height="952" rx="32" fill="#1E293B" stroke="#F59E0B" stroke-width="4"/>',
    '<text x="512" y="102" text-anchor="middle" fill="#F59E0B" font-size="34" font-family="Arial, sans-serif" font-weight="bold">HET LUOT MIEN PHI (' + limit + '/' + limit + ' LUOT/NGAY)</text>',
    '<text x="512" y="150" text-anchor="middle" fill="#F8FAFC" font-size="26" font-family="Arial, sans-serif">Quet VietQR de mua them luot AI: ' + tx.amount.toLocaleString("vi-VN") + ' VND / 1 luot</text>',
    '<rect x="232" y="180" width="560" height="560" rx="20" fill="#FFFFFF"/>',
    '<text x="512" y="790" text-anchor="middle" fill="#38BDF8" font-size="26" font-family="Arial, sans-serif" font-weight="bold">' + settings.bankName + ' (' + settings.bankId + ') - STK: ' + settings.accountNo + '</text>',
    '<text x="512" y="830" text-anchor="middle" fill="#E2E8F0" font-size="24" font-family="Arial, sans-serif">Chu TK: ' + settings.accountName + '</text>',
    '<rect x="182" y="852" width="660" height="64" rx="14" fill="#064E3B" stroke="#10B981" stroke-width="2"/>',
    '<text x="512" y="894" text-anchor="middle" fill="#34D399" font-size="30" font-family="Arial, sans-serif" font-weight="bold">MA GIAO DICH: ' + tx.txCode + '</text>',
    '</svg>'
  ].join("");

  return await sharpLib(Buffer.from(svgStr))
    .composite([{ input: qrPng, top: 190, left: 242 }])
    .jpeg({ quality: 92 })
    .toBuffer();
}

function registerRoutes(app) {
  app.get('/api/user/quota', function(req, res) {
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
        freeRemaining: freeRemaining,
        paidCredits: user.paidCredits,
        totalAvailable: freeRemaining + user.paidCredits
      },
      pricing: db.settings
    });
  });

  app.post('/api/payment/create', function(req, res) {
    const db = loadDb();
    const userId = String((req.body && req.body.userId) || (req.query && req.query.userId) || extractUserIdentity(req));
    const user = getOrCreateUser(db, userId);
    const tx = createOrGetPendingTransaction(db, userId);
    const qrImageUrl = "[https://img.vietqr.io/image/](https://img.vietqr.io/image/)" + db.settings.bankId + "-" + db.settings.accountNo + "-compact2.png?amount=" + tx.amount + "&addInfo=" + encodeURIComponent(tx.txCode) + "&accountName=" + encodeURIComponent(db.settings.accountName);
    res.json({ status: "ok", transaction: tx, qrImageUrl: qrImageUrl, user: user });
  });

  app.get('/api/payment/status/:txCode', function(req, res) {
    const db = loadDb();
    const tx = db.transactions[req.params.txCode];
    if (!tx) return res.status(404).json({ error: "Khong tim thay giao dich" });
    const user = getOrCreateUser(db, tx.userId);
    res.json({ status: "ok", transaction: tx, paidCredits: user.paidCredits });
  });

  app.post('/api/payment/webhook', function(req, res) {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET || process.env.ADMIN_KEY || "tranhai307";
    const authHeader = req.headers['authorization'] || req.headers['x-webhook-secret'] || req.query.secret || "";
    if (secret && !String(authHeader).includes(secret) && (!req.body || req.body.adminKey !== secret)) {
      return res.status(401).json({ error: "Unauthorized webhook" });
    }
    const content = String((req.body && (req.body.content || req.body.description || req.body.transferContent || req.body.txCode)) || "").toUpperCase();
    const amount = Number((req.body && (req.body.transferAmount || req.body.amount)) || 0);
    const bankTxId = String((req.body && (req.body.id || req.body.referenceCode || req.body.transactionId)) || Date.now());

    const db = loadDb();
    const matchCode = content.match(/KIRA\d{8}[A-Z0-9]+/);
    const txCode = matchCode ? matchCode[0] : content.trim();
    const tx = db.transactions[txCode];

    if (!tx) return res.status(404).json({ error: "Transaction code not found", txCode: txCode });
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
    res.json({ status: "ok", transaction: tx, user: user });
  });

  app.get('/api/11a2/config', function(req, res) {
    const cfg = fs.existsSync(CLASS_11A2_PATH) ? JSON.parse(fs.readFileSync(CLASS_11A2_PATH, 'utf8')) : {};
    res.json({ status: "ok", config: cfg });
  });

  app.get('/api/11a2/caption', function(req, res) {
    const cfg = fs.existsSync(CLASS_11A2_PATH) ? JSON.parse(fs.readFileSync(CLASS_11A2_PATH, 'utf8')) : {};
    const category = req.query.category || "thanh_xuan_11a2";
    const memberName = String(req.query.name || "").replace(/[()]/g, "").trim();
    let pool = (cfg.captions && cfg.captions[category]) || ["11A2 - THPT Ngo Quyen"];
    if (memberName && cfg.captions && cfg.captions.ca_nhan_template) {
      pool = cfg.captions.ca_nhan_template.map(function(t) { return t.replace(/\[Tên\]/g, memberName); });
    }
    const picked = pool[Math.floor(Math.random() * pool.length)];
    res.json({ status: "ok", caption: picked });
  });

  function checkAdminAuth(req, res, next) {
    const adminPass = process.env.ADMIN_KEY || "tranhai307";
    const provided = req.headers['x-admin-key'] || req.query.adminKey || (req.body && req.body.adminKey);
    if (provided !== adminPass) return res.status(401).json({ error: "Sai mat khau Admin" });
    next();
  }

  app.get('/api/admin/overview', checkAdminAuth, function(req, res) {
    const db = loadDb();
    const usersList = Object.values(db.users);
    const txList = Object.values(db.transactions);
    const today = getVnDateString();
    const paidTxs = txList.filter(function(t) { return t.status === "PAID"; });
    const revenueTotal = paidTxs.reduce(function(s, t) { return s + (t.receivedAmount || t.amount || 0); }, 0);
    const revenueToday = paidTxs.filter(function(t) { return (t.paidAt || "").startsWith(today); }).reduce(function(s, t) { return s + (t.receivedAmount || t.amount || 0); }, 0);

    res.json({
      status: "ok",
      settings: db.settings,
      summary: {
        totalUsers: usersList.length,
        activeToday: usersList.filter(function(u) { return (u.lastActiveAt || "").startsWith(today); }).length,
        revenueToday: revenueToday,
        revenueTotal: revenueTotal
      },
      users: usersList,
      transactions: txList.slice(-100).reverse()
    });
  });

  app.post('/api/admin/user-action', checkAdminAuth, function(req, res) {
    const body = req.body || {};
    const db = loadDb();
    if (body.action === "update_settings") {
      if (body.dailyFreeLimit !== undefined) db.settings.dailyFreeLimit = Math.min(2, Math.max(1, Number(body.dailyFreeLimit)));
      if (body.pricePerTurnVnd !== undefined) db.settings.pricePerTurnVnd = Number(body.pricePerTurnVnd);
      saveDb(db);
      return res.json({ status: "ok", settings: db.settings });
    }
    const u = getOrCreateUser(db, body.userId);
    if (body.action === "add_credits") u.paidCredits += Number(body.amount || 1);
    if (body.action === "sub_credits") u.paidCredits = Math.max(0, u.paidCredits - Number(body.amount || 1));
    if (body.action === "reset_free") u.dailyFreeUsed = 0;
    if (body.action === "toggle_ban") u.status = u.status === "banned" ? "active" : "banned";
    if (body.action === "toggle_unlimited") u.unlimited = !u.unlimited;
    saveDb(db);
    res.json({ status: "ok", user: u });
  });

  app.post('/api/admin/approve-tx', checkAdminAuth, function(req, res) {
    const txCode = req.body && req.body.txCode;
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

  
  app.get('/api/payment/qr-image/:txCode', async function(req, res) {
    try {
      const db = loadDb();
      const tx = db.transactions[req.params.txCode];
      const amount = tx ? tx.amount : db.settings.pricePerTurnVnd;
      const code = tx ? tx.txCode : req.params.txCode;
      const qrUrl = "https://img.vietqr.io/image/" + db.settings.bankId + "-" + db.settings.accountNo + "-compact2.png?amount=" + amount + "&addInfo=" + encodeURIComponent(code) + "&accountName=" + encodeURIComponent(db.settings.accountName);
      const r = await fetch(qrUrl);
      const buf = Buffer.from(await r.arrayBuffer());
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=300");
      res.send(buf);
    } catch (e) {
      res.status(500).send("QR Error");
    }
  });

  app.post('/api/11a2/member', checkAdminAuth, function(req, res) {
    const cfg = fs.existsSync(CLASS_11A2_PATH) ? JSON.parse(fs.readFileSync(CLASS_11A2_PATH, 'utf8')) : { members: [] };
    if (!Array.isArray(cfg.members)) cfg.members = [];
    if (req.body && req.body.action === "add" && req.body.name) {
      cfg.members.push({ id: "m" + Date.now(), name: String(req.body.name).trim(), nickname: String(req.body.nickname || "").trim() });
      fs.writeFileSync(CLASS_11A2_PATH, JSON.stringify(cfg, null, 2), 'utf8');
    }
    res.json({ status: "ok", members: cfg.members });
  });

  app.get('/pay', function(req, res) {
    res.sendFile(path.join(__dirname, 'public', 'pay.html'));
  });

  app.get('/admin', function(req, res) {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  });
}

module.exports = {
  registerRoutes: registerRoutes,
  loadDb: loadDb,
  saveDb: saveDb,
  CLASS_11A2_PATH: CLASS_11A2_PATH,
  extractUserIdentity: extractUserIdentity,
  getOrCreateUser: getOrCreateUser,
  createOrGetPendingTransaction: createOrGetPendingTransaction,
  generatePaymentQrImageBuffer: generatePaymentQrImageBuffer
};
