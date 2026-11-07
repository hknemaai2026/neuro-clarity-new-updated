const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,1200']
  });

  const loginRes = await fetch('https://protest.nemaai.com/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hospital_name: 'Test Hospital', email: 'admin@testenv.com', password: 'admintest' })
  });
  const loginData = await loginRes.json();

  const setupPage = async (url) => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1200 });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.evaluate((token, hospital) => {
      localStorage.setItem('token', token);
      sessionStorage.setItem('hospital_name', hospital);
    }, loginData.access_token, loginData.hospital_name);
    return page;
  };

  console.log('Testing live: https://protest.nemaai.com/admin-keys');
  const pageLive = await setupPage('https://protest.nemaai.com/');
  const resLive = await pageLive.goto('https://protest.nemaai.com/admin-keys', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  const liveUrl = pageLive.url();
  const liveTitle = await pageLive.title();
  const liveText = await pageLive.evaluate(() => document.body.innerText);
  console.log('Live Final URL:', liveUrl);
  console.log('Live Title:', liveTitle);
  console.log('Live Text (first 500 chars):\n', liveText.slice(0, 500));
  await pageLive.screenshot({ path: 'scripts/live_admin_keys.png', fullPage: true });

  console.log('\nTesting local: http://localhost:8080/admin-keys');
  const pageLocal = await setupPage('http://localhost:8080/');
  const resLocal = await pageLocal.goto('http://localhost:8080/admin-keys', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  const localUrl = pageLocal.url();
  const localTitle = await pageLocal.title();
  const localText = await pageLocal.evaluate(() => document.body.innerText);
  console.log('Local Final URL:', localUrl);
  console.log('Local Title:', localTitle);
  console.log('Local Text (first 500 chars):\n', localText.slice(0, 500));
  await pageLocal.screenshot({ path: 'scripts/local_admin_keys.png', fullPage: true });

  await browser.close();
})();
