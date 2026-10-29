/* =========================================================
   Sujok Homeo Clinic — header store controls (every page)
   - Cart icon: shows how many items are in the cart (kept in this browser by shop.js).
   - Search icon: opens a search bar under the header; searching opens the shop with the
     results from every category (shop.html?q=…).
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Cart count ---------- */
  function updateCount() {
    let count = 0;
    try { count = (JSON.parse(localStorage.getItem('sh-cart')) || []).reduce((s, l) => s + l.qty, 0); } catch (e) { count = 0; }
    document.querySelectorAll('.cart-count').forEach((el) => { el.textContent = count; });
    document.querySelectorAll('.cart-link').forEach((el) => el.setAttribute('aria-label', 'Cart, ' + count + ' item' + (count === 1 ? '' : 's')));
  }
  updateCount();
  // keep the count right when the cart changes in another tab
  window.addEventListener('storage', (e) => { if (e.key === 'sh-cart') updateCount(); });

  /* ---------- Search bar ---------- */
  const header = document.querySelector('.site-header');
  const btn = document.querySelector('.nav-actions .icon-btn[aria-label="Search"]');
  if (!header || !btn) return;

  const bar = document.createElement('div');
  bar.className = 'site-search';
  bar.id = 'site-search';
  bar.hidden = true;
  bar.innerHTML =
    '<div class="container">' +
      '<form class="site-search-form" action="shop.html" method="get" role="search">' +
        '<label class="site-search-field">' +
          '<svg class="icon" aria-hidden="true"><use href="#i-search"/></svg>' +
          '<span class="visually-hidden">Search remedies</span>' +
          '<input type="search" name="q" placeholder="Search remedies by name or abbreviation" autocomplete="off" required>' +
        '</label>' +
        '<button class="btn btn-primary" type="submit"><svg class="icon" aria-hidden="true"><use href="#i-search"/></svg><span class="btn-text">Search</span></button>' +
        '<button class="icon-btn" type="button" data-close aria-label="Close search"><svg class="icon" aria-hidden="true"><use href="#i-close"/></svg></button>' +
      '</form>' +
    '</div>';
  header.appendChild(bar);

  const input = bar.querySelector('input');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'site-search');

  function open() {
    // phones: the search icon is inside the menu, so close the menu to show the bar on its own
    const toggle = document.querySelector('.nav-toggle');
    if (toggle && toggle.getAttribute('aria-expanded') === 'true') toggle.click();
    bar.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    input.focus();
  }
  function close(focusBtn) {
    bar.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    if (focusBtn) btn.focus();
  }

  btn.addEventListener('click', () => (bar.hidden ? open() : close(false)));
  bar.querySelector('[data-close]').addEventListener('click', () => close(true));
  bar.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(true); });
  bar.querySelector('form').addEventListener('submit', (e) => {
    if (!input.value.trim()) { e.preventDefault(); input.focus(); }
  });

  // on the shop page, show what was searched for
  const q = new URLSearchParams(location.search).get('q');
  if (q && /\/shop(\.html)?$/.test(location.pathname)) input.value = q;
})();
