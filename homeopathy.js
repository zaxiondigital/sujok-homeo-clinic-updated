/* Sujok Homeo Clinic — Homeopathy page interactions (vanilla JS)
   The header and footer behaviour comes from about-sujok.js; this file only handles
   the Health Topics menu (toggle and placeholder links). */
(function () {
  'use strict';

  /* ---------- Health Topics: collapsible on tablet and phone ----------
     Without JavaScript the full list stays visible. */
  const toggle = document.querySelector('.hp-topics-toggle');
  const list = document.getElementById('hp-topic-list');
  const compact = window.matchMedia('(max-width: 900px)');

  if (toggle && list) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      list.hidden = !open;
    };
    const sync = () => {
      toggle.hidden = !compact.matches;
      setOpen(!compact.matches);   // open on desktop, collapsed on smaller screens
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    compact.addEventListener('change', sync);
    sync();
  }

  /* ---------- Placeholder topic links ----------
     Topics without a page yet link to "#"; stop them jumping to the top of the page. */
  document.querySelectorAll('.hp-topic[href="#"]').forEach((link) => {
    link.addEventListener('click', (e) => e.preventDefault());
  });
})();
