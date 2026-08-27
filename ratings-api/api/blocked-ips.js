// Admin-managed IP blocklist, checked by login.js before allowing an
// attempt through. Lives in the private admin-db repo.

const { readJsonArray, writeJsonArrayWithRetry } = require('./_lib/github.js');
const { requireAuth } = require('./_lib/auth.js');

module.exports = async function handler(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://navrang786fr.github.io';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const jwtSecret = process.env.JWT_SECRET;
  const adminRepo = process.env.ADMIN_REPO;
  const adminToken = process.env.ADMIN_GITHUB_TOKEN;
  if (!jwtSecret || !adminRepo || !adminToken) { res.status(500).json({ error: 'Server not configured' }); return; }

  const auth = requireAuth(req, res, jwtSecret);
  if (!auth) return;

  if (req.method === 'GET') {
    try {
      const list = await readJsonArray(adminRepo, 'blocked-ips.json', adminToken);
      res.status(200).json(list);
    } catch (e) {
      res.status(502).json({ error: 'Could not read blocklist' });
    }
    return;
  }

  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  const ip = String(body.ip || '').trim().slice(0, 60);
  const action = body.action === 'unblock' ? 'unblock' : 'block';
  if (!ip) { res.status(400).json({ error: 'ip is required' }); return; }

  try {
    const result = await writeJsonArrayWithRetry(adminRepo, 'blocked-ips.json', adminToken, function (arr) {
      const idx = arr.findIndex(function (e) { return e.ip === ip; });
      if (action === 'unblock') {
        if (idx !== -1) arr.splice(idx, 1);
      } else if (idx === -1) {
        arr.push({
          ip: ip,
          reason: String(body.reason || '').trim().slice(0, 200) || null,
          blockedBy: auth.sub,
          blockedAt: new Date().toISOString()
        });
      }
    }, `Admin: ${action} IP ${ip} (${auth.sub})`);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(502).json({ error: 'Could not update blocklist' });
  }
};
