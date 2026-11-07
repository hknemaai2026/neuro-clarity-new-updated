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

  // 1. Live page
  const pageLive = await browser.newPage();
  await pageLive.setViewport({ width: 1440, height: 1200 });
  await pageLive.goto('https://protest.nemaai.com/', { waitUntil: 'domcontentloaded' });
  await pageLive.evaluate((token, hospital) => {
    localStorage.setItem('token', token);
    sessionStorage.setItem('hospital_name', hospital);
  }, loginData.access_token, loginData.hospital_name);

  // Navigate on live
  await pageLive.goto('https://protest.nemaai.com/', { waitUntil: 'networkidle2' });
  await pageLive.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tbody tr'));
    const test1Row = rows.find(r => r.innerText.includes('Test1'));
    if (test1Row) {
      const viewBtn = Array.from(test1Row.querySelectorAll('button')).find(b => b.innerText.includes('View'));
      if (viewBtn) viewBtn.click();
    }
  });
  await new Promise(r => setTimeout(r, 2000));
  await pageLive.evaluate(() => {
    const tr = document.querySelector('table tbody tr');
    if (tr) {
      const eyeBtn = Array.from(tr.querySelectorAll('button')).find(b => b.getAttribute('title')?.toLowerCase().includes('report') || b.innerText.includes('Report'));
      if (eyeBtn) eyeBtn.click();
    }
  });
  await new Promise(r => setTimeout(r, 3000));
  const liveText = await pageLive.evaluate(() => document.body.innerText.trim());
  await pageLive.screenshot({ path: 'scripts/live_report_comparison.png', fullPage: true });

  // 2. Local page
  const pageLocal = await browser.newPage();
  await pageLocal.setViewport({ width: 1440, height: 1200 });
  await pageLocal.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded' });
  await pageLocal.evaluate((token, hospital) => {
    localStorage.setItem('token', token);
    sessionStorage.setItem('hospital_name', hospital);
  }, loginData.access_token, loginData.hospital_name);

  await pageLocal.goto('http://localhost:8080/report/5d728f93-86db-4a76-905f-4b7ff920851d', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));
  const localText = await pageLocal.evaluate(() => document.body.innerText.trim());
  await pageLocal.screenshot({ path: 'scripts/local_report_comparison.png', fullPage: true });

  console.log('--- LENGTHS ---');
  console.log('Live Text Length:', liveText.length);
  console.log('Local Text Length:', localText.length);

  if (liveText === localText) {
    console.log('PERFECT 100% MATCH! Both pages have identical text content!');
  } else {
    console.log('Differences detected:');
    const liveLines = liveText.split('\n');
    const localLines = localText.split('\n');
    console.log(`Live lines: ${liveLines.length}, Local lines: ${localLines.length}`);
    for (let i = 0; i < Math.max(liveLines.length, localLines.length); i++) {
      if (liveLines[i] !== localLines[i]) {
        console.log(`Line ${i + 1} diff:`);
        console.log(`  Live:  ${JSON.stringify(liveLines[i])}`);
        console.log(`  Local: ${JSON.stringify(localLines[i])}`);
        break;
      }
    }
  }

  await browser.close();
})();
