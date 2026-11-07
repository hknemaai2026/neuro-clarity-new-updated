const fs = require('fs');

const liveJs = fs.readFileSync('live-bundle.js', 'utf8');
const localJs = fs.readFileSync('dist/assets/index-06nbnPCX.js', 'utf8');

function extractStringLiterals(code) {
  // Extract quoted strings of reasonable length (3 to 80 chars)
  const regex = /"([^"\\]{3,80})"/g;
  const strings = new Set();
  let m;
  while ((m = regex.exec(code)) !== null) {
    // filter out minified gibberish
    const s = m[1].trim();
    if (/^[A-Za-z0-9\s.,!?:;/()#$%-]+$/.test(s) && s.includes(' ')) {
      strings.add(s);
    }
  }
  return strings;
}

const liveStrings = extractStringLiterals(liveJs);
const localStrings = extractStringLiterals(localJs);

console.log('Total UI strings in Live:', liveStrings.size);
console.log('Total UI strings in Local:', localStrings.size);

const onlyInLocal = [];
for (const s of localStrings) {
  if (!liveStrings.has(s)) onlyInLocal.push(s);
}

const onlyInLive = [];
for (const s of liveStrings) {
  if (!localStrings.has(s)) onlyInLive.push(s);
}

console.log('\n--- STRINGS ONLY IN LOCAL CODE (COUNT: ' + onlyInLocal.length + ') ---');
console.log(onlyInLocal.slice(0, 60));

console.log('\n--- STRINGS ONLY IN LIVE (COUNT: ' + onlyInLive.length + ') ---');
console.log(onlyInLive.slice(0, 60));

fs.writeFileSync('scripts/only_in_local.json', JSON.stringify(onlyInLocal, null, 2));
fs.writeFileSync('scripts/only_in_live.json', JSON.stringify(onlyInLive, null, 2));
