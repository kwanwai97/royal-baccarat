const puppeteer = require('puppeteer-core');
const path = require('path');

const cases = [
  ['iPhoneSE-L', 667, 375, 2],
  ['iPhone13-L', 844, 390, 3],
  ['Android-L', 740, 360, 2],
  ['small-L', 568, 320, 2],
];

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox','--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  const fileUrl = 'file://' + path.resolve(__dirname, 'index.html');

  for (const [name,w,h,dpr] of cases){
    await page.setViewport({ width:w, height:h, deviceScaleFactor:dpr, isMobile:true, hasTouch:true });
    await page.goto(fileUrl, { waitUntil:'load' });
    const d = await page.evaluate(() => {
      function r(sel){ const e=document.querySelector(sel); if(!e) return null; const b=e.getBoundingClientRect(); return {l:Math.round(b.left),r:Math.round(b.right),w:Math.round(b.width)}; }
      return {
        pred: r('.pred-system'),
        fl: r('.follow-left'),
        fr: r('.follow-right'),
        btn: r('#btnFollowPredict2'),
        tr: r('.topright'),
      };
    });
    const gap = d.btn.l - d.pred.r;
    console.log(`${name} ${w}x${h}@${dpr}: pred.r=${d.pred.r} btn.l=${d.btn.l} GAP=${gap} | fr.l=${d.fr.l} fr.r=${d.fr.r} tr.l=${d.tr.l}`);
  }
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
