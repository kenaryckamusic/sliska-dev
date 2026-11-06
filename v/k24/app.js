/* =========================================================
   Kurier24 – portal informacyjny z CMS (prototyp)
   Struktura pliku:
     1. CONFIG            – ustawienia (hasło, przełącznik Firebase, klucze)
     2. Utils / Sanitizer – funkcje pomocnicze i czyszczenie HTML
     3. Dane startowe     – mock data
     4. DataService       – warstwa danych (localStorage / Firebase Firestore)
     5. Auth              – logowanie redaktora (sessionStorage)
     6. Aplikacja (UI)    – widoki, routing, edytor Quill
   ========================================================= */
'use strict';

/* =========================================================
   1. KONFIGURACJA
   ========================================================= */
const CONFIG = {
  // >>> PRZEŁĄCZNIK BAZY DANYCH <<<
  // false = localStorage (działa od razu, dane tylko w Twojej przeglądarce)
  // true  = Firebase Firestore (artykuły widoczne dla wszystkich odwiedzających)
  USE_FIREBASE: true,

  // Hasło redaktora – używane TYLKO w trybie localStorage (USE_FIREBASE: false).
  // UWAGA: to prototyp, hasło jest widoczne w kodzie strony.
  // W trybie Firebase logowanie odbywa się przez Firebase Authentication (e-mail + hasło).
  ADMIN_PASSWORD: 'admin123',

  // Opcjonalnie: UID konta redaktora (Firebase → Authentication → Users).
  // Jeśli go podasz, panel redaktora odblokuje się tylko dla tego konta.
  // Prawdziwą ochroną zapisu są i tak reguły Firestore (patrz instrukcja).
  ADMIN_UID: '',

  // Ile najnowszych artykułów pobierać z Firebase (oszczędza dzienny limit odczytów).
  MAX_ARTICLES: 40,

  SESSION_KEY: 'kurier24_admin_session',
  LOCAL_KEY: 'kurier24_articles_v1',

  // Firebase: wklej tu dane z konsoli Firebase (instrukcja na końcu odpowiedzi)
  FIREBASE_SDK_VERSION: '10.12.2',
  FIREBASE_COLLECTION: 'articles',
  FIREBASE_CONFIG: {
    apiKey: 'AIzaSyA-cJXdFeRETW1SaYpkrYZ4loUEWQkzmvw',
    authDomain: 'altplus-news.firebaseapp.com',
    projectId: 'altplus-news',
    storageBucket: 'altplus-news.firebasestorage.app',
    messagingSenderId: '192116116300',
    appId: '1:192116116300:web:68d14f926726cfbc6adde9'
  }
};

const CATEGORIES = ['Kraj', 'Świat', 'Sport', 'Technologia', 'Kultura'];
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

  uid() {
    return 'a_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  },

  _dateFmt: new Intl.DateTimeFormat('pl-PL', { dateStyle: 'long', timeStyle: 'short' }),
  formatDate(iso) {
    const d = new Date(iso);
    return isNaN(d) ? '' : this._dateFmt.format(d);
  },

  stripHtml(html) {
    const doc = new DOMParser().parseFromString(html || '', 'text/html');
    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
  },

  readingTime(article, plainText) {
    const text = `${article.lead || ''} ${plainText || ''}`.trim();
    const words = text ? text.split(/\s+/).length : 0;
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
    const hues = { 'Kraj': 8, 'Świat': 210, 'Sport': 140, 'Technologia': 265, 'Kultura': 330 };
    const hue = hues[category] ?? 200;
    const label = Utils.esc(category || 'Kurier24');
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

/** Czyści HTML artykułu (ochrona przed XSS – szczególnie ważne przy bazie w chmurze). */
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
   3. DANE STARTOWE (MOCK DATA)
   ========================================================= */
function seedArticles() {
  const now = Date.now();
  const ago = minutes => new Date(now - minutes * 60000).toISOString();

  return [
    {
      id: 'seed-1',
      title: 'Witamy w Kurierze24: prototyp portalu z redakcją działającą na żywo',
      lead: 'Zobacz, jak działa nowoczesny portal informacyjny z wbudowanym systemem CMS. Zaloguj się jako redaktor, aby dodawać, edytować i usuwać artykuły bezpośrednio w przeglądarce.',
      category: 'Kraj',
      author: 'Redakcja Kurier24',
      image: '',
      urgent: false,
      featured: true,
      infobox: [
        { label: 'Rodzaj', value: 'Artykuł demonstracyjny' },
        { label: 'Edytor', value: 'Quill.js (WYSIWYG)' },
        { label: 'Dane', value: 'localStorage lub Firebase' },
        { label: 'Źródło', value: 'Redakcja' }
      ],
      content:
        '<h2>Jak to działa?</h2>' +
        '<p>Cały portal to jedna aplikacja SPA: kliknięcie w kafel otwiera artykuł <strong>bez przeładowania strony</strong>, a adres w przeglądarce nadal można skopiować i wysłać dalej.</p>' +
        '<blockquote>Dobry portal informacyjny to taki, w którym pisanie artykułu jest równie proste jak jego czytanie.</blockquote>' +
        '<h3>Co potrafi redaktor?</h3>' +
        '<ul><li>tworzyć i edytować artykuły w edytorze WYSIWYG,</li><li>oznaczać materiały jako <em>pilne</em> lub <em>wyróżnione</em>,</li><li>dodawać ramkę faktów w stylu Wikipedii,</li><li>wstawiać zdjęcia z podpisem w środek tekstu.</li></ul>' +
        '<h3>Pierwsze kroki</h3>' +
        '<ol><li>Kliknij „Zaloguj (Redakcja)”.</li><li>Wybierz „+ Napisz artykuł”.</li><li>Uzupełnij formularz i kliknij „Opublikuj”.</li></ol>' +
        '<p>To treść demonstracyjna – możesz ją dowolnie edytować lub usunąć.</p>',
      createdAt: ago(20),
      updatedAt: ago(20)
    },
    {
      id: 'seed-2',
      title: 'PILNE: przykładowy komunikat – tak działa pasek najświeższych wiadomości',
      lead: 'Artykuł oznaczony flagą „Pilne” pojawia się w czerwonym pasku na samej górze serwisu. Gdy pilnych materiałów jest więcej, pasek rotuje między nimi automatycznie.',
      category: 'Świat',
      author: 'Redakcja Kurier24',
      image: '',
      urgent: true,
      featured: false,
      infobox: [],
      content:
        '<p>To przykładowy materiał demonstracyjny. Flagę <strong>„Pilne”</strong> ustawia się w formularzu artykułu, w panelu Ustawienia.</p>' +
        '<p>Po odznaczeniu flagi lub usunięciu artykułu pasek znika automatycznie.</p>',
      createdAt: ago(45),
      updatedAt: ago(45)
    },
    {
      id: 'seed-3',
      title: 'Przykładowy materiał sportowy: kafle z miniaturą, kategorią i datą',
      lead: 'Każdy kafel na stronie głównej zawiera zdjęcie, kategorię, tytuł, zajawkę oraz datę publikacji. Wszystko układa się w responsywną siatkę.',
      category: 'Sport',
      author: 'Anna Kowalska',
      image: '',
      urgent: false,
      featured: false,
      infobox: [
        { label: 'Dyscyplina', value: 'Demonstracyjna' },
        { label: 'Miejsce', value: 'Wszędzie tam, gdzie jest przeglądarka' }
      ],
      content:
        '<h2>Siatka responsywna</h2>' +
        '<p>Na dużym ekranie wiadomości układają się w trzy kolumny, na tablecie w dwie, a na telefonie w jedną.</p>' +
        '<p>Wyszukiwarka w nagłówku filtruje kafle na żywo – po tytule, zajawce i treści artykułu.</p>',
      createdAt: ago(180),
      updatedAt: ago(180)
    },
    {
      id: 'seed-4',
      title: 'Edytor w stylu Wikipedii: nagłówki, cytaty, listy i zdjęcia w tekście',
      lead: 'Edytor treści obsługuje nagłówki H2 i H3, pogrubienie, kursywę, podkreślenie, cytaty, listy, linki oraz zdjęcia z podpisem wstawiane w dowolnym miejscu tekstu.',
      category: 'Technologia',
      author: 'Piotr Nowak',
      image: '',
      urgent: false,
      featured: false,
      infobox: [
        { label: 'Technologia', value: 'Quill.js 1.3.7' },
        { label: 'Zapis', value: 'HTML po oczyszczeniu' },
        { label: 'Zdjęcia', value: 'URL lub plik (Base64)' }
      ],
      content:
        '<h2>Bogaty pasek narzędzi</h2>' +
        '<p>Zaznacz fragment tekstu i użyj przycisków, aby go <strong>pogrubić</strong>, pochylić (<em>kursywa</em>) lub <u>podkreślić</u>.</p>' +
        '<blockquote>Cytaty są wyróżnione graficznie, tak aby czytelnik od razu zauważył najważniejszą wypowiedź.</blockquote>' +
        '<h3>Ramka faktów</h3>' +
        '<p>Po prawej stronie widzisz infobox – to opcjonalna sekcja, którą autor uzupełnia w formularzu artykułu.</p>',
      createdAt: ago(60 * 26),
      updatedAt: ago(60 * 26)
    }
  ];
}

/* =========================================================
   4. DATASERVICE – warstwa danych
   Każdy provider udostępnia: init, getAll, save, remove, subscribe
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

  _read() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.LOCAL_KEY)) || [];
    } catch {
      return [];
    }
  },

  _write(list) {
    try {
      localStorage.setItem(CONFIG.LOCAL_KEY, JSON.stringify(list));
    } catch {
      throw new Error('Brak miejsca w pamięci przeglądarki (limit ok. 5 MB). Użyj mniejszych zdjęć lub linków URL.');
    }
  },

  async getAll() { return this._read(); },

  async save(article) {
    const list = this._read();
    const idx = list.findIndex(a => a.id === article.id);
    if (idx >= 0) list[idx] = article; else list.push(article);
    this._write(list);
    this._emit();
  },

  async remove(id) {
    this._write(this._read().filter(a => a.id !== id));
    this._emit();
  },

  // Zwraca aktualną listę i zapamiętuje funkcję wywoływaną przy każdej zmianie
  async watch(onChange) {
    this.listeners.push(onChange);
    return this._read();
  },

  _emit() {
    const list = this._read();
    this.listeners.forEach(cb => cb(list));
  }
};

const FirebaseProvider = {
  db: null,
  auth: null,

  col() { return this.db.collection(CONFIG.FIREBASE_COLLECTION); },

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

    // Sesja logowania trwa tylko tak długo, jak karta przeglądarki (jak sessionStorage)
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

    await this._seedIfEmpty();
  },

  // Artykuły startowe wstawia tylko zalogowany redaktor i tylko jeden raz
  async _seedIfEmpty() {
    if (!this.auth.currentUser) return;
    try {
      const metaRef = this.db.collection('meta').doc('init');
      const meta = await metaRef.get();
      if (!meta.exists) {
        const batch = this.db.batch();
        seedArticles().forEach(a => batch.set(this.col().doc(a.id), a));
        batch.set(metaRef, { seeded: true, at: new Date().toISOString() });
        await batch.commit();
      }
    } catch (err) {
      console.warn('Pominięto dodanie artykułów startowych:', err.code || err);
    }
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

  async save(article) {
    if (!this.auth.currentUser) throw new Error('Zaloguj się, aby zapisywać artykuły.');
    // Dokument Firestore może mieć maks. ok. 1 MiB
    if (JSON.stringify(article).length > 900000) {
      throw new Error('Artykuł jest zbyt duży dla bazy (limit ok. 1 MB). Zmniejsz zdjęcia lub użyj linków URL.');
    }
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
  }
};

const DataService = {
  provider: null,
  mode: 'local',
  fallbackReason: '',

  async init() {
    if (CONFIG.USE_FIREBASE) {
      try {
        await FirebaseProvider.init();
        this.provider = FirebaseProvider;
        this.mode = 'firebase';
        return;
      } catch (err) {
        console.warn('Firebase niedostępny, używam localStorage:', err);
        this.fallbackReason = err.message;
      }
    }
    await LocalProvider.init();
    this.provider = LocalProvider;
    this.mode = 'local';
  },

  // Zwraca (obietnicą) pierwszą listę artykułów; zmiany później trafiają do onChange
  watch(onChange) { return this.provider.watch(onChange); },
  save(article) { return this.provider.save(article); },
  remove(id) { return this.provider.remove(id); }
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
  useFirebase: false,

  isAdmin() { return true;
    if (this.useFirebase) {
      const user = FirebaseProvider.auth && FirebaseProvider.auth.currentUser;
      if (!user) return false;
      return !CONFIG.ADMIN_UID || user.uid === CONFIG.ADMIN_UID;
    }
    try { return true; } catch { return false; }
  },

  async login(email, password) {
    if (this.useFirebase) {
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
    if (this.useFirebase) {
      try { await FirebaseProvider.auth.signOut(); } catch (e) { console.warn(e); }
      return;
    }
    try { sessionStorage.removeItem(CONFIG.SESSION_KEY); } catch { /* ignoruj */ }
  },

  // Wywołuje funkcję przy każdej zmianie stanu logowania (tylko tryb Firebase)
  onChange(cb) {
    if (this.useFirebase) FirebaseProvider.auth.onAuthStateChanged(cb);
  },

  explain(err) {
    const code = (err && err.code) || '';
    switch (code) {
      case 'app/wrong-password':
        return 'Nieprawidłowe hasło.';
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
  category: ALL,
  query: '',
  breakingTimer: null
};

const editor = {
  quill: null,
  id: null,
  existing: null,
  image: '',        // zdjęcie główne (URL lub Base64)
  modalImage: '',   // zdjęcie wstawiane do treści
  range: null
};

/* ---------- Pomocnicze UI ---------- */
function toast(message, type = 'info') {
  const el = $('#toast');
  el.textContent = message;
  el.className = 'toast' + (type === 'error' ? ' error' : '');
  el.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { el.hidden = true; }, type === 'error' ? 6000 : 3000);
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

function sortedArticles() {
  return [...state.articles].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function setArticles(list) {
  state.articles = Array.isArray(list) ? list : [];
  state.plain = new Map(state.articles.map(a => [a.id, Utils.stripHtml(a.content)]));
}

function getImage(a) { return a.image || Utils.placeholder(a.category); }

function currentRoute() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'artykul' && parts[1]) return { name: 'article', id: decodeURIComponent(parts[1]) };
  if (parts[0] === 'edytor') return { name: 'editor', id: parts[1] ? decodeURIComponent(parts[1]) : null };
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
  const urgent = sortedArticles().filter(a => a.urgent);
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
  return sortedArticles().filter(a => {
    if (state.category !== ALL && a.category !== state.category) return false;
    if (!q) return true;
    const haystack = `${a.title} ${a.lead} ${state.plain.get(a.id) || ''}`.toLowerCase();
    return haystack.includes(q);
  });
}

function cardHtml(a) {
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
        ${adminButtons(a.id)}
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
  const list = filteredArticles();
  const hero = list.find(a => a.featured);
  const rest = list.filter(a => a !== hero);

  const status = $('#home-status');
  if (!list.length) {
    const q = state.query.trim();
    status.innerHTML = `<div class="empty-state">${q
      ? `Brak wyników dla „${Utils.esc(q)}”.`
      : 'W tej kategorii nie ma jeszcze żadnych artykułów.'}</div>`;
  } else if (state.query.trim()) {
    status.textContent = `Wyniki wyszukiwania dla „${state.query.trim()}”: ${list.length}`;
  } else {
    status.textContent = '';
  }

  $('#hero-slot').innerHTML = hero ? heroHtml(hero) : '';
  $('#news-grid').innerHTML = rest.map(cardHtml).join('');

  const title = $('#grid-title');
  title.hidden = rest.length === 0;
  title.textContent = state.category === ALL ? 'Najnowsze wiadomości' : `Najnowsze: ${state.category}`;
}

/* ---------- Widok artykułu ---------- */
function renderArticleView(id) {
  const el = $('#view-article');
  const a = state.articles.find(x => x.id === id);

  if (!a) {
    el.innerHTML = `<div class="article-top"><a class="btn" href="#/">← Powrót do strony głównej</a></div>
      <div class="empty-state">Nie znaleziono takiego artykułu. Mógł zostać usunięty.</div>`;
    document.title = 'Kurier24 – portal informacyjny';
    return;
  }

  const info = (a.infobox || []).filter(r => r && r.label && r.value);
  const minutes = Utils.readingTime(a, state.plain.get(a.id));
  const edited = a.updatedAt && Math.abs(new Date(a.updatedAt) - new Date(a.createdAt)) > 60000;

  const infobox = info.length
    ? `<aside class="infobox" aria-label="Szybkie fakty">
         <h2 class="infobox-title">Szybkie fakty</h2>
         <table><tbody>${info.map(r =>
           `<tr><th scope="row">${Utils.esc(r.label)}</th><td>${Utils.esc(r.value)}</td></tr>`).join('')}
         </tbody></table>
       </aside>`
    : '';

  el.innerHTML = `
    <div class="article-top">
      <a class="btn" href="#/">← Powrót do strony głównej</a>
      ${adminButtons(a.id)}
    </div>
    <article class="article">
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
          <div class="article-body">${Sanitizer.clean(a.content)}</div>
        </div>
        ${infobox}
      </div>
    </article>`;
  document.title = `${a.title} – Kurier24`;
}

/* ---------- Edytor ---------- */
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
    modules: {
      toolbar: {
        container: [
          [{ header: [2, 3, false] }],
          ['bold', 'italic', 'underline'],
          ['blockquote'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'image'],
          ['clean']
        ],
        handlers: { image: openImageModal }
      }
    }
  });
  return true;
}

function populateCategorySelect() {
  $('#f-category').innerHTML = CATEGORIES.map(c => `<option value="${Utils.esc(c)}">${Utils.esc(c)}</option>`).join('');
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

function openEditor(id) {
  if (!Auth.isAdmin()) {
    location.hash = '#/';
    openModal('login-modal');
    return;
  }
  if (!initQuill()) { location.hash = '#/'; return; }

  const article = id ? state.articles.find(a => a.id === id) : null;
  if (id && !article) {
    toast('Nie znaleziono artykułu do edycji.', 'error');
    location.hash = '#/';
    return;
  }

  editor.id = article ? article.id : null;
  editor.existing = article;

  $('#editor-heading').textContent = article ? 'Edycja artykułu' : 'Nowy artykuł';
  $('#editor-save').textContent = article ? 'Zapisz zmiany' : 'Opublikuj';
  $('#f-title').value = article ? article.title : '';
  $('#f-lead').value = article ? article.lead : '';
  $('#f-category').value = article ? article.category : CATEGORIES[0];
  $('#f-author').value = article ? article.author : '';
  $('#f-urgent').checked = !!(article && article.urgent);
  $('#f-featured').checked = !!(article && article.featured);

  $('#infobox-rows').innerHTML = '';
  ((article && article.infobox) || []).forEach(r => addInfoRow(r.label, r.value));

  setMainImage(article ? article.image : '');

  if (article && article.content) {
    editor.quill.setContents(editor.quill.clipboard.convert(article.content), 'silent');
  } else {
    editor.quill.setText('', 'silent');
  }
}

async function saveArticle(e) {
  e.preventDefault();
  if (!Auth.isAdmin()) { toast('Sesja wygasła – zaloguj się ponownie.', 'error'); return; }

  const title = $('#f-title').value.trim();
  const lead = $('#f-lead').value.trim();
  const author = $('#f-author').value.trim();
  const category = $('#f-category').value;

  if (!title) { toast('Podaj tytuł artykułu.', 'error'); $('#f-title').focus(); return; }
  if (!lead) { toast('Uzupełnij lead (zajawkę).', 'error'); $('#f-lead').focus(); return; }
  if (!author) { toast('Podaj autora.', 'error'); $('#f-author').focus(); return; }
  if (editor.quill.getLength() <= 1) { toast('Treść artykułu jest pusta.', 'error'); editor.quill.focus(); return; }

  const infobox = $$('.info-row').map(row => ({
    label: $('.info-label', row).value.trim(),
    value: $('.info-value', row).value.trim()
  })).filter(r => r.label && r.value);

  const nowIso = new Date().toISOString();
  const article = {
    id: editor.id || Utils.uid(),
    title,
    lead,
    category,
    author,
    image: editor.image,
    urgent: $('#f-urgent').checked,
    featured: $('#f-featured').checked,
    infobox,
    content: Sanitizer.clean(editor.quill.root.innerHTML),
    createdAt: editor.existing ? editor.existing.createdAt : nowIso,
    updatedAt: nowIso
  };

  const btn = $('#editor-save');
  btn.disabled = true;
  try {
    await DataService.save(article);
    const idx = state.articles.findIndex(a => a.id === article.id);
    if (idx >= 0) state.articles[idx] = article; else state.articles.push(article);
    setArticles(state.articles);
    toast(editor.existing ? 'Zmiany zapisane.' : 'Artykuł opublikowany.');
    location.hash = '#/artykul/' + encodeURIComponent(article.id);
  } catch (err) {
    console.error(err);
    toast(err.message || 'Nie udało się zapisać artykułu.', 'error');
  } finally {
    btn.disabled = false;
  }
}

async function deleteArticle(id) {
  const a = state.articles.find(x => x.id === id);
  if (!a) return;
  if (!confirm(`Czy na pewno usunąć artykuł:\n„${a.title}”?`)) return;
  try {
    await DataService.remove(id);
    setArticles(state.articles.filter(x => x.id !== id));
    toast('Artykuł został usunięty.');
    if (currentRoute().name === 'article') location.hash = '#/';
    else refreshViews();
  } catch (err) {
    console.error(err);
    toast(err.message || 'Nie udało się usunąć artykułu.', 'error');
  }
}

/* ---------- Wstawianie zdjęcia do treści ---------- */
function openImageModal() {
  editor.range = editor.quill.getSelection(true);
  editor.modalImage = '';
  $('#im-url').value = '';
  $('#im-file').value = '';
  $('#im-caption').value = '';
  $('#im-preview').hidden = true;
  $('#im-error').hidden = true;
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
  const index = editor.range ? editor.range.index : Math.max(0, editor.quill.getLength() - 1);
  editor.quill.insertEmbed(index, 'figure', { src, caption }, 'user');
  editor.quill.setSelection(index + 1, 0, 'silent');
  closeModal('image-modal');
}

/* ---------- Routing ---------- */
function showView(name) {
  ['home', 'article', 'editor'].forEach(v => { $('#view-' + v).hidden = v !== name; });
}

function refreshViews() {
  if (!state.ready) return;
  renderBreaking();
  const route = currentRoute();
  if (route.name === 'home') renderHome();
  else if (route.name === 'article') renderArticleView(route.id);
}

function route() {
  const r = currentRoute();
  window.scrollTo(0, 0);
  if (r.name !== 'article') document.title = 'Kurier24 – portal informacyjny';

  if (r.name === 'article') {
    showView('article');
    renderArticleView(r.id);
  } else if (r.name === 'editor') {
    if (!Auth.isAdmin()) {
      location.hash = '#/';
      openModal('login-modal');
      return;
    }
    showView('editor');
    openEditor(r.id);
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
  if (currentRoute().name === 'home') renderHome();
  else location.hash = '#/';
}

/* ---------- Auth UI ---------- */
function applyAuthUI() {
  document.body.classList.toggle('is-admin', Auth.isAdmin());
  // Utrata uprawnień w trakcie edycji (np. wylogowanie) – wyjdź z edytora
  if (state.ready && currentRoute().name === 'editor' && !Auth.isAdmin()) {
    location.hash = '#/';
    return;
  }
  refreshViews();
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

  // Akcje admina (Edytuj / Usuń) + kliknięcie w cały kafel
  document.addEventListener('click', e => {
    const actionBtn = e.target.closest('[data-action]');
    if (actionBtn) {
      e.preventDefault();
      e.stopPropagation();
      const id = actionBtn.dataset.id;
      if (!Auth.isAdmin()) return;
      if (actionBtn.dataset.action === 'edit') location.hash = '#/edytor/' + encodeURIComponent(id);
      if (actionBtn.dataset.action === 'delete') deleteArticle(id);
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
    if (currentRoute().name === 'editor') location.hash = '#/';
    applyAuthUI();
    toast('Wylogowano.');
  });
  $('#btn-new').addEventListener('click', () => { location.hash = '#/edytor'; });

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
  });

  // Formularz edytora
  $('#editor-form').addEventListener('submit', saveArticle);
  $('#editor-cancel').addEventListener('click', () => {
    if (editor.id) location.hash = '#/artykul/' + encodeURIComponent(editor.id);
    else location.hash = '#/';
  });
  $('#infobox-add').addEventListener('click', () => addInfoRow());
  $('#infobox-rows').addEventListener('click', e => {
    const rm = e.target.closest('.info-remove');
    if (rm) rm.closest('.info-row').remove();
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
    } catch (err) {
      toast(err.message, 'error');
      e.target.value = '';
    }
  });
  $('#f-image-remove').addEventListener('click', () => setMainImage(''));

  // Zdjęcie w treści (modal)
  $('#image-form').addEventListener('submit', insertImageIntoEditor);
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

  window.addEventListener('hashchange', route);
}

/* ---------- Start ---------- */
async function main() {
  populateCategorySelect();
  buildCategoryNav();
  bindEvents();
  document.body.classList.toggle('is-admin', Auth.isAdmin());

  await DataService.init();
  Auth.useFirebase = DataService.mode === 'firebase';
  $('#login-email-field').hidden = !Auth.useFirebase;
  document.body.classList.toggle('is-admin', Auth.isAdmin());

  try {
    // Jeden nasłuch: pierwsza lista wraca tutaj, kolejne zmiany trafiają do funkcji poniżej
    setArticles(await DataService.watch(list => {
      setArticles(list);
      refreshViews();
    }));
  } catch (err) {
    console.error(err);
    toast('Nie udało się pobrać artykułów z bazy danych.', 'error');
  }
  state.ready = true;
  Auth.onChange(() => applyAuthUI());

  const modeEl = $('#data-mode');
  if (DataService.mode === 'firebase') {
    modeEl.textContent = 'Baza danych: Firebase Firestore (chmura)';
  } else {
    modeEl.textContent = 'Baza danych: localStorage (tylko ta przeglądarka)';
    if (CONFIG.USE_FIREBASE && DataService.fallbackReason) {
      toast('Firebase nie działa: ' + DataService.fallbackReason + ' Używam localStorage.', 'error');
    }
  }

  renderBreaking();
  route();
}

document.addEventListener('DOMContentLoaded', main);
