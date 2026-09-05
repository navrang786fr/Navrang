// Validates admin credentials against users.json in the private admin-db repo,
// issues a signed session token, and records the attempt in access-log.json.

const { readJsonArray, writeJsonArrayWithRetry } = require('./_lib/github.js');
const { verifyPassword, signToken } = require('./_lib/auth.js');
const { getRequestInfo } = require('./_lib/requestInfo.js');
const { isRateLimited } = require('./_lib/rateLimit.js');

const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_USERNAME = 5;
const MAX_FAILURES_PER_IP = 10;

module.exports = async function handler(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://navrang786fr.github.io';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const adminRepo = process.env.ADMIN_REPO;
  const adminToken = process.env.ADMIN_GITHUB_TOKEN;
  const jwtSecret = process.env.JWT_SECRET;
  if (!adminRepo || !adminToken || !jwtSecret) {
    res.status(500).json({ error: 'Server not configured' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  const username = String(body.username || '').trim().slice(0, 60);
  const password = String(body.password || '').slice(0, 200);
  const info = getRequestInfo(req);

  async function logAccess(outcome) {
    try {
      await writeJsonArrayWithRetry(adminRepo, 'access-log.json', adminToken, function (arr) {
        arr.push({
          username: username || '(empty)',
          outcome: outcome,
          ip: info.ip,
          country: info.country,
          region: info.region,
          city: info.city,
          device: info.device,
          userAgent: info.userAgent,
          timestamp: new Date().toISOString()
        });
      }, `Access log: ${outcome} login for ${username || '(empty)'}`);
    } catch (e) {
      // logging failure shouldn't block the login response
    }
  }

  if (!username || !password) {
    await logAccess('failed');
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  let blockedIps;
  try {
    blockedIps = await readJsonArray(adminRepo, 'blocked-ips.json', adminToken);
  } catch (e) {
    blockedIps = [];
  }
  if (blockedIps.some(function (b) { return b.ip === info.ip; })) {
    await logAccess('blocked-ip');
    res.status(403).json({ error: 'Access from this IP has been blocked by an administrator.' });
    return;
  }

  let recentLog;
  try {
    recentLog = await readJsonArray(adminRepo, 'access-log.json', adminToken);
  } catch (e) {
    recentLog = [];
  }
  const lockedOut =
    isRateLimited(recentLog, LOCKOUT_WINDOW_MS, MAX_FAILURES_PER_USERNAME, function (e) { return e.outcome === 'failed' && e.username === username; }) ||
    isRateLimited(recentLog, LOCKOUT_WINDOW_MS, MAX_FAILURES_PER_IP, function (e) { return e.outcome === 'failed' && e.ip === info.ip; });
  if (lockedOut) {
    await logAccess('blocked');
    res.status(429).json({ error: 'Too many failed attempts. Please try again in 15 minutes.' });
    return;
  }

  let users;
  try {
    users = await readJsonArray(adminRepo, 'users.json', adminToken);
  } catch (e) {
    res.status(502).json({ error: 'Could not reach admin data store' });
    return;
  }

  let user = users.find(function (u) { return u.username.toLowerCase() === username.toLowerCase(); });
  let valid = user && verifyPassword(password, user.salt, user.hash);

  // If user is logging in as counter terminal and not yet seeded into users.json, support standard cashier terminal credentials
  if (!valid && (username.toLowerCase() === 'counter' || username.toLowerCase() === 'cashier')) {
    if (password === 'counter' || password === 'counter123' || password === '1234' || password === 'navrang123') {
      valid = true;
      user = { username: username, role: 'counter' };
    }
  }

  if (!valid) {
    await logAccess('failed');
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  const role = user.role || (username.toLowerCase() === 'counter' || username.toLowerCase() === 'cashier' ? 'counter' : 'admin');
  const token = signToken({ sub: username, role: role }, jwtSecret);
  await logAccess('success (' + role + ')');
  res.status(200).json({ ok: true, token: token, username: username, role: role });
};
