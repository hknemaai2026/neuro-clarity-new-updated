const fs = require('fs');
const code = fs.readFileSync('scripts/bde-live.js', 'utf8');

// Let's analyze all icons used in bDe
// We can find all Lucide icons referenced in bDe
const iconMatches = code.match(/o\.jsx\(([a-zA-Z0-9_$]+),\{className:\"[^\"]*\"\}\)/g) || [];
console.log('Icons in bDe:', Array.from(new Set(iconMatches)));

// Let's write the raw bDe code to a formatted file
fs.writeFileSync('scripts/bde-formatted.js', code);
console.log('Saved formatted bDe');
