(async () => {
  const loginRes = await fetch('https://protest.nemaai.com/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hospital_name: 'Test Hospital', email: 'admin@testenv.com', password: 'admintest' })
  });
  const { access_token } = await loginRes.json();
  const creditsRes = await fetch('https://protest.nemaai.com/api/me/credits', {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  const creditsData = await creditsRes.json();
  console.log('Credits response:', creditsData);
})();
