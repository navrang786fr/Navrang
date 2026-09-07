/* ==========================================================================
   NAVRANG RESTAURANT — POS REAL-TIME SYNC CLIENT (pos-sync.js)
   Synchronizes table orders and waiter bills between floor mobile devices
   and the counter billing station via local REST API + BroadcastChannel.
   ========================================================================== */

(function (window) {
  'use strict';

  var API_ENDPOINT = '/api/pos/orders';
  var STORAGE_KEY = 'navrang_pos_sync_orders';
  var MUTE_KEY = 'navrang_pos_chime_muted';
  var POLL_INTERVAL = 2500; // 2.5 seconds

  var ordersCache = [];
  var lastKnownSubmittedIds = new Set();
  var listeners = [];
  var pollTimer = null;
  var isApiAvailable = true;
  var bc = null;

  try {
    if ('BroadcastChannel' in window) {
      bc = new BroadcastChannel('navrang_pos_sync_bc');
      bc.onmessage = function (ev) {
        if (ev.data && ev.data.type === 'SYNC') {
          syncFromPayload(ev.data.orders, false);
        }
      };
    }
  } catch (e) {}

  // Load initial cache from localStorage
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      ordersCache = JSON.parse(raw);
      ordersCache.forEach(function (o) {
        if (o.status === 'submitted_to_counter') lastKnownSubmittedIds.add(o.id);
      });
    }
  } catch (e) {}

  // Native Web Audio API Chime (Two-tone pleasant POS Service Ding-Dong)
  var audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      var AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(function () {});
    }
    return audioCtx;
  }

  function playChime() {
    if (isMuted()) return;
    try {
      var ctx = getAudioContext();
      if (!ctx) return;

      var now = ctx.currentTime;
      // Tone 1: 659.25Hz (E5)
      var osc1 = ctx.createOscillator();
      var gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.28, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Tone 2: 880Hz (A5) slightly delayed
      var osc2 = ctx.createOscillator();
      var gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.32, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.6);
    } catch (e) {}
  }

  function isMuted() {
    return localStorage.getItem(MUTE_KEY) === 'true';
  }

  function setMuted(muted) {
    localStorage.setItem(MUTE_KEY, muted ? 'true' : 'false');
  }

  function notifyListeners() {
    var copy = ordersCache.slice();
    listeners.forEach(function (fn) {
      try { fn(copy); } catch (e) { console.error('PosSync listener err:', e); }
    });
  }

  function syncFromPayload(newOrders, broadcast) {
    if (!Array.isArray(newOrders)) return;

    // Detect newly submitted bills to trigger counter chime
    var hasNewSubmitted = false;
    newOrders.forEach(function (o) {
      if (o.status === 'submitted_to_counter' && !lastKnownSubmittedIds.has(o.id)) {
        hasNewSubmitted = true;
        lastKnownSubmittedIds.add(o.id);
      }
    });

    ordersCache = newOrders;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ordersCache));
    } catch (e) {}

    if (hasNewSubmitted) {
      // If user is counter or admin, ring chime
      if (window.AdminShared && (AdminShared.isCounter() || AdminShared.isAdmin())) {
        playChime();
      }
    }

    if (broadcast && bc) {
      try {
        bc.postMessage({ type: 'SYNC', orders: ordersCache });
      } catch (e) {}
    }

    notifyListeners();
  }

  // Fetch orders from API or local fallback
  function fetchOrders(cb) {
    if (!isApiAvailable) {
      if (cb) cb(null, ordersCache);
      return;
    }

    fetch(API_ENDPOINT, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (data && data.success && Array.isArray(data.orders)) {
          syncFromPayload(data.orders, true);
          if (cb) cb(null, data.orders);
        } else {
          if (cb) cb(null, ordersCache);
        }
      })
      .catch(function (err) {
        // Fallback gracefully to cache
        if (cb) cb(null, ordersCache);
      });
  }

  // Create or update table order
  function submitOrder(orderData, cb) {
    var nowIso = new Date().toISOString();
    var nowMs = Date.now();
    var payload = Object.assign({
      id: orderData.id || ('ord_' + nowMs + '_' + Math.random().toString(36).substr(2, 6)),
      status: 'submitted_to_counter',
      submittedAt: nowIso,
      updatedAt: nowIso,
      updatedAtMs: nowMs
    }, orderData);

    // Optimistic local update
    var existingIdx = ordersCache.findIndex(function (o) {
      return o.id === payload.id || (o.table === payload.table && o.status === 'submitted_to_counter');
    });
    if (existingIdx >= 0) {
      ordersCache[existingIdx] = Object.assign({}, ordersCache[existingIdx], payload);
    } else {
      ordersCache.unshift(payload);
    }
    syncFromPayload(ordersCache, true);

    // Network POST
    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (res) { return res.json(); })
      .then(function (resData) {
        if (resData && resData.order) {
          // Update cache with server-sanctioned record
          var idx = ordersCache.findIndex(function (o) { return o.id === resData.order.id; });
          if (idx >= 0) ordersCache[idx] = resData.order;
          syncFromPayload(ordersCache, true);
          if (cb) cb(null, resData.order);
        } else {
          if (cb) cb(null, payload);
        }
      })
      .catch(function (err) {
        // Optimistic offline success
        if (cb) cb(null, payload);
      });
  }

  // Update order status or patch
  function updateOrder(orderId, patchData, cb) {
    var idx = ordersCache.findIndex(function (o) { return o.id === orderId; });
    if (idx >= 0) {
      ordersCache[idx] = Object.assign({}, ordersCache[idx], patchData, {
        updatedAt: new Date().toISOString(),
        updatedAtMs: Date.now()
      });
      syncFromPayload(ordersCache, true);
    }

    fetch(API_ENDPOINT + '/' + encodeURIComponent(orderId), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patchData)
    })
      .then(function (res) { return res.json(); })
      .then(function (resData) {
        if (cb) cb(null, resData.order || ordersCache[idx]);
      })
      .catch(function (err) {
        if (cb) cb(null, ordersCache[idx]);
      });
  }

  // Complete & mark bill as paid
  function completeOrder(orderId, billDetails, cb) {
    var patch = {
      status: 'completed',
      billNo: billDetails.billNo,
      paymentMode: billDetails.paymentMode,
      cashier: billDetails.cashier || (window.AdminShared ? AdminShared.getUsername() : 'Counter'),
      billedAt: new Date().toISOString()
    };
    updateOrder(orderId, patch, cb);
  }

  // Delete / cancel an order
  function deleteOrder(orderId, cb) {
    ordersCache = ordersCache.filter(function (o) { return o.id !== orderId; });
    syncFromPayload(ordersCache, true);

    fetch(API_ENDPOINT + '/' + encodeURIComponent(orderId), {
      method: 'DELETE'
    })
      .then(function (res) { return res.json(); })
      .then(function (d) { if (cb) cb(null, d); })
      .catch(function (err) { if (cb) cb(null, { success: true }); });
  }

  // Start polling
  function startPolling() {
    if (pollTimer) return;
    fetchOrders();
    pollTimer = setInterval(function () {
      fetchOrders();
    }, POLL_INTERVAL);
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  // Helpers
  function getPendingBills() {
    return ordersCache.filter(function (o) {
      return o.status === 'submitted_to_counter';
    });
  }

  function getTableOrder(tableName) {
    return ordersCache.find(function (o) {
      return o.table === tableName && (o.status === 'submitted_to_counter' || o.status === 'active');
    });
  }

  function onOrders(fn) {
    if (typeof fn === 'function') {
      listeners.push(fn);
      fn(ordersCache.slice());
    }
    return function () {
      listeners = listeners.filter(function (l) { return l !== fn; });
    };
  }

  // Auto-start polling on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startPolling);
  } else {
    startPolling();
  }

  window.PosSync = {
    fetchOrders: fetchOrders,
    submitOrder: submitOrder,
    updateOrder: updateOrder,
    completeOrder: completeOrder,
    deleteOrder: deleteOrder,
    getPendingBills: getPendingBills,
    getTableOrder: getTableOrder,
    onOrders: onOrders,
    playChime: playChime,
    isMuted: isMuted,
    setMuted: setMuted,
    startPolling: startPolling,
    stopPolling: stopPolling
  };

})(window);
