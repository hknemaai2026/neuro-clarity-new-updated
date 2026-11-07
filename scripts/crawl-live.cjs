const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const screenshotDir = path.join(__dirname, 'screenshots_live');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Login via API directly & set localStorage so we have a reliable session
  console.log('Logging in via API...');
  const loginRes = await fetch('https://protest.nemaai.com/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hospital_name: 'Test Hospital',
      email: 'admin@testenv.com',
      password: 'admintest'
    })
  });
  const loginData = await loginRes.json();
  console.log('Login API response:', loginData.email, loginData.hospital_name, 'token length:', loginData.access_token?.length);

  await page.goto('https://protest.nemaai.com/login', { waitUntil: 'networkidle2' });
  await page.evaluate((token, hospital, email) => {
    localStorage.setItem('token', token);
    sessionStorage.setItem('hospital_name', hospital);
  }, loginData.access_token, loginData.hospital_name, loginData.email);

  // Navigate to root
  console.log('Navigating to dashboard / ...');
  await page.goto('https://protest.nemaai.com/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(screenshotDir, 'live_01_dashboard.png'), fullPage: true });

  // Extract navigation links
  const navItems = await page.evaluate(() => {
    const items = [];
    document.querySelectorAll('nav a, aside a, header a, a').forEach(a => {
      const text = a.innerText.trim().replace(/\s+/g, ' ');
      const href = a.getAttribute('href');
      if (href && (href.startsWith('/') || href.startsWith('http'))) {
        items.push({ text, href });
      }
    });
    return items;
  });
  console.log('Live Nav Items:', navItems);

  // Candidate routes to inspect
  const routesToTest = [
    '/',
    '/upload',
    '/patients',
    '/reports',
    '/eeg-technician-report',
    '/neuro-intake',
    '/longitudinal',
    '/evidence',
    '/settings',
    '/admin',
    '/admin-keys',
    '/followups',
    '/eeg-analysis'
  ];

  const results = {};

  for (const route of routesToTest) {
    try {
      console.log(`Visiting route: ${route} ...`);
      await page.goto(`https://protest.nemaai.com${route}`, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 2000));

      const cleanName = route === '/' ? 'root' : route.replace(/\//g, '_').replace(/^_/, '');
      await page.screenshot({ path: path.join(screenshotDir, `live_${cleanName}.png`), fullPage: true });

      const pageData = await page.evaluate(() => {
        const getVisibleText = (el) => el ? el.innerText.trim().replace(/\s+/g, ' ') : '';
        
        return {
          url: window.location.href,
          pathname: window.location.pathname,
          title: document.title,
          h1: Array.from(document.querySelectorAll('h1')).map(getVisibleText),
          h2: Array.from(document.querySelectorAll('h2')).map(getVisibleText),
          h3: Array.from(document.querySelectorAll('h3')).map(getVisibleText),
          buttons: Array.from(document.querySelectorAll('button')).map(getVisibleText).filter(Boolean),
          tables: Array.from(document.querySelectorAll('table')).map(table => {
            const headers = Array.from(table.querySelectorAll('th')).map(getVisibleText);
            const rowCount = table.querySelectorAll('tbody tr').length;
            return { headers, rowCount };
          }),
          inputs: Array.from(document.querySelectorAll('input, select, textarea')).map(i => ({
            tag: i.tagName,
            type: i.type,
            placeholder: i.placeholder || '',
            name: i.name || '',
            id: i.id || ''
          })),
          sidebarLinks: Array.from(document.querySelectorAll('aside a, nav a')).map(a => ({
            text: getVisibleText(a),
            href: a.getAttribute('href')
          })),
          headerText: getVisibleText(document.querySelector('header')),
          mainSummary: document.body.innerText.slice(0, 1000).replace(/\s+/g, ' ')
        };
      });

      results[route] = pageData;
      console.log(`Route ${route}: Title = ${pageData.title}, Path = ${pageData.pathname}, H1s = ${pageData.h1.join(' | ')}, Buttons = ${pageData.buttons.length}, Tables = ${pageData.tables.length}`);
    } catch (e) {
      console.error(`Error on route ${route}:`, e.message);
      results[route] = { error: e.message };
    }
  }

  fs.writeFileSync(path.join(__dirname, 'live_crawl_results.json'), JSON.stringify(results, null, 2));
  console.log('Saved live_crawl_results.json successfully.');

  await browser.close();
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
