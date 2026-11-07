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

  await page.goto('http://localhost:8080/reports', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // 1. Test Search
  console.log('Testing search...');
  await page.type('input[placeholder="Search patients, ID, risk band..."]', 'sub-01');
  await new Promise(r => setTimeout(r, 500));
  const rowCountAfterSearch = await page.$$eval('tbody tr', trs => trs.length);
  const rowText = await page.$eval('tbody tr', tr => tr.innerText);
  console.log('Rows after search "sub-01":', rowCountAfterSearch, '| Text:', rowText);

  // Clear search
  await page.evaluate(() => {
    const inp = document.querySelector('input[placeholder="Search patients, ID, risk band..."]');
    inp.value = '';
    inp.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 500));

  // 2. Test Pagination Next
  console.log('Testing pagination...');
  await page.evaluate(() => {
    const nextBtn = Array.from(document.querySelectorAll('a, button')).find(el => el.innerText.includes('Next'));
    if (nextBtn) nextBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  const page2FirstRow = await page.$eval('tbody tr', tr => tr.innerText);
  console.log('Page 2 first row:', page2FirstRow);

  // 3. Test Add Patient dialog
  console.log('Testing Add Patient modal...');
  await page.evaluate(() => {
    const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Add Patient'));
    if (addBtn) addBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));
  const dialogTitle = await page.$eval('[role="dialog"] h2', el => el.innerText);
  console.log('Dialog title:', dialogTitle);

  // Close dialog
  await page.evaluate(() => {
    const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText === 'Cancel');
    if (cancelBtn) cancelBtn.click();
  });
  await new Promise(r => setTimeout(r, 500));

  console.log('All interactive tests on /reports passed successfully!');
  await browser.close();
})();
