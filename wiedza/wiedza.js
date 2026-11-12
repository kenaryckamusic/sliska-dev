/* Śliska News – „Centrum wiedzy” (#/wiedza): strona tylko dla Właściciela z zasadami całego serwisu. Dane o grach i osiągnięciach czyta na żywo z kodu gier. */
(function () {
  'use strict';
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var tbl = function (head, rows) { return '<div class="wz-scroll"><table class="wz-t"><thead><tr>' + head.map(function (h) { return '<th>' + h + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>'; };
  var sec = function (id, title, body) { return '<section class="wz-s" id="wz-' + id + '"><h2>' + title + '</h2>' + body + '</section>'; };
  var li = function (a) { return '<ul class="wz-l">' + a.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>'; };

  var XP = [
    ['Przeczytany artykuł (do końca)', '3', '25 / dobę', 'czytanie'],
    ['Ukończona gra zręcznościowa', '2–20 (zależy od wyniku, 12 przy progu 3★)', '12 gier z XP / dobę', 'gry'],
    ['Nowy rekord w grze (bonus)', '+10', '6 / dobę', '–'],
    ['Ślizgle (słowo dnia)', '8–25 (1 próba 25, 2: 20, 3: 16, 4: 13, 5: 10, 6: 8)', '1 / dobę', 'gry'],
    ['Krzyżówka tygodnia', '15', '1 / dobę', 'gry'],
    ['Drama Simulator / Redaktor Naczelny', '10', '6 / dobę', 'gry'],
    ['Komentarz', '5', '30 / dobę', 'komentarze'],
    ['Bonus dzienny (pierwsze wejście danego dnia)', '5', '1 / dobę', '–'],
    ['Odsłonięcie Knagi (reveal; po usunięciu gadającej Knagi nieużywane)', '20', 'raz w życiu konta', '–']
  ];
  var LIM = [
    ['Dzień XP', 'liczy się wg czasu Europe/Warsaw (północ w Polsce)'],
    ['Sezon', 'ranking miesięczny; punkty XP zbierają się osobno w każdym miesiącu, łączny XP (poziom) nie resetuje się'],
    ['Maks. XP za jedną grę', '20 (nawet przy rekordowym wyniku); minimum 2'],
    ['Maks. dzienny XP z gier', 'teoretycznie 12 × 20 + 6 × 10 (rekordy) = 300; w praktyce dużo mniej'],
    ['XP gości (niezalogowanych)', 'brak – XP i rekordy liczą się tylko zalogowanym'],
    ['Kto ma XP', 'konta czytelników; konta redakcji (ed:) i goście nie zbierają XP']
  ];
  var GRULES = [
    ['Łap Krople', '20 000', 'pkt'], ['Super Knaga', '5 000', 'pkt'], ['Śliski Wąż', '5 000', 'pkt'], ['Ślizgawka', '200 000', 'm'],
    ['Kręgle', '300', 'pkt'], ['Pojedynek', '5 000', 'pkt'], ['Ratunek', '5 000', 'pkt'], ['Rzut karny', '5 000', 'pkt'],
    ['Układanka', '5 000 (im mniej ruchów, tym lepiej; min. 12 ruchów i 4 s)', 'ruchy']
  ];

  function levels() {
    var L = (window.SnXP && SnXP.LEVELS) || [];
    return tbl(['Level', 'Nazwa', 'Od XP'], L.map(function (l, i) { return [String(i + 1), esc(l[1]), String(l[0])]; }));
  }
  function stars() {
    var S = (window.SliskieGry && SliskieGry.stars) || {}, G = (window.SliskieGry && SliskieGry.games) || [];
    var name = function (id) { var g = G.filter(function (x) { return x.id === id; })[0]; return g ? g.name : id; };
    return tbl(['Gra', '1★', '2★', '3★ (=12 XP)'], Object.keys(S).map(function (id) { return [esc(name(id)), S[id][0], S[id][1], S[id][2]]; }));
  }
  function achs() {
    var A = (window.SliskieGry && SliskieGry.achs) || {}, G = (window.SliskieGry && SliskieGry.games) || [];
    var name = function (id) { if (id === 'meta') return 'Ogólne (cały zestaw gier)'; var g = G.filter(function (x) { return x.id === id; })[0]; return g ? g.name : id; };
    var total = 0, hid = 0, out = '';
    Object.keys(A).forEach(function (id) {
      var h = A[id].filter(function (a) { return a[5]; }).length; total += A[id].length; hid += h;
      out += '<details class="wz-d"' + (h ? ' open' : '') + '><summary><b>' + esc(name(id)) + '</b> <small>' + A[id].length + ' osiągnięć, w tym ' + h + ' ukrytych</small></summary>' +
        tbl(['Osiągnięcie', 'Jak zdobyć', ''], A[id].map(function (a) { return [esc(a[1]), esc(a[2]), a[5] ? '<span class="wz-hid">UKRYTE</span>' : '']; })) + '</details>';
    });
    return '<p>Razem <b>' + total + '</b> osiągnięć, w tym <b>' + hid + '</b> ukrytych (gracze widzą je jako „???”, dopóki ich nie odblokują). Osiągnięcia zapisują się na koncie gracza (tabela <code>game_ach</code>), bez logowania lokalnie w przeglądarce. Nie dają XP.</p>' + out;
  }
  function html() {
    return '<div class="wz"><header class="wz-h"><span class="wz-eye">Tylko dla Właściciela</span><h1>Centrum wiedzy</h1><p>Zasady, limity i sekrety całego serwisu w jednym miejscu. Dane o grach i osiągnięciach są czytane na żywo z kodu, więc zawsze są aktualne.</p></header>' +
      '<nav class="wz-nav">' + [['xp', 'XP i poziomy'], ['gry', 'Gry'], ['osi', 'Osiągnięcia'], ['konta', 'Konta i role'], ['kom', 'Komentarze'], ['push', 'Powiadomienia'], ['studio', 'Studio'], ['lim', 'Limity i zabezpieczenia'], ['tre', 'Treści i reklamy'], ['adr', 'Adresy i wdrażanie']].map(function (x) { return '<a href="#" data-wz="' + x[0] + '">' + x[1] + '</a>'; }).join('') + '</nav>' +
      sec('xp', 'XP, limity i poziomy',
        tbl(['Za co', 'XP', 'Limit', 'Licznik sezonu'], XP.map(function (r) { return r.map(esc); })) +
        '<h3>Ogólne limity</h3>' + tbl(['Zasada', 'Szczegóły'], LIM.map(function (r) { return r.map(esc); })) +
        '<h3>Poziomy (12)</h3>' + levels() +
        '<h3>Progi gwiazdek (od nich zależy XP za grę)</h3>' + stars() +
        '<p class="wz-n">Wzór: XP za grę = zaokrąglone 12 × wynik ÷ próg 3★, w granicach 2–20. Układanka i gry bez progów: stałe 5 XP.</p>') +
      sec('gry', 'Gry: limity wyniku i ochrona przed oszustwami',
        '<p>Rekord i XP przyznaje wyłącznie serwer: gra pobiera bilet startowy, a po końcu wysyła przebieg (wynik w czasie). Serwer odrzuca wynik, który rośnie szybciej niż pozwala gra, jest za krótki albo przekracza maksimum.</p>' +
        tbl(['Gra', 'Maks. wynik', 'Jednostka'], GRULES.map(function (r) { return r.map(esc); })) +
        li(['<b>Ślizgle</b>: 1 słowo dziennie, 6 prób; długość słowa 4–7 liter; wynik = 7 − liczba prób; tryb treningowy nie liczy się.', '<b>Krzyżówka tygodnia</b>: nowa w poniedziałek, hasło tygodnia; archiwum nie daje XP.', '<b>Układanka</b>: do rankingu liczy się tylko 4×4; mieszanie to losowy spacer (zawsze rozwiązywalna).', '<b>Drama Simulator</b>: 9 dram, 81 zakończeń; <b>Redaktor Naczelny</b> i <b>Gabin</b> są tylko na dev (Gabin tylko dla Ciebie).', '<b>Gumka</b>: bonus ochronny w Super Knadze, Łap Krople i Ślizgawce (pęka zamiast Ciebie).'])) +
      sec('osi', 'Osiągnięcia (także ukryte)', achs()) +
      sec('konta', 'Konta, sesje i role',
        li(['<b>Logowanie</b>: własne (Worker + baza Neon). Token ważny 60 dni, odnawia się sam przy użyciu; twardy limit sesji 1 rok od zalogowania. „Wyloguj ze wszystkich urządzeń” działa od razu.', '<b>Przełączanie kont</b>: do 8 zapamiętanych kont na urządzeniu, okienko przy ikonie konta.', '<b>Nazwa użytkownika</b>: 3–20 znaków (Ty do 100), małe litery, cyfry, „.” i „_”; zmiana raz na 30 dni (Ty bez limitu).', '<b>Role</b>: Właściciel, Redaktor naczelny, Redaktor, Moderator (korona). Redaktor/naczelny/właściciel może ukryć swoją plakietkę w ustawieniach konta.', '<b>Dev i news są rozdzielone</b>: osobne adresy = osobne logowania, możesz być na innym koncie na każdej stronie.'])) +
      sec('kom', 'Komentarze',
        li(['Długość: 600 znaków (Ty 20 000, bez cenzury).', 'Edycja własnego komentarza: do 5 minut (Ty zawsze).', 'Tryb wolniejszej dyskusji: odstęp 0 / 30 / 60 / 300 s (ustawia właściciel).', 'Zgłoszenia i moderacja: komentarz może czekać na zatwierdzenie, być zgłoszony lub ukryty; goście piszą jako „Niezmoczona #…”.'])) +
      sec('push', 'Powiadomienia push',
        li(['Nowy artykuł i nowinka: ping do wszystkich urządzeń z włączonymi powiadomieniami (ok. 15 s po publikacji).', '<b>Dev + konto właściciela</b>: nie dostajesz pingów o artykułach i nowinkach, tylko powiadomienia redakcyjne.', 'Powiadomienia redakcyjne: zgłoszony temat/błąd (tylko Ty), reklamy, poczta, odpowiedzi na komentarze (każdy użytkownik).', 'Urządzenia z dev oznacza kolumna <code>push_subs.dev</code> (ustawiana przy włączeniu powiadomień).'])) +
      sec('studio', 'Studio i artykuły',
        li(['Zapis artykułu z konta właściciela otwiera okno wyboru redaktora (lista istniejących + „+” nowy bez konta). Autor to zwykły tekst na artykule; nowy redaktor dostaje notkę „Redaktor Śliska News.”.', 'Recenzja: ocena 0–10, okładka (jak zdjęcie główne albo własna), tagi małymi literami bez spacji i polskich znaków na końcu.', 'Tylko jeden artykuł może być Tematem dnia.'])) +
      sec('lim', 'Limity zapytań i zabezpieczenia',
        '<p>Liczniki liczą się na godzinę (zegar serwera), osobno dla sieci/adresu IP lub konta. Po przekroczeniu serwer odpowiada „rate” i strona pokazuje komunikat.</p>' +
        tbl(['Akcja', 'Limit'], [['Komentarze (zalogowany)', '20 / h (gość 6 / h; Ty bez limitu)'], ['Głosy w recenzjach', '40 / h z jednej sieci'], ['Zgłoszenie tematu', '5 / h z jednej sieci i 80 / h łącznie'], ['Zgłoszenie reklamy (spot)', '3 / h z jednej sieci i 40 / h łącznie'], ['Logowanie', '30 / h z jednego IP, 10 / h na jeden e-mail'], ['Rejestracja', '5 / h i 12 / dobę z jednej sieci'], ['Reset hasła (mail)', '3 / h na jeden adres e-mail'], ['Zmiana nazwy / wejście nazwą', '20 / h z sieci, 10 / h na jedną nazwę'], ['Start gry (bilet)', '400 / h na konto'], ['XP: zapytania o nagrodę', '120 / h']].map(function (r) { return r.map(esc); })) +
        li(['<b>Captcha</b>: Cloudflare Turnstile przy logowaniu, rejestracji i resecie hasła (gdy skonfigurowany sekret; awaria Cloudflare nie blokuje strony).', '<b>CORS</b>: API odpowiada tylko stronom news.sliska.pl i dev.sliska.pl.', '<b>Rekordy gier</b>: tylko z serwera (bilet startowy + kontrola przebiegu wyniku w czasie).', '<b>Ochrona komentarzy</b>: cenzura wulgaryzmów (Ty bez cenzury), zgłoszenia, ukrywanie, bany użytkowników, zarezerwowane nazwy.', '<b>Sesje</b>: podpisane tokeny (HS256), „wyloguj ze wszystkich urządzeń” unieważnia starsze.'])) +
      sec('tre', 'Treści, zgłoszenia i reklamy',
        li(['<b>Zgłoś temat</b> (#/zglos): zgłoszenie trafia do Ciebie jako powiadomienie i do panelu zgłoszeń; ma własny podgląd linku (zglos.html).', '<b>Reklamy</b>: wysyłają je zainteresowani przez „Wyślij reklamę” (#/spot); to „Miejsca na reklamę” plus grafiki reklamowe; zgłoszenia moderujesz w panelu Reklamy.', '<b>Recenzje</b>: ocena 0–10 (np. 6,4), okładka i winyl dopasowany kolorem do okładki; czytelnicy mogą głosować na ocenę na dole artykułu; recenzja jest na górze artykułu.', '<b>Nowinki</b> (szybkie newsy) nie wchodzą do listy redaktorów i mają własne powiadomienia.', '<b>Instagram i X</b>: grafiki generuje kod (PNG), Studio przygotowuje opis posta; podgląd linku (OG) robi Worker.', '<b>Wersje robocze</b>: Studio zapisuje je w chmurze i w przeglądarce; artykuł można zaplanować na przyszłą datę (publikuje się sam).', '<b>Udostępnianie wyniku gry</b>: grafika 9:16 (relacja) lub 4:5 (post) z prawdziwym logo.'])) +
      sec('adr', 'Adresy i wdrażanie',
        li(['<b>news.sliska.pl</b> – wersja publiczna (repo sliska-news), <b>dev.sliska.pl</b> – wersja testowa (repo sliska-dev), <b>api.sliska.pl</b> – Worker Cloudflare „sliska-og”.', 'Zmiany idą na dev automatycznie, na public dopiero po Twoim „wrzuć na public”.', 'Worker wdrażasz ręcznie: Cloudflare → Workers &amp; Pages → sliska-og → Edit code → wklej → Deploy.', 'Baza: Neon (konta, XP, rekordy, osiągnięcia, powiadomienia) + D1 (reszta: reklamy, obrazy, liczniki). Nowe kolumny w Neonie dodaje się w NEON_SCHEMA – samo ALTER w kodzie jest tam pomijane.', 'Wersje stron mają numer w adresach plików (?v=…) i w service workerze (sw.js); po wdrożeniu odśwież z Cmd+Shift+R.', 'Dokumentacja serwisu: plik SLISKA_docs_N.zip (PDF + TXT + HTML) dostajesz po każdej zmianie.'])) +
      '</div>';
  }
  function render(el) {
    el.innerHTML = html();
    el.querySelector('.wz-nav').addEventListener('click', function (e) { var a = e.target.closest('[data-wz]'); if (!a) return; e.preventDefault(); var t = el.querySelector('#wz-' + a.dataset.wz); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  }
  window.Wiedza = { render: render };
})();
