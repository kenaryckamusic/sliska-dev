/* Śliska News – Śliskie Gry (#/gry). Gry działają w przeglądarce; rekordy zapisują się na urządzeniu
   (ranking i XP dojdą razem z poziomami). Wywołanie: SliskieGry.mount(el, sub, { articles }). */
(function () {
  'use strict';
  var KEY = 'sn-gry';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var K = function (slug, cls) { return window.Knaga ? Knaga.svg(slug, { cls: cls || 'gk' }) : ''; };
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* ignoruj */ } }
  function best(game) { return (load().best || {})[game] || 0; }
  function setBest(game, v) { var d = load(); d.best = d.best || {}; var nb = v > (d.best[game] || 0); if (nb) d.best[game] = v; d.played = (d.played || 0) + 1; save(d); return nb; }
  function xp(kind) { if (window.SnXP) SnXP.earn(kind); }
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var stopFns = [];
  function stopAll() { stopFns.forEach(function (f) { try { f(); } catch (e) { /* ignoruj */ } }); stopFns = []; }
  function dayIndex() { var d = new Date(); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 10, 1)) / 864e5); }

  /* Knaga jako obrazek do canvas */
  var imgCache = {};
  function knagaImg(slug) {
    if (imgCache[slug]) return imgCache[slug];
    var im = new Image(); var svg = K(slug).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" ');
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    return (imgCache[slug] = im);
  }

  var GAMES = [
    { id: 'slizgle', name: 'Ślizgle', knaga: 'redaktor', sub: 'Codzienne słowo ze sceny. 6 prób.', tag: 'Codzienna', kind: 'daily' },
    { id: 'krople', name: 'Łap Krople', knaga: 'kapiel', sub: 'Łap krople, unikaj pozwów.', tag: 'Zręcznościowa', unit: 'pkt' },
    { id: 'flappy', name: 'Knaga Flappy', knaga: 'super', sub: 'Leć między mikrofonami.', tag: 'Zręcznościowa', unit: 'pkt' },
    { id: 'waz', name: 'Śliski Wąż', knaga: 'diabelek', sub: 'Zbieraj mikrofony, nie gryź się w ogon.', tag: 'Klasyk', unit: 'pkt' },
    { id: 'ukladanka', name: 'Śliska Układanka', knaga: 'detektyw', sub: 'Ułóż zdjęcie z artykułu.', tag: 'Logiczna', unit: 'ruchów', low: true },
    { id: 'drama', name: 'Drama Simulator', knaga: 'wsciekla', sub: 'Jesteś w środku afery. Co robisz?', tag: 'Fabularna', kind: 'story' },
    { id: 'krzyzowka', name: 'Krzyżówka Tygodnia', knaga: 'szlafrok', sub: 'Odgadnij wyrazy, odkryj hasło.', tag: 'Co tydzień', kind: 'weekly' },
    { id: 'slizgawka', name: 'Ślizgawka', knaga: 'surfer', sub: 'Tajna gra. Skacz nad przeszkodami.', tag: 'Sekret', unit: 'm', secret: true }
  ];
  var unlocked = function () { return !!load().slizgawka; };

  /* ================= HUB ================= */
  function hub(el) {
    var d = load(), hidden = !unlocked();
    el.innerHTML = '<div class="gry">' +
      '<header class="gry-hero"><div class="gry-hero-t"><span class="gry-eyebrow">Nowość</span><h1>Śliskie Gry</h1><p>Codzienne wyzwania, zręcznościówki i drama do rozegrania. Rekordy zapisują się na tym urządzeniu, a zalogowani zbierają za gry punkty XP do <a href="#/sezon">rankingu sezonu</a>.</p>' +
      '<div class="gry-stats"><span><b>' + (d.played || 0) + '</b> rozegranych</span><span><b>' + Object.keys(d.best || {}).length + '</b> rekordów</span><a class="btn btn-sm" href="#/sezon">Ranking sezonu →</a></div></div>' +
      '<button type="button" class="gry-hero-k" id="gry-hero-k" aria-label="Knaga">' + K('imprezowa', 'gk gk-hero') + '</button></header>' +
      '<div class="gry-grid">' + GAMES.filter(function (g) { return !g.secret || !hidden; }).map(function (g) {
        var b = best(g.id), sl = g.id === 'slizgle' ? slizgleDone() : null;
        var meta = g.kind === 'weekly' ? (krzDone() ? 'Rozwiązana ✓ · nowa w poniedziałek' : 'Nowa w każdy poniedziałek') : g.kind === 'daily' ? (sl ? 'Dziś: ' + sl : 'Nowe słowo codziennie o północy') : g.kind === 'story' ? ((d.endings || []).length + '/4 zakończeń') : (b ? 'Rekord: ' + b + ' ' + g.unit : 'Bez rekordu – zagraj!');
        return '<a class="gry-tile' + (g.soon ? ' is-soon' : '') + (g.secret ? ' is-secret' : '') + '" ' + (g.soon ? 'aria-disabled="true"' : 'href="#/gry/' + g.id + '"') + '>' +
          '<span class="gry-tile-k">' + K(g.knaga) + '</span><span class="gry-tile-t"><span class="gry-tag">' + g.tag + '</span><b>' + g.name + '</b><small>' + g.sub + '</small><em>' + meta + '</em></span></a>';
      }).join('') + '</div>' +
      (hidden ? '<p class="gry-hint">Psst… ponoć jest tu jeszcze jedna, ukryta gra. Knaga coś wie.</p>' : '') + '</div>';
    var clicks = 0, kb = $('#gry-hero-k', el);
    kb.addEventListener('click', function () {
      clicks++; kb.classList.remove('is-poke'); void kb.offsetWidth; kb.classList.add('is-poke');
      if (clicks >= 5 && hidden) { var x = load(); x.slizgawka = 1; save(x); toast('Odkryłeś Ślizgawkę! 🏄'); location.hash = '#/gry/slizgawka'; }
    });
  }
  function toast(t) { var n = document.createElement('div'); n.className = 'gry-toast'; n.textContent = t; document.body.appendChild(n); setTimeout(function () { n.classList.add('out'); }, 2200); setTimeout(function () { n.remove(); }, 2700); }
  function shell(el, g, inner) {
    el.innerHTML = '<div class="gry gry-play"><div class="gry-top"><a class="btn btn-sm" href="#/gry">← Gry</a><h1>' + g.name + '</h1>' +
      (g.unit ? '<span class="gry-best">Rekord: <b id="gry-best">' + (best(g.id) || '–') + '</b></span>' : '<span></span>') + '</div>' + inner + '</div>';
  }

  /* ============== ŚLIZGLE (codzienne słowo) ============== */
  var WORDS = ['KNAGA', 'DRAMA', 'ALBUM', 'SCENA', 'RAPER', 'WERSY', 'KLIPY', 'RYTMY', 'NUTKA', 'TRASA', 'PŁYTA', 'MUZYK', 'TEKST', 'SAMPL', 'WINYL', 'AFERA', 'WTOPA', 'MOKRO', 'ŚLIZG', 'SŁAWA', 'FLESZ', 'DISSY', 'FEATY', 'MIKSY', 'KLUBY', 'FANKA', 'PERKA', 'LIRYK', 'GRAMY', 'SCENY', 'HITEM'];
  var KB = ['ĄĆĘŁŃÓŚŹŻ', 'QWERTYUIOP', 'ASDFGHJKL', '⏎ZXCVBNM⌫'];
  function slizgleKey() { return 'sn-slizgle-' + dayIndex(); }
  function slizgleDone() { try { var s = JSON.parse(localStorage.getItem(slizgleKey())); return s && s.end ? (s.win ? s.rows.length + '/6 ✓' : 'X/6') : null; } catch (e) { return null; } }
  function slizgle(el) {
    var g = GAMES[0], answer = WORDS[((dayIndex() % WORDS.length) + WORDS.length) % WORDS.length], st;
    try { st = JSON.parse(localStorage.getItem(slizgleKey())) || null; } catch (e) { st = null; }
    st = st || { rows: [], end: false, win: false };
    var cur = '';
    shell(el, g, '<p class="gry-lead">Zgadnij dzisiejsze słowo z 5 liter. Kolory: <span class="sz-k sz-ok">zielony</span> – dobra litera i miejsce, <span class="sz-k sz-in">żółty</span> – litera jest w innym miejscu, <span class="sz-k sz-no">szary</span> – nie ma jej. Nowe słowo o północy.</p>' +
      '<div class="sz-board" id="sz-board"></div><p class="sz-msg" id="sz-msg" role="status"></p><div class="sz-kb" id="sz-kb"></div>');
    function score(w) {
      var res = Array(5).fill('no'), a = answer.split(''), used = Array(5).fill(false);
      w.split('').forEach(function (c, i) { if (c === a[i]) { res[i] = 'ok'; used[i] = true; } });
      w.split('').forEach(function (c, i) { if (res[i] === 'ok') return; var j = a.findIndex(function (x, k) { return x === c && !used[k]; }); if (j >= 0) { res[i] = 'in'; used[j] = true; } });
      return res;
    }
    function draw() {
      var rows = '';
      for (var r = 0; r < 6; r++) {
        var w = st.rows[r] || (r === st.rows.length ? cur : ''), sc = st.rows[r] ? score(st.rows[r]) : null;
        rows += '<div class="sz-row">' + [0, 1, 2, 3, 4].map(function (i) { return '<span class="sz-c' + (sc ? ' sz-' + sc[i] : w[i] ? ' sz-f' : '') + '">' + (w[i] || '') + '</span>'; }).join('') + '</div>';
      }
      $('#sz-board').innerHTML = rows;
      var stt = {};
      st.rows.forEach(function (w) { score(w).forEach(function (s, i) { var c = w[i], o = stt[c]; if (s === 'ok' || (s === 'in' && o !== 'ok') || (!o)) stt[c] = o === 'ok' ? 'ok' : (o === 'in' && s === 'no') ? 'in' : s; }); });
      $('#sz-kb').innerHTML = KB.map(function (row) { return '<div class="sz-kr">' + row.split('').map(function (c) { var w = c === '⏎' || c === '⌫'; return '<button type="button" class="sz-key' + (w ? ' is-wide' : '') + (stt[c] ? ' sz-' + stt[c] : '') + '" data-k="' + c + '" aria-label="' + (c === '⏎' ? 'Zatwierdź' : c === '⌫' ? 'Usuń' : c) + '">' + c + '</button>'; }).join('') + '</div>'; }).join('');
      if (st.end) {
        var share = 'Ślizgle #' + (dayIndex() + 1) + ' ' + (st.win ? st.rows.length : 'X') + '/6\n' + st.rows.map(function (w) { return score(w).map(function (s) { return s === 'ok' ? '🟩' : s === 'in' ? '🟨' : '⬛'; }).join(''); }).join('\n') + '\nnews.sliska.pl/#/gry/slizgle';
        $('#sz-msg').innerHTML = (st.win ? '<b>Mokro! Zgadłeś w ' + st.rows.length + ' ' + (st.rows.length === 1 ? 'próbie' : 'próbach') + '.</b>' : 'Tym razem sucho. Słowo dnia: <b>' + answer + '</b>.') +
          ' <button type="button" class="btn btn-sm btn-primary" id="sz-share">Udostępnij wynik</button>';
        $('#sz-share').onclick = function () { if (navigator.share) navigator.share({ text: share }).catch(function () {}); else navigator.clipboard.writeText(share).then(function () { toast('Skopiowano wynik'); }); };
      }
    }
    function press(k) {
      if (st.end) return;
      if (k === '⌫' || k === 'Backspace') cur = cur.slice(0, -1);
      else if (k === '⏎' || k === 'Enter') {
        if (cur.length < 5) { $('#sz-msg').textContent = 'Za mało liter.'; return; }
        st.rows.push(cur); cur = '';
        if (st.rows[st.rows.length - 1] === answer) { st.end = true; st.win = true; setBest('slizgle', 7 - st.rows.length); xp('slizgle'); }
        else if (st.rows.length >= 6) { st.end = true; setBest('slizgle', 0); xp('game'); }
        $('#sz-msg').textContent = '';
        try { localStorage.setItem(slizgleKey(), JSON.stringify(st)); } catch (e) { /* ignoruj */ }
      } else if (/^[A-ZĄĆĘŁŃÓŚŹŻ]$/i.test(k) && cur.length < 5) cur += k.toUpperCase();
      draw();
    }
    $('#sz-kb').addEventListener('click', function (e) { var b = e.target.closest('[data-k]'); if (b) press(b.dataset.k); });
    var onKey = function (e) { if (e.ctrlKey || e.metaKey || e.altKey) return; if (e.key === 'Enter' || e.key === 'Backspace' || /^[a-ząćęłńóśźż]$/i.test(e.key)) { e.preventDefault(); press(e.key); } };
    document.addEventListener('keydown', onKey); stopFns.push(function () { document.removeEventListener('keydown', onKey); });
    draw();
  }

  /* ============== wspólny silnik canvas ============== */
  function canvasGame(el, g, opts) {
    shell(el, g, '<div class="gry-stage"><canvas id="gry-cv"></canvas><div class="gry-over" id="gry-over"></div><div class="gry-hud"><span id="gry-score">0</span>' + (opts.lives ? '<span id="gry-lives"></span>' : '') + '</div></div><p class="gry-help">' + opts.help + '</p>');
    var cv = $('#gry-cv'), ctx = cv.getContext('2d'), W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), raf = 0, last = 0, running = false;
    function size() { var r = cv.parentNode.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); var ro = new ResizeObserver(size); ro.observe(cv.parentNode);
    var api = {
      ctx: ctx, get W() { return W; }, get H() { return H; }, score: 0,
      setScore: function (v) { api.score = v; $('#gry-score').textContent = v + (g.unit ? ' ' + g.unit : ''); },
      setLives: function (n) { var l = $('#gry-lives'); if (l) l.textContent = '💧'.repeat(Math.max(0, n)); },
      over: function () {
        running = false; cancelAnimationFrame(raf);
        var nb = setBest(g.id, api.score); $('#gry-best').textContent = best(g.id) || '–';
        if (api.score > 0) { xp('game'); if (nb) xp('record'); }
        menu((nb ? '<b class="gry-new">Nowy rekord!</b>' : '') + '<h2>' + api.score + ' ' + (g.unit || '') + '</h2><p>' + (opts.endText ? opts.endText(api.score) : '') + '</p>', 'Jeszcze raz', g.knaga);
      }
    };
    function menu(html, btn, slug) {
      var o = $('#gry-over'); o.hidden = false;
      o.innerHTML = '<div class="gry-menu">' + K(slug || g.knaga, 'gk gk-menu') + html + '<button type="button" class="btn btn-primary" id="gry-go">' + btn + '</button></div>';
      $('#gry-go').onclick = start; $('#gry-go').focus();
    }
    function start() { $('#gry-over').hidden = true; api.setScore(0); opts.reset(api); running = true; last = performance.now(); raf = requestAnimationFrame(loop); cv.focus && cv.focus(); }
    function loop(t) { if (!running) return; var dt = Math.min(0.034, (t - last) / 1000); last = t; opts.step(api, dt); opts.draw(api); raf = requestAnimationFrame(loop); }
    menu('<h2>' + g.name + '</h2><p>' + opts.intro + '</p>', 'Graj');
    opts.init && opts.init(api, cv);
    opts.reset(api); opts.draw(api);
    stopFns.push(function () { running = false; cancelAnimationFrame(raf); ro.disconnect(); opts.destroy && opts.destroy(); });
    return api;
  }
  function drawK(ctx, img, x, y, s, rot) { if (!img.complete) return; ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.drawImage(img, -s / 2, -s / 2, s, s); ctx.restore(); }
  function dropPath(ctx, x, y, r, c) { ctx.beginPath(); ctx.moveTo(x, y - r * 1.5); ctx.bezierCurveTo(x + r * .7, y - r * .5, x + r, y, x + r, y + r * .35); ctx.arc(x, y + r * .35, r, 0, Math.PI); ctx.bezierCurveTo(x - r, y, x - r * .7, y - r * .5, x, y - r * 1.5); ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#2a1620'; ctx.stroke(); }

  /* ============== ŁAP KROPLE ============== */
  function krople(el) {
    var img = knagaImg('kapiel'), P, items, t, lives, spawn, keys = {};
    var g = GAMES[1];
    var game = canvasGame(el, g, {
      lives: true, intro: 'Przesuwaj Knagę palcem albo strzałkami. Łap krople 💧 (złota = +5), unikaj pozwów 📄. Masz 3 życia.',
      help: 'Komputer: ← → albo mysz. Telefon: przesuwaj palcem po planszy.',
      endText: function (s) { return s > 60 ? 'Wanna pełna. Mokro jak nigdy!' : s > 25 ? 'Nieźle się zmoczyło.' : 'Ledwo wilgotno… spróbuj jeszcze raz.'; },
      init: function (a, cv) {
        var mv = function (e) { var r = cv.getBoundingClientRect(); P.tx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left; };
        cv.addEventListener('pointermove', mv); cv.addEventListener('touchmove', function (e) { mv(e); e.preventDefault(); }, { passive: false });
        var kd = function (e) { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { keys[e.key] = e.type === 'keydown'; e.preventDefault(); } };
        document.addEventListener('keydown', kd); document.addEventListener('keyup', kd);
        stopFns.push(function () { document.removeEventListener('keydown', kd); document.removeEventListener('keyup', kd); });
      },
      reset: function (a) { P = { x: a.W / 2, tx: a.W / 2 }; items = []; t = 0; lives = 3; spawn = 0; a.setLives(lives); },
      step: function (a, dt) {
        t += dt; spawn -= dt;
        if (keys.ArrowLeft) P.tx = P.x - 400 * dt * 3; if (keys.ArrowRight) P.tx = P.x + 400 * dt * 3;
        P.tx = Math.max(40, Math.min(a.W - 40, P.tx)); P.x += (P.tx - P.x) * Math.min(1, dt * 14);
        var speed = 150 + t * 7;
        if (spawn <= 0) { spawn = Math.max(.28, .9 - t * .012); var r = Math.random(); items.push({ x: 24 + Math.random() * (a.W - 48), y: -20, k: r < .22 ? 'bad' : r < .3 ? 'gold' : 'drop', v: speed * (.8 + Math.random() * .5) }); }
        var py = a.H - 70;
        items.forEach(function (it) { it.y += it.v * dt; if (!it.hit && it.y > py - 30 && it.y < py + 20 && Math.abs(it.x - P.x) < 46) { it.hit = true; if (it.k === 'bad') { lives--; a.setLives(lives); if (lives <= 0) a.over(); } else a.setScore(a.score + (it.k === 'gold' ? 5 : 1)); } });
        items = items.filter(function (it) { return !it.hit && it.y < a.H + 30; });
      },
      draw: function (a) {
        var c = a.ctx, W = a.W, H = a.H, gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#d9f3ff'); gr.addColorStop(1, '#7fcbf2'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(255,255,255,.35)'; for (var i = 0; i < 6; i++) { c.beginPath(); c.arc((i * 137 + t * 20) % (W + 60) - 30, 40 + (i % 3) * 50, 26, 0, 7); c.fill(); }
        items.forEach(function (it) {
          if (it.k === 'bad') { c.save(); c.translate(it.x, it.y); c.rotate(Math.sin(it.y / 20) * .3); c.fillStyle = '#fff'; c.strokeStyle = '#2a1620'; c.lineWidth = 2.5; c.beginPath(); c.roundRect(-13, -16, 26, 32, 3); c.fill(); c.stroke(); c.fillStyle = '#d6001c'; c.font = 'bold 9px Arial'; c.textAlign = 'center'; c.fillText('POZEW', 0, -4); c.fillRect(-8, 3, 16, 2); c.fillRect(-8, 8, 12, 2); c.restore(); }
          else dropPath(c, it.x, it.y, it.k === 'gold' ? 11 : 9, it.k === 'gold' ? '#ffcf4a' : '#3fb6f2');
        });
        drawK(c, img, P.x, H - 70, 110);
      }
    });
    return game;
  }

  /* ============== KNAGA FLAPPY ============== */
  function flappy(el) {
    var img = knagaImg('super'), B, pipes, t, gap = 170, started;
    var g = GAMES[2];
    canvasGame(el, g, {
      intro: 'Stuknij, kliknij albo spacja, żeby Knaga podleciała. Przelatuj między mikrofonami.', help: 'Spacja, kliknięcie albo stuknięcie = machnięcie peleryną.',
      endText: function (s) { return s >= 20 ? 'Super Knaga to Ty!' : s >= 8 ? 'Lata całkiem sprawnie.' : 'Peleryna się zaplątała.'; },
      init: function (a, cv) {
        var flap = function (e) { if (e && e.type === 'keydown' && e.code !== 'Space') return; if (e) e.preventDefault && e.type === 'keydown' && e.preventDefault(); if (B) B.vy = -330; };
        cv.addEventListener('pointerdown', flap); document.addEventListener('keydown', flap);
        stopFns.push(function () { document.removeEventListener('keydown', flap); });
      },
      reset: function (a) { B = { x: a.W * .3, y: a.H * .45, vy: -200 }; pipes = []; t = 0; started = true; },
      step: function (a, dt) {
        t += dt; B.vy += 900 * dt; B.y += B.vy * dt;
        var sp = 150 + Math.min(80, a.score * 3);
        if (!pipes.length || pipes[pipes.length - 1].x < a.W - 230) { var gp = Math.max(130, gap - a.score * 2); pipes.push({ x: a.W + 40, top: 60 + Math.random() * (a.H - 120 - gp), gp: gp }); }
        pipes.forEach(function (p) { p.x -= sp * dt; if (!p.pass && p.x + 30 < B.x) { p.pass = true; a.setScore(a.score + 1); } if (B.x + 26 > p.x - 30 && B.x - 26 < p.x + 30 && (B.y - 28 < p.top || B.y + 28 > p.top + p.gp)) a.over(); });
        pipes = pipes.filter(function (p) { return p.x > -60; });
        if (B.y > a.H - 20 || B.y < -40) a.over();
      },
      draw: function (a) {
        var c = a.ctx, W = a.W, H = a.H, gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2b1b4a'); gr.addColorStop(1, '#d6001c'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(255,255,255,.6)'; for (var i = 0; i < 30; i++) c.fillRect((i * 97 - t * 10) % W + (i * 97 - t * 10 < 0 ? W : 0), (i * 53) % (H * .6), 2, 2);
        (pipes || []).forEach(function (p) {
          [[0, p.top, true], [p.top + p.gp, H - p.top - p.gp, false]].forEach(function (s) {
            c.fillStyle = '#e6e8ee'; c.strokeStyle = '#2a1620'; c.lineWidth = 3; c.beginPath(); c.roundRect(p.x - 22, s[0], 44, s[1], 8); c.fill(); c.stroke();
            var hy = s[2] ? s[0] + s[1] - 34 : s[0]; c.fillStyle = '#4a4f5c'; c.beginPath(); c.roundRect(p.x - 32, hy, 64, 34, 16); c.fill(); c.stroke();
            c.strokeStyle = 'rgba(255,255,255,.35)'; for (var k = 6; k < 30; k += 7) { c.beginPath(); c.moveTo(p.x - 26, hy + k); c.lineTo(p.x + 26, hy + k); c.stroke(); }
          });
        });
        if (B) drawK(c, img, B.x, B.y, 80, Math.max(-.5, Math.min(.7, B.vy / 600)));
      }
    });
  }

  /* ============== ŚLISKI WĄŻ ============== */
  function waz(el) {
    var head = knagaImg('ikona'), S, dir, nd, food, acc, N = 17;
    var g = GAMES[3];
    canvasGame(el, g, {
      intro: 'Strzałki/WASD albo przesuwanie palcem. Zbieraj mikrofony 🎤, każdy wydłuża węża.', help: 'Komputer: strzałki lub WASD. Telefon: przesuń palcem w stronę, w którą ma skręcić.',
      endText: function (s) { return s >= 25 ? 'Wąż długi jak lista featów.' : 'Ugryzł się w ogon. Klasyka.'; },
      init: function (a, cv) {
        var map = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
        var kd = function (e) { var m = map[e.key]; if (m && !(m[0] === -dir[0] && m[1] === -dir[1])) { nd = m; e.preventDefault(); } };
        document.addEventListener('keydown', kd);
        var sx, sy; cv.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
        cv.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
        cv.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return; var m = Math.abs(dx) > Math.abs(dy) ? [dx > 0 ? 1 : -1, 0] : [0, dy > 0 ? 1 : -1]; if (!(m[0] === -dir[0] && m[1] === -dir[1])) nd = m; });
        stopFns.push(function () { document.removeEventListener('keydown', kd); });
      },
      reset: function (a) { S = [[8, 8], [7, 8], [6, 8]]; dir = [1, 0]; nd = dir; acc = 0; place(); },
      step: function (a, dt) {
        acc += dt; var stepT = Math.max(.07, .16 - a.score * .003); if (acc < stepT) return; acc = 0; dir = nd;
        var h = [S[0][0] + dir[0], S[0][1] + dir[1]];
        if (h[0] < 0 || h[1] < 0 || h[0] >= N || h[1] >= N || S.some(function (p) { return p[0] === h[0] && p[1] === h[1]; })) return a.over();
        S.unshift(h); if (h[0] === food[0] && h[1] === food[1]) { a.setScore(a.score + 1); place(); } else S.pop();
      },
      draw: function (a) {
        var c = a.ctx, sz = Math.floor(Math.min(a.W, a.H) / N), ox = (a.W - sz * N) / 2, oy = (a.H - sz * N) / 2;
        c.fillStyle = '#1a0a12'; c.fillRect(0, 0, a.W, a.H);
        for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) { c.fillStyle = (x + y) % 2 ? '#2a1020' : '#24101b'; c.fillRect(ox + x * sz, oy + y * sz, sz, sz); }
        c.font = Math.floor(sz * .8) + 'px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🎤', ox + food[0] * sz + sz / 2, oy + food[1] * sz + sz / 2 + 1);
        S.forEach(function (p, i) { if (!i) return; c.fillStyle = i % 2 ? '#f5b896' : '#ffd8c2'; c.strokeStyle = '#2a1620'; c.lineWidth = 2; c.beginPath(); c.roundRect(ox + p[0] * sz + 2, oy + p[1] * sz + 2, sz - 4, sz - 4, sz / 3); c.fill(); c.stroke(); });
        drawK(c, head, ox + S[0][0] * sz + sz / 2, oy + S[0][1] * sz + sz / 2, sz * 1.7, Math.atan2(dir[1], dir[0]) + Math.PI / 2);
      }
    });
    function place() { do { food = [Math.floor(Math.random() * N), Math.floor(Math.random() * N)]; } while (S.some(function (p) { return p[0] === food[0] && p[1] === food[1]; })); }
  }

  /* ============== ŚLIZGAWKA (sekret) ============== */
  function slizgawka(el) {
    var img = knagaImg('surfer'), P, obs, t, dist;
    var g = GAMES[7];
    canvasGame(el, g, {
      intro: 'Knaga zjeżdża po fali. Stuknij albo spacja, żeby przeskoczyć pozwy, dissy i fejki. Dwa stuknięcia = podwójny skok.', help: 'Spacja / stuknięcie = skok (można dwa razy w powietrzu).',
      endText: function (s) { return s > 800 ? 'Legenda fali.' : s > 300 ? 'Ładnie się ślizga.' : 'Wywrotka na pierwszej fali.'; },
      init: function (a, cv) {
        var jump = function (e) { if (e.type === 'keydown' && e.code !== 'Space') return; if (e.type === 'keydown') e.preventDefault(); if (P && P.j < 2) { P.vy = -520; P.j++; } };
        cv.addEventListener('pointerdown', jump); document.addEventListener('keydown', jump);
        stopFns.push(function () { document.removeEventListener('keydown', jump); });
      },
      reset: function (a) { P = { y: 0, vy: 0, j: 0 }; obs = []; t = 0; dist = 0; },
      step: function (a, dt) {
        t += dt; var sp = 260 + t * 9; dist += sp * dt / 10; a.setScore(Math.floor(dist));
        var gy = a.H * .74; P.vy += 1500 * dt; P.y += P.vy * dt; if (P.y > 0) { P.y = 0; P.vy = 0; P.j = 0; }
        if (!obs.length || obs[obs.length - 1].x < a.W - (260 + Math.random() * 260)) obs.push({ x: a.W + 40, k: ['POZEW', 'DISS', 'FEJK'][Math.floor(Math.random() * 3)], h: 36 + Math.random() * 26 });
        obs.forEach(function (o) { o.x -= sp * dt; var kx = a.W * .25, ky = gy + P.y - 40; if (Math.abs(o.x - kx) < 34 && ky + 34 > gy - o.h) a.over(); });
        obs = obs.filter(function (o) { return o.x > -60; });
      },
      draw: function (a) {
        var c = a.ctx, W = a.W, H = a.H, gy = H * .74, gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#ffe7b3'); gr.addColorStop(.6, '#ffb3a1'); gr.addColorStop(1, '#ff7a8f'); c.fillStyle = gr; c.fillRect(0, 0, W, H);
        c.fillStyle = '#ffd36b'; c.beginPath(); c.arc(W * .8, H * .25, 40, 0, 7); c.fill();
        c.fillStyle = '#2f8fd8'; c.beginPath(); c.moveTo(0, gy); for (var x = 0; x <= W; x += 10) c.lineTo(x, gy + Math.sin((x + t * 300) / 40) * 6); c.lineTo(W, H); c.lineTo(0, H); c.fill();
        c.fillStyle = 'rgba(255,255,255,.6)'; for (x = 0; x <= W; x += 10) c.fillRect(x, gy + Math.sin((x + t * 300) / 40) * 6 - 2, 6, 3);
        (obs || []).forEach(function (o) { c.fillStyle = '#fff'; c.strokeStyle = '#2a1620'; c.lineWidth = 3; c.beginPath(); c.roundRect(o.x - 24, gy - o.h, 48, o.h, 6); c.fill(); c.stroke(); c.fillStyle = '#d6001c'; c.font = 'bold 11px Arial'; c.textAlign = 'center'; c.fillText(o.k, o.x, gy - o.h + 18); });
        if (P) drawK(c, img, W * .25, gy + P.y - 40, 96, P.y < 0 ? -.2 : Math.sin(t * 8) * .05);
      }
    });
  }

  /* ============== ŚLISKA UKŁADANKA ============== */
  function ukladanka(el, ctx) {
    var g = GAMES[4], arts = (ctx.articles || []).filter(function (a) { return a.image; }), N = 3, tiles, empty, moves, art, t0, timer;
    shell(el, g, '<div class="uk-bar"><div class="spf-seg uk-seg" role="group" aria-label="Poziom"><button type="button" data-n="3" class="is-on">3×3</button><button type="button" data-n="4">4×4</button></div><button type="button" class="btn btn-sm" id="uk-new">Inne zdjęcie</button><span class="uk-stat"><b id="uk-m">0</b> ruchów · <b id="uk-t">0:00</b></span></div>' +
      '<div class="uk-board" id="uk-board"></div><p class="uk-art" id="uk-art"></p>');
    function pick() { art = arts.length ? arts[Math.floor(Math.random() * Math.min(arts.length, 20))] : null; }
    function solvable(a) { var inv = 0, f = a.filter(function (x) { return x !== N * N - 1; }); for (var i = 0; i < f.length; i++) for (var j = i + 1; j < f.length; j++) if (f[i] > f[j]) inv++; if (N % 2) return inv % 2 === 0; var row = N - Math.floor(a.indexOf(N * N - 1) / N); return (inv + row) % 2 === 1; }
    function start() {
      do { tiles = Array.from({ length: N * N }, function (_, i) { return i; }).sort(function () { return Math.random() - .5; }); } while (!solvable(tiles) || tiles.every(function (v, i) { return v === i; }));
      moves = 0; t0 = 0; clearInterval(timer); $('#uk-t').textContent = '0:00'; draw();
      $('#uk-art').innerHTML = art ? 'Zdjęcie z artykułu: <a href="#/artykul/' + encodeURIComponent(art.id) + '">' + esc(art.title) + '</a>' : 'Brak zdjęć z artykułów – gramy na Knadze.';
    }
    function draw() {
      var src = art ? art.image : 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(K('ziomek').replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ').replace('class="gk"', 'style="background:#ffe3d6"'));
      var b = $('#uk-board'); b.style.setProperty('--n', N);
      b.innerHTML = tiles.map(function (v, i) {
        if (v === N * N - 1) return '<span class="uk-t is-empty"></span>';
        var x = v % N, y = Math.floor(v / N);
        return '<button type="button" class="uk-t" data-i="' + i + '" style="background-image:url(\'' + src + '\');background-size:' + N * 100 + '% ' + N * 100 + '%;background-position:' + (x * 100 / (N - 1)) + '% ' + (y * 100 / (N - 1)) + '%"><i>' + (v + 1) + '</i></button>';
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
        clearInterval(timer); var d = load(); d.best = d.best || {}; var k = 'ukladanka', nb = !d.best[k] || moves < d.best[k]; if (nb) d.best[k] = moves; d.played = (d.played || 0) + 1; save(d);
        $('#gry-best').textContent = d.best[k]; xp('game'); if (nb) xp('record');
        $('#uk-board').classList.add('is-done'); toast(nb ? 'Ułożone! Nowy rekord: ' + moves + ' ruchów' : 'Ułożone w ' + moves + ' ruchach!');
      }
    });
    el.querySelector('.uk-seg').addEventListener('click', function (e) { var b = e.target.closest('[data-n]'); if (!b) return; N = +b.dataset.n; [].forEach.call(this.children, function (x) { x.classList.toggle('is-on', x === b); }); $('#uk-board').classList.remove('is-done'); start(); });
    $('#uk-new').onclick = function () { pick(); $('#uk-board').classList.remove('is-done'); start(); };
    stopFns.push(function () { clearInterval(timer); });
    pick(); start();
  }

  /* ============== DRAMA SIMULATOR ============== */
  var STORY = {
    start: { k: 'wsciekla', t: 'Budzisz się, a na telefonie 147 powiadomień. Ktoś wrzucił nagranie, na którym na koncercie mówisz, że Twój ostatni feat „był za kasę i nawet go nie słuchałeś”. Internet płonie.', c: [['Odpisuję od razu na story. Ostro.', 'story'], ['Milczę i czekam, aż przejdzie.', 'cisza'], ['Dzwonię do menedżera.', 'menago']] },
    story: { k: 'diabelek', t: 'Wrzucasz story: „Kto ma problem, niech napisze na priv”. W 10 minut 40 tysięcy wyświetleń. Raper z featu odpowiada: „Na priv? Ty nawet beatu nie odpisałeś”.', c: [['Nagrywam diss. Dziś w nocy.', 'diss'], ['Usuwam story i udaję, że to nie ja.', 'usun']] },
    cisza: { k: 'niesmiala', t: 'Mijają 3 dni. Cisza robi się podejrzana – Śliska News pisze artykuł „Gdzie zniknął?”. Komentarze: 2 tysiące.', c: [['Wrzucam zdjęcie z wakacji, jakby nic.', 'wakacje'], ['Przepraszam w długim poście.', 'sorry']] },
    menago: { k: 'redaktor', t: 'Menedżer mówi: „Spokojnie, mam plan”. Plan to… ogłosić nową płytę dzisiaj o 20:00. Nie masz nagranej płyty.', c: [['Ogłaszam! Jakoś to będzie.', 'plyta'], ['Odmawiam. Wolę szczerość.', 'sorry']] },
    diss: { k: 'gwiazdor', t: 'Diss wychodzi o 3:00. Bit kradziony z TikToka, ale wersy pali. Ludzie dzielą się na dwa obozy, a Śliska News robi ankietę „Kto wygrał?”.', c: [['Czekam na wynik ankiety.', 'end_legenda'], ['Dorzucam drugi diss, na wszelki wypadek.', 'end_wtopa']] },
    usun: { k: 'detektyw', t: 'Usunąłeś, ale screeny już krążą. Ktoś montuje z nich mema, który ma więcej wyświetleń niż Twój ostatni singiel.', c: [['Robię z mema swój nowy profilowy.', 'end_mem'], ['Piszę do Śliskiej, żeby usunęli artykuł.', 'end_wtopa']] },
    wakacje: { k: 'sauna', t: 'Zdjęcie z plaży, podpis „Odpoczynek”. Ludzie piszą: „Uciekł przed dramą”. Ale lajków najwięcej w historii konta.', c: [['Ogłaszam trasę koncertową na fali hype’u.', 'end_legenda'], ['Wyłączam komentarze.', 'end_cisza']] },
    sorry: { k: 'zakochana', t: 'Długi post, szczere przeprosiny, zdjęcie z kolegą z featu. Połowa ludzi wierzy, połowa pisze „PR”. Kolega odpisuje: „Spoko, browar i sprawa zamknięta”.', c: [['Nagrywamy razem nowy numer.', 'end_legenda'], ['Wystarczy, wracam do pracy.', 'end_cisza']] },
    plyta: { k: 'imprezowa', t: 'Ogłoszenie płyty przykrywa dramę. Problem: fani chcą datę premiery. Masz 0 utworów i 1 ziomka z laptopem.', c: [['Wydaję EP-kę z 3 numerów nagranych w tydzień.', 'end_mem'], ['Przesuwam premierę „na jesień”. Którąś.', 'end_wtopa']] },
    end_legenda: { k: 'super', end: 'Legenda', t: 'Wychodzisz z afery silniejszy. Śliska News pisze: „Comeback roku?”. Twoje nazwisko w trendach, a feat ma 3 miliony odsłuchów. Legenda.' },
    end_wtopa: { k: 'ratownik', end: 'Wtopa roku', t: 'Za dużo, za szybko. Każdy kolejny ruch dolewał oliwy. Śliska News przyznaje Ci tytuł „Wtopa tygodnia” i wrzuca na Ścianę. Licznik dni bez wtopy: 0.' },
    end_mem: { k: 'kapiel', end: 'Żywy mem', t: 'Nie wiadomo jak, ale wszyscy Cię kochają – jako mema. Merch z Twoją miną sprzedaje się lepiej niż muzyka. Zawsze to coś.' },
    end_cisza: { k: 'szlafrok', end: 'Cichy przeczekiwacz', t: 'Drama wygasa sama. Nikt już nie pamięta, o co chodziło – Ty też nie. Bezpiecznie, ale trochę nudno. Śliska ziewa.' }
  };
  function drama(el) {
    var g = GAMES[5];
    shell(el, g, '<div class="dr" id="dr"></div>');
    function go(id) {
      var n = STORY[id], box = $('#dr');
      if (n.end) { var d = load(); d.endings = d.endings || []; if (d.endings.indexOf(n.end) < 0) d.endings.push(n.end); d.played = (d.played || 0) + 1; save(d); xp('drama'); }
      box.innerHTML = '<div class="dr-card' + (n.end ? ' is-end' : '') + '"><div class="dr-k">' + K(n.k, 'gk') + '</div><div class="dr-t">' + (n.end ? '<span class="gry-tag">Zakończenie</span><h2>' + n.end + '</h2>' : '') + '<p>' + n.t + '</p>' +
        (n.end ? '<p class="dr-sum">Odkryte zakończenia: <b>' + (load().endings || []).length + '/4</b></p><div class="dr-c"><button type="button" class="btn btn-primary" data-go="start">Zagraj jeszcze raz</button><button type="button" class="btn" id="dr-share">Udostępnij</button></div>'
          : '<div class="dr-c">' + n.c.map(function (c) { return '<button type="button" class="btn dr-opt" data-go="' + c[1] + '">' + c[0] + '</button>'; }).join('') + '</div>') + '</div></div>';
      var sh = $('#dr-share'); if (sh) sh.onclick = function () { var txt = 'Drama Simulator na Śliskiej: moje zakończenie to „' + n.end + '” 💦\nnews.sliska.pl/#/gry/drama'; if (navigator.share) navigator.share({ text: txt }).catch(function () {}); else navigator.clipboard.writeText(txt).then(function () { toast('Skopiowano'); }); };
    }
    $('#dr').addEventListener('click', function (e) { var b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); });
    go('start');
  }

  /* ============== KRZYŻÓWKA TYGODNIA (krzyżówka z hasłem) ============== */
  // [wyraz, podpowiedź, pozycja litery hasła w wyrazie]
  var KRZ = [
    { h: 'ŚLISKA', r: [['ŚLIZG', 'Ruch po mokrej powierzchni', 0], ['ALBUM', 'Płyta z kilkoma utworami', 1], ['WINYL', 'Czarna płyta dla kolekcjonerów', 1], ['SCENA', 'Miejsce, na którym gra się koncert', 0], ['KLIP', 'Teledysk, inaczej', 0], ['AFERA', 'Głośny skandal', 0]] },
    { h: 'DRAMA', r: [['DISS', 'Utwór, w którym raper atakuje innego', 0], ['TRASA', 'Seria koncertów w różnych miastach', 1], ['FEAT', 'Gościnny udział innego artysty w numerze', 2], ['MIKROFON', 'Bez niego wokalista nic nie zdziała', 0], ['FANKA', 'Wierna słuchaczka artysty', 1]] },
    { h: 'MOKRO', r: [['MERCH', 'Koszulki i bluzy z logo artysty', 0], ['SOLO', 'Występ w pojedynkę', 1], ['SKANDAL', 'Afera, o której mówią wszyscy', 1], ['REFREN', 'Powtarzająca się część piosenki', 0], ['PODCAST', 'Audycja do słuchania w internecie', 1]] },
    { h: 'KNAGA', r: [['KONCERT', 'Występ na żywo', 0], ['NAGRODA', 'Statuetka dla najlepszych', 0], ['PLAYLISTA', 'Lista utworów w aplikacji', 2], ['GALA', 'Uroczysta impreza z wręczeniem nagród', 0], ['SAMPEL', 'Fragment cudzego utworu użyty w nowym', 1]] }
  ];
  function weekIndex() { return Math.floor((dayIndex() + 6) / 7); }
  function krzKey() { return 'sn-krzyz-' + weekIndex(); }
  function krzDone() { try { return !!(JSON.parse(localStorage.getItem(krzKey())) || {}).done; } catch (e) { return false; } }
  function krzyzowka(el) {
    var g = GAMES[6], set = KRZ[((weekIndex() % KRZ.length) + KRZ.length) % KRZ.length];
    var L = Math.max.apply(null, set.r.map(function (r) { return r[2]; })), R = Math.max.apply(null, set.r.map(function (r) { return r[0].length - r[2]; }));
    var st; try { st = JSON.parse(localStorage.getItem(krzKey())) || {}; } catch (e) { st = {}; } st.v = st.v || {};
    var nxt = new Date(); nxt.setDate(nxt.getDate() + ((8 - nxt.getDay()) % 7 || 7));
    shell(el, g, '<div class="kz"><div class="kz-head">' + K('szlafrok', 'gk') + '<p>Wpisz wyrazy według podpowiedzi. Litery w zaznaczonej kolumnie utworzą <b>hasło tygodnia</b>. Nowa krzyżówka: ' + nxt.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' }) + '.</p></div>' +
      '<div class="kz-wrap"><div class="kz-grid" id="kz-grid" style="--cols:' + (L + R) + '">' + set.r.map(function (r, ri) {
        var cells = ''; for (var c = 0; c < L + R; c++) {
          var k = c - (L - r[2]);
          cells += k < 0 || k >= r[0].length ? '<span class="kz-x"></span>' : '<input class="kz-c' + (k === r[2] ? ' is-h' : '') + '" data-r="' + ri + '" data-k="' + k + '" maxlength="1" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Wyraz ' + (ri + 1) + ', litera ' + (k + 1) + '" value="' + esc((st.v[ri] || '')[k] || '').trim() + '">';
        }
        return '<div class="kz-row" data-r="' + ri + '"><span class="kz-n">' + (ri + 1) + '</span>' + cells + '</div>';
      }).join('') + '</div></div>' +
      '<ol class="kz-clues">' + set.r.map(function (r, ri) { return '<li data-r="' + ri + '"><b>' + (ri + 1) + '.</b> ' + r[1] + ' <small>(' + r[0].length + (r[0].length < 5 ? ' litery' : ' liter') + ')</small></li>'; }).join('') + '</ol>' +
      '<div class="kz-act"><button type="button" class="btn btn-primary" id="kz-check">Sprawdź</button><button type="button" class="btn" id="kz-hint">Podpowiedz literę</button></div><p class="kz-msg" id="kz-msg" aria-live="polite"></p></div>');
    var grid = $('#kz-grid'), lastCell = null;
    function word(ri) { return [].map.call(grid.querySelectorAll('.kz-c[data-r="' + ri + '"]'), function (i) { return (i.value || ' ').toUpperCase(); }).join(''); }
    function store() { set.r.forEach(function (_, ri) { st.v[ri] = word(ri); }); try { localStorage.setItem(krzKey(), JSON.stringify(st)); } catch (e) { /* - */ } }
    function cellsOf(ri) { return [].slice.call(grid.querySelectorAll('.kz-c[data-r="' + ri + '"]')); }
    function focusRow(ri) { [].forEach.call(el.querySelectorAll('.kz-clues li'), function (li) { li.classList.toggle('is-on', +li.dataset.r === ri); }); }
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
    el.querySelector('.kz-clues').addEventListener('click', function (e) { var li = e.target.closest('[data-r]'); if (li) { var c = cellsOf(+li.dataset.r).find(function (x) { return !x.value; }) || cellsOf(+li.dataset.r)[0]; c.focus(); } });
    function win() {
      grid.classList.add('is-done'); [].forEach.call(grid.querySelectorAll('.kz-c'), function (i) { i.readOnly = true; });
      $('#kz-msg').innerHTML = '<b class="gry-new">Rozwiązane!</b> Hasło tygodnia: <b>' + set.h + '</b>. Mokra robota.';
      if (!st.done) { st.done = 1; store(); var d = load(); d.played = (d.played || 0) + 1; save(d); xp('krzyzowka'); toast('Krzyżówka rozwiązana! 🧩'); }
    }
    $('#kz-check').onclick = function () {
      var bad = 0, empty = 0;
      set.r.forEach(function (r, ri) { var w = word(ri), row = grid.querySelector('.kz-row[data-r="' + ri + '"]'); if (w.indexOf(' ') >= 0) { empty++; row.classList.remove('is-bad', 'is-ok'); return; } var ok = w === r[0]; row.classList.toggle('is-ok', ok); row.classList.toggle('is-bad', !ok); if (!ok) bad++; });
      if (!bad && !empty) win(); else $('#kz-msg').textContent = bad ? 'Błędne wyrazy: ' + bad + '. Popraw zaznaczone na czerwono.' : 'Uzupełnij jeszcze ' + empty + (empty === 1 ? ' wyraz.' : ' wyrazy.');
    };
    $('#kz-hint').onclick = function () {
      var f = lastCell, ri = f ? +f.dataset.r : -1;
      var tryRow = function (r) { var cs = cellsOf(r), w = set.r[r][0]; for (var k = 0; k < cs.length; k++) if (cs[k].value.toUpperCase() !== w[k]) { cs[k].value = w[k]; cs[k].classList.add('is-given'); cs[k].focus(); store(); return true; } return false; };
      if (ri >= 0 && tryRow(ri)) return; for (var r = 0; r < set.r.length; r++) if (tryRow(r)) return;
    };
    if (st.done) win();
  }

  var RUN = { krzyzowka: krzyzowka, slizgle: slizgle, krople: krople, flappy: flappy, waz: waz, ukladanka: ukladanka, drama: drama, slizgawka: slizgawka };
  window.SliskieGry = {
    mount: function (el, sub, ctx) {
      stopAll();
      if (sub === 'slizgawka' && !unlocked()) sub = '';
      if (sub && RUN[sub]) RUN[sub](el, ctx || {}); else hub(el);
      window.scrollTo(0, 0);
    },
    stop: stopAll
  };
})();
