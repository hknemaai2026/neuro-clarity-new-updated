const fs = require('fs');
const code = fs.readFileSync('scripts/bde-live.js', 'utf8');

// Let's write a python or node script to pretty-print bDe
fs.writeFileSync('scripts/bde-raw.txt', code);

// Let's inspect the 3 tabs:
// 1. keys
// 2. accounts
// 3. analytics
const pKeys = code.indexOf('c==="keys"&&');
const pAccounts = code.indexOf('c==="accounts"&&');
const pAnalytics = code.indexOf('c==="analytics"&&');

console.log('pKeys:', pKeys, 'pAccounts:', pAccounts, 'pAnalytics:', pAnalytics);
console.log('--- KEYS ---');
console.log(code.slice(pKeys, pAccounts));
console.log('--- ACCOUNTS (first 1000) ---');
console.log(code.slice(pAccounts, pAccounts + 1000));
console.log('--- ANALYTICS (first 1000) ---');
console.log(code.slice(pAnalytics, pAnalytics + 1000));
