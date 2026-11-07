const fs = require('fs');
const bundle = fs.readFileSync('scripts/live_L8e_full.js', 'utf8');

let pos = 0;
while ((pos = bundle.indexOf('S==="analysis"', pos)) !== -1) {
  console.log('Found S==="analysis" at', pos, ':\n', bundle.slice(pos - 100, pos + 500));
  pos += 14;
}
