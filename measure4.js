const puppeteer = require('puppeteer-core');
const path = require('path');
const fileUrl = 'file://' + path.resolve('index.html');
(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  });
  const page = await browser.newPage();
  const sizes = [[900,500],[932,430],[844,390],[740,360],[667,375],[568,320]];
  for (const [w,h] of sizes) {
    await page.setViewport({ width:w, height:h, isLandscape:true });
    await page.goto(fileUrl, { waitUntil:'networkidle0' });
    await new Promise(r=>setTimeout(r,400)); // 等 placeTopBtns 跑完
    const out = await page.evaluate(() => {
      const r = el => { const b=el.getBoundingClientRect(); return {l:Math.round(b.left),r:Math.round(b.right)}; };
      const brand = document.querySelector('.brand');
      const fl = document.querySelector('.follow-left');
      const fr = document.querySelector('.follow-right');
      const tr = document.querySelector('.topright');
      const app = document.querySelector('.app');
      return {
        appPadLeft: getComputedStyle(app).paddingLeft,
        appPadRight: getComputedStyle(app).paddingRight,
        appColGap: getComputedStyle(app).columnGap,
        brand: r(brand), fl: r(fl), fr: r(fr), tr: r(tr),
        appLeft: Math.round(app.getBoundingClientRect().left),
        appRight: Math.round(app.getBoundingClientRect().right)
      };
    });
    const g1 = out.fl.l - out.brand.r;          // zone1→2 距
    const g2 = out.fr.l - out.fl.r;             // zone2→3 距
    const g3 = out.tr.l - out.fr.r;             // zone3→4 距
    const leftPad = out.brand.l - out.appLeft;  // 最左留白（應=3px app padding）
    const rightPad = out.appRight - out.tr.r;   // 最右留白
    console.log(`[${w}x${h}] colGap=${out.appColGap} padL=${out.appPadLeft} padR=${out.appPadRight} | zone1→2=${g1} zone2→3=${g2} zone3→4=${g3} | leftPad=${leftPad} rightPad=${rightPad}`);
  }
  await browser.close();
})();
