/* =========================================================
   Sujok Homeo Clinic — Checkout (design preview)
   Reads the cart that shop.js keeps in this browser and walks through the live store's steps:
   My Cart → Order Delivery → Secure Payment. Nothing is sent anywhere and no payment is taken.
   ========================================================= */
(function () {
  'use strict';

  const MIN_ORDER = 20;
  // Shipping amounts used by the live store's script: Ontario $15, everywhere else $20
  const shippingFor = (type, country, province) => (type !== 'Delivery' ? 0 : (country === 'CA' && province === 'Ontario' ? 15 : 20));

  const $ = (id) => document.getElementById(id);
  const money = (n) => '$' + n.toFixed(2);
  const fmtDate = (iso) => (iso ? new Date(iso + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' }) : '');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let cart = [];
  try { cart = JSON.parse(localStorage.getItem('sh-cart')) || []; } catch (e) { cart = []; }
  const saveCart = () => { try { localStorage.setItem('sh-cart', JSON.stringify(cart)); } catch (e) { /* preview only */ } };

  const form = $('co-step-2');
  let step = 1;

  /* ---------- Steps ----------
     Each step has its own address (checkout.html, #delivery, #payment) so the browser's Back
     button returns to the previous step and a refresh stays on the same step. */
  const HASH = { 1: '', 2: '#delivery', 3: '#payment' };
  const stepFromHash = () => ({ '#delivery': 2, '#payment': 3 }[location.hash] || 1);
  const cartOk = () => cart.length && cart.reduce((s, l) => s + l.qty * l.price, 0) >= MIN_ORDER;

  function go(n, how) {
    // a step can't be reached before the one before it is complete
    if (n > 1 && !cartOk()) n = 1;
    if (n > 2 && !validate(false)) n = 2;
    const url = location.pathname + location.search + HASH[n];
    if (how === 'push' && n !== step) history.pushState({ step: n }, '', url);
    else if (how !== 'pop') history.replaceState({ step: n }, '', url);
    step = n;
    [1, 2, 3].forEach((i) => { $('co-step-' + i).hidden = i !== n; });
    document.querySelectorAll('.co-step').forEach((li) => {
      const s = +li.dataset.step;
      li.classList.toggle('is-done', s < n);
      li.classList.toggle('is-current', s === n);
      if (s === n) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
    document.querySelectorAll('.co-after').forEach((el) => { el.hidden = n === 1; });
    $('co-sum-items').hidden = n === 1;
    $('co-next').hidden = n !== 1;
    render();
    const top = document.querySelector('.co-head').getBoundingClientRect().top + window.scrollY;
    if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' });
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (b) go(+b.dataset.go, 'push');
  });
  window.addEventListener('popstate', () => go(stepFromHash(), 'pop'));

  /* ---------- Cart + summary ---------- */
  function render() {
    const count = cart.reduce((s, l) => s + l.qty, 0);
    const subtotal = cart.reduce((s, l) => s + l.qty * l.price, 0);
    document.querySelectorAll('.cart-count').forEach((el) => { el.textContent = count; });
    document.querySelectorAll('.cart-link').forEach((el) => el.setAttribute('aria-label', 'Cart, ' + count + ' item' + (count === 1 ? '' : 's')));

    $('co-cart-meta').textContent = count ? count + ' item' + (count === 1 ? '' : 's') : '';
    $('co-items').innerHTML = cart.length
      ? cart.map((l, i) =>
          '<li class="co-item">' +
            '<span class="co-mark" aria-hidden="true">' + esc(l.name[0].toUpperCase()) + '</span>' +
            '<div><p class="co-name">' + esc(l.name) + '</p>' +
              '<p class="co-opt">' + (l.option ? esc(l.option) + ' · ' : '') + '<span class="co-unit">' + money(l.price) + ' each</span></p>' +
              '<button class="co-remove" type="button" data-remove="' + i + '">Remove</button></div>' +
            '<div class="co-qty"><button type="button" data-i="' + i + '" data-d="-1" aria-label="Decrease quantity of ' + esc(l.name) + '">−</button>' +
              '<output aria-live="polite">' + l.qty + '</output>' +
              '<button type="button" data-i="' + i + '" data-d="1" aria-label="Increase quantity of ' + esc(l.name) + '">+</button></div>' +
            '<p class="co-line">' + money(l.qty * l.price) + '</p>' +
          '</li>'
        ).join('')
      : '<li class="co-empty"><p>Your cart is empty.</p><a class="btn btn-primary" href="shop.html">Browse remedies</a></li>';

    $('co-sum-items').innerHTML = cart.map((l) =>
      '<li><span>' + l.qty + ' × ' + esc(l.name) + (l.option ? ' (' + esc(l.option) + ')' : '') + '</span><span>' + money(l.qty * l.price) + '</span></li>'
    ).join('');

    const type = form.elements.order_type.value;
    const country = form.elements.country.value;
    const ship = step === 1 ? 0 : shippingFor(type, country, form.elements.province.value);
    $('co-subtotal').textContent = money(subtotal);
    $('co-ship').textContent = type === 'Pickup' ? 'Free (pickup)' : (country ? money(ship) : 'Select country');
    $('co-tax').textContent = 'By province, at payment';
    $('co-total').textContent = money(subtotal + ship);

    // Step 3: recap of what was entered in step 2
    const f = form.elements;
    const region = f.country.value === 'US' ? f.state.value.trim() : f.province.value;
    $('co-rev-contact').innerHTML = [f.name.value, f.email.value, f.phone.value].filter((v) => v.trim()).map(esc).join('<br>');
    $('co-rev-way-title').textContent = type;
    $('co-rev-way').innerHTML = (type === 'Pickup'
      ? ['145 Clarence Street, Unit 26', 'Brampton, Ontario L6W 1T2']
      : [f.street.value, ([f.city.value, region].filter(Boolean).join(', ') + ' ' + f.postal.value.toUpperCase()).trim()]
    ).map(esc).join('<br>') + '<br>Preferred date: ' + esc(fmtDate(f.date.value));
    $('co-pay-amount').textContent = money(subtotal + ship);

    const short = cart.length && subtotal < MIN_ORDER;
    $('co-min').hidden = !short;
    $('co-min').textContent = short ? 'Minimum order is $20.00 before taxes. Add ' + money(MIN_ORDER - subtotal) + ' more to continue.' : '';
    $('co-next').disabled = !cart.length || short;

    if (step > 1 && (!cart.length || short)) go(1);
  }

  $('co-items').addEventListener('click', (e) => {
    const stepBtn = e.target.closest('[data-d]');
    const rm = e.target.closest('[data-remove]');
    if (stepBtn) {
      const l = cart[+stepBtn.dataset.i];
      l.qty = Math.min(99, l.qty + +stepBtn.dataset.d);
      if (l.qty < 1) cart.splice(+stepBtn.dataset.i, 1);
    } else if (rm) {
      cart.splice(+rm.dataset.remove, 1);
    } else return;
    saveCart();
    render();
  });

  $('co-next').addEventListener('click', () => go(2, 'push'));
  document.querySelectorAll('.cart-link').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); go(1, 'push'); }));

  /* ---------- Step 2: delivery form ---------- */
  const today = new Date();
  const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  $('co-date').min = iso(today);
  $('co-date').value = iso(today);

  function syncForm() {
    const us = form.elements.country.value === 'US';
    // Pickup is not offered for US orders (same rule as the live store)
    const pickup = form.querySelector('input[value="Pickup"]');
    pickup.disabled = us;
    if (us && pickup.checked) form.querySelector('input[value="Delivery"]').checked = true;
    $('co-type-hint').hidden = !us;

    $('co-province').hidden = us;
    $('co-state').hidden = !us;
    $('co-region-label').textContent = us ? 'State' : 'Province';
    $('co-postal-label').textContent = us ? 'Zip code' : 'Postal code';
    form.elements.postal.placeholder = us ? '12345' : 'A1A 1A1';

    const delivery = form.elements.order_type.value === 'Delivery';
    form.querySelectorAll('.co-addr').forEach((el) => { el.hidden = !delivery; });
    render();
  }
  form.addEventListener('change', syncForm);

  // Checks the delivery form; with show = true it also marks the fields and shows the message
  function validate(show) {
    const f = form.elements;
    const us = f.country.value === 'US';
    const delivery = f.order_type.value === 'Delivery';
    const checks = [
      [f.name, f.name.value.trim(), 'your name'],
      [f.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim()), 'a valid e-mail'],
      [f.phone, f.phone.value.replace(/\D/g, '').length >= 10, 'a phone number'],
      [f.date, f.date.value && f.date.value >= f.date.min, 'a preferred date from today on'],
      [f.country, f.country.value, 'your country'],
      us ? [f.state, f.state.value.trim(), 'your state'] : [f.province, f.province.value, 'your province']
    ];
    if (delivery) checks.push([f.street, f.street.value.trim(), 'your street address'], [f.city, f.city.value.trim(), 'your city'], [f.postal, f.postal.value.trim(), us ? 'your zip code' : 'your postal code']);

    const missing = checks.filter(([, ok]) => !ok).map(([, , label]) => label);
    if (!f.terms.checked) missing.push('agreement to the Terms and Conditions');
    if (!show) return !missing.length;

    checks.forEach(([el, ok]) => el.setAttribute('aria-invalid', String(!ok)));
    const err = $('co-error');
    err.hidden = !missing.length;
    if (missing.length) {
      err.textContent = 'Please add ' + missing.join(', ') + '.';
      const first = checks.find(([, ok]) => !ok);
      (first ? first[0] : f.terms).focus();
    }
    return !missing.length;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // "Checkout as User" goes to sign in first; the cart and typed details are kept for when they return
    if (e.submitter && e.submitter.value === 'user') { window.location.href = 'account.html'; return; }
    if (!validate(true)) return;
    go(3, 'push');
  });
  form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') e.target.removeAttribute('aria-invalid'); });

  /* Typed details are kept for this browser tab only, so a refresh or Back doesn't empty the form */
  const SAVED = 'co-details';
  try {
    const saved = JSON.parse(sessionStorage.getItem(SAVED)) || {};
    Object.entries(saved).forEach(([name, value]) => {
      const el = form.elements[name];
      if (!el) return;
      if (el instanceof RadioNodeList) el.forEach((r) => { r.checked = r.value === value; });
      else if (el.type === 'checkbox') el.checked = value === true;
      else el.value = value;
    });
  } catch (e) { /* nothing saved */ }
  form.addEventListener('input', saveDetails);
  form.addEventListener('change', saveDetails);
  function saveDetails() {
    const data = {};
    [...form.elements].forEach((el) => {
      if (!el.name || el.name === 'as' || (el.type === 'radio' && !el.checked)) return;
      data[el.name] = el.type === 'checkbox' ? el.checked : el.value;
    });
    try { sessionStorage.setItem(SAVED, JSON.stringify(data)); } catch (e) { /* preview only */ }
  }

  /* ---------- Step 3: pay ----------
     On the live store this hands over to PayPal, which returns to order-confirmation.html when
     paid or payment-failed.html when cancelled. The preview saves the order for the confirmation
     page to show, empties the cart and goes straight to the confirmation. */
  $('co-pay-btn').addEventListener('click', () => {
    const f = form.elements;
    const type = f.order_type.value;
    const subtotal = cart.reduce((s, l) => s + l.qty * l.price, 0);
    const ship = shippingFor(type, f.country.value, f.province.value);
    const order = {
      no: 'P' + String(Date.now()).slice(-6),
      placed: new Date().toISOString(),
      items: cart,
      subtotal, ship, total: subtotal + ship,
      type, date: f.date.value,
      name: f.name.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim(),
      address: type === 'Pickup' ? null : {
        street: f.street.value.trim(), city: f.city.value.trim(),
        region: f.country.value === 'US' ? f.state.value.trim() : f.province.value,
        postal: f.postal.value.trim().toUpperCase(), country: f.country.value
      }
    };
    try {
      sessionStorage.setItem('co-order', JSON.stringify(order));
      sessionStorage.removeItem('co-details');   // the next order starts with an empty form
      localStorage.removeItem('sh-cart');
    } catch (e) { /* preview only */ }
    window.location.href = 'order-confirmation.html';
  });

  $('co-coupon').addEventListener('submit', (e) => {
    e.preventDefault();
    toast('Design preview: coupons will be checked by the store platform');
  });

  let toastTimer;
  function toast(msg) {
    const t = $('co-toast');
    t.textContent = msg;
    t.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-shown'), 2600);
  }

  syncForm();
  go(stepFromHash());
})();
