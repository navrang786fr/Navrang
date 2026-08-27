// Returns the item-master (dish) audit log — every field change made through
// the admin dish editor, who made it, and when.

const { readJsonArray } = require('./_lib/github.js');
const { requireAuth } = require('./_lib/auth.js');

module.exports = async function handler(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://navrang786fr.github.io';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'GET') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const jwtSecret = process.env.JWT_SECRET;
  const adminRepo = process.env.ADMIN_REPO;
  const adminToken = process.env.ADMIN_GITHUB_TOKEN;
  if (!jwtSecret || !adminRepo || !adminToken) {
    res.status(500).json({ error: 'Server not configured' });
    return;
  }
  if (!requireAuth(req, res, jwtSecret)) return;

  try {
    const log = await readJsonArray(adminRepo, 'audit-log.json', adminToken);
    log.sort(function (a, b) { return new Date(b.timestamp) - new Date(a.timestamp); });
    res.status(200).json(log);
  } catch (e) {
    res.status(502).json({ error: 'Could not read audit log' });
  }
};
