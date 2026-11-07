const fs = require('fs');
const code = fs.readFileSync('scripts/bde-live.js', 'utf8');

const pAnalytics = code.indexOf('c==="analytics"&&');
console.log('--- ANALYTICS TAB & REST ---');
console.log(code.slice(pAnalytics));
