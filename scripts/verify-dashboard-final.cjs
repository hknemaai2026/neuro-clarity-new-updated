const puppeteer = require('puppeteer-core');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,1200']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1200 });

  const loginRes = await fetch('https://protest.nemaai.com/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hospital_name: 'Test Hospital', email: 'admin@testenv.com', password: 'admintest' })
  });
  const loginData = await loginRes.json();

  await page.goto('http://localhost:8080/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((token, hospital) => {
    localStorage.setItem('token', token);
    sessionStorage.setItem('hospital_name', hospital);
  }, loginData.access_token, loginData.hospital_name);

  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const data = await page.evaluate(() => {
    const statCards = Array.from(document.querySelectorAll('.clinical-card')).map(c => c.innerText.trim());
    const tableRows = Array.from(document.querySelectorAll('table tbody tr')).map(r => r.innerText.trim().replace(/\s+/g, ' '));
    const pagination = Array.from(document.querySelectorAll('nav[aria-label="pagination"] a, nav[aria-label="pagination"] span')).map(p => p.innerText.trim());
    const overdueTitle = document.querySelector('.border-orange-200 button')?.innerText.trim() || 'NOT FOUND';
    const overdueCards = Array.from(document.querySelectorAll('.border-orange-200 .overflow-y-auto > div')).map(d => d.innerText.trim().replace(/\s+/g, ' '));

    // Showing text
    const showingText = Array.from(document.querySelectorAll('p')).map(p => p.innerText.trim()).find(t => t.includes('Showing') && t.includes('patients'));

    return {
      showingText,
      statCards: statCards.slice(0, 4),
      tableRows: tableRows.slice(0, 5),
      pagination,
      overdueTitle,
      overdueCards
    };
  });

  console.log('=== VERIFICATION RESULTS ===');
  console.log('Showing Text:', data.showingText);
  console.log('\nStat Cards:', data.statCards);
  console.log('\nTable Rows (Top 5):');
  data.tableRows.forEach((r, i) => console.log(`  Row ${i + 1}: ${r}`));
  console.log('\nPagination:', data.pagination);
  console.log('\nOverdue Title:', data.overdueTitle);
  console.log('\nOverdue Cards (Total:', data.overdueCards.length, '):');
  data.overdueCards.forEach((c, i) => console.log(`  Card ${i + 1}: ${c}`));

  // Take screenshot
  await page.screenshot({ path: 'scripts/dashboard_verified.png', fullPage: true });
  console.log('\nScreenshot saved to scripts/dashboard_verified.png');

  await browser.close();
})();
