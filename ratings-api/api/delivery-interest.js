// Public serverless API to read and record unique customer interest in Home Delivery
const { readRawFile, putFile, writeJsonArrayWithRetry } = require('./_lib/github.js');
const { getRequestInfo } = require('./_lib/requestInfo.js');

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
  const adminRepo = process.env.ADMIN_REPO;
  const adminToken = process.env.ADMIN_GITHUB_TOKEN;
  const filePath = 'delivery-interest.json';

  // GET: Publicly return unique interest count and top requested areas
  if (req.method === 'GET') {
    if (!token) {
      res.status(200).json({ uniqueCount: 0, totalVotes: 0, topAreas: [] });
      return;
    }
    try {
      const { raw } = await readRawFile(publicRepo, filePath, token);
      let data = { uniqueCount: 0, totalVotes: 0, topAreas: [], areas: {}, enquiries: [] };
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          data.uniqueCount = Math.max(0, parseInt(parsed.uniqueCount, 10) || 0);
          data.totalVotes = Math.max(0, parseInt(parsed.totalVotes, 10) || 0);
          data.topAreas = Array.isArray(parsed.topAreas) ? parsed.topAreas.slice(0, 15) : [];
          data.areas = parsed.areas || {};
          data.enquiries = Array.isArray(parsed.enquiries) ? parsed.enquiries : [];
          data.lastUpdated = parsed.lastUpdated || '';
        } catch(e){}
      }
      res.status(200).json(data);
    } catch (e) {
      res.status(200).json({ uniqueCount: 0, totalVotes: 0, topAreas: [] });
    }
    return;
  }

  // POST: Record a customer vote (deduplicating by deviceId or client IP)
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};

    const area = String(body.area || '').trim().slice(0, 80);
    const phone = String(body.phone || '').trim().slice(0, 20);
    const deviceId = String(body.deviceId || '').trim().slice(0, 80);
    const sessionId = String(body.sessionId || '').trim().slice(0, 80);
    const info = getRequestInfo(req);

    // Voter identity key for uniqueness
    const voterKey = deviceId || (info.ip ? `ip_${info.ip.replace(/[^a-zA-Z0-9]/g, '')}` : `sess_${sessionId}`);

    let uniqueCount = 0;
    let totalVotes = 0;
    let isNewUnique = true;

    if (token) {
      try {
        const file = await readRawFile(publicRepo, filePath, token);
        let store = { uniqueCount: 0, totalVotes: 0, areas: {}, voters: [] };
        let sha = null;

        if (file && file.raw) {
          try {
            store = JSON.parse(file.raw);
            sha = file.sha;
          } catch(e){}
        }

        store.uniqueCount = Math.max(0, parseInt(store.uniqueCount, 10) || 0);
        store.totalVotes = Math.max(0, parseInt(store.totalVotes, 10) || 0);
        store.areas = store.areas || {};
        store.voters = Array.isArray(store.voters) ? store.voters : [];

        // Deduplication check
        if (voterKey && store.voters.indexOf(voterKey) !== -1) {
          isNewUnique = false;
        } else {
          isNewUnique = true;
          if (voterKey) {
            store.voters.push(voterKey);
            // Keep voters list bounded
            if (store.voters.length > 5000) store.voters.splice(0, store.voters.length - 5000);
          }
          store.uniqueCount++;
        }

        store.totalVotes++;

        if (area) {
          // Normalize area name (title case)
          const normArea = area.split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');
          store.areas[normArea] = (store.areas[normArea] || 0) + 1;
        }

        // Record customer enquiry lead
        const finalArea = area
          ? area.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
          : 'General Demand';
        store.enquiries = Array.isArray(store.enquiries) ? store.enquiries : [];
        store.enquiries.unshift({
          area: finalArea,
          phone: phone || '',
          timestamp: new Date().toISOString(),
          isNewUnique: isNewUnique
        });
        if (store.enquiries.length > 1000) store.enquiries = store.enquiries.slice(0, 1000);

        // Compute top areas
        const areaPairs = Object.keys(store.areas).map(name => ({ name, count: store.areas[name] }));
        areaPairs.sort((a, b) => b.count - a.count);
        store.topAreas = areaPairs.slice(0, 15);
        store.lastUpdated = new Date().toISOString();

        uniqueCount = store.uniqueCount;
        totalVotes = store.totalVotes;

        await putFile(publicRepo, filePath, token, JSON.stringify(store, null, 2), sha, `Record delivery interest vote: ${uniqueCount} unique`);
      } catch(e) {
        // Fallback gracefully
        uniqueCount = 1;
      }
    }

    // Log detailed lead to private admin repo if configured
    if (adminRepo && adminToken) {
      try {
        await writeJsonArrayWithRetry(adminRepo, 'activity-log.json', adminToken, function(arr){
          arr.push({
            type: 'delivery_interest',
            value: area || 'General Interest',
            phone: phone || null,
            isNewUnique: isNewUnique,
            sessionId: sessionId || null,
            ip: info.ip,
            city: info.city,
            device: info.device,
            timestamp: new Date().toISOString()
          });
          if (arr.length > 5000) arr.splice(0, arr.length - 5000);
        }, `Delivery interest lead: "${area}"`);
      } catch(e){}
    }

    res.status(200).json({
      ok: true,
      uniqueCount: uniqueCount || 1,
      isNewUnique: isNewUnique,
      message: 'Thank you! Your interest has been recorded.'
    });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
