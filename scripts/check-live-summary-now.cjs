const puppeteer = require('puppeteer-core');

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

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1200 });

  await page.goto('https://protest.nemaai.com/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((token, hospital) => {
    localStorage.setItem('token', token);
    sessionStorage.setItem('hospital_name', hospital);
  }, loginData.access_token, loginData.hospital_name);

  await page.goto('https://protest.nemaai.com/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2500));

  const liveData = await page.evaluate(() => {
    const table = document.querySelector('table');
    const showingText = Array.from(document.querySelectorAll('p')).map(p => p.innerText.trim()).find(t => t.includes('Showing') && t.includes('patients'));
    const rows = Array.from(document.querySelectorAll('table tbody tr')).map(r => {
      const cells = Array.from(r.querySelectorAll('td')).map(td => td.innerText.trim().replace(/\s+/g, ' '));
      return cells;
    });
    const pagination = Array.from(document.querySelectorAll('nav[aria-label="pagination"] a, nav[aria-label="pagination"] span')).map(p => p.innerText.trim());
    return {
      showingText,
      rows,
      pagination
    };
  });

  console.log('=== LIVE PATIENT SCREENING SUMMARY ===');
  console.log('Showing Text:', liveData.showingText);
  console.log('Total Rows on Page 1:', liveData.rows.length);
  liveData.rows.forEach((r, i) => {
    console.log(`Row ${i + 1}:`, r.join(' | '));
  });
  console.log('Pagination:', liveData.pagination);

  await page.screenshot({ path: 'scripts/live_dashboard_current_table.png', fullPage: true });

  await browser.close();
})();
