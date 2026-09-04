// POST /api/change-password
// Allows an authenticated admin to change their password.
// Verifies current password, generates new salt & scrypt hash,
// updates users.json in the admin-db repo, logs to audit-log.json,
// and issues a fresh session token.

const crypto = require('crypto');
const { readJsonArray, writeJsonArrayWithRetry } = require('./_lib/github.js');
const { hashPassword, verifyPassword, signToken, requireAuth } = require('./_lib/auth.js');
const { getRequestInfo } = require('./_lib/requestInfo.js');

module.exports = async function handler(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://navrang786fr.github.io';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const adminRepo = process.env.ADMIN_REPO;
  const adminToken = process.env.ADMIN_GITHUB_TOKEN;
  const jwtSecret = process.env.JWT_SECRET;
  if (!adminRepo || !adminToken || !jwtSecret) {
    res.status(500).json({ error: 'Server not configured' });
    return;
  }

  const auth = requireAuth(req, res, jwtSecret);
  if (!auth) return;

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  const currentPassword = String(body.currentPassword || '');
  const newPassword = String(body.newPassword || '');

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current password and new password are required' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters long' });
    return;
  }

  if (newPassword.length > 200) {
    res.status(400).json({ error: 'New password is too long' });
    return;
  }

  if (currentPassword === newPassword) {
    res.status(400).json({ error: 'New password must be different from current password' });
    return;
  }

  const username = auth.sub;

  let users;
  try {
    users = await readJsonArray(adminRepo, 'users.json', adminToken);
  } catch (e) {
    res.status(502).json({ error: 'Could not reach admin data store' });
    return;
  }

  const user = users.find(function (u) { return u.username === username; });
  if (!user || !verifyPassword(currentPassword, user.salt, user.hash)) {
    // Return 400 Bad Request (NOT 401) so apiFetch does not clear client session
    res.status(400).json({ error: 'Current password is incorrect' });
    return;
  }

  const newSalt = crypto.randomBytes(16).toString('hex');
  const newHash = hashPassword(newPassword, newSalt);

  try {
    await writeJsonArrayWithRetry(adminRepo, 'users.json', adminToken, function (arr) {
      const u = arr.find(function (x) { return x.username === username; });
      if (!u) throw new Error('User not found');
      u.salt = newSalt;
      u.hash = newHash;
      u.updatedAt = new Date().toISOString();
    }, `Update password for ${username}`);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update password' });
    return;
  }

  try {
    const info = getRequestInfo(req);
    await writeJsonArrayWithRetry(adminRepo, 'audit-log.json', adminToken, function (arr) {
      arr.push({
        action: 'change-password',
        username: username,
        dishName: 'Admin Account',
        categoryId: 'security',
        changes: {
          password: { from: '••••••••', to: '•••••••• (updated)' }
        },
        timestamp: new Date().toISOString(),
        ip: info.ip,
        country: info.country,
        region: info.region,
        city: info.city,
        device: info.device,
        userAgent: info.userAgent
      });
    }, `Audit: change-password by ${username}`);
  } catch (e) {
    // Non-blocking: audit logging failure does not invalidate the password update
  }

  const token = signToken({ sub: username }, jwtSecret);
  res.status(200).json({ ok: true, message: 'Password changed successfully', token: token });
};
