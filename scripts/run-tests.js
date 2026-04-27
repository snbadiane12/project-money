const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');

async function run() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdf-test-'));
  process.env.APP_DB_PATH = path.join(tmpDir, 'app-db.test.json');
  process.env.ZILLOW_MODE = 'sample';

  const { server } = require('../server');
  const port = await new Promise((resolve) => {
    server.listen(0, () => resolve(server.address().port));
  });

  function request(method, route, body, cookie = '', csrf = '') {
    return new Promise((resolve, reject) => {
      const json = body ? JSON.stringify(body) : '';
      const headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(json),
      };
      if (cookie) headers.Cookie = cookie;
      if (csrf) headers['x-csrf-token'] = csrf;
      const req = http.request({ hostname: '127.0.0.1', port, path: route, method, headers }, (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let data = {};
          try {
            data = raw ? JSON.parse(raw) : {};
          } catch {
            data = { raw };
          }
          resolve({ status: res.statusCode, data, setCookie: res.headers['set-cookie'] || [] });
        });
      });
      req.on('error', reject);
      if (json) req.write(json);
      req.end();
    });
  }

  function cookieFrom(setCookies, name) {
    const row = (setCookies || []).find((v) => String(v).startsWith(`${name}=`));
    return row ? String(row).split(';')[0] : '';
  }

  try {
    const csrfResp = await request('GET', '/api/auth/csrf');
    assert.equal(csrfResp.status, 200);
    const csrfCookie = cookieFrom(csrfResp.setCookie, 'wdf_csrf');
    const csrf = csrfResp.data.token;
    assert.ok(csrfCookie && csrf);

    const email = `test${Date.now()}@example.com`;
    const reg = await request('POST', '/api/auth/register', { email, password: 'Password123!' }, csrfCookie, csrf);
    assert.equal(reg.status, 200);
    const session = cookieFrom(reg.setCookie, 'wdf_session');
    assert.ok(session);
    const cookie = `${csrfCookie}; ${session}`;

    const me = await request('GET', '/api/auth/me', null, cookie);
    assert.equal(me.status, 200);
    assert.equal(me.data.authenticated, true);
    assert.equal(me.data.user.email, email);

    const billing = await request('GET', '/api/billing/status', null, cookie);
    assert.equal(billing.status, 200);
    assert.equal(billing.data.billing.plan, 'trial');

    const lead = await request('POST', '/api/crm/leads', { address: '500 Example St, Orlando, FL', stage: 'new' }, cookie, csrf);
    assert.equal(lead.status, 200);
    assert.ok(lead.data.item.id);

    const task = await request('POST', '/api/crm/tasks', { leadId: lead.data.item.id, title: 'Call seller' }, cookie, csrf);
    assert.equal(task.status, 200);

    const search = await request('GET', '/api/search?location=florida&page=1&pageSize=5', null, cookie);
    assert.equal(search.status, 200);
    assert.ok(Array.isArray(search.data.results));

    console.log('All tests passed.');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

run().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
