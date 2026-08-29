const puppeteer = require('puppeteer-core');
(async () => {
  const browser = await puppeteer.launch({ headless:'new', executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERR: '+String(e)));
  page.on('console', m => { if(m.type()==='error') errs.push('CONSOLE: '+m.text()); });
  try {
    await page.goto('https://kwanwai97.github.io/royal-baccarat/index.html?v=20', { waitUntil:'domcontentloaded', timeout:20000 });
    // 等 JS 跑完 + 睇有冇凍結
    await new Promise(r=>setTimeout(r,2500));
    const info = await page.evaluate(() => {
      const h = document.querySelector('.road-header');
      return {
        title: document.title,
        hasHeader: !!h,
        muteOk: !!document.getElementById('btnMute'),
        bodyLen: document.body ? document.body.innerHTML.length : 0
      };
    });
    console.log('線上載入成功:', JSON.stringify(info));
    console.log('錯誤:', errs.length? errs : 'none');
  } catch(e) {
    console.log('線上載入失敗/凍結:', String(e));
    console.log('錯誤:', errs.length? errs : 'none');
  }
  await browser.close();
})();
