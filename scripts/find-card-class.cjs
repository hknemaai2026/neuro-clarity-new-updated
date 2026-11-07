const fs = require('fs');
const bundle = fs.readFileSync('scripts/live_L8e_full.js', 'utf8');

const str = 'rounded-xl border border-border bg-card';
let pos = 0;
while ((pos = bundle.indexOf(str, pos)) !== -1) {
  console.log('pos:', pos, bundle.slice(pos - 150, pos + 100));
  pos += str.length;
}
