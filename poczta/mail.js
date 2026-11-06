/* Wspólny moduł poczty (okno „Nowa wiadomość” + szablony). Używają go /poczta/ i /reklamy/. Tylko Właściciel. */
(function () {
  'use strict';
  var API = (/^(news|dev)\.sliska\.pl$/.test(location.hostname) ? 'https://api.sliska.pl' : '/news/api');
  var ERR = {
    mail_not_configured: 'Wysyłka nie jest skonfigurowana w Workerze (brakuje sekretu RESEND_API_KEY).',
    send_failed: 'Nie udało się wysłać wiadomości.', to: 'Adres odbiorcy jest niepoprawny.', subject: 'Wpisz temat wiadomości.',
    text: 'Treść jest pusta albo zbyt długa (maks. 8000 znaków).', rate: 'Za dużo wiadomości – spróbuj za jakiś czas.', forbidden: 'Brak uprawnień – poczta jest tylko dla Właściciela.',
    name: 'Wpisz nazwę szablonu.', full: 'Osiągnięto limit szablonów.'
  };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  function token() { return window.devToken ? window.devToken() : Promise.reject(new Error('Brak logowania.')); }
  function api(path, body) {
    return token().then(function (t) {
      var o = { headers: { authorization: 'Bearer ' + t }, cache: 'no-store' };
      if (body) { o.method = 'POST'; o.body = JSON.stringify(body); o.headers['content-type'] = 'application/json'; }
      return fetch(API + path, o);
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) throw new Error((ERR[d.error] || ('Błąd ' + r.status + (d.error ? ' (' + d.error + ')' : ''))) + (d.detail ? ' – ' + d.detail : ''));
        return d;
      });
    });
  }

  var css = document.createElement('style');
  css.textContent =
    '.sm-ov{position:fixed;inset:0;z-index:5000;display:grid;place-items:center;padding:16px;background:rgba(10,12,18,.55)}' +
    '.sm-box{width:min(680px,100%);max-height:calc(100vh - 32px);overflow:auto;background:var(--card,#fff);color:var(--text,#1a1a1a);border-radius:22px;padding:20px 22px;display:flex;flex-direction:column;gap:12px;box-shadow:0 24px 60px rgba(0,0,0,.35);font:15px/1.5 Figtree,system-ui,sans-serif}' +
    '.sm-box.wide{width:min(900px,100%)}' +
    '.sm-h{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.sm-h b{display:block;font-size:1.12rem;font-weight:800}.sm-h small{color:var(--muted,#667085);font-size:.8rem}' +
    '.sm-f{display:block;font-size:.72rem;font-weight:800;color:var(--muted,#667085);text-transform:uppercase;letter-spacing:.05em}' +
    '.sm-f input,.sm-f select,.sm-f textarea{display:block;width:100%;margin-top:5px;padding:0 12px;height:42px;border-radius:12px;border:1px solid var(--line,#e4e7ec);background:var(--bg,#f4f5f7);color:var(--text,#1a1a1a);font:inherit;font-weight:500;text-transform:none;letter-spacing:0;box-sizing:border-box}' +
    '.sm-f textarea{height:auto;padding:10px 12px;resize:vertical;line-height:1.5;min-height:200px}' +
    '.sm-f input:focus,.sm-f select:focus,.sm-f textarea:focus{outline:2px solid var(--accent,#d6001c);outline-offset:1px}' +
    '.sm-r{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end}' +
    '.sm-b{height:40px;padding:0 20px;border-radius:99px;border:0;background:var(--accent,#d6001c);color:#fff;font:800 .9rem Figtree,system-ui,sans-serif;cursor:pointer;white-space:nowrap}.sm-b:disabled{opacity:.5;cursor:default}' +
    '.sm-b.g{background:var(--soft,#eef0f3);color:var(--text,#1a1a1a);font-weight:700}.sm-b.s{height:34px;padding:0 14px;font-size:.82rem}.sm-b.d{background:transparent;color:#d6001c;border:1px solid var(--line,#e4e7ec)}' +
    '.sm-m{min-height:1.2em;font-size:.88rem}.sm-m.e{color:#d6001c}.sm-m.o{color:#16a34a}.sm-a{display:flex;gap:8px;justify-content:space-between;align-items:center;flex-wrap:wrap}' +
    '.sm-hint{color:var(--muted,#667085);font-size:.78rem}.sm-hint code{background:var(--soft,#eef0f3);border-radius:6px;padding:1px 5px}' +
    '.sm-tp{display:grid;grid-template-columns:230px 1fr;gap:16px}.sm-tl{display:flex;flex-direction:column;gap:4px;max-height:420px;overflow:auto}' +
    '.sm-tl button{text-align:left;border:1px solid var(--line,#e4e7ec);background:var(--bg,#f4f5f7);color:var(--text,#1a1a1a);border-radius:12px;padding:9px 12px;font:600 .86rem Figtree,system-ui,sans-serif;cursor:pointer}.sm-tl button.on{border-color:var(--accent,#d6001c);background:color-mix(in srgb,var(--accent,#d6001c) 8%,var(--card,#fff))}' +
    '.sm-te{display:flex;flex-direction:column;gap:10px}.sm-te textarea{min-height:230px}' +
    '@media(max-width:640px){.sm-tp{grid-template-columns:1fr}.sm-tl{max-height:140px;flex-direction:row;flex-wrap:wrap}.sm-box{padding:16px}}';
  document.head.appendChild(css);

  /* ---------- szablony ---------- */
  var TPL = null;
  function loadTpls(force) {
    if (TPL && !force) return Promise.resolve(TPL);
    return api('/admin/mailtpl').then(function (d) { TPL = d.tpls || []; return TPL; }).catch(function () { return TPL || []; });
  }
  function fill(s, c) {
    c = c || {};
    return String(s || '').replace(/\s*„\{\{nazwa\}\}”/g, c.nazwa ? ' „' + c.nazwa + '”' : '').replace(/\{\{nazwa\}\}/g, c.nazwa || '').replace(/\{\{imie\}\}/g, c.name || '');
  }

  function overlay(inner, wide) {
    var o = document.createElement('div'); o.className = 'sm-ov';
    o.innerHTML = '<div class="sm-box' + (wide ? ' wide' : '') + '">' + inner + '</div>'; document.body.appendChild(o);
    return o;
  }

  function manageTemplates(onChange) {
    var o = overlay('<div class="sm-h"><div><b>Szablony wiadomości</b><small>Dodawaj, zmieniaj i usuwaj gotowe odpowiedzi.</small></div><button type="button" class="sm-b s g" data-x>Zamknij</button></div>' +
      '<div class="sm-tp"><div><button type="button" class="sm-b s" id="tp-new" style="width:100%;margin-bottom:8px">＋ Nowy szablon</button><div class="sm-tl" id="tp-list"></div></div>' +
      '<div class="sm-te"><label class="sm-f">Nazwa szablonu<input type="text" id="tp-name" maxlength="60" placeholder="np. Reklama przyjęta"></label>' +
      '<label class="sm-f">Temat (opcjonalnie)<input type="text" id="tp-sub" maxlength="160" placeholder="Temat wstawiany razem z szablonem"></label>' +
      '<label class="sm-f">Treść<textarea id="tp-body" maxlength="8000" placeholder="Dzień dobry,&#10;&#10;…"></textarea></label>' +
      '<p class="sm-hint">Zmienne: <code>{{nazwa}}</code> – nazwa reklamy lub odbiorcy, <code>{{imie}}</code> – imię/nazwa nadawcy. Podpis redakcji dodajemy automatycznie.</p>' +
      '<p class="sm-m" id="tp-msg" role="status"></p><div class="sm-a"><button type="button" class="sm-b d s" id="tp-del">Usuń</button><button type="button" class="sm-b" id="tp-save">Zapisz szablon</button></div></div></div>', true);
    var q = function (s) { return o.querySelector(s); }, cur = 0, say = function (t, k) { var m = q('#tp-msg'); m.textContent = t || ''; m.className = 'sm-m ' + (k || ''); };
    function paintList() {
      q('#tp-list').innerHTML = (TPL || []).map(function (t) { return '<button type="button" data-id="' + t.id + '" class="' + (t.id === cur ? 'on' : '') + '">' + esc(t.name) + '</button>'; }).join('') || '<p class="sm-hint">Brak szablonów.</p>';
    }
    function pick(id) {
      cur = id || 0; var t = (TPL || []).filter(function (x) { return x.id === cur; })[0] || { name: '', subject: '', body: '' };
      q('#tp-name').value = t.name; q('#tp-sub').value = t.subject; q('#tp-body').value = t.body; q('#tp-del').style.visibility = cur ? 'visible' : 'hidden'; say(''); paintList();
    }
    o.addEventListener('click', function (e) { if (e.target === o || e.target.closest('[data-x]')) o.remove(); var b = e.target.closest('#tp-list button'); if (b) pick(Number(b.dataset.id)); });
    q('#tp-new').onclick = function () { pick(0); q('#tp-name').focus(); };
    q('#tp-save').onclick = function () {
      var btn = this; btn.disabled = true; say('Zapisuję…');
      api('/admin/mailtpl', { action: 'save', id: cur, name: q('#tp-name').value, subject: q('#tp-sub').value, body: q('#tp-body').value }).then(function (d) {
        TPL = d.tpls || []; if (!cur) { var n = q('#tp-name').value.trim(); var f = TPL.filter(function (t) { return t.name === n; }).pop(); cur = f ? f.id : 0; }
        paintList(); say('Zapisano ✓', 'o'); btn.disabled = false; if (onChange) onChange();
      }).catch(function (er) { say(er.message, 'e'); btn.disabled = false; });
    };
    q('#tp-del').onclick = function () {
      if (!cur || !confirm('Usunąć ten szablon?')) return;
      api('/admin/mailtpl', { action: 'delete', id: cur }).then(function (d) { TPL = d.tpls || []; pick(0); if (onChange) onChange(); }).catch(function (er) { say(er.message, 'e'); });
    };
    loadTpls(true).then(function () { pick((TPL && TPL[0] && TPL[0].id) || 0); });
  }

  /* ---------- nowa wiadomość ---------- */
  function compose(opt) {
    opt = opt || {};
    var old = document.getElementById('sm-compose'); if (old) old.remove();
    var o = overlay('<div class="sm-h"><div><b>' + (opt.title || 'Nowa wiadomość') + '</b><small>Od: Redakcja Śliska News &lt;redakcja@sliska.pl&gt;</small></div><button type="button" class="sm-b s g" data-x>Zamknij</button></div>' +
      '<label class="sm-f">Do<input type="email" id="sm-to" value="' + esc(opt.to || '') + '" placeholder="adres@odbiorcy.pl" autocomplete="off"></label>' +
      '<label class="sm-f">Temat<input type="text" id="sm-sub" maxlength="160" value="' + esc(opt.subject || '') + '" placeholder="Własny temat wiadomości"></label>' +
      '<div class="sm-r"><label class="sm-f">Szablon<select id="sm-tpl"><option value="">Bez szablonu (pusta wiadomość)</option></select></label><button type="button" class="sm-b s g" id="sm-mng" style="height:42px">Zarządzaj szablonami</button></div>' +
      '<label class="sm-f">Treść<textarea id="sm-txt" rows="10" placeholder="Napisz wiadomość…">' + esc(opt.text || '') + '</textarea></label>' +
      '<p class="sm-hint">Pod wiadomością dodamy podpis „Redakcja Śliska News”. Odpowiedzi trafią do skrzynki Poczta.</p>' +
      '<p class="sm-m" id="sm-msg" role="status"></p><div class="sm-a"><span></span><button type="button" class="sm-b" id="sm-send">Wyślij</button></div>');
    o.id = 'sm-compose';
    var q = function (s) { return o.querySelector(s); }, touched = !!opt.subject && !opt.subjectAuto, last = '', ctx = { nazwa: opt.nazwa || '', name: opt.name || '' };
    var say = function (t, k) { var m = q('#sm-msg'); m.textContent = t || ''; m.className = 'sm-m ' + (k || ''); };
    q('#sm-sub').addEventListener('input', function () { touched = true; });
    function paintSel(keep) {
      var sel = q('#sm-tpl'), v = keep ? sel.value : '';
      sel.innerHTML = '<option value="">Bez szablonu (pusta wiadomość)</option>' + (TPL || []).map(function (t) { return '<option value="' + t.id + '">' + esc(t.name) + '</option>'; }).join('');
      if (v) sel.value = v;
    }
    function apply(id) {
      var t = (TPL || []).filter(function (x) { return String(x.id) === String(id); })[0], txt = q('#sm-txt');
      if (!t) return;
      var body = fill(t.body, ctx) + (opt.quote ? '\n\n' + opt.quote : '');
      if (txt.value.trim() && txt.value !== last && !confirm('Zastąpić wpisaną treść szablonem?')) { q('#sm-tpl').value = ''; return; }
      txt.value = body; last = body;
      var sj = fill(t.subject, ctx).trim();
      if (sj && !/^re:?$/i.test(sj) && !touched) q('#sm-sub').value = sj;
      txt.focus(); txt.setSelectionRange(0, 0);
    }
    q('#sm-tpl').onchange = function () { if (this.value) apply(this.value); };
    q('#sm-mng').onclick = function () { manageTemplates(function () { paintSel(true); }); };
    o.addEventListener('click', function (e) { if (e.target === o || e.target.closest('[data-x]')) o.remove(); });
    q('#sm-send').onclick = function () {
      var btn = this, body = { to: q('#sm-to').value.trim(), subject: q('#sm-sub').value.trim(), text: q('#sm-txt').value.trim(), name: ctx.name };
      if (!body.to || !body.subject || !body.text) { say('Uzupełnij adres, temat i treść.', 'e'); return; }
      btn.disabled = true; say('Wysyłam…');
      api('/admin/mail', body).then(function () { say('Wysłano ✓', 'o'); if (opt.onSent) opt.onSent(body); setTimeout(function () { o.remove(); }, 900); })
        .catch(function (er) { say(er.message, 'e'); btn.disabled = false; });
    };
    loadTpls().then(function () {
      paintSel(false);
      if (opt.tpl) { var f = (TPL || []).filter(function (t) { return t.name === opt.tpl; })[0]; if (f) { q('#sm-tpl').value = f.id; apply(f.id); } }
    });
    (opt.to ? q('#sm-txt') : q('#sm-to')).focus();
    return o;
  }

  window.SliskaMail = { compose: compose, manageTemplates: manageTemplates, api: api, esc: esc, loadTpls: loadTpls };
})();
