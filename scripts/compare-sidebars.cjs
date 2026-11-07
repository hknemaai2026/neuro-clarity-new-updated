const fs = require('fs');
const live = fs.readFileSync('scripts/live_sidebar.html', 'utf8');
const local = fs.readFileSync('scripts/local_sidebar.html', 'utf8');

function extractLinks(html) {
  const re = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
  const links = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    const text = m[2].replace(/<[^>]+>/g, '').trim();
    links.push({ href: m[1], text });
  }
  return links;
}

function extractButtons(html) {
  const re = /<button[^>]*>([\s\S]*?)<\/button>/g;
  const btns = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    const text = m[1].replace(/<[^>]+>/g, '').trim();
    btns.push(text);
  }
  return btns;
}

console.log('--- LIVE SIDEBAR LINKS ---');
console.log(JSON.stringify(extractLinks(live), null, 2));
console.log('--- LIVE SIDEBAR BUTTONS ---');
console.log(JSON.stringify(extractButtons(live), null, 2));

console.log('--- LOCAL SIDEBAR LINKS ---');
console.log(JSON.stringify(extractLinks(local), null, 2));
console.log('--- LOCAL SIDEBAR BUTTONS ---');
console.log(JSON.stringify(extractButtons(local), null, 2));
