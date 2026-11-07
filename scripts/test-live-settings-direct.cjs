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
  console.log('Login API returned token:', !!loginData.access_token);

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1200 });

  // Navigate to live origin
  await page.goto('https://protest.nemaai.com/settings', { waitUntil: 'domcontentloaded' });
  await page.evaluate((token, hospital) => {
    localStorage.setItem('token', token);
    sessionStorage.setItem('hospital_name', hospital);
  }, loginData.access_token, loginData.hospital_name);

  // Reload settings
  await page.goto('https://protest.nemaai.com/settings', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  console.log('Current URL on live:', page.url());
  const text = await page.evaluate(() => document.body.innerText.slice(0, 1500));
  console.log('Live Settings Text:\n', text);

  await page.screenshot({ path: 'scripts/live_settings_page.png', fullPage: true });

  await browser.close();
})();
