/* Śliska News – własny edytor treści artykułów (zastępuje Quill).
   Zapisuje dokładnie ten sam HTML co dotychczas: p, h2, h3, blockquote, ul/ol (li.ql-indent-N), strong/em/u/s, a,
   oraz bloki: figure.article-figure, figure.article-gallery, aside.article-quote, aside.article-embed.
   Indeks „index” w API = numer bloku najwyższego poziomu (nie znaku). */
(function () {
  'use strict';

  var EMBED_SEL = 'figure.article-figure, figure.article-gallery, aside.article-quote, aside.article-embed';
  var TEXT_BLOCKS = { P: 1, H2: 1, H3: 1, BLOCKQUOTE: 1, LI: 1 };
  var MAX_INDENT = 5;

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function isEmbed(n) { return !!n && n.nodeType === 1 && n.matches(EMBED_SEL); }
  function embedType(n) {
    if (!n || n.nodeType !== 1) return '';
    if (n.matches('figure.article-figure')) return 'figure';
    if (n.matches('figure.article-gallery')) return 'gallery';
    if (n.matches('aside.article-quote')) return 'pullquote';
    if (n.matches('aside.article-embed')) return 'embed';
    return '';
  }
  function isBlank(n) { return !n.querySelector || (!n.querySelector('img') && n.textContent.replace(/​/g, '').trim() === ''); }
  function indentOf(b) { var m = /ql-indent-(\d)/.exec(b.className || ''); return m ? Number(m[1]) : 0; }
  function setIndent(b, n) {
    b.className = (b.className || '').replace(/\s*ql-indent-\d/g, '').trim();
    if (n > 0) b.className = (b.className ? b.className + ' ' : '') + 'ql-indent-' + n;
    if (!b.className) b.removeAttribute('class');
  }
  function ensureBr(b) { if (!b.firstChild) b.appendChild(document.createElement('br')); }
  function stripTrailingBr(b) { var l = b.lastChild; if (l && l.nodeName === 'BR' && b.childNodes.length === 1) b.removeChild(l); }

  /* ---------- bloki osadzone (te same, co dawniej w Quillu) ---------- */
  function build(type, value) {
    var node;
    if (type === 'figure') {
      node = el('figure', 'article-figure');
      var wrap = el('div', 'fig-media'), img = document.createElement('img');
      img.setAttribute('src', value.src); img.setAttribute('alt', value.caption || ''); wrap.appendChild(img);
      if (value.source) { var s = el('span', 'img-source'); s.textContent = value.source; wrap.appendChild(s); }
      node.appendChild(wrap);
      if (/^(left|right|center)$/.test(value.align || '')) node.setAttribute('data-align', value.align);
      if (/^[sml]$/.test(value.size || '')) node.setAttribute('data-size', value.size);
      if (/^[ab]$/.test(value.pair || '')) node.setAttribute('data-pair', value.pair);
      if (value.caption) { var c = document.createElement('figcaption'); c.textContent = value.caption; node.appendChild(c); }
    } else if (type === 'gallery') {
      node = el('figure', 'article-gallery');
      var track = el('div', 'gallery-track');
      (value.images || []).forEach(function (im) { var i = document.createElement('img'); i.setAttribute('src', im.src); i.setAttribute('alt', value.caption || ''); track.appendChild(i); });
      node.appendChild(track);
      if ((value.images || []).length > 1) { var n = el('span', 'gallery-count'); n.textContent = value.images.length + ' zdjęć'; node.appendChild(n); }
      if (value.caption) { var gc = document.createElement('figcaption'); gc.textContent = value.caption; node.appendChild(gc); }
    } else if (type === 'pullquote') {
      node = el('aside', 'article-quote');
      var text = el('p', 'q-text'), parts = Array.isArray(value.parts) && value.parts.length > 1 ? value.parts : null;
      if (parts) {
        text.classList.add('has-mid');
        parts.forEach(function (t, i) { var sp = el('span', i % 2 ? 'q-mid' : 'q-part'); sp.textContent = t; text.appendChild(sp); });
      } else text.textContent = value.text || '';
      node.appendChild(text);
      if (value.author || value.source) {
        var by = el('p', 'q-by');
        if (value.author) { var a = el('span', 'q-author'); a.textContent = value.author; by.appendChild(a); }
        if (value.source) { var so = el('span', 'q-source'); so.textContent = value.source; by.appendChild(so); }
        node.appendChild(by);
      }
    } else if (type === 'embed') {
      node = el('aside', 'article-embed');
      node.setAttribute('data-kind', value.kind); node.setAttribute('data-id', value.id);
      var lb = el('span', 'embed-label'); lb.textContent = (value.kind === 'youtube' ? '▶ Film z YouTube' : value.kind === 'instagram' ? '◎ Post z Instagrama' : '♫ Odtwarzacz Spotify') + ' – kliknij, aby zmienić lub usunąć'; node.appendChild(lb);
    }
    node.setAttribute('contenteditable', 'false');
    return node;
  }
  function read(type, node) {
    if (type === 'figure') {
      var img = node.querySelector('img'), cap = node.querySelector('figcaption'), src = node.querySelector('.img-source');
      return { src: img ? img.getAttribute('src') : '', caption: cap ? cap.textContent : '', source: src ? src.textContent : '', align: node.getAttribute('data-align') || '', size: node.getAttribute('data-size') || '', pair: node.getAttribute('data-pair') || '' };
    }
    if (type === 'gallery') {
      var gc = node.querySelector('figcaption');
      return { images: Array.prototype.map.call(node.querySelectorAll('.gallery-track img'), function (i) { return { src: i.getAttribute('src') || '' }; }), caption: gc ? gc.textContent : '' };
    }
    if (type === 'pullquote') {
      var q = node.querySelector('.q-text'), au = node.querySelector('.q-author'), so = node.querySelector('.q-source');
      var spans = q ? Array.prototype.filter.call(q.children, function (x) { return x.classList.contains('q-part') || x.classList.contains('q-mid'); }) : [];
      if (spans.length > 1) { var parts = spans.map(function (x) { return x.textContent; }); return { text: parts[0], parts: parts, author: au ? au.textContent : '', source: so ? so.textContent : '' }; }
      return { text: q ? q.textContent : '', author: au ? au.textContent : '', source: so ? so.textContent : '' };
    }
    if (type === 'embed') return { kind: node.getAttribute('data-kind') || '', id: node.getAttribute('data-id') || '' };
    return {};
  }

  /* ---------- edytor ---------- */
  function SEditor(host, opt) {
    var self = this;
    this.opt = opt || {};
    this.host = this.container = host;
    host.innerHTML = '';
    host.classList.add('se');
    this.toolbar = el('div', 'se-toolbar');
    this.root = el('div', 'se-root ql-editor');
    this.root.setAttribute('contenteditable', 'true');
    this.root.setAttribute('spellcheck', 'true');
    ['data-gramm', 'data-gramm_editor', 'data-enable-grammarly', 'data-lt-active'].forEach(function (a) { this.root.setAttribute(a, 'false'); }, this);   // bez nakładek dodatków (Grammarly / LanguageTool)
    this.root.setAttribute('lang', 'pl');
    this.root.setAttribute('role', 'textbox');
    this.root.setAttribute('aria-multiline', 'true');
    this.root.setAttribute('data-placeholder', this.opt.placeholder || '');
    this.root.innerHTML = '<p><br></p>';
    this.linkbar = el('div', 'se-linkbar');
    this.linkbar.hidden = true;
    this.linkbar.innerHTML = '<input type="text" placeholder="Wklej adres https://…" aria-label="Adres linku"><button type="button" class="btn btn-sm btn-primary" data-lk="ok">Zastosuj</button><button type="button" class="btn btn-sm" data-lk="rm">Usuń link</button><button type="button" class="btn btn-sm btn-ghost" data-lk="x" aria-label="Zamknij">✕</button>';
    host.appendChild(this.toolbar);
    host.appendChild(this.linkbar);
    host.appendChild(this.root);
    this.handlers = {};
    this.hist = []; this.hi = -1; this._snapT = 0; this._restoring = false; this._composing = false;
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); document.execCommand('styleWithCSS', false, false); } catch (e) { /* ignoruj */ }
    this._buildToolbar();
    this._bind();
    this._bindExtra();
    this._blankClass();
    this._snap(true);
  }

  var P = SEditor.prototype;
  SEditor.build = build; SEditor.read = read; SEditor.embedType = embedType;

  P.on = function (name, fn) { (this.handlers[name] = this.handlers[name] || []).push(fn); return this; };
  P._emit = function (name, a) { (this.handlers[name] || []).forEach(function (f) { try { f(a); } catch (e) { console.error(e); } }); };
  P._changed = function () { this._blankClass(); this._emit('text-change'); this._snapSoon(); };
  P._blankClass = function () {
    var r = this.root, only = r.children.length === 1 && r.firstElementChild.tagName === 'P' && isBlank(r.firstElementChild);
    r.classList.toggle('se-blank', only);
  };
  P.focus = function () { this.root.focus({ preventScroll: true }); };

  /* ---------- zaznaczenie ---------- */
  P.range = function () {
    var s = window.getSelection(); if (!s || !s.rangeCount) return null;
    var r = s.getRangeAt(0); return this.root.contains(r.startContainer) && this.root.contains(r.endContainer) ? r : null;
  };
  P.blockOf = function (n) {
    while (n && n !== this.root) {
      if (n.nodeType === 1 && (TEXT_BLOCKS[n.tagName] || isEmbed(n)) && (n.parentNode === this.root || (n.tagName === 'LI' && n.parentNode.parentNode === this.root))) return n;
      n = n.parentNode;
    }
    return null;
  };
  P.topOf = function (b) { return b && b.tagName === 'LI' ? b.parentNode : b; };
  P._leafBlocks = function () {
    var out = [], self = this;
    Array.prototype.forEach.call(this.root.children, function (c) {
      if (c.tagName === 'UL' || c.tagName === 'OL') Array.prototype.forEach.call(c.children, function (li) { out.push(li); });
      else out.push(c);
    });
    return out;
  };
  P._selectedBlocks = function () {
    var r = this.range(); if (!r) return [];
    var a = this.blockOf(r.startContainer), b = this.blockOf(r.endContainer); if (!a || !b) return [];
    var all = this._leafBlocks(), i = all.indexOf(a), j = all.indexOf(b);
    if (i < 0 || j < 0) return [a];
    if (i > j) { var t = i; i = j; j = t; }
    return all.slice(i, j + 1).filter(function (x) { return !isEmbed(x); });
  };
  P._place = function (node, off) {
    var s = window.getSelection(), r = document.createRange();
    try { r.setStart(node, off); r.collapse(true); s.removeAllRanges(); s.addRange(r); } catch (e) { /* ignoruj */ }
  };
  P._placeStart = function (b) {
    if (!b) return;
    var w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT), t = w.nextNode();
    if (t) this._place(t, 0); else this._place(b, 0);
  };
  P._placeEnd = function (b) {
    if (!b) return;
    var w = document.createTreeWalker(b, NodeFilter.SHOW_TEXT), last = null, n;
    while ((n = w.nextNode())) last = n;
    if (last) this._place(last, last.nodeValue.length); else this._place(b, 0);
  };
  P._saveSel = function () {
    var s = window.getSelection(), root = this.root;
    if (!s || !s.rangeCount) return null;
    var r = s.getRangeAt(0); if (!root.contains(r.startContainer) || !root.contains(r.endContainer)) return null;
    function path(n) { var p = []; while (n && n !== root) { p.unshift(Array.prototype.indexOf.call(n.parentNode.childNodes, n)); n = n.parentNode; } return p; }
    return { s: path(r.startContainer), so: r.startOffset, e: path(r.endContainer), eo: r.endOffset };
  };
  P._loadSel = function (st) {
    if (!st) return;
    var root = this.root;
    function at(p) { var n = root; for (var i = 0; i < p.length; i++) { n = n && n.childNodes[p[i]]; } return n; }
    var a = at(st.s), b = at(st.e); if (!a || !b) return;
    try {
      var r = document.createRange(), max = function (n, o) { return Math.min(o, n.nodeType === 3 ? n.nodeValue.length : n.childNodes.length); };
      r.setStart(a, max(a, st.so)); r.setEnd(b, max(b, st.eo));
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    } catch (e) { /* ignoruj */ }
  };

  /* ---------- normalizacja ---------- */
  function retag(n, tag, self) {
    var e = document.createElement(tag);
    while (n.firstChild) e.appendChild(n.firstChild);
    if (n.className && /ql-indent/.test(n.className)) e.className = n.className;
    n.parentNode.replaceChild(e, n);
    if (self && self._remap) self._remap(n, e);
    return e;
  }
  P._remap = function (o, n) { if (!this._sel) return; var s = this._sel; if (s.sc === o) s.sc = n; if (s.ec === o) s.ec = n; };
  P._fixInline = function (scope) {
    var self = this;
    var map = { B: 'strong', I: 'em', STRIKE: 's', DEL: 's', EM: 'em', STRONG: 'strong' };
    Array.prototype.slice.call(scope.querySelectorAll('b,i,strike,del,font,span,h1,h4,h5,h6,center,code,mark,small,sup,sub')).forEach(function (n) {
      if (n.closest && n.closest('figure.article-figure, figure.article-gallery, aside.article-quote, aside.article-embed')) return;
      var tag = n.tagName;
      if (/^H[1-6]$/.test(tag)) return;
      if (map[tag]) { var e = document.createElement(map[tag]); while (n.firstChild) e.appendChild(n.firstChild); n.parentNode.replaceChild(e, n); self._remap(n, e); return; }
      var p = n.parentNode; while (n.firstChild) p.insertBefore(n.firstChild, n); p.removeChild(n);
    });
  };
  P.norm = function () {
    if (this._composing) return;
    var root = this.root, self = this, s = window.getSelection(), r = s && s.rangeCount ? s.getRangeAt(0) : null;
    if (!this._pinned) this._sel = r && root.contains(r.startContainer) ? { sc: r.startContainer, so: r.startOffset, ec: r.endContainer, eo: r.endOffset } : null;
    var changed = false;
    // 1. elementy najwyższego poziomu
    Array.prototype.slice.call(root.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        if (!n.nodeValue.trim()) { root.removeChild(n); changed = true; return; }
        var p = document.createElement('p'); root.replaceChild(p, n); p.appendChild(n); changed = true; return;
      }
      if (n.nodeType !== 1) { root.removeChild(n); changed = true; return; }
      if (isEmbed(n)) { if (n.getAttribute('contenteditable') !== 'false') n.setAttribute('contenteditable', 'false'); return; }
      var tag = n.tagName;
      if (tag === 'UL' || tag === 'OL') return;
      if (tag === 'H1') { retag(n, 'h2', self); changed = true; return; }
      if (/^H[4-6]$/.test(tag)) { retag(n, 'h3', self); changed = true; return; }
      if (tag === 'P' || tag === 'H2' || tag === 'H3' || tag === 'BLOCKQUOTE') return;
      if (tag === 'BR') { var pp = document.createElement('p'); root.replaceChild(pp, n); pp.appendChild(n); changed = true; return; }
      // div i inne: jeśli zawiera bloki – wypakuj; w przeciwnym razie zamień na akapit
      var hasBlock = n.querySelector('p,h2,h3,h1,ul,ol,blockquote,div,figure,aside');
      if (hasBlock) { var kids = Array.prototype.slice.call(n.childNodes); kids.forEach(function (k) { root.insertBefore(k, n); }); root.removeChild(n); changed = true; return; }
      if (['A', 'STRONG', 'EM', 'U', 'S', 'SPAN', 'B', 'I'].indexOf(tag) >= 0) { var wp = document.createElement('p'); root.replaceChild(wp, n); wp.appendChild(n); changed = true; return; }
      retag(n, 'p', self); changed = true;
    });
    // 2. listy: tylko li; wnętrza bloków – bez bloków zagnieżdżonych
    Array.prototype.slice.call(root.querySelectorAll('ul,ol')).forEach(function (l) {
      if (l.parentNode !== root) { var top = self.topOf(l.parentNode); if (top && top.parentNode === root) { root.insertBefore(l, top.nextSibling); changed = true; } else { l.parentNode.removeChild(l); } return; }
      Array.prototype.slice.call(l.childNodes).forEach(function (c) {
        if (c.nodeType === 1 && c.tagName === 'LI') return;
        if (c.nodeType === 3 && !c.nodeValue.trim()) { l.removeChild(c); return; }
        var li = document.createElement('li'); l.replaceChild(li, c); li.appendChild(c); changed = true;
      });
      if (!l.firstChild) { root.removeChild(l); changed = true; }
    });
    Array.prototype.slice.call(root.querySelectorAll('li')).forEach(function (li) {
      Array.prototype.slice.call(li.querySelectorAll('ul,ol,p,div,h2,h3,blockquote')).forEach(function (x) {
        if (isEmbed(x)) return;
        var par = x.parentNode; while (x.firstChild) par.insertBefore(x.firstChild, x); par.removeChild(x); changed = true;
      });
    });
    // 3. wnętrza bloków tekstowych: div → rozwiń, style/atrybuty precz, formaty inline
    Array.prototype.slice.call(root.querySelectorAll('p,h2,h3,blockquote,li')).forEach(function (b) {
      if (isEmbed(b) || (b.closest && b.closest('figure,aside'))) return;
      Array.prototype.slice.call(b.querySelectorAll('div,p')).forEach(function (x) {
        if (isEmbed(x) || x.closest('figure,aside')) return;
        var par = x.parentNode; if (x.nextSibling) par.insertBefore(document.createElement('br'), x.nextSibling);
        while (x.firstChild) par.insertBefore(x.firstChild, x); par.removeChild(x); changed = true;
      });
    });
    this._fixInline(root);
    Array.prototype.slice.call(root.querySelectorAll('*')).forEach(function (n) {
      if (n.closest && n.closest('figure.article-figure, figure.article-gallery, aside.article-quote, aside.article-embed')) { if (n.hasAttribute('style')) n.removeAttribute('style'); return; }
      Array.prototype.slice.call(n.attributes).forEach(function (a) {
        var keep = (a.name === 'class' && /^ql-indent-\d$/.test(a.value)) || (n.tagName === 'A' && a.name === 'href');
        if (!keep) n.removeAttribute(a.name);
      });
    });
    // 4. sąsiednie listy tego samego typu łączymy
    var c = root.firstElementChild;
    while (c) {
      var nx = c.nextElementSibling;
      if ((c.tagName === 'UL' || c.tagName === 'OL') && nx && nx.tagName === c.tagName) { while (nx.firstChild) c.appendChild(nx.firstChild); root.removeChild(nx); changed = true; continue; }
      c = nx;
    }
    // 5. puste bloki mają <br>, brak dwóch osadzonych obok siebie, akapity na początku i końcu
    Array.prototype.slice.call(root.querySelectorAll('p,h2,h3,blockquote,li')).forEach(function (b) { if (!isEmbed(b) && !(b.closest && b.closest('figure,aside'))) ensureBr(b); });
    if (!root.firstElementChild) { root.innerHTML = '<p><br></p>'; changed = true; }
    if (isEmbed(root.firstElementChild)) { var p0 = document.createElement('p'); p0.appendChild(document.createElement('br')); root.insertBefore(p0, root.firstChild); changed = true; }
    if (isEmbed(root.lastElementChild)) { var p1 = document.createElement('p'); p1.appendChild(document.createElement('br')); root.appendChild(p1); changed = true; }
    // przywróć zaznaczenie, jeśli węzły przeżyły
    if (this._sel) {
      var st = this._sel, cur = s.rangeCount ? s.getRangeAt(0) : null;
      if (root.contains(st.sc) && root.contains(st.ec) && !(cur && cur.startContainer === st.sc && cur.startOffset === st.so && cur.endContainer === st.ec && cur.endOffset === st.eo)) {
        try {
          var rr = document.createRange(), mx = function (n, o) { return Math.min(o, n.nodeType === 3 ? n.nodeValue.length : n.childNodes.length); };
          rr.setStart(st.sc, mx(st.sc, st.so)); rr.setEnd(st.ec, mx(st.ec, st.eo)); s.removeAllRanges(); s.addRange(rr);
        } catch (e) { /* ignoruj */ }
      }
    }
    if (!this._pinned) this._sel = null;
    return changed;
  };

  /* ---------- API zgodne z dotychczasowym użyciem w aplikacji ---------- */
  P.getHTML = function () {
    this.norm();
    var c = this.root.cloneNode(true);
    Array.prototype.forEach.call(c.querySelectorAll('[contenteditable]'), function (n) { n.removeAttribute('contenteditable'); });
    Array.prototype.forEach.call(c.children, function (n) { if (/^(P|H2|H3|BLOCKQUOTE)$/.test(n.tagName)) ensureBr(n); });
    return c.innerHTML;
  };
  P.setHTML = function (html) {
    this._restoring = true;
    var doc = new DOMParser().parseFromString('<body>' + (html || '') + '</body>', 'text/html');
    this.root.innerHTML = '';
    while (doc.body.firstChild) this.root.appendChild(doc.body.firstChild);
    this.norm();
    this._restoring = false;
    this._blankClass();
    this.hist = []; this.hi = -1; this._snap(true);
  };
  P.getText = function () {
    return this._leafBlocks().filter(function (b) { return !isEmbed(b); }).map(function (b) { return b.textContent.replace(/​/g, ''); }).join('\n');
  };
  P.getLength = function () {
    var kids = Array.prototype.filter.call(this.root.children, function (c) { return !(c.tagName === 'P' && isBlank(c)) || false; });
    if (!kids.length) return 1;
    return this.root.children.length + 1;
  };
  P.indexOfBlock = function (n) { var b = this.blockOf(n) || n; return Array.prototype.indexOf.call(this.root.children, this.topOf(b)); };
  P.getSelection = function (focus) {
    var r = this.range();
    if (!r) {
      if (focus) { this.focus(); this._placeEnd(this.root.lastElementChild); r = this.range(); }
      if (!r) return { index: Math.max(0, this.root.children.length - 1), length: 0, saved: false };
    }
    var b = this.blockOf(r.startContainer) || this.root.lastElementChild, top = this.topOf(b), k = Array.prototype.indexOf.call(this.root.children, top);
    var blank = b && b.tagName === 'P' && isBlank(b);
    return { index: blank ? k : k + 1, length: 0, saved: true };
  };
  P.setSelection = function (index) {
    var kids = this.root.children, b = kids[Math.min(Math.max(0, index), kids.length - 1)];
    if (!b) return;
    if (isEmbed(b)) b = b.nextElementSibling || b.previousElementSibling;
    if (b && (b.tagName === 'UL' || b.tagName === 'OL')) b = b.firstElementChild;
    this._placeStart(b);
  };
  P.insertEmbed = function (index, type, value) {
    this._snap(true);
    var node = build(type, value), kids = this.root.children, ref = kids[index] || null;
    this.root.insertBefore(node, ref);
    this.norm(); this._changed(); this._snap(true);
    return node;
  };
  P.deleteText = function (index) {
    var n = this.root.children[index]; if (!n) return;
    this._snap(true);
    this.root.removeChild(n); this.norm(); this._changed(); this._snap(true);
  };

  /* ---------- operacje na blokach ---------- */
  P._splitListAt = function (li) {
    var list = li.parentNode, after = document.createElement(list.tagName.toLowerCase()), n = li.nextSibling;
    while (n) { var nx = n.nextSibling; after.appendChild(n); n = nx; }
    list.removeChild(li);
    if (after.firstChild) list.parentNode.insertBefore(after, list.nextSibling);
    var anchor = list;
    if (!list.firstChild) { anchor = list.nextSibling; list.parentNode.removeChild(list); }
    return { beforeNode: anchor };
  };
  P._toBlock = function (b, tag) {
    var self = this;
    if (b.tagName === tag.toUpperCase()) return b;
    var ind = indentOf(b), e;
    if (b.tagName === 'LI') {
      var list = b.parentNode, tailList = document.createElement(list.tagName.toLowerCase()), n = b.nextSibling;
      while (n) { var nx = n.nextSibling; tailList.appendChild(n); n = nx; }
      e = document.createElement(tag);
      while (b.firstChild) e.appendChild(b.firstChild);
      list.parentNode.insertBefore(e, list.nextSibling);
      list.removeChild(b);
      if (tailList.firstChild) list.parentNode.insertBefore(tailList, e.nextSibling);
      if (!list.firstChild) list.parentNode.removeChild(list);
      this._remap(b, e);
    } else {
      e = retag(b, tag, this);
    }
    if (tag === 'p' && ind) setIndent(e, ind); else e.removeAttribute('class');
    ensureBr(e);
    return e;
  };
  P._toList = function (b, kind) {
    var tag = kind === 'ol' ? 'OL' : 'UL';
    if (b.tagName === 'LI' && b.parentNode.tagName === tag) return b;
    var li = document.createElement('li'), ind = indentOf(b);
    if (b.tagName === 'LI') {
      var list = b.parentNode, tailList = document.createElement(list.tagName.toLowerCase()), n = b.nextSibling;
      while (n) { var nx = n.nextSibling; tailList.appendChild(n); n = nx; }
      var nl = document.createElement(tag.toLowerCase());
      while (b.firstChild) li.appendChild(b.firstChild);
      nl.appendChild(li);
      list.parentNode.insertBefore(nl, list.nextSibling);
      list.removeChild(b);
      if (tailList.firstChild) list.parentNode.insertBefore(tailList, nl.nextSibling);
      if (!list.firstChild) list.parentNode.removeChild(list);
    } else {
      while (b.firstChild) li.appendChild(b.firstChild);
      var l = document.createElement(tag.toLowerCase()); l.appendChild(li);
      b.parentNode.replaceChild(l, b);
    }
    this._remap(b, li);
    if (ind) setIndent(li, ind);
    ensureBr(li);
    return li;
  };
  P._withSel = function (fn) {
    var r = this.range(), st = r ? { sc: r.startContainer, so: r.startOffset, ec: r.endContainer, eo: r.endOffset } : null;
    this._sel = st; this._pinned = true;
    fn.call(this);
    this.norm();
    var s = this._sel;
    this._sel = null; this._pinned = false;
    if (s && this.root.contains(s.sc) && this.root.contains(s.ec)) {
      try {
        var rr = document.createRange(), mx = function (n, o) { return Math.min(o, n.nodeType === 3 ? n.nodeValue.length : n.childNodes.length); };
        rr.setStart(s.sc, mx(s.sc, s.so)); rr.setEnd(s.ec, mx(s.ec, s.eo));
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(rr);
      } catch (e) { /* ignoruj */ }
    }
    this._changed(); this._snap(true);
    this._updateToolbar();
  };
  P.setBlockType = function (type) {
    var self = this, blocks = this._selectedBlocks(); if (!blocks.length) return;
    this._snap(true);
    this._withSel(function () {
      var cur = blocks.map(function (b) { return b.tagName === 'LI' ? b.parentNode.tagName.toLowerCase() : b.tagName.toLowerCase(); });
      var allSame = cur.every(function (c) { return c === (type === 'quote' ? 'blockquote' : type); });
      blocks.forEach(function (b) {
        if (!b.parentNode) return;
        if (type === 'ul' || type === 'ol') { if (allSame) self._toBlock(b, 'p'); else self._toList(b, type); return; }
        if (type === 'quote') { if (allSame) self._toBlock(b, 'p'); else self._toBlock(b, 'blockquote'); return; }
        self._toBlock(b, type === 'p' ? 'p' : type);
      });
    });
  };
  P.indent = function (delta) {
    var blocks = this._selectedBlocks(); if (!blocks.length) return;
    this._snap(true);
    this._withSel(function () {
      blocks.forEach(function (b) {
        if (isEmbed(b) || /^H[23]$/.test(b.tagName) || b.tagName === 'BLOCKQUOTE') return;
        setIndent(b, Math.max(0, Math.min(MAX_INDENT, indentOf(b) + delta)));
      });
    });
  };
  P.clearFormat = function () {
    var blocks = this._selectedBlocks(), self = this; if (!blocks.length) return;
    this._snap(true);
    try { document.execCommand('removeFormat'); document.execCommand('unlink'); } catch (e) { /* ignoruj */ }
    this._withSel(function () { blocks.forEach(function (b) { if (b.parentNode) { var e = self._toBlock(b, 'p'); if (e) e.removeAttribute('class'); } }); });
  };
  P.format = function (cmd) {
    this._snap(true);
    this.focus();
    try { document.execCommand(cmd); } catch (e) { /* ignoruj */ }
    this.norm(); this._changed(); this._snap(true); this._updateToolbar();
  };

  /* ---------- link ---------- */
  P.openLink = function () {
    var r = this.range(); if (!r) { this.focus(); this._placeEnd(this.root.lastElementChild); r = this.range(); }
    this._linkSel = this._saveSel();
    var a = (function (n) { while (n && n.nodeType !== 1) n = n.parentNode; return n && n.closest ? n.closest('a') : null; })(r.startContainer);
    var inp = this.linkbar.querySelector('input');
    inp.value = a ? a.getAttribute('href') || '' : '';
    this.linkbar.querySelector('[data-lk=rm]').hidden = !a;
    this.linkbar.hidden = false;
    inp.focus(); inp.select();
  };
  P._applyLink = function (url) {
    var inp = this.linkbar;
    this.linkbar.hidden = true;
    this.focus(); this._loadSel(this._linkSel);
    url = String(url || '').trim();
    if (!url) { this.format('unlink'); return; }
    if (!/^(https?:|mailto:)/i.test(url)) url = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(url) ? 'mailto:' + url : 'https://' + url;
    var r = this.range(); if (!r) return;
    this._snap(true);
    if (r.collapsed) {
      var a = document.createElement('a'); a.setAttribute('href', url); a.textContent = url.replace(/^mailto:/, '');
      r.insertNode(a); this._place(a.nextSibling || a.parentNode, 0);
    } else { try { document.execCommand('createLink', false, url); } catch (e) { /* ignoruj */ } }
    this.norm(); this._changed(); this._snap(true);
  };

  /* ---------- wklejanie ---------- */
  P._insertBlocks = function (blocks) {
    var r = this.range(); if (!r || !blocks.length) return;
    this._snap(true);
    if (!r.collapsed) { r.deleteContents(); this.norm(); r = this.range(); if (!r) return; }
    if (blocks.length === 1 && blocks[0].tagName === 'P') {
      var f = document.createDocumentFragment(), last;
      Array.prototype.slice.call(blocks[0].childNodes).forEach(function (c) { f.appendChild(c); last = c; });
      r.insertNode(f);
      if (last) { var rr = document.createRange(); rr.setStartAfter(last); rr.collapse(true); var s = window.getSelection(); s.removeAllRanges(); s.addRange(rr); }
      this.norm(); this._changed(); this._snap(true); return;
    }
    var b = this.blockOf(r.startContainer) || this.root.lastElementChild;
    if (isEmbed(b)) b = b.nextElementSibling;
    var tailR = document.createRange(); tailR.setStart(r.startContainer, r.startOffset); tailR.setEnd(b, b.childNodes.length);
    var tailFrag = tailR.extractContents(), tail = null;
    if (!isBlank({ querySelector: function (q) { return tailFrag.querySelector(q); }, textContent: tailFrag.textContent })) {
      tail = document.createElement(b.tagName === 'LI' ? 'li' : (/^H[23]$/.test(b.tagName) ? 'p' : b.tagName.toLowerCase()));
      tail.appendChild(tailFrag);
    }
    var top = this.topOf(b), ref = top.nextSibling, lastNode = null, self = this;
    var headBlank = isBlank(b);
    if (b.tagName === 'LI' && tail) { /* reszta listy zostaje przy ogonie */ }
    blocks.forEach(function (n) { self.root.insertBefore(n, ref); lastNode = n; });
    if (tail) { if (tail.tagName === 'LI') { var l = document.createElement(b.parentNode.tagName.toLowerCase()); l.appendChild(tail); self.root.insertBefore(l, ref); } else self.root.insertBefore(tail, ref); }
    if (headBlank) { if (b.tagName === 'LI' && b.parentNode.children.length === 1) b.parentNode.parentNode.removeChild(b.parentNode); else if (b.parentNode) b.parentNode.removeChild(b); }
    this.norm();
    var lb = lastNode && lastNode.parentNode ? lastNode : null;
    if (lb) this._placeEnd(lb.tagName === 'UL' || lb.tagName === 'OL' ? lb.lastElementChild : lb);
    this._changed(); this._snap(true);
  };
  P._pasteText = function (text) {
    var lines = String(text || '').replace(/\r/g, '').split('\n'), blocks = lines.filter(function (l) { return l.trim(); }).map(function (l) { var p = document.createElement('p'); p.textContent = l; return p; });
    if (blocks.length === 1 && lines.length === 1) { this._snap(true); try { document.execCommand('insertText', false, lines[0]); } catch (e) { /* ignoruj */ } this.norm(); this._changed(); return; }
    this._insertBlocks(blocks);
  };

  /* ---------- Enter / Backspace / Delete ---------- */
  P._onEnter = function (e) {
    e.preventDefault();
    var r = this.range(); if (!r) return;
    this._snap(true);
    if (!r.collapsed) { r.deleteContents(); this.norm(); r = this.range(); if (!r) return; }
    var b = this.blockOf(r.startContainer);
    if (!b || isEmbed(b)) { var np0 = document.createElement('p'); np0.appendChild(document.createElement('br')); this.root.appendChild(np0); this._placeStart(np0); this._changed(); return; }
    var blank = isBlank(b), tag = b.tagName;
    if (blank && (tag === 'LI' || tag === 'BLOCKQUOTE')) {
      if (indentOf(b) > 0) setIndent(b, indentOf(b) - 1);
      else { var self0 = this; this._withSel(function () { self0._toBlock(b, 'p'); }); this._placeStart(this.blockOf(this.range() ? this.range().startContainer : null) || b); return; }
      this._changed(); return;
    }
    var tail = document.createRange(); tail.setStart(r.startContainer, r.startOffset); tail.setEnd(b, b.childNodes.length);
    var frag = tail.extractContents(), tailBlank = !frag.querySelector('img') && frag.textContent.replace(/​/g, '').trim() === '';
    var nt = tag === 'LI' ? 'li' : tag === 'BLOCKQUOTE' ? 'blockquote' : (/^H[23]$/.test(tag) ? (tailBlank ? 'p' : tag.toLowerCase()) : 'p');
    var nb = document.createElement(nt);
    if (tailBlank) nb.appendChild(document.createElement('br')); else nb.appendChild(frag);
    if ((tag === 'LI' || tag === 'P') && indentOf(b)) setIndent(nb, indentOf(b));
    ensureBr(b);
    if (isBlank(b) && !b.querySelector('br')) b.appendChild(document.createElement('br'));
    b.parentNode.insertBefore(nb, b.nextSibling);
    this.norm();
    this._placeStart(nb);
    this._changed(); this._snap(true);
    this._scrollCaret();
  };
  P._atStart = function (r, b) {
    var t = document.createRange(); t.setStart(b, 0); t.setEnd(r.startContainer, r.startOffset);
    return t.toString().replace(/​/g, '') === '' && !t.cloneContents().querySelector('img');
  };
  P._atEnd = function (r, b) {
    var t = document.createRange(); t.setStart(r.startContainer, r.startOffset); t.setEnd(b, b.childNodes.length);
    return t.toString().replace(/​/g, '') === '' && !t.cloneContents().querySelector('img');
  };
  P._neighbor = function (b, dir) {
    var all = this._leafBlocks(), i = all.indexOf(b); return i < 0 ? null : all[i + dir] || null;
  };
  P._mergeInto = function (a, b) {          // dopisz zawartość b na koniec a, usuń b
    stripTrailingBr(a);
    var n = a.childNodes.length, self = this;
    while (b.firstChild) a.appendChild(b.firstChild);
    if (b.tagName === 'LI' && b.parentNode.children.length === 1) b.parentNode.parentNode.removeChild(b.parentNode); else b.parentNode.removeChild(b);
    ensureBr(a);
    var s = window.getSelection(), r = document.createRange(), node = a.childNodes[n];
    try { if (node && node.nodeType === 3) r.setStart(node, 0); else if (node) r.setStartBefore(node); else r.setStart(a, a.childNodes.length); r.collapse(true); s.removeAllRanges(); s.addRange(r); } catch (e) { /* ignoruj */ }
  };
  P._onBackspace = function (e) {
    var r = this.range(); if (!r || !r.collapsed) return;
    var b = this.blockOf(r.startContainer); if (!b || isEmbed(b) || !this._atStart(r, b)) return;
    e.preventDefault(); this._snap(true);
    var self = this;
    if (indentOf(b) > 0) { setIndent(b, indentOf(b) - 1); this._changed(); return; }
    if (b.tagName !== 'P') { this._withSel(function () { self._toBlock(b, 'p'); }); return; }
    var prev = this._neighbor(b, -1);
    if (!prev) return;
    if (isEmbed(prev)) { prev.parentNode.removeChild(prev); this.norm(); this._changed(); this._snap(true); return; }
    this._mergeInto(prev, b); this.norm(); this._changed(); this._snap(true);
  };
  P._onDelete = function (e) {
    var r = this.range(); if (!r || !r.collapsed) return;
    var b = this.blockOf(r.startContainer); if (!b || isEmbed(b) || !this._atEnd(r, b)) return;
    var next = this._neighbor(b, 1); if (!next) return;
    e.preventDefault(); this._snap(true);
    if (isEmbed(next)) { next.parentNode.removeChild(next); this.norm(); this._changed(); this._snap(true); return; }
    var keepEmpty = isBlank(b) && b.tagName === 'P';
    if (keepEmpty) { var nx = next; b.parentNode.removeChild(b); this._placeStart(nx); } else this._mergeInto(b, next);
    this.norm(); this._changed(); this._snap(true);
  };
  P._scrollCaret = function () {
    var r = this.range(); if (!r) return;
    var rect = r.getBoundingClientRect ? r.getBoundingClientRect() : null;
    if (!rect || (!rect.top && !rect.bottom)) { var b = this.blockOf(r.startContainer); rect = b && b.getBoundingClientRect ? b.getBoundingClientRect() : null; }
    if (!rect) return;
    var h = window.innerHeight, top = (this.opt.stickyTop || 110);
    if (rect.bottom > h - 70) window.scrollBy({ top: rect.bottom - h + 120, behavior: 'instant' });
    else if (rect.top < top) window.scrollBy({ top: rect.top - top - 40, behavior: 'instant' });
  };

  /* ---------- skróty markdown ---------- */
  P._onSpace = function (e) {
    var r = this.range(); if (!r || !r.collapsed) return false;
    var b = this.blockOf(r.startContainer); if (!b || b.tagName !== 'P') return false;
    var t = document.createRange(); t.setStart(b, 0); t.setEnd(r.startContainer, r.startOffset);
    var pre = t.toString(), self = this, act = null;
    if (pre === '##') act = function () { self._toBlock(b, 'h2'); };
    else if (pre === '###') act = function () { self._toBlock(b, 'h3'); };
    else if (pre === '-' || pre === '*') act = function () { self._toList(b, 'ul'); };
    else if (pre === '1.') act = function () { self._toList(b, 'ol'); };
    else if (pre === '>') act = function () { if (self.opt.onQuote) self.opt.onQuote(); };
    if (!act) return false;
    e.preventDefault(); this._snap(true);
    t.deleteContents(); ensureBr(b);
    var gone = pre === '>';
    this._withSel(act);
    if (gone) { this._changed(); }
    return true;
  };

  /* ---------- historia (cofnij / ponów) ---------- */
  P._snap = function (force) {
    clearTimeout(this._snapT);
    if (this._restoring) return;
    var html = this.root.innerHTML, cur = this.hist[this.hi];
    if (cur && cur.html === html) { if (force) cur.sel = this._saveSel() || cur.sel; return; }
    this.hist = this.hist.slice(0, this.hi + 1);
    this.hist.push({ html: html, sel: this._saveSel() });
    if (this.hist.length > 120) this.hist.shift();
    this.hi = this.hist.length - 1;
  };
  P._snapSoon = function () { var self = this; clearTimeout(this._snapT); this._snapT = setTimeout(function () { self._snap(); }, 450); };
  P._restore = function (h) {
    this._restoring = true;
    this.root.innerHTML = h.html;
    this._restoring = false;
    this.focus(); this._loadSel(h.sel);
    this._blankClass(); this._emit('text-change'); this._updateToolbar();
  };
  P.undo = function () {
    this._snap();
    if (this.hi <= 0) return;
    this.hi--; this._restore(this.hist[this.hi]);
  };
  P.redo = function () {
    this._snap();
    if (this.hi >= this.hist.length - 1) return;
    this.hi++; this._restore(this.hist[this.hi]);
  };

  /* ---------- pasek narzędzi ---------- */
  var ICON = {
    bold: '<path d="M6 4h5a3 3 0 0 1 0 6H6zM6 10h6a3 3 0 0 1 0 6H6z"/>',
    italic: '<path d="M10 4h6M4 16h6M12 4 8 16"/>',
    underline: '<path d="M5 4v6a5 5 0 0 0 10 0V4M4 17h12"/>',
    strike: '<path d="M4 10h12M13.5 6.2C13 4.9 11.7 4 10 4 8 4 6.5 5 6.5 6.6c0 1 .7 1.7 1.8 2.2M6.5 13.4C7 15 8.4 16 10.2 16c2 0 3.3-1 3.3-2.6 0-.5-.2-1-.6-1.4"/>',
    quote: '<path d="M3.5 5.5h5v5c0 2.4-1.3 3.9-3.8 4v-1.6c1.1-.2 1.8-1 1.8-2.4H3.5zM11 5.5h5v5c0 2.4-1.3 3.9-3.8 4v-1.6c1.1-.2 1.8-1 1.8-2.4H11z" fill="currentColor" stroke="none"/>',
    embed: '<rect x="2.5" y="4" width="15" height="12" rx="3"/><path d="M8.5 7.5v5L12.8 10z" fill="currentColor" stroke="none"/>',
    gallery: '<rect x="5" y="3" width="12" height="10" rx="2"/><path d="M3 6v8a2 2 0 0 0 2 2h9"/>',
    ol: '<path d="M8 5h9M8 10h9M8 15h9M3 4.5l1-.7V8M3 12h2l-2 3h2.2"/>',
    ul: '<path d="M8 5h9M8 10h9M8 15h9"/><circle cx="4" cy="5" r="1" fill="currentColor"/><circle cx="4" cy="10" r="1" fill="currentColor"/><circle cx="4" cy="15" r="1" fill="currentColor"/>',
    outdent: '<path d="M8 5h9M8 10h9M3 15h14M6 7.5 3.5 10 6 12.5"/>',
    indent: '<path d="M8 5h9M8 10h9M3 15h14M3.5 7.5 6 10l-2.5 2.5"/>',
    link: '<path d="M8.5 11.5a3 3 0 0 0 4.2 0l2.6-2.6a3 3 0 0 0-4.2-4.2l-.9.9M11.5 8.5a3 3 0 0 0-4.2 0L4.7 11.1a3 3 0 0 0 4.2 4.2l.9-.9"/>',
    image: '<rect x="3" y="4" width="14" height="12" rx="2.5"/><circle cx="7.5" cy="8.5" r="1.3"/><path d="m4 15 4.2-4 3 2.6L14 11l3 3"/>',
    clean: '<path d="M5 5h10M10 5v10M7 15h6"/><path d="m3.5 3.5 13 13"/>',
    spell: '<path d="M3 14 7 4l4 10M4.4 11h5.2M12 14l2.2 2.2L18 11"/>',
    undo: '<path d="M4 8h8a4 4 0 0 1 0 8H8M4 8l3-3M4 8l3 3"/>',
    redo: '<path d="M16 8H8a4 4 0 0 0 0 8h4M16 8l-3-3M16 8l-3 3"/>'
  };
  function ico(k) { return '<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICON[k] + '</svg>'; }
  P._buildToolbar = function () {
    var self = this, t = this.toolbar;
    var groups = [
      [['select']],
      [['bold', 'Pogrubienie (Ctrl+B)'], ['italic', 'Kursywa (Ctrl+I)'], ['underline', 'Podkreślenie (Ctrl+U)'], ['strike', 'Przekreślenie']],
      [['quote', 'Cytat (ze źródłem i autorem)'], ['embed', 'Wstaw film z YouTube lub odtwarzacz Spotify'], ['gallery', 'Galeria zdjęć (kilka zdjęć do przewijania)']],
      [['ol', 'Lista numerowana'], ['ul', 'Lista punktowana'], ['outdent', 'Zmniejsz wcięcie'], ['indent', 'Zwiększ wcięcie']],
      [['link', 'Wstaw link (Ctrl+K)'], ['image', 'Wstaw zdjęcie z podpisem']],
      [['clean', 'Wyczyść formatowanie'], ['undo', 'Cofnij (Ctrl+Z)'], ['redo', 'Ponów (Ctrl+Shift+Z)']]
    ];
    groups.forEach(function (g) {
      var wrap = el('span', 'se-group');
      g.forEach(function (it) {
        if (it[0] === 'select') {
          var sel = el('select', 'se-select'); sel.setAttribute('aria-label', 'Styl akapitu');
          sel.innerHTML = '<option value="p">Akapit</option><option value="h2">Nagłówek 2</option><option value="h3">Nagłówek 3</option>';
          sel.addEventListener('change', function () { self.focus(); self.setBlockType(sel.value); });
          wrap.appendChild(sel); return;
        }
        var b = el('button', 'se-btn se-' + it[0], ico(it[0])); b.type = 'button'; b.title = it[1]; b.setAttribute('aria-label', it[1]); b.dataset.cmd = it[0];
        b.addEventListener('mousedown', function (e) { e.preventDefault(); });
        b.addEventListener('click', function (e) { e.preventDefault(); self._cmd(it[0]); });
        wrap.appendChild(b);
      });
      t.appendChild(wrap);
    });
  };
  P._cmd = function (c) {
    var o = this.opt;
    if (c === 'bold') this.format('bold'); else if (c === 'italic') this.format('italic'); else if (c === 'underline') this.format('underline'); else if (c === 'strike') this.format('strikeThrough');
    else if (c === 'ol') this.setBlockType('ol'); else if (c === 'ul') this.setBlockType('ul');
    else if (c === 'indent') this.indent(1); else if (c === 'outdent') this.indent(-1);
    else if (c === 'link') this.openLink();
    else if (c === 'clean') this.clearFormat();
    else if (c === 'spell') this.spell();
    else if (c === 'undo') this.undo(); else if (c === 'redo') this.redo();
    else if (c === 'image' && o.onImage) o.onImage(); else if (c === 'gallery' && o.onGallery) o.onGallery();
    else if (c === 'quote' && o.onQuote) o.onQuote(); else if (c === 'embed' && o.onEmbed) o.onEmbed();
  };
  P._updateToolbar = function () {
    var r = this.range(), tb = this.toolbar; if (!r) return;
    var st = {};
    try { st.bold = document.queryCommandState('bold'); st.italic = document.queryCommandState('italic'); st.underline = document.queryCommandState('underline'); st.strike = document.queryCommandState('strikeThrough'); } catch (e) { /* ignoruj */ }
    var b = this.blockOf(r.startContainer), tag = b ? b.tagName : 'P';
    st.ol = tag === 'LI' && b.parentNode.tagName === 'OL'; st.ul = tag === 'LI' && b.parentNode.tagName === 'UL';
    Array.prototype.forEach.call(tb.querySelectorAll('.se-btn'), function (x) { x.classList.toggle('on', !!st[x.dataset.cmd]); });
    var sel = tb.querySelector('.se-select'); if (sel) sel.value = tag === 'H2' ? 'h2' : tag === 'H3' ? 'h3' : 'p';
  };

  /* ---------- zdarzenia ---------- */
  P._bind = function () {
    var self = this, root = this.root;
    root.addEventListener('keydown', function (e) {
      var mod = e.ctrlKey || e.metaKey;
      if (e.isComposing || e.keyCode === 229) return;
      if (mod && !e.altKey) {
        var k = e.key.toLowerCase();
        if (k === 'z') { e.preventDefault(); if (e.shiftKey) self.redo(); else self.undo(); return; }
        if (k === 'y') { e.preventDefault(); self.redo(); return; }
        if (k === 'k') { e.preventDefault(); self.openLink(); return; }
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) { self._onEnter(e); return; }
      if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); self._snap(true); try { document.execCommand('insertLineBreak'); } catch (x) { /* ignoruj */ } self._changed(); return; }
      if (e.key === 'Backspace') { self._onBackspace(e); return; }
      if (e.key === 'Delete') { self._onDelete(e); return; }
      if (e.key === ' ' && !e.shiftKey) { self._onSpace(e); return; }
    });
    root.addEventListener('beforeinput', function (e) {
      if (e.inputType === 'historyUndo') { e.preventDefault(); self.undo(); }
      else if (e.inputType === 'historyRedo') { e.preventDefault(); self.redo(); }
    });
    root.addEventListener('input', function () { if (self._restoring) return; self.norm(); self._changed(); });
    root.addEventListener('compositionstart', function () { self._composing = true; });
    root.addEventListener('compositionend', function () { self._composing = false; self.norm(); self._changed(); });
    root.addEventListener('blur', function () { self.norm(); self._snap(); });
    root.addEventListener('paste', function (e) {
      var dt = e.clipboardData; if (!dt) return;
      var files = Array.prototype.filter.call(dt.files || [], function (f) { return /^image\//.test(f.type); });
      if (files.length) { e.preventDefault(); e.stopPropagation(); if (self.opt.onFiles) self.opt.onFiles(files, self.getSelection(true).index); return; }
      var html = dt.getData('text/html'), text = dt.getData('text/plain');
      var one = String(text || '').trim();
      if (/^https?:\/\/\S+$/i.test(one)) {
        var ev = self.opt.parseEmbed && self.opt.parseEmbed(one), rr = self.range();
        if (ev && rr && rr.collapsed) { e.preventDefault(); var si = self.getSelection(true).index; self.insertEmbed(si, 'embed', ev); if (self.opt.onEmbedPasted) self.opt.onEmbedPasted(ev); return; }
        if (rr && !rr.collapsed) { e.preventDefault(); self._snap(true); try { document.execCommand('createLink', false, one); } catch (x) { /* ignoruj */ } self.norm(); self._changed(); self._snap(true); return; }
      }
      e.preventDefault();
      var blocksHtml = '';
      if (html && /article-(figure|quote|embed|gallery)/.test(html) && self.opt.sanitize) blocksHtml = self.opt.sanitize(html);
      else if (html && self.opt.cleanPaste) blocksHtml = self.opt.cleanPaste(html);
      if (blocksHtml) {
        var doc = new DOMParser().parseFromString('<body>' + blocksHtml + '</body>', 'text/html');
        var blocks = Array.prototype.slice.call(doc.body.children).map(function (n) { return document.importNode(n, true); });
        if (blocks.length) { self._insertBlocks(blocks); if (self.opt.onPaste) self.opt.onPaste(); return; }
      }
      self._pasteText(text);
    });
    root.addEventListener('drop', function (e) {
      var files = Array.prototype.filter.call((e.dataTransfer && e.dataTransfer.files) || [], function (f) { return /^image\//.test(f.type); });
      if (!files.length) return;
      e.preventDefault(); e.stopPropagation();
      var idx = Math.max(0, self.root.children.length - 1), pos = document.caretRangeFromPoint ? document.caretRangeFromPoint(e.clientX, e.clientY) : null;
      if (pos && self.root.contains(pos.startContainer)) { var b = self.blockOf(pos.startContainer); if (b) idx = Array.prototype.indexOf.call(self.root.children, self.topOf(b)) + 1; }
      if (self.opt.onFiles) self.opt.onFiles(files, idx);
    }, true);
    root.addEventListener('dragover', function (e) { if (e.dataTransfer && Array.prototype.some.call(e.dataTransfer.types || [], function (t) { return t === 'Files'; })) e.preventDefault(); });
    root.addEventListener('click', function (e) {
      var emb = e.target.closest && e.target.closest(EMBED_SEL);
      if (emb && root.contains(emb)) { e.preventDefault(); if (self.opt.onEmbedClick) self.opt.onEmbedClick(emb, embedType(emb)); return; }
      var a = e.target.closest && e.target.closest('a');
      if (a && root.contains(a)) e.preventDefault();
    });
    document.addEventListener('selectionchange', function () { if (self.range()) self._updateToolbar(); });
    this.linkbar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lk]'); if (!b) return;
      var v = b.dataset.lk;
      if (v === 'ok') self._applyLink(self.linkbar.querySelector('input').value);
      else if (v === 'rm') { self.linkbar.hidden = true; self.focus(); self._loadSel(self._linkSel); self.format('unlink'); }
      else { self.linkbar.hidden = true; self.focus(); self._loadSel(self._linkSel); }
    });
    this.linkbar.querySelector('input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); self._applyLink(this.value); }
      else if (e.key === 'Escape') { e.preventDefault(); self.linkbar.hidden = true; self.focus(); self._loadSel(self._linkSel); }
    });
  };


  /* ======================= dodatki: typografia, pasek nad zaznaczeniem, wklejanie linków, pisownia ======================= */

  /** Reguły „mądrej” typografii. prev = tekst przed kursorem, d = wpisywany znak. Zwraca {del, ins, keep} albo null. */
  SEditor.typo = function (prev, d) {
    var open = /(^|[\s(\[{„‚–—\/])$/.test(prev);
    if (d === '"') return { del: 0, ins: open ? '„' : '”' };
    if (d === "'" && /[\p{L}\d]$/u.test(prev)) return { del: 0, ins: '’' };
    if (d === '.' && /(^|[^.])\.\.$/.test(prev)) return { del: 2, ins: '…' };
    if (d === ' ' && /\s-$/.test(prev)) return { del: 1, ins: '–', keep: true };
    if (d === '-' && /(^|[^-])-$/.test(prev) && prev.length > 1) return { del: 1, ins: '–' };
    return null;
  };
  /** Zamiana typografii w całym łańcuchu (przycisk „Popraw cudzysłowy i myślniki”). */
  SEditor.smart = function (str, startPrev) {
    var out = '', prev = startPrev || '';
    for (var i = 0; i < str.length; i++) {
      var ch = str[i], rep = ch;
      if (ch === '"' || ch === '“' || ch === '”' || ch === '„') rep = /(^|[\s(\[{„‚–—\/])$/.test(prev) || prev === '' ? '„' : '”';
      else if (ch === "'" && /[\p{L}\d]$/u.test(prev) && /[\p{L}\d]/u.test(str[i + 1] || '')) rep = '’';
      else if (ch === '.' && str.slice(i, i + 3) === '...') { out += '…'; prev = '…'; i += 2; continue; }
      else if (ch === '-' && /\s$/.test(prev) && /^(-{1,2})(\s|$)/.test(str.slice(i))) { var m = /^-{1,2}/.exec(str.slice(i))[0]; out += '–'; prev = '–'; i += m.length - 1; continue; }
      out += rep; prev = rep;
    }
    return out;
  };
  P.fixTypography = function () {
    this._snap(true);
    var w = document.createTreeWalker(this.root, NodeFilter.SHOW_TEXT, null), n, last = '', cur = null, count = 0;
    var nodes = []; while ((n = w.nextNode())) nodes.push(n);
    nodes.forEach(function (t) {
      if (t.parentNode.closest && t.parentNode.closest('figure,aside,a')) return;
      var b = t.parentNode; while (b && b !== this.root && !TEXT_BLOCKS[b.tagName]) b = b.parentNode;
      if (b !== cur) { cur = b; last = ''; }
      var v = SEditor.smart(t.nodeValue, last);
      if (v !== t.nodeValue) { count += 1; t.nodeValue = v; }
      if (t.nodeValue) last = t.nodeValue.slice(-1);
    }, this);
    this._changed(); this._snap(true);
    return count;
  };
  function applyTypo(prev, ev, doInsert) {
    if (ev.inputType !== 'insertText' || !ev.data || ev.data.length !== 1) return false;
    var r = SEditor.typo(prev, ev.data); if (!r) return false;
    if (!r.keep) ev.preventDefault();
    doInsert(r);
    return true;
  }
  /* pola tekstowe (tytuł, lead, podpisy, cytaty…) */
  function isTypoField(t) {
    if (!t || !t.tagName) return false;
    var tag = t.tagName;
    if (tag === 'TEXTAREA') { /* ok */ } else if (tag === 'INPUT') { if (t.type !== 'text') return false; } else return false;
    if (t.readOnly || t.disabled || t.hasAttribute('data-notypo')) return false;
    if (/(url|link|mail|pass|search|tags|slug|score|year|code|file|time|date|phone)/i.test(t.id + ' ' + (t.name || ''))) return false;
    if (t.inputMode && t.inputMode !== 'text') return false;
    return true;
  }
  document.addEventListener('beforeinput', function (ev) {
    var t = ev.target;
    if (!isTypoField(t) || ev.isComposing) return;
    var s = t.selectionStart, en = t.selectionEnd; if (s == null) return;
    var prev = t.value.slice(0, s);
    applyTypo(prev, ev, function (r) {
      t.setRangeText(r.ins, s - r.del, en, 'end');
      t.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }, true);
  SEditor.smartField = function (el) { var v = SEditor.smart(el.value, ''); if (v !== el.value) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); return true; } return false; };

  P._bindExtra = function () {
    var self = this, root = this.root;
    // typografia w edytorze
    root.addEventListener('beforeinput', function (ev) {
      if (ev.isComposing || self._composing) return;
      var r = self.range(); if (!r || !r.collapsed) return;
      var b = self.blockOf(r.startContainer); if (!b || isEmbed(b)) return;
      var t = document.createRange(); t.setStart(b, 0); t.setEnd(r.startContainer, r.startOffset);
      var prev = t.toString();
      applyTypo(prev, ev, function (res) {
        self._snap(true);
        var sel = window.getSelection();
        for (var i = 0; i < res.del; i++) sel.modify('extend', 'backward', 'character');
        document.execCommand('insertText', false, res.ins);
      });
    });
    // pływający pasek nad zaznaczeniem
    this._float = el('div', 'se-float');
    this._float.hidden = true;
    this._float.setAttribute('role', 'toolbar');
    var defs = [['bold', 'bold', 'Pogrubienie'], ['italic', 'italic', 'Kursywa'], ['underline', 'underline', 'Podkreślenie'], ['strike', 'strike', 'Przekreślenie'], ['|'], ['h2', 'H2', 'Nagłówek'], ['h3', 'H3', 'Podnagłówek'], ['quote', 'quote', 'Cytat'], ['|'], ['link', 'link', 'Link'], ['clean', 'clean', 'Wyczyść formatowanie']];
    defs.forEach(function (d) {
      if (d[0] === '|') { this._float.appendChild(el('i', 'se-sep')); return; }
      var b = el('button', 'se-fbtn', /^H\d$/.test(d[1]) ? d[1] : ico(d[1])); b.type = 'button'; b.title = d[2]; b.setAttribute('aria-label', d[2]); b.dataset.f = d[0];
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });
      b.addEventListener('click', function (e) {
        e.preventDefault();
        var c = d[0];
        if (c === 'h2' || c === 'h3') { var blk = self._selectedBlocks()[0]; self.setBlockType(blk && blk.tagName === c.toUpperCase() ? 'p' : c); }
        else if (c === 'quote') self.setBlockType('quote');
        else self._cmd(c);
        self._floatSoon();
      });
      this._float.appendChild(b);
    }, this);
    document.body.appendChild(this._float);
    var coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
    this._floatT = 0;
    this._floatSoon = function () { clearTimeout(self._floatT); self._floatT = setTimeout(function () { self._floatUpdate(); }, 60); };
    this._floatUpdate = function () {
      var f = self._float, r = self.range();
      if (coarse || !r || r.collapsed || self._composing || !self.linkbar.hidden || !r.toString().trim()) { f.hidden = true; return; }
      var a = self.blockOf(r.startContainer), z = self.blockOf(r.endContainer);
      if (!a || !z || isEmbed(a) || isEmbed(z)) { f.hidden = true; return; }
      var rc = r.getBoundingClientRect(); if (!rc.width && !rc.height) { f.hidden = true; return; }
      f.hidden = false;
      var w = f.offsetWidth, h = f.offsetHeight, left = rc.left + rc.width / 2 - w / 2, top = rc.top - h - 10;
      if (top < 8) top = rc.bottom + 10;
      left = Math.max(8, Math.min(window.innerWidth - w - 8, left));
      f.style.left = left + 'px'; f.style.top = top + 'px';
      Array.prototype.forEach.call(f.querySelectorAll('.se-fbtn'), function (x) { x.classList.toggle('on', ({ bold: 1, italic: 1, underline: 1, strike: 1 })[x.dataset.f] ? !!document.queryCommandState(x.dataset.f === 'strike' ? 'strikeThrough' : x.dataset.f) : (x.dataset.f === 'h2' && a.tagName === 'H2') || (x.dataset.f === 'h3' && a.tagName === 'H3') || (x.dataset.f === 'quote' && a.tagName === 'BLOCKQUOTE')); });
    };
    document.addEventListener('selectionchange', function () { self._floatSoon(); });
    window.addEventListener('scroll', function () { if (!self._float.hidden) self._floatSoon(); }, { passive: true });
    window.addEventListener('resize', function () { self._floatSoon(); });
    root.addEventListener('blur', function () { setTimeout(function () { if (!self._float.contains(document.activeElement)) self._float.hidden = true; }, 120); });
  };

  /* ---------- sprawdzanie pisowni i gramatyki (LanguageTool) ---------- */
  P.spell = function () {
    var self = this, opt = this.opt, url = opt.spellUrl || 'https://api.languagetool.org/v2/check';
    var blocks = this._leafBlocks().filter(function (b) { return !isEmbed(b) && b.textContent.trim(); });
    if (!blocks.length) { if (opt.toast) opt.toast('Nie ma jeszcze tekstu do sprawdzenia.'); return; }
    var panel = this._spellPanel(); panel.hidden = false;
    var list = panel.querySelector('.se-spell-list'); list.innerHTML = '<p class="se-spell-msg">Sprawdzam tekst…</p>';
    var chunks = [], cur = { blocks: [], len: 0 };
    blocks.forEach(function (b) { var l = b.textContent.length + 1; if (cur.len + l > 14000 && cur.blocks.length) { chunks.push(cur); cur = { blocks: [], len: 0 }; } cur.blocks.push(b); cur.len += l; });
    chunks.push(cur);
    var found = [];
    var run = function (i) {
      if (i >= chunks.length) { self._spellShow(found); return Promise.resolve(); }
      var ch = chunks[i], text = ch.blocks.map(function (b) { return b.textContent; }).join('\n');
      return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ text: text, language: 'pl-PL' }) })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (j) {
          var starts = [], pos = 0; ch.blocks.forEach(function (b) { starts.push(pos); pos += b.textContent.length + 1; });
          (j.matches || []).forEach(function (m) {
            var cat = m.rule && m.rule.category && m.rule.category.id;
            if (cat === 'TYPOGRAPHY' || cat === 'STYLE' || cat === 'REDUNDANCY') return;
            var bi = starts.length - 1; while (bi > 0 && starts[bi] > m.offset) bi--;
            var b = ch.blocks[bi], lo = m.offset - starts[bi], hi = lo + m.length;
            if (hi > b.textContent.length) return;
            var rg = self._rangeIn(b, lo, hi); if (!rg) return;
            found.push({ range: rg, word: b.textContent.slice(lo, hi), msg: m.message || '', repl: (m.replacements || []).slice(0, 5).map(function (x) { return x.value; }), ctx: b.textContent.slice(Math.max(0, lo - 25), Math.min(b.textContent.length, hi + 25)), lo: Math.min(25, lo), len: m.length, spell: cat === 'TYPOS' });
          });
          return run(i + 1);
        });
    };
    run(0).catch(function () {
      list.innerHTML = '<p class="se-spell-msg">Nie udało się połączyć z usługą sprawdzania pisowni. Podkreślenia przeglądarki (czerwone linie) nadal działają – kliknij słowo prawym przyciskiem myszy.</p>';
    });
  };
  P._rangeIn = function (block, lo, hi) {
    var w = document.createTreeWalker(block, NodeFilter.SHOW_TEXT), n, pos = 0, r = document.createRange(), s = false;
    while ((n = w.nextNode())) {
      var len = n.nodeValue.length;
      if (!s && lo <= pos + len) { r.setStart(n, lo - pos); s = true; }
      if (s && hi <= pos + len) { r.setEnd(n, hi - pos); return r; }
      pos += len;
    }
    return null;
  };
  P._spellPanel = function () {
    if (this._sp) return this._sp;
    var self = this, p = el('div', 'se-spell');
    p.innerHTML = '<div class="se-spell-head"><strong>Pisownia i gramatyka</strong><button type="button" class="se-spell-x" aria-label="Zamknij">✕</button></div><div class="se-spell-list"></div><p class="se-spell-note">Tekst jest wysyłany do usługi LanguageTool (languagetool.org) wyłącznie po kliknięciu „Pisownia”.</p>';
    p.hidden = true;
    p.querySelector('.se-spell-x').addEventListener('click', function () { p.hidden = true; if (window.CSS && CSS.highlights) CSS.highlights.delete('se-err'); });
    document.body.appendChild(p);
    this._sp = p; return p;
  };
  P._spellShow = function (found) {
    var self = this, list = this._sp.querySelector('.se-spell-list');
    if (window.CSS && CSS.highlights && window.Highlight) { var hl = new Highlight(); found.forEach(function (f) { hl.add(f.range); }); CSS.highlights.set('se-err', hl); }
    if (!found.length) { list.innerHTML = '<p class="se-spell-msg">✓ Nie znaleziono błędów.</p>'; return; }
    list.innerHTML = '';
    found.forEach(function (f) {
      var it = el('div', 'se-spell-item');
      var ctx = el('div', 'se-spell-ctx');
      ctx.appendChild(document.createTextNode(f.ctx.slice(0, f.lo)));
      var mk = el('mark'); mk.textContent = f.ctx.slice(f.lo, f.lo + f.len); ctx.appendChild(mk);
      ctx.appendChild(document.createTextNode(f.ctx.slice(f.lo + f.len)));
      it.appendChild(ctx);
      var m = el('div', 'se-spell-m'); m.textContent = f.msg; it.appendChild(m);
      var row = el('div', 'se-spell-row');
      f.repl.forEach(function (v) {
        var b = el('button', 'btn btn-sm se-spell-fix'); b.type = 'button'; b.textContent = v;
        b.addEventListener('click', function () {
          if (f.range.collapsed && !f.range.toString()) return;
          self._snap(true);
          f.range.deleteContents(); f.range.insertNode(document.createTextNode(v));
          self._changed(); self._snap(true); it.remove();
          if (!list.children.length) list.innerHTML = '<p class="se-spell-msg">✓ Wszystko poprawione.</p>';
        });
        row.appendChild(b);
      });
      var skip = el('button', 'btn btn-sm btn-ghost'); skip.type = 'button'; skip.textContent = 'Pomiń';
      skip.addEventListener('click', function () { it.remove(); if (!list.children.length) list.innerHTML = '<p class="se-spell-msg">Gotowe.</p>'; });
      row.appendChild(skip); it.appendChild(row);
      ctx.addEventListener('click', function () {
        var n = f.range.startContainer; var blk = n.nodeType === 1 ? n : n.parentNode; if (blk && blk.scrollIntoView) blk.scrollIntoView({ block: 'center', behavior: 'smooth' });
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(f.range.cloneRange());
      });
      list.appendChild(it);
    });
  };

  window.SEditor = SEditor;
})();
