/* =========================================================
   Sujok Homeo Clinic — Reset password (design preview)
   The page the "reset your password" e-mail links to. Checks the new password and shows the
   "password changed" message. Nothing is sent anywhere.
   ========================================================= */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const form = $('rp-form');
  const RULES = {
    len: (p) => p.length >= 8,
    num: (p) => /\d/.test(p),
    case: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p)
  };

  document.querySelectorAll('.ac-eye').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      btn.textContent = showing ? 'Show' : 'Hide';
      btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
      btn.setAttribute('aria-pressed', String(!showing));
    });
  });

  const pw = form.elements.password;
  pw.addEventListener('input', () => {
    document.querySelectorAll('#rp-rules li').forEach((li) => li.classList.toggle('is-met', RULES[li.dataset.rule](pw.value)));
  });
  form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') e.target.removeAttribute('aria-invalid'); });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = form.elements;
    const checks = [
      [f.password, Object.values(RULES).every((r) => r(f.password.value)), 'a password that meets the rules below it'],
      [f.confirm, f.confirm.value && f.confirm.value === f.password.value, 'the same password in both boxes']
    ];
    const missing = checks.filter(([, ok]) => !ok).map(([, , label]) => label);
    checks.forEach(([el, ok]) => el.setAttribute('aria-invalid', String(!ok)));
    const msg = form.querySelector('.ac-msg');
    msg.hidden = !missing.length;
    if (missing.length) {
      msg.textContent = 'Please enter ' + missing.join(', and ') + '.';
      checks.find(([, ok]) => !ok)[0].focus();
      return;
    }
    form.hidden = true;
    $('rp-done').hidden = false;
    $('rp-done').focus();
  });
})();
