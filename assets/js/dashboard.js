(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => document.querySelector(s);
  const nav = $('#sbNav'), views = [...document.querySelectorAll('.view')];

  // Logged in email — read from sessionStorage (no query string in URL)
  const email = (sessionStorage.getItem('dashEmail') || '').trim();
  if (email) {
    $('#email').textContent = email;
    $('#av').textContent = email[0].toUpperCase();
    // sidebar copy (mobile)
    const sbEmail = $('#sb-email'), sbAv = $('#sb-av');
    if (sbEmail) sbEmail.textContent = email;
    if (sbAv) sbAv.textContent = email[0].toUpperCase();
  }
  $('.dh-user').title = email || 'Guest';

  // Clean URL — remove any leftover query string silently
  if (location.search) {
    history.replaceState(null, '', location.pathname + location.hash);
  }

  // Mobile sidebar
  const setMenu = open => document.body.classList.toggle('sb-open', open);
  $('#burger').addEventListener('click', () => setMenu(true));
  $('#sbClose').addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); setMenu(false); });
  $('#scrim').addEventListener('click', () => setMenu(false));
  nav.addEventListener('click', () => setMenu(false));
  addEventListener('keydown', e => e.key === 'Escape' && setMenu(false));
  addEventListener('resize', () => innerWidth > 900 && setMenu(false));

  // Menu pages — show view without putting #hash in the URL
  const show = id => {
    const v = views.find(x => x.id === id) || views[0];
    views.forEach(x => x.hidden = x !== v);
    nav.querySelectorAll('a').forEach(a => a.dataset.id === v.id
      ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
    $('#pageTitle').textContent = v.dataset.title;
    document.title = `${v.dataset.title} | ${$('.sb-role').textContent} | Stackly`;
    // Keep URL clean — no hash
    history.replaceState(null, '', location.pathname);
    scrollTo(0, 0);
    if (reduce || !window.gsap) return;
    gsap.from(v.querySelectorAll('.ds'), { opacity: 0, y: 30, duration: 0.7, stagger: 0.12, ease: 'power3.out' });
    gsap.from(v.querySelectorAll('.bar u'), { scaleX: 0, transformOrigin: 'left', duration: 1.1, delay: 0.3, stagger: 0.1, ease: 'power3.out' });
    v.querySelectorAll('[data-n]').forEach(el => {
      const o = { v: 0 }, s = el.dataset.s;
      el.textContent = '0' + s;
      gsap.to(o, { v: +el.dataset.n, duration: 1.4, ease: 'power2.out', onUpdate: () => el.textContent = Math.round(o.v) + s });
    });
  };

  // Nav clicks use data-id instead of href hash
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    show(a.dataset.id);
    setMenu(false);
  }));

  show(location.hash.slice(1) || 'overview');
})();