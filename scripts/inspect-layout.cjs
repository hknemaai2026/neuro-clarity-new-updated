const fs = require('fs');
const c = fs.readFileSync('live-bundle.js', 'utf8');
const idx = c.indexOf('return a?o.jsxs("div"');
if (idx !== -1) {
  console.log(c.substring(idx, idx + 1500));
} else {
  console.log('Not found');
}
