const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('https://protest.nemaai.com/login', { waitUntil: 'networkidle2' });
  await page.type('input[placeholder="Enter hospital name"]', 'Test Hospital');
  await page.type('input[type="email"]', 'admin@testenv.com');
  await page.type('input[type="password"]', 'admintest');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  console.log('Logged in, current URL:', page.url());
  await page.goto('https://protest.nemaai.com/settings', { waitUntil: 'networkidle2' });
  console.log('Navigated to settings, current URL:', page.url());

  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Live Settings Body Text Snippet:\n', bodyText.slice(0, 1000));

  await browser.close();
})();
