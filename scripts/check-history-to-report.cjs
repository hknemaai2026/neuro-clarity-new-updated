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

  // Navigate to patient history of Test1
  await page.goto('https://protest.nemaai.com/', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tbody tr'));
    const test1Row = rows.find(r => r.innerText.includes('Test1'));
    if (test1Row) {
      const viewBtn = Array.from(test1Row.querySelectorAll('button')).find(b => b.innerText.includes('View'));
      if (viewBtn) viewBtn.click();
    }
  });

  await new Promise(r => setTimeout(r, 2000));
  console.log('On patient history, URL:', page.url());

  // Check rows in screening records table
  const records = await page.evaluate(() => {
    const trs = Array.from(document.querySelectorAll('table tbody tr'));
    return trs.map(tr => {
      const tds = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim().replace(/\s+/g, ' '));
      const btns = Array.from(tr.querySelectorAll('button')).map(b => b.getAttribute('title') || b.innerText.trim());
      return { tds, btns };
    });
  });

  console.log('Screening Records on Live Patient History:');
  records.slice(0, 3).forEach((rec, idx) => console.log(`Record ${idx + 1}:`, rec));

  // Click on the first record's report button
  console.log('Clicking report button on Record 1...');
  await page.evaluate(() => {
    const tr = document.querySelector('table tbody tr');
    if (tr) {
      // Find buttons in this row
      const btns = Array.from(tr.querySelectorAll('button'));
      console.log('Buttons count in row:', btns.length);
      // Click the view report button (usually Eye or View Full Report)
      const eyeBtn = btns.find(b => b.getAttribute('title')?.toLowerCase().includes('report') || b.innerText.includes('Report') || b.getAttribute('title')?.toLowerCase().includes('view'));
      if (eyeBtn) eyeBtn.click();
    }
  });

  await new Promise(r => setTimeout(r, 2500));
  console.log('After clicking record button, URL:', page.url());
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Body Text after clicking record:\n', bodyText.slice(0, 1000));

  await page.screenshot({ path: 'scripts/live_report_after_history_click.png', fullPage: true });

  await browser.close();
})();
