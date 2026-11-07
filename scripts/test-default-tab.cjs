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

  await page.goto('http://localhost:8080/report/5d728f93-86db-4a76-905f-4b7ff920851d', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 3000));

  const result = await page.evaluate(() => {
    const activeBtn = document.querySelector('button[class*="bg-background text-foreground shadow-md"]');
    const h1 = document.querySelector('h1')?.innerText;
    return {
      activeButtonText: activeBtn ? activeBtn.innerText : 'none',
      h1
    };
  });

  console.log('Default Active Tab Result:', result);
  await browser.close();
})();
