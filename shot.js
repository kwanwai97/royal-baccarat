const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    args: ['--no-sandbox','--disable-setuid-sandbox','--force-device-scale-factor=1']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 932, height: 430, deviceScaleFactor: 1 });
  const fileUrl = 'file://' + path.resolve(__dirname, 'index.html');
  await page.goto(fileUrl, { waitUntil:'networkidle0' });

  // 只截預測系統區塊 (follow-left) 連跟注區做對比
  const el = await page.$('.follow-left');
  await el.screenshot({ path: 'shot_followleft.png' });
  // 全頁頂部
  await page.screenshot({ path: 'shot_top.png', clip:{x:0,y:0,width:932,height:110} });
  console.log('shots saved');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
