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

  const setupPage = async (url) => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1200 });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.evaluate((token, hospital) => {
      localStorage.setItem('token', token);
      sessionStorage.setItem('hospital_name', hospital);
    }, loginData.access_token, loginData.hospital_name);
    return page;
  };

  const pageLive = await setupPage('https://protest.nemaai.com/');
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

  const pageLocal = await setupPage('http://localhost:8080/');
  await pageLocal.goto('http://localhost:8080/report/5d728f93-86db-4a76-905f-4b7ff920851d', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2500));

  const tabNames = ['Findings & Summary', 'Cognitive Analysis', 'Age Normative Context', 'Brain States', 'Insights & Activities', 'My Plan'];

  for (const name of tabNames) {
    console.log(`\n=================== TESTING TAB: ${name} ===================`);
    
    // Click on live
    await pageLive.evaluate((tName) => {
      const btns = Array.from(document.querySelectorAll('div[class*="rounded-2xl"] button'));
      const btn = btns.find(b => b.innerText.includes(tName));
      if (btn) btn.click();
    }, name);

    // Click on local
    await pageLocal.evaluate((tName) => {
      const btns = Array.from(document.querySelectorAll('div[class*="rounded-2xl"] button'));
      const btn = btns.find(b => b.innerText.includes(tName));
      if (btn) btn.click();
    }, name);

    await new Promise(r => setTimeout(r, 1500));

    const liveText = await pageLive.evaluate(() => document.querySelector('main')?.innerText || document.body.innerText);
    const localText = await pageLocal.evaluate(() => document.querySelector('main')?.innerText || document.body.innerText);

    console.log('Live content length:', liveText.length);
    console.log('Local content length:', localText.length);

    if (liveText.trim() === localText.trim()) {
      console.log(`Tab "${name}" MATCHES 100%!`);
    } else {
      console.log(`Tab "${name}" HAS DIFFERENCES!`);
      const liveLines = liveText.split('\n').filter(l => l.trim().length > 0);
      const localLines = localText.split('\n').filter(l => l.trim().length > 0);
      console.log(`Live lines: ${liveLines.length}, Local lines: ${localLines.length}`);
      
      const maxL = Math.min(10, Math.max(liveLines.length, localLines.length));
      for (let i = 0; i < maxL; i++) {
        if (liveLines[i] !== localLines[i]) {
          console.log(`  Line ${i+1}:`);
          console.log(`    Live:  ${JSON.stringify(liveLines[i])}`);
          console.log(`    Local: ${JSON.stringify(localLines[i])}`);
        }
      }
    }
  }

  await browser.close();
})();
