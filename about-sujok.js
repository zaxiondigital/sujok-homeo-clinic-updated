/* Sujok Homeo Clinic — About Us page interactions (vanilla JS)
   Only the shared header and footer behaviour from script-v3.js: this page has no
   carousel, service tabs or booking form, and script-v3.js stops with an error when
   the booking form is missing. Keep these blocks in step with script-v3.js. */
(function () {
  'use strict';

  const header = document.querySelector('.site-header');
  const nav = document.getElementById('site-nav');
  const navToggle = document.querySelector('.nav-toggle');
  const mobileQuery = window.matchMedia('(max-width: 1080px)');

  /* ---------- Header shadow on scroll ---------- */
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
    navToggle.querySelector('.visually-hidden').textContent = open ? 'Close menu' : 'Open menu';
  }

  navToggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));

  // Close the mobile menu after choosing a link
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a') && mobileQuery.matches) setMenu(false);
  });

  mobileQuery.addEventListener('change', () => setMenu(false));

  /* ---------- Shop Online dropdown ---------- */
  const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

  function closeDropdowns(except) {
    dropdownToggles.forEach((btn) => {
      if (btn !== except) btn.setAttribute('aria-expanded', 'false');
    });
  }

  dropdownToggles.forEach((btn) => {
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      closeDropdowns(btn);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.has-dropdown')) closeDropdowns();
  });

  // Escape closes open menus and returns focus to their trigger
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const openToggle = document.querySelector('.dropdown-toggle[aria-expanded="true"]');
    if (openToggle) {
      closeDropdowns();
      openToggle.focus();
    } else if (nav.classList.contains('is-open')) {
      setMenu(false);
      navToggle.focus();
    }
  });

  /* ---------- Footer year ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
