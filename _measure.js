const puppeteer = require('puppeteer-core');
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  async function measure(w, h, label) {
    await page.setViewport({ width: w, height: h, isMobile: true, hasTouch: true });
    await page.goto('https://kwanwai97.github.io/royal-baccarat/?v=measure', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));
    const data = await page.evaluate(() => {
      const pick = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), right: Math.round(r.right), w: Math.round(r.width) };
      };
      const header = document.querySelector('.road-header');
      const hr = header ? header.getBoundingClientRect() : null;
      return {
        vw: window.innerWidth,
        headerRight: hr ? Math.round(hr.right) : null,
        headerX: hr ? Math.round(hr.x) : null,
        大路: pick('.road-section-title'),
        剩張: pick('#shoeInfo'),
        開牌: pick('#btnDealMode'),
        五圖案: pick('#followIconsHeader'),
        mute: pick('#btnMute')
      };
    });
    console.log('==== ' + label + ' (vw=' + data.vw + ') ====');
    console.log('road-header: x=' + data.headerX + ' right=' + data.headerRight);
    console.log('大路   :', JSON.stringify(data.大路));
    console.log('剩張   :', JSON.stringify(data.剩張));
    console.log('開牌   :', JSON.stringify(data.開牌));
    console.log('五圖案 :', JSON.stringify(data.五圖案));
    console.log('mute   :', JSON.stringify(data.mute));
  }

  await measure(390, 844, '直版 portrait');
  await measure(844, 390, '橫版 landscape');
  await browser.close();
})();
