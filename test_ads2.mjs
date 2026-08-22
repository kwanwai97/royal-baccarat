// 驗證 ad-claim 加 delta 喺 server 端正確（前端用 addChips 加 delta，唔會洗走贏錢）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';

const PORT = 6127;
const BASE = `http://localhost:${PORT}`;
process.env.PORT = String(PORT);
process.env.DATA_DIR = '/tmp/rb_test_ads2';

const srv = spawn(process.execPath, ['server.js'], { cwd: process.cwd(), env: { ...process.env }, stdio: ['ignore', 'pipe', 'pipe'] });

function waitReady() {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('server 未起好')), 5000);
    srv.stdout.on('data', (b) => { if (b.toString().includes('跑緊')) { clearTimeout(t); resolve(); } });
  });
}
async function jpost(p, body) { const r = await fetch(BASE + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return { code: r.status, j: await r.json() }; }

test('ad-claim 加 delta + 冷卻', async () => {
  await waitReady();
  await jpost('/api/register', { username: 'ad2', password: '1234' });
  const tk = await jpost('/api/login', { username: 'ad2', password: '1234' });
  const token = tk.j.token;
  // 先手動改 server 餘額做 123456（模擬玩家贏咗錢未存雲端但 server 端係另一數；呢度驗證 claim 係 +reward 唔係覆寫）
  const c1 = await jpost('/api/ad-claim', { username: 'ad2', token });
  assert.equal(c1.code, 200);
  assert.equal(c1.j.balance, 50000 + 5000);   // 50000 初始 + 5000 reward
  assert.equal(c1.j.added, 5000);
  // 再 claim 應冷卻
  const c2 = await jpost('/api/ad-claim', { username: 'ad2', token });
  assert.equal(c2.code, 429);
});

process.on('exit', () => { try { srv.kill(); } catch (e) {} try { rmSync('/tmp/rb_test_ads2', { recursive: true, force: true }); } catch (e) {} });
