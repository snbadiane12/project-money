const https = require('https');
const http = require('http');

const base = process.argv[2];
if (!base) {
  console.error('Usage: node scripts/smoke-http.js https://your-domain.com');
  process.exit(1);
}

function get(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https://') ? https : http;
    const req = lib.get(url, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => resolve({ status: res.statusCode, raw }));
    });
    req.on('error', reject);
  });
}

(async () => {
  const targets = ['/api/livez', '/api/readyz', '/api/public-config'];
  for (const t of targets) {
    const u = `${base.replace(/\/+$/, '')}${t}`;
    const res = await get(u);
    console.log(`${u} -> ${res.status}`);
    if (res.status < 200 || res.status >= 300) process.exitCode = 1;
  }
})();
