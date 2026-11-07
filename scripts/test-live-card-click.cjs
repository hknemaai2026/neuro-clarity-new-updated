const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });
  const page = await browser.newPage();
  const loginRes = await fetch('https://protest.nemaai.com/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hospital_name: 'Test Hospital', email: 'admin@testenv.com', password: 'admintest' })
  });
  const loginData = await loginRes.json();

  await page.goto('https://protest.nemaai.com/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((token, hospital) => {
    localStorage.setItem('token', token);
    sessionStorage.setItem('hospital_name', hospital);
  }, loginData.access_token, loginData.hospital_name);

  await page.goto('https://protest.nemaai.com/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const nav = document.querySelector('nav') || document.querySelector('aside');
    const btn = Array.from(nav.querySelectorAll('button')).find(b => b.innerText.includes('Patients'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  await page.evaluate(() => {
    const nav = document.querySelector('nav') || document.querySelector('aside');
    const link = Array.from(nav.querySelectorAll('a')).find(a => a.getAttribute('href') === '/patients');
    if (link) link.click();
  });
  await new Promise(r => setTimeout(r, 3000));
  console.log('Current URL on live:', page.url());

  const firstCard = await page.$('.rounded-xl.border.border-border.bg-card.shadow-sm');
  if (firstCard) {
    await firstCard.click();
    await new Promise(r => setTimeout(r, 1500));
    console.log('URL after clicking card on live:', page.url());
  }

  await browser.close();
})();
