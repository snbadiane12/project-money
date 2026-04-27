const fs = require('fs');
const path = require('path');

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8');
  raw.split(/\r?\n/).forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const i = t.indexOf('=');
    if (i < 0) return;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
    process.env[k] = v;
  });
}

loadEnv(path.join(process.cwd(), '.env'));

const appBase = String(process.env.APP_BASE_URL || '');
const stripeSecret = String(process.env.STRIPE_SECRET_KEY || '');
const stripeWebhook = String(process.env.STRIPE_WEBHOOK_SECRET || '');
const adminEmails = String(process.env.ADMIN_EMAILS || '');
const zillowKey = String(process.env.ZILLOW_RAPIDAPI_KEY || '');

const checks = [
  ['APP_BASE_URL HTTPS', /^https:\/\//i.test(appBase) && !/your-domain|example/i.test(appBase)],
  ['COOKIE_SECURE true', String(process.env.COOKIE_SECURE || '').toLowerCase() === 'true'],
  ['STRIPE_SECRET_KEY', !!stripeSecret && /^sk_(test|live)_/i.test(stripeSecret) && !/replace|your/i.test(stripeSecret)],
  ['STRIPE_WEBHOOK_SECRET', !!stripeWebhook && /^whsec_/i.test(stripeWebhook) && !/replace|your/i.test(stripeWebhook)],
  ['ZILLOW_RAPIDAPI_KEY', !!zillowKey && !/paste|your|replace/i.test(zillowKey)],
  ['ADMIN_EMAILS', !!adminEmails && !/your-domain|example/i.test(adminEmails)],
];

const optional = [
  ['SENDGRID_API_KEY', !!process.env.SENDGRID_API_KEY],
  ['SENTRY_DSN', !!process.env.SENTRY_DSN],
];

const reqPass = checks.filter((c) => c[1]).length;
const optPass = optional.filter((c) => c[1]).length;

console.log('Required checks:');
checks.forEach(([name, ok]) => console.log(`- ${ok ? 'OK' : 'MISSING'}: ${name}`));
console.log(`Required score: ${reqPass}/${checks.length}`);
console.log('');
console.log('Optional checks:');
optional.forEach(([name, ok]) => console.log(`- ${ok ? 'OK' : 'MISSING'}: ${name}`));
console.log(`Optional score: ${optPass}/${optional.length}`);

if (reqPass !== checks.length) process.exit(1);
console.log('\nProduction readiness checks passed.');
