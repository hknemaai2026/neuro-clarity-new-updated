const fs = require('fs');
const code = fs.readFileSync('scripts/bde-live.js', 'utf8');

const pAbnormal = code.indexOf('Abnormal EEG Detections');
console.log(code.slice(pAbnormal, pAbnormal + 4000));
