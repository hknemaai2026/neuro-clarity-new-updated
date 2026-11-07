const fs = require('fs');

const liveCode = fs.readFileSync('scripts/live_SLe_full.js', 'utf8');

const retIdx = liveCode.indexOf('return o.jsx(wa,');
const jsx = liveCode.slice(retIdx);

console.log(jsx.slice(5500, 10500));
