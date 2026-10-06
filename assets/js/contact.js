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

  // Mobile hamburger menu (same behaviour as the homepage)
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

  // In-page anchors scroll smoothly; links to index.html pass through
  document.querySelectorAll('a[href^="#"]').forEach(a =>
    a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -20 }); }
    }));

  // Live status and today's opening hours (India time)
  const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const h = ist.getHours(), day = String(ist.getDay());
  document.getElementById('status').textContent =
    h >= 9 && h < 19 ? 'Advisors online now' : 'Helpline open, advisors call back at 9:00';
  document.querySelectorAll('#hours li').forEach(li =>
    li.classList.toggle('today', li.dataset.d.split(',').includes(day)));

  // Enquiry form
  const form = document.getElementById('enqForm'), ok = document.getElementById('ok'), err = document.getElementById('err');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const nameEl = document.getElementById('name'), phoneEl = document.getElementById('phone');
    const name = nameEl.value.trim(), phone = phoneEl.value.replace(/\D/g, '');
    
    nameEl.classList.remove('invalid');
    phoneEl.classList.remove('invalid');
    
    if (!name || phone.length < 8) { 
        err.hidden = false; 
        if (!name) nameEl.classList.add('invalid');
        if (phone.length < 8) phoneEl.classList.add('invalid');
        (name ? phoneEl : nameEl).focus(); 
        return; 
    }
    
    err.hidden = true;
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    form.reset();
    location.href = '404.html';
  });

  // FAQ: only one answer open at a time
  const faqs = document.querySelectorAll('.faq-list details');
  faqs.forEach(d => d.addEventListener('toggle', () => {
    if (d.open) faqs.forEach(o => o !== d && (o.open = false));
    ScrollTrigger.refresh(); // heights changed, keep scroll animations in sync
  }));

  const initAOS = () => AOS.init({ duration: 800, once: true, easing: 'ease-out-cubic', disable: reduce });
  if (document.documentElement.classList.contains('pl-on')) document.addEventListener('preloader:done', initAOS, { once: true });
  else initAOS();
  if (reduce) { document.querySelectorAll('.bar').forEach(b => (b.style.transform = 'none')); return; }

  // Hero: one orchestrated entrance
  gsap.timeline({ defaults: { ease: 'power4.out' } })
    .from('.ch h1 .line span', { yPercent: 110, duration: 1.2, stagger: 0.12 })
    .from('.ch-arch', { clipPath: 'inset(100% 0 0 0)', duration: 1.2 }, 0.2)
    .from('.ch-pill', { x: -40, opacity: 0 }, '-=0.5');
  gsap.to('.ch-arch img', { yPercent: -12, ease: 'none',
    scrollTrigger: { trigger: '.ch', start: 'top top', end: 'bottom top', scrub: true } });

  // Reach rows slide in one after another
  gsap.from('.rlist li', { y: 50, opacity: 0, stagger: 0.12, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '.rlist', start: 'top 80%' } });

  // Form fields rise in
  gsap.from('.enq-copy > *, .fld, .chips, .enq .btn', { y: 30, opacity: 0, stagger: 0.08, duration: 0.8, ease: 'power3.out',
    scrollTrigger: { trigger: '.enq', start: 'top 65%' } });

  // Next steps: top rules draw across, then text settles
  gsap.utils.toArray('.nlist li').forEach((li, n) => {
    gsap.to(li.querySelector('.bar'), { scaleX: 1, duration: 1.2, ease: 'power2.out', delay: n * 0.15,
      scrollTrigger: { trigger: li, start: 'top 85%' } });
    gsap.from(li.children[1], { opacity: 0, y: 30, duration: 0.8, delay: n * 0.15,
      scrollTrigger: { trigger: li, start: 'top 85%' } });
  });

  // Urgent card: rises in, then its content settles
  gsap.from('.urg-card', { y: 60, opacity: 0, duration: 1, ease: 'power3.out',
    scrollTrigger: { trigger: '.urgent', start: 'top 80%' } });
  gsap.from('.urg-copy > *, .urg-actions > *', { y: 24, opacity: 0, stagger: 0.1, duration: 0.8, delay: 0.2, ease: 'power3.out',
    scrollTrigger: { trigger: '.urgent', start: 'top 80%' } });
})();
