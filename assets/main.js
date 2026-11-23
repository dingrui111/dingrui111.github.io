/* Rui Ding — homepage interactions
   Vanilla JS, no dependencies. Every effect degrades gracefully. */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // ?static=1 disables scroll animation (useful for screenshots and printing)
  var staticMode = /[?&]static=1/.test(window.location.search);

  /* ---------- spectrum motif in the hero ---------- */

  var spectrum = document.getElementById('spectrum');

  function buildSpectrum() {
    if (!spectrum) return;
    var width = spectrum.clientWidth || window.innerWidth;
    var count = Math.max(40, Math.min(110, Math.floor(width / 11)));
    spectrum.innerHTML = '';

    // smooth spectral envelope (a few occupancy humps) plus a little jitter
    var humps = [
      { c: 0.07, w: 0.045, a: 0.42 },
      { c: 0.19, w: 0.028, a: 0.26 },
      { c: 0.36, w: 0.060, a: 0.72 },
      { c: 0.52, w: 0.035, a: 0.34 },
      { c: 0.71, w: 0.055, a: 0.88 },
      { c: 0.88, w: 0.040, a: 0.46 }
    ];

    function envelope(t) {
      var v = 0.07;
      for (var k = 0; k < humps.length; k++) {
        var d = (t - humps[k].c) / humps[k].w;
        v += humps[k].a * Math.exp(-d * d);
      }
      return Math.min(1, v);
    }

    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var bar = document.createElement('span');
      var jitter = (Math.sin(i * 2.37) * 0.5 + 0.5) * 0.07;
      var h = Math.min(100, (envelope(i / count) + jitter) * 100);
      bar.style.height = h.toFixed(1) + '%';
      bar.style.opacity = (0.07 + (h / 100) * 0.15).toFixed(3);
      bar.style.animationDelay = reduceMotion ? '0s' : (i * 5) + 'ms';
      frag.appendChild(bar);
    }
    spectrum.appendChild(frag);
  }

  buildSpectrum();

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildSpectrum, 220);
  });

  /* ---------- sticky nav ---------- */

  var nav = document.getElementById('nav');

  function onScroll() {
    if (!nav) return;
    var atTop = window.scrollY < 80;
    nav.classList.toggle('is-stuck', window.scrollY > 12);
    if (atTop) {
      document.querySelectorAll('.nav-links a.is-current').forEach(function (link) {
        link.classList.remove('is-current');
      });
    }
  }

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- scroll spy ---------- */

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));

  if ('IntersectionObserver' in window && navLinks.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || window.scrollY < 80) return;
        var id = '#' + entry.target.id;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-current', link.getAttribute('href') === id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    ['about', 'news', 'publications', 'projects', 'awards'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  /* ---------- reveal on scroll ---------- */

  var blocks = document.querySelectorAll(
    '.sec-head, .about-grid, .timeline, .news, .filters, .pub-list, .cards, .rows, .two-col, .contact'
  );

  if (!reduceMotion && !staticMode && 'IntersectionObserver' in window) {
    Array.prototype.forEach.call(blocks, function (el) {
      el.classList.add('reveal');
    });

    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

    Array.prototype.forEach.call(blocks, function (el) {
      revealer.observe(el);
    });
  }

  /* ---------- publication filters ---------- */

  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var pubs = Array.prototype.slice.call(document.querySelectorAll('.pub'));
  var emptyNote = document.getElementById('pub-empty');

  function matches(pub, filter) {
    if (filter === 'all') return true;
    if (filter === 'journal' || filter === 'conference') {
      return pub.getAttribute('data-type') === filter;
    }
    if (filter === 'first') return pub.getAttribute('data-first') === '1';
    if (filter === 'award') return pub.getAttribute('data-award') === '1';
    return true;
  }

  function applyFilter(filter) {
    var shown = 0;
    pubs.forEach(function (pub) {
      var keep = matches(pub, filter);
      pub.hidden = !keep;
      if (keep) shown++;
    });
    if (emptyNote) emptyNote.hidden = shown !== 0;
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) {
        c.classList.remove('is-active');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('is-active');
      chip.setAttribute('aria-pressed', 'true');
      applyFilter(chip.getAttribute('data-filter'));
    });
  });

  /* keep the chip counters honest */
  chips.forEach(function (chip) {
    var filter = chip.getAttribute('data-filter');
    var n = pubs.filter(function (p) { return matches(p, filter); }).length;
    var slot = chip.querySelector('.chip-n');
    if (slot) slot.textContent = n;
  });

  /* ---------- copy email ---------- */

  var copyBtn = document.getElementById('copy-mail');

  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var mail = copyBtn.getAttribute('data-mail');
      var done = function () {
        var original = copyBtn.textContent;
        copyBtn.textContent = 'Copied';
        copyBtn.classList.add('is-done');
        setTimeout(function () {
          copyBtn.textContent = original;
          copyBtn.classList.remove('is-done');
        }, 1600);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(mail).then(done, done);
      } else {
        var field = document.createElement('textarea');
        field.value = mail;
        document.body.appendChild(field);
        field.select();
        try { document.execCommand('copy'); } catch (err) { /* no-op */ }
        document.body.removeChild(field);
        done();
      }
    });
  }

  /* ---------- year ---------- */

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

})();
