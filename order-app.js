(function(){
  "use strict";

  var LANGS = ['en','te'];
  var LANG_KEY = 'navrang-lang';
  var NO_IMAGE_THUMB = 'images/menu/no-dish-image-100.jpg';
  var NO_IMAGE_FULL = 'images/menu/no-dish-image-500.jpg';

  var root = document.documentElement;
  var qs = function(sel, ctx){ return (ctx||document).querySelector(sel); };
  var qsa = function(sel, ctx){ return Array.prototype.slice.call((ctx||document).querySelectorAll(sel)); };
  var calculateSplitBill;

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

  /* ---------- Count each page load as a scan, tagged by which QR code (en/te) was used ---------- */
  trackEvent('page_view', getUrlLang() === 'te' ? 'te' : (getUrlLang() === 'en' ? 'en' : 'direct'));

  /* ---------- Language ---------- */
  var STRINGS = {
    en: {
      tag: 'Scan · Browse · Order',
      searchPlaceholder: 'Search dishes…',
      veg: 'Veg',
      nonveg: 'Non-Veg',
      topPicks: 'Best Sellers',
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
      surpriseBtnLabel: 'Surprise Me',
      surpriseTitle: "Can't Decide? Surprise Me!",
      surpriseSub: 'Spin the wheel to discover your next delicious craving',
      surpriseSpin: 'Spin Again',
      surpriseView: 'View on Menu',
      surpriseTabAll: 'All',
      surpriseTabNonveg: 'Non-Veg',
      surpriseTabVeg: 'Veg',
      greetings: {
        morning: 'Good morning! Steaming breakfast & chai await you.',
        afternoon: 'Good afternoon! Savor hearty Andhra biryanis & meals.',
        evening: 'Good evening! Perfect time for tea & sizzling hot starters.',
        dinner: 'Dinner time! Fragrant biryanis, gravies & curries ready.'
      },
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
      rateErrServer: 'Could not submit right now — please try again.',
      splitCta: 'Split Bill',
      splitTitle: 'Group Split Bill',
      splitSub: 'Split the total bill with friends & family easily',
      splitAmountLabel: 'Total Bill (₹)',
      splitPeopleLabel: 'Number of People',
      splitPeopleUnit: 'people',
      splitResultEachLabel: 'Each Person Pays',
      splitResultFairTag: 'Fair Split',
      splitResultSubZero: 'Enter bill amount above',
      splitResultSubExact: function(total, people, each){ return '₹' + total + ' split equally between ' + people + ' people'; },
      splitDownload: 'Save Bill Screenshot',
      splitGenerating: 'Generating Screenshot…',
      splitSavedToast: 'Bill screenshot saved!',
      splitGenerateError: 'Could not generate image. Please try copying details.',
      splitCopy: 'Copy Breakdown',
      splitCopiedToast: 'Breakdown copied to clipboard!',
      splitQrBadge: 'English Menu QR',
      splitQrText: 'Scan with phone camera to view live menu & order',
      splitQrSub: 'Point camera at the QR code above',
      splitShareMessage: function(total, people, each){
        return '🍽️ *Navrang Restaurant Bill Split*\n' +
               '• Total Bill: ₹' + total + '\n' +
               '• Total People: ' + people + '\n' +
               '• *Each Person Pays: ₹' + each + '*\n\n' +
               'Order & browse menu: ' + window.location.href;
      }
    },
    te: {
      tag: 'స్కాన్ చేయండి · చూడండి · ఆర్డర్ చేయండి',
      searchPlaceholder: 'వంటకాలు వెతకండి…',
      veg: 'వెజ్',
      nonveg: 'నాన్-వెజ్',
      topPicks: 'బెస్ట్ సెల్లర్స్',
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
      surpriseBtnLabel: 'సర్ప్రైజ్ మీ',
      surpriseTitle: 'నిర్ణయించుకోలేకపోతున్నారా? సర్ప్రైజ్ మీ!',
      surpriseSub: 'మా ఫుడ్ రౌలెట్ మీ కోసం ఒక వంటకాన్ని ఎంచుకోనివ్వండి',
      surpriseSpin: 'మళ్ళీ తిప్పండి',
      surpriseView: 'మెనూలో చూడండి',
      surpriseTabAll: 'అన్నీ',
      surpriseTabNonveg: 'నాన్-వెజ్',
      surpriseTabVeg: 'వెజ్',
      greetings: {
        morning: 'శుభోదయం! వేడి వేడి అల్పాహారం & టీ తో ప్రారంభించండి.',
        afternoon: 'శుభ మధ్యాహ్నం! ఘుమఘుమలాడే ఆంధ్రా బిర్యానీలు & భోజనం.',
        evening: 'శుభ సాయంత్రం! టీ & రుచికరమైన వేడి స్నాక్స్ సమయం.',
        dinner: 'రాత్రి భోజన సమయం! ఘుమఘుమలాడే బిర్యానీలు & మసాలా కూరలు.'
      },
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
      rateErrServer: 'ప్రస్తుతం సమర్పించలేకపోయాము — దయచేసి మళ్లీ ప్రయత్నించండి.',
      splitCta: 'బిల్ స్ప్లిట్ చేయండి',
      splitTitle: 'గ్రూప్ బిల్ స్ప్లిట్ కాలిక్యులేటర్',
      splitSub: 'స్నేహితులు & కుటుంబంతో బిల్లును సులభంగా పంచుకోండి',
      splitAmountLabel: 'మొత్తం బిల్లు (₹)',
      splitPeopleLabel: 'వ్యక్తుల సంఖ్య',
      splitPeopleUnit: 'వ్యక్తులు',
      splitResultEachLabel: 'ఒక్కొక్కరికి అయ్యే ఖర్చు',
      splitResultFairTag: 'సమాన విభజన',
      splitResultSubZero: 'పైన బిల్లు మొత్తాన్ని నమోదు చేయండి',
      splitResultSubExact: function(total, people, each){ return '₹' + total + ' మొత్తం ' + people + ' వ్యక్తుల మధ్య సమానంగా విభజించబడింది'; },
      splitDownload: 'బిల్ చిత్రం సేవ్ చేయండి',
      splitGenerating: 'చిత్రం సిద్ధమవుతోంది…',
      splitSavedToast: 'బిల్ చిత్రం సేవ్ చేయబడింది!',
      splitGenerateError: 'చిత్రం సిద్ధం కాలేదు. దయచేసి వివరాలను కాపీ చేయండి.',
      splitCopy: 'కాపీ చేయండి',
      splitCopiedToast: 'వివరాలు కాపీ చేయబడ్డాయి!',
      splitQrBadge: 'ఇంగ్లీష్ మెనూ QR',
      splitQrText: 'లైవ్ మెనూ చూడటానికి ఫోన్ కెమెరాతో స్కాన్ చేయండి',
      splitQrSub: 'పైనున్న QR కోడ్‌ను మీ కెమెరాతో స్కాన్ చేయండి',
      splitShareMessage: function(total, people, each){
        return '🍽️ *నవరంగ్ రెస్టారెంట్ బిల్ విభజన*\n' +
               '• మొత్తం బిల్లు: ₹' + total + '\n' +
               '• వ్యక్తుల సంఖ్య: ' + people + '\n' +
               '• *ఒక్కొక్కరు చెల్లించాల్సింది: ₹' + each + '*\n\n' +
               'మెనూ చూడండి: ' + window.location.href;
      }
    }
  };

  var langOpts = qsa('.lang-opt');
  var currentLang = 'en';

  function updateTimeGreeting(){
    var h = new Date().getHours();
    var period = 'dinner';
    var icon = '🌙';
    if (h >= 5 && h < 11){
      period = 'morning';
      icon = '🌅';
    } else if (h >= 11 && h < 16){
      period = 'afternoon';
      icon = '☀️';
    } else if (h >= 16 && h < 19){
      period = 'evening';
      icon = '🌇';
    } else {
      period = 'dinner';
      icon = '🌙';
    }
    var S = STRINGS[currentLang] || STRINGS.en;
    var iconEl = qs('#greetingIcon');
    var textEl = qs('#greetingText');
    if (iconEl) iconEl.textContent = icon;
    if (textEl && S.greetings && S.greetings[period]) textEl.textContent = S.greetings[period];
  }

  function getFlavorProfile(item, lang){
    if (!item) return [];
    var name = (item.name || '').toLowerCase();
    var cat = (item.cat || item.category || '').toLowerCase();
    var isTe = lang === 'te';
    var chips = [];

    if (cat.indexOf('biryani') !== -1 || name.indexOf('biryani') !== -1){
      chips.push(isTe ? '🌾 బాస్మతి సువాసన' : '🌾 Aromatic Basmati');
      chips.push(item.veg ? (isTe ? '🌿 స్వచ్ఛమైన వెజ్' : '🌿 Pure Veg') : (isTe ? '🔥 దమ్ రోస్ట్' : '🔥 Slow Dum Cooked'));
      chips.push(isTe ? '✨ ఆంధ్రా మసాలా' : '✨ Andhra Spices');
    } else if (cat.indexOf('starter') !== -1 || cat.indexOf('appetizer') !== -1){
      chips.push(isTe ? '⚡ కరకరలాడే రుచి' : '⚡ Crisp & Sizzling');
      chips.push(item.veg ? (isTe ? '🌿 తాజా వెజ్' : '🌿 Crisp Vegetables') : (isTe ? '🍗 జుసీ & స్పైసీ' : '🍗 Juicy & Tender'));
      chips.push(isTe ? '🌶️ ఘాటైన మసాలా' : '🌶️ Fiery Marinade');
    } else if (cat.indexOf('curr') !== -1 || cat.indexOf('grav') !== -1){
      if (name.indexOf('butter') !== -1 || name.indexOf('paneer') !== -1 || name.indexOf('kaju') !== -1){
        chips.push(isTe ? '🧈 వెన్న & క్రీమ్' : '🧈 Rich & Buttery');
      } else {
        chips.push(isTe ? '🌶️ ఘాటైన గ్రేవీ' : '🌶️ Spicy Masala Gravy');
      }
      chips.push(isTe ? '🍲 నిదానంగా వండినది' : '🍲 Slow Simmered');
      chips.push(isTe ? '✨ సంప్రదాయ రుచి' : '✨ Authentic Recipe');
    } else if (cat.indexOf('roti') !== -1 || cat.indexOf('bread') !== -1 || cat.indexOf('tandoor') !== -1){
      chips.push(isTe ? '🔥 తందూరీ కాల్చినది' : '🔥 Clay Oven Baked');
      chips.push(isTe ? '🥖 మృదువైనది' : '🥖 Warm & Soft');
    } else if (cat.indexOf('rice') !== -1 || cat.indexOf('nood') !== -1){
      chips.push(isTe ? '🥢 హై ఫ్లేమ్ టాస్' : '🥢 Wok Tossed');
      chips.push(isTe ? '✨ సుగంధభరితం' : '✨ Aromatic Herbs');
    } else if (cat.indexOf('dessert') !== -1 || cat.indexOf('sweet') !== -1){
      chips.push(isTe ? '🍯 తియ్యని మాధుర్యం' : '🍯 Sweet & Luscious');
      chips.push(isTe ? '✨ నోట్లో కరిగిపోయేది' : '✨ Melt-in-Mouth');
    } else if (cat.indexOf('drink') !== -1 || cat.indexOf('bev') !== -1){
      chips.push(isTe ? '🧊 చల్లని రిఫ్రెష్' : '🧊 Chilled & Refreshing');
      chips.push(isTe ? '✨ దాహం తీర్చేది' : '✨ Thirst Quencher');
    } else {
      chips.push(item.veg ? (isTe ? '🌿 వెజ్ స్పెషల్' : '🌿 Veg Specialty') : (isTe ? '🍗 నాన్-వెజ్ స్పెషల్' : '🍗 Non-Veg Specialty'));
      chips.push(isTe ? '✨ హోమ్ రెసిపీ' : '✨ House Signature');
    }
    return chips;
  }

  function applyLanguage(lang){
    currentLang = LANGS.indexOf(lang) !== -1 ? lang : 'en';
    localStorage.setItem(LANG_KEY, currentLang);
    root.setAttribute('lang', currentLang === 'te' ? 'te' : 'en');
    var S = STRINGS[currentLang];

    qs('#heroTag').textContent = S.tag;
    searchInput.placeholder = S.searchPlaceholder;
    qs('#vegLabel').textContent = S.veg;
    var nonvegLabel = qs('#nonvegLabel'); if (nonvegLabel) nonvegLabel.textContent = S.nonveg;
    qs('#topToggleLabel').textContent = S.topPicks;
    var surpriseBtnLabel = qs('#surpriseBtnLabel'); if (surpriseBtnLabel) surpriseBtnLabel.textContent = S.surpriseBtnLabel;
    var fabSurpriseLabel = qs('#fabSurpriseLabel'); if (fabSurpriseLabel) fabSurpriseLabel.textContent = S.surpriseBtnLabel;
    var surpriseTitle = qs('#surpriseTitle'); if (surpriseTitle) surpriseTitle.textContent = S.surpriseTitle;
    var surpriseSub = qs('#surpriseSub'); if (surpriseSub) surpriseSub.textContent = S.surpriseSub;
    var surpriseSpinLabel = qs('#surpriseSpinLabel'); if (surpriseSpinLabel) surpriseSpinLabel.textContent = S.surpriseSpin;
    var surpriseViewLabel = qs('#surpriseViewLabel'); if (surpriseViewLabel) surpriseViewLabel.textContent = S.surpriseView;
    var surpriseTabAll = qs('#surpriseTabAll'); if (surpriseTabAll) surpriseTabAll.textContent = S.surpriseTabAll;
    var surpriseTabNonveg = qs('#surpriseTabNonveg'); if (surpriseTabNonveg) surpriseTabNonveg.textContent = S.surpriseTabNonveg;
    var surpriseTabVeg = qs('#surpriseTabVeg'); if (surpriseTabVeg) surpriseTabVeg.textContent = S.surpriseTabVeg;
    updateTimeGreeting();

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
    qsa('.bestseller-tag span').forEach(function(el){
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

    var splitCtaLabel = qs('#splitCtaLabel'); if (splitCtaLabel) splitCtaLabel.textContent = S.splitCta;
    var fabSplitLabel = qs('#fabSplitLabel'); if (fabSplitLabel) fabSplitLabel.textContent = S.splitCta;
    var splitTitle = qs('#splitTitle'); if (splitTitle) splitTitle.textContent = S.splitTitle;
    var splitSub = qs('#splitSub'); if (splitSub) splitSub.textContent = S.splitSub;
    var splitAmountLabel = qs('#splitAmountLabel'); if (splitAmountLabel) splitAmountLabel.textContent = S.splitAmountLabel;
    var splitPeopleLabel = qs('#splitPeopleLabel'); if (splitPeopleLabel) splitPeopleLabel.textContent = S.splitPeopleLabel;
    var splitPeopleUnit = qs('#splitPeopleUnit'); if (splitPeopleUnit) splitPeopleUnit.textContent = S.splitPeopleUnit;
    var splitResultEachLabel = qs('#splitResultEachLabel'); if (splitResultEachLabel) splitResultEachLabel.textContent = S.splitResultEachLabel;
    var splitResultTag = qs('#splitResultTag'); if (splitResultTag) splitResultTag.textContent = S.splitResultFairTag;
    var splitDownloadLabel = qs('#splitDownloadLabel'); if (splitDownloadLabel) splitDownloadLabel.textContent = S.splitDownload;
    var splitCopyLabel = qs('#splitCopyLabel'); if (splitCopyLabel) splitCopyLabel.textContent = S.splitCopy;
    var splitQrBadge = qs('#splitQrBadge'); if (splitQrBadge) splitQrBadge.textContent = S.splitQrBadge;
    var splitQrText = qs('#splitQrText'); if (splitQrText) splitQrText.textContent = S.splitQrText;
    var splitQrSub = qs('#splitQrSub'); if (splitQrSub) splitQrSub.textContent = S.splitQrSub;
    if (typeof calculateSplitBill === 'function') calculateSplitBill();

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

  function scrollChipToCenter(chip){
    if (!chipRow || !chip) return;
    var targetLeft = chip.offsetLeft - (chipRow.clientWidth / 2) + (chip.clientWidth / 2);
    chipRow.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
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
      scrollChipToCenter(chip);
      suppressActiveSync();
      var section = document.getElementById('sec-' + cat.id);
      if (section){
        var topbarH = topbarEl ? topbarEl.getBoundingClientRect().height : 56;
        var subH = stickySubheader ? stickySubheader.getBoundingClientRect().height : 100;
        var headerOffset = topbarH + subH + 8;
        var targetY = section.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
      }
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
      row.dataset.name = (item.name + ' ' + (item.nameTe || '')).toLowerCase();
      row.dataset.veg = item.veg ? '1' : '0';
      row.dataset.top = item.top ? '1' : '0';
      row.dataset.price = item.price === null || item.price === undefined ? '' : item.price;

      var strikeLabel = (item.strike && item.price !== null) ? '<span class="dish-strike">' + CUR + item.strike + '</span>' : '';
      var priceLabel = item.price === null ? '<span class="no-price">Ask staff</span>' : (strikeLabel + '<span class="dish-price">' + CUR + item.price + '</span>');
      var thumbSrc = item.thumb || NO_IMAGE_THUMB;
      var topBadge = item.top ? '<span class="top-badge">' + esc(STRINGS[currentLang].topBadge) + '</span>' : '';
      var thumb = '<span class="dish-thumb-wrap"><span class="dish-thumb-clip"><img class="dish-thumb" src="' + esc(thumbSrc) + '" alt="" loading="lazy" decoding="async" width="104" height="104"></span>' + topBadge + '<span class="thumb-zoom-hint" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg></span></span>';

      var vegClass = item.veg ? 'veg' : 'nonveg';
      var bestsellerTag = item.top ? '<span class="bestseller-tag"><svg viewBox="0 0 24 24"><path d="M12 2l2.4 7.4H22l-6 4.4 2.3 7.2L12 16.6l-6.3 4.4L8 13.8 2 9.4h7.6z"/></svg><span>' + esc(STRINGS[currentLang].topBadge) + '</span></span>' : '';

      row.innerHTML =
        '<div class="dish-main">' +
          '<div class="dish-meta">' +
            '<span class="diet-badge ' + vegClass + '" title="' + (item.veg ? 'Veg' : 'Non-Veg') + '"></span>' +
            bestsellerTag +
          '</div>' +
          '<div class="dish-info"><span class="dish-name" data-en="' + esc(item.name) + '" data-te="' + esc(item.nameTe) + '">' + esc(currentLang === 'te' ? item.nameTe : item.name) + '</span></div>' +
          '<div class="dish-pricing">' + priceLabel + '</div>' +
        '</div>' +
        thumb;

      row.addEventListener('click', function(){
        var ingredients = currentLang === 'te' ? item.ingredientsTe : item.ingredients;
        openLightbox(item.photo || item.thumb || NO_IMAGE_FULL, currentLang === 'te' ? item.nameTe : item.name, ingredients, item);
        trackEvent('item_view', item.name);
      });

      section.appendChild(row);
    });

    menuContent.appendChild(section);
  });

  /* ---------- Search + veg + nonveg filters ---------- */
  var searchInput = qs('#searchInput');
  var vegToggle = qs('#vegToggle');
  var nonvegToggle = qs('#nonvegToggle');
  var topToggle = qs('#topToggle');
  var priceFilter = qs('#priceFilter');
  var vegOnly = false;
  var nonvegOnly = false;
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
        var matchesNonVeg = !nonvegOnly || row.dataset.veg === '0';
        var matchesTop = !topOnly || row.dataset.top === '1';
        var matchesPrice = priceMin === null ||
          (row.dataset.price !== '' && Number(row.dataset.price) >= priceMin && Number(row.dataset.price) <= priceMax);
        var show = matchesQ && matchesVeg && matchesNonVeg && matchesTop && matchesPrice;
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
  var searchClear = qs('#searchClear');
  if (searchClear){
    searchClear.addEventListener('click', function(){
      searchInput.value = '';
      searchClear.classList.remove('visible');
      searchInput.focus();
      applyFilters();
    });
  }
  searchInput.addEventListener('input', function(){
    if (searchClear) searchClear.classList.toggle('visible', searchInput.value.length > 0);
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
  if (nonvegToggle){
    nonvegToggle.addEventListener('click', function(){
      nonvegOnly = !nonvegOnly;
      if (nonvegOnly && vegOnly){
        vegOnly = false;
        if (vegToggle) vegToggle.classList.remove('active');
      }
      nonvegToggle.classList.toggle('active', nonvegOnly);
      applyFilters();
      trackEvent('nonveg_filter', nonvegOnly ? 'on' : 'off');
    });
  }
  if (vegToggle){
    vegToggle.addEventListener('click', function(){
      vegOnly = !vegOnly;
      if (vegOnly && nonvegOnly){
        nonvegOnly = false;
        if (nonvegToggle) nonvegToggle.classList.remove('active');
      }
      vegToggle.classList.toggle('active', vegOnly);
      applyFilters();
      trackEvent('veg_filter', vegOnly ? 'on' : 'off');
    });
  }
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
        chips.forEach(function(c){
          var isMatch = c.dataset.target === id;
          c.classList.toggle('active', isMatch);
          if (isMatch && !scrollSpySuppressed){
            scrollChipToCenter(c);
          }
        });
      });
    }, { rootMargin: '-' + Math.round(headerHeight + 6) + 'px 0px -40% 0px', threshold: 0 });
    qsa('.menu-section').forEach(function(s){ observer.observe(s); });
  }

  /* Bottom-of-page scroll detector to ensure the last category highlights when scrolled to bottom */
  window.addEventListener('scroll', function(){
    if (scrollSpySuppressed) return;
    if ((window.innerHeight + window.pageYOffset) >= (document.documentElement.scrollHeight - 60)){
      var allSections = qsa('.menu-section');
      var visibleSections = allSections.filter(function(s){ return s.style.display !== 'none'; });
      if (visibleSections.length > 0){
        var lastSec = visibleSections[visibleSections.length - 1];
        var lastId = lastSec.id.replace('sec-', '');
        chips.forEach(function(c){
          var isMatch = c.dataset.target === lastId;
          c.classList.toggle('active', isMatch);
          if (isMatch) scrollChipToCenter(c);
        });
      }
    }
  }, { passive: true });

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
  var lightboxFlavors = qs('#lightboxFlavors');
  var lightboxClose = qs('#lightboxClose');
  function openLightbox(src, caption, ingredients, item){
    lightboxImgWrap.classList.add('loading');
    lightboxImg.src = src;
    lightboxImg.alt = caption || '';
    lightboxCaption.textContent = caption || '';
    lightboxIngredients.textContent = (ingredients && ingredients.length)
      ? STRINGS[currentLang].ingredientsLabel + ': ' + ingredients.join(', ')
      : '';
    if (lightboxFlavors){
      lightboxFlavors.innerHTML = '';
      if (item){
        var flavors = getFlavorProfile(item, currentLang);
        flavors.forEach(function(fl){
          var chip = document.createElement('span');
          chip.className = 'flavor-chip';
          chip.textContent = fl;
          lightboxFlavors.appendChild(chip);
        });
      }
    }
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

  /* ---------- Feature 1: "Can't Decide? Surprise Me!" Roulette ---------- */
  var surpriseDialog = qs('#surpriseDialog');
  var surpriseCard = qs('#surpriseCard');
  var surpriseClose = qs('#surpriseClose');
  var surpriseBtn = qs('#surpriseBtn');
  var surpriseSpinBtn = qs('#surpriseSpinBtn');
  var surpriseViewBtn = qs('#surpriseViewBtn');
  var surpriseResultWrap = qs('#surpriseResultWrap');
  var surpriseDishImg = qs('#surpriseDishImg');
  var surpriseDishName = qs('#surpriseDishName');
  var surpriseDishCat = qs('#surpriseDishCat');
  var surpriseDishPrice = qs('#surpriseDishPrice');
  var surpriseDietBadge = qs('#surpriseDietBadge');
  var surpriseTabBtns = qsa('.surprise-tab-btn');
  var currentSurpriseDiet = 'all';
  var pickedDish = null;

  var allActiveDishes = [];
  (typeof CATEGORY_META !== 'undefined' ? CATEGORY_META : []).forEach(function(cat){
    (MENU_DATA[cat.id] || []).forEach(function(item){
      if (item.status === 'Active'){
        var d = {};
        for (var k in item){ if (Object.prototype.hasOwnProperty.call(item, k)) d[k] = item[k]; }
        d.catId = cat.id;
        d.catTitle = cat.title;
        d.catTitleTe = cat.titleTe;
        d.catImage = cat.image;
        allActiveDishes.push(d);
      }
    });
  });

  function pickRandomDish(){
    var pool = allActiveDishes.filter(function(d){
      if (currentSurpriseDiet === 'veg') return !!d.veg;
      if (currentSurpriseDiet === 'nonveg') return !d.veg;
      return true;
    });
    if (!pool.length) pool = allActiveDishes;
    if (pool.length > 1 && pickedDish){
      var filtered = pool.filter(function(d){ return d.name !== pickedDish.name; });
      if (filtered.length) pool = filtered;
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function renderSurpriseDish(d){
    pickedDish = d;
    if (!d) return;
    var imgSrc = d.photo || d.thumb || d.catImage || NO_IMAGE_FULL;
    surpriseDishImg.src = imgSrc;
    surpriseDishImg.alt = d.name;
    surpriseDishName.textContent = currentLang === 'te' && d.nameTe ? d.nameTe : d.name;
    surpriseDishCat.textContent = currentLang === 'te' && d.catTitleTe ? d.catTitleTe : d.catTitle;
    surpriseDishPrice.textContent = d.price !== null && d.price !== undefined ? (CUR + d.price) : (STRINGS[currentLang].askStaff || 'Ask staff');
    surpriseDietBadge.className = 'diet-badge ' + (d.veg ? 'veg' : 'nonveg');
    surpriseDietBadge.title = d.veg ? 'Veg' : 'Non-Veg';
  }

  function spinRoulette(){
    if (!surpriseResultWrap) return;
    surpriseResultWrap.classList.add('rolling');
    if (surpriseSpinBtn) surpriseSpinBtn.disabled = true;
    var count = 0;
    var shuffleTimer = setInterval(function(){
      var temp = pickRandomDish();
      if (temp){
        surpriseDishName.textContent = currentLang === 'te' && temp.nameTe ? temp.nameTe : temp.name;
      }
      count++;
      if (count > 5){
        clearInterval(shuffleTimer);
        var finalDish = pickRandomDish();
        renderSurpriseDish(finalDish);
        surpriseResultWrap.classList.remove('rolling');
        if (surpriseSpinBtn) surpriseSpinBtn.disabled = false;
        trackEvent('surprise_spin', finalDish ? finalDish.name : 'none');
      }
    }, 60);
  }

  function openSurpriseDialog(){
    if (!surpriseDialog) return;
    surpriseDialog.classList.add('show');
    surpriseDialog.setAttribute('aria-hidden', 'false');
    spinRoulette();
  }

  function closeSurpriseDialog(){
    if (!surpriseDialog) return;
    surpriseDialog.classList.remove('show');
    surpriseDialog.setAttribute('aria-hidden', 'true');
  }

  if (surpriseDialog){
    surpriseDialog.addEventListener('click', closeSurpriseDialog);
    if (surpriseCard) surpriseCard.addEventListener('click', function(e){ e.stopPropagation(); });
    if (surpriseClose) surpriseClose.addEventListener('click', closeSurpriseDialog);
    if (surpriseBtn) surpriseBtn.addEventListener('click', function(){ openSurpriseDialog(); });
    var fabSurpriseBtn = qs('#fabSurpriseBtn');
    if (fabSurpriseBtn) fabSurpriseBtn.addEventListener('click', function(){ closeFab(); openSurpriseDialog(); });

    surpriseTabBtns.forEach(function(tab){
      tab.addEventListener('click', function(){
        surpriseTabBtns.forEach(function(t){ t.classList.remove('active'); });
        tab.classList.add('active');
        currentSurpriseDiet = tab.dataset.diet || 'all';
        spinRoulette();
      });
    });

    if (surpriseSpinBtn){
      surpriseSpinBtn.addEventListener('click', function(){ spinRoulette(); });
    }

    if (surpriseViewBtn){
      surpriseViewBtn.addEventListener('click', function(){
        if (!pickedDish) return;
        closeSurpriseDialog();
        if (searchInput.value){
          searchInput.value = '';
          if (searchClear) searchClear.classList.remove('visible');
        }
        if (vegOnly && !pickedDish.veg){
          vegOnly = false;
          if (vegToggle) vegToggle.classList.remove('active');
        }
        if (nonvegOnly && pickedDish.veg){
          nonvegOnly = false;
          if (nonvegToggle) nonvegToggle.classList.remove('active');
        }
        if (topOnly && !pickedDish.top){
          topOnly = false;
          if (topToggle) topToggle.classList.remove('active');
        }
        if (priceMin !== null && (pickedDish.price < priceMin || pickedDish.price > priceMax)){
          priceMin = null;
          priceMax = null;
          if (priceFilter) priceFilter.value = '';
        }
        applyFilters();

        var targetDishEl = null;
        qsa('.dish').forEach(function(row){
          if (row.dataset.name && row.dataset.name.indexOf(pickedDish.name.toLowerCase()) !== -1){
            targetDishEl = row;
          }
        });
        if (targetDishEl){
          var topbarH = topbarEl ? topbarEl.getBoundingClientRect().height : 56;
          var subH = stickySubheader ? stickySubheader.getBoundingClientRect().height : 100;
          var offset = topbarH + subH + 16;
          var y = targetDishEl.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
          targetDishEl.classList.remove('highlight-dish');
          void targetDishEl.offsetWidth;
          targetDishEl.classList.add('highlight-dish');
          setTimeout(function(){
            targetDishEl.classList.remove('highlight-dish');
          }, 2400);
        }
        trackEvent('surprise_view_menu', pickedDish.name);
      });
    }
  }

  /* ---------- Feature: Group Split Bill Calculator ---------- */
  var splitDialog = qs('#splitDialog');
  var splitCard = qs('#splitCard');
  var splitClose = qs('#splitClose');
  var splitCta = qs('#splitCta');
  var fabSplitBtn = qs('#fabSplitBtn');
  var splitBillAmount = qs('#splitBillAmount');
  var splitPresets = qsa('.preset-pill', qs('#splitPresets'));
  var splitDecBtn = qs('#splitDecBtn');
  var splitIncBtn = qs('#splitIncBtn');
  var splitPeopleCount = qs('#splitPeopleCount');
  var splitPeoplePills = qsa('.people-pill', qs('#splitPeoplePills'));
  var splitResultAmount = qs('#splitResultAmount');
  var splitResultSub = qs('#splitResultSub');
  var splitDownloadBtn = qs('#splitDownloadBtn');
  var splitCopyBtn = qs('#splitCopyBtn');
  var splitToast = qs('#splitToast');

  var currentSplitPeople = 4;

  function showSplitToast(msg, duration){
    if (splitToast){
      splitToast.textContent = msg;
      splitToast.classList.add('visible');
      setTimeout(function(){ splitToast.classList.remove('visible'); }, duration || 2600);
    }
  }

  function drawRoundedRect(ctx, x, y, width, height, radius, fill, stroke){
    var r = typeof radius === 'number' ? { tl: radius, tr: radius, br: radius, bl: radius } : radius;
    ctx.beginPath();
    ctx.moveTo(x + r.tl, y);
    ctx.lineTo(x + width - r.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r.tr);
    ctx.lineTo(x + width, y + height - r.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r.br, y + height);
    ctx.lineTo(x + r.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r.bl);
    ctx.lineTo(x, y + r.tl);
    ctx.quadraticCurveTo(x, y, x + r.tl, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function getNavrangLogo(cb){
    var heroLogo = document.getElementById('heroLogo');
    if (heroLogo && heroLogo.complete && heroLogo.naturalWidth > 0){
      cb(heroLogo);
      return;
    }
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function(){ cb(img); };
    img.onerror = function(){ cb(null); };
    img.src = 'navrang_logo.png';
  }

  function getMenuQr(cb){
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function(){ cb(img); };
    img.onerror = function(){ cb(null); };
    img.src = 'images/qr-cards/qr_en.png';
  }

  function loadReceiptAssets(cb){
    var assets = { logo: null, qr: null };
    var pending = 2;
    function finish(){
      pending--;
      if (pending === 0) cb(assets);
    }
    getNavrangLogo(function(l){ assets.logo = l; finish(); });
    getMenuQr(function(q){ assets.qr = q; finish(); });
  }

  function generateBillImage(opts, cb){
    loadReceiptAssets(function(assets){
      var logoImg = assets.logo;
      var qrImg = assets.qr;
      try {
        var w = 600;
        var h = 970;
        var canvas = document.createElement('canvas');
        canvas.width = w * 2;
        canvas.height = h * 2;
        var ctx = canvas.getContext('2d');
        if (!ctx){
          cb(new Error('Canvas 2D context unavailable'));
          return;
        }
        ctx.scale(2, 2);

        // 1. Deep midnight gradient background
        var bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#060c18');
        bgGrad.addColorStop(0.5, '#0a1424');
        bgGrad.addColorStop(1, '#0e1d33');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // 2. Inner Receipt Card with golden border
        var cardX = 22, cardY = 20, cardW = 556, cardH = 930, cardR = 24;
        var cardGrad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
        cardGrad.addColorStop(0, '#0d1727');
        cardGrad.addColorStop(1, '#111f36');
        ctx.fillStyle = cardGrad;
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
        ctx.lineWidth = 2;
        drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardR, true, true);

        // Decorative gold top pill
        var goldBarGrad = ctx.createLinearGradient(w / 2 - 60, 0, w / 2 + 60, 0);
        goldBarGrad.addColorStop(0, 'rgba(245, 158, 11, 0)');
        goldBarGrad.addColorStop(0.5, '#f59e0b');
        goldBarGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        ctx.fillStyle = goldBarGrad;
        ctx.fillRect(w / 2 - 60, cardY + 2, 120, 3);

        // 3. Restaurant Brand Logo (Replaces Name)
        var logoSize = 82;
        var logoX = (w - logoSize) / 2;
        var logoY = 44;

        if (logoImg){
          ctx.save();
          // Circular gold border ring around the logo
          ctx.beginPath();
          ctx.arc(w / 2, logoY + logoSize / 2, logoSize / 2 + 3, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
          ctx.fill();
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Circular clip to render emblem smoothly
          ctx.beginPath();
          ctx.arc(w / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
          ctx.restore();
        } else {
          ctx.textAlign = 'center';
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 24px "Noto Sans Telugu", "Playfair Display", Georgia, serif, sans-serif';
          ctx.fillText(opts.isTe ? 'నవరంగ్ రెస్టారెంట్' : 'NAVRANG RESTAURANT', w / 2, 80);
        }

        // Subtitle below the logo
        ctx.textAlign = 'center';
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 12.5px "Noto Sans Telugu", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(opts.isTe ? 'గ్రూప్ బిల్ స్ప్లిట్ రసీదు' : 'GROUP BILL SPLIT RECEIPT', w / 2, logoY + logoSize + 22);

        var d = new Date();
        var dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + '  •  ' +
                      d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        ctx.fillStyle = '#64748b';
        ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(dateStr, w / 2, logoY + logoSize + 44);

        // 4. Perforation line with circular side cutouts
        var perfY = 196;
        ctx.fillStyle = '#060c18';
        ctx.beginPath();
        ctx.arc(cardX, perfY, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cardX + cardW, perfY, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cardX, perfY, 12, -Math.PI / 2, Math.PI / 2, false);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cardX + cardW, perfY, 12, Math.PI / 2, -Math.PI / 2, false);
        ctx.stroke();

        ctx.beginPath();
        ctx.setLineDash([8, 6]);
        ctx.strokeStyle = '#25354c';
        ctx.lineWidth = 1.5;
        ctx.moveTo(cardX + 20, perfY);
        ctx.lineTo(cardX + cardW - 20, perfY);
        ctx.stroke();
        ctx.setLineDash([]);

        // 5. Bill Summary Rows
        var leftX = cardX + 32;
        var rightX = cardX + cardW - 32;

        function drawSummaryRow(y, label, val, valColor, valFont){
          ctx.textAlign = 'left';
          ctx.fillStyle = '#94a3b8';
          ctx.font = '500 15px "Noto Sans Telugu", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText(label, leftX, y);

          ctx.textAlign = 'right';
          ctx.fillStyle = valColor || '#f8fafc';
          ctx.font = valFont || 'bold 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText(val, rightX, y);

          ctx.strokeStyle = '#17253b';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(leftX, y + 16);
          ctx.lineTo(rightX, y + 16);
          ctx.stroke();
        }

        drawSummaryRow(
          238,
          opts.isTe ? 'మొత్తం బిల్లు' : 'Total Bill Amount',
          '₹' + Number(opts.amount).toLocaleString('en-IN'),
          '#ffffff',
          'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        );

        drawSummaryRow(
          282,
          opts.isTe ? 'వ్యక్తుల సంఖ్య' : 'Split Between',
          opts.isTe ? (opts.people + ' వ్యక్తులు') : (opts.people + (opts.people === 1 ? ' Person' : ' Diners')),
          '#f8fafc',
          'bold 17px "Noto Sans Telugu", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        );

        drawSummaryRow(
          326,
          opts.isTe ? 'విభజన పద్ధతి' : 'Split Method',
          opts.isTe ? 'సమాన విభజన' : 'Equal Fair Share',
          '#10b981',
          '600 15px "Noto Sans Telugu", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        );

        // 6. Hero Result Card ("EACH PERSON PAYS")
        var heroX = cardX + 24;
        var heroY = 366;
        var heroW = cardW - 48;
        var heroH = 194;
        var heroR = 20;

        var heroGrad = ctx.createLinearGradient(heroX, heroY, heroX, heroY + heroH);
        heroGrad.addColorStop(0, '#042f2e');
        heroGrad.addColorStop(1, '#064e3b');
        ctx.fillStyle = heroGrad;
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        drawRoundedRect(ctx, heroX, heroY, heroW, heroH, heroR, true, true);

        var pillW = 240, pillH = 26, pillR = 13;
        var pillX = w / 2 - pillW / 2;
        var pillY = heroY + 16;
        ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
        ctx.strokeStyle = 'rgba(110, 231, 183, 0.35)';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, pillX, pillY, pillW, pillH, pillR, true, true);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#a7f3d0';
        ctx.font = 'bold 12px "Noto Sans Telugu", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(opts.isTe ? '✦ ఒక్కొక్కరు చెల్లించాల్సింది ✦' : '✦ EACH PERSON PAYS ✦', w / 2, pillY + 17);

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 46px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('₹' + Number(opts.eachToPay).toLocaleString('en-IN'), w / 2, heroY + 95);

        var subText = opts.isTe ?
          ('₹' + opts.amount + ' మొత్తం ' + opts.people + ' వ్యక్తులకు సమానంగా') :
          ('₹' + Number(opts.amount).toLocaleString('en-IN') + ' split equally between ' + opts.people + ' diners');
        ctx.fillStyle = '#6ee7b7';
        ctx.font = '500 13px "Noto Sans Telugu", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(subText, w / 2, heroY + 132);

        var fBadgeW = 204, fBadgeH = 24, fBadgeR = 12;
        var fBadgeX = w / 2 - fBadgeW / 2;
        var fBadgeY = heroY + 152;
        ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, fBadgeX, fBadgeY, fBadgeW, fBadgeH, fBadgeR, true, true);

        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 11px "Noto Sans Telugu", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(opts.isTe ? '✓ సమాన వాటా నిర్ధారించబడింది' : '✓ FAIR SHARE CALCULATED', w / 2, fBadgeY + 16);

        // 7. Bottom Perforation Line
        var bPerfY = 576;
        ctx.beginPath();
        ctx.setLineDash([6, 5]);
        ctx.strokeStyle = '#1e2f47';
        ctx.lineWidth = 1.5;
        ctx.moveTo(cardX + 24, bPerfY);
        ctx.lineTo(cardX + cardW - 24, bPerfY);
        ctx.stroke();
        ctx.setLineDash([]);

        // 8. Menu QR English Section (Enhanced Size & High Contrast for Instant Camera Scan)
        ctx.textAlign = 'center';
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 13px "Noto Sans Telugu", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(opts.isTe ? '📱 ఆన్‌లైన్ మెనూ (ఇంగ్లీష్) కోసం స్కాన్ చేయండి' : '📱 SCAN FOR LIVE MENU (ENGLISH)', w / 2, bPerfY + 24);

        // Large High-Contrast Pure White QR Box (190 x 190 px with 14px quiet zone)
        var qrBoxW = 190, qrBoxH = 190, qrBoxR = 16;
        var qrBoxX = (w - qrBoxW) / 2;
        var qrBoxY = bPerfY + 38;

        // Solid white container with crisp outline for camera autofocus & exposure lock
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        drawRoundedRect(ctx, qrBoxX, qrBoxY, qrBoxW, qrBoxH, qrBoxR, true, true);

        if (qrImg){
          var qrPad = 14;
          var qrDrawSize = qrBoxW - qrPad * 2; // 162 x 162 px (324 x 324 retina px)
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(qrImg, qrBoxX + qrPad, qrBoxY + qrPad, qrDrawSize, qrDrawSize);
          ctx.imageSmoothingEnabled = true;
        }

        // Subtitle badge under QR
        var qrBadgeW = 180, qrBadgeH = 24, qrBadgeR = 12;
        var qrBadgeX = w / 2 - qrBadgeW / 2;
        var qrBadgeY = qrBoxY + qrBoxH + 14;
        ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, qrBadgeX, qrBadgeY, qrBadgeW, qrBadgeH, qrBadgeR, true, true);

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('English Menu QR • Live', w / 2, qrBadgeY + 16);

        // Explanatory camera scan instruction
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '600 13px "Noto Sans Telugu", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(opts.isTe ? 'ఫోన్ కెమెరాతో స్కాన్ చేసి నేరుగా ఆర్డర్ చేయండి' : 'Point phone camera to view full menu & order', w / 2, qrBadgeY + 44);

        // Hostname / URL
        var hostName = window.location.hostname ? window.location.hostname : 'navrangrestaurant.com';
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(hostName + '/order.html', w / 2, qrBadgeY + 64);

        // Verification & Tagline
        ctx.fillStyle = '#64748b';
        ctx.font = '400 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText('✓ Verified Navrang Bill Calculator  •  Authentic Flavors', w / 2, qrBadgeY + 84);

        canvas.toBlob(function(blob){
          if (blob){
            cb(null, blob);
          } else {
            cb(new Error('Canvas toBlob failed'));
          }
        }, 'image/png');
      } catch (err){
        cb(err);
      }
    });
  }

  function downloadBlob(blob, filename){
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename || 'navrang-bill-split.png';
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }

  calculateSplitBill = function(){
    var rawAmount = parseFloat(splitBillAmount ? splitBillAmount.value : 0);
    var amount = (!isNaN(rawAmount) && rawAmount > 0) ? rawAmount : 0;
    var people = currentSplitPeople > 0 ? currentSplitPeople : 1;
    var S = STRINGS[currentLang] || STRINGS.en;

    if (amount <= 0){
      if (splitResultAmount) splitResultAmount.textContent = CUR + '0';
      if (splitResultSub) splitResultSub.textContent = S.splitResultSubZero;
      return;
    }

    var exactEach = amount / people;
    var eachToPay = Math.round(exactEach * 100) / 100;
    if (eachToPay % 1 === 0) eachToPay = Math.round(eachToPay);

    if (splitResultAmount){
      splitResultAmount.textContent = CUR + eachToPay;
    }
    if (splitResultSub){
      splitResultSub.textContent = S.splitResultSubExact(amount, people, eachToPay);
    }
  };

  function updatePeopleUI(){
    if (splitPeopleCount) splitPeopleCount.textContent = currentSplitPeople;
    splitPeoplePills.forEach(function(pill){
      var n = parseInt(pill.dataset.people, 10);
      pill.classList.toggle('active', n === currentSplitPeople);
    });
  }

  function openSplitDialog(){
    if (!splitDialog) return;
    splitDialog.classList.add('show');
    splitDialog.setAttribute('aria-hidden', 'false');
    if (splitBillAmount && !splitBillAmount.value){
      setTimeout(function(){ splitBillAmount.focus(); }, 150);
    }
    trackEvent('split_bill_open', 'opened');
  }

  function closeSplitDialog(){
    if (!splitDialog) return;
    splitDialog.classList.remove('show');
    splitDialog.setAttribute('aria-hidden', 'true');
  }

  if (splitDialog){
    splitDialog.addEventListener('click', closeSplitDialog);
    if (splitCard) splitCard.addEventListener('click', function(e){ e.stopPropagation(); });
    if (splitClose) splitClose.addEventListener('click', closeSplitDialog);
    if (splitCta) splitCta.addEventListener('click', openSplitDialog);
    if (fabSplitBtn) fabSplitBtn.addEventListener('click', function(){ closeFab(); openSplitDialog(); });

    if (splitBillAmount){
      splitBillAmount.addEventListener('input', calculateSplitBill);
    }

    if (splitDecBtn){
      splitDecBtn.addEventListener('click', function(){
        if (currentSplitPeople > 1){
          currentSplitPeople--;
          updatePeopleUI();
          calculateSplitBill();
        }
      });
    }

    if (splitIncBtn){
      splitIncBtn.addEventListener('click', function(){
        if (currentSplitPeople < 50){
          currentSplitPeople++;
          updatePeopleUI();
          calculateSplitBill();
        }
      });
    }

    splitPeoplePills.forEach(function(pill){
      pill.addEventListener('click', function(){
        var p = parseInt(pill.dataset.people, 10);
        if (p && p >= 1){
          currentSplitPeople = p;
          updatePeopleUI();
          calculateSplitBill();
        }
      });
    });

    splitPresets.forEach(function(btn){
      btn.addEventListener('click', function(){
        var val = btn.dataset.amount;
        if (splitBillAmount && val){
          splitBillAmount.value = val;
          calculateSplitBill();
          trackEvent('split_preset_click', val);
        }
      });
    });

    if (splitDownloadBtn){
      splitDownloadBtn.addEventListener('click', function(){
        var rawAmount = parseFloat(splitBillAmount ? splitBillAmount.value : 0);
        var amount = (!isNaN(rawAmount) && rawAmount > 0) ? rawAmount : 0;
        if (amount <= 0){
          if (splitBillAmount) {
            splitBillAmount.focus();
            splitBillAmount.classList.add('shake');
            setTimeout(function(){ splitBillAmount.classList.remove('shake'); }, 600);
          }
          return;
        }
        var people = currentSplitPeople > 0 ? currentSplitPeople : 1;
        var exactEach = amount / people;
        var eachToPay = Math.round(exactEach * 100) / 100;
        if (eachToPay % 1 === 0) eachToPay = Math.round(eachToPay);
        var S = STRINGS[currentLang] || STRINGS.en;
        var isTe = currentLang === 'te';

        var origBtnHTML = splitDownloadBtn.innerHTML;
        splitDownloadBtn.disabled = true;
        splitDownloadBtn.innerHTML = '<span class="split-btn-spinner"></span> ' + S.splitGenerating;

        generateBillImage({
          amount: amount,
          people: people,
          eachToPay: eachToPay,
          isTe: isTe
        }, function(err, blob){
          splitDownloadBtn.disabled = false;
          splitDownloadBtn.innerHTML = origBtnHTML;

          if (err || !blob){
            showSplitToast(S.splitGenerateError);
            return;
          }

          var fileName = 'navrang-bill-split-' + amount + '.png';
          downloadBlob(blob, fileName);
          showSplitToast(S.splitSavedToast, 2500);
          trackEvent('split_bill_download_image', amount + '_' + people);
        });
      });
    }

    if (splitCopyBtn){
      splitCopyBtn.addEventListener('click', function(){
        var rawAmount = parseFloat(splitBillAmount ? splitBillAmount.value : 0);
        var amount = (!isNaN(rawAmount) && rawAmount > 0) ? rawAmount : 0;
        if (amount <= 0){
          if (splitBillAmount) splitBillAmount.focus();
          return;
        }
        var people = currentSplitPeople > 0 ? currentSplitPeople : 1;
        var exactEach = amount / people;
        var eachToPay = Math.round(exactEach * 100) / 100;
        if (eachToPay % 1 === 0) eachToPay = Math.round(eachToPay);
        var S = STRINGS[currentLang] || STRINGS.en;
        var msg = S.splitShareMessage(amount, people, eachToPay);

        if (navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(msg).then(function(){
            showSplitToast(S.splitCopiedToast);
          }).catch(function(){
            fallbackCopy(msg);
          });
        } else {
          fallbackCopy(msg);
        }

        function fallbackCopy(text){
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          try {
            document.execCommand('copy');
            showSplitToast(S.splitCopiedToast);
          } catch(e){}
          document.body.removeChild(ta);
        }

        trackEvent('split_bill_copy', amount + '_' + people);
      });
    }

    updatePeopleUI();
    calculateSplitBill();
  }

  /* ---------- Dismiss Splash Screen once App is Ready ---------- */
  if (typeof window.__dismissSplash === 'function'){
    window.__dismissSplash();
  }
})();
