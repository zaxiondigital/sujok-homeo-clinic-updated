/* =========================================================
   Sujok Homeo Clinic — Order Online (design preview)
   Renders the store from shop-data.js: categories, A–Z letters, search, product rows and a
   cart drawer. The cart is kept in this browser only; nothing is sent to a store yet.
   ========================================================= */
(function () {
  'use strict';

  const data = window.SHOP_DATA;
  if (!data) return;

  const MIN_ORDER = 20;
  const DETAIL_LABEL = { cs: 'Indications', hb: 'Composition' };
  const $ = (id) => document.getElementById(id);
  const money = (n) => '$' + n.toFixed(2);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const els = {
    cats: $('sh-cats'), title: $('sh-cat-title'), count: $('sh-cat-count'), intro: $('sh-cat-intro'),
    search: $('sh-search'), letters: $('sh-letters'), status: $('sh-status'), list: $('sh-list'),
    cart: $('sh-cart'), overlay: $('sh-overlay'), cartList: $('sh-cart-list'), subtotal: $('sh-subtotal'),
    min: $('sh-cart-min'), checkout: $('sh-checkout'), toast: $('sh-toast')
  };

  /* ---------- Options: "Globules - 30c" → form + potency; "10 ml" → size; "Default" → none ---------- */
  function describe(setIndex) {
    const opts = data.opts[setIndex].map(([label, price], i) => {
      const m = label.match(/^(Globules|Drops) - (.+)$/);
      return { i, label, price, form: m ? m[1] : null, value: m ? m[2] : label };
    });
    const forms = [...new Set(opts.filter((o) => o.form).map((o) => o.form))];
    const prices = opts.map((o) => o.price);
    return {
      opts, forms,
      single: opts.length === 1,
      min: Math.min(...prices),
      same: prices.every((p) => p === prices[0])
    };
  }

  /* ---------- State ---------- */
  const state = { cat: data.cats[0], letter: 'A', query: '' };
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem('sh-cart')) || []; } catch (e) { cart = []; }
  const saveCart = () => { try { localStorage.setItem('sh-cart', JSON.stringify(cart)); } catch (e) { /* preview only */ } };

  /* ---------- Categories ---------- */
  els.cats.innerHTML = data.cats.map((c) =>
    '<li><button class="sh-cat" type="button" data-cat="' + c.id + '" aria-pressed="false">' +
    '<span>' + esc(c.name) + '</span><span class="sh-cat-num">' + c.items.length + '</span></button></li>'
  ).join('');
  els.cats.addEventListener('click', (e) => {
    const btn = e.target.closest('.sh-cat');
    if (!btn) return;
    state.cat = data.cats.find((c) => c.id === btn.dataset.cat);
    state.letter = 'A';
    state.query = '';
    els.search.value = '';
    renderCategory();
  });

  function renderCategory() {
    const c = state.cat;
    els.cats.querySelectorAll('.sh-cat').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cat === c.id)));
    els.title.textContent = c.name;
    els.count.textContent = c.items.length + ' products';

    const paras = c.intro.split(/\n+/).filter(Boolean);
    els.intro.innerHTML = '<div class="sh-intro-body">' + paras.map((p) => '<p>' + esc(p) + '</p>').join('') + '</div>';
    els.intro.classList.remove('is-clamped');
    if (c.intro.length > 320) {
      els.intro.classList.add('is-clamped');
      els.intro.insertAdjacentHTML('beforeend', '<button class="sh-more" type="button" aria-expanded="false">Read more</button>');
    }

    const many = c.items.length > 40;
    els.letters.hidden = !many;
    if (many) {
      const has = new Set(c.items.map((it) => it[0][0].toUpperCase()));
      els.letters.innerHTML = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((L) =>
        '<button class="sh-letter" type="button" data-letter="' + L + '" aria-pressed="false"' + (has.has(L) ? '' : ' disabled') + '>' + L + '</button>'
      ).join('');
    }
    els.search.placeholder = 'Search ' + c.name;
    renderList();
  }

  els.intro.addEventListener('click', (e) => {
    const btn = e.target.closest('.sh-more');
    if (!btn) return;
    const open = els.intro.classList.toggle('is-clamped');
    btn.textContent = open ? 'Read more' : 'Show less';
    btn.setAttribute('aria-expanded', String(!open));
  });

  els.letters.addEventListener('click', (e) => {
    const btn = e.target.closest('.sh-letter');
    if (!btn || btn.disabled) return;
    state.letter = btn.dataset.letter;
    state.query = '';
    els.search.value = '';
    renderList();
  });

  let searchTimer;
  els.search.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.query = els.search.value.trim().toLowerCase(); renderList(); }, 150);
  });

  /* ---------- Product rows ---------- */
  function visibleItems() {
    const c = state.cat;
    const all = c.items.map((it, n) => ({ it, n }));
    if (state.query) return all.filter(({ it }) => (it[0] + ' ' + it[1]).toLowerCase().includes(state.query));
    if (els.letters.hidden) return all;
    return all.filter(({ it }) => it[0][0].toUpperCase() === state.letter);
  }

  function renderList() {
    const c = state.cat;
    els.letters.querySelectorAll('.sh-letter').forEach((b) => b.setAttribute('aria-pressed', String(!state.query && b.dataset.letter === state.letter)));
    const rows = visibleItems();

    if (state.query) els.status.textContent = rows.length + ' result' + (rows.length === 1 ? '' : 's') + ' for “' + els.search.value.trim() + '”';
    else if (!els.letters.hidden) els.status.textContent = rows.length + ' products starting with ' + state.letter;
    else els.status.textContent = '';

    if (!rows.length) {
      els.list.innerHTML = '<li class="sh-empty">No products found. If you don\'t see a remedy listed, <a href="tel:+16478562516">contact us</a>.</li>';
      return;
    }
    els.list.innerHTML = rows.map(({ it, n }) => itemHtml(c, it, n)).join('');
  }

  function itemHtml(c, it, n) {
    const [name, tag, setIndex, details] = it;
    const d = describe(setIndex);
    const key = c.id + '-' + n;
    const mark = c.id === 'cs' ? tag.replace('#', '') : name[0].toUpperCase();
    let choose = '';

    if (d.forms.length) {
      choose =
        '<div class="sh-seg" role="group" aria-label="Form">' +
        d.forms.map((f, i) => '<button type="button" data-form="' + f + '" aria-pressed="' + (i === 0) + '">' + f + '</button>').join('') +
        '</div>' +
        '<label class="sh-field"><span class="sh-field-label">Potency</span>' + selectHtml(d, d.forms[0], key) + '</label>';
    } else if (!d.single) {
      choose = '<label class="sh-field"><span class="sh-field-label">Size</span>' + selectHtml(d, null, key) + '</label>';
    }

    const price = d.single ? money(d.opts[0].price) : (d.same ? money(d.min) : 'From ' + money(d.min));

    return '<li class="sh-item" data-key="' + key + '" data-set="' + setIndex + '">' +
      '<div class="sh-item-info">' +
        '<span class="sh-item-mark" aria-hidden="true">' + esc(mark) + '</span>' +
        '<div><h3 class="sh-item-name">' + esc(name) + '</h3>' +
          (tag && c.id !== 'cs' ? '<span class="sh-item-abbr">' + esc(tag) + '</span>' : '') +
          (details ? '<div><button class="sh-info-btn" type="button" aria-expanded="false" aria-controls="sh-d-' + key + '">' + (DETAIL_LABEL[c.id] || 'Details') + '</button></div>' : '') +
        '</div>' +
      '</div>' +
      '<div class="sh-buy">' + choose +
        '<span class="sh-price" aria-live="polite">' + price + '</span>' +
        '<div class="sh-qty"><button type="button" data-step="-1" aria-label="Decrease quantity">−</button>' +
          '<input type="number" min="1" max="99" value="1" aria-label="Quantity for ' + esc(name) + '">' +
          '<button type="button" data-step="1" aria-label="Increase quantity">+</button></div>' +
        '<button class="btn btn-primary btn-sm sh-add" type="button"><svg class="icon" aria-hidden="true"><use href="#i-cart"/></svg>Add to Cart</button>' +
      '</div>' +
      (details ? '<p class="sh-item-desc" id="sh-d-' + key + '" hidden>' + esc(details) + '</p>' : '') +
    '</li>';
  }

  function selectHtml(d, form, key) {
    const opts = d.opts.filter((o) => o.form === form);
    return '<select class="sh-select" id="sh-o-' + key + '"><option value="">Choose</option>' +
      opts.map((o) => '<option value="' + o.i + '">' + esc(o.value) + ' — ' + money(o.price) + '</option>').join('') + '</select>';
  }

  els.list.addEventListener('click', (e) => {
    const row = e.target.closest('.sh-item');
    if (!row) return;
    const d = describe(+row.dataset.set);

    const formBtn = e.target.closest('[data-form]');
    if (formBtn) {
      row.querySelectorAll('[data-form]').forEach((b) => b.setAttribute('aria-pressed', String(b === formBtn)));
      const sel = row.querySelector('.sh-select');
      sel.outerHTML = selectHtml(d, formBtn.dataset.form, row.dataset.key);
      row.querySelector('.sh-price').textContent = d.same ? money(d.min) : 'From ' + money(Math.min(...d.opts.filter((o) => o.form === formBtn.dataset.form).map((o) => o.price)));
      return;
    }

    const step = e.target.closest('[data-step]');
    if (step) {
      const input = row.querySelector('.sh-qty input');
      input.value = Math.min(99, Math.max(1, (+input.value || 1) + +step.dataset.step));
      return;
    }

    const info = e.target.closest('.sh-info-btn');
    if (info) {
      const desc = row.querySelector('.sh-item-desc');
      desc.hidden = !desc.hidden;
      info.setAttribute('aria-expanded', String(!desc.hidden));
      return;
    }

    if (e.target.closest('.sh-add')) addToCart(row, d);
  });

  els.list.addEventListener('change', (e) => {
    if (!e.target.matches('.sh-select')) return;
    const row = e.target.closest('.sh-item');
    const d = describe(+row.dataset.set);
    const o = d.opts[+e.target.value];
    row.querySelector('.sh-price').textContent = o ? money(o.price) : (d.same ? money(d.min) : 'From ' + money(d.min));
    e.target.removeAttribute('aria-invalid');
  });

  /* ---------- Cart ---------- */
  function addToCart(row, d) {
    const sel = row.querySelector('.sh-select');
    let o = d.opts[0];
    if (sel) {
      if (sel.value === '') {
        sel.setAttribute('aria-invalid', 'true');
        sel.focus();
        toast('Please choose a ' + (d.forms.length ? 'potency' : 'size') + ' first');
        return;
      }
      o = d.opts[+sel.value];
    }
    const [catId, n] = row.dataset.key.split('-');
    const cat = data.cats.find((c) => c.id === catId);
    const name = cat.items[+n][0];
    const qty = Math.min(99, Math.max(1, +row.querySelector('.sh-qty input').value || 1));
    const option = d.single ? '' : o.label;
    const line = cart.find((l) => l.key === row.dataset.key && l.option === option);
    if (line) line.qty = Math.min(99, line.qty + qty);
    else cart.push({ key: row.dataset.key, name, option, price: o.price, qty });
    saveCart();
    renderCart();

    const btn = row.querySelector('.sh-add');
    btn.classList.add('is-added');
    setTimeout(() => btn.classList.remove('is-added'), 1200);
    toast(name + ' added to your cart');
  }

  function renderCart() {
    const count = cart.reduce((s, l) => s + l.qty, 0);
    const total = cart.reduce((s, l) => s + l.qty * l.price, 0);
    document.querySelectorAll('.cart-count').forEach((el) => { el.textContent = count; });
    document.querySelectorAll('.cart-link').forEach((el) => el.setAttribute('aria-label', 'Cart, ' + count + ' item' + (count === 1 ? '' : 's')));

    els.cartList.innerHTML = cart.length
      ? cart.map((l, i) =>
          '<li class="sh-cart-item"><div><p class="sh-cart-name">' + esc(l.name) + '</p>' +
          (l.option ? '<p class="sh-cart-opt">' + esc(l.option) + '</p>' : '') + '</div>' +
          '<p class="sh-cart-line">' + money(l.qty * l.price) + '</p>' +
          '<div class="sh-cart-ctrl"><div class="sh-qty"><button type="button" data-i="' + i + '" data-d="-1" aria-label="Decrease quantity">−</button>' +
          '<input type="number" value="' + l.qty + '" readonly aria-label="Quantity">' +
          '<button type="button" data-i="' + i + '" data-d="1" aria-label="Increase quantity">+</button></div>' +
          '<button class="sh-remove" type="button" data-remove="' + i + '">Remove</button></div></li>'
        ).join('')
      : '<li class="sh-cart-empty">Your cart is empty.</li>';

    els.subtotal.textContent = money(total);
    els.min.textContent = cart.length && total < MIN_ORDER ? 'Add ' + money(MIN_ORDER - total) + ' more to reach the $20.00 minimum order.' : '';
    els.checkout.disabled = !cart.length || total < MIN_ORDER;
  }

  els.cartList.addEventListener('click', (e) => {
    const step = e.target.closest('[data-d]');
    const rm = e.target.closest('[data-remove]');
    if (step) {
      const l = cart[+step.dataset.i];
      l.qty += +step.dataset.d;
      if (l.qty < 1) cart.splice(+step.dataset.i, 1);
    } else if (rm) {
      cart.splice(+rm.dataset.remove, 1);
    } else return;
    saveCart();
    renderCart();
  });

  let lastFocus = null;
  function openCart() {
    lastFocus = document.activeElement;
    els.overlay.hidden = false;
    els.cart.classList.add('is-open');
    els.cart.setAttribute('aria-hidden', 'false');
    $('sh-cart-close').focus();
  }
  function closeCart() {
    els.overlay.hidden = true;
    els.cart.classList.remove('is-open');
    els.cart.setAttribute('aria-hidden', 'true');
    if (lastFocus) lastFocus.focus();
  }
  document.querySelectorAll('.cart-link').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); openCart(); }));
  $('sh-cart-close').addEventListener('click', closeCart);
  $('sh-continue').addEventListener('click', closeCart);
  els.overlay.addEventListener('click', closeCart);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && els.cart.classList.contains('is-open')) closeCart(); });
  els.checkout.addEventListener('click', () => { window.location.href = 'checkout.html'; });

  let toastTimer;
  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('is-shown'), 2400);
  }

  renderCategory();
  renderCart();
})();
