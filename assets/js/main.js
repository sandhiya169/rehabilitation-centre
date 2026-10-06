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
  // Mobile hamburger menu (registered first so it closes before scrolling)
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
      const t = document.querySelector(a.getAttribute('href'));
      if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -20 }); }
    }));

  // Philosophy: split text into words (keeps <em>)
  const splitWords = el => [...el.childNodes].forEach(n => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(t => {
        if (!t) return;
        if (/^\s+$/.test(t)) return frag.append(' ');
        const s = document.createElement('span');
        s.className = 'w'; s.textContent = t; frag.append(s);
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1) splitWords(n);
  });

  // Stories: stacked cards. Each card's position is a data attribute, CSS does the movement.
  const stack = document.getElementById('stack');
  const cards = [...stack.querySelectorAll('.story')];
  const bars = [...document.querySelectorAll('.st-bars span')];
  const storiesEl = document.getElementById('stories');
  let cur = 0;
  const showStory = (n, user) => {
    cur = (n + cards.length) % cards.length;
    cards.forEach((c, k) => {
      const pos = (k - cur + cards.length) % cards.length;
      c.dataset.pos = pos;
      c.inert = pos !== 0;
      c.setAttribute('aria-hidden', pos !== 0);
    });
    bars.forEach(b => b.classList.remove('on'));
    void bars[0].offsetWidth; // restart the timer animation
    bars[cur].classList.add('on');
    if (user) stack.setAttribute('aria-live', 'polite'); // announce only once the visitor is driving
  };
  document.getElementById('next').onclick = () => showStory(cur + 1, true);
  document.getElementById('prev').onclick = () => showStory(cur - 1, true);
  bars.forEach(b => b.querySelector('i').addEventListener('animationend', () => showStory(cur + 1)));
  new IntersectionObserver(([en]) => storiesEl.classList.toggle('live', en.isIntersecting), { threshold: 0.4 }).observe(storiesEl);
  let sx = null; // swipe the stack on touch screens
  stack.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') sx = e.clientX; });
  stack.addEventListener('pointerup', e => {
    if (sx === null) return;
    const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 50) showStory(cur + (dx < 0 ? 1 : -1), true);
  });
  stack.addEventListener('pointercancel', () => { sx = null; });

  // FAQ accordion: one open at a time, GSAP animates the answer height
  const faqs = [...document.querySelectorAll('.faq-list details')];
  const faqDur = reduce ? 0 : 0.5;
  const closeFaq = d => {
    const a = d.querySelector('.faq-a');
    gsap.killTweensOf(a);
    gsap.to(a, { height: 0, opacity: 0, duration: faqDur * 0.8, ease: 'power2.inOut',
      onComplete: () => { d.removeAttribute('open'); ScrollTrigger.refresh(); } });
  };
  const openFaq = d => {
    const a = d.querySelector('.faq-a');
    gsap.killTweensOf(a);
    d.setAttribute('open', '');
    gsap.fromTo(a, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: faqDur, ease: 'power2.out',
      onComplete: () => { gsap.set(a, { clearProps: 'height,opacity' }); ScrollTrigger.refresh(); } });
  };
  faqs.forEach(d => d.querySelector('summary').addEventListener('click', e => {
    e.preventDefault();
    const isOpen = d.hasAttribute('open') && !d.dataset.closing;
    if (isOpen) { d.dataset.closing = '1'; closeFaq(d); setTimeout(() => delete d.dataset.closing, faqDur * 800 + 50); return; }
    faqs.forEach(o => { if (o !== d && o.hasAttribute('open')) closeFaq(o); });
    delete d.dataset.closing;
    openFaq(d);
  }));

  const initAOS = () => AOS.init({ duration: 800, once: true, easing: 'ease-out-cubic', disable: reduce });
  if (document.documentElement.classList.contains('pl-on')) document.addEventListener('preloader:done', initAOS, { once: true });
  else initAOS();
  if (reduce) return;

  // Hero: one orchestrated entrance
  gsap.timeline({ defaults: { ease: 'power4.out' } })
    .from('.hero h1 .line span', { yPercent: 110, duration: 1.2, stagger: 0.12 })
    .from('.hero-img-2', { clipPath: 'inset(100% 0 0 0)', duration: 1.1 }, 0.15)
    .from('.hero-img',   { clipPath: 'inset(100% 0 0 0)', duration: 1.2 }, 0.3)
    .from('.hero-badge', { scale: 0, rotate: -90, ease: 'back.out(1.7)' }, '-=0.5')
    .from('.hero-card',  { scale: 0, rotate: 12, ease: 'back.out(1.7)' }, '-=0.35');
  gsap.to('.hero-img img, .hero-img-2 img', { yPercent: -10, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // Philosophy: words light up as you scroll
  document.querySelectorAll('.reveal-words').forEach(el => {
    splitWords(el);
    gsap.to(el.querySelectorAll('.w'), { opacity: 1, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 55%', scrub: true } });
  });

  // Journey: progress line fills while steps are read
  const steps = document.querySelector('.j-steps');
  const fill = Object.assign(document.createElement('i'), { className: 'j-fill' });
  steps.prepend(fill);
  gsap.to(fill, { scaleY: 1, ease: 'none',
    scrollTrigger: { trigger: steps, start: 'top 60%', end: 'bottom 60%', scrub: true } });
  gsap.utils.toArray('.j-steps li').forEach(li =>
    gsap.from(li, { opacity: 0.2, x: 30, scrollTrigger: { trigger: li, start: 'top 75%', end: 'top 45%', scrub: true } }));

  // Stats counters
  document.querySelectorAll('[data-count]').forEach(el => {
    const o = { v: 0 }, end = +el.dataset.count, s = el.dataset.suffix || '';
    gsap.to(o, { v: end, duration: 2, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      onUpdate: () => (el.textContent = Math.round(o.v).toLocaleString() + s) });
  });

  // Facility: images drift at different speeds
  gsap.utils.toArray('.facility img').forEach(img =>
    gsap.to(img, { y: (1 - img.dataset.speed) * 160, ease: 'none',
      scrollTrigger: { trigger: '.facility', start: 'top bottom', end: 'bottom top', scrub: true } }));

  // Contact headline scales in
  gsap.from('.contact h2', { scale: 0.85, opacity: 0, duration: 1.2, ease: 'power3.out',
    scrollTrigger: { trigger: '.contact', start: 'top 70%' } });

  // Contact section: custom phone validation
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const phoneInput = document.getElementById('contactPhone');
    const phoneErr   = document.getElementById('contactErr');
    const submitBtn  = contactForm.querySelector('button[type="submit"]');

    const isValidPhone = v => /^\d{10}$/.test(v.trim());

    const showErr = msg => {
      phoneErr.textContent = msg;
      phoneErr.hidden = false;
      phoneInput.setAttribute('aria-invalid', 'true');
    };
    const clearErr = () => {
      phoneErr.hidden = true;
      phoneInput.removeAttribute('aria-invalid');
    };

    // Clear error as soon as the user starts correcting
    phoneInput.addEventListener('input', () => {
      // Strip any non-digit characters as the user types
      const cleaned = phoneInput.value.replace(/\D/g, '').slice(0, 10);
      if (phoneInput.value !== cleaned) phoneInput.value = cleaned;
      if (cleaned.length) clearErr();
    });

    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const val = phoneInput.value.trim();
      if (!val) {
        showErr('Please enter your phone number.');
        phoneInput.focus();
        return;
      }
      if (!isValidPhone(val)) {
        showErr('Please enter a valid 10-digit phone number.');
        phoneInput.focus();
        return;
      }
      clearErr();
      phoneInput.value = '';
      submitBtn.disabled = false;
      window.location.href = '404.html';
    });
  }
})();