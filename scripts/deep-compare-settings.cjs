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

  async function getTabsInfo(baseUrl) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1200 });

    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.evaluate((token, hospital) => {
      localStorage.setItem('token', token);
      sessionStorage.setItem('hospital_name', hospital);
    }, loginData.access_token, loginData.hospital_name);

    await page.goto(baseUrl, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // If not already on /settings, click settings in sidebar
    if (!page.url().includes('/settings')) {
      await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('aside a, nav a, a'));
        const link = links.find(a => a.innerText.trim().includes('Settings') || a.getAttribute('href') === '/settings');
        if (link) link.click();
      });
      await new Promise(r => setTimeout(r, 1500));
    }

    const tabsData = {};
    const tabs = ['profile', 'integration', 'export', 'privacy', 'roles'];

    for (const tab of tabs) {
      // Click tab button
      await page.evaluate((t) => {
        const btn = Array.from(document.querySelectorAll('button[role="tab"]')).find(b => b.getAttribute('value') === t || b.innerText.toLowerCase().includes(t));
        if (btn) btn.click();
      }, tab);
      await new Promise(r => setTimeout(r, 400));

      const tabContent = await page.evaluate(() => {
        // Find active tab content
        const activePanel = document.querySelector('[role="tabpanel"][data-state="active"]');
        if (!activePanel) return 'PANEL NOT FOUND';
        
        // Extract inputs
        const inputs = Array.from(activePanel.querySelectorAll('input, textarea, select, [role="combobox"]')).map(el => ({
          tag: el.tagName,
          id: el.id,
          placeholder: el.placeholder || '',
          value: el.value || el.innerText || '',
          readOnly: el.readOnly || false,
          disabled: el.disabled || false
        }));

        // Extract switches
        const switches = Array.from(activePanel.querySelectorAll('button[role="switch"]')).map(s => ({
          state: s.getAttribute('data-state'),
          disabled: s.disabled || false
        }));

        // Extract buttons
        const buttons = Array.from(activePanel.querySelectorAll('button:not([role="tab"]):not([role="switch"]):not([role="combobox"])')).map(b => b.innerText.trim().replace(/\s+/g, ' ')).filter(Boolean);

        return {
          text: activePanel.innerText.trim().replace(/\s+/g, ' '),
          inputs,
          switches,
          buttons
        };
      });

      tabsData[tab] = tabContent;
    }

    await page.close();
    return tabsData;
  }

  console.log('Scraping Live Settings...');
  const live = await getTabsInfo('https://protest.nemaai.com/');

  console.log('Scraping Local Settings...');
  const local = await getTabsInfo('http://localhost:8080/');

  console.log('\n=============================================');
  console.log('SETTINGS PARITY COMPARISON (LIVE vs LOCAL)');
  console.log('=============================================\n');

  const tabs = ['profile', 'integration', 'export', 'privacy', 'roles'];
  let allMatched = true;

  for (const t of tabs) {
    console.log(`\n--- TAB: ${t.toUpperCase()} ---`);
    const liveT = live[t];
    const localT = local[t];

    const textMatch = liveT.text === localT.text;
    console.log(`Text Match: ${textMatch ? '✓ EXACT' : '✗ DIFFERENCE'}`);
    if (!textMatch) {
      allMatched = false;
      console.log('  Live Text: ', liveT.text);
      console.log('  Local Text:', localT.text);
    }

    const switchMatch = JSON.stringify(liveT.switches) === JSON.stringify(localT.switches);
    console.log(`Switches Match: ${switchMatch ? '✓ EXACT' : '✗ DIFFERENCE'}`);
    if (!switchMatch) {
      allMatched = false;
      console.log('  Live Switches: ', liveT.switches);
      console.log('  Local Switches:', localT.switches);
    }

    const buttonMatch = JSON.stringify(liveT.buttons) === JSON.stringify(localT.buttons);
    console.log(`Buttons Match: ${buttonMatch ? '✓ EXACT' : '✗ DIFFERENCE'}`);
    if (!buttonMatch) {
      allMatched = false;
      console.log('  Live Buttons: ', liveT.buttons);
      console.log('  Local Buttons:', localT.buttons);
    }
  }

  console.log('\n=============================================');
  console.log('FINAL RESULT: ' + (allMatched ? '100% EXACT MATCH ON ALL TABS!' : 'SOME DIFFERENCES FOUND'));
  console.log('=============================================\n');

  await browser.close();
})();
