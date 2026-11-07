const fs = require('fs');

const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const idx = bundle.indexOf('overdue (>90 days)');
console.log('overdue idx:', idx);
if (idx !== -1) {
  console.log(bundle.slice(idx - 300, idx + 1000));
}
