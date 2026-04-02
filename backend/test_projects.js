const jwt = require('jsonwebtoken');
const http = require('http');

const token = jwt.sign({ id: '65f01234abcd567890ef1234', role: 'admin' }, 'super_secret_key_nexus_project_2025_secure', { expiresIn: '1h' });

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/projects',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  res.on('end', () => {
    const projects = JSON.parse(data).projects;
    console.log("Total projects:", projects.length);
    projects.forEach(p => {
        console.log(`[Project] Title: ${p.title}, Banner: ${p.banner}, CampaignBanner: ${p.campaignId?.banner}`);
    });
  });
});

req.on('error', error => {
  console.error(error);
});

req.end();
