const fs = require('fs');
const code = fs.readFileSync('scripts/live_patients_component.js', 'utf8');
const idx = code.indexOf('shrink-0 items-center justify-center rounded-full');
console.log(code.slice(idx - 40, idx + 80));
