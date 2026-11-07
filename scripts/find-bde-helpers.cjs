const fs = require('fs');
const code = fs.readFileSync('scripts/bde-live.js', 'utf8');

for (const fn of ['Ct', 'Ye', 'ft', 'Ot', 'et']) {
  let idx = code.indexOf(fn + '=');
  if (idx === -1) idx = code.indexOf(' ' + fn + '=');
  if (idx !== -1) {
    console.log(fn + ':');
    console.log(code.slice(idx, idx + 400));
  }
}
