// Royal Baccarat — 本地 server 版（零依賴，純 Node）
// 用法：node server.js  然後瀏覽器開 http://localhost:3000
// 功能：① 靜態 serve 你個 game  ② 雲端帳號（註冊/登入/儲存餘額）
// 注意：呢度係「虛擬幣娛樂版」，所有 chips 唔到真錢，唔係賭博。

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;                 // 直接 serve 個 repo
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');

// 確保 data 目錄存在
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ---- 帳號資料庫（檔案儲存，零依賴） ----
function loadAccounts() {
  try { return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8')); }
  catch (e) { return {}; }
}
function saveAccounts(db) {
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(db, null, 2));
}
let accounts = loadAccounts();

// ---- 密碼雜湊（scrypt，零依賴） ----
function hashPassword(pw, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pw, salt, 32).toString('hex');
  return { salt, hash };
}
function verifyPassword(pw, salt, hash) {
  const h = crypto.scryptSync(pw, salt, 32).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(hash));
}
function genToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ---- 小工具 ----
function sendJSON(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}
function readBody(req, limit = 1e6) {
  return new Promise((resolve, reject) => {
    let data = '';
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(new Error('too large')); req.destroy(); return; }
      data += c;
    });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch (e) { reject(new Error('bad json')); }
    });
    req.on('error', reject);
  });
}
const validUser = (u) => typeof u === 'string' && /^[a-zA-Z0-9_]{3,20}$/.test(u);

// ---- 商店目錄（server 係唯一真源，前端唔好寫死） ----
// 注意：全部係「虛擬道具娛樂版」，唔到真錢，唔係賭博。
// price 係「虛擬代幣(VT)」或顯示價錢；而家係測試下單，唔接真錢。
const STORE = {
  chips: [
    { id: 'c1', name: '新手包', chips: 50000, priceLabel: '免費試玩', price: 0 },
    { id: 'c2', name: '小注包', chips: 200000, priceLabel: 'HK$8', price: 8 },
    { id: 'c3', name: '豪客包', chips: 1000000, priceLabel: 'HK$30', price: 30 },
    { id: 'c4', name: '富豪包', chips: 5000000, priceLabel: 'HK$98', price: 98 }
  ],
  skins: [
    { id: 'classic', name: '經典綠', bg: '#0d1530', accent: '#3cb85a' },
    { id: 'gold', name: '土豪金', bg: '#1a1206', accent: '#e0b84a' },
    { id: 'neon', name: '霓虹紫', bg: '#160a26', accent: '#b15cff' },
    { id: 'ruby', name: '紅寶石', bg: '#26090f', accent: '#ff5a7a' }
  ]
};

// ---- API ----
async function handleApi(req, res, url) {
  const p = url.pathname;

  if (p === '/api/register' && req.method === 'POST') {
    const b = await readBody(req);
    const user = (b.username || '').trim();
    const pw = b.password || '';
    if (!validUser(user)) return sendJSON(res, 400, { error: '用戶名要用 3-20 個英數字/底線' });
    if (typeof pw !== 'string' || pw.length < 4) return sendJSON(res, 400, { error: '密碼至少 4 個字' });
    if (accounts[user]) return sendJSON(res, 409, { error: '呢個名已經有人用' });
    const { salt, hash } = hashPassword(pw);
    const token = genToken();
    accounts[user] = { salt, hash, token, balance: 50000, createdAt: Date.now() };
    saveAccounts(accounts);
    return sendJSON(res, 200, { token, balance: 50000, username: user });
  }

  if (p === '/api/login' && req.method === 'POST') {
    const b = await readBody(req);
    const user = (b.username || '').trim();
    const pw = b.password || '';
    const acc = accounts[user];
    if (!acc || !verifyPassword(pw, acc.salt, acc.hash)) return sendJSON(res, 401, { error: '用戶名或密碼錯' });
    const token = genToken();
    acc.token = token;          // 每次登入換 token
    saveAccounts(accounts);
    return sendJSON(res, 200, { token, balance: acc.balance, username: user });
  }

  if (p === '/api/state' && req.method === 'GET') {
    const user = url.searchParams.get('user');
    const token = url.searchParams.get('token');
    const acc = accounts[user];
    if (!acc || acc.token !== token) return sendJSON(res, 401, { error: '未登入或過期' });
    return sendJSON(res, 200, { username: user, balance: acc.balance, skin: acc.skin || 'classic' });
  }

  if (p === '/api/save' && req.method === 'POST') {
    const b = await readBody(req);
    const user = b.username;
    const token = b.token;
    const acc = accounts[user];
    if (!acc || acc.token !== token) return sendJSON(res, 401, { error: '未登入或過期' });
    const bal = Number(b.balance);
    if (!Number.isFinite(bal) || bal < 0) return sendJSON(res, 400, { error: '餘額數值有問題' });
    acc.balance = Math.floor(bal);
    saveAccounts(accounts);
    return sendJSON(res, 200, { ok: true, balance: acc.balance });
  }

  if (p === '/api/store' && req.method === 'GET') {
    return sendJSON(res, 200, STORE);
  }

  if (p === '/api/buy' && req.method === 'POST') {
    const b = await readBody(req);
    const user = b.username, token = b.token, packId = b.packId;
    const acc = accounts[user];
    if (!acc || acc.token !== token) return sendJSON(res, 401, { error: '未登入或過期' });
    const pack = STORE.chips.find((c) => c.id === packId);
    if (!pack) return sendJSON(res, 400, { error: '包唔存在' });
    // 測試下單：唔接真錢，直接加 chips（price>0 嘅包喺真錢版會先過支付）
    acc.balance = (acc.balance || 0) + pack.chips;
    saveAccounts(accounts);
    return sendJSON(res, 200, { ok: true, added: pack.chips, balance: acc.balance, note: '測試下單(未接真錢)' });
  }

  if (p === '/api/skin' && req.method === 'POST') {
    const b = await readBody(req);
    const user = b.username, token = b.token, skinId = b.skinId;
    const acc = accounts[user];
    if (!acc || acc.token !== token) return sendJSON(res, 401, { error: '未登入或過期' });
    const skin = STORE.skins.find((s) => s.id === skinId);
    if (!skin) return sendJSON(res, 400, { error: '皮膚唔存在' });
    acc.skin = skinId;
    saveAccounts(accounts);
    return sendJSON(res, 200, { ok: true, skin: skinId });
  }

  return sendJSON(res, 404, { error: 'unknown api' });
}

// ---- 靜態檔案 ----
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2'
};
function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  // 防 path traversal
  const filePath = path.normalize(path.join(ROOT, pathname));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('forbidden'); }
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('not found'); }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith('/api/')) {
    handleApi(req, res, url).catch((e) => sendJSON(res, 400, { error: String(e.message || e) }));
  } else {
    serveStatic(req, res, url);
  }
});

server.listen(PORT, () => {
  console.log(`✅ Royal Baccarat server 版跑緊： http://localhost:${PORT}`);
  console.log(`   按 Ctrl+C 停機`);
});
