const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'screenshots_dashboard');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function inspectLocalDashboard() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Login via live API
  const loginRes = await fetch('https://protest.nemaai.com/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hospital_name: 'Test Hospital', email: 'admin@testenv.com', password: 'admintest' })
  });
  const loginData = await loginRes.json();

  await page.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((token, hospital, email) => {
    localStorage.setItem('token', token);
    sessionStorage.setItem('hospital_name', hospital);
  }, loginData.access_token, loginData.hospital_name, loginData.email);

  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));

  console.log('Current URL on local:', page.url());

  await page.screenshot({ path: path.join(outDir, 'local_dashboard_actual.png'), fullPage: true });

  const pageData = await page.evaluate(() => {
    const getT = (e) => e ? e.innerText.trim().replace(/\s+/g, ' ') : '';
    
    return {
      url: window.location.href,
      pathname: window.location.pathname,
      title: document.title,
      h1: Array.from(document.querySelectorAll('h1')).map(getT),
      h2: Array.from(document.querySelectorAll('h2')).map(getT),
      h3: Array.from(document.querySelectorAll('h3')).map(getT),
      h4: Array.from(document.querySelectorAll('h4')).map(getT),
      buttons: Array.from(document.querySelectorAll('button')).map(b => ({
        text: getT(b),
        className: b.className
      })).filter(b => b.text.length > 0),
      inputs: Array.from(document.querySelectorAll('input')).map(i => ({
        type: i.type,
        placeholder: i.placeholder,
        name: i.name,
        id: i.id,
        className: i.className
      })),
      labels: Array.from(document.querySelectorAll('label')).map(getT),
      badges: Array.from(document.querySelectorAll('.inline-flex.items-center.rounded-full, [class*="rounded-full"]')).map(b => ({
        text: getT(b),
        className: b.className
      })).filter(b => b.text),
      statCards: Array.from(document.querySelectorAll('.stats-card, [class*="stats-card"], .clinical-card')).map(c => ({
        text: getT(c),
        classes: c.className
      })).slice(0, 10),
      tableHeaders: Array.from(document.querySelectorAll('th')).map(getT),
      tableRowsCount: document.querySelectorAll('tbody tr').length,
      sampleRows: Array.from(document.querySelectorAll('tbody tr')).slice(0, 5).map(tr => getT(tr)),
      bodySnippet: document.body.innerText.replace(/\s+/g, ' ').slice(0, 3000)
    };
  });

  fs.writeFileSync(path.join(__dirname, 'local_dashboard_actual.json'), JSON.stringify(pageData, null, 2));
  console.log('Saved scripts/local_dashboard_actual.json');

  await browser.close();
}

inspectLocalDashboard().catch(err => {
  console.error('Local inspect error:', err);
  process.exit(1);
});
