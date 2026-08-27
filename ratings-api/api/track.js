// Lightweight, anonymous activity tracking for the order page: search terms
// typed and dish photos viewed. POST is public (called from order.html, no
// login) and writes only to the private admin-db repo — never to the public
// site. GET (reading the log back) requires an admin session.

const { writeJsonArrayWithRetry, readJsonArray } = require('./_lib/github.js');
const { requireAuth } = require('./_lib/auth.js');

const ALLOWED_TYPES = ['search', 'item_view'];

module.exports = async function handler(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://navrang786fr.github.io';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const adminRepo = process.env.ADMIN_REPO;
  const adminToken = process.env.ADMIN_GITHUB_TOKEN;
  if (!adminRepo || !adminToken) { res.status(500).json({ error: 'Server not configured' }); return; }

  if (req.method === 'GET') {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) { res.status(500).json({ error: 'Server not configured' }); return; }
    if (!requireAuth(req, res, jwtSecret)) return;
    try {
      const log = await readJsonArray(adminRepo, 'activity-log.json', adminToken);
      log.sort(function (a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
      res.status(200).json(log);
    } catch (e) {
      res.status(502).json({ error: 'Could not read activity log' });
    }
    return;
  }

  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  const type = String(body.type || '');
  const value = String(body.value || '').trim().slice(0, 120);
  const sessionId = String(body.sessionId || '').trim().slice(0, 60);

  if (ALLOWED_TYPES.indexOf(type) === -1) { res.status(400).json({ error: 'Invalid type' }); return; }
  if (!value) { res.status(400).json({ error: 'value is required' }); return; }

  try {
    await writeJsonArrayWithRetry(adminRepo, 'activity-log.json', adminToken, function (arr) {
      arr.push({ type, value, sessionId: sessionId || null, timestamp: new Date().toISOString() });
      if (arr.length > 5000) arr.splice(0, arr.length - 5000);
    }, `Track: ${type} "${value}"`);
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(502).json({ error: 'Could not record activity' });
  }
};
