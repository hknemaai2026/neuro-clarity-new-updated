const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'screenshots_upload');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function inspectLocalUpload() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900', '--disable-web-security']
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

  await page.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((token, hospital, email) => {
    localStorage.setItem('token', token);
    sessionStorage.setItem('hospital_name', hospital);
  }, loginData.access_token, loginData.hospital_name, loginData.email);

  await page.goto('http://localhost:8080/upload', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: path.join(outDir, 'local_upload_actual.png'), fullPage: true });

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
      })).filter(b => b.text),
      inputs: Array.from(document.querySelectorAll('input, select, textarea')).map(i => ({
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
      bodySnippet: document.body.innerText.replace(/\s+/g, ' ')
    };
  });

  fs.writeFileSync(path.join(__dirname, 'local_upload_actual.json'), JSON.stringify(pageData, null, 2));
  console.log('Local Upload inspection saved successfully!');
  console.log('Pathname:', pageData.pathname);
  console.log('H1:', pageData.h1);
  console.log('H2:', pageData.h2);
  console.log('H3:', pageData.h3);
  console.log('H4:', pageData.h4);
  console.log('Buttons:', pageData.buttons.map(b => b.text));
  console.log('Badges:', pageData.badges.map(b => b.text));

  await browser.close();
}

inspectLocalUpload().catch(console.error);
