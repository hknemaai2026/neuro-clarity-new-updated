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

  async function getDashboardTable(url) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1200 });

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.evaluate((token, hospital) => {
      localStorage.setItem('token', token);
      sessionStorage.setItem('hospital_name', hospital);
    }, loginData.access_token, loginData.hospital_name);

    await page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2500));

    const result = await page.evaluate(() => {
      const showing = Array.from(document.querySelectorAll('p')).map(p => p.innerText.trim()).find(t => t.includes('Showing') && t.includes('patients'));
      const rows = Array.from(document.querySelectorAll('table tbody tr')).map(tr => {
        return Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim().replace(/\s+/g, ' '));
      });
      const pagination = Array.from(document.querySelectorAll('nav[aria-label="pagination"] a, nav[aria-label="pagination"] span')).map(p => p.innerText.trim());
      return { showing, rows, pagination };
    });

    await page.close();
    return result;
  }

  console.log('Fetching Live Dashboard Table...');
  const live = await getDashboardTable('https://protest.nemaai.com/');

  console.log('Fetching Local Dashboard Table...');
  const local = await getDashboardTable('http://localhost:8080/');

  console.log('\n=== LIVE vs LOCAL COMPARISON ===');
  console.log('Showing Text:');
  console.log('  Live: ', live.showing);
  console.log('  Local:', local.showing);
  console.log('  Match:', live.showing === local.showing);

  console.log('\nRows Count on Page 1:');
  console.log('  Live: ', live.rows.length);
  console.log('  Local:', local.rows.length);
  console.log('  Match:', live.rows.length === local.rows.length);

  console.log('\nRow-by-Row Comparison:');
  const maxRows = Math.max(live.rows.length, local.rows.length);
  for (let i = 0; i < maxRows; i++) {
    const liveRow = live.rows[i] ? live.rows[i].join(' | ') : 'EMPTY';
    const localRow = local.rows[i] ? local.rows[i].join(' | ') : 'EMPTY';
    const match = liveRow === localRow;
    console.log(`\nRow ${i + 1}: ${match ? '✓ MATCH' : '✗ DIFF'}`);
    console.log('  Live: ', liveRow);
    console.log('  Local:', localRow);
  }

  console.log('\nPagination:');
  console.log('  Live: ', live.pagination);
  console.log('  Local:', local.pagination);
  console.log('  Match:', JSON.stringify(live.pagination) === JSON.stringify(local.pagination));

  await browser.close();
})();
