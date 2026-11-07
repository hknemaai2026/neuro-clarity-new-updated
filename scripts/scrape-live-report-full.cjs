const puppeteer = require('puppeteer-core');
const fs = require('fs');

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

  // Click on the first record's report button
  await page.evaluate(() => {
    const tr = document.querySelector('table tbody tr');
    if (tr) {
      const eyeBtn = Array.from(tr.querySelectorAll('button')).find(b => b.getAttribute('title')?.toLowerCase().includes('report') || b.innerText.includes('Report'));
      if (eyeBtn) eyeBtn.click();
    }
  });

  await new Promise(r => setTimeout(r, 3000));
  console.log('Current URL on live:', page.url());

  const fullData = await page.evaluate(() => {
    const tabButtons = Array.from(document.querySelectorAll('div[class*="rounded-xl"] button, div[class*="rounded-xl"] a')).map(b => b.innerText.trim());
    const title = document.querySelector('h1, h2')?.innerText;
    const bodyText = document.body.innerText;
    return { tabButtons, title, bodyTextLength: bodyText.length, snippet: bodyText.slice(0, 2000) };
  });

  console.log('Tabs in Top Action Bar:', fullData.tabButtons);
  console.log('Title:', fullData.title);
  console.log('Body Text Length:', fullData.bodyTextLength);
  console.log('Body Snippet:\n', fullData.snippet);

  fs.writeFileSync('scripts/live_report_full_text.txt', fullData.snippet);

  await browser.close();
})();
