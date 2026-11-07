const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  const liveBase64 = fs.readFileSync('scripts/live_report_full.png').toString('base64');
  const localBase64 = fs.readFileSync('scripts/local_report_full.png').toString('base64');

  const diffResult = await page.evaluate(async (liveB64, locB64) => {
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

    const diffCanvas = document.createElement('canvas');
    diffCanvas.width = w; diffCanvas.height = h;
    const diffCtx = diffCanvas.getContext('2d');
    const diffImgData = diffCtx.createImageData(w, h);
    const out = diffImgData.data;

    let diffPixels = 0;
    const diffRows = [];

    for (let y = 0; y < h; y++) {
      let rowDiff = 0;
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const r1 = d1[idx], g1 = d1[idx+1], b1 = d1[idx+2], a1 = d1[idx+3];
        const r2 = d2[idx], g2 = d2[idx+1], b2 = d2[idx+2], a2 = d2[idx+3];

        if (r1 !== r2 || g1 !== g2 || b1 !== b2 || a1 !== a2) {
          diffPixels++;
          rowDiff++;
          out[idx] = 255;   // Red
          out[idx+1] = 0;
          out[idx+2] = 0;
          out[idx+3] = 255;
        } else {
          out[idx] = r1;
          out[idx+1] = g1;
          out[idx+2] = b1;
          out[idx+3] = 40;  // Faded background
        }
      }
      if (rowDiff > 0) {
        diffRows.push({ y, rowDiff });
      }
    }

    diffCtx.putImageData(diffImgData, 0, 0);
    return {
      w, h,
      img1H: img1.height,
      img2H: img2.height,
      diffPixels,
      totalPixels: w * h,
      diffPercentage: (diffPixels / (w * h) * 100).toFixed(2),
      diffRowsCount: diffRows.length,
      sampleRows: diffRows.slice(0, 20),
      diffCanvasDataUrl: diffCanvas.toDataURL('image/png')
    };
  }, liveBase64, localBase64);

  console.log('Comparison Results:');
  console.log('Dimensions Live:', diffResult.w, 'x', diffResult.img1H);
  console.log('Dimensions Local:', diffResult.w, 'x', diffResult.img2H);
  console.log('Diff pixels:', diffResult.diffPixels, `(${diffResult.diffPercentage}%)`);
  console.log('Sample differing Y ranges:');
  if (diffResult.sampleRows.length > 0) {
    const minY = diffResult.sampleRows[0].y;
    const maxY = diffResult.sampleRows[diffResult.sampleRows.length - 1].y;
    console.log(`First diff around Y = ${minY} to ${maxY}`);
  }

  const base64Data = diffResult.diffCanvasDataUrl.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync('scripts/visual_diff_report.png', base64Data, 'base64');
  console.log('Saved visual diff image to scripts/visual_diff_report.png');

  await browser.close();
})();
