const fs = require('fs');
const code = fs.readFileSync('scripts/live_reports_component.js', 'utf8');

// Find where K8e ends - usually before next function
const nextFuncIdx = code.indexOf('function ', 50);
console.log('K8e length to next function:', nextFuncIdx);
console.log(code.slice(0, Math.min(code.length, nextFuncIdx !== -1 ? nextFuncIdx : 5000)));
