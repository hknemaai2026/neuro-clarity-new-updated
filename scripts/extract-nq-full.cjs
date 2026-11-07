const fs = require('fs');
const code = fs.readFileSync('scripts/nq-live.js', 'utf8');
const pRet = code.indexOf('return b(o.jsxs(o.Fragment');
console.log(code.slice(pRet, pRet + 8000));
