const puppeteer = require('puppeteer-core');
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const fileUrl = 'file:///C:/Users/wai/royal-baccarat/index.html?v=local';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  async function measure(w, h, label) {
    await page.setViewport({ width: w, height: h, isMobile: true, hasTouch: true });
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    const data = await page.evaluate(() => {
      const pick = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return { x: Math.round(r.x), right: Math.round(r.right), mr: cs.marginRight };
      };
      const title = document.querySelector('.road-section-title');
      const tr = title ? title.getBoundingClientRect() : null;
      return {
        vw: window.innerWidth,
        大路x: tr ? Math.round(tr.x) : null,
        剩張: pick('#shoeInfo'),
        開牌: pick('#btnDealMode'),
        五圖案: pick('#followIconsHeader')
      };
    });
    console.log('==== ' + label + ' (vw=' + data.vw + ') ====');
    console.log('大路x  :', data.大路x, '(應保持不變)');
    console.log('剩張   :', JSON.stringify(data.剩張));
    console.log('開牌   :', JSON.stringify(data.開牌));
    console.log('五圖案 :', JSON.stringify(data.五圖案));
  }

  await measure(390, 844, '直版 portrait  (期望 margin-right=15px)');
  await measure(844, 390, '橫版 landscape (期望 margin-right=65px)');
  await browser.close();
})();
