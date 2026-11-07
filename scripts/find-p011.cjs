(async () => {
  const loginRes = await fetch('https://protest.nemaai.com/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hospital_name: 'Test Hospital', email: 'admin@testenv.com', password: 'admintest' })
  });
  const { access_token } = await loginRes.json();
  const dbRes = await fetch('https://protest.nemaai.com/api/patients_db', {
    headers: { 'Authorization': `Bearer ${access_token}` }
  });
  const data = await dbRes.json();
  const list = Array.isArray(data) ? data : data?.patients ?? [];
  console.log('Total patients:', list.length);
  const found = list.find(p => p.patient_code === 'P011');
  console.log('P011 in patients_db:', found);
})();
