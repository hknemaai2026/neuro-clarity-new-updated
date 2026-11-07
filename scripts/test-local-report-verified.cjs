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

  await page.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((token, hospital) => {
    localStorage.setItem('token', token);
    sessionStorage.setItem('hospital_name', hospital);
  }, loginData.access_token, loginData.hospital_name);

  const url = 'http://localhost:8080/report/5d728f93-86db-4a76-905f-4b7ff920851d';
  console.log('Navigating to', url);
  await page.goto(url, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));

  const data = await page.evaluate(() => {
    const title = document.querySelector('h1, h2')?.innerText;
    const tabs = Array.from(document.querySelectorAll('div[class*="rounded-xl"] button, div[class*="rounded-xl"] a')).map(b => b.innerText.trim());
    const bodyText = document.body.innerText;
    return { title, tabs, textLength: bodyText.length, snippet: bodyText.slice(0, 2000) };
  });

  console.log('Local Report Data:');
  console.log('Title:', data.title);
  console.log('Tabs:', data.tabs);
  console.log('Text Length:', data.textLength);
  console.log('Snippet:\n', data.snippet);

  await page.screenshot({ path: 'scripts/local_report_verified_5d728.png', fullPage: true });

  await browser.close();
})();
