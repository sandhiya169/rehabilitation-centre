(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const mail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  // Validation only. Nothing is stored or checked against an account.
  const rules = {
    name: v => !v ? 'Enter your full name.' : v.length < 2 ? 'Name is too short.' : '',
    email: v => !v ? 'Enter your email address.' : !mail.test(v) ? 'Enter a valid email, like name@example.com.' : '',
    loginPw: v => !v ? 'Enter your password.' : v.length < 8 ? 'Use at least 8 characters.' : '',
    newPw: v => !v ? 'Create a password.' : v.length < 8 ? 'Use at least 8 characters.' : !/[A-Za-z]/.test(v) || !/\d/.test(v) ? 'Include at least one letter and one number.' : '',
    confirm: (v, f) => !v ? 'Confirm your password.' : v !== f.elements.password.value ? 'Passwords do not match.' : '',
    role: v => v ? '' : 'Choose how you will use Stackly.',
    terms: (v, f, el) => el.checked ? '' : 'Please accept the terms to continue.'
  };
  const check = el => {
    const v = el.type === 'password' ? el.value : el.value.trim();
    const msg = rules[el.dataset.rule](v, el.form, el);
    const f = el.closest('.fld');
    f.classList.toggle('bad', !!msg);
    $('.err', f).textContent = msg;
    el.setAttribute('aria-invalid', !!msg);
    return !msg;
  };
  const wire = (form, ok) => {
    const els = [...form.querySelectorAll('[data-rule]')];
    const live = el => el.closest('.fld').classList.contains('bad') && check(el);
    els.forEach(el => {
      el.addEventListener('blur', () => check(el));
      el.addEventListener('input', () => live(el));
      el.addEventListener('change', () => live(el));
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const bad = els.filter(el => !check(el));
      bad.length ? bad[0].focus() : ok();
    });
  };

  // Show / hide password
  document.querySelectorAll('.pw-t').forEach(b => b.addEventListener('click', () => {
    const i = b.previousElementSibling, show = i.type === 'password';
    i.type = show ? 'text' : 'password';
    b.textContent = show ? 'Hide' : 'Show';
    b.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  }));

  document.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.seg button').forEach(x => x.setAttribute('aria-pressed', x === b));
  }));

  const lf = $('#loginForm');
  if (lf) {
    let role = 'user';
    const copy = { user: ['Welcome back', 'Sign in to your patient account.'], admin: ['Admin sign in', 'Sign in to the therapist and admin dashboard.'] };
    document.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => {
      role = b.dataset.role;
      $('#title').textContent = copy[role][0];
      $('#lead').textContent = copy[role][1];
    }));
    const go = email => {
      sessionStorage.setItem('dashEmail', email);
      location.href = `${role === 'admin' ? 'therapist' : 'patient'}-dashboard.html`;
    };
    wire(lf, () => go(lf.elements.email.value.trim()));
    document.querySelectorAll('[data-social]').forEach(b => b.addEventListener('click', () => go('Signed in with ' + b.dataset.social)));
  }

  // Signup: validate, confirm, then send to the login page
  const sf = $('#signupForm');
  if (sf) {
    wire(sf, () => {
      $('#ok').classList.add('show');
      $('button[type=submit]', sf).disabled = true;
      setTimeout(() => location.href = 'login.html', 1600);
    });
    sf.elements.password.addEventListener('input', () => {
      const c = sf.elements.confirm;
      c.value && check(c);
    });
  }

  if (window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.from('.au-card > *', { opacity: 0, y: 24, stagger: 0.07, duration: 0.8, ease: 'power3.out' });
    gsap.from('.au-arch', { clipPath: 'inset(100% 0 0 0)', duration: 1.2, ease: 'power4.out' });
    gsap.from('.au-side h2, .au-side p', { opacity: 0, y: 30, stagger: 0.12, delay: 0.4, ease: 'power3.out' });
  }
})();
