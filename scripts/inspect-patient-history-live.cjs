const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'screenshots_patient_history');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function inspectLivePatientHistory() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Login via API
  const loginRes = await fetch('https://protest.nemaai.com/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hospital_name: 'Test Hospital', email: 'admin@testenv.com', password: 'admintest' })
  });
  const loginData = await loginRes.json();

  await page.goto('https://protest.nemaai.com/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((token, hospital, email) => {
    localStorage.setItem('token', token);
    sessionStorage.setItem('hospital_name', hospital);
  }, loginData.access_token, loginData.hospital_name, loginData.email);

  await page.goto('https://protest.nemaai.com/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  console.log('On dashboard:', page.url());

  // Find the row with P011 and click View
  console.log('Finding View button for P011...');
  const clicked = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tbody tr'));
    for (const r of rows) {
      if (r.innerText.includes('P011')) {
        const viewBtn = Array.from(r.querySelectorAll('button')).find(b => b.innerText.includes('View'));
        if (viewBtn) {
          viewBtn.click();
          return true;
        }
      }
    }
    return false;
  });
  console.log('Clicked view button:', clicked);

  await new Promise(r => setTimeout(r, 3000));
  console.log('Current URL after click:', page.url());

  await page.screenshot({ path: path.join(outDir, 'live_patient_history_actual.png'), fullPage: true });

  const pageData = await page.evaluate(() => {
    const getT = (e) => e ? e.innerText.trim().replace(/\s+/g, ' ') : '';
    
    return {
      url: window.location.href,
      pathname: window.location.pathname,
      title: document.title,
      h1: Array.from(document.querySelectorAll('h1')).map(getT),
      h2: Array.from(document.querySelectorAll('h2')).map(getT),
      h3: Array.from(document.querySelectorAll('h3')).map(getT),
      buttons: Array.from(document.querySelectorAll('button')).map(b => ({
        text: getT(b),
        className: b.className
      })).filter(b => b.text),
      badges: Array.from(document.querySelectorAll('[class*="badge"], [class*="rounded-full"], [class*="pill"]')).map(b => ({
        text: getT(b),
        className: b.className
      })).filter(b => b.text && b.text.length < 60),
      table: Array.from(document.querySelectorAll('table')).map(t => ({
        th: Array.from(t.querySelectorAll('th')).map(getT),
        trCount: t.querySelectorAll('tbody tr').length,
        rows: Array.from(t.querySelectorAll('tbody tr')).slice(0, 5).map(r => 
          Array.from(r.querySelectorAll('td')).map(getT)
        )
      })),
      bodySnippet: document.body.innerText.slice(0, 2500).replace(/\s+/g, ' ')
    };
  });

  fs.writeFileSync(path.join(__dirname, 'live_patient_history_actual.json'), JSON.stringify(pageData, null, 2));
  console.log('Saved actual live patient history details.');

  await browser.close();
}

inspectLivePatientHistory().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
