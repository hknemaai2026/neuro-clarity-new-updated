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
  await new Promise(r => setTimeout(r, 2000));

  console.log('Finding View button for sub-01 (Test1)...');
  await page.evaluate(() => {
    // Find row with sub-01
    const rows = Array.from(document.querySelectorAll('table tbody tr'));
    const test1Row = rows.find(r => r.innerText.includes('Test1') || r.innerText.includes('sub-01'));
    if (test1Row) {
      const viewBtn = Array.from(test1Row.querySelectorAll('button')).find(b => b.innerText.includes('View'));
      if (viewBtn) viewBtn.click();
    }
  });

  await new Promise(r => setTimeout(r, 2000));
  console.log('After View click, URL:', page.url());

  // In patient history, find the screening record and click View Full Report
  console.log('Looking for record in patient history...');
  const recordClicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const viewReportBtn = btns.find(b => b.innerText.includes('View') || b.innerText.includes('Report'));
    return btns.map(b => b.innerText);
  });
  console.log('Buttons on patient history:', recordClicked);

  await page.screenshot({ path: 'scripts/live_patient_history_test1.png', fullPage: true });

  await browser.close();
})();
