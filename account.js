/* =========================================================
   Sujok Homeo Clinic — Account (design preview)
   Switches between Sign in, Create account and Forgot password (each has its own address:
   #signin, #register, #forgot), checks the fields, and shows what would happen next.
   Nothing is sent anywhere.
   ========================================================= */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const VIEWS = {
    signin:   { form: 'ac-signin',   page: 'Sign In',        title: 'Welcome back',       lead: 'Sign in to your account to order and track your remedies.' },
    register: { form: 'ac-register', page: 'Create Account', title: 'Create your account', lead: 'It only takes a minute, and makes your next order faster.' },
    forgot:   { form: 'ac-forgot',   page: 'Reset Password', title: 'Reset your password', lead: 'Enter the e-mail you signed up with and we\'ll send you a link to choose a new password.' }
  };
  const tabs = [$('ac-tab-signin'), $('ac-tab-register')];

  /* ---------- Views ---------- */
  function show(name, focus) {
    const v = VIEWS[name] || VIEWS.signin;
    name = VIEWS[name] ? name : 'signin';
    Object.values(VIEWS).forEach((x) => { $(x.form).hidden = x !== v; });
    $('ac-title').textContent = v.title;
    $('ac-lead').textContent = v.lead;
    document.querySelector('.ac-tabs').hidden = name === 'forgot';
    tabs.forEach((t) => {
      const on = t.getAttribute('aria-controls') === v.form;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    document.title = v.page + ' | Sujok Homeo Clinic, Brampton';
    if (focus) {
      const first = $(v.form).querySelector('input');
      if (first) first.focus();
    }
  }
  const fromHash = () => location.hash.slice(1);
  window.addEventListener('hashchange', () => show(fromHash(), true));

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => { location.hash = i ? 'register' : 'signin'; });
    // arrow keys move between the two tabs
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const next = tabs[1 - i];
      next.focus();
      next.click();
    });
  });

  // carry the e-mail across views so it isn't typed twice
  document.querySelectorAll('.ac-form input[name="email"]').forEach((input) => {
    input.addEventListener('input', () => {
      document.querySelectorAll('.ac-form input[name="email"]').forEach((other) => { if (other !== input) other.value = input.value; });
    });
  });

  /* ---------- Show / hide password ---------- */
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

  /* ---------- Password rules (Create account) ---------- */
  const RULES = {
    len: (p) => p.length >= 8,
    num: (p) => /\d/.test(p),
    case: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p)
  };
  const regPw = $('ac-register-pw');
  regPw.addEventListener('input', () => {
    document.querySelectorAll('#ac-pw-rules li').forEach((li) => li.classList.toggle('is-met', RULES[li.dataset.rule](regPw.value)));
  });

  /* ---------- Checking the forms ---------- */
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  function check(form, checks) {
    const missing = [];
    checks.forEach(([el, ok, label]) => {
      if (el) el.setAttribute('aria-invalid', String(!ok));
      if (!ok) missing.push(label);
    });
    const msg = form.querySelector('.ac-msg');
    msg.hidden = !missing.length;
    if (missing.length) {
      msg.textContent = 'Please add ' + missing.join(', ') + '.';
      const first = checks.find(([el, ok]) => el && !ok);
      if (first) first[0].focus();
    }
    return !missing.length;
  }

  $('ac-signin').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target.elements;
    if (!check(e.target, [
      [f.email, isEmail(f.email.value), 'a valid e-mail'],
      [f.password, f.password.value, 'your password']
    ])) return;
    // design preview: any e-mail and password "signs in" and opens the sample account
    window.location.href = 'my-account.html';
  });

  $('ac-register').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target.elements;
    const pw = f.password.value;
    if (!check(e.target, [
      [f.first, f.first.value.trim(), 'your first name'],
      [f.last, f.last.value.trim(), 'your last name'],
      [f.email, isEmail(f.email.value), 'a valid e-mail'],
      [f.phone, f.phone.value.replace(/\D/g, '').length >= 10, 'a phone number'],
      [f.password, Object.values(RULES).every((r) => r(pw)), 'a password that meets the rules below it'],
      [f.terms, f.terms.checked, 'agreement to the Terms and Privacy Policy']
    ])) return;
    // design preview: opens the sample account
    window.location.href = 'my-account.html';
  });

  $('ac-forgot').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target.elements;
    if (!check(e.target, [[f.email, isEmail(f.email.value), 'a valid e-mail']])) return;
    e.target.querySelector('.ac-sent-email').textContent = f.email.value.trim();
    e.target.querySelector('.ac-sent').hidden = false;
    e.target.querySelector('.ac-submit').hidden = true;
    f.email.closest('.ac-field').hidden = true;
  });

  // a field marked as missing clears as soon as it's filled in
  document.querySelectorAll('.ac-form').forEach((form) => {
    form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') e.target.removeAttribute('aria-invalid'); });
    form.addEventListener('change', (e) => { if (e.target.type === 'checkbox') e.target.removeAttribute('aria-invalid'); });
  });

  show(fromHash(), false);
})();
