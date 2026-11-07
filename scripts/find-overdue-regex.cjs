const fs = require('fs');

const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const regex = /overdue/i;
const match = bundle.match(regex);
if (match) {
  const idx = match.index;
  console.log('Found overdue at:', idx);
  console.log(bundle.slice(Math.max(0, idx - 400), idx + 800));
} else {
  console.log('overdue not found in bundle');
}
