(function(){
  "use strict";

  var LANGS = ['en','te'];
  var LANG_KEY = 'navarang-lang';

  var root = document.documentElement;
  var qs = function(sel, ctx){ return (ctx||document).querySelector(sel); };
  var qsa = function(sel, ctx){ return Array.prototype.slice.call((ctx||document).querySelectorAll(sel)); };

  /* ---------- Language ---------- */
  var STRINGS = {
    en: {
      tag: 'Scan · Browse · Order With Your Waiter',
      searchPlaceholder: 'Search dishes…',
      veg: 'Veg',
      askStaff: 'Ask staff',
      itemsSuffix: function(n){ return n === 1 ? ' item' : ' items'; },
      emptyState: 'No dishes match your search.',
      footerNote: 'Ready to order? Just let your waiter know. All prices are inclusive of applicable taxes — please inform your server of any food allergies.',
      instaTitle: 'Follow us on Instagram'
    },
    te: {
      tag: 'స్కాన్ చేయండి · చూడండి · మీ వెయిటర్‌తో ఆర్డర్ చేయండి',
      searchPlaceholder: 'వంటకాలు వెతకండి…',
      veg: 'వెజ్',
      askStaff: 'సిబ్బందిని అడగండి',
      itemsSuffix: function(){ return ' వస్తువులు'; },
      emptyState: 'మీ శోధనకు సరిపోలే వంటకాలు లేవు.',
      footerNote: 'ఆర్డర్ చేయడానికి సిద్ధంగా ఉన్నారా? మీ వెయిటర్‌కు తెలియజేయండి. అన్ని ధరలలో వర్తించే పన్నులు కలిపి ఉన్నాయి — ఏవైనా ఆహార అలర్జీల గురించి మీ సర్వర్‌కు తెలియజేయండి.',
      instaTitle: 'ఇన్‌స్టాగ్రామ్‌లో మమ్మల్ని ఫాలో అవ్వండి'
    }
  };

  var langOpts = qsa('.lang-opt');
  var currentLang = 'en';

  function applyLanguage(lang){
    currentLang = LANGS.indexOf(lang) !== -1 ? lang : 'en';
    localStorage.setItem(LANG_KEY, currentLang);
    root.setAttribute('lang', currentLang === 'te' ? 'te' : 'en');
    var S = STRINGS[currentLang];

    qs('#heroTag').textContent = S.tag;
    searchInput.placeholder = S.searchPlaceholder;
    qs('#vegLabel').textContent = S.veg;
    qs('#footerNote').textContent = S.footerNote;
    var instaLink = qs('#instaLink');
    if (instaLink){ instaLink.title = S.instaTitle; instaLink.setAttribute('aria-label', S.instaTitle); }
    langOpts.forEach(function(btn){
      btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });

    qsa('.chip .chip-label').forEach(function(el){
      el.textContent = currentLang === 'te' ? el.dataset.te : el.dataset.en;
    });
    qsa('.section-title').forEach(function(el){
      el.textContent = currentLang === 'te' ? el.dataset.te : el.dataset.en;
    });
    qsa('.section-count').forEach(function(el){
      var n = parseInt(el.dataset.count, 10);
      el.textContent = n + S.itemsSuffix(n);
    });
    qsa('.dish-name').forEach(function(el){
      el.textContent = currentLang === 'te' ? el.dataset.te : el.dataset.en;
    });
    qsa('.no-price').forEach(function(el){
      el.textContent = S.askStaff;
    });

    var emptyP = qs('#emptyState p');
    if (emptyP) emptyP.textContent = S.emptyState;
  }

  langOpts.forEach(function(btn){
    btn.addEventListener('click', function(){ applyLanguage(btn.dataset.lang); });
  });

  /* ---------- Config ---------- */
  var CFG = window.RESTAURANT_CONFIG || { name:'Restaurant', currency:'₹' };
  var CUR = CFG.currency || '₹';

  /* ---------- Build menu DOM ---------- */
  var chipRow = qs('#chipRow');
  var menuContent = qs('#menuContent');

  function iconSvg(paths, extraAttrs){
    return '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"' + (extraAttrs||'') + '>' + paths + '</svg>';
  }
  function esc(s){
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  CATEGORY_META.forEach(function(cat){
    var items = MENU_DATA[cat.id] || [];

    var chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.dataset.target = cat.id;
    chip.innerHTML = iconSvg(cat.icon) + '<span class="chip-label" data-en="' + esc(cat.short) + '" data-te="' + esc(cat.shortTe) + '">' + esc(cat.short) + '</span>';
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
    head.innerHTML = '<span class="cat-icon">' + iconSvg(cat.icon) + '</span>' +
      '<span class="section-title" data-en="' + esc(cat.title) + '" data-te="' + esc(cat.titleTe) + '">' + esc(cat.title) + '</span>' +
      '<span class="n section-count" data-count="' + items.length + '">' + items.length + ' items</span>';
    section.appendChild(head);

    items.forEach(function(item){
      var row = document.createElement('div');
      row.className = 'dish';
      row.dataset.name = item.name.toLowerCase();
      row.dataset.veg = item.veg ? '1' : '0';

      var priceLabel = item.price === null ? '<span class="no-price">Ask staff</span>' : ('<span class="dish-price">' + CUR + item.price + '</span>');

      row.innerHTML =
        '<span class="dot ' + (item.veg ? 'veg' : 'nonveg') + '"></span>' +
        '<span class="dish-info"><span class="dish-name" data-en="' + esc(item.name) + '" data-te="' + esc(item.nameTe) + '">' + esc(item.name) + '</span></span>' +
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
          '<p>' + esc(STRINGS[currentLang].emptyState) + '</p>';
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

  /* ---------- Init language (after DOM built so all nodes exist) ---------- */
  var storedLang = localStorage.getItem(LANG_KEY);
  applyLanguage(LANGS.indexOf(storedLang) !== -1 ? storedLang : 'en');

  /* ---------- Logo lightbox ---------- */
  var heroLogo = qs('#heroLogo');
  var logoLightbox = qs('#logoLightbox');
  function openLogoLightbox(){
    logoLightbox.classList.add('show');
    logoLightbox.setAttribute('aria-hidden', 'false');
  }
  function closeLogoLightbox(){
    logoLightbox.classList.remove('show');
    logoLightbox.setAttribute('aria-hidden', 'true');
  }
  heroLogo.addEventListener('click', openLogoLightbox);
  heroLogo.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openLogoLightbox(); }
  });
  logoLightbox.addEventListener('click', closeLogoLightbox);
})();
