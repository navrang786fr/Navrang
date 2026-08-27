// Shared GitHub Contents API helpers used by the admin endpoints to read/write
// JSON and text files in a repo (public Navrang repo or the private admin-db repo).

function ghHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'navrang-admin-function'
  };
}

async function readRawFile(repo, filePath, token) {
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const resp = await fetch(apiUrl, { headers: ghHeaders(token) });
  if (resp.status === 404) return { raw: null, sha: null };
  if (!resp.ok) throw new Error('gh-read-failed:' + resp.status);
  const json = await resp.json();
  const raw = Buffer.from(json.content, 'base64').toString('utf-8');
  return { raw, sha: json.sha };
}

async function putFile(repo, filePath, token, content, sha, message) {
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const resp = await fetch(apiUrl, {
    method: 'PUT',
    headers: { ...ghHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: Buffer.from(content).toString('base64'),
      ...(sha ? { sha } : {})
    })
  });
  if (resp.ok) return { ok: true };
  if (resp.status === 409) return { ok: false, conflict: true };
  const errText = await resp.text();
  throw new Error('gh-write-failed:' + resp.status + ':' + errText);
}

/** Just the sha (or null if the file doesn't exist yet) — for binary files where readRawFile's utf-8 decode would corrupt content. */
async function getFileSha(repo, filePath, token) {
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const resp = await fetch(apiUrl, { headers: ghHeaders(token) });
  if (resp.status === 404) return null;
  if (!resp.ok) throw new Error('gh-read-failed:' + resp.status);
  const json = await resp.json();
  return json.sha;
}

/** PUT with already-base64-encoded content (binary-safe — no UTF-8 round-trip). */
async function putFileBase64(repo, filePath, token, base64Content, sha, message) {
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const resp = await fetch(apiUrl, {
    method: 'PUT',
    headers: { ...ghHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: base64Content,
      ...(sha ? { sha } : {})
    })
  });
  if (resp.ok) return { ok: true };
  if (resp.status === 409) return { ok: false, conflict: true };
  const errText = await resp.text();
  throw new Error('gh-write-failed:' + resp.status + ':' + errText);
}

/** Read a JSON array file, defaulting to [] if missing/invalid. */
async function readJsonArray(repo, filePath, token) {
  const { raw } = await readRawFile(repo, filePath, token);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

/**
 * Read-modify-write a JSON array file with retry on 409 conflicts.
 * mutateFn(array) mutates the array in place and may return an arbitrary
 * "result" value that gets passed back to the caller.
 */
async function writeJsonArrayWithRetry(repo, filePath, token, mutateFn, message, maxRetries) {
  maxRetries = maxRetries || 3;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { raw, sha } = await readRawFile(repo, filePath, token);
    let data = [];
    if (raw) {
      try {
        data = JSON.parse(raw);
        if (!Array.isArray(data)) data = [];
      } catch (e) {
        data = [];
      }
    }
    const result = mutateFn(data);
    const content = JSON.stringify(data, null, 2) + '\n';
    const put = await putFile(repo, filePath, token, content, sha, message);
    if (put.ok) return result;
    if (attempt === maxRetries - 1) throw new Error('gh-write-conflict-exhausted-retries');
  }
}

module.exports = { ghHeaders, readRawFile, putFile, getFileSha, putFileBase64, readJsonArray, writeJsonArrayWithRetry };
