// Simple sliding-window rate limiting computed against an already-loaded log
// array (no separate counter store) - good enough at this traffic scale and
// keeps the zero-dependency, no-extra-infra style of the rest of the API.

/**
 * Returns true if `matchFn` matches at least `max` entries in `log` whose
 * `timestamp` falls within the last `windowMs` milliseconds.
 */
function isRateLimited(log, windowMs, max, matchFn) {
  var cutoff = Date.now() - windowMs;
  var count = 0;
  for (var i = 0; i < log.length; i++) {
    var entry = log[i];
    var t = new Date(entry.timestamp).getTime();
    if (isNaN(t) || t < cutoff) continue;
    if (matchFn(entry)) {
      count++;
      if (count >= max) return true;
    }
  }
  return false;
}

module.exports = { isRateLimited };
