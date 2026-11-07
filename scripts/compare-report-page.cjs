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

  const resultId = '5d728f93-86db-4a76-905f-4b7ff920851d';

  async function inspectReport(baseUrl, screenshotName) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1200 });

    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.evaluate((token, hospital) => {
      localStorage.setItem('token', token);
      sessionStorage.setItem('hospital_name', hospital);
    }, loginData.access_token, loginData.hospital_name);

    const reportUrl = `${baseUrl.replace(/\/$/, '')}/report/${resultId}`;
    console.log(`Navigating to ${reportUrl}...`);
    await page.goto(reportUrl, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));

    console.log('Page URL:', page.url());
    await page.screenshot({ path: `scripts/${screenshotName}`, fullPage: true });

    const data = await page.evaluate(() => {
      const h1 = Array.from(document.querySelectorAll('h1')).map(h => h.innerText.trim());
      const h2 = Array.from(document.querySelectorAll('h2')).map(h => h.innerText.trim());
      const h3 = Array.from(document.querySelectorAll('h3')).map(h => h.innerText.trim());
      const badges = Array.from(document.querySelectorAll('[class*="badge"], [class*="Badge"]')).map(b => b.innerText.trim());
      const buttons = Array.from(document.querySelectorAll('button, a[class*="btn"], a[role="button"]')).map(b => b.innerText.trim().replace(/\s+/g, ' ')).filter(Boolean);
      const text = document.body.innerText.replace(/\s+/g, ' ');
      return { h1, h2, h3, badges, buttons, textSnippet: text.slice(0, 1500), fullTextLength: text.length };
    });

    await page.close();
    return data;
  }

  console.log('Scraping Live Report...');
  const live = await inspectReport('https://protest.nemaai.com', 'live_report_5d728.png');

  console.log('Scraping Local Report...');
  const local = await inspectReport('http://localhost:8080', 'local_report_5d728.png');

  console.log('\n=== REPORT COMPARISON ===');
  console.log('H1:');
  console.log('  Live: ', live.h1);
  console.log('  Local:', local.h1);

  console.log('\nH2:');
  console.log('  Live: ', live.h2);
  console.log('  Local:', local.h2);

  console.log('\nH3:');
  console.log('  Live: ', live.h3);
  console.log('  Local:', local.h3);

  console.log('\nButtons:');
  console.log('  Live: ', live.buttons);
  console.log('  Local:', local.buttons);

  console.log('\nFull text length: Live =', live.fullTextLength, ', Local =', local.fullTextLength);
  console.log('\nLive Text Snippet:\n', live.textSnippet);
  console.log('\nLocal Text Snippet:\n', local.textSnippet);

  await browser.close();
})();
