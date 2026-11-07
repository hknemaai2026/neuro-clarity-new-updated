const fs = require('fs');

const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const xleIdx = bundle.indexOf('const Xle=') !== -1 ? bundle.indexOf('const Xle=') : bundle.indexOf('function Xle(');
console.log('Xle idx:', xleIdx);
if (xleIdx !== -1) {
  console.log('--- XLE ---');
  console.log(bundle.slice(xleIdx, xleIdx + 2000));
}

const poeIdx = bundle.indexOf('const pOe=') !== -1 ? bundle.indexOf('const pOe=') : bundle.indexOf('function pOe(');
console.log('pOe idx:', poeIdx);
if (poeIdx !== -1) {
  console.log('--- POE ---');
  console.log(bundle.slice(poeIdx, poeIdx + 2000));
}
