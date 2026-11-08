/* Śliska News – poziomy i sezony (XP), ranking sezonu (#/sezon), Śliskie Podsumowanie miesiąca (#/podsumowanie),
   powiadomienia czytelnika (@wzmianki, odpowiedzi). XP liczy Worker (z dziennymi limitami), strona tylko zgłasza zdarzenia.
   Wymaga z app.js: CONFIG, actorApi, Readers, state, Utils, readerAvatar, toast. */
(function () {
  'use strict';
  var LEVELS = [[0, 'Sucharz'], [50, 'Wilgotny'], [150, 'Mokry'], [350, 'Ociekający'], [700, 'Śliski'], [1200, 'Ślizgacz'], [2000, 'Mokra Elita'], [3500, 'Legenda Śliskiej']];
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var K = function (s, c) { return window.Knaga ? Knaga.svg(s, { cls: c || 'gk' }) : ''; };
  var logged = function () { try { return Readers.loggedIn() && Readers.hasName && Readers.hasName(); } catch (e) { return false; } };
  var MONTHS = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
  var MONTHS_G = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'];
  function monthKey(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  function monthName(m) { var p = m.split('-'); return MONTHS[Number(p[1]) - 1] + ' ' + p[0]; }

  /** plakietka poziomu przy nicku */
  function badge(lv, big) {
    lv = Number(lv) || 0; if (!lv) return '';
    return '<span class="lv-b lv-' + lv + (big ? ' is-big' : '') + '" title="Poziom ' + lv + ': ' + LEVELS[lv - 1][1] + '">' + (big ? 'Poziom ' + lv + ' · ' : 'Lv ' + lv + ' ') + (big ? LEVELS[lv - 1][1] : '') + '</span>';
  }

  /* ---------- lokalne statystyki (kategorie czytanych tekstów – do podsumowania) ---------- */
  var LKEY = 'sn-czytam';
  function local() { try { return JSON.parse(localStorage.getItem(LKEY)) || {}; } catch (e) { return {}; } }
  function noteRead(a) {
    try {
      var d = local(), m = monthKey(); d[m] = d[m] || { reads: 0, cats: {}, ids: [] };
      if (d[m].ids.indexOf(a.id) >= 0) return false;
      d[m].ids.push(a.id); d[m].reads++;
      (a.categories || [a.category]).filter(Boolean).forEach(function (c) { d[m].cats[c] = (d[m].cats[c] || 0) + 1; });
      localStorage.setItem(LKEY, JSON.stringify(d)); return true;
    } catch (e) { return false; }
  }

  /* ---------- zdobywanie XP ---------- */
  var queue = Promise.resolve();
  function earn(kind) {
    if (!logged()) return Promise.resolve(null);
    queue = queue.then(function () {
      return actorApi('/xp/earn', { method: 'POST', body: JSON.stringify({ kind: kind }) }).then(function (d) {
        gained(d);
        return d;
      }).catch(function () { return null; });
    });
    return queue;
  }
  function pop(t) {
    var n = document.createElement('div'); n.className = 'xp-pop'; n.textContent = t; document.body.appendChild(n);
    setTimeout(function () { n.classList.add('out'); }, 1600); setTimeout(function () { n.remove(); }, 2100);
  }
  function levelUp(lv) {
    var m = document.createElement('div'); m.className = 'xp-up'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', 'Nowy poziom');
    m.innerHTML = '<div class="xp-up-box">' + K('imprezowa', 'gk xp-up-k') + '<span class="gry-new">Nowy poziom!</span><h2>Poziom ' + lv + '</h2><p>Jesteś teraz: <b>' + LEVELS[lv - 1][1] + '</b>' + (LEVELS[lv] ? '. Następny: ' + LEVELS[lv][1] + ' od ' + LEVELS[lv][0] + ' XP.' : '. Wyżej się nie da – szacun!') + '</p><button type="button" class="btn btn-primary">Mokro!</button></div>';
    document.body.appendChild(m); m.querySelector('button').onclick = function () { m.remove(); }; m.addEventListener('click', function (e) { if (e.target === m) m.remove(); });
  }
  var me = null;
  function loadMe() { if (!logged()) return Promise.resolve(null); if (me) return Promise.resolve(me); return actorApi('/xp/me').then(function (d) { me = d; return d; }).catch(function () { return null; }); }

  /* dzienny bonus za wizytę */
  function daily() { if (!logged()) return; var k = 'sn-daily-' + new Date().toDateString(); try { if (localStorage.getItem(k)) return; localStorage.setItem(k, '1'); } catch (e) { return; } earn('daily'); }

  /* ---------- karta poziomu (konto, profil) ---------- */
  function card(d, own) {
    if (!d) return '';
    var cur = LEVELS[d.lv - 1][0], next = LEVELS[d.lv] ? LEVELS[d.lv][0] : null, total = d.total != null ? d.total : d.xp || 0;
    var pct = next ? Math.max(3, Math.min(100, (total - cur) / (next - cur) * 100)) : 100;
    return '<section class="panel xp-card lv-' + d.lv + '"><div class="xp-card-h"><span class="xp-num">' + d.lv + '</span><div><b>' + LEVELS[d.lv - 1][1] + '</b><small>' + total + ' XP' + (next ? ' · do poziomu ' + (d.lv + 1) + ': ' + (next - total) + ' XP' : ' · najwyższy poziom') + '</small></div>' +
      (own ? '<a class="btn btn-sm" href="#/sezon">Ranking sezonu</a>' : '') + '</div><div class="xp-bar"><i style="width:' + pct + '%"></i></div>' +
      (own ? '<p class="xp-how">Punkty za: czytanie artykułów do końca (+3), komentarze (+5), gry (+5, rekord +10, Ślizgle +15), codzienną wizytę (+5). Dzienne limity – nie da się nabić w nieskończoność.' + (d.pts != null ? ' W tym sezonie (' + monthName(d.month) + '): <b>' + d.pts + ' XP</b>' + (d.pos ? ', miejsce <b>' + d.pos + '</b> z ' + d.players : '') + '. <a href="#/podsumowanie">Twoje podsumowanie miesiąca →</a>' : '') + '</p>' : '') + '</section>';
  }

  /* ---------- ranking sezonu (#/sezon) ---------- */
  function ranking(el, m) {
    m = /^\d{4}-\d{2}$/.test(m || '') ? m : monthKey();
    var d0 = new Date(); var prev = monthKey(new Date(d0.getFullYear(), d0.getMonth() - 1, 1));
    el.innerHTML = '<div class="xp-page"><div class="article-top"><a class="btn btn-back" href="#/gry">← Śliskie Gry</a></div>' +
      '<header class="gry-hero xp-hero"><div class="gry-hero-t"><span class="gry-eyebrow">Sezon</span><h1>Ranking Ślizgaczy</h1><p>Sezon trwa miesiąc. Punkty XP zbierasz czytając, komentując i grając. Na koniec miesiąca ranking startuje od zera – poziomy zostają na zawsze.</p>' +
      '<div class="spf-seg xp-seg" role="group" aria-label="Sezon"><button type="button" data-m="' + monthKey() + '" class="' + (m === monthKey() ? 'is-on' : '') + '">' + monthName(monthKey()) + '</button><button type="button" data-m="' + prev + '" class="' + (m === prev ? 'is-on' : '') + '">' + monthName(prev) + '</button></div></div>' +
      '<div class="gry-hero-k">' + K('kibic', 'gk gk-hero') + '</div></header><div id="xp-me"></div><div id="xp-list"><p class="muted">Ładowanie…</p></div>' +
      '<section class="panel xp-levels"><h2>Poziomy</h2><ol>' + LEVELS.map(function (l, i) { return '<li>' + badge(i + 1) + '<b>' + l[1] + '</b><span>od ' + l[0] + ' XP</span></li>'; }).join('') + '</ol></section></div>';
    el.querySelector('.xp-seg').addEventListener('click', function (e) { var b = e.target.closest('[data-m]'); if (b) location.hash = '#/sezon/' + b.dataset.m; });
    if (logged()) loadMe().then(function (d) { var b = el.querySelector('#xp-me'); if (b && d) { b.innerHTML = card(d, true); var x = b.querySelector('.xp-card-h .btn'); if (x) x.remove(); } });
    else el.querySelector('#xp-me').innerHTML = '<p class="cmt-note">Zaloguj się, żeby zbierać XP i trafić do rankingu. <a href="#/konto">Zaloguj się →</a></p>';
    fetch(CONFIG.API_BASE + '/xp/ranking?m=' + m, { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
      var box = el.querySelector('#xp-list'); if (!box) return;
      if (!d.top || !d.top.length) { box.innerHTML = '<div class="panel xp-empty">' + K('niesmiala', 'gk') + '<p>W tym sezonie nikt jeszcze nie zdobył XP. Pierwsze miejsce czeka na Ciebie!</p></div>'; return; }
      var medal = ['🥇', '🥈', '🥉'];
      box.innerHTML = '<p class="xp-players">' + d.players + ' ' + (d.players === 1 ? 'gracz' : 'graczy') + ' w sezonie ' + monthName(d.month) + '</p><ol class="xp-list">' + d.top.map(function (u, i) {
        return '<li class="' + (i < 3 ? 'is-top is-' + (i + 1) : '') + '"><span class="xp-pos">' + (medal[i] || i + 1) + '</span><a class="xp-u" href="#/uzytkownik/' + esc(u.u) + '"><span class="avatar lv-ring lv-' + u.lv + '">' + readerAvatar(u.name, u.av, u.u) + '</span><b>' + esc(u.name) + '</b>' + badge(u.lv) + '</a><span class="xp-pts">' + u.pts + ' XP</span></li>';
      }).join('') + '</ol>';
    }).catch(function () { var box = el.querySelector('#xp-list'); if (box) box.innerHTML = '<p class="cmt-note">Nie udało się wczytać rankingu.</p>'; });
  }

  /* ---------- Śliskie Podsumowanie miesiąca (#/podsumowanie) ---------- */
  function summary(el, m) {
    m = /^\d{4}-\d{2}$/.test(m || '') ? m : monthKey();
    el.innerHTML = '<div class="xp-page"><div class="article-top"><a class="btn btn-back" href="#/">← Strona główna</a></div><p class="muted">Liczę Twój miesiąc…</p></div>';
    var loc = local()[m] || { reads: 0, cats: {} };
    var gl = (function () { try { return JSON.parse(localStorage.getItem('sn-gry')) || {}; } catch (e) { return {}; } })();
    var p = logged() ? actorApi('/xp/summary?m=' + m).catch(function () { return null; }) : Promise.resolve(null);
    p.then(function (d) {
      d = d && d.lv ? d : null;
      var cats = Object.keys(loc.cats).sort(function (a, b) { return loc.cats[b] - loc.cats[a]; });
      var fav = cats[0] || '', reads = d ? Math.max(d.reads || 0, loc.reads) : loc.reads;
      var topArt = d && d.commented && d.commented[0] ? state.articles.find(function (a) { return a.id === d.commented[0].article; }) : null;
      var persona = reads >= 40 ? ['Nałogowy Ślizgacz', 'sliska'] : (d && d.comments >= 15) ? ['Gaduła z komentarzy', 'wsciekla'] : (d && d.games >= 15) ? ['Gracz z krwi i kości', 'surfer'] : reads >= 10 ? ['Stały bywalec', 'ziomek'] : ['Nieśmiały czytelnik', 'niesmiala'];
      var mo = m.split('-');
      var stats = [['Przeczytane do końca', reads || 0], ['Komentarze', d ? d.comments || 0 : '–'], ['Rozegrane gry', d ? d.games || 0 : (gl.played || 0)], ['XP w sezonie', d ? d.pts || 0 : '–']];
      el.innerHTML = '<div class="xp-page"><div class="article-top"><a class="btn btn-back" href="#/">← Strona główna</a></div>' +
        '<section class="sum-card" id="sum-card"><div class="sum-top"><span class="gry-eyebrow">Śliskie Podsumowanie</span><h1>Twój ' + MONTHS[Number(mo[1]) - 1] + '</h1><p>' + (d ? esc(d.name) + ' · ' : '') + 'Poziom ' + (d ? d.lv + ' – ' + d.lvName : '?') + '</p></div>' +
        '<div class="sum-k">' + K(persona[1], 'gk') + '</div><div class="sum-persona"><small>W tym miesiącu byłeś:</small><b>' + persona[0] + '</b></div>' +
        '<div class="sum-grid">' + stats.map(function (s) { return '<div><b>' + s[1] + '</b><span>' + s[0] + '</span></div>'; }).join('') + '</div>' +
        (fav ? '<p class="sum-line">Ulubiona kategoria: <b>' + esc(fav) + '</b> (' + loc.cats[fav] + ' ' + (loc.cats[fav] === 1 ? 'tekst' : 'teksty') + ')</p>' : '') +
        (topArt ? '<p class="sum-line">Najwięcej pisałeś pod: <a href="#/artykul/' + encodeURIComponent(topArt.id) + '">' + esc(topArt.title) + '</a></p>' : '') +
        (d && d.pos ? '<p class="sum-line">Miejsce w sezonie: <b>' + d.pos + '</b> na ' + d.players + '</p>' : '') +
        '<p class="sum-foot">news.sliska.pl · ' + MONTHS[Number(mo[1]) - 1] + ' ' + mo[0] + '</p></section>' +
        '<div class="sum-act"><button type="button" class="btn btn-primary" id="sum-share">Pobierz grafikę</button>' + (!d ? '<a class="btn" href="#/konto">Zaloguj się, żeby zobaczyć XP i komentarze</a>' : '') + '</div></div>';
      el.querySelector('#sum-share').onclick = function () { shareImg({ month: MONTHS[Number(mo[1]) - 1] + ' ' + mo[0], name: d ? d.name : '', lv: d ? 'Poziom ' + d.lv + ' – ' + d.lvName : '', persona: persona[0], stats: stats, fav: fav }); };
    });
  }
  /* grafika do udostępnienia (1080×1350, bez Knagi – bezpieczna na Instagram) */
  function shareImg(o) {
    var c = document.createElement('canvas'); c.width = 1080; c.height = 1350; var x = c.getContext('2d');
    var g = x.createLinearGradient(0, 0, 1080, 1350); g.addColorStop(0, '#2b1b4a'); g.addColorStop(.55, '#6b1a5a'); g.addColorStop(1, '#d6001c'); x.fillStyle = g; x.fillRect(0, 0, 1080, 1350);
    x.fillStyle = 'rgba(255,255,255,.04)'; for (var i = -1350; i < 1080; i += 26) { x.save(); x.translate(i, 0); x.rotate(-Math.PI / 4); x.fillRect(0, 0, 6, 3000); x.restore(); }
    x.fillStyle = '#ffcf4a'; x.font = '900 34px Figtree, Arial'; x.fillText('ŚLISKIE PODSUMOWANIE', 80, 140);
    x.fillStyle = '#fff'; x.font = '900 110px Figtree, Arial'; x.fillText(o.month, 80, 260);
    x.font = '700 40px Figtree, Arial'; x.fillStyle = 'rgba(255,255,255,.8)'; x.fillText([o.name, o.lv].filter(Boolean).join(' · '), 80, 330);
    x.fillStyle = 'rgba(255,255,255,.12)'; x.beginPath(); x.roundRect(80, 390, 920, 170, 32); x.fill();
    x.fillStyle = 'rgba(255,255,255,.75)'; x.font = '600 34px Figtree, Arial'; x.fillText('W tym miesiącu byłeś:', 120, 455); x.fillStyle = '#fff'; x.font = '900 64px Figtree, Arial'; x.fillText(o.persona, 120, 525);
    o.stats.forEach(function (s, i) { var cx = 80 + (i % 2) * 470, cy = 610 + Math.floor(i / 2) * 230; x.fillStyle = 'rgba(255,255,255,.1)'; x.beginPath(); x.roundRect(cx, cy, 450, 200, 28); x.fill(); x.fillStyle = '#fff'; x.font = '900 96px Figtree, Arial'; x.fillText(String(s[1]), cx + 36, cy + 115); x.fillStyle = 'rgba(255,255,255,.75)'; x.font = '600 32px Figtree, Arial'; x.fillText(s[0], cx + 36, cy + 165); });
    if (o.fav) { x.fillStyle = '#fff'; x.font = '700 38px Figtree, Arial'; x.fillText('Ulubiona kategoria: ' + o.fav, 80, 1130); }
    x.fillStyle = '#fff'; x.font = '900 46px Figtree, Arial'; x.fillText('śliskanews', 80, 1260); x.fillStyle = 'rgba(255,255,255,.7)'; x.font = '600 32px Figtree, Arial'; x.fillText('news.sliska.pl', 760, 1258);
    c.toBlob(function (b) {
      var f = new File([b], 'sliskie-podsumowanie.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [f] })) navigator.share({ files: [f], text: 'Moje Śliskie Podsumowanie 💦 news.sliska.pl' }).catch(function () {});
      else { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'sliskie-podsumowanie.png'; a.click(); }
    }, 'image/png');
  }

  /* ---------- powiadomienia czytelnika (dzwonek przy profilu) ---------- */
  var notes = { items: [], unread: 0 };
  function loadNotes() {
    if (!logged()) { paintBell(); return; }
    actorApi('/notes').then(function (d) { notes = d || notes; paintBell(); }).catch(function () {});
  }
  function paintBell() {
    var acc = document.getElementById('btn-account'), b = document.getElementById('nt-bell');
    if (!logged() || !acc) { if (b) b.remove(); return; }
    if (!b) {
      b = document.createElement('button'); b.type = 'button'; b.id = 'nt-bell'; b.className = 'btn btn-icon nt-bell'; b.setAttribute('aria-label', 'Wzmianki i odpowiedzi'); b.title = 'Wzmianki i odpowiedzi na Twoje komentarze';
      b.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.9 7.9"/></svg><i></i>';
      acc.parentNode.insertBefore(b, acc); b.addEventListener('click', openNotes);
    }
    b.querySelector('i').textContent = notes.unread > 9 ? '9+' : notes.unread || '';
    b.classList.toggle('has', notes.unread > 0);
  }
  function openNotes() {
    var old = document.getElementById('nt-panel'); if (old) { old.remove(); return; }
    var p = document.createElement('div'); p.id = 'nt-panel'; p.className = 'nt-panel';
    p.innerHTML = '<h3>Wzmianki i odpowiedzi</h3>' + (notes.items.length ? '<ul>' + notes.items.map(function (n) { return '<li class="' + (n.rd ? '' : 'is-new') + '"><a href="' + esc(n.url) + '"><b>' + esc(n.title) + '</b><span>' + esc(n.body) + '</span><time>' + new Date(n.at).toLocaleString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</time></a></li>'; }).join('') + '</ul>' : '<p class="muted">Nic nowego. Gdy ktoś Cię oznaczy (@' + esc(Readers.me && Readers.me.name || 'nick') + ') albo odpowie na komentarz – zobaczysz to tutaj.</p>');
    document.body.appendChild(p);
    p.addEventListener('click', function (e) { if (e.target.closest('a')) p.remove(); });
    setTimeout(function () { document.addEventListener('click', function off(e) { if (!p.contains(e.target) && e.target.id !== 'nt-bell' && !e.target.closest('#nt-bell')) { p.remove(); document.removeEventListener('click', off); } }); }, 0);
    if (notes.unread) { actorApi('/notes/read', { method: 'POST', body: '{}' }).catch(function () {}); notes.unread = 0; notes.items.forEach(function (n) { n.rd = 1; }); paintBell(); }
  }

  function gained(d) { if (!d || !d.got) return; pop('+' + d.got + ' XP'); if (d.up) levelUp(d.lv); me = null; }
  var lastUid = null;
  function onReader() {
    var uid = logged() ? (Readers.user && Readers.user.uid) || 'x' : null;
    if (uid === lastUid) return; lastUid = uid; me = null;
    loadNotes(); if (uid) daily();
  }
  window.addEventListener('sn:read', function (e) {
    var id = e.detail && e.detail.id, a = id && (state.articles || []).find(function (x) { return x.id === id; });
    if (a && noteRead(a)) earn('read');
  });
  window.addEventListener('sn:reveal', function () { earn('reveal'); });

  window.SnXP = { LEVELS: LEVELS, badge: badge, earn: earn, gained: gained, onReader: onReader, card: card, loadMe: loadMe, ranking: ranking, summary: summary, noteRead: noteRead, loadNotes: loadNotes, daily: daily, reset: function () { me = null; } };
  setInterval(function () { if (document.visibilityState === 'visible') loadNotes(); }, 120000);
})();
