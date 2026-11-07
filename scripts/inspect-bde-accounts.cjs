const fs = require('fs');
const code = fs.readFileSync('scripts/bde-live.js', 'utf8');

const pAccounts = code.indexOf('c==="accounts"&&');
const pAnalytics = code.indexOf('c==="analytics"&&');
console.log('--- ACCOUNTS TAB FULL ---');
console.log(code.slice(pAccounts, pAnalytics));
