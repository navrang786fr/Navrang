// Shared session/auth/nav helpers for every admin/*.html page.
(function (window) {
  var API_BASE = 'https://ratings-api-pink.vercel.app';
  var TOKEN_KEY = 'navrang_admin_token';
  var USER_KEY = 'navrang_admin_user';

  function getToken() { return sessionStorage.getItem(TOKEN_KEY); }
  function getUsername() { return sessionStorage.getItem(USER_KEY); }
  function setSession(token, username) {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, username);
  }
  function clearSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }
  function requireAuthOrRedirect() {
    if (!getToken()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }
  function apiFetch(path, opts) {
    opts = opts || {};
    var headers = Object.assign({}, opts.headers || {}, { Authorization: 'Bearer ' + getToken() });
    if (opts.body && typeof opts.body === 'string') headers['Content-Type'] = 'application/json';
    return fetch(API_BASE + path, Object.assign({}, opts, { headers: headers })).then(function (resp) {
      if (resp.status === 401) {
        clearSession();
        window.location.href = 'login.html';
        throw new Error('unauthenticated');
      }
      return resp;
    });
  }
  function logout() {
    clearSession();
    window.location.href = 'login.html';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function renderNav(activeKey) {
    var nav = document.getElementById('adminNav');
    if (!nav) return;
    var items = [
      { key: 'home', label: 'Home', href: 'index.html' },
      { key: 'ratings', label: 'Ratings', href: 'ratings.html' },
      { key: 'dishes', label: 'Dish Rates', href: 'dishes.html' },
      { key: 'activity', label: 'Customer Activity', href: 'activity.html' },
      { key: 'audit', label: 'Audit Log', href: 'audit-log.html' },
      { key: 'access', label: 'Access Log', href: 'access-log.html' }
    ];
    nav.innerHTML = items.map(function (it) {
      return '<a class="admin-nav-link' + (it.key === activeKey ? ' active' : '') + '" href="' + it.href + '">' + esc(it.label) + '</a>';
    }).join('') + '<button type="button" class="admin-nav-logout" id="adminLogoutBtn">Logout' + (getUsername() ? ' (' + esc(getUsername()) + ')' : '') + '</button>';
    var btn = document.getElementById('adminLogoutBtn');
    if (btn) btn.addEventListener('click', logout);
  }

  window.AdminShared = { getToken, getUsername, setSession, clearSession, requireAuthOrRedirect, apiFetch, logout, renderNav, esc, API_BASE };
})(window);
