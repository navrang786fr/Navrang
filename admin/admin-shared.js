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

  var ICON_PATHS = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10"/>',
    ratings: '<path d="M12 2l2.9 6.9L22 9.6l-5.5 4.8L18.2 22 12 18.1 5.8 22l1.7-7.6L2 9.6l7.1-.7z"/>',
    dishes: '<path d="M20.59 13.41L11 3.83A2 2 0 009.83 3H4a1 1 0 00-1 1v5.83a2 2 0 00.59 1.41l9.58 9.59a2 2 0 002.83 0l4.59-4.59a2 2 0 000-2.83z"/><circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" stroke="none"/>',
    categories: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
    activity: '<path d="M3 12h4l2.5 7L13 5l2.5 7H21"/>',
    audit: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6a1 1 0 011 1v1H8V4a1 1 0 011-1z"/><path d="M9 11h6M9 15h4"/>',
    access: '<path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/>',
    orders: '<path d="M6 2h9l3 3v17a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M9 9h6M9 13h6M9 17h3"/>',
    menu: '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/><path d="M9 7h7M9 11h7"/>',
    external: '<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/>',
    logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>'
  };
  function icon(name, size) {
    var paths = ICON_PATHS[name];
    if (!paths) return '';
    return '<svg viewBox="0 0 24 24" width="' + (size || 15) + '" height="' + (size || 15) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
  }

  function renderNav(activeKey) {
    var nav = document.getElementById('adminNav');
    if (!nav) return;
    var items = [
      { key: 'home', label: 'Home', href: 'index.html', icon: 'home' },
      { key: 'ratings', label: 'Ratings', href: 'ratings.html', icon: 'ratings' },
      { key: 'dishes', label: 'Dish Rates', href: 'dishes.html', icon: 'dishes' },
      { key: 'categories', label: 'Categories', href: 'categories.html', icon: 'categories' },
      { key: 'activity', label: 'Customer Activity', href: 'activity.html', icon: 'activity' },
      { key: 'audit', label: 'Audit Log', href: 'audit-log.html', icon: 'audit' },
      { key: 'access', label: 'Access Log', href: 'access-log.html', icon: 'access' }
    ];
    var externalItems = [
      { label: 'Orders', href: '../order.html', icon: 'orders' },
      { label: 'Menu (EN)', href: '../navrang-menu.html', icon: 'menu' },
      { label: 'Menu (TE)', href: '../navrang-menu-te.html', icon: 'menu' }
    ];
    nav.innerHTML = items.map(function (it) {
      return '<a class="admin-nav-link' + (it.key === activeKey ? ' active' : '') + '" href="' + it.href + '">' + icon(it.icon) + '<span>' + esc(it.label) + '</span></a>';
    }).join('') + '<div class="admin-nav-section">Shortcuts</div>' + externalItems.map(function (it) {
      return '<a class="admin-nav-link admin-nav-external" href="' + it.href + '" target="_blank" rel="noopener">' + icon(it.icon) + '<span>' + esc(it.label) + '</span>' + icon('external', 11) + '</a>';
    }).join('') + '<button type="button" class="admin-nav-logout" id="adminLogoutBtn">' + icon('logout') + '<span>Logout' + (getUsername() ? ' (' + esc(getUsername()) + ')' : '') + '</span></button>' +
      '<div class="admin-nav-version">v26.08.1</div>';
    var btn = document.getElementById('adminLogoutBtn');
    if (btn) btn.addEventListener('click', logout);
    initSidebarToggle();
  }

  function initSidebarToggle() {
    var toggle = document.getElementById('sidebarToggle');
    var sidebar = document.getElementById('adminSidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (!toggle || !sidebar) return;
    function open() { sidebar.classList.add('open'); if (overlay) overlay.classList.add('open'); }
    function close() { sidebar.classList.remove('open'); if (overlay) overlay.classList.remove('open'); }
    toggle.addEventListener('click', function () {
      sidebar.classList.contains('open') ? close() : open();
    });
    if (overlay) overlay.addEventListener('click', close);
    Array.prototype.forEach.call(sidebar.querySelectorAll('a, button'), function (el) {
      el.addEventListener('click', close);
    });
  }

  window.AdminShared = { getToken, getUsername, setSession, clearSession, requireAuthOrRedirect, apiFetch, logout, renderNav, esc, icon, API_BASE };
})(window);
