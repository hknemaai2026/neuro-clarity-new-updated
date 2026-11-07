const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('https://protest.nemaai.com/login', { waitUntil: 'networkidle2' });

  // Click hospital
  await page.click('button#hospital');
  await new Promise(r => setTimeout(r, 600));
  const options = await page.$$('[role="option"]');
  for (const opt of options) {
    const text = await opt.evaluate(e => e.innerText);
    if (text.includes('Test Hospital')) {
      await opt.click();
      break;
    }
  }

  await page.type('#email', 'admin@testenv.com');
  await page.type('#password', 'admintest');
  await page.click('button[type="submit"]');

  await new Promise(r => setTimeout(r, 4000));
  console.log('Logged in URL:', page.url());

  // Click EEG Insights
  const links = await page.$$('aside a, nav a, a');
  for (const a of links) {
    const text = await a.evaluate(e => e.innerText);
    if (text.includes('EEG Insights')) {
      console.log('Found link:', text, 'Clicking...');
      await a.click();
      break;
    }
  }

  await new Promise(r => setTimeout(r, 2000));
  console.log('Current URL after click:', page.url());

  // Check what h1 or header is visible
  const heading = await page.$eval('h1, h2', el => el.innerText).catch(() => 'none');
  console.log('Heading on page:', heading);

  await browser.close();
})();
