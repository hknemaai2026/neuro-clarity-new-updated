const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,1200']
  });

  const setupPage = async (url) => {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1200 });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));
    return page;
  };

  const pageLive = await setupPage('https://protest.nemaai.com/admin-keys');
  const pageLocal = await setupPage('http://localhost:8080/admin-keys');

  // 1. Text Comparison on Gate
  const liveText = await pageLive.evaluate(() => document.body.innerText.trim());
  const localText = await pageLocal.evaluate(() => document.body.innerText.trim());

  console.log('--- GATE TEXT COMPARISON ---');
  console.log('Live Text:\n', JSON.stringify(liveText));
  console.log('Local Text:\n', JSON.stringify(localText));
  console.log('Gate Text Match:', liveText === localText ? '100% MATCH' : 'DIFFERENCE DETECTED');

  // 2. HTML / Element Structure Comparison
  const liveCardHTML = await pageLive.evaluate(() => {
    const card = document.querySelector('div[class*="rounded-2xl"]');
    return card ? card.className : null;
  });
  const localCardHTML = await pageLocal.evaluate(() => {
    const card = document.querySelector('div[class*="rounded-2xl"]');
    return card ? card.className : null;
  });
  console.log('Live Card Class:', liveCardHTML);
  console.log('Local Card Class:', localCardHTML);

  // 3. Test Invalid Secret Error Message Match via evaluate
  console.log('\n--- TESTING ERROR STATE ---');
  await pageLive.evaluate(() => {
    const input = document.querySelector('input');
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(input, 'badsecret');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('Access Admin Panel'));
    if (btn) btn.click();
  });

  await pageLocal.evaluate(() => {
    const input = document.querySelector('input');
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(input, 'badsecret');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('Access Admin Panel'));
    if (btn) btn.click();
  });

  await new Promise(r => setTimeout(r, 2000));

  const liveErrorText = await pageLive.evaluate(() => document.querySelector('p[class*="text-red-400"]')?.innerText);
  const localErrorText = await pageLocal.evaluate(() => document.querySelector('p[class*="text-red-400"]')?.innerText);

  console.log('Live Error Message:', liveErrorText);
  console.log('Local Error Message:', localErrorText);
  console.log('Error Message Match:', liveErrorText === localErrorText ? '100% MATCH' : 'MISMATCH');

  // Screenshots
  await pageLive.screenshot({ path: 'scripts/live_adminkeys_final.png' });
  await pageLocal.screenshot({ path: 'scripts/local_adminkeys_final.png' });

  // Pixel comparison
  const diffResult = await pageLive.evaluate(async (liveB64, locB64) => {
    const loadImage = (src) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = 'data:image/png;base64,' + src;
    });

    const img1 = await loadImage(liveB64);
    const img2 = await loadImage(locB64);
    const w = Math.max(img1.width, img2.width);
    const h = Math.max(img1.height, img2.height);

    const c1 = document.createElement('canvas');
    c1.width = w; c1.height = h;
    const ctx1 = c1.getContext('2d');
    ctx1.drawImage(img1, 0, 0);
    const d1 = ctx1.getImageData(0, 0, w, h).data;

    const c2 = document.createElement('canvas');
    c2.width = w; c2.height = h;
    const ctx2 = c2.getContext('2d');
    ctx2.drawImage(img2, 0, 0);
    const d2 = ctx2.getImageData(0, 0, w, h).data;

    let diffPixels = 0;
    for (let i = 0; i < d1.length; i += 4) {
      if (d1[i] !== d2[i] || d1[i+1] !== d2[i+1] || d1[i+2] !== d2[i+2]) {
        diffPixels++;
      }
    }

    return {
      w, h, diffPixels,
      totalPixels: w * h,
      diffPercentage: (diffPixels / (w * h) * 100).toFixed(2)
    };
  }, fs.readFileSync('scripts/live_adminkeys_final.png').toString('base64'), fs.readFileSync('scripts/local_adminkeys_final.png').toString('base64'));

  console.log('\n--- VISUAL PIXEL COMPARISON ---');
  console.log('Dimensions:', diffResult.w, 'x', diffResult.h);
  console.log('Diff Pixels:', diffResult.diffPixels, `(${diffResult.diffPercentage}%)`);

  await browser.close();
})();
