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
      youtubeTitle: 'Subscribe to Navrang on YouTube',
      youtubeLabel: 'YouTube',
      footerYoutubeText: 'Subscribe on YouTube',
      footerInstaText: 'Follow @navrang786fr',
      playersSuffix: 'played',
      gameOverPlayersLabel: 'players have competed!',
      heroOfferBadge: 'Instagram Exclusive',
      heroOfferTitle: 'Get Flat 5% OFF on Total Bill!',
      heroOfferDesc: 'Follow @navrang786fr on Instagram & show your screen during billing to claim flat 5% savings on your entire food bill!',
      heroOfferFollowText: 'Follow @navrang786fr',
      heroOfferDetailsText: 'Offer Details',
      heroOfferTip: 'Follow @navrang786fr on Instagram & show your screen during billing to claim 5% OFF!',
      offersLabel: 'Special Offers',
      offersTitle: 'Special Offers & Deals',
      offersSub: 'Exclusive Dining Perks',
      offersActiveBadge: 'Active Offer',
      offersDealTitle: '5% OFF Total Bill',
      offersDealFor: 'For all Instagram Followers',
      offersDealDesc: 'Follow @navrang786fr on Instagram and get flat 5% off deducted from your total food bill across all dine-in and takeaway orders!',
      offersStep1: 'Follow our official Instagram: @navrang786fr',
      offersStep2: 'Show your following profile screen to waiter or cashier',
      offersStep3: 'Get flat 5% deducted instantly from your total bill!',
      offersModalInstaText: 'Open Instagram @navrang786fr',
      offersTermsNote: '* Valid on all Dine-In & Takeaway bills. Show screen to waiter/cashier during ordering or billing.',
      offersUpcomingTitle: 'More Exciting Deals Coming!',
      offersUpcomingDesc: 'Weekend Biryani combos & loyalty treats are in the kitchen for you.',
      offersOk: 'Got it',
      gameBtnLabel: 'Play & Wait',
      gameModalTitle: 'Biryani Catcher',
      gameModalSub: "Chef is cooking your fresh food! Catch dishes & dodge the chillies 🌶️",
      gameScoreLabel: 'Score',
      gameBestLabel: 'Best',
      gameLeftLabel: 'Left',
      gameRightLabel: 'Right',
      gameTouchHint: 'Swipe or tap buttons',
      gameOverTitle: 'Order Simmering!',
      gameOverFinalLabel: 'Your Score:',
      gameOverBestLabel: 'Highest Score:',
      gameChefMsg: '👨‍🍳 Your fresh dishes are being prepared in the kitchen. Keep playing!',
      gameRestartLabel: 'Play Again',
      fabGameLabel: 'Wait Game',
      heroGameWaitingTitle: 'Waiting for food?',
      heroGameWaitingSub: 'Play <strong>Biryani Catcher</strong> while food is prepared!',
      heroGameBestLabel: 'Best:',
      newRecordBanner: '🎉 NEW ALL-TIME RECORD! 🏆',
      gameShareScoreLabel: 'Show Waiter / Table',
      gameShareToast: '🏆 High Score: {score} pts! Show your screen to your table or waiter!',
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
      },
      deliverySurveyTag: 'COMING SOON · DEMAND SURVEY',
      deliveryCountLabel: 'interested in Home Delivery',
      deliveryHeadline: 'Want Navrang Delivered to Your Doorstep?',
      deliverySubtext: "Vote for your colony or area! If we receive enough demand, we'll launch express home delivery directly to your doorstep.",
      deliveryVoteBtnText: 'Yes, I Want Home Delivery!',
      deliveryVotedText: 'You Voted! Launching Soon',
      deliveryModalTitle: 'Bring Navrang to Your Home!',
      deliveryModalSub: 'Vote for your area & help us prioritize delivery routes.',
      modalDeliverySpeed: '⚡ Express',
      modalDeliverySpeedLabel: 'Direct Delivery',
      modalDeliveryPack: '🍲 Fresh & Hot',
      modalDeliveryPackLabel: 'Royal Packaging',
      deliveryVotesLabel: 'Customer Votes',
      deliveryOfferLabel: 'Launch Coupon',
      deliveryAreaLabel: 'Your Colony / Area / Landmark',
      deliveryAreaPlaceholder: 'e.g. Gandhi Nagar, Station Road...',
      deliveryPhoneLabel: 'WhatsApp / Mobile Number (Optional)',
      deliveryPhonePlaceholder: '10-digit mobile number',
      deliveryPhoneNote: 'We will notify you when delivery opens in your area. Zero spam.',
      deliverySubmitText: 'Vote for My Area 🚀',
      deliverySubmitting: 'Recording your vote…',
      deliverySuccessTitle: '🎉 Your Vote is Recorded!',
      deliverySuccessMsg: "Thank you! We've recorded your demand. We're planning express delivery routes to bring steaming hot food to your home soon!",
      deliveryShareBtnText: 'Share with Neighbors on WhatsApp',
      deliveryDoneText: 'Done',
      deliveryErrArea: 'Please enter or select your area / colony.',
      fabDeliveryLabel: 'Delivery'
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
      youtubeTitle: 'యూట్యూబ్‌లో నవరంగ్ సబ్‌స్క్రైబ్ చేయండి',
      youtubeLabel: 'యూట్యూబ్',
      footerYoutubeText: 'యూట్యూబ్‌లో సబ్‌స్క్రైబ్ చేయండి',
      footerInstaText: 'ఇన్‌స్టాగ్రామ్‌లో ఫాలో అవ్వండి',
      playersSuffix: 'ఆడారు',
      gameOverPlayersLabel: 'మంది ఆడారు!',
      heroOfferBadge: 'ఇన్‌స్టాగ్రామ్ స్పెషల్ ఆఫర్',
      heroOfferTitle: 'మొత్తం బిల్లుపై ఫ్లాట్ 5% తగ్గింపు!',
      heroOfferDesc: 'Instagramలో @navrang786fr ని ఫాలో అవ్వండి & బిల్లింగ్ సమయంలో స్క్రీన్ చూపించి మీ మొత్తం బిల్లుపై ఫ్లాట్ 5% ఆదా చేసుకోండి!',
      heroOfferFollowText: 'ఇప్పుడే ఫాలో అవ్వండి',
      heroOfferDetailsText: 'ఆఫర్ వివరాలు',
      heroOfferTip: 'Instagramలో @navrang786fr ని ఫాలో అయి, బిల్లింగ్ సమయంలో స్క్రీన్ చూపించి 5% రాయితీ పొందండి.',
      offersLabel: 'ప్రత్యేక ఆఫర్‌లు',
      offersTitle: 'ప్రత్యేక ఆఫర్‌లు & డీల్స్',
      offersSub: 'నవరంగ్ ప్రత్యేక ప్రయోజనాలు',
      offersActiveBadge: 'లైవ్ ఆఫర్',
      offersDealTitle: 'మొత్తం బిల్లుపై 5% రాయితీ',
      offersDealFor: 'అన్ని ఇన్‌స్టాగ్రామ్ ఫాలోవర్లకు',
      offersDealDesc: 'Instagramలో @navrang786fr ని ఫాలో అవ్వండి మరియు మీ మొత్తం ఫుడ్ బిల్లుపై 5% తక్షణ డిస్కౌంట్ పొందండి!',
      offersStep1: 'Instagramలో @navrang786fr ని ఫాలో అవ్వండి',
      offersStep2: 'ఆర్డర్ లేదా బిల్లింగ్ సమయంలో వెయిటర్ లేదా క్యాషియర్‌కి మీ స్క్రీన్ చూపించండి',
      offersStep3: 'మీ మొత్తం బిల్లులో 5% తక్షణ తగ్గింపును ఆనందించండి!',
      offersModalInstaText: 'Instagram @navrang786fr ఓపెన్ చేయండి',
      offersTermsNote: '* అన్ని డైన్-ఇన్ & టేక్‌అవే ఆర్డర్‌లకు వర్తిస్తుంది. బిల్లింగ్ సమయంలో మీ స్క్రీన్ చూపించండి.',
      offersUpcomingTitle: 'మరిన్ని ఆఫర్‌లు త్వరలో!',
      offersUpcomingDesc: 'స్పెషల్ వీకెండ్ బిర్యానీ కాంబోలు & రాయల్ డీల్స్ త్వరలోనే రానున్నాయి.',
      offersOk: 'సరే',
      gameBtnLabel: 'గేమ్ ఆడండి',
      gameModalTitle: 'బిర్యానీ క్యాచర్',
      gameModalSub: 'షెఫ్ మీ ఆర్డర్‌ని వండుతున్నారు! వంటకాలను పట్టుకోండి, మిరపకాయలను తప్పించండి 🌶️',
      gameScoreLabel: 'స్కోరు',
      gameBestLabel: 'బెస్ట్',
      gameLeftLabel: 'ఎడమ',
      gameRightLabel: 'కుడి',
      gameTouchHint: 'స్వైప్ చేయండి లేదా బటన్లను నొక్కండి',
      gameOverTitle: 'ఆర్డర్ సిద్ధమవుతోంది!',
      gameOverFinalLabel: 'మీ స్కోరు:',
      gameOverBestLabel: 'హైయెస్ట్ స్కోర్:',
      gameChefMsg: '👨‍🍳 మీ వేడి వేడి తాజా భోజనం వంటింట్లో సిద్ధమవుతోంది. ఆడుతూ ఉండండి!',
      gameRestartLabel: 'మళ్ళీ ఆడండి',
      fabGameLabel: 'వెయిట్ గేమ్',
      heroGameWaitingTitle: 'భోజనం కోసం వేచిచూస్తున్నారా?',
      heroGameWaitingSub: 'వంటకాలు సిద్ధమయ్యే వరకు <strong>బిర్యానీ క్యాచర్</strong> ఆడండి!',
      heroGameBestLabel: 'హై స్కోర్:',
      newRecordBanner: '🎉 నూతన ఆల్-టైమ్ రికార్డు! 🏆',
      gameShareScoreLabel: 'వెయిటర్ / టేబుల్‌కి చూపించండి',
      gameShareToast: '🏆 హై స్కోర్: {score} పాయింట్లు! మీ టేబుల్ లేదా వెయిటర్‌కి చూపించండి!',
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
      },
      deliverySurveyTag: 'త్వరలో రాబోతోంది · డిమాండ్ సర్వే',
      deliveryCountLabel: 'మంది హోమ్ డెలివరీ కోరుకుంటున్నారు',
      deliveryHeadline: 'నవరంగ్ రుచులు మీ ఇంటి వద్దకే కావాలా?',
      deliverySubtext: 'మీ కాలనీ లేదా ఏరియా కోసం ఓటు వేయండి! మంచి డిమాండ్ వస్తే, మీ ఇంటికే నేరుగా ఎక్స్‌ప్రెస్ హోమ్ డెలివరీ ప్రారంభిస్తాం.',
      deliveryVoteBtnText: 'అవును, నాకు హోమ్ డెలివరీ కావాలి!',
      deliveryVotedText: 'మీ ఓటు నమోదైంది! త్వరలో వస్తున్నాం',
      deliveryModalTitle: 'నవరంగ్ రుచులు మీ ఇంటికి!',
      deliveryModalSub: 'మీ ఏరియాను ఎంచుకోండి, డెలివరీ రూట్లను వేగవంతం చేయడంలో మాకు సహాయపడండి.',
      modalDeliverySpeed: '⚡ ఎక్స్‌ప్రెస్',
      modalDeliverySpeedLabel: 'డైరెక్ట్ డెలివరీ',
      modalDeliveryPack: '🍲 వేడి వేడిగా తాజా',
      modalDeliveryPackLabel: 'రాయల్ ప్యాకేజింగ్',
      deliveryVotesLabel: 'కస్టమర్ ఓట్లు',
      deliveryOfferLabel: 'లాంచ్ కూపన్',
      deliveryAreaLabel: 'మీ కాలనీ / ఏరియా / ల్యాండ్‌మార్క్',
      deliveryAreaPlaceholder: 'ఉదా: గాంధీ నగర్, స్టేషన్ రోడ్...',
      deliveryPhoneLabel: 'వాట్సాప్ / మొబైల్ నంబర్ (ఐచ్ఛికం)',
      deliveryPhonePlaceholder: '10 అంకెల మొబైల్ నంబర్',
      deliveryPhoneNote: 'మీ ఏరియాలో డెలివరీ ప్రారంభమైన వెంటనే తెలియజేస్తాం. ఎలాంటి స్పామ్ ఉండదు.',
      deliverySubmitText: 'నా ప్రాంతం కోసం ఓటు వేయండి 🚀',
      deliverySubmitting: 'నమోదవుతోంది…',
      deliverySuccessTitle: '🎉 మీ ఓటు విజయవంతంగా నమోదైంది!',
      deliverySuccessMsg: 'ధన్యవాదాలు! మీ ప్రాంత డిమాండ్ నమోదైంది. మీ ఇంటికే వేడి వేడి ఆహారాన్ని అందించేందుకు మేము డెలివరీ మార్గాలను రూపొందిస్తున్నాం!',
      deliveryShareBtnText: 'వాట్సాప్‌లో ఇతరులతో షేర్ చేయండి',
      deliveryDoneText: 'పూర్తయింది',
      deliveryErrArea: 'దయచేసి మీ ప్రాంతం లేదా కాలనీ పేరు నమోదు చేయండి.',
      fabDeliveryLabel: 'డెలివరీ'
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
    var gameBtnLabel = qs('#gameBtnLabel'); if (gameBtnLabel) gameBtnLabel.textContent = S.gameBtnLabel;
    var fabGameLabel = qs('#fabGameLabel'); if (fabGameLabel) fabGameLabel.textContent = S.fabGameLabel;
    var gameModalTitle = qs('#gameModalTitle'); if (gameModalTitle) gameModalTitle.textContent = S.gameModalTitle;
    var gameModalSub = qs('#gameModalSub'); if (gameModalSub) gameModalSub.textContent = S.gameModalSub;
    var gameScoreLabel = qs('#gameScoreLabel'); if (gameScoreLabel) gameScoreLabel.textContent = S.gameScoreLabel;
    var gameBestLabel = qs('#gameBestLabel'); if (gameBestLabel) gameBestLabel.textContent = S.gameBestLabel;
    var gameLeftLabel = qs('#gameLeftLabel'); if (gameLeftLabel) gameLeftLabel.textContent = S.gameLeftLabel;
    var gameRightLabel = qs('#gameRightLabel'); if (gameRightLabel) gameRightLabel.textContent = S.gameRightLabel;
    var gameTouchHint = qs('#gameTouchHint'); if (gameTouchHint) gameTouchHint.textContent = S.gameTouchHint;
    var gameOverTitle = qs('#gameOverTitle'); if (gameOverTitle) gameOverTitle.textContent = S.gameOverTitle;
    var gameOverFinalLabel = qs('#gameOverFinalLabel'); if (gameOverFinalLabel) gameOverFinalLabel.textContent = S.gameOverFinalLabel;
    var gameOverBestLabel = qs('#gameOverBestLabel'); if (gameOverBestLabel) gameOverBestLabel.textContent = S.gameOverBestLabel;
    var gameChefMsg = qs('#gameChefMsg'); if (gameChefMsg) gameChefMsg.textContent = S.gameChefMsg;
    var gameRestartLabel = qs('#gameRestartLabel'); if (gameRestartLabel) gameRestartLabel.textContent = S.gameRestartLabel;
    var heroGameWaitingTitle = qs('#heroGameWaitingTitle'); if (heroGameWaitingTitle) heroGameWaitingTitle.textContent = S.heroGameWaitingTitle;
    var heroGameWaitingSub = qs('#heroGameWaitingSub'); if (heroGameWaitingSub) heroGameWaitingSub.innerHTML = S.heroGameWaitingSub;
    var heroGameBestLabel = qs('#heroGameBestLabel'); if (heroGameBestLabel) heroGameBestLabel.textContent = S.heroGameBestLabel;
    var newRecordBanner = qs('#newRecordBanner'); if (newRecordBanner) newRecordBanner.textContent = S.newRecordBanner;
    var gameShareScoreLabel = qs('#gameShareScoreLabel'); if (gameShareScoreLabel) gameShareScoreLabel.textContent = S.gameShareScoreLabel;

    // Top Offer Banner
    var heroOfferBadge = qs('#heroOfferBadge'); if (heroOfferBadge) heroOfferBadge.textContent = S.heroOfferBadge;
    var heroOfferTitle = qs('#heroOfferTitle'); if (heroOfferTitle) heroOfferTitle.textContent = S.heroOfferTitle;
    var heroOfferDesc = qs('#heroOfferDesc'); if (heroOfferDesc) heroOfferDesc.textContent = S.heroOfferDesc;
    var heroOfferFollowText = qs('#heroOfferFollowText'); if (heroOfferFollowText) heroOfferFollowText.textContent = S.heroOfferFollowText;
    var heroOfferDetailsText = qs('#heroOfferDetailsText'); if (heroOfferDetailsText) heroOfferDetailsText.textContent = S.heroOfferDetailsText;
    var heroOfferTip = qs('#heroOfferTip'); if (heroOfferTip) heroOfferTip.textContent = S.heroOfferTip;

    // Special Offers Modal
    var offersTitleEl = qs('#offersTitle'); if (offersTitleEl) offersTitleEl.textContent = S.offersTitle;
    var offersSubEl = qs('#offersSub'); if (offersSubEl) offersSubEl.textContent = S.offersSub;
    var offersActiveBadge = qs('#offersActiveBadge span:last-child'); if (offersActiveBadge) offersActiveBadge.textContent = S.offersActiveBadge;
    var offersDealTitle = qs('#offersDealTitle'); if (offersDealTitle) offersDealTitle.textContent = S.offersDealTitle;
    var offersDealFor = qs('#offersDealFor'); if (offersDealFor) offersDealFor.textContent = S.offersDealFor;
    var offersDealDesc = qs('#offersDealDesc'); if (offersDealDesc) offersDealDesc.textContent = S.offersDealDesc;
    var offersStep1 = qs('#offersStep1'); if (offersStep1) offersStep1.textContent = S.offersStep1;
    var offersStep2 = qs('#offersStep2'); if (offersStep2) offersStep2.textContent = S.offersStep2;
    var offersStep3 = qs('#offersStep3'); if (offersStep3) offersStep3.textContent = S.offersStep3;
    var offersModalInstaText = qs('#offersModalInstaText'); if (offersModalInstaText) offersModalInstaText.textContent = S.offersModalInstaText;
    var offersTermsNote = qs('#offersTermsNote'); if (offersTermsNote) offersTermsNote.textContent = S.offersTermsNote;
    var offersUpcomingTitle = qs('#offersUpcomingTitle'); if (offersUpcomingTitle) offersUpcomingTitle.textContent = S.offersUpcomingTitle;
    var offersUpcomingDesc = qs('#offersUpcomingDesc'); if (offersUpcomingDesc) offersUpcomingDesc.textContent = S.offersUpcomingDesc;
    var offersOkEl = qs('#offersOkBtn'); if (offersOkEl) offersOkEl.textContent = S.offersOk;
    if (typeof updateAllBestScoreDisplays === 'function') updateAllBestScoreDisplays(bestScore);
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
    var youtubeLink = qs('#youtubeLink');
    if (youtubeLink){ youtubeLink.title = S.youtubeTitle; youtubeLink.setAttribute('aria-label', S.youtubeTitle); }
    var fabOffersLabel = qs('#fabOffersLabel'); if (fabOffersLabel) fabOffersLabel.textContent = S.offersLabel;
    var fabRatingLabel = qs('#fabRatingLabel'); if (fabRatingLabel) fabRatingLabel.textContent = S.rateCta;
    var fabDeliveryLabel = qs('#fabDeliveryLabel'); if (fabDeliveryLabel) fabDeliveryLabel.textContent = S.fabDeliveryLabel;
    var fabInstaLabel = qs('#fabInstaLabel'); if (fabInstaLabel) fabInstaLabel.textContent = S.instagramLabel;
    var fabYoutubeLabel = qs('#fabYoutubeLabel'); if (fabYoutubeLabel) fabYoutubeLabel.textContent = S.youtubeLabel;
    var fabYoutubeBtn = qs('#fabYoutubeBtn');
    if (fabYoutubeBtn){ fabYoutubeBtn.title = S.youtubeTitle; fabYoutubeBtn.setAttribute('aria-label', S.youtubeTitle); }
    var footerYoutubeText = qs('#footerYoutubeText'); if (footerYoutubeText) footerYoutubeText.textContent = S.footerYoutubeText;
    var footerInstaText = qs('#footerInstaText'); if (footerInstaText) footerInstaText.textContent = S.footerInstaText;

    // Home Delivery Survey elements
    var deliverySurveyTag = qs('#deliverySurveyTag'); if (deliverySurveyTag) deliverySurveyTag.textContent = S.deliverySurveyTag;
    var deliveryCountLabel = qs('#deliveryCountLabel'); if (deliveryCountLabel) deliveryCountLabel.textContent = S.deliveryCountLabel;
    var deliveryHeadline = qs('#deliveryHeadline'); if (deliveryHeadline) deliveryHeadline.textContent = S.deliveryHeadline;
    var deliverySubtext = qs('#deliverySubtext'); if (deliverySubtext) deliverySubtext.textContent = S.deliverySubtext;
    var deliveryVoteBtnText = qs('#deliveryVoteBtnText'); if (deliveryVoteBtnText) deliveryVoteBtnText.textContent = S.deliveryVoteBtnText;
    var deliveryVotedText = qs('#deliveryVotedText'); if (deliveryVotedText) deliveryVotedText.textContent = S.deliveryVotedText;
    var deliveryModalTitle = qs('#deliveryModalTitle'); if (deliveryModalTitle) deliveryModalTitle.textContent = S.deliveryModalTitle;
    var deliveryModalSub = qs('#deliveryModalSub'); if (deliveryModalSub) deliveryModalSub.textContent = S.deliveryModalSub;
    var modalDeliverySpeed = qs('#modalDeliverySpeed'); if (modalDeliverySpeed) modalDeliverySpeed.textContent = S.modalDeliverySpeed;
    var modalDeliverySpeedLabel = qs('#modalDeliverySpeedLabel'); if (modalDeliverySpeedLabel) modalDeliverySpeedLabel.textContent = S.modalDeliverySpeedLabel;
    var modalDeliveryPack = qs('#modalDeliveryPack'); if (modalDeliveryPack) modalDeliveryPack.textContent = S.modalDeliveryPack;
    var modalDeliveryPackLabel = qs('#modalDeliveryPackLabel'); if (modalDeliveryPackLabel) modalDeliveryPackLabel.textContent = S.modalDeliveryPackLabel;
    var modalDeliveryCountLabel = qs('#modalDeliveryCountLabel'); if (modalDeliveryCountLabel) modalDeliveryCountLabel.textContent = S.deliveryVotesLabel;
    var modalDeliveryOfferLabel = qs('#modalDeliveryOfferLabel'); if (modalDeliveryOfferLabel) modalDeliveryOfferLabel.textContent = S.deliveryOfferLabel;
    var deliveryAreaLabel = qs('#deliveryAreaLabel'); if (deliveryAreaLabel) deliveryAreaLabel.innerHTML = S.deliveryAreaLabel + ' <span style="color:var(--nonveg);">*</span>';
    var deliveryAreaInput = qs('#deliveryAreaInput'); if (deliveryAreaInput) deliveryAreaInput.placeholder = S.deliveryAreaPlaceholder;
    var deliveryPhoneLabel = qs('#deliveryPhoneLabel'); if (deliveryPhoneLabel) deliveryPhoneLabel.textContent = S.deliveryPhoneLabel;
    var deliveryPhoneInput = qs('#deliveryPhoneInput'); if (deliveryPhoneInput) deliveryPhoneInput.placeholder = S.deliveryPhonePlaceholder;
    var deliveryPhoneNote = qs('#deliveryPhoneNote'); if (deliveryPhoneNote) deliveryPhoneNote.textContent = S.deliveryPhoneNote;
    var deliverySubmitText = qs('#deliverySubmitText'); if (deliverySubmitText) deliverySubmitText.textContent = S.deliverySubmitText;
    var deliverySuccessTitle = qs('#deliverySuccessTitle'); if (deliverySuccessTitle) deliverySuccessTitle.textContent = S.deliverySuccessTitle;
    var deliverySuccessMsg = qs('#deliverySuccessMsg'); if (deliverySuccessMsg) deliverySuccessMsg.textContent = S.deliverySuccessMsg;
    var deliveryShareBtnText = qs('#deliveryShareBtnText'); if (deliveryShareBtnText) deliveryShareBtnText.textContent = S.deliveryShareBtnText;
    var deliveryDoneBtn = qs('#deliveryDoneBtn'); if (deliveryDoneBtn) deliveryDoneBtn.textContent = S.deliveryDoneText;
    if (typeof updateAllPlayersDisplays === 'function') updateAllPlayersDisplays(totalPlayers);
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
    btn.addEventListener('click', function(){
      var newLang = btn.dataset.lang;
      if (newLang !== currentLang){
        applyLanguage(newLang);
        trackEvent('lang_switch', newLang);
      }
    });
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
    var chipIcon = cat.image
      ? '<img class="chip-icon" src="' + esc(cat.image) + '" alt="" onerror="this.style.display=\'none\';if(this.nextElementSibling)this.nextElementSibling.style.display=\'inline-block\'"><span style="display:none">' + iconSvg(cat.icon) + '</span>'
      : iconSvg(cat.icon);
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
    var headIcon = cat.image
      ? '<img src="' + esc(cat.image) + '" alt="" loading="lazy" decoding="async" onerror="this.style.display=\'none\';if(this.nextElementSibling)this.nextElementSibling.style.display=\'inline-block\'"><span style="display:none">' + iconSvg(cat.icon) + '</span>'
      : iconSvg(cat.icon);
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

      var hasDiscount = item.strike != null && item.price !== null && Number(item.strike) > Number(item.price);
      var strikeLabel = hasDiscount ? '<span class="dish-strike">' + CUR + item.strike + '</span>' : '';
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
        var hasMatch = qsa('.dish').some(function(d){
          return (d.dataset.name || '').indexOf(lastTrackedQuery) !== -1;
        });
        if (!hasMatch){
          trackEvent('search_no_results', q);
        }
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
    if (item){
      if (item.photo || item.thumb) trackEvent('dish_zoom', item.name);
      if (ingredients && ingredients.length) trackEvent('dish_ingredients', item.name);
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
    trackEvent('rate_food_open', 'opened');
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
    var offersCloseBtn = qs('#offersCloseBtn');
    if (offersCloseBtn) offersCloseBtn.addEventListener('click', closeOffersDialog);
    var offersOkBtn = qs('#offersOkBtn');
    if (offersOkBtn) offersOkBtn.addEventListener('click', closeOffersDialog);
    var fabOffersBtn = qs('#fabOffersBtn');
    if (fabOffersBtn) fabOffersBtn.addEventListener('click', function(){ closeFab(); openOffersDialog(); trackEvent('offers_view', 'Special Offers'); });
  }
  var fabRatingBtn = qs('#fabRatingBtn');
  if (fabRatingBtn) fabRatingBtn.addEventListener('click', function(){ closeFab(); openRateDialog(); });
  var fabInstaBtn = qs('#fabInstaBtn');
  if (fabInstaBtn) fabInstaBtn.addEventListener('click', function(){ closeFab(); trackEvent('instagram_click', 'clicked'); });
  var fabYoutubeBtn = qs('#fabYoutubeBtn');
  if (fabYoutubeBtn) fabYoutubeBtn.addEventListener('click', function(){ closeFab(); trackEvent('youtube_click', 'fab'); });
  var youtubeLink = qs('#youtubeLink');
  if (youtubeLink) youtubeLink.addEventListener('click', function(){ trackEvent('youtube_click', 'topbar'); });
  var footerYoutubeBtn = qs('#footerYoutubeBtn');
  if (footerYoutubeBtn) footerYoutubeBtn.addEventListener('click', function(){ trackEvent('youtube_click', 'footer'); });
  var footerInstaBtn = qs('#footerInstaBtn');
  if (footerInstaBtn) footerInstaBtn.addEventListener('click', function(){ trackEvent('instagram_click', 'footer'); });

  var heroOfferDetailsBtn = qs('#heroOfferDetailsBtn');
  if (heroOfferDetailsBtn){
    heroOfferDetailsBtn.addEventListener('click', function(){
      openOffersDialog();
      trackEvent('offers_view', 'Top Banner Details');
    });
  }
  var instaBannerMedia = qs('#instaBannerMedia');
  if (instaBannerMedia){
    instaBannerMedia.addEventListener('click', function(){
      openOffersDialog();
      trackEvent('offers_view', 'Top Banner Media');
    });
  }
  var heroOfferFollowBtn = qs('#heroOfferFollowBtn');
  if (heroOfferFollowBtn){
    heroOfferFollowBtn.addEventListener('click', function(){
      trackEvent('instagram_click', 'top_banner');
    });
  }
  var offersModalInstaBtn = qs('#offersModalInstaBtn');
  if (offersModalInstaBtn){
    offersModalInstaBtn.addEventListener('click', function(){
      trackEvent('instagram_click', 'offers_modal');
    });
  }

  /* ---------- Feature 1: "While You Wait" Biryani Catcher Mini-Game ---------- */
  var gameDialog = qs('#gameDialog');
  var gameCard = qs('#gameCard');
  var gameCloseBtn = qs('#gameCloseBtn');
  var gameBtn = qs('#gameBtn');
  var fabGameBtn = qs('#fabGameBtn');
  var gameCanvas = qs('#gameCanvas');
  var gameCtx = gameCanvas ? gameCanvas.getContext('2d') : null;
  var gameOverOverlay = qs('#gameOverOverlay');
  var gameRestartBtn = qs('#gameRestartBtn');
  var gameScoreVal = qs('#gameScoreVal');
  var gameBestVal = qs('#gameBestVal');
  var gameLivesWrap = qs('#gameLivesWrap');
  var gameOverFinalScore = qs('#gameOverFinalScore');
  var gameOverBestScore = qs('#gameOverBestScore');
  var gameSoundToggle = qs('#gameSoundToggle');
  var gameLeftBtn = qs('#gameLeftBtn');
  var gameRightBtn = qs('#gameRightBtn');
  var heroGameLaunchStrip = qs('#heroGameLaunchStrip');
  var heroGamePlayBtn = qs('#heroGamePlayBtn');
  var gameShareScoreBtn = qs('#gameShareScoreBtn');

  var BEST_SCORE_KEY = 'navrang_biryani_catcher_best';
  var SOUND_KEY = 'navrang_biryani_catcher_sound';
  var TOTAL_PLAYERS_KEY = 'navrang_biryani_catcher_real_plays';

  var bestScore = 0;
  try {
    bestScore = parseInt(localStorage.getItem(BEST_SCORE_KEY), 10) || 0;
  } catch(e){}

  // Purge legacy mock player counter from previous test
  try {
    localStorage.removeItem('navrang_biryani_catcher_total_players');
  } catch(e){}

  var totalPlayers = 3;
  try {
    var storedPlayers = parseInt(localStorage.getItem(TOTAL_PLAYERS_KEY), 10);
    if (!isNaN(storedPlayers) && storedPlayers >= 0 && storedPlayers < 1000){
      totalPlayers = storedPlayers;
    } else {
      localStorage.setItem(TOTAL_PLAYERS_KEY, totalPlayers);
    }
  } catch(e){}

  function updateAllPlayersDisplays(count){
    var n = Math.max(0, parseInt(count, 10) || 0);
    var S = STRINGS[currentLang] || STRINGS.en;
    var formatted = n.toLocaleString('en-IN');
    var el1 = qs('#topPlayersCount'); if (el1) el1.textContent = formatted;
    var el1Lbl = qs('#topPlayersLabel'); if (el1Lbl) el1Lbl.textContent = S.playersSuffix || 'played';
    var el2 = qs('#gameTotalPlayersVal'); if (el2) el2.textContent = formatted;
    var el3 = qs('#gameOverPlayersCount'); if (el3) el3.textContent = formatted;
    var el3Lbl = qs('#gameOverPlayersLabel'); if (el3Lbl) el3Lbl.textContent = S.gameOverPlayersLabel || 'players have competed!';
  }
  updateAllPlayersDisplays(totalPlayers);

  function syncGamePlayToServer(){
    try {
      fetch('https://ratings-api-pink.vercel.app/api/game-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'play' })
      })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(data){
        if (data && typeof data.totalPlays === 'number' && data.totalPlays > totalPlayers){
          totalPlayers = data.totalPlays;
          try { localStorage.setItem(TOTAL_PLAYERS_KEY, totalPlayers); } catch(e){}
          updateAllPlayersDisplays(totalPlayers);
        }
      })
      .catch(function(){});
    } catch(e){}
  }

  function fetchRealPlayerCount(){
    fetch('game-stats.json?v=' + Date.now())
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(d){
        if (d && typeof d.totalPlays === 'number' && d.totalPlays > totalPlayers){
          totalPlayers = d.totalPlays;
          try { localStorage.setItem(TOTAL_PLAYERS_KEY, totalPlayers); } catch(e){}
          updateAllPlayersDisplays(totalPlayers);
        }
      })
      .catch(function(){});

    try {
      fetch('https://ratings-api-pink.vercel.app/api/game-stats')
        .then(function(r){ return r.ok ? r.json() : null; })
        .then(function(d){
          if (d && typeof d.totalPlays === 'number' && d.totalPlays > totalPlayers){
            totalPlayers = d.totalPlays;
            try { localStorage.setItem(TOTAL_PLAYERS_KEY, totalPlayers); } catch(e){}
            updateAllPlayersDisplays(totalPlayers);
          }
        })
        .catch(function(){});
    } catch(e){}
  }
  fetchRealPlayerCount();

  function recordGamePlayed(){
    totalPlayers++;
    try { localStorage.setItem(TOTAL_PLAYERS_KEY, totalPlayers); } catch(e){}
    updateAllPlayersDisplays(totalPlayers);
    if (typeof trackEvent === 'function') {
      trackEvent('game_play', String(bestScore || 1));
    }
    syncGamePlayToServer();
  }

  function updateAllBestScoreDisplays(score){
    var s = Math.max(0, parseInt(score, 10) || 0);
    var el1 = qs('#gameBestVal'); if (el1) el1.textContent = s;
    var el2 = qs('#heroBestScoreVal'); if (el2) el2.textContent = s;
    var el3 = qs('#topBestScoreVal'); if (el3) el3.textContent = s;
    var el4 = qs('#filterBestScoreVal'); if (el4) el4.textContent = s;
    var el5 = qs('#gameOverBestScore'); if (el5) el5.textContent = s;
  }
  updateAllBestScoreDisplays(bestScore);

  var isSoundMuted = false;
  try {
    isSoundMuted = localStorage.getItem(SOUND_KEY) === 'muted';
  } catch(e){}
  if (gameSoundToggle) gameSoundToggle.textContent = isSoundMuted ? '🔇' : '🔊';

  var audioCtx = null;
  function getGameAudioContext(){
    if (!audioCtx){
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    return audioCtx;
  }

  function unlockAudio(){
    try {
      var ctx = getGameAudioContext();
      if (ctx && ctx.state === 'suspended'){
        ctx.resume().catch(function(){});
      }
    } catch(e){}
  }

  function playSoundEffect(type, mult){
    if (isSoundMuted) return;
    try {
      var ctx = getGameAudioContext();
      if (!ctx || ctx.state !== 'running') return;
      var now = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'catch'){
        osc.type = 'sine';
        var baseFreq = 587 + Math.min(300, ((mult || 1) - 1) * 80);
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.1);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'combo'){
        osc.type = 'triangle';
        var freq = 520 + Math.min(650, (mult || 1) * 75);
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.45, now + 0.14);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.16);
      } else if (type === 'star'){
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.08);
        osc.frequency.setValueAtTime(784, now + 0.16);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'newrecord'){
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.08);
        osc.frequency.setValueAtTime(784, now + 0.16);
        osc.frequency.setValueAtTime(1046, now + 0.24);
        gain.gain.setValueAtTime(0.24, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
        osc.start(now);
        osc.stop(now + 0.38);
      } else if (type === 'chilli'){
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.18);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'gameover'){
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.35);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
        osc.start(now);
        osc.stop(now + 0.38);
      }
    } catch(e){}
  }

  // Food Item Types
  var FOOD_TYPES = [
    { type: 'biryani', emoji: '🍛', pts: 25, label: 'Royal Biryani', weight: 24, speedMult: 1 },
    { type: 'chicken', emoji: '🍗', pts: 10, label: 'Chicken Kebab', weight: 28, speedMult: 1.05 },
    { type: 'naan', emoji: '🫓', pts: 15, label: 'Butter Naan', weight: 20, speedMult: 0.95 },
    { type: 'samosa', emoji: '🥟', pts: 20, label: 'Samosa', weight: 16, speedMult: 1.1 },
    { type: 'sweet', emoji: '🍰', pts: 30, label: 'Gulab Jamun', weight: 12, speedMult: 1.15 },
    { type: 'star', emoji: '⭐', pts: 50, label: 'Chef Star', weight: 8, speedMult: 1.25 },
    { type: 'chilli', emoji: '🌶️', isHazard: true, label: 'Fiery Chilli', weight: 22, speedMult: 1.1 }
  ];

  var CANVAS_VIRTUAL_W = 340;
  var CANVAS_VIRTUAL_H = 380;

  var gameState = {
    running: false,
    score: 0,
    lives: 3,
    combo: 0,
    maxCombo: 0,
    potX: 170,
    potY: 340,
    potW: 68,
    potH: 34,
    potTilt: 0,
    screenShake: 0,
    embers: [],
    burstParticles: [],
    thrusterParticles: [],
    items: [],
    popups: [],
    animId: null,
    lastSpawn: 0,
    spawnInterval: 1000,
    baseSpeed: 2.2,
    moveLeft: false,
    moveRight: false,
    hasPassedPreviousBest: false
  };

  function initEmbers(){
    gameState.embers = [];
    for (var i = 0; i < 22; i++){
      gameState.embers.push({
        x: Math.random() * CANVAS_VIRTUAL_W,
        y: Math.random() * CANVAS_VIRTUAL_H,
        radius: Math.random() * 1.6 + 0.6,
        vy: Math.random() * 0.7 + 0.3,
        vx: (Math.random() - 0.5) * 0.35,
        alpha: Math.random() * 0.5 + 0.25,
        hue: Math.random() > 0.35 ? 42 : 18
      });
    }
  }

  function resizeGameCanvas(){
    if (!gameCanvas) return;
    var wrap = qs('#gameCanvasWrap');
    var rect = wrap ? wrap.getBoundingClientRect() : gameCanvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    
    if (rect.width > 0 && rect.height > 0){
      var aspect = rect.height / rect.width;
      CANVAS_VIRTUAL_H = Math.max(340, Math.min(460, Math.round(CANVAS_VIRTUAL_W * aspect)));
    } else {
      CANVAS_VIRTUAL_H = 380;
    }
    
    gameCanvas.width = Math.round(CANVAS_VIRTUAL_W * dpr);
    gameCanvas.height = Math.round(CANVAS_VIRTUAL_H * dpr);
    
    if (gameCtx){
      gameCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    gameState.potY = CANVAS_VIRTUAL_H - 34;
    gameState.potX = Math.max(gameState.potW / 2 + 4, Math.min(CANVAS_VIRTUAL_W - gameState.potW / 2 - 4, gameState.potX));
  }

  function updateLivesUI(){
    if (!gameLivesWrap) return;
    var hearts = '';
    for (var i = 0; i < 3; i++){
      hearts += i < gameState.lives ? '❤️ ' : '🖤 ';
    }
    gameLivesWrap.textContent = hearts.trim();
  }

  function resetGame(){
    resizeGameCanvas();
    gameState.score = 0;
    gameState.lives = 3;
    gameState.combo = 0;
    gameState.maxCombo = 0;
    gameState.items = [];
    gameState.popups = [];
    gameState.burstParticles = [];
    gameState.thrusterParticles = [];
    gameState.potTilt = 0;
    gameState.screenShake = 0;
    initEmbers();
    gameState.baseSpeed = 2.2;
    gameState.spawnInterval = 1000;
    gameState.lastSpawn = Date.now();
    gameState.hasPassedPreviousBest = false;
    gameState.potX = CANVAS_VIRTUAL_W / 2;
    gameState.potY = CANVAS_VIRTUAL_H - 34;
    if (gameScoreVal) gameScoreVal.textContent = '0';
    updateLivesUI();
    if (gameOverOverlay) gameOverOverlay.style.display = 'none';
    var newRecordBanner = qs('#newRecordBanner');
    if (newRecordBanner) newRecordBanner.style.display = 'none';
  }

  function spawnFoodItem(){
    if (!gameCanvas) return;
    var totalWeight = FOOD_TYPES.reduce(function(sum, f){ return sum + f.weight; }, 0);
    var rand = Math.random() * totalWeight;
    var chosen = FOOD_TYPES[0];
    for (var i = 0; i < FOOD_TYPES.length; i++){
      if (rand < FOOD_TYPES[i].weight){
        chosen = FOOD_TYPES[i];
        break;
      }
      rand -= FOOD_TYPES[i].weight;
    }

    var margin = 28;
    var x = margin + Math.random() * (CANVAS_VIRTUAL_W - margin * 2);
    gameState.items.push({
      x: x,
      y: -20,
      size: 26,
      type: chosen.type,
      emoji: chosen.emoji,
      pts: chosen.pts || 0,
      isHazard: !!chosen.isHazard,
      speed: (gameState.baseSpeed * (chosen.speedMult || 1)) + (Math.random() * 0.5 - 0.25),
      wobble: Math.random() * Math.PI * 2
    });
  }

  function spawnBurstParticles(x, y, isStar, customColor){
    var count = isStar ? 18 : 10;
    var defaultColor = isStar ? '#FFE082' : '#69F0AE';
    for (var k = 0; k < count; k++){
      var angle = Math.random() * Math.PI * 2;
      var speed = Math.random() * 3.8 + 1.2;
      gameState.burstParticles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        radius: Math.random() * 2.4 + 1.2,
        color: customColor || defaultColor,
        alpha: 1,
        decay: Math.random() * 0.035 + 0.035
      });
    }
  }

  function spawnThrusterSpark(x, y, dir){
    gameState.thrusterParticles.push({
      x: x,
      y: y,
      vx: (dir > 0 ? -1 : 1) * (Math.random() * 1.8 + 1.2),
      vy: Math.random() * 1.2 + 0.5,
      radius: Math.random() * 2 + 1,
      alpha: 0.9,
      decay: 0.07,
      color: Math.random() > 0.4 ? '#FFB300' : '#FF5722'
    });
  }

  function addScorePopup(text, x, y, color, isCombo){
    gameState.popups.push({
      text: text,
      x: x,
      y: y,
      alpha: 1,
      color: color || '#FFD700',
      isCombo: !!isCombo,
      vy: isCombo ? -1.6 : -1.2,
      scale: isCombo ? 1.25 : 1
    });
  }

  function triggerGameOver(){
    gameState.running = false;
    playSoundEffect('gameover');
    if (gameState.animId){
      cancelAnimationFrame(gameState.animId);
      gameState.animId = null;
    }
    var isNewRecord = (gameState.score > bestScore && gameState.score > 0);
    if (isNewRecord){
      bestScore = gameState.score;
      try { localStorage.setItem(BEST_SCORE_KEY, bestScore); } catch(e){}
      updateAllBestScoreDisplays(bestScore);
      playSoundEffect('newrecord');
      trackEvent('game_new_high_score', bestScore);
    }
    var newRecordBanner = qs('#newRecordBanner');
    if (newRecordBanner){
      newRecordBanner.style.display = isNewRecord ? 'block' : 'none';
    }
    if (gameOverFinalScore) gameOverFinalScore.textContent = gameState.score;
    if (gameOverBestScore) gameOverBestScore.textContent = bestScore;
    if (gameOverOverlay) gameOverOverlay.style.display = 'flex';
    trackEvent('game_finished', 'score_' + gameState.score);
  }

  function drawHandiPot(ctx, x, y, w, h, tilt){
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt || 0);

    // Steam wisps
    ctx.fillStyle = 'rgba(255, 255, 255, 0.48)';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    var steamOffset = Math.sin(Date.now() / 140) * 3.5;
    ctx.fillText('♨️', 0, -h / 2 - 4 + steamOffset);

    // Cyber / Golden Aura Glow
    ctx.shadowColor = '#FFD54F';
    ctx.shadowBlur = 9;

    // Handi Body (Golden burnished cauldron)
    var grad = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    grad.addColorStop(0, '#8E5A05');
    grad.addColorStop(0.2, '#D49B22');
    grad.addColorStop(0.5, '#FFF3B3');
    grad.addColorStop(0.8, '#D49B22');
    grad.addColorStop(1, '#6E4502');

    ctx.beginPath();
    ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#FFF1C2';
    ctx.stroke();

    // Handi Rim
    var rimGrad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, -h / 2);
    rimGrad.addColorStop(0, '#6E4502');
    rimGrad.addColorStop(0.5, '#FFF8D6');
    rimGrad.addColorStop(1, '#6E4502');
    ctx.beginPath();
    ctx.ellipse(0, -h / 2 + 2, w / 2 - 2, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = rimGrad;
    ctx.fill();

    // Side Handles
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = '#D49B22';
    // Left handle
    ctx.beginPath();
    ctx.arc(-w / 2 - 2, -2, 5, -Math.PI / 2, Math.PI / 2, true);
    ctx.stroke();
    // Right handle
    ctx.beginPath();
    ctx.arc(w / 2 + 2, -2, 5, -Math.PI / 2, Math.PI / 2, false);
    ctx.stroke();

    // Decorative Emerald Jewel Center
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#00E676';
    ctx.beginPath();
    ctx.arc(0, 2, 4.2, 0, Math.PI * 2);
    ctx.fillStyle = '#00C853';
    ctx.fill();
    ctx.strokeStyle = '#E8F5E9';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.restore();
  }

  function gameLoop(){
    if (!gameState.running || !gameCtx || !gameCanvas) return;
    var ctx = gameCtx;
    var W = CANVAS_VIRTUAL_W;
    var H = CANVAS_VIRTUAL_H;

    ctx.save();

    // Screen Shake effect on hazards
    if (gameState.screenShake > 0.1){
      var sx = (Math.random() - 0.5) * gameState.screenShake;
      var sy = (Math.random() - 0.5) * gameState.screenShake;
      ctx.translate(sx, sy);
      gameState.screenShake *= 0.85;
    }

    // Clear Background
    ctx.clearRect(0, 0, W, H);

    // Dynamic Deep Arcade Kitchen Gradient
    var bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#06170B');
    bgGrad.addColorStop(0.45, '#0B2412');
    bgGrad.addColorStop(1, '#041007');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Drifting Golden/Fire Embers
    for (var eIdx = 0; eIdx < gameState.embers.length; eIdx++){
      var em = gameState.embers[eIdx];
      em.y -= em.vy;
      em.x += em.vx + Math.sin(em.y * 0.04) * 0.3;
      if (em.y < -5){
        em.y = H + 5;
        em.x = Math.random() * W;
      }
      ctx.beginPath();
      ctx.arc(em.x, em.y, em.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'hsla(' + em.hue + ', 100%, 65%, ' + em.alpha + ')';
      ctx.fill();
    }

    // High-Tech Cyber Floor Grid Line
    ctx.strokeStyle = 'rgba(212, 155, 34, 0.45)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#D49B22';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(0, H - 24);
    ctx.lineTo(W, H - 24);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Movement & Banking Physics
    var moveSpeed = 5.4;
    var targetTilt = 0;
    if (gameState.moveLeft){
      gameState.potX = Math.max(gameState.potW / 2 + 6, gameState.potX - moveSpeed);
      targetTilt = -0.16;
      spawnThrusterSpark(gameState.potX + gameState.potW / 2 + 2, gameState.potY - 2, 1);
    }
    if (gameState.moveRight){
      gameState.potX = Math.min(W - gameState.potW / 2 - 6, gameState.potX + moveSpeed);
      targetTilt = 0.16;
      spawnThrusterSpark(gameState.potX - gameState.potW / 2 - 2, gameState.potY - 2, -1);
    }
    gameState.potTilt += (targetTilt - gameState.potTilt) * 0.22;

    // Draw Thruster Sparks
    for (var tIdx = gameState.thrusterParticles.length - 1; tIdx >= 0; tIdx--){
      var tp = gameState.thrusterParticles[tIdx];
      tp.x += tp.vx;
      tp.y += tp.vy;
      tp.alpha -= tp.decay;
      if (tp.alpha <= 0){
        gameState.thrusterParticles.splice(tIdx, 1);
        continue;
      }
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, tp.radius, 0, Math.PI * 2);
      ctx.fillStyle = tp.color;
      ctx.globalAlpha = tp.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Spawn items over time
    var now = Date.now();
    if (now - gameState.lastSpawn > gameState.spawnInterval){
      spawnFoodItem();
      gameState.lastSpawn = now;
      gameState.baseSpeed = Math.min(5.4, 2.2 + (gameState.score / 140));
      gameState.spawnInterval = Math.max(500, 1000 - (gameState.score * 3));
    }

    // Draw & Update Food Items
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var hitY = gameState.potY - gameState.potH / 2;

    for (var i = gameState.items.length - 1; i >= 0; i--){
      var it = gameState.items[i];
      it.y += it.speed;
      it.wobble += 0.05;
      var currentX = it.x + Math.sin(it.wobble) * 4;

      // Draw Emoji with subtle glow
      ctx.font = it.size + 'px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      ctx.fillText(it.emoji, currentX, it.y);

      // Check Catch Collision with Handi
      var inX = Math.abs(currentX - gameState.potX) < (gameState.potW / 2 + 10);
      var inY = (it.y >= hitY - 14) && (it.y <= hitY + 18);

      if (inX && inY){
        if (it.isHazard){
          gameState.lives--;
          gameState.combo = 0;
          updateLivesUI();
          playSoundEffect('chilli');
          gameState.screenShake = 12;
          spawnBurstParticles(gameState.potX, hitY, false, '#FF1744');
          addScorePopup('-1 ❤️', gameState.potX, hitY - 12, '#FF1744', true);
          if (gameState.lives <= 0){
            ctx.restore();
            triggerGameOver();
            return;
          }
        } else {
          gameState.combo++;
          if (gameState.combo > gameState.maxCombo) gameState.maxCombo = gameState.combo;

          var mult = 1;
          var comboLabel = '';
          var comboColor = '#FFE082';
          if (gameState.combo >= 10){
            mult = 3; comboLabel = '👑 3x ROYAL CHEF!'; comboColor = '#FF1744';
          } else if (gameState.combo >= 6){
            mult = 2.5; comboLabel = '⚡ 2.5x MEGA STREAK!'; comboColor = '#00E5FF';
          } else if (gameState.combo >= 4){
            mult = 2; comboLabel = '🔥 2x COMBO!'; comboColor = '#FF9100';
          } else if (gameState.combo >= 2){
            mult = 1.5; comboLabel = '✨ 1.5x STREAK!'; comboColor = '#FFEA00';
          }

          var earnedPts = Math.round(it.pts * mult);
          gameState.score += earnedPts;
          if (gameScoreVal) gameScoreVal.textContent = gameState.score;
          
          spawnBurstParticles(currentX, hitY, it.type === 'star');

          if (bestScore > 0 && gameState.score > bestScore && !gameState.hasPassedPreviousBest){
            gameState.hasPassedPreviousBest = true;
            addScorePopup('🎉 NEW BEST!', gameState.potX, hitY - 26, '#FFE082', true);
            playSoundEffect('newrecord');
          } else if (comboLabel && (gameState.combo === 2 || gameState.combo === 4 || gameState.combo === 6 || gameState.combo === 10)){
            addScorePopup(comboLabel, currentX, hitY - 26, comboColor, true);
            playSoundEffect('combo', mult);
          } else if (it.type === 'star'){
            playSoundEffect('star');
            addScorePopup('+' + earnedPts, currentX, hitY - 10, '#FFF59D');
          } else {
            playSoundEffect('catch', mult);
            addScorePopup('+' + earnedPts, currentX, hitY - 10, '#69F0AE');
          }
        }
        gameState.items.splice(i, 1);
        continue;
      }

      if (it.y > H - 10){
        gameState.items.splice(i, 1);
      }
    }

    // Draw Player Handi Pot with Dynamic Banking Tilt
    drawHandiPot(ctx, gameState.potX, gameState.potY, gameState.potW, gameState.potH, gameState.potTilt);

    // Draw Burst Particles
    for (var bIdx = gameState.burstParticles.length - 1; bIdx >= 0; bIdx--){
      var bp = gameState.burstParticles[bIdx];
      bp.x += bp.vx;
      bp.y += bp.vy;
      bp.alpha -= bp.decay;
      if (bp.alpha <= 0){
        gameState.burstParticles.splice(bIdx, 1);
        continue;
      }
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, bp.radius, 0, Math.PI * 2);
      ctx.fillStyle = bp.color;
      ctx.globalAlpha = bp.alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Draw Floating Combo HUD Badge in top right
    if (gameState.combo >= 2){
      ctx.save();
      ctx.textAlign = 'right';
      ctx.font = 'bold 12px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#FFE082';
      ctx.shadowColor = '#FF9100';
      ctx.shadowBlur = 6;
      ctx.fillText('🔥 STREAK x' + gameState.combo, W - 14, 22);
      ctx.restore();
    }

    // Draw & Update Score Popups with Arcade Outlined Typography
    for (var p = gameState.popups.length - 1; p >= 0; p--){
      var pop = gameState.popups[p];
      pop.y += pop.vy;
      pop.alpha -= 0.024;
      if (pop.alpha <= 0){
        gameState.popups.splice(p, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = pop.alpha;
      ctx.font = pop.isCombo ? '900 14px "Karla", sans-serif' : '800 13px "IBM Plex Mono", monospace';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.strokeText(pop.text, pop.x, pop.y);
      ctx.fillStyle = pop.color;
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.restore();
    }

    ctx.restore();
    gameState.animId = requestAnimationFrame(gameLoop);
  }

  function startGame(){
    resetGame();
    recordGamePlayed();
    gameState.running = true;
    if (gameState.animId) cancelAnimationFrame(gameState.animId);
    gameState.animId = requestAnimationFrame(gameLoop);
    trackEvent('game_started', 'biryani_catcher');
  }

  function pauseGame(){
    gameState.running = false;
    if (gameState.animId){
      cancelAnimationFrame(gameState.animId);
      gameState.animId = null;
    }
  }

  function openGameDialog(){
    if (!gameDialog) return;
    unlockAudio();
    gameDialog.classList.add('show');
    gameDialog.setAttribute('aria-hidden', 'false');
    // Ensure canvas dimensions adapt to mobile screen
    setTimeout(function(){
      resizeGameCanvas();
      startGame();
    }, 60);
  }

  function closeGameDialog(){
    if (!gameDialog) return;
    gameDialog.classList.remove('show');
    gameDialog.setAttribute('aria-hidden', 'true');
    pauseGame();
  }

  if (gameDialog){
    gameDialog.addEventListener('click', closeGameDialog);
    if (gameCard) gameCard.addEventListener('click', function(e){ e.stopPropagation(); });
    if (gameCloseBtn) gameCloseBtn.addEventListener('click', closeGameDialog);
    if (gameBtn) gameBtn.addEventListener('click', function(){ unlockAudio(); openGameDialog(); });
    if (fabGameBtn) fabGameBtn.addEventListener('click', function(){ closeFab(); unlockAudio(); openGameDialog(); });
    if (gameRestartBtn) gameRestartBtn.addEventListener('click', function(){ unlockAudio(); startGame(); });

    if (heroGameLaunchStrip){
      heroGameLaunchStrip.addEventListener('click', function(){
        unlockAudio();
        openGameDialog();
        trackEvent('game_open', 'hero_launch_strip');
      });
    }
    if (heroGamePlayBtn){
      heroGamePlayBtn.addEventListener('click', function(e){
        e.stopPropagation();
        unlockAudio();
        openGameDialog();
        trackEvent('game_open', 'hero_play_btn');
      });
    }

    if (gameShareScoreBtn){
      gameShareScoreBtn.addEventListener('click', function(){
        var tmpl = S.gameShareToast || '🏆 High Score: {score} pts! Show your screen to your table or waiter!';
        var msg = tmpl.replace('{score}', bestScore);
        showToast(msg);
        trackEvent('game_show_waiter', bestScore);
      });
    }

    if (gameSoundToggle){
      gameSoundToggle.addEventListener('click', function(){
        isSoundMuted = !isSoundMuted;
        gameSoundToggle.textContent = isSoundMuted ? '🔇' : '🔊';
        if (!isSoundMuted) unlockAudio();
        try { localStorage.setItem(SOUND_KEY, isSoundMuted ? 'muted' : 'unmuted'); } catch(e){}
      });
    }

    function updatePotFromClientX(clientX){
      if (!gameCanvas) return;
      var rect = gameCanvas.getBoundingClientRect();
      if (rect.width <= 0) return;
      var scaleX = CANVAS_VIRTUAL_W / rect.width;
      var x = (clientX - rect.left) * scaleX;
      gameState.potX = Math.max(gameState.potW / 2 + 4, Math.min(CANVAS_VIRTUAL_W - gameState.potW / 2 - 4, x));
    }

    function stepMove(dir){
      var step = 38;
      if (dir === 'left'){
        gameState.potX = Math.max(gameState.potW / 2 + 6, gameState.potX - step);
      } else {
        gameState.potX = Math.min(CANVAS_VIRTUAL_W - gameState.potW / 2 - 6, gameState.potX + step);
      }
    }

    if (gameCanvas){
      var onTouch = function(e){
        if (!gameState.running) return;
        var touch = (e.touches && e.touches.length > 0) ? e.touches[0] : (e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0] : e);
        if (touch && typeof touch.clientX === 'number'){
          updatePotFromClientX(touch.clientX);
        }
        if (e.cancelable) e.preventDefault();
      };
      gameCanvas.addEventListener('touchstart', onTouch, { passive: false });
      gameCanvas.addEventListener('touchmove', onTouch, { passive: false });
      gameCanvas.addEventListener('pointerdown', function(e){
        if (!gameState.running) return;
        updatePotFromClientX(e.clientX);
        if (e.cancelable) e.preventDefault();
      });
      gameCanvas.addEventListener('pointermove', function(e){
        if (!gameState.running) return;
        if (e.buttons === 1 || e.pointerType === 'touch'){
          updatePotFromClientX(e.clientX);
        }
      });
    }

    if (gameLeftBtn){
      var lInterval = null;
      var startL = function(e){
        unlockAudio();
        stepMove('left');
        gameState.moveLeft = true;
        if (lInterval) clearInterval(lInterval);
        lInterval = setInterval(function(){
          if (gameState.moveLeft) gameState.potX = Math.max(gameState.potW / 2 + 6, gameState.potX - 6);
        }, 25);
        if (e && e.cancelable) e.preventDefault();
      };
      var stopL = function(){
        gameState.moveLeft = false;
        if (lInterval){ clearInterval(lInterval); lInterval = null; }
      };
      gameLeftBtn.addEventListener('pointerdown', startL);
      gameLeftBtn.addEventListener('pointerup', stopL);
      gameLeftBtn.addEventListener('pointerleave', stopL);
      gameLeftBtn.addEventListener('pointercancel', stopL);
      gameLeftBtn.addEventListener('touchstart', startL, { passive: false });
      gameLeftBtn.addEventListener('touchend', stopL);
      gameLeftBtn.addEventListener('touchcancel', stopL);
    }

    if (gameRightBtn){
      var rInterval = null;
      var startR = function(e){
        unlockAudio();
        stepMove('right');
        gameState.moveRight = true;
        if (rInterval) clearInterval(rInterval);
        rInterval = setInterval(function(){
          if (gameState.moveRight) gameState.potX = Math.min(CANVAS_VIRTUAL_W - gameState.potW / 2 - 6, gameState.potX + 6);
        }, 25);
        if (e && e.cancelable) e.preventDefault();
      };
      var stopR = function(){
        gameState.moveRight = false;
        if (rInterval){ clearInterval(rInterval); rInterval = null; }
      };
      gameRightBtn.addEventListener('pointerdown', startR);
      gameRightBtn.addEventListener('pointerup', stopR);
      gameRightBtn.addEventListener('pointerleave', stopR);
      gameRightBtn.addEventListener('pointercancel', stopR);
      gameRightBtn.addEventListener('touchstart', startR, { passive: false });
      gameRightBtn.addEventListener('touchend', stopR);
      gameRightBtn.addEventListener('touchcancel', stopR);
    }

    window.addEventListener('keydown', function(e){
      if (!gameState.running) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A'){
        gameState.moveLeft = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D'){
        gameState.moveRight = true;
      }
    });
    window.addEventListener('keyup', function(e){
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A'){
        gameState.moveLeft = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D'){
        gameState.moveRight = false;
      }
    });

    window.addEventListener('resize', function(){
      if (gameState.running){
        resizeGameCanvas();
      }
    });
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
    img.src = 'navrang_logo_sm.png';
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

  /* ---------- Home Delivery Demand Survey Controller ---------- */
  var DELIVERY_STORAGE_KEY = 'navrang_delivery_voted';
  var DELIVERY_API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? '/api/delivery-interest'
    : 'https://ratings-api-pink.vercel.app/api/delivery-interest';

  function getDeliveryDeviceId(){
    var id = localStorage.getItem('navrang-device-id');
    if (!id){
      id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9);
      localStorage.setItem('navrang-device-id', id);
    }
    return id;
  }

  function getStoredDeliveryVote(){
    try {
      var raw = localStorage.getItem(DELIVERY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  var currentDeliveryCount = 0;
  function animateCounter(el, targetVal){
    if (!el) return;
    var startVal = parseInt(el.textContent, 10) || 0;
    if (isNaN(startVal)) startVal = 0;
    if (startVal === targetVal){ el.textContent = targetVal; return; }
    var diff = targetVal - startVal;
    var duration = 800;
    var startTime = performance.now();

    function step(now){
      var progress = Math.min((now - startTime) / duration, 1);
      var ease = 1 - Math.pow(1 - progress, 3);
      var current = Math.round(startVal + diff * ease);
      el.textContent = current;
      if (progress < 1){
        requestAnimationFrame(step);
      } else {
        el.textContent = targetVal;
      }
    }
    requestAnimationFrame(step);
  }

  function updateDeliveryDisplays(count){
    if (typeof count === 'number' && !isNaN(count)){
      currentDeliveryCount = count;
      var elCard = qs('#deliveryUniqueCount');
      var elModal = qs('#modalDeliveryCount');
      if (elCard) animateCounter(elCard, count);
      if (elModal) animateCounter(elModal, count);
    }
  }

  function initDeliverySurvey(){
    var deliveryModal = qs('#deliveryModal');
    var deliveryModalCard = qs('#deliveryModalCard');
    var deliveryModalClose = qs('#deliveryModalClose');
    var deliveryVoteBtn = qs('#deliveryVoteBtn');
    var deliveryVotedPill = qs('#deliveryVotedPill');
    var fabDeliveryBtn = qs('#fabDeliveryBtn');
    var formView = qs('#deliveryFormView');
    var successView = qs('#deliverySuccessView');
    var areaInput = qs('#deliveryAreaInput');
    var phoneInput = qs('#deliveryPhoneInput');
    var submitBtn = qs('#deliverySubmitBtn');
    var submitText = qs('#deliverySubmitText');
    var doneBtn = qs('#deliveryDoneBtn');
    var shareBtn = qs('#deliveryShareBtn');
    var areaChips = qsa('.area-chip', qs('#deliveryAreaChips'));

    var storedVote = getStoredDeliveryVote();
    if (storedVote){
      if (deliveryVotedPill) deliveryVotedPill.style.display = 'inline-flex';
      var voteBtnText = qs('#deliveryVoteBtnText');
      if (voteBtnText) voteBtnText.textContent = (currentLang === 'te') ? 'మీ ఓటు వివరాలు చూడండి' : 'View Your Registered Area';
    }

    // Fetch live unique vote count from API, fallback to JSON
    fetch(DELIVERY_API_URL)
      .then(function(res){
        if (!res.ok) throw new Error('API offline');
        return res.json();
      })
      .then(function(data){
        if (data && typeof data.uniqueCount === 'number'){
          updateDeliveryDisplays(data.uniqueCount);
        }
      })
      .catch(function(){
        fetch('delivery-interest.json')
          .then(function(r){ return r.json(); })
          .then(function(fallback){
            if (fallback && typeof fallback.uniqueCount === 'number'){
              updateDeliveryDisplays(fallback.uniqueCount);
            }
          })
          .catch(function(){});
      });

    function setupWhatsAppShare(area){
      if (!shareBtn) return;
      var currentArea = area || (storedVote ? storedVote.area : 'my area');
      var textEn = '🛵 I just voted for Navrang Restaurant Home Delivery in ' + currentArea + '! 🍛 Support our colony so they start home delivery directly to our area: ' + window.location.href;
      var textTe = '🛵 నవరంగ్ రెస్టారెంట్ హోమ్ డెలివరీ కోసం నేను ' + currentArea + ' కు ఓటు వేశాను! 🍛 మన ఏరియాలో డెలివరీ త్వరగా ప్రారంభం కావడానికి మీరు కూడా ఓటు వేయండి: ' + window.location.href;
      var shareText = currentLang === 'te' ? textTe : textEn;
      shareBtn.href = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(shareText);
    }

    function openDeliveryModal(){
      if (!deliveryModal) return;
      storedVote = getStoredDeliveryVote();
      if (storedVote && storedVote.area){
        // Show success view directly with user's registered area
        if (formView) formView.style.display = 'none';
        if (successView) successView.style.display = 'block';
        var successDesc = qs('#deliverySuccessMsg');
        if (successDesc){
          successDesc.textContent = (currentLang === 'te')
            ? 'మీ ఏరియా (' + storedVote.area + ') కోసం మీ ఓటు నమోదైంది! డెలివరీ ప్రారంభమైన వెంటనే మీ ఇంటికే వేడి వేడి ఆహారాన్ని అందిస్తాం.'
            : 'Your vote for ' + storedVote.area + ' is recorded! When home delivery routes open, we will deliver steaming hot food right to your doorstep.';
        }
        setupWhatsAppShare(storedVote.area);
      } else {
        if (formView) formView.style.display = 'block';
        if (successView) successView.style.display = 'none';
        setTimeout(function(){
          if (areaInput) areaInput.focus();
        }, 120);
      }
      deliveryModal.classList.add('show');
      deliveryModal.setAttribute('aria-hidden', 'false');
      trackEvent('delivery_interest', 'modal_opened');
    }

    function closeDeliveryModal(){
      if (!deliveryModal) return;
      deliveryModal.classList.remove('show');
      deliveryModal.setAttribute('aria-hidden', 'true');
    }

    if (deliveryVoteBtn) deliveryVoteBtn.addEventListener('click', openDeliveryModal);
    if (deliveryVotedPill) deliveryVotedPill.addEventListener('click', openDeliveryModal);
    if (fabDeliveryBtn) fabDeliveryBtn.addEventListener('click', function(){
      if (typeof closeFab === 'function') closeFab();
      openDeliveryModal();
    });
    if (deliveryModalClose) deliveryModalClose.addEventListener('click', closeDeliveryModal);
    if (doneBtn) doneBtn.addEventListener('click', closeDeliveryModal);

    if (deliveryModal){
      deliveryModal.addEventListener('click', closeDeliveryModal);
      if (deliveryModalCard){
        deliveryModalCard.addEventListener('click', function(e){ e.stopPropagation(); });
      }
    }

    if (areaInput){
      areaInput.addEventListener('input', function(){
        areaInput.classList.remove('input-err');
      });
    }

    // Form submission
    if (submitBtn){
      submitBtn.addEventListener('click', function(){
        var areaVal = (areaInput ? areaInput.value : '').trim();
        var S = STRINGS[currentLang] || STRINGS.en;

        if (!areaVal){
          if (areaInput){
            areaInput.classList.add('input-err');
            areaInput.focus();
          }
          alert(S.deliveryErrArea);
          return;
        }

        var phoneVal = (phoneInput ? phoneInput.value : '').trim().replace(/[^0-9+]/g, '');

        var origBtnText = submitText ? submitText.innerHTML : '';
        submitBtn.disabled = true;
        if (submitText) submitText.textContent = S.deliverySubmitting;

        var payload = {
          deviceId: getDeliveryDeviceId(),
          sessionId: getSessionId(),
          area: areaVal,
          phone: phoneVal,
          lang: currentLang
        };

        function onVoteSaved(newCount){
          submitBtn.disabled = false;
          if (submitText) submitText.innerHTML = origBtnText;

          var voteData = { area: areaVal, phone: phoneVal, timestamp: Date.now() };
          localStorage.setItem(DELIVERY_STORAGE_KEY, JSON.stringify(voteData));
          storedVote = voteData;

          if (deliveryVotedPill) deliveryVotedPill.style.display = 'inline-flex';
          var voteBtnText = qs('#deliveryVoteBtnText');
          if (voteBtnText) voteBtnText.textContent = (currentLang === 'te') ? 'మీ ఓటు వివరాలు చూడండి' : 'View Your Registered Area';

          if (typeof newCount === 'number') updateDeliveryDisplays(newCount);
          else updateDeliveryDisplays(currentDeliveryCount + 1);

          setupWhatsAppShare(areaVal);

          if (formView) formView.style.display = 'none';
          if (successView) successView.style.display = 'block';

          trackEvent('delivery_vote', areaVal + (phoneVal ? '_ph' : ''));
        }

        fetch(DELIVERY_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        .then(function(r){ return r.json(); })
        .then(function(res){
          var count = (res && typeof res.uniqueCount === 'number') ? res.uniqueCount : undefined;
          onVoteSaved(count);
        })
        .catch(function(){
          // Graceful fallback: record locally even if offline/network error
          onVoteSaved();
        });
      });
    }
  }

  initDeliverySurvey();

  /* ---------- Dismiss Splash Screen once App is Ready ---------- */
  if (typeof window.__dismissSplash === 'function'){
    window.__dismissSplash();
  }
})();
