// Admin category-master API: GET returns the current categories, POST edits
// a category's display text (title/short labels in both languages) — writing
// menu-data.js in the public Navrang repo — and records an audit-log entry
// in the private admin repo. Categories themselves aren't created or deleted
// here: their ids are load-bearing (MENU_DATA is keyed by them), so this is
// an edit-only master for the title/short label fields.

const { readRawFile, putFile, writeJsonArrayWithRetry } = require('./_lib/github.js');
const { requireAuth } = require('./_lib/auth.js');
const { parseMenuData, parseCategoryMeta, serializeMenuDataFile, serializeCategoryMetaFile, findCategoryById } = require('./_lib/menuData.js');
const { getRequestInfo } = require('./_lib/requestInfo.js');

const EDITABLE_FIELDS = ['title', 'titleTe', 'short', 'shortTe'];

async function mutateCategoryMeta(publicRepo, githubToken, mutator, commitMessage, maxRetries) {
  maxRetries = maxRetries || 4;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { raw, sha } = await readRawFile(publicRepo, 'menu-data.js', githubToken);
    if (!raw) throw new Error('menu-data.js not found in public repo');
    const { menuData, restSrc } = parseMenuData(raw);
    const categories = parseCategoryMeta(restSrc);
    const result = mutator(categories);
    const newRestSrc = serializeCategoryMetaFile(categories);
    const newContent = serializeMenuDataFile(menuData, newRestSrc);
    const put = await putFile(publicRepo, 'menu-data.js', githubToken, newContent, sha, commitMessage);
    if (put.ok) return result;
    if (attempt === maxRetries - 1) throw new Error('menu-data.js write conflict, retries exhausted');
  }
}

module.exports = async function handler(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://navrang786fr.github.io';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const jwtSecret = process.env.JWT_SECRET;
  const adminRepo = process.env.ADMIN_REPO;
  const adminToken = process.env.ADMIN_GITHUB_TOKEN;
  const publicRepo = process.env.GITHUB_REPO || 'navrang786fr/Navrang';
  const publicToken = process.env.GITHUB_TOKEN;
  if (!jwtSecret || !adminRepo || !adminToken || !publicToken) {
    res.status(500).json({ error: 'Server not configured' });
    return;
  }

  const auth = requireAuth(req, res, jwtSecret);
  if (!auth) return;

  if (req.method === 'GET') {
    try {
      const { raw } = await readRawFile(publicRepo, 'menu-data.js', publicToken);
      const { restSrc } = parseMenuData(raw);
      const categories = parseCategoryMeta(restSrc);
      res.status(200).json({ categories });
    } catch (e) {
      res.status(502).json({ error: 'Could not read categories', detail: String(e.message || e) });
    }
    return;
  }

  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  const id = String(body.id || '');
  if (!id) { res.status(400).json({ error: 'id is required' }); return; }

  const submitted = {};
  EDITABLE_FIELDS.forEach(function (k) {
    if (typeof body[k] === 'string' && body[k].trim()) submitted[k] = body[k].trim();
  });
  if (typeof submitted.title !== 'string') { res.status(400).json({ error: 'title is required' }); return; }
  if (typeof submitted.titleTe !== 'string') { res.status(400).json({ error: 'titleTe is required' }); return; }
  if (!submitted.short) submitted.short = submitted.title;
  if (!submitted.shortTe) submitted.shortTe = submitted.titleTe;

  try {
    const outcome = await mutateCategoryMeta(publicRepo, publicToken, function (categories) {
      const cat = findCategoryById(categories, id);
      if (!cat) throw new Error('category-not-found:' + id);
      const before = Object.assign({}, cat);
      Object.assign(cat, submitted);
      const changes = {};
      EDITABLE_FIELDS.forEach(function (k) {
        if (before[k] !== cat[k]) changes[k] = { from: before[k] === undefined ? null : before[k], to: cat[k] };
      });
      return { category: cat, changes };
    }, `Admin: update category "${id}" (${auth.sub})`);

    res.status(200).json({ ok: true, category: outcome.category, changes: outcome.changes });

    try {
      const info = getRequestInfo(req);
      await writeJsonArrayWithRetry(adminRepo, 'audit-log.json', adminToken, function (arr) {
        arr.push({
          username: auth.sub,
          timestamp: new Date().toISOString(),
          ip: info.ip,
          country: info.country,
          region: info.region,
          city: info.city,
          device: info.device,
          userAgent: info.userAgent,
          action: 'update-category',
          categoryId: id,
          changes: outcome.changes
        });
      }, `Audit: update category "${id}" by ${auth.sub}`);
    } catch (e) {
      // audit log failure shouldn't undo the already-successful category write
    }
  } catch (e) {
    const msg = String(e.message || e);
    if (msg.indexOf('category-not-found') === 0) { res.status(404).json({ error: 'Category not found' }); return; }
    res.status(502).json({ error: 'Could not save category', detail: msg });
  }
};
