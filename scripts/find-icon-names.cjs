const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');

const icons = ['vZ', 'j7', 'sy', 'PZ', '_7', 'Fl', 'g1', 'Cs'];
for (const ic of icons) {
  const match = bundle.match(new RegExp(`const ${ic}=([^;]+);`)) || bundle.match(new RegExp(`${ic}=([a-zA-Z0-9_$]+)\\(`));
  console.log(ic, '=>', match ? match[0] : 'not found');
}
