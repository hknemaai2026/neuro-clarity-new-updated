const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('https://protest.nemaai.com/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'admin@testenv.com');
  await page.type('input[type="password"]', 'admintest');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
    page.click('button[type="submit"]'),
  ]);

  console.log('Logged in to live. Navigating directly to report...');
  await page.goto('https://protest.nemaai.com/report/5d728f93-86db-4a76-905f-4b7ff920851d', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));

  const text = await page.evaluate(() => document.body.innerText);
  console.log('Live page text snippet (first 1000 chars):');
  console.log(text.slice(0, 1000));
  await browser.close();
})();
