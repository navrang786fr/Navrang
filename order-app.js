(function(){
  "use strict";

  var THEMES = ['classic','emerald','royal','charcoal'];
  var CART_KEY = 'navarang-cart';
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
    applyTheme(THEMES.indexOf(stored) !== -1 ? stored : 'classic');
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

  function setTable(val){
    currentTable = val || '';
    if (currentTable) localStorage.setItem(TABLE_KEY, currentTable);
    else localStorage.removeItem(TABLE_KEY);
    renderTablePill();
    var input = qs('#tableInput');
    if (input && input.value !== currentTable) input.value = currentTable;
    updatePlaceButtonState();
  }
  function renderTablePill(){
    var pill = qs('#tablePill'), text = qs('#tablePillText');
    if (!pill) return;
    if (currentTable){
      pill.hidden = false;
      text.textContent = 'Table ' + currentTable;
    } else {
      pill.hidden = true;
    }
  }

  /* ---------- Cart state ---------- */
  var cart = {};
  (function loadCart(){
    try {
      var raw = localStorage.getItem(CART_KEY);
      if (raw) cart = JSON.parse(raw) || {};
    } catch(e){ cart = {}; }
  })();
  function saveCart(){
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }
  function slugify(s){
    return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  }
  function cartId(catId, name){ return catId + '__' + slugify(name); }
  function cartCount(){
    var n = 0;
    for (var k in cart) n += cart[k].qty;
    return n;
  }
  function cartTotal(){
    var t = 0;
    for (var k in cart) t += (cart[k].price||0) * cart[k].qty;
    return t;
  }

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
      var id = cartId(cat.id, item.name);
      var row = document.createElement('div');
      row.className = 'dish';
      row.dataset.id = id;
      row.dataset.name = item.name.toLowerCase();
      row.dataset.veg = item.veg ? '1' : '0';

      var priceLabel = item.price === null ? '<span class="no-price">Ask staff</span>' : (CUR + item.price);

      row.innerHTML =
        '<span class="dot ' + (item.veg ? 'veg' : 'nonveg') + '"></span>' +
        '<span class="dish-info"><span class="dish-name">' + item.name + '</span>' +
        '<div class="dish-price">' + priceLabel + '</div></span>' +
        '<span class="dish-control"></span>';

      var control = row.querySelector('.dish-control');
      renderDishControl(control, id, cat.id, item);

      section.appendChild(row);
    });

    menuContent.appendChild(section);
  });

  function renderDishControl(control, id, catId, item){
    var qty = cart[id] ? cart[id].qty : 0;
    if (item.price === null){
      control.innerHTML = '';
      return;
    }
    if (qty <= 0){
      control.innerHTML = '<button class="qty-add" type="button">ADD</button>';
      control.querySelector('.qty-add').addEventListener('click', function(){
        changeQty(id, catId, item, 1);
      });
    } else {
      control.innerHTML =
        '<span class="qty-stepper">' +
          '<button type="button" data-d="-1">−</button>' +
          '<span class="qn">' + qty + '</span>' +
          '<button type="button" data-d="1">+</button>' +
        '</span>';
      qsa('button', control).forEach(function(btn){
        btn.addEventListener('click', function(){
          changeQty(id, catId, item, parseInt(btn.dataset.d, 10));
        });
      });
    }
  }

  function changeQty(id, catId, item, delta){
    var entry = cart[id];
    var newQty = (entry ? entry.qty : 0) + delta;
    if (newQty <= 0){
      delete cart[id];
    } else {
      cart[id] = { catId: catId, name: item.name, price: item.price, veg: item.veg, qty: newQty };
    }
    saveCart();
    var row = qs('.dish[data-id="' + id + '"]');
    if (row) renderDishControl(row.querySelector('.dish-control'), id, catId, item);
    renderCartBar();
    renderDrawerBody();
    updatePlaceButtonState();
  }

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

  /* ---------- Cart bar ---------- */
  var cartBar = qs('#cartBar');
  function renderCartBar(){
    var count = cartCount();
    qs('#cbCount').textContent = count + (count === 1 ? ' item' : ' items');
    qs('#cbTotal').textContent = CUR + cartTotal();
    cartBar.classList.toggle('show', count > 0);
  }

  /* ---------- Drawer ---------- */
  var backdrop = qs('#backdrop');
  var drawer = qs('#drawer');
  var orderPanel = qs('#orderPanel');
  var confirmPanel = qs('#confirmPanel');

  function openDrawer(){
    orderPanel.hidden = false;
    confirmPanel.hidden = true;
    renderDrawerBody();
    backdrop.classList.add('show');
    drawer.classList.add('show');
  }
  function closeDrawer(){
    backdrop.classList.remove('show');
    drawer.classList.remove('show');
  }
  qs('#cbViewBtn').addEventListener('click', openDrawer);
  qs('#drawerClose').addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);

  function renderDrawerBody(){
    var body = qs('#drawerBody');
    var keys = Object.keys(cart);
    var html = '';
    if (keys.length === 0){
      html += '<div class="drawer-empty">Your order is empty — add a dish to get started.</div>';
    } else {
      keys.forEach(function(id){
        var it = cart[id];
        html +=
          '<div class="cart-row" data-id="' + id + '">' +
            '<span class="ci-info">' +
              '<div class="ci-name">' + it.name + '</div>' +
              '<div class="ci-unit">' + CUR + it.price + ' each</div>' +
            '</span>' +
            '<span class="qty-stepper">' +
              '<button type="button" data-d="-1">−</button>' +
              '<span class="qn">' + it.qty + '</span>' +
              '<button type="button" data-d="1">+</button>' +
            '</span>' +
            '<span class="ci-total">' + CUR + (it.price * it.qty) + '</span>' +
          '</div>';
      });
    }
    html +=
      '<div class="field-group">' +
        '<div class="field-label">Table / Seat Number</div>' +
        '<input type="text" id="tableInput" placeholder="e.g. 5" value="' + (currentTable || '') + '">' +
      '</div>' +
      '<div class="field-group">' +
        '<div class="field-label">Special Instructions (optional)</div>' +
        '<textarea id="notesInput" rows="2" placeholder="Less spicy, no onions, etc.">' + (draftNotes||'') + '</textarea>' +
      '</div>';
    body.innerHTML = html;

    qsa('.cart-row', body).forEach(function(rowEl){
      var id = rowEl.dataset.id;
      var it = cart[id];
      qsa('button', rowEl).forEach(function(btn){
        btn.addEventListener('click', function(){
          changeQty(id, it.catId, { name: it.name, price: it.price, veg: it.veg }, parseInt(btn.dataset.d, 10));
        });
      });
    });

    var tableInput = qs('#tableInput', body);
    tableInput.addEventListener('input', function(){ setTable(tableInput.value.trim()); });

    var notesInput = qs('#notesInput', body);
    notesInput.addEventListener('input', function(){ draftNotes = notesInput.value; });

    qs('#drawerTotal').textContent = CUR + cartTotal();
    updatePlaceButtonState();
  }

  var draftNotes = '';
  var placeBtn = qs('#placeOrderBtn');
  function updatePlaceButtonState(){
    placeBtn.disabled = cartCount() === 0 || !currentTable;
  }

  qs('#tableChangeBtn').addEventListener('click', function(){
    openDrawer();
    setTimeout(function(){
      var inp = qs('#tableInput');
      if (inp){ inp.focus(); inp.select(); }
    }, 260);
  });

  /* ---------- WhatsApp order ---------- */
  function buildOrderMessage(){
    var lines = [];
    lines.push('🍽️ *New Order — ' + CFG.name + '*');
    lines.push('Table: ' + (currentTable || '—'));
    lines.push('');
    Object.keys(cart).forEach(function(id){
      var it = cart[id];
      lines.push(it.qty + 'x ' + it.name + ' — ' + CUR + (it.price * it.qty));
    });
    lines.push('');
    lines.push('*Total: ' + CUR + cartTotal() + '*');
    if (draftNotes && draftNotes.trim()){
      lines.push('');
      lines.push('Note: ' + draftNotes.trim());
    }
    return lines.join('\n');
  }

  function openWhatsApp(message){
    var number = (CFG.whatsappNumber || '').replace(/[^0-9]/g,'');
    var url = 'https://wa.me/' + number + '?text=' + encodeURIComponent(message);
    var win = window.open(url, '_blank');
    if (!win) window.location.href = url;
  }

  placeBtn.addEventListener('click', function(){
    if (placeBtn.disabled) return;
    openWhatsApp(buildOrderMessage());
    orderPanel.hidden = true;
    confirmPanel.hidden = false;
    cart = {};
    saveCart();
    draftNotes = '';
    renderCartBar();
    rebuildAllDishControls();
  });

  function rebuildAllDishControls(){
    CATEGORY_META.forEach(function(cat){
      (MENU_DATA[cat.id] || []).forEach(function(item){
        var id = cartId(cat.id, item.name);
        var row = qs('.dish[data-id="' + id + '"]');
        if (row) renderDishControl(row.querySelector('.dish-control'), id, cat.id, item);
      });
    });
  }

  qs('#newOrderBtn').addEventListener('click', function(){
    closeDrawer();
    orderPanel.hidden = false;
    confirmPanel.hidden = true;
  });

  /* ---------- Call waiter ---------- */
  qs('#waiterBtn').addEventListener('click', function(){
    var msg = '🔔 Assistance needed at Table ' + (currentTable || '(not set)') + ' — ' + CFG.name;
    openWhatsApp(msg);
  });

  /* ---------- Init ---------- */
  renderTablePill();
  renderCartBar();
  updatePlaceButtonState();
})();
