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

  // 1. Live page
  const pageLive = await browser.newPage();
  await pageLive.setViewport({ width: 1440, height: 1200 });
  await pageLive.goto('https://protest.nemaai.com/', { waitUntil: 'domcontentloaded' });
  await pageLive.evaluate((token, hospital) => {
    localStorage.setItem('token', token);
    sessionStorage.setItem('hospital_name', hospital);
  }, loginData.access_token, loginData.hospital_name);

  // Navigate to patient history of Test1
  await pageLive.goto('https://protest.nemaai.com/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  await pageLive.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tbody tr'));
    const test1Row = rows.find(r => r.innerText.includes('Test1'));
    if (test1Row) {
      const viewBtn = Array.from(test1Row.querySelectorAll('button')).find(b => b.innerText.includes('View'));
      if (viewBtn) viewBtn.click();
    }
  });
  await new Promise(r => setTimeout(r, 2000));
  await pageLive.evaluate(() => {
    const tr = document.querySelector('table tbody tr');
    if (tr) {
      const eyeBtn = Array.from(tr.querySelectorAll('button')).find(b => b.getAttribute('title')?.toLowerCase().includes('report') || b.innerText.includes('Report'));
      if (eyeBtn) eyeBtn.click();
    }
  });
  await new Promise(r => setTimeout(r, 2500));

  // 2. Local page
  const pageLocal = await browser.newPage();
  await pageLocal.setViewport({ width: 1440, height: 1200 });
  await pageLocal.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded' });
  await pageLocal.evaluate((token, hospital) => {
    localStorage.setItem('token', token);
    sessionStorage.setItem('hospital_name', hospital);
  }, loginData.access_token, loginData.hospital_name);

  await pageLocal.goto('http://localhost:8080/report/5d728f93-86db-4a76-905f-4b7ff920851d', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2500));

  // Capture screenshots
  await pageLive.screenshot({ path: 'scripts/live_report_full.png', fullPage: true });
  await pageLocal.screenshot({ path: 'scripts/local_report_full.png', fullPage: true });

  const extractDetails = async (page) => {
    return await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.innerText.trim(),
        className: b.className,
        disabled: b.disabled
      }));
      const allHeadings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
        tag: h.tagName,
        text: h.innerText.trim(),
        className: h.className
      }));
      const svgs = Array.from(document.querySelectorAll('svg')).map(s => ({
        classes: s.getAttribute('class'),
        parent: s.parentElement?.tagName + ': ' + s.parentElement?.innerText?.trim()?.slice(0, 30)
      }));
      const badges = Array.from(document.querySelectorAll('span, div')).filter(el => {
        const c = el.className || '';
        return typeof c === 'string' && (c.includes('rounded-full') || c.includes('badge'));
      }).map(el => el.innerText.trim()).filter(Boolean);
      
      const mainContentText = document.querySelector('main')?.innerText || document.body.innerText;

      return {
        allButtons,
        allHeadings,
        svgs,
        badges: Array.from(new Set(badges)),
        mainContentTextLength: mainContentText.length
      };
    });
  };

  const live = await extractDetails(pageLive);
  const local = await extractDetails(pageLocal);

  fs.writeFileSync('scripts/live_details.json', JSON.stringify(live, null, 2));
  fs.writeFileSync('scripts/local_details.json', JSON.stringify(local, null, 2));

  console.log('Saved live_details.json and local_details.json');
  console.log('Live mainContentTextLength:', live.mainContentTextLength);
  console.log('Local mainContentTextLength:', local.mainContentTextLength);

  await browser.close();
})();
