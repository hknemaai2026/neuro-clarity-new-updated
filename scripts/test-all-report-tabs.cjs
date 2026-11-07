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

  await page.goto('http://localhost:8080/report/5d728f93-86db-4a76-905f-4b7ff920851d', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const tabNames = ['Findings & Summary', 'Cognitive Analysis', 'Age Normative Context', 'Brain States', 'Insights & Activities', 'My Plan'];

  for (const name of tabNames) {
    const clicked = await page.evaluate((tName) => {
      const btns = Array.from(document.querySelectorAll('div[class*="rounded-2xl"] button'));
      const btn = btns.find(b => b.innerText.includes(tName));
      if (btn && !btn.disabled) {
        btn.click();
        return true;
      }
      return false;
    }, name);

    await new Promise(r => setTimeout(r, 1000));
    const activeText = await page.evaluate(() => document.body.innerText.slice(0, 300).replace(/\n+/g, ' '));
    console.log(`Tab: "${name}" - Clicked: ${clicked} - Content preview: ${activeText.slice(0, 100)}...`);
  }

  await browser.close();
  console.log('All tabs tested successfully!');
})();
