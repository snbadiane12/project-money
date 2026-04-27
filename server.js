const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const crypto = require('crypto');

function loadDotEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const i = trimmed.indexOf('=');
    if (i === -1) return;
    const key = trimmed.slice(0, i).trim();
    const value = trimmed.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key) process.env[key] = value;
  });
}

loadDotEnv();

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const SAMPLE_PATH = path.join(ROOT, 'data', 'sample-listings.json');
const APP_DB_PATH = process.env.APP_DB_PATH || path.join(ROOT, 'data', 'app-db.json');
const LOG_DIR = path.join(ROOT, 'data', 'logs');
const APP_LOG_PATH = path.join(LOG_DIR, 'app.log');
const APP_ERROR_LOG_PATH = path.join(LOG_DIR, 'error.log');
const SESSION_COOKIE = 'wdf_session';
const CSRF_COOKIE = 'wdf_csrf';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const LIVE_CACHE_TTL_MS = Number(process.env.LIVE_CACHE_TTL_MS || 1000 * 60 * 2);
const PASSWORD_RESET_TTL_MS = Number(process.env.PASSWORD_RESET_TTL_MS || 1000 * 60 * 30);
const EMAIL_VERIFY_TTL_MS = Number(process.env.EMAIL_VERIFY_TTL_MS || 1000 * 60 * 60 * 24);
const SECURITY_RATE_WINDOW_MS = Number(process.env.SECURITY_RATE_WINDOW_MS || 1000 * 60 * 10);
const SECURITY_RATE_MAX = Number(process.env.SECURITY_RATE_MAX || 240);
const LOGIN_FAIL_LIMIT = Number(process.env.LOGIN_FAIL_LIMIT || 6);
const LOGIN_LOCKOUT_MS = Number(process.env.LOGIN_LOCKOUT_MS || 1000 * 60 * 20);
const COOKIE_SECURE = String(process.env.COOKIE_SECURE || '').toLowerCase() === 'true';
const NODE_ENV = process.env.NODE_ENV || 'development';

const ZILLOW_MODE = process.env.ZILLOW_MODE || 'sample';
const ZILLOW_RAPIDAPI_KEY = process.env.ZILLOW_RAPIDAPI_KEY || '';
const ZILLOW_RAPIDAPI_HOST = process.env.ZILLOW_RAPIDAPI_HOST || 'zillow-com1.p.rapidapi.com';
const ZILLOW_RAPIDAPI_BASE_URL = process.env.ZILLOW_RAPIDAPI_BASE_URL || 'https://zillow-com1.p.rapidapi.com';
const ZILLOW_ALT_RAPIDAPI_HOST = process.env.ZILLOW_ALT_RAPIDAPI_HOST || 'us-property-data.p.rapidapi.com';
const ZILLOW_ALT_RAPIDAPI_BASE_URL = process.env.ZILLOW_ALT_RAPIDAPI_BASE_URL || 'https://us-property-data.p.rapidapi.com';
const ZILLOW_RESULTS_LIMIT = Number(process.env.ZILLOW_RESULTS_LIMIT || 40);
const ZILLOW_WEB_BASE_URL = process.env.ZILLOW_WEB_BASE_URL || 'https://www.zillow.com';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const ENABLE_REAL_OUTREACH = String(process.env.ENABLE_REAL_OUTREACH || '').toLowerCase() === 'true';
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || '';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || '';
const ADMIN_EMAILS = String(process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const APP_BASE_URL = process.env.APP_BASE_URL || `http://localhost:${PORT}`;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const STRIPE_PRICE_MONTHLY_20 = process.env.STRIPE_PRICE_MONTHLY_20 || '';
const BILLING_TRIAL_DAYS = Number(process.env.BILLING_TRIAL_DAYS || 7);
const BILLING_MONTHLY_PRICE_CENTS = Number(process.env.BILLING_MONTHLY_PRICE_CENTS || 2000);
const SENTRY_DSN = process.env.SENTRY_DSN || '';
const listingPhotoCache = new Map();
const liveSearchCache = new Map();
const sourceHealthHistory = [];
const rateLimitBuckets = new Map();
const loginFailBuckets = new Map();

const STATE_NAME_TO_CODE = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA', colorado: 'CO', connecticut: 'CT',
  delaware: 'DE', florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID', illinois: 'IL', indiana: 'IN', iowa: 'IA',
  kansas: 'KS', kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI',
  minnesota: 'MN', mississippi: 'MS', missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH',
  'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH',
  oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD',
  tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT', virginia: 'VA', washington: 'WA', 'west virginia': 'WV',
  wisconsin: 'WI', wyoming: 'WY', 'district of columbia': 'DC'
};

const SAMPLE_VARIANT_COUNT = Math.max(1, Number(process.env.SAMPLE_VARIANT_COUNT || 1));

function ensureAppDb() {
  const dir = path.dirname(APP_DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(APP_DB_PATH)) {
    const seed = {
      users: [],
      sessions: [],
      savedSearches: [],
      savedDeals: [],
      auditLogs: [],
      passwordResetTokens: [],
      emailVerifyTokens: [],
      crmLeads: [],
      crmTasks: [],
      billingEvents: [],
    };
    fs.writeFileSync(APP_DB_PATH, JSON.stringify(seed, null, 2), 'utf8');
  }
}

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
}

function appendJsonLine(filePath, payload) {
  try {
    ensureLogDir();
    fs.appendFileSync(filePath, `${JSON.stringify(payload)}\n`, 'utf8');
  } catch {}
}

function appLog(event, details) {
  appendJsonLine(APP_LOG_PATH, {
    at: new Date().toISOString(),
    event,
    ...(details || {}),
  });
}

function errorLog(event, details) {
  appendJsonLine(APP_ERROR_LOG_PATH, {
    at: new Date().toISOString(),
    event,
    ...(details || {}),
  });
}

function readAppDb() {
  ensureAppDb();
  try {
    const raw = fs.readFileSync(APP_DB_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users)
        ? parsed.users.map((u) => ({
            ...u,
            role: u.role || (ADMIN_EMAILS.includes(String(u.email || '').toLowerCase()) ? 'admin' : 'user'),
            emailVerified: !!u.emailVerified,
            subscriptionStatus: String(u.subscriptionStatus || (u.subscriptionPlan ? 'active' : 'trial')).toLowerCase(),
            subscriptionPlan: String(u.subscriptionPlan || (u.subscriptionStatus === 'active' ? 'pro_monthly_20' : 'trial')).toLowerCase(),
            trialEndsAt: u.trialEndsAt || null,
            stripeCustomerId: u.stripeCustomerId || '',
            stripeSubscriptionId: u.stripeSubscriptionId || '',
            planRenewsAt: u.planRenewsAt || null,
          }))
        : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      savedSearches: Array.isArray(parsed.savedSearches) ? parsed.savedSearches : [],
      savedDeals: Array.isArray(parsed.savedDeals) ? parsed.savedDeals : [],
      auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
      passwordResetTokens: Array.isArray(parsed.passwordResetTokens) ? parsed.passwordResetTokens : [],
      emailVerifyTokens: Array.isArray(parsed.emailVerifyTokens) ? parsed.emailVerifyTokens : [],
      crmLeads: Array.isArray(parsed.crmLeads) ? parsed.crmLeads : [],
      crmTasks: Array.isArray(parsed.crmTasks) ? parsed.crmTasks : [],
      billingEvents: Array.isArray(parsed.billingEvents) ? parsed.billingEvents : [],
    };
  } catch {
    return {
      users: [],
      sessions: [],
      savedSearches: [],
      savedDeals: [],
      auditLogs: [],
      passwordResetTokens: [],
      emailVerifyTokens: [],
      crmLeads: [],
      crmTasks: [],
      billingEvents: [],
    };
  }
}

function writeAppDb(db) {
  ensureAppDb();
  fs.writeFileSync(APP_DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

function parseCookies(req) {
  const raw = req?.headers?.cookie || '';
  const out = {};
  raw.split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i === -1) return;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (!k) return;
    out[k] = decodeURIComponent(v);
  });
  return out;
}

function appendSetCookie(res, cookieValue) {
  const existing = res.getHeader('Set-Cookie');
  if (!existing) {
    res.setHeader('Set-Cookie', cookieValue);
    return;
  }
  if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, cookieValue]);
    return;
  }
  res.setHeader('Set-Cookie', [existing, cookieValue]);
}

function setSessionCookie(res, token) {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  appendSetCookie(
    res,
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${COOKIE_SECURE ? '; Secure' : ''}`
  );
}

function clearSessionCookie(res) {
  appendSetCookie(res, `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}

function setCsrfCookie(res, token) {
  appendSetCookie(
    res,
    `${CSRF_COOKIE}=${encodeURIComponent(token)}; Path=/; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${COOKIE_SECURE ? '; Secure' : ''}`
  );
}

function ensureCsrfToken(req, res) {
  const cookies = parseCookies(req);
  let token = cookies[CSRF_COOKIE];
  if (!token || token.length < 16) {
    token = crypto.randomBytes(24).toString('hex');
    setCsrfCookie(res, token);
  }
  return token;
}

function clientIp(req) {
  const xff = String(req?.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  return xff || req?.socket?.remoteAddress || 'unknown';
}

function requestRouteKey(urlObj) {
  const path = String(urlObj?.pathname || '/');
  if (path.startsWith('/api/auth/login')) return 'auth_login';
  if (path.startsWith('/api/auth/register')) return 'auth_register';
  if (path.startsWith('/api/contact-action')) return 'contact_action';
  if (path.startsWith('/api/search')) return 'search';
  return path.slice(0, 64);
}

function enforceRateLimit(req, urlObj) {
  const ip = clientIp(req);
  const key = `${ip}:${requestRouteKey(urlObj)}`;
  const now = Date.now();
  let bucket = rateLimitBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + SECURITY_RATE_WINDOW_MS };
  }
  bucket.count += 1;
  rateLimitBuckets.set(key, bucket);
  if (rateLimitBuckets.size > 7000) {
    const entries = [...rateLimitBuckets.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
    while (entries.length > 4500) {
      const old = entries.shift();
      if (old) rateLimitBuckets.delete(old[0]);
    }
  }
  if (bucket.count > SECURITY_RATE_MAX) {
    return { blocked: true, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  return { blocked: false, retryAfterSec: 0 };
}

function loginLockKey(email, req) {
  return `${normalizeEmail(email)}:${clientIp(req)}`;
}

function isLoginLocked(email, req) {
  const key = loginLockKey(email, req);
  const row = loginFailBuckets.get(key);
  const now = Date.now();
  if (!row) return { locked: false, remainingMs: 0 };
  if (row.lockUntil && row.lockUntil > now) {
    return { locked: true, remainingMs: row.lockUntil - now };
  }
  return { locked: false, remainingMs: 0 };
}

function markLoginFailure(email, req) {
  const key = loginLockKey(email, req);
  const now = Date.now();
  const row = loginFailBuckets.get(key) || { count: 0, lockUntil: 0 };
  row.count += 1;
  if (row.count >= LOGIN_FAIL_LIMIT) {
    row.lockUntil = now + LOGIN_LOCKOUT_MS;
    row.count = 0;
  }
  loginFailBuckets.set(key, row);
}

function clearLoginFailures(email, req) {
  loginFailBuckets.delete(loginLockKey(email, req));
}

function requiresCsrf(req, urlObj) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return false;
  const p = String(urlObj.pathname || '');
  if (p === '/api/auth/login' || p === '/api/auth/register' || p === '/api/auth/request-password-reset' || p === '/api/auth/reset-password' || p === '/api/auth/request-email-verification' || p === '/api/auth/verify-email' || p === '/api/stripe/webhook') {
    return false;
  }
  return p.startsWith('/api/');
}

function isValidCsrf(req) {
  const cookies = parseCookies(req);
  const cookieToken = cookies[CSRF_COOKIE];
  const headerToken = String(req.headers['x-csrf-token'] || '');
  if (!cookieToken || !headerToken) return false;
  return cookieToken === headerToken;
}

function setSecurityHeaders(req, res) {
  if (!res.getHeader('X-Content-Type-Options')) res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!res.getHeader('X-Frame-Options')) res.setHeader('X-Frame-Options', 'DENY');
  if (!res.getHeader('Referrer-Policy')) res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (!res.getHeader('Cross-Origin-Resource-Policy')) res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  if (!res.getHeader('Permissions-Policy')) res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (!res.getHeader('Content-Security-Policy')) {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self' https: data: blob:; script-src 'self' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com https://fonts.googleapis.com; img-src 'self' https: data: blob:; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'"
    );
  }
  const isTls = req.headers['x-forwarded-proto'] === 'https' || req.socket.encrypted;
  if (isTls && !res.getHeader('Strict-Transport-Security')) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function hashPassword(password, saltHex) {
  const salt = saltHex ? Buffer.from(saltHex, 'hex') : crypto.randomBytes(16);
  const derived = crypto.scryptSync(String(password), salt, 64);
  return { salt: salt.toString('hex'), hash: derived.toString('hex') };
}

function verifyPassword(password, saltHex, expectedHashHex) {
  const derived = crypto.scryptSync(String(password), Buffer.from(saltHex, 'hex'), 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(String(expectedHashHex), 'hex'));
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    role: user.role || 'user',
    emailVerified: !!user.emailVerified,
    subscriptionStatus: String(user.subscriptionStatus || 'trial'),
    subscriptionPlan: String(user.subscriptionPlan || 'trial'),
    trialEndsAt: user.trialEndsAt || null,
    planRenewsAt: user.planRenewsAt || null,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt || null,
  };
}

function isAdminUser(user) {
  if (!user) return false;
  return String(user.role || '').toLowerCase() === 'admin' || ADMIN_EMAILS.includes(String(user.email || '').toLowerCase());
}

function makeShortToken() {
  return crypto.randomBytes(24).toString('hex');
}

function hashOneTimeToken(token) {
  return crypto.createHash('sha256').update(String(token || '')).digest('hex');
}

function cleanupAuthTokens(db) {
  const now = Date.now();
  db.passwordResetTokens = (db.passwordResetTokens || []).filter((t) => {
    const expiresAt = new Date(t.expiresAt || 0).getTime();
    return !t.usedAt && expiresAt > now;
  });
  db.emailVerifyTokens = (db.emailVerifyTokens || []).filter((t) => {
    const expiresAt = new Date(t.expiresAt || 0).getTime();
    return !t.usedAt && expiresAt > now;
  });
}

function issueOneTimeToken(collection, basePayload, ttlMs) {
  const now = Date.now();
  const token = makeShortToken();
  collection.push({
    id: crypto.randomUUID(),
    ...basePayload,
    tokenHash: hashOneTimeToken(token),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttlMs).toISOString(),
    usedAt: null,
  });
  return token;
}

function consumeOneTimeToken(collection, rawToken) {
  const tokenHash = hashOneTimeToken(rawToken);
  const now = Date.now();
  const record = collection.find((item) => {
    const expiresAt = new Date(item.expiresAt || 0).getTime();
    return !item.usedAt && item.tokenHash === tokenHash && expiresAt > now;
  });
  if (!record) return null;
  record.usedAt = new Date().toISOString();
  return record;
}

function isEmailDeliveryConfigured() {
  return !!(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL);
}

function createPasswordResetToken(db, user) {
  cleanupAuthTokens(db);
  db.passwordResetTokens = db.passwordResetTokens.filter((t) => t.userId !== user.id);
  return issueOneTimeToken(
    db.passwordResetTokens,
    { userId: user.id, email: user.email, type: 'password_reset' },
    PASSWORD_RESET_TTL_MS
  );
}

function createEmailVerifyToken(db, user) {
  cleanupAuthTokens(db);
  db.emailVerifyTokens = db.emailVerifyTokens.filter((t) => t.userId !== user.id);
  return issueOneTimeToken(
    db.emailVerifyTokens,
    { userId: user.id, email: user.email, type: 'email_verify' },
    EMAIL_VERIFY_TTL_MS
  );
}

async function sendPasswordResetEmail(email, token) {
  const text = [
    'Wholesale Deal Finder password reset request',
    '',
    `Reset token: ${token}`,
    '',
    'Enter this token in the app to set a new password.',
    `This token expires in ${Math.round(PASSWORD_RESET_TTL_MS / 60000)} minutes.`,
  ].join('\n');
  await sendEmailViaSendgrid(email, 'Wholesale Deal Finder Password Reset', text);
}

async function sendEmailVerificationEmail(email, token) {
  const text = [
    'Wholesale Deal Finder email verification',
    '',
    `Verification token: ${token}`,
    '',
    'Enter this token in the app to verify your account.',
    `This token expires in ${Math.round(EMAIL_VERIFY_TTL_MS / 3600000)} hours.`,
  ].join('\n');
  await sendEmailViaSendgrid(email, 'Verify Your Wholesale Deal Finder Email', text);
}

function createSessionRecord(db, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const session = {
    token,
    userId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
  };
  db.sessions = db.sessions.filter((s) => new Date(s.expiresAt).getTime() > now);
  db.sessions.push(session);
  return session;
}

function getCurrentUserFromRequest(req) {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  if (!token) return { user: null, token: '' };
  const db = readAppDb();
  const now = Date.now();
  db.sessions = db.sessions.filter((s) => new Date(s.expiresAt).getTime() > now);
  const session = db.sessions.find((s) => s.token === token);
  if (!session) {
    writeAppDb(db);
    return { user: null, token };
  }
  const user = db.users.find((u) => u.id === session.userId) || null;
  writeAppDb(db);
  return { user, token };
}

function appendAuditLog(db, req, userId, eventType, payload) {
  db.auditLogs.push({
    id: crypto.randomUUID(),
    userId: userId || null,
    eventType,
    payload,
    ip: req?.socket?.remoteAddress || '',
    userAgent: req?.headers?.['user-agent'] || '',
    createdAt: new Date().toISOString(),
  });
  if (db.auditLogs.length > 5000) db.auditLogs = db.auditLogs.slice(-5000);
}

function readSampleListings() {
  try {
    const raw = fs.readFileSync(SAMPLE_PATH, 'utf8').replace(/^\uFEFF/, '');
    const base = JSON.parse(raw);
    return expandSampleInventory(base);
  } catch {
    return [];
  }
}

function expandSampleInventory(baseListings) {
  if (!Array.isArray(baseListings)) return [];
  if (SAMPLE_VARIANT_COUNT <= 1) {
    return baseListings.map((item) => ({
      ...item,
      photos: Array.isArray(item.photos) ? item.photos.filter(Boolean) : [],
      photoCount: Number(item.photoCount) || (Array.isArray(item.photos) ? item.photos.length : 0),
    }));
  }

  const expanded = [];
  const variantCount = SAMPLE_VARIANT_COUNT;

  baseListings.forEach((item) => {
    const basePhotos = Array.isArray(item.photos) ? item.photos.filter(Boolean) : [];
    expanded.push({
      ...item,
      photos: basePhotos,
      photoCount: Math.max(Number(item.photoCount) || 0, basePhotos.length),
    });
    for (let v = 1; v < variantCount; v += 1) {
      const jitter = (v - 4) * 0.0035;
      const priceFactor = 0.9 + v * 0.03;
      const clone = {
        ...item,
        id: `${item.id}-v${v}`,
        address: item.address.replace(/^(\d+)/, (_, n) => String(Number(n) + v * 3)),
        price: Math.max(45000, Math.round((Number(item.price) || 100000) * priceFactor)),
        sqft: Math.max(700, Math.round((Number(item.sqft) || 1200) * (0.94 + v * 0.02))),
        daysOnZillow: Math.max(1, (Number(item.daysOnZillow) || 20) + v * 2),
        lat: Number.isFinite(item.lat) ? Number(item.lat) + jitter : item.lat,
        lng: Number.isFinite(item.lng) ? Number(item.lng) - jitter : item.lng,
        photos: basePhotos,
        photoCount: Math.max(Number(item.photoCount) || 0, basePhotos.length),
      };
      expanded.push(clone);
    }
  });

  return expanded;
}

function parseCurrencyLike(input) {
  if (input == null) return null;
  const clean = String(input).replace(/[^\d.-]/g, '');
  if (!clean) return null;
  const n = Number(clean);
  return Number.isFinite(n) ? n : null;
}

function toPhotos(rawPhoto, rawImgSrc) {
  const photoList = [];
  if (Array.isArray(rawPhoto)) {
    rawPhoto.forEach((p) => {
      if (typeof p === 'string') photoList.push(p);
      if (p && typeof p.url === 'string') photoList.push(p.url);
      if (p && typeof p.mixedSources?.jpeg?.[0]?.url === 'string') photoList.push(p.mixedSources.jpeg[0].url);
    });
  }
  if (typeof rawImgSrc === 'string') photoList.push(rawImgSrc);
  return [...new Set(photoList)].filter(Boolean);
}

function isTrustedPropertyPhotoUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const u = new URL(value);
    const host = u.hostname.toLowerCase();
    const trustedHosts = [
      'zillowstatic.com',
      'photos.zillowstatic.com',
      'zillow.com',
      'rdcpix.com',
      'realtor.com',
      'redfin.com',
      'ssl.cdn-redfin.com',
      'cdnparap130.paragonrels.com',
    ];
    return trustedHosts.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

function keepTrustedPropertyPhotos(photoUrls) {
  if (!Array.isArray(photoUrls)) return [];
  return [...new Set(photoUrls.filter(isTrustedPropertyPhotoUrl))];
}

function hasZillowPhoto(listing) {
  const photos = Array.isArray(listing?.photos) ? listing.photos : [];
  return photos.some((url) => {
    try {
      const host = new URL(String(url)).hostname.toLowerCase();
      return host.includes('zillowstatic.com') || host.includes('zillow.com');
    } catch {
      return false;
    }
  });
}

function looksLikeImageUrl(value) {
  if (typeof value !== 'string') return false;
  if (!/^https?:\/\//i.test(value)) return false;
  return /\.(jpg|jpeg|png|webp|avif)(\?|$)/i.test(value) || /(image|images|photo|photos|zillowstatic|cdn)/i.test(value);
}

function extractImageUrlsDeep(input, bucket = new Set()) {
  if (input == null) return bucket;
  if (typeof input === 'string') {
    if (looksLikeImageUrl(input)) bucket.add(input);
    return bucket;
  }
  if (Array.isArray(input)) {
    input.forEach((v) => extractImageUrlsDeep(v, bucket));
    return bucket;
  }
  if (typeof input === 'object') {
    Object.entries(input).forEach(([key, value]) => {
      if (typeof value === 'string' && looksLikeImageUrl(value)) {
        bucket.add(value);
      }
      if (/photo|image|img|media/i.test(key)) {
        extractImageUrlsDeep(value, bucket);
      } else if (typeof value === 'object') {
        extractImageUrlsDeep(value, bucket);
      }
    });
  }
  return bucket;
}

async function fetchPhotosFromListingPage(listingUrl) {
  if (!listingUrl || !/^https?:\/\//i.test(String(listingUrl))) return [];
  try {
    const response = await fetch(String(listingUrl), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!response.ok) return [];
    const html = await response.text();
    const matches = html.match(/https?:\/\/[^"'\\s>]+/g) || [];
    const out = [];
    for (const raw of matches) {
      const url = raw.replace(/\\u002F/g, '/').replace(/\\\//g, '/');
      if (looksLikeImageUrl(url) && /(zillow|photos|image|cdn)/i.test(url)) out.push(url);
    }
    return [...new Set(out)].slice(0, 40);
  } catch {
    return [];
  }
}

function normalizeRapidApiListing(item, idx) {
  const price =
    parseCurrencyLike(item?.price) ??
    parseCurrencyLike(item?.unformattedPrice) ??
    parseCurrencyLike(item?.listPrice) ??
    parseCurrencyLike(item?.hdpData?.homeInfo?.price) ??
    0;

  const beds = Number(item?.beds) || Number(item?.bedrooms) || Number(item?.hdpData?.homeInfo?.bedrooms) || 0;
  const baths = Number(item?.baths) || Number(item?.bathrooms) || Number(item?.hdpData?.homeInfo?.bathrooms) || 0;

  const address =
    item?.address ||
    item?.streetAddress ||
    item?.hdpData?.homeInfo?.streetAddress ||
    item?.addressStreet ||
    'Unknown address';

  const city = item?.addressCity || item?.city || item?.hdpData?.homeInfo?.city || '';
  const state = item?.addressState || item?.state || item?.hdpData?.homeInfo?.state || '';

  const photos = keepTrustedPropertyPhotos(toPhotos(item?.photos, item?.imgSrc));
  const daysOnZillow = Number(item?.daysOnZillow) || Number(item?.hdpData?.homeInfo?.daysOnZillow) || 0;
  const lat = Number(item?.latLong?.latitude ?? item?.latitude ?? item?.hdpData?.homeInfo?.latitude);
  const lng = Number(item?.latLong?.longitude ?? item?.longitude ?? item?.hdpData?.homeInfo?.longitude);

  return {
    id: String(item?.zpid || item?.id || `rapid-${idx}`),
    address: city && state && !String(address).includes(',') ? `${address}, ${city}, ${state}` : address,
    state,
    city,
    price,
    beds,
    baths,
    sqft: Number(item?.livingArea) || Number(item?.area) || Number(item?.hdpData?.homeInfo?.livingArea) || 0,
    yearBuilt: Number(item?.yearBuilt) || Number(item?.hdpData?.homeInfo?.yearBuilt) || 0,
    daysOnZillow,
    photoCount: photos.length,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    url: item?.detailUrl ? `https://www.zillow.com${item.detailUrl}` : 'https://www.zillow.com/',
    description:
      item?.statusText ||
      item?.brokerName ||
      (item?.listing_sub_type?.is_FSBA ? 'FSBA listing detected.' : 'No detailed description available from feed.'),
    photos: photos.slice(0, 24),
  };
}

function simpleHash(input) {
  const s = String(input || 'x');
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function demoPhone(seed, suffix) {
  const h = simpleHash(`${seed}-${suffix}`);
  const a = String((h % 800) + 200).padStart(3, '0');
  const b = String(((h >> 5) % 900) + 100).padStart(3, '0');
  const c = String(((h >> 9) % 9000) + 1000).padStart(4, '0');
  return `+1${a}${b}${c}`;
}

function cleanEmailToken(input) {
  return String(input || 'contact').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 18) || 'contact';
}

function attachListingContacts(listing) {
  const base = String(listing?.id || listing?.address || 'listing');
  const cityToken = cleanEmailToken(listing?.city || 'city');
  const ownerName = listing?.contacts?.owner?.name || 'Property Owner';
  const agentName = listing?.contacts?.agent?.name || 'Listing Agent';
  return {
    ...listing,
    contacts: {
      source: listing?.contacts?.source || 'Demo placeholder (replace with real contact provider)',
      owner: {
        name: ownerName,
        phone: listing?.contacts?.owner?.phone || demoPhone(base, 'owner'),
        email: listing?.contacts?.owner?.email || `owner.${cityToken}.${cleanEmailToken(base)}@examplemail.com`,
      },
      agent: {
        name: agentName,
        phone: listing?.contacts?.agent?.phone || demoPhone(base, 'agent'),
        email: listing?.contacts?.agent?.email || `agent.${cityToken}.${cleanEmailToken(base)}@examplemail.com`,
      },
    },
  };
}

function normalizeLocationText(location) {
  const raw = String(location || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!raw) return { raw: '', tokens: [], stateCode: '' };
  return {
    raw,
    tokens: raw.split(/[\s,]+/).filter(Boolean),
    stateCode: STATE_NAME_TO_CODE[raw] || '',
  };
}

function matchesLocation(item, location) {
  const parsed = normalizeLocationText(location);
  if (!parsed.raw) return true;

  const city = String(item.city || '').toLowerCase();
  const stateCode = String(item.state || '').toLowerCase();
  const address = String(item.address || '').toLowerCase();
  const haystack = `${address} ${city} ${stateCode}`;

  if (parsed.stateCode && stateCode === parsed.stateCode.toLowerCase()) return true;
  if (haystack.includes(parsed.raw)) return true;
  return parsed.tokens.every((t) => haystack.includes(t));
}

function applyFilters(listings, filters) {
  return listings.filter((item) => {
    const matchesCityState = matchesLocation(item, filters.location);
    const matchesMin = filters.minPrice == null || item.price >= filters.minPrice;
    const matchesMax = filters.maxPrice == null || item.price <= filters.maxPrice;
    const matchesBeds = filters.beds == null || item.beds >= filters.beds;
    const matchesBaths = filters.baths == null || item.baths >= filters.baths;
    const hasMapFilter = filters.neLat != null && filters.neLng != null && filters.swLat != null && filters.swLng != null;
    const matchesMapBounds = !hasMapFilter
      ? true
      : item.lat != null &&
        item.lng != null &&
        item.lat <= filters.neLat &&
        item.lat >= filters.swLat &&
        item.lng <= filters.neLng &&
        item.lng >= filters.swLng;
    const hasPolygon = Array.isArray(filters.polygon) && filters.polygon.length >= 3;
    const matchesPolygon = !hasPolygon
      ? true
      : item.lat != null && item.lng != null && pointInPolygon([item.lat, item.lng], filters.polygon);

    return matchesCityState && matchesMin && matchesMax && matchesBeds && matchesBaths && matchesMapBounds && matchesPolygon;
  });
}

function pointInPolygon(point, polygon) {
  const x = point[1];
  const y = point[0];
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][1], yi = polygon[i][0];
    const xj = polygon[j][1], yj = polygon[j][0];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-12) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function normalizeSearch(urlObj) {
  const p = urlObj.searchParams;
  const toNum = (v) => {
    if (v == null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const toBool = (v) => {
    if (v == null) return false;
    const s = String(v).trim().toLowerCase();
    return s === '1' || s === 'true' || s === 'yes' || s === 'on';
  };

  return {
    location: (p.get('location') || '').trim(),
    minPrice: toNum(p.get('minPrice')),
    maxPrice: toNum(p.get('maxPrice')),
    beds: toNum(p.get('beds')),
    baths: toNum(p.get('baths')),
    page: Math.max(1, toNum(p.get('page')) || 1),
    pageSize: Math.max(30, Math.min(50, toNum(p.get('pageSize')) || 30)),
    neLat: toNum(p.get('neLat')),
    neLng: toNum(p.get('neLng')),
    swLat: toNum(p.get('swLat')),
    swLng: toNum(p.get('swLng')),
    allowSampleFallback: toBool(p.get('allowSampleFallback')),
    onlyZillowPhotos: toBool(p.get('onlyZillowPhotos')),
    polygon: String(p.get('polygon') || '')
      .split(';')
      .map((pair) => pair.split(',').map((n) => Number(n)))
      .filter((arr) => arr.length === 2 && Number.isFinite(arr[0]) && Number.isFinite(arr[1])),
  };
}

function canUseRapidApiMode(filters) {
  return ZILLOW_MODE.toLowerCase() === 'rapidapi' && !!ZILLOW_RAPIDAPI_KEY && !!filters.location;
}

function wantsLiveMode() {
  const mode = String(ZILLOW_MODE || '').toLowerCase();
  return mode === 'rapidapi' || mode === 'web';
}

function hasRealRapidApiKey() {
  const key = String(ZILLOW_RAPIDAPI_KEY || '').trim();
  if (!key) return false;
  return !/(your[_-]?real[_-]?key|your[_-]?actual[_-]?rapidapi[_-]?key|your[_-]?key|rapidapi[_-]?key|from[_-]?dashboard|example|paste|xxxx+)/i.test(key);
}

async function rapidApiGet(pathname, params = {}, options = {}) {
  const baseUrl = options.baseUrl || ZILLOW_RAPIDAPI_BASE_URL;
  const host = options.host || ZILLOW_RAPIDAPI_HOST;
  const retries = Math.max(1, Number(options.retries || 2));
  const timeoutMs = Math.max(3000, Number(options.timeoutMs || 12000));
  const endpoint = new URL(pathname, baseUrl);
  Object.entries(params).forEach(([k, v]) => {
    if (v == null || v === '') return;
    endpoint.searchParams.set(k, String(v));
  });

  let lastError = null;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': ZILLOW_RAPIDAPI_KEY,
          'X-RapidAPI-Host': host,
        },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`RapidAPI Zillow request failed (${response.status}): ${text.slice(0, 220)}`);
      }
      return response.json();
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 300));
      }
    }
  }
  throw lastError || new Error('RapidAPI request failed');
}

async function fetchRapidApiListings(filters) {
  const pageSize = Math.max(1, filters.pageSize || 30);
  const targetCount = Math.max(pageSize, ZILLOW_RESULTS_LIMIT);
  const startPage = Math.max(1, Number(filters.page) || 1);
  const maxPagesToScan = 4;

  const tryPrimaryProvider = async () => {
    const merged = [];
    const seen = new Set();
    for (let i = 0; i < maxPagesToScan && merged.length < targetCount; i += 1) {
      const page = startPage + i;
      const data = await rapidApiGet('/propertyExtendedSearch', {
        location: filters.location,
        status_type: 'ForSale',
        sort: 'Newest',
        page,
        price_min: filters.minPrice,
        price_max: filters.maxPrice,
        beds_min: filters.beds,
        baths_min: filters.baths,
      });
      const props = Array.isArray(data?.props) ? data.props : [];
      if (!props.length) break;
      props.forEach((raw, idx) => {
        const normalized = normalizeRapidApiListing(raw, idx);
        if (!normalized?.id || normalized.price <= 0) return;
        if (seen.has(normalized.id)) return;
        seen.add(normalized.id);
        merged.push(normalized);
      });
    }
    return merged.slice(0, targetCount);
  };

  const tryAltProvider = async () => {
    const merged = [];
    const seen = new Set();
    for (let i = 0; i < maxPagesToScan && merged.length < targetCount; i += 1) {
      const page = startPage + i;
      const data = await rapidApiGet('/api/v1/search/by-location', {
        location: filters.location,
        page,
        listing_status: 'for_sale',
        min_price: filters.minPrice,
        max_price: filters.maxPrice,
        min_beds: filters.beds,
        min_baths: filters.baths,
      }, {
        host: ZILLOW_ALT_RAPIDAPI_HOST,
        baseUrl: ZILLOW_ALT_RAPIDAPI_BASE_URL,
      });
      const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data?.results) ? data.results : [];
      if (!rows.length) break;
      rows.forEach((raw, idx) => {
        const normalized = normalizeAltRapidApiListing(raw, idx);
        if (!normalized?.id || normalized.price <= 0) return;
        if (seen.has(normalized.id)) return;
        seen.add(normalized.id);
        merged.push(normalized);
      });
    }
    return merged.slice(0, targetCount);
  };

  const providerErrors = [];
  try {
    const primary = await tryPrimaryProvider();
    if (primary.length) return { provider: 'rapidapi-primary', listings: primary };
  } catch (err) {
    providerErrors.push(`Primary provider failed: ${String(err?.message || err)}`);
  }

  try {
    const alt = await tryAltProvider();
    if (alt.length) return { provider: 'rapidapi-alt', listings: alt };
  } catch (err) {
    providerErrors.push(`Alt provider failed: ${String(err?.message || err)}`);
  }

  throw new Error(providerErrors.join(' | ') || 'RapidAPI providers returned no listings.');
}

function deepCollectListResults(input, out = []) {
  if (input == null) return out;
  if (Array.isArray(input)) {
    input.forEach((v) => deepCollectListResults(v, out));
    return out;
  }
  if (typeof input === 'object') {
    Object.entries(input).forEach(([k, v]) => {
      if (k === 'listResults' && Array.isArray(v)) out.push(...v);
      deepCollectListResults(v, out);
    });
  }
  return out;
}

function cleanLocationForPath(location) {
  return String(location || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9,-]/g, '')
    .toLowerCase();
}

function dedupeListings(listings) {
  const seen = new Set();
  const out = [];
  listings.forEach((item) => {
    if (!item) return;
    const key = [
      String(item.id || '').toLowerCase(),
      String(item.address || '').toLowerCase().replace(/\s+/g, ' ').trim(),
    ]
      .filter(Boolean)
      .join('|');
    if (!key) return;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(item);
  });
  return out;
}

function stampListings(listings, opts = {}) {
  const now = new Date().toISOString();
  const source = String(opts.source || 'unknown');
  const provider = String(opts.provider || source);
  const verifiedMarket = !!opts.verifiedMarket;
  const marketStatus = String(opts.marketStatus || (verifiedMarket ? 'for_sale' : 'unknown'));
  return listings.map((item) => {
    const trustedPhotos = keepTrustedPropertyPhotos(item?.photos || []);
    const effectivePhotos = source === 'sample-zillow-like-dataset' ? [] : trustedPhotos;
    return {
    ...item,
    photos: effectivePhotos,
    photoCount: effectivePhotos.length,
    sourceProvider: provider,
    sourceLabel: source,
    verifiedMarket,
    marketStatus,
    lastVerifiedAt: now,
  };
  });
}

function normalizeAltRapidApiListing(item, idx) {
  const address =
    item?.address ||
    item?.full_address ||
    item?.street ||
    item?.location?.address ||
    'Unknown address';
  const city = item?.city || item?.location?.city || '';
  const state = item?.state || item?.location?.state || '';
  const photos = keepTrustedPropertyPhotos(
    toPhotos(item?.photos || item?.images || item?.photo_urls, item?.primary_photo || item?.image || item?.imgSrc)
  );
  const lat = Number(item?.latitude ?? item?.lat ?? item?.location?.lat);
  const lng = Number(item?.longitude ?? item?.lng ?? item?.location?.lng);

  return {
    id: String(item?.zpid || item?.id || item?.property_id || `alt-${idx}`),
    address: city && state && !String(address).includes(',') ? `${address}, ${city}, ${state}` : address,
    state,
    city,
    price: parseCurrencyLike(item?.price) ?? parseCurrencyLike(item?.list_price) ?? 0,
    beds: Number(item?.beds ?? item?.bedrooms) || 0,
    baths: Number(item?.baths ?? item?.bathrooms) || 0,
    sqft: Number(item?.sqft ?? item?.living_area ?? item?.livingArea) || 0,
    yearBuilt: Number(item?.year_built ?? item?.yearBuilt) || 0,
    daysOnZillow: Number(item?.days_on_market ?? item?.daysOnMarket ?? 0) || 0,
    photoCount: photos.length,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    url: item?.url || item?.listing_url || item?.detailUrl || 'https://www.zillow.com/',
    description: item?.description || item?.status || 'No detailed description available from feed.',
    photos: photos.slice(0, 24),
  };
}

async function fetchZillowWebListings(filters) {
  const locationSlug = cleanLocationForPath(filters.location);
  if (!locationSlug) return [];
  const page = Math.max(1, Number(filters.page) || 1);
  const url = `${ZILLOW_WEB_BASE_URL}/homes/for_sale/${locationSlug}_rb/${page}_p/`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Zillow web search failed (${response.status}): ${text.slice(0, 180)}`);
  }

  const html = await response.text();
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i);
  if (!nextDataMatch) throw new Error('Could not find Zillow page data');
  const nextData = JSON.parse(nextDataMatch[1]);
  const listResults = deepCollectListResults(nextData, []);
  if (!listResults.length) return [];

  const normalized = listResults
    .map((item, idx) => normalizeRapidApiListing(item, idx))
    .filter((x) => x.price > 0 && x.url && x.url.includes('/'));

  return dedupeListings(normalized).slice(0, Math.max(filters.pageSize || 30, ZILLOW_RESULTS_LIMIT));
}

function zpidFromListing(listing) {
  const id = String(listing?.id || '');
  if (/^\d+$/.test(id)) return id;
  const zpidMatch = String(listing?.url || '').match(/\/(\d+)_zpid/i);
  if (zpidMatch) return zpidMatch[1];
  return '';
}

async function fetchRapidApiListingPhotos(listing) {
  if (!ZILLOW_RAPIDAPI_KEY) {
    return { photos: Array.isArray(listing?.photos) ? listing.photos.filter(Boolean) : [], source: 'no-rapidapi-key' };
  }

  const listingKey = String(listing?.id || listing?.url || listing?.address || '');
  if (listingPhotoCache.has(listingKey)) {
    return { photos: listingPhotoCache.get(listingKey), source: 'cache' };
  }

  const zpid = zpidFromListing(listing);
  const detailPath = (() => {
    try {
      return new URL(String(listing?.url || '')).pathname;
    } catch {
      return '';
    }
  })();

  const attempts = [];
  if (zpid) attempts.push({ path: '/property', params: { zpid } });
  if (detailPath) attempts.push({ path: '/propertyByUrl', params: { url: detailPath } });
  if (detailPath) attempts.push({ path: '/images', params: { url: detailPath } });
  if (zpid) attempts.push({ path: '/images', params: { zpid } });

  const merged = new Set(Array.isArray(listing?.photos) ? listing.photos.filter(Boolean) : []);
  let source = 'listing';

  for (const attempt of attempts) {
    try {
      const data = await rapidApiGet(attempt.path, attempt.params);
      extractImageUrlsDeep(data, merged);
      source = `rapidapi:${attempt.path}`;
      if (merged.size >= 18) break;
    } catch {
      // Keep trying alternate endpoints; RapidAPI products vary by account.
    }
  }

  if (merged.size < 8) {
    const pagePhotos = await fetchPhotosFromListingPage(listing?.url);
    pagePhotos.forEach((url) => merged.add(url));
    if (pagePhotos.length) source = 'listing-page-html';
  }

  const photos = keepTrustedPropertyPhotos([...merged]).slice(0, 40);
  listingPhotoCache.set(listingKey, photos);
  return { photos, source };
}

function paginate(items, page, pageSize) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);
  return {
    paged,
    total,
    totalPages,
    page: safePage,
    pageSize,
    hasMore: safePage < totalPages,
  };
}

function maskSecret(value) {
  const s = String(value || '');
  if (!s) return '';
  if (s.length <= 8) return '***';
  return `${s.slice(0, 4)}...${s.slice(-4)}`;
}

function liveCacheKey(filters) {
  return JSON.stringify({
    location: filters.location,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    beds: filters.beds,
    baths: filters.baths,
    page: filters.page,
    pageSize: filters.pageSize,
    onlyZillowPhotos: !!filters.onlyZillowPhotos,
  });
}

function getLiveCache(filters) {
  const key = liveCacheKey(filters);
  const row = liveSearchCache.get(key);
  if (!row) return null;
  if (Date.now() - row.at > LIVE_CACHE_TTL_MS) {
    liveSearchCache.delete(key);
    return null;
  }
  return row.payload;
}

function setLiveCache(filters, payload) {
  liveSearchCache.set(liveCacheKey(filters), {
    at: Date.now(),
    payload,
  });
  if (liveSearchCache.size > 500) {
    const entries = [...liveSearchCache.entries()].sort((a, b) => a[1].at - b[1].at);
    while (entries.length > 350) {
      const old = entries.shift();
      if (old) liveSearchCache.delete(old[0]);
    }
  }
}

function recordSourceHealth(location, source, sourceHealth, mode) {
  sourceHealthHistory.push({
    id: crypto.randomUUID(),
    location,
    source,
    mode,
    sourceHealth: Array.isArray(sourceHealth) ? sourceHealth : [],
    createdAt: new Date().toISOString(),
  });
  if (sourceHealthHistory.length > 2000) {
    sourceHealthHistory.splice(0, sourceHealthHistory.length - 2000);
  }
}

function sendJson(res, status, payload) {
  if (!res.getHeader('X-Content-Type-Options')) res.setHeader('X-Content-Type-Options', 'nosniff');
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
      if (body.length > 1_000_000) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      chunks.push(chunk);
      size += chunk.length;
      if (size > 1_500_000) reject(new Error('Payload too large'));
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function verifyStripeWebhookSignature(rawBodyBuffer, signatureHeader) {
  if (!STRIPE_WEBHOOK_SECRET) return false;
  const header = String(signatureHeader || '');
  const parts = header.split(',').map((p) => p.trim());
  const t = parts.find((p) => p.startsWith('t='))?.slice(2);
  const v1 = parts.find((p) => p.startsWith('v1='))?.slice(3);
  if (!t || !v1) return false;
  const payload = `${t}.${rawBodyBuffer.toString('utf8')}`;
  const expected = crypto.createHmac('sha256', STRIPE_WEBHOOK_SECRET).update(payload).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(v1, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

function heuristicPhotoGrade(payload) {
  const listing = payload?.listing || {};
  const text = String(listing.description || '').toLowerCase();
  const price = Number(listing.price) || 0;

  let rehabLevel = 'Light';
  let confidence = 0.62;
  let pctLow = 0.06;
  let pctHigh = 0.14;
  let buyerReaction = 'Most buyers will view this as a light-to-cosmetic project.';
  let dealQuality = 'Potentially viable if spread supports your assignment fee.';
  let motivationSignal = 'Want-to-sell (retail leaning)';

  const heavy = ['fire', 'foundation', 'mold', 'water intrusion', 'full rehab', 'cash only'].some((w) => text.includes(w));
  const medium = ['as-is', 'handyman', 'outdated', 'roof', 'deferred maintenance'].some((w) => text.includes(w));
  const motivated = ['relocation', 'inherited', 'fast close', 'cash only', 'priced to sell quickly'].some((w) => text.includes(w));

  if (medium) {
    rehabLevel = 'Medium';
    confidence = 0.68;
    pctLow = 0.12;
    pctHigh = 0.22;
    buyerReaction = 'Investors will engage if discount is strong and major systems are acceptable.';
  }

  if (heavy) {
    rehabLevel = 'Heavy';
    confidence = 0.74;
    pctLow = 0.2;
    pctHigh = 0.35;
    buyerReaction = 'Only heavier rehab buyers likely. Expect larger discount and slower dispo.';
    dealQuality = 'Proceed only if you can lock a deep enough contract discount.';
  }

  if (motivated) motivationSignal = 'Need-to-sell (motivated)';

  const base = Math.max(price, 120000);
  return {
    source: 'heuristic-fallback',
    rehabLevel,
    repairsEstimateLow: Math.round(base * pctLow),
    repairsEstimateHigh: Math.round(base * pctHigh),
    buyerReaction,
    dealQuality,
    motivationSignal,
    confidence,
  };
}

async function openAiPhotoGrade(payload) {
  const listing = payload?.listing || {};
  const imageUrl = String(payload?.imageUrl || '');
  if (!imageUrl) throw new Error('Missing imageUrl');

  const prompt = [
    'You are a real-estate wholesaling rehab analyst.',
    'Analyze this property photo with listing context and output strict JSON only.',
    'Required keys: rehabLevel (Light|Medium|Heavy), repairsEstimateLow (number), repairsEstimateHigh (number), buyerReaction (string), dealQuality (string), motivationSignal (string), confidence (0..1).',
    'Keep concise and investor-focused.',
    `Listing address: ${listing.address || 'Unknown'}`,
    `Listing description: ${listing.description || 'N/A'}`,
    `Listing price: ${listing.price || 0}`,
  ].join('\n');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: prompt },
            { type: 'input_image', image_url: imageUrl },
          ],
        },
      ],
      max_output_tokens: 400,
    }),
  });

  if (!response.ok) {
    const msg = await response.text();
    throw new Error(`OpenAI photo grade failed (${response.status}): ${msg.slice(0, 300)}`);
  }

  const data = await response.json();
  const rawText = data?.output_text || data?.output?.[0]?.content?.[0]?.text || '';

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    const match = String(rawText).match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Could not parse JSON from model output');
    parsed = JSON.parse(match[0]);
  }

  return {
    source: `openai-${OPENAI_MODEL}`,
    rehabLevel: String(parsed.rehabLevel || 'Medium'),
    repairsEstimateLow: Number(parsed.repairsEstimateLow) || 0,
    repairsEstimateHigh: Number(parsed.repairsEstimateHigh) || 0,
    buyerReaction: String(parsed.buyerReaction || ''),
    dealQuality: String(parsed.dealQuality || ''),
    motivationSignal: String(parsed.motivationSignal || ''),
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.65)),
  };
}

async function gradeSinglePhoto(payload) {
  if (OPENAI_API_KEY) {
    try {
      return await openAiPhotoGrade(payload);
    } catch (err) {
      const fallback = heuristicPhotoGrade(payload);
      fallback.error = String(err?.message || err);
      return fallback;
    }
  }
  return heuristicPhotoGrade(payload);
}

function mergeBatchGrades(grades) {
  if (!grades.length) {
    return {
      source: 'batch-empty',
      rehabLevel: 'Unknown',
      repairsEstimateLow: 0,
      repairsEstimateHigh: 0,
      buyerReaction: 'No photos available.',
      dealQuality: 'Insufficient data.',
      motivationSignal: 'Unknown',
      confidence: 0,
      photoCount: 0,
    };
  }

  const heavyHits = grades.filter((g) => g.rehabLevel === 'Heavy').length;
  const mediumHits = grades.filter((g) => g.rehabLevel === 'Medium').length;
  const dominant = heavyHits > 0 ? 'Heavy' : mediumHits > grades.length / 2 ? 'Medium' : 'Light';
  const avg = (arr) => arr.reduce((sum, x) => sum + x, 0) / arr.length;

  return {
    source: grades.some((g) => String(g.source).startsWith('openai-')) ? 'batch-openai-mixed' : 'batch-heuristic',
    rehabLevel: dominant,
    repairsEstimateLow: Math.round(avg(grades.map((g) => Number(g.repairsEstimateLow) || 0))),
    repairsEstimateHigh: Math.round(avg(grades.map((g) => Number(g.repairsEstimateHigh) || 0))),
    buyerReaction:
      dominant === 'Heavy'
        ? 'Multiple photos indicate major rehab scope. Expect narrower buyer pool and larger discount demands.'
        : dominant === 'Medium'
        ? 'Condition appears mid-level rehab. Buyers will engage if spread and systems checks are solid.'
        : 'Photos indicate mostly lighter rehab/cosmetic scope.',
    dealQuality:
      dominant === 'Heavy'
        ? 'Only pursue with a strong contract discount and clear dispo strategy.'
        : 'Potentially viable wholesale candidate if MAO spread remains healthy.',
    motivationSignal: grades.some((g) => String(g.motivationSignal).toLowerCase().includes('need-to-sell'))
      ? 'Need-to-sell (motivated)'
      : 'Want-to-sell (retail leaning)',
    confidence: Math.max(0, Math.min(1, avg(grades.map((g) => Number(g.confidence) || 0.5)))),
    photoCount: grades.length,
  };
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function estimateArvFromPhotoGrade(listing, batchGrade) {
  const price = Number(listing?.price) || 0;
  const low = Number(batchGrade?.repairsEstimateLow) || 0;
  const high = Number(batchGrade?.repairsEstimateHigh) || 0;
  const repairsMid = (low + high) / 2;
  const rehab = String(batchGrade?.rehabLevel || 'Medium');

  let upliftMultiple = 1.85;
  if (rehab === 'Light') upliftMultiple = 1.55;
  if (rehab === 'Heavy') upliftMultiple = 2.2;

  const baseArv = price + repairsMid * upliftMultiple;
  const floor = Math.max(price * 1.05, price + low * 1.25);
  const ceiling = Math.max(floor, price * 1.95);
  const estimatedArv = Math.round(clamp(baseArv, floor, ceiling));
  const conservativeArv = Math.round(clamp(estimatedArv * 0.93, floor, estimatedArv));
  const aggressiveArv = Math.round(clamp(estimatedArv * 1.08, estimatedArv, ceiling));

  return {
    source: `${batchGrade?.source || 'photo-grade'}-arv-estimator`,
    estimatedArv,
    conservativeArv,
    aggressiveArv,
    confidence: clamp(Number(batchGrade?.confidence) || 0.65, 0, 1),
    rationale:
      rehab === 'Heavy'
        ? 'Heavy rehab signal from photos; ARV reflects larger renovation upside with higher uncertainty.'
        : rehab === 'Light'
        ? 'Light rehab signal from photos; ARV reflects mostly cosmetic value-add.'
        : 'Medium rehab signal from photos; ARV reflects moderate renovation value-add.',
    rehabLevel: rehab,
    repairsEstimateLow: low,
    repairsEstimateHigh: high,
    photoCount: Number(batchGrade?.photoCount) || 0,
  };
}

function localToolTemplate({ tool, listing, analysis }) {
  const a = analysis || {};
  const address = listing?.address || 'Selected property';
  const mao = Number(a.maoBuyer) || 0;
  const contract = Number(a.contractValue) || 0;
  const score = Number(a.dealScore) || 0;

  const templates = {
    'Offer Message Generator': `Subject: Cash Offer - ${address}\n\nHi [Seller Name],\n\nBased on the condition and comparable sales, we can move quickly and buy as-is. Our expected offer range is around ${Math.round(contract - 7000)} to ${Math.round(contract)} with flexible close timing.\n\nIf speed and certainty matter most, we can discuss terms today.\n\n- [Your Name]`,
    'Buyer Message Generator': `Deal Alert: ${address}\n\nARV/MAO Snapshot:\n- MAO: ${mao}\n- Contract ask: ${contract}\n- Deal score: ${score}/100\n\nHighlights:\n- Investor-friendly spread\n- Fast-close potential\n- Bring proof of funds for priority access`,
    'Cold Calling Scripts': `Opening: "Hey [Name], quick question - would you consider an as-is cash offer on ${address}?"\n\nIf yes:\n1) "Great, what kind of timeline are you hoping for?"\n2) "What repairs does the property need right now?"\n3) "If we covered closing costs and moved fast, what price would make sense?"\n\nClose: "If the numbers line up, I can send a clean offer today."`,
    'Marketing Flyer': `PROPERTY: ${address}\nPRICE: ${contract}\nEXIT: Cash buyer / quick close\nWHY IT WORKS:\n- Spread-supported underwriting\n- Rehab opportunity\n- Assignment-ready positioning`,
  };

  return templates[tool] || `Tool: ${tool}\nProperty: ${address}\nMAO: ${mao}\nContract value: ${contract}\nDeal score: ${score}/100`;
}

async function openAiToolRun(payload) {
  const prompt = [
    'You are a real-estate wholesaling assistant.',
    'Generate concise, practical output for the requested tool.',
    'Return plain text only.',
    `Tool: ${payload.tool}`,
    `Listing: ${JSON.stringify(payload.listing || {})}`,
    `Analysis: ${JSON.stringify(payload.analysis || {})}`,
  ].join('\n');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [{ role: 'user', content: [{ type: 'input_text', text: prompt }] }],
      max_output_tokens: 700,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI tool-run failed (${response.status}): ${text.slice(0, 250)}`);
  }

  const data = await response.json();
  return data?.output_text || data?.output?.[0]?.content?.[0]?.text || '';
}

async function generateOutreachMessage({ channel, target, listing, analysis, preparedMessage }) {
  if (preparedMessage) return preparedMessage;

  const targetName = listing?.contacts?.[target]?.name || (target === 'owner' ? 'Owner' : 'Agent');
  const targetPhone = listing?.contacts?.[target]?.phone || 'N/A';
  const targetEmail = listing?.contacts?.[target]?.email || 'N/A';
  const score = Number(analysis?.dealScore) || 0;
  const contractValue = Math.round(Number(analysis?.contractValue) || 0);
  const address = listing?.address || 'Selected property';

  if (OPENAI_API_KEY) {
    try {
      const prompt = [
        `Write a concise ${channel} outreach script to ${targetName} about buying ${address}.`,
        `Use investor tone, respectful language, and clear CTA.`,
        `Deal score: ${score}/100`,
        `Target contract value: ${contractValue}`,
        `Target contact phone: ${targetPhone}`,
        `Target contact email: ${targetEmail}`,
        'If channel is voice_call, write a short call script that can be spoken by AI voice.',
      ].join('\n');

      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          input: [{ role: 'user', content: [{ type: 'input_text', text: prompt }] }],
          max_output_tokens: 350,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.output_text || data?.output?.[0]?.content?.[0]?.text || '';
        if (text.trim()) return text.trim();
      }
    } catch {}
  }

  if (channel === 'voice_call') {
    return `Hi ${targetName}, this is a local cash buyer calling about ${address}. We can buy as-is and close quickly. If you are open to discussing a direct offer around ${formatCurrencyForText(contractValue)}, please call or text us back. Thank you.`;
  }

  return `Hi ${targetName}, this is a local buyer interested in ${address}. We can purchase as-is with a fast close and flexible terms. If you're open to it, we can discuss an offer around ${formatCurrencyForText(contractValue)} and timing that works for you.`;
}

function formatCurrencyForText(value) {
  const n = Number(value) || 0;
  return `$${n.toLocaleString('en-US')}`;
}

function targetContactFor(listing, target) {
  const safeListing = attachListingContacts(listing || {});
  if (target === 'agent') return safeListing.contacts.agent;
  return safeListing.contacts.owner;
}

async function sendSmsViaTwilio(to, body) {
  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
  const form = new URLSearchParams({ To: to, From: TWILIO_FROM_NUMBER, Body: body });
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || `Twilio SMS failed (${response.status})`);
  return { id: data.sid, provider: 'twilio' };
}

async function callViaTwilio(to, script) {
  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
  const twiml = `<Response><Say voice=\"alice\">${String(script).replace(/[<>&]/g, '')}</Say></Response>`;
  const form = new URLSearchParams({ To: to, From: TWILIO_FROM_NUMBER, Twiml: twiml });
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || `Twilio call failed (${response.status})`);
  return { id: data.sid, provider: 'twilio' };
}

async function sendEmailViaSendgrid(to, subject, text) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: SENDGRID_FROM_EMAIL || 'noreply@examplemail.com', name: 'Wholesale Deal Finder' },
      subject,
      content: [{ type: 'text/plain', value: text }],
    }),
  });
  if (!response.ok) {
    const textBody = await response.text();
    throw new Error(`SendGrid failed (${response.status}): ${textBody.slice(0, 240)}`);
  }
  return { provider: 'sendgrid' };
}

function isStripeConfigured() {
  return !!STRIPE_SECRET_KEY;
}

function stripeAuthHeaders() {
  return {
    Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
}

async function stripePost(pathname, formData) {
  const endpoint = `https://api.stripe.com/v1${pathname}`;
  const body = new URLSearchParams(formData);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: stripeAuthHeaders(),
    body,
  });
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!response.ok) {
    const msg = data?.error?.message || `Stripe request failed (${response.status})`;
    throw new Error(msg);
  }
  return data;
}

async function stripeGet(pathname) {
  const endpoint = `https://api.stripe.com/v1${pathname}`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
  });
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!response.ok) {
    const msg = data?.error?.message || `Stripe request failed (${response.status})`;
    throw new Error(msg);
  }
  return data;
}

function ensureUserBillingDefaults(user) {
  const now = Date.now();
  if (!user.trialEndsAt) user.trialEndsAt = new Date(now + BILLING_TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  if (!user.subscriptionPlan) user.subscriptionPlan = 'trial';
  if (!user.subscriptionStatus) user.subscriptionStatus = 'trial';
}

function computeBillingState(user) {
  ensureUserBillingDefaults(user);
  const now = Date.now();
  const trialEnds = new Date(user.trialEndsAt || 0).getTime();
  const trialActive = user.subscriptionStatus === 'trial' && trialEnds > now;
  const trialDaysRemaining = trialActive ? Math.ceil((trialEnds - now) / (24 * 60 * 60 * 1000)) : 0;
  const isActive = user.subscriptionStatus === 'active' || trialActive;
  return {
    plan: user.subscriptionPlan || 'trial',
    status: user.subscriptionStatus || 'trial',
    trialEndsAt: user.trialEndsAt || null,
    trialDaysRemaining,
    renewsAt: user.planRenewsAt || null,
    isActive,
    hasStripeCustomer: !!user.stripeCustomerId,
    hasStripeSubscription: !!user.stripeSubscriptionId,
  };
}

function userHasActiveSubscription(user) {
  if (!user) return false;
  const state = computeBillingState(user);
  return !!state.isActive;
}

function staticContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.js') return 'application/javascript; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  return 'application/octet-stream';
}

function serveFile(res, relativePath) {
  const safePath = relativePath === '/' ? '/index.html' : relativePath;
  const localPath = path.normalize(path.join(PUBLIC_DIR, safePath));

  if (!localPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(localPath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const isHtml = path.extname(localPath).toLowerCase() === '.html';
    res.writeHead(200, {
      'Content-Type': staticContentType(localPath),
      'Cache-Control': isHtml ? 'no-store' : 'public, max-age=86400',
    });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  res.setHeader('X-Request-Id', requestId);
  res.on('finish', () => {
    appLog('http.request', {
      requestId,
      method: req.method,
      path: urlObj.pathname,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
      ip: clientIp(req),
    });
  });
  setSecurityHeaders(req, res);
  const csrfToken = ensureCsrfToken(req, res);

  const rate = enforceRateLimit(req, urlObj);
  if (rate.blocked) {
    res.setHeader('Retry-After', String(rate.retryAfterSec));
    return sendJson(res, 429, { error: 'Too many requests. Slow down and retry shortly.' });
  }

  if (requiresCsrf(req, urlObj) && !isValidCsrf(req)) {
    return sendJson(res, 403, { error: 'Invalid CSRF token. Refresh and try again.' });
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/auth/csrf') {
    return sendJson(res, 200, { token: csrfToken });
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/livez') {
    return sendJson(res, 200, { ok: true, uptimeSec: Math.round(process.uptime()) });
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/readyz') {
    const dbReady = fs.existsSync(APP_DB_PATH) || fs.existsSync(path.dirname(APP_DB_PATH));
    return sendJson(res, 200, { ok: true, dbReady, mode: ZILLOW_MODE, time: new Date().toISOString() });
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/search') {
    const filters = normalizeSearch(urlObj);
    const all = readSampleListings();
    const strictSampleResults = applyFilters(all, filters);
    const hasLocationQuery = Boolean(String(filters.location || '').trim());
    const liveOnlyDefault = wantsLiveMode() && hasLocationQuery && !filters.allowSampleFallback;
    const relaxedSampleResults = !hasLocationQuery && strictSampleResults.length === 0
      ? applyFilters(all, { ...filters, location: '' })
      : [];

    try {
      if (wantsLiveMode() && hasLocationQuery) {
        const cached = getLiveCache(filters);
        if (cached) {
          const cachedPayload = {
            ...cached,
            notes: [
              ...(Array.isArray(cached.notes) ? cached.notes : []),
              'Served from short-term live cache.',
            ],
          };
          recordSourceHealth(filters.location, cachedPayload.source, cachedPayload.sourceHealth, 'cache-hit');
          sendJson(res, 200, cachedPayload);
          return;
        }

        const liveErrors = [];
        const liveMode = String(ZILLOW_MODE || '').toLowerCase();
        let liveResults = [];
        let liveSource = '';
        const sourceHealth = [];

        if (liveMode === 'rapidapi') {
          if (hasRealRapidApiKey()) {
            try {
              const rapid = await fetchRapidApiListings(filters);
              liveResults = rapid.listings || [];
              liveSource = rapid.provider === 'rapidapi-alt' ? 'rapidapi-alt-live' : 'zillow-rapidapi-live';
              sourceHealth.push({
                provider: rapid.provider || 'rapidapi',
                ok: true,
                rows: liveResults.length,
              });
            } catch (err) {
              liveErrors.push(`RapidAPI error: ${String(err?.message || err)}`);
              sourceHealth.push({
                provider: 'rapidapi',
                ok: false,
                error: String(err?.message || err),
              });
            }
          } else {
            liveErrors.push('RapidAPI key missing/placeholder in .env');
            sourceHealth.push({
              provider: 'rapidapi',
              ok: false,
              error: 'RapidAPI key missing/placeholder in .env',
            });
          }
        }

        if (!liveResults.length) {
          try {
            liveResults = await fetchZillowWebListings(filters);
            liveSource = 'zillow-web-live-fallback';
            sourceHealth.push({
              provider: 'zillow-web-fallback',
              ok: true,
              rows: liveResults.length,
            });
          } catch (err) {
            liveErrors.push(`Web fallback error: ${String(err?.message || err)}`);
            sourceHealth.push({
              provider: 'zillow-web-fallback',
              ok: false,
              error: String(err?.message || err),
            });
          }
        }

        if (liveResults.length) {
          if (filters.onlyZillowPhotos) {
            liveResults = liveResults.filter(hasZillowPhoto);
          }
          const stamped = stampListings(liveResults, {
            source: liveSource,
            provider: liveSource,
            verifiedMarket: true,
            marketStatus: 'for_sale',
          });
          const withContacts = stamped.map(attachListingContacts);
          const hasMore = withContacts.length >= filters.pageSize;
          const estimatedTotal = hasMore
            ? filters.page * filters.pageSize + filters.pageSize
            : (filters.page - 1) * filters.pageSize + withContacts.length;
          const payload = {
            source: liveSource,
            total: Math.max(withContacts.length, estimatedTotal),
            totalPages: Math.max(1, Math.ceil(Math.max(withContacts.length, estimatedTotal) / filters.pageSize)),
            page: filters.page,
            pageSize: filters.pageSize,
            hasMore,
            filters,
            results: withContacts.slice(0, filters.pageSize),
            sourceHealth,
            notes: [
              liveSource === 'zillow-rapidapi-live'
                ? 'Live mode enabled with RapidAPI Zillow feed.'
                : liveSource === 'rapidapi-alt-live'
                ? 'Live mode enabled with alternate RapidAPI provider feed.'
                : 'Live Zillow web fallback mode enabled.',
              filters.onlyZillowPhotos
                ? 'Filter active: only listings with Zillow-sourced photos are shown.'
                : 'Only active on-market listings are requested (ForSale).',
              'Listing photos are sourced from trusted property domains only.',
              'Use objective deal factors only. Avoid protected-class targeting per Fair Housing laws.',
            ],
          };
          setLiveCache(filters, payload);
          recordSourceHealth(filters.location, liveSource, sourceHealth, 'live-success');
          sendJson(res, 200, payload);
          return;
        }

        throw new Error(liveErrors.join(' | ') || 'Live listing sources returned no results.');
      }
    } catch (err) {
      if (liveOnlyDefault) {
        const sourceHealth = [
          { provider: 'live', ok: false, error: String(err?.message || err) },
        ];
        const payload = {
          source: 'live-unavailable',
          total: 0,
          totalPages: 1,
          page: filters.page,
          pageSize: filters.pageSize,
          hasMore: false,
          filters,
          results: [],
          sourceHealth,
          notes: [
            'Live providers are unavailable for this query. No sample fallback shown (live-only mode).',
            'Enable "Allow Sample Fallback" to see backup demo listings.',
            String(err?.message || err),
          ],
        };
        recordSourceHealth(filters.location, 'live-unavailable', sourceHealth, 'live-failed');
        sendJson(res, 200, payload);
        return;
      }

      const poolSource = strictSampleResults.length
        ? strictSampleResults
        : relaxedSampleResults;
      const poolFiltered = filters.onlyZillowPhotos ? poolSource.filter(hasZillowPhoto) : poolSource;
      const sourceHealth = [
        { provider: 'sample', ok: true, rows: poolFiltered.length },
      ];
      const pool = stampListings(poolFiltered, {
        source: 'sample-zillow-like-dataset',
        provider: 'sample',
        verifiedMarket: false,
        marketStatus: 'unknown',
      }).map(attachListingContacts);
      const pageMeta = paginate(pool, filters.page, filters.pageSize);
      const payload = {
        source: 'sample-zillow-like-dataset',
        total: pageMeta.total,
        totalPages: pageMeta.totalPages,
        page: pageMeta.page,
        pageSize: pageMeta.pageSize,
        hasMore: pageMeta.hasMore,
        filters,
        results: pageMeta.paged,
        sourceHealth,
        notes: [
          strictSampleResults.length
            ? 'Live Zillow fetch failed, so sample fallback data is shown.'
            : hasLocationQuery
            ? 'No exact location matches found in sample mode for that city/state.'
            : 'No matches in sample mode for those filters.',
          filters.onlyZillowPhotos ? 'Filter active: only Zillow-sourced photos are allowed.' : '',
          String(err?.message || err),
          'Use objective deal factors only. Avoid protected-class targeting per Fair Housing laws.',
        ],
      };
      recordSourceHealth(filters.location, 'sample-zillow-like-dataset', sourceHealth, 'sample-fallback');
      sendJson(res, 200, payload);
      return;
    }

    const poolSource = strictSampleResults.length
      ? strictSampleResults
      : relaxedSampleResults;
    const poolFiltered = filters.onlyZillowPhotos ? poolSource.filter(hasZillowPhoto) : poolSource;
    const sourceHealth = [
      { provider: 'sample', ok: true, rows: poolFiltered.length },
    ];
    const pool = stampListings(poolFiltered, {
      source: 'sample-zillow-like-dataset',
      provider: 'sample',
      verifiedMarket: false,
      marketStatus: 'unknown',
    }).map(attachListingContacts);
    const pageMeta = paginate(pool, filters.page, filters.pageSize);
    const payload = {
      source: 'sample-zillow-like-dataset',
      total: pageMeta.total,
      totalPages: pageMeta.totalPages,
      page: pageMeta.page,
      pageSize: pageMeta.pageSize,
      hasMore: pageMeta.hasMore,
      filters,
      results: pageMeta.paged,
      sourceHealth,
      notes: [
        strictSampleResults.length
          ? 'Sample mode active. For actual property photos from live listings, set ZILLOW_MODE=rapidapi and ZILLOW_RAPIDAPI_KEY.'
          : hasLocationQuery
          ? 'No sample listings match that exact location. Enable live mode for real on-market inventory.'
          : 'No sample listings match those filters.',
        filters.onlyZillowPhotos ? 'Filter active: only Zillow-sourced photos are allowed.' : '',
        'Live mode supports city/state/ZIP queries and returns market listings when available.',
        'No synthetic listings are generated.',
        'Use objective deal factors only. Avoid protected-class targeting per Fair Housing laws.',
      ],
    };
    recordSourceHealth(filters.location, 'sample-zillow-like-dataset', sourceHealth, 'sample-direct');
    sendJson(res, 200, payload);
    return;
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/health') {
    sendJson(res, 200, { ok: true, timestamp: new Date().toISOString() });
    return;
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/public-config') {
    return sendJson(res, 200, {
      appName: 'Wholesale Deal Finder',
      nodeEnv: NODE_ENV,
      sentry: {
        enabled: !!SENTRY_DSN,
        dsn: SENTRY_DSN || '',
      },
    });
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/stripe/webhook') {
    try {
      const raw = await readRawBody(req);
      if (!verifyStripeWebhookSignature(raw, req.headers['stripe-signature'])) {
        return sendJson(res, 400, { error: 'Invalid Stripe signature' });
      }
      const event = JSON.parse(raw.toString('utf8'));
      const db = readAppDb();
      const eventType = String(event?.type || '');
      const obj = event?.data?.object || {};
      const subId = String(obj?.id || obj?.subscription || '');
      let target = null;
      if (subId) {
        target = db.users.find((u) => u.stripeSubscriptionId === subId) || null;
      }
      if (!target && obj?.customer) {
        target = db.users.find((u) => u.stripeCustomerId === String(obj.customer)) || null;
      }
      if (target) {
        if (eventType === 'customer.subscription.updated' || eventType === 'customer.subscription.created') {
          target.stripeSubscriptionId = subId || target.stripeSubscriptionId;
          target.subscriptionPlan = 'pro_monthly_20';
          target.subscriptionStatus = (obj.status === 'trialing' || obj.status === 'active') ? 'active' : (obj.status || 'past_due');
          target.planRenewsAt = obj.current_period_end ? new Date(Number(obj.current_period_end) * 1000).toISOString() : null;
        } else if (eventType === 'customer.subscription.deleted') {
          target.subscriptionStatus = 'canceled';
          target.subscriptionPlan = 'trial';
          target.planRenewsAt = null;
          target.stripeSubscriptionId = '';
        } else if (eventType === 'invoice.payment_failed') {
          target.subscriptionStatus = 'past_due';
        } else if (eventType === 'invoice.paid' && target.subscriptionStatus !== 'active') {
          target.subscriptionStatus = 'active';
          target.subscriptionPlan = 'pro_monthly_20';
        }
      }
      db.billingEvents.push({
        id: crypto.randomUUID(),
        userId: target?.id || null,
        type: `stripe.${eventType || 'unknown'}`,
        payload: { id: event?.id || '', subId, customer: obj?.customer || '' },
        createdAt: new Date().toISOString(),
      });
      if (db.billingEvents.length > 4000) db.billingEvents = db.billingEvents.slice(-4000);
      writeAppDb(db);
      return sendJson(res, 200, { received: true });
    } catch (err) {
      return sendJson(res, 400, { error: String(err?.message || err) });
    }
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/auth/register') {
    try {
      const body = await readJsonBody(req);
      const email = normalizeEmail(body?.email);
      const password = String(body?.password || '');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return sendJson(res, 400, { error: 'Valid email required' });
      if (password.length < 8) return sendJson(res, 400, { error: 'Password must be at least 8 characters' });

      const db = readAppDb();
      if (db.users.some((u) => u.email === email)) return sendJson(res, 409, { error: 'Email already registered' });
      const creds = hashPassword(password);
      const user = {
        id: crypto.randomUUID(),
        email,
        salt: creds.salt,
        passwordHash: creds.hash,
        role: ADMIN_EMAILS.includes(email) ? 'admin' : 'user',
        emailVerified: ADMIN_EMAILS.includes(email),
        subscriptionStatus: 'trial',
        subscriptionPlan: 'trial',
        trialEndsAt: new Date(Date.now() + BILLING_TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
        stripeCustomerId: '',
        stripeSubscriptionId: '',
        planRenewsAt: null,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      db.users.push(user);
      let verification = null;
      if (!user.emailVerified) {
        const token = createEmailVerifyToken(db, user);
        verification = {
          required: true,
          delivery: isEmailDeliveryConfigured() ? 'email' : 'manual',
        };
        if (isEmailDeliveryConfigured()) {
          try {
            await sendEmailVerificationEmail(user.email, token);
          } catch (mailErr) {
            verification.delivery = 'manual';
            verification.emailError = String(mailErr?.message || mailErr);
            verification.devToken = token;
          }
        } else {
          verification.devToken = token;
        }
      }
      const session = createSessionRecord(db, user.id);
      appendAuditLog(db, req, user.id, 'auth.register', { email });
      writeAppDb(db);
      setSessionCookie(res, session.token);
      return sendJson(res, 200, { ok: true, user: sanitizeUser(user), verification });
    } catch (err) {
      return sendJson(res, 400, { error: String(err?.message || err) });
    }
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/auth/login') {
    try {
      const body = await readJsonBody(req);
      const email = normalizeEmail(body?.email);
      const password = String(body?.password || '');
      const lock = isLoginLocked(email, req);
      if (lock.locked) {
        return sendJson(res, 429, { error: `Account temporarily locked. Try again in ${Math.ceil(lock.remainingMs / 60000)} min.` });
      }
      const db = readAppDb();
      const user = db.users.find((u) => u.email === email);
      if (!user) {
        markLoginFailure(email, req);
        return sendJson(res, 401, { error: 'Invalid credentials' });
      }
      if (!verifyPassword(password, user.salt, user.passwordHash)) {
        markLoginFailure(email, req);
        return sendJson(res, 401, { error: 'Invalid credentials' });
      }
      clearLoginFailures(email, req);
      ensureUserBillingDefaults(user);
      user.lastLoginAt = new Date().toISOString();
      const session = createSessionRecord(db, user.id);
      appendAuditLog(db, req, user.id, 'auth.login', { email });
      writeAppDb(db);
      setSessionCookie(res, session.token);
      return sendJson(res, 200, { ok: true, user: sanitizeUser(user) });
    } catch (err) {
      return sendJson(res, 400, { error: String(err?.message || err) });
    }
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/auth/logout') {
    const { token, user } = getCurrentUserFromRequest(req);
    const db = readAppDb();
    if (token) db.sessions = db.sessions.filter((s) => s.token !== token);
    appendAuditLog(db, req, user?.id || null, 'auth.logout', {});
    writeAppDb(db);
    clearSessionCookie(res);
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/auth/me') {
    const { user } = getCurrentUserFromRequest(req);
    return sendJson(res, 200, { authenticated: !!user, user: sanitizeUser(user), csrfToken: csrfToken || '' });
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/auth/request-password-reset') {
    try {
      const body = await readJsonBody(req);
      const email = normalizeEmail(body?.email);
      if (!email) return sendJson(res, 400, { error: 'Email is required' });

      const db = readAppDb();
      cleanupAuthTokens(db);
      const user = db.users.find((u) => u.email === email);
      let delivery = 'not_found';
      let devToken = null;
      let emailError = '';

      if (user) {
        const token = createPasswordResetToken(db, user);
        if (isEmailDeliveryConfigured()) {
          try {
            await sendPasswordResetEmail(user.email, token);
            delivery = 'email';
          } catch (err) {
            delivery = 'manual';
            emailError = String(err?.message || err);
            devToken = token;
          }
        } else {
          delivery = 'manual';
          devToken = token;
        }
        appendAuditLog(db, req, user.id, 'auth.password_reset.request', { email, delivery });
      }

      writeAppDb(db);
      return sendJson(res, 200, {
        ok: true,
        message: 'If that email exists, reset instructions were generated.',
        delivery,
        ...(devToken ? { devToken } : {}),
        ...(emailError ? { emailError } : {}),
      });
    } catch (err) {
      return sendJson(res, 400, { error: String(err?.message || err) });
    }
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/auth/reset-password') {
    try {
      const body = await readJsonBody(req);
      const token = String(body?.token || '').trim();
      const password = String(body?.newPassword || '');
      if (!token) return sendJson(res, 400, { error: 'Reset token required' });
      if (password.length < 8) return sendJson(res, 400, { error: 'Password must be at least 8 characters' });

      const db = readAppDb();
      cleanupAuthTokens(db);
      const tokenRecord = consumeOneTimeToken(db.passwordResetTokens, token);
      if (!tokenRecord) {
        writeAppDb(db);
        return sendJson(res, 400, { error: 'Invalid or expired reset token' });
      }

      const user = db.users.find((u) => u.id === tokenRecord.userId || u.email === tokenRecord.email);
      if (!user) {
        writeAppDb(db);
        return sendJson(res, 404, { error: 'User not found for reset token' });
      }

      const creds = hashPassword(password);
      user.salt = creds.salt;
      user.passwordHash = creds.hash;
      user.lastLoginAt = new Date().toISOString();
      db.sessions = db.sessions.filter((s) => s.userId !== user.id);
      appendAuditLog(db, req, user.id, 'auth.password_reset.complete', { email: user.email });
      writeAppDb(db);
      return sendJson(res, 200, { ok: true, message: 'Password reset complete. Please login again.' });
    } catch (err) {
      return sendJson(res, 400, { error: String(err?.message || err) });
    }
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/auth/request-email-verification') {
    try {
      const { user: sessionUser } = getCurrentUserFromRequest(req);
      const body = await readJsonBody(req);
      const requestedEmail = normalizeEmail(body?.email);
      const db = readAppDb();
      cleanupAuthTokens(db);
      const user = sessionUser || db.users.find((u) => u.email === requestedEmail);

      if (!user) {
        writeAppDb(db);
        return sendJson(res, 200, { ok: true, message: 'If that account exists, a verification token was generated.' });
      }

      if (user.emailVerified) {
        writeAppDb(db);
        return sendJson(res, 200, { ok: true, message: 'Email is already verified.', alreadyVerified: true });
      }

      const token = createEmailVerifyToken(db, user);
      let delivery = 'manual';
      let devToken = token;
      let emailError = '';
      if (isEmailDeliveryConfigured()) {
        try {
          await sendEmailVerificationEmail(user.email, token);
          delivery = 'email';
          devToken = null;
        } catch (err) {
          emailError = String(err?.message || err);
        }
      }

      appendAuditLog(db, req, user.id, 'auth.email_verify.request', { email: user.email, delivery });
      writeAppDb(db);
      return sendJson(res, 200, {
        ok: true,
        message: 'Verification token generated.',
        delivery,
        ...(devToken ? { devToken } : {}),
        ...(emailError ? { emailError } : {}),
      });
    } catch (err) {
      return sendJson(res, 400, { error: String(err?.message || err) });
    }
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/auth/verify-email') {
    try {
      const body = await readJsonBody(req);
      const token = String(body?.token || '').trim();
      if (!token) return sendJson(res, 400, { error: 'Verification token required' });

      const db = readAppDb();
      cleanupAuthTokens(db);
      const tokenRecord = consumeOneTimeToken(db.emailVerifyTokens, token);
      if (!tokenRecord) {
        writeAppDb(db);
        return sendJson(res, 400, { error: 'Invalid or expired verification token' });
      }

      const user = db.users.find((u) => u.id === tokenRecord.userId || u.email === tokenRecord.email);
      if (!user) {
        writeAppDb(db);
        return sendJson(res, 404, { error: 'User not found for verification token' });
      }

      user.emailVerified = true;
      user.role = user.role || (ADMIN_EMAILS.includes(user.email) ? 'admin' : 'user');
      appendAuditLog(db, req, user.id, 'auth.email_verify.complete', { email: user.email });
      writeAppDb(db);
      return sendJson(res, 200, { ok: true, user: sanitizeUser(user) });
    } catch (err) {
      return sendJson(res, 400, { error: String(err?.message || err) });
    }
  }

  if (urlObj.pathname.startsWith('/api/user/')) {
    const { user } = getCurrentUserFromRequest(req);
    if (!user) return sendJson(res, 401, { error: 'Authentication required' });

    if (req.method === 'GET' && urlObj.pathname === '/api/user/saved-searches') {
      const db = readAppDb();
      const rows = db.savedSearches.filter((s) => s.userId === user.id);
      return sendJson(res, 200, { items: rows });
    }

    if (req.method === 'POST' && urlObj.pathname === '/api/user/saved-searches') {
      try {
        const body = await readJsonBody(req);
        const name = String(body?.name || 'Saved Search').trim().slice(0, 80);
        const query = body?.query || {};
        const db = readAppDb();
        const row = {
          id: crypto.randomUUID(),
          userId: user.id,
          name: name || 'Saved Search',
          query,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.savedSearches.push(row);
        appendAuditLog(db, req, user.id, 'search.save', { searchId: row.id, name: row.name });
        writeAppDb(db);
        return sendJson(res, 200, { ok: true, item: row });
      } catch (err) {
        return sendJson(res, 400, { error: String(err?.message || err) });
      }
    }

    if (req.method === 'DELETE' && urlObj.pathname === '/api/user/saved-searches') {
      const id = String(urlObj.searchParams.get('id') || '');
      const db = readAppDb();
      db.savedSearches = db.savedSearches.filter((s) => !(s.userId === user.id && s.id === id));
      appendAuditLog(db, req, user.id, 'search.delete', { searchId: id });
      writeAppDb(db);
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'GET' && urlObj.pathname === '/api/user/saved-deals') {
      const db = readAppDb();
      const rows = db.savedDeals.filter((d) => d.userId === user.id);
      return sendJson(res, 200, { items: rows });
    }

    if (req.method === 'POST' && urlObj.pathname === '/api/user/saved-deals') {
      try {
        const body = await readJsonBody(req);
        const listing = body?.listing || {};
        if (!listing?.address) return sendJson(res, 400, { error: 'listing.address required' });
        const analysis = body?.analysis || {};
        const db = readAppDb();
        const row = {
          id: crypto.randomUUID(),
          userId: user.id,
          listing,
          analysis,
          notes: String(body?.notes || '').slice(0, 500),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.savedDeals.push(row);
        appendAuditLog(db, req, user.id, 'deal.save', { dealId: row.id, address: listing.address });
        writeAppDb(db);
        return sendJson(res, 200, { ok: true, item: row });
      } catch (err) {
        return sendJson(res, 400, { error: String(err?.message || err) });
      }
    }

    if (req.method === 'DELETE' && urlObj.pathname === '/api/user/saved-deals') {
      const id = String(urlObj.searchParams.get('id') || '');
      const db = readAppDb();
      db.savedDeals = db.savedDeals.filter((d) => !(d.userId === user.id && d.id === id));
      appendAuditLog(db, req, user.id, 'deal.delete', { dealId: id });
      writeAppDb(db);
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'GET' && urlObj.pathname === '/api/user/audit-logs') {
      const limit = Math.max(10, Math.min(200, Number(urlObj.searchParams.get('limit') || 100)));
      const db = readAppDb();
      const rows = db.auditLogs.filter((a) => a.userId === user.id).slice(-limit).reverse();
      return sendJson(res, 200, { items: rows });
    }

    if (req.method === 'GET' && urlObj.pathname === '/api/user/outreach-consent-logs') {
      const limit = Math.max(10, Math.min(300, Number(urlObj.searchParams.get('limit') || 120)));
      const db = readAppDb();
      const rows = db.auditLogs
        .filter((a) => a.userId === user.id)
        .filter((a) => String(a.eventType || '').startsWith('outreach.'))
        .slice(-limit)
        .reverse()
        .map((row) => ({
          id: row.id,
          eventType: row.eventType,
          createdAt: row.createdAt,
          ip: row.ip,
          userAgent: row.userAgent,
          payload: row.payload || {},
        }));
      return sendJson(res, 200, { items: rows });
    }
  }

  if (urlObj.pathname.startsWith('/api/crm/')) {
    const { user } = getCurrentUserFromRequest(req);
    if (!user) return sendJson(res, 401, { error: 'Authentication required' });

    if (req.method === 'GET' && urlObj.pathname === '/api/crm/leads') {
      const db = readAppDb();
      const items = db.crmLeads
        .filter((l) => l.userId === user.id)
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
      return sendJson(res, 200, { items });
    }

    if (req.method === 'POST' && urlObj.pathname === '/api/crm/leads') {
      try {
        const body = await readJsonBody(req);
        const db = readAppDb();
        const row = {
          id: crypto.randomUUID(),
          userId: user.id,
          listingId: String(body?.listingId || ''),
          address: String(body?.address || '').slice(0, 220),
          stage: String(body?.stage || 'new').slice(0, 30),
          priority: String(body?.priority || 'medium').slice(0, 20),
          contactName: String(body?.contactName || '').slice(0, 120),
          contactPhone: String(body?.contactPhone || '').slice(0, 60),
          contactEmail: String(body?.contactEmail || '').slice(0, 120),
          notes: String(body?.notes || '').slice(0, 1000),
          nextActionAt: body?.nextActionAt || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.crmLeads.push(row);
        appendAuditLog(db, req, user.id, 'crm.lead.create', { leadId: row.id, stage: row.stage });
        writeAppDb(db);
        return sendJson(res, 200, { ok: true, item: row });
      } catch (err) {
        return sendJson(res, 400, { error: String(err?.message || err) });
      }
    }

    if (req.method === 'PATCH' && urlObj.pathname === '/api/crm/leads') {
      try {
        const body = await readJsonBody(req);
        const id = String(body?.id || '');
        const db = readAppDb();
        const row = db.crmLeads.find((l) => l.userId === user.id && l.id === id);
        if (!row) return sendJson(res, 404, { error: 'Lead not found' });
        if (body.stage != null) row.stage = String(body.stage).slice(0, 30);
        if (body.priority != null) row.priority = String(body.priority).slice(0, 20);
        if (body.notes != null) row.notes = String(body.notes).slice(0, 1000);
        if (body.nextActionAt !== undefined) row.nextActionAt = body.nextActionAt || null;
        row.updatedAt = new Date().toISOString();
        appendAuditLog(db, req, user.id, 'crm.lead.update', { leadId: row.id, stage: row.stage });
        writeAppDb(db);
        return sendJson(res, 200, { ok: true, item: row });
      } catch (err) {
        return sendJson(res, 400, { error: String(err?.message || err) });
      }
    }

    if (req.method === 'DELETE' && urlObj.pathname === '/api/crm/leads') {
      const id = String(urlObj.searchParams.get('id') || '');
      const db = readAppDb();
      db.crmLeads = db.crmLeads.filter((l) => !(l.userId === user.id && l.id === id));
      db.crmTasks = db.crmTasks.filter((t) => !(t.userId === user.id && t.leadId === id));
      appendAuditLog(db, req, user.id, 'crm.lead.delete', { leadId: id });
      writeAppDb(db);
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'GET' && urlObj.pathname === '/api/crm/tasks') {
      const db = readAppDb();
      const items = db.crmTasks
        .filter((t) => t.userId === user.id)
        .sort((a, b) => new Date(a.dueAt || 0).getTime() - new Date(b.dueAt || 0).getTime());
      return sendJson(res, 200, { items });
    }

    if (req.method === 'POST' && urlObj.pathname === '/api/crm/tasks') {
      try {
        const body = await readJsonBody(req);
        const db = readAppDb();
        const row = {
          id: crypto.randomUUID(),
          userId: user.id,
          leadId: String(body?.leadId || ''),
          title: String(body?.title || 'Follow up').slice(0, 140),
          dueAt: body?.dueAt || null,
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        db.crmTasks.push(row);
        appendAuditLog(db, req, user.id, 'crm.task.create', { taskId: row.id, leadId: row.leadId });
        writeAppDb(db);
        return sendJson(res, 200, { ok: true, item: row });
      } catch (err) {
        return sendJson(res, 400, { error: String(err?.message || err) });
      }
    }

    if (req.method === 'PATCH' && urlObj.pathname === '/api/crm/tasks') {
      try {
        const body = await readJsonBody(req);
        const id = String(body?.id || '');
        const db = readAppDb();
        const row = db.crmTasks.find((t) => t.userId === user.id && t.id === id);
        if (!row) return sendJson(res, 404, { error: 'Task not found' });
        if (body.title != null) row.title = String(body.title).slice(0, 140);
        if (body.dueAt !== undefined) row.dueAt = body.dueAt || null;
        if (body.completed !== undefined) row.completed = !!body.completed;
        row.updatedAt = new Date().toISOString();
        appendAuditLog(db, req, user.id, 'crm.task.update', { taskId: row.id, completed: row.completed });
        writeAppDb(db);
        return sendJson(res, 200, { ok: true, item: row });
      } catch (err) {
        return sendJson(res, 400, { error: String(err?.message || err) });
      }
    }

    if (req.method === 'DELETE' && urlObj.pathname === '/api/crm/tasks') {
      const id = String(urlObj.searchParams.get('id') || '');
      const db = readAppDb();
      db.crmTasks = db.crmTasks.filter((t) => !(t.userId === user.id && t.id === id));
      appendAuditLog(db, req, user.id, 'crm.task.delete', { taskId: id });
      writeAppDb(db);
      return sendJson(res, 200, { ok: true });
    }
  }

  if (urlObj.pathname.startsWith('/api/billing/')) {
    const { user } = getCurrentUserFromRequest(req);
    if (!user) return sendJson(res, 401, { error: 'Authentication required' });

    if (req.method === 'GET' && urlObj.pathname === '/api/billing/status') {
      const db = readAppDb();
      const row = db.users.find((u) => u.id === user.id) || user;
      ensureUserBillingDefaults(row);
      writeAppDb(db);
      const billing = computeBillingState(row);
      return sendJson(res, 200, {
        billing,
        config: {
          trialDays: BILLING_TRIAL_DAYS,
          monthlyPriceCents: BILLING_MONTHLY_PRICE_CENTS,
          stripeConfigured: isStripeConfigured(),
        },
      });
    }

    if (req.method === 'POST' && urlObj.pathname === '/api/billing/create-checkout-session') {
      try {
        if (!isStripeConfigured()) return sendJson(res, 400, { error: 'Stripe is not configured on server.' });
        const db = readAppDb();
        const row = db.users.find((u) => u.id === user.id);
        if (!row) return sendJson(res, 404, { error: 'User not found' });
        ensureUserBillingDefaults(row);

        let customerId = row.stripeCustomerId;
        if (!customerId) {
          const createdCustomer = await stripePost('/customers', { email: row.email });
          customerId = createdCustomer.id;
          row.stripeCustomerId = customerId;
        }

        const trialEndUnix = Math.floor((new Date(row.trialEndsAt || Date.now()).getTime()) / 1000);
        const nowUnix = Math.floor(Date.now() / 1000);
        const form = {
          mode: 'subscription',
          customer: customerId,
          success_url: `${APP_BASE_URL}/?billing=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${APP_BASE_URL}/?billing=cancel`,
          'allow_promotion_codes': 'true',
          'line_items[0][quantity]': '1',
        };
        if (STRIPE_PRICE_MONTHLY_20) {
          form['line_items[0][price]'] = STRIPE_PRICE_MONTHLY_20;
        } else {
          form['line_items[0][price_data][currency]'] = 'usd';
          form['line_items[0][price_data][unit_amount]'] = String(BILLING_MONTHLY_PRICE_CENTS);
          form['line_items[0][price_data][recurring][interval]'] = 'month';
          form['line_items[0][price_data][product_data][name]'] = 'Wholesale Deal Finder Pro';
        }
        if (trialEndUnix > nowUnix) {
          form['subscription_data[trial_end]'] = String(trialEndUnix);
        }
        const session = await stripePost('/checkout/sessions', form);
        db.billingEvents.push({
          id: crypto.randomUUID(),
          userId: row.id,
          type: 'billing.checkout.created',
          payload: { sessionId: session.id },
          createdAt: new Date().toISOString(),
        });
        appendAuditLog(db, req, user.id, 'billing.checkout.create', { sessionId: session.id });
        writeAppDb(db);
        return sendJson(res, 200, { ok: true, url: session.url, sessionId: session.id });
      } catch (err) {
        return sendJson(res, 400, { error: String(err?.message || err) });
      }
    }

    if (req.method === 'POST' && urlObj.pathname === '/api/billing/confirm-session') {
      try {
        if (!isStripeConfigured()) return sendJson(res, 400, { error: 'Stripe is not configured on server.' });
        const body = await readJsonBody(req);
        const sessionId = String(body?.sessionId || '').trim();
        if (!sessionId) return sendJson(res, 400, { error: 'sessionId is required' });

        const session = await stripeGet(`/checkout/sessions/${encodeURIComponent(sessionId)}`);
        const db = readAppDb();
        const row = db.users.find((u) => u.id === user.id);
        if (!row) return sendJson(res, 404, { error: 'User not found' });
        if (session.customer) row.stripeCustomerId = session.customer;
        if (session.subscription) row.stripeSubscriptionId = session.subscription;
        if (session.subscription) {
          try {
            const sub = await stripeGet(`/subscriptions/${encodeURIComponent(session.subscription)}`);
            row.subscriptionStatus = (sub.status === 'trialing' || sub.status === 'active') ? 'active' : 'past_due';
            row.subscriptionPlan = 'pro_monthly_20';
            row.planRenewsAt = sub.current_period_end ? new Date(Number(sub.current_period_end) * 1000).toISOString() : null;
          } catch {}
        }
        db.billingEvents.push({
          id: crypto.randomUUID(),
          userId: row.id,
          type: 'billing.checkout.confirmed',
          payload: { sessionId, subscriptionId: row.stripeSubscriptionId || '' },
          createdAt: new Date().toISOString(),
        });
        appendAuditLog(db, req, user.id, 'billing.checkout.confirm', { sessionId });
        writeAppDb(db);
        return sendJson(res, 200, { ok: true, billing: computeBillingState(row) });
      } catch (err) {
        return sendJson(res, 400, { error: String(err?.message || err) });
      }
    }

    if (req.method === 'POST' && urlObj.pathname === '/api/billing/create-portal-session') {
      try {
        if (!isStripeConfigured()) return sendJson(res, 400, { error: 'Stripe is not configured on server.' });
        const db = readAppDb();
        const row = db.users.find((u) => u.id === user.id);
        if (!row) return sendJson(res, 404, { error: 'User not found' });
        if (!row.stripeCustomerId) return sendJson(res, 400, { error: 'No Stripe customer found. Start checkout first.' });
        const portal = await stripePost('/billing_portal/sessions', {
          customer: row.stripeCustomerId,
          return_url: `${APP_BASE_URL}/?billing=portal_return`,
        });
        appendAuditLog(db, req, user.id, 'billing.portal.create', { customerId: row.stripeCustomerId });
        writeAppDb(db);
        return sendJson(res, 200, { ok: true, url: portal.url });
      } catch (err) {
        return sendJson(res, 400, { error: String(err?.message || err) });
      }
    }
  }

  if (urlObj.pathname.startsWith('/api/admin/')) {
    const { user } = getCurrentUserFromRequest(req);
    if (!user) return sendJson(res, 401, { error: 'Authentication required' });
    if (!isAdminUser(user)) return sendJson(res, 403, { error: 'Admin access required' });

    if (req.method === 'GET' && urlObj.pathname === '/api/admin/users') {
      const limit = Math.max(10, Math.min(500, Number(urlObj.searchParams.get('limit') || 250)));
      const db = readAppDb();
      const items = [...db.users]
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, limit)
        .map((row) => {
          const email = String(row.email || '').toLowerCase();
          return {
            ...sanitizeUser(row),
            role: row.role || (ADMIN_EMAILS.includes(email) ? 'admin' : 'user'),
            savedSearchCount: db.savedSearches.filter((s) => s.userId === row.id).length,
            savedDealCount: db.savedDeals.filter((d) => d.userId === row.id).length,
            auditEventCount: db.auditLogs.filter((a) => a.userId === row.id).length,
          };
        });
      return sendJson(res, 200, { items });
    }

    if (req.method === 'GET' && urlObj.pathname === '/api/admin/audit-logs') {
      const limit = Math.max(20, Math.min(1000, Number(urlObj.searchParams.get('limit') || 300)));
      const eventType = String(urlObj.searchParams.get('eventType') || '').trim();
      const userEmail = normalizeEmail(urlObj.searchParams.get('userEmail') || '');
      const db = readAppDb();
      let rows = [...db.auditLogs];
      if (eventType) rows = rows.filter((r) => String(r.eventType || '').toLowerCase() === eventType.toLowerCase());
      if (userEmail) {
        const targetUser = db.users.find((u) => u.email === userEmail);
        rows = targetUser ? rows.filter((r) => r.userId === targetUser.id) : [];
      }
      const userById = new Map(db.users.map((u) => [u.id, u.email]));
      const items = rows
        .slice(-limit)
        .reverse()
        .map((row) => ({
          ...row,
          userEmail: row.userId ? userById.get(row.userId) || null : null,
        }));
      return sendJson(res, 200, { items });
    }

    if (req.method === 'GET' && urlObj.pathname === '/api/admin/security-stats') {
      const now = Date.now();
      const locked = [...loginFailBuckets.values()].filter((v) => v.lockUntil && v.lockUntil > now).length;
      return sendJson(res, 200, {
        rateLimitBucketCount: rateLimitBuckets.size,
        lockedLoginCount: locked,
        csrfCookie: CSRF_COOKIE,
        securityRateWindowMs: SECURITY_RATE_WINDOW_MS,
        securityRateMax: SECURITY_RATE_MAX,
      });
    }

    if (req.method === 'POST' && urlObj.pathname === '/api/admin/export-db-backup') {
      const db = readAppDb();
      const backupDir = path.join(ROOT, 'data', 'backups');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filePath = path.join(backupDir, `app-db-backup-${stamp}.json`);
      fs.writeFileSync(filePath, JSON.stringify(db, null, 2), 'utf8');
      appendAuditLog(db, req, user.id, 'admin.db.backup', { filePath: path.basename(filePath) });
      writeAppDb(db);
      return sendJson(res, 200, { ok: true, file: path.basename(filePath) });
    }

    if (req.method === 'GET' && urlObj.pathname === '/api/admin/backups') {
      const backupDir = path.join(ROOT, 'data', 'backups');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      const items = fs.readdirSync(backupDir)
        .filter((f) => f.endsWith('.json'))
        .map((name) => {
          const fullPath = path.join(backupDir, name);
          const st = fs.statSync(fullPath);
          return {
            file: name,
            size: st.size,
            modifiedAt: st.mtime.toISOString(),
          };
        })
        .sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());
      return sendJson(res, 200, { items });
    }

    if (req.method === 'POST' && urlObj.pathname === '/api/admin/restore-db-backup') {
      try {
        const body = await readJsonBody(req);
        const file = String(body?.file || '').trim();
        if (!file || file.includes('..') || file.includes('/') || file.includes('\\')) {
          return sendJson(res, 400, { error: 'Valid backup filename required' });
        }
        const backupDir = path.join(ROOT, 'data', 'backups');
        const target = path.join(backupDir, file);
        if (!fs.existsSync(target)) return sendJson(res, 404, { error: 'Backup file not found' });
        const raw = fs.readFileSync(target, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return sendJson(res, 400, { error: 'Backup format invalid' });
        writeAppDb(parsed);
        const db = readAppDb();
        appendAuditLog(db, req, user.id, 'admin.db.restore', { file });
        writeAppDb(db);
        return sendJson(res, 200, { ok: true, restored: file });
      } catch (err) {
        return sendJson(res, 400, { error: String(err?.message || err) });
      }
    }

    if (req.method === 'GET' && urlObj.pathname === '/api/admin/stripe-live-check') {
      const out = {
        stripeConfigured: isStripeConfigured(),
        webhookConfigured: !!STRIPE_WEBHOOK_SECRET,
        monthlyPriceConfigured: !!STRIPE_PRICE_MONTHLY_20,
        checks: [],
      };
      if (!isStripeConfigured()) return sendJson(res, 200, out);
      try {
        const acc = await stripeGet('/account');
        out.checks.push({ name: 'account', ok: true, id: acc?.id || '' });
      } catch (err) {
        out.checks.push({ name: 'account', ok: false, error: String(err?.message || err) });
      }
      try {
        if (STRIPE_PRICE_MONTHLY_20) {
          const price = await stripeGet(`/prices/${encodeURIComponent(STRIPE_PRICE_MONTHLY_20)}`);
          out.checks.push({ name: 'price', ok: !!price?.id, id: price?.id || '' });
        } else {
          out.checks.push({ name: 'price', ok: true, note: 'Using inline $20 monthly price_data fallback.' });
        }
      } catch (err) {
        out.checks.push({ name: 'price', ok: false, error: String(err?.message || err) });
      }
      return sendJson(res, 200, out);
    }

    if (req.method === 'GET' && urlObj.pathname === '/api/admin/production-readiness') {
      const checks = [];
      const appBase = String(APP_BASE_URL || '');
      const adminEmailsJoined = String(ADMIN_EMAILS.join(',') || '');
      const webhookLooksReal = /^whsec_/i.test(String(STRIPE_WEBHOOK_SECRET || '')) && !/replace|your/i.test(String(STRIPE_WEBHOOK_SECRET || ''));
      const stripeKeyLooksReal = /^sk_(test|live)_/i.test(String(STRIPE_SECRET_KEY || '')) && !/replace|your/i.test(String(STRIPE_SECRET_KEY || ''));
      const isHttpsBase = /^https:\/\//i.test(appBase) && !/your-domain|example/i.test(appBase);
      checks.push({
        key: 'app_base_url_https',
        ok: isHttpsBase,
        message: isHttpsBase ? 'APP_BASE_URL uses HTTPS.' : 'APP_BASE_URL should be HTTPS in production.',
      });
      checks.push({
        key: 'cookie_secure',
        ok: !!COOKIE_SECURE,
        message: COOKIE_SECURE ? 'COOKIE_SECURE is enabled.' : 'Set COOKIE_SECURE=true in production.',
      });
      checks.push({
        key: 'stripe_secret_key',
        ok: stripeKeyLooksReal,
        message: stripeKeyLooksReal ? 'Stripe secret key configured.' : 'Stripe secret key missing or placeholder.',
      });
      checks.push({
        key: 'stripe_webhook_secret',
        ok: webhookLooksReal,
        message: webhookLooksReal ? 'Stripe webhook secret configured.' : 'Stripe webhook secret missing or placeholder.',
      });
      checks.push({
        key: 'zillow_rapidapi_key',
        ok: hasRealRapidApiKey(),
        message: hasRealRapidApiKey() ? 'RapidAPI key appears configured.' : 'RapidAPI key missing or placeholder.',
      });
      checks.push({
        key: 'sendgrid_config',
        ok: !!(SENDGRID_API_KEY && SENDGRID_FROM_EMAIL),
        message: SENDGRID_API_KEY && SENDGRID_FROM_EMAIL
          ? 'SendGrid configured.'
          : 'SendGrid optional but recommended for password reset/verification email.',
      });
      checks.push({
        key: 'sentry_dsn',
        ok: !!SENTRY_DSN,
        message: SENTRY_DSN ? 'Sentry DSN configured.' : 'Sentry DSN missing (recommended).',
      });
      checks.push({
        key: 'admin_emails',
        ok: ADMIN_EMAILS.length > 0 && !/your-domain|example/i.test(adminEmailsJoined),
        message:
          ADMIN_EMAILS.length > 0 && !/your-domain|example/i.test(adminEmailsJoined)
            ? 'Admin email list configured.'
            : 'Set ADMIN_EMAILS for admin access (non-placeholder).',
      });

      const passed = checks.filter((c) => c.ok).length;
      const requiredKeys = ['app_base_url_https', 'cookie_secure', 'stripe_secret_key', 'stripe_webhook_secret', 'zillow_rapidapi_key'];
      const requiredPassing = checks.filter((c) => requiredKeys.includes(c.key) && c.ok).length;
      const requiredTotal = requiredKeys.length;
      const ready = requiredPassing === requiredTotal;

      return sendJson(res, 200, {
        ready,
        score: `${passed}/${checks.length}`,
        requiredScore: `${requiredPassing}/${requiredTotal}`,
        mode: NODE_ENV,
        checks,
      });
    }
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/live-diagnostics') {
    const location = String(urlObj.searchParams.get('location') || '').trim() || 'florida';
    const diagnostics = {
      location,
      mode: ZILLOW_MODE,
      hasRealRapidApiKey: hasRealRapidApiKey(),
      keyMask: maskSecret(ZILLOW_RAPIDAPI_KEY),
      providers: [],
    };

    if (hasRealRapidApiKey()) {
      try {
        const probe = await rapidApiGet('/propertyExtendedSearch', { location, status_type: 'ForSale', page: 1 });
        diagnostics.providers.push({
          provider: 'rapidapi-primary',
          ok: true,
          rows: Array.isArray(probe?.props) ? probe.props.length : 0,
        });
      } catch (err) {
        diagnostics.providers.push({
          provider: 'rapidapi-primary',
          ok: false,
          error: String(err?.message || err),
        });
      }

      try {
        const probe = await rapidApiGet('/api/v1/search/by-location', { location, page: 1, listing_status: 'for_sale' }, {
          host: ZILLOW_ALT_RAPIDAPI_HOST,
          baseUrl: ZILLOW_ALT_RAPIDAPI_BASE_URL,
        });
        const rows = Array.isArray(probe?.data) ? probe.data.length : Array.isArray(probe?.results) ? probe.results.length : 0;
        diagnostics.providers.push({
          provider: 'rapidapi-alt',
          ok: true,
          rows,
        });
      } catch (err) {
        diagnostics.providers.push({
          provider: 'rapidapi-alt',
          ok: false,
          error: String(err?.message || err),
        });
      }
    } else {
      diagnostics.providers.push({
        provider: 'rapidapi',
        ok: false,
        error: 'RapidAPI key is missing or looks like a placeholder.',
      });
    }

    try {
      const web = await fetchZillowWebListings({ location, page: 1, pageSize: 5 });
      diagnostics.providers.push({
        provider: 'zillow-web-fallback',
        ok: true,
        rows: web.length,
      });
    } catch (err) {
      diagnostics.providers.push({
        provider: 'zillow-web-fallback',
        ok: false,
        error: String(err?.message || err),
      });
    }

    sendJson(res, 200, diagnostics);
    return;
  }

  if (req.method === 'GET' && urlObj.pathname === '/api/source-health-history') {
    const limit = Math.max(10, Math.min(400, Number(urlObj.searchParams.get('limit') || 120)));
    const items = sourceHealthHistory.slice(-limit).reverse();
    return sendJson(res, 200, { items });
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/photo-grade') {
    try {
      const { user } = getCurrentUserFromRequest(req);
      if (!user) return sendJson(res, 401, { error: 'Login required for AI photo grading' });
      if (!userHasActiveSubscription(user)) return sendJson(res, 402, { error: 'Subscription required. Start trial to use AI photo grading.' });
      const payload = await readJsonBody(req);
      if (!payload?.listing) return sendJson(res, 400, { error: 'Missing listing in request body' });
      if (!payload?.imageUrl) return sendJson(res, 400, { error: 'Missing imageUrl in request body' });

      const result = await gradeSinglePhoto(payload);
      sendJson(res, 200, result);
      return;
    } catch (err) {
      sendJson(res, 400, { error: String(err?.message || err) });
      return;
    }
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/listing-photos') {
    try {
      const payload = await readJsonBody(req);
      const listing = payload?.listing || {};
      const existing = keepTrustedPropertyPhotos(Array.isArray(listing.photos) ? listing.photos.filter(Boolean) : []);
      let hydrated = { photos: existing, source: 'listing' };

      if (ZILLOW_MODE.toLowerCase() === 'rapidapi') {
        hydrated = await fetchRapidApiListingPhotos(listing);
      } else {
        const scraped = await fetchPhotosFromListingPage(listing?.url);
        if (scraped.length) hydrated = { photos: [...new Set([...existing, ...scraped])], source: 'listing-page-html' };
      }

      const photos = Array.isArray(hydrated.photos) ? hydrated.photos.filter(Boolean) : [];
      const trusted = keepTrustedPropertyPhotos(photos);
      return sendJson(res, 200, {
        photos: trusted,
        photoCount: trusted.length,
        source: hydrated.source,
      });
    } catch (err) {
      return sendJson(res, 400, { error: String(err?.message || err) });
    }
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/photo-grade-batch') {
    try {
      const { user } = getCurrentUserFromRequest(req);
      if (!user) return sendJson(res, 401, { error: 'Login required for AI batch photo grading' });
      if (!userHasActiveSubscription(user)) return sendJson(res, 402, { error: 'Subscription required. Start trial to use batch grading.' });
      const payload = await readJsonBody(req);
      const listing = payload?.listing;
      if (!listing) return sendJson(res, 400, { error: 'Missing listing in request body' });

      const photos = Array.isArray(listing.photos) ? listing.photos.filter(Boolean).slice(0, 8) : [];
      if (!photos.length) return sendJson(res, 200, mergeBatchGrades([]));

      const grades = [];
      for (const imageUrl of photos) {
        const grade = await gradeSinglePhoto({ listing, imageUrl });
        grades.push(grade);
      }

      sendJson(res, 200, mergeBatchGrades(grades));
      return;
    } catch (err) {
      sendJson(res, 400, { error: String(err?.message || err) });
      return;
    }
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/arv-from-photos') {
    try {
      const { user } = getCurrentUserFromRequest(req);
      if (!user) return sendJson(res, 401, { error: 'Login required for ARV from photos' });
      if (!userHasActiveSubscription(user)) return sendJson(res, 402, { error: 'Subscription required. Start trial to use ARV-from-photos.' });
      const payload = await readJsonBody(req);
      const listing = payload?.listing;
      if (!listing) return sendJson(res, 400, { error: 'Missing listing in request body' });

      const photos = Array.isArray(listing.photos) ? listing.photos.filter(Boolean).slice(0, 8) : [];
      if (!photos.length) {
        const fallback = {
          source: 'no-photos-fallback',
          estimatedArv: Math.round((Number(listing.price) || 0) * 1.25),
          conservativeArv: Math.round((Number(listing.price) || 0) * 1.18),
          aggressiveArv: Math.round((Number(listing.price) || 0) * 1.33),
          confidence: 0.45,
          rationale: 'No photos available; using basic price-based fallback ARV.',
          rehabLevel: 'Unknown',
          repairsEstimateLow: 0,
          repairsEstimateHigh: 0,
          photoCount: 0,
        };
        return sendJson(res, 200, fallback);
      }

      const grades = [];
      for (const imageUrl of photos) {
        const grade = await gradeSinglePhoto({ listing, imageUrl });
        grades.push(grade);
      }

      const batch = mergeBatchGrades(grades);
      const arv = estimateArvFromPhotoGrade(listing, batch);
      sendJson(res, 200, arv);
      return;
    } catch (err) {
      sendJson(res, 400, { error: String(err?.message || err) });
      return;
    }
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/tool-run') {
    try {
      const { user } = getCurrentUserFromRequest(req);
      if (!user) return sendJson(res, 401, { error: 'Login required for AI tool output' });
      if (!userHasActiveSubscription(user)) return sendJson(res, 402, { error: 'Subscription required. Start trial to use AI tools.' });
      const payload = await readJsonBody(req);
      if (!payload?.tool || !payload?.listing) return sendJson(res, 400, { error: 'Missing tool or listing in request body' });

      if (OPENAI_API_KEY) {
        try {
          const output = await openAiToolRun(payload);
          sendJson(res, 200, { source: `openai-${OPENAI_MODEL}`, output });
          return;
        } catch (err) {
          const output = localToolTemplate(payload);
          sendJson(res, 200, { source: 'template-fallback', output, error: String(err?.message || err) });
          return;
        }
      }

      const output = localToolTemplate(payload);
      sendJson(res, 200, { source: 'template-fallback', output });
      return;
    } catch (err) {
      sendJson(res, 400, { error: String(err?.message || err) });
      return;
    }
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/contact-action') {
    try {
      const { user } = getCurrentUserFromRequest(req);
      if (!user) return sendJson(res, 401, { error: 'Login required for outreach actions' });
      if (!userHasActiveSubscription(user)) return sendJson(res, 402, { error: 'Subscription required. Start trial to use outreach automation.' });
      const payload = await readJsonBody(req);
      const mode = String(payload?.mode || 'preview');
      const channel = String(payload?.channel || 'sms');
      const target = String(payload?.target || 'owner');
      const listing = attachListingContacts(payload?.listing || {});
      const analysis = payload?.analysis || {};

      if (!listing?.address) return sendJson(res, 400, { error: 'Missing listing in request body' });
      if (!['sms', 'email', 'voice_call'].includes(channel)) return sendJson(res, 400, { error: 'Invalid channel' });
      if (!['owner', 'agent'].includes(target)) return sendJson(res, 400, { error: 'Invalid target' });

      const contact = targetContactFor(listing, target);
      const message = await generateOutreachMessage({
        channel,
        target,
        listing,
        analysis,
        preparedMessage: payload?.preparedMessage,
      });

      if (mode === 'preview') {
        const db = readAppDb();
        appendAuditLog(db, req, user?.id || null, 'outreach.preview', { channel, target, address: listing.address });
        writeAppDb(db);
        return sendJson(res, 200, {
          ok: true,
          mode: 'preview',
          channel,
          target,
          to: channel === 'email' ? contact.email : contact.phone,
          message,
          source: OPENAI_API_KEY ? `openai-${OPENAI_MODEL}` : 'template-fallback',
        });
      }

      if (mode !== 'send') return sendJson(res, 400, { error: 'Invalid mode' });
      if (!payload?.confirmed) return sendJson(res, 400, { error: 'Confirmation required before send' });
      if (!payload?.consentConfirmed) return sendJson(res, 400, { error: 'Consent confirmation required before send' });

      if (!ENABLE_REAL_OUTREACH) {
        const db = readAppDb();
        appendAuditLog(db, req, user?.id || null, 'outreach.send.simulated', { channel, target, address: listing.address });
        writeAppDb(db);
        return sendJson(res, 200, {
          ok: true,
          delivery: 'simulated',
          channel,
          target,
          to: channel === 'email' ? contact.email : contact.phone,
          message,
          note: 'ENABLE_REAL_OUTREACH is false. No real message/call was sent.',
        });
      }

      if (channel === 'sms') {
        if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
          return sendJson(res, 400, { error: 'Twilio SMS credentials missing' });
        }
        const result = await sendSmsViaTwilio(contact.phone, message);
        const db = readAppDb();
        appendAuditLog(db, req, user?.id || null, 'outreach.send.sms', { channel, target, address: listing.address, delivery: result.provider });
        writeAppDb(db);
        return sendJson(res, 200, { ok: true, delivery: result.provider, messageId: result.id, channel, target });
      }

      if (channel === 'voice_call') {
        if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
          return sendJson(res, 400, { error: 'Twilio voice credentials missing' });
        }
        const result = await callViaTwilio(contact.phone, message);
        const db = readAppDb();
        appendAuditLog(db, req, user?.id || null, 'outreach.send.voice_call', { channel, target, address: listing.address, delivery: result.provider });
        writeAppDb(db);
        return sendJson(res, 200, { ok: true, delivery: result.provider, callId: result.id, channel, target });
      }

      if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
        return sendJson(res, 400, { error: 'SendGrid email credentials missing' });
      }
      const result = await sendEmailViaSendgrid(contact.email, `Offer Interest - ${listing.address}`, message);
      const db = readAppDb();
      appendAuditLog(db, req, user?.id || null, 'outreach.send.email', { channel, target, address: listing.address, delivery: result.provider });
      writeAppDb(db);
      return sendJson(res, 200, { ok: true, delivery: result.provider, channel, target });
    } catch (err) {
      return sendJson(res, 400, { error: String(err?.message || err) });
    }
  }

  if (req.method === 'GET') {
    serveFile(res, urlObj.pathname);
    return;
  }

  res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Method Not Allowed');
});

if (require.main === module) {
  process.on('uncaughtException', (err) => {
    errorLog('process.uncaughtException', { message: String(err?.message || err), stack: String(err?.stack || '') });
  });
  process.on('unhandledRejection', (reason) => {
    errorLog('process.unhandledRejection', { reason: String(reason?.stack || reason) });
  });
  server.listen(PORT, () => {
    console.log(`Wholesale Deal Finder running at http://localhost:${PORT}`);
    appLog('server.start', { port: PORT, nodeEnv: NODE_ENV });
  });
}

module.exports = { server };
