const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox','--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 932, height: 430 });
  const fileUrl = 'file://' + path.resolve(__dirname, 'index.html');
  await page.goto(fileUrl, { waitUntil:'networkidle0' });

  const d = await page.evaluate(() => {
    function r(sel){ const e=document.querySelector(sel); if(!e) return null; const b=e.getBoundingClientRect(); return {l:Math.round(b.left),r:Math.round(b.right),w:Math.round(b.width)}; }
    return {
      predSystem: r('.pred-system'),
      followRight: r('.follow-right'),
      firstBtn: r('#btnFollowPredict2'),
      lastBtn: r('#btnLeaderboard'),
      topright: r('.topright'),
      frJustify: getComputedStyle(document.querySelector('.follow-right')).justifyContent,
    };
  });
  console.log(JSON.stringify(d,null,2));
  console.log('GAP predSystem.right -> firstBtn.left =', d.firstBtn.l - d.predSystem.r, '(左邊空位)');
  console.log('GAP lastBtn.right -> topright.left =', d.topright.l - d.lastBtn.r, '(右邊空位)');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
