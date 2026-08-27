// Validates admin credentials against users.json in the private admin-db repo,
// issues a signed session token, and records the attempt in access-log.json.

const { readJsonArray, writeJsonArrayWithRetry } = require('./_lib/github.js');
const { verifyPassword, signToken } = require('./_lib/auth.js');

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.socket && req.socket.remoteAddress || 'unknown';
}

module.exports = async function handler(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://navrang786fr.github.io';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
  const ip = clientIp(req);

  async function logAccess(outcome) {
    try {
      await writeJsonArrayWithRetry(adminRepo, 'access-log.json', adminToken, function (arr) {
        arr.push({
          username: username || '(empty)',
          outcome: outcome,
          ip: ip,
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

  let users;
  try {
    users = await readJsonArray(adminRepo, 'users.json', adminToken);
  } catch (e) {
    res.status(502).json({ error: 'Could not reach admin data store' });
    return;
  }

  const user = users.find(function (u) { return u.username === username; });
  const valid = user && verifyPassword(password, user.salt, user.hash);

  if (!valid) {
    await logAccess('failed');
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  const token = signToken({ sub: username }, jwtSecret);
  await logAccess('success');
  res.status(200).json({ ok: true, token: token, username: username });
};
