/* Śliska News – własne reklamy (bez sieci reklamowych, bez śledzenia).
   Trzy formaty: popup (środek), box (róg, lewo/prawo) i pasek (pod nagłówkiem).
   Edytuj listę CREATIVES poniżej: tytuł, wykonawca, przycisk, link i wygląd każdej reklamy. */
(function () {
  'use strict';
  var LABEL = 'Polecamy';                 // etykieta na reklamie (jeśli ktoś płaci, zmień na 'Reklama')
  var DEFAULT_LINK = 'https://sliska.pl/news/';
  var CFG = { enabled: true, popupDelay: 8000, boxDelay: 35000, boxMax: 2, boxGap: 120000, avoid: 2, rotateMs: 10000, closeAfterMs: 5000, clickChance: 0.1, clickGap: 90000, clickMax: 3, inlineMax: 2 };

  // 20 roboczych wariacji: tło (gradient), kolor tekstu, kolor akcentu, wzór, treść
  var C = [
    ['linear-gradient(135deg,#ff5f6d,#ffc371)', '#fff', '#1b1230', 'circles', 'Nowy singiel', 'Tytuł singla', 'Wykonawca', 'Posłuchaj'],
    ['linear-gradient(135deg,#0f2027,#2c5364)', '#fff', '#ffd166', 'rings', 'Premiera albumu', 'Nazwa albumu', 'Wykonawca', 'Sprawdź'],
    ['linear-gradient(135deg,#8e2de2,#4a00e0)', '#fff', '#ffe66d', 'stripes', 'Już w piątek', 'Tytuł płyty', 'Wykonawca', 'Odsłuchaj'],
    ['linear-gradient(135deg,#f7971e,#ffd200)', '#1b1230', '#d6001c', 'sun', 'Lato w słuchawkach', 'Hit sezonu', 'Wykonawca', 'Włącz'],
    ['linear-gradient(135deg,#11998e,#38ef7d)', '#06261f', '#ffffff', 'waves', 'Nowość', 'Tytuł singla', 'Wykonawca', 'Posłuchaj'],
    ['linear-gradient(135deg,#232526,#414345)', '#fff', '#ff4d6d', 'grid', 'Trasa koncertowa', 'Nazwa trasy', 'Wykonawca', 'Bilety'],
    ['linear-gradient(135deg,#ee0979,#ff6a00)', '#fff', '#ffffff', 'dots', 'Teledysk już online', 'Tytuł klipu', 'Wykonawca', 'Zobacz'],
    ['linear-gradient(135deg,#1e3c72,#2a5298)', '#fff', '#7df9ff', 'circles', 'Debiutancki album', 'Nazwa albumu', 'Wykonawca', 'Posłuchaj'],
    ['linear-gradient(135deg,#ffecd2,#fcb69f)', '#2b1d16', '#d6001c', 'sun', 'Koncert w Twoim mieście', 'Nazwa wydarzenia', 'Wykonawca', 'Szczegóły'],
    ['linear-gradient(135deg,#000000,#434343)', '#fff', '#d6001c', 'diag', 'Limitowana płyta winylowa', 'Nazwa albumu', 'Wykonawca', 'Zamów'],
    ['linear-gradient(135deg,#a8ff78,#78ffd6)', '#0b2b22', '#1b1230', 'dots', 'Nowy singiel', 'Tytuł singla', 'Wykonawca', 'Włącz'],
    ['linear-gradient(135deg,#654ea3,#eaafc8)', '#fff', '#1b1230', 'waves', 'Posłuchaj pierwszy', 'Tytuł singla', 'Wykonawca', 'Odsłuchaj'],
    ['linear-gradient(135deg,#00c6ff,#0072ff)', '#fff', '#ffe66d', 'rings', 'Premiera piątkowa', 'Nazwa albumu', 'Wykonawca', 'Sprawdź'],
    ['linear-gradient(135deg,#ff9966,#ff5e62)', '#fff', '#1b1230', 'stripes', 'Nowa płyta', 'Nazwa albumu', 'Wykonawca', 'Posłuchaj'],
    ['linear-gradient(135deg,#373b44,#4286f4)', '#fff', '#ffd166', 'grid', 'Festiwal 2027', 'Nazwa festiwalu', 'Line-up w środku', 'Bilety'],
    ['linear-gradient(135deg,#fdfc47,#24fe41)', '#10240f', '#1b1230', 'sun', 'Letni singiel', 'Tytuł singla', 'Wykonawca', 'Włącz'],
    ['linear-gradient(135deg,#3a1c71,#d76d77,#ffaf7b)', '#fff', '#ffffff', 'circles', 'Album roku?', 'Nazwa albumu', 'Wykonawca', 'Posłuchaj'],
    ['linear-gradient(135deg,#2b5876,#4e4376)', '#fff', '#ff9ecd', 'diag', 'Live session', 'Nazwa sesji', 'Wykonawca', 'Zobacz'],
    ['linear-gradient(135deg,#f12711,#f5af19)', '#fff', '#1b1230', 'dots', 'Gorąca premiera', 'Tytuł singla', 'Wykonawca', 'Posłuchaj'],
    ['linear-gradient(135deg,#d3cce3,#e9e4f0)', '#241b3a', '#d6001c', 'waves', 'Muzyka na jesień', 'Nazwa albumu', 'Wykonawca', 'Odsłuchaj']
  ];
  var CREATIVES = C.map(function (r, i) {
    return { id: 'ad' + (i + 1), bg: r[0], ink: r[1], accent: r[2], deco: r[3], kicker: r[4], title: r[5], artist: r[6], cta: r[7], link: DEFAULT_LINK };
  });

  var STATIC = { top: 1, mini: 1 };   // reklamy stałe na górze: bez przycisku zamknięcia, zmieniają się same
  var HK = 'sliska_ads_hist', SK = 'sliska_ads_sess';
  function ls(get, k, v) { try { return get ? localStorage.getItem(k) : localStorage.setItem(k, v); } catch (e) { return null; } }
  function ss(get, k, v) { try { return get ? sessionStorage.getItem(k) : sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function sess() { try { return JSON.parse(ss(true, SK) || '{}'); } catch (e) { return {}; } }
  function saveSess(s) { ss(false, SK, JSON.stringify(s)); }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /** Losowa reklama inna niż dwie ostatnie pokazane. */
  function pick() {
    var hist = []; try { hist = JSON.parse(ls(true, HK) || '[]'); } catch (e) {}
    var pool = CREATIVES.filter(function (c) { return hist.slice(-CFG.avoid).indexOf(c.id) < 0; });
    var c = pool[Math.floor(Math.random() * pool.length)] || CREATIVES[0];
    hist.push(c.id); ls(false, HK, JSON.stringify(hist.slice(-6)));
    return c;
  }

  function inkFor(hex) { var n = parseInt(String(hex).replace('#', ''), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255; return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#1b1230' : '#ffffff'; }
  function art(c) { return '<span class="adv-art" data-deco="' + c.deco + '" aria-hidden="true"></span>'; }
  function html(fmt, c) {
    var style = '--adv-bg:' + c.bg + ';--adv-ink:' + c.ink + ';--adv-acc:' + c.accent + ';--adv-cta-ink:' + inkFor(c.accent);
    var cta = '<a class="adv-cta" href="' + esc(c.link) + '" target="_blank" rel="noopener sponsored"' + (fmt === 'mini' ? ' aria-label="' + esc(c.cta) + '"' : '') + '>' + (fmt === 'mini' ? '›' : esc(c.cta)) + '</a>';
    var inner = fmt === 'popup' || fmt === 'box';
    var fixed = fmt === 'strip' || fmt === 'mini' || fmt === 'inline' ? '' : '';
    var text = '<span class="adv-text"><small class="adv-kicker">' + esc(c.kicker) + '</small><strong class="adv-title">' + esc(c.title) + '</strong><span class="adv-artist">' + esc(c.artist) + '</span>' + (inner ? cta : '') + '</span>';
    return '<div class="adv adv-' + fmt + '" style="' + style + '" data-ad="' + c.id + '"><span class="adv-label">' + esc(LABEL) + '</span>' +
      (STATIC[fmt] ? '' : '<button type="button" class="adv-x" aria-label="Zamknij">×</button>') + art(c) + text + (inner ? '' : cta) + '</div>';
  }

  var OFF_KEY = 'sliska_ads_off';
  /** Redaktorzy i Właściciel mogą wyłączyć reklamy na swoim urządzeniu (Ustawienia). Czytelników to nie dotyczy. */
  function off() { return document.body.classList.contains('is-admin') && ls(true, OFF_KEY) === '1'; }
  function blocked() {
    var h = location.hash || '';
    return !CFG.enabled || off() || /^#\/(panel|edytor|szkic|ustawienia|konto)/.test(h) || document.body.classList.contains('modal-open');
  }
  function bindClose(el, done) {
    var x = el.querySelector('.adv-x');
    if (x) x.addEventListener('click', function () { el.classList.add('is-out'); setTimeout(function () { el.remove(); if (done) done(); }, 220); });
    var a = el.querySelector('.adv-cta');
    if (a) a.addEventListener('click', function (e) { if (/^#?$/.test(this.getAttribute('href'))) e.preventDefault(); });
  }

  /* ---- Górny rząd: długa + krótka reklama, bez X, zmieniają się co 10 s ---- */
  var rot = [], rotTimer = null;
  function swap(slot, fmt) {
    if (!slot.isConnected) return;
    var n = document.createElement('div'); n.innerHTML = html(fmt, pick()); var el = n.firstChild;
    var old = slot.firstChild; if (old) { old.classList.add('is-out'); setTimeout(function () { if (old.parentNode === slot) slot.removeChild(old); }, 200); }
    setTimeout(function () { slot.appendChild(el); bindClose(el); }, old ? 200 : 0);
  }
  function topRow() {
    var host = document.getElementById('ad-top'); if (!host || host.firstChild) return;
    host.innerHTML = '<div class="ad-slot ad-slot-long"></div><div class="ad-slot ad-slot-short"></div>';
    var l = host.firstChild, s = host.lastChild;
    swap(l, 'top'); swap(s, 'mini');
    rotTimer = setInterval(function () { if (document.hidden || blocked()) return; swap(l, 'top'); setTimeout(function () { swap(s, 'mini'); }, 2500); }, CFG.rotateMs);
    host.hidden = blocked();
  }
  function applyTop() { var h = document.getElementById('ad-top'); if (h) { h.hidden = blocked(); if (!h.hidden && !h.firstChild) topRow(); } }

  /* ---- Popup na środku; zamknąć można dopiero po 5 s ---- */
  function popup(c, fromClick) {
    var s = sess();
    if (!c) { if (blocked() || document.querySelector('.adv-overlay')) return; if (!fromClick && s.popup) return; }
    if (!fromClick) s.popup = 1; saveSess(s);
    var wrap = document.createElement('div'); wrap.className = 'adv-overlay'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-label', LABEL);
    wrap.innerHTML = html('popup', c || pick()); document.body.appendChild(wrap);
    var x = wrap.querySelector('.adv-x'), ready = false, left = Math.ceil(CFG.closeAfterMs / 1000);
    x.classList.add('is-wait'); x.textContent = left; x.disabled = true; x.setAttribute('aria-label', 'Zamknij za ' + left + ' s');
    var tick = setInterval(function () {
      left--; if (left > 0) { x.textContent = left; x.setAttribute('aria-label', 'Zamknij za ' + left + ' s'); return; }
      clearInterval(tick); ready = true; x.disabled = false; x.classList.remove('is-wait'); x.textContent = '×'; x.setAttribute('aria-label', 'Zamknij');
    }, 1000);
    function close() { if (!ready) return; wrap.classList.add('is-out'); document.removeEventListener('keydown', key); setTimeout(function () { wrap.remove(); var q = sess(); q.popupAt = Date.now(); saveSess(q); }, 220); }
    function key(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', key);
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    x.addEventListener('click', close);
    wrap.querySelector('.adv-cta').addEventListener('click', function (e) { if (/^#?$/.test(this.getAttribute('href'))) e.preventDefault(); });
  }

  /* ---- Box w rogu (300×250), raz z lewej, raz z prawej ---- */
  function box(c, side) {
    var s = sess();
    if (!c) {
      if (blocked() || (s.boxN || 0) >= CFG.boxMax) return;
      if (s.boxAt && Date.now() - s.boxAt < CFG.boxGap) return;
      if (s.popupAt && Date.now() - s.popupAt < 30000) return;
      if (document.querySelector('.adv-overlay')) return;
      if (window.scrollY < document.documentElement.scrollHeight * 0.25) return;
    }
    side = side || ((ls(true, 'sliska_ads_side') === 'l') ? 'r' : 'l'); ls(false, 'sliska_ads_side', side);
    s.boxN = (s.boxN || 0) + 1; s.boxAt = Date.now(); saveSess(s);
    var el = document.createElement('div'); el.className = 'adv-dock adv-dock-' + side; el.innerHTML = html('box', c || pick());
    document.body.appendChild(el); bindClose(el.firstChild, function () { el.remove(); });
  }

  /* ---- Reklama w połowie artykułu: wskakuje, gdy czytelnik dojeżdża do środka tekstu ---- */
  var inlineDone = '';
  function inlineAd() {
    var m = /^#\/(artykul|a)\//.exec(location.hash || ''); if (!m || blocked() || inlineDone === location.hash) return;
    var body = document.querySelector('.article-body'); if (!body) return;
    var ps = [].filter.call(body.children, function (e) { return e.tagName === 'P' && e.textContent.trim().length > 40; });
    if (ps.length < 4) return;
    var s = sess(); if ((s.inlineN || 0) >= CFG.inlineMax) return;
    var mid = ps[Math.floor(ps.length / 2)], r = mid.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight * 0.85) return;       // wstawiamy tylko poniżej widocznego fragmentu, żeby tekst nie skakał
    if (r.top < window.innerHeight * 0.3) return;
    inlineDone = location.hash; s.inlineN = (s.inlineN || 0) + 1; saveSess(s);
    var el = document.createElement('div'); el.className = 'adv-inline'; el.innerHTML = html('strip', pick());
    mid.parentNode.insertBefore(el, mid); bindClose(el.firstChild, function () { el.remove(); });
  }

  /* ---- Czasem (1/10) kliknięcie w coś uruchamia reklamę ---- */
  function onClick(e) {
    if (e.target.closest('.adv, .adv-overlay, input, textarea, select, label, .modal, [contenteditable]')) return;
    if (!e.target.closest('a, button')) return;
    if (blocked() || document.querySelector('.adv-overlay')) return;
    var s = sess(); if ((s.clickN || 0) >= CFG.clickMax || (s.clickAt && Date.now() - s.clickAt < CFG.clickGap)) return;
    if (Date.now() - T0 < 15000) return;                                  // nie na samym początku wizyty
    if (Math.random() >= CFG.clickChance) return;
    s.clickN = (s.clickN || 0) + 1; s.clickAt = Date.now(); saveSess(s);
    setTimeout(function () { popup(null, true); }, 450);
  }

  function start() {
    if (document.getElementById('ads-gallery')) return;
    setTimeout(applyTop, 1200);
    setTimeout(function () { popup(); }, CFG.popupDelay);
    var t = setInterval(function () { var s = sess(); if ((s.boxN || 0) >= CFG.boxMax) return clearInterval(t); if (Date.now() - T0 > CFG.boxDelay) box(); }, 5000);
    window.addEventListener('scroll', inlineAd, { passive: true });
    document.addEventListener('click', onClick, true);
    window.addEventListener('hashchange', function () { inlineDone = ''; applyTop(); setTimeout(inlineAd, 400); });
    window.addEventListener('sliska:ads', function () {      // przełącznik w Ustawieniach
      if (blocked()) { document.querySelectorAll('.adv-overlay, .adv-dock, .adv-inline').forEach(function (e) { e.remove(); }); }
      applyTop();
    });
  }
  var T0 = Date.now();

  window.SliskaAds = {
    creatives: CREATIVES, html: html, config: CFG, pick: pick,
    show: function (fmt, i, side) { var c = CREATIVES[(i || 0) % CREATIVES.length]; if (fmt === 'popup') popup(c); else if (fmt === 'box') box(c, side || 'r'); },
    reset: function () { ss(false, SK, '{}'); ls(false, HK, '[]'); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
