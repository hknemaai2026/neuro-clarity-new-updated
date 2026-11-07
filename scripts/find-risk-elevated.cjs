const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const idx = bundle.indexOf('riskElevated:');
console.log('riskElevated idx:', idx);
if (idx !== -1) {
  console.log(bundle.slice(idx - 100, idx + 200));
}
