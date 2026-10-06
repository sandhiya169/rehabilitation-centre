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

  // Values: tabs swap photo + text. Auto-plays once (underline is the timer), stops on first interaction.
  const tabsEl = document.getElementById('valTabs');
  const tabs = [...tabsEl.querySelectorAll('.val')];
  const vImg = document.getElementById('valImg'), vText = document.getElementById('valText');
  const vTag = document.getElementById('valTag'), vPanel = document.getElementById('valPanel');
  const vView = document.querySelector('.val-view'), valsBox = document.querySelector('.vals');
  const DELAY = 6;
  let current = 0, auto = !reduce, progress = null, hovering = false, visible = false, swapId = 0;

  const preload = src => new Promise(res => { const i = new Image(); i.onload = i.onerror = res; i.src = src; });
  const canPlay = () => auto && visible && !hovering && !document.hidden;
  const syncPlay = () => progress && progress.paused(!canPlay());

  const runProgress = () => {
    if (progress) progress.kill();
    progress = null;
    tabs.forEach((t, k) => gsap.set(t, { '--p': k === current ? (auto ? 0 : 1) : 0 }));
    if (!auto) return;
    progress = gsap.to(tabs[current], { '--p': 1, duration: DELAY, ease: 'none', paused: true,
      onComplete: () => select((current + 1) % tabs.length) });
    syncPlay();
  };

  const stopAuto = () => {
    if (!auto) return;
    auto = false;
    vView.setAttribute('aria-live', 'polite'); // announce changes only once the user is driving
    runProgress();
  };

  const centerTab = b => {
    if (tabsEl.scrollWidth <= tabsEl.clientWidth) return; // only the mobile row scrolls
    tabsEl.scrollTo({ left: b.offsetLeft - (tabsEl.clientWidth - b.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
  };

  function select(i, user = false) {
    if (user) stopAuto();
    if (i === current) return;
    const b = tabs[i], token = ++swapId;
    current = i;
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; });
    vPanel.setAttribute('aria-labelledby', b.id);
    centerTab(b);
    runProgress();

    const move = [vText, vTag];
    if (!reduce) {
      gsap.to(vImg, { opacity: 0, duration: 0.25, overwrite: true });
      gsap.to(move, { opacity: 0, y: 12, duration: 0.25, overwrite: true });
    }
    // wait for the fade-out AND the new photo, so it never pops in half-loaded
    Promise.all([preload(b.dataset.img), new Promise(r => setTimeout(r, reduce ? 0 : 250))]).then(() => {
      if (token !== swapId) return; // a newer click won
      vImg.src = b.dataset.img;
      vText.textContent = b.dataset.text;
      vTag.textContent = b.dataset.tag;
      if (reduce) return;
      gsap.to(vImg, { opacity: 1, duration: 0.6, overwrite: true });
      gsap.fromTo(vImg, { scale: 1.08 }, { scale: 1, duration: 1.4, ease: 'power3.out' });
      gsap.to(move, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, overwrite: true });
    });
  }

  tabs.forEach((b, i) => b.addEventListener('click', () => select(i, true)));

  // Keyboard: arrows / Home / End move between tabs
  tabsEl.addEventListener('keydown', e => {
    const k = e.key;
    let i = current;
    if (k === 'ArrowDown' || k === 'ArrowRight') i = (current + 1) % tabs.length;
    else if (k === 'ArrowUp' || k === 'ArrowLeft') i = (current - 1 + tabs.length) % tabs.length;
    else if (k === 'Home') i = 0;
    else if (k === 'End') i = tabs.length - 1;
    else return;
    e.preventDefault();
    tabs[i].focus();
    select(i, true);
  });

  // Swipe the photo on touch screens
  let sx = null;
  vPanel.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') sx = e.clientX; });
  vPanel.addEventListener('pointerup', e => {
    if (sx === null) return;
    const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 50) select((current + (dx < 0 ? 1 : tabs.length - 1)) % tabs.length, true);
  });
  vPanel.addEventListener('pointercancel', () => { sx = null; });

  // Auto-play only while on screen, not hovered, tab visible
  valsBox.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { hovering = true; syncPlay(); } });
  valsBox.addEventListener('pointerleave', () => { hovering = false; syncPlay(); });
  valsBox.addEventListener('focusin', () => { hovering = true; syncPlay(); });
  valsBox.addEventListener('focusout', () => { hovering = false; syncPlay(); });
  document.addEventListener('visibilitychange', syncPlay);
  new IntersectionObserver(([en]) => {
    if (en.isIntersecting && !visible) tabs.forEach(t => preload(t.dataset.img)); // warm the cache
    visible = en.isIntersecting; syncPlay();
  }, { threshold: 0.35 }).observe(valsBox);
  runProgress();

  // Team: four arches, one open at a time (hover on desktop, tap on touch, arrows on keyboard)
  const mems = [...document.querySelectorAll('.mem')];
  const stacked = matchMedia('(max-width: 820px)');
  const openMem = m => mems.forEach(x => {
    const on = x === m;
    x.classList.toggle('is-open', on);
    x.querySelector('.mem-btn').setAttribute('aria-expanded', on);
  });
  let hoverT;
  mems.forEach((m, i) => {
    const b = m.querySelector('.mem-btn');
    b.addEventListener('click', () => {
      openMem(m);
      if (stacked.matches) setTimeout(() => { // keep the opened row in view once the rows above have closed
        const r = m.getBoundingClientRect();
        if (r.top < 90 || r.bottom > innerHeight) lenis.scrollTo(m, { offset: -100 });
      }, 760);
    });
    b.addEventListener('focus', () => b.matches(':focus-visible') && openMem(m));
    b.addEventListener('keydown', e => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      mems[(i + d + mems.length) % mems.length].querySelector('.mem-btn').focus();
    });
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      m.addEventListener('mouseenter', () => { clearTimeout(hoverT); hoverT = setTimeout(() => !stacked.matches && openMem(m), 120); });
      m.addEventListener('mouseleave', () => clearTimeout(hoverT));
    }
  });

  // Counters
  const counters = document.querySelectorAll('[data-count]');
  const fmt = (el, v) => (el.textContent = Math.round(v).toLocaleString() + (el.dataset.suffix || ''));

  const initAOS = () => AOS.init({ duration: 800, once: true, easing: 'ease-out-cubic', disable: reduce });
  if (document.documentElement.classList.contains('pl-on')) document.addEventListener('preloader:done', initAOS, { once: true });
  else initAOS();
  if (reduce) { counters.forEach(el => fmt(el, +el.dataset.count)); return; }

  counters.forEach(el => {
    const o = { v: 0 };
    gsap.to(o, { v: +el.dataset.count, duration: 2, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true }, onUpdate: () => fmt(el, o.v) });
  });

  // Hero: one orchestrated entrance, then the circles drift at different speeds
  gsap.timeline({ defaults: { ease: 'power4.out' } })
    .from('.ah h1 .line span', { yPercent: 110, duration: 1.2, stagger: 0.12 })
    .from('.orb', { scale: 0, duration: 1, stagger: 0.15, ease: 'back.out(1.6)' }, 0.3);
  [['.o1', -40], ['.o2', 70], ['.o3', -90]].forEach(([s, y]) =>
    gsap.to(s, { y, ease: 'none', scrollTrigger: { trigger: '.ah', start: 'top top', end: 'bottom top', scrub: true } }));

  // Story: each year fills in as it reaches the middle of the screen
  gsap.utils.toArray('.yr').forEach(y =>
    gsap.to(y, { color: '#0b3c49', ease: 'none',
      scrollTrigger: { trigger: y, start: 'top 80%', end: 'top 40%', scrub: true } }));

  // Team arches rise in
  gsap.from('.mem', { yPercent: 10, opacity: 0, stagger: 0.12, duration: 1, ease: 'power3.out', clearProps: 'transform,opacity',
    scrollTrigger: { trigger: '.crew', start: 'top 85%' } });

  // Campus: photo grows from a framed image to full width
  gsap.fromTo('.ab-wide-img', { clipPath: 'inset(14% 10% round 2rem)' },
    { clipPath: 'inset(0% 0% round 0rem)', ease: 'none',
      scrollTrigger: { trigger: '.ab-wide', start: 'top 80%', end: 'top 10%', scrub: true } });
  gsap.fromTo('.ab-wide-img img', { scale: 1.25 }, { scale: 1, ease: 'none',
    scrollTrigger: { trigger: '.ab-wide', start: 'top 80%', end: 'bottom 40%', scrub: true } });
  gsap.fromTo('.ab-wide-txt', { opacity: 0, y: 30 }, { opacity: 1, y: 0, ease: 'none',
    scrollTrigger: { trigger: '.ab-wide', start: 'top 45%', end: 'top 10%', scrub: true } });

  // Closing headline scales in
  gsap.from('.ab-cta h2', { scale: 0.88, opacity: 0, duration: 1.2, ease: 'power3.out', transformOrigin: 'center center',
    scrollTrigger: { trigger: '.ab-cta', start: 'top 70%' } });
})();