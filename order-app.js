(function(){
  "use strict";

  var LANGS = ['en','te'];
  var LANG_KEY = 'navrang-lang';
  var NO_IMAGE_THUMB = 'images/menu/no-dish-image-100.jpg';
  var NO_IMAGE_FULL = 'images/menu/no-dish-image-500.jpg';

  var root = document.documentElement;
  var qs = function(sel, ctx){ return (ctx||document).querySelector(sel); };
  var qsa = function(sel, ctx){ return Array.prototype.slice.call((ctx||document).querySelectorAll(sel)); };

  /* ---------- Language ---------- */
  var STRINGS = {
    en: {
      tag: 'Scan · Browse · Order',
      searchPlaceholder: 'Search dishes…',
      veg: 'Veg',
      topPicks: 'Top Picks',
      topBadge: 'Top',
      askStaff: 'Ask staff',
      itemsSuffix: function(n){ return n === 1 ? ' item' : ' items'; },
      emptyState: 'No dishes match your search.',
      footerNote: 'Ready to order? Just let your waiter know. All prices are inclusive of applicable taxes — please inform your server of any food allergies.',
      instaTitle: 'Follow us on Instagram'
    },
    te: {
      tag: 'స్కాన్ చేయండి · చూడండి · ఆర్డర్ చేయండి',
      searchPlaceholder: 'వంటకాలు వెతకండి…',
      veg: 'వెజ్',
      topPicks: 'టాప్ పిక్స్',
      topBadge: 'టాప్',
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
    qs('#topToggleLabel').textContent = S.topPicks;
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
    qsa('.top-badge').forEach(function(el){
      el.textContent = S.topBadge;
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
    var chipIcon = cat.image ? '<img class="chip-icon" src="' + esc(cat.image) + '" alt="">' : iconSvg(cat.icon);
    chip.innerHTML = chipIcon + '<span class="chip-label" data-en="' + esc(cat.short) + '" data-te="' + esc(cat.shortTe) + '">' + esc(cat.short) + '</span>';
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
    var headIcon = cat.image ? '<img src="' + esc(cat.image) + '" alt="">' : iconSvg(cat.icon);
    head.innerHTML = '<span class="cat-icon' + (cat.image ? ' cat-icon-img' : '') + '">' + headIcon + '</span>' +
      '<span class="section-title" data-en="' + esc(cat.title) + '" data-te="' + esc(cat.titleTe) + '">' + esc(cat.title) + '</span>' +
      '<span class="n section-count" data-count="' + items.length + '">' + items.length + ' items</span>';
    section.appendChild(head);

    items.forEach(function(item){
      var row = document.createElement('div');
      row.className = 'dish';
      row.dataset.name = item.name.toLowerCase();
      row.dataset.veg = item.veg ? '1' : '0';
      row.dataset.top = item.top ? '1' : '0';

      var priceLabel = item.price === null ? '<span class="no-price">Ask staff</span>' : ('<span class="dish-price">' + CUR + item.price + '</span>');
      var thumbSrc = item.thumb || NO_IMAGE_THUMB;
      var topBadge = item.top ? '<span class="top-badge">' + esc(STRINGS[currentLang].topBadge) + '</span>' : '';
      var thumb = '<span class="dish-thumb-wrap"><span class="dish-thumb-clip"><img class="dish-thumb" src="' + esc(thumbSrc) + '" alt=""></span>' + topBadge + '</span>';

      row.innerHTML =
        thumb +
        '<span class="dish-info"><span class="dish-name" data-en="' + esc(item.name) + '" data-te="' + esc(item.nameTe) + '">' + esc(item.name) + '</span></span>' +
        '<span class="dish-side">' + priceLabel + '<span class="dot ' + (item.veg ? 'veg' : 'nonveg') + '"></span></span>';

      row.querySelector('.dish-thumb-wrap').addEventListener('click', function(){
        openLightbox(item.photo || item.thumb || NO_IMAGE_FULL, currentLang === 'te' ? item.nameTe : item.name);
      });

      section.appendChild(row);
    });

    menuContent.appendChild(section);
  });

  /* ---------- Search + veg filter ---------- */
  var searchInput = qs('#searchInput');
  var vegToggle = qs('#vegToggle');
  var topToggle = qs('#topToggle');
  var vegOnly = false;
  var topOnly = false;

  function applyFilters(){
    var q = searchInput.value.trim().toLowerCase();
    qsa('.menu-section').forEach(function(section){
      var visibleCount = 0;
      qsa('.dish', section).forEach(function(row){
        var matchesQ = !q || row.dataset.name.indexOf(q) !== -1;
        var matchesVeg = !vegOnly || row.dataset.veg === '1';
        var matchesTop = !topOnly || row.dataset.top === '1';
        var show = matchesQ && matchesVeg && matchesTop;
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
  topToggle.addEventListener('click', function(){
    topOnly = !topOnly;
    topToggle.classList.toggle('active', topOnly);
    applyFilters();
  });

  /* ---------- Active chip highlight ---------- */
  var chips = qsa('.chip');
  var observer = null;
  function setupObserver(headerHeight){
    if (observer) observer.disconnect();
    observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (!entry.isIntersecting) return;
        var id = entry.target.id.replace('sec-', '');
        chips.forEach(function(c){ c.classList.toggle('active', c.dataset.target === id); });
      });
    }, { rootMargin: '-' + (headerHeight + 8) + 'px 0px -70% 0px', threshold: 0 });
    qsa('.menu-section').forEach(function(s){ observer.observe(s); });
  }

  /* ---------- Keep the sticky header stack (topbar + search/chips) from overlapping,
     regardless of font size, wrapping, or device width ---------- */
  var topbarEl = qs('.topbar');
  var stickySubheader = qs('#stickySubheader');
  function updateStickyLayout(){
    var topbarH = topbarEl.getBoundingClientRect().height;
    stickySubheader.style.top = topbarH + 'px';
    var totalH = topbarH + stickySubheader.getBoundingClientRect().height;
    qsa('.menu-section').forEach(function(s){ s.style.scrollMarginTop = (totalH + 10) + 'px'; });
    setupObserver(totalH);
  }
  updateStickyLayout();
  window.addEventListener('resize', updateStickyLayout);
  if (document.fonts && document.fonts.ready){
    document.fonts.ready.then(updateStickyLayout);
  }

  /* ---------- Init language (after DOM built so all nodes exist) ---------- */
  var storedLang = localStorage.getItem(LANG_KEY);
  applyLanguage(LANGS.indexOf(storedLang) !== -1 ? storedLang : 'en');

  /* ---------- Deep-link to a section via #hash (menu is built after page load) ---------- */
  if (window.location.hash){
    var target = qs(window.location.hash);
    if (target) target.scrollIntoView({ block: 'start' });
  }

  /* ---------- Image lightbox (logo + dish photos) ---------- */
  var heroLogo = qs('#heroLogo');
  var imageLightbox = qs('#imageLightbox');
  var lightboxCard = qs('#lightboxCard');
  var lightboxImg = qs('#lightboxImg');
  var lightboxCaption = qs('#lightboxCaption');
  var lightboxClose = qs('#lightboxClose');
  function openLightbox(src, caption){
    lightboxImg.src = src;
    lightboxImg.alt = caption || '';
    lightboxCaption.textContent = caption || '';
    imageLightbox.classList.add('show');
    imageLightbox.setAttribute('aria-hidden', 'false');
  }
  function closeLightbox(){
    imageLightbox.classList.remove('show');
    imageLightbox.setAttribute('aria-hidden', 'true');
  }
  heroLogo.addEventListener('click', function(){ openLightbox('navrang_logo.png', 'Navrang Family Restaurant'); });
  heroLogo.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openLightbox('navrang_logo.png', 'Navrang Family Restaurant'); }
  });
  imageLightbox.addEventListener('click', closeLightbox);
  lightboxCard.addEventListener('click', function(e){ e.stopPropagation(); });
  lightboxClose.addEventListener('click', closeLightbox);
})();
