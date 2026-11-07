const fs = require('fs');
const code = fs.readFileSync('scripts/nq-live.js', 'utf8');

let depth = 0;
let inString = false;
let stringChar = '';
let startBrace = code.indexOf('{');

for (let i = startBrace; i < Math.min(code.length, 50000); i++) {
  const ch = code[i];
  if (inString) {
    if (ch === stringChar && code[i - 1] !== '\\') {
      inString = false;
    }
  } else {
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = true;
      stringChar = ch;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        console.log('Nq function ends at index:', i);
        fs.writeFileSync('scripts/nq-only.js', code.slice(0, i + 1));
        break;
      }
    }
  }
}
