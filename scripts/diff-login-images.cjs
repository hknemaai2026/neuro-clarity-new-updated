const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function compare() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const img1Base64 = fs.readFileSync('scripts/live_login_current.png').toString('base64');
  const img2Base64 = fs.readFileSync('scripts/local_login_current.png').toString('base64');

  const diffPngBase64 = await page.evaluate(async (b1, b2) => {
    function loadImg(src) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = 'data:image/png;base64,' + src;
      });
    }

    const img1 = await loadImg(b1);
    const img2 = await loadImg(b2);

    const canvas = document.createElement('canvas');
    canvas.width = 1440;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(img1, 0, 0);
    const data1 = ctx.getImageData(0, 0, 1440, 900);

    ctx.clearRect(0, 0, 1440, 900);
    ctx.drawImage(img2, 0, 0);
    const data2 = ctx.getImageData(0, 0, 1440, 900);

    const out = ctx.createImageData(1440, 900);

    for (let i = 0; i < data1.data.length; i += 4) {
      const dr = Math.abs(data1.data[i] - data2.data[i]);
      const dg = Math.abs(data1.data[i+1] - data2.data[i+1]);
      const db = Math.abs(data1.data[i+2] - data2.data[i+2]);
      if (dr > 15 || dg > 15 || db > 15) {
        out.data[i] = 255;   // Red
        out.data[i+1] = 0;
        out.data[i+2] = 0;
        out.data[i+3] = 255;
      } else {
        out.data[i] = data1.data[i] * 0.3;
        out.data[i+1] = data1.data[i+1] * 0.3;
        out.data[i+2] = data1.data[i+2] * 0.3;
        out.data[i+3] = 255;
      }
    }

    ctx.putImageData(out, 0, 0);
    return canvas.toDataURL('image/png').split(',')[1];
  }, img1Base64, img2Base64);

  fs.writeFileSync('scripts/login_diff_highlight.png', Buffer.from(diffPngBase64, 'base64'));
  console.log('Saved scripts/login_diff_highlight.png');
  await browser.close();
}

compare().catch(e => console.error(e));
