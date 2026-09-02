const express = require("express");
const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const DATA_DIR = path.join(__dirname, "data");
fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, "users.sqlite");

let db;
(async () => {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      credits INTEGER NOT NULL DEFAULT 100,
      revival INTEGER NOT NULL DEFAULT 0,
      ads_watched INTEGER NOT NULL DEFAULT 0,
      last_login TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  app.listen(4500, () => {
    console.log("商業版百傢樂 server 已啟動：http://localhost:4500");
  });
})();

function saveDb() {
  const data = db.export();
  const buf = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buf);
}

function selectOne(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function selectAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
}

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "未登入" });
  const row = selectOne("SELECT s.user_id, s.expires, u.username FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=?", [token]);
  if (!row) return res.status(401).json({ error: "登入已過期" });
  if (row.expires < new Date().toISOString()) {
    run("DELETE FROM sessions WHERE token=?", [token]);
    return res.status(401).json({ error: "登入已過期" });
  }
  req.user = { id: row.user_id, username: row.username };
  next();
}

app.post("/api/register", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "缺少帳號或密碼" });
  if (username.length < 3 || username.length > 20) return res.status(400).json({ error: "帳號需 3-20 個字" });
  if (password.length < 4) return res.status(400).json({ error: "密碼至少 4 個字" });
  const hash = Buffer.from(password).toString("base64");
  try {
    run("INSERT INTO users(username,password_hash) VALUES(?,?)", [username, hash]);
  } catch (e) {
    return res.status(409).json({ error: "帳號已存在" });
  }
  const user = selectOne("SELECT * FROM users WHERE username=?", [username]);
  const token = Buffer.from(`${username}:${Date.now()}:${Math.random()}`).toString("base64");
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  run("INSERT INTO sessions(token,user_id,expires) VALUES(?,?,?)", [token, user.id, expires]);
  res.json({
    token,
    user: { id: user.id, username: user.username, credits: user.credits, revival: user.revival, ads_watched: user.ads_watched }
  });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: "缺少帳號或密碼" });
  const user = selectOne("SELECT * FROM users WHERE username=?", [username]);
  if (!user) return res.status(401).json({ error: "帳號或密碼錯誤" });
  const hash = Buffer.from(password).toString("base64");
  if (hash !== user.password_hash) return res.status(401).json({ error: "帳號或密碼錯誤" });
  const token = Buffer.from(`${username}:${Date.now()}:${Math.random()}`).toString("base64");
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  run("UPDATE users SET last_login=datetime('now','localtime') WHERE id=?", [user.id]);
  run("INSERT INTO sessions(token,user_id,expires) VALUES(?,?,?)", [token, user.id, expires]);
  res.json({
    token,
    user: { id: user.id, username: user.username, credits: user.credits, revival: user.revival, ads_watched: user.ads_watched }
  });
});

app.post("/api/logout", requireAuth, (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  run("DELETE FROM sessions WHERE token=?", [token]);
  res.json({ ok: true });
});

app.get("/api/me", requireAuth, (req, res) => {
  const user = selectOne("SELECT * FROM users WHERE id=?", [req.user.id]);
  res.json({ id: user.id, username: user.username, credits: user.credits, revival: user.revival, ads_watched: user.ads_watched, last_login: user.last_login });
});

app.post("/api/revive", requireAuth, (req, res) => {
  const user = selectOne("SELECT * FROM users WHERE id=?", [req.user.id]);
  if (user.revival >= 3) return res.status(400).json({ error: "本局已用完復活" });
  const newRevival = user.revival + 1;
  run("UPDATE users SET credits=?, revival=?, ads_watched=? WHERE id=?", [user.credits, newRevival, user.ads_watched, user.id]);
  run("INSERT INTO transactions(user_id,type,amount,note) VALUES(?,?,?,?)", [user.id, "revive", 0, `第${newRevival}次復活`]);
  res.json({ revival: newRevival, credits: user.credits });
});

app.post("/api/watch-ad", requireAuth, (req, res) => {
  const user = selectOne("SELECT * FROM users WHERE id=?", [req.user.id]);
  const reward = 50;
  const newCredits = user.credits + reward;
  const newAds = user.ads_watched + 1;
  run("UPDATE users SET credits=?, revival=?, ads_watched=? WHERE id=?", [newCredits, user.revival, newAds, user.id]);
  run("INSERT INTO transactions(user_id,type,amount,note) VALUES(?,?,?,?)", [user.id, "ad_reward", reward, "看廣告 +50"]);
  res.json({ credits: newCredits, ads_watched: newAds });
});

app.post("/api/purchase", requireAuth, (req, res) => {
  const { item } = req.body || {};
  const user = selectOne("SELECT * FROM users WHERE id=?", [req.user.id]);
  const catalog = {
    credits_500: { name: "500 籌碼", credits: 500, price: 30 },
    credits_1500: { name: "1500 籌碼", credits: 1500, price: 80 },
    revival_1: { name: "1 次復活", revival: 1, price: 20 }
  };
  const product = catalog[item];
  if (!product) return res.status(400).json({ error: "不存在的商品" });
  let newCredits = user.credits + (product.credits || 0);
  let newRevival = user.revival + (product.revival || 0);
  run("UPDATE users SET credits=?, revival=?, ads_watched=? WHERE id=?", [newCredits, newRevival, user.ads_watched, user.id]);
  run("INSERT INTO transactions(user_id,type,amount,note) VALUES(?,?,?,?)", [user.id, "purchase", product.credits || 0, product.name]);
  res.json({ credits: newCredits, revival: newRevival });
});

app.get("/api/leaderboard", (req, res) => {
  const rows = selectAll("SELECT username, credits, revival FROM users ORDER BY credits DESC LIMIT 20");
  res.json(rows);
});
