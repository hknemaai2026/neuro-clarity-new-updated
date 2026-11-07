const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'screenshots_upload');

async function testUploadWorkflow(targetUrl, label) {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900', '--disable-web-security']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Login
  const loginRes = await fetch('https://protest.nemaai.com/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hospital_name: 'Test Hospital', email: 'admin@testenv.com', password: 'admintest' })
  });
  const loginData = await loginRes.json();

  await page.goto(targetUrl + '/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((token, hospital) => {
    localStorage.setItem('token', token);
    sessionStorage.setItem('hospital_name', hospital);
  }, loginData.access_token, loginData.hospital_name);

  // Navigate to /upload via sidebar or URL
  await page.goto(targetUrl + '/', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const link = Array.from(document.querySelectorAll('a, button')).find(l => l.innerText.includes('EEG Insights') || l.getAttribute('href') === '/upload');
    if (link) link.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  console.log(`[${label}] Current URL on Step 1:`, page.url());

  // Click on "EEG Cognitive Screening" card
  await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div')).filter(d => d.innerText.includes('EEG Cognitive Screening') && d.className.includes('rounded-xl'));
    if (cards.length) cards[0].click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Click Continue
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('Continue'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const step2Data = await page.evaluate(() => {
    const getT = (e) => e ? e.innerText.trim().replace(/\s+/g, ' ') : '';
    return {
      h2: Array.from(document.querySelectorAll('h2')).map(getT),
      badge: Array.from(document.querySelectorAll('[class*="rounded-full"]')).map(getT).filter(t => t.includes('Step')),
      patientsCount: document.querySelectorAll('.space-y-2.max-h-72 > div').length
    };
  });
  console.log(`[${label}] Step 2 State:`, step2Data);
  await page.screenshot({ path: path.join(outDir, `${label}_step2.png`), fullPage: true });

  // In Step 2, click the first patient card
  await page.evaluate(() => {
    const card = document.querySelector('.space-y-2.max-h-72 > div');
    if (card) card.click();
  });
  await new Promise(r => setTimeout(r, 500));

  // Click Continue to go to Step 3
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('Continue'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const step3Data = await page.evaluate(() => {
    const getT = (e) => e ? e.innerText.trim().replace(/\s+/g, ' ') : '';
    return {
      h2: Array.from(document.querySelectorAll('h2')).map(getT),
      badge: Array.from(document.querySelectorAll('[class*="rounded-full"]')).map(getT).filter(t => t.includes('Step')),
      labels: Array.from(document.querySelectorAll('label')).map(getT)
    };
  });
  console.log(`[${label}] Step 3 State:`, step3Data);
  await page.screenshot({ path: path.join(outDir, `${label}_step3.png`), fullPage: true });

  await browser.close();
  return { step2Data, step3Data };
}

(async () => {
  console.log('Testing Live Upload workflow...');
  const liveRes = await testUploadWorkflow('https://protest.nemaai.com', 'live');
  console.log('\nTesting Local Upload workflow...');
  const localRes = await testUploadWorkflow('http://localhost:8080', 'local');

  console.log('\n=== STEP 2 & 3 COMPARISON ===');
  console.log('Step 2 H2 Match:', JSON.stringify(localRes.step2Data.h2) === JSON.stringify(liveRes.step2Data.h2));
  console.log('Step 2 Badge Match:', JSON.stringify(localRes.step2Data.badge) === JSON.stringify(liveRes.step2Data.badge));
  console.log('Step 3 H2 Match:', JSON.stringify(localRes.step3Data.h2) === JSON.stringify(liveRes.step3Data.h2));
  console.log('Step 3 Badge Match:', JSON.stringify(localRes.step3Data.badge) === JSON.stringify(liveRes.step3Data.badge));
  console.log('Step 3 Labels Match:', JSON.stringify(localRes.step3Data.labels) === JSON.stringify(liveRes.step3Data.labels));
})();
