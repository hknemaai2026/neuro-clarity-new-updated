const fs = require('fs');

(async () => {
  const loginRes = await fetch('https://protest.nemaai.com/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hospital_name: 'Test Hospital', email: 'admin@testenv.com', password: 'admintest' })
  });
  const { access_token } = await loginRes.json();

  const resultId = '5d728f93-86db-4a76-905f-4b7ff920851d';
  console.log('Testing /report/' + resultId);
  const repRes = await fetch(`https://protest.nemaai.com/api/report/${resultId}`, {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  console.log('Status /report:', repRes.status);
  const repData = await repRes.json();
  console.log('Keys of /report:', Object.keys(repData));
  console.log('patient_info:', repData.patient_info);
  console.log('ai_status:', repData.ai_status);
  console.log('rf_risk:', repData.rf_risk);

  console.log('\nTesting /report-summary/data/' + resultId);
  const sumRes = await fetch(`https://protest.nemaai.com/api/report-summary/data/${resultId}`, {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  console.log('Status /report-summary/data:', sumRes.status);

  console.log('\nTesting /report-history/' + resultId);
  const histRes = await fetch(`https://protest.nemaai.com/api/report-history/${resultId}`, {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  console.log('Status /report-history:', histRes.status);
  if (histRes.ok) {
    const histData = await histRes.json();
    console.log('Keys of /report-history:', Object.keys(histData));
  }
})();
