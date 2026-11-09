/* Śliska Studio (dev.sliska.pl) – powłoka: adresy podstron, boczne menu, pulpit i okna narzędzi (studio, poczta, reklamy, wersje). */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var GATE = /^dev\./.test(location.hostname) || /[?&]gate=1\b/.test(location.search);

  /* ---------- Świeża wersja i pełna wysokość w aplikacji z ekranu początkowego ---------- */
  var BUILD = '20261109p';
  function checkFresh() {
    try {
      fetch('/?_=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (t) {
        var m = /hub\.js\?v=([0-9a-z]+)/.exec(t);
        if (m && m[1] !== BUILD && sessionStorage.getItem('hub_reload') !== m[1]) { sessionStorage.setItem('hub_reload', m[1]); location.reload(); }
      }).catch(function () {});
    } catch (e) { /* ignoruj */ }
  }
  checkFresh();
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') checkFresh(); });
  function fitHeight() {
    var de = document.documentElement, sh = window.screen && screen.height, ih = window.innerHeight;
    var standalone = window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
    var gap = 0;   // iOS: widok krótszy niż ekran
    de.style.setProperty('--gap', gap + 'px'); de.classList.toggle('has-gap', !!gap);
    de.setAttribute('data-vp', [ih, sh, window.visualViewport ? Math.round(visualViewport.height) : 0].join('/'));
  }
  fitHeight(); addEventListener('resize', fitHeight); addEventListener('orientationchange', function () { setTimeout(fitHeight, 300); });

  /* ---------- Podstrony ----------
     tool: w którym narzędziu się otwiera; h: adres wewnątrz studia; src: adres narzędzia; need: kto ma dostęp */
  var R = {
    pulpit:      { p: '/', t: 'Pulpit', crumb: 'Śliska Studio', native: 'dash', bare: true },
    opublikowane:{ p: '/artykuly', t: 'Opublikowane', crumb: 'Treści', sub: 'Artykuły i nowinki widoczne na stronie: edycja, grafiki i wysyłka na social media.', tool: 'studio', h: '#/panel/all', act: 'new' },
    robocze:     { p: '/artykuly/robocze', t: 'Wersje robocze', crumb: 'Treści', sub: 'Teksty w trakcie pisania. Zapisują się same.', tool: 'studio', h: '#/panel/drafts', act: 'new' },
    zaplanowane: { p: '/artykuly/zaplanowane', t: 'Zaplanowane', crumb: 'Treści', sub: 'Artykuły, które opublikują się same o wybranej godzinie.', tool: 'studio', h: '#/panel/scheduled', act: 'new' },
    edytor:      { p: '/edytor', t: 'Edytor', crumb: 'Treści', tool: 'studio', h: '#/edytor', bare: true },
    podglad:     { p: '/podglad', t: 'Podgląd artykułu', crumb: 'Treści', tool: 'studio', h: '#/artykul' },
    nowinki:     { p: '/nowinki', t: 'Nowinki z Poślizgiem', crumb: 'Treści', sub: 'Krótkie newsy: jedno zdanie i link do źródła.', tool: 'studio', h: '#/szybkie', act: 'quick' },
    komentarze:  { p: '/komentarze', t: 'Komentarze', crumb: 'Społeczność', sub: 'Moderacja komentarzy czytelników.', tool: 'studio', h: '#/panel/comments', need: 'mod' },
    zgloszenia:  { p: '/zgloszenia', t: 'Tematy i błędy', crumb: 'Społeczność', sub: 'Tematy podesłane przez czytelników i zgłoszone błędy w artykułach.', tool: 'studio', h: '#/panel/tips', need: 'owner' },
    uzytkownicy: { p: '/uzytkownicy', t: 'Użytkownicy', crumb: 'Społeczność', sub: 'Konta czytelników i redakcji, rangi i blokady.', tool: 'studio', h: '#/panel/users', need: 'owner' },
    reklamy:     { p: '/reklamy', t: 'Reklamy', crumb: 'Promocja i kontakt', sub: 'Baza reklam na stronie i zgłoszenia od reklamodawców.', tool: 'reklamy', src: '/reklamy/', need: 'owner' },
    poczta:      { p: '/poczta', t: 'Poczta', crumb: 'Promocja i kontakt', sub: 'Skrzynka redakcja@sliska.pl.', tool: 'poczta', src: '/poczta/', need: 'owner' },
    gry:         { p: '/gry', t: 'Gry i Knaga', crumb: 'Społeczność', sub: 'Statystyki, poziomy i rekordy graczy, słowa w Ślizgle, Krzyżówka Tygodnia i teksty Knagi.', tool: 'gry', src: '/gry/', need: 'owner' },
    narzedzia:   { p: '/narzedzia', t: 'Narzędzia', crumb: 'System', sub: 'Kopia zapasowa, podglądy linków i mniejsze zdjęcia.', tool: 'studio', h: '#/panel/tools', need: 'owner' },
    wersje:      { p: '/wersje', t: 'Wersje strony', crumb: 'System', sub: 'Historia zmian i archiwalne wersje Śliska News.', tool: 'wersje', src: '/wersje/', need: 'vers' },
    ustawienia:  { p: '/ustawienia', t: 'Ustawienia', crumb: 'System', sub: 'Profil redaktora, domyślne wartości edytora i powiadomienia.', tool: 'studio', h: '#/ustawienia' },
    konto:       { p: '/konto', t: 'Moje konto', crumb: 'Konto', sub: 'Profil, bezpieczeństwo i zalogowane urządzenia.', tool: 'studio', h: '#/konto' }
  };
  var TAB2R = { drafts: 'robocze', all: 'opublikowane', scheduled: 'zaplanowane', comments: 'komentarze', tips: 'zgloszenia', users: 'uzytkownicy', ads: 'reklamy', tools: 'narzedzia' };
  var ROLE_NAME = { owner: 'Właściciel Portalu', mod: 'Moderator', editor: 'Redaktor' };

  /** Adres strony (np. /edytor/abc) → podstrona + adres wewnątrz narzędzia. */
  function resolve(path, search) {
    path = (path || '/').replace(/\/+$/, '') || '/';
    var seg = path.split('/').filter(Boolean), q = new URLSearchParams(search || '');
    var id = function (k) { return R[k] ? { k: k, r: R[k], h: R[k].h } : null; };
    if (!seg.length) return id('pulpit');
    if (seg[0] === 'artykuly') return id(seg[1] === 'robocze' ? 'robocze' : seg[1] === 'zaplanowane' ? 'zaplanowane' : 'opublikowane');
    if (seg[0] === 'edytor') {
      var e = id('edytor');
      if (seg[1]) { e.h = '#/edytor/' + seg[1]; e.title = 'Edycja artykułu'; }
      else if (q.get('szkic')) { e.h = '#/szkic/' + encodeURIComponent(q.get('szkic')); }
      return e;
    }
    if (seg[0] === 'podglad' && seg[1]) { var p = id('podglad'); p.h = '#/artykul/' + seg[1]; return p; }
    if (seg[0] === 'konto') { var c = id('konto'); if (seg[1]) c.h = '#/konto/' + seg[1]; return c; }
    return id(seg[0]) || null;
  }
  /** Adres wewnątrz studia (#/panel/drafts…) → adres strony. */
  function fromStudio(hash, tab) {
    var seg = String(hash || '').replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean);
    if (!seg.length) return '/artykuly/robocze';
    if (seg[0] === 'panel') { var t = tab || seg[1] || 'drafts'; return R[TAB2R[t] || 'robocze'].p; }
    if (seg[0] === 'edytor') return '/edytor' + (seg[1] ? '/' + seg[1] : '');
    if (seg[0] === 'szkic' && seg[1]) return '/edytor?szkic=' + seg[1];
    if ((seg[0] === 'artykul' || seg[0] === 'a') && seg[1]) return '/podglad/' + seg[1];
    if (seg[0] === 'szybkie') return '/nowinki';
    if (seg[0] === 'ustawienia') return '/ustawienia';
    if (seg[0] === 'konto') return '/konto' + (seg[1] ? '/' + seg[1] : '');
    return '';
  }
  /** Stare adresy huba: /?open=/studio/#/panel, #/artykul, ?tool=new … */
  function legacy() {
    var q = new URLSearchParams(location.search), o = q.get('open'), tool = q.get('tool');
    if (o) {
      if (/^\/studio\//.test(o)) { var hi = o.indexOf('#'); return fromStudio(hi >= 0 ? o.slice(hi) : '') || '/'; }
      if (/^\/reklamy\//.test(o)) return '/reklamy';
      if (/^\/poczta\//.test(o)) return '/poczta';
      if (/^\/wersje\//.test(o)) return '/wersje';
      if (/^\/gry(\/|$)/.test(o)) return '/gry';
    }
    if (tool === 'new') return '/edytor';
    if (tool === 'ads') return '/reklamy';
    var m = location.hash.match(/^#\/(artykul|nowinki|panel|ustawienia|konto|reklamy|poczta)(\/.*)?$/);
    if (m) return { artykul: '/edytor', nowinki: '/nowinki', panel: '/artykuly/robocze', ustawienia: '/ustawienia', konto: '/konto', reklamy: '/reklamy', poczta: '/poczta' }[m[1]];
    return '';
  }

  /* ---------- Rola ---------- */
  var role = '', crown = false;
  function can(need) {
    if (!need) return true;
    var own = role === 'owner', mod = own || role === 'mod' || crown;
    if (need === 'owner') return own;
    if (need === 'mod') return mod;
    if (need === 'vers') return own;            // archiwum wersji – tylko Właściciel Portalu
    if (need === 'nomod') return !mod;
    if (need === 'noowner') return !own;
    return true;
  }
  function applyRole() {
    $$('[data-need]').forEach(function (el) { el.hidden = !can(el.dataset.need); });
    $('#me-role').textContent = ROLE_NAME[role] || 'Redakcja';
    $('#hello-role').textContent = ROLE_NAME[role] || 'Redakcja';
  }

  /* ---------- Okna narzędzi (żyją w tle – przełączanie jest natychmiastowe) ---------- */
  var stage = $('#stage'), loader = $('#loader'), frames = {}, cur = null, expect = '';
  function frameSrc(tool, h) {
    if (tool === 'studio') return '/studio/?embed=1' + (h || '#/panel');
    return R[tool] ? R[tool].src : '/' + tool + '/';
  }
  function frame(tool, h) {
    if (frames[tool]) return frames[tool];
    var f = document.createElement('iframe');
    f.className = 'frame'; f.title = tool; f.dataset.tool = tool;
    f.addEventListener('load', function () { f.dataset.ready = '1'; if (cur && cur.r.tool === tool) loader.hidden = true; syncTheme(f); });
    f.src = frameSrc(tool, h);
    stage.appendChild(f); frames[tool] = f;
    return f;
  }

  /* ---------- Przejście na podstronę ---------- */
  function show(push) {
    var x = resolve(location.pathname, location.search);
    if (!x) { history.replaceState(null, '', '/'); x = resolve('/'); }
    cur = x;
    var r = x.r, ok = can(r.need);
    $('#main').classList.toggle('bare', !!r.bare && ok);
    $('#title').textContent = x.title || r.t;
    $('#crumb').textContent = r.crumb || '';
    $('#sub').textContent = r.sub || '';
    $('#sub').hidden = !r.sub;
    document.title = 'DEV · ' + (x.title || r.t) + ' – Śliska Studio';
    $('#head-act').innerHTML = r.act === 'new' ? '<a class="btn btn-primary" href="/edytor" data-nav><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg><span>Nowy artykuł</span></a>'
      : r.act === 'quick' ? '<button class="btn btn-primary" type="button" data-act="quick-new"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg><span>Dodaj nowinkę</span></button>' : '';
    $$('[data-r]').forEach(function (a) { a.classList.toggle('on', a.dataset.r.split(' ').indexOf(x.k) >= 0); });
    $('#page-dash').hidden = !(r.native === 'dash');
    $('#page-deny').hidden = ok;
    Object.keys(frames).forEach(function (k) { frames[k].classList.toggle('on', ok && r.tool === k); });
    loader.hidden = true;
    if (!ok) return;
    if (r.native === 'dash') { dash(); return; }
    var fresh = !frames[r.tool], f = frame(r.tool, x.h);
    f.classList.add('on');
    if (!f.dataset.ready) loader.hidden = false;
    if (!fresh && r.tool === 'studio') {
      expect = location.pathname + location.search;
      try { if (f.contentWindow.location.hash !== x.h) f.contentWindow.location.hash = x.h; } catch (e) { f.src = frameSrc('studio', x.h); }
    }
    if (!fresh) try { f.contentWindow.postMessage({ type: 'sliska-shown' }, location.origin); } catch (e) { /* ignoruj */ }
    closeMenu();
  }
  function go(path, replace) {
    if (path === location.pathname + location.search) { show(); return; }
    history[replace ? 'replaceState' : 'pushState'](null, '', path);
    show();
  }
  window.addEventListener('popstate', function () { show(); });

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-nav]');
    if (a && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) { e.preventDefault(); go(a.getAttribute('href')); return; }
    var b = e.target.closest('[data-act]');
    if (!b) return;
    if (b.dataset.act === 'quick-new') quickNew();
    if (b.dataset.act === 'theme') toggleTheme();
  });

  /** Nowa nowinka: okno w studiu (na podstronie Nowinki). */
  function quickNew() {
    var send = function () { try { frames.studio.contentWindow.postMessage({ type: 'sliska-action', action: 'quick-new' }, location.origin); } catch (e) { /* ignoruj */ } };
    go('/nowinki');
    var f = frames.studio;
    if (f && f.dataset.ready) setTimeout(send, 60); else if (f) f.addEventListener('load', function () { setTimeout(send, 900); }, { once: true });
  }

  /* ---------- Wiadomości z narzędzi ---------- */
  var counts = {};
  window.addEventListener('message', function (e) {
    if (e.origin !== location.origin) return;
    var d = e.data || {};
    if (d.type === 'sliska-route') {
      var p = fromStudio(d.hash, d.tab);
      if (!p || !cur || cur.r.tool !== 'studio') return;
      var now = location.pathname + location.search;
      if (p === now || p === expect) { expect = ''; return; }
      expect = '';
      history.pushState(null, '', p); show();
    }
    if (d.type === 'sliska-counts') { Object.keys(d).forEach(function (k) { if (k !== 'type') counts[k] = d[k]; }); paintCounts(); }
    if (d.type === 'sliska-me' && d.name) setMe(d.name, d.avatar);
    if (d.type === 'sliska-modal') document.body.classList.toggle('is-dim', !!d.open);
    if (d.type === 'sliska-mail-unread') { counts.mail = d.n || 0; paintCounts(); }
    if (d === 'sliska-open-ads' && can('owner')) go('/reklamy');
    if (d === 'sliska-embed-close') go('/');
  });
  function paintCounts() {
    $$('[data-c]').forEach(function (el) { var n = counts[el.dataset.c]; el.hidden = !n; el.textContent = n > 99 ? '99+' : n || ''; });
    $$('[data-k]').forEach(function (el) { var n = counts[el.dataset.k]; if (n != null) el.textContent = n; });
    $$('[data-alert]').forEach(function (el) { el.classList.toggle('alert', !!counts[el.dataset.alert]); });
  }

  /* ---------- Pulpit ---------- */
  var dashDone = false;
  function dash() {
    var h = new Date().getHours();
    $('#today').textContent = new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    $('#hello').textContent = 'Cześć' + (me.full ? ', ' + me.full : '') + '!';
    if (dashDone) return;
    dashDone = true;
    fetch('https://api.sliska.pl/news/api/articles?limit=8', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
      var list = (d.articles || []).slice(0, 7);
      $('#latest').innerHTML = list.length ? list.map(function (a) {
        var img = (a.imageSm && a.imageSmOf === a.image ? a.imageSm : a.image) || '';
        var cat = a.quick ? 'Nowinka' : ((a.categories && a.categories[0]) || a.category || '');
        return '<li class="row">' + (img && !/^data:/.test(img) ? '<img src="' + esc(img) + '" alt="" loading="lazy">' : '<span class="ph"></span>') +
          '<div><b>' + esc(a.title) + '</b><small>' + esc(cat) + (cat ? ' · ' : '') + ago(a.createdAt) + (a.author ? ' · ' + esc(a.author) : '') + '</small></div>' +
          '<div class="row-act">' + (a.quick ? '' : '<a href="/edytor/' + encodeURIComponent(a.id) + '" data-nav>Edytuj</a>') + '<a href="https://news.sliska.pl/a/' + encodeURIComponent(a.id) + '" target="_blank" rel="noopener">Zobacz</a></div></li>';
      }).join('') : '<li class="empty">Brak artykułów.</li>';
    }).catch(function () { $('#latest').innerHTML = '<li class="empty">Nie udało się pobrać listy artykułów.</li>'; });
    var ver = function (url) { return fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + '_=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (t) { var m = t.match(/app\.js\?v=([A-Za-z0-9]+)/); return m ? 'v' + m[1] : ''; }).catch(function () { return ''; }); };
    Promise.all([ver('/news/index.html'), ver('https://news.sliska.pl/index.html')]).then(function (v) {
      $('#v-dev').textContent = v[0] || 'brak danych'; $('#v-pub').textContent = v[1] || 'brak danych';
      var n = $('#v-note');
      if (!v[0] || !v[1]) { n.className = 'ver-note'; n.textContent = 'Nie udało się porównać wersji.'; }
      else if (v[0] === v[1]) { n.className = 'ver-note same'; n.textContent = '✓ Dev i strona publiczna mają tę samą wersję.'; }
      else { n.className = 'ver-note diff'; n.textContent = 'Dev ma nowszą wersję – czeka na Twoją akceptację przed wgraniem na public.'; }
    });
  }
  function ago(iso) {
    var s = (Date.now() - Date.parse(iso)) / 1000;
    if (!(s >= 0)) return '';
    if (s < 3600) return Math.max(1, Math.round(s / 60)) + ' min temu';
    if (s < 86400) return Math.round(s / 3600) + ' godz. temu';
    if (s < 7 * 86400) return Math.round(s / 86400) + ' dni temu';
    return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
  }

  /* ---------- Menu użytkownika ---------- */
  var me = { full: '' }, pop = null;
  function closePop() { if (pop) { pop.remove(); pop = null; $('#me').setAttribute('aria-expanded', 'false'); } }
  $('#me').addEventListener('click', function (e) {
    e.stopPropagation();
    if (pop) { closePop(); return; }
    var off = false; try { off = localStorage.getItem('sliska-dev-logo') === 'off'; } catch (er) { /* ignoruj */ }
    pop = document.createElement('div'); pop.className = 'pop'; pop.setAttribute('role', 'menu');
    pop.innerHTML = '<a href="/konto" data-nav role="menuitem"><svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg>Moje konto</a>' +
      '<a href="/ustawienia" data-nav role="menuitem"><svg class="ic" viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>Ustawienia</a><hr>' +
      '<button type="button" data-act="theme" role="menuitem"><svg class="ic" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>Motyw<small>' + (isDark() ? 'ciemny' : 'jasny') + '</small></button>' +
      '<button type="button" id="logo-tg" role="menuitem"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="3"/><path d="M7 12h4"/></svg>Logo<small>' + (off ? 'zwykłe' : 'DEV') + '</small></button><hr>' +
      '<button type="button" class="danger" id="logout" role="menuitem"><svg class="ic" viewBox="0 0 24 24"><path d="M10 4H5v16h5"/><path d="M15 16l4-4-4-4M19 12H9"/></svg>Wyloguj</button>';
    document.body.appendChild(pop);
    var b = $('#me').getBoundingClientRect();
    pop.style.left = Math.max(8, b.left) + 'px'; pop.style.bottom = (innerHeight - b.top + 8) + 'px';
    $('#me').setAttribute('aria-expanded', 'true');
    $('#logout', pop).onclick = function () { if (window.devLogout) window.devLogout(); else location.href = '/'; };
    $('#logo-tg', pop).onclick = function () { try { localStorage.setItem('sliska-dev-logo', off ? 'on' : 'off'); } catch (er) { /* ignoruj */ } logos(); closePop(); };
  });
  document.addEventListener('click', function (e) { if (pop && !pop.contains(e.target)) closePop(); else if (pop && e.target.closest('a,button')) setTimeout(closePop, 0); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closePop(); closeMenu(); if (typeof closeNotes === 'function') closeNotes(); } });

  function logos() {
    var off = false; try { off = localStorage.getItem('sliska-dev-logo') === 'off'; } catch (e) { /* ignoruj */ }
    $$('.lg-l').forEach(function (i) { i.src = off ? '/news/logo.svg' : '/news/logo-dev.svg'; });
    $$('.lg-d').forEach(function (i) { i.src = off ? '/news/logo-biale.svg' : '/news/logo-dev-biale.svg'; });
  }
  logos();

  /* ---------- Motyw (wspólny dla powłoki i narzędzi) ---------- */
  var mq = matchMedia('(prefers-color-scheme: dark)');
  function isDark() { var t = document.documentElement.getAttribute('data-theme'); return t ? t === 'dark' : mq.matches; }
  function syncTheme(f) {
    try {
      var t = document.documentElement.getAttribute('data-theme'), d = f.contentDocument.documentElement;
      if (t) d.setAttribute('data-theme', t); else d.removeAttribute('data-theme');
    } catch (e) { /* ignoruj */ }
  }
  function toggleTheme() {
    var r = document.documentElement, next = isDark() ? 'light' : 'dark';
    try {
      if (next === (mq.matches ? 'dark' : 'light')) { r.removeAttribute('data-theme'); localStorage.removeItem('sliska_theme'); }
      else { r.setAttribute('data-theme', next); localStorage.setItem('sliska_theme', next); }
    } catch (e) { r.setAttribute('data-theme', next); }
    Object.keys(frames).forEach(function (k) { syncTheme(frames[k]); });
  }

  /* ---------- Menu na telefonie ---------- */
  function closeMenu() { document.body.classList.remove('menu-open'); }
  $('#menu-btn').addEventListener('click', function () { document.body.classList.add('menu-open'); });
  $('#tab-menu').addEventListener('click', function () { document.body.classList.add('menu-open'); });
  $('#scrim').addEventListener('click', closeMenu);
  var dim = document.createElement('div'); dim.className = 'shell-dim'; document.body.appendChild(dim);
  dim.addEventListener('click', function () { Object.keys(frames).forEach(function (k) { try { frames[k].contentWindow.postMessage({ type: 'sliska-modal-close' }, location.origin); } catch (e) { /* ignoruj */ } }); });

  /* ---------- Powiadomienia: nowe tematy, błędy i reklamy (tylko Właściciel) ---------- */
  var N = { items: [], known: null, pop: null, timer: 0 };
  var NKEY = 'sliska-studio-seen';
  var IC_TIP = '<svg class="ic" viewBox="0 0 24 24"><path d="M3 13h5l2 3h4l2-3h5"/><path d="M5 5h14l2 8v6H3v-6z"/></svg>';
  var IC_ERR = '<svg class="ic" viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>';
  var IC_AD = '<svg class="ic" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="12" rx="2.5"/><path d="M8 21h8M12 17v4M7 11h6"/></svg>';
  function seen() { try { return Number(localStorage.getItem(NKEY)) || 0; } catch (e) { return 0; } }
  function setSeen(t) { try { localStorage.setItem(NKEY, String(t)); } catch (e) { /* ignoruj */ } }
  function tms(v) { var n = Number(v); if (n > 1e11) return n; if (n > 1e9) return n * 1000; return Date.parse(v) || 0; }
  function loadNotes() {
    if (!can('owner')) return Promise.resolve();
    var tips = api('/ed/tips').then(function (d) {
      return ((d && d.tips) || []).map(function (t) {
        var err = /^Błąd w artykule:/i.test(t.title || '');
        return { id: 't:' + t.id, at: tms(t.createdAt), kind: err ? 'err' : 'tip', title: err ? 'Zgłoszony błąd w artykule' : 'Nowy temat od czytelnika', text: String(t.title || '').replace(/^Błąd w artykule:\s*/i, ''), href: '/zgloszenia', done: !!t.status && t.status !== 'new' };
      });
    }).catch(function () { return []; });
    var ads = api('/admin/spot').then(function (d) {
      return ((d && d.ads) || []).map(function (a) {
        return { id: 'a:' + a.id, at: tms(a.at), kind: 'ad', title: 'Nowa reklama do sprawdzenia', text: (a.brand || a.name || 'Reklama') + (a.status && a.status !== 'new' ? ' · ' + ({ done: 'przyjęta', rejected: 'odrzucona' }[a.status] || a.status) : ''), href: '/reklamy', done: a.status && a.status !== 'new' };
      });
    }).catch(function () { return []; });
    return Promise.all([tips, ads]).then(function (r) {
      var list = r[0].concat(r[1]).filter(function (x) { return x.at; }).sort(function (a, b) { return b.at - a.at; }).slice(0, 30);
      var first = N.known === null, fresh = [];
      if (first) N.known = {};
      list.forEach(function (x) { if (!first && !N.known[x.id] && !x.done) fresh.push(x); N.known[x.id] = 1; });
      if (first && !seen()) setSeen(Date.now() - 3 * 864e5);      // pierwsze uruchomienie: „nowe” = ostatnie 3 dni
      counts.ads = r[1].filter(function (x) { return !x.done; }).length; paintCounts();
      N.items = list; paintBell();
      fresh.slice(0, 3).forEach(alertNew);
      if (N.pop) drawPop();
    });
  }
  function unread() { var s = seen(); return N.items.filter(function (x) { return x.at > s && !x.done; }).length; }
  function paintBell() { var n = unread(); $$('[data-bell]').forEach(function (e) { e.hidden = !n; e.textContent = n > 9 ? '9+' : n; }); }
  function icon(x) { return x.kind === 'ad' ? IC_AD : x.kind === 'err' ? IC_ERR : IC_TIP; }
  function alertNew(x) {
    var t = document.createElement('a'); t.className = 'toast'; t.href = x.href; t.setAttribute('data-nav', '');
    t.innerHTML = '<i>' + icon(x) + '</i><div><b>' + esc(x.title) + '</b><span>' + esc(x.text) + '</span></div>';
    $('#toasts').appendChild(t); setTimeout(function () { t.remove(); }, 9000);
    try {
      if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
        var n = new Notification(x.title, { body: x.text, icon: '/news/icons-dev/icon-192.png', tag: x.id });
        n.onclick = function () { window.focus(); go(x.href); n.close(); };
      }
    } catch (e) { /* ignoruj */ }
  }
  /* ---------- Push na telefon (działa też przy zamkniętej aplikacji) ---------- */
  var PAPI = /^(news|dev)\.sliska\.pl$/.test(location.hostname) ? 'https://api.sliska.pl/news/api' : '/news/api';
  function pushOK() { return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && location.protocol === 'https:'; }
  function pushReg() {
    return navigator.serviceWorker.register('/news/sw.js', { scope: '/news/' }).then(function (reg) {
      if (reg.active) return reg;
      var w = reg.installing || reg.waiting;
      return new Promise(function (ok, no) {
        if (!w) { no(new Error('Nie udało się uruchomić usługi powiadomień.')); return; }
        var t = setTimeout(function () { no(new Error('Usługa powiadomień nie wystartowała. Spróbuj jeszcze raz.')); }, 15000);
        w.addEventListener('statechange', function () { if (w.state === 'activated') { clearTimeout(t); ok(reg); } else if (w.state === 'redundant') { clearTimeout(t); no(new Error('Usługa powiadomień została odrzucona.')); } });
      });
    });
  }
  function pushState() { if (!pushOK() || Notification.permission !== 'granted') return Promise.resolve(false); return navigator.serviceWorker.getRegistration('/news/').then(function (r) { return r ? r.pushManager.getSubscription() : null; }).then(function (sb) { return !!sb; }).catch(function () { return false; }); }
  function b64key(b) { var pad = '='.repeat((4 - b.length % 4) % 4), raw = atob((b + pad).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(raw, function (c) { return c.charCodeAt(0); }); }
  function pushPost(path, ep) { return token().then(function (t) { return fetch(PAPI + '/push/' + path, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + t }, body: JSON.stringify({ endpoint: ep }) }); }); }
  function pushOn() {
    return fetch(PAPI + '/push/key').then(function (r) { return r.ok ? r.json() : null; }).then(function (k) {
      if (!k || !k.key) throw new Error('Powiadomienia są chwilowo niedostępne.');
      return Notification.requestPermission().then(function (perm) {
        if (perm !== 'granted') throw new Error('Powiadomienia są zablokowane – włącz je w ustawieniach telefonu dla tej aplikacji.');
        return pushReg();
      }).then(function (reg) { return reg.pushManager.getSubscription().then(function (sb) { return sb || reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64key(k.key) }); }); });
    }).then(function (sb) { return pushPost('subscribe', sb.endpoint).then(function (r) { if (!r.ok) throw new Error('Nie udało się włączyć powiadomień. Spróbuj później.'); }); });
  }
  function pushOff() {
    return navigator.serviceWorker.getRegistration('/news/').then(function (r) { return r ? r.pushManager.getSubscription() : null; }).then(function (sb) {
      if (!sb) return; var ep = sb.endpoint;
      return sb.unsubscribe().catch(function () {}).then(function () { return pushPost('unsubscribe', ep).catch(function () {}); });
    });
  }
  function toast(msg) { N.msg = msg; if (N.pop) drawPop(); }
  function toastOld(msg) {
    var t = document.createElement('div'); t.className = 'toast'; t.innerHTML = '<i></i><div><b></b></div>'; t.querySelector('b').textContent = msg;
    var h = $('#toasts'); if (!h) return; h.appendChild(t); setTimeout(function () { t.remove(); }, 6000);
  }
  function drawPop() {
    var s = seen();
    var perm = 'Notification' in window ? Notification.permission : 'unsupported';
    N.pop.innerHTML = '<div class="npop-h"><b>Powiadomienia</b><button type="button" data-n-all>Oznacz jako przeczytane</button></div>' +
      '<div class="npop-l">' + (N.items.length ? N.items.map(function (x) {
        return '<a class="ni' + (x.at > s && !x.done ? ' new' : '') + '" href="' + x.href + '" data-nav><i>' + icon(x) + '</i><div><b>' + esc(x.title) + '</b><span>' + esc(x.text) + '</span><small>' + ago(new Date(x.at).toISOString()) + '</small></div></a>';
      }).join('') : '<p class="empty">Na razie nic nowego.</p>') + '</div>' +
      '<div class="npop-f"><small style="opacity:.6">build ' + BUILD + ' · ' + document.documentElement.getAttribute('data-vp') + '</small><br>' + (N.msg ? '<b style="color:var(--accent)">' + esc(N.msg) + '</b><br>' : '') + 'Nowe tematy, zgłoszone błędy, reklamy i poczta.' + (!pushOK() ? '<br>Na iPhonie: otwórz stronę z ikony na ekranie początkowym, żeby włączyć powiadomienia.' : perm === 'denied' ? '<br>Powiadomienia są zablokowane w ustawieniach telefonu dla tej aplikacji.' : '<button class="btn btn-sm" type="button" data-n-perm>' + (N.pushOn ? 'Wyłącz powiadomienia na tym telefonie' : 'Włącz powiadomienia na tym telefonie') + '</button>') + '</div>';
    if (pushOK() && N.pushOn === undefined) { N.pushOn = null; pushState().then(function (v) { N.pushOn = v; if (N.pop) drawPop(); }); }
  }
  function closeNotes() { if (N.pop) { N.pop.remove(); N.pop = null; } }
  function openNotes(btn) {
    if (N.pop) { closeNotes(); return; }
    N.pop = document.createElement('div'); N.pop.className = 'npop'; N.pop.setAttribute('role', 'dialog'); N.pop.setAttribute('aria-label', 'Powiadomienia');
    drawPop(); document.body.appendChild(N.pop);
    var b = btn.getBoundingClientRect();
    var left = Math.min(Math.max(12, b.left), innerWidth - N.pop.offsetWidth - 12);
    N.pop.style.left = left + 'px'; N.pop.style.top = (b.bottom + 8) + 'px';
    N.pop.addEventListener('click', function (e) {
      if (e.target.closest('[data-n-all]')) { setSeen(Date.now()); paintBell(); drawPop(); return; }
      if (e.target.closest('[data-n-perm]')) {
        var pb = e.target.closest('[data-n-perm]'); pb.disabled = true; N.msg = 'Włączam… (może potrwać kilka sekund)';
        (N.pushOn ? pushOff() : pushOn()).then(function () { return pushState(); }).then(function (v) { N.pushOn = v; try { toast(v ? 'Gotowe! Dostaniesz powiadomienia na ten telefon.' : 'Powiadomienia wyłączone.'); } catch (x) { /* ignoruj */ } })
          .catch(function (er) { try { toast((er && er.message) || 'Nie udało się zmienić powiadomień.'); } catch (x) { /* ignoruj */ } }).then(function () { if (N.pop) drawPop(); });
        return;
      }
      if (e.target.closest('a')) { setSeen(Date.now()); paintBell(); setTimeout(closeNotes, 0); }
    });
    loadNotes();
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act="bell"]');
    if (b) { e.stopPropagation(); openNotes(b); return; }
    if (N.pop && !N.pop.contains(e.target)) closeNotes();
  });
  function startNotes() {
    if (!can('owner')) return;
    loadNotes();
    clearInterval(N.timer); N.timer = setInterval(loadNotes, 90000);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') loadNotes(); });
  }

  /* ---------- Start po zalogowaniu ---------- */
  function token() { return window.devToken ? window.devToken() : Promise.reject(new Error('no-token')); }
  function api(path) { return token().then(function (t) { return fetch((/^(news|dev)\.sliska\.pl$/.test(location.hostname) ? 'https://api.sliska.pl' : '/news/api') + path, { headers: { authorization: 'Bearer ' + t }, cache: 'no-store' }); }).then(function (r) { return r.ok ? r.json() : null; }); }
  function setMe(name, avatar) {
    name = String(name || '').trim(); if (!name) return;
    me.full = name;
    $('#me-name').textContent = name;
    $('#me-av').innerHTML = avatar && /^(https?:|data:image\/)/.test(avatar) ? '<img src="' + esc(avatar) + '" alt="">' : esc(name.split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase());
    if (cur && cur.k === 'pulpit') $('#hello').textContent = 'Cześć, ' + name + '!';
  }
  function start(info) {
    role = window.devRole || (GATE ? '' : 'owner');
    crown = !!(info && info.crown) || role === 'mod';
    applyRole();
    var leg = legacy();
    if (leg) history.replaceState(null, '', leg);
    show();
    // imię i nazwisko z profilu redaktora (podpis pod artykułami); bez profilu – nazwa konta
    api('/ed/profile').then(function (d) { var p = d && d.profile; if (p && p.name) setMe(p.name, p.avatar); }).catch(function () { /* ignoruj */ });
    api('/me').then(function (d) { if (d && d.name && !me.full) setMe(d.name, ''); }).catch(function () { /* ignoruj */ });
    if (can('owner')) api('/admin/mailbox?count=1').then(function (d) { if (d) { counts.mail = d.unread || 0; paintCounts(); } }).catch(function () { /* ignoruj */ });
    startNotes();
    // studio w tle: liczniki w menu i na pulpicie, a potem natychmiastowe przejścia
    setTimeout(function () { if (!frames.studio) frame('studio', '#/panel'); }, 400);
  }
  if (!GATE) start(null);
  else if (window.devRole !== undefined && window.devInfo) start(window.devInfo);
  else window.addEventListener('devgate', function (e) { start(e.detail && e.detail.info); }, { once: true });
})();
