const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const PORT = 4174;
const DIST = path.join(__dirname, '..', 'dist');

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';

  let filePath = path.join(DIST, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    const indexPath = path.join(DIST, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(indexPath).pipe(res);
  }
});

async function run() {
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`Local test server running at http://localhost:${PORT}/`);

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900', '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Authenticate
  const loginRes = await fetch('https://protest.nemaai.com/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hospital_name: 'Test Hospital', email: 'admin@testenv.com', password: 'admintest' })
  });
  const loginData = await loginRes.json();
  console.log('Logged in token received:', Boolean(loginData.access_token));

  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((token, hospital, email) => {
    localStorage.setItem('token', token);
    sessionStorage.setItem('hospital_name', hospital);
  }, loginData.access_token, loginData.hospital_name, loginData.email);

  // Navigate to patient history page directly
  await page.goto(`http://localhost:${PORT}/patient-history/UDAxMQ==`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));

  const outDir = path.join(__dirname, 'screenshots_patient_history');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  await page.screenshot({ path: path.join(outDir, 'local_patient_history_actual.png'), fullPage: true });

  const localData = await page.evaluate(() => {
    const getT = (e) => e ? e.innerText.trim().replace(/\s+/g, ' ') : '';
    
    return {
      url: window.location.href,
      pathname: window.location.pathname,
      title: document.title,
      h1: Array.from(document.querySelectorAll('h1')).map(getT),
      h3: Array.from(document.querySelectorAll('h3')).map(getT),
      buttons: Array.from(document.querySelectorAll('button')).map(b => ({
        text: getT(b),
        className: b.className
      })).filter(b => b.text),
      badges: Array.from(document.querySelectorAll('.inline-flex.items-center.rounded-full, [class*=\"rounded-full\"]')).map(b => ({
        text: getT(b),
        className: b.className
      })).filter(b => b.text),
      table: Array.from(document.querySelectorAll('table')).map(t => ({
        th: Array.from(t.querySelectorAll('th')).map(getT),
        trCount: t.querySelectorAll('tbody tr').length,
        rows: Array.from(t.querySelectorAll('tbody tr')).slice(0, 5).map(tr => 
          Array.from(tr.querySelectorAll('td')).map(getT)
        )
      })),
      bodySnippet: document.body.innerText.replace(/\s+/g, ' ')
    };
  });

  fs.writeFileSync(path.join(__dirname, 'local_patient_history_actual.json'), JSON.stringify(localData, null, 2));

  // Compare with live
  const liveData = JSON.parse(fs.readFileSync(path.join(__dirname, 'live_patient_history_actual.json'), 'utf8'));

  console.log('\n================ COMPARISON SUMMARY ================');
  console.log('Pathname match:', localData.pathname === liveData.pathname, `(${localData.pathname})`);
  console.log('H1 match:', JSON.stringify(localData.h1), 'vs', JSON.stringify(liveData.h1));
  console.log('H3 match:', JSON.stringify(localData.h3), 'vs', JSON.stringify(liveData.h3));

  const liveBtnTexts = liveData.buttons.map(b => b.text);
  const localBtnTexts = localData.buttons.map(b => b.text);
  console.log('Live Buttons:', liveBtnTexts);
  console.log('Local Buttons:', localBtnTexts);

  if (liveData.table?.[0] && localData.table?.[0]) {
    console.log('Table Headers Match:', JSON.stringify(localData.table[0].th) === JSON.stringify(liveData.table[0].th));
    console.log('Live TH:', localData.table[0].th);
    console.log('Local Rows Count:', localData.table[0].trCount, 'Live Rows Count:', liveData.table[0].trCount);
    console.log('First 2 Local Rows:', localData.table[0].rows.slice(0, 2));
    console.log('First 2 Live Rows:', liveData.table[0].rows.slice(0, 2));
  }

  await browser.close();
  server.close();
  console.log('Server and browser closed.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
