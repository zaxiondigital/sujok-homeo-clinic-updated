/* =========================================================
   Sujok Homeo Clinic — Re-order Form (design preview)
   Checks the fields and shows the "Request received" message. Nothing is sent anywhere.
   ========================================================= */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const form = $('ro-form');
  const done = $('ro-done');
  const supply = form.querySelector('.ro-supply');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = form.elements;
    const checks = [
      [f.client_id, f.client_id.value.trim(), 'your Client ID'],
      [f.name, f.name.value.trim(), 'your name'],
      [f.phone, f.phone.value.replace(/\D/g, '').length >= 10, 'a phone number'],
      [f.email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim()), 'a valid e-mail']
    ];
    const missing = [];
    if (!f.supply.value) missing.push('how many months\' supply you need');
    supply.classList.toggle('is-invalid', !f.supply.value);
    checks.forEach(([el, ok, label]) => { el.setAttribute('aria-invalid', String(!ok)); if (!ok) missing.push(label); });

    const msg = $('ro-msg');
    msg.hidden = !missing.length;
    if (missing.length) {
      msg.textContent = 'Please add ' + missing.join(', ') + '.';
      (f.supply.value ? checks.find(([, ok]) => !ok)[0] : form.querySelector('.ro-opt input')).focus();
      return;
    }

    $('ro-done-name').textContent = f.name.value.trim().split(/\s+/)[0];
    // "2 Months Supply" → "2-month supply"
    $('ro-done-supply').textContent = f.supply.value.toLowerCase().replace(/ months?/, '-month');
    form.hidden = true;
    done.hidden = false;
    done.focus();
  });

  form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') e.target.removeAttribute('aria-invalid'); });
  form.addEventListener('change', (e) => { if (e.target.name === 'supply') supply.classList.remove('is-invalid'); });

  $('ro-again').addEventListener('click', () => {
    form.reset();
    $('ro-msg').hidden = true;
    done.hidden = true;
    form.hidden = false;
    form.querySelector('.ro-opt input').focus();
  });
})();
