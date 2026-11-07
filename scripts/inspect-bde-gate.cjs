const fs = require('fs');
const code = fs.readFileSync('scripts/bde-live.js', 'utf8');

// Look for if(!i) return (or where gate is rendered)
const pGate = code.indexOf('if(!');
console.log('pGate:', pGate);
if (pGate !== -1) {
  console.log(code.slice(pGate, pGate + 1500));
}
