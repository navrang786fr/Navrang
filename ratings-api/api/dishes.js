// Admin dish-rate editor API: GET returns the current menu, POST creates or
// updates a dish (writing menu-data.js in the public Navrang repo) and
// records an audit-log entry (who/when/what changed) in the private admin
// repo.

const crypto = require('crypto');
const { readRawFile, putFile, getFileSha, putFileBase64, writeJsonArrayWithRetry } = require('./_lib/github.js');
const { requireAuth } = require('./_lib/auth.js');
const { parseMenuData, parseCategoryMeta, serializeMenuDataFile, findDishById, nextId } = require('./_lib/menuData.js');
const { getRequestInfo } = require('./_lib/requestInfo.js');

const EDITABLE_FIELDS = ['name', 'nameTe', 'price', 'veg', 'thumb', 'photo', 'top', 'status', 'weeklyDishInd'];

function pickEditable(src) {
  const out = {};
  EDITABLE_FIELDS.forEach(function (k) {
    if (Object.prototype.hasOwnProperty.call(src, k)) out[k] = src[k];
  });
  return out;
}

function slugify(name) {
  return String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function dataUrlToBase64(dataUrl) {
  const m = /^data:[^;]+;base64,(.+)$/.exec(dataUrl || '');
  if (!m) throw new Error('invalid-image-data');
  return m[1];
}

/** Uploads original/500/100 versions for a dish photo and returns { thumb, photo } paths to store on the dish. */
async function uploadDishImages(publicRepo, token, dishName, images, username) {
  const slug = slugify(dishName) || 'dish';
  const ext = String(images.originalExt || 'jpg').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg';
  const files = [
    { path: `images/menu/original/${slug}.${ext}`, dataUrl: images.originalDataUrl },
    { path: `images/menu/${slug}-500.jpg`, dataUrl: images.photoDataUrl },
    { path: `images/menu/${slug}-100.jpg`, dataUrl: images.thumbDataUrl }
  ];
  for (const f of files) {
    if (!f.dataUrl) continue;
    const base64 = dataUrlToBase64(f.dataUrl);
    const sha = await getFileSha(publicRepo, f.path, token);
    const put = await putFileBase64(publicRepo, f.path, token, base64, sha, `Admin: upload ${f.path} for "${dishName}" (${username})`);
    if (!put.ok) throw new Error('image-upload-failed:' + f.path);
  }
  // Cache-buster derived from the uploaded photo's own bytes: unrelated dishes keep their
  // already-cached URL untouched, but a re-uploaded photo gets a new URL so customers on
  // the order page (and any CDN edge cache) fetch the new image instead of a stale one.
  const version = crypto.createHash('sha1').update(images.photoDataUrl || images.originalDataUrl).digest('hex').slice(0, 10);
  return { thumb: `images/menu/${slug}-100.jpg?v=${version}`, photo: `images/menu/${slug}-500.jpg?v=${version}` };
}

async function mutateMenuData(publicRepo, githubToken, mutator, commitMessage, maxRetries) {
  maxRetries = maxRetries || 4;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { raw, sha } = await readRawFile(publicRepo, 'menu-data.js', githubToken);
    if (!raw) throw new Error('menu-data.js not found in public repo');
    const { menuData, restSrc } = parseMenuData(raw);
    const result = mutator(menuData);
    const newContent = serializeMenuDataFile(menuData, restSrc);
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
      const { menuData, restSrc } = parseMenuData(raw);
      const categories = parseCategoryMeta(restSrc).map(function (c) {
        return { id: c.id, title: c.title, titleTe: c.titleTe };
      });
      res.status(200).json({ menu: menuData, categories: categories });
    } catch (e) {
      res.status(502).json({ error: 'Could not read menu data', detail: String(e.message || e) });
    }
    return;
  }

  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  const action = body.action === 'create' ? 'create' : 'update';
  const submitted = pickEditable(body.dish || {});

  if (typeof submitted.name !== 'string' || !submitted.name.trim()) {
    res.status(400).json({ error: 'Dish name is required' }); return;
  }
  if (typeof submitted.nameTe !== 'string' || !submitted.nameTe.trim()) {
    res.status(400).json({ error: 'Telugu name is required' }); return;
  }
  if (submitted.price !== null && typeof submitted.price !== 'number') {
    res.status(400).json({ error: 'Price must be a number or null' }); return;
  }
  if (typeof submitted.veg !== 'boolean') {
    res.status(400).json({ error: 'veg must be true or false' }); return;
  }

  try {
    let auditPayload;

    if (body.images) {
      const paths = await uploadDishImages(publicRepo, publicToken, submitted.name, body.images, auth.sub);
      Object.assign(submitted, paths);
    }

    if (action === 'create') {
      const categoryId = String(body.categoryId || '');
      if (!categoryId) { res.status(400).json({ error: 'categoryId is required to create a dish' }); return; }

      const created = await mutateMenuData(publicRepo, publicToken, function (menuData) {
        if (!menuData[categoryId]) throw new Error('unknown-category:' + categoryId);
        const dish = Object.assign({ status: 'Active', weeklyDishInd: false }, submitted, { id: nextId(menuData) });
        menuData[categoryId].push(dish);
        return dish;
      }, `Admin: create dish "${submitted.name}" (${auth.sub})`);

      auditPayload = { action: 'create', categoryId, dishId: created.id, dishName: created.name, changes: created };
      res.status(200).json({ ok: true, dish: created });
    } else {
      const id = parseInt(body.id, 10);
      if (!id) { res.status(400).json({ error: 'id is required to update a dish' }); return; }

      const outcome = await mutateMenuData(publicRepo, publicToken, function (menuData) {
        const found = findDishById(menuData, id);
        if (!found) throw new Error('dish-not-found:' + id);
        const before = Object.assign({}, found.dish);
        Object.assign(found.dish, submitted);
        const changes = {};
        EDITABLE_FIELDS.forEach(function (k) {
          if (Object.prototype.hasOwnProperty.call(submitted, k) && before[k] !== found.dish[k]) {
            changes[k] = { from: before[k] === undefined ? null : before[k], to: found.dish[k] };
          }
        });
        return { dish: found.dish, categoryId: found.catId, changes };
      }, `Admin: update dish #${id} (${auth.sub})`);

      auditPayload = { action: 'update', categoryId: outcome.categoryId, dishId: id, dishName: outcome.dish.name, changes: outcome.changes };
      res.status(200).json({ ok: true, dish: outcome.dish, changes: outcome.changes });
    }

    try {
      const info = getRequestInfo(req);
      await writeJsonArrayWithRetry(adminRepo, 'audit-log.json', adminToken, function (arr) {
        arr.push(Object.assign({
          username: auth.sub,
          timestamp: new Date().toISOString(),
          ip: info.ip,
          country: info.country,
          region: info.region,
          city: info.city,
          device: info.device,
          userAgent: info.userAgent
        }, auditPayload));
      }, `Audit: ${auditPayload.action} dish "${auditPayload.dishName}" by ${auth.sub}`);
    } catch (e) {
      // audit log failure shouldn't undo the already-successful menu write
    }
  } catch (e) {
    const msg = String(e.message || e);
    if (msg.indexOf('unknown-category') === 0) { res.status(400).json({ error: 'Unknown category' }); return; }
    if (msg.indexOf('dish-not-found') === 0) { res.status(404).json({ error: 'Dish not found' }); return; }
    if (msg === 'invalid-image-data') { res.status(400).json({ error: 'Invalid image data' }); return; }
    if (msg.indexOf('image-upload-failed') === 0) { res.status(502).json({ error: 'Could not upload image', detail: msg }); return; }
    res.status(502).json({ error: 'Could not save dish', detail: msg });
  }
};
