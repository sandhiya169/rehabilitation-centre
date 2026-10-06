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

  // Fade helper: fades targets out, runs a change, fades them back in
  const swap = (els, change) => {
    if (reduce) return change();
    gsap.timeline().to(els, { opacity: 0, y: 12, duration: 0.25 })
      .add(change)
      .to(els, { opacity: 1, y: 0, duration: 0.45, stagger: 0.08 });
  };

  // Finder: choose a situation, see the matching therapy
  const opts = [...document.querySelectorAll('.opt')];
  const rName = document.getElementById('resName'), rText = document.getElementById('resText'), rInc = document.getElementById('resInc');
  const rLen = document.getElementById('resLen'), rIcon = document.getElementById('resIcon');
  opts.forEach(b => b.addEventListener('click', () => {
    opts.forEach(x => x.setAttribute('aria-pressed', x === b));
    swap([rName, rText, rInc, rLen.parentElement, rIcon.parentElement], () => {
      rLen.textContent = b.dataset.len;
      rIcon.className = 'fa-solid ' + b.dataset.icon;
      rName.textContent = b.dataset.name;
      rText.textContent = b.dataset.text;
      rInc.innerHTML = '';
      b.dataset.inc.split('|').forEach(t => rInc.appendChild(Object.assign(document.createElement('li'), { textContent: t })));
    });
    // single column on tablet/mobile: bring the result card into view
    if (innerWidth <= 900) lenis.scrollTo('.res-card', { offset: -90 });
  }));

  // Stay options: residential or day program
  const bRes = document.getElementById('bRes'), bDay = document.getElementById('bDay');
  const pRes = document.getElementById('paneRes'), pDay = document.getElementById('paneDay');
  const show = res => {
    const to = res ? pRes : pDay, from = res ? pDay : pRes;
    if (!to.hidden) return; // already showing
    bRes.setAttribute('aria-pressed', res); bDay.setAttribute('aria-pressed', !res);
    const flip = () => { from.hidden = true; to.hidden = false; ScrollTrigger.refresh(); };
    if (reduce) return flip();
    gsap.to(from, { opacity: 0, y: 12, duration: 0.25, onComplete: () => {
      gsap.set(from, { clearProps: 'all' });
      flip();
      gsap.fromTo(to, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, clearProps: 'all' });
    } });
  };
  bRes.addEventListener('click', () => show(true));
  bDay.addEventListener('click', () => show(false));

  // FAQ: only one answer open at a time
  const faqs = [...document.querySelectorAll('.faq-list details')];
  faqs.forEach(d => d.addEventListener('toggle', () => {
    if (d.open) faqs.forEach(o => { if (o !== d) o.open = false; });
  }));

  const initAOS = () => AOS.init({ duration: 800, once: true, easing: 'ease-out-cubic', disable: reduce });
  if (document.documentElement.classList.contains('pl-on')) document.addEventListener('preloader:done', initAOS, { once: true });
  else initAOS();
  if (reduce) return;

  // Hero: one orchestrated entrance, bars rise from the bottom
  gsap.timeline({ defaults: { ease: 'power4.out' } })
    .from('.thh h1 .line span', { yPercent: 110, duration: 1.2, stagger: 0.12 });
  // Photo cards reveal as each one scrolls into view
  gsap.utils.toArray('.bar').forEach(b => gsap.from(b, { clipPath: 'inset(100% 0 0 0)', duration: 1.1, ease: 'power3.out',
    scrollTrigger: { trigger: b, start: 'top 92%' } }));

  // Therapies: pinned sideways scroll on desktop, plain stack elsewhere
  const sec = document.querySelector('.th-h'), track = sec.querySelector('.h-track');
  gsap.matchMedia().add('(min-width: 901px)', () => {
    sec.classList.add('th-pin');
    const dist = () => track.scrollWidth - innerWidth;
    gsap.to(track, { x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });
    return () => sec.classList.remove('th-pin');
  });
  addEventListener('load', () => ScrollTrigger.refresh());

  // Day: the big clock follows the schedule
  const clock = document.getElementById('clock');
  const items = gsap.utils.toArray('.day-list li');
  items.forEach(li => ScrollTrigger.create({
    trigger: li, start: 'top 55%', end: 'bottom 55%',
    onToggle: self => {
      li.classList.toggle('on', self.isActive);
      if (self.isActive && clock.textContent !== li.dataset.t) {
        clock.textContent = li.dataset.t;
        gsap.fromTo(clock, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4 });
      }
    }
  }));

  // Closing headline scales in
  gsap.from('.th-cta h2', { scale: 0.88, opacity: 0, duration: 1.2, ease: 'power3.out', transformOrigin: 'center center',
    scrollTrigger: { trigger: '.th-cta', start: 'top 70%' } });
})();