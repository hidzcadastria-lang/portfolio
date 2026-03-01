/* === ANIMATIONS.JS === */

(function () {
  'use strict';

  /* ── Cursor Glow ── */
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);
  let glowX = window.innerWidth / 2, glowY = window.innerHeight / 2;
  let currentX = glowX, currentY = glowY;
  document.addEventListener('mousemove', e => { glowX = e.clientX; glowY = e.clientY; });
  (function animateGlow() {
    currentX += (glowX - currentX) * 0.07;
    currentY += (glowY - currentY) * 0.07;
    glow.style.left = currentX + 'px';
    glow.style.top = currentY + 'px';
    requestAnimationFrame(animateGlow);
  })();

  /* ── Nav scroll state ── */
  const nav = document.querySelector('nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Nav underline (handled by CSS ::after) — ensure links exist ── */

  /* ── Reveal on scroll (Intersection Observer) ── */
  const revealEls = document.querySelectorAll(
    '.section-title, .section-sub, .eyebrow, .why-item, .step-card, ' +
    '.service-card, .phase, .team-card, .playbook-card, .experiment-card, ' +
    '.value-item, .faq-item, .metric-card, .sidebar-card, .highlight-box, ' +
    '.story-block, .output-item, .contact-item, .process-step, ' +
    '.trust-logos, .cta-box, .solution-box'
  );

  revealEls.forEach((el, i) => {
    if (!el.dataset.dir) {
      const tag = el.tagName.toLowerCase();
      if (tag === 'h2' || el.classList.contains('section-title')) el.dataset.dir = 'up';
      else if (el.classList.contains('section-sub') || el.classList.contains('eyebrow')) el.dataset.dir = 'up';
      else el.dataset.dir = 'up';
    }
    el.classList.add('reveal-anim');
    el.style.transitionDelay = (i % 4) * 0.07 + 's';
  });

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => revealObserver.observe(el));

  /* ── Word-split hero title ── */
  function splitWords(el) {
    if (!el || el.dataset.split) return;
    el.dataset.split = '1';
    const nodes = Array.from(el.childNodes);
    el.innerHTML = '';
    nodes.forEach(node => {
      if (node.nodeType === 3) { // text node
        node.textContent.split(' ').forEach((word, i, arr) => {
          const wrapper = document.createElement('span');
          wrapper.className = 'split-word';
          const inner = document.createElement('span');
          inner.className = 'split-word-inner';
          inner.textContent = word;
          wrapper.appendChild(inner);
          el.appendChild(wrapper);
          if (i < arr.length - 1) el.appendChild(document.createTextNode(' '));
        });
      } else if (node.nodeType === 1) {
        const wrapper = document.createElement('span');
        wrapper.className = 'split-word';
        const inner = document.createElement('span');
        inner.className = 'split-word-inner';
        inner.appendChild(node.cloneNode(true));
        wrapper.appendChild(inner);
        el.appendChild(wrapper);
      }
    });
    // Stagger
    el.querySelectorAll('.split-word-inner').forEach((w, i) => {
      w.style.transitionDelay = (i * 0.055) + 's';
    });
    // Trigger after short pause
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.querySelectorAll('.split-word-inner').forEach(w => w.classList.add('visible'));
    }));
  }

  const heroTitle = document.querySelector('.hero-title, h1.page-title');
  if (heroTitle) {
    heroTitle.style.opacity = '1'; // override reveal-anim if applied
    splitWords(heroTitle);
  }

  /* ── KPI counter (count-up) ── */
  function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }

  function animateCounter(el) {
    const raw = el.dataset.target || el.textContent;
    const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
    const prefix = raw.match(/^[^0-9]*/)[0];
    const suffix = raw.match(/[^0-9.]*$/)[0];
    const decimals = (raw.split('.')[1] || '').length;
    const duration = 1600;
    const start = performance.now();
    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const val = easeOutExpo(t) * num;
      el.textContent = prefix + val.toFixed(decimals) + suffix;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + num.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(tick);
  }

  const kpiNums = document.querySelectorAll('.kpi-num');
  if (kpiNums.length) {
    kpiNums.forEach(el => {
      el.dataset.target = el.textContent;
      el.textContent = '0';
    });
    const kpiObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('counting');
          animateCounter(entry.target);
          kpiObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    kpiNums.forEach(el => kpiObserver.observe(el));
  }

  /* ── Metric card pop ── */
  const metricCards = document.querySelectorAll('.metric-card');
  if (metricCards.length) {
    const metricObserver = new IntersectionObserver(entries => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('popped'), i * 90);
          metricObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    metricCards.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'scale(0.88) translateY(20px)';
      metricObserver.observe(el);
    });
  }

  /* ── 3D Card tilt ── */
  document.querySelectorAll('.service-card, .playbook-card, .team-card, .step-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.02)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  /* ── Magnetic buttons ── */
  document.querySelectorAll('.btn-primary, .nav-cta').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) * 0.35;
      const y = (e.clientY - rect.top - rect.height / 2) * 0.35;
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });

  /* ── Sequential chat messages (index.html hero widget) ── */
  const chatMsgs = document.querySelectorAll('.chat-msg');
  if (chatMsgs.length) {
    chatMsgs.forEach(m => { m.style.opacity = '0'; m.style.transform = 'translateY(10px)'; });
    let delay = 600;
    chatMsgs.forEach((msg, i) => {
      setTimeout(() => {
        msg.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        msg.style.opacity = '1';
        msg.style.transform = 'translateY(0)';
      }, delay);
      delay += 700 + (i * 150);
    });
  }

  /* ── Typing indicator ── */
  const typingIndicator = document.querySelector('.typing-indicator');
  if (typingIndicator) {
    typingIndicator.style.opacity = '0';
    setTimeout(() => {
      typingIndicator.style.transition = 'opacity 0.3s ease';
      typingIndicator.style.opacity = '1';
      setTimeout(() => {
        typingIndicator.style.opacity = '0';
      }, 1200);
    }, 300);
  }

  /* ── Page transition (fade out on navigation) ── */
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('http')) return;
    link.addEventListener('click', e => {
      e.preventDefault();
      document.body.style.transition = 'opacity 0.25s ease';
      document.body.style.opacity = '0';
      setTimeout(() => { window.location.href = href; }, 260);
    });
  });

  /* ── Eyebrow line-draw trigger ── */
  const eyebrows = document.querySelectorAll('.eyebrow');
  const eyebrowObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('drawn');
        eyebrowObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.8 });
  eyebrows.forEach(e => eyebrowObserver.observe(e));

})();
