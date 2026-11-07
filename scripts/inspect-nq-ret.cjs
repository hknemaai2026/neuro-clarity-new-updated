const fs = require('fs');
const code = fs.readFileSync('scripts/nq-live.js', 'utf8');

// Let's find "return b(" or where it renders
const pRet = code.indexOf('return b(');
console.log('return b at:', pRet);
if (pRet !== -1) {
  console.log(code.slice(pRet, pRet + 4000));
}
