// 一次性測試廣告 API（零依賴）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';

const PORT = 6124;
const BASE = `http://localhost:${PORT}`;
process.env.PORT = String(PORT);
process.env.DATA_DIR = '/tmp/rb_test_ads';

const srv = spawn(process.execPath, ['server.js'], { cwd: process.cwd(), env: { ...process.env }, stdio: ['ignore', 'pipe', 'pipe'] });

function waitReady() {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('server 未起好')), 5000);
    srv.stdout.on('data', (b) => { if (b.toString().includes('跑緊')) { clearTimeout(t); resolve(); } });
    srv.stderr.on('data', (b) => process.stderr.write(b));
  });
}
async function jpost(p, body) { const r = await fetch(BASE + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return { code: r.status, j: await r.json() }; }
async function jget(p) { const r = await fetch(BASE + p); return { code: r.status, j: await r.json() }; }

test('ads API 流程', async () => {
  await waitReady();
  // 1. 廣告目錄
  const ads = await jget('/api/ads');
  assert.equal(ads.code, 200);
  assert.ok(ads.j.banners.length >= 1, '有 banner');
  assert.ok(ads.j.reward && ads.j.reward.chips > 0, '有睇廣告送 chips');

  // 2. 註冊
  const reg = await jpost('/api/register', { username: 'adtest', password: '1234' });
  assert.equal(reg.code, 200);
  const token = reg.j.token;

  // 3. 第一次領取
  const c1 = await jpost('/api/ad-claim', { username: 'adtest', token });
  assert.equal(c1.code, 200);
  assert.equal(c1.j.added, ads.j.reward.chips);
  assert.equal(c1.j.balance, 50000 + ads.j.reward.chips);

  // 4. 冷卻中再領(應 429)
  const c2 = await jpost('/api/ad-claim', { username: 'adtest', token });
  assert.equal(c2.code, 429);
  assert.ok(c2.j.left > 0, '有剩餘秒數');

  // 5. 錯 token 擋
  const bad = await jpost('/api/ad-claim', { username: 'adtest', token: 'BAD' });
  assert.equal(bad.code, 401);
});

process.on('exit', () => { try { srv.kill(); } catch (e) {} try { rmSync('/tmp/rb_test_ads', { recursive: true, force: true }); } catch (e) {} });
