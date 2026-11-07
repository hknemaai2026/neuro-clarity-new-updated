const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const screenshotDir = path.join(__dirname, 'screenshots_live');
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

async function run() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('1. Navigating to login...');
  await page.goto('https://protest.nemaai.com/login', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(screenshotDir, '01_login.png') });

  // Extract login page details
  const loginInfo = await page.evaluate(() => {
    return {
      title: document.title,
      inputs: Array.from(document.querySelectorAll('input, select, button')).map(el => ({
        tag: el.tagName,
        type: el.type,
        placeholder: el.placeholder || '',
        name: el.name || '',
        id: el.id || '',
        text: el.innerText.trim()
      })),
      text: document.body.innerText.slice(0, 500)
    };
  });
  console.log('Login page info:', JSON.stringify(loginInfo, null, 2));

  // Fill in login form
  console.log('2. Filling credentials...');
  // Check if hospital selector exists
  const selects = await page.$$('select');
  if (selects.length > 0) {
    // Select Test Hospital
    await page.select('select', 'Test Hospital');
  } else {
    // Might be shadcn Select or dropdown
    const selectTrigger = await page.$('[role="combobox"]');
    if (selectTrigger) {
      await selectTrigger.click();
      await new Promise(r => setTimeout(r, 500));
      // click option
      const options = await page.$$('[role="option"]');
      for (const opt of options) {
        const text = await opt.evaluate(e => e.innerText);
        if (text.includes('Test Hospital')) {
          await opt.click();
          break;
        }
      }
    }
  }

  // Type email and password
  const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
  if (emailInput) {
    await emailInput.type('admin@testenv.com');
  }

  const passInput = await page.$('input[type="password"]');
  if (passInput) {
    await passInput.type('admintest');
  }

  await page.screenshot({ path: path.join(screenshotDir, '02_filled_login.png') });

  // Click submit
  const submitBtn = await page.$('button[type="submit"], button:has-text("Sign In"), button:has-text("Login")');
  console.log('3. Clicking submit button...');
  if (submitBtn) {
    await submitBtn.click();
  } else {
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await b.evaluate(e => e.innerText);
      if (text.toLowerCase().includes('sign in') || text.toLowerCase().includes('login')) {
        await b.click();
        break;
      }
    }
  }

  await new Promise(r => setTimeout(r, 4000));
  console.log('Post login URL:', page.url());
  await page.screenshot({ path: path.join(screenshotDir, '03_after_login.png') });

  // Extract navigation links and menu
  const navLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('nav a, aside a, header a, a[href]')).map(a => ({
      text: a.innerText.trim().replace(/\n+/g, ' '),
      href: a.getAttribute('href')
    }));
  });
  console.log('Nav links found:', JSON.stringify(navLinks, null, 2));

  // Extract visible page content
  const pageContent = await page.evaluate(() => {
    return {
      title: document.title,
      h1: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.innerText.trim()),
      buttons: Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean),
      tables: Array.from(document.querySelectorAll('table')).length
    };
  });
  console.log('Dashboard overview content:', JSON.stringify(pageContent, null, 2));

  await browser.close();
}

run().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});
