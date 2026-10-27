/* Sujok Homeo Clinic — homepage interactions (vanilla JS) */
(function () {
  'use strict';

  const header = document.querySelector('.site-header');
  const nav = document.getElementById('site-nav');
  const navToggle = document.querySelector('.nav-toggle');
  const mobileQuery = window.matchMedia('(max-width: 1180px)');   // same breakpoint as the collapsible menu in style-v3.css

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

  // Close the mobile menu after choosing an in-page link
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

  /* ---------- Active nav link while scrolling ---------- */
  const navLinks = [...document.querySelectorAll('.nav-list .nav-link[href^="#"]')];
  const sections = ['about', 'services']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    // Several links share a target (e.g. Treatments/Conditions); highlight only the first.
    const setActive = (hash) => {
      const target = navLinks.find((l) => l.getAttribute('href') === hash);
      if (!target) return;   // no menu link for this section (About now opens its own page): keep the current highlight
      navLinks.forEach((link) => {
        const active = link === target;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive('#' + entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => observer.observe(s));
    window.addEventListener('scroll', () => {
      if (window.scrollY < 200) setActive('#top');
    }, { passive: true });
  }

  /* ---------- Hero carousel ----------
     Slides move horizontally (CSS transition on .hero-track). Auto-advances every
     5s and loops forward forever: a copy of the first slide sits after the last
     (and a copy of the last before the first), so 3 → 1 keeps sliding the same way,
     then the track silently snaps back to the real slide. Starts on page load; pauses
     only while the mouse is over the controls or CTAs, during keyboard focus or a touch,
     in a hidden tab, or via the pause button. Reduced motion: slides change without
     sliding. Swipe on touch screens. */
  const carousel = document.querySelector('.hero-carousel');
  if (carousel) {
    const track = carousel.querySelector('.hero-track');
    const slides = [...track.children];
    const controls = carousel.querySelector('.hero-controls');
    const dots = [...carousel.querySelectorAll('.hero-dot')];
    const pauseBtn = carousel.querySelector('[data-hero-pause]');
    const viewport = carousel.querySelector('.hero-viewport');
    const AUTOPLAY_MS = 5000;

    let current = 0;          // real slide index (0..n-1)
    let position = 1;         // track position including the leading clone
    let animating = false;    // blocks overlapping transitions
    let settleTimer = null;
    let timer = null;         // the one autoplay timer
    // Always starts playing. With reduced motion the CSS removes the slide animation,
    // so slides change in place without movement; the pause button stops it entirely.
    let userPaused = false;
    const holds = new Set(); // temporary pauses: hover, focus, touch, hidden tab

    // Decorative copies for the seamless loop: hidden from assistive tech and focus
    const makeClone = (slide) => {
      const clone = slide.cloneNode(true);
      clone.removeAttribute('id');
      clone.classList.remove('is-active');
      clone.classList.add('hero-slide--clone');
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('inert', '');
      clone.removeAttribute('role');
      clone.removeAttribute('aria-roledescription');
      clone.removeAttribute('aria-label');
      clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
      clone.querySelectorAll('h1').forEach((h1) => { // keep a single <h1> on the page
        const div = document.createElement('div');
        div.className = h1.className;
        div.innerHTML = h1.innerHTML;
        h1.replaceWith(div);
      });
      return clone;
    };
    track.append(makeClone(slides[0]));
    track.prepend(makeClone(slides[slides.length - 1]));

    const transitionMs = () => parseFloat(getComputedStyle(track).transitionDuration) * 1000 || 0;

    function setPosition(pos, animate) {
      position = pos;
      if (!animate) track.style.transition = 'none';
      track.style.transform = `translate3d(${-pos * 100}%, 0, 0)`;
      if (!animate) {
        void track.offsetWidth; // apply the jump before re-enabling the transition
        track.style.removeProperty('transition');
      }
    }

    // After sliding onto a clone, jump invisibly to the matching real slide
    function settle() {
      clearTimeout(settleTimer);
      animating = false;
      if (position === 0) setPosition(slides.length, false);
      else if (position === slides.length + 1) setPosition(1, false);
    }

    track.addEventListener('transitionend', (e) => {
      if (e.target === track && e.propertyName === 'transform') settle();
    });

    // index may be -1 or n to slide onto a clone; it is normalised for state/dots
    function goTo(index, animate = true) {
      if (animating) return false;
      current = (index + slides.length) % slides.length;
      const ms = animate ? transitionMs() : 0;
      setPosition(index + 1, ms > 0);
      if (ms > 0) {
        animating = true;
        settleTimer = setTimeout(settle, ms + 100); // fallback if transitionend never fires
      } else {
        settle();
      }
      slides.forEach((slide, i) => {
        const active = i === current;
        slide.classList.toggle('is-active', active);
        slide.toggleAttribute('inert', !active);       // keep hidden slides out of tab order
        slide.setAttribute('aria-hidden', String(!active));
      });
      dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === current)));
      return true;
    }

    function schedule() {
      clearTimeout(timer);
      timer = null;
      const running = !userPaused && holds.size === 0;
      // Announce slide changes only when the visitor is driving them
      track.setAttribute('aria-live', running ? 'off' : 'polite');
      if (running) timer = setTimeout(() => { goTo(current + 1); schedule(); }, AUTOPLAY_MS);
    }

    function hold(reason, on) {
      if (on) holds.add(reason); else holds.delete(reason);
      schedule();
    }

    function setUserPaused(paused) {
      userPaused = paused;
      pauseBtn.setAttribute('aria-pressed', String(paused));
      pauseBtn.querySelector('use').setAttribute('href', paused ? '#i-play' : '#i-pause');
      pauseBtn.querySelector('.visually-hidden').textContent = paused ? 'Play slideshow' : 'Pause slideshow';
      schedule();
    }

    // Manual navigation restarts the countdown so a slide is never skipped instantly.
    // Clicks during a transition are ignored rather than queued.
    const navigate = (index) => { if (goTo(index)) schedule(); };

    carousel.querySelector('[data-hero-prev]').addEventListener('click', () => navigate(current - 1));
    carousel.querySelector('[data-hero-next]').addEventListener('click', () => navigate(current + 1));
    dots.forEach((dot, i) => dot.addEventListener('click', () => navigate(i)));
    pauseBtn.addEventListener('click', () => setUserPaused(!userPaused));

    controls.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { navigate(current - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { navigate(current + 1); e.preventDefault(); }
    });

    // Hover pauses only over the things a visitor is about to click (controls and CTAs),
    // not the whole hero, which fills the first screen and usually sits under the cursor.
    // Real mouse pointers only: touch taps send a mouseenter with no matching mouseleave.
    carousel.querySelectorAll('.hero-controls, .hero-slide .btn-row').forEach((el) => {
      el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hold('hover', true); });
      el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hold('hover', false); });
    });
    // Keyboard focus pauses; focus left on an arrow/dot by a mouse click does not
    carousel.addEventListener('focusin', (e) => hold('focus', e.target.matches(':focus-visible')));
    carousel.addEventListener('focusout', (e) => {
      if (!carousel.contains(e.relatedTarget)) hold('focus', false);
    });
    document.addEventListener('visibilitychange', () => hold('hidden', document.hidden));

    // Swipe: horizontal movement over 45px that is clearly more horizontal than vertical
    let touchX = 0, touchY = 0;
    viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) return;
      touchX = e.touches[0].clientX;
      touchY = e.touches[0].clientY;
      hold('touch', true);
    }, { passive: true });
    viewport.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchX;
      const dy = e.changedTouches[0].clientY - touchY;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) navigate(current + (dx < 0 ? 1 : -1));
      hold('touch', false);
    }, { passive: true });
    viewport.addEventListener('touchcancel', () => hold('touch', false), { passive: true });


    controls.hidden = false;
    goTo(0, false); // start on slide 1 without animating
    setUserPaused(userPaused);
  }

  /* ---------- Explore Our Services tabs ----------
     WAI-ARIA tabs: clicking (or arrow keys / Home / End) shows the matching panel,
     which holds that service's image, heading, description, points and link.
     Homeopathy is selected in the HTML, so it is the default without JavaScript too. */
  const tabList = document.querySelector('.v2-tabs');
  if (tabList) {
    const tabs = [...tabList.querySelectorAll('[role="tab"]')];

    const selectTab = (tab, focus) => {
      tabs.forEach((t) => {
        const selected = t === tab;
        t.setAttribute('aria-selected', String(selected));
        t.tabIndex = selected ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !selected;
      });
      if (focus) tab.focus();
    };

    tabs.forEach((tab) => tab.addEventListener('click', () => selectTab(tab, false)));

    tabList.addEventListener('keydown', (e) => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      const next = {
        ArrowRight: tabs[(i + 1) % tabs.length],
        ArrowLeft: tabs[(i - 1 + tabs.length) % tabs.length],
        Home: tabs[0],
        End: tabs[tabs.length - 1],
      }[e.key];
      if (!next) return;
      e.preventDefault();
      selectTab(next, true);
    });
  }

  /* ---------- Scroll reveal ----------
     Content is visible by default; this only hides elements that start below the fold,
     then fades each one in once as it enters the viewport. Skipped entirely when the
     visitor prefers reduced motion or IntersectionObserver is unavailable. */
  const revealTargets = [
    // Shared centred section headings
    '.section-head-center > *',
    // Why Choose Sujok
    '.v2-why-media', '.v2-why-body > .eyebrow', '.v2-why-body > .section-title',
    '.v2-why-body > .section-lead', '.v2-feature', '.v2-why-body > .btn-row',
    // About
    '.v2-about-media', '.v2-about-body > *', '.v2-strip',
    // Services (the tab row and active panel animate as units)
    '.v2-tabs', '.v2-panels',
    // Team and steps
    '.v2-member', '.v2-step', '.v2-steps .btn-row',
    // Booking (the card animates as one unit so its photo and form stay aligned)
    '.booking-card',
    // Visit
    '.v2-visit-body > *', '.v2-visit-media', '.v2-visit-panel',
  ];
  // Grids whose items stagger left-to-right within each row
  const rowStaggerSelector = '.v2-feature, .v2-member, .v2-step';
  const ROW_STAGGER = 110; // ms between items in the same row
  const BATCH_STAGGER = 90; // ms between other items entering together
  const MAX_BATCH_STEPS = 3;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion && 'IntersectionObserver' in window) {
    const finishReveal = (el) => {
      el.classList.remove('reveal', 'is-revealed');
      el.style.removeProperty('--reveal-delay');
    };

    // Position within its row: siblings sharing the same top edge come first
    const columnIndex = (el) => {
      const top = el.offsetTop;
      return [...el.parentElement.children]
        .filter((sib) => Math.abs(sib.offsetTop - top) < 2)
        .indexOf(el);
    };

    const revealObserver = new IntersectionObserver((entries, obs) => {
      let batchStep = 0;
      entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top ||
                        a.boundingClientRect.left - b.boundingClientRect.left)
        .forEach((entry) => {
          const el = entry.target;
          const delay = el.matches(rowStaggerSelector)
            ? columnIndex(el) * ROW_STAGGER
            : Math.min(batchStep++, MAX_BATCH_STEPS) * BATCH_STAGGER;

          el.style.setProperty('--reveal-delay', delay + 'ms');
          el.classList.add('is-revealed');
          obs.unobserve(el); // animate once only

          // Hand control back to the element's own (hover) transitions afterwards
          const done = (e) => {
            if (e && (e.target !== el || e.propertyName !== 'opacity')) return;
            el.removeEventListener('transitionend', done);
            clearTimeout(fallback);
            finishReveal(el);
          };
          const fallback = setTimeout(done, delay + 1000);
          el.addEventListener('transitionend', done);
        });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });

    document.querySelectorAll(revealTargets.join(',')).forEach((el) => {
      // Anything already on screen (nav, hero, or a restored scroll position) stays put
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      el.classList.add('reveal');
      revealObserver.observe(el);
    });

    // Never print hidden content
    window.addEventListener('beforeprint', () => {
      document.querySelectorAll('.reveal').forEach(finishReveal);
    });
  }

  /* ---------- About video: sound toggle ----------
     The video autoplays muted (browsers block autoplay with sound). Turning sound on
     restarts it so the visitor hears the whole welcome. With reduced motion it does not
     autoplay; the poster shows until the visitor presses the button. */
  const aboutVideo = document.querySelector('.v2-about-video');
  const soundBtn = document.querySelector('.v2-sound-toggle');
  if (aboutVideo && soundBtn) {
    if (reduceMotion) {
      aboutVideo.removeAttribute('autoplay');
      aboutVideo.pause();
    }
    const syncSoundBtn = () => {
      const soundOn = !aboutVideo.muted;
      soundBtn.setAttribute('aria-pressed', String(soundOn));
      soundBtn.querySelector('use').setAttribute('href', soundOn ? '#i-volume' : '#i-volume-off');
      soundBtn.querySelector('.visually-hidden').textContent = soundOn ? 'Turn sound off' : 'Turn sound on';
    };
    soundBtn.addEventListener('click', () => {
      if (aboutVideo.muted) {
        aboutVideo.muted = false;
        aboutVideo.currentTime = 0;
        aboutVideo.play().catch(() => {});
      } else {
        aboutVideo.muted = true;
      }
      syncSoundBtn();
    });
    syncSoundBtn();
    soundBtn.hidden = false;
  }

  /* ---------- Booking form ---------- */
  const form = document.getElementById('booking-form');
  const status = document.getElementById('form-status');
  const serviceSelect = document.getElementById('bf-service');

  serviceSelect.addEventListener('change', () => {
    serviceSelect.classList.toggle('has-value', serviceSelect.value !== '');
  });

  function showStatus(html, isError) {
    status.innerHTML = html;
    status.classList.toggle('is-error', Boolean(isError));
    status.hidden = false;
  }

  function validate() {
    let firstInvalid = null;
    form.querySelectorAll('input, select, textarea').forEach((field) => {
      const valid = field.checkValidity();
      field.setAttribute('aria-invalid', String(!valid));
      if (!valid && !firstInvalid) firstInvalid = field;
    });
    return firstInvalid;
  }

  form.addEventListener('input', (e) => {
    if (e.target.getAttribute('aria-invalid') === 'true' && e.target.checkValidity()) {
      e.target.setAttribute('aria-invalid', 'false');
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstInvalid = validate();
    if (firstInvalid) {
      showStatus('Please fill in your name, a valid phone number, a valid email address and choose a service.', true);
      firstInvalid.focus();
      return;
    }

    const endpoint = form.dataset.endpoint;

    // No booking service configured yet: be honest instead of faking a submission.
    if (!endpoint) {
      showStatus(
        'Online booking is not connected yet, so this request has <strong>not</strong> been sent. ' +
        'Please call <a href="tel:+16478562516">647-856-2516</a> or email ' +
        '<a href="mailto:info@sujokhomeoclinic.com">info@sujokhomeoclinic.com</a> to book your consultation.'
      );
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      if (!res.ok) throw new Error('Request failed');
      form.reset();
      serviceSelect.classList.remove('has-value');
      showStatus('Thank you — your request has been sent. We will be in contact to confirm your appointment.');
    } catch (err) {
      showStatus('Sorry, something went wrong sending your request. Please call <a href="tel:+16478562516">647-856-2516</a>.', true);
    } finally {
      button.disabled = false;
    }
  });

  /* ---------- Footer year ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
