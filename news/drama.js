/* Śliska News – Drama Simulator (#/gry/drama). Rozbudowana gra fabularna:
   postać (ksywka + typ artysty), 6 afer po 7 dni z rozgałęzieniami, losowe wydarzenia, zatrudnianie ekipy (prawnik, PR, terapeuta),
   4 paski (Hype, Szacunek, Kasa, Nerwy), obserwujący, komentarze internautów, 20 zakończeń, 12 osiągnięć, zapis gry w trakcie.
   Wywołanie z gry.js: DramaSim.mount(el, H) – H to pomocnicze funkcje gier (K, shell, submit, xp, played, share, load, save, esc, toast). */
(function () {
  'use strict';
  var RUN_KEY = 'sn-drama-run';
  var STATS = [['h', 'Hype', 'fire'], ['s', 'Szacunek', 'star'], ['k', 'Kasa', 'cash'], ['n', 'Nerwy', 'bolt']];
  var IC = {
    fire: '<path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.3 1.2-3.7 2.3-4.7.3 1.6 1 2.6 2 3.1C11 8.6 11.3 5.6 12 3z"/>',
    star: '<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/>',
    cash: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 9.5v.01M17.5 14.5v.01"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    play: '<path d="M8 5v14l11-7z"/>'
  };
  var ic = function (n, s) { return '<svg viewBox="0 0 24 24" width="' + (s || 16) + '" height="' + (s || 16) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[n] + '</svg>'; };

  /* ---------- ikonki aform i zakończeń: Knaga w stroju + odznaka (emblemat) na gradiencie ---------- */
  var EM = {
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3M9 21h6"/>',
    camera: '<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    bus: '<rect x="4" y="4" width="16" height="13" rx="3"/><path d="M4 11h16M8 20v-3M16 20v-3"/>',
    swords: '<path d="M4 20 20 4M15 4h5v5"/><path d="M20 20 4 4M9 4H4v5"/>',
    live: '<circle cx="12" cy="12" r="2.2"/><path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9M4.5 4.5a10.6 10.6 0 0 0 0 15M19.5 4.5a10.6 10.6 0 0 1 0 15"/>',
    star: '<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/>',
    trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M12 14v4M8 21h8M9 18h6"/>',
    crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
    coin: '<circle cx="12" cy="12" r="8.5"/><path d="M14.5 9.2c-.6-.9-1.5-1.2-2.5-1.2-1.4 0-2.5.8-2.5 1.8 0 2.4 5 1.2 5 3.6 0 1-1.1 1.8-2.5 1.8-1.1 0-2-.4-2.6-1.3M12 6.5V8M12 16v1.5"/>',
    lotus: '<path d="M12 4c2.5 3 3 6 0 9-3-3-2.5-6 0-9zM4 10c4 0 7 2 8 6-4 0-7-2-8-6zM20 10c-4 0-7 2-8 6 4 0 7-2 8-6zM8 20h8"/>',
    medal: '<circle cx="12" cy="15" r="5"/><path d="M9 3l3 6 3-6M12 12.5v5"/>',
    laugh: '<circle cx="12" cy="12" r="9"/><path d="M8 10h.01M16 10h.01M7.5 14c1 3 8 3 9 0z"/>',
    zzz: '<path d="M5 6h6l-6 7h6M13 12h5l-5 6h5"/>',
    down: '<path d="M17 14V4h3v10zM17 14l-3.5 6.5c-1.3 0-2.3-1.2-2-2.4L12 15H6.5a2 2 0 0 1-2-2.4l1.2-6A2 2 0 0 1 7.7 5H17"/>',
    meh: '<circle cx="12" cy="12" r="9"/><path d="M8 10h.01M16 10h.01M8.5 15.5h7"/>',
    ban: '<circle cx="12" cy="12" r="9"/><path d="M5.7 5.7l12.6 12.6"/>',
    coinoff: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v10M9.5 9.5h4a1.8 1.8 0 0 1 0 3.5h-3a1.8 1.8 0 0 0 0 3.5h4M4 4l16 16"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
    ring: '<circle cx="12" cy="15" r="5.5"/><path d="M9 6l3-3 3 3-3 3z"/>',
    gavel: '<path d="M13 4l5 5-3 3-5-5zM10 8l-6 6 3 3 6-6M4 21h10"/>',
    palm: '<path d="M12 21V11M12 11c-3-4-7-3-8-1 3-1 5 0 8 1zM12 11c3-4 7-3 8-1-3-1-5 0-8 1zM12 11c0-4 2-6 5-6-2 1-3 3-5 6zM12 11c0-4-2-6-5-6 2 1 3 3 5 6zM7 21h10"/>',
    glove: '<path d="M7 11V7a3 3 0 0 1 6 0v1h3a3 3 0 0 1 3 3v3a6 6 0 0 1-6 6h-1a5 5 0 0 1-5-5zM8 20h8"/>',
    tv: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M8 21h8M9 3l3 3 3-3"/>',
    diamond: '<path d="M6 4h12l3 5-9 11L3 9zM3 9h18M9 4l-1.5 5L12 20l4.5-11L15 4"/>'
  };
  // [strój Knagi, kolor 1, kolor 2, odznaka]
  var TILE = {
    wyciek: ['wsciekla', '#ff9a62', '#c8102e', 'mic'], romans: ['uwodziciel', '#e0559f', '#4a0d3b', 'camera'], gala: ['gwiazdor', '#ffd34d', '#7c3aed', 'copy'],
    trasa: ['sliska', '#5b8cff', '#1b1e5a', 'bus'], beef: ['diabelek', '#b3243a', '#2a0a14', 'swords'], live: ['kapiel', '#6fd6ff', '#0e7fb3', 'live'],
    ikona: ['ikona', '#ff8aa0', '#b4002a', 'star'], legenda: ['super', '#7aa2ff', '#4b1d9c', 'trophy'], krol: ['diabelek', '#ffcf4a', '#7a1d6b', 'crown'],
    biznes: ['kowboj', '#8be08b', '#0f6b3d', 'coin'], zen: ['sauna', '#ffd9a8', '#c9783a', 'lotus'], weteran: ['zakochana', '#ffc4d6', '#c13c6a', 'medal'],
    mem: ['kapiel', '#ffe27a', '#f08a1c', 'laugh'], cisza: ['szlafrok', '#c9c3f5', '#5a4fa8', 'zzz'], wtopa: ['ratownik', '#ff9d8a', '#8c1d1d', 'down'],
    przecietniak: ['ziomek', '#e2e5ee', '#8b93a8', 'meh'], cancel: ['wsciekla', '#6b6f7a', '#1c1e26', 'ban'], bankrut: ['mikolaj', '#9aa3b2', '#3a4150', 'coinoff'],
    zalamanie: ['niesmiala', '#a9b4ff', '#2a2f78', 'bolt'], duet: ['imprezowa', '#ffd36b', '#e0407a', 'heart'], slub: ['uwodziciel', '#ffe0ea', '#d4467a', 'ring'],
    sad: ['detektyw', '#cdbb9a', '#5a4528', 'gavel'], ucieczka: ['surfer', '#7ee0d0', '#0b7f9c', 'palm'], oktagon: ['kibic', '#ff8a5c', '#7a1414', 'glove'],
    reality: ['sliska', '#ff9ac2', '#5a1a8c', 'tv'], milioner: ['gwiazdor', '#ffe27a', '#1f7a4a', 'diamond']
  };
  var ico = function (id, n) { return '<svg viewBox="0 0 24 24" width="' + (n || 20) + '" height="' + (n || 20) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + EM[id] + '</svg>'; };

  /* ---------- typy artystów ---------- */
  var ROLES = [
    { id: 'raper', name: 'Raper', k: 'gwiazdor', st: { h: 50, s: 45, k: 40, n: 30 }, fol: 120000, d: 'Szacunek ulicy, mało kasy, dużo wersów.' },
    { id: 'pop', name: 'Gwiazda popu', k: 'sliska', st: { h: 60, s: 40, k: 55, n: 40 }, fol: 320000, d: 'Hity w radiu, paparazzi pod domem.' },
    { id: 'influ', name: 'Influencer', k: 'uwodziciel', st: { h: 65, s: 30, k: 50, n: 35 }, fol: 480000, d: 'Zasięgi ogromne, szacunek… do zrobienia.' },
    { id: 'disco', name: 'Gwiazdor disco polo', k: 'kowboj', st: { h: 45, s: 50, k: 60, n: 25 }, fol: 90000, d: 'Wesela, remizy i niezłe pieniądze.' }
  ];

  /* ---------- afery: 7 dni, warianty dnia zależne od wcześniejszych wyborów (when), opcje z wymaganiem (need) ----------
     opcja: [tekst, efekty {h,s,k,n}, reakcja, dodatki {set, next:'END:id', need:'prawnik'|'pr'}] */
  var SCEN = [
    { id: 'wyciek', name: 'Wyciek z koncertu', k: 'wsciekla', sub: 'Nagranie, na którym mówisz, że feat był „za kasę”, krąży po sieci.', b: [
      { k: 'wsciekla', app: 'Instagram', t: 'Budzisz się, a na telefonie 147 powiadomień. Ktoś wrzucił nagranie z koncertu: mówisz ze sceny, że ostatni feat z Wikosem „był za kasę i nawet go nie słuchałeś”. Internet płonie.', c: [
        ['Odpisuję od razu na story. Ostro.', { h: 20, s: -10, n: 10 }, 'Story ma 40 tys. wyświetleń w 10 minut. Wikos już coś nagrywa.', { set: 'ostro' }],
        ['Milczę i czekam, aż przejdzie.', { h: -10, s: 5, n: 15 }, 'Cisza. Internet nie znosi ciszy – zaczyna zgadywać, co ukrywasz.'],
        ['Dzwonię do menedżera.', { k: 5, n: -5 }, 'Menedżer: „Spokojnie, mam plan”. To nigdy nie wróży dobrze.']] },
      [{ when: 'ostro', k: 'diabelek', app: 'YouTube', t: 'Wikos wrzuca diss „Za kasę to ty oddychasz”. Milion wyświetleń w dobę, a pod Twoimi postami tylko jedno pytanie: „odpowiesz?”.', c: [
        ['Nagrywam odpowiedź jeszcze w nocy.', { h: 25, s: 5, k: -5, n: 10 }, 'Bit kradziony z TikToka, ale wersy palą. Ludzie dzielą się na dwa obozy.', { set: 'diss' }],
        ['Zapraszam go na live – pogadajmy jak ludzie.', { h: 15, s: 10, n: 5 }, 'Live ogląda 30 tysięcy osób. Po godzinie śmiejecie się razem.', { set: 'zgoda' }],
        ['Blokuję go wszędzie.', { h: -5, s: -15, n: -5 }, '„Zablokował, bo nie ma argumentów” – screeny blokady mają więcej lajków niż Twój singiel.']] },
       { k: 'zakochana', app: 'Wiadomości', t: 'Wikos pisze na priv: „Serio, stary? Myślałem, że jesteśmy ziomkami”. Wiadomość ma znaczek „przeczytano” od godziny.', c: [
        ['Odpisuję szczerze i przepraszam.', { s: 15, h: -5, n: -5 }, 'Odpisał po minucie: „Dobra, browar i gadamy”.', { set: 'zgoda' }],
        ['Screenuję rozmowę i wrzucam na story.', { h: 20, s: -20, n: 5 }, 'Kto screenuje priv, ten traci ziomków. I szacunek.', { set: 'diss' }],
        ['Zostawiam na „przeczytane”.', { s: -5, n: 10 }, 'Najbardziej toksyczne dwa słowa w internecie: „przeczytano 14:02”.']] }],
      { k: 'gwiazdor', app: 'Mail', t: 'Śliska News pisze o aferze, pod artykułem 2 tysiące komentarzy. Marka napojów energetycznych proponuje współpracę „na fali dramy”.', c: [
        ['Biorę kasę i reklamuję na story.', { k: 30, s: -15 }, 'Puszka w dłoni, uśmiech, kod rabatowy „ZAKASE”. Komentarze piszą się same.'],
        ['Odmawiam publicznie.', { s: 15, k: -5, h: 5 }, '„Nie sprzedam dramy” – cytat dnia. Szacun rośnie, konto w banku nie.'],
        ['Negocjuję podwójną stawkę.', { k: 20, h: 5, s: -5, n: 5 }, 'Menedżer płacze ze szczęścia. Ty trochę mniej, czytając komentarze.'],
        ['PR-owiec: kampania „Za kasę, ale szczerze”.', { k: 20, s: 5, h: 10 }, 'Autoironiczna reklama robi furorę. Marka zadowolona, fani też.', { need: 'pr' }]] },
      { k: 'kapiel', app: 'TikTok', t: 'Fani robią z Twojej miny z nagrania mema. Jest wszędzie: na TikToku, w grupach, nawet na tablicy w szkole Twojej kuzynki.', c: [
        ['Ustawiam mema jako zdjęcie profilowe.', { h: 15, s: 10, n: -5 }, 'Dystans do siebie? Internet to kocha. „Szacun, że się nie obraził”.'],
        ['Proszę o usuwanie mema.', { h: -5, s: -10, n: 10 }, 'Efekt Streisand w pełnej krasie. Mem ma teraz trzy nowe wersje.'],
        ['Drukuję merch z memem.', { k: 20, h: 10, s: -5 }, 'Koszulki wyprzedane w dwie godziny. Hejterzy też kupili.']] },
      { k: 'redaktor', app: 'Mail', t: 'Wytwórnia Wikosa wysyła pismo: naruszenie dóbr osobistych, żądają 50 tysięcy i przeprosin w trzech serwisach.', c: [
        ['Płacę, żeby mieć spokój.', { k: -25, n: -10 }, 'Przelew wysłany. Spokój kupiony. Konto smutne.'],
        ['Idę w zaparte.', { h: 10, n: 20, k: -10 }, 'Pozew trafia do sądu. Rozprawa za pół roku – a do tego czasu nagłówki.'],
        ['Prawnik odpisuje ripostą.', { s: 10, n: -10, k: -5 }, 'Pismo zwrotne tak zgrabne, że wytwórnia wycofuje roszczenia.', { need: 'prawnik' }]] },
      [{ when: 'diss', k: 'diabelek', app: 'Spotify', t: 'Twój diss ma 3 miliony odsłuchów. Fani domagają się części drugiej, a Wikos zapowiada odpowiedź „za 3 dni o 20:00”.', c: [
        ['Wypuszczam część drugą przed nim.', { h: 25, s: -5, n: 15 }, 'Wyprzedziłeś go o godzinę. Wojna trwa, wyświetlenia też.'],
        ['Ogłaszam koniec wojny.', { s: 15, h: -10, n: -10 }, '„Dorośli ludzie, dorośli ludzie” – piszą fani. Część zawiedziona.'],
        ['Proponuję wspólną bitwę freestyle na żywo.', { h: 20, s: 10, n: 10 }, 'Bitwę ogląda 200 tysięcy osób. Remis, ale klasa.']] },
       { when: 'zgoda', k: 'imprezowa', app: 'Wiadomości', t: 'Wikos dzwoni: „Słuchaj, zróbmy numer na zgodę. Tytuł: »Za darmo«”.', c: [
        ['Nagrywamy! Jutro w studiu.', { h: 15, s: 20 }, 'Numer powstaje w jedną noc.', { next: 'END:duet' }],
        ['Odmawiam, wolę solo.', { s: -5, h: 5 }, 'Wikos: „Spoko, Twoja strata”. I chyba miał rację.'],
        ['Proszę o czas do namysłu.', { n: -5 }, 'Czas leci. Wikos nagrywa z kimś innym.']] },
       { k: 'gwiazdor', app: 'Gala', t: 'Gala w Warszawie. Prowadzący żartuje ze sceny: „A teraz nagroda, za którą {nick} pewnie też kazał sobie zapłacić”.', c: [
        ['Śmieję się najgłośniej na sali.', { s: 10, h: 5 }, 'Kamera łapie Twój śmiech. Wygrałeś ten moment.'],
        ['Demonstracyjnie wychodzę.', { h: 10, s: -10, n: 10 }, 'Drzwi trzasnęły. Klip „wyjście {nick}a” ma milion wyświetleń.'],
        ['Wchodzę na scenę i zabieram mikrofon.', { h: 25, s: -5, n: 15 }, 'Improwizowany freestyle o prowadzącym. Sala szaleje.']] }],
      { k: 'redaktor', app: 'Śliska News', t: 'Wieczór. Wszyscy czekają na Twój ostatni ruch. Redakcja Śliskiej prosi o komentarz. Co ogłaszasz?', c: [
        ['Trasę „Za Kasę Tour”.', { h: 20, k: 15 }, 'Bilety schodzą jak ciepłe bułki. Ironia zrobiła robotę.'],
        ['Szczere oświadczenie i przeprosiny.', { s: 20, h: -5, n: -10 }, 'Długi post, bez prawników. Nawet Wikos daje lajka.'],
        ['Nic. Znikam na miesiąc.', { h: -20, s: 5, n: -25 }, 'Konto milczy. Ludzie zaczynają tęsknić. Albo zapominać.']] }
    ] },
    { id: 'romans', name: 'Romans na backstage’u', k: 'uwodziciel', sub: 'Paparazzi przyłapał Cię z byłą Twojego producenta.', b: [
      { k: 'uwodziciel', app: 'Plotkarski portal', t: 'Paparazzi przyłapał Cię, jak o 4:00 wychodzisz z backstage’u z Natalią – byłą Twojego producenta Kuby. Zdjęcie jest nieostre, ale wszyscy wiedzą, że to Ty.', c: [
        ['„To tylko koleżanka.”', { s: -10, h: 5, n: 5 }, 'Koleżanka, o 4:00, w Twojej bluzie. Internet nie wierzy.', { set: 'klamstwo' }],
        ['Potwierdzam. Zakochałem się.', { h: 20, s: 5 }, 'Połowa internetu wysyła serduszka, połowa popcorn.', { set: 'para' }],
        ['Bez komentarza.', { h: 5, n: 5 }, '„Bez komentarza” to też komentarz. Plotki się mnożą.']] },
      { k: 'wsciekla', app: 'Instagram', t: 'Kuba wrzuca story: „Bitów już ode mnie nie dostaniesz. Ani niczego innego”. Masz za tydzień premierę singla.', c: [
        ['Kupuję bity z internetu.', { k: -10, s: -5 }, 'Bit brzmi jak dzwonek z 2009. Ktoś to rozpoznał w 3 minuty.'],
        ['Przepraszam Kubę prywatnie.', { s: 10, h: -5, n: -5 }, 'Odpisał „ok”. Tylko „ok”. Ale bity wysłał.'],
        ['Wrzucam nasze wspólne zdjęcie z Natalią.', { h: 25, s: -10, n: 10 }, 'Wojna na story. Śliska robi z tego serię artykułów.', { set: 'wojna' }]] },
      { k: 'sauna', app: 'Podcast', t: 'Zaproszenie do podcastu „Szczerze i mokro”. Prowadzący obiecuje, że „pytania będą lekkie”. Nigdy nie są.', c: [
        ['Idę i mówię wszystko.', { h: 20, s: 5, n: 5 }, 'Trzy godziny szczerości. Klipy z rozmowy są wszędzie.'],
        ['Idę i ściemniam.', { h: 10, s: -15 }, 'Widzowie łapią każdą sprzeczność. Ktoś zrobił kompilację.'],
        ['Odmawiam.', { h: -10 }, 'Podcast i tak o Tobie mówi. Bez Ciebie.'],
        ['PR-owiec przygotowuje odpowiedzi.', { h: 15, s: 10 }, 'Każda odpowiedź jak z podręcznika. Nikt nie wie, że ćwiczyłeś dwa dni.', { need: 'pr' }]] },
      [{ when: 'klamstwo', k: 'detektyw', app: 'Instagram', t: 'Natalia wrzuca story w Twojej bluzie z podpisem: „koleżanka, mhm 🙂”.', c: [
        ['Przyznaję się. Tak, jesteśmy razem.', { s: 5, h: 10, n: -5 }, 'Lepiej późno niż wcale. Komentarze łagodnieją.', { set: 'para' }],
        ['Dalej ściemniam.', { s: -20, n: 10 }, 'Natalia wrzuca kolejne story. Tym razem z Twoim kotem.'],
        ['Usuwam konto na tydzień.', { h: -15, n: -10 }, 'Tydzień ciszy. Plotki żyją własnym życiem.']] },
       { k: 'detektyw', app: 'Twitter', t: 'Wyciekają screeny Waszych wiadomości. Najczęściej cytowane zdanie: „mój producent nie umie nawet w bity”.', c: [
        ['Mówię, że to fejk.', { s: -15, h: 10 }, 'Ktoś pokazuje metadane. To nie fejk.'],
        ['Śmieję się z siebie na TikToku.', { h: 15, s: 10 }, 'Autoironia ratuje sytuację. Dźwięk z filmiku wiralowy.'],
        ['Prawnik każe usunąć screeny.', { s: 5, k: -5, n: -10 }, 'Screeny znikają z trzech portali. Czwarty pisze o piśmie.', { need: 'prawnik' }],
        ['Zatrudniam prawnika teraz.', { k: -15, s: 5 }, 'Drogo, ale screeny powoli znikają.']] }],
      { k: 'kapiel', app: 'Plotkarski portal', t: 'Wyciekają zdjęcia z jacuzzi na Waszych wakacjach. Zasłonięte tylko emotką brzoskwini.', c: [
        ['Skoro wyciekły – wrzucam lepsze ujęcia.', { h: 25, s: -10, n: -5 }, 'Najgorętszy post tygodnia. Babcia dzwoni.'],
        ['Mówię, że to AI.', { s: -10, n: 10, h: 5 }, 'Specjaliści od AI wyśmiewają tłumaczenie w trzech językach.'],
        ['Przepraszam rodzinę publicznie.', { s: 10, h: -5, n: 5 }, 'Mama wybaczyła. Internet – częściowo.']] },
      [{ when: 'wojna', k: 'diabelek', app: 'YouTube', t: 'Kuba nagrywa diss o Tobie i Natalii. Refren: „Weź ją sobie, i tak fałszuje”.', c: [
        ['Odpowiadamy razem z Natalią – duetem.', { h: 20, k: 5, n: 5 }, 'Duet ma więcej odsłuchów niż diss. Kuba milknie.'],
        ['Przyjmuję jego wyzwanie na freak fight.', { h: 30, k: 20, n: 20 }, 'Federacja ogłasza walkę. Bilety wyprzedane w godzinę.', { next: 'END:oktagon' }],
        ['Ignoruję. Klasa.', { s: 10, h: -10 }, 'Fani doceniają spokój. Kuba się wścieka.']] },
       { when: 'para', k: 'zakochana', app: 'Wiadomości', t: 'Natalia: „Albo jesteśmy oficjalnie, albo wcale. Masz czas do niedzieli”.', c: [
        ['Oświadczam się na Instagramie.', { h: 25, s: 10 }, 'Pierścionek, róże, 2 miliony wyświetleń.', { next: 'END:slub' }],
        ['Oficjalnie, ale bez cyrku.', { s: 10, h: 10 }, 'Jedno wspólne zdjęcie. Ludzie szanują prywatność.'],
        ['Wolę wolność.', { h: 5, s: -5, n: -10 }, 'Natalia wrzuca smutny cytat. Wiadomo, o kogo chodzi.']] },
       { k: 'ziomek', app: 'Wiadomości', t: 'Kuba pisze: „Dobra, było minęło. Ale bit za darmo już nie będzie”.', c: [
        ['Płacę za bity jak profesjonalista.', { k: -10, s: 10 }, 'Biznes to biznes. Muzyka wraca do normy.'],
        ['Proponuję mu procent od singla.', { k: -5, s: 5, h: 5 }, 'Kuba zgadza się. Single brzmią lepiej niż kiedykolwiek.'],
        ['Szukam nowego producenta.', { h: 10, n: 10 }, 'Castingi na producenta – Śliska robi z tego relację.']] }],
      { k: 'redaktor', app: 'Śliska News', t: 'Minął miesiąc. Wszyscy pytają, czy to coś poważnego. Ostatni ruch:', c: [
        ['Nagrywamy razem duet.', { h: 25, k: 15, s: -5 }, 'Numer wpada na listy. Kuba… robi remix. Podobno za kasę.'],
        ['Zrywamy dla świętego spokoju.', { s: 10, h: -10, n: -10 }, 'Spokój jest. Tylko serce trochę mokre.'],
        ['Ogłaszam przerwę od social mediów.', { h: -15, s: 10, n: -20 }, 'Przerwa trwa 4 dni. Rekord.']] }
    ] },
    { id: 'plagiat', name: 'Gala i plagiat', k: 'gwiazdor', sub: 'Wygrywasz nagrodę, ale ktoś zarzuca Ci kradzież refrenu.', b: [
      { k: 'gwiazdor', app: 'Gala', t: 'Wygrywasz nagrodę za Numer Roku. Godzinę później ktoś wrzuca porównanie: Twój refren brzmi jak piosenka mało znanego Szymka z Radomia z 2019.', c: [
        ['„To była inspiracja.”', { s: -5, h: 5, n: 5 }, 'Słowo „inspiracja” staje się memem tygodnia.'],
        ['Oddaję statuetkę na scenie.', { s: 20, h: 15, k: -10 }, 'Wideo ma 2 miliony wyświetleń. Klasa – piszą nawet hejterzy.'],
        ['Ignoruję i świętuję.', { h: 5, s: -10 }, 'Zdjęcia z afterparty kontra porównanie refrenów. Nie wygląda to dobrze.']] },
      { k: 'redaktor', app: 'Mail', t: 'Szymek żąda tantiem i przeprosin. Jego jedyny numer ma teraz więcej odsłuchów niż przez 7 lat.', c: [
        ['Płacę od razu.', { k: -20, s: 15, n: -5 }, 'Sprawa zamknięta po cichu. Prawie – on o tym nagrał film.'],
        ['Idę do sądu.', { k: -10, h: 10, n: 15 }, 'Rozprawa za pół roku. Do tego czasu – darmowa promocja dla Was obu.', { set: 'sad' }],
        ['Proponuję mu feat.', { h: 15, s: 10, k: 5 }, 'Zgodził się. Internet: „najlepsze zakończenie dramy ever”.', { set: 'feat' }]] },
      { k: 'imprezowa', app: 'Instagram', t: 'Na afterparty ktoś nagrywa, jak tańczysz na stole ze statuetką na głowie. Nagranie już krąży.', c: [
        ['Tańczę dalej. To moja noc.', { h: 20, s: -5 }, 'Filmik jest wszędzie. Z dźwiękiem Twojego „inspirowanego” refrenu.'],
        ['Zabieram komuś telefon.', { h: 10, s: -20, n: 10 }, 'Teraz jest też drugie nagranie. Z innego telefonu.'],
        ['Zamawiam pizzę dla wszystkich.', { s: 10, k: -5, h: 5 }, 'Pizza dla 80 osób. Najlepszy PR za 1200 zł.']] },
      { k: 'diabelek', app: 'Zrzutka', t: 'Hejterzy zakładają zrzutkę „na lekcje oryginalności dla {nick}a”. Zebrali już 3 tysiące.', c: [
        ['Wpłacam pierwszy i dziękuję.', { h: 20, s: 15, k: -5 }, 'Dystans level master. Zrzutkę przekazujesz na schronisko.'],
        ['Zgłaszam zrzutkę.', { s: -10, h: 5, n: 5 }, 'Zrzutka zdjęta. Powstają trzy nowe.'],
        ['Nagrywam diss na hejterów.', { h: 15, s: -5 }, 'Diss jest dobry. Ale refren… brzmi znajomo.']] },
      [{ when: 'sad', k: 'detektyw', app: 'Sąd', t: 'Rozprawa. Biegły muzykolog gra oba refreny na pianinie. Na sali słychać chichot.', c: [
        ['Bronię się sam. Wiem, co robię.', { n: 20 }, 'Sędzia słucha cierpliwie. Za cierpliwie.', { next: 'END:sad' }],
        ['Prawnik wnosi o ugodę.', { k: -10, s: 5, n: -10 }, 'Ugoda z klauzulą poufności. Wychodzisz suchą stopą.', { need: 'prawnik' }],
        ['Proponuję ugodę na korytarzu.', { k: -20, s: 10 }, 'Szymek się zgadza. Uścisk dłoni dla fotoreporterów.']] },
       { when: 'feat', k: 'zakochana', app: 'Studio', t: 'Nagrywacie razem. Szymek okazuje się genialnym producentem – lepszym niż Twój.', c: [
        ['Prawa 50 na 50.', { s: 15, k: -10 }, 'Uczciwie. Szymek płacze ze wzruszenia.'],
        ['Chcę 80%. To mój zasięg.', { k: 15, s: -15 }, 'Szymek wrzuca screen umowy. Ups.'],
        ['Robimy cały album.', { h: 15, s: 10, n: 10 }, 'Album „Inspiracja” zapowiedziany. Ironia w czystej postaci.']] },
       { k: 'wsciekla', app: 'Telewizja', t: 'Media nazywają Cię „Plagiatorem roku”. Telewizja śniadaniowa zaprasza na rozmowę.', c: [
        ['Idę do TV i tłumaczę.', { h: 10, s: 5, n: 10 }, 'Pani prowadząca gra Ci oba refreny. Na żywo.'],
        ['Nagrywam satyryczny numer o sobie.', { h: 20, s: 10 }, '„Ukradłem refren (i Wasze serca)” – hit TikToka.'],
        ['Cisza medialna.', { h: -10, n: -5 }, 'Bez Ciebie temat szybko gaśnie.']] }],
      { k: 'super', app: 'Telewizja', t: 'Telewizja proponuje Ci rolę jurora w talent show. Gaża robi wrażenie.', c: [
        ['Biorę.', { k: 25, h: 15, s: -5 }, 'Siedzisz w fotelu jurora. Ironia nikogo nie omija.'],
        ['Odmawiam – najpierw muzyka.', { s: 10 }, 'Ludzie szanują wybór. Konto mniej.'],
        ['Biorę i w 1. odcinku oskarżam uczestnika o plagiat.', { h: 25, s: -10, n: 5 }, 'Najczęściej oglądany fragment sezonu.']] },
      { k: 'redaktor', app: 'Śliska News', t: 'Rok później Śliska News robi podsumowanie afery. Jaki jest Twój ostatni ruch?', c: [
        ['Remix z Szymkiem.', { s: 20, k: 15 }, 'Remix lepszy od obu wersji. Nikt nie pamięta, o co była afera.'],
        ['To była prowokacja marketingowa.', { h: 25, s: -15, k: 10 }, 'Pół internetu klaszcze, pół czuje się oszukane.'],
        ['Usuwam numer z serwisów.', { s: 5, h: -15, k: -15, n: -10 }, 'Numer znika. Tylko ludzie wciąż nucą ten refren.']] }
    ] },
    { id: 'trasa', name: 'Trasa widmo', k: 'ratownik', sub: 'Organizator uciekł z kasą za bilety. 12 koncertów odwołanych.', b: [
      { k: 'ratownik', app: 'Mail', t: 'Organizator trasy zniknął z pieniędzmi za bilety. 12 koncertów odwołanych, a fani piszą pod każdym postem: „OSZUST”.', c: [
        ['Oświadczenie: „nie wiedziałem”.', { s: 5, n: 10 }, 'Część fanów wierzy. Część pisze „łatwo powiedzieć”.'],
        ['Obiecuję zwrot z własnej kieszeni.', { s: 20, k: -25 }, 'Gest roku. Księgowa mdleje.', { set: 'zwrot' }],
        ['Piszę, że to wina fanów, że kupili za wcześnie.', { h: 15, s: -25, n: 5 }, 'Najgorszy post w historii konta. 40 tys. komentarzy.']] },
      { k: 'wsciekla', app: 'Instagram', t: 'Fan z Wrocławia przychodzi pod Twój dom z transparentem „ODDAJ 189 ZŁ”.', c: [
        ['Zapraszam go na kawę i nagrywam rozmowę.', { h: 15, s: 15 }, 'Wrocławianin wychodzi z kasą i selfie. Film robi zasięgi.'],
        ['Wzywam ochronę.', { s: -10, n: -5 }, 'Nagranie ochroniarza przepychającego fana – idealny materiał dla hejterów.'],
        ['Uciekam tylnymi drzwiami.', { h: 5, s: -5, n: 10 }, 'Ktoś nagrał, jak przeskakujesz płot. Nowy mem.']] },
      { k: 'detektyw', app: 'Twitter', t: 'Internetowy detektyw namierza organizatora: siedzi na Bali i wrzuca zdjęcia z basenu.', c: [
        ['Lecę na Bali.', { k: -15, h: 20, n: 10 }, 'Bilet w jedną stronę. Vlog z lotniska ogląda pół Polski.', { set: 'bali' }],
        ['Zgłaszam sprawę na policję.', { s: 10, n: -5 }, 'Rozsądnie. Nudno, ale rozsądnie.'],
        ['Wrzucam jego adres na story.', { h: 20, s: -15, n: 5 }, 'Internet szaleje. Prawnicy obu stron zacierają ręce.']] },
      [{ when: 'bali', k: 'surfer', app: 'Bali', t: 'Na Bali organizator wita Cię drinkiem: „Zostań, mam tu willę i nowe interesy. Polska poczeka”.', c: [
        ['Zostaję. Raj to raj.', { h: 10, n: -20 }, 'Słońce, fale i zero zasięgu.', { next: 'END:ucieczka' }],
        ['Zabieram go do Polski.', { s: 20, h: 15, n: 10 }, 'Wracacie razem. Lotnisko pełne kamer.'],
        ['Robię vloga z wakacji.', { h: 15, s: -10, k: 10 }, 'Fani: „Za nasze 189 zł?”. Wyświetlenia rekordowe.']] },
       { k: 'redaktor', app: 'Prokuratura', t: 'Prokuratura wszczyna śledztwo, a dziennikarze dzwonią co 5 minut.', c: [
        ['Współpracuję ze śledczymi.', { s: 15, n: 5 }, 'Zeznania, dokumenty, cierpliwość. Opłaca się.'],
        ['Prawnik przejmuje komunikację.', { s: 10, n: -15 }, 'Jedno zdanie dla mediów dziennie. Spokój.', { need: 'prawnik' }],
        ['Mówię, że to spisek konkurencji.', { h: 15, s: -15 }, 'Teoria spiskowa żyje własnym życiem. Konkurencja zachwycona darmową reklamą.']] }],
      { k: 'gwiazdor', app: 'Wiadomości', t: 'Konkurencyjny artysta oferuje darmowy koncert dla poszkodowanych fanów. Warunek: jego nazwisko największe na plakacie.', c: [
        ['Zgadzam się.', { s: 10, h: -5 }, 'Fani zadowoleni. Ego trochę mniej.'],
        ['Robię własny darmowy koncert.', { s: 20, k: -15, n: 10 }, 'Hala pełna, kasa pusta, serce pełne.'],
        ['Odmawiam. Sam to załatwię.', { h: 5, s: -10 }, 'Konkurent robi koncert i tak. Bez Ciebie.']] },
      [{ when: 'zwrot', k: 'mikolaj', app: 'Bank', t: 'Zwroty zjadły oszczędności. Bank dzwoni w sprawie raty za studio.', c: [
        ['Sprzedaję samochód.', { k: 15, h: 5 }, 'Jeździsz hulajnogą. Fani: „szacun”.'],
        ['Zbiórka od fanów.', { k: 20, s: -10 }, 'Zbierasz od tych, którym oddałeś. Trochę dziwne.'],
        ['PR-owiec: historia „artysty, który oddał wszystko”.', { s: 15, h: 15 }, 'Wywiad w telewizji, propozycje od sponsorów. Bank czeka spokojnie.', { need: 'pr' }]] },
       { k: 'ziomek', app: 'Facebook', t: 'Fani zakładają grupę „Oddaj kasę {nick}”. Ma już 20 tysięcy członków.', c: [
        ['Dołączam i odpowiadam na każde pytanie.', { s: 15, n: 15 }, 'Trzy noce odpisywania. Grupa zmienia nazwę na „Fani {nick}a”.'],
        ['Zgłaszam grupę.', { s: -15, n: 5 }, 'Grupa znika. Powstaje „Oddaj kasę 2”.'],
        ['Robię live z tłumaczeniem.', { h: 10, s: 5, n: 5 }, 'Dwie godziny tłumaczenia. Połowa odpada, połowa rozumie.']] }],
      { k: 'redaktor', app: 'Śliska News', t: 'Sprawa cichnie. Co dalej z koncertami?', c: [
        ['Nowa trasa z uczciwym organizatorem.', { k: 15, s: 10, h: 10 }, 'Bilety z gwarancją zwrotu. Wyprzedane.'],
        ['Piszę książkę „Jak mnie okradli”.', { k: 20, h: 10 }, 'Bestseller na lotniskach. Także na Bali.'],
        ['Koniec z koncertami.', { h: -20, n: -20 }, 'Tylko studio. Spokój, cisza, kapcie.']] }
    ] },
    { id: 'beef', name: 'Beef z byłym zespołem', k: 'kibic', sub: 'Dawni koledzy z zespołu mówią, że zostawiłeś ich dla kasy.', b: [
      { k: 'kibic', app: 'YouTube', t: 'Twój były zespół „Mokre Ziomki” w wywiadzie: „{nick} zostawił nas dla kasy i nawet nie oddał mikrofonu”.', c: [
        ['Odpowiadam w wywiadzie.', { h: 10, s: 5 }, 'Rzeczowo i spokojnie. Nudne, ale skuteczne.'],
        ['Wrzucam stare zdjęcia z ich imprez.', { h: 25, s: -15, n: 5 }, 'Zdjęcia, których nikt nie powinien zobaczyć. Wszyscy zobaczyli.', { set: 'brudy' }],
        ['Wysyłam im mikrofon kurierem.', { h: 15, s: 10 }, 'Z liścikiem „oddaję z odsetkami”. Internet płacze ze śmiechu.']] },
      { k: 'diabelek', app: 'Spotify', t: 'Lider zespołu, Baton, wypuszcza diss „Mikrofon i zdrada”.', c: [
        ['Odpowiadam dissem.', { h: 25, n: 10 }, 'Wojna na wersy. Śliska robi ranking punchline’ów.', { set: 'diss' }],
        ['Zapraszam go na podcast.', { h: 10, s: 10, n: 5 }, 'Rozmowa zaczyna się od krzyków, kończy na wspomnieniach.'],
        ['Dzwonię do jego mamy.', { h: 15, s: -5 }, 'Mama Batona publikuje oświadczenie: „Chłopcy, przestańcie”.']] },
      { k: 'kibic', app: 'Mail', t: 'Federacja freak fight: „Walka w oktagonie z Batonem. 200 tysięcy dla każdego”.', c: [
        ['Wchodzę!', { k: 20, h: 20, n: 15 }, 'Konferencja prasowa za tydzień.', { set: 'walka' }],
        ['Odmawiam z klasą.', { s: 15, h: -5 }, '„Muzyki nie robi się pięściami”. Cytat tygodnia.'],
        ['Negocjuję pół miliona.', { k: 10, h: 10, n: 10 }, 'Federacja się zgadza. Teraz trzeba trenować.', { set: 'walka' }]] },
      [{ when: 'walka', k: 'wsciekla', app: 'Konferencja', t: 'Konferencja przed walką. Baton rzuca w Ciebie butelką wody.', c: [
        ['Rzucam stołem.', { h: 25, s: -15, n: 10 }, 'Ochrona rozdziela. Klip ma 5 milionów wyświetleń.'],
        ['Spokojnie wycieram twarz i się uśmiecham.', { s: 15, h: 10 }, 'Zimna krew. Fani: „psychopata, szanuję”.'],
        ['Całuję go w czoło.', { h: 30, s: 5 }, 'Nikt nie wie, co się stało. Ale wszyscy to udostępniają.']] },
       { k: 'ziomek', app: 'Instagram', t: 'Fani zespołu bombardują Twoje komentarze: „zdrajca”, „mikrofon”, „oddaj”.', c: [
        ['Odpowiadam każdemu.', { n: 20, h: 10 }, 'O 4:00 wciąż piszesz. Kciuk boli.'],
        ['Wyłączam komentarze.', { h: -10, n: -10 }, 'Cisza w komentarzach, burza w DM-ach.'],
        ['PR-owiec: kampania „Wspomnienia Mokrych Ziomków”.', { s: 15, h: 10 }, 'Stare zdjęcia, ciepłe słowa. Fani zespołu miękną.', { need: 'pr' }]] }],
      { k: 'gwiazdor', app: 'Wiadomości', t: 'Dawny menedżer zespołu proponuje reaktywację na jedną trasę. Kasa ogromna.', c: [
        ['Zgadzam się.', { k: 25, s: 10, n: 5 }, 'Ogłoszenie reaktywacji łamie internet.', { set: 'reunion' }],
        ['Nigdy.', { s: -5, n: -5 }, 'Drzwi zamknięte. Klucz wyrzucony.'],
        ['Tylko jeśli zespół przyjmie moją ksywkę w nazwie.', { h: 15, s: -15 }, '„{nick} i Mokre Ziomki”. Baton odpowiada jednym emoji.']] },
      [{ when: 'walka', k: 'kibic', app: 'Gala freak fight', t: 'Hala pełna. Gong.', c: [
        ['Walczę na serio.', { h: 20, n: 15 }, 'Pierwsza runda…', { next: 'END:oktagon' }],
        ['Poddaję się w 10. sekundzie i biorę kasę.', { k: 15, s: -20, h: 10 }, 'Najkrótsza walka gali. Najdroższe 10 sekund życia.'],
        ['Zamiast walki gram koncert w klatce.', { h: 25, s: 10 }, 'Sędzia nie wie, co robić. Publika śpiewa.']] },
       { when: 'reunion', k: 'imprezowa', app: 'Koncert', t: 'Pierwszy koncert reaktywacji. Hala pełna, Baton stoi obok Ciebie.', c: [
        ['Godzimy się na scenie.', { s: 20, h: 15, n: -10 }, 'Uścisk przy „Mokrych nocach”. Hala płacze.', { next: 'END:duet' }],
        ['Kłócimy się na scenie.', { h: 25, s: -15, n: 15 }, 'Najlepszy koncert roku. Z niewłaściwych powodów.'],
        ['Wychodzę w połowie.', { h: 10, s: -20, n: -10 }, 'Baton śpiewa Twoje zwrotki. Fałszuje.']] },
       { k: 'zakochana', app: 'Wiadomości', t: 'Baton trafia do szpitala (nic poważnego). Fani apelują: „Pogódźcie się wreszcie”.', c: [
        ['Odwiedzam go w szpitalu.', { s: 25, h: 5, n: -5 }, 'Selfie z łóżka szpitalnego. „Mikrofon oddany”.'],
        ['Wrzucam życzenia zdrowia.', { s: 10 }, 'Krótko i z klasą.'],
        ['Nic nie robię.', { s: -15 }, '„Nawet teraz?” – pytają fani.']] }],
      { k: 'redaktor', app: 'Śliska News', t: 'Koniec sezonu dram. Co dalej z karierą?', c: [
        ['Wspólny numer z Mokrymi Ziomkami.', { s: 15, h: 15 }, '„Oddaję mikrofon” – numer roku.'],
        ['Solowa płyta „Bez Ziomków”.', { h: 10, k: 15 }, 'Ironiczny tytuł, świetne recenzje.'],
        ['Zakładam nowy zespół.', { h: 15, n: 10 }, '„Suche Ziomki”. Chwytliwe.']] }
    ] },
    { id: 'live', name: 'Live po imprezie', k: 'kapiel', sub: 'Zapomniałeś wyłączyć transmisję. Oglądało 40 tysięcy osób.', b: [
      { k: 'kapiel', app: 'Instagram Live', t: 'Po imprezie zapomniałeś wyłączyć live. 40 tysięcy osób oglądało, jak pod prysznicem śpiewasz hity konkurencji. Fałszując.', c: [
        ['Śmieję się i wrzucam wersję studyjną.', { h: 25, s: 5 }, 'Wersja „Prysznic Edition” ląduje w top 50.'],
        ['Mówię, że ktoś zhakował konto.', { s: -15, n: 10 }, 'Hakerzy, którzy włączają live pod prysznicem? Ciekawe.', { set: 'hack' }],
        ['Przepraszam konkurencję za fałsz.', { s: 10, h: -5 }, 'Konkurencja odpisuje: „i tak lepiej niż oryginał”.']] },
      { k: 'sliska', app: 'TikTok', t: 'Klip robi się trendem: #PrysznicChallenge. Ludzie nagrywają się, śpiewając pod prysznicem.', c: [
        ['Dołączam do challenge’u.', { h: 20, n: 5 }, 'Twoje nagranie z gumową kaczką ma 3 mln wyświetleń.'],
        ['Każę usuwać nagrania.', { h: -5, s: -10, n: 10 }, 'Zgłoszenia nie działają. Challenge rośnie.'],
        ['Sprzedaję prawa do nagrania marce żeli.', { k: 20, s: -5 }, '„Pachnie sukcesem” – reklama z Tobą w roli głównej.']] },
      [{ when: 'hack', k: 'detektyw', app: 'Twitter', t: 'Ekspert od cyberbezpieczeństwa publicznie: „Nie było żadnego hakowania. Live włączono z jego telefonu”.', c: [
        ['Przyznaję się.', { s: 5, h: 5, n: -5 }, '„Dobra, to ja. Byłem wesoły”. Ludzie odpuszczają.'],
        ['Idę w zaparte.', { s: -20, n: 15 }, 'Ekspert wrzuca kolejne dowody. I zrzuty ekranu.'],
        ['Prawnik grozi ekspertowi pozwem.', { h: 10, s: -10, k: -5 }, 'Groźba pozwu za prawdę? Internet nie wybacza.', { need: 'prawnik' }]] },
       { k: 'redaktor', app: 'Mail', t: 'Wytwórnia konkurencji pisze: „Wykonujesz nasze utwory bez licencji”.', c: [
        ['Płacę licencję.', { k: -15, s: 5 }, 'Najdroższy prysznic w historii.'],
        ['Proponuję oficjalny cover.', { h: 10, k: 5 }, 'Cover nagrany. Tym razem bez fałszu.'],
        ['Prawnik: prywatny live to nie koncert.', { s: 5, n: -10 }, 'Wytwórnia wycofuje roszczenia.', { need: 'prawnik' }]] }],
      { k: 'szlafrok', app: 'Telewizja', t: 'Program śniadaniowy zaprasza Cię… do studia, w którym zbudowano prysznic.', c: [
        ['Idę. W szlafroku.', { h: 20, s: -5, k: 10 }, 'Prowadząca prosi o bis. Mama ogląda.'],
        ['Odmawiam.', { s: 10, h: -5 }, 'Producent programu jest zawiedziony. Ty – godny.'],
        ['Idę i śpiewam swój numer.', { h: 15, s: 10, n: 5 }, 'Wreszcie ludzie słyszą Twoje piosenki. Czysto.']] },
      { k: 'wsciekla', app: 'Twitter', t: 'Ktoś wyciąga Twój tweet sprzed 8 lat: „Prysznic to najlepsza scena w Polsce”. Plus kilka gorszych.', c: [
        ['Przepraszam za stare tweety.', { s: 5, n: 5 }, 'Krótko, bez wymówek. Działa.'],
        ['„Byłem dzieckiem”.', { s: -5, h: 5 }, 'Miałeś 24 lata. Ktoś to sprawdził.'],
        ['Wrzucam jeszcze gorsze tweety innych artystów.', { h: 25, s: -20, n: 10 }, 'Wojna na stare tweety. Wszyscy przegrywają.']] },
      { k: 'imprezowa', app: 'Mail', t: 'Producent reality show: „Zamieszkaj z 6 influencerami na 30 dni. Kamery 24/7, także w łazience”.', c: [
        ['Biorę.', { h: 25, k: 20 }, 'Pakujesz walizkę. I gumową kaczkę.', { next: 'END:reality' }],
        ['Odmawiam.', { s: 10 }, 'Dość kamer w łazience.'],
        ['Negocjuję własny program.', { k: 20, h: 10, n: 10 }, '„Pod prysznicem z {nick}em” – talk show zatwierdzony.']] },
      { k: 'redaktor', app: 'Śliska News', t: 'Afera cichnie. Co zostanie po prysznicowym skandalu?', c: [
        ['Album „Pod prysznicem”.', { h: 20, k: 15 }, 'Akustyczny, intymny, mokry. Złota płyta.'],
        ['Detoks cyfrowy.', { n: -25, h: -15 }, 'Telefon w szufladzie. Pierwszy raz od lat śpisz 8 godzin.'],
        ['Własna marka żeli pod prysznic.', { k: 25, h: 5, s: -5 }, '„Śpiewaj czysto” – sprzedaje się lepiej niż płyty.']] }
    ] }
  ];

  /* ---------- losowe wydarzenia między dniami ---------- */
  var EVENTS = [
    { k: 'diabelek', app: 'Instagram', t: 'Hejter liczy błędy ortograficzne w Twoich storiesach. Doliczył się 37.', c: [['Poprawiam wszystkie.', { s: 5, n: 5 }, '„Szacun za pokorę” – pisze nawet hejter.'], ['Odpisuję z błędami celowo.', { h: 10 }, '„Żeby było 38” – komentarz dnia.'], ['Blokuję.', { n: -5, s: -5 }, 'Hejter zakłada drugie konto.']] },
    { k: 'redaktor', app: 'Telefon', t: 'Sponsor dzwoni: „W kontrakcie jest klauzula moralności. Ostatnio trochę ją naginasz”.', c: [['Uspokajam sponsora.', { n: 5 }, 'Kontrakt zostaje. Na razie.'], ['Zrywam kontrakt.', { k: -15, s: 10 }, '„Nie dam się kontrolować” – fani zachwyceni.'], ['Proszę o podwyżkę.', { k: 10, s: -5, n: 5 }, 'Sponsor się śmieje. Potem płaci.']] },
    { k: 'zakochana', app: 'Telefon', t: 'Mama dzwoni: „Synku/córciu, co ty wyprawiasz w tym internecie?”.', c: [['Tłumaczę spokojnie.', { n: -10 }, 'Mama: „Dobrze, tylko jedz coś”.'], ['Mówię, że to marketing.', { h: 5 }, 'Mama: „A to nowe słowo na wstyd?”.'], ['Nagrywam rozmowę na TikToka.', { h: 15, s: -10 }, 'Mama ma teraz więcej fanów niż Ty.']] },
    { k: 'sliska', app: 'Instagram', t: 'Ktoś zrobił z Twojej twarzy filtr na Instagramie. Używa go pół Polski.', c: [['Sam go używam.', { h: 10 }, 'Filtr z Tobą na Tobie. Incepcja.'], ['Zgłaszam filtr.', { s: -5, n: 5 }, 'Filtr znika. Powstają trzy podróbki.'], ['Zarabiam na nim.', { k: 10 }, 'Wersja premium z koroną: 4,99 zł.']] },
    { k: 'detektyw', app: 'Facebook', t: 'Fejkowy fanpage z Twoim zdjęciem ma więcej obserwujących niż prawdziwe konto.', c: [['Przejmuję go oficjalnie.', { h: 10, k: 5 }, 'Fejk staje się oryginałem. Admin dostaje kawę.'], ['Robię z nim beef.', { h: 15, n: 5 }, 'Beef z samym sobą. Internet zachwycony.'], ['Ignoruję.', { n: -5 }, 'Fejk publikuje Twoje zdjęcia z dzieciństwa.']] },
    { k: 'redaktor', app: 'Śliska News', t: 'Śliska News prosi o komentarz do plotki o Twoim nowym tatuażu „w intymnym miejscu”.', c: [['Pokazuję tatuaż (prawie).', { h: 15, s: -5 }, 'Zdjęcie ocenzurowane gwiazdką. Najlepiej klikający artykuł tygodnia.'], ['Dementuję.', { s: 5 }, '„Nie mam tatuażu” – zdanie, w które nikt nie wierzy.'], ['Mówię, że to logo Śliskiej.', { h: 20, s: 5 }, 'Redakcja oferuje dożywotnią prenumeratę.']] },
    { k: 'kowboj', app: 'Bazar', t: 'Podróbki Twojego merchu sprzedają się na bazarze lepiej niż oryginały.', c: [['Kupuję jedną i chwalę.', { h: 10, s: 5 }, '„Jakość lepsza niż moja” – piszesz pod zdjęciem.'], ['Zgłaszam podróbki.', { k: 5, n: 5 }, 'Bazar przenosi się trzy alejki dalej.'], ['Obniżam ceny oryginału.', { k: -10, s: 10 }, 'Fani doceniają. Księgowa nie.']] },
    { k: 'uwodziciel', app: 'Wiadomości', t: 'Znana influencerka pisze o 2:00 w nocy: „Śpisz? 😏”.', c: [['Odpisuję.', { h: 15, n: 10 }, 'Rano screen jest na plotkarskim portalu.'], ['Zostawiam na rano.', { s: 5 }, 'Rano odpisujesz „sorki, spałem”. Klasyk.'], ['Wrzucam screen na story.', { h: 20, s: -15 }, 'Influencerka wrzuca Twoje stare wiadomości. Remis.']] },
    { k: 'ratownik', app: 'Zdrowie', t: 'Trzecia noc bez snu. Ręce się trzęsą, telefon parzy.', c: [['Idę spać o 22:00.', { n: -15, h: -5 }, 'Rano świat wygląda lepiej.'], ['Kawa i dalej.', { n: 10, h: 5 }, 'Piąta kawa. Serce gra techno.'], ['Wyjeżdżam na weekend za miasto.', { n: -20, k: -5 }, 'Las, cisza, brak zasięgu. Cudownie.']] }
  ];

  /* ---------- ekipa do zatrudnienia (raz na grę, po 2. dniu) ---------- */
  var CREW = [
    ['prawnik', 'Prawnik', 20, 'Odblokowuje opcje prawne, mniejsze straty w sądzie.'],
    ['pr', 'PR-owiec', 15, 'Odblokowuje opcje PR, spadki Szacunku o 40% mniejsze.'],
    ['terapeuta', 'Terapeuta', 10, 'Od razu −25 Nerwów, później nerwy rosną o 40% wolniej.']
  ];

  /* ---------- zakończenia ---------- */
  var ENDS = [
    ['ikona', 'Ikona pokolenia', 'ikona', function (s) { return s.h >= 85 && s.s >= 60; }, 'Twoja twarz jest na billboardach, Twoje słowa na koszulkach, a dzieciaki cytują Cię na przerwach. Afera tylko dodała Ci legendy.'],
    ['legenda', 'Legenda', 'super', function (s) { return s.s >= 70 && s.h >= 65; }, 'Wychodzisz z afery silniejszy niż kiedykolwiek. Hype, szacunek i nagłówek „Comeback dekady”.'],
    ['krol', 'Król dramy', 'diabelek', function (s) { return s.h >= 75 && s.s < 40; }, 'Wszyscy Cię znają, nikt Ci nie ufa. Każdy Twój post to nowy artykuł na Śliskiej. Korona jest, tylko trochę ubrudzona.'],
    ['biznes', 'Biznesmen roku', 'kowboj', function (s) { return s.k >= 80; }, 'Z afery zrobiłeś biznes: merch, reklamy, trasa. Konto pełne. O muzyce mało kto pamięta.'],
    ['zen', 'Zen mistrz', 'sauna', function (s) { return s.n <= 15; }, 'Afera? Jaka afera? Medytujesz, pijesz zieloną herbatę i śpisz po 9 godzin. Internet się wściekał, Ty nawet nie zauważyłeś.'],
    ['weteran', 'Szanowany weteran', 'zakochana', function (s) { return s.s >= 70; }, 'Nie było fajerwerków, ale wyszedłeś z tego z klasą. Branża Cię szanuje, fani też.'],
    ['mem', 'Żywy mem', 'kapiel', function (s) { return s.h >= 65; }, 'Nie wiadomo jak, ale wszyscy Cię kochają – jako mema. Twoja mina jest na naklejkach, kubkach i w każdej grupie.'],
    ['cisza', 'Cichy przeczekiwacz', 'szlafrok', function (s) { return s.h < 30; }, 'Drama wygasła sama. Nikt już nie pamięta, o co chodziło – Ty też nie. Bezpiecznie, ale nudno.'],
    ['wtopa', 'Wtopa roku', 'ratownik', function (s) { return s.s < 25; }, 'Każdy ruch dolewał oliwy do ognia. Śliska przyznaje Ci tytuł „Wtopa roku”. Licznik dni bez wtopy: 0.'],
    ['przecietniak', 'Przeciętniak sceny', 'ziomek', function () { return true; }, 'Ani legenda, ani wtopa. Afera przeszła, Ty zostałeś – gdzieś pośrodku. Spróbuj odważniej!'],
    ['cancel', 'Scancelowany', 'wsciekla', null, 'Szacunek spadł do zera. Marki zrywają umowy, festiwale skreślają Cię z line-upu, a Twoja ksywka staje się czasownikiem: „ale się {nick}nął”.'],
    ['bankrut', 'Bankrut', 'mikolaj', null, 'Kasa się skończyła. Sprzedajesz złoty łańcuch na Vinted i grasz na weselach. Ale przynajmniej jest wesoło.'],
    ['zalamanie', 'Załamanie nerwowe', 'niesmiala', null, 'Nerwy puściły. Wrzucasz czarny kwadrat, wyłączasz telefon i wyjeżdżasz w Bieszczady. Wrócisz – ale nie szybko.'],
    ['duet', 'Najlepsi kumple', 'imprezowa', null, 'Zamiast wojny – wspólna scena. Fani płaczą ze wzruszenia, a Śliska pisze „Najpiękniejsza zgoda roku”.'],
    ['slub', 'Ślub roku', 'uwodziciel', null, 'Oświadczyny na Instagramie, ślub w transmisji live, a były producent… gra na weselu. Love is in the air.'],
    ['sad', 'Przegrana w sądzie', 'detektyw', null, 'Biegły nie miał wątpliwości. Płacisz odszkodowanie, a refren od teraz oficjalnie należy do Szymka z Radomia.'],
    ['ucieczka', 'Ucieczka na Bali', 'surfer', null, 'Zostajesz w raju. Konto w Polsce milczy, a Ty uczysz turystów surfować. Fani wciąż czekają na zwrot za bilety.'],
    ['oktagon', 'Walka w oktagonie', 'kibic', null, 'Gong, trzy rundy, jedna kontuzja ego. Wynik nieważny – oglądalność rekordowa, a Ty masz nową ksywkę: „Mokry Młot”.'],
    ['reality', 'Gwiazda reality show', 'sliska', null, '30 dni z sześcioma influencerami i kamerami w łazience. Wygrywasz program, przegrywasz resztki prywatności.'],
    ['milioner', 'Milion i jeden', 'gwiazdor', function (s, r) { return r.fol >= 1500000 && s.k >= 60; }, 'Półtora miliona obserwujących i pełne konto. Afera była najlepszą kampanią marketingową w Twoim życiu.']
  ];
  var SPECIAL = ['duet', 'slub', 'sad', 'ucieczka', 'oktagon', 'reality'];
  // kolejność sprawdzania zakończeń wynikowych (milioner przed resztą)
  var FINAL = ['milioner', 'ikona', 'legenda', 'krol', 'biznes', 'zen', 'weteran', 'mem', 'cisza', 'wtopa', 'przecietniak'];
  var END = function (id) { return ENDS.filter(function (e) { return e[0] === id; })[0]; };

  /* ---------- osiągnięcia ---------- */
  var ACH = [
    ['first', 'Pierwsza afera', 'Ukończ dowolną aferę'],
    ['all6', 'Seryjny skandalista', 'Ukończ wszystkie 6 afer'],
    ['col10', 'Kolekcjoner wtop', 'Odkryj 10 zakończeń'],
    ['col20', 'Encyklopedia dram', 'Odkryj wszystkie 20 zakończeń'],
    ['special', 'Fabularny zwrot', 'Zdobądź specjalne zakończenie afery'],
    ['rich', 'Milioner', 'Skończ z Kasą 95 lub więcej'],
    ['viral', 'Wiralowy', 'Skończ z Hype 95 lub więcej'],
    ['zero', 'Zero szacunku', 'Przetrwaj aferę z Szacunkiem 10 lub mniej'],
    ['ice', 'Stalowe nerwy', 'Skończ z Nerwami 10 lub mniej'],
    ['lawyer', 'Prawnik w zanadrzu', 'Użyj opcji prawnika'],
    ['spin', 'Spin doktor', 'Użyj opcji PR-owca'],
    ['mln', 'Milion obserwujących', 'Przekrocz 1 milion obserwujących']
  ];

  /* ---------- komentarze internautów ---------- */
  var USERS = ['@mokra_ola', '@ziomek_z_bloku', '@hejter3000', '@kasia.plotkara', '@sliski_fan', '@bartek_wjazd', '@anka.drama', '@fan_nr1', '@wiecznie_offline', '@pani_basia', '@kuba.memiarz', '@tylko_popcorn'];
  var CM = {
    hype: ['KRÓL 👑', 'to jest content, którego potrzebowałem', '{nick} rozwala system', 'najlepsza drama tego roku 🍿', 'idę po popcorn', 'legenda ❤️', 'haha szanuję', 'mokro się zrobiło 💦', 'czekam na część 2'],
    hate: ['ale żenada', 'unfollow', 'kiedyś był lepszy', '{nick} skończony', 'słabe na wielu poziomach', 'pierwszy raz widzę, żeby ktoś tak się zaorał', 'PR team płacze', 'wstyd mi za ciebie', 'kto mu doradza?'],
    calm: ['ciekawe co dalej', 'czekam na drugą stronę', 'Śliska już pisze artykuł?', 'kto tu z TikToka?', 'hmm', 'dojrzale', 'ok, to było rozsądne', 'spokojnie, ludzie'],
    rich: ['ile on na tym zarobił 💰', 'kasa, kasa, kasa', 'sprzedał się? 🤔', 'biznesmen roku']
  };

  function mount(el, H) {
    var g = H.G('drama'), $ = function (s) { return el.querySelector(s); }, esc = H.esc, K = H.K;
    var run = null, R = Math.random;
    /* ikonka: Knaga w stroju + odznaka na gradiencie (id afery albo zakończenia) */
    function tile(id, kind) { var t = TILE[id] || ['ziomek', '#ffc4a8', '#e0407a', 'star']; return '<span class="dr-ico is-' + (kind || 'sc') + '" style="--a:' + t[1] + ';--b:' + t[2] + '">' + K(t[0], 'gk') + '<i class="dr-em">' + ico(t[3], 20) + '</i></span>'; }
    /* personalizacja Knagi gracza: własny strój albo „auto” (zmienia się z nastrojem postaci) */
    function myK(r, kn, st) {
      if (kn && kn !== 'auto') return kn;
      if (!st) return r.k;
      return st.n >= 75 ? 'wsciekla' : st.s <= 20 ? 'niesmiala' : st.h >= 85 ? 'imprezowa' : st.k >= 85 ? 'kowboj' : st.n <= 15 ? 'sauna' : r.k;
    }
    H.shell(el, g, '<div class="dr" id="dr"></div>', { side: '<section class="gp-box"><h3>Zakończenia <small id="dr-ec"></small></h3><div class="dr-ends" id="dr-ends"></div></section><details class="gp-box dr-fold" id="dr-fold"><summary><h3>Osiągnięcia <small id="dr-ac"></small></h3><span class="dr-chev" aria-hidden="true"></span></summary><ul class="dr-ach" id="dr-ach"></ul></details>' });
    var d0 = H.load();
    (function () { var f = $('#dr-fold'); if (!f) return; try { f.open = localStorage.getItem('sn-dr-fold') === '1'; } catch (e) { /* - */ } f.addEventListener('toggle', function () { try { localStorage.setItem('sn-dr-fold', f.open ? '1' : '0'); } catch (e) { /* - */ } }); })();
    function data() { var d = H.load(); d.endings = d.endings || []; d.dramaAch = d.dramaAch || []; d.dramaDone = d.dramaDone || []; d.dramaNick = d.dramaNick || ''; return d; }
    function endsBox() {
      var d = data(), got = d.endings;
      $('#dr-ec').textContent = got.length + '/' + ENDS.length;
      $('#dr-ends').innerHTML = ENDS.map(function (e) { var on = got.indexOf(e[1]) >= 0; return '<span class="dr-end' + (on ? ' is-on' : '') + (SPECIAL.indexOf(e[0]) >= 0 ? ' is-sp' : '') + '" title="' + (on ? esc(e[1]) : 'Jeszcze nie odkryte') + '">' + (on ? tile(e[0], 'end') : '<i>?</i>') + '<b>' + (on ? e[1] : '???') + '</b></span>'; }).join('');
      $('#dr-ac').textContent = d.dramaAch.length + '/' + ACH.length;
      $('#dr-ach').innerHTML = ACH.map(function (a) { var on = d.dramaAch.indexOf(a[0]) >= 0; return '<li class="' + (on ? 'is-on' : '') + '"><span>' + ic(on ? 'check' : 'lock', 14) + '</span><div><b>' + a[1] + '</b><small>' + a[2] + '</small></div></li>'; }).join('');
    }
    function saveRun() { try { if (run && !run.done) localStorage.setItem(RUN_KEY, JSON.stringify(run)); else localStorage.removeItem(RUN_KEY); } catch (e) { /* - */ } }
    function loadRun() { try { var r = JSON.parse(localStorage.getItem(RUN_KEY)); return r && r.sc && !r.done ? r : null; } catch (e) { return null; } }
    var T = function (s) { return String(s).replace(/\{nick\}/g, run ? run.nick : 'Ty'); };
    var fmtFol = function (n) { return n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace('.', ',') + ' mln' : n >= 1000 ? Math.round(n / 1000) + ' tys.' : String(n); };
    var SC = function (id) { return SCEN.filter(function (s) { return s.id === id; })[0]; };
    var ROLE = function (id) { return ROLES.filter(function (r) { return r.id === id; })[0]; };

    /* ----- ekran wyboru: postać + afera ----- */
    function pick() {
      var d = data(), saved = loadRun(), role = d.dramaRole || 'raper';
      $('#dr').innerHTML = '<div class="dr-pick">' +
        (saved ? '<button type="button" class="dr-cont" data-act="cont"><span class="dr-cont-k">' + tile(saved.sc, 'sc') + '</span><span><small>Masz niedokończoną aferę</small><b>' + esc(SC(saved.sc).name) + ' · dzień ' + Math.min(7, saved.beat + 1) + '/7</b><em>' + esc(saved.nick) + ' – ' + esc(ROLE(saved.role).name) + '</em></span><i>' + ic('play', 18) + ' Kontynuuj</i></button>' : '') +
        '<h2>Twoja postać</h2><div class="dr-who"><label class="dr-nick"><span>Ksywka</span><input type="text" id="dr-nick" maxlength="16" placeholder="np. Mokry Mati" value="' + esc(d.dramaNick) + '" autocomplete="off"></label></div>' +
        '<div class="dr-roles" role="radiogroup" aria-label="Typ artysty">' + ROLES.map(function (r) {
          return '<button type="button" class="dr-role' + (r.id === role ? ' is-on' : '') + '" data-role="' + r.id + '" role="radio" aria-checked="' + (r.id === role) + '"><span class="dr-role-k">' + K(myK(r, d.dramaK), 'gk') + '</span><b>' + r.name + '</b><small>' + r.d + '</small><span class="dr-role-st">' + STATS.map(function (s) { return '<i title="' + s[1] + '">' + ic(s[2], 12) + r.st[s[0]] + '</i>'; }).join('') + '</span></button>';
        }).join('') + '</div>' +
        '<h2>Twoja Knaga</h2><p class="dr-lead">Wybierz strój albo zostaw „Auto” – wtedy Knaga zmienia się z nastrojem postaci (wściekła przy wysokich Nerwach, nieśmiała przy niskim Szacunku, imprezowa przy wysokim Hype).</p><div class="dr-wear" id="dr-wear" role="radiogroup" aria-label="Strój Knagi"><button type="button" class="dr-wr' + ((d.dramaK || 'auto') === 'auto' ? ' is-on' : '') + '" data-kn="auto" role="radio" aria-checked="' + ((d.dramaK || 'auto') === 'auto') + '"><span class="dr-wr-a">Auto</span><small>nastrój</small></button>' + (window.Knaga ? Knaga.list.map(function (k) { var on = d.dramaK === k.slug; return '<button type="button" class="dr-wr' + (on ? ' is-on' : '') + '" data-kn="' + k.slug + '" role="radio" aria-checked="' + on + '" title="' + esc(k.name) + '">' + K(k.slug, 'gk') + '<small>' + esc(k.name) + '</small></button>'; }).join('') : '') + '</div>' +
        '<h2>Wybierz aferę</h2><p class="dr-lead">7 dni, decyzje, losowe wydarzenia i 4 paski. Jeśli Szacunek albo Kasa spadną do zera, a Nerwy dojdą do 100 – koniec gry.</p><div class="dr-sc">' +
        SCEN.map(function (s, i) { var done = d.dramaDone.indexOf(s.id) >= 0; return '<button type="button" class="dr-scb" data-sc="' + s.id + '"><span class="dr-scb-k">' + tile(s.id, 'sc') + '</span><span><b>' + (i + 1) + '. ' + s.name + (done ? ' <em>' + ic('check', 12) + ' ukończona</em>' : '') + '</b><small>' + s.sub + '</small></span></button>'; }).join('') + '</div></div>';
    }

    /* ----- gra ----- */
    function begin(scId) {
      var d = data(), roleId = (el.querySelector('.dr-role.is-on') || {}).dataset ? el.querySelector('.dr-role.is-on').dataset.role : 'raper', r = ROLE(roleId);
      var nick = ($('#dr-nick').value || '').trim().slice(0, 16) || 'Mokry Mati';
      d.dramaNick = nick; d.dramaRole = roleId; H.save(d);
      run = { sc: scId, role: roleId, kn: d.dramaK || 'auto', nick: nick, st: JSON.parse(JSON.stringify(r.st)), fol: r.fol, beat: 0, items: [], flags: [], ev: 0, shop: false, used: [], log: [], inter: null };
      phone(); day(); saveRun();
    }
    function phone() {
      var s = SC(run.sc), r = ROLE(run.role);
      $('#dr').innerHTML = '<div class="dr-phone"><div class="dr-top"><span class="dr-me"><span class="dr-me-k" id="dr-mek">' + K(myK(r, run.kn, run.st), 'gk') + '</span><span><b>' + esc(run.nick) + '</b><small>' + r.name + ' · <span id="dr-fol"></span> obserwujących</small></span></span><span class="dr-day" id="dr-step"></span></div>' +
        '<div id="dr-meters"></div><div class="dr-crew" id="dr-crew"></div><div class="dr-feed" id="dr-feed" aria-live="polite">' + run.log.join('') + '</div><div class="dr-ch" id="dr-ch"></div></div>' +
        '<div class="dr-bar"><span>' + esc(s.name) + '</span><button type="button" class="btn btn-sm" data-act="quit">Przerwij aferę</button></div>';
      var f = $('#dr-feed'); f.scrollTop = f.scrollHeight;
    }
    function meters(delta) {
      $('#dr-meters').innerHTML = '<div class="dr-m">' + STATS.map(function (s) { var v = run.st[s[0]], dl = delta && delta[s[0]]; return '<div class="dr-mt is-' + s[0] + (s[0] === 'n' ? (v >= 75 ? ' is-warn' : '') : (v <= 20 ? ' is-warn' : '')) + '"><span>' + ic(s[2], 12) + s[1] + '<em>' + v + (dl ? '<sup class="' + ((dl > 0) === (s[0] !== 'n') ? 'up' : 'dn') + '">' + (dl > 0 ? '+' : '') + dl + '</sup>' : '') + '</em></span><i><b style="width:' + v + '%"></b></i></div>'; }).join('') + '</div>';
      $('#dr-fol').textContent = fmtFol(run.fol);
      var mk = $('#dr-mek'); if (mk) { var want = myK(ROLE(run.role), run.kn, run.st); if (mk.dataset.k !== want) { mk.dataset.k = want; mk.innerHTML = K(want, 'gk'); } }
      $('#dr-crew').innerHTML = run.items.length ? 'Ekipa: ' + run.items.map(function (it) { var c = CREW.filter(function (x) { return x[0] === it; })[0]; return '<span>' + c[1] + '</span>'; }).join('') : '';
    }
    function bubble(cls, html, keep) { var f = $('#dr-feed'), b = '<div class="dr-b ' + cls + '">' + html + '</div>'; f.insertAdjacentHTML('beforeend', b); if (keep !== false) run.log.push(b); if (run.log.length > 60) run.log = run.log.slice(-60); f.scrollTop = f.scrollHeight; }
    function beatNode() { var b = SC(run.sc).b[run.beat]; if (!Array.isArray(b)) return b; return b.filter(function (v) { return !v.when || run.flags.indexOf(v.when) >= 0; })[0]; }
    function opts(node) { return node.c.map(function (c, i) { return { c: c, i: i }; }).filter(function (o) { var x = o.c[3] || {}; return !x.need || run.items.indexOf(x.need) >= 0; }); }
    function show(node, kind) {
      $('#dr-step').textContent = kind === 'shop' ? 'Przerwa' : kind === 'event' ? 'Dzień ' + (run.beat + 1) + ' · niespodzianka' : 'Dzień ' + (run.beat + 1) + '/7';
      meters();
      bubble('is-in' + (kind === 'event' ? ' is-ev' : ''), '<span class="dr-av">' + K(node.k, 'gk') + '</span><div><small>' + esc(node.app) + (kind === 'event' ? ' · losowe wydarzenie' : '') + '</small><p>' + esc(T(node.t)) + '</p></div>');
      $('#dr-ch').innerHTML = opts(node).map(function (o) { var x = o.c[3] || {}; return '<button type="button" class="dr-opt' + (x.need ? ' is-need' : '') + '" data-c="' + o.i + '">' + (x.need ? '<em>' + (x.need === 'prawnik' ? 'Prawnik' : 'PR') + '</em>' : '') + esc(T(o.c[0])) + '</button>'; }).join('');
      saveRun();
    }
    function day() {
      if (run.inter && run.inter.type === 'event') return show(EVENTS[run.inter.i], 'event');
      if (run.inter && run.inter.type === 'shop') return shop();
      show(beatNode(), 'beat');
    }
    function shop() {
      $('#dr-step').textContent = 'Przerwa'; meters();
      bubble('is-in is-ev', '<span class="dr-av">' + K('redaktor', 'gk') + '</span><div><small>Menedżer</small><p>Mamy trochę budżetu na wsparcie. Kogo bierzemy do ekipy? Płacimy z Kasy.</p></div>');
      $('#dr-ch').innerHTML = CREW.map(function (c) { var ok = run.st.k > c[2]; return '<button type="button" class="dr-opt dr-crew-o" data-crew="' + c[0] + '"' + (ok ? '' : ' disabled') + '><b>' + c[1] + ' <em>−' + c[2] + ' Kasy</em></b><small>' + c[3] + '</small></button>'; }).join('') + '<button type="button" class="dr-opt" data-crew="none">Nikogo. Sam sobie poradzę (+5 Kasy)</button>';
      saveRun();
    }
    function hire(id) {
      run.shop = true; run.inter = null;
      if (id === 'none') { apply({ k: 5 }); bubble('is-me', '<p>Nikogo. Sam sobie poradzę.</p>'); }
      else { var c = CREW.filter(function (x) { return x[0] === id; })[0]; run.items.push(id); var e = { k: -c[2] }; if (id === 'terapeuta') e.n = -25; apply(e, true); bubble('is-me', '<p>Zatrudniam: ' + c[1] + '.</p>'); bubble('is-re', '<p>' + c[1] + ' dołącza do ekipy. ' + c[3] + '</p>'); }
      if (dead()) return; next();
    }
    /* zastosowanie efektów (z poprawkami ekipy) – zwraca faktyczne zmiany */
    function apply(e, raw) {
      var out = {};
      STATS.forEach(function (s) {
        var k = s[0], v = e[k] || 0; if (!v) return;
        if (!raw) {
          if (k === 's' && v < 0 && run.items.indexOf('pr') >= 0) v = Math.round(v * .6);
          if (k === 'n' && v > 0 && run.items.indexOf('terapeuta') >= 0) v = Math.round(v * .6);
          if (k === 'k' && v < 0 && run.items.indexOf('prawnik') >= 0 && e.legal) v = Math.round(v * .5);
        }
        var nv = Math.max(0, Math.min(100, run.st[k] + v)); out[k] = nv - run.st[k]; run.st[k] = nv;
      });
      var hd = e.h || 0; run.fol = Math.max(1000, Math.round(run.fol * (1 + hd / 90 + (R() - .4) * .04)));
      return out;
    }
    function comments(e) {
      var pool = (e.s || 0) <= -10 ? CM.hate : (e.h || 0) >= 15 ? CM.hype : (e.k || 0) >= 15 ? CM.rich : (e.s || 0) >= 10 ? CM.calm.concat(CM.hype) : CM.calm;
      var a = pool[Math.floor(R() * pool.length)], b = (R() < .5 ? CM.calm : (e.s || 0) < 0 ? CM.hate : CM.hype); b = b[Math.floor(R() * b.length)];
      var u1 = USERS[Math.floor(R() * USERS.length)], u2 = USERS[Math.floor(R() * USERS.length)];
      bubble('is-cm', '<p><b>' + u1 + '</b> ' + esc(T(a)) + '</p>' + (a !== b ? '<p><b>' + u2 + '</b> ' + esc(T(b)) + '</p>' : ''));
    }
    function choose(i) {
      var node = run.inter && run.inter.type === 'event' ? EVENTS[run.inter.i] : beatNode(), c = node.c[i], x = c[3] || {};
      bubble('is-me', '<p>' + esc(T(c[0])) + '</p>');
      if (x.need === 'prawnik') run.used.push('lawyer'); if (x.need === 'pr') run.used.push('spin');
      var dl = apply(c[1]);
      if (x.set && run.flags.indexOf(x.set) < 0) run.flags.push(x.set);
      var chips = STATS.filter(function (s) { return dl[s[0]]; }).map(function (s) { var v = dl[s[0]], good = (v > 0) === (s[0] !== 'n'); return '<span class="' + (good ? 'up' : 'dn') + '">' + ic(s[2], 11) + (v > 0 ? '+' : '') + v + '</span>'; }).join('');
      bubble('is-re', '<p>' + esc(T(c[2])) + '</p>' + (chips ? '<div class="dr-dl">' + chips + '</div>' : ''));
      comments(c[1]);
      meters(dl);
      if (dead()) return;
      if (x.next && x.next.indexOf('END:') === 0) return finish(x.next.slice(4));
      if (run.inter && run.inter.type === 'event') { run.inter = null; run.ev++; return next(true); }
      run.beat++;
      next();
    }
    function dead() { if (run.st.s <= 0) { finish('cancel'); return true; } if (run.st.k <= 0) { finish('bankrut'); return true; } if (run.st.n >= 100) { finish('zalamanie'); return true; } return false; }
    function next(afterEvent) {
      if (run.beat >= 7) return finish(null);
      if (!run.shop && run.beat === 2) { run.inter = { type: 'shop' }; return shop(); }
      if (!afterEvent && run.ev < 2 && run.beat >= 1 && run.beat <= 5 && R() < .38) {
        var used = run.evUsed || (run.evUsed = []), free = EVENTS.map(function (_, i) { return i; }).filter(function (i) { return used.indexOf(i) < 0; });
        var ei = free[Math.floor(R() * free.length)]; used.push(ei); run.inter = { type: 'event', i: ei };
        return show(EVENTS[ei], 'event');
      }
      show(beatNode(), 'beat');
    }
    function finish(id) {
      var e = id ? END(id) : null;
      if (!e) { for (var j = 0; j < FINAL.length; j++) { var x = END(FINAL[j]); if (x[3](run.st, run)) { e = x; break; } } }
      run.done = true; saveRun();
      var d = data(), fresh = d.endings.indexOf(e[1]) < 0; if (fresh) d.endings.push(e[1]);
      if (d.dramaDone.indexOf(run.sc) < 0) d.dramaDone.push(run.sc);
      d.played = (d.played || 0) + 1;
      var st = run.st, ach = [];
      var got = function (k) { if (d.dramaAch.indexOf(k) < 0) { d.dramaAch.push(k); ach.push(k); } };
      got('first'); if (d.dramaDone.length >= SCEN.length) got('all6'); if (d.endings.length >= 10) got('col10'); if (d.endings.length >= ENDS.length) got('col20');
      if (SPECIAL.indexOf(e[0]) >= 0) got('special'); if (st.k >= 95) got('rich'); if (st.h >= 95) got('viral'); if (st.s <= 10 && e[0] !== 'cancel') got('zero'); if (st.n <= 10) got('ice');
      if (run.used.indexOf('lawyer') >= 0) got('lawyer'); if (run.used.indexOf('spin') >= 0) got('spin'); if (run.fol >= 1e6) got('mln');
      H.save(d);
      H.submit('drama', d.endings.length, true); H.xp('drama'); H.played('drama'); endsBox();
      $('#dr-ch').innerHTML = ''; $('#dr-step').textContent = 'Koniec';
      var qb = el.querySelector('[data-act="quit"]'); if (qb) qb.style.display = 'none';
      var ac = ach.map(function (k) { var a = ACH.filter(function (x) { return x[0] === k; })[0]; return '<span>' + ic('check', 12) + a[1] + '</span>'; }).join('');
      bubble('is-end', '<div class="dr-ek">' + tile(e[0], 'end') + '</div><span class="gm-eye">Zakończenie' + (fresh ? ' · nowe!' : '') + (SPECIAL.indexOf(e[0]) >= 0 ? ' · specjalne' : '') + '</span><h2>' + e[1] + '</h2><p>' + esc(T(e[4])) + '</p>' +
        '<div class="dr-fin">' + STATS.map(function (s) { return '<span>' + ic(s[2], 13) + s[1] + ' <b>' + st[s[0]] + '</b></span>'; }).join('') + '<span>' + ic('user', 13) + 'Obserwujący <b>' + fmtFol(run.fol) + '</b></span></div>' +
        (ac ? '<div class="dr-newach"><small>Nowe osiągnięcia</small>' + ac + '</div>' : '') +
        '<p class="dr-sum">Odkryte zakończenia: <b>' + d.endings.length + '/' + ENDS.length + '</b></p><div class="gm-acts"><button type="button" class="btn btn-primary" data-act="again">Nowa afera</button><button type="button" class="btn" data-act="share">Udostępnij</button></div>', false);
      var endName = e[1], scName = SC(run.sc).name, nick = run.nick;
      el.querySelector('[data-act="share"]').onclick = function () { H.share('Drama Simulator na Śliskiej: jako ' + nick + ' wyszedłem z afery „' + scName + '” z zakończeniem „' + endName + '” 💦 (' + d.endings.length + '/' + ENDS.length + ' zakończeń)\n' + H.LINK); };
      try { localStorage.removeItem(RUN_KEY); } catch (er) { /* - */ }
    }

    el.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-kn]'); if (b) { var dd = data(); dd.dramaK = b.dataset.kn; H.save(dd); [].forEach.call(el.querySelectorAll('.dr-wr'), function (x) { x.classList.toggle('is-on', x === b); x.setAttribute('aria-checked', x === b); }); [].forEach.call(el.querySelectorAll('.dr-role'), function (x) { var r2 = ROLE(x.dataset.role), k = x.querySelector('.dr-role-k'); if (k) k.innerHTML = K(myK(r2, dd.dramaK), 'gk'); }); return; }
      b = ev.target.closest('[data-role]'); if (b) { [].forEach.call(el.querySelectorAll('.dr-role'), function (x) { x.classList.toggle('is-on', x === b); x.setAttribute('aria-checked', x === b); }); return; }
      b = ev.target.closest('[data-sc]'); if (b) return begin(b.dataset.sc);
      b = ev.target.closest('[data-crew]'); if (b && !b.disabled) return hire(b.dataset.crew);
      b = ev.target.closest('[data-c]'); if (b) return choose(+b.dataset.c);
      b = ev.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'again') { run = null; pick(); el.scrollIntoView ? window.scrollTo(0, 0) : 0; }
      if (b.dataset.act === 'cont') { run = loadRun(); if (run) { phone(); day(); } }
      if (b.dataset.act === 'quit') { if (confirm('Przerwać aferę? Postęp tej rozgrywki zniknie.')) { try { localStorage.removeItem(RUN_KEY); } catch (er) { /* - */ } run = null; pick(); } }
    });
    endsBox(); pick();
  }
  window.DramaSim = { mount: mount, ENDS: ENDS.length };
})();
