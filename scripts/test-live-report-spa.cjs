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

  console.log('Navigating via pushState / dispatchEvent...');
  await page.evaluate(() => {
    window.history.pushState({}, '', '/report/5d728f93-86db-4a76-905f-4b7ff920851d');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });

  await new Promise(r => setTimeout(r, 3000));
  console.log('Current URL:', page.url());
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Live Report Body Text Snippet:\n', bodyText.slice(0, 1500));

  await page.screenshot({ path: 'scripts/live_report_spa_direct.png', fullPage: true });

  await browser.close();
})();
