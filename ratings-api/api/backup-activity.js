// Snapshots the last 7 days of customer activity (activity-log.json) into a
// timestamped file under backups/ in the private admin-db repo. Triggered
// either by an authenticated admin (manual "Backup Now" button) or by
// Vercel Cron (daily) via CRON_SECRET.

const { readJsonArray, getFileSha, putFileBase64 } = require('./_lib/github.js');
const { requireAuth } = require('./_lib/auth.js');

const BACKUP_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function isCronRequest(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers['authorization'] || '';
  return auth === `Bearer ${secret}`;
}

module.exports = async function handler(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://navrang786fr.github.io';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'GET' && req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  const jwtSecret = process.env.JWT_SECRET;
  const adminRepo = process.env.ADMIN_REPO;
  const adminToken = process.env.ADMIN_GITHUB_TOKEN;
  if (!jwtSecret || !adminRepo || !adminToken) { res.status(500).json({ error: 'Server not configured' }); return; }

  const viaCron = isCronRequest(req);
  let triggeredBy = 'cron';
  if (!viaCron) {
    const auth = requireAuth(req, res, jwtSecret);
    if (!auth) return; // requireAuth already sent the 401
    triggeredBy = auth.sub;
  }

  try {
    const activity = await readJsonArray(adminRepo, 'activity-log.json', adminToken);
    const cutoff = Date.now() - BACKUP_WINDOW_MS;
    const lastWeek = activity.filter(function (e) {
      const t = new Date(e.timestamp).getTime();
      return !isNaN(t) && t >= cutoff;
    });

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const path = `backups/activity-log-${dateStr}.json`;
    const content = JSON.stringify({
      backupCreatedAt: now.toISOString(),
      windowDays: 7,
      triggeredBy: triggeredBy,
      entryCount: lastWeek.length,
      entries: lastWeek
    }, null, 2) + '\n';

    const sha = await getFileSha(adminRepo, path, adminToken);
    const put = await putFileBase64(adminRepo, path, adminToken, Buffer.from(content).toString('base64'), sha,
      `Backup: ${lastWeek.length} activity entries (last 7 days) - ${dateStr}`);
    if (!put.ok) throw new Error('backup-write-failed');

    res.status(200).json({ ok: true, file: path, count: lastWeek.length });
  } catch (e) {
    res.status(502).json({ error: 'Backup failed', detail: String(e.message || e) });
  }
};
