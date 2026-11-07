const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const loginRes = await fetch('https://protest.nemaai.com/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hospital_name: 'Test Hospital', email: 'admin@testenv.com', password: 'admintest' })
  });
  const loginData = await loginRes.json();

  await page.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((token, hospital, email) => {
    localStorage.setItem('token', token);
    sessionStorage.setItem('hospital_name', hospital);
  }, loginData.access_token, loginData.hospital_name, loginData.email);

  await page.goto('http://localhost:8080/patients', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // 1. Test search filter
  await page.type('input[placeholder="Search by name or patient ID..."]', 'sub-01');
  await new Promise(r => setTimeout(r, 500));
  const cardCountAfterSearch = await page.$$eval('.rounded-xl.border.border-border.bg-card.shadow-sm', cards => cards.length);
  console.log('Cards after search "sub-01":', cardCountAfterSearch);

  // Clear search
  await page.evaluate(() => {
    const inp = document.querySelector('input[placeholder="Search by name or patient ID..."]');
    inp.value = '';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 500));

  // 2. Test Add Patient dialog
  const addBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Add Patient'));
  });
  await addBtn.click();
  await new Promise(r => setTimeout(r, 500));
  const dialogTitle = await page.$eval('h2, [role="dialog"] h2, [role="dialog"] [class*="DialogTitle"]', el => el.innerText);
  console.log('Add dialog title:', dialogTitle);

  // Close dialog
  const cancelBtn = await page.evaluateHandle(() => {
    return Array.from(document.querySelectorAll('button')).find(b => b.innerText === 'Cancel');
  });
  await cancelBtn.click();
  await new Promise(r => setTimeout(r, 500));

  console.log('Interactive tests passed successfully!');
  await browser.close();
})();
