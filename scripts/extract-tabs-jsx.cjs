const fs = require('fs');
const bundle = fs.readFileSync('live-bundle.js', 'utf8');
const idx = bundle.indexOf('S==="age_profile"?');
const content = bundle.slice(idx, idx + 12000);
fs.writeFileSync('scripts/tabs-jsx-extracted.txt', content);
console.log('Written to scripts/tabs-jsx-extracted.txt, length:', content.length);
