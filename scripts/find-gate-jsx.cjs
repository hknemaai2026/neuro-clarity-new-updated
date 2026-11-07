const fs = require('fs');
const code = fs.readFileSync('scripts/bde-live.js', 'utf8');

// The ternary is: return a ? o.jsxs("div", ...) : o.jsx(...)
// Let's find the ":" corresponding to return a ?
const pStart = code.indexOf('return a?');
const rest = code.slice(pStart);
// Let's find where the gate JSX starts. The gate has "NEMA Admin" and "Invite key & account management"
const pGate = rest.indexOf('Invite key & account management');
console.log('pGate:', pGate);
if (pGate !== -1) {
  console.log(rest.slice(pGate - 500, pGate + 1000));
}
