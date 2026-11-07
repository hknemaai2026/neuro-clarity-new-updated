const fs = require('fs');

const live = JSON.parse(fs.readFileSync('scripts/live_reports_actual.json', 'utf8'));
const local = JSON.parse(fs.readFileSync('scripts/local_reports_actual.json', 'utf8'));

console.log('=== COMPARISON: Live vs Local /reports ===\n');

console.log('1. Page Title:');
console.log('   Live: ', live.title);
console.log('   Local:', local.title);
console.log('   Match:', live.title === local.title);

console.log('\n2. H3 Headers:');
console.log('   Live: ', live.h3);
console.log('   Local:', local.h3);
console.log('   Match:', JSON.stringify(live.h3) === JSON.stringify(local.h3));

console.log('\n3. Inputs:');
console.log('   Live count:', live.inputs.length);
console.log('   Local count:', local.inputs.length);
console.log('   Live placeholder:', live.inputs.map(i => i.placeholder));
console.log('   Local placeholder:', local.inputs.map(i => i.placeholder));
console.log('   Match:', JSON.stringify(live.inputs.map(i => i.placeholder)) === JSON.stringify(local.inputs.map(i => i.placeholder)));

console.log('\n4. Labels:');
console.log('   Live: ', live.labels);
console.log('   Local:', local.labels);
console.log('   Match:', JSON.stringify(live.labels) === JSON.stringify(local.labels));

console.log('\n5. Table Headers:');
console.log('   Live: ', live.tableHeaders);
console.log('   Local:', local.tableHeaders);
console.log('   Match:', JSON.stringify(live.tableHeaders) === JSON.stringify(local.tableHeaders));

console.log('\n6. Table Rows Count:');
console.log('   Live: ', live.tableRowsCount);
console.log('   Local:', local.tableRowsCount);
console.log('   Match:', live.tableRowsCount === local.tableRowsCount);

console.log('\n7. Sample Rows (Top 5):');
for (let i = 0; i < Math.min(5, live.sampleRows.length); i++) {
  console.log(`   Row ${i + 1}:`);
  console.log('     Live: ', live.sampleRows[i]);
  console.log('     Local:', local.sampleRows[i]);
  console.log('     Match:', live.sampleRows[i] === local.sampleRows[i]);
}

console.log('\n8. Badges count:');
console.log('   Live: ', live.badges.length);
console.log('   Local:', local.badges.length);
console.log('   Match:', live.badges.length === local.badges.length);

console.log('\n9. Buttons:');
const liveButtons = live.buttons.map(b => b.text);
const localButtons = local.buttons.map(b => b.text);
console.log('   Live buttons: ', liveButtons);
console.log('   Local buttons:', localButtons);
console.log('   Match count:', liveButtons.length === localButtons.length);

console.log('\n10. Body text check:');
const checkWords = [
  'Patient Screening Summary',
  'Overview of patient risk and screening status with quick access to history and trends.',
  'Add Patient',
  'Showing 5 of 27 patients',
  'Screening date range',
  'Choose a date range',
  'Reset',
  'Patient Name',
  'Age / Sex',
  'Risk Percentage',
  'Risk Level',
  'Last Screening',
  'Actions',
  'test ID: P011',
  'sub-01 ID: Test1',
  'Previous',
  'Next'
];
checkWords.forEach(w => {
  const inLive = live.bodySnippet.includes(w);
  const inLocal = local.bodySnippet.includes(w);
  console.log(`   "${w}": inLive=${inLive}, inLocal=${inLocal}, Match=${inLive === inLocal}`);
});
