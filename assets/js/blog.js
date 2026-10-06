(() => {
  gsap.registerPlugin(ScrollTrigger);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Hold entrance animations until the preloader lifts
  if (document.documentElement.classList.contains('pl-on')) {
    gsap.globalTimeline.pause();
    document.addEventListener('preloader:done', () => gsap.globalTimeline.resume(), { once: true });
  }

  // Smooth scroll (Lenis) driven by GSAP's ticker
  const lenis = new Lenis({ lerp: reduce ? 1 : 0.09 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // Mobile hamburger menu (same behaviour as the other pages)
  const nav = document.querySelector('.nav'), burger = document.getElementById('burger');
  const setMenu = open => {
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    open ? lenis.stop() : lenis.start();
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.querySelectorAll('nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => e.key === 'Escape' && setMenu(false));
  addEventListener('resize', () => innerWidth > 800 && setMenu(false));

  document.querySelectorAll('a[href^="#"]').forEach(a =>
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const t = id.length > 1 && document.querySelector(id);
      if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -20 }); }
      else if (id === '#') e.preventDefault(); // placeholder links
    }));

  // Topic filter and search
  const rows = [...document.querySelectorAll('#list li')];
  const tps = [...document.querySelectorAll('.tp')];
  const status = document.getElementById('status'), empty = document.getElementById('empty');
  let topic = 'all';

  tps.forEach(b => {
    const t = b.dataset.topic;
    const n = t === 'all' ? rows.length : rows.filter(r => r.dataset.topic === t).length;
    const c = b.querySelector('.tp-count');
    c.textContent = n;
    c.dataset.n = n;
  });

  // Page height changes when the list is filtered, so re-measure every scroll-based animation
  let relayoutT;
  const relayout = () => {
    ScrollTrigger.refresh();
    if (window.AOS) AOS.refreshHard();
    clearTimeout(relayoutT);
    // measure again once the rows have finished animating / images have settled
    relayoutT = setTimeout(() => { ScrollTrigger.refresh(); if (window.AOS) AOS.refreshHard(); }, 700);
  };

  const apply = (anim = true) => {
        const shown = [];
    rows.forEach(r => {
      const ok = (topic === 'all' || r.dataset.topic === topic);
      r.hidden = !ok;
      if (ok) shown.push(r);
    });
    const label = tps.find(b => b.dataset.topic === topic).querySelector('.tp-name').textContent.trim();
    status.textContent = `Showing ${shown.length} of ${rows.length} articles` + (topic === 'all' ? '' : ` in ${label}`);
    empty.hidden = shown.length > 0;
    if (anim && !reduce && shown.length)
      gsap.fromTo(shown, { opacity: 0, y: 24 }, { opacity: 1, y: 0, stagger: 0.06, duration: 0.5, ease: 'power2.out', overwrite: true, clearProps: 'transform' });
    relayout();
  };

  tps.forEach(b => b.addEventListener('click', () => {
    topic = b.dataset.topic;
    tps.forEach(x => x.setAttribute('aria-pressed', x === b));
    apply();
    lenis.scrollTo('#articles', { offset: -20 });
  }));
  apply(false);

  // Newsletter
  const sub = document.getElementById('subForm'), msg = document.getElementById('subMsg'), email = document.getElementById('subEmail');
  sub.addEventListener('submit', e => {
    e.preventDefault();
    if (!email.checkValidity() || !email.value) {
      msg.classList.add('is-error');
      msg.textContent = 'Please enter a valid email address.';
      email.setAttribute('aria-invalid', 'true');
      email.focus();
      return;
    }
    // TODO: send the address to your newsletter service here
    msg.classList.remove('is-error');
    email.removeAttribute('aria-invalid');
    msg.textContent = '';
    sub.reset();
    location.href = '404.html';
  });
  // clear the error as soon as the person starts typing again
  email.addEventListener('input', () => {
    msg.classList.remove('is-error');
    msg.textContent = '';
    email.removeAttribute('aria-invalid');
  });
  // if they come back with the browser's Back button, keep the field empty
  addEventListener('pageshow', () => { sub.reset(); msg.textContent = ''; });

  // FAQ: only one answer open at a time
  const faqs = [...document.querySelectorAll('.fq-item')];
  faqs.forEach(d => d.addEventListener('toggle', () => {
    if (d.open) faqs.forEach(o => { if (o !== d) o.open = false; });
  }));

  const initAOS = () => AOS.init({ duration: 800, once: true, easing: 'ease-out-cubic', disable: reduce });
  if (document.documentElement.classList.contains('pl-on')) document.addEventListener('preloader:done', initAOS, { once: true });
  else initAOS();
  // Re-measure when the page height changes for any other reason (lazy images, fonts, resize)
  if ('ResizeObserver' in window) {
    let lastH = document.documentElement.scrollHeight, t;
    new ResizeObserver(() => {
      const h = document.documentElement.scrollHeight;
      if (Math.abs(h - lastH) < 4) return;
      lastH = h; clearTimeout(t);
      t = setTimeout(() => { if (window.AOS) AOS.refresh(); }, 150);
    }).observe(document.body);
  }

  if (reduce) return;

  // Reading progress bar
  gsap.to('.bl-prog', { scaleX: 1, ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: true } });

  // Hero: one orchestrated entrance
  gsap.timeline({ defaults: { ease: 'power4.out' } })
    .from('.bh h1 .line span', { yPercent: 110, duration: 1.2, stagger: 0.12 })
    .from('.bh-cap', { clipPath: 'inset(100% 0 0 0)', duration: 1.2 }, 0.2)
    .from('.bh-ring', { scale: 0.6, opacity: 0, duration: 1 }, '-=0.8');
  gsap.to('.bh-cap img', { yPercent: -12, ease: 'none',
    scrollTrigger: { trigger: '.bh', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.bh-ring', { rotate: 180, ease: 'none',
    scrollTrigger: { trigger: '.bh', start: 'top top', end: 'bottom top', scrub: true } });

  // Featured: panel slides over the image
  gsap.from('.feat-box', { x: -70, opacity: 0, duration: 1.1, ease: 'power3.out',
    scrollTrigger: { trigger: '.feat', start: 'top 65%' } });
  gsap.to('.feat-img img', { yPercent: -12, ease: 'none',
    scrollTrigger: { trigger: '.feat', start: 'top bottom', end: 'bottom top', scrub: true } });

  // Article rows rise in one by one
  rows.forEach(r => gsap.from(r, { opacity: 0, y: 40, duration: 0.8, ease: 'power3.out',
    scrollTrigger: { trigger: r, start: 'top 90%' } }));

  // Quote portrait reveals
  gsap.from('.bq-img', { clipPath: 'inset(100% 0 0 0)', duration: 1.2, ease: 'power3.out',
    scrollTrigger: { trigger: '.bq', start: 'top 70%' } });
})();