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

  await page.goto('https://protest.nemaai.com/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((token, hospital, email) => {
    localStorage.setItem('token', token);
    sessionStorage.setItem('hospital_name', hospital);
  }, loginData.access_token, loginData.hospital_name, loginData.email);

  let exportRequests = [];
  page.on('request', req => {
    if (req.url().includes('export')) {
      exportRequests.push({ url: req.url(), method: req.method() });
    }
  });

  await page.goto('https://protest.nemaai.com/patient-history/UDAxMQ==', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  const buttons = await page.$$eval('button', btns => btns.map(b => ({ text: b.textContent.trim(), html: b.outerHTML })));
  console.log('Buttons found:', buttons.filter(b => b.text.includes('Export') || b.text.includes('Back')));

  const exportBtnInfo = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Export Excel'));
    if (!btn) return null;
    return {
      outerHTML: btn.outerHTML,
      disabled: btn.disabled,
      className: btn.className
    };
  });
  console.log('Export button info:', exportBtnInfo);

  // Click Export Excel and intercept window.open
  await page.evaluate(() => {
    window._lastOpenedUrl = null;
    const origOpen = window.open;
    window.open = function(url, target) {
      window._lastOpenedUrl = url;
      return origOpen ? origOpen.call(window, url, target) : null;
    };
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Export Excel'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const openedUrl = await page.evaluate(() => window._lastOpenedUrl);
  console.log('Opened URL on click:', openedUrl);
  console.log('Export Requests captured:', exportRequests);

  await browser.close();
})();
