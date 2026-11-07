const fs = require('fs');
const js = fs.readFileSync('./live-bundle.js', 'utf8');

const startIdx = js.indexOf('title:"Module"');
console.log('startIdx:', startIdx);
const compDef = js.lastIndexOf('function', startIdx);
console.log('compDef:', compDef);

const endIdx = js.indexOf('function zA({text:');
console.log('endIdx:', endIdx);

const code = js.substring(compDef, endIdx);
fs.writeFileSync('scripts/live_upload_component_extracted.js', code);
console.log('Wrote scripts/live_upload_component_extracted.js, length:', code.length);
