// Shared session/auth/nav helpers for every admin/*.html page.
(function (window) {
  var API_BASE = 'https://ratings-api-pink.vercel.app';
  var TOKEN_KEY = 'navrang_admin_token';
  var USER_KEY = 'navrang_admin_user';
  var OPEN_GROUPS_KEY = 'navrang_admin_open_groups';

  function getToken() { return sessionStorage.getItem(TOKEN_KEY); }
  function getUsername() { return sessionStorage.getItem(USER_KEY) || 'admin'; }
  function setSession(token, username) {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, username || 'admin');
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

  // Load Tailwind CSS dynamically for responsive utilities
  function initTailwind() {
    if (window.tailwind) return;
    if (!document.getElementById('tailwindCdnScript')) {
      var script = document.createElement('script');
      script.id = 'tailwindCdnScript';
      script.src = 'https://cdn.tailwindcss.com';
      script.onload = function () {
        if (window.tailwind) {
          window.tailwind.config = {
            theme: {
              extend: {
                colors: {
                  maroon: '#0E4D26',
                  'maroon-deep': '#06180D',
                  turmeric: '#C48B1E',
                  'bg-app': '#F4F6F9',
                  'bg-surface': '#FFFFFF'
                }
              }
            }
          };
        }
      };
      document.head.appendChild(script);
    }
  }

  var ICON_PATHS = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10"/>',
    ratings: '<path d="M12 2l2.9 6.9L22 9.6l-5.5 4.8L18.2 22 12 18.1 5.8 22l1.7-7.6L2 9.6l7.1-.7z"/>',
    dishes: '<path d="M20.59 13.41L11 3.83A2 2 0 009.83 3H4a1 1 0 00-1 1v5.83a2 2 0 00.59 1.41l9.58 9.59a2 2 0 002.83 0l4.59-4.59a2 2 0 000-2.83z"/><circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" stroke="none"/>',
    categories: '<rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
    activity: '<path d="M3 12h4l2.5 7L13 5l2.5 7H21"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM19 14h2M14 19h2M19 19h2"/>',
    audit: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6a1 1 0 011 1v1H8V4a1 1 0 011-1z"/><path d="M9 11h6M9 15h4"/>',
    access: '<path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/>',
    orders: '<path d="M6 2h9l3 3v17a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M9 9h6M9 13h6M9 17h3"/>',
    menu: '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/><path d="M9 7h7M9 11h7"/>',
    external: '<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>',
    logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
    chevron: '<polyline points="9 18 15 12 9 6"/>',
    user: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    storefront: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    billing: '<path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z"/><path d="M8 8h8M8 12h8M8 16h5"/>'
  };

  function icon(name, size) {
    var paths = ICON_PATHS[name];
    if (!paths) return '';
    return '<svg viewBox="0 0 24 24" width="' + (size || 15) + '" height="' + (size || 15) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
  }

  // Submenu items structure
  var NAV_GROUPS = [
    {
      type: 'direct',
      key: 'home',
      label: 'Dashboard',
      href: 'index.html',
      icon: 'home'
    },
    {
      type: 'direct',
      key: 'billing',
      label: 'Counter Billing',
      href: 'billing.html',
      icon: 'billing'
    },
    {
      type: 'group',
      id: 'menu-mgmt',
      label: 'Menu Management',
      icon: 'dishes',
      items: [
        { key: 'dishes', label: 'Dishes & Rates', href: 'dishes.html', icon: 'dishes' },
        { key: 'categories', label: 'Categories', href: 'categories.html', icon: 'categories' }
      ]
    },
    {
      type: 'group',
      id: 'cust-insights',
      label: 'Customer Insights',
      icon: 'activity',
      items: [
        { key: 'activity', label: 'Activity Analytics', href: 'activity.html', icon: 'activity' },
        { key: 'ratings', label: 'Customer Ratings', href: 'ratings.html', icon: 'ratings' },
        { key: 'qrscans', label: 'QR Scans', href: 'qr-scans.html', icon: 'qr' }
      ]
    },
    {
      type: 'group',
      id: 'sec-logs',
      label: 'Security & Logs',
      icon: 'audit',
      items: [
        { key: 'audit', label: 'Audit Log', href: 'audit-log.html', icon: 'audit' },
        { key: 'access', label: 'Access Log', href: 'access-log.html', icon: 'access' },
        { key: 'password', label: 'Change Password', href: 'change-password.html', icon: 'lock' }
      ]
    }
  ];

  var SHORTCUTS = [
    { label: 'Online Orders', href: '../order.html', icon: 'orders' },
    { label: 'Live Menu (EN)', href: '../navrang-menu.html', icon: 'menu' },
    { label: 'Live Menu (TE)', href: '../navrang-menu-te.html', icon: 'menu' }
  ];

  function getOpenGroups() {
    try {
      var raw = sessionStorage.getItem(OPEN_GROUPS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveOpenGroups(groups) {
    try {
      sessionStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify(groups));
    } catch (e) {}
  }

  function renderHeaderActions() {
    var header = document.querySelector('.admin-header-bar');
    if (!header) return;

    // Check if right actions already exist
    if (header.querySelector('.admin-header-actions')) return;

    // Ensure left branding elements are grouped in .admin-header-brand
    var brand = header.querySelector('.admin-header-brand');
    if (!brand) {
      var toggle = header.querySelector('#sidebarToggle');
      var logo = header.querySelector('img');
      var title = header.querySelector('h1');

      brand = document.createElement('div');
      brand.className = 'admin-header-brand';

      if (toggle) brand.appendChild(toggle);
      if (logo) brand.appendChild(logo);

      var titleWrap = document.createElement('div');
      titleWrap.className = 'admin-header-title-wrap';
      if (title) titleWrap.appendChild(title);

      var badge = document.createElement('span');
      badge.className = 'admin-header-badge';
      badge.textContent = 'Portal';
      titleWrap.appendChild(badge);

      brand.appendChild(titleWrap);
      header.insertBefore(brand, header.firstChild);
    }

    // Create Right Header Actions container
    var actions = document.createElement('div');
    actions.className = 'admin-header-actions';

    var username = getUsername();
    var userInitial = (username.charAt(0) || 'A').toUpperCase();

    actions.innerHTML =
      '<a href="../navrang-menu.html" target="_blank" rel="noopener" class="admin-header-link" title="Open Live Customer Menu">' +
        icon('menu', 13) +
        '<span>Live Menu</span>' +
        icon('external', 10) +
      '</a>' +
      '<div class="admin-header-user">' +
        '<div class="admin-user-avatar">' + esc(userInitial) + '</div>' +
        '<div class="admin-user-meta">' +
          '<span class="admin-user-name">' + esc(username) + '</span>' +
          '<span class="admin-user-status">Online</span>' +
        '</div>' +
      '</div>' +
      '<button type="button" class="admin-header-logout" id="adminHeaderLogoutBtn" title="Sign out of Admin">' +
        icon('logout', 14) +
        '<span>Logout</span>' +
      '</button>';

    header.appendChild(actions);

    var logoutBtn = document.getElementById('adminHeaderLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', logout);
    }
  }

  function renderNav(activeKey) {
    initTailwind();
    renderHeaderActions();

    var nav = document.getElementById('adminNav');
    if (!nav) return;

    var openGroups = getOpenGroups();

    // Auto-open group that contains activeKey
    NAV_GROUPS.forEach(function (g) {
      if (g.type === 'group' && g.items) {
        var hasActive = g.items.some(function (it) { return it.key === activeKey; });
        if (hasActive && openGroups.indexOf(g.id) === -1) {
          openGroups.push(g.id);
        }
      }
    });
    saveOpenGroups(openGroups);

    var html = '';

    NAV_GROUPS.forEach(function (g) {
      if (g.type === 'direct') {
        var isAct = g.key === activeKey;
        html += '<a class="admin-nav-link' + (isAct ? ' active' : '') + '" href="' + g.href + '">' +
          icon(g.icon) + '<span>' + esc(g.label) + '</span></a>';
      } else if (g.type === 'group') {
        var isOpen = openGroups.indexOf(g.id) !== -1;
        var hasActiveChild = g.items.some(function (it) { return it.key === activeKey; });

        html += '<div class="admin-nav-group' + (isOpen ? ' open' : '') + '" data-group-id="' + g.id + '">' +
          '<button type="button" class="admin-nav-group-btn' + (hasActiveChild ? ' has-active' : '') + '" aria-expanded="' + (isOpen ? 'true' : 'false') + '">' +
            '<span class="group-icon">' + icon(g.icon) + '</span>' +
            '<span>' + esc(g.label) + '</span>' +
            '<span class="admin-nav-chevron">' + icon('chevron', 14) + '</span>' +
          '</button>' +
          '<div class="admin-nav-submenu">' +
            '<div class="admin-nav-sublist">';

        g.items.forEach(function (sub) {
          var isSubAct = sub.key === activeKey;
          html += '<a class="admin-nav-sublink' + (isSubAct ? ' active' : '') + '" href="' + sub.href + '">' +
            icon(sub.icon, 13) + '<span>' + esc(sub.label) + '</span></a>';
        });

        html += '</div></div></div>';
      }
    });

    // Shortcuts Section
    html += '<div class="admin-nav-section">Shortcuts</div>';
    SHORTCUTS.forEach(function (sc) {
      html += '<a class="admin-nav-link admin-nav-external" href="' + sc.href + '" target="_blank" rel="noopener">' +
        icon(sc.icon) + '<span>' + esc(sc.label) + '</span>' + icon('external', 11) + '</a>';
    });

    // Footer with version & live status
    html += '<div class="admin-sidebar-footer">' +
      '<div class="admin-sidebar-status"><span class="dot"></span><span>System Online</span></div>' +
      '<div class="admin-sidebar-version">Navrang Admin v26.08</div>' +
    '</div>';

    nav.innerHTML = html;

    // Attach accordion click listeners to submenu headers
    var groupButtons = nav.querySelectorAll('.admin-nav-group-btn');
    Array.prototype.forEach.call(groupButtons, function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var parentGroup = btn.closest('.admin-nav-group');
        if (!parentGroup) return;
        var groupId = parentGroup.getAttribute('data-group-id');
        var nowOpen = parentGroup.classList.toggle('open');
        btn.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');

        var currentOpen = getOpenGroups();
        if (nowOpen) {
          if (currentOpen.indexOf(groupId) === -1) currentOpen.push(groupId);
        } else {
          currentOpen = currentOpen.filter(function (id) { return id !== groupId; });
        }
        saveOpenGroups(currentOpen);
      });
    });

    initSidebarToggle();
  }

  function initSidebarToggle() {
    var toggle = document.getElementById('sidebarToggle');
    var sidebar = document.getElementById('adminSidebar');
    var overlay = document.getElementById('sidebarOverlay');
    if (!sidebar) return;

    function open() {
      sidebar.classList.add('open');
      if (overlay) overlay.classList.add('open');
      document.body.style.overflow = window.innerWidth <= 860 ? 'hidden' : '';
    }

    function close() {
      sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    if (toggle) {
      toggle.removeEventListener('click', toggle._adminToggleHandler);
      toggle._adminToggleHandler = function (e) {
        e.stopPropagation();
        sidebar.classList.contains('open') ? close() : open();
      };
      toggle.addEventListener('click', toggle._adminToggleHandler);
    }

    if (overlay) {
      overlay.removeEventListener('click', close);
      overlay.addEventListener('click', close);
    }

    // Close on link click
    Array.prototype.forEach.call(sidebar.querySelectorAll('a'), function (el) {
      el.addEventListener('click', function () {
        if (window.innerWidth <= 860) close();
      });
    });

    // Close on Escape key
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && sidebar.classList.contains('open')) {
        close();
      }
    });
  }

  // Auto-run header rendering if DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderHeaderActions);
  } else {
    renderHeaderActions();
  }

  window.AdminShared = {
    getToken: getToken,
    getUsername: getUsername,
    setSession: setSession,
    clearSession: clearSession,
    requireAuthOrRedirect: requireAuthOrRedirect,
    apiFetch: apiFetch,
    logout: logout,
    renderNav: renderNav,
    esc: esc,
    icon: icon,
    API_BASE: API_BASE
  };
})(window);
