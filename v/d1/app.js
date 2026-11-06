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

const CATEGORIES = ['Muzyka', 'Kontrowersje', 'Dramy'];
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

  placeholder(category) {
    const hues = { 'Muzyka': 265, 'Kontrowersje': 8, 'Dramy': 330 };
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
    'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption', 'span', 'div']),
  DROP: new Set(['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'form', 'input',
    'button', 'textarea', 'select', 'svg', 'math', 'base', 'template']),
  ATTRS: { a: ['href'], img: ['src', 'alt'], '*': ['class'] },

  clean(html) {
    const doc = new DOMParser().parseFromString(`<body>${html || ''}</body>`, 'text/html');
    this._walk(doc.body);
    return doc.body.innerHTML;
  },

  /** HTML do wyświetlenia czytelnikowi: oczyszczony, a kolejne linie cytatu scalone w jeden blok. */
  render(html) {
    const doc = new DOMParser().parseFromString(`<body>${this.clean(html)}</body>`, 'text/html');
    this._mergeQuotes(doc);
    return doc.body.innerHTML;
  },

  _mergeQuotes(doc) {
    let group = null;
    Array.from(doc.body.children).forEach(el => {
      if (el.tagName !== 'BLOCKQUOTE') { group = null; return; }
      const hasBlock = Array.from(el.children).some(c => /^(P|UL|OL|H[1-6])$/.test(c.tagName));
      const nodes = Array.from(el.childNodes);
      let target = el;
      if (group) target = group;
      if (hasBlock) {
        nodes.forEach(n => target.appendChild(n));
      } else {
        const p = doc.createElement('p');
        nodes.forEach(n => p.appendChild(n));
        target.appendChild(p);
      }
      if (group) el.remove(); else group = el;
    });
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
  ];
}

/* =========================================================
   4. DATASERVICE – warstwa danych
   Provider udostępnia: init, watch, save, remove,
   getDrafts, getDraft, saveDraft, removeDraft
   ========================================================= */
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
  breakingTimer: null,
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
  modalImage: '',       // zdjęcie wstawiane do treści
  range: null,
  editingFigure: null,  // indeks edytowanego zdjęcia w treści
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

function getImage(a) { return a.image || Utils.placeholder(a.category); }

function currentRoute() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'artykul' && parts[1]) return { name: 'article', id: decodeURIComponent(parts[0 + 1]) };
  if (parts[0] === 'edytor') return { name: 'editor', id: parts[1] ? decodeURIComponent(parts[1]) : null, draft: null };
  if (parts[0] === 'szkic' && parts[1]) return { name: 'editor', id: null, draft: decodeURIComponent(parts[1]) };
  if (parts[0] === 'panel') return { name: 'panel' };
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
  clearInterval(state.breakingTimer);
  const urgent = publishedArticles().filter(a => a.urgent);
  if (!urgent.length) { bar.hidden = true; return; }

  bar.hidden = false;
  let i = 0;
  const show = () => {
    const a = urgent[i % urgent.length];
    const link = $('#breaking-link');
    link.textContent = a.title;
    link.href = '#/artykul/' + encodeURIComponent(a.id);
    $('#breaking-count').textContent = urgent.length > 1 ? `${(i % urgent.length) + 1}/${urgent.length}` : '';
    i++;
  };
  show();
  if (urgent.length > 1) state.breakingTimer = setInterval(show, 5000);
}

/* ---------- Strona główna ---------- */
function filteredArticles() {
  const q = state.query.trim().toLowerCase();
  return publishedArticles().filter(a => {
    if (state.category !== ALL && a.category !== state.category) return false;
    if (!q) return true;
    const haystack = `${a.title} ${a.lead} ${state.plain.get(a.id) || ''}`.toLowerCase();
    return haystack.includes(q);
  });
}

function cardHtml(a, opts = {}) {
  const id = encodeURIComponent(a.id);
  return `<article class="card" data-id="${Utils.esc(a.id)}">
    <a class="card-media" href="#/artykul/${id}" tabindex="-1" aria-hidden="true">
      <img src="${Utils.esc(getImage(a))}" alt="" data-cat="${Utils.esc(a.category)}" loading="lazy">
    </a>
    <div class="card-body">
      <div class="card-tags">
        <span class="chip">${Utils.esc(a.category)}</span>
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

function heroHtml(a) {
  const id = encodeURIComponent(a.id);
  return `<section class="hero" data-id="${Utils.esc(a.id)}" aria-label="Temat dnia">
    <img class="hero-img" src="${Utils.esc(getImage(a))}" alt="" data-cat="${Utils.esc(a.category)}">
    <div class="hero-content">
      <span class="hero-flag">Temat dnia</span>
      <div><span class="chip">${Utils.esc(a.category)}</span></div>
      <h2 class="hero-title"><a href="#/artykul/${id}">${Utils.esc(a.title)}</a></h2>
      <p class="hero-lead">${Utils.esc(a.lead)}</p>
      <div class="card-meta">
        <time datetime="${Utils.esc(a.createdAt)}">${Utils.formatDate(a.createdAt)} · ${Utils.esc(a.author)}</time>
        ${adminButtons(a.id)}
      </div>
    </div>
  </section>`;
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
  const hero = list.find(a => a.featured);
  const rest = list.filter(a => a !== hero);
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

  $('#hero-slot').innerHTML = hero ? heroHtml(hero) : '';
  $('#news-grid').innerHTML = shown.map(a => cardHtml(a)).join('');

  const title = $('#grid-title');
  title.hidden = shown.length === 0;
  title.textContent = state.category === ALL ? 'Najnowsze wiadomości' : `Najnowsze: ${state.category}`;

  $('#load-more').hidden = rest.length <= shown.length;
}

/* ---------- Widok artykułu ---------- */
function articleHtml(a, plain) {
  const info = (a.infobox || []).filter(r => r && r.label && r.value);
  const minutes = Utils.readingTime(a, plain);
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
          <span class="chip">${Utils.esc(a.category)}</span>
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
      <figure class="article-hero">
        <img src="${Utils.esc(getImage(a))}" alt="${Utils.esc(a.title)}" data-cat="${Utils.esc(a.category)}">
      </figure>
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
    return;
  }

  const notice = !isPublished(a)
    ? `<div class="notice">Ten artykuł jest zaplanowany – czytelnicy zobaczą go od ${Utils.formatDate(a.createdAt)}.</div>`
    : '';

  const related = publishedArticles().filter(x => x.id !== a.id && x.category === a.category).slice(0, 3);
  const relatedHtml = related.length
    ? `<section class="related"><h2 class="section-title">Zobacz także</h2>
         <div class="grid">${related.map(x => cardHtml(x, { noAdmin: true })).join('')}</div></section>`
    : '';

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
          <span class="muted">${Utils.esc(a.category)} · publikacja: ${Utils.formatDate(a.createdAt)}</span>
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
          <span class="muted">${Utils.esc(d.category || '')} · zapisano ${Utils.formatDate(d.savedAt)}${d.articleId ? ' · zmiany w opublikowanym artykule' : ''}${d.local ? ' · kopia z tej przeglądarki' : ''}</span>
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
  try { return localStorage.getItem(CONFIG.AUTHOR_KEY) || ''; } catch { return ''; }
}

function emptyData() {
  return {
    title: '', lead: '', category: CATEGORIES[0], author: defaultAuthor(),
    image: '', urgent: false, featured: false, infobox: [], content: '',
    scheduleOn: false, scheduleAt: ''
  };
}

function normalizeData(obj) {
  const base = emptyData();
  const o = obj || {};
  return {
    title: o.title ?? base.title,
    lead: o.lead ?? base.lead,
    category: o.category || base.category,
    author: o.author ?? base.author,
    image: o.image || '',
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
  return normalizeData({
    ...a,
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
    category: $('#f-category').value,
    author: $('#f-author').value,
    image: editor.image,
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
  return !d.title.trim() && !d.lead.trim() && !d.content && !d.image && d.infobox.length === 0;
}

function populateCategorySelect(extra) {
  const cats = [...CATEGORIES];
  const sel = $('#f-category');
  sel.innerHTML = cats.map(c => `<option value="${Utils.esc(c)}">${Utils.esc(c)}</option>`).join('');
  if (extra && !cats.includes(extra)) {
    sel.add(new Option(extra + ' (dawna kategoria)', extra));
  }
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
  if (editor.image) $('img', box).src = editor.image;
  // pole URL pokazuje tylko zwykły link (nie Base64)
  $('#f-image-url').value = editor.image && !editor.image.startsWith('data:') ? editor.image : '';
  if (!editor.image) $('#f-image-file').value = '';
}

function applyData(d) {
  editor.restoring = true;
  populateCategorySelect(d.category);
  $('#f-title').value = d.title;
  $('#f-lead').value = d.lead;
  $('#f-category').value = d.category;
  $('#f-author').value = d.author;
  $('#f-urgent').checked = d.urgent;
  $('#f-featured').checked = d.featured;
  $('#f-schedule-on').checked = d.scheduleOn;
  $('#f-schedule-at').value = d.scheduleAt;

  $('#infobox-rows').innerHTML = '';
  d.infobox.forEach(r => addInfoRow(r.label, r.value));
  setMainImage(d.image);

  if (d.content) {
    editor.quill.setContents(editor.quill.clipboard.convert(d.content), 'silent');
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

function updateStats() {
  if (!editor.quill) return;
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
      const img = document.createElement('img');
      img.setAttribute('src', value.src);
      img.setAttribute('alt', value.caption || '');
      const cap = document.createElement('figcaption');
      cap.textContent = value.caption || '';
      node.appendChild(img);
      if (value.caption) node.appendChild(cap);
      return node;
    }
    static value(node) {
      const img = node.querySelector('img');
      const cap = node.querySelector('figcaption');
      return { src: img ? img.getAttribute('src') : '', caption: cap ? cap.textContent : '' };
    }
  }
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
    formats: ['header', 'bold', 'italic', 'underline', 'strike', 'blockquote', 'list', 'indent', 'link', 'image', 'figure'],
    modules: {
      toolbar: {
        container: [
          [{ header: [2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          ['blockquote'],
          [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
          ['link', 'image'],
          ['clean']
        ],
        handlers: { image() { openImageModal(); } }
      },
      keyboard: {
        bindings: {
          markdownH2: { key: 32, collapsed: true, prefix: /^##$/, handler: markdownLine('header', 2) },
          markdownH3: { key: 32, collapsed: true, prefix: /^###$/, handler: markdownLine('header', 3) },
          markdownQuote: { key: 32, collapsed: true, prefix: /^>$/, handler: markdownLine('blockquote', true) },
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
    '.ql-blockquote': 'Cytat',
    '.ql-list[value="ordered"]': 'Lista numerowana',
    '.ql-list[value="bullet"]': 'Lista punktowana',
    '.ql-indent[value="-1"]': 'Zmniejsz wcięcie',
    '.ql-indent[value="+1"]': 'Zwiększ wcięcie',
    '.ql-link': 'Wstaw link (Ctrl+K)',
    '.ql-image': 'Wstaw zdjęcie z podpisem',
    '.ql-clean': 'Wyczyść formatowanie'
  };
  Object.entries(titles).forEach(([sel, title]) => {
    const b = toolbar.querySelector(sel);
    if (b) b.title = title;
  });

  editor.quill.on('text-change', () => {
    if (editor.restoring) return;
    updateStats();
    onFormChange();
  });

  // Kliknięcie zdjęcia w tekście: zmiana podpisu lub usunięcie
  editor.quill.root.addEventListener('click', e => {
    const fig = e.target.closest && e.target.closest('figure.article-figure');
    if (!fig) return;
    const blot = Quill.find(fig);
    if (!blot) return;
    const val = blot.constructor.value(blot.domNode);
    openImageModal({ index: editor.quill.getIndex(blot), src: val.src, caption: val.caption });
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
    category: d.category,
    author,
    image: d.image,
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
      toast(editor.existing ? 'Zmiany zapisane.' : 'Artykuł opublikowany.');
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
    category: d.category,
    author: d.author.trim() || '(autor)',
    image: d.image,
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
  if (editor.editingFigure !== null) {
    const index = editor.editingFigure;
    editor.quill.deleteText(index, 1, 'user');
    editor.quill.insertEmbed(index, 'figure', { src, caption }, 'user');
  } else {
    const index = editor.range ? editor.range.index : Math.max(0, editor.quill.getLength() - 1);
    editor.quill.insertEmbed(index, 'figure', { src, caption }, 'user');
    editor.quill.setSelection(index + 1, 0, 'silent');
  }
  closeModal('image-modal');
}

function deleteFigure() {
  if (editor.editingFigure === null) return;
  editor.quill.deleteText(editor.editingFigure, 1, 'user');
  closeModal('image-modal');
}

/* ---------- Routing ---------- */
function showView(name) {
  ['home', 'article', 'panel', 'editor'].forEach(v => { $('#view-' + v).hidden = v !== name; });
}

function refreshViews() {
  if (!state.ready) return;
  renderBreaking();
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

  if ((r.name === 'editor' || r.name === 'panel') && !Auth.isAdmin()) {
    location.hash = '#/';
    openModal('login-modal');
    return;
  }

  if (r.name === 'article') {
    showView('article');
    renderArticleView(r.id);
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
    renderHome();
  }
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
  if (currentRoute().name === 'home') renderHome();
  else location.hash = '#/';
}

/* ---------- Auth UI ---------- */
function applyAuthUI() {
  document.body.classList.toggle('is-admin', Auth.isAdmin());
  const rn = currentRoute().name;
  // Utrata uprawnień (np. wylogowanie) w widoku dla redakcji – wróć na stronę główną
  if (state.ready && (rn === 'editor' || rn === 'panel') && !Auth.isAdmin()) {
    location.hash = '#/';
    return;
  }
  refreshViews();
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

  // Logo – reset filtrów
  $('#logo').addEventListener('click', () => {
    state.category = ALL;
    state.query = '';
    state.visible = CONFIG.PAGE_SIZE;
    $('#search-input').value = '';
    updateCategoryNav();
    if (currentRoute().name === 'home') renderHome();
  });

  // Wyszukiwarka na żywo
  $('#search-input').addEventListener('input', Utils.debounce(e => {
    state.query = e.target.value;
    goHomeAndRender();
  }, 150));

  // Filtry kategorii
  $('#category-nav').addEventListener('click', e => {
    const btn = e.target.closest('.chip-btn');
    if (!btn) return;
    state.category = btn.dataset.category;
    updateCategoryNav();
    goHomeAndRender();
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
    const tile = e.target.closest('.card, .hero');
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
    if (['editor', 'panel'].includes(currentRoute().name)) location.hash = '#/';
    applyAuthUI();
    toast('Wylogowano.');
  });
  $('#btn-new').addEventListener('click', () => { location.hash = '#/edytor'; });
  $('#panel-new').addEventListener('click', () => { location.hash = '#/edytor'; });
  $('#btn-panel').addEventListener('click', () => { location.hash = '#/panel'; });

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
  form.addEventListener('input', () => { updateCounters(); onFormChange(); });
  form.addEventListener('change', onFormChange);

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
  populateCategorySelect();
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
