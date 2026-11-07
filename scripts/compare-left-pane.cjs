const fs = require('fs');
const live = fs.readFileSync('scripts/live_login.html', 'utf8');
const local = fs.readFileSync('scripts/local_login.html', 'utf8');

const re = /<div class="hidden lg:flex[\s\S]*?<\/div>\s*<\/div>\s*<div class="flex-1/i;
const mLive = live.match(re);
const mLocal = local.match(re);

console.log('--- LIVE LEFT PANE ---');
console.log(mLive ? mLive[0] : 'not found');
console.log('--- LOCAL LEFT PANE ---');
console.log(mLocal ? mLocal[0] : 'not found');
