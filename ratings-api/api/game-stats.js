// Public serverless API to read and increment real game plays for Navrang's Biryani Catcher
const { readRawFile, putFile } = require('./_lib/github.js');

module.exports = async function handler(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://navrang786fr.github.io';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const publicRepo = process.env.PUBLIC_REPO || process.env.GITHUB_REPO || 'navrang786fr/Navrang';
  const token = process.env.GITHUB_TOKEN || process.env.PUBLIC_REPO_TOKEN;
  const filePath = 'game-stats.json';

  if (req.method === 'GET') {
    if (!token) {
      res.status(200).json({ totalPlays: 0 });
      return;
    }
    try {
      const { raw } = await readRawFile(publicRepo, filePath, token);
      let totalPlays = 0;
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          totalPlays = Math.max(0, parseInt(parsed.totalPlays, 10) || 0);
        } catch(e){}
      }
      res.status(200).json({ totalPlays: totalPlays });
    } catch (e) {
      res.status(200).json({ totalPlays: 0 });
    }
    return;
  }

  if (req.method === 'POST') {
    if (!token) {
      res.status(200).json({ totalPlays: 1, ok: true });
      return;
    }
    try {
      let currentPlays = 0;
      let sha = null;
      try {
        const file = await readRawFile(publicRepo, filePath, token);
        if (file.raw) {
          const parsed = JSON.parse(file.raw);
          currentPlays = Math.max(0, parseInt(parsed.totalPlays, 10) || 0);
          sha = file.sha;
        }
      } catch(e){}

      currentPlays++;
      const newContent = JSON.stringify({
        totalPlays: currentPlays,
        lastUpdated: new Date().toISOString()
      }, null, 2);

      await putFile(publicRepo, filePath, token, newContent, sha, `Record real game play: ${currentPlays}`);
      res.status(200).json({ totalPlays: currentPlays, ok: true });
    } catch(e) {
      res.status(200).json({ totalPlays: 0, ok: true });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
