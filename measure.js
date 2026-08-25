const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox','--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 500, isMobile: false, hasTouch: false });
  const fileUrl = 'file://' + path.resolve(__dirname, 'index.html');
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  const data = await page.evaluate(() => {
    function rect(sel){
      const el = document.querySelector(sel);
      if(!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        sel,
        left: Math.round(r.left), top: Math.round(r.top),
        right: Math.round(r.right), bottom: Math.round(r.bottom),
        width: Math.round(r.width), height: Math.round(r.height),
        display: cs.display,
      };
    }
    const app = document.querySelector('.app').getBoundingClientRect();
    return {
      app: { left:Math.round(app.left), right:Math.round(app.right), width:Math.round(app.width), top:Math.round(app.top) },
      followLeft: rect('.follow-left'),
      predSystem: rect('.pred-system'),
      followRight: rect('.follow-right'),
      topright: rect('.topright'),
      brand: rect('.brand'),
    };
  });

  console.log('VIEWPORT 900x500 (landscape)');
  console.log('app:', JSON.stringify(data.app));
  console.log('brand    :', JSON.stringify(data.brand));
  console.log('followLeft:', JSON.stringify(data.followLeft));
  console.log('predSystem:', JSON.stringify(data.predSystem));
  console.log('followRight:', JSON.stringify(data.followRight));
  console.log('topright :', JSON.stringify(data.topright));

  // 計算 gap
  if(data.followLeft && data.followRight){
    console.log('GAP followLeft.right -> followRight.left =', data.followRight.left - data.followLeft.right);
  }
  if(data.predSystem && data.followRight){
    console.log('GAP predSystem.right -> followRight.left =', data.followRight.left - data.predSystem.right);
  }
  if(data.followRight && data.topright){
    console.log('GAP followRight.right -> topright.left =', data.topright.left - data.followRight.right);
  }
  if(data.app && data.followLeft){
    console.log('followLeft left margin from app left =', data.followLeft.left - data.app.left);
  }
  if(data.app && data.topright){
    console.log('topright right margin to app right =', data.app.right - data.topright.right);
  }

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
