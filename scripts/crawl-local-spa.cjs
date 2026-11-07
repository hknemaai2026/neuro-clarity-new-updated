const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const screenshotDir = path.join(__dirname, 'screenshots_local_spa');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

async function run() {
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
    body: JSON.stringify({
      hospital_name: 'Test Hospital',
      email: 'admin@testenv.com',
      password: 'admintest'
    })
  });
  const loginData = await loginRes.json();

  // Load origin first so we can set localStorage
  await page.goto('http://localhost:4173/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((token, hospital, email) => {
    localStorage.setItem('token', token);
    sessionStorage.setItem('hospital_name', hospital);
  }, loginData.access_token, loginData.hospital_name, loginData.email);

  // Reload into local app
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  console.log('Local app root URL:', page.url());

  async function extractPageInfo(label) {
    await page.screenshot({ path: path.join(screenshotDir, `${label}.png`), fullPage: true });
    return await page.evaluate((lbl) => {
      const getT = (e) => e ? e.innerText.trim().replace(/\s+/g, ' ') : '';
      return {
        label: lbl,
        url: window.location.href,
        pathname: window.location.pathname,
        h1: Array.from(document.querySelectorAll('h1')).map(getT),
        h2: Array.from(document.querySelectorAll('h2')).map(getT),
        h3: Array.from(document.querySelectorAll('h3')).map(getT),
        buttons: Array.from(document.querySelectorAll('button')).map(getT).filter(Boolean),
        links: Array.from(document.querySelectorAll('a')).map(a => ({ text: getT(a), href: a.getAttribute('href') })),
        tables: Array.from(document.querySelectorAll('table')).map(table => ({
          th: Array.from(table.querySelectorAll('th')).map(getT),
          rowCount: table.querySelectorAll('tbody tr').length
        })),
        inputs: Array.from(document.querySelectorAll('input, select, textarea')).map(i => ({
          tag: i.tagName,
          type: i.type,
          placeholder: i.placeholder || '',
          name: i.name || '',
          id: i.id || '',
          value: i.value || ''
        })),
        textSnippet: document.body.innerText.slice(0, 1500).replace(/\s+/g, ' ')
      };
    }, label);
  }

  const pagesData = [];

  // 1. Dashboard
  console.log('Inspecting Dashboard...');
  pagesData.push(await extractPageInfo('01_dashboard'));

  // Inspect sidebar elements
  const navItems = await page.$$eval('aside button, aside a', els => els.map(e => ({
    tag: e.tagName,
    text: e.innerText.trim().replace(/\s+/g, ' '),
    href: e.getAttribute('href')
  })));
  console.log('Local Sidebar elements:', JSON.stringify(navItems, null, 2));

  // Click EEG Insights
  console.log('Clicking EEG Insights...');
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('aside a')).find(e => e.innerText.includes('EEG Insights'));
    if (el) el.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  pagesData.push(await extractPageInfo('02_eeg_insights'));

  // Expand Patients
  console.log('Expanding Patients dropdown...');
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('aside button')).find(e => e.innerText.includes('Patients'));
    if (el) el.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(screenshotDir, '03_patients_expanded.png') });

  // Click Patient Directory
  console.log('Clicking Patient Directory...');
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('aside a')).find(e => e.innerText.includes('Patient Directory') || e.getAttribute('href') === '/patients');
    if (el) el.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  pagesData.push(await extractPageInfo('04_patients_directory'));

  // Click Patient Reports
  console.log('Clicking Patient Reports...');
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('aside a')).find(e => e.innerText.includes('Patient Reports') || e.getAttribute('href') === '/reports');
    if (el) el.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  pagesData.push(await extractPageInfo('05_patient_reports'));

  // Click Neuro Intake
  console.log('Clicking Neuro Intake...');
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('aside a')).find(e => e.innerText.includes('Neuro Intake') || e.getAttribute('href') === '/neuro-intake');
    if (el) el.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  pagesData.push(await extractPageInfo('06_neuro_intake'));

  // Click Longitudinal
  console.log('Clicking Longitudinal...');
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('aside a')).find(e => e.innerText.includes('Longitudinal') || e.getAttribute('href') === '/longitudinal');
    if (el) el.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  pagesData.push(await extractPageInfo('07_longitudinal'));

  // Click Model Evidence
  console.log('Clicking Model Evidence...');
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('aside a')).find(e => e.innerText.includes('Model Evidence') || e.getAttribute('href') === '/evidence');
    if (el) el.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  pagesData.push(await extractPageInfo('08_model_evidence'));

  // Click Follow-Ups (NEW IN LOCAL!)
  console.log('Clicking Follow-Ups...');
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('aside a')).find(e => e.innerText.includes('Follow-Ups') || e.getAttribute('href') === '/followups');
    if (el) el.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  pagesData.push(await extractPageInfo('09_followups'));

  // Click Settings
  console.log('Clicking Settings...');
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('aside a')).find(e => e.innerText.includes('Settings') || e.getAttribute('href') === '/settings');
    if (el) el.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  pagesData.push(await extractPageInfo('10_settings'));

  // Click Admin (NEW IN LOCAL!)
  console.log('Clicking Admin...');
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('aside a')).find(e => e.innerText.includes('Admin') || e.getAttribute('href') === '/admin');
    if (el) el.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  pagesData.push(await extractPageInfo('11_admin'));

  // Also visit /admin-keys
  console.log('Navigating to /admin-keys...');
  await page.goto('http://localhost:4173/admin-keys', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  pagesData.push(await extractPageInfo('12_admin_keys_gate'));

  fs.writeFileSync(path.join(__dirname, 'local_spa_pages.json'), JSON.stringify(pagesData, null, 2));
  console.log('All local SPA pages captured and saved to local_spa_pages.json!');

  await browser.close();
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
