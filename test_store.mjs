// 一次性測試 server 嘅商店 API（零依賴，用 node:test）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';

const PORT = 6123;
const BASE = `http://localhost:${PORT}`;

// 用一個乾淨 data 目錄，避免影響你個 accounts.json
process.env.PORT = String(PORT);
process.env.DATA_DIR = '/tmp/rb_test_data';

const srv = spawn(process.execPath, ['server.js'], {
  cwd: process.cwd(),
  env: { ...process.env },
  stdio: ['ignore', 'pipe', 'pipe']
});

function waitReady() {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('server 未起好')), 5000);
    srv.stdout.on('data', (b) => {
      if (b.toString().includes('跑緊')) { clearTimeout(t); resolve(); }
    });
    srv.stderr.on('data', (b) => process.stderr.write(b));
  });
}
async function jpost(path, body) {
  const r = await fetch(BASE + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { code: r.status, j: await r.json() };
}
async function jget(path) {
  const r = await fetch(BASE + path);
  return { code: r.status, j: await r.json() };
}

test('store API 流程', async () => {
  await waitReady();
  // 1. 目錄
  const store = await jget('/api/store');
  assert.equal(store.code, 200);
  assert.ok(store.j.chips.length >= 3, '有 chips 包');
  assert.ok(store.j.skins.length >= 3, '有皮膚');

  // 2. 註冊
  const reg = await jpost('/api/register', { username: 'shoptest', password: '1234' });
  assert.equal(reg.code, 200);
  const token = reg.j.token;

  // 3. 買豪客包 c3 (+1,000,000)
  const buy = await jpost('/api/buy', { username: 'shoptest', token, packId: 'c3' });
  assert.equal(buy.code, 200);
  assert.equal(buy.j.added, 1000000);
  assert.equal(buy.j.balance, 50000 + 1000000);

  // 4. state 帶 skin
  const st = await jget(`/api/state?user=shoptest&token=${token}`);
  assert.equal(st.j.balance, 1050000);
  assert.equal(st.j.skin, 'classic');

  // 5. 揀 neon 皮膚
  const skin = await jpost('/api/skin', { username: 'shoptest', token, skinId: 'neon' });
  assert.equal(skin.code, 200);
  const st2 = await jget(`/api/state?user=shoptest&token=${token}`);
  assert.equal(st2.j.skin, 'neon');

  // 6. 買錯包 error
  const bad = await jpost('/api/buy', { username: 'shoptest', token, packId: 'zzz' });
  assert.equal(bad.code, 400);

  // 7. 錯 token 擋
  const badTok = await jget(`/api/state?user=shoptest&token=BAD`);
  assert.equal(badTok.code, 401);
});

// 收尾
process.on('exit', () => { try { srv.kill(); } catch (e) {} try { rmSync('/tmp/rb_test_data', { recursive: true, force: true }); } catch (e) {} });
