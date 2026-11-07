const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const t9Idx = bundle.lastIndexOf('function T9', 477194) !== -1
  ? bundle.lastIndexOf('function T9', 477194)
  : bundle.indexOf('function T9(');

console.log('T9 idx:', t9Idx);
if (t9Idx !== -1) {
  console.log(bundle.slice(t9Idx, t9Idx + 2000));
}
