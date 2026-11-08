/* Śliska News – Śliskie Gry (#/gry). Gry działają w przeglądarce; rekordy zalogowanych zapisują się na koncie (Worker /gry/record),
   niezalogowanych – na urządzeniu. Słowa Ślizgli, krzyżówki i teksty Knagi może ustawiać właściciel (panel dev.sliska.pl → Gry i Knaga).
   Wywołanie: SliskieGry.mount(el, sub, { articles }). */
(function () {
  'use strict';
  var KEY = 'sn-gry';
  var API = (window.CONFIG && CONFIG.API_BASE) || (typeof CONFIG !== 'undefined' ? CONFIG.API_BASE : '/news/api');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var K = function (slug, cls) { return window.Knaga ? Knaga.svg(slug, { cls: cls || 'gk' }) : ''; };
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* ignoruj */ } }
  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignoruj */ } }
  function xp(kind) { if (window.SnXP) SnXP.earn(kind); }
  var logged = function () { try { return Readers.loggedIn() && (!Readers.hasName || Readers.hasName()); } catch (e) { return false; } };
  var uid = function () { try { return Readers.user && Readers.user.uid; } catch (e) { return ''; } };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var stopFns = [];
  function stopAll() { stopFns.forEach(function (f) { try { f(); } catch (e) { /* ignoruj */ } }); stopFns = []; }
  function dayIndex() { var d = new Date(); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 10, 1)) / 864e5); }
  function weekIndex() { return Math.floor((dayIndex() + 6) / 7); }
  var ICO = {
    back: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
    share: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v13M7 8l5-5 5 5"/><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></svg>',
    pause: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.5"/><rect x="14" y="5" width="4" height="14" rx="1.5"/></svg>',
    fire: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.3 1.2-3.7 2.3-4.7.3 1.6 1 2.6 2 3.1C11 8.6 11.3 5.6 12 3z"/></svg>',
    spark: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>',
    cup: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v4M8.5 20h7"/></svg>'
  };

  /* ---------- konfiguracja właściciela (Ślizgle, krzyżówka, teksty Knagi) ---------- */
  window.SnCfg = window.SnCfg || fetch(API + '/gry/cfg', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; });
  function cfg() { return Promise.race([window.SnCfg, new Promise(function (res) { setTimeout(function () { res({}); }, 2500); })]); }

  /* ---------- lista gier ---------- */
  var GAMES = [
    { id: 'slizgle', name: 'Ślizgle', knaga: 'redaktor', sub: 'Codzienne kontrowersyjne słowo. 6 prób.', tag: 'Codzienna', kind: 'daily', c: ['#0b5d34', '#1fbf6b'],
      how: 'Zgadnij słowo dnia (4–7 liter, długość widać na planszy). Po każdej próbie litery zmieniają kolor: <b class="hw ok">zielony</b> – dobra litera na dobrym miejscu, <b class="hw in">żółty</b> – litera jest, ale gdzie indziej, <b class="hw no">szary</b> – nie ma jej. Masz 6 prób, nowe słowo o północy.' },
    { id: 'krzyzowka', name: 'Krzyżówka Tygodnia', knaga: 'szlafrok', sub: 'Odgadnij wyrazy i odkryj hasło tygodnia.', tag: 'Co tydzień', kind: 'weekly', c: ['#1f2470', '#5b63ff'],
      how: 'Wpisz wyrazy według podpowiedzi. Litery w złotej kolumnie czytane z góry na dół tworzą hasło tygodnia. Nowa krzyżówka w każdy poniedziałek.' },
    { id: 'krople', name: 'Łap Krople', knaga: 'kapiel', sub: 'Łap krople do wanny, unikaj pozwów.', tag: 'Zręcznościowa', unit: 'pkt', c: ['#075985', '#38bdf8'],
      how: 'Przesuwaj wannę z Knagą: myszką, palcem albo strzałkami. Kropla +1, złota kropla +5, serduszko oddaje życie. Pozew zabiera życie. Co 10 złapanych kropli bez pudła – bonus.' },
    { id: 'flappy', name: 'Knaga Flappy', knaga: 'super', sub: 'Leć nad sceną między mikrofonami.', tag: 'Zręcznościowa', unit: 'pkt', c: ['#2b0f55', '#c0164a'],
      how: 'Spacja, kliknięcie albo stuknięcie – Super Knaga macha peleryną i podlatuje. Przelatuj między statywami z mikrofonami. Z każdym punktem robi się ciaśniej.' },
    { id: 'waz', name: 'Śliski Wąż', knaga: 'ikona', sub: 'Zbieraj mikrofony, nie gryź się w ogon.', tag: 'Klasyk', unit: 'pkt', c: ['#3a0a33', '#ff2d77'],
      how: 'Strzałki, WASD albo przesunięcie palcem zmienia kierunek. Mikrofon +1, złoty mikrofon +3 (znika po kilku sekundach). Nie uderzaj w ściany ani w siebie.' },
    { id: 'ukladanka', name: 'Śliska Układanka', knaga: 'detektyw', sub: 'Ułóż zdjęcie z artykułu.', tag: 'Logiczna', unit: 'ruchów', low: true, c: ['#7a3d00', '#ffae2b'],
      how: 'Przesuwaj kafelki na puste pole, aż ułożysz zdjęcie z artykułu. Rekordem jest najmniejsza liczba ruchów. „Podgląd” pokazuje całe zdjęcie.' },
    { id: 'drama', name: 'Drama Simulator', knaga: 'wsciekla', sub: 'Jesteś w środku afery. Co robisz?', tag: 'Fabularna', kind: 'story', c: ['#5c0716', '#ff3b3b'],
      how: 'Wybierz aferę i podejmuj decyzje. Każdy wybór zmienia Hype, Szacunek i Kasę – od nich zależy, które z 8 zakończeń zobaczysz. Zbierz wszystkie.' },
    { id: 'slizgawka', name: 'Ślizgawka', knaga: 'surfer', sub: 'Tajna gra. Surfuj i skacz.', tag: 'Sekret', unit: 'm', secret: true, c: ['#b33a1a', '#ffb36b'],
      how: 'Spacja albo stuknięcie – skok (drugi raz w powietrzu = podwójny skok). Przeskakuj pozwy, dissy i fejki, zbieraj krople (+25 m).' }
  ];
  var G = function (id) { return GAMES.filter(function (g) { return g.id === id; })[0]; };
  var unlocked = function () { return !!load().slizgawka; };

  /* ---------- rekordy: konto (zalogowani) albo urządzenie ---------- */
  var acc = null;
  function low(g) { return !!(G(g) || {}).low; }
  function better(g, a, b) { if (!a) return false; if (!b) return true; return low(g) ? a < b : a > b; }
  function best(g) { if (acc && logged() && acc.uid === uid()) return acc.best[g] || 0; return (load().best || {})[g] || 0; }
  function fmt(g, v) {
    if (!v) return '–';
    if (g === 'slizgle') return (7 - v) + '/6';
    if (g === 'drama') return v + '/8';
    if (g === 'krzyzowka') return v + '×';
    return v + ' ' + (G(g).unit || '');
  }
  function postRec(g, v) { if (!window.actorApi) return; actorApi('/gry/record', { method: 'POST', body: JSON.stringify({ game: g, score: v }) }).catch(function () {}); }
  function accLoad() {
    if (!logged() || !window.actorApi) { acc = null; return Promise.resolve(null); }
    var u = uid(); if (acc && acc.uid === u) return Promise.resolve(acc);
    return actorApi('/gry/me').then(function (d) {
      acc = { uid: u, best: (d && d.best) || {} };
      var k = 'sn-gry-sync-' + u;
      if (!lsGet(k)) { lsSet(k, 1); var lb = load().best || {}; Object.keys(lb).forEach(function (g) { if (G(g) && better(g, lb[g], acc.best[g])) { acc.best[g] = lb[g]; postRec(g, lb[g]); } }); }
      return acc;
    }).catch(function () { return null; });
  }
  /** Zapis wyniku. Zwraca true, gdy to nowy rekord (konta albo urządzenia). */
  function submit(g, score, noPlay) {
    var d = load(); d.best = d.best || {}; if (!noPlay) d.played = (d.played || 0) + 1;
    var nb = better(g, score, best(g));
    if (better(g, score, d.best[g])) d.best[g] = score;
    save(d);
    if (nb && logged()) { if (acc) acc.best[g] = score; postRec(g, score); }
    var b = $('#gry-best'); if (b) b.textContent = fmt(g, best(g));
    return nb;
  }
  function played(g) { try { fetch(API + '/gry/play', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ game: g }), keepalive: true }).catch(function () {}); } catch (e) { /* ignoruj */ } }
  window.addEventListener('sn:reader', function () { acc = null; accLoad().then(function () { var b = $('#gry-best'), cur = $('.gp[data-game]'); if (b && cur) b.textContent = fmt(cur.dataset.game, best(cur.dataset.game)); }); });

  /* ---------- najlepsi gracze ---------- */
  function loadTop(g) {
    fetch(API + '/gry/top?game=' + g, { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
      var box = $('#gp-top'), t1 = $('#gry-top1'); if (!box) return;
      var top = (d && d.top) || [];
      if (t1) t1.textContent = top[0] ? fmt(g, top[0].best) : '–';
      box.innerHTML = top.length ? top.map(function (u, i) {
        return '<li' + (i < 3 ? ' class="is-' + (i + 1) + '"' : '') + '><span class="gp-pos">' + (i + 1) + '</span><a href="#/uzytkownik/' + esc(u.u) + '"><span class="avatar' + (u.lv ? ' lv-ring lv-' + u.lv : '') + '">' + (typeof readerAvatar === 'function' ? readerAvatar(u.name, u.av, u.u) : '') + '</span><b>' + esc(u.name) + '</b></a><em>' + fmt(g, u.best) + '</em></li>';
      }).join('') : '<li class="gp-empty">Nikt jeszcze nie ma rekordu. Bądź pierwszy!</li>';
    }).catch(function () { var box = $('#gp-top'); if (box) box.innerHTML = '<li class="gp-empty">Ranking chwilowo niedostępny.</li>'; });
  }
  function toast(t) { var n = document.createElement('div'); n.className = 'gry-toast'; n.textContent = t; document.body.appendChild(n); setTimeout(function () { n.classList.add('out'); }, 2200); setTimeout(function () { n.remove(); }, 2700); }
  function share(text) { if (navigator.share) navigator.share({ text: text }).catch(function () {}); else if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { toast('Skopiowano – wklej, gdzie chcesz'); }); }
  var LINK = 'news.sliska.pl/gry';

  /* ================= HUB ================= */
  function hub(el) {
    var d = load(), hidden = !unlocked(), recs = GAMES.filter(function (g) { return best(g.id); }).length;
    var sl = slizgleState(), kz = lsGet('sn-krzyz-done-' + weekIndex());
    var tile = function (g) {
      var b = best(g.id);
      return '<a class="gh-tile' + (g.secret ? ' is-secret' : '') + '" href="#/gry/' + g.id + '" style="--g1:' + g.c[0] + ';--g2:' + g.c[1] + '">' +
        '<span class="gh-tile-k">' + K(g.knaga) + '</span><span class="gh-tag">' + g.tag + '</span><b>' + g.name + '</b><small>' + g.sub + '</small>' +
        '<em>' + (g.kind === 'story' ? ((d.endings || []).length + '/8 zakończeń') : b ? ICO.cup + ' ' + fmt(g.id, b) : 'Zagraj pierwszy raz') + '</em></a>';
    };
    var feat = function (g, title, meta, cta) {
      return '<a class="gh-feat" href="#/gry/' + g.id + '" style="--g1:' + g.c[0] + ';--g2:' + g.c[1] + '"><span class="gh-feat-t"><span class="gh-tag">' + title + '</span><b>' + g.name + '</b><small>' + meta + '</small><span class="gh-cta">' + cta + ' →</span></span><span class="gh-feat-k">' + K(g.knaga) + '</span></a>';
    };
    el.innerHTML = '<div class="gh">' +
      '<header class="gh-hero"><div class="gh-hero-t"><span class="gry-eyebrow">Śliska strefa</span><h1>Śliskie Gry</h1><p>Codzienne słowo, krzyżówka tygodnia, zręcznościówki i afery do rozegrania. Zalogowani zbierają XP, a rekordy zapisują się na koncie.</p>' +
      '<div class="gh-stats"><span><b>' + (d.played || 0) + '</b> rozegranych</span><span><b>' + recs + '</b> rekordów</span><a href="#/sezon">' + ICO.cup + ' Ranking sezonu</a></div></div>' +
      '<button type="button" class="gh-hero-k" id="gry-hero-k" aria-label="Knaga">' + K('imprezowa', 'gk') + '</button></header>' +
      '<div class="gh-feats">' +
      feat(G('slizgle'), 'Słowo dnia #' + (dayIndex() + 1), sl && sl.end ? (sl.win ? 'Dziś zgadnięte w ' + sl.rows.length + '/6 ✓' : 'Dziś bez trafienia – jutro nowe słowo') : 'Nowe słowo czeka. 6 prób.', sl && sl.end ? 'Zobacz wynik' : 'Zgaduj') +
      feat(G('krzyzowka'), 'Tydzień #' + weekIndex(), kz ? 'Rozwiązana ✓ – nowa w poniedziałek' : 'Hasło tygodnia czeka na odkrycie.', kz ? 'Zobacz' : 'Rozwiąż') + '</div>' +
      '<h2 class="gh-h">Zręcznościowe</h2><div class="gh-grid">' + ['krople', 'flappy', 'waz'].concat(hidden ? [] : ['slizgawka']).map(function (id) { return tile(G(id)); }).join('') + '</div>' +
      '<h2 class="gh-h">Na spokojnie</h2><div class="gh-grid">' + ['drama', 'ukladanka'].map(function (id) { return tile(G(id)); }).join('') + '</div>' +
      (hidden ? '<p class="gry-hint">Psst… ponoć jest tu jeszcze jedna, ukryta gra. Knaga coś wie.</p>' : '') +
      '<nav class="gh-more" aria-label="Śliska strefa"><a href="#/sezon">' + ICO.cup + '<span><b>Ranking sezonu</b><small>Kto zebrał najwięcej XP w tym miesiącu</small></span></a><a href="#/dramy">' + ICO.fire + '<span><b>Osie czasu dram</b><small>Afery krok po kroku</small></span></a><a href="#/podsumowanie">' + ICO.spark + '<span><b>Twój miesiąc</b><small>Śliskie Podsumowanie</small></span></a></nav></div>';
    var clicks = 0, kb = $('#gry-hero-k', el);
    kb.addEventListener('click', function () {
      clicks++; kb.classList.remove('is-poke'); void kb.offsetWidth; kb.classList.add('is-poke');
      if (clicks >= 5 && hidden) { var x = load(); x.slizgawka = 1; save(x); toast('Odkryłeś Ślizgawkę! 🏄'); location.hash = '#/gry/slizgawka'; }
    });
    accLoad().then(function (a) { if (a && $('.gh')) { var n = GAMES.filter(function (g) { return best(g.id); }).length; var s = el.querySelector('.gh-stats span:nth-child(2) b'); if (s) s.textContent = n; } });
  }

  /* ---------- ekran gry: nagłówek, plansza, panel boczny ---------- */
  function shell(el, g, inner, opt) {
    opt = opt || {};
    el.innerHTML = '<div class="gp" data-game="' + g.id + '" style="--g1:' + g.c[0] + ';--g2:' + g.c[1] + '">' +
      '<header class="gp-head"><a class="gp-back" href="#/gry" aria-label="Wszystkie gry">' + ICO.back + '</a><span class="gp-k">' + K(g.knaga) + '</span>' +
      '<div class="gp-t"><span class="gp-tag">' + (opt.tag || g.tag) + '</span><h1>' + g.name + '</h1></div>' +
      '<div class="gp-chips"><span class="gp-chip"><small>Twój rekord</small><b id="gry-best">' + fmt(g.id, best(g.id)) + '</b></span>' + (opt.noTop ? '' : '<span class="gp-chip"><small>Rekord Śliskiej</small><b id="gry-top1">–</b></span>') + '</div></header>' +
      '<div class="gp-main"><div class="gp-play">' + inner + '</div><aside class="gp-side">' + (opt.side || '') +
      '<section class="gp-box"><h3>Jak grać</h3><p>' + g.how + '</p></section>' +
      (opt.noTop ? '' : '<section class="gp-box"><h3>' + ICO.cup + ' Najlepsi gracze</h3><ol class="gp-top" id="gp-top"><li class="gp-empty">Ładowanie…</li></ol>' + (logged() ? '' : '<p class="gp-note">Zaloguj się, żeby rekord zapisał się na koncie i trafił na tę listę.</p>') + '</section>') +
      '</aside></div></div>';
    if (!opt.noTop) loadTop(g.id);
    accLoad().then(function () { var b = $('#gry-best'); if (b) b.textContent = fmt(g.id, best(g.id)); });
  }

  /* ============== ŚLIZGLE (codzienne słowo) ============== */
  var WORDS = ['AFERA', 'ZDRADA', 'WTOPA', 'SKANDAL', 'POZEW', 'HEJTER', 'ROMANS', 'PLOTKA', 'OBCIACH', 'FLIRT', 'PRZYPAŁ', 'ŚCIEMA', 'DRAMA', 'WYCIEK', 'NAGONKA', 'KŁAMCA', 'PLAGIAT', 'BLOKADA', 'ZAWIŚĆ', 'TOKSYK', 'KŁÓTNIA', 'BURDA', 'OSZUST', 'IMPREZA', 'RANDKA', 'GOLAS', 'WSTYD', 'PODRÓBA', 'ARESZT', 'MANDAT', 'HEJT', 'FEJK', 'DISS', 'BEEF', 'LANS', 'SPINA', 'BYŁA', 'BÓJKA', 'ŚLISKO', 'MOKRO'];
  var KB = ['ĄĆĘŁŃÓŚŹŻ', 'QWERTYUIOP', 'ASDFGHJKL', '⏎ZXCVBNM⌫'];
  function slizgleKey() { return 'sn-slizgle-' + dayIndex(); }
  function slizgleState() { return lsGet(slizgleKey()); }
  function slizgleAnswer(c) { return c && c.slizgle && c.slizgle.day === dayIndex() && c.slizgle.word ? c.slizgle.word : WORDS[((dayIndex() % WORDS.length) + WORDS.length) % WORDS.length]; }
  function slizgle(el) {
    var g = G('slizgle');
    shell(el, g, '<div class="sz"><p class="sz-load">Ładowanie słowa dnia…</p></div>', { tag: 'Słowo dnia #' + (dayIndex() + 1), side: '<section class="gp-box" id="sz-stats-box"></section>' });
    cfg().then(function (c) { if ($('.gp[data-game="slizgle"]')) slizgleRun(el, slizgleAnswer(c)); });
  }
  function slizgleRun(el, answer) {
    var L = answer.length, st = slizgleState();
    if (!st || st.a !== answer) st = { a: answer, rows: [], end: false, win: false };
    var cur = '', stats = lsGet('sn-slizgle-stats') || { played: 0, wins: 0, streak: 0, max: 0, dist: [0, 0, 0, 0, 0, 0], last: -9 };
    $('.sz').innerHTML = '<div class="sz-board" id="sz-board" style="--n:' + L + '"></div><p class="sz-msg" id="sz-msg" role="status"></p><div class="sz-kb" id="sz-kb"></div>';
    function score(w) {
      var res = Array(L).fill('no'), a = answer.split(''), used = Array(L).fill(false);
      w.split('').forEach(function (c, i) { if (c === a[i]) { res[i] = 'ok'; used[i] = true; } });
      w.split('').forEach(function (c, i) { if (res[i] === 'ok') return; var j = a.findIndex(function (x, k) { return x === c && !used[k]; }); if (j >= 0) { res[i] = 'in'; used[j] = true; } });
      return res;
    }
    function statsHtml() {
      var mx = Math.max.apply(null, stats.dist.concat([1]));
      return '<h3>Twoje Ślizgle</h3><div class="sz-st"><span><b>' + stats.played + '</b>gier</span><span><b>' + (stats.played ? Math.round(stats.wins / stats.played * 100) : 0) + '%</b>wygranych</span><span><b>' + stats.streak + '</b>seria</span><span><b>' + stats.max + '</b>najdłuższa</span></div>' +
        '<div class="sz-dist">' + stats.dist.map(function (n, i) { return '<div><span>' + (i + 1) + '</span><i style="width:' + Math.max(8, n / mx * 100) + '%"' + (st.win && st.rows.length === i + 1 ? ' class="is-now"' : '') + '>' + n + '</i></div>'; }).join('') + '</div>';
    }
    function draw() {
      var rows = '';
      for (var r = 0; r < 6; r++) {
        var w = st.rows[r] || (r === st.rows.length && !st.end ? cur : ''), sc = st.rows[r] ? score(st.rows[r]) : null, act = r === st.rows.length && !st.end;
        var cells = ''; for (var i = 0; i < L; i++) cells += '<span class="sz-c' + (sc ? ' sz-' + sc[i] : w[i] ? ' sz-f' : '') + '">' + (w[i] || '') + '</span>';
        rows += '<div class="sz-row' + (act ? ' is-act' : '') + '">' + cells + '</div>';
      }
      $('#sz-board').innerHTML = rows;
      var stt = {};
      st.rows.forEach(function (w) { score(w).forEach(function (s, i) { var c = w[i], o = stt[c]; stt[c] = o === 'ok' || s === 'ok' ? 'ok' : o === 'in' || s === 'in' ? 'in' : 'no'; }); });
      $('#sz-kb').innerHTML = KB.map(function (row) { return '<div class="sz-kr">' + row.split('').map(function (c) { var w = c === '⏎' || c === '⌫'; return '<button type="button" class="sz-key' + (w ? ' is-wide' : '') + (stt[c] ? ' sz-' + stt[c] : '') + '" data-k="' + c + '" aria-label="' + (c === '⏎' ? 'Zatwierdź' : c === '⌫' ? 'Usuń' : c) + '">' + (c === '⏎' ? 'OK' : c) + '</button>'; }).join('') + '</div>'; }).join('');
      $('#sz-stats-box').innerHTML = statsHtml();
      if (st.end) {
        var txt = 'Ślizgle #' + (dayIndex() + 1) + ' ' + (st.win ? st.rows.length : 'X') + '/6\n' + st.rows.map(function (w) { return score(w).map(function (s) { return s === 'ok' ? '🟩' : s === 'in' ? '🟨' : '⬛'; }).join(''); }).join('\n') + '\n' + LINK;
        $('#sz-msg').innerHTML = '<div class="sz-end' + (st.win ? ' is-win' : '') + '">' + K(st.win ? 'imprezowa' : 'ratownik', 'gk') + '<div><b>' + (st.win ? ['Geniusz!', 'Mokro!', 'Świetnie!', 'Nieźle!', 'Uff!', 'Na styk!'][st.rows.length - 1] : 'Tym razem sucho') + '</b><span>' + (st.win ? 'Zgadłeś w ' + st.rows.length + '/6.' : 'Słowo dnia: ' + answer + '.') + ' Nowe słowo o północy.</span></div><button type="button" class="btn btn-primary btn-sm" id="sz-share">' + ICO.share + ' Udostępnij</button></div>';
        $('#sz-share').onclick = function () { share(txt); };
      }
    }
    function finish(win) {
      st.end = true; st.win = win; var di = dayIndex();
      stats.played++; if (win) { stats.wins++; stats.dist[st.rows.length - 1]++; stats.streak = stats.last === di - 1 ? stats.streak + 1 : 1; stats.max = Math.max(stats.max, stats.streak); } else stats.streak = 0;
      stats.last = win ? di : -9; lsSet('sn-slizgle-stats', stats);
      if (win) { submit('slizgle', 7 - st.rows.length); xp('slizgle'); } else { var d = load(); d.played = (d.played || 0) + 1; save(d); xp('game'); }
      played('slizgle'); setTimeout(zone, 0);
    }
    function press(k) {
      if (st.end) return;
      if (k === '⌫' || k === 'Backspace') cur = cur.slice(0, -1);
      else if (k === '⏎' || k === 'Enter') {
        if (cur.length < L) { $('#sz-msg').textContent = 'Słowo ma ' + L + ' liter.'; var a = $('.sz-row.is-act'); if (a) { a.classList.remove('is-shake'); void a.offsetWidth; a.classList.add('is-shake'); } return; }
        st.rows.push(cur); cur = '';
        if (st.rows[st.rows.length - 1] === answer) finish(true); else if (st.rows.length >= 6) finish(false);
        $('#sz-msg').textContent = '';
        lsSet(slizgleKey(), st);
      } else if (/^[A-ZĄĆĘŁŃÓŚŹŻ]$/i.test(k) && cur.length < L) cur += k.toUpperCase();
      draw();
    }
    $('#sz-kb').addEventListener('click', function (e) { var b = e.target.closest('[data-k]'); if (b) press(b.dataset.k); });
    var onKey = function (e) { if (e.ctrlKey || e.metaKey || e.altKey || /input|textarea/i.test((e.target || {}).tagName)) return; if (e.key === 'Enter' || e.key === 'Backspace' || /^[a-ząćęłńóśźż]$/i.test(e.key)) { e.preventDefault(); press(e.key); } };
    document.addEventListener('keydown', onKey); stopFns.push(function () { document.removeEventListener('keydown', onKey); });
    draw();
  }

  /* ============== wspólny silnik gier zręcznościowych (canvas) ============== */
  var imgCache = {};
  function knagaImg(slug) {
    if (imgCache[slug]) return imgCache[slug];
    var im = new Image(); var svg = K(slug).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" ');
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    return (imgCache[slug] = im);
  }
  function canvasGame(el, g, opts) {
    shell(el, g, '<div class="gry-stage" style="' + (opts.ratio ? 'aspect-ratio:' + opts.ratio : '') + '"><canvas id="gry-cv" tabindex="0" aria-label="' + g.name + '"></canvas>' +
      '<div class="gry-hud"><span class="hud-p"><small>Wynik</small><b id="gry-score">0</b></span>' + (opts.lives ? '<span class="hud-p"><small>Życia</small><b id="gry-lives"></b></span>' : '') +
      '<button type="button" class="hud-btn" id="gry-pause" aria-label="Pauza">' + ICO.pause + '</button></div><div class="gry-over" id="gry-over"></div></div>');
    var cv = $('#gry-cv'), ctx = cv.getContext('2d'), W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), raf = 0, last = 0, running = false, paused = false, over = false;
    function size() { var r = cv.parentNode.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); if (!running && api.ready) { opts.draw(api); } }
    var fx = [];
    var api = {
      ctx: ctx, get W() { return W; }, get H() { return H; }, score: 0, t: 0,
      setScore: function (v) { api.score = v; $('#gry-score').textContent = v; },
      setLives: function (n) { var l = $('#gry-lives'); if (l) l.textContent = n > 0 ? '💧'.repeat(n) : '—'; },
      burst: function (x, y, col, n) { if (reduce) return; for (var i = 0; i < (n || 10); i++) { var a = Math.random() * 6.28, v = 60 + Math.random() * 160; fx.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: .6, c: col, r: 2 + Math.random() * 3 }); } },
      pop: function (x, y, text, col) { fx.push({ x: x, y: y, vx: 0, vy: -50, life: .9, text: text, c: col || '#fff' }); },
      over: function () {
        if (over) return; over = true; running = false; cancelAnimationFrame(raf);
        var sc = api.score, nb = sc > 0 && submit(g.id, sc);
        if (sc > 0) { xp('game'); if (nb) xp('record'); }
        played(g.id);
        var et = opts.endText ? opts.endText(sc) : ['', g.knaga];
        menu('<span class="gm-eye">Koniec gry</span><div class="gm-k">' + K(et[1] || g.knaga, 'gk') + '</div><p class="gm-end">' + et[0] + '</p><div class="gm-score">' + sc + '<small>' + (g.unit || '') + '</small></div>' +
          (nb ? '<span class="gry-new">Nowy rekord!</span>' : '<p class="gm-best">Twój rekord: <b>' + fmt(g.id, best(g.id)) + '</b></p>') +
          (logged() ? (sc > 0 ? '<p class="gm-xp">+' + (nb ? 15 : 5) + ' XP do sezonu</p>' : '') : '<p class="gm-note">Zaloguj się, żeby rekord zapisał się na koncie.</p>'),
        'Jeszcze raz', true);
        if (nb) loadTop(g.id);
      }
    };
    function menu(html, btn, withShare) {
      var o = $('#gry-over'); o.hidden = false;
      o.innerHTML = '<div class="gm">' + html + '<div class="gm-acts"><button type="button" class="btn btn-primary" id="gry-go">' + btn + '</button>' + (withShare ? '<button type="button" class="btn" id="gry-share">' + ICO.share + ' Udostępnij</button>' : '') + '</div></div>';
      $('#gry-go').onclick = paused ? resume : start; $('#gry-go').focus({ preventScroll: true });
      var sh = $('#gry-share'); if (sh) sh.onclick = function () { share(g.name + ' na Śliskiej: ' + api.score + ' ' + (g.unit || '') + ' 💦 Pobijesz?\n' + LINK); };
    }
    function start() { $('#gry-over').hidden = true; over = false; paused = false; fx = []; api.t = 0; api.setScore(0); opts.reset(api); running = true; last = performance.now(); raf = requestAnimationFrame(loop); try { cv.focus({ preventScroll: true }); } catch (e) { /* - */ } }
    function pause() { if (!running || over) return; running = false; paused = true; cancelAnimationFrame(raf); menu('<span class="gm-eye">Pauza</span><div class="gm-k">' + K('szlafrok', 'gk') + '</div><p class="gm-end">Knaga czeka. Wynik: <b>' + api.score + '</b></p>', 'Wznów'); }
    function resume() { $('#gry-over').hidden = true; paused = false; running = true; last = performance.now(); raf = requestAnimationFrame(loop); }
    function loop(t) {
      if (!running) return; var dt = Math.min(0.034, (t - last) / 1000); last = t; api.t += dt;
      opts.step(api, dt); if (!running && over) { draw(); return; } draw(); raf = requestAnimationFrame(loop);
      fx.forEach(function (p) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; if (!p.text) p.vy += 400 * dt; }); fx = fx.filter(function (p) { return p.life > 0; });
    }
    function draw() {
      opts.draw(api);
      fx.forEach(function (p) {
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life / .5));
        if (p.text) { ctx.font = '900 20px Figtree, Arial'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(20,10,20,.6)'; ctx.strokeText(p.text, p.x, p.y); ctx.fillStyle = p.c; ctx.fillText(p.text, p.x, p.y); }
        else { ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
      });
      ctx.globalAlpha = 1;
    }
    size(); var ro = new ResizeObserver(size); ro.observe(cv.parentNode);
    $('#gry-pause').onclick = function () { if (running) pause(); };
    var onKey = function (e) { if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && running) { e.preventDefault(); pause(); } };
    var onVis = function () { if (document.hidden) pause(); };
    document.addEventListener('keydown', onKey); document.addEventListener('visibilitychange', onVis);
    menu('<div class="gm-k">' + K(g.knaga, 'gk') + '</div><h2>' + g.name + '</h2><p class="gm-end">' + opts.intro + '</p>' + (opts.keys ? '<div class="gm-keys">' + opts.keys.map(function (k) { return '<span><kbd>' + k[0] + '</kbd>' + k[1] + '</span>'; }).join('') + '</div>' : ''), 'Graj');
    opts.init && opts.init(api, cv);
    opts.reset(api); api.ready = true; opts.draw(api);
    stopFns.push(function () { running = false; cancelAnimationFrame(raf); ro.disconnect(); document.removeEventListener('keydown', onKey); document.removeEventListener('visibilitychange', onVis); opts.destroy && opts.destroy(); });
    return api;
  }
  function drawK(ctx, img, x, y, s, rot) { if (!img.complete) return; ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.drawImage(img, -s / 2, -s / 2, s, s); ctx.restore(); }
  var INK = '#2a1620';
  function dropPath(c, x, y, r, col, glow) {
    c.save(); if (glow) { c.shadowColor = col; c.shadowBlur = 16; }
    c.beginPath(); c.moveTo(x, y - r * 1.6); c.bezierCurveTo(x + r * .7, y - r * .6, x + r, y, x + r, y + r * .35); c.arc(x, y + r * .35, r, 0, Math.PI); c.bezierCurveTo(x - r, y, x - r * .7, y - r * .6, x, y - r * 1.6);
    c.fillStyle = col; c.fill(); c.shadowBlur = 0; c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.ellipse(x - r * .35, y + r * .05, r * .22, r * .42, -.4, 0, 7); c.fill(); c.restore();
  }
  function heart(c, x, y, s) { c.save(); c.translate(x, y); c.scale(s / 20, s / 20); c.beginPath(); c.moveTo(0, 6); c.bezierCurveTo(-14, -4, -8, -16, 0, -8); c.bezierCurveTo(8, -16, 14, -4, 0, 6); c.fillStyle = '#ff2d55'; c.fill(); c.lineWidth = 2.4; c.strokeStyle = INK; c.stroke(); c.restore(); }
  function paper(c, x, y, rot, label, col) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-14, -18); c.lineTo(7, -18); c.lineTo(14, -11); c.lineTo(14, 18); c.lineTo(-14, 18); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(7, -18); c.lineTo(7, -11); c.lineTo(14, -11); c.stroke();
    c.fillStyle = '#c9ced8'; c.fillRect(-9, -9, 14, 2); c.fillRect(-9, -4, 18, 2); c.fillRect(-9, 1, 16, 2);
    c.rotate(-.25); c.strokeStyle = col || '#d6001c'; c.lineWidth = 2; c.strokeRect(-12, 6, 24, 9); c.fillStyle = col || '#d6001c'; c.font = '900 7px Figtree, Arial'; c.textAlign = 'center'; c.fillText(label, 0, 13.5);
    c.restore();
  }

  /* ============== ŁAP KROPLE ============== */
  function krople(el) {
    var img = knagaImg('kapiel'), P, items, lives, spawn, combo, keys = {}, bub = [];
    for (var i = 0; i < 16; i++) bub.push({ x: Math.random(), y: Math.random(), r: 3 + Math.random() * 9, v: .03 + Math.random() * .06 });
    canvasGame(el, G('krople'), {
      lives: true, intro: 'Przesuwaj wannę z Knagą i łap krople. Złota kropla +5, serduszko oddaje życie, a pozew je zabiera.',
      keys: [['← →', 'ruch'], ['mysz / palec', 'przesuń'], ['Esc', 'pauza']],
      endText: function (s) { return s > 120 ? ['Wanna pełna po brzegi. Mokro jak nigdy!', 'imprezowa'] : s > 50 ? ['Porządnie się zmoczyła.', 'kapiel'] : s > 15 ? ['Ledwo wilgotno. Stać Cię na więcej.', 'sauna'] : ['Sucho jak na Saharze. Knaga się nie zmoczyła.', 'niesmiala']; },
      init: function (a, cv) {
        var mv = function (e) { var r = cv.getBoundingClientRect(); P.tx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left; };
        cv.addEventListener('pointermove', mv); cv.addEventListener('pointerdown', mv); cv.addEventListener('touchmove', function (e) { mv(e); e.preventDefault(); }, { passive: false });
        var kd = function (e) { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { keys[e.key] = e.type === 'keydown'; e.preventDefault(); } };
        document.addEventListener('keydown', kd); document.addEventListener('keyup', kd);
        stopFns.push(function () { document.removeEventListener('keydown', kd); document.removeEventListener('keyup', kd); });
      },
      reset: function (a) { P = { x: a.W / 2, tx: a.W / 2 }; items = []; lives = 3; spawn = 0; combo = 0; a.setLives(lives); },
      step: function (a, dt) {
        var t = a.t; spawn -= dt;
        if (keys.ArrowLeft) P.tx = P.x - 900 * dt; if (keys.ArrowRight) P.tx = P.x + 900 * dt;
        P.tx = Math.max(60, Math.min(a.W - 60, P.tx)); P.x += (P.tx - P.x) * Math.min(1, dt * 14);
        var speed = 160 + t * 7;
        if (spawn <= 0) { spawn = Math.max(.26, .85 - t * .012); var r = Math.random(); items.push({ x: 30 + Math.random() * (a.W - 60), y: -24, k: r < .2 + Math.min(.12, t * .002) ? 'bad' : r < .3 ? 'gold' : r < .315 ? 'life' : 'drop', v: speed * (.8 + Math.random() * .5), s: Math.random() * 6 }); }
        var py = a.H - 78;
        items.forEach(function (it) {
          it.y += it.v * dt;
          if (!it.hit && it.y > py - 26 && it.y < py + 14 && Math.abs(it.x - P.x) < 62) {
            it.hit = true;
            if (it.k === 'bad') { lives--; combo = 0; a.setLives(lives); a.burst(it.x, it.y, '#d6001c', 14); a.pop(it.x, it.y - 20, '−1 życie', '#ff6b6b'); if (lives <= 0) a.over(); }
            else if (it.k === 'life') { lives = Math.min(5, lives + 1); a.setLives(lives); a.pop(it.x, it.y - 20, '+1 życie', '#ff8fb0'); a.burst(it.x, it.y, '#ff2d55', 10); }
            else { var v = it.k === 'gold' ? 5 : 1; combo++; if (combo % 10 === 0) { v += 5; a.pop(P.x, py - 70, 'COMBO +5', '#ffcf4a'); } a.setScore(a.score + v); a.burst(it.x, it.y, it.k === 'gold' ? '#ffcf4a' : '#5cc8ff', 8); a.pop(it.x, it.y - 18, '+' + (it.k === 'gold' ? 5 : 1), it.k === 'gold' ? '#ffcf4a' : '#fff'); }
          } else if (!it.hit && it.y > a.H && it.k !== 'bad') { it.hit = true; if (it.k !== 'life') combo = 0; }
        });
        items = items.filter(function (it) { return !it.hit && it.y < a.H + 30; });
      },
      draw: function (a) {
        var c = a.ctx, W = a.W, H = a.H, t = a.t;
        c.fillStyle = '#e4f4fc'; c.fillRect(0, 0, W, H);
        c.strokeStyle = '#c4e2f1'; c.lineWidth = 2; for (var x = 0; x < W; x += 46) { c.beginPath(); c.moveTo(x + .5, 0); c.lineTo(x + .5, H); c.stroke(); } for (var y = 0; y < H; y += 46) { c.beginPath(); c.moveTo(0, y + .5); c.lineTo(W, y + .5); c.stroke(); }
        var lg = c.createRadialGradient(W * .15, 0, 10, W * .15, 0, W * .7); lg.addColorStop(0, 'rgba(255,255,255,.85)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = lg; c.fillRect(0, 0, W, H);
        c.fillStyle = '#9fd3ec'; c.fillRect(0, H - 34, W, 34); c.fillStyle = '#86c3e0'; for (x = 0; x < W; x += 34) c.fillRect(x, H - 34, 2, 34);
        bub.forEach(function (b) { var by = ((b.y - t * b.v) % 1 + 1) % 1; c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1.5; c.beginPath(); c.arc(b.x * W, by * H, b.r, 0, 7); c.stroke(); c.fillStyle = 'rgba(255,255,255,.35)'; c.fill(); });
        items.forEach(function (it) {
          if (it.k === 'bad') paper(c, it.x, it.y, Math.sin(it.y / 26 + it.s) * .35, 'POZEW');
          else if (it.k === 'life') heart(c, it.x, it.y, 26);
          else dropPath(c, it.x, it.y, it.k === 'gold' ? 12 : 9.5, it.k === 'gold' ? '#ffcf4a' : '#3fb6f2', it.k === 'gold');
        });
        var bx = P.x, by2 = H - 78;
        drawK(c, img, bx, by2 - 26, 118);
        c.fillStyle = '#7fd0f5'; c.beginPath(); c.ellipse(bx, by2 + 4, 66, 10, 0, 0, 7); c.fill();
        c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(bx - 74, by2); c.lineTo(bx + 74, by2); c.quadraticCurveTo(bx + 70, by2 + 46, bx + 40, by2 + 48); c.lineTo(bx - 40, by2 + 48); c.quadraticCurveTo(bx - 70, by2 + 46, bx - 74, by2); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#f2f6f9'; c.beginPath(); c.roundRect(bx - 80, by2 - 8, 160, 12, 6); c.fill(); c.stroke();
        c.fillStyle = INK; c.beginPath(); c.roundRect(bx - 50, by2 + 46, 10, 10, 3); c.roundRect(bx + 40, by2 + 46, 10, 10, 3); c.fill();
        c.fillStyle = '#fff'; [[-58, -12, 9], [-44, -16, 7], [50, -13, 8], [62, -9, 6]].forEach(function (f) { c.beginPath(); c.arc(bx + f[0], by2 + f[1], f[2], 0, 7); c.fill(); });
        c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.roundRect(bx - 56, by2 + 12, 40, 6, 3); c.fill();
      }
    });
  }

  /* ============== KNAGA FLAPPY ============== */
  function flappy(el) {
    var img = knagaImg('super'), B, pipes, trail = [], city = [[], []];
    for (var L = 0; L < 2; L++) { var x = 0; while (x < 2400) { var w = 40 + Math.random() * 70; city[L].push({ x: x, w: w, h: (L ? 70 : 120) + Math.random() * (L ? 90 : 150), seed: Math.random() }); x += w + (L ? 6 : 10); } }
    canvasGame(el, G('flappy'), {
      intro: 'Super Knaga leci nad sceną. Machaj peleryną i przelatuj między statywami z mikrofonami.',
      keys: [['Spacja', 'w górę'], ['klik / stuknięcie', 'w górę'], ['Esc', 'pauza']],
      endText: function (s) { return s >= 30 ? ['Super Knaga to Ty! Scena należy do Ciebie.', 'super'] : s >= 12 ? ['Lata całkiem sprawnie. Prawie gwiazda.', 'gwiazdor'] : s >= 4 ? ['Krótki lot, ale z klasą.', 'ziomek'] : ['Knaga opadła.', 'niesmiala']; },
      init: function (a, cv) {
        var flap = function (e) { if (e.type === 'keydown') { if (e.code !== 'Space' && e.key !== 'ArrowUp') return; e.preventDefault(); } if (B && $('#gry-over').hidden) { B.vy = -340; a.burst(B.x - 20, B.y + 10, '#ffcf4a', 4); } };
        cv.addEventListener('pointerdown', flap); document.addEventListener('keydown', flap);
        stopFns.push(function () { document.removeEventListener('keydown', flap); });
      },
      reset: function (a) { B = { x: a.W * .3, y: a.H * .42, vy: -200 }; pipes = []; trail = []; },
      step: function (a, dt) {
        B.vy += 920 * dt; B.y += B.vy * dt;
        var sp = 160 + Math.min(90, a.score * 3);
        if (!pipes.length || pipes[pipes.length - 1].x < a.W - 240) { var gp = Math.max(138, 190 - a.score * 2); pipes.push({ x: a.W + 50, top: 70 + Math.random() * (a.H - 140 - gp - 30), gp: gp }); }
        pipes.forEach(function (p) {
          p.x -= sp * dt;
          if (!p.pass && p.x + 30 < B.x) { p.pass = true; a.setScore(a.score + 1); a.pop(B.x, B.y - 40, '+1', '#ffcf4a'); }
          if (B.x + 22 > p.x - 26 && B.x - 22 < p.x + 26 && (B.y - 24 < p.top || B.y + 24 > p.top + p.gp)) a.over();
        });
        pipes = pipes.filter(function (p) { return p.x > -70; });
        trail.push({ x: B.x - 26, y: B.y + 6, l: .5 }); trail.forEach(function (q) { q.x -= sp * dt; q.l -= dt; }); trail = trail.filter(function (q) { return q.l > 0; });
        if (B.y > a.H - 46 || B.y < -40) a.over();
      },
      draw: function (a) {
        var c = a.ctx, W = a.W, H = a.H, t = a.t, gr = c.createLinearGradient(0, 0, 0, H);
        gr.addColorStop(0, '#120a2a'); gr.addColorStop(.55, '#4b1450'); gr.addColorStop(1, '#b3123a'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(255,255,255,.7)'; for (var i = 0; i < 40; i++) { var sx = ((i * 131 - t * 8) % W + W) % W; c.fillRect(sx, (i * 57) % (H * .5), i % 5 ? 1.5 : 2.5, i % 5 ? 1.5 : 2.5); }
        c.fillStyle = 'rgba(255,230,160,.08)'; [[.2, -.25], [.8, .25]].forEach(function (s) { c.beginPath(); c.moveTo(W * s[0], H); c.lineTo(W * (s[0] + s[1]) - 60, 0); c.lineTo(W * (s[0] + s[1]) + 60, 0); c.closePath(); c.fill(); });
        [[0, .15, '#2a1240', 'rgba(255,207,74,.35)'], [1, .4, '#1a0b26', 'rgba(255,207,74,.55)']].forEach(function (Lr) {
          var off = (t * 160 * Lr[1]) % 2400;
          city[Lr[0]].forEach(function (b) {
            var bx = b.x - off; if (bx < -b.w) bx += 2400; if (bx > W) return;
            var by = H - 46 - b.h; c.fillStyle = Lr[2]; c.fillRect(bx, by, b.w, b.h);
            c.fillStyle = Lr[3]; for (var wy = by + 10; wy < H - 56; wy += 16) for (var wx = bx + 8; wx < bx + b.w - 8; wx += 14) if (((wx * 7 + wy * 3) * b.seed | 0) % 3 === 0) c.fillRect(wx, wy, 6, 8);
          });
        });
        (pipes || []).forEach(function (p) {
          [[0, p.top, true], [p.top + p.gp, H - 46 - p.top - p.gp, false]].forEach(function (s) {
            var pg = c.createLinearGradient(p.x - 7, 0, p.x + 7, 0); pg.addColorStop(0, '#6b7280'); pg.addColorStop(.5, '#e5e7eb'); pg.addColorStop(1, '#4b5563');
            c.fillStyle = pg; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.roundRect(p.x - 7, s[0] - 6, 14, s[1] + 12, 4); c.fill(); c.stroke();
            var hy = s[2] ? s[0] + s[1] - 44 : s[0];
            var mg = c.createLinearGradient(p.x - 26, 0, p.x + 26, 0); mg.addColorStop(0, '#2b2f3a'); mg.addColorStop(.5, '#6b7280'); mg.addColorStop(1, '#1f222b');
            c.fillStyle = mg; c.beginPath(); c.roundRect(p.x - 26, hy, 52, 44, 20); c.fill(); c.stroke();
            c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = 1.5; for (var k = 8; k < 40; k += 6) { c.beginPath(); c.moveTo(p.x - 20, hy + k); c.lineTo(p.x + 20, hy + k); c.stroke(); }
            c.fillStyle = '#d6001c'; c.fillRect(p.x - 26, s[2] ? hy : hy + 38, 52, 6);
          });
        });
        c.fillStyle = '#140a1c'; c.fillRect(0, H - 46, W, 46); c.fillStyle = '#2a1636'; var so = (t * 200) % 40; for (var gx = -so; gx < W; gx += 40) c.fillRect(gx, H - 46, 20, 6);
        c.fillStyle = '#ffcf4a'; c.fillRect(0, H - 46, W, 2);
        trail.forEach(function (q) { c.fillStyle = 'rgba(255,61,110,' + q.l + ')'; c.beginPath(); c.arc(q.x, q.y, 6 * q.l + 2, 0, 7); c.fill(); });
        if (B) drawK(c, img, B.x, B.y, 84, Math.max(-.5, Math.min(.7, B.vy / 600)));
        c.font = '900 56px Figtree, Arial'; c.textAlign = 'center'; c.lineWidth = 8; c.strokeStyle = 'rgba(20,8,30,.55)'; c.strokeText(a.score, W / 2, 86); c.fillStyle = '#fff'; c.fillText(a.score, W / 2, 86);
      }
    });
  }

  /* ============== ŚLISKI WĄŻ ============== */
  function waz(el) {
    var head = knagaImg('ikona'), S, dir, nd, food, gold, acc2, N = 17;
    canvasGame(el, G('waz'), {
      ratio: '1 / 1', intro: 'Prowadź węża z głową Knagi po scenie. Zbieraj mikrofony, złoty jest wart 3 punkty.',
      keys: [['↑ ↓ ← →', 'kierunek'], ['WASD', 'też działa'], ['przesuń palcem', 'telefon']],
      endText: function (s) { return s >= 40 ? ['Wąż długi jak lista featów. Szacun!', 'gwiazdor'] : s >= 15 ? ['Ładnie urósł. Prawie gwiazda sceny.', 'ziomek'] : ['Knaga się zaplątała.', 'wsciekla']; },
      init: function (a, cv) {
        var map = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0], W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0] };
        var kd = function (e) { var m = map[e.key]; if (m && !(m[0] === -dir[0] && m[1] === -dir[1])) { nd = m; e.preventDefault(); } };
        document.addEventListener('keydown', kd);
        var sx, sy; cv.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
        cv.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
        cv.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return; var m = Math.abs(dx) > Math.abs(dy) ? [dx > 0 ? 1 : -1, 0] : [0, dy > 0 ? 1 : -1]; if (!(m[0] === -dir[0] && m[1] === -dir[1])) nd = m; });
        stopFns.push(function () { document.removeEventListener('keydown', kd); });
      },
      reset: function (a) { S = [[8, 8], [7, 8], [6, 8]]; dir = [1, 0]; nd = dir; acc2 = 0; gold = null; place(); },
      step: function (a, dt) {
        if (gold) { gold.t -= dt; if (gold.t <= 0) gold = null; }
        acc2 += dt; var stepT = Math.max(.065, .15 - a.score * .0025); if (acc2 < stepT) return; acc2 = 0; dir = nd;
        var h = [S[0][0] + dir[0], S[0][1] + dir[1]];
        if (h[0] < 0 || h[1] < 0 || h[0] >= N || h[1] >= N || S.some(function (p) { return p[0] === h[0] && p[1] === h[1]; })) return a.over();
        S.unshift(h);
        var g2 = geo(a), px = function (p) { return [g2.ox + p[0] * g2.sz + g2.sz / 2, g2.oy + p[1] * g2.sz + g2.sz / 2]; };
        if (gold && h[0] === gold.p[0] && h[1] === gold.p[1]) { a.setScore(a.score + 3); var q = px(h); a.burst(q[0], q[1], '#ffcf4a', 14); a.pop(q[0], q[1] - 20, '+3', '#ffcf4a'); gold = null; S.push(S[S.length - 1]); S.push(S[S.length - 1]); }
        else if (h[0] === food[0] && h[1] === food[1]) { a.setScore(a.score + 1); var q2 = px(h); a.burst(q2[0], q2[1], '#ff2d77', 10); a.pop(q2[0], q2[1] - 20, '+1', '#fff'); place(); if (!gold && Math.random() < .18) placeGold(); }
        else S.pop();
      },
      draw: function (a) {
        var c = a.ctx, t = a.t, g2 = geo(a), sz = g2.sz, ox = g2.ox, oy = g2.oy;
        c.fillStyle = '#12051a'; c.fillRect(0, 0, a.W, a.H);
        c.save(); c.shadowColor = '#ff2d77'; c.shadowBlur = 22; c.fillStyle = '#1d0a24'; c.beginPath(); c.roundRect(ox - 6, oy - 6, sz * N + 12, sz * N + 12, 18); c.fill(); c.restore();
        c.strokeStyle = '#ff2d77'; c.lineWidth = 2; c.beginPath(); c.roundRect(ox - 6, oy - 6, sz * N + 12, sz * N + 12, 18); c.stroke();
        for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) if ((x + y) % 2) { c.fillStyle = 'rgba(255,255,255,.025)'; c.fillRect(ox + x * sz, oy + y * sz, sz, sz); }
        var cx = function (p) { return ox + p[0] * sz + sz / 2; }, cy = function (p) { return oy + p[1] * sz + sz / 2; };
        mic(c, cx(food), cy(food), sz * (.9 + Math.sin(t * 6) * .06), false);
        if (gold) { c.globalAlpha = gold.t < 1.5 ? (Math.sin(t * 20) > 0 ? 1 : .35) : 1; mic(c, cx(gold.p), cy(gold.p), sz * 1.05, true); c.globalAlpha = 1; }
        c.lineCap = 'round'; c.lineJoin = 'round';
        c.beginPath(); S.forEach(function (p, i) { if (!i) c.moveTo(cx(p), cy(p)); else c.lineTo(cx(p), cy(p)); });
        c.strokeStyle = INK; c.lineWidth = sz * .78 + 5; c.stroke(); c.strokeStyle = '#f5b896'; c.lineWidth = sz * .78; c.stroke(); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = sz * .2; c.stroke();
        drawK(c, head, cx(S[0]), cy(S[0]), sz * 1.9, Math.atan2(dir[1], dir[0]) + Math.PI / 2);
      }
    });
    function geo(a) { var sz = Math.floor((Math.min(a.W, a.H) - 24) / N); return { sz: sz, ox: (a.W - sz * N) / 2, oy: (a.H - sz * N) / 2 }; }
    function mic(c, x, y, s, gl) {
      c.save(); c.translate(x, y); c.rotate(-.5); c.shadowColor = gl ? '#ffcf4a' : '#ff2d77'; c.shadowBlur = 14;
      c.fillStyle = gl ? '#c99400' : '#2b2f3a'; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.roundRect(-s * .1, s * .05, s * .2, s * .45, 3); c.fill(); c.stroke();
      c.fillStyle = gl ? '#ffcf4a' : '#9ca3af'; c.beginPath(); c.arc(0, -s * .12, s * .26, 0, 7); c.fill(); c.shadowBlur = 0; c.stroke();
      c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; c.beginPath(); c.moveTo(-s * .2, -s * .12); c.lineTo(s * .2, -s * .12); c.moveTo(0, -s * .34); c.lineTo(0, s * .1); c.stroke(); c.restore();
    }
    function free() { var p; do { p = [Math.floor(Math.random() * N), Math.floor(Math.random() * N)]; } while (S.some(function (q) { return q[0] === p[0] && q[1] === p[1]; }) || (food && p[0] === food[0] && p[1] === food[1])); return p; }
    function place() { food = null; food = free(); }
    function placeGold() { gold = { p: free(), t: 6 }; }
  }

  /* ============== ŚLIZGAWKA (sekret) ============== */
  function slizgawka(el) {
    var img = knagaImg('surfer'), P, obs, drops, dist, clouds = [];
    for (var i = 0; i < 6; i++) clouds.push({ x: Math.random(), y: .08 + Math.random() * .3, s: .6 + Math.random() * .8 });
    var KINDS = [['POZEW', '#fff', '#d6001c'], ['DISS', '#15101c', '#fff'], ['FEJK', '#ffcf4a', '#15101c']];
    canvasGame(el, G('slizgawka'), {
      intro: 'Knaga surfuje o zachodzie słońca. Przeskakuj pozwy, dissy i fejki, zbieraj krople.',
      keys: [['Spacja', 'skok'], ['2× w powietrzu', 'podwójny skok'], ['stuknięcie', 'skok']],
      endText: function (s) { return s > 1500 ? ['Legenda fali. Nawet ocean bije brawo.', 'super'] : s > 600 ? ['Ładnie się ślizga. Prawie surfer roku.', 'surfer'] : s > 200 ? ['Niezły przejazd, ale fala wygrała.', 'ziomek'] : ['Knaga się zmoczyła.', 'kapiel']; },
      init: function (a, cv) {
        var jump = function (e) { if (e.type === 'keydown') { if (e.code !== 'Space' && e.key !== 'ArrowUp') return; e.preventDefault(); } if (P && P.j < 2 && $('#gry-over').hidden) { P.vy = -540; P.j++; a.burst(a.W * .25, a.H * .74, '#fff', 6); } };
        cv.addEventListener('pointerdown', jump); document.addEventListener('keydown', jump);
        stopFns.push(function () { document.removeEventListener('keydown', jump); });
      },
      reset: function (a) { P = { y: 0, vy: 0, j: 0 }; obs = []; drops = []; dist = 0; },
      step: function (a, dt) {
        var t = a.t, sp = 270 + t * 9; dist += sp * dt / 10;
        var gy = a.H * .74; P.vy += 1550 * dt; P.y += P.vy * dt; if (P.y > 0) { P.y = 0; P.vy = 0; P.j = 0; }
        if (!obs.length || obs[obs.length - 1].x < a.W - (280 + Math.random() * 280)) obs.push({ x: a.W + 40, k: KINDS[Math.floor(Math.random() * 3)], h: 38 + Math.random() * 28 });
        if (Math.random() < dt * .9) drops.push({ x: a.W + 20, y: gy - 60 - Math.random() * 110 });
        var kx = a.W * .25, ky = gy + P.y - 40;
        obs.forEach(function (o) { o.x -= sp * dt; if (Math.abs(o.x - kx) < 30 && ky + 30 > gy - o.h) a.over(); });
        drops.forEach(function (d) { d.x -= sp * dt; if (!d.hit && Math.abs(d.x - kx) < 30 && Math.abs(d.y - ky) < 40) { d.hit = true; dist += 25; a.pop(d.x, d.y - 16, '+25', '#5cc8ff'); a.burst(d.x, d.y, '#5cc8ff', 8); } });
        obs = obs.filter(function (o) { return o.x > -60; }); drops = drops.filter(function (d) { return !d.hit && d.x > -30; });
        a.setScore(Math.floor(dist));
      },
      draw: function (a) {
        var c = a.ctx, W = a.W, H = a.H, t = a.t, gy = H * .74, gr = c.createLinearGradient(0, 0, 0, gy);
        gr.addColorStop(0, '#2b1b4a'); gr.addColorStop(.5, '#c4366e'); gr.addColorStop(1, '#ffb36b'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
        c.save(); c.shadowColor = '#ffd36b'; c.shadowBlur = 50; c.fillStyle = '#ffd36b'; c.beginPath(); c.arc(W * .72, gy - 10, 54, 0, 7); c.fill(); c.restore();
        c.fillStyle = 'rgba(255,255,255,.55)'; clouds.forEach(function (cl) { var x = ((cl.x * W - t * 18 * cl.s) % (W + 200) + W + 200) % (W + 200) - 100, y = cl.y * H; c.beginPath(); c.ellipse(x, y, 46 * cl.s, 12 * cl.s, 0, 0, 7); c.ellipse(x + 26 * cl.s, y - 8 * cl.s, 26 * cl.s, 12 * cl.s, 0, 0, 7); c.fill(); });
        c.fillStyle = '#6b2a5e'; var io = (t * 30) % (W + 400); c.beginPath(); c.moveTo(W - io, gy); c.quadraticCurveTo(W - io + 90, gy - 70, W - io + 200, gy); c.fill(); c.beginPath(); c.moveTo(W * 1.6 - io, gy); c.quadraticCurveTo(W * 1.6 - io + 60, gy - 40, W * 1.6 - io + 130, gy); c.fill();
        c.fillStyle = '#3b6fd8'; c.beginPath(); c.moveTo(0, gy - 6); for (var x = 0; x <= W; x += 10) c.lineTo(x, gy - 6 + Math.sin((x + t * 160) / 55) * 5); c.lineTo(W, H); c.lineTo(0, H); c.fill();
        var sea = c.createLinearGradient(0, gy, 0, H); sea.addColorStop(0, '#2f8fd8'); sea.addColorStop(1, '#174f8f'); c.fillStyle = sea;
        c.beginPath(); c.moveTo(0, gy); for (x = 0; x <= W; x += 8) c.lineTo(x, gy + Math.sin((x + t * 320) / 40) * 6); c.lineTo(W, H); c.lineTo(0, H); c.fill();
        c.fillStyle = 'rgba(255,255,255,.75)'; for (x = 0; x <= W; x += 8) c.fillRect(x, gy + Math.sin((x + t * 320) / 40) * 6 - 2, 5, 3);
        c.fillStyle = 'rgba(255,211,107,.25)'; for (var r = 0; r < 6; r++) c.fillRect(W * .72 - 50 + Math.sin(t * 3 + r) * 8, gy + 14 + r * 12, 100 - r * 12, 3);
        (drops || []).forEach(function (d) { dropPath(c, d.x, d.y + Math.sin(t * 5 + d.x / 40) * 4, 9, '#5cc8ff', true); });
        (obs || []).forEach(function (o) {
          c.fillStyle = '#5b3a1e'; c.strokeStyle = INK; c.lineWidth = 3; c.fillRect(o.x - 3, gy - o.h + 20, 6, o.h - 10);
          c.fillStyle = o.k[1]; c.beginPath(); c.roundRect(o.x - 28, gy - o.h - 4, 56, 30, 7); c.fill(); c.stroke();
          c.fillStyle = o.k[2]; c.font = '900 12px Figtree, Arial'; c.textAlign = 'center'; c.fillText(o.k[0], o.x, gy - o.h + 16);
        });
        if (P) {
          var bx = W * .25, by = gy + P.y - 40;
          c.save(); c.translate(bx, by + 40); c.rotate(P.y < 0 ? -.18 : Math.sin(t * 8) * .05); c.fillStyle = '#ffcf4a'; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 0, 50, 8, 0, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#d6001c'; c.fillRect(-40, -2, 80, 4); c.restore();
          drawK(c, img, bx, by - 4, 92, P.y < 0 ? -.2 : Math.sin(t * 8) * .05);
        }
      }
    });
  }

  /* ============== ŚLISKA UKŁADANKA ============== */
  function ukladanka(el, ctx) {
    var g = G('ukladanka'), arts = (ctx.articles || []).filter(function (a) { return a.image; }), N = 3, tiles, moves, art, t0, timer;
    shell(el, g, '<div class="uk"><div class="uk-bar"><div class="uk-seg" role="group" aria-label="Poziom"><button type="button" data-n="3" class="is-on">3×3</button><button type="button" data-n="4">4×4</button><button type="button" data-n="5">5×5</button></div>' +
      '<span class="uk-chip"><small>Ruchy</small><b id="uk-m">0</b></span><span class="uk-chip"><small>Czas</small><b id="uk-t">0:00</b></span></div>' +
      '<div class="uk-frame"><div class="uk-board" id="uk-board"></div><div class="uk-ghost" id="uk-ghost" hidden></div><div class="uk-done" id="uk-done" hidden></div></div>' +
      '<div class="uk-acts"><button type="button" class="btn btn-sm" id="uk-peek">Podgląd</button><button type="button" class="btn btn-sm" id="uk-new">Inne zdjęcie</button><button type="button" class="btn btn-sm" id="uk-mix">Wymieszaj</button></div><p class="uk-art" id="uk-art"></p></div>');
    function src() { return art ? art.image : 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(K('ziomek').replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" style="background:#ffe3d6" ')); }
    function pick() { art = arts.length ? arts[Math.floor(Math.random() * Math.min(arts.length, 24))] : null; }
    function solvable(a) { var inv = 0, f = a.filter(function (x) { return x !== N * N - 1; }); for (var i = 0; i < f.length; i++) for (var j = i + 1; j < f.length; j++) if (f[i] > f[j]) inv++; if (N % 2) return inv % 2 === 0; var row = N - Math.floor(a.indexOf(N * N - 1) / N); return (inv + row) % 2 === 1; }
    function start() {
      do { tiles = Array.from({ length: N * N }, function (_, i) { return i; }).sort(function () { return Math.random() - .5; }); } while (!solvable(tiles) || tiles.every(function (v, i) { return v === i; }));
      moves = 0; t0 = 0; clearInterval(timer); $('#uk-t').textContent = '0:00'; $('#uk-done').hidden = true; $('#uk-board').classList.remove('is-done'); draw();
      $('#uk-ghost').style.backgroundImage = 'url("' + src() + '")';
      $('#uk-art').innerHTML = art ? 'Zdjęcie z artykułu: <a href="#/artykul/' + encodeURIComponent(art.id) + '">' + esc(art.title) + '</a>' : 'Brak zdjęć z artykułów – układamy Knagę.';
    }
    function draw() {
      var s = src(), b = $('#uk-board'); b.style.setProperty('--n', N);
      b.innerHTML = tiles.map(function (v, i) {
        if (v === N * N - 1) return '<span class="uk-t is-empty"></span>';
        var x = v % N, y = Math.floor(v / N);
        return '<button type="button" class="uk-t' + (v === i ? ' is-ok' : '') + '" data-i="' + i + '" aria-label="Kafelek ' + (v + 1) + '" style="background-image:url(\'' + s + '\');background-size:' + N * 100 + '% ' + N * 100 + '%;background-position:' + (x * 100 / (N - 1)) + '% ' + (y * 100 / (N - 1)) + '%"><i>' + (v + 1) + '</i></button>';
      }).join('');
      $('#uk-m').textContent = moves;
    }
    $('#uk-board').addEventListener('click', function (e) {
      var b = e.target.closest('[data-i]'); if (!b) return; var i = +b.dataset.i, e0 = tiles.indexOf(N * N - 1);
      var ok = (Math.abs(i - e0) === 1 && Math.floor(i / N) === Math.floor(e0 / N)) || Math.abs(i - e0) === N; if (!ok) return;
      tiles[e0] = tiles[i]; tiles[i] = N * N - 1; moves++;
      if (!t0) { t0 = Date.now(); timer = setInterval(function () { var s = Math.floor((Date.now() - t0) / 1000); $('#uk-t').textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }, 500); }
      draw();
      if (tiles.every(function (v, k) { return v === k; })) {
        clearInterval(timer); var nb = submit('ukladanka', moves); xp('game'); if (nb) xp('record'); played('ukladanka');
        $('#uk-board').classList.add('is-done');
        var dn = $('#uk-done'); dn.hidden = false;
        dn.innerHTML = '<div class="gm">' + (nb ? '<span class="gry-new">Nowy rekord!</span>' : '<span class="gm-eye">Ułożone</span>') + '<div class="gm-score">' + moves + '<small>ruchów</small></div><p class="gm-end">Czas: ' + $('#uk-t').textContent + ' · poziom ' + N + '×' + N + '</p><div class="gm-acts"><button type="button" class="btn btn-primary" id="uk-again">Jeszcze raz</button>' + (art ? '<a class="btn" href="#/artykul/' + encodeURIComponent(art.id) + '">Czytaj artykuł</a>' : '') + '</div></div>';
        $('#uk-again').onclick = function () { pick(); start(); };
        if (nb) loadTop('ukladanka');
      }
    });
    el.querySelector('.uk-seg').addEventListener('click', function (e) { var b = e.target.closest('[data-n]'); if (!b) return; N = +b.dataset.n; [].forEach.call(this.children, function (x) { x.classList.toggle('is-on', x === b); }); start(); });
    $('#uk-new').onclick = function () { pick(); start(); };
    $('#uk-mix').onclick = start;
    var peek = $('#uk-peek'), gh = $('#uk-ghost');
    var on = function (e) { e.preventDefault(); gh.hidden = false; }, off = function () { gh.hidden = true; };
    peek.addEventListener('pointerdown', on); peek.addEventListener('pointerup', off); peek.addEventListener('pointerleave', off);
    peek.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') on(e); }); peek.addEventListener('keyup', off);
    stopFns.push(function () { clearInterval(timer); });
    pick(); start();
  }

  /* ============== DRAMA SIMULATOR ============== */
  var STATS = [['h', 'Hype', '🔥'], ['s', 'Szacunek', '⭐'], ['k', 'Kasa', '💰']];
  var SCEN = [
    { id: 'wyciek', name: 'Wyciek z koncertu', k: 'wsciekla', sub: 'Nagranie, na którym mówisz o feacie „za kasę”, krąży po sieci.', sc: [
      { k: 'wsciekla', app: 'Instagram', t: 'Budzisz się, a na telefonie 147 powiadomień. Ktoś wrzucił nagranie z koncertu: mówisz, że ostatni feat „był za kasę i nawet go nie słuchałeś”. Internet płonie.', c: [
        ['Odpisuję od razu na story. Ostro.', { h: 20, s: -10 }, 'Story ma 40 tys. wyświetleń w 10 minut. Raper z featu już nagrywa odpowiedź.'],
        ['Milczę i czekam, aż przejdzie.', { h: -10, s: 5 }, 'Cisza. Internet nie znosi ciszy – zaczyna zgadywać, co ukrywasz.'],
        ['Dzwonię do menedżera.', { k: 5 }, 'Menedżer: „Spokojnie, mam plan”. To nigdy nie wróży dobrze.']] },
      { k: 'diabelek', app: 'YouTube', t: 'Raper z featu wrzuca diss „Za kasę to ty oddychasz”. Milion wyświetleń w dobę, komentarze pod Twoimi postami: „odpowiesz?”.', c: [
        ['Nagrywam odpowiedź jeszcze w nocy.', { h: 25, s: 5, k: -5 }, 'Bit kradziony z TikToka, ale wersy palą. Ludzie dzielą się na dwa obozy.'],
        ['Zapraszam go na live – pogadajmy jak ludzie.', { h: 15, s: 10 }, 'Live ogląda 30 tysięcy osób. Po godzinie śmiejecie się razem. Nikt się tego nie spodziewał.'],
        ['Blokuję go wszędzie.', { h: -5, s: -15 }, '„Zablokował, bo nie ma argumentów” – piszą wszyscy. Screeny blokady mają więcej lajków niż Twój singiel.']] },
      { k: 'gwiazdor', app: 'Mail', t: 'Śliska News pisze o aferze, pod artykułem 2 tysiące komentarzy. Marka napojów energetycznych proponuje współpracę „na fali dramy”.', c: [
        ['Biorę kasę i reklamuję na story.', { k: 30, s: -15 }, 'Puszka w dłoni, uśmiech, kod rabatowy „ZAKASE”. Komentarze piszą się same.'],
        ['Odmawiam publicznie.', { s: 15, k: -5, h: 5 }, '„Nie sprzedam dramy” – cytat dnia. Szacun rośnie, konto w banku nie.'],
        ['Negocjuję podwójną stawkę.', { k: 20, h: 5, s: -5 }, 'Menedżer płacze ze szczęścia. Ty trochę mniej, czytając komentarze.']] },
      { k: 'kapiel', app: 'TikTok', t: 'Fani robią z Twojej miny z nagrania mema. Jest wszędzie: na TikToku, w grupach, nawet na tablicy w szkole Twojej kuzynki.', c: [
        ['Ustawiam mema jako zdjęcie profilowe.', { h: 15, s: 10 }, 'Dystans do siebie? Internet to kocha. „Szacun, że się nie obraził”.'],
        ['Proszę o usuwanie mema.', { h: -5, s: -10 }, 'Efekt Streisand w pełnej krasie. Mem ma teraz trzy nowe wersje.'],
        ['Drukuję merch z memem.', { k: 20, h: 10, s: -5 }, 'Koszulki wyprzedane w dwie godziny. Hejterzy też kupili.']] },
      { k: 'redaktor', app: 'Śliska News', t: 'Wieczór. Wszyscy czekają na Twój ruch. Redakcja Śliskiej pyta o komentarz do artykułu. Co ogłaszasz?', c: [
        ['Trasę „Za Kasę Tour”.', { h: 20, k: 15 }, 'Bilety schodzą jak ciepłe bułki. Ironia zrobiła robotę.'],
        ['Szczere oświadczenie i przeprosiny.', { s: 20, h: -5 }, 'Długi post, bez prawników. Nawet raper z featu daje lajka.'],
        ['Nic. Znikam na miesiąc.', { h: -20, s: 5 }, 'Konto milczy. Po tygodniu ludzie zaczynają tęsknić. Albo zapominać.']] }
    ] },
    { id: 'romans', name: 'Romans na backstage’u', k: 'uwodziciel', sub: 'Paparazzi przyłapał Cię z byłą Twojego producenta.', sc: [
      { k: 'uwodziciel', app: 'Pudelek-styl', t: 'Paparazzi przyłapał Cię, jak o 4:00 wychodzisz z backstage’u z byłą Twojego producenta. Zdjęcie jest nieostre, ale wszyscy wiedzą, że to Ty.', c: [
        ['„To tylko koleżanka.”', { s: -10, h: 5 }, 'Koleżanka wrzuca story z Twoją bluzą. Ups.'],
        ['Potwierdzam. Zakochałem się.', { h: 20, s: 5 }, 'Internet szaleje. Połowa wysyła serduszka, połowa popcorn.'],
        ['Bez komentarza.', { h: 5 }, '„Bez komentarza” to też komentarz. Plotki się mnożą.']] },
      { k: 'wsciekla', app: 'Instagram', t: 'Producent wrzuca story: „Bitów już ode mnie nie dostaniesz. Ani niczego innego”. Masz za tydzień premierę singla.', c: [
        ['Kupuję bity z internetu.', { k: -10, s: -5 }, 'Bit brzmi jak dzwonek z 2009. Ktoś to rozpoznał w 3 minuty.'],
        ['Przepraszam producenta prywatnie.', { s: 10, h: -5 }, 'Odpisał „ok”. Tylko „ok”. Ale bity wysłał.'],
        ['Wrzucam nasze wspólne zdjęcie.', { h: 25, s: -10 }, 'Wojna na story. Śliska News robi z tego serię artykułów.']] },
      { k: 'sauna', app: 'Podcast', t: 'Dostajesz zaproszenie do podcastu „Szczerze i mokro”. Prowadzący obiecuje, że „pytania będą lekkie”. Nigdy nie są.', c: [
        ['Idę i mówię wszystko.', { h: 20, s: 5 }, 'Trzy godziny szczerości. Klipy z rozmowy są wszędzie.'],
        ['Idę i ściemniam.', { h: 10, s: -15 }, 'Widzowie łapią każdą sprzeczność. Ktoś zrobił z tego kompilację.'],
        ['Odmawiam.', { h: -10 }, 'Podcast i tak o Tobie mówi. Bez Ciebie.']] },
      { k: 'detektyw', app: 'Twitter', t: 'Wyciekają screeny Waszych wiadomości. Najczęściej cytowane zdanie: „mój producent nie umie nawet w bity”.', c: [
        ['Mówię, że to fejk.', { s: -15, h: 10 }, 'Ktoś pokazuje metadane. To nie fejk.'],
        ['Śmieję się z siebie na TikToku.', { h: 15, s: 10 }, 'Autoironia ratuje sytuację. Dźwięk z filmiku wiralowy.'],
        ['Zatrudniam prawnika.', { k: -15, s: 5 }, 'Pismo idzie do trzech portali. Dwa usuwają. Trzeci pisze o piśmie.']] },
      { k: 'zakochana', app: 'Śliska News', t: 'Minął miesiąc. Wszyscy pytają, czy to coś poważnego. Co robicie?', c: [
        ['Nagrywamy razem duet.', { h: 25, k: 15, s: -5 }, 'Numer wpada na listy. Producent… robi remix. Podobno za kasę.'],
        ['Zrywamy dla świętego spokoju.', { s: 10, h: -10 }, 'Spokój jest. Tylko serce trochę mokre.'],
        ['Ogłaszam przerwę od social mediów.', { h: -15, s: 10 }, 'Przerwa trwa 4 dni. Rekord.']] }
    ] },
    { id: 'plagiat', name: 'Gala i plagiat', k: 'gwiazdor', sub: 'Wygrywasz nagrodę, ale ktoś zarzuca Ci kradzież refrenu.', sc: [
      { k: 'gwiazdor', app: 'Gala', t: 'Wygrywasz nagrodę za Numer Roku. Godzinę później ktoś wrzuca porównanie: Twój refren brzmi jak piosenka mało znanego artysty z 2019.', c: [
        ['„To była inspiracja.”', { s: -5, h: 5 }, 'Słowo „inspiracja” staje się memem tygodnia.'],
        ['Oddaję statuetkę na scenie.', { s: 20, h: 15, k: -10 }, 'Wideo ma 2 miliony wyświetleń. Klasa – piszą nawet hejterzy.'],
        ['Ignoruję i świętuję.', { h: 5, s: -10 }, 'Zdjęcia z afterparty kontra porównanie refrenów. Nie wygląda to dobrze.']] },
      { k: 'redaktor', app: 'Mail', t: 'Autor oryginału żąda tantiem i przeprosin. Jego jedyny numer ma teraz więcej odsłuchów niż przez 7 lat.', c: [
        ['Płacę od razu.', { k: -20, s: 15 }, 'Sprawa zamknięta po cichu. Prawie po cichu – on o tym nagrał film.'],
        ['Idę do sądu.', { k: -10, h: 10 }, 'Rozprawa za rok. Do tego czasu – darmowa promocja dla Was obu.'],
        ['Proponuję mu feat.', { h: 15, s: 10, k: 5 }, 'Zgodził się. Internet: „najlepsze zakończenie dramy ever”.']] },
      { k: 'imprezowa', app: 'Instagram', t: 'Na afterparty ktoś nagrywa, jak tańczysz na stole ze statuetką na głowie. Nagranie już krąży.', c: [
        ['Tańczę dalej. To moja noc.', { h: 20, s: -5 }, 'Filmik jest wszędzie. Z dźwiękiem Twojego „inspirowanego” refrenu.'],
        ['Zabieram komuś telefon.', { h: 10, s: -20 }, 'Teraz jest też drugie nagranie. Z innego telefonu.'],
        ['Zamawiam pizzę dla wszystkich.', { s: 10, k: -5, h: 5 }, 'Pizza dla 80 osób. Najlepszy PR za 1200 zł.']] },
      { k: 'diabelek', app: 'Zrzutka', t: 'Hejterzy zakładają zrzutkę „na lekcje oryginalności dla Ciebie”. Zebrali już 3 tysiące.', c: [
        ['Wpłacam pierwszy i dziękuję.', { h: 20, s: 15, k: -5 }, 'Dystans level master. Zrzutkę przekazujesz na schronisko.'],
        ['Zgłaszam zrzutkę.', { s: -10, h: 5 }, 'Zrzutka zdjęta. Powstają trzy nowe.'],
        ['Nagrywam diss na hejterów.', { h: 15, s: -5 }, 'Diss jest dobry. Ale refren… brzmi znajomo.']] },
      { k: 'redaktor', app: 'Śliska News', t: 'Rok później. Śliska News robi podsumowanie afery. Jaki jest Twój ostatni ruch?', c: [
        ['Remix z autorem oryginału.', { s: 20, k: 15 }, 'Remix lepszy od obu wersji. Nikt nie pamięta, o co była afera.'],
        ['Mówię, że to była prowokacja marketingowa.', { h: 25, s: -15, k: 10 }, 'Pół internetu klaszcze, pół czuje się oszukane. Zasięgi rekordowe.'],
        ['Usuwam numer z serwisów.', { s: 5, h: -15, k: -15 }, 'Numer znika. Tylko ludzie wciąż nucą ten refren.']] }
    ] }
  ];
  var ENDS = [
    ['legenda', 'Legenda', 'super', function (s) { return s.s >= 70 && s.h >= 65; }, 'Wychodzisz z afery silniejszy niż kiedykolwiek. Hype, szacunek i nagłówek „Comeback dekady”. Legenda.'],
    ['krol', 'Król dramy', 'diabelek', function (s) { return s.h >= 75 && s.s < 45; }, 'Wszyscy Cię znają, nikt Ci nie ufa. Każdy Twój post to nowy artykuł na Śliskiej. Korona jest, tylko trochę ubrudzona.'],
    ['biznes', 'Biznesmen roku', 'gwiazdor', function (s) { return s.k >= 75; }, 'Z afery zrobiłeś biznes: merch, reklamy, trasa. Konto pełne. O muzyce mało kto pamięta.'],
    ['wtopa', 'Wtopa roku', 'ratownik', function (s) { return s.s < 25; }, 'Każdy ruch dolewał oliwy do ognia. Śliska News przyznaje Ci tytuł „Wtopa roku”. Licznik dni bez wtopy: 0.'],
    ['comeback', 'Szanowany weteran', 'zakochana', function (s) { return s.s >= 65; }, 'Nie było fajerwerków, ale wyszedłeś z tego z klasą. Branża Cię szanuje, fani też.'],
    ['mem', 'Żywy mem', 'kapiel', function (s) { return s.h >= 65; }, 'Nie wiadomo jak, ale wszyscy Cię kochają – jako mema. Twoja mina jest na naklejkach, kubkach i w każdej grupie.'],
    ['cisza', 'Cichy przeczekiwacz', 'szlafrok', function (s) { return s.h < 35; }, 'Drama wygasła sama. Nikt już nie pamięta, o co chodziło – Ty też nie. Bezpiecznie, ale nudno.'],
    ['przecietniak', 'Przeciętniak sceny', 'ziomek', function () { return true; }, 'Ani legenda, ani wtopa. Afera przeszła, Ty zostałeś – gdzieś pośrodku. Spróbuj odważniej!']
  ];
  function drama(el) {
    var g = G('drama');
    shell(el, g, '<div class="dr" id="dr"></div>', { side: '<section class="gp-box"><h3>Zakończenia</h3><div class="dr-ends" id="dr-ends"></div></section>' });
    var stt, sc, step;
    function endsBox() { var got = load().endings || []; $('#dr-ends').innerHTML = ENDS.map(function (e) { var on = got.indexOf(e[1]) >= 0; return '<span class="dr-end' + (on ? ' is-on' : '') + '" title="' + (on ? e[1] : 'Jeszcze nie odkryte') + '">' + (on ? K(e[2], 'gk') : '<i>?</i>') + '<b>' + (on ? e[1] : '???') + '</b></span>'; }).join(''); }
    function meters() { return '<div class="dr-m">' + STATS.map(function (s) { return '<div class="dr-mt"><span>' + s[2] + ' ' + s[1] + '</span><i><b style="width:' + stt[s[0]] + '%"></b></i></div>'; }).join('') + '</div>'; }
    function pickScenario() {
      $('#dr').innerHTML = '<div class="dr-pick"><h2>Wybierz aferę</h2><p>Każda ma 5 decyzji. Wybory zmieniają Hype 🔥, Szacunek ⭐ i Kasę 💰 – a od nich zależy zakończenie.</p><div class="dr-sc">' +
        SCEN.map(function (s, i) { return '<button type="button" class="dr-scb" data-sc="' + i + '"><span class="dr-scb-k">' + K(s.k, 'gk') + '</span><span><b>' + s.name + '</b><small>' + s.sub + '</small></span></button>'; }).join('') + '</div></div>';
    }
    function begin(i) { sc = SCEN[i]; stt = { h: 50, s: 50, k: 50 }; step = 0; $('#dr').innerHTML = '<div class="dr-phone"><div class="dr-top"><b>' + sc.name + '</b><span id="dr-step"></span></div><div id="dr-meters"></div><div class="dr-feed" id="dr-feed"></div><div class="dr-ch" id="dr-ch"></div></div>'; scene(); }
    function bubble(cls, html) { var f = $('#dr-feed'), d = document.createElement('div'); d.className = 'dr-b ' + cls; d.innerHTML = html; f.appendChild(d); f.scrollTop = f.scrollHeight; return d; }
    function scene() {
      var s = sc.sc[step]; $('#dr-step').textContent = (step + 1) + '/' + sc.sc.length; $('#dr-meters').innerHTML = meters();
      bubble('is-in', '<span class="dr-av">' + K(s.k, 'gk') + '</span><div><small>' + s.app + '</small><p>' + s.t + '</p></div>');
      $('#dr-ch').innerHTML = s.c.map(function (c, i) { return '<button type="button" class="dr-opt" data-c="' + i + '">' + c[0] + '</button>'; }).join('');
    }
    function choose(i) {
      var c = sc.sc[step].c[i];
      bubble('is-me', '<p>' + c[0] + '</p>');
      Object.keys(c[1]).forEach(function (k) { stt[k] = Math.max(0, Math.min(100, stt[k] + c[1][k])); });
      var dl = STATS.filter(function (s) { return c[1][s[0]]; }).map(function (s) { var v = c[1][s[0]]; return '<span class="' + (v > 0 ? 'up' : 'dn') + '">' + s[2] + ' ' + (v > 0 ? '+' : '') + v + '</span>'; }).join('');
      bubble('is-re', '<p>' + c[2] + '</p>' + (dl ? '<div class="dr-dl">' + dl + '</div>' : ''));
      step++;
      if (step >= sc.sc.length) return finish();
      scene();
    }
    function finish() {
      var e = ENDS.filter(function (x) { return x[3](stt); })[0], d = load(); d.endings = d.endings || [];
      var fresh = d.endings.indexOf(e[1]) < 0; if (fresh) d.endings.push(e[1]); save(d);
      submit('drama', d.endings.length); xp('drama'); played('drama'); endsBox();
      $('#dr-meters').innerHTML = meters(); $('#dr-ch').innerHTML = '';
      var card = bubble('is-end', '<div class="dr-ek">' + K(e[2], 'gk') + '</div><span class="gm-eye">Zakończenie' + (fresh ? ' · nowe!' : '') + '</span><h2>' + e[1] + '</h2><p>' + e[4] + '</p><p class="dr-sum">Odkryte zakończenia: <b>' + d.endings.length + '/8</b></p><div class="gm-acts"><button type="button" class="btn btn-primary" data-act="again">Inna afera</button><button type="button" class="btn" data-act="share">' + ICO.share + ' Udostępnij</button></div>');
      card.querySelector('[data-act="share"]').onclick = function () { share('Drama Simulator na Śliskiej: wyszedłem z afery „' + sc.name + '” jako „' + e[1] + '” 💦\n' + LINK); };
    }
    $('#dr').addEventListener('click', function (e) {
      var b = e.target.closest('[data-sc]'); if (b) return begin(+b.dataset.sc);
      b = e.target.closest('[data-c]'); if (b) return choose(+b.dataset.c);
      b = e.target.closest('[data-act="again"]'); if (b) pickScenario();
    });
    endsBox(); pickScenario();
  }

  /* ============== KRZYŻÓWKA TYGODNIA (krzyżówka z hasłem) ============== */
  // [wyraz, podpowiedź, pozycja litery hasła w wyrazie] – używane, gdy właściciel nie ułożył krzyżówki na dany tydzień
  var KRZ = [
    { h: 'ŚLISKA', r: [['ŚLIZG', 'Ruch po mokrej powierzchni', 0], ['ALBUM', 'Płyta z kilkoma utworami', 1], ['WINYL', 'Czarna płyta dla kolekcjonerów', 1], ['SCENA', 'Miejsce, na którym gra się koncert', 0], ['KLIP', 'Teledysk, inaczej', 0], ['AFERA', 'Głośny skandal', 0]] },
    { h: 'DRAMA', r: [['DISS', 'Utwór, w którym raper atakuje innego', 0], ['TRASA', 'Seria koncertów w różnych miastach', 1], ['FEAT', 'Gościnny udział innego artysty w numerze', 2], ['MIKROFON', 'Bez niego wokalista nic nie zdziała', 0], ['FANKA', 'Wierna słuchaczka artysty', 1]] },
    { h: 'MOKRO', r: [['MERCH', 'Koszulki i bluzy z logo artysty', 0], ['SOLO', 'Występ w pojedynkę', 1], ['SKANDAL', 'Afera, o której mówią wszyscy', 1], ['REFREN', 'Powtarzająca się część piosenki', 0], ['PODCAST', 'Audycja do słuchania w internecie', 1]] },
    { h: 'KNAGA', r: [['KONCERT', 'Występ na żywo', 0], ['NAGRODA', 'Statuetka dla najlepszych', 0], ['PLAYLISTA', 'Lista utworów w aplikacji', 2], ['GALA', 'Uroczysta impreza z wręczeniem nagród', 0], ['SAMPEL', 'Fragment cudzego utworu użyty w nowym', 1]] }
  ];
  function krzyzowka(el, ctx) {
    var g = G('krzyzowka'), arts = (ctx && ctx.articles) || [];
    shell(el, g, '<div class="kz"><p class="sz-load">Ładowanie krzyżówki…</p></div>', { tag: 'Tydzień #' + weekIndex() });
    cfg().then(function (c) {
      if (!$('.gp[data-game="krzyzowka"]')) return;
      if (!arts.length && typeof state !== 'undefined') arts = state.articles || [];
      var own = !!(c && c.krzyz && c.krzyz.week === weekIndex() && c.krzyz.h);
      var set = own ? c.krzyz : (window.KrzGen && KrzGen.generate(arts, weekIndex())) || KRZ[((weekIndex() % KRZ.length) + KRZ.length) % KRZ.length];
      krzRun(set, own ? 'Ułożona przez redakcję' : set.gen ? 'Z artykułów tygodnia' : 'Krzyżówka z hasłem');
    });
  }
  function krzRun(set, own) {
    var L = Math.max.apply(null, set.r.map(function (r) { return r[2]; })), R = Math.max.apply(null, set.r.map(function (r) { return r[0].length - r[2]; }));
    var key = 'sn-krzyz-' + weekIndex() + '-' + set.h, st = lsGet(key) || {}; st.v = st.v || {};
    var nxt = new Date(); nxt.setDate(nxt.getDate() + ((8 - nxt.getDay()) % 7 || 7));
    $('.kz').innerHTML = '<div class="kz-paper"><div class="kz-head"><div><span class="gm-eye">' + (own ? 'Ułożona przez redakcję' : 'Krzyżówka z hasłem') + '</span><p>Litery w <b>złotej kolumnie</b> tworzą hasło tygodnia (' + set.h.length + ' liter). Nowa: ' + nxt.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' }) + '.</p></div></div>' +
      '<div class="kz-wrap"><div class="kz-grid" id="kz-grid" style="--cols:' + (L + R) + '">' + set.r.map(function (r, ri) {
        var cells = ''; for (var c = 0; c < L + R; c++) {
          var k = c - (L - r[2]);
          cells += k < 0 || k >= r[0].length ? '<span class="kz-x"></span>' : '<input class="kz-c' + (k === r[2] ? ' is-h' : '') + '" data-r="' + ri + '" data-k="' + k + '" maxlength="1" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Wyraz ' + (ri + 1) + ', litera ' + (k + 1) + '" value="' + esc((st.v[ri] || '')[k] || '').trim() + '">';
        }
        return '<div class="kz-row" data-r="' + ri + '"><span class="kz-n">' + (ri + 1) + '</span>' + cells + '</div>';
      }).join('') + '</div></div>' +
      '<div class="kz-pass" id="kz-pass">' + set.h.split('').map(function () { return '<span></span>'; }).join('') + '</div>' +
      '<ol class="kz-clues">' + set.r.map(function (r, ri) { return '<li data-r="' + ri + '"><b>' + (ri + 1) + '</b><span>' + esc(r[1]) + ' <small>(' + r[0].length + (r[0].length < 5 ? ' litery' : ' liter') + ')</small></span></li>'; }).join('') + '</ol>' +
      '<div class="kz-act"><button type="button" class="btn btn-primary" id="kz-check">Sprawdź</button><button type="button" class="btn" id="kz-hint">Podpowiedz literę</button></div><p class="kz-msg" id="kz-msg" aria-live="polite"></p></div>';
    var grid = $('#kz-grid'), lastCell = null;
    function word(ri) { return [].map.call(grid.querySelectorAll('.kz-c[data-r="' + ri + '"]'), function (i) { return (i.value || ' ').toUpperCase(); }).join(''); }
    function pass() { var sp = $('#kz-pass').children; set.r.forEach(function (r, ri) { var c = grid.querySelector('.kz-c[data-r="' + ri + '"][data-k="' + r[2] + '"]'); sp[ri].textContent = c ? c.value.toUpperCase() : ''; }); }
    function store() { set.r.forEach(function (_, ri) { st.v[ri] = word(ri); }); lsSet(key, st); pass(); }
    function cellsOf(ri) { return [].slice.call(grid.querySelectorAll('.kz-c[data-r="' + ri + '"]')); }
    function focusRow(ri) { [].forEach.call(document.querySelectorAll('.kz-clues li'), function (li) { li.classList.toggle('is-on', +li.dataset.r === ri); }); [].forEach.call(grid.querySelectorAll('.kz-row'), function (r) { r.classList.toggle('is-on', +r.dataset.r === ri); }); }
    grid.addEventListener('focusin', function (e) { if (e.target.classList.contains('kz-c')) { lastCell = e.target; focusRow(+e.target.dataset.r); e.target.select(); } });
    grid.addEventListener('input', function (e) {
      var i = e.target; if (!i.classList.contains('kz-c')) return;
      var v = (i.value || '').toUpperCase().replace(/[^A-ZĄĆĘŁŃÓŚŹŻ]/g, ''); i.value = v.slice(-1);
      i.closest('.kz-row').classList.remove('is-bad', 'is-ok');
      if (i.value) { var cs = cellsOf(+i.dataset.r), n = cs[cs.indexOf(i) + 1]; if (n) n.focus(); }
      store();
    });
    grid.addEventListener('keydown', function (e) {
      var i = e.target; if (!i.classList.contains('kz-c')) return; var ri = +i.dataset.r, cs = cellsOf(ri), at = cs.indexOf(i);
      if (e.key === 'Backspace' && !i.value && cs[at - 1]) { e.preventDefault(); cs[at - 1].value = ''; cs[at - 1].focus(); store(); }
      else if (e.key === 'ArrowLeft' && cs[at - 1]) cs[at - 1].focus();
      else if (e.key === 'ArrowRight' && cs[at + 1]) cs[at + 1].focus();
      else if ((e.key === 'ArrowDown' || e.key === 'Enter') && ri < set.r.length - 1) { e.preventDefault(); cellsOf(ri + 1)[0].focus(); }
      else if (e.key === 'ArrowUp' && ri > 0) cellsOf(ri - 1)[0].focus();
    });
    document.querySelector('.kz-clues').addEventListener('click', function (e) { var li = e.target.closest('[data-r]'); if (li) { var c = cellsOf(+li.dataset.r).find(function (x) { return !x.value; }) || cellsOf(+li.dataset.r)[0]; c.focus(); } });
    function win() {
      grid.classList.add('is-done'); [].forEach.call(grid.querySelectorAll('.kz-c'), function (i) { i.readOnly = true; }); $('#kz-pass').classList.add('is-done'); pass();
      $('#kz-msg').innerHTML = '<div class="sz-end is-win">' + K('imprezowa', 'gk') + '<div><b>Rozwiązane!</b><span>Hasło tygodnia: ' + set.h + '. Mokra robota.</span></div><button type="button" class="btn btn-primary btn-sm" id="kz-share">' + ICO.share + ' Udostępnij</button></div>';
      $('#kz-share').onclick = function () { share('Rozwiązałem Krzyżówkę Tygodnia na Śliskiej 🧩 Dasz radę?\n' + LINK); };
      if (!st.done) { st.done = 1; lsSet(key, st); lsSet('sn-krzyz-done-' + weekIndex(), 1); var d = load(); d.solved = (d.solved || 0) + 1; save(d); submit('krzyzowka', d.solved); xp('krzyzowka'); played('krzyzowka'); toast('Krzyżówka rozwiązana! 🧩'); }
    }
    $('#kz-check').onclick = function () {
      var bad = 0, empty = 0;
      set.r.forEach(function (r, ri) { var w = word(ri), row = grid.querySelector('.kz-row[data-r="' + ri + '"]'); if (w.indexOf(' ') >= 0) { empty++; row.classList.remove('is-bad', 'is-ok'); return; } var ok = w === r[0]; row.classList.toggle('is-ok', ok); row.classList.toggle('is-bad', !ok); if (!ok) bad++; });
      if (!bad && !empty) win(); else $('#kz-msg').textContent = bad ? 'Błędne wyrazy: ' + bad + '. Popraw zaznaczone na czerwono.' : 'Uzupełnij jeszcze ' + empty + (empty === 1 ? ' wyraz.' : ' wyrazy.');
    };
    $('#kz-hint').onclick = function () {
      var ri = lastCell ? +lastCell.dataset.r : -1;
      var tryRow = function (r) { var cs = cellsOf(r), w = set.r[r][0]; for (var k = 0; k < cs.length; k++) if (cs[k].value.toUpperCase() !== w[k]) { cs[k].value = w[k]; cs[k].classList.add('is-given'); cs[k].focus(); store(); return true; } return false; };
      if (ri >= 0 && tryRow(ri)) return; for (var r = 0; r < set.r.length; r++) if (tryRow(r)) return;
    };
    pass();
    if (st.done) win();
  }

  /* sekcja „Śliska strefa” w lewym pasku: podświetlenie bieżącej strony i plakietka „Nowe słowo”, dopóki dzisiejsze Ślizgle nie są rozwiązane */
  function zone() {
    var h = location.hash || '#/', st = slizgleState(), pill = document.querySelector('.zone-pill');
    [].forEach.call(document.querySelectorAll('.zone-list a'), function (a) { var p = a.getAttribute('href'); a.classList.toggle('active', h === p || h.indexOf(p + '/') === 0 || (p === '#/dramy' && /^#\/drama\//.test(h))); });
    if (pill) pill.hidden = !!(st && st.end);
  }
  window.addEventListener('hashchange', function () { setTimeout(zone, 0); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', zone); else zone();

  var RUN = { krzyzowka: krzyzowka, slizgle: slizgle, krople: krople, flappy: flappy, waz: waz, ukladanka: ukladanka, drama: drama, slizgawka: slizgawka };
  window.SliskieGry = {
    mount: function (el, sub, ctx) {
      stopAll();
      if (sub === 'slizgawka' && !unlocked()) sub = '';
      if (sub && RUN[sub]) RUN[sub](el, ctx || {}); else hub(el);
      window.scrollTo(0, 0);
    },
    stop: stopAll,
    best: best, fmt: fmt, games: GAMES
  };
})();
