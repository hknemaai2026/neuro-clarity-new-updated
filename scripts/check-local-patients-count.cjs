const fs = require('fs');

const local = JSON.parse(fs.readFileSync('scripts/local_dashboard_actual.json', 'utf8'));
console.log('Local statCards:', local.statCards.map(c => c.text));
