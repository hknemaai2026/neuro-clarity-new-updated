const fs = require('fs');

const live = JSON.parse(fs.readFileSync('scripts/live_dashboard_actual.json', 'utf8'));
const local = JSON.parse(fs.readFileSync('scripts/local_dashboard_actual.json', 'utf8'));

console.log('=== COMPARISON: Live vs Local / (Dashboard) ===\n');

console.log('1. Page Title:');
console.log('   Live: ', live.title);
console.log('   Local:', local.title);
console.log('   Match:', live.title === local.title);

console.log('\n2. H1:');
console.log('   Live: ', live.h1);
console.log('   Local:', local.h1);
console.log('   Match:', JSON.stringify(live.h1) === JSON.stringify(local.h1));

console.log('\n3. H3 Headers:');
console.log('   Live: ', live.h3);
console.log('   Local:', local.h3);
console.log('   Match:', JSON.stringify(live.h3) === JSON.stringify(local.h3));

console.log('\n4. Stats Cards:');
console.log('   Live count:', live.statCards.length);
console.log('   Local count:', local.statCards.length);
for (let i = 0; i < Math.min(4, live.statCards.length); i++) {
  console.log(`   Stat Card ${i + 1}:`);
  console.log('     Live: ', live.statCards[i].text);
  console.log('     Local:', local.statCards[i]?.text);
  console.log('     Match:', live.statCards[i].text === local.statCards[i]?.text);
}

console.log('\n5. Inputs:');
console.log('   Live count:', live.inputs.length);
console.log('   Local count:', local.inputs.length);
console.log('   Live placeholders: ', live.inputs.map(i => i.placeholder));
console.log('   Local placeholders:', local.inputs.map(i => i.placeholder));
console.log('   Match:', JSON.stringify(live.inputs.map(i => i.placeholder)) === JSON.stringify(local.inputs.map(i => i.placeholder)));

console.log('\n6. Labels:');
console.log('   Live: ', live.labels);
console.log('   Local:', local.labels);
console.log('   Match:', JSON.stringify(live.labels) === JSON.stringify(local.labels));

console.log('\n7. Table Headers:');
console.log('   Live: ', live.tableHeaders);
console.log('   Local:', local.tableHeaders);
console.log('   Match:', JSON.stringify(live.tableHeaders) === JSON.stringify(local.tableHeaders));

console.log('\n8. Table Rows Count:');
console.log('   Live: ', live.tableRowsCount);
console.log('   Local:', local.tableRowsCount);
console.log('   Match:', live.tableRowsCount === local.tableRowsCount);

console.log('\n9. Sample Rows (Top 5):');
for (let i = 0; i < Math.min(5, live.sampleRows.length); i++) {
  console.log(`   Row ${i + 1}:`);
  console.log('     Live: ', live.sampleRows[i]);
  console.log('     Local:', local.sampleRows[i]);
  console.log('     Match:', live.sampleRows[i] === local.sampleRows[i]);
}

console.log('\n10. Badges count:');
console.log('   Live count: ', live.badges.length);
console.log('   Local count:', local.badges.length);
console.log('   Match:', live.badges.length === local.badges.length);

console.log('\n11. Buttons:');
const liveButtons = live.buttons.map(b => b.text);
const localButtons = local.buttons.map(b => b.text);
console.log('   Live count: ', liveButtons.length);
console.log('   Local count:', localButtons.length);
console.log('   Match count:', liveButtons.length === localButtons.length);

console.log('\n12. Body text check:');
const checkWords = [
  'Dashboard',
  "Overview of today's screenings and patient risk assessments",
  "Today's Screens",
  '0 No screenings today',
  'High-Risk Detected',
  '18 18 high-risk cases found',
  'Avg Patient Age',
  '42 yrs Across 27 patients',
  'Credits Remaining',
  '70 Valid until 3/3/2030',
  'Patient Screening Summary',
  'Upcoming Follow-Ups',
  'Age Distribution & Insights',
  '27 patients',
  '5 overdue (>90 days)'
];
checkWords.forEach(w => {
  const inLive = live.bodySnippet.includes(w);
  const inLocal = local.bodySnippet.includes(w);
  console.log(`   "${w}": inLive=${inLive}, inLocal=${inLocal}, Match=${inLive === inLocal}`);
});
