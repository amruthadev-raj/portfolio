// Amrutha Raj D — Portfolio interactions
// Scroll reveals, 3D tilt effects, magnetic buttons, animated counters.
// All effects respect prefers-reduced-motion and degrade gracefully on touch devices.

(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  var supportsIO = 'IntersectionObserver' in window;

  /* ------------------------------------------------------------
     1. Scroll progress bar
  ------------------------------------------------------------ */
  function initScrollProgress() {
    var bar = document.createElement('div');
    bar.id = 'scroll-progress';
    document.body.appendChild(bar);

    function update() {
      var scrollTop = window.scrollY || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = pct + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ------------------------------------------------------------
     2. Nav shrink + active-link highlighting on scroll
  ------------------------------------------------------------ */
  function initNav() {
    var nav = document.querySelector('nav');
    if (!nav) return;
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
    var sections = links
      .map(function (a) {
        var id = a.getAttribute('href');
        return id && id.charAt(0) === '#' ? document.querySelector(id) : null;
      })
      .filter(Boolean);

    function onScroll() {
      if (window.scrollY > 40) {
        nav.classList.add('nav-scrolled');
      } else {
        nav.classList.remove('nav-scrolled');
      }

      var scrollPos = window.scrollY + 140;
      var current = null;
      sections.forEach(function (sec) {
        if (sec.offsetTop <= scrollPos) current = sec;
      });
      links.forEach(function (a) { a.classList.remove('active-link'); });
      if (current) {
        var match = links.find(function (a) { return a.getAttribute('href') === '#' + current.id; });
        if (match) match.classList.add('active-link');
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------------------
     3. Scroll-reveal via IntersectionObserver
        Adds .reveal / .reveal-stagger to sections & grids automatically
  ------------------------------------------------------------ */
  function initScrollReveal() {
    var revealTargets = [
      '.hero-meta',
      '.section-header',
      '.about-text',
      '.quote-section',
      '.edu-item',
      '.contact-left'
    ];
    var staggerTargets = [
      '.services-grid',
      '.approach-steps',
      '.skills-grid',
      '.projects-list',
      '.experience-list',
      '.certs-grid'
    ];

    revealTargets.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        el.classList.add('reveal');
      });
    });
    staggerTargets.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        el.classList.add('reveal-stagger');
      });
    });

    var revealEls = document.querySelectorAll('.reveal, .reveal-stagger');

    if (!supportsIO || prefersReducedMotion) {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  }

  /* ------------------------------------------------------------
     4. Animated skill bar fill + count-up stat numbers on reveal
  ------------------------------------------------------------ */
  function initSkillBars() {
    var bars = document.querySelectorAll('.skill-bar-fill');
    if (!bars.length) return;

    bars.forEach(function (bar) {
      var width = bar.style.width || '0%';
      bar.style.setProperty('--target-width', width);
      bar.style.width = '0%';
    });

    if (!supportsIO || prefersReducedMotion) {
      bars.forEach(function (bar) {
        bar.style.width = bar.style.getPropertyValue('--target-width');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var bar = entry.target;
            requestAnimationFrame(function () {
              bar.classList.add('filled');
            });
            observer.unobserve(bar);
          }
        });
      },
      { threshold: 0.4 }
    );
    bars.forEach(function (bar) { observer.observe(bar); });
  }

  function initStatCounters() {
    var stats = document.querySelectorAll('.stat-num');
    if (!stats.length || !supportsIO) return;

    function animateCount(el) {
      var raw = el.textContent.trim();
      var match = raw.match(/^([\d.]+)(.*)$/);
      if (!match) return;
      var target = parseFloat(match[1]);
      var suffix = match[2] || '';
      var isDecimal = match[1].indexOf('.') !== -1;
      var decimals = isDecimal ? match[1].split('.')[1].length : 0;
      var duration = 1400;
      var startTime = null;

      if (prefersReducedMotion) {
        el.textContent = raw;
        return;
      }

      function step(ts) {
        if (!startTime) startTime = ts;
        var progress = Math.min((ts - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = target * eased;
        el.textContent = current.toFixed(decimals) + suffix;
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = raw;
        }
      }
      requestAnimationFrame(step);
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    stats.forEach(function (el) { observer.observe(el); });
  }

  /* ------------------------------------------------------------
     5. 3D tilt on hero photo (desktop only, mouse-driven)
  ------------------------------------------------------------ */
  function initHeroTilt() {
    var wrap = document.querySelector('.hero-img-wrap');
    var photo = document.getElementById('heroPhoto');
    var hero = document.querySelector('.hero');
    if (!wrap || !photo || !hero || isCoarsePointer || prefersReducedMotion) return;

    var maxTilt = 10;
    var ticking = false;
    var lastX = 0, lastY = 0;

    hero.addEventListener('mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      lastX = (e.clientX - rect.left) / rect.width;
      lastY = (e.clientY - rect.top) / rect.height;
      if (!ticking) {
        requestAnimationFrame(applyTilt);
        ticking = true;
      }
    });

    hero.addEventListener('mouseleave', function () {
      photo.style.transform = '';
    });

    function applyTilt() {
      var rotateY = (lastX - 0.5) * maxTilt * 2;
      var rotateX = (0.5 - lastY) * maxTilt;
      photo.style.transform =
        'rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' + rotateY.toFixed(2) + 'deg) scale(1.02)';
      ticking = false;
    }
  }

  /* ------------------------------------------------------------
     6. 3D tilt on cards (service cards, project items, cert items)
  ------------------------------------------------------------ */
  function initCardTilt() {
    if (isCoarsePointer || prefersReducedMotion) return;
    var selectors = '.service-card, .cert-item, .approach-step';
    var cards = document.querySelectorAll(selectors);

    cards.forEach(function (card) {
      var ticking = false;
      var lastEvt = null;
      var maxTilt = 6;

      card.addEventListener('mousemove', function (e) {
        lastEvt = e;
        if (!ticking) {
          requestAnimationFrame(function () { apply(card, lastEvt, maxTilt); ticking = false; });
          ticking = true;
        }
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });

    function apply(card, e, maxTilt) {
      var rect = card.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width;
      var y = (e.clientY - rect.top) / rect.height;
      var rotateY = (x - 0.5) * maxTilt * 2;
      var rotateX = (0.5 - y) * maxTilt;
      card.style.transform =
        'perspective(800px) rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' + rotateY.toFixed(2) + 'deg) translateY(-4px)';
    }
  }

  /* ------------------------------------------------------------
     7. Magnetic buttons (subtle pull toward cursor)
  ------------------------------------------------------------ */
  function initMagneticButtons() {
    if (isCoarsePointer || prefersReducedMotion) return;
    var buttons = document.querySelectorAll('.btn-primary, .btn-ghost');

    buttons.forEach(function (btn) {
      var strength = 0.25;
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = 'translate(' + (x * strength) + 'px, ' + (y * strength) + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  /* ------------------------------------------------------------
     8. Cursor glow that follows the pointer (desktop only)
  ------------------------------------------------------------ */
  function initCursorGlow() {
    if (isCoarsePointer || prefersReducedMotion) return;
    var glow = document.createElement('div');
    glow.id = 'cursor-glow';
    document.body.appendChild(glow);

    var targetX = window.innerWidth / 2;
    var targetY = window.innerHeight / 2;
    var curX = targetX;
    var curY = targetY;

    window.addEventListener('mousemove', function (e) {
      targetX = e.clientX;
      targetY = e.clientY;
    });

    function loop() {
      curX += (targetX - curX) * 0.12;
      curY += (targetY - curY) * 0.12;
      glow.style.transform = 'translate(' + curX + 'px, ' + curY + 'px) translate(-50%, -50%)';
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* ------------------------------------------------------------
     9. Hero parallax glow shifts subtly with scroll
  ------------------------------------------------------------ */
  function initHeroParallax() {
    var hero = document.querySelector('.hero');
    if (!hero || prefersReducedMotion) return;

    window.addEventListener('scroll', function () {
      var offset = Math.min(window.scrollY, 600);
      hero.style.setProperty('--parallax', (offset * 0.15).toFixed(2) + 'px');
      var heroLeft = document.querySelector('.hero-left');
      if (heroLeft) {
        heroLeft.style.transform = 'translateY(' + (offset * 0.08).toFixed(2) + 'px)';
        heroLeft.style.opacity = String(Math.max(1 - offset / 500, 0));
      }
    }, { passive: true });
  }

  /* ------------------------------------------------------------
     Init everything once DOM is ready
  ------------------------------------------------------------ */
  function init() {
    initScrollProgress();
    initNav();
    initScrollReveal();
    initSkillBars();
    initStatCounters();
    initHeroTilt();
    initCardTilt();
    initMagneticButtons();
    initCursorGlow();
    initHeroParallax();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
