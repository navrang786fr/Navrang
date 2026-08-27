// Password hashing (scrypt) and hand-rolled HMAC-signed session tokens
// (JWT-shaped, no external dependency) for the admin panel.

const crypto = require('crypto');

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password, salt, expectedHash) {
  const actual = Buffer.from(hashPassword(password, salt), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

function base64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function base64urlDecodeToString(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString('utf-8');
}

const DEFAULT_TTL_SECONDS = 12 * 60 * 60; // 12h

function signToken(payload, secret, ttlSeconds) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = Object.assign({}, payload, { iat: now, exp: now + (ttlSeconds || DEFAULT_TTL_SECONDS) });
  const headerPart = base64url(JSON.stringify(header));
  const bodyPart = base64url(JSON.stringify(body));
  const sig = crypto.createHmac('sha256', secret).update(headerPart + '.' + bodyPart).digest();
  return headerPart + '.' + bodyPart + '.' + base64url(sig);
}

function verifyToken(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerPart, bodyPart, sigPart] = parts;
  const expectedSig = base64url(crypto.createHmac('sha256', secret).update(headerPart + '.' + bodyPart).digest());
  const a = Buffer.from(expectedSig);
  const b = Buffer.from(sigPart);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let body;
  try {
    body = JSON.parse(base64urlDecodeToString(bodyPart));
  } catch (e) {
    return null;
  }
  if (typeof body.exp !== 'number' || Math.floor(Date.now() / 1000) > body.exp) return null;
  return body;
}

function getBearerToken(req) {
  const h = req.headers['authorization'] || req.headers['Authorization'];
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h);
  return m ? m[1] : null;
}

/** Returns the verified token payload, or writes a 401 response and returns null. */
function requireAuth(req, res, secret) {
  const token = getBearerToken(req);
  const payload = token ? verifyToken(token, secret) : null;
  if (!payload) {
    res.status(401).json({ error: 'Not authenticated' });
    return null;
  }
  return payload;
}

module.exports = { hashPassword, verifyPassword, signToken, verifyToken, getBearerToken, requireAuth };
