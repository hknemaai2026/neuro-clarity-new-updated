const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,1200']
  });

  const pLive = await browser.newPage();
  await pLive.setViewport({ width: 1440, height: 1200 });
  await pLive.goto('https://protest.nemaai.com/admin-keys', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  await pLive.screenshot({ path: 'scripts/live_admin_keys.png' });

  const pLocal = await browser.newPage();
  await pLocal.setViewport({ width: 1440, height: 1200 });
  await pLocal.goto('http://localhost:8080/admin-keys', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  await pLocal.screenshot({ path: 'scripts/local_admin_keys.png' });

  console.log('Screenshots captured successfully!');
  await browser.close();
})();
