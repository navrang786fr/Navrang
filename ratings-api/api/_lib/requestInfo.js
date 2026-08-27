// Lightweight request context for logs: IP + geo (from Vercel's built-in
// edge geolocation headers - no external API call) and a simple User-Agent
// parse for browser/OS/device type. No dependency.

function clientIp(req) {
  var fwd = (req.headers || {})['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

function parseUserAgent(ua) {
  ua = ua || '';
  var browser = 'Unknown';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/OPR\//.test(ua)) browser = 'Opera';
  else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) browser = 'Chrome';
  else if (/CriOS\//.test(ua)) browser = 'Chrome (iOS)';
  else if (/FxiOS\//.test(ua)) browser = 'Firefox (iOS)';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Version\/.*Safari\//.test(ua)) browser = 'Safari';
  else if (/MSIE|Trident\//.test(ua)) browser = 'Internet Explorer';

  var os = 'Unknown';
  if (/Windows NT/.test(ua)) os = 'Windows';
  else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
  else if (/Mac OS X/.test(ua)) os = 'macOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/Linux/.test(ua)) os = 'Linux';

  var type = /Mobi|iPhone|Android.*Mobile/.test(ua) ? 'Mobile' : (/iPad|Tablet/.test(ua) ? 'Tablet' : 'Desktop');

  return { browser: browser, os: os, type: type };
}

function getRequestInfo(req) {
  var headers = req.headers || {};
  var ua = headers['user-agent'] || '';
  var device = parseUserAgent(ua);
  return {
    ip: clientIp(req),
    country: headers['x-vercel-ip-country'] || null,
    region: headers['x-vercel-ip-country-region'] || null,
    city: headers['x-vercel-ip-city'] ? decodeURIComponent(headers['x-vercel-ip-city']) : null,
    device: device,
    userAgent: ua.slice(0, 300)
  };
}

module.exports = { getRequestInfo, parseUserAgent, clientIp };
