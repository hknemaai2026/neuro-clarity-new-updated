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

  console.log('On home, clicking Settings link in sidebar...');
  await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('aside a, nav a, a'));
    const settingsLink = links.find(a => a.innerText.trim().includes('Settings') || a.getAttribute('href') === '/settings');
    if (settingsLink) settingsLink.click();
  });

  await new Promise(r => setTimeout(r, 2000));
  console.log('After click, URL:', page.url());

  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Live Settings Text after click:\n', bodyText.slice(0, 1500));

  await page.screenshot({ path: 'scripts/live_settings_after_click.png', fullPage: true });

  await browser.close();
})();
