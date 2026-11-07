const fs = require('fs');
const liveCode = fs.readFileSync('scripts/live_SLe_full.js', 'utf8');

// Print sections of liveCode
console.log('Total length:', liveCode.length);
console.log('\n--- State and Handlers ---');
const retIdx = liveCode.indexOf('return o.jsx(');
console.log(liveCode.slice(0, retIdx));

console.log('\n--- First 3000 chars of JSX ---');
console.log(liveCode.slice(retIdx, retIdx + 3000));
