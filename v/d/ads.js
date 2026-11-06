/* Śliska News – własne reklamy (bez sieci reklamowych, bez śledzenia).
   Trzy formaty: popup (środek), box (róg, lewo/prawo) i pasek (pod nagłówkiem).
   Edytuj listę CREATIVES poniżej: tytuł, wykonawca, przycisk, link i wygląd każdej reklamy. */
(function () {
  'use strict';
  var LABEL = 'Polecamy';                 // etykieta na reklamie (jeśli ktoś płaci, zmień na 'Reklama')
  var DEFAULT_LINK = 'https://sliska.pl/news/';
  var CFG = { enabled: true, popupDelay: 8000, boxDelay: 35000, boxMax: 2, boxGap: 120000, avoid: 2 };

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
    var cta = '<a class="adv-cta" href="' + esc(c.link) + '" target="_blank" rel="noopener sponsored">' + esc(c.cta) + '</a>';
    var inner = fmt !== 'strip';
    var text = '<span class="adv-text"><small class="adv-kicker">' + esc(c.kicker) + '</small><strong class="adv-title">' + esc(c.title) + '</strong><span class="adv-artist">' + esc(c.artist) + '</span>' + (inner ? cta : '') + '</span>';
    return '<div class="adv adv-' + fmt + '" style="' + style + '" data-ad="' + c.id + '"><span class="adv-label">' + esc(LABEL) + '</span>' +
      '<button type="button" class="adv-x" aria-label="Zamknij">×</button>' + art(c) + text + (inner ? '' : cta) + '</div>';
  }

  function blocked() {
    var h = location.hash || '';
    return !CFG.enabled || /^#\/(panel|edytor|szkic|ustawienia|konto)/.test(h) || document.body.classList.contains('modal-open') || document.documentElement.classList.contains('is-app-fullscreen-ad');
  }
  function bindClose(el, done) {
    el.querySelector('.adv-x').addEventListener('click', function () { el.classList.add('is-out'); setTimeout(function () { el.remove(); if (done) done(); }, 220); });
    el.querySelector('.adv-cta').addEventListener('click', function (e) { if (/^#?$/.test(this.getAttribute('href'))) e.preventDefault(); });
  }

  /* ---- Pasek pod nagłówkiem (728×90) ---- */
  function strip(c) {
    var s = sess(); if (s.stripOff) return;
    var host = document.getElementById('ad-top'); if (!host) return;
    host.innerHTML = html('strip', c || pick()); host.hidden = false;
    bindClose(host.firstChild, function () { var q = sess(); q.stripOff = 1; saveSess(q); host.hidden = true; });
  }

  /* ---- Popup na środku ---- */
  function popup(c) {
    var s = sess(); if (!c && (s.popup || blocked())) return;
    s.popup = 1; saveSess(s);
    var wrap = document.createElement('div'); wrap.className = 'adv-overlay'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-label', LABEL);
    wrap.innerHTML = html('popup', c || pick()); document.body.appendChild(wrap);
    function close() { wrap.classList.add('is-out'); setTimeout(function () { wrap.remove(); document.removeEventListener('keydown', key); var q = sess(); q.popupAt = Date.now(); saveSess(q); }, 220); }
    function key(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', key);
    wrap.addEventListener('click', function (e) { if (e.target === wrap) close(); });
    wrap.querySelector('.adv-x').addEventListener('click', close);
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

  function start() {
    if (document.getElementById('ads-gallery')) return;
    setTimeout(function () { strip(); }, 1200);
    setTimeout(function () { popup(); }, CFG.popupDelay);
    var t = setInterval(function () { var s = sess(); if ((s.boxN || 0) >= CFG.boxMax) return clearInterval(t); if (Date.now() - T0 > CFG.boxDelay) box(); }, 5000);
    window.addEventListener('hashchange', function () { var h = document.getElementById('ad-top'); if (h) h.style.display = blocked() ? 'none' : ''; });
  }
  var T0 = Date.now();

  window.SliskaAds = {
    creatives: CREATIVES, html: html, config: CFG,
    show: function (fmt, i, side) { var c = CREATIVES[(i || 0) % CREATIVES.length]; if (fmt === 'popup') popup(c); else if (fmt === 'box') box(c, side || 'r'); else strip(c); },
    pick: pick,
    reset: function () { ss(false, SK, '{}'); ls(false, HK, '[]'); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
