/* Loadbay — interactions & motion (GSAP + ScrollTrigger + Lenis, all served locally) */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  $('.year').textContent = new Date().getFullYear();

  /* ---------- Split headings into masked lines ---------- */
  $$('.split').forEach(el => {
    const parts = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = parts.map(p => `<span class="line"><span>${p.trim()}</span></span>`).join('');
  });

  /* ---------- Videos: play only while visible (saves bandwidth/CPU) ---------- */
  const autoVids = $$('video').filter(v => !v.closest('.serve-card'));
  const vio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const v = e.target;
      if (e.isIntersecting) { if (v.preload === 'none') v.preload = 'auto'; v.play().catch(() => { }); }
      else v.pause();
    });
  }, { rootMargin: '200px 0px' });
  autoVids.forEach(v => { v.muted = true; vio.observe(v); });

  // Serve cards: video plays on hover (desktop) / when centred (touch)
  $$('.serve-card').forEach(card => {
    const v = $('video', card);
    if (fine) {
      card.addEventListener('mouseenter', () => { v.preload = 'auto'; v.play().catch(() => { }); });
      card.addEventListener('mouseleave', () => v.pause());
    } else {
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { v.preload = 'auto'; v.play().then(() => v.style.opacity = 1).catch(() => { }); }
        else { v.pause(); v.style.opacity = 0; }
      }, { threshold: .7 }).observe(card);
    }
  });

  // If any video fails, keep the poster/image visible instead of a black box
  $$('video').forEach(v => v.addEventListener('error', () => { v.style.display = 'none'; }, true));

  /* ---------- Nav ---------- */
  const nav = $('.nav');
  let lastY = 0;
  const onScroll = y => {
    nav.classList.toggle('is-scrolled', y > 30);
    nav.classList.toggle('is-hidden', y > lastY && y > 500 && !document.body.classList.contains('menu-open'));
    lastY = y;
  };
  const burger = $('.nav__burger');
  const toggleMenu = open => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    $('.mobile-menu').setAttribute('aria-hidden', !open);
    if (window.lenis) open ? window.lenis.stop() : window.lenis.start();
  };
  burger.addEventListener('click', () => toggleMenu(!document.body.classList.contains('menu-open')));
  $$('.mobile-menu a').forEach(a => a.addEventListener('click', () => toggleMenu(false)));

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduce && typeof window.Lenis !== 'undefined') {
    lenis = new window.Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    window.lenis = lenis;
    lenis.on('scroll', ({ scroll }) => { onScroll(scroll); if (hasGSAP) ScrollTrigger.update(); });
    if (hasGSAP) { gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
    else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
  } else {
    window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const target = id.length > 1 ? $(id) : document.body;
    if (!target) return;
    e.preventDefault();
    lenis ? lenis.scrollTo(target, { offset: -20, duration: 1.4 }) : target.scrollIntoView({ behavior: 'smooth' });
  }));

  /* ---------- Cursor & magnetic buttons ---------- */
  if (fine && !reduce) {
    const cur = $('.cursor');
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
    (function loop() { cx += (tx - cx) * .18; cy += (ty - cy) * .18; cur.style.translate = `${cx}px ${cy}px`; requestAnimationFrame(loop); })();
    $$('[data-cursor]').forEach(el => {
      el.addEventListener('mouseenter', () => cur.classList.add('is-on'));
      el.addEventListener('mouseleave', () => cur.classList.remove('is-on'));
    });
    $$('.magnetic').forEach(b => {
      b.addEventListener('mousemove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`;
      });
      b.addEventListener('mouseleave', () => { b.style.transition = 'transform .5s cubic-bezier(.22,1,.36,1)'; b.style.transform = ''; setTimeout(() => b.style.transition = '', 500); });
    });
  }

  /* ---------- Testimonials slider ---------- */
  const track = $('.voices__track');
  let idx = 0;
  const slide = dir => {
    const cards = $$('.voice', track);
    const vpW = $('.voices__viewport').clientWidth;
    const step = cards[0].getBoundingClientRect().width + 20;
    const max = Math.max(0, Math.ceil((track.scrollWidth - vpW) / step));
    idx = (idx + dir + max + 1) % (max + 1);
    track.style.transform = `translateX(${-Math.min(idx * step, track.scrollWidth - vpW)}px)`;
  };
  $$('.voices__nav .round-btn').forEach(b => b.addEventListener('click', () => slide(+b.dataset.dir)));
  let auto = setInterval(() => slide(1), 6000);
  $('.voices').addEventListener('mouseenter', () => clearInterval(auto));
  $('.voices').addEventListener('mouseleave', () => { clearInterval(auto); auto = setInterval(() => slide(1), 6000); });
  let sx = null;
  track.addEventListener('touchstart', e => sx = e.touches[0].clientX, { passive: true });
  track.addEventListener('touchend', e => { if (sx === null) return; const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 40) slide(d < 0 ? 1 : -1); sx = null; });
  addEventListener('resize', () => { idx = 0; track.style.transform = ''; });

  /* ---------- Pricing currency toggle ---------- */
  const tog = $('.toggle');
  $$('.toggle__btn', tog).forEach(b => b.addEventListener('click', () => {
    const cur = b.dataset.cur;
    $$('.toggle__btn', tog).forEach(x => x.classList.toggle('is-active', x === b));
    tog.classList.toggle('is-usd', cur === 'usd');
    $$('.plan__price strong').forEach(s => {
      if (hasGSAP) gsap.fromTo(s, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .5, ease: 'power3.out' });
      s.textContent = s.dataset[cur];
    });
  }));

  /* ---------- Contact form (front-end validation; wire to your backend/CRM) ---------- */
  const form = $('.form');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const note = $('.form__note', form);
    const name = form.elements.name, email = form.elements.email;
    let ok = true;
    [name, email].forEach(f => f.classList.remove('is-invalid'));
    if (!name.value.trim()) { name.classList.add('is-invalid'); ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { email.classList.add('is-invalid'); ok = false; }
    note.classList.toggle('is-error', !ok);
    if (!ok) { note.textContent = 'Please add your name and a valid work email.'; return; }
    const btn = $('button[type="submit"]', form);
    btn.disabled = true; btn.firstChild.textContent = 'Sending… ';
    setTimeout(() => {
      note.textContent = `Thanks, ${name.value.trim().split(' ')[0]} — brief received. A founder will reply within 24 hours.`;
      btn.firstChild.textContent = 'Brief sent '; form.reset();
      setTimeout(() => { btn.disabled = false; btn.firstChild.textContent = 'Send brief '; }, 4000);
    }, 900);
  });

  /* ---------- Counters ---------- */
  const runCount = el => {
    const end = parseFloat(el.dataset.count), dec = +(el.dataset.decimals || 0), suf = el.dataset.suffix || '';
    if (reduce || !hasGSAP) { el.textContent = end.toFixed(dec) + suf; return; }
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: 2, ease: 'power3.out', onUpdate: () => el.textContent = o.v.toFixed(dec) + suf });
  };
  const cio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); } }), { threshold: .6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---------- No GSAP / reduced motion: show everything, done ---------- */
  if (!hasGSAP || reduce) {
    root.classList.add('loaded');
    if (hasGSAP && reduce) gsap.set('.reel__frame', { clipPath: 'inset(0% 0% 0% 0% round 36px)' });
    else $$('.reel__frame').forEach(f => f.style.clipPath = 'none');
    return;
  }

  /* =========================================================
     GSAP MOTION
     ========================================================= */
  gsap.registerPlugin(ScrollTrigger);
  const E = 'power4.out';

  // Initial hidden states (set by JS so no-JS users still see content)
  gsap.set('.split .line > span', { yPercent: 110 });
  gsap.set('.reveal-up', { y: 40, opacity: 0 });
  gsap.set('.reveal-card', { y: 80, opacity: 0 });
  gsap.set('.hero__media', { scale: .9, borderRadius: 60 });
  gsap.set('.hero__chip', { opacity: 0, y: 20 });

  /* ---------- Preloader → intro ---------- */
  const count = { v: 0 };
  const loaderTl = gsap.timeline();
  loaderTl
    .to(count, { v: 100, duration: 1.6, ease: 'power2.inOut', onUpdate: () => { $('.loader__count').textContent = Math.round(count.v); } })
    .to('.loader__bar span', { width: '100%', duration: 1.6, ease: 'power2.inOut' }, 0)
    .to('.loader', { clipPath: 'inset(0 0 100% 0)', duration: .9, ease: 'power4.inOut' }, '+=.1')
    .add(() => root.classList.add('loaded'))
    .to('.hero .split .line > span', { yPercent: 0, duration: 1.2, stagger: .1, ease: E }, '-=.45')
    .to('.hero .reveal-up', { y: 0, opacity: 1, duration: 1, stagger: .08, ease: E }, '-=.9')
    .to('.hero__media', { scale: .94, duration: 1.2, ease: E }, '-=1')
    .to('.hero__chip', { opacity: 1, y: 0, duration: .8, stagger: .15, ease: E }, '-=.6')
    .from('.nav', { y: -90, opacity: 0, duration: 1, ease: E, clearProps: 'transform,opacity' }, '-=1.4');

  /* ---------- Hero media grows to full width on scroll ---------- */
  gsap.to('.hero__media', {
    scale: 1, borderRadius: 36, ease: 'none',
    scrollTrigger: { trigger: '.hero__media', start: 'top 85%', end: 'top 15%', scrub: true }
  });
  gsap.to('.hero__video', { yPercent: -14, ease: 'none', scrollTrigger: { trigger: '.hero__media', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.to('.hero__chip--a', { y: -60, ease: 'none', scrollTrigger: { trigger: '.hero__media', start: 'top center', end: 'bottom top', scrub: true } });

  /* ---------- Generic reveals ---------- */
  $$('.split').forEach(el => {
    if (el.closest('.hero')) return;
    gsap.to($$('.line > span', el), { yPercent: 0, duration: 1.1, stagger: .09, ease: E, scrollTrigger: { trigger: el, start: 'top 85%' } });
  });
  $$('.reveal-up').forEach(el => {
    if (el.closest('.hero')) return;
    gsap.to(el, { y: 0, opacity: 1, duration: 1, ease: E, scrollTrigger: { trigger: el, start: 'top 90%' } });
  });
  ScrollTrigger.batch('.reveal-card', {
    start: 'top 88%',
    onEnter: b => gsap.to(b, { y: 0, opacity: 1, duration: 1.1, stagger: .12, ease: E, overwrite: true })
  });

  /* ---------- Marquee skews with scroll velocity ---------- */
  const skew = gsap.quickTo('.marquee__track', 'skewX', { duration: .4, ease: 'power3' });
  ScrollTrigger.create({ onUpdate: s => skew(gsap.utils.clamp(-8, 8, s.getVelocity() / -300)) });

  /* ---------- Bays: pinned horizontal scroll (desktop) ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 961px)', () => {
    const sliderEl = $('.bays__slider') || $('.bays__track');
    const dist = () => Math.max(0, sliderEl.scrollWidth - window.innerWidth);
    gsap.to(sliderEl, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '.bays', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true,
        onUpdate: s => gsap.set('.bays__progress span', { width: s.progress * 100 + '%' })
      }
    });
    gsap.from('.bay', { y: 60, opacity: 0, duration: 1, stagger: .1, ease: E, scrollTrigger: { trigger: '.bays', start: 'top 60%' } });
  });

  /* ---------- Reel: window opens up ---------- */
  gsap.to('.reel__frame', {
    clipPath: 'inset(0% 0% 0% 0% round 36px)', ease: 'none',
    scrollTrigger: { trigger: '.reel__frame', start: 'top 90%', end: 'top 20%', scrub: true }
  });
  gsap.from('.reel__facts div', { y: 40, opacity: 0, stagger: .12, duration: 1, ease: E, scrollTrigger: { trigger: '.reel__facts', start: 'top 92%' } });

  /* ---------- Image parallax inside rounded frames ---------- */
  $$('.case__media img').forEach(img => {
    gsap.fromTo(img, { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ---------- Process line fills as you read ---------- */
  gsap.to('.steps__line span', { height: '100%', ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 60%', end: 'bottom 60%', scrub: true } });
  $$('.step').forEach(s => gsap.from(s, { x: 60, opacity: 0, duration: 1, ease: E, scrollTrigger: { trigger: s, start: 'top 85%' } }));

  /* ---------- Partners card ---------- */
  gsap.from('.partners__card', { y: 100, scale: .96, opacity: 0, duration: 1.2, ease: E, scrollTrigger: { trigger: '.partners__card', start: 'top 85%' } });
  gsap.from('.partners__list li', { x: -30, opacity: 0, stagger: .08, duration: .8, ease: E, scrollTrigger: { trigger: '.partners__list', start: 'top 88%' } });

  /* ---------- FAQ & voices ---------- */
  gsap.from('.qa', { y: 30, opacity: 0, stagger: .08, duration: .9, ease: E, scrollTrigger: { trigger: '.faq__list', start: 'top 85%' } });
  gsap.from('.voice', { x: 120, opacity: 0, stagger: .1, duration: 1.1, ease: E, scrollTrigger: { trigger: '.voices__viewport', start: 'top 85%' } });

  /* ---------- CTA ---------- */
  gsap.from('.cta__card', { scale: .92, borderRadius: 80, duration: 1.4, ease: E, scrollTrigger: { trigger: '.cta__card', start: 'top 90%' } });
  gsap.from('.form', { y: 60, opacity: 0, duration: 1.1, ease: E, scrollTrigger: { trigger: '.form', start: 'top 90%' } });

  /* ---------- Footer wordmark rises ---------- */
  gsap.from('.footer__word', { yPercent: 40, opacity: 0, duration: 1.4, ease: E, scrollTrigger: { trigger: '.footer__word', start: 'top 95%' } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
