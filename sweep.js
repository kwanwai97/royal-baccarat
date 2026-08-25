const puppeteer = require('puppeteer-core');
const path = require('path');

const widths = [
  [600,300],[700,380],[800,380],[844,390],[932,430],
  [1024,500],[1200,560],[1280,600]
];

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox','--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  const fileUrl = 'file://' + path.resolve(__dirname, 'index.html');

  for (const [w,h] of widths){
    await page.setViewport({ width:w, height:h, isMobile:false, hasTouch:false });
    await page.goto(fileUrl, { waitUntil:'load' });
    const d = await page.evaluate(() => {
      function r(sel){ const e=document.querySelector(sel); if(!e) return null; const b=e.getBoundingClientRect(); return {l:Math.round(b.left),r:Math.round(b.right),w:Math.round(b.width)}; }
      const fl=r('.follow-left'), pr=r('.pred-system'), fr=r('.follow-right'), tr=r('.topright');
      return {fl,pr,fr,tr};
    });
    const gapFL_FR = d.fr.l - d.fl.r;
    const gapPR_FR = d.fr.l - d.pr.r;
    console.log(`W=${w}x${h} | fl.r=${d.fl.r} pr.r=${d.pr.r} fr.l=${d.fr.l} fr.r=${d.fr.r} tr.l=${d.tr.l} | GAP(fl->fr)=${gapFL_FR} GAP(pred->fr)=${gapPR_FR}`);
  }
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
