/* =========================================================
   Sujok Homeo Clinic — My Account (design preview)
   Orders, saved addresses and account details for a SAMPLE customer. Product names and prices
   come from shop-data.js; "Reorder" puts an order's items in the shop cart and opens checkout.
   Nothing is sent anywhere.
   ========================================================= */
(function () {
  'use strict';

  const data = window.SHOP_DATA;
  const $ = (id) => document.getElementById(id);
  const money = (n) => '$' + n.toFixed(2);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Sample customer ---------- */
  const SAMPLE = {
    details: { first: 'Sample', last: 'Customer', email: 'sample@example.com', phone: '555-555-0100', client_id: '' },
    addresses: [
      { label: 'Home', street: '123 Sample Street, Unit 4', city: 'Brampton', province: 'Ontario', postal: 'L6X 0A1', default: true },
      { label: 'Work', street: '456 Sample Avenue', city: 'Mississauga', province: 'Ontario', postal: 'L5B 0A2', default: false }
    ],
    // items: [category, product name, option label, quantity]
    orders: [
      { no: '1048', date: '2026-10-21', status: 'ready', way: 'Pickup', ship: 0,
        items: [['az', 'Arnica Montana', 'Globules - 30c', 2], ['cr', 'Calendula (creme)', 'Default', 1]] },
      { no: '1031', date: '2026-09-30', status: 'shipped', way: 'Delivery to Home', ship: 15,
        items: [['az', 'Bacillinum', 'Globules - 200c', 1], ['cs', 'Kali Phosphoricum', 'Default', 2]] },
      { no: '1007', date: '2026-08-12', status: 'done', way: 'Pickup', ship: 0,
        items: [['mt', 'Echinacea Angustifolia', '30 ml', 1], ['hb', 'FWY Capsules', 'Default', 1]] }
    ]
  };
  const STATUS = { ready: ['Ready for pickup', 'ma-status--ready'], shipped: ['Shipped', 'ma-status--shipped'], done: ['Completed', 'ma-status--done'] };

  // look up the current price and cart key of an item in shop-data.js
  function lookup([catId, name, option, qty]) {
    const cat = data.cats.find((c) => c.id === catId);
    const n = cat.items.findIndex((it) => it[0] === name);
    const opt = data.opts[cat.items[n][2]].find((o) => o[0] === option);
    return { key: catId + '-' + n, name, option: option === 'Default' ? '' : option, price: opt[1], qty };
  }

  /* ---------- Views (#orders, #addresses, #details) ---------- */
  const VIEWS = { orders: 'ma-orders', addresses: 'ma-addresses', details: 'ma-details' };
  function show() {
    const name = VIEWS[location.hash.slice(1)] ? location.hash.slice(1) : 'orders';
    Object.entries(VIEWS).forEach(([k, id]) => { $(id).hidden = k !== name; });
    document.querySelectorAll('.ma-nav-link').forEach((a) => {
      if (a.dataset.view === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }
  window.addEventListener('hashchange', show);

  /* ---------- Orders ---------- */
  const fmtDate = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });

  $('ma-order-list').innerHTML = SAMPLE.orders.map((o, i) => {
    const lines = o.items.map(lookup);
    const sub = lines.reduce((s, l) => s + l.qty * l.price, 0);
    const count = lines.reduce((s, l) => s + l.qty, 0);
    const [label, cls] = STATUS[o.status];
    return '<li class="ma-card ma-order">' +
      '<div class="ma-order-top">' +
        '<div><div class="ma-order-meta"><span class="ma-order-no">Order #' + o.no + '</span>' +
          '<span class="ma-order-date">' + fmtDate(o.date) + '</span>' +
          '<span class="ma-status ' + cls + '">' + label + '</span></div>' +
          '<p class="ma-order-items">' + lines.map((l) => esc(l.name)).join(', ') + ' · ' + count + ' item' + (count === 1 ? '' : 's') + '</p>' +
          '<p class="ma-order-way"><svg class="icon" aria-hidden="true"><use href="#' + (o.ship ? 'i-home' : 'i-pin') + '"/></svg>' + esc(o.way) + '</p></div>' +
        '<div class="ma-order-side"><span class="ma-order-total">' + money(sub + o.ship) + '</span>' +
          '<div class="ma-order-btns">' +
            '<button class="ma-toggle" type="button" aria-expanded="false" aria-controls="ma-od-' + i + '">Details<svg class="icon" aria-hidden="true"><use href="#i-chevron-down"/></svg></button>' +
            '<button class="btn btn-primary btn-sm" type="button" data-reorder="' + i + '"><svg class="icon" aria-hidden="true"><use href="#i-cart"/></svg>Reorder</button>' +
          '</div></div>' +
      '</div>' +
      '<div class="ma-order-detail" id="ma-od-' + i + '" hidden>' +
        '<ul class="ma-lines">' + lines.map((l) =>
          '<li><div><p class="ma-line-name">' + esc(l.name) + '</p><p class="ma-line-opt">' + (l.option ? esc(l.option) + ' · ' : '') + l.qty + ' × ' + money(l.price) + '</p></div>' +
          '<span class="ma-line-amt">' + money(l.qty * l.price) + '</span></li>').join('') + '</ul>' +
        '<dl class="ma-sum"><div><dt>Subtotal</dt><dd>' + money(sub) + '</dd></div>' +
          '<div><dt>Shipping</dt><dd>' + (o.ship ? money(o.ship) : 'Free (pickup)') + '</dd></div>' +
          '<div class="ma-sum-total"><dt>Total</dt><dd>' + money(sub + o.ship) + '</dd></div></dl>' +
      '</div>' +
    '</li>';
  }).join('');

  $('ma-order-list').addEventListener('click', (e) => {
    const t = e.target.closest('.ma-toggle');
    if (t) {
      const d = $(t.getAttribute('aria-controls'));
      d.hidden = !d.hidden;
      t.setAttribute('aria-expanded', String(!d.hidden));
      return;
    }
    const r = e.target.closest('[data-reorder]');
    if (!r) return;
    // add the order's items to the shop cart at today's prices, then open checkout
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem('sh-cart')) || []; } catch (err) { cart = []; }
    SAMPLE.orders[+r.dataset.reorder].items.map(lookup).forEach((l) => {
      const line = cart.find((c) => c.key === l.key && c.option === l.option);
      if (line) line.qty = Math.min(99, line.qty + l.qty); else cart.push(l);
    });
    try { localStorage.setItem('sh-cart', JSON.stringify(cart)); } catch (err) { /* preview only */ }
    window.location.href = 'checkout.html';
  });

  /* ---------- Addresses ---------- */
  const addrs = SAMPLE.addresses.slice();
  const addrForm = $('ma-addr-form');
  let editing = -1;

  function renderAddrs() {
    $('ma-addr-list').innerHTML = addrs.length
      ? addrs.map((a, i) =>
          '<li class="ma-card ma-addr"><div class="ma-addr-top"><span class="ma-addr-label">' + esc(a.label) + '</span>' +
          (a.default ? '<span class="ma-badge">Default</span>' : '') + '</div>' +
          '<address>' + esc(a.street) + '<br>' + esc(a.city) + ', ' + esc(a.province) + ' ' + esc(a.postal) + '</address>' +
          '<div class="ma-addr-btns"><button class="ma-linkbtn" type="button" data-edit="' + i + '">Edit</button>' +
          (a.default ? '' : '<button class="ma-linkbtn" type="button" data-default="' + i + '">Set as default</button>') +
          '<button class="ma-linkbtn ma-linkbtn--danger" type="button" data-del="' + i + '">Remove</button></div></li>'
        ).join('')
      : '<li class="ma-empty">No saved addresses yet.</li>';
  }

  function openAddrForm(i) {
    editing = i;
    addrForm.reset();
    addrForm.querySelector('.ma-msg').hidden = true;
    $('ma-addr-form-title').textContent = i < 0 ? 'Add address' : 'Edit address';
    if (i >= 0) Object.entries(addrs[i]).forEach(([k, v]) => {
      const el = addrForm.elements[k];
      if (el) { if (el.type === 'checkbox') el.checked = v; else el.value = v; }
    });
    addrForm.hidden = false;
    addrForm.elements.label.focus();
  }

  $('ma-addr-add').addEventListener('click', () => openAddrForm(-1));
  $('ma-addr-cancel').addEventListener('click', () => { addrForm.hidden = true; });
  $('ma-addr-list').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.edit) openAddrForm(+b.dataset.edit);
    if (b.dataset.default) { addrs.forEach((a, i) => { a.default = i === +b.dataset.default; }); renderAddrs(); toast('Default address updated'); }
    if (b.dataset.del) { const gone = addrs.splice(+b.dataset.del, 1)[0]; if (gone.default && addrs[0]) addrs[0].default = true; renderAddrs(); toast('Address removed'); }
  });

  addrForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = addrForm.elements;
    if (!check(addrForm, [
      [f.label, f.label.value.trim(), 'a label'],
      [f.street, f.street.value.trim(), 'the street address'],
      [f.city, f.city.value.trim(), 'the city'],
      [f.province, f.province.value, 'the province'],
      [f.postal, f.postal.value.trim(), 'the postal code']
    ])) return;
    const a = { label: f.label.value.trim(), street: f.street.value.trim(), city: f.city.value.trim(), province: f.province.value, postal: f.postal.value.trim().toUpperCase(), default: f.default.checked || !addrs.length };
    if (a.default) addrs.forEach((x) => { x.default = false; });
    if (editing < 0) addrs.push(a); else addrs[editing] = a;
    if (!addrs.some((x) => x.default)) addrs[0].default = true;
    addrForm.hidden = true;
    renderAddrs();
    toast(editing < 0 ? 'Address saved' : 'Address updated');
  });

  /* ---------- Account details + password ---------- */
  const det = $('ma-details-form');
  Object.entries(SAMPLE.details).forEach(([k, v]) => { det.elements[k].value = v; });
  $('ma-first').textContent = SAMPLE.details.first;

  det.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = det.elements;
    if (!check(det, [
      [f.first, f.first.value.trim(), 'your first name'],
      [f.last, f.last.value.trim(), 'your last name'],
      [f.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim()), 'a valid e-mail'],
      [f.phone, f.phone.value.replace(/\D/g, '').length >= 10, 'a phone number']
    ])) return;
    $('ma-first').textContent = f.first.value.trim();
    info(det, 'Your details have been saved. (Design preview: nothing is sent.)');
  });

  const pw = $('ma-pw-form');
  pw.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = pw.elements;
    const strong = f.next.value.length >= 8 && /\d/.test(f.next.value) && /[a-z]/.test(f.next.value) && /[A-Z]/.test(f.next.value);
    if (!check(pw, [
      [f.current, f.current.value, 'your current password'],
      [f.next, strong, 'a new password that meets the rules'],
      [f.confirm, f.confirm.value && f.confirm.value === f.next.value, 'the same new password twice']
    ])) return;
    pw.reset();
    info(pw, 'Your password has been updated. (Design preview: nothing is sent.)');
  });

  /* ---------- Shared helpers ---------- */
  function check(form, checks) {
    const missing = [];
    checks.forEach(([el, ok, label]) => { el.setAttribute('aria-invalid', String(!ok)); if (!ok) missing.push(label); });
    const msg = form.querySelector('.ma-msg');
    msg.classList.remove('is-info');
    msg.hidden = !missing.length;
    if (missing.length) {
      msg.textContent = 'Please add ' + missing.join(', ') + '.';
      checks.find(([, ok]) => !ok)[0].focus();
    }
    return !missing.length;
  }
  function info(form, text) {
    const msg = form.querySelector('.ma-msg');
    msg.textContent = text;
    msg.classList.add('is-info');
    msg.hidden = false;
  }
  document.querySelectorAll('.ma-page form').forEach((form) => {
    form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') e.target.removeAttribute('aria-invalid'); });
  });

  let toastTimer;
  function toast(msg) {
    const t = $('ma-toast');
    t.textContent = msg;
    t.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-shown'), 2400);
  }

  // header cart count from the shop cart
  try {
    const count = (JSON.parse(localStorage.getItem('sh-cart')) || []).reduce((s, l) => s + l.qty, 0);
    document.querySelectorAll('.cart-count').forEach((el) => { el.textContent = count; });
  } catch (e) { /* preview only */ }

  renderAddrs();
  show();
})();
