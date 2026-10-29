/* =========================================================
   Sujok Homeo Clinic — Order confirmation (design preview)
   Shows the order that checkout.js saved for this browser tab. Opened on its own (no order
   saved), it shows a sample order so the design can still be reviewed.
   ========================================================= */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const money = (n) => '$' + n.toFixed(2);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = (iso, opts) => new Date(iso.length === 10 ? iso + 'T12:00:00' : iso).toLocaleDateString('en-CA', opts);

  let order = null;
  try { order = JSON.parse(sessionStorage.getItem('co-order')); } catch (e) { order = null; }

  if (!order) {
    // sample order for reviewing the page on its own (prices from the store list)
    const items = [
      { name: 'Arnica Montana', option: 'Globules - 30c', price: 15, qty: 2 },
      { name: 'Calendula (creme)', option: '', price: 18.99, qty: 1 }
    ];
    const subtotal = items.reduce((s, l) => s + l.qty * l.price, 0);
    order = {
      no: '1049', placed: new Date().toISOString(), items, subtotal, ship: 0, total: subtotal,
      type: 'Pickup', date: new Date().toISOString().slice(0, 10),
      name: 'Sample Customer', email: 'sample@example.com', phone: '555-555-0100', address: null
    };
    $('os-preview').textContent = 'Design preview: this is a sample order. Place an order from the shop to see your own here.';
  }

  const delivery = order.type !== 'Pickup';
  $('os-name').textContent = order.name.split(/\s+/)[0];
  $('os-email').textContent = order.email;
  $('os-no').textContent = order.no;
  $('os-contact').innerHTML = [order.name, order.email, order.phone].map(esc).join('<br>');
  $('os-way-title').textContent = delivery ? 'Delivery' : 'Pickup';
  $('os-way').innerHTML = (delivery
    ? [order.address.street, ([order.address.city, order.address.region].filter(Boolean).join(', ') + ' ' + order.address.postal).trim()]
    : ['145 Clarence Street, Unit 26', 'Brampton, Ontario L6W 1T2']
  ).map(esc).join('<br>') + '<br>Preferred date: ' + esc(fmtDate(order.date, { weekday: 'long', month: 'long', day: 'numeric' }));
  $('os-date').textContent = 'Paid ' + fmtDate(order.placed, { year: 'numeric', month: 'long', day: 'numeric' });

  if (delivery) {
    $('os-next-3').innerHTML = '<strong>Shipped</strong><p>We\'ll e-mail you when your order is on its way.</p>';
  }

  $('os-items').innerHTML = order.items.map((l) =>
    '<li><div><p class="os-item-name">' + esc(l.name) + '</p><p class="os-item-opt">' + (l.option ? esc(l.option) + ' · ' : '') + l.qty + ' × ' + money(l.price) + '</p></div>' +
    '<span class="os-item-amt">' + money(l.qty * l.price) + '</span></li>'
  ).join('');

  $('os-subtotal').textContent = money(order.subtotal);
  $('os-ship').textContent = delivery ? money(order.ship) : 'Free (pickup)';
  $('os-total').textContent = money(order.total);

  $('os-print').addEventListener('click', () => window.print());

  // the cart was emptied when the order was placed
  let count = 0;
  try { count = (JSON.parse(localStorage.getItem('sh-cart')) || []).reduce((s, l) => s + l.qty, 0); } catch (e) { count = 0; }
  document.querySelectorAll('.cart-count').forEach((el) => { el.textContent = count; });
})();
