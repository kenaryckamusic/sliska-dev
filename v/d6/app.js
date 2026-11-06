/* =========================================================
   Śliska News – portal informacyjny z wbudowanym CMS
   Struktura pliku:
     1. CONFIG            – ustawienia (Firebase, limity, czasy autozapisu)
     2. Utils / Sanitizer – funkcje pomocnicze i czyszczenie HTML
     3. Dane startowe     – artykuły demonstracyjne (tylko tryb localStorage)
     4. DataService       – warstwa danych (Firebase Firestore / localStorage)
     5. Auth              – logowanie redaktora
     6. Aplikacja (UI)    – widoki, routing, edytor, wersje robocze, panel
   ========================================================= */
'use strict';

/* =========================================================
   1. KONFIGURACJA
   ========================================================= */
const CONFIG = {
  SITE_NAME: 'Śliska News',

  // true  = Firebase Firestore (artykuły widoczne dla wszystkich odwiedzających)
  // false = localStorage (tryb demonstracyjny, dane tylko w tej przeglądarce)
  USE_FIREBASE: true,

  // Gdy Firebase nie odpowiada: false = pokaż komunikat o błędzie (zalecane na stronie publicznej),
  // true = przełącz się na localStorage z artykułami demonstracyjnymi.
  ALLOW_LOCAL_FALLBACK: false,

  // Hasło redaktora – używane TYLKO w trybie localStorage (USE_FIREBASE: false).
  // W trybie Firebase logowanie odbywa się przez Firebase Authentication (e-mail + hasło).
  ADMIN_PASSWORD: 'admin123',

  // Opcjonalnie: UID konta redaktora (Firebase → Authentication → Users).
  // Jeśli go podasz, panel redaktora odblokuje się tylko dla tego konta.
  // Prawdziwą ochroną zapisu są i tak reguły Firestore.
  ADMIN_UID: '',

  MAX_ARTICLES: 40,        // ile najnowszych artykułów pobierać z bazy (oszczędza limit odczytów)
  PAGE_SIZE: 12,           // ile kafli pokazywać na stronie głównej, zanim pojawi się „Pokaż więcej”

  BUFFER_DELAY: 600,       // ms – kopia robocza w przeglądarce po każdej zmianie
  CLOUD_DRAFT_DELAY: 8000, // ms – zapis wersji roboczej w bazie po zmianie

  SESSION_KEY: 'sliska_admin_session',
  LOCAL_KEY: 'sliska_articles_v1',
  LOCAL_DRAFTS_KEY: 'sliska_drafts_v1',
  BUFFER_KEY: 'sliska_editor_buffers_v1',
  NEW_POINTER_KEY: 'sliska_editor_new_pointer',
  AUTHOR_KEY: 'sliska_last_author',

  FIREBASE_SDK_VERSION: '10.12.2',
  FIREBASE_COLLECTION: 'articles',
  FIREBASE_DRAFTS_COLLECTION: 'drafts',
  FIREBASE_CONFIG: {
    apiKey: 'AIzaSyA-cJXdFeRETW1SaYpkrYZ4loUEWQkzmvw',
    authDomain: 'altplus-news.firebaseapp.com',
    projectId: 'altplus-news',
    storageBucket: 'altplus-news.firebasestorage.app',
    messagingSenderId: '192116116300',
    appId: '1:192116116300:web:68d14f926726cfbc6adde9'
  }
};

const CATEGORIES = ['Muzyka', 'Kontrowersje', 'Dramy', 'Recenzje'];
const ALL = 'Wszystkie';

/* =========================================================
   2. NARZĘDZIA
   ========================================================= */
const Utils = {
  esc(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  uid(prefix = 'a_') {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  },

  _dateFmt: new Intl.DateTimeFormat('pl-PL', { dateStyle: 'long', timeStyle: 'short' }),
  formatDate(iso) {
    const d = new Date(iso);
    return isNaN(d) ? '' : this._dateFmt.format(d);
  },

  formatTime(iso) {
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  },

  /** Zamienia datę na format pola datetime-local (czas lokalny): RRRR-MM-DDTGG:MM */
  toLocalInput(date) {
    const d = new Date(date);
    if (isNaN(d)) return '';
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  },

  /** Lista kategorii artykułu (obsługuje stare artykuły z jedną kategorią). */
  catsOf(a) {
    if (a && Array.isArray(a.categories) && a.categories.length) return a.categories;
    return a && a.category ? [a.category] : [];
  },

  chipsHtml(a) {
    return '<span class="chips">' + this.catsOf(a).map(c =>
      `<a class="chip" href="#/kategoria/${encodeURIComponent(c)}">${this.esc(c)}</a>`).join('') + '</span>';
  },

  /** „6,4” / „6.4” → liczba 0–10 (jedno miejsce po przecinku) albo null. */
  parseScore(v) {
    const n = parseFloat(String(v ?? '').replace(',', '.'));
    return isFinite(n) && n >= 0 && n <= 10 ? Math.round(n * 10) / 10 : null;
  },

  formatScore(n) {
    return Number(n).toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  },

  stripHtml(html) {
    const doc = new DOMParser().parseFromString(html || '', 'text/html');
    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
  },

  countWords(text) {
    const t = String(text || '').trim();
    return t ? t.split(/\s+/).length : 0;
  },

  readingTime(article, plainText) {
    const words = this.countWords(`${article.lead || ''} ${plainText || ''}`);
    return Math.max(1, Math.ceil(words / 200));
  },

  debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  },

  loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Nie udało się załadować: ' + src));
      document.head.appendChild(s);
    });
  },

  /** Wczytuje plik graficzny, skaluje (max 960 px) i zwraca Base64 (data URL). */
  async fileToDataUrl(file, maxWidth = 960, quality = 0.72) {
    if (!file || !file.type.startsWith('image/')) {
      throw new Error('Wybrany plik nie jest obrazem.');
    }
    const raw = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Nie udało się odczytać pliku.'));
      reader.readAsDataURL(file);
    });
    if (file.type === 'image/gif') return raw; // zachowaj animację

    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Nie udało się wczytać obrazu.'));
      i.src = raw;
    });
    if (!img.naturalWidth) return raw;

    const scale = Math.min(1, maxWidth / img.naturalWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  },

  /** Zdjęcie profilowe: kadruje do kwadratu i zmniejsza (mały rozmiar zapisu). */
  async fileToSquare(file, size = 160) {
    const raw = await this.fileToDataUrl(file, 1600, 0.9);
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Nie udało się wczytać obrazu.'));
      i.src = raw;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    canvas.getContext('2d').drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
    return canvas.toDataURL('image/jpeg', 0.82);
  },

  placeholder(category) {
    const hues = { 'Muzyka': 265, 'Kontrowersje': 8, 'Dramy': 330, 'Recenzje': 45 };
    const hue = hues[category] ?? 200;
    const label = Utils.esc(category || CONFIG.SITE_NAME);
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="hsl(${hue},60%,40%)"/><stop offset="1" stop-color="hsl(${hue + 40},65%,20%)"/>` +
      `</linearGradient></defs><rect width="1280" height="720" fill="url(#g)"/>` +
      `<text x="640" y="395" font-family="Arial, sans-serif" font-size="72" font-weight="700" ` +
      `fill="rgba(255,255,255,.85)" text-anchor="middle">${label}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
};

/** Czyści HTML artykułu (ochrona przed XSS – ważne przy bazie w chmurze) i łączy kolejne cytaty. */
const Sanitizer = {
  TAGS: new Set(['p', 'br', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'blockquote',
    'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption', 'span', 'div', 'aside']),
  DROP: new Set(['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'form', 'input',
    'button', 'textarea', 'select', 'svg', 'math', 'base', 'template']),
  ATTRS: { a: ['href'], img: ['src', 'alt'], '*': ['class'] },

  clean(html) {
    const doc = new DOMParser().parseFromString(`<body>${html || ''}</body>`, 'text/html');
    this._walk(doc.body);
    this._collapse(doc.body);
    return doc.body.innerHTML;
  },

  /** Jeden Enter = nowa linia, dwa Entery = jedna pusta linia. Nadmiarowe puste akapity znikają. */
  _collapse(body) {
    const isEmpty = el => el.tagName === 'P' && !el.querySelector('img,figure') && el.textContent.trim() === '';
    const isHeading = el => !!el && /^H[1-6]$/.test(el.tagName);
    let prevEmpty = true; // puste akapity na początku też usuwamy
    Array.from(body.children).forEach(el => {
      if (isEmpty(el)) {
        // Nagłówek ma własny odstęp – pusta linia obok niego byłaby podwójną przerwą
        if (prevEmpty || isHeading(el.previousElementSibling) || isHeading(el.nextElementSibling)) el.remove(); else prevEmpty = true;
      } else {
        prevEmpty = false;
      }
    });
    while (body.lastElementChild && isEmpty(body.lastElementChild)) body.lastElementChild.remove();
  },

  /** HTML do wyświetlenia czytelnikowi: oczyszczony, a stare cytaty (blockquote) zamienione na nowy wygląd cytatu. */
  render(html) {
    return this.upgradeQuotes(this.clean(html));
  },

  /** Kolejne stare cytaty <blockquote> łączy w jeden blok cytatu (aside.article-quote). */
  upgradeQuotes(html) {
    const doc = new DOMParser().parseFromString(`<body>${html || ''}</body>`, 'text/html');
    let group = null;
    Array.from(doc.body.children).forEach(el => {
      if (el.tagName !== 'BLOCKQUOTE') { group = null; return; }
      const text = (el.innerText !== undefined ? el.innerText : el.textContent).trim() || el.textContent.trim();
      if (group) {
        const q = group.querySelector('.q-text');
        q.textContent += '\n' + text;
        el.remove();
      } else {
        const aside = doc.createElement('aside');
        aside.className = 'article-quote';
        const p = doc.createElement('p');
        p.className = 'q-text';
        p.textContent = text;
        aside.appendChild(p);
        el.replaceWith(aside);
        group = aside;
      }
    });
    return doc.body.innerHTML;
  },

  _walk(node) {
    Array.from(node.childNodes).forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) return;
      if (child.nodeType !== Node.ELEMENT_NODE) { child.remove(); return; }

      const tag = child.tagName.toLowerCase();
      if (this.DROP.has(tag)) { child.remove(); return; }

      this._walk(child);

      if (!this.TAGS.has(tag)) {
        child.replaceWith(...Array.from(child.childNodes));
        return;
      }

      Array.from(child.attributes).forEach(attr => {
        const name = attr.name.toLowerCase();
        const allowed = (this.ATTRS[tag] || []).includes(name) || this.ATTRS['*'].includes(name);
        if (!allowed) { child.removeAttribute(attr.name); return; }
        const val = attr.value.trim();
        if (name === 'href' && !/^(https?:|mailto:|\/|#)/i.test(val)) child.removeAttribute('href');
        if (name === 'src' && !/^(https?:|data:image\/(png|jpe?g|gif|webp);base64,)/i.test(val)) child.removeAttribute('src');
      });

      if (tag === 'a') {
        child.setAttribute('target', '_blank');
        child.setAttribute('rel', 'noopener noreferrer');
      }
      if (tag === 'img') child.setAttribute('loading', 'lazy');
    });
  }
};

/* =========================================================
   3. DANE STARTOWE (tylko tryb localStorage / demonstracyjny)
   ========================================================= */
function seedArticles() {
  const now = Date.now();
  const ago = minutes => new Date(now - minutes * 60000).toISOString();

  return [
    {
      id: 'seed-1',
      title: 'Witamy w Śliska News – tak wygląda artykuł z ramką faktów i cytatem',
      lead: 'To artykuł demonstracyjny trybu lokalnego. Zaloguj się jako redaktor, aby dodawać, edytować i planować własne materiały.',
      category: 'Muzyka',
      author: 'Redakcja Śliska News',
      image: '',
      urgent: false,
      featured: true,
      infobox: [
        { label: 'Rodzaj', value: 'Artykuł demonstracyjny' },
        { label: 'Edytor', value: 'Quill.js (WYSIWYG)' },
        { label: 'Źródło', value: 'Redakcja' }
      ],
      content:
        '<h2>Jak to działa?</h2>' +
        '<p>Kliknięcie w kafel otwiera artykuł <strong>bez przeładowania strony</strong>, a adres w przeglądarce można skopiować i wysłać dalej.</p>' +
        '<blockquote>Pierwsza linia cytatu.</blockquote>' +
        '<blockquote>Druga linia – cytat jest ciągły, bez przerw między liniami.</blockquote>' +
        '<h3>Co potrafi redaktor?</h3>' +
        '<ul><li>pisać w edytorze z autozapisem wersji roboczych,</li><li>planować publikację na wybraną godzinę,</li><li>dodawać ramkę faktów i zdjęcia z podpisem.</li></ul>',
      createdAt: ago(20),
      updatedAt: ago(20)
    },
    {
      id: 'seed-2',
      title: 'PILNE: przykładowy komunikat na pasku najświeższych wiadomości',
      lead: 'Artykuł oznaczony flagą „Pilne” pojawia się w czerwonym pasku na samej górze serwisu.',
      category: 'Dramy',
      author: 'Redakcja Śliska News',
      image: '',
      urgent: true,
      featured: false,
      infobox: [],
      content: '<p>To przykładowy materiał demonstracyjny. Flagę <strong>„Pilne”</strong> ustawia się w panelu Ustawienia w edytorze.</p>',
      createdAt: ago(45),
      updatedAt: ago(45)
    },
    {
      id: 'seed-3',
      title: 'Przykładowy materiał z kategorii Kontrowersje',
      lead: 'Każdy kafel na stronie głównej zawiera zdjęcie, kategorię, tytuł, zajawkę oraz datę publikacji.',
      category: 'Kontrowersje',
      author: 'Anna Kowalska',
      image: '',
      urgent: false,
      featured: false,
      infobox: [{ label: 'Miejsce', value: 'Polska' }],
      content: '<p>Wyszukiwarka w nagłówku filtruje kafle na żywo – po tytule, zajawce i treści artykułu.</p>',
      createdAt: ago(180),
      updatedAt: ago(180)
    }
    ,
    {
      id: 'seed-4',
      title: 'Recenzja: nowy album, który dzieli słuchaczy',
      lead: 'Przykładowa recenzja z oceną w kółku – wystarczy zaznaczyć „Dodaj ocenę” w edytorze.',
      category: 'Recenzje',
      categories: ['Muzyka', 'Recenzje'],
      author: 'Redakcja Śliska News',
      image: '',
      urgent: false,
      featured: false,
      review: { score: 9.1, coverSame: true, cover: '', kind: 'Albumy', work: 'Przykładowy album', artist: 'Przykładowy zespół', year: '2026' },
      infobox: [],
      content: '<p>To materiał demonstracyjny trybu lokalnego.</p><p><br></p><p>Pusta linia powyżej powstała po dwóch Enterach.</p>',
      createdAt: ago(300),
      updatedAt: ago(300)
    }
  ];
}

/* =========================================================
   4. DATASERVICE – warstwa danych
   Provider udostępnia: init, watch, save, remove,
   getDrafts, getDraft, saveDraft, removeDraft
   ========================================================= */
const PROFILE_KEY = 'sliska_profile_v1';
function readLocalProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY)); } catch { return null; }
}
function writeLocalProfile(p) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch { /* ignoruj */ }
}

const LocalProvider = {
  listeners: [],

  async init() {
    try {
      if (localStorage.getItem(CONFIG.LOCAL_KEY) === null) {
        localStorage.setItem(CONFIG.LOCAL_KEY, JSON.stringify(seedArticles()));
      }
    } catch (e) {
      console.warn('localStorage niedostępny:', e);
    }
    // Synchronizacja między kartami przeglądarki
    window.addEventListener('storage', e => {
      if (e.key === CONFIG.LOCAL_KEY) this._emit();
    });
  },

  _get(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  },

  _set(key, list) {
    try {
      localStorage.setItem(key, JSON.stringify(list));
    } catch {
      throw new Error('Brak miejsca w pamięci przeglądarki (limit ok. 5 MB). Użyj mniejszych zdjęć lub linków URL.');
    }
  },

  // Zwraca aktualną listę i zapamiętuje funkcję wywoływaną przy każdej zmianie
  async watch(onChange) {
    this.listeners.push(onChange);
    return this._get(CONFIG.LOCAL_KEY);
  },

  async save(article) {
    const list = this._get(CONFIG.LOCAL_KEY);
    const idx = list.findIndex(a => a.id === article.id);
    if (idx >= 0) list[idx] = article; else list.push(article);
    this._set(CONFIG.LOCAL_KEY, list);
    this._emit();
  },

  async remove(id) {
    this._set(CONFIG.LOCAL_KEY, this._get(CONFIG.LOCAL_KEY).filter(a => a.id !== id));
    this._emit();
  },

  async getProfile() { return readLocalProfile(); },
  async saveProfile(p) { writeLocalProfile(p); },

  async getDrafts() {
    return this._get(CONFIG.LOCAL_DRAFTS_KEY).sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)));
  },

  async getDraft(id) {
    return this._get(CONFIG.LOCAL_DRAFTS_KEY).find(d => d.id === id) || null;
  },

  async saveDraft(draft) {
    const list = this._get(CONFIG.LOCAL_DRAFTS_KEY);
    const idx = list.findIndex(d => d.id === draft.id);
    if (idx >= 0) list[idx] = draft; else list.push(draft);
    this._set(CONFIG.LOCAL_DRAFTS_KEY, list);
  },

  async removeDraft(id) {
    this._set(CONFIG.LOCAL_DRAFTS_KEY, this._get(CONFIG.LOCAL_DRAFTS_KEY).filter(d => d.id !== id));
  },

  _emit() {
    const list = this._get(CONFIG.LOCAL_KEY);
    this.listeners.forEach(cb => cb(list));
  }
};

const FirebaseProvider = {
  db: null,
  auth: null,

  col() { return this.db.collection(CONFIG.FIREBASE_COLLECTION); },
  dcol() { return this.db.collection(CONFIG.FIREBASE_DRAFTS_COLLECTION); },

  async init() {
    const cfg = CONFIG.FIREBASE_CONFIG;
    if (!cfg.apiKey || String(cfg.apiKey).startsWith('WKLEJ')) {
      throw new Error('Nie wklejono kluczy Firebase w CONFIG.FIREBASE_CONFIG.');
    }
    const v = CONFIG.FIREBASE_SDK_VERSION;
    await Utils.loadScript(`https://www.gstatic.com/firebasejs/${v}/firebase-app-compat.js`);
    await Utils.loadScript(`https://www.gstatic.com/firebasejs/${v}/firebase-auth-compat.js`);
    await Utils.loadScript(`https://www.gstatic.com/firebasejs/${v}/firebase-firestore-compat.js`);

    if (!firebase.apps.some(function (a) { return a.name === '[DEFAULT]'; })) firebase.initializeApp(cfg);
    this.db = firebase.firestore();
    this.auth = firebase.auth();

    // Sesja logowania trwa tylko tak długo, jak karta przeglądarki
    try {
      await this.auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
    } catch (e) {
      console.warn('Nie udało się ustawić trwałości sesji logowania:', e.code || e);
    }

    // Poczekaj, aż Firebase ustali, czy ktoś jest zalogowany (z limitem czasu)
    await Promise.race([
      new Promise(resolve => {
        const off = this.auth.onAuthStateChanged(() => { off(); resolve(); });
      }),
      new Promise(resolve => setTimeout(resolve, 4000))
    ]);
  },

  _wrap(err) {
    if (err && err.code === 'permission-denied') {
      return new Error('Brak uprawnień do zapisu. Zaloguj się kontem redaktora i sprawdź reguły Firestore.');
    }
    return err;
  },

  // Jeden nasłuch zamiast dwóch odczytów: pierwsza paczka danych wraca z obietnicą,
  // kolejne zmiany trafiają do onChange (na żywo, dla wszystkich odwiedzających)
  watch(onChange) {
    return new Promise((resolve, reject) => {
      let first = true;
      this.col()
        .orderBy('createdAt', 'desc')
        .limit(CONFIG.MAX_ARTICLES)
        .onSnapshot(
          snap => {
            const list = snap.docs.map(d => d.data());
            if (first) { first = false; resolve(list); } else { onChange(list); }
          },
          err => {
            console.error('Błąd odczytu z Firestore:', err);
            if (first) { first = false; reject(err); }
          }
        );
    });
  },

  _checkSize(obj) {
    // Dokument Firestore może mieć maks. ok. 1 MiB
    if (JSON.stringify(obj).length > 900000) {
      throw new Error('Dokument jest zbyt duży dla bazy (limit ok. 1 MB). Zmniejsz zdjęcia lub użyj linków URL.');
    }
  },

  async save(article) {
    if (!this.auth.currentUser) throw new Error('Zaloguj się, aby zapisywać artykuły.');
    this._checkSize(article);
    try {
      await this.col().doc(article.id).set(article);
    } catch (err) {
      throw this._wrap(err);
    }
  },

  async remove(id) {
    if (!this.auth.currentUser) throw new Error('Zaloguj się, aby usuwać artykuły.');
    try {
      await this.col().doc(id).delete();
    } catch (err) {
      throw this._wrap(err);
    }
  },

  async getProfile() {
    const snap = await this.db.collection('meta').doc('profile').get();
    return snap.exists ? snap.data() : null;
  },

  async saveProfile(p) {
    if (!this.auth.currentUser) throw new Error('Zaloguj się, aby zapisać ustawienia.');
    try {
      await this.db.collection('meta').doc('profile').set(p);
    } catch (err) {
      throw this._wrap(err);
    }
  },

  async getDrafts() {
    if (!this.auth.currentUser) return [];
    const snap = await this.dcol().orderBy('savedAt', 'desc').limit(50).get();
    return snap.docs.map(d => d.data());
  },

  async getDraft(id) {
    if (!this.auth.currentUser) return null;
    const snap = await this.dcol().doc(id).get();
    return snap.exists ? snap.data() : null;
  },

  async saveDraft(draft) {
    if (!this.auth.currentUser) throw new Error('Zaloguj się, aby zapisywać wersje robocze.');
    this._checkSize(draft);
    try {
      await this.dcol().doc(draft.id).set(draft);
    } catch (err) {
      throw this._wrap(err);
    }
  },

  async removeDraft(id) {
    if (!this.auth.currentUser) return;
    try {
      await this.dcol().doc(id).delete();
    } catch (err) {
      throw this._wrap(err);
    }
  }
};

/** Provider „awaryjny”: gdy Firebase nie działa, a localStorage jest wyłączony w CONFIG. */
const OfflineProvider = {
  async init() {},
  async watch() { return []; },
  async save() { throw new Error('Brak połączenia z bazą danych.'); },
  async remove() { throw new Error('Brak połączenia z bazą danych.'); },
  async getProfile() { return null; },
  async saveProfile() { throw new Error('Brak połączenia z bazą danych.'); },
  async getDrafts() { return []; },
  async getDraft() { return null; },
  async saveDraft() { throw new Error('Brak połączenia z bazą danych.'); },
  async removeDraft() {}
};

const DataService = {
  provider: null,
  mode: 'local',          // 'firebase' | 'local' | 'offline'
  fallbackReason: '',

  async init() {
    if (CONFIG.USE_FIREBASE) {
      try {
        await FirebaseProvider.init();
        this.provider = FirebaseProvider;
        this.mode = 'firebase';
        return;
      } catch (err) {
        console.warn('Firebase niedostępny:', err);
        this.fallbackReason = err.message;
        if (!CONFIG.ALLOW_LOCAL_FALLBACK) {
          this.provider = OfflineProvider;
          this.mode = 'offline';
          return;
        }
      }
    }
    await LocalProvider.init();
    this.provider = LocalProvider;
    this.mode = 'local';
  },

  // Zwraca (obietnicą) pierwszą listę artykułów; zmiany później trafiają do onChange
  watch(onChange) { return this.provider.watch(onChange); },
  save(article) { return this.provider.save(article); },
  remove(id) { return this.provider.remove(id); },
  getProfile() { return this.provider.getProfile(); },
  saveProfile(p) { return this.provider.saveProfile(p); },
  getDrafts() { return this.provider.getDrafts(); },
  getDraft(id) { return this.provider.getDraft(id); },
  saveDraft(draft) { return this.provider.saveDraft(draft); },
  removeDraft(id) { return this.provider.removeDraft(id); }
};

/* =========================================================
   5. AUTH – logowanie redaktora
   - tryb Firebase: Firebase Authentication (e-mail + hasło)
   - tryb localStorage: hasło z CONFIG.ADMIN_PASSWORD (sessionStorage)
   ========================================================= */
function authError(code) {
  const e = new Error(code);
  e.code = code;
  return e;
}

const Auth = {
  mode: 'local',

  get useFirebase() { return this.mode === 'firebase'; },

  isAdmin() { return true;
    if (this.mode === 'firebase') {
      const user = FirebaseProvider.auth && FirebaseProvider.auth.currentUser;
      if (!user) return false;
      return !CONFIG.ADMIN_UID || user.uid === CONFIG.ADMIN_UID;
    }
    if (this.mode === 'offline') return false;
    try { return true; } catch { return false; }
  },

  async login(email, password) {
    if (this.mode === 'offline') throw authError('app/offline');
    if (this.mode === 'firebase') {
      await FirebaseProvider.auth.signInWithEmailAndPassword(email, password);
      if (!this.isAdmin()) {
        await FirebaseProvider.auth.signOut();
        throw authError('app/not-editor');
      }
      return;
    }
    if (password !== CONFIG.ADMIN_PASSWORD) throw authError('app/wrong-password');
    try { sessionStorage.setItem(CONFIG.SESSION_KEY, '1'); } catch { /* ignoruj */ }
  },

  async logout() {
    if (this.mode === 'firebase') {
      try { await FirebaseProvider.auth.signOut(); } catch (e) { console.warn(e); }
      return;
    }
    try { sessionStorage.removeItem(CONFIG.SESSION_KEY); } catch { /* ignoruj */ }
  },

  // Wywołuje funkcję przy każdej zmianie stanu logowania (tylko tryb Firebase)
  onChange(cb) {
    if (this.mode === 'firebase') FirebaseProvider.auth.onAuthStateChanged(cb);
  },

  explain(err) {
    const code = (err && err.code) || '';
    switch (code) {
      case 'app/wrong-password':
        return 'Nieprawidłowe hasło.';
      case 'app/offline':
        return 'Brak połączenia z bazą danych. Spróbuj ponownie za chwilę.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Nieprawidłowy e-mail lub hasło.';
      case 'auth/invalid-email':
        return 'Nieprawidłowy adres e-mail.';
      case 'auth/missing-password':
        return 'Wpisz hasło.';
      case 'auth/too-many-requests':
        return 'Zbyt wiele prób logowania. Spróbuj ponownie za kilka minut.';
      case 'auth/operation-not-allowed':
        return 'Logowanie e-mailem nie jest włączone w Firebase (Authentication → Sign-in method).';
      case 'auth/operation-not-supported-in-this-environment':
        return 'Logowanie wymaga adresu http(s). Uruchom stronę przez lokalny serwer lub hosting, a nie przez dwuklik na plik.';
      case 'auth/network-request-failed':
        return 'Brak połączenia z internetem.';
      case 'auth/unauthorized-domain':
        return 'Ta domena nie jest dodana w Firebase (Authentication → Settings → Authorized domains).';
      case 'app/not-editor':
        return 'To konto nie ma uprawnień redaktora.';
      default:
        return 'Nie udało się zalogować.' + (code ? ' (' + code + ')' : '');
    }
  }
};

/* =========================================================
   6. APLIKACJA (UI)
   ========================================================= */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const state = {
  articles: [],
  plain: new Map(),       // id -> tekst bez HTML (wyszukiwarka, czas czytania)
  ready: false,
  loadError: false,
  category: ALL,
  query: '',
  visible: CONFIG.PAGE_SIZE,
  profile: { name: '', avatar: '' },
  profileLoaded: false,
  lastTick: Date.now()
};

const editor = {
  quill: null,
  session: 0,           // znacznik sesji edycji (chroni przed wyścigami przy szybkiej zmianie widoku)
  active: false,
  mode: 'new',          // 'new' | 'edit' | 'draft'
  draftId: null,
  articleId: null,
  existing: null,       // edytowany artykuł (opublikowany lub zaplanowany)
  image: '',            // zdjęcie główne (URL lub Base64)
  cover: '',            // własna okładka recenzji (URL lub Base64)
  modalImage: '',       // zdjęcie wstawiane do treści
  range: null,
  editingFigure: null,
  editingQuote: null,  // indeks edytowanego zdjęcia w treści
  dirty: false,
  restoring: false,
  lastCloud: '',
  bufferTimer: null,
  cloudTimer: null
};

/* ---------- Pomocnicze UI ---------- */
function toast(message, type = 'info') {
  const el = $('#toast');
  el.textContent = message;
  el.className = 'toast' + (type === 'error' ? ' error' : '');
  el.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { el.hidden = true; }, type === 'error' ? 6000 : 3500);
}

function openModal(id) {
  const m = $('#' + id);
  m.hidden = false;
  document.body.classList.add('modal-open');
  const focusTarget = $$('input:not([type=file]), textarea', m).find(el => el.offsetParent !== null);
  if (focusTarget) setTimeout(() => focusTarget.focus(), 30);
}

function closeModal(id) {
  $('#' + id).hidden = true;
  if (!$$('.modal').some(m => !m.hidden)) document.body.classList.remove('modal-open');
}

function isPublished(a) {
  const t = Date.parse(a.createdAt);
  return isNaN(t) || t <= Date.now();
}

function sortedArticles() {
  return [...state.articles].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function publishedArticles() { return sortedArticles().filter(isPublished); }

function scheduledArticles() {
  return state.articles.filter(a => !isPublished(a)).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function setArticles(list) {
  state.articles = Array.isArray(list) ? list : [];
  state.plain = new Map(state.articles.map(a => [a.id, Utils.stripHtml(a.content)]));
}

function getImage(a) { return a.image || Utils.placeholder(Utils.catsOf(a)[0]); }

function sourceTag(src) {
  return src ? `<span class="img-source">${Utils.esc(src)}</span>` : '';
}

const BEST_SCORE = 8.5; // powyżej tej oceny kółko dostaje strzałki „wyróżnienia”
const BEST_ARROWS = '<svg class="score-arrows" viewBox="0 0 100 40" aria-hidden="true"><polygon points="0,40 24,16 24,40"/><polygon points="100,40 76,16 76,40"/><polygon points="50,0 68,20 56,20 56,40 44,40 44,20 32,20"/></svg>';

/** Miernik łukowy: wypełnienie łuku odpowiada ocenie (0–10); powyżej 8,5 – czerwony ze znacznikami. */
function scoreHtml(score) {
  const best = score > BEST_SCORE;
  const r = 66;
  const len = Math.PI * r;
  const filled = Math.max(0.001, Math.min(1, score / 10)) * len;
  const arc = `M${-r},0 A${r},${r} 0 0 1 ${r},0`;
  const ticks = best
    ? Array.from({ length: 11 }, (_, i) => `<path d="M0,-80 L0,-90" transform="rotate(${-90 + i * 18})"/>`).join('')
    : '';
  return `<div class="score-wrap${best ? ' best' : ''}">
    <svg class="score-gauge" viewBox="-86 -96 172 112" role="img" aria-label="Ocena ${Utils.formatScore(score)} na 10">
      <path class="gauge-track" d="${arc}"/>
      <path class="gauge-fill" d="${arc}" stroke-dasharray="${filled.toFixed(1)} ${len.toFixed(1)}"/>
      ${best ? `<g class="gauge-ticks">${ticks}</g>` : ''}
      <text x="0" y="-2" text-anchor="middle" class="gauge-num">${Utils.formatScore(score)}</text>
    </svg>
  </div>`;
}

/** Okładka recenzji: własna albo (gdy zaznaczono / brak własnej) zdjęcie główne. */
function reviewSameCover(a) { const r = a.review; return !!r && (r.coverSame || !r.cover); }
function coverOf(a) {
  const r = a.review;
  if (!r) return '';
  return reviewSameCover(a) ? (a.image || '') : r.cover;
}

/** Miniatura na liście: w kategorii „Recenzje” okładka, wszędzie indziej zdjęcie główne. */
function thumbFor(a, useCover) {
  if (useCover && Utils.catsOf(a).includes('Recenzje')) {
    const c = coverOf(a);
    if (c) return c;
  }
  return getImage(a);
}

/** Kółko z oceną + tytuł, wykonawca, rok i okładka (zdjęcie główne) – styl Pitchfork. */
function reviewHtml(a) {
  const r = a.review;
  if (!r || r.score === null || r.score === undefined) return '';
  const coverSrc = coverOf(a);
  const same = reviewSameCover(a);
  const cover = coverSrc
    ? `<figure class="review-cover"><div class="media-wrap"><img src="${Utils.esc(coverSrc)}" alt="Okładka: ${Utils.esc(r.work)}" data-cat="${Utils.esc(Utils.catsOf(a)[0] || '')}">${same ? sourceTag(a.imageSource) : ''}</div>${same && a.imageCaption ? `<figcaption>${Utils.esc(a.imageCaption)}</figcaption>` : ''}</figure>`
    : '';
  return `<section class="review ${cover ? '' : 'review-nocover'}" aria-label="Ocena">
    ${scoreHtml(r.score)}
    <div class="review-info">
      ${r.kind ? `<div class="review-kind">${Utils.esc(r.kind)}</div>` : ''}
      <div class="review-work">${Utils.esc(r.work)}</div>
      ${r.artist ? `<div class="review-artist">${Utils.esc(r.artist)}</div>` : ''}
      ${r.year ? `<div class="review-year">${Utils.esc(r.year)}</div>` : ''}
    </div>
    ${cover}
  </section>`;
}

function currentRoute() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'artykul' && parts[1]) return { name: 'article', id: decodeURIComponent(parts[0 + 1]) };
  if (parts[0] === 'edytor') return { name: 'editor', id: parts[1] ? decodeURIComponent(parts[1]) : null, draft: null };
  if (parts[0] === 'szkic' && parts[1]) return { name: 'editor', id: null, draft: decodeURIComponent(parts[1]) };
  if (parts[0] === 'panel') return { name: 'panel' };
  if (parts[0] === 'ustawienia') return { name: 'settings' };
  if (parts[0] === 'kategoria' && parts[1]) return { name: 'home', category: decodeURIComponent(parts[1]) };
  return { name: 'home' };
}

function adminButtons(id) {
  if (!Auth.isAdmin()) return '';
  const safe = Utils.esc(id);
  return `<span class="admin-actions">
    <button type="button" class="btn btn-sm" data-action="edit" data-id="${safe}">Edytuj</button>
    <button type="button" class="btn btn-sm btn-danger" data-action="delete" data-id="${safe}">Usuń</button>
  </span>`;
}

/* ---------- Pasek PILNE ---------- */
function renderBreaking() {
  const bar = $('#breaking-bar');
  const urgent = publishedArticles().filter(a => a.urgent);
  if (!urgent.length) { bar.hidden = true; return; }

  bar.hidden = false;
  const items = urgent.map(a =>
    `<a class="ticker-item" href="#/artykul/${encodeURIComponent(a.id)}">${Utils.esc(a.title)}</a>`
  ).join('<span class="ticker-dot" aria-hidden="true">•</span>');
  $('#ticker-track').innerHTML = `<div class="ticker-set">${items}</div>`;
  fitTicker();
}

/** Mieści się = wyśrodkowane; nie mieści się = płynnie przewija się w pętli. */
function fitTicker() {
  const ticker = $('#ticker');
  const track = $('#ticker-track');
  const set = track.firstElementChild;
  if (!set || ticker.offsetParent === null && $('#breaking-bar').hidden) return;
  while (track.children.length > 1) track.lastElementChild.remove();
  track.classList.remove('is-scrolling');
  track.style.removeProperty('--ticker-duration');
  if (set.scrollWidth <= ticker.clientWidth) return;
  const clone = set.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  clone.tabIndex = -1;
  $$('a', clone).forEach(a => { a.tabIndex = -1; });
  track.appendChild(clone);
  track.classList.add('is-scrolling');
  track.style.setProperty('--ticker-duration', Math.max(14, Math.round(set.scrollWidth / 60)) + 's');
}

/* ---------- Strona główna ---------- */
function filteredArticles() {
  const q = state.query.trim().toLowerCase();
  return publishedArticles().filter(a => {
    if (state.category !== ALL && !Utils.catsOf(a).includes(state.category)) return false;
    if (!q) return true;
    const haystack = `${a.title} ${a.lead} ${state.plain.get(a.id) || ''}`.toLowerCase();
    return haystack.includes(q);
  });
}

function cardHtml(a, opts = {}) {
  const id = encodeURIComponent(a.id);
  return `<article class="card" data-id="${Utils.esc(a.id)}">
    <a class="card-media" href="#/artykul/${id}" tabindex="-1" aria-hidden="true">
      <img src="${Utils.esc(thumbFor(a, opts.cover))}" alt="" data-cat="${Utils.esc(Utils.catsOf(a)[0] || '')}" loading="lazy">
    </a>
    <div class="card-body">
      <div class="card-tags">
        ${Utils.chipsHtml(a)}
        ${a.urgent ? '<span class="badge-urgent">PILNE</span>' : ''}
      </div>
      <h3 class="card-title"><a href="#/artykul/${id}">${Utils.esc(a.title)}</a></h3>
      <p class="card-lead">${Utils.esc(a.lead)}</p>
      <div class="card-meta">
        <time datetime="${Utils.esc(a.createdAt)}">${Utils.formatDate(a.createdAt)}</time>
        ${opts.noAdmin ? '' : adminButtons(a.id)}
      </div>
    </div>
  </article>`;
}

function heroHtml(a, useCover) {
  const id = encodeURIComponent(a.id);
  return `<section class="hero" data-id="${Utils.esc(a.id)}" aria-label="Temat dnia">
    <img class="hero-img" src="${Utils.esc(thumbFor(a, useCover))}" alt="" data-cat="${Utils.esc(Utils.catsOf(a)[0] || '')}">
    <div class="hero-content">
      <span class="hero-flag">Temat dnia</span>
      <div>${Utils.chipsHtml(a)}</div>
      <h2 class="hero-title"><a href="#/artykul/${id}">${Utils.esc(a.title)}</a></h2>
      <p class="hero-lead">${Utils.esc(a.lead)}</p>
      <div class="card-meta">
        <time datetime="${Utils.esc(a.createdAt)}">${Utils.formatDate(a.createdAt)} · ${Utils.esc(a.author)}</time>
        ${adminButtons(a.id)}
      </div>
    </div>
  </section>`;
}

function tileHtml(a) {
  const id = encodeURIComponent(a.id);
  return `<article class="tile" data-id="${Utils.esc(a.id)}">
    <img class="tile-img" src="${Utils.esc(getImage(a))}" alt="" data-cat="${Utils.esc(Utils.catsOf(a)[0] || '')}" loading="lazy">
    <div class="tile-content">
      <div>${Utils.chipsHtml(a)}</div>
      <h3 class="tile-title"><a href="#/artykul/${id}">${Utils.esc(a.title)}</a></h3>
      <time class="tile-time" datetime="${Utils.esc(a.createdAt)}">${Utils.formatDate(a.createdAt)}</time>
    </div>
  </article>`;
}

function renderHome() {
  const status = $('#home-status');

  if (state.loadError) {
    status.innerHTML = '<div class="empty-state">Nie udało się wczytać wiadomości. Odśwież stronę za chwilę.</div>';
    $('#hero-slot').innerHTML = '';
    $('#news-grid').innerHTML = '';
    $('#grid-title').hidden = true;
    $('#load-more').hidden = true;
    return;
  }

  const list = filteredArticles();
  const isReviews = state.category === 'Recenzje';
  // Blok na górze: Temat dnia (lub najnowszy) + 2 kafle – tylko na „Wszystkie” bez wyszukiwania
  const showTop = state.category === ALL && !state.query.trim() && list.length > 0;
  const hero = showTop ? (list.find(a => a.featured) || list[0]) : null;
  const tiles = showTop ? list.filter(a => a !== hero).slice(0, 2) : [];
  const top = hero ? [hero, ...tiles] : [];
  const rest = list.filter(a => !top.includes(a));
  const shown = rest.slice(0, state.visible);

  if (!list.length) {
    const q = state.query.trim();
    status.innerHTML = `<div class="empty-state">${q
      ? `Brak wyników dla „${Utils.esc(q)}”.`
      : state.category !== ALL
        ? 'W tej kategorii nie ma jeszcze artykułów.'
        : 'Wkrótce pojawią się tu pierwsze wiadomości.'}</div>`;
  } else if (state.query.trim()) {
    status.textContent = `Wyniki wyszukiwania dla „${state.query.trim()}”: ${list.length}`;
  } else {
    status.textContent = '';
  }

  $('#hero-slot').innerHTML = hero
    ? `<div class="home-top${tiles.length ? '' : ' single'}">${heroHtml(hero, false)}${tiles.length ? `<div class="home-tiles">${tiles.map(tileHtml).join('')}</div>` : ''}</div>`
    : '';
  $('#news-grid').classList.toggle('is-square', isReviews);
  $('#news-grid').innerHTML = shown.map(a => cardHtml(a, { cover: state.category === 'Recenzje' })).join('');

  const title = $('#grid-title');
  title.hidden = shown.length === 0;
  title.textContent = state.query.trim() ? 'Wyniki' : (state.category === ALL ? 'Więcej wiadomości' : state.category);

  $('#load-more').hidden = rest.length <= shown.length;
}

/* ---------- Prawa kolumna: pozostałe artykuły ---------- */
function renderSideList() {
  const r = currentRoute();
  const layout = $('#layout');
  const side = $('#side-right');
  const current = r.name === 'article' ? r.id : null;
  const onCategory = r.name === 'home' && state.category !== ALL && !state.query.trim();
  const visibleHere = r.name === 'article' || onCategory;
  // Pomijamy artykuły z kategorii, w której jesteśmy (i bieżący artykuł)
  const ctx = (r.name === 'article' || r.name === 'home') ? state.category : ALL;
  const list = publishedArticles()
    .filter(a => a.id !== current && (ctx === ALL || !Utils.catsOf(a).includes(ctx)))
    .slice(0, 6);
  const show = visibleHere && list.length > 0;
  layout.dataset.cat = r.name === 'home' && state.category !== ALL ? '1' : '0';
  layout.dataset.right = show ? '1' : '0';
  side.hidden = !show;
  $('#side-title').textContent = 'Pozostałe artykuły';
  $('#side-list').innerHTML = list.map(a => {
    const id = encodeURIComponent(a.id);
    return `<article class="side-item" data-id="${Utils.esc(a.id)}">
      <a class="side-media" href="#/artykul/${id}" tabindex="-1" aria-hidden="true"><img src="${Utils.esc(getImage(a))}" alt="" data-cat="${Utils.esc(Utils.catsOf(a)[0] || '')}" loading="lazy"></a>
      <div class="side-body">
        <div class="card-tags">${Utils.chipsHtml(a)}${a.urgent ? '<span class="badge-urgent">PILNE</span>' : ''}</div>
        <h3 class="side-item-title"><a href="#/artykul/${id}">${Utils.esc(a.title)}</a></h3>
        <time class="side-time" datetime="${Utils.esc(a.createdAt)}">${Utils.formatDate(a.createdAt)}</time>
      </div>
    </article>`;
  }).join('');
}

/* ---------- Widok artykułu ---------- */
function articleHtml(a, plain) {
  const info = (a.infobox || []).filter(r => r && r.label && r.value);
  const minutes = Utils.readingTime(a, plain);
  const hasReview = !!(a.review && a.review.score !== null && a.review.score !== undefined);
  // Przy recenzji z osobną okładką zdjęcie główne też jest widoczne; gdy okładka = zdjęcie główne, pokazujemy je tylko w ramce oceny
  const showHero = !hasReview || (a.image && !reviewSameCover(a));
  const heroFig = showHero
    ? `<figure class="article-hero">
        <div class="media-wrap"><img src="${Utils.esc(getImage(a))}" alt="${Utils.esc(a.title)}" data-cat="${Utils.esc(Utils.catsOf(a)[0] || '')}">${sourceTag(a.imageSource)}</div>
        ${a.imageCaption ? `<figcaption>${Utils.esc(a.imageCaption)}</figcaption>` : ''}
      </figure>`
    : '';
  const edited = a.updatedAt && Math.abs(new Date(a.updatedAt) - new Date(a.createdAt)) > 60000 && isPublished(a);

  const infobox = info.length
    ? `<aside class="infobox" aria-label="Szybkie fakty">
         <h2 class="infobox-title">Szybkie fakty</h2>
         <table><tbody>${info.map(r =>
           `<tr><th scope="row">${Utils.esc(r.label)}</th><td>${Utils.esc(r.value)}</td></tr>`).join('')}
         </tbody></table>
       </aside>`
    : '';

  return `<article class="article">
      <header class="article-header">
        <div class="card-tags">
          ${Utils.chipsHtml(a)}
          ${a.urgent ? '<span class="badge-urgent">PILNE</span>' : ''}
        </div>
        <h1>${Utils.esc(a.title)}</h1>
        <div class="article-meta">
          <span>Autor: <strong>${Utils.esc(a.author)}</strong></span>
          <span>Opublikowano: <time datetime="${Utils.esc(a.createdAt)}">${Utils.formatDate(a.createdAt)}</time></span>
          ${edited ? `<span>Zaktualizowano: ${Utils.formatDate(a.updatedAt)}</span>` : ''}
          <span>Czas czytania: ${minutes} min</span>
        </div>
      </header>
      ${hasReview ? reviewHtml(a) : ''}
      ${heroFig}
      <div class="article-layout ${info.length ? 'has-infobox' : ''}">
        <div class="article-main">
          <p class="article-lead">${Utils.esc(a.lead)}</p>
          <div class="article-body">${Sanitizer.render(a.content)}</div>
        </div>
        ${infobox}
      </div>
    </article>`;
}

function renderArticleView(id) {
  const el = $('#view-article');
  const a = state.articles.find(x => x.id === id);
  const visible = a && (isPublished(a) || Auth.isAdmin());

  if (!visible) {
    el.innerHTML = `<div class="article-top"><a class="btn" href="#/">← Powrót do strony głównej</a></div>
      <div class="empty-state">Nie znaleziono takiego artykułu. Mógł zostać usunięty lub nie jest jeszcze opublikowany.</div>`;
    document.title = `${CONFIG.SITE_NAME} – najświeższe wiadomości`;
    setMeta();
    return;
  }

  const notice = !isPublished(a)
    ? `<div class="notice">Ten artykuł jest zaplanowany – czytelnicy zobaczą go od ${Utils.formatDate(a.createdAt)}.</div>`
    : '';

  const relatedHtml = '';

  el.innerHTML = `
    <div class="article-top">
      <a class="btn" href="#/">← Powrót do strony głównej</a>
      <div class="top-actions">
        <button type="button" class="btn" data-action="share" data-id="${Utils.esc(a.id)}">Udostępnij</button>
        ${adminButtons(a.id)}
      </div>
    </div>
    ${notice}
    ${articleHtml(a, state.plain.get(a.id))}
    ${relatedHtml}`;
  document.title = `${a.title} – ${CONFIG.SITE_NAME}`;
  setMeta(a.title, a.lead);
}

async function shareArticle(id) {
  const a = state.articles.find(x => x.id === id);
  if (!a) return;
  const url = location.href.split('#')[0] + '#/artykul/' + encodeURIComponent(id);
  if (navigator.share) {
    try {
      await navigator.share({ title: a.title, text: a.lead, url });
      return;
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast('Link skopiowany do schowka.');
  } catch {
    toast('Skopiuj adres z paska przeglądarki.');
  }
}

/* ---------- Panel redakcji: wersje robocze i zaplanowane ---------- */
const Buffers = {
  _all() {
    try { return JSON.parse(localStorage.getItem(CONFIG.BUFFER_KEY)) || {}; } catch { return {}; }
  },
  get(id) { return this._all()[id] || null; },
  set(id, entry) {
    const all = this._all();
    all[id] = entry;
    try {
      localStorage.setItem(CONFIG.BUFFER_KEY, JSON.stringify(all));
      return true;
    } catch {
      // Za duże (zdjęcia) – spróbuj bez zdjęcia głównego w formie Base64
      try {
        const slim = JSON.parse(JSON.stringify(entry));
        if (slim.data && String(slim.data.image).startsWith('data:')) slim.data.image = '';
        all[id] = slim;
        localStorage.setItem(CONFIG.BUFFER_KEY, JSON.stringify(all));
        return true;
      } catch { return false; }
    }
  },
  remove(id) {
    const all = this._all();
    if (id in all) {
      delete all[id];
      try { localStorage.setItem(CONFIG.BUFFER_KEY, JSON.stringify(all)); } catch { /* ignoruj */ }
    }
  },
  all() { return this._all(); }
};

function clearPointer(draftId) {
  try {
    if (localStorage.getItem(CONFIG.NEW_POINTER_KEY) === draftId) localStorage.removeItem(CONFIG.NEW_POINTER_KEY);
  } catch { /* ignoruj */ }
}

async function renderPanel() {
  const dEl = $('#panel-drafts');
  const sEl = $('#panel-scheduled');

  const scheduled = scheduledArticles();
  sEl.innerHTML = scheduled.length
    ? scheduled.map(a => `<div class="panel-item">
        <div class="panel-item-main">
          <strong>${Utils.esc(a.title)}</strong>
          <span class="muted">${Utils.esc(Utils.catsOf(a).join(', '))} · publikacja: ${Utils.formatDate(a.createdAt)}</span>
        </div>
        <div class="panel-item-actions">
          <a class="btn btn-sm" href="#/artykul/${encodeURIComponent(a.id)}">Zobacz</a>
          <a class="btn btn-sm" href="#/edytor/${encodeURIComponent(a.id)}">Edytuj</a>
          <button type="button" class="btn btn-sm btn-primary" data-action="publish-now" data-id="${Utils.esc(a.id)}">Opublikuj teraz</button>
          <button type="button" class="btn btn-sm btn-danger" data-action="delete" data-id="${Utils.esc(a.id)}">Usuń</button>
        </div>
      </div>`).join('')
    : '<p class="muted">Brak zaplanowanych publikacji. W edytorze zaznacz „Zaplanuj publikację na później”.</p>';

  dEl.innerHTML = '<p class="muted">Ładowanie…</p>';
  let drafts = [];
  try {
    drafts = await DataService.getDrafts();
  } catch (err) {
    console.warn(err);
    dEl.innerHTML = '<p class="form-error">Nie udało się wczytać wersji roboczych z bazy. Sprawdź reguły Firestore dla kolekcji „drafts”.</p>';
    return;
  }
  if (currentRoute().name !== 'panel') return;

  // Kopie z tej przeglądarki, których nie ma jeszcze w bazie (np. po nagłym zamknięciu karty)
  const cloudIds = new Set(drafts.map(d => d.id));
  const localOnly = Object.entries(Buffers.all())
    .filter(([id, b]) => !cloudIds.has(id) && b && b.data)
    .map(([id, b]) => ({ id, articleId: b.articleId || null, savedAt: b.savedAt, local: true, ...b.data }));

  const items = [...localOnly, ...drafts].sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)));

  dEl.innerHTML = items.length
    ? items.map(d => `<div class="panel-item">
        <div class="panel-item-main">
          <strong>${Utils.esc(d.title || '(bez tytułu)')}</strong>
          <span class="muted">${Utils.esc(Utils.catsOf(d).join(', '))} · zapisano ${Utils.formatDate(d.savedAt)}${d.articleId ? ' · zmiany w opublikowanym artykule' : ''}${d.local ? ' · kopia z tej przeglądarki' : ''}</span>
        </div>
        <div class="panel-item-actions">
          <a class="btn btn-sm btn-primary" href="#/szkic/${encodeURIComponent(d.id)}">Kontynuuj</a>
          <button type="button" class="btn btn-sm btn-danger" data-action="delete-draft" data-id="${Utils.esc(d.id)}">Usuń</button>
        </div>
      </div>`).join('')
    : '<p class="muted">Brak wersji roboczych. Wszystko, co zaczniesz pisać, zapisuje się tu automatycznie.</p>';
}

async function deleteDraft(id) {
  if (!confirm('Usunąć tę wersję roboczą? Tej operacji nie można cofnąć.')) return;
  try {
    await DataService.removeDraft(id);
    Buffers.remove(id);
    clearPointer(id);
    toast('Wersja robocza usunięta.');
    renderPanel();
  } catch (err) {
    console.error(err);
    toast(err.message || 'Nie udało się usunąć wersji roboczej.', 'error');
  }
}

async function publishNow(id) {
  const a = state.articles.find(x => x.id === id);
  if (!a) return;
  if (!confirm(`Opublikować teraz artykuł:\n„${a.title}”?`)) return;
  const nowIso = new Date().toISOString();
  const updated = { ...a, createdAt: nowIso, updatedAt: nowIso };
  try {
    await DataService.save(updated);
    upsertLocalState(updated);
    toast('Artykuł opublikowany.');
    refreshViews();
  } catch (err) {
    console.error(err);
    toast(err.message || 'Nie udało się opublikować artykułu.', 'error');
  }
}

function upsertLocalState(article) {
  const idx = state.articles.findIndex(a => a.id === article.id);
  const next = [...state.articles];
  if (idx >= 0) next[idx] = article; else next.push(article);
  setArticles(next);
}

async function deleteArticle(id) {
  const a = state.articles.find(x => x.id === id);
  if (!a) return;
  if (!confirm(`Czy na pewno usunąć artykuł:\n„${a.title}”?`)) return;
  try {
    await DataService.remove(id);
    setArticles(state.articles.filter(x => x.id !== id));
    DataService.removeDraft('edit_' + id).catch(() => {});
    Buffers.remove('edit_' + id);
    toast('Artykuł został usunięty.');
    if (currentRoute().name === 'article') location.hash = '#/';
    else refreshViews();
  } catch (err) {
    console.error(err);
    toast(err.message || 'Nie udało się usunąć artykułu.', 'error');
  }
}

/* ---------- Edytor: dane formularza ---------- */
function defaultAuthor() {
  let last = '';
  try { last = localStorage.getItem(CONFIG.AUTHOR_KEY) || ''; } catch { /* ignoruj */ }
  return state.profile.name || last;
}

function emptyData() {
  return {
    title: '', lead: '', categories: [], author: defaultAuthor(),
    image: '', imageCaption: '', imageSource: '', urgent: false, featured: false, infobox: [], content: '',
    reviewOn: false, reviewScore: '', reviewKind: 'Albumy', reviewCoverSame: false, reviewCover: '', reviewWork: '', reviewArtist: '', reviewYear: '',
    scheduleOn: false, scheduleAt: ''
  };
}

function normalizeData(obj) {
  const base = emptyData();
  const o = obj || {};
  return {
    title: o.title ?? base.title,
    lead: o.lead ?? base.lead,
    categories: Utils.catsOf(o),
    author: o.author ?? base.author,
    image: o.image || '',
    imageCaption: o.imageCaption || '',
    imageSource: o.imageSource || '',
    reviewOn: !!o.reviewOn,
    reviewScore: o.reviewScore || '',
    reviewKind: o.reviewKind || 'Albumy',
    reviewCoverSame: !!o.reviewCoverSame,
    reviewCover: o.reviewCover || '',
    reviewWork: o.reviewWork || '',
    reviewArtist: o.reviewArtist || '',
    reviewYear: o.reviewYear || '',
    urgent: !!o.urgent,
    featured: !!o.featured,
    infobox: Array.isArray(o.infobox) ? o.infobox.map(r => ({ label: r.label || '', value: r.value || '' })) : [],
    content: o.content || '',
    scheduleOn: !!o.scheduleOn,
    scheduleAt: o.scheduleAt || ''
  };
}

function dataFromArticle(a) {
  const future = !isPublished(a);
  const r = a.review;
  return normalizeData({
    ...a,
    reviewOn: !!(r && r.score !== null && r.score !== undefined),
    reviewScore: r && r.score !== null && r.score !== undefined ? Utils.formatScore(r.score) : '',
    reviewKind: r ? r.kind || 'Albumy' : 'Albumy',
    // starsze recenzje (bez osobnej okładki) używały zdjęcia głównego
    reviewCoverSame: r ? !!(r.coverSame || !r.cover) : false,
    reviewCover: r ? r.cover || '' : '',
    reviewWork: r ? r.work || '' : '',
    reviewArtist: r ? r.artist || '' : '',
    reviewYear: r ? r.year || '' : '',
    scheduleOn: future,
    scheduleAt: future ? Utils.toLocalInput(a.createdAt) : ''
  });
}

function contentHtml() {
  if (!editor.quill || editor.quill.getLength() <= 1) return '';
  return Sanitizer.clean(editor.quill.root.innerHTML);
}

function collectData() {
  return {
    title: $('#f-title').value,
    lead: $('#f-lead').value,
    categories: $$('#f-categories input:checked').map(i => i.value),
    author: $('#f-author').value,
    image: editor.image,
    imageCaption: $('#f-image-caption').value,
    imageSource: $('#f-image-source').value,
    reviewOn: $('#f-review-on').checked,
    reviewScore: $('#f-review-score').value,
    reviewKind: $('#f-review-kind').value,
    reviewCoverSame: $('#f-review-cover-same').checked,
    reviewCover: editor.cover,
    reviewWork: $('#f-review-work').value,
    reviewArtist: $('#f-review-artist').value,
    reviewYear: $('#f-review-year').value,
    urgent: $('#f-urgent').checked,
    featured: $('#f-featured').checked,
    infobox: $$('.info-row').map(row => ({
      label: $('.info-label', row).value,
      value: $('.info-value', row).value
    })).filter(r => r.label.trim() || r.value.trim()),
    content: contentHtml(),
    scheduleOn: $('#f-schedule-on').checked,
    scheduleAt: $('#f-schedule-at').value
  };
}

function isEmptyData(d) {
  return !d.title.trim() && !d.lead.trim() && !d.content && !d.image && d.infobox.length === 0 && !d.reviewOn;
}

function renderCatPicker(selected = []) {
  const cats = [...CATEGORIES, ...selected.filter(c => !CATEGORIES.includes(c))];
  $('#f-categories').innerHTML = cats.map(c =>
    `<label class="cat-option"><input type="checkbox" value="${Utils.esc(c)}"${selected.includes(c) ? ' checked' : ''}><span>${Utils.esc(c)}</span></label>`).join('');
}

function updateReviewUi() {
  $('#review-fields').hidden = !$('#f-review-on').checked;
  $('#cover-fields').hidden = $('#f-review-cover-same').checked;
}

function setCover(src) {
  editor.cover = src || '';
  const box = $('#f-review-cover-preview');
  box.hidden = !editor.cover;
  if (editor.cover) $('img', box).src = editor.cover;
  $('#f-review-cover-url').value = editor.cover && !editor.cover.startsWith('data:') ? editor.cover : '';
  if (!editor.cover) $('#f-review-cover-file').value = '';
}

function addInfoRow(label = '', value = '') {
  const row = document.createElement('div');
  row.className = 'info-row';
  row.innerHTML =
    '<input type="text" class="info-label" placeholder="Nagłówek (np. Miejsce)" maxlength="60" aria-label="Nagłówek">' +
    '<input type="text" class="info-value" placeholder="Wartość (np. Warszawa)" maxlength="200" aria-label="Wartość">' +
    '<button type="button" class="btn btn-sm btn-ghost info-remove" aria-label="Usuń wiersz">✕</button>';
  row.querySelector('.info-label').value = label;
  row.querySelector('.info-value').value = value;
  $('#infobox-rows').appendChild(row);
}

function setMainImage(src) {
  editor.image = src || '';
  const box = $('#f-image-preview');
  box.hidden = !editor.image;
  updateChecklist();
  if (editor.image) $('img', box).src = editor.image;
  // pole URL pokazuje tylko zwykły link (nie Base64)
  $('#f-image-url').value = editor.image && !editor.image.startsWith('data:') ? editor.image : '';
  if (!editor.image) $('#f-image-file').value = '';
}

function applyData(d) {
  editor.restoring = true;
  renderCatPicker(d.categories);
  $('#f-title').value = d.title;
  $('#f-lead').value = d.lead;
  $('#f-image-caption').value = d.imageCaption;
  $('#f-image-source').value = d.imageSource;
  $('#f-review-on').checked = d.reviewOn;
  $('#f-review-score').value = d.reviewScore;
  $('#f-review-kind').value = d.reviewKind;
  $('#f-review-cover-same').checked = d.reviewCoverSame;
  setCover(d.reviewCover);
  $('#f-review-work').value = d.reviewWork;
  $('#f-review-artist').value = d.reviewArtist;
  $('#f-review-year').value = d.reviewYear;
  updateReviewUi();
  $('#f-author').value = d.author;
  $('#f-urgent').checked = d.urgent;
  $('#f-featured').checked = d.featured;
  $('#f-schedule-on').checked = d.scheduleOn;
  $('#f-schedule-at').value = d.scheduleAt;

  $('#infobox-rows').innerHTML = '';
  d.infobox.forEach(r => addInfoRow(r.label, r.value));
  setMainImage(d.image);

  if (d.content) {
    editor.quill.setContents(editor.quill.clipboard.convert(Sanitizer.upgradeQuotes(d.content)), 'silent');
  } else {
    editor.quill.setText('', 'silent');
  }
  editor.restoring = false;
  updateCounters();
  updateStats();
  updatePublishUi();
}

function updateCounters() {
  const t = $('#f-title').value.length;
  const l = $('#f-lead').value.length;
  $('#c-title').textContent = `${t}/200`;
  $('#c-lead').textContent = `${l}/400`;
  $('#c-title').classList.toggle('warn', t > 180);
  $('#c-lead').classList.toggle('warn', l > 360);
}

function updateChecklist() {
  if (!editor.quill) return;
  const words = Utils.countWords(editor.quill.getText());
  const items = [
    { ok: $('#f-title').value.trim().length >= 10, text: 'Tytuł (min. 10 znaków)', req: true },
    { ok: $('#f-lead').value.trim().length >= 40, text: 'Lead (min. 40 znaków)', req: true },
    { ok: $$('#f-categories input:checked').length > 0, text: 'Kategoria', req: true },
    { ok: words >= 30, text: 'Treść (min. 30 słów)', req: true },
    { ok: !!$('#f-author').value.trim(), text: 'Autor', req: true },
    { ok: !!editor.image, text: 'Zdjęcie główne (zalecane)', req: false }
  ];
  if ($('#f-review-on').checked) {
    items.push({ ok: Utils.parseScore($('#f-review-score').value) !== null && !!$('#f-review-work').value.trim(), text: 'Recenzja: ocena i tytuł dzieła', req: true });
    items.push({ ok: $('#f-review-cover-same').checked ? !!editor.image : !!editor.cover, text: 'Recenzja: okładka', req: true });
  }
  $('#checklist').innerHTML = items.map(i =>
    `<li class="${i.ok ? 'ok' : (i.req ? 'todo' : 'opt')}"><span class="ck" aria-hidden="true">${i.ok ? '✓' : (i.req ? '○' : '–')}</span>${Utils.esc(i.text)}</li>`).join('');
}

function generateLead() {
  const plain = editor.quill.getText().replace(/\s+/g, ' ').trim();
  if (!plain) { toast('Najpierw napisz trochę tekstu artykułu.'); return; }
  let lead = plain.slice(0, 260);
  const cut = Math.max(lead.lastIndexOf('. '), lead.lastIndexOf('! '), lead.lastIndexOf('? '));
  if (plain.length > 260) lead = cut > 80 ? lead.slice(0, cut + 1) : lead.replace(/\s+\S*$/, '') + '…';
  $('#f-lead').value = lead.slice(0, 400);
  updateCounters();
  updateChecklist();
  onFormChange();
}

/** Wklejone lub przeciągnięte zdjęcia trafiają prosto do tekstu (bez okna dialogowego). */
async function insertImageFiles(files, index) {
  try {
    for (const file of files) {
      const src = await Utils.fileToDataUrl(file);
      editor.quill.insertEmbed(index, 'figure', { src, caption: '', source: '' }, 'user');
      index += 1;
    }
    editor.quill.setSelection(index, 0, 'silent');
    toast('Zdjęcie wstawione – kliknij je w tekście, aby dodać podpis i źródło.');
  } catch (err) {
    toast(err.message || 'Nie udało się wstawić zdjęcia.', 'error');
  }
}

function updateStats() {
  if (!editor.quill) return;
  updateChecklist();
  const words = Utils.countWords(editor.quill.getText()) + Utils.countWords($('#f-lead').value);
  const minutes = Math.max(1, Math.ceil(words / 200));
  $('#editor-stats').textContent = `${words} słów · ok. ${minutes} min czytania`;
}

function updatePublishUi() {
  const on = $('#f-schedule-on').checked;
  $('#schedule-field').hidden = !on;
  const at = $('#f-schedule-at');
  at.min = Utils.toLocalInput(Date.now());
  if (on && !at.value) {
    // domyślnie jutro o 9:00
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    at.value = Utils.toLocalInput(d);
  }
  const existingPublished = editor.existing && isPublished(editor.existing);
  $('#editor-save').textContent = on ? 'Zaplanuj publikację' : (existingPublished ? 'Zapisz zmiany' : 'Opublikuj');
  $('#publish-hint').textContent = on
    ? 'Artykuł pojawi się na stronie automatycznie o wskazanej godzinie.'
    : existingPublished
      ? `Artykuł jest opublikowany od ${Utils.formatDate(editor.existing.createdAt)}. Zmiany będą widoczne od razu.`
      : 'Artykuł zostanie opublikowany od razu po kliknięciu „Opublikuj”.';
}

function setStatus(text, kind = '') {
  const el = $('#save-status');
  el.textContent = text;
  el.className = 'save-status' + (kind ? ' ' + kind : '');
}

/* ---------- Edytor: autozapis (kopia w przeglądarce + wersja robocza w bazie) ---------- */
function captureContext() {
  return { session: editor.session, draftId: editor.draftId, articleId: editor.articleId, data: collectData() };
}

function writeBuffer() {
  if (!editor.active) return;
  clearTimeout(editor.bufferTimer);
  const ctx = captureContext();
  if (isEmptyData(ctx.data)) {
    Buffers.remove(ctx.draftId);
    clearPointer(ctx.draftId);
    return;
  }
  Buffers.set(ctx.draftId, { data: ctx.data, articleId: ctx.articleId, savedAt: new Date().toISOString() });
  if (!ctx.articleId) {
    try { localStorage.setItem(CONFIG.NEW_POINTER_KEY, ctx.draftId); } catch { /* ignoruj */ }
  }
}

/** Zapisuje wersję roboczą w bazie. Zwraca true/false. */
async function persistDraft(ctx) {
  const draft = { id: ctx.draftId, articleId: ctx.articleId, ...ctx.data, savedAt: new Date().toISOString() };
  await DataService.saveDraft(draft);
  return draft;
}

async function saveCloudDraft(manual = false) {
  clearTimeout(editor.cloudTimer);
  editor.cloudTimer = null;
  if (!editor.active || !Auth.isAdmin()) return false;

  const ctx = captureContext();
  if (isEmptyData(ctx.data)) {
    if (manual) toast('Nie ma jeszcze czego zapisać.');
    return false;
  }
  const snap = JSON.stringify(ctx.data);
  if (!manual && snap === editor.lastCloud) { editor.dirty = false; return true; }

  try {
    const draft = await persistDraft(ctx);
    if (editor.session === ctx.session) {
      editor.lastCloud = snap;
      editor.dirty = JSON.stringify(collectData()) !== snap;
      setStatus('Wersja robocza zapisana o ' + Utils.formatTime(draft.savedAt), 'ok');
      if (!editor.dirty) Buffers.remove(ctx.draftId);
      else writeBuffer();
    }
    return true;
  } catch (err) {
    console.warn('Zapis wersji roboczej nie powiódł się:', err);
    if (editor.session === ctx.session) {
      writeBuffer();
      setStatus('Kopia zapisana w tej przeglądarce. Zapis w bazie nie powiódł się: ' + (err.message || 'błąd'), 'warn');
    }
    return false;
  }
}

function onFormChange() {
  if (!editor.active || editor.restoring) return;
  editor.dirty = true;
  setStatus('Niezapisane zmiany…');
  clearTimeout(editor.bufferTimer);
  editor.bufferTimer = setTimeout(writeBuffer, CONFIG.BUFFER_DELAY);
  if (!editor.cloudTimer) editor.cloudTimer = setTimeout(() => saveCloudDraft(false), CONFIG.CLOUD_DRAFT_DELAY);
}

/** Wyjście z edytora (zmiana widoku): zapisuje to, co zostało napisane, jako wersję roboczą. */
function leaveEditor() {
  if (!editor.active) return;
  clearTimeout(editor.bufferTimer);
  clearTimeout(editor.cloudTimer);
  editor.cloudTimer = null;

  const ctx = captureContext();
  const needsSave = editor.dirty;
  editor.active = false;
  editor.dirty = false;

  if (isEmptyData(ctx.data)) {
    Buffers.remove(ctx.draftId);
    clearPointer(ctx.draftId);
    return;
  }
  if (!needsSave) {
    Buffers.remove(ctx.draftId);
    clearPointer(ctx.draftId);
    return;
  }

  // Najpierw kopia lokalna (synchronicznie), potem zapis w bazie
  Buffers.set(ctx.draftId, { data: ctx.data, articleId: ctx.articleId, savedAt: new Date().toISOString() });
  if (!Auth.isAdmin()) return;
  persistDraft(ctx)
    .then(() => {
      Buffers.remove(ctx.draftId);
      clearPointer(ctx.draftId);
      toast('Zapisano w wersjach roboczych.');
    })
    .catch(err => {
      console.warn('Nie udało się zapisać wersji roboczej przy wyjściu:', err);
      toast('Kopia zapisana tylko w tej przeglądarce. Sprawdź połączenie i reguły bazy.', 'error');
    });
}

/* ---------- Edytor: Quill ---------- */
function registerFigureBlot() {
  if (registerFigureBlot.done) return;
  const BlockEmbed = Quill.import('blots/block/embed');

  class FigureBlot extends BlockEmbed {
    static create(value) {
      const node = super.create();
      const wrap = document.createElement('div');
      wrap.className = 'fig-media';
      const img = document.createElement('img');
      img.setAttribute('src', value.src);
      img.setAttribute('alt', value.caption || '');
      wrap.appendChild(img);
      if (value.source) {
        const src = document.createElement('span');
        src.className = 'img-source';
        src.textContent = value.source;
        wrap.appendChild(src);
      }
      node.appendChild(wrap);
      if (value.caption) {
        const cap = document.createElement('figcaption');
        cap.textContent = value.caption;
        node.appendChild(cap);
      }
      return node;
    }
    static value(node) {
      const img = node.querySelector('img');
      const cap = node.querySelector('figcaption');
      const src = node.querySelector('.img-source');
      return { src: img ? img.getAttribute('src') : '', caption: cap ? cap.textContent : '', source: src ? src.textContent : '' };
    }
  }
  class QuoteBlot extends BlockEmbed {
    static create(value) {
      const node = super.create();
      const text = document.createElement('p');
      text.className = 'q-text';
      text.textContent = value.text || '';
      node.appendChild(text);
      if (value.author || value.source) {
        const by = document.createElement('p');
        by.className = 'q-by';
        if (value.author) {
          const a = document.createElement('span');
          a.className = 'q-author';
          a.textContent = value.author;
          by.appendChild(a);
        }
        if (value.source) {
          const src = document.createElement('span');
          src.className = 'q-source';
          src.textContent = value.source;
          by.appendChild(src);
        }
        node.appendChild(by);
      }
      return node;
    }
    static value(node) {
      const q = node.querySelector('.q-text');
      const a = node.querySelector('.q-author');
      const src = node.querySelector('.q-source');
      return { text: q ? q.textContent : '', author: a ? a.textContent : '', source: src ? src.textContent : '' };
    }
  }
  QuoteBlot.blotName = 'pullquote';
  QuoteBlot.tagName = 'aside';
  QuoteBlot.className = 'article-quote';
  Quill.register(QuoteBlot);

  FigureBlot.blotName = 'figure';
  FigureBlot.tagName = 'figure';
  FigureBlot.className = 'article-figure';
  Quill.register(FigureBlot);
  registerFigureBlot.done = true;
}

/** Skróty w stylu Markdown: wpisanie znaczników na początku linii i spacji formatuje linię. */
function markdownLine(format, value) {
  return function (range, context) {
    const len = context.prefix.length;
    const start = range.index - len;
    this.quill.deleteText(start, len, 'user');
    this.quill.formatLine(start, 1, format, value, 'user');
  };
}

function initQuill() {
  if (editor.quill) return true;
  if (typeof Quill === 'undefined') {
    toast('Nie udało się załadować edytora (Quill). Sprawdź połączenie z internetem.', 'error');
    return false;
  }
  registerFigureBlot();
  editor.quill = new Quill('#quill', {
    theme: 'snow',
    placeholder: 'Zacznij pisać artykuł…',
    // Wklejany tekst (np. z Worda czy innej strony) zachowuje tylko prosty, wspólny wygląd
    formats: ['header', 'bold', 'italic', 'underline', 'strike', 'blockquote', 'list', 'indent', 'link', 'image', 'figure', 'pullquote'],
    modules: {
      toolbar: {
        container: [
          [{ header: [2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          ['pullquote'],
          [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
          ['link', 'image'],
          ['clean']
        ],
        handlers: { image() { openImageModal(); }, pullquote() { openQuoteModal(); } }
      },
      keyboard: {
        bindings: {
          markdownH2: { key: 32, collapsed: true, prefix: /^##$/, handler: markdownLine('header', 2) },
          markdownH3: { key: 32, collapsed: true, prefix: /^###$/, handler: markdownLine('header', 3) },
          markdownQuote: {
            key: 32, collapsed: true, prefix: /^>$/,
            handler(range, context) {
              this.quill.deleteText(range.index - context.prefix.length, context.prefix.length, 'user');
              openQuoteModal();
            }
          },
          markdownBullet: { key: 32, collapsed: true, prefix: /^[-*]$/, handler: markdownLine('list', 'bullet') },
          markdownOrdered: { key: 32, collapsed: true, prefix: /^1\.$/, handler: markdownLine('list', 'ordered') },
          // Enter na pustej linii cytatu kończy cytat (kolejne Entery wewnątrz cytatu go kontynuują)
          quoteExit: {
            key: 13, collapsed: true, empty: true, format: ['blockquote'],
            handler(range) { this.quill.formatLine(range.index, 1, 'blockquote', false, 'user'); }
          }
        }
      }
    }
  });

  const toolbar = editor.quill.getModule('toolbar').container;
  const titles = {
    '.ql-bold': 'Pogrubienie (Ctrl+B)',
    '.ql-italic': 'Kursywa (Ctrl+I)',
    '.ql-underline': 'Podkreślenie (Ctrl+U)',
    '.ql-strike': 'Przekreślenie',
    '.ql-pullquote': 'Cytat (ze źródłem i autorem)',
    '.ql-list[value="ordered"]': 'Lista numerowana',
    '.ql-list[value="bullet"]': 'Lista punktowana',
    '.ql-indent[value="-1"]': 'Zmniejsz wcięcie',
    '.ql-indent[value="+1"]': 'Zwiększ wcięcie',
    '.ql-link': 'Wstaw link (Ctrl+K)',
    '.ql-image': 'Wstaw zdjęcie z podpisem',
    '.ql-clean': 'Wyczyść formatowanie'
  };
  const quoteBtn = toolbar.querySelector('.ql-pullquote');
  if (quoteBtn) {
    quoteBtn.innerHTML = '<svg viewBox="0 0 18 18"><path class="ql-fill" d="M3 4h5v5c0 2.5-1.4 4-4 4v-1.6c1.2-.2 1.9-1 1.9-2.4H3zM10 4h5v5c0 2.5-1.4 4-4 4v-1.6c1.2-.2 1.9-1 1.9-2.4H10z"/></svg>';
  }
  Object.entries(titles).forEach(([sel, title]) => {
    const b = toolbar.querySelector(sel);
    if (b) b.title = title;
  });

  // Wklejanie / przeciąganie zdjęć (nasłuch na kontenerze, żeby uprzedzić obsługę Quilla)
  const imgFiles = dt => Array.from((dt && dt.files) || []).filter(f => f.type.startsWith('image/'));
  editor.quill.container.addEventListener('paste', e => {
    const files = imgFiles(e.clipboardData);
    if (!files.length) return;
    e.preventDefault();
    e.stopPropagation();
    const sel = editor.quill.getSelection(true);
    insertImageFiles(files, sel ? sel.index : editor.quill.getLength() - 1);
  }, true);
  editor.quill.container.addEventListener('drop', e => {
    const files = imgFiles(e.dataTransfer);
    if (!files.length) return;
    e.preventDefault();
    e.stopPropagation();
    let index = editor.quill.getLength() - 1;
    const pos = document.caretRangeFromPoint ? document.caretRangeFromPoint(e.clientX, e.clientY) : null;
    if (pos) {
      const blot = Quill.find(pos.startContainer, true);
      if (blot) index = editor.quill.getIndex(blot) + (blot.length ? Math.min(pos.startOffset, blot.length() - 1) : 0);
    }
    insertImageFiles(files, index);
  }, true);

  editor.quill.on('text-change', () => {
    if (editor.restoring) return;
    updateStats();
    onFormChange();
  });

  // Kliknięcie zdjęcia w tekście: zmiana podpisu lub usunięcie
  editor.quill.root.addEventListener('click', e => {
    const qt = e.target.closest && e.target.closest('aside.article-quote');
    if (qt) {
      const qb = Quill.find(qt);
      if (qb) openQuoteModal({ index: editor.quill.getIndex(qb), ...qb.constructor.value(qb.domNode) });
      return;
    }
    const fig = e.target.closest && e.target.closest('figure.article-figure');
    if (!fig) return;
    const blot = Quill.find(fig);
    if (!blot) return;
    const val = blot.constructor.value(blot.domNode);
    openImageModal({ index: editor.quill.getIndex(blot), src: val.src, caption: val.caption, source: val.source });
  });

  return true;
}

/* ---------- Edytor: otwieranie ---------- */
async function openEditor(articleId, draftParam) {
  if (!Auth.isAdmin()) {
    location.hash = '#/';
    openModal('login-modal');
    return;
  }
  if (!initQuill()) { location.hash = '#/'; return; }

  const session = ++editor.session;
  editor.active = false;
  const form = $('#editor-form');
  form.classList.add('is-loading');

  let mode;
  let draftId;
  let base = null;
  const candidates = [];

  try {
    if (draftParam) {
      mode = 'draft';
      draftId = draftParam;
      const cloud = await DataService.getDraft(draftId).catch(() => null);
      const buf = Buffers.get(draftId);
      if (!cloud && !buf) throw new Error('not-found');
      articleId = (cloud && cloud.articleId) || (buf && buf.articleId) || null;
      if (cloud) candidates.push({ kind: 'cloud', savedAt: cloud.savedAt || '', data: normalizeData(cloud) });
      if (buf) candidates.push({ kind: 'buffer', savedAt: buf.savedAt || '', data: normalizeData(buf.data) });
      base = articleId ? state.articles.find(a => a.id === articleId) || null : null;
    } else if (articleId) {
      mode = 'edit';
      base = state.articles.find(a => a.id === articleId) || null;
      if (!base) throw new Error('not-found');
      draftId = 'edit_' + articleId;
      const cloud = await DataService.getDraft(draftId).catch(() => null);
      const buf = Buffers.get(draftId);
      const baseTime = base.updatedAt || base.createdAt || '';
      if (cloud && String(cloud.savedAt) > baseTime) candidates.push({ kind: 'cloud', savedAt: cloud.savedAt, data: normalizeData(cloud) });
      if (buf && String(buf.savedAt) > baseTime) candidates.push({ kind: 'buffer', savedAt: buf.savedAt, data: normalizeData(buf.data) });
    } else {
      mode = 'new';
      let pointer = null;
      try { pointer = localStorage.getItem(CONFIG.NEW_POINTER_KEY); } catch { /* ignoruj */ }
      const buf = pointer ? Buffers.get(pointer) : null;
      if (buf && !buf.articleId) {
        draftId = pointer;
        candidates.push({ kind: 'buffer', savedAt: buf.savedAt || '', data: normalizeData(buf.data) });
      } else {
        draftId = Utils.uid('d_');
      }
    }
  } catch (err) {
    if (session !== editor.session) return;
    form.classList.remove('is-loading');
    toast(err.message === 'not-found' ? 'Nie znaleziono artykułu lub wersji roboczej.' : 'Nie udało się otworzyć edytora.', 'error');
    location.hash = '#/panel';
    return;
  }
  if (session !== editor.session) return;

  candidates.sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)));
  const chosen = candidates[0] || null;

  editor.mode = mode;
  editor.draftId = draftId;
  editor.articleId = articleId || null;
  editor.existing = base;

  applyData(chosen ? chosen.data : (base ? dataFromArticle(base) : emptyData()));

  editor.lastCloud = chosen && chosen.kind === 'cloud' ? JSON.stringify(collectData()) : '';
  editor.dirty = !!(chosen && chosen.kind === 'buffer');

  // Baner informujący o przywróceniu pracy
  const banner = $('#editor-banner');
  const discardBtn = $('#banner-discard');
  banner.hidden = true;
  if (chosen && chosen.kind === 'buffer') {
    $('#banner-text').textContent = `Przywrócono niezapisane zmiany z ${Utils.formatDate(chosen.savedAt)}.`;
    discardBtn.textContent = mode === 'draft' ? 'Odrzuć niezapisane zmiany' : (mode === 'edit' ? 'Wróć do opublikowanej wersji' : 'Zacznij od nowa');
    banner.hidden = false;
  } else if (chosen && chosen.kind === 'cloud' && mode === 'edit') {
    $('#banner-text').textContent = `Wczytano wersję roboczą zmian z ${Utils.formatDate(chosen.savedAt)}.`;
    discardBtn.textContent = 'Wróć do opublikowanej wersji';
    banner.hidden = false;
  }

  $('#editor-heading').textContent = mode === 'new' ? 'Nowy artykuł' : (articleId ? 'Edycja artykułu' : 'Wersja robocza');
  setStatus(chosen && chosen.kind === 'cloud' ? 'Wersja robocza zapisana o ' + Utils.formatTime(chosen.savedAt) : '');

  editor.active = true;
  form.classList.remove('is-loading');
  if (mode === 'new' && !chosen) $('#f-title').focus();
}

async function discardRestored() {
  if (!confirm('Odrzucić przywrócone zmiany? Tej operacji nie można cofnąć.')) return;
  const id = editor.draftId;
  Buffers.remove(id);
  clearPointer(id);

  let data;
  if (editor.mode === 'draft') {
    const cloud = await DataService.getDraft(id).catch(() => null);
    data = cloud ? normalizeData(cloud) : (editor.existing ? dataFromArticle(editor.existing) : emptyData());
  } else {
    await DataService.removeDraft(id).catch(() => {});
    data = editor.existing ? dataFromArticle(editor.existing) : emptyData();
  }
  applyData(data);
  editor.dirty = false;
  editor.lastCloud = editor.mode === 'draft' ? JSON.stringify(collectData()) : '';
  $('#editor-banner').hidden = true;
  setStatus('');
}

/* ---------- Edytor: publikacja, podgląd, zdjęcia ---------- */
async function saveArticle(e) {
  e.preventDefault();
  if (!editor.active) return;
  if (!Auth.isAdmin()) { toast('Sesja wygasła – zaloguj się ponownie.', 'error'); return; }

  const d = collectData();
  const title = d.title.trim();
  const lead = d.lead.trim();
  const author = d.author.trim();

  if (!title) { toast('Podaj tytuł artykułu.', 'error'); $('#f-title').focus(); return; }
  if (!lead) { toast('Uzupełnij lead (zajawkę).', 'error'); $('#f-lead').focus(); return; }
  if (!author) { toast('Podaj autora.', 'error'); $('#f-author').focus(); return; }
  if (!d.content) { toast('Treść artykułu jest pusta.', 'error'); editor.quill.focus(); return; }
  if (!d.categories.length) { toast('Wybierz co najmniej jedną kategorię.', 'error'); return; }

  let review = null;
  if (d.reviewOn) {
    const score = Utils.parseScore(d.reviewScore);
    if (score === null) { toast('Ocena musi być liczbą od 0 do 10 (np. 6,4).', 'error'); $('#f-review-score').focus(); return; }
    if (!d.reviewWork.trim()) { toast('Podaj tytuł ocenianego dzieła.', 'error'); $('#f-review-work').focus(); return; }
    if (d.reviewCoverSame && !d.image) { toast('Zaznaczono okładkę jak zdjęcie główne, ale artykuł nie ma zdjęcia głównego.', 'error'); return; }
    if (!d.reviewCoverSame && !d.reviewCover) { toast('Dodaj okładkę recenzji albo zaznacz, że ma być taka jak zdjęcie główne.', 'error'); $('#f-review-cover-url').focus(); return; }
    review = {
      score,
      coverSame: d.reviewCoverSame,
      cover: d.reviewCoverSame ? '' : d.reviewCover,
      kind: d.reviewKind.trim(),
      work: d.reviewWork.trim(),
      artist: d.reviewArtist.trim(),
      year: d.reviewYear.trim()
    };
  }

  let createdAt;
  if (d.scheduleOn) {
    const when = new Date(d.scheduleAt);
    if (!d.scheduleAt || isNaN(when)) { toast('Wybierz datę i godzinę publikacji.', 'error'); $('#f-schedule-at').focus(); return; }
    if (when.getTime() <= Date.now() + 30000) {
      toast('Data publikacji musi być w przyszłości. Odznacz planowanie, aby opublikować od razu.', 'error');
      $('#f-schedule-at').focus();
      return;
    }
    createdAt = when.toISOString();
  } else if (editor.existing && isPublished(editor.existing)) {
    createdAt = editor.existing.createdAt;
  } else {
    createdAt = new Date().toISOString();
  }

  const article = {
    id: editor.articleId || Utils.uid(),
    title,
    lead,
    category: d.categories[0],
    categories: d.categories,
    author,
    image: d.image,
    imageCaption: d.imageCaption.trim(),
    imageSource: d.imageSource.trim(),
    review,
    urgent: d.urgent,
    featured: d.featured,
    infobox: d.infobox.map(r => ({ label: r.label.trim(), value: r.value.trim() })).filter(r => r.label && r.value),
    content: d.content,
    createdAt,
    updatedAt: new Date().toISOString()
  };

  const buttons = [$('#editor-save'), $('#btn-save-draft')];
  buttons.forEach(b => { b.disabled = true; });
  try {
    await DataService.save(article);
    upsertLocalState(article);
    try { localStorage.setItem(CONFIG.AUTHOR_KEY, author); } catch { /* ignoruj */ }

    // Tylko jeden artykuł może być Tematem dnia – poprzedni zostaje automatycznie odznaczony
    let unfeatured = 0;
    if (article.featured && isPublished(article)) {
      for (const other of state.articles.filter(x => x.id !== article.id && x.featured && isPublished(x))) {
        try {
          const cleared = { ...other, featured: false };
          await DataService.save(cleared);
          upsertLocalState(cleared);
          unfeatured++;
        } catch (err) {
          console.warn('Nie udało się odznaczyć poprzedniego Tematu dnia:', err);
        }
      }
    }

    // Artykuł jest zapisany – wersja robocza nie jest już potrzebna
    const draftId = editor.draftId;
    clearTimeout(editor.bufferTimer);
    clearTimeout(editor.cloudTimer);
    editor.cloudTimer = null;
    editor.active = false;
    editor.dirty = false;
    Buffers.remove(draftId);
    clearPointer(draftId);
    DataService.removeDraft(draftId).catch(() => {});

    if (d.scheduleOn) {
      toast('Publikacja zaplanowana na ' + Utils.formatDate(createdAt) + '.');
      location.hash = '#/panel';
    } else {
      toast((editor.existing ? 'Zmiany zapisane.' : 'Artykuł opublikowany.') + (unfeatured ? ' Poprzedni Temat dnia został odznaczony.' : ''));
      location.hash = '#/artykul/' + encodeURIComponent(article.id);
    }
  } catch (err) {
    console.error(err);
    toast(err.message || 'Nie udało się zapisać artykułu.', 'error');
  } finally {
    buttons.forEach(b => { b.disabled = false; });
  }
}

function openPreview() {
  if (!editor.active) return;
  const d = collectData();
  const when = d.scheduleOn && d.scheduleAt ? new Date(d.scheduleAt) : null;
  const created = when && !isNaN(when)
    ? when.toISOString()
    : (editor.existing && isPublished(editor.existing) ? editor.existing.createdAt : new Date().toISOString());
  const preview = {
    id: 'preview',
    title: d.title.trim() || '(bez tytułu)',
    lead: d.lead.trim(),
    category: d.categories[0] || '',
    categories: d.categories,
    author: d.author.trim() || '(autor)',
    image: d.image,
    imageCaption: d.imageCaption.trim(),
    imageSource: d.imageSource.trim(),
    review: d.reviewOn && Utils.parseScore(d.reviewScore) !== null
      ? { score: Utils.parseScore(d.reviewScore), coverSame: d.reviewCoverSame, cover: d.reviewCoverSame ? '' : d.reviewCover, kind: d.reviewKind.trim(), work: d.reviewWork.trim() || '(tytuł)', artist: d.reviewArtist.trim(), year: d.reviewYear.trim() }
      : null,
    urgent: d.urgent,
    featured: d.featured,
    infobox: d.infobox.map(r => ({ label: r.label.trim(), value: r.value.trim() })),
    content: d.content,
    createdAt: created,
    updatedAt: created
  };
  $('#preview-body').innerHTML = articleHtml(preview, Utils.stripHtml(d.content));
  openModal('preview-modal');
}

function openImageModal(edit) {
  const isEdit = !!edit && typeof edit.index === 'number';
  editor.editingFigure = isEdit ? edit.index : null;
  editor.range = isEdit ? null : editor.quill.getSelection(true);

  const src = isEdit ? edit.src : '';
  $('#image-title').textContent = isEdit ? 'Zdjęcie w tekście' : 'Wstaw zdjęcie do tekstu';
  $('#im-submit').textContent = isEdit ? 'Zapisz' : 'Wstaw';
  $('#im-delete').hidden = !isEdit;
  $('#im-url').value = src && !src.startsWith('data:') ? src : '';
  $('#im-file').value = '';
  $('#im-caption').value = isEdit ? edit.caption : '';
  $('#im-source').value = isEdit ? edit.source || '' : '';
  $('#im-error').hidden = true;
  setModalImage(src);
  openModal('image-modal');
}

function setModalImage(src) {
  editor.modalImage = src || '';
  const box = $('#im-preview');
  box.hidden = !editor.modalImage;
  if (editor.modalImage) $('img', box).src = editor.modalImage;
}

function insertImageIntoEditor(e) {
  e.preventDefault();
  const src = editor.modalImage || $('#im-url').value.trim();
  const err = $('#im-error');
  if (!src) {
    err.textContent = 'Podaj adres URL lub wybierz plik ze zdjęciem.';
    err.hidden = false;
    return;
  }
  const caption = $('#im-caption').value.trim();
  const source = $('#im-source').value.trim();
  if (editor.editingFigure !== null) {
    const index = editor.editingFigure;
    editor.quill.deleteText(index, 1, 'user');
    editor.quill.insertEmbed(index, 'figure', { src, caption, source }, 'user');
  } else {
    const index = editor.range ? editor.range.index : Math.max(0, editor.quill.getLength() - 1);
    editor.quill.insertEmbed(index, 'figure', { src, caption, source }, 'user');
    editor.quill.setSelection(index + 1, 0, 'silent');
  }
  closeModal('image-modal');
}

function openQuoteModal(edit) {
  const isEdit = !!edit && typeof edit.index === 'number';
  editor.editingQuote = isEdit ? edit.index : null;
  editor.range = isEdit ? null : editor.quill.getSelection(true);
  $('#quote-title').textContent = isEdit ? 'Edytuj cytat' : 'Wstaw cytat';
  $('#qm-submit').textContent = isEdit ? 'Zapisz' : 'Wstaw';
  $('#qm-delete').hidden = !isEdit;
  $('#qm-text').value = isEdit ? edit.text : '';
  $('#qm-source').value = isEdit ? edit.source : '';
  $('#qm-author').value = isEdit ? edit.author : '';
  $('#qm-error').hidden = true;
  openModal('quote-modal');
}

function submitQuote(e) {
  e.preventDefault();
  const text = $('#qm-text').value.trim();
  if (!text) {
    $('#qm-error').textContent = 'Wpisz treść cytatu.';
    $('#qm-error').hidden = false;
    return;
  }
  const value = { text, source: $('#qm-source').value.trim(), author: $('#qm-author').value.trim() };
  if (editor.editingQuote !== null) {
    const index = editor.editingQuote;
    editor.quill.deleteText(index, 1, 'user');
    editor.quill.insertEmbed(index, 'pullquote', value, 'user');
  } else {
    const index = editor.range ? editor.range.index : Math.max(0, editor.quill.getLength() - 1);
    editor.quill.insertEmbed(index, 'pullquote', value, 'user');
    editor.quill.setSelection(index + 1, 0, 'silent');
  }
  closeModal('quote-modal');
}

function deleteQuote() {
  if (editor.editingQuote === null) return;
  editor.quill.deleteText(editor.editingQuote, 1, 'user');
  closeModal('quote-modal');
}

function deleteFigure() {
  if (editor.editingFigure === null) return;
  editor.quill.deleteText(editor.editingFigure, 1, 'user');
  closeModal('image-modal');
}

/* ---------- Routing ---------- */
function showView(name) {
  ['home', 'article', 'panel', 'editor', 'settings'].forEach(v => { $('#view-' + v).hidden = v !== name; });
  $('#layout').dataset.view = name;
}

function refreshViews() {
  if (!state.ready) return;
  renderBreaking();
  renderSideList();
  const route = currentRoute();
  if (route.name === 'home') renderHome();
  else if (route.name === 'article') renderArticleView(route.id);
  else if (route.name === 'panel') renderPanel();
}

function route() {
  leaveEditor();
  const r = currentRoute();
  window.scrollTo(0, 0);
  document.title = `${CONFIG.SITE_NAME} – najświeższe wiadomości`;

  if ((r.name === 'editor' || r.name === 'panel' || r.name === 'settings') && !Auth.isAdmin()) {
    location.hash = '#/';
    openModal('login-modal');
    return;
  }

  if (r.name === 'article') {
    showView('article');
    renderArticleView(r.id);
  } else if (r.name === 'settings') {
    showView('settings');
    document.title = `Ustawienia konta – ${CONFIG.SITE_NAME}`;
    renderSettings();
  } else if (r.name === 'panel') {
    showView('panel');
    document.title = `Robocze i zaplanowane – ${CONFIG.SITE_NAME}`;
    renderPanel();
  } else if (r.name === 'editor') {
    showView('editor');
    document.title = `Edytor – ${CONFIG.SITE_NAME}`;
    openEditor(r.id, r.draft);
  } else {
    showView('home');
    const wanted = r.category && CATEGORIES.includes(r.category) ? r.category : ALL;
    if (wanted !== state.category) state.visible = CONFIG.PAGE_SIZE;
    state.category = wanted;
    updateCategoryNav();
    setMeta();
    renderHome();
  }
  renderSideList();
  updateScrollUi();
}

/* ---------- Kategorie ---------- */
function buildCategoryNav() {
  $('#category-nav').innerHTML = [ALL, ...CATEGORIES].map(c =>
    `<button type="button" class="chip-btn" data-category="${Utils.esc(c)}">${Utils.esc(c)}</button>`).join('');
  updateCategoryNav();
}

function updateCategoryNav() {
  $$('.chip-btn').forEach(b => b.classList.toggle('active', b.dataset.category === state.category));
}

function goHomeAndRender() {
  state.visible = CONFIG.PAGE_SIZE;
  if (currentRoute().name === 'home') { renderHome(); renderSideList(); }
  else location.hash = '#/';
}

/* ---------- Auth UI ---------- */
function applyAuthUI() {
  document.body.classList.toggle('is-admin', Auth.isAdmin());
  const rn = currentRoute().name;
  // Utrata uprawnień (np. wylogowanie) w widoku dla redakcji – wróć na stronę główną
  if (state.ready && (rn === 'editor' || rn === 'panel' || rn === 'settings') && !Auth.isAdmin()) {
    location.hash = '#/';
    return;
  }
  if (Auth.isAdmin()) loadProfile(); else renderProfile();
  refreshViews();
}

/* ---------- Profil redaktora (nazwa i zdjęcie) ---------- */
function avatarHtml(p) {
  if (p.avatar) return `<img src="${Utils.esc(p.avatar)}" alt="">`;
  const initials = (p.name || 'R').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return `<span>${Utils.esc(initials || 'R')}</span>`;
}

function renderProfile() {
  $('#profile-name').textContent = state.profile.name || 'Redaktor';
  $('#profile-avatar').innerHTML = avatarHtml(state.profile);
}

async function loadProfile() {
  if (state.profileLoaded) { renderProfile(); return; }
  state.profileLoaded = true;
  const cached = readLocalProfile();
  if (cached) state.profile = { name: cached.name || '', avatar: cached.avatar || '' };
  renderProfile();
  try {
    const remote = await DataService.getProfile();
    if (remote) {
      state.profile = { name: remote.name || '', avatar: remote.avatar || '' };
      writeLocalProfile(state.profile);
      renderProfile();
    }
  } catch (err) {
    console.warn('Nie udało się pobrać profilu:', err);
  }
}

let settingsAvatar = '';
function renderSettings() {
  settingsAvatar = state.profile.avatar || '';
  $('#st-name').value = state.profile.name || '';
  $('#st-error').hidden = true;
  $('#st-avatar-file').value = '';
  updateSettingsAvatar();
}

function updateSettingsAvatar() {
  $('#st-avatar').innerHTML = avatarHtml({ name: $('#st-name').value || state.profile.name, avatar: settingsAvatar });
  $('#st-avatar-remove').hidden = !settingsAvatar;
}

async function saveSettings(e) {
  e.preventDefault();
  const err = $('#st-error');
  err.hidden = true;
  const next = { name: $('#st-name').value.trim().slice(0, 60), avatar: settingsAvatar };
  const btn = $('#st-save');
  btn.disabled = true;
  try {
    await DataService.saveProfile(next);
    state.profile = next;
    writeLocalProfile(next);
    renderProfile();
    toast('Ustawienia zapisane.');
  } catch (ex) {
    console.error(ex);
    err.textContent = ex.message || 'Nie udało się zapisać ustawień.';
    err.hidden = false;
  } finally {
    btn.disabled = false;
  }
}

/* ---------- Akcje (przyciski z data-action) ---------- */
function handleAction(action, id) {
  if (action === 'share') { shareArticle(id); return; }
  if (!Auth.isAdmin()) return;
  if (action === 'edit') location.hash = '#/edytor/' + encodeURIComponent(id);
  else if (action === 'delete') deleteArticle(id);
  else if (action === 'delete-draft') deleteDraft(id);
  else if (action === 'publish-now') publishNow(id);
}

/* ---------- Zdarzenia ---------- */
function bindEvents() {
  // Zastępcze zdjęcie dla zepsutych linków
  document.addEventListener('error', e => {
    const t = e.target;
    if (t.tagName === 'IMG' && !t.dataset.fallback && t.dataset.cat) {
      t.dataset.fallback = '1';
      t.src = Utils.placeholder(t.dataset.cat);
    }
  }, true);

  // Logo i „Home” – reset filtrów
  [$('#logo'), $('#nav-home')].forEach(el => el.addEventListener('click', () => {
    state.category = ALL;
    state.query = '';
    state.visible = CONFIG.PAGE_SIZE;
    $('#search-input').value = '';
    updateCategoryNav();
    if (currentRoute().name === 'home') renderHome();
  }));

  // Wyszukiwarka na żywo
  $('#search-input').addEventListener('input', Utils.debounce(e => {
    state.query = e.target.value;
    goHomeAndRender();
  }, 150));

  // Filtry kategorii
  $('#category-nav').addEventListener('click', e => {
    const btn = e.target.closest('.chip-btn');
    if (!btn) return;
    const target = btn.dataset.category === ALL ? '#/' : '#/kategoria/' + encodeURIComponent(btn.dataset.category);
    state.visible = CONFIG.PAGE_SIZE;
    if (location.hash === target || (target === '#/' && !location.hash)) {
      state.category = btn.dataset.category;
      updateCategoryNav();
      renderHome();
      renderSideList();
    } else {
      location.hash = target;
    }
  });

  $('#btn-load-more').addEventListener('click', () => {
    state.visible += CONFIG.PAGE_SIZE;
    renderHome();
  });

  // Akcje (Edytuj / Usuń / Udostępnij …) + kliknięcie w cały kafel
  document.addEventListener('click', e => {
    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) {
      e.preventDefault();
      e.stopPropagation();
      handleAction(actionBtn.dataset.action, actionBtn.dataset.id);
      return;
    }
    const tile = e.target.closest('.card, .hero, .tile, .side-item');
    if (tile && !e.target.closest('a, button')) {
      location.hash = '#/artykul/' + encodeURIComponent(tile.dataset.id);
    }
  });

  // Przyciski nawigacji
  $('#btn-login').addEventListener('click', () => {
    $('#login-error').hidden = true;
    $('#login-password').value = '';
    openModal('login-modal');
  });
  $('#btn-logout').addEventListener('click', async () => {
    await Auth.logout();
    if (['editor', 'panel', 'settings'].includes(currentRoute().name)) location.hash = '#/';
    applyAuthUI();
    toast('Wylogowano.');
  });
  $('#btn-new').addEventListener('click', () => { location.hash = '#/edytor'; });
  $('#panel-new').addEventListener('click', () => { location.hash = '#/edytor'; });
  $('#btn-panel').addEventListener('click', () => { location.hash = '#/panel'; });
  $('#btn-settings').addEventListener('click', () => { location.hash = '#/ustawienia'; });

  // Ustawienia konta
  $('#settings-form').addEventListener('submit', saveSettings);
  $('#st-name').addEventListener('input', updateSettingsAvatar);
  $('#st-avatar-file').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      settingsAvatar = await Utils.fileToSquare(file);
      updateSettingsAvatar();
    } catch (err) {
      $('#st-error').textContent = err.message;
      $('#st-error').hidden = false;
      e.target.value = '';
    }
  });
  $('#st-avatar-remove').addEventListener('click', () => { settingsAvatar = ''; $('#st-avatar-file').value = ''; updateSettingsAvatar(); });

  // Cytat (modal)
  $('#quote-form').addEventListener('submit', submitQuote);
  $('#qm-delete').addEventListener('click', deleteQuote);

  // Przewijany pasek PILNE – dopasowanie po zmianie rozmiaru okna
  window.addEventListener('resize', Utils.debounce(fitTicker, 150));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTicker);

  // Logowanie
  $('#login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const emailInput = $('#login-email');
    const input = $('#login-password');
    const errEl = $('#login-error');
    const submit = $('button[type="submit"]', $('#login-form'));
    errEl.hidden = true;
    submit.disabled = true;
    try {
      await Auth.login(emailInput.value.trim(), input.value);
      closeModal('login-modal');
      input.value = '';
      applyAuthUI();
      toast('Zalogowano jako redaktor.');
    } catch (err) {
      console.warn('Logowanie nieudane:', err.code || err);
      errEl.textContent = Auth.explain(err);
      errEl.hidden = false;
      input.select();
    } finally {
      submit.disabled = false;
    }
  });

  // Zamykanie modali
  $$('[data-close]').forEach(b => b.addEventListener('click', () => closeModal(b.dataset.close)));
  $$('.modal').forEach(m => m.addEventListener('mousedown', e => {
    if (e.target === m) closeModal(m.id);
  }));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') $$('.modal').filter(m => !m.hidden).forEach(m => closeModal(m.id));
    // Ctrl+S / Cmd+S – zapis wersji roboczej
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && editor.active) {
      e.preventDefault();
      manualSaveDraft();
    }
  });

  // Formularz edytora
  const form = $('#editor-form');
  form.addEventListener('submit', saveArticle);
  form.addEventListener('input', () => { updateCounters(); updateChecklist(); onFormChange(); });
  form.addEventListener('change', () => { updateChecklist(); onFormChange(); });
  $('#btn-gen-lead').addEventListener('click', generateLead);

  $('#editor-cancel').addEventListener('click', () => {
    location.hash = editor.articleId ? '#/artykul/' + encodeURIComponent(editor.articleId) : '#/panel';
  });
  $('#btn-save-draft').addEventListener('click', manualSaveDraft);
  $('#btn-preview').addEventListener('click', openPreview);
  $('#btn-focus').addEventListener('click', () => {
    const on = form.classList.toggle('focus-mode');
    $('#btn-focus').textContent = on ? 'Pokaż panel' : 'Tryb pisania';
  });
  $('#banner-discard').addEventListener('click', discardRestored);

  $('#f-schedule-on').addEventListener('change', updatePublishUi);
  $('#f-review-on').addEventListener('change', updateReviewUi);
  $('#f-review-cover-same').addEventListener('change', updateReviewUi);
  $('#f-review-cover-url').addEventListener('input', e => {
    const v = e.target.value.trim();
    editor.cover = v;
    const box = $('#f-review-cover-preview');
    box.hidden = !v;
    if (v) $('img', box).src = v;
  });
  $('#f-review-cover-file').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setCover(await Utils.fileToDataUrl(file, 640, 0.78));
      onFormChange();
    } catch (err) {
      toast(err.message, 'error');
      e.target.value = '';
    }
  });
  $('#f-review-cover-remove').addEventListener('click', () => { setCover(''); onFormChange(); });
  $('#f-review-score').addEventListener('blur', e => {
    const n = Utils.parseScore(e.target.value);
    if (n !== null) e.target.value = Utils.formatScore(n);
  });

  $('#infobox-add').addEventListener('click', () => { addInfoRow(); onFormChange(); });
  $('#infobox-rows').addEventListener('click', e => {
    const rm = e.target.closest('.info-remove');
    if (rm) { rm.closest('.info-row').remove(); onFormChange(); }
  });

  // Zdjęcie główne
  $('#f-image-url').addEventListener('input', e => {
    const v = e.target.value.trim();
    editor.image = v;
    const box = $('#f-image-preview');
    box.hidden = !v;
    if (v) $('img', box).src = v;
  });
  $('#f-image-file').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setMainImage(await Utils.fileToDataUrl(file));
      onFormChange();
    } catch (err) {
      toast(err.message, 'error');
      e.target.value = '';
    }
  });
  $('#f-image-remove').addEventListener('click', () => { setMainImage(''); onFormChange(); });

  // Zdjęcie w treści (modal)
  $('#image-form').addEventListener('submit', insertImageIntoEditor);
  $('#im-delete').addEventListener('click', deleteFigure);
  $('#im-url').addEventListener('input', e => {
    const v = e.target.value.trim();
    $('#im-file').value = '';
    setModalImage(v);
  });
  $('#im-file').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      $('#im-url').value = '';
      setModalImage(await Utils.fileToDataUrl(file));
    } catch (err) {
      $('#im-error').textContent = err.message;
      $('#im-error').hidden = false;
      e.target.value = '';
    }
  });

  // Ochrona pracy przy przypadkowym wyjściu ze strony / zamknięciu karty / przełączeniu aplikacji
  const flush = () => { if (editor.active && editor.dirty) writeBuffer(); };
  window.addEventListener('beforeunload', flush);
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flush();
      if (editor.active && editor.dirty) saveCloudDraft(false);
    } else {
      refreshViews();
    }
  });

  window.addEventListener('hashchange', route);

  // Motyw jasny/ciemny
  $('#btn-theme').addEventListener('click', Theme.toggle);

  // Pasek postępu czytania i przycisk „do góry”
  window.addEventListener('scroll', updateScrollUi, { passive: true });
  $('#to-top').addEventListener('click', () => window.scrollTo({ top: 0 }));

  // Link „Przejdź do treści” (hash jest zajęty przez router, więc bez zmiany adresu)
  $('#skip-link').addEventListener('click', e => {
    e.preventDefault();
    const app = $('#app');
    app.setAttribute('tabindex', '-1');
    app.focus();
  });

  // Skrót: „/” ustawia kursor w wyszukiwarce
  document.addEventListener('keydown', e => {
    if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t.matches && t.matches('input, textarea, select, [contenteditable="true"]')) return;
    if ($$('.modal').some(m => !m.hidden) || !$('#view-home').offsetParent && currentRoute().name === 'editor') return;
    e.preventDefault();
    $('#search-input').focus();
  });
}

const Theme = {
  isDark() {
    const t = document.documentElement.getAttribute('data-theme');
    return t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  },
  toggle() {
    const next = Theme.isDark() ? 'light' : 'dark';
    const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const root = document.documentElement;
    try {
      if (next === system) {      // wybór zgodny z systemem = wracamy do automatycznego
        root.removeAttribute('data-theme');
        localStorage.removeItem('sliska_theme');
      } else {
        root.setAttribute('data-theme', next);
        localStorage.setItem('sliska_theme', next);
      }
    } catch { root.setAttribute('data-theme', next); }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = Theme.isDark() ? '#121212' : '#d6001c';
  }
};

function setMeta(title, description) {
  const desc = description || 'Śliska News – wiadomości z muzyki, kontrowersji i dram. Codziennie najświeższe informacje.';
  const set = (sel, val) => { const m = document.querySelector(sel); if (m) m.setAttribute('content', val); };
  set('meta[name="description"]', desc.slice(0, 200));
  set('meta[property="og:title"]', title ? `${title} – ${CONFIG.SITE_NAME}` : CONFIG.SITE_NAME);
  set('meta[property="og:description"]', desc.slice(0, 200));
}

function updateScrollUi() {
  const y = window.scrollY || document.documentElement.scrollTop || 0;
  $('#to-top').hidden = y < 600;
  const bar = $('#read-progress');
  const isArticle = currentRoute().name === 'article';
  bar.hidden = !isArticle;
  if (isArticle) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (max > 0 ? Math.min(100, (y / max) * 100) : 0) + '%';
  }
}

async function manualSaveDraft() {
  if (!editor.active) return;
  writeBuffer();
  const ok = await saveCloudDraft(true);
  if (ok) toast('Wersja robocza zapisana.');
  else if (!isEmptyData(collectData())) toast('Nie udało się zapisać w bazie – kopia jest w tej przeglądarce.', 'error');
}

/* ---------- Start ---------- */
async function main() {
  $('#year').textContent = new Date().getFullYear();
  renderCatPicker([]);
  buildCategoryNav();
  bindEvents();
  document.body.classList.toggle('is-admin', Auth.isAdmin());

  await DataService.init();
  Auth.mode = DataService.mode;
  $('#login-email-field').hidden = Auth.mode !== 'firebase';
  document.body.classList.toggle('is-admin', Auth.isAdmin());

  if (DataService.mode === 'offline') state.loadError = true;

  try {
    // Jeden nasłuch: pierwsza lista wraca tutaj, kolejne zmiany trafiają do funkcji poniżej
    setArticles(await DataService.watch(list => {
      setArticles(list);
      refreshViews();
    }));
  } catch (err) {
    console.error(err);
    state.loadError = true;
  }
  state.ready = true;
  if (Auth.isAdmin()) loadProfile();
  Auth.onChange(() => applyAuthUI());

  // Informacja o trybie danych widoczna tylko dla zalogowanej redakcji
  $('#data-mode').textContent = DataService.mode === 'firebase'
    ? 'Baza danych: Firebase Firestore'
    : DataService.mode === 'local'
      ? 'Tryb demonstracyjny: dane tylko w tej przeglądarce'
      : 'Brak połączenia z bazą danych';

  renderBreaking();
  route();

  // Zaplanowane artykuły pojawiają się same, gdy nadejdzie ich czas
  setInterval(() => {
    const now = Date.now();
    const crossed = state.articles.some(a => {
      const t = Date.parse(a.createdAt);
      return t > state.lastTick && t <= now;
    });
    state.lastTick = now;
    if (crossed) refreshViews();
  }, 15000);
}

document.addEventListener('DOMContentLoaded', main);
