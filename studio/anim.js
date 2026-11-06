/* Animacje wejścia widoków (dev): klasa html.anim-in działa tylko chwilę po zmianie strony. */
(function () {
  var de = document.documentElement, off = null, quiet = null;
  try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}
  function stagger() {
    document.querySelectorAll('.grid, .related-grid, .rank-list, #quick-slot, .tools').forEach(function (g) {
      [].forEach.call(g.children, function (c, i) { c.style.setProperty('--i', i); });
    });
    var h = document.querySelector('#hero-slot .hero'); if (h) h.style.setProperty('--i', 0);
  }
  function play() {
    stagger();
    de.classList.remove('anim-in'); void de.offsetWidth; de.classList.add('anim-in');
    clearTimeout(off); off = setTimeout(function () { de.classList.remove('anim-in'); }, 1500);
  }
  window.addEventListener('hashchange', function () { setTimeout(play, 40); });
  /* pierwsze wejście: poczekaj, aż treść się narysuje */
  var app = document.getElementById('app') || document.body, n = 0;
  var mo = new MutationObserver(function () {
    clearTimeout(quiet);
    quiet = setTimeout(function () { mo.disconnect(); play(); }, 120);
    if (++n > 200) mo.disconnect();
  });
  mo.observe(app, { childList: true, subtree: true });
  setTimeout(function () { mo.disconnect(); }, 6000);
})();
