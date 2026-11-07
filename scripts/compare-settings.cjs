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

  // Helper to scrape a settings page
  async function scrapeSettings(url) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1200 });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.evaluate((token, hospital, email) => {
      localStorage.setItem('token', token);
      sessionStorage.setItem('hospital_name', hospital);
    }, loginData.access_token, loginData.hospital_name, loginData.email);

    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    const tabsData = {};
    const tabNames = ['profile', 'integration', 'export', 'privacy', 'roles'];

    for (const tab of tabNames) {
      // Click tab
      await page.evaluate((t) => {
        const btn = document.querySelector(`button[value="${t}"]`);
        if (btn) btn.click();
      }, tab);
      await new Promise(r => setTimeout(r, 500));

      const tabInfo = await page.evaluate((t) => {
        const activeTab = document.querySelector(`[role="tabpanel"][data-state="active"]`) || document.querySelector(`[data-state="active"]`);
        const text = activeTab ? activeTab.innerText.trim().replace(/\s+/g, ' ') : '';
        const inputs = Array.from(document.querySelectorAll('input, textarea, select')).map(el => ({
          id: el.id,
          name: el.name,
          type: el.type,
          placeholder: el.placeholder,
          value: el.value,
          readOnly: el.readOnly,
          disabled: el.disabled
        }));
        const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);
        return { text, inputs, buttons };
      }, tab);

      tabsData[tab] = tabInfo;
    }

    await page.close();
    return tabsData;
  }

  console.log('Scraping Live Settings...');
  const liveSettings = await scrapeSettings('https://protest.nemaai.com/settings');

  console.log('Scraping Local Settings...');
  const localSettings = await scrapeSettings('http://localhost:8080/settings');

  console.log('\n=== SETTINGS TABS COMPARISON ===\n');
  const tabs = ['profile', 'integration', 'export', 'privacy', 'roles'];
  for (const t of tabs) {
    console.log(`\n--- Tab: ${t.toUpperCase()} ---`);
    console.log('Live Text Snippet:\n  ', liveSettings[t].text.slice(0, 300));
    console.log('Local Text Snippet:\n  ', localSettings[t].text.slice(0, 300));
    const match = liveSettings[t].text === localSettings[t].text;
    console.log(`Exact Text Match: ${match}`);
    if (!match) {
      console.log('Diff Length:', liveSettings[t].text.length, 'vs', localSettings[t].text.length);
    }
  }

  await browser.close();
})();
