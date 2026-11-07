const fs = require('fs');
const puppeteer = require('puppeteer-core');

async function testHeader() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const pageLive = await browser.newPage();
  await pageLive.setViewport({ width: 1440, height: 900 });
  await pageLive.goto('https://protest.nemaai.com/login', { waitUntil: 'networkidle2' });
  const selectTrigger = await pageLive.$('[role="combobox"]');
  if (selectTrigger) {
    await selectTrigger.click();
    await new Promise(r => setTimeout(r, 400));
    const options = await pageLive.$$('[role="option"]');
    for (const opt of options) {
      const text = await opt.evaluate(e => e.innerText);
      if (text.includes('Test Hospital')) {
        await opt.click();
        break;
      }
    }
  }
  await pageLive.type('input[type="email"]', 'admin@testenv.com');
  await pageLive.type('input[type="password"]', 'admintest');
  await pageLive.click('button[type="submit"]');
  await pageLive.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
  await new Promise(r => setTimeout(r, 1000));

  const liveHeader = await pageLive.evaluate(() => {
    const h = document.querySelector('header');
    return h ? h.innerText : 'no header';
  });

  const pageLocal = await browser.newPage();
  await pageLocal.setViewport({ width: 1440, height: 900 });
  await pageLocal.goto('http://localhost:8080/login', { waitUntil: 'networkidle2' });
  const selectTriggerLocal = await pageLocal.$('[role="combobox"]');
  if (selectTriggerLocal) {
    await selectTriggerLocal.click();
    await new Promise(r => setTimeout(r, 400));
    const options = await pageLocal.$$('[role="option"]');
    for (const opt of options) {
      const text = await opt.evaluate(e => e.innerText);
      if (text.includes('Test Hospital')) {
        await opt.click();
        break;
      }
    }
  }
  await pageLocal.type('input[type="email"]', 'admin@testenv.com');
  await pageLocal.type('input[type="password"]', 'admintest');
  await pageLocal.click('button[type="submit"]');
  await pageLocal.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
  await new Promise(r => setTimeout(r, 1000));

  const localHeader = await pageLocal.evaluate(() => {
    const h = document.querySelector('header');
    return h ? h.innerText : 'no header';
  });

  console.log('LIVE HEADER:\n', liveHeader);
  console.log('---');
  console.log('LOCAL HEADER:\n', localHeader);

  await browser.close();
}

testHeader();
