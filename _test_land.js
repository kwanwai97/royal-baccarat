const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({ headless:'new', executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERR: '+String(e)));
  page.on('console', m => { if(m.type()==='error') errs.push('CONSOLE: '+m.text()); });
  await page.setViewport({ width:844, height:390, isMobile:false, hasTouch:false });
  await page.goto('file:///C:/Users/wai/royal-baccarat/index.html', { waitUntil:'networkidle0' });
  await new Promise(r=>setTimeout(r,800));
  const info = await page.evaluate(() => {
    const h = document.querySelector('.road-header, #roadTools');
    const hdr = document.querySelector('.roadpanel > div');
    const kids = hdr ? [...hdr.children].map(e=>({id:e.id||e.className, left:Math.round(e.getBoundingClientRect().left), right:Math.round(e.getBoundingClientRect().right)})) : [];
    return { headerKids: kids, vw: window.innerWidth };
  });
  console.log('橫版 header kids:', JSON.stringify(info.headerKids));
  console.log('vw:', info.vw);
  console.log('errs:', errs.length? errs : 'none');
  await page.screenshot({ path:'C:/Users/wai/royal-baccarat/_test_land.png' });
  await browser.close();
})();
