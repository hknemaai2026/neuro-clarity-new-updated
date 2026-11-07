const fs = require('fs');

const live = JSON.parse(fs.readFileSync('scripts/live_dashboard_actual.json', 'utf8'));
console.log('Live statCards:', live.statCards.map(c => c.text));
console.log('Live sampleRows:', live.sampleRows);
