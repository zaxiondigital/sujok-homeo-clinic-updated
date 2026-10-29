/* =========================================================
   Sujok Homeo Clinic — Payment not completed (design preview)
   Lists what is still in the cart (kept in this browser by shop.js) so the customer can see
   nothing was lost.
   ========================================================= */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const money = (n) => '$' + n.toFixed(2);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let cart = [];
  try { cart = JSON.parse(localStorage.getItem('sh-cart')) || []; } catch (e) { cart = []; }

  $('os-cart').innerHTML = cart.length
    ? cart.map((l) => '<li><span>' + l.qty + ' × ' + esc(l.name) + (l.option ? ' (' + esc(l.option) + ')' : '') + '</span><span>' + money(l.qty * l.price) + '</span></li>').join('')
    : '<li><span>Your cart is empty.</span></li>';
  $('os-subtotal').textContent = money(cart.reduce((s, l) => s + l.qty * l.price, 0));
  document.querySelectorAll('.cart-count').forEach((el) => { el.textContent = cart.reduce((s, l) => s + l.qty, 0); });
})();
