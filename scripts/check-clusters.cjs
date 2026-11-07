const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function checkDiffClusters() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });
  const page = await browser.newPage();
  const diffPngBase64 = fs.readFileSync('scripts/login_diff_highlight.png').toString('base64');

  const clusters = await page.evaluate(async (b64) => {
    function loadImg(src) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = 'data:image/png;base64,' + src;
      });
    }

    const img = await loadImg(b64);
    const canvas = document.createElement('canvas');
    canvas.width = 1440;
    canvas.height = 900;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, 1440, 900).data;

    const sections = {
      headerLeft: 0,
      headerRight: 0,
      leftPaneIllustration: 0,
      leftPaneText: 0,
      rightPaneForm: 0
    };

    for (let y = 0; y < 900; y++) {
      for (let x = 0; x < 1440; x++) {
        const idx = (y * 1440 + x) * 4;
        if (data[idx] === 255 && data[idx+1] === 0 && data[idx+2] === 0) {
          if (y < 65) {
            if (x < 720) sections.headerLeft++;
            else sections.headerRight++;
          } else {
            if (x < 720) {
              if (y < 500) sections.leftPaneIllustration++;
              else sections.leftPaneText++;
            } else {
              sections.rightPaneForm++;
            }
          }
        }
      }
    }
    return sections;
  }, diffPngBase64);

  console.log('CLUSTERS:', clusters);
  await browser.close();
}

checkDiffClusters();
