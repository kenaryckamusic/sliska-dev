/* Śliska News – „Knaga mówi”: maskotka w rogu ekranu z dymkami.
   Nowa osoba widzi Nieśmiałą (schowaną) Knagę, dopóki nie przeczyta pierwszego artykułu do końca – wtedy Knaga się odsłania.
   Wyłączanie: × na dymku → „Wyłącz Knagę” (zapamiętane); włączanie/wyłączanie też w stopce („Knaga: wyłącz/włącz”). */
(function () {
  'use strict';
  var KEY = 'sn-knaga';
  function st() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function put(o) { try { var s = st(); for (var k in o) s[k] = o[k]; localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* ignoruj */ } }
  var el, bub, cur = '', hideT = 0, said = {}, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* teksty: [strój, tekst] */
  var LINES = {
    shy: [['niesmiala', 'Cześć… jestem Knaga. Przeczytaj jakiś artykuł do końca, to się pokażę. 🙈'], ['niesmiala', 'Nie patrz tak… najpierw coś przeczytaj.'], ['niesmiala', 'Jeszcze się wstydzę. Jeden artykuł i jestem cała Twoja.']],
    reveal: [['imprezowa', 'TADAM! Przeczytane, więc się odsłaniam. Teraz będę Ci tu czasem mokro komentować. 💦']],
    home: [['ziomek', 'Siema! Co dziś czytamy?'], ['sliska', 'Ale dziś mokro na scenie…'], ['detektyw', 'Coś mi tu śmierdzi plotką. Przewiń niżej.'], ['gwiazdor', 'Zero wtop od wczoraj. Na razie.'], ['kibic', 'Śliska gola! Nowe artykuły wpadły.']],
    article: [['redaktor', 'Mocny tekst. Dawaj do końca!'], ['zakochana', 'O, ten news mi się podoba.'], ['diabelek', 'Pod tym będzie się działo w komentarzach…'], ['wsciekla', 'NO JAK ON MÓGŁ?!'], ['uwodziciel', 'Czytasz mnie jak otwartą księgę…']],
    done: [['imprezowa', 'Przeczytane do końca! Szacun.'], ['super', 'Kolejny przeczytany. Super czytelnik!'], ['zakochana', 'Do końca? Ale z Ciebie Ślizgacz. 💖']],
    games: [['surfer', 'Zagrajmy! Rekordy czekają.'], ['imprezowa', 'Psst… stuknij mnie kilka razy w nagłówku Gier.'], ['super', 'Pobij swój rekord, dasz radę!']],
    night: [['szlafrok', 'Jeszcze nie śpisz? Ja też nie…'], ['kapiel', 'Nocna kąpiel w newsach. Mokro.'], ['sauna', 'Gorąco tu o tej porze, czy to te plotki?']],
    tip: [['detektyw', 'Masz temat? Dawaj, Knaga zachowa dyskrecję.']],
    spot: [['gwiazdor', 'Reklama za darmo? U nas tak. Dawaj grafikę!']]
  };
  var pick = function (arr) { var free = arr.filter(function (l) { return !said[l[1]]; }); var l = (free.length ? free : arr)[Math.floor(Math.random() * (free.length ? free : arr).length)]; said[l[1]] = 1; return l; };
  var hour = function () { return new Date().getHours(); };

  function build() {
    if (el) return;
    el = document.createElement('div'); el.className = 'kgm'; el.setAttribute('aria-live', 'polite');
    el.innerHTML = '<div class="kgm-bub" hidden><p class="kgm-t"></p><button type="button" class="kgm-x" aria-label="Zamknij dymek">×</button><div class="kgm-menu" hidden><button type="button" data-a="later">Schowaj na teraz</button><button type="button" data-a="off">Wyłącz Knagę</button></div></div><button type="button" class="kgm-k" aria-label="Knaga – maskotka Śliskiej News"></button>';
    document.body.appendChild(el); bub = el.querySelector('.kgm-bub');
    el.querySelector('.kgm-k').addEventListener('click', function () { if (!bub.hidden) { hideBub(); return; } say(randomFor(), 7000); poke(); });
    el.querySelector('.kgm-x').addEventListener('click', function (e) { e.stopPropagation(); var m = el.querySelector('.kgm-menu'); m.hidden = !m.hidden; });
    el.querySelector('.kgm-menu').addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return;
      if (b.dataset.a === 'off') { put({ off: 1 }); el.remove(); el = null; if (window.toast) window.toast('Knaga schowana. Włączysz ją z powrotem w stopce strony.'); syncFoot(); }
      else { hideBub(); el.classList.add('is-away'); setTimeout(function () { if (el) el.classList.remove('is-away'); }, 10 * 60e3); }
    });
  }
  function poke() { var k = el.querySelector('.kgm-k'); k.classList.remove('is-poke'); void k.offsetWidth; k.classList.add('is-poke'); }
  function setLook(slug) { if (slug === cur) return; cur = slug; el.querySelector('.kgm-k').innerHTML = window.Knaga ? Knaga.svg(slug, { cls: 'kgm-svg', title: 'Knaga' }) : ''; }
  function say(line, ms) {
    if (!el) return; setLook(line[0]);
    var m = el.querySelector('.kgm-menu'); m.hidden = true;
    el.querySelector('.kgm-t').textContent = line[1]; bub.hidden = false; el.classList.add('has-bub');
    clearTimeout(hideT); if (ms) hideT = setTimeout(hideBub, ms);
  }
  function hideBub() { if (!bub) return; bub.hidden = true; el.classList.remove('has-bub'); }
  function shy() { return !st().revealed; }
  function ctxName() { var h = location.hash || '#/'; return /^#\/artykul\//.test(h) ? 'article' : /^#\/gry/.test(h) ? 'games' : /^#\/zglos/.test(h) ? 'tip' : /^#\/spot/.test(h) ? 'spot' : 'home'; }
  function randomFor() { if (shy()) return pick(LINES.shy); var c = ctxName(), h = hour(); if ((h >= 23 || h < 5) && Math.random() < .6) return pick(LINES.night); return pick(LINES[c] || LINES.home); }

  /* odsłonięcie po pierwszym przeczytanym artykule (przewinięty do końca) */
  var readT = 0;
  function watchRead() {
    clearTimeout(readT);
    if (!/^#\/artykul\//.test(location.hash)) return;
    var t0 = Date.now(), fired = false;
    function chk() {
      if (fired || !/^#\/artykul\//.test(location.hash)) return;
      var body = document.querySelector('#view-article .article-body, #view-article article') || document.querySelector('#view-article');
      if (!body) return;
      var r = body.getBoundingClientRect();
      if (r.bottom < window.innerHeight + 40 && Date.now() - t0 > 15000) {
        fired = true; window.removeEventListener('scroll', chk);
        var n = (st().read || 0) + 1; put({ read: n });
        if (shy()) { put({ revealed: 1 }); reveal(); } else if (!st().off && Math.random() < .5) say(pick(LINES.done), 6000);
      }
    }
    window.addEventListener('scroll', chk, { passive: true });
    readT = setTimeout(chk, 15500);
  }
  function reveal() {
    if (!el) return;
    el.classList.add('is-reveal');
    setTimeout(function () { say(LINES.reveal[0], 9000); setTimeout(function () { el && el.classList.remove('is-reveal'); }, 1200); }, reduce ? 0 : 450);
  }

  var lastCtx = '', timer = 0;
  function onRoute() {
    if (st().off) return;
    build(); watchRead();
    el.classList.toggle('is-hidden', /^#\/gry\/./.test(location.hash));   // w trakcie gry Knaga nie zasłania planszy
    var c = ctxName();
    setLook(shy() ? 'niesmiala' : (hour() >= 23 || hour() < 5) ? 'szlafrok' : c === 'games' ? 'surfer' : 'ziomek');
    if (c !== lastCtx) {
      lastCtx = c; clearTimeout(timer);
      var first = !st().seen; put({ seen: 1 });
      timer = setTimeout(function () { if (Math.random() < (first ? 1 : .35)) say(randomFor(), 7000); }, first ? 2500 : 9000);
    }
  }
  window.KnagaMowi = {
    on: function () { put({ off: 0 }); onRoute(); },
    off: function () { put({ off: 1 }); if (el) { el.remove(); el = null; } },
    isOn: function () { return !st().off; },
    reset: function () { localStorage.removeItem(KEY); }
  };
  function syncFoot() { var a = document.getElementById('knaga-toggle'); if (a) a.textContent = st().off ? 'Knaga: włącz' : 'Knaga: wyłącz'; }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('#knaga-toggle'); if (!a) return; e.preventDefault();
    if (st().off) window.KnagaMowi.on(); else window.KnagaMowi.off(); syncFoot();
  });
  window.addEventListener('hashchange', function () { onRoute(); syncFoot(); });
  setTimeout(syncFoot, 1500);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(onRoute, 1200); }); else setTimeout(onRoute, 1200);
})();
