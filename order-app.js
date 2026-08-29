(function(){
  "use strict";

  var LANGS = ['en','te'];
  var LANG_KEY = 'navrang-lang';
  var NO_IMAGE_THUMB = 'images/menu/no-dish-image-100.jpg';
  var NO_IMAGE_FULL = 'images/menu/no-dish-image-500.jpg';

  var root = document.documentElement;
  var qs = function(sel, ctx){ return (ctx||document).querySelector(sel); };
  var qsa = function(sel, ctx){ return Array.prototype.slice.call((ctx||document).querySelectorAll(sel)); };

  /* ---------- Anonymous activity tracking (search terms + item views) ---------- */
  var TRACK_ENDPOINT = 'https://ratings-api-pink.vercel.app/api/track';
  var TRACK_SESSION_KEY = 'navrang-session-id';
  function getSessionId(){
    var id = sessionStorage.getItem(TRACK_SESSION_KEY);
    if (!id){
      id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2));
      sessionStorage.setItem(TRACK_SESSION_KEY, id);
    }
    return id;
  }
  function trackEvent(type, value){
    if (!value) return;
    var payload = JSON.stringify({ type: type, value: value, sessionId: getSessionId() });
    try {
      if (navigator.sendBeacon){
        // text/plain is CORS-safelisted, so the beacon never needs a preflight
        // (which navigator.sendBeacon can't reliably perform) - the server
        // JSON.parses the body regardless of Content-Type.
        navigator.sendBeacon(TRACK_ENDPOINT, new Blob([payload], { type: 'text/plain' }));
        return;
      }
    } catch (e) {}
    fetch(TRACK_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(function(){});
  }

  /* ---------- Language from QR code (?lang=en or ?lang=te) ---------- */
  function getUrlLang(){
    var m = /[?&]lang=([^&]+)/.exec(window.location.search);
    return m ? decodeURIComponent(m[1]).toLowerCase() : '';
  }

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
      instaTitle: 'Follow us on Instagram',
      instagramLabel: 'Instagram',
      offersLabel: 'Special Offers',
      offersTitle: 'Special Offers',
      offersSub: 'Coming Soon',
      offersMsg: "We're preparing exclusive deals and combo offers just for you. Check back soon — good things are on the way!",
      offersOk: 'Got it',
      ingredientsLabel: 'Ingredients',
      priceAny: 'Any Price',
      priceUnder100: 'Under ₹100',
      price100to200: '₹100 – ₹200',
      price200to300: '₹200 – ₹300',
      price300plus: '₹300+',
      rateCta: 'Rate Your Food',
      rateTitle: 'Rate Your Food',
      rateName: 'Your Name',
      rateDish: 'Dishes You Had',
      rateDishPlaceholder: 'Select a dish…',
      rateStars: 'Your Rating',
      rateComments: 'Comments (optional)',
      rateSubmit: 'Submit Rating',
      rateSubmitting: 'Submitting…',
      rateSuccess: 'Thank you! Your rating was submitted.',
      rateErrName: 'Please enter your name.',
      rateErrDish: 'Please add at least one dish.',
      rateErrStars: 'Please pick a star rating.',
      rateErrServer: 'Could not submit right now — please try again.'
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
      instaTitle: 'ఇన్‌స్టాగ్రామ్‌లో మమ్మల్ని ఫాలో అవ్వండి',
      instagramLabel: 'ఇన్‌స్టాగ్రామ్',
      offersLabel: 'ప్రత్యేక ఆఫర్‌లు',
      offersTitle: 'ప్రత్యేక ఆఫర్‌లు',
      offersSub: 'త్వరలో వస్తుంది',
      offersMsg: 'మీ కోసం ప్రత్యేక డీల్స్ మరియు కాంబో ఆఫర్‌లను సిద్ధం చేస్తున్నాము. త్వరలో మళ్ళీ చూడండి — మంచి విషయాలు రాబోతున్నాయి!',
      offersOk: 'సరే',
      ingredientsLabel: 'పదార్థాలు',
      priceAny: 'ఏదైనా ధర',
      priceUnder100: '₹100 లోపు',
      price100to200: '₹100 – ₹200',
      price200to300: '₹200 – ₹300',
      price300plus: '₹300+',
      rateCta: 'మీ ఆహారాన్ని రేట్ చేయండి',
      rateTitle: 'మీ ఆహారాన్ని రేట్ చేయండి',
      rateName: 'మీ పేరు',
      rateDish: 'మీరు తీసుకున్న వంటకాలు',
      rateDishPlaceholder: 'ఒక వంటకాన్ని ఎంచుకోండి…',
      rateStars: 'మీ రేటింగ్',
      rateComments: 'వ్యాఖ్యలు (ఐచ్ఛికం)',
      rateSubmit: 'రేటింగ్ సమర్పించండి',
      rateSubmitting: 'సమర్పిస్తోంది…',
      rateSuccess: 'ధన్యవాదాలు! మీ రేటింగ్ సమర్పించబడింది.',
      rateErrName: 'దయచేసి మీ పేరు నమోదు చేయండి.',
      rateErrDish: 'దయచేసి కనీసం ఒక వంటకాన్ని జోడించండి.',
      rateErrStars: 'దయచేసి స్టార్ రేటింగ్ ఎంచుకోండి.',
      rateErrServer: 'ప్రస్తుతం సమర్పించలేకపోయాము — దయచేసి మళ్లీ ప్రయత్నించండి.'
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
    var priceOpts = qs('#priceFilter').options;
    priceOpts[0].textContent = S.priceAny;
    priceOpts[1].textContent = S.priceUnder100;
    priceOpts[2].textContent = S.price100to200;
    priceOpts[3].textContent = S.price200to300;
    priceOpts[4].textContent = S.price300plus;
    qs('#footerNote').textContent = S.footerNote;
    var instaLink = qs('#instaLink');
    if (instaLink){ instaLink.title = S.instaTitle; instaLink.setAttribute('aria-label', S.instaTitle); }
    var fabOffersLabel = qs('#fabOffersLabel'); if (fabOffersLabel) fabOffersLabel.textContent = S.offersLabel;
    var fabRatingLabel = qs('#fabRatingLabel'); if (fabRatingLabel) fabRatingLabel.textContent = S.rateCta;
    var fabInstaLabel = qs('#fabInstaLabel'); if (fabInstaLabel) fabInstaLabel.textContent = S.instagramLabel;
    var offersTitleEl = qs('#offersTitle'); if (offersTitleEl) offersTitleEl.textContent = S.offersTitle;
    var offersSubEl = qs('#offersSub'); if (offersSubEl) offersSubEl.textContent = S.offersSub;
    var offersMsgEl = qs('#offersMsg'); if (offersMsgEl) offersMsgEl.textContent = S.offersMsg;
    var offersOkEl = qs('#offersOkBtn'); if (offersOkEl) offersOkEl.textContent = S.offersOk;
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

    qs('#rateCtaLabel').textContent = S.rateCta;
    qs('#rateTitle').textContent = S.rateTitle;
    qs('#rateNameLabel').textContent = S.rateName;
    qs('#rateDishLabel').textContent = S.rateDish;
    qs('#rateStarsLabel').textContent = S.rateStars;
    qs('#rateCommentsLabel').textContent = S.rateComments;
    qs('#rateSubmit').textContent = S.rateSubmit;
    if (typeof populateDishSelect === 'function') populateDishSelect();
    if (typeof renderDishChips === 'function') renderDishChips();

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
    var items = (MENU_DATA[cat.id] || []).filter(function(it){ return it.status === 'Active'; });

    var chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.dataset.target = cat.id;
    var chipIcon = cat.image ? '<img class="chip-icon" src="' + esc(cat.image) + '" alt="">' : iconSvg(cat.icon);
    chip.innerHTML = chipIcon + '<span class="chip-label" data-en="' + esc(cat.short) + '" data-te="' + esc(cat.shortTe) + '">' + esc(cat.short) + '</span>';
    chip.addEventListener('click', function(){
      qsa('.chip').forEach(function(c){ c.classList.toggle('active', c === chip); });
      suppressActiveSync();
      var section = document.getElementById('sec-' + cat.id);
      if (section) section.scrollIntoView({ behavior:'smooth', block:'start' });
      trackEvent('category_click', cat.short);
    });
    chipRow.appendChild(chip);

    var section = document.createElement('div');
    section.className = 'menu-section';
    section.id = 'sec-' + cat.id;

    var head = document.createElement('div');
    head.className = 'section-head';
    var headIcon = cat.image ? '<img src="' + esc(cat.image) + '" alt="" loading="lazy" decoding="async">' : iconSvg(cat.icon);
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
      row.dataset.price = item.price === null || item.price === undefined ? '' : item.price;

      var strikeLabel = (item.strike && item.price !== null) ? '<span class="dish-strike">' + CUR + item.strike + '</span>' : '';
      var priceLabel = item.price === null ? '<span class="no-price">Ask staff</span>' : (strikeLabel + '<span class="dish-price">' + CUR + item.price + '</span>');
      var thumbSrc = item.thumb || NO_IMAGE_THUMB;
      var topBadge = item.top ? '<span class="top-badge">' + esc(STRINGS[currentLang].topBadge) + '</span>' : '';
      var thumb = '<span class="dish-thumb-wrap"><span class="dish-thumb-clip"><img class="dish-thumb" src="' + esc(thumbSrc) + '" alt="" loading="lazy" decoding="async" width="104" height="104"></span>' + topBadge + '</span>';

      row.innerHTML =
        thumb +
        '<span class="dish-info"><span class="dish-name" data-en="' + esc(item.name) + '" data-te="' + esc(item.nameTe) + '">' + esc(item.name) + '</span></span>' +
        '<span class="dish-side">' + priceLabel + '<span class="dot ' + (item.veg ? 'veg' : 'nonveg') + '"></span></span>';

      row.addEventListener('click', function(){
        var ingredients = currentLang === 'te' ? item.ingredientsTe : item.ingredients;
        openLightbox(item.photo || item.thumb || NO_IMAGE_FULL, currentLang === 'te' ? item.nameTe : item.name, ingredients);
        trackEvent('item_view', item.name);
      });

      section.appendChild(row);
    });

    menuContent.appendChild(section);
  });

  /* ---------- Search + veg filter ---------- */
  var searchInput = qs('#searchInput');
  var vegToggle = qs('#vegToggle');
  var topToggle = qs('#topToggle');
  var priceFilter = qs('#priceFilter');
  var vegOnly = false;
  var topOnly = false;
  var priceMin = null;
  var priceMax = null;

  function applyFilters(){
    var q = searchInput.value.trim().toLowerCase();
    qsa('.menu-section').forEach(function(section){
      var visibleCount = 0;
      qsa('.dish', section).forEach(function(row){
        var matchesQ = !q || row.dataset.name.indexOf(q) !== -1;
        var matchesVeg = !vegOnly || row.dataset.veg === '1';
        var matchesTop = !topOnly || row.dataset.top === '1';
        var matchesPrice = priceMin === null ||
          (row.dataset.price !== '' && Number(row.dataset.price) >= priceMin && Number(row.dataset.price) <= priceMax);
        var show = matchesQ && matchesVeg && matchesTop && matchesPrice;
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
  var searchTrackTimer = null;
  var lastTrackedQuery = '';
  searchInput.addEventListener('input', function(){
    applyFilters();
    clearTimeout(searchTrackTimer);
    searchTrackTimer = setTimeout(function(){
      var q = searchInput.value.trim();
      if (q.length >= 2 && q.toLowerCase() !== lastTrackedQuery){
        lastTrackedQuery = q.toLowerCase();
        trackEvent('search', q);
      }
    }, 800);
  });
  vegToggle.addEventListener('click', function(){
    vegOnly = !vegOnly;
    vegToggle.classList.toggle('active', vegOnly);
    applyFilters();
    trackEvent('veg_filter', vegOnly ? 'on' : 'off');
  });
  topToggle.addEventListener('click', function(){
    topOnly = !topOnly;
    topToggle.classList.toggle('active', topOnly);
    applyFilters();
    trackEvent('top_filter', topOnly ? 'on' : 'off');
  });
  priceFilter.addEventListener('change', function(){
    var v = priceFilter.value;
    if (!v){ priceMin = null; priceMax = null; }
    else {
      var parts = v.split('-');
      priceMin = parseInt(parts[0], 10);
      priceMax = parseInt(parts[1], 10);
    }
    applyFilters();
    trackEvent('price_filter', v || 'any');
  });

  /* ---------- Active chip highlight ---------- */
  var chips = qsa('.chip');
  var observer = null;

  /* A chip click sets the active chip immediately, then scrolls; while that scroll is in
     flight the scroll-spy observer below would otherwise re-highlight whatever section
     briefly crosses its threshold mid-animation. Suppress it until scrolling settles (or a
     fallback timeout, in case the target was already in view and no scroll event fires). */
  var scrollSpySuppressed = false;
  var suppressFallbackTimer = null;
  var suppressSettleTimer = null;
  function suppressActiveSync(){
    scrollSpySuppressed = true;
    clearTimeout(suppressFallbackTimer);
    suppressFallbackTimer = setTimeout(function(){ scrollSpySuppressed = false; }, 900);
  }
  window.addEventListener('scroll', function(){
    if (!scrollSpySuppressed) return;
    clearTimeout(suppressSettleTimer);
    suppressSettleTimer = setTimeout(function(){ scrollSpySuppressed = false; }, 150);
  }, { passive: true });

  function setupObserver(headerHeight){
    if (observer) observer.disconnect();
    observer = new IntersectionObserver(function(entries){
      if (scrollSpySuppressed) return;
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
  var urlLang = getUrlLang();
  var storedLang = localStorage.getItem(LANG_KEY);
  var initialLang = LANGS.indexOf(urlLang) !== -1 ? urlLang : (LANGS.indexOf(storedLang) !== -1 ? storedLang : 'en');
  applyLanguage(initialLang);

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
  var lightboxImgWrap = qs('#lightboxImg').parentElement;
  var lightboxCaption = qs('#lightboxCaption');
  var lightboxIngredients = qs('#lightboxIngredients');
  var lightboxClose = qs('#lightboxClose');
  function openLightbox(src, caption, ingredients){
    lightboxImgWrap.classList.add('loading');
    lightboxImg.src = src;
    lightboxImg.alt = caption || '';
    lightboxCaption.textContent = caption || '';
    lightboxIngredients.textContent = (ingredients && ingredients.length)
      ? STRINGS[currentLang].ingredientsLabel + ': ' + ingredients.join(', ')
      : '';
    imageLightbox.classList.add('show');
    imageLightbox.setAttribute('aria-hidden', 'false');
  }
  lightboxImg.addEventListener('load', function(){ lightboxImgWrap.classList.remove('loading'); });
  lightboxImg.addEventListener('error', function(){ lightboxImgWrap.classList.remove('loading'); });
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

  /* ---------- Rate your food ---------- */
  var RATE_ENDPOINT = 'https://ratings-api-pink.vercel.app/api/rate';

  var rateCta = qs('#rateCta');
  var rateDialog = qs('#rateDialog');
  var rateCard = qs('#rateCard');
  var rateClose = qs('#rateClose');
  var rateName = qs('#rateName');
  var rateDishSelect = qs('#rateDishSelect');
  var rateDishChips = qs('#rateDishChips');
  var starPicker = qs('#starPicker');
  var rateComments = qs('#rateComments');
  var rateSubmit = qs('#rateSubmit');
  var rateStatus = qs('#rateStatus');

  var selectedDishes = [];
  var selectedRating = 0;

  function populateDishSelect(){
    if (!rateDishSelect) return;
    var S = STRINGS[currentLang];
    var html = '<option value="">' + esc(S.rateDishPlaceholder) + '</option>';
    CATEGORY_META.forEach(function(cat){
      var items = (MENU_DATA[cat.id] || []).filter(function(it){ return it.status === 'Active'; });
      if (!items.length) return;
      html += '<optgroup label="' + esc(currentLang === 'te' ? cat.titleTe : cat.title) + '">';
      items.forEach(function(item){
        var label = currentLang === 'te' ? item.nameTe : item.name;
        html += '<option value="' + esc(item.name) + '">' + esc(label) + '</option>';
      });
      html += '</optgroup>';
    });
    rateDishSelect.innerHTML = html;
  }

  function renderDishChips(){
    if (!rateDishChips) return;
    rateDishChips.innerHTML = selectedDishes.map(function(d){
      var label = currentLang === 'te' ? d.te : d.en;
      return '<span class="dish-chip">' + esc(label) + '<button type="button" data-en="' + esc(d.en) + '" aria-label="Remove">✕</button></span>';
    }).join('');
    qsa('button', rateDishChips).forEach(function(btn){
      btn.addEventListener('click', function(){
        selectedDishes = selectedDishes.filter(function(d){ return d.en !== btn.dataset.en; });
        renderDishChips();
      });
    });
  }

  function findMenuItemByName(nameEn){
    for (var catId in MENU_DATA){
      var found = MENU_DATA[catId].filter(function(it){ return it.name === nameEn; })[0];
      if (found) return found;
    }
    return null;
  }

  if (rateDishSelect){
    rateDishSelect.addEventListener('change', function(){
      var val = rateDishSelect.value;
      if (!val) return;
      if (selectedDishes.some(function(d){ return d.en === val; })){ rateDishSelect.value = ''; return; }
      var item = findMenuItemByName(val);
      selectedDishes.push({ en: val, te: item ? item.nameTe : val });
      rateDishSelect.value = '';
      renderDishChips();
    });
  }

  if (starPicker){
    qsa('.star-btn', starPicker).forEach(function(btn){
      btn.addEventListener('click', function(){
        selectedRating = parseInt(btn.dataset.star, 10);
        qsa('.star-btn', starPicker).forEach(function(b){
          b.classList.toggle('filled', parseInt(b.dataset.star, 10) <= selectedRating);
        });
      });
    });
  }

  function resetRateForm(){
    rateName.value = '';
    rateComments.value = '';
    selectedDishes = [];
    selectedRating = 0;
    renderDishChips();
    if (starPicker) qsa('.star-btn', starPicker).forEach(function(b){ b.classList.remove('filled'); });
    rateStatus.textContent = '';
    rateStatus.className = 'rate-status';
    rateSubmit.disabled = false;
    rateSubmit.textContent = STRINGS[currentLang].rateSubmit;
  }

  function openRateDialog(){
    populateDishSelect();
    rateDialog.classList.add('show');
    rateDialog.setAttribute('aria-hidden', 'false');
  }
  function closeRateDialog(){
    rateDialog.classList.remove('show');
    rateDialog.setAttribute('aria-hidden', 'true');
  }

  if (rateCta) rateCta.addEventListener('click', openRateDialog);
  if (rateClose) rateClose.addEventListener('click', closeRateDialog);
  if (rateDialog) rateDialog.addEventListener('click', closeRateDialog);
  if (rateCard) rateCard.addEventListener('click', function(e){ e.stopPropagation(); });

  if (rateSubmit){
    rateSubmit.addEventListener('click', function(){
      var S = STRINGS[currentLang];
      var nameVal = rateName.value.trim();
      if (!nameVal){ rateStatus.textContent = S.rateErrName; rateStatus.className = 'rate-status error'; return; }
      if (!selectedDishes.length){ rateStatus.textContent = S.rateErrDish; rateStatus.className = 'rate-status error'; return; }
      if (!selectedRating){ rateStatus.textContent = S.rateErrStars; rateStatus.className = 'rate-status error'; return; }

      rateSubmit.disabled = true;
      rateSubmit.textContent = S.rateSubmitting;
      rateStatus.textContent = '';
      rateStatus.className = 'rate-status';

      fetch(RATE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameVal,
          dishes: selectedDishes.map(function(d){ return d.en; }),
          rating: selectedRating,
          comments: rateComments.value.trim()
        })
      }).then(function(resp){
        if (!resp.ok) throw new Error('bad-status');
        rateStatus.textContent = S.rateSuccess;
        rateStatus.className = 'rate-status success';
        rateSubmit.disabled = true;
        setTimeout(function(){
          closeRateDialog();
          resetRateForm();
        }, 1600);
      }).catch(function(){
        rateStatus.textContent = S.rateErrServer;
        rateStatus.className = 'rate-status error';
        rateSubmit.disabled = false;
        rateSubmit.textContent = S.rateSubmit;
      });
    });
  }

  /* ---------- Floating quick-links stack + Special Offers dialog ---------- */
  var fabStack = qs('#fabStack');
  var fabMainBtn = qs('#fabMainBtn');
  var offersDialog = qs('#offersDialog');
  var offersCard = qs('#offersCard');

  function closeFab(){
    fabStack.classList.remove('open');
    fabMainBtn.setAttribute('aria-expanded', 'false');
  }
  if (fabMainBtn){
    fabMainBtn.addEventListener('click', function(){
      var isOpen = fabStack.classList.toggle('open');
      fabMainBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    document.addEventListener('click', function(e){
      if (fabStack.classList.contains('open') && !fabStack.contains(e.target)) closeFab();
    });
  }
  qsa('.fab-item').forEach(function(item){
    var label = item.querySelector('.fab-item-label');
    var btn = item.querySelector('.fab-item-btn');
    if (label && btn) label.addEventListener('click', function(){ btn.click(); });
  });

  function openOffersDialog(){
    offersDialog.classList.add('show');
    offersDialog.setAttribute('aria-hidden', 'false');
  }
  function closeOffersDialog(){
    offersDialog.classList.remove('show');
    offersDialog.setAttribute('aria-hidden', 'true');
  }
  if (offersDialog){
    offersDialog.addEventListener('click', closeOffersDialog);
    offersCard.addEventListener('click', function(e){ e.stopPropagation(); });
    qs('#offersOkBtn').addEventListener('click', closeOffersDialog);
    qs('#fabOffersBtn').addEventListener('click', function(){ closeFab(); openOffersDialog(); trackEvent('item_view', 'Special Offers (coming soon)'); });
  }
  var fabRatingBtn = qs('#fabRatingBtn');
  if (fabRatingBtn) fabRatingBtn.addEventListener('click', function(){ closeFab(); openRateDialog(); });
  var fabInstaBtn = qs('#fabInstaBtn');
  if (fabInstaBtn) fabInstaBtn.addEventListener('click', closeFab);
})();
