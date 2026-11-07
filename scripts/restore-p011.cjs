(async () => {
  const loginRes = await fetch('https://protest.nemaai.com/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hospital_name: 'Test Hospital', email: 'admin@testenv.com', password: 'admintest' })
  });
  const { access_token } = await loginRes.json();
  
  // Try to create P011
  const createRes = await fetch('https://protest.nemaai.com/api/create-patient', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${access_token}`
    },
    body: JSON.stringify({
      hospital_id: 1,
      patient_code: 'P011',
      name: 'test',
      age: 23,
      gender: 'F'
    })
  });
  console.log('Create P011 status:', createRes.status);
  const data = await createRes.json();
  console.log('Response:', data);
})();
