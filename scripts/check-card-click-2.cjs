const fs = require('fs');

const code = fs.readFileSync('scripts/live_patients_component.js', 'utf8');

const returnIdx = code.indexOf('return o.jsxs(wa');
const rleBody = code.slice(returnIdx);
const cardIdx = rleBody.indexOf('rounded-xl border border-border bg-card shadow-sm');
console.log(rleBody.slice(cardIdx, cardIdx + 3000));
