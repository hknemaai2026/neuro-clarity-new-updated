const fs = require('fs');

const code = fs.readFileSync('scripts/live_patients_component.js', 'utf8');

// check where RLe returns JSX
const returnIdx = code.indexOf('return o.jsxs(wa');
const rleBody = code.slice(returnIdx);
console.log('rleBody snippet around card click:');
const cardIdx = rleBody.indexOf('rounded-xl border border-border bg-card shadow-sm');
console.log(rleBody.slice(cardIdx, cardIdx + 1500));
