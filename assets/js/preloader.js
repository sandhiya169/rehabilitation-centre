/* Preloader: shows until the page has fully loaded (minimum ~1s so it never just flashes) */
(function () {
  var pl = document.getElementById('pl');
  if (!pl) return;
  var root = document.documentElement, start = Date.now(), done = false;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MIN = reduce ? 0 : 1100;
  root.classList.add('pl-on');

  function hide() {
    if (done) return;
    done = true;
    setTimeout(function () {
      pl.classList.add('pl-done');
      root.classList.remove('pl-on');
      // start the page's entrance animations only once the curtain has fully lifted (.9s CSS transition)
      setTimeout(function () {
        root.classList.add('pl-ready');
        document.dispatchEvent(new Event('preloader:done'));
      }, reduce ? 0 : 950);
      setTimeout(function () { pl.remove(); }, 1300);
    }, Math.max(0, MIN - (Date.now() - start)));
  }

  if (document.readyState === 'complete') hide();
  else addEventListener('load', hide);
  setTimeout(hide, 5000); // never keep anyone waiting longer than 5s
})();
