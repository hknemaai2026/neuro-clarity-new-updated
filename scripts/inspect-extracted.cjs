const fs = require('fs');

// Inspect extracted_m8e.js
console.log('--- M8E (Brain States) ---');
const m8e = fs.readFileSync('scripts/extracted_m8e.js', 'utf8');
console.log(m8e.slice(0, 1500));

// Inspect extracted_e8e.js
console.log('--- E8E (Clinical Insights) ---');
const e8e = fs.readFileSync('scripts/extracted_e8e.js', 'utf8');
console.log(e8e.slice(0, 1500));

// Inspect extracted_a8e.js
console.log('--- A8E (Personalised Plan) ---');
const a8e = fs.readFileSync('scripts/extracted_a8e.js', 'utf8');
console.log(a8e.slice(0, 1500));
