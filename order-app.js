(function(){
  "use strict";

  var THEMES = ['classic','emerald','royal','charcoal'];
  var TABLE_KEY = 'navarang-table';
  var THEME_KEY = 'navarang-theme';

  var root = document.documentElement;
  var qs = function(sel, ctx){ return (ctx||document).querySelector(sel); };
  var qsa = function(sel, ctx){ return Array.prototype.slice.call((ctx||document).querySelectorAll(sel)); };

  /* ---------- Theme ---------- */
  function applyTheme(theme){
    root.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    qsa('.theme-swatch').forEach(function(btn){
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
  }
  qsa('.theme-swatch').forEach(function(btn){
    btn.addEventListener('click', function(){ applyTheme(btn.dataset.theme); });
  });
  (function initTheme(){
    var stored = localStorage.getItem(THEME_KEY);
    applyTheme(THEMES.indexOf(stored) !== -1 ? stored : 'emerald');
  })();

  /* ---------- Config ---------- */
  var CFG = window.RESTAURANT_CONFIG || { name:'Restaurant', whatsappNumber:'', currency:'₹' };
  var CUR = CFG.currency || '₹';

  /* ---------- Table number ---------- */
  function getUrlTable(){
    var m = /[?&]table=([^&]+)/.exec(window.location.search);
    return m ? decodeURIComponent(m[1]) : '';
  }
  var currentTable = getUrlTable() || localStorage.getItem(TABLE_KEY) || '';
  if (getUrlTable()) localStorage.setItem(TABLE_KEY, getUrlTable());

  /* ---------- Build menu DOM ---------- */
  var chipRow = qs('#chipRow');
  var menuContent = qs('#menuContent');

  function iconSvg(paths, extraAttrs){
    return '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"' + (extraAttrs||'') + '>' + paths + '</svg>';
  }

  CATEGORY_META.forEach(function(cat){
    var items = MENU_DATA[cat.id] || [];

    var chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.dataset.target = cat.id;
    chip.innerHTML = iconSvg(cat.icon) + '<span>' + cat.short + '</span>';
    chip.addEventListener('click', function(){
      var section = document.getElementById('sec-' + cat.id);
      if (section) section.scrollIntoView({ behavior:'smooth', block:'start' });
    });
    chipRow.appendChild(chip);

    var section = document.createElement('div');
    section.className = 'menu-section';
    section.id = 'sec-' + cat.id;

    var head = document.createElement('div');
    head.className = 'section-head';
    head.innerHTML = '<span class="cat-icon">' + iconSvg(cat.icon) + '</span>' + cat.title +
      '<span class="n">' + items.length + ' items</span>';
    section.appendChild(head);

    items.forEach(function(item){
      var row = document.createElement('div');
      row.className = 'dish';
      row.dataset.name = item.name.toLowerCase();
      row.dataset.veg = item.veg ? '1' : '0';

      var priceLabel = item.price === null ? '<span class="no-price">Ask staff</span>' : ('<span class="dish-price">' + CUR + item.price + '</span>');

      row.innerHTML =
        '<span class="dot ' + (item.veg ? 'veg' : 'nonveg') + '"></span>' +
        '<span class="dish-info"><span class="dish-name">' + item.name + '</span></span>' +
        priceLabel;

      section.appendChild(row);
    });

    menuContent.appendChild(section);
  });

  /* ---------- Search + veg filter ---------- */
  var searchInput = qs('#searchInput');
  var vegToggle = qs('#vegToggle');
  var vegOnly = false;

  function applyFilters(){
    var q = searchInput.value.trim().toLowerCase();
    qsa('.menu-section').forEach(function(section){
      var visibleCount = 0;
      qsa('.dish', section).forEach(function(row){
        var matchesQ = !q || row.dataset.name.indexOf(q) !== -1;
        var matchesVeg = !vegOnly || row.dataset.veg === '1';
        var show = matchesQ && matchesVeg;
        row.style.display = show ? '' : 'none';
        if (show) visibleCount++;
      });
      section.style.display = visibleCount > 0 ? '' : 'none';
    });
    var anyVisible = qsa('.menu-section').some(function(s){ return s.style.display !== 'none'; });
    var existingEmpty = qs('#emptyState');
    if (!anyVisible){
      if (!existingEmpty){
        var el = document.createElement('div');
        el.id = 'emptyState';
        el.className = 'empty-state';
        el.innerHTML = iconSvg('<circle cx="32" cy="32" r="22"/><path d="M22 40s4 6 10 6 10-6 10-6M24 26h.01M40 26h.01"/>') +
          '<p>No dishes match your search.</p>';
        menuContent.appendChild(el);
      }
    } else if (existingEmpty){
      existingEmpty.remove();
    }
  }
  searchInput.addEventListener('input', applyFilters);
  vegToggle.addEventListener('click', function(){
    vegOnly = !vegOnly;
    vegToggle.classList.toggle('active', vegOnly);
    applyFilters();
  });

  /* ---------- Active chip highlight ---------- */
  var chips = qsa('.chip');
  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (!entry.isIntersecting) return;
      var id = entry.target.id.replace('sec-', '');
      chips.forEach(function(c){ c.classList.toggle('active', c.dataset.target === id); });
    });
  }, { rootMargin: '-180px 0px -70% 0px', threshold: 0 });
  qsa('.menu-section').forEach(function(s){ observer.observe(s); });

  /* ---------- Call waiter ---------- */
  qs('#waiterBtn').addEventListener('click', function(){
    var number = (CFG.whatsappNumber || '').replace(/[^0-9]/g,'');
    var msg = '🔔 Assistance needed at Table ' + (currentTable || '(not set)') + ' — ' + CFG.name;
    var url = 'https://wa.me/' + number + '?text=' + encodeURIComponent(msg);
    var win = window.open(url, '_blank');
    if (!win) window.location.href = url;
  });
})();
