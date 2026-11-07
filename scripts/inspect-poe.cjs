const fs = require('fs');

const code = fs.readFileSync('scripts/live_pOe_full.js', 'utf8');

// Find where pOe ends - usually where return ends or next const
const mOeIdx = code.indexOf('mOe=');
console.log('mOeIdx within code:', mOeIdx);
const poeCode = mOeIdx !== -1 ? code.slice(0, mOeIdx) : code.slice(0, 10000);
fs.writeFileSync('scripts/live_pOe_clean.js', poeCode);
console.log('poeCode length:', poeCode.length);
console.log(poeCode.slice(0, 3000));
