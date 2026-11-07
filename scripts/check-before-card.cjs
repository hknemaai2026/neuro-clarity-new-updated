const fs = require('fs');
const bundle = fs.readFileSync('scripts/live_L8e_full.js', 'utf8');

const idx = bundle.indexOf('rounded-xl border border-border bg-card overflow-hidden text-sm text-foreground');
console.log(bundle.slice(idx - 400, idx + 100));
