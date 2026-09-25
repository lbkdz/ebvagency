'use strict';

/* ── Lenis Smooth Scroll ── */
(function () {
  if (typeof Lenis === 'undefined') return;
  const lenis = new Lenis({ duration: 1.25, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
  window._lenis = lenis;
})();

/* ── Text Scramble ── */
(function () {
  const CHARS = '!<>-_\\/[]{}—=+*^?#♠♥♦♣ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  function scramble(el) {
    const original = el.dataset.original || el.innerText;
    el.dataset.original = original;
    let frame = 0;
    const queue = original.split('').map((to, i) => ({
      to, start: Math.floor(Math.random() * 6), end: Math.floor(Math.random() * 10) + 6, char: ''
    }));
    let raf;
    (function tick() {
      let out = '', done = 0;
      queue.forEach(q => {
        if (frame >= q.end) { out += q.to; done++; }
        else if (frame >= q.start) {
          if (!q.char || Math.random() < 0.3) q.char = CHARS[Math.floor(Math.random() * CHARS.length)];
          out += '<span class="scramble-char">' + q.char + '</span>';
        } else { out += q.to; }
      });
      el.innerHTML = out;
      if (done < queue.length) { frame++; raf = requestAnimationFrame(tick); }
    })();
    return () => cancelAnimationFrame(raf);
  }

  document.querySelectorAll('.client-item').forEach(el => {
    let cancel;
    el.addEventListener('mouseenter', () => { if (cancel) cancel(); cancel = scramble(el); });
    el.addEventListener('mouseleave', () => {
      if (cancel) cancel();
      el.textContent = el.dataset.original || el.textContent;
    });
  });
})();

/* ── 3D Card Tilt ── */
(function () {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  document.querySelectorAll('.play-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      card.style.setProperty('--rx', (y * -18) + 'deg');
      card.style.setProperty('--ry', (x *  18) + 'deg');
    });
    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
})();

/* ── Custom Cursor ── */
(function () {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const glow = document.getElementById('cursorGlow');
  const dot  = document.getElementById('cursorDot');
  if (!glow || !dot) return;

  let mx = 0, my = 0, gx = 0, gy = 0, dirty = false, rafId = null;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
    if (!dirty) { dirty = true; rafId = requestAnimationFrame(tick); }
  });

  function tick() {
    gx += (mx - gx) * 0.07;
    gy += (my - gy) * 0.07;
    glow.style.left = (gx - 250) + 'px';
    glow.style.top  = (gy - 250) + 'px';
    const dist = Math.abs(mx - gx) + Math.abs(my - gy);
    if (dist > 0.3) { rafId = requestAnimationFrame(tick); }
    else { dirty = false; }
  }

  document.querySelectorAll('a, button, .work-item, .team-card, .stat-item, .service-item').forEach(el => {
    el.addEventListener('mouseenter', () => dot.classList.add('expanded'));
    el.addEventListener('mouseleave', () => dot.classList.remove('expanded'));
  });
})();

/* ── Scroll Progress Bar ── */
(function () {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const total = document.body.scrollHeight - window.innerHeight;
    bar.style.width = (window.scrollY / total * 100) + '%';
  }, { passive: true });
})();

/* ── Nav Scrolled State ── */
(function () {
  const nav = document.getElementById('mainNav');
  if (!nav) return;
  function update() { nav.classList.toggle('scrolled', window.scrollY > 60); }
  window.addEventListener('scroll', update, { passive: true });
  update();
})();

/* ── Hero Parallax (scroll + mouse) ── */
(function () {
  const hero    = document.querySelector('.hero');
  const img     = document.querySelector('.hero-bg img');
  const content = document.querySelector('.hero-content');
  const wraps   = Array.from(document.querySelectorAll('.hfc-wrap'));
  if (!img) return;

  const heroLines = Array.from(document.querySelectorAll('.hero-line'));

  window.addEventListener('scroll', () => {
    const sy = window.scrollY;
    if (sy < window.innerHeight) {
      img.style.transform = `translateY(${sy * 0.28}px)`;

      // Title lines drift left/right on scroll
      const p = sy / window.innerHeight;
      heroLines.forEach((line, i) => {
        const dir = i % 2 === 0 ? -1 : 1;
        line.style.translate = `${p * dir * 60}px 0`;
      });

      // Hero content fades out
      if (content) content.style.opacity = Math.max(0, 1 - p * 1.8);
    }
  }, { passive: true });

  if (!hero || !window.matchMedia('(pointer: fine)').matches) return;

  let tx = 0, ty = 0, cx = 0, cy = 0, rafId = null, dirty = false;

  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width  - 0.5;
    ty = (e.clientY - r.top)  / r.height - 0.5;
    if (!dirty) { dirty = true; rafId = requestAnimationFrame(tick); }
  });

  hero.addEventListener('mouseleave', () => { tx = 0; ty = 0; });

  function tick() {
    cx += (tx - cx) * 0.07;
    cy += (ty - cy) * 0.07;

    if (content) content.style.transform = `translate(${cx * -9}px, ${cy * -6}px)`;

    wraps.forEach(w => {
      const d = parseFloat(w.dataset.depth || 2) * 14;
      w.style.transform = `translate(${cx * d}px, ${cy * d * 0.65}px)`;
    });

    const dist = Math.abs(tx - cx) + Math.abs(ty - cy);
    if (dist > 0.002) { rafId = requestAnimationFrame(tick); }
    else { dirty = false; }
  }
})();

/* ── Mobile Hamburger Menu ── */
(function () {
  const btn  = document.getElementById('navHamburger');
  const menu = document.getElementById('navMobile');
  if (!btn || !menu) return;

  function close() {
    btn.classList.remove('open');
    menu.classList.remove('open');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', () => {
    const open = btn.classList.toggle('open');
    menu.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });

  menu.querySelectorAll('a, button').forEach(el => el.addEventListener('click', close));
})();

/* ── Services Bands — mobile click toggle ── */
(function () {
  const bands = document.querySelectorAll('.svc-band');
  if (!bands.length) return;
  bands.forEach(band => {
    band.querySelector('.svc-band-row').addEventListener('click', () => {
      const isOpen = band.classList.contains('open');
      bands.forEach(b => b.classList.remove('open'));
      if (!isOpen) band.classList.add('open');
    });
  });
})();

/* ── Scroll Reveal with Stagger ── */
(function () {
  const ease = 'cubic-bezier(0.16, 1, 0.3, 1)';

  /* Elements that animate individually */
  const singles = [
    '.section-label',
    '.work-title',
    '.stats-headline',
    '.team-title',
    '.cta-title',
    '.cta-btn',
    '.footer-logo',
    '.footer-tagline',
  ];

  /* Groups — siblings stagger by `gap` ms */
  const groups = [
    { sel: '.service-item',  gap: 70,  type: 'up'    },
    { sel: '.stat-item',     gap: 100, type: 'up'    },
    { sel: '.process-step',  gap: 100, type: 'left'  },
    { sel: '.team-card',     gap: 110, type: 'scale' },
  ];

  function init(el, type, delayMs) {
    el.style.transitionDelay = delayMs + 'ms';
    el.style.transitionDuration = '0.85s';
    el.style.transitionTimingFunction = ease;
    el.style.transitionProperty = 'opacity, transform';
    el.style.willChange = 'opacity, transform';

    if (type === 'up') {
      el.style.opacity = '0';
      el.style.transform = 'translateY(40px)';
    } else if (type === 'left') {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-30px)';
    } else if (type === 'scale') {
      el.style.opacity = '0';
      el.style.transform = 'scale(0.93)';
    } else {
      el.style.opacity = '0';
      el.style.transform = 'translateY(28px)';
    }
  }

  function show(el) {
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.addEventListener('transitionend', () => { el.style.willChange = 'auto'; }, { once: true });
  }

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      show(entry.target);
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  const groupObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const children = entry.target._revealChildren;
      if (children) children.forEach(show);
      groupObs.unobserve(entry.target);
    });
  }, { threshold: 0.08 });

  /* Init singles */
  singles.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      init(el, 'up', 0);
      obs.observe(el);
    });
  });

  /* Init groups — observe the parent, reveal children on trigger */
  groups.forEach(({ sel, gap, type }) => {
    const parentMap = new Map();
    document.querySelectorAll(sel).forEach(el => {
      const p = el.parentElement;
      if (!parentMap.has(p)) parentMap.set(p, []);
      parentMap.get(p).push(el);
    });

    parentMap.forEach((els, parent) => {
      els.forEach((el, i) => init(el, type, i * gap));
      parent._revealChildren = els;
      groupObs.observe(parent);
    });
  });
})();

/* ── Animated Counters ── */
(function () {
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const els = Array.from(document.querySelectorAll('[data-count]'));
  if (!els.length) return;

  function animateCount(el) {
    const target = parseInt(el.dataset.count);
    el.dataset.done = '1';
    const start = performance.now();
    (function frame(now) {
      const p = Math.min((now - start) / 1800, 1);
      el.textContent = Math.floor(easeOut(p) * target).toLocaleString();
      if (p < 1) requestAnimationFrame(frame);
    })(performance.now());
  }

  function check() {
    els.forEach(el => {
      if (el.dataset.done) return;
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9 && r.bottom > 0) animateCount(el);
    });
  }

  window.addEventListener('scroll', check, { passive: true });
  check();
})();

/* ── Magnetic Buttons ── */
(function () {
  document.querySelectorAll('.hero-cta, .cta-btn, .nav-cta').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width  / 2) * 0.2;
      const y = (e.clientY - r.top  - r.height / 2) * 0.2;
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });
})();

/* ── Playing Card Fan ── */
(function () {
  const stage = document.querySelector('.card-fan-stage');
  if (!stage) return;
  const obs = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    stage.classList.add('dealt');
    obs.disconnect();
  }, { threshold: 0.25 });
  obs.observe(stage);
})();

/* ── Active Nav Link on Scroll ── */
(function () {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 140) current = s.id;
    });
    navLinks.forEach(l => {
      l.classList.toggle('active', l.getAttribute('href') === '#' + current);
    });
  }, { passive: true });
})();
