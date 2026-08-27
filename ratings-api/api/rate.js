// Serverless function: receives a rating submission from order.html and
// appends it to ratings.json in the Navrang GitHub repo via the Contents API.
// GITHUB_TOKEN (fine-grained PAT, Contents: Read & write on this repo only)
// and ALLOWED_ORIGIN are read from Vercel environment variables.

const REPO = process.env.GITHUB_REPO || 'navrang786fr/Navrang';
const FILE_PATH = 'ratings.json';

function ghHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'navrang-ratings-function'
  };
}

async function appendRatingWithRetry(apiUrl, headers, entry, maxRetries) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let existing = [];
    let sha;

    const getResp = await fetch(apiUrl, { headers });
    if (getResp.status === 200) {
      const data = await getResp.json();
      sha = data.sha;
      const content = Buffer.from(data.content, 'base64').toString('utf-8');
      try {
        existing = JSON.parse(content);
        if (!Array.isArray(existing)) existing = [];
      } catch (e) {
        existing = [];
      }
    } else if (getResp.status !== 404) {
      throw new Error('read-failed:' + getResp.status);
    }

    existing.push(entry);
    const newContent = Buffer.from(JSON.stringify(existing, null, 2)).toString('base64');

    const putResp = await fetch(apiUrl, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Add rating from ${entry.name}`,
        content: newContent,
        ...(sha ? { sha } : {})
      })
    });

    if (putResp.ok) return;
    if (putResp.status === 409 && attempt < maxRetries - 1) continue;
    const errText = await putResp.text();
    throw new Error('write-failed:' + putResp.status + ':' + errText);
  }
}

module.exports = async function handler(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://navrang786fr.github.io';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    res.status(500).json({ error: 'Server not configured' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  const name = String(body.name || '').trim().slice(0, 60);
  const comments = String(body.comments || '').trim().slice(0, 500);
  const ratingNum = parseInt(body.rating, 10);
  let dishes = Array.isArray(body.dishes) ? body.dishes : [];
  dishes = dishes.map(function (d) { return String(d).trim().slice(0, 80); }).filter(Boolean).slice(0, 20);

  if (!name) { res.status(400).json({ error: 'Name is required' }); return; }
  if (!dishes.length) { res.status(400).json({ error: 'At least one dish is required' }); return; }
  if (!(ratingNum >= 1 && ratingNum <= 5)) { res.status(400).json({ error: 'Rating must be 1-5' }); return; }

  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    name: name,
    dishes: dishes,
    rating: ratingNum,
    comments: comments,
    submittedAt: new Date().toISOString()
  };

  const apiUrl = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;

  try {
    await appendRatingWithRetry(apiUrl, ghHeaders(token), entry, 3);
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: 'Failed to save rating', detail: String(err.message || err) });
  }
};
