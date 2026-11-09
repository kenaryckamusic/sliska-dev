/* GABIN – odcinek 1 „Zły numer” (wersja rozszerzona, 12 scen). Gra-thriller w czacie.
 * TYLKO DLA WŁAŚCICIELA (dev.sliska.pl): nie kopiować do wersji publicznej.
 * Bohaterką jest zawsze kobieta. Wszystkie postacie i wydarzenia są wymyślone. Treści 18+ (przemoc, wulgaryzmy). */
(function () {
  'use strict';
  var KEY = 'sn-gabin', VER = 3;
  var SRC = (document.currentScript && document.currentScript.src) || '';
  var BASE = SRC ? SRC.replace(/[^\/]*$/, '') : '';
  var IMV = '?v=1';
  var owner = function () { return !!window.__GABIN_TEST || (document.documentElement.classList.contains('is-dev') && typeof isOwnerRole === 'function' && isOwnerRole()); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var ls = { get: function () { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }, set: function (o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* - */ } } };
  var url = function (f) { return BASE + 'gabin/' + f + '.jpg' + IMV; };

  /* ---------- postacie ---------- */
  var CH = {
    z: { n: 'Nieznany numer', col: '#8b93a7', i: '?' },
    g: { n: 'Gabin 🌲 ekipa', col: '#5eead4', i: '🌲', grp: 1 },
    zen: { n: 'Zenobia Rozpalska', col: '#ff9fb7', av: 'av_z' },
    lola: { n: 'Lola Mokrzycka', col: '#ff7ab8', av: 'av_l' },
    mar: { n: 'Mariola Pieprzna', col: '#ff9a3c', av: 'av_m' },
    pat: { n: 'Patryk Szeptun', col: '#4cc2ff', av: 'av_p' },
    kik: { n: 'Kiki Rozbierańska', col: '#ffd84a', av: 'av_k' },
    cyr: { n: 'Cyryl Podniecki', col: '#a9b6d6', av: 'av_c' },
    hor: { n: 'Hortensja Biczyk', col: '#b69cff', av: 'av_h' },
    ign: { n: 'Ignacy Zaspokajski', col: '#d6b86a', i: 'I' },
    cis: { n: 'Cisza', col: '#ff4d57', av: 'av_cisza' }
  };
  var TRUST = ['zen', 'lola', 'mar', 'pat', 'kik', 'cyr', 'hor'];
  var SHORT = { zen: 'Zenobia', lola: 'Lola', mar: 'Mariola', pat: 'Patryk', kik: 'Kiki', cyr: 'Cyryl', hor: 'Hortensja' };

  /* ---------- zdjęcia i dowody ---------- */
  var IM = {
    f1: { e: 'F01', t: 'Pinezka: Młyn Kruszewskich', k: 'screen' }, f2: { e: 'F02', t: 'Live Kiki, 22:41' }, f3: { e: 'F03', t: 'Parking, 22:28' },
    f4: { e: 'F04', t: 'Zenobia z Mruczkiem' }, f5: { e: 'F05', t: 'SMS z 22:31', k: 'screen' }, f6a: { e: 'F06', t: 'Kamera w barze, 22:16' },
    f6b: { e: 'F06b', t: 'Kamera w barze, 22:18' }, f6c: { e: 'F06c', t: 'Kamera w barze, 22:20' }, f7: { e: 'F07', t: 'Zaplecze apteki, 22:09' },
    f8: { e: 'F08', t: 'Rachunek, 22:08' }, f9: { e: 'F09', t: 'Pomost, bal 2016' }, f10: { e: 'F10', t: 'Lista milczenia' },
    f11: { e: 'F11', t: 'Wiadomość głosowa do matki', k: 'screen' }, f12: { e: 'F12', t: 'Młyn Kruszewskich' }, f13: { e: 'F13', t: 'Wnętrze młyna, 23:09' },
    f14: { e: 'F14', t: 'Auto Zenobii pod barem' }, f15: { e: 'F15', t: 'Szatnia w barze' }, f17: { e: 'F17', t: 'Zdjęcie od Ciszy, 02:09' },
    f18: { e: 'F18', t: 'Kontakt „Nieznany (kuzyn?)”', k: 'screen' }, f2z: { t: 'Zbliżenie: brelok' }, f3z: { t: 'Zbliżenie: różowa kurtka' }, f4z: { t: 'Zbliżenie: karteczka na lodówce' }, f16: { t: 'Pod Rybą' }
  };
  var EVORDER = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6a', 'f6b', 'f6c', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12', 'f13', 'f14', 'f15', 'f17', 'f18'];

  /* ---------- scenariusz ---------- */
  var M = function (c, w) { var t = [].slice.call(arguments, 2); return t.map(function (x) { return ['m', c, w, x]; }); };
  var cat = function () { return [].concat.apply([], arguments); };
  var SC = [];
  var G = 'g';

  /* SCENA 1 */
  SC.push({ id: 's1', t: '23:12', card: ['23:12', 'Sobota, 8 listopada', 'Wiadomość z nieznanego numeru'], steps: cat(
    [['s', 'z', 'Wiadomość od niezapisanego numeru'], ['p', 500]],
    M('z', 'z', 'halo', 'jest tam ktoś?? błagam', 'proszę odpisz mi natychmiast'),
    [['ch', 'z', [
      ['Kto mówi? Pomyłka.', {}, M('z', 'z', 'uff... dzięki bogu. nie wiem kim jesteś, ale odpisałaś. to już coś')],
      ['Spokojnie, co się dzieje? O co chodzi?', { zen: 1 }, M('z', 'z', 'nie umiem spokojnie przepraszam... trzęsą mi się ręce tak że ledwo trafiam w klawisze', 'mam 4% baterii i ktoś tu kurwa jest')],
      ['Zablokuję ten numer. Kim jesteś i skąd masz mój numer?', { zen: -1 }, M('z', 'z', 'nie blokuj błagam cię na wszystko! nie mam nikogo innego!')]
    ]]],
    M('z', 'z', 'dobra. słuchaj, nie mamy czasu na wstępy', 'wpisałam zły numer. albo losowy. nie znam cię. ale nie mam do kogo napisać', 'jestem w gabinie. stary młyn kruszewskich za cmentarzem, nad rzeką', 'ktoś wszedł do środka. słyszałam jak skrzypnęły dolne drzwi i ciężkie kroki na deskach', 'idzie na górę...'),
    [['ch', 'z', [
      ['Natychmiast dzwonię na policję pod 112.', { zen: -1 }, M('z', 'z', 'NIE! BŁAGAM CIĘ TYLKO NIE POLICJA!', 'nie rozumiesz... w tym mieście policja nie pomoże. jedyny dzielnicowy siedzi w kieszeni u ignacego', 'jeśli zadzwonisz, ten ktoś na dole dowie się pierwszy')],
      ['Ukryj się, wygaś ekran i powiedz, po co tam poszłaś.', { zen: 1 }, M('z', 'z', 'schowałam się za starym zsypem na mąkę... jest tu ciemno jak w grobie', 'poszłam tu bo dostałam wiadomość. kazali mi przynieść dokumenty z archiwum')],
      ['Podeślij mi szybko swoją lokalizację z GPS!', { zen: 1 }, cat(M('z', 'z', 'wysyłam pinezkę, nie wiem czy złapie zasięg...'), [['img', 'z', 'z', 'f1', '23:12 · bateria 4%'], ['clue', 'pinezka', 'Pinezka: Młyn Kruszewskich', 'Zenobia wysłała lokalizację: Młyn Kruszewskich nad rzeką, tuż obok cmentarza. Bateria 4%, zasięg EDGE.']])]
    ]]],
    M('z', 'z', 'słuchaj uważnie, bo zaraz padnie mi telefon', 'zrobiłam coś szalonego. dodałam twój numer do naszej grupy na komunikatorze: „Gabin ekipa”', 'to moi znajomi z miasta. napisz im, że jesteś kuzynką patryka z warszawy. patryk załapie, że coś jest nie tak i ci pomoże, reszta nie może się zorientować', 'i najważniejsze: NIKOMU nie mów, że jestem w młynie. ani loli, ani cyrylowi. nikomu z nich nie ufaj do końca', 'słyszę oddech na schodach...'),
    [['ch', 'z', [
      ['Obiecuję. Będę milczeć i ci pomogę.', { zen: 2 }, [['fl', 'obiecano_milczenie', 1]]],
      ['Dlaczego miałabym kłamać dla obcej osoby?', {}, M('z', 'z', 'bo stawką jest moje pieprzone życie... proszę cię')],
      ['Skąd wiesz, że nie jestem jedną z nich?', {}, M('z', 'z', 'bo twój numer był ostatni w moim telefonie... przypadek? nie wiem. muszę wierzyć że tak')]
    ]]],
    M('z', 'z', '1%... gaszę ekran', 'dzięki że odpisałaś. kimkolwiek jesteś...'),
    [['s', 'z', 'Użytkownik rozłączony · urządzenie offline'],
     ['clue', 'mlyn', 'Młyn nad rzeką', 'Zenobia jest uwięziona w młynie. Mam unikać policji i przed ekipą udawać kuzynkę Patryka z Warszawy.'], ['p', 900]]
  ) });

  /* SCENA 2 */
  SC.push({ id: 's2', t: '23:19', card: ['23:19', 'Czat grupowy', 'Gabin 🌲 ekipa'], steps: cat(
    [['ren', 'z', 'Zenobia (offline)', 'av_z'], ['s', G, 'Zenobia dodała Cię do grupy „Gabin 🌲 ekipa”'], ['p', 700]],
    M(G, 'kik', 'kto to do cholery jest??', 'zeni oszalałaś dodajesz randomów w środku nocy? xd'),
    M(G, 'mar', 'co to za numer?', 'kim jesteś człowieku i co tu robisz'),
    M(G, 'lola', 'zeni gdzie ty jesteś?! błagam odezwij się, od godziny nie odbierasz połączeń 😭😭😭'),
    M(G, 'cyr', 'Spokojnie, bez paniki. Proszę o zachowanie spokoju na forum.'),
    M(G, 'hor', 'Kto jest administratorem i kto autoryzował ten numer?'),
    [['ch', G, [
      ['Cześć wszystkim. Jestem kuzynką Patryka z Warszawy, Zenobia mnie dodała.', {}, cat([['fl', 'kuzyn', 1]],
        M(G, 'pat', '...', 'ta. moja kuzynka. przyjechała późnym wieczorem'),
        M(G, 'kik', 'patryk ty masz jakąkolwiek rodzinę poza serwerownią?? 😂'),
        M(G, 'mar', 'dobra, to cześć kuzynko {nick}. co jest z zenobią?'))],
      ['Dostałam przed chwilą dramatyczną wiadomość od Zenobii. Potrzebuje pomocy.', { lola: 1, mar: 1, cyr: -2 }, cat([['fl', 'prawda', 1]],
        M(G, 'lola', 'O MÓJ BOŻE WIEDZIAŁAM!! co napisała?! gdzie ona jest?!'),
        M(G, 'cyr', 'Zaraz, zaraz. Proszę nie siać niepotrzebnej histerii. Jaka pomoc? Co to za bzdury?'),
        M(G, 'hor', 'Proszę o dokładną treść wiadomości oraz znacznik czasowy.'),
        M(G, 'mar', 'dziewczyno, gadaj konkretnie bo zaraz wsiadam w auto'))],
      ['Nie znam żadnej Zenobii. Jakaś dziewczyna napisała do mnie z prośbą o ratunek.', { hor: 1, lola: -1 }, cat([['fl', 'nieznajoma', 1]],
        M(G, 'hor', 'Brzmi jak typowy trolling lub próba phishingu. Pokaż logi.'),
        M(G, 'lola', 'zeni by sobie nie żartowała w ten sposób!'))]
    ]]],
    [['p', 600]],
    M(G, 'lola', 'słuchajcie... rozstałam się z nią o 22:30 na parkingu przed barem. mówiła że ma migrenę i jedzie prosto do łóżka'),
    M(G, 'mar', 'gówno prawda, mi o 22:20 powiedziała że idzie zapalić za budynek i tyle ją widziałam'),
    M(G, 'kik', 'halo ja mam ją na nagraniu z live o 22:41!! stała pod latarnią z jakimś kolesiem w kapturze i wcale nie wyglądała na chorą!'),
    M(G, 'cyr', 'Ja opuściłem lokal o 21:30 po spotkaniu biznesowym z panem Zaspokajskim. Nie widziałem Zenobii później.'),
    M(G, 'hor', 'Około 22:00 przyszła do apteki. Dałam jej silny lek przeciwbólowy. Była roztrzęsiona, myślałam że pokłóciła się z Cyrylem.'),
    M(G, 'cyr', 'Hortensjo, czy mogłabyś powstrzymać się od snucia publicznych domysłów?'),
    M(G, 'hor', 'Stwierdzam fakty, Cyrylu.'),
    M(G, 'pat', 'weryfikuję logi jej stacji bazowej. coś jest nie tak'),
    M(G, 'lola', 'dzwońmy po komendanta! natychmiast!'),
    M(G, 'cyr', 'Poczekajmy do rana. Zenobia ma tendencję do teatralnych ucieczek, gdy czuje przytłoczenie. Jeśli zrobimy raban, zaszkodzimy jej w urzędzie.'),
    M(G, 'mar', 'cyryl, zamknij się. ona nigdy nie wyłączała telefonu na noc'),
    [['clue', 'os', 'Kto, gdzie i kiedy', '21:30 Cyryl wychodzi od stolika z Ignacym · 22:00 Hortensja widzi Zenobię w aptece · 22:20 Mariola: „poszła zapalić za bar” · 22:30 Lola: „jedzie do domu” · 22:41 Kiki ma ją na live pod latarnią z mężczyzną w kapturze.'], ['p', 700]]
  ) });

  /* SCENA 3: wątki prywatne */
  var DM_LOLA = cat(
    M('lola', 'lola', 'hej... to ty jesteś tą kuzynką pata?', 'przepraszam że ci zawracam głowę na priv ale zaraz dostanę zawału serca 🥺', 'zeni to moja najbliższa osoba. ona przed wyjściem z baru zachowywała się jak obłąkana'),
    [['ch', 'lola', [
      ['Opowiedz mi o parkingu. Wszystko, co pamiętasz.', { lola: 1 }, M('lola', 'lola', 'dobra. dobra. spróbuję po kolei')],
      ['Czemu nie poszłaś za nią?', { lola: -1 }, M('lola', 'lola', 'bo jestem głupia i wiem to. nie musisz mi tego mówić 😭', 'ale powiem ci wszystko, co widziałam')]
    ]]],
    M('lola', 'lola', 'stałyśmy przy jej aucie o 22:28. nagle dostała smsa. spojrzała na ekran i dosłownie zsiniała', 'powiedziała: „muszę to skończyć”. myślałam że chodzi o cyryla!', 'ale jej auto... jej opel stoi nadal na parkingu pod „Pod Rybą”. widzę go z balkonu mojego salonu! ona poszła pieszo!', 'mam zdjęcie zrobione minutę wcześniej, wysyłam ci...'),
    [['img', 'lola', 'lola', 'f3', 'Parking, 22:28']],
    [['hunt', 'lola', 'f3', { x: 0.169, y: 0.46, r: 0.07, z: 'f3z' },
      cat([['clue', 'kurtka_z', 'Zenobia idzie w stronę mostu', 'Na zdjęciu Loli z 22:28, w głębi, przy balustradzie, odchodzi sama osoba w różowej kurtce. To Zenobia. Idzie w stronę mostu.']], M('lola', 'lola', 'o boże. ty to zauważyłaś. dopiero teraz to widzę', 'tam jest zeni. idzie sama w stronę mostu'), [['tr', { lola: 1 }]]),
      cat(M('lola', 'lola', 'zobacz po lewej. tam, przy barierce. ta różowa kurtka to zeni'), [['clue', 'kurtka_z', 'Zenobia idzie w stronę mostu', 'Na zdjęciu Loli z 22:28, w głębi, przy balustradzie, odchodzi sama osoba w różowej kurtce. To Zenobia. Idzie w stronę mostu.']])]],
    M('lola', 'lola', 'przepraszam że tyle ci mówię', 'po prostu muszę z kimś pogadać. tobie jakoś ufam 🙈'),
    [['ch', 'lola', [
      ['Zrobimy wszystko, żeby ją znaleźć. Obiecuję.', { lola: 1 }, M('lola', 'lola', 'dziękuję 🥺', 'proszę nie rób tego jak cyryl. on tylko mówi „spokojnie”')],
      ['Skup się. Emocje później.', { lola: -1 }, M('lola', 'lola', 'ostra jesteś', 'ale okej. masz rację')]
    ]]]
  );
  var DM_MAR = cat(
    M('mar', 'mar', 'dobra warszawianko, na bok te gierki', 'powiedz mi prosto w twarz co jest grane, bo znam ten lokal od podszewki i wiem kiedy śmierdzi trupem'),
    [['ch', 'mar', [
      ['Zenobia napisała do mnie z młyna nad rzeką. Boi się o życie.', { mar: 2 }, cat(
        [['if', 'obiecano_milczenie', [['tr', { zen: -1 }], ['fl', 'zlamana_obietnica', 1]], []], ['fl', 'mar_wie', 1]],
        M('mar', 'mar', 'kurwa. młyn?', 'dobra. ani słowa nikomu. ja też milczę. dzięki że powiedziałaś'))],
      ['Nie mogę ci wszystkiego powiedzieć. Zaufaj mi.', { mar: 0 }, M('mar', 'mar', 'zaufać? obcej? hm', 'dobra. ale mam cię na oku')],
      ['Kiedy widziałaś ją ostatni raz?', { mar: 1 }, M('mar', 'mar', 'o 22:20. spytałam czemu blada. powiedziała że idzie zapalić za bar')]
    ]]],
    M('mar', 'mar', 'o 22:18 do baru wszedł facet w czarnej kurtce. nie z gabina. pytał o zenobię, czy jest na sali. kazałam mu spierdalać', 'czekaj, monter kamer zostawił w piątek otwarty panel zdalny. mogę zrzucić klatki na serwer'),
    [['img', 'mar', 'mar', 'f6a', 'Kamera nad wejściem, 22:16'], ['img', 'mar', 'mar', 'f6b', 'Kamera nad wejściem, 22:18'], ['img', 'mar', 'mar', 'f6c', 'Kamera nad wejściem, 22:20']],
    M('mar', 'mar', 'o kurwa... złoty brelok cyryla z kampanii wyborczej. co ten gnojek kombinuje?', 'a jeszcze patrz. mieszkam nad barem. wyjrzałam przez okno na parking'),
    [['img', 'mar', 'mar', 'f14', 'Auto Zenobii, widok z okna Marioli']],
    M('mar', 'mar', 'kartka za wycieraczką. „PRZEPRASZAM”. za co ona przepraszała?'),
    [['clue', 'cctv', 'Mężczyzna z brelokiem „C”', 'Kamera w barze: około 22:18 mężczyzna w czarnej kurtce pytał o Zenobię. W ręku miał kluczyki ze złotym brelokiem z literą „C” (taki rozdawał Cyryl w kampanii). O 22:20 wyszedł tylnymi drzwiami.'],
     ['clue', 'przepraszam', 'Karteczka „PRZEPRASZAM”', 'Za wycieraczką auta Zenobii, które stoi pod barem, tkwi zmięta kartka z napisem „PRZEPRASZAM”.']],
    [['ch', 'mar', [
      ['Brelok ma Cyryl. Może jest w to zamieszany.', { mar: 1, cyr: -1 }, M('mar', 'mar', 'też tak myślę. ale nie mówimy jeszcze nikomu')],
      ['Za wcześnie na wnioski. Pół miasta ma te breloki.', { mar: 0, cyr: 1 }, M('mar', 'mar', 'bronisz go? hm. okej. zobaczymy')]
    ]]]
  );
  var DM_PAT = cat(
    M('pat', 'pat', 'nie mam kuzynki w warszawie', 'jedyny mój wujek zmarł dziesięć lat temu'),
    [['ch', 'pat', [
      ['Wiem. Nie jestem twoją kuzynką.', { pat: 1 }, M('pat', 'pat', 'dobrze że to mówisz', 'kimkolwiek jesteś – zeni ci zaufała, więc ja też zaryzykuję')],
      ['Zenobia kazała mi tak napisać. Pomożesz?', { pat: 1 }, M('pat', 'pat', 'to w jej stylu...', 'kimkolwiek jesteś – zeni ci zaufała, więc ja też zaryzykuję')]
    ]]],
    M('pat', 'pat', 'jej telefon logował się o 23:14 do stacji BTS przy starym młynie. potem całkowity zgon sygnału', 'zeni ma kopię zapasową w chmurze na serwerze miejskim. zabezpieczyła ją 4-cyfrowym pinem. musimy tam wejść', 'mam jej zdjęcie z kotem z pamięci telefonu, może coś podpowie...'),
    [['img', 'pat', 'pat', 'f4', 'Zenobia z Mruczkiem'], ['pin', '1402', 'pat']],
    M('pat', 'pat', 'weszliśmy. pobieram pliki: stare zdjęcie z balu 2016 z pomostu, notatka z inicjałami dygnitarzy miejskich i nagranie głosowe do matki', 'to gruba afera'),
    [['img', 'pat', 'pat', 'f9', 'Pomost, bal maturalny 2016'], ['img', 'pat', 'pat', 'f10', 'Lista milczenia'], ['img', 'pat', 'pat', 'f11', 'Wiadomość głosowa do matki']],
    [['clue', 'pomost', 'Pomost, bal 2016', 'Zdjęcie z pomostu z balu maturalnego 2016. Na słupie wycięte „J+?” i data 14.06. Chodzi o noc, w którą utonął Julek.'],
     ['clue', 'lista', 'Lista milczenia', 'Notatka Zenobii: C.P. (skreślone), H.B., I.Z. (podwójnie zakreślone), L.M., R.K. i znak zapytania. Dopisek: „wszyscy tam byli”.'],
     ['clue', 'matka', 'Nagranie do matki', 'Zenobia: „Mamo, jak coś się stanie, to klucz jest pod kamieniem koło furtki. Nie wierz w to, co powiedzą w telewizji. Kocham cię.” (Cyryl miał wystąpić w telewizji.)']],
    [['ch', 'pat', [
      ['Kto to jest „I.Z.”? Podwójnie zakreślone.', { pat: 1 }, M('pat', 'pat', 'ignacy zaspokajski. wiadomo', 'ale zastanawia mnie ten znak zapytania na dole...')],
      ['C.P. skreślone. Czyli Cyryl nie jest już podejrzany?', { pat: 0 }, M('pat', 'pat', 'albo skreślone „załatwione”. albo skreślone „nieistotne”. nie wiem')]
    ]]]
  );
  var DM_KIK = cat(
    M('kik', 'kik', 'hej słoneczko 😍', 'słuchaj, ja wiem że sytuacja jest gęsta, ale musisz zobaczyć mój zapis z live', 'o 22:41 kręciłam vloga pod barem. w tle stoi zeni. gada z kolesiem w czarnej kurtce'),
    [['img', 'kik', 'kik', 'f2', '● LIVE · kiki.dymek · 22:41']],
    [['hunt', 'kik', 'f2', { x: 0.551, y: 0.888, r: 0.075, z: 'f2z' },
      cat([['clue', 'brelok', 'Brelok z literą „C”', 'W kieszeni mężczyzny z live (22:41) wisi złoty brelok z literą „C”.']], M('kik', 'kik', 'CO?? ten złoty wisiorek?? zaraz...', 'serio zauważyłaś to od razu? jesteś lepsza niż moi obserwatorzy 😍'), [['tr', { kik: 1 }]]),
      M('kik', 'kik', 'może ty jeszcze coś zobaczysz jak się wpatrzysz dłużej xd')]],
    M('kik', 'kik', 'a wiesz co jest najdziwniejsze? mam jeszcze przebitkę z 22:09 jak szłam do żabki obok apteki hortensji. na zapleczu stała fura cyryla!'),
    [['img', 'kik', 'kik', 'f7', 'Zaplecze apteki, 22:09'],
     ['clue', 'apteka', 'Auto Cyryla za apteką', 'O 22:09 na zapleczu apteki stoi ciemnogranatowy sedan z naklejką „Podniecki 2026”. W szparze drzwi widać dwa złączone cienie.']],
    [['ch', 'kik', [
      ['Wyślij mi to w oryginale i nikomu więcej.', { kik: 1 }, M('kik', 'kik', 'dobra dobra. tylko tobie 🤐', 'ale jak się wyda, że to ode mnie, to ty mnie bronisz')],
      ['Pokazałaś to jeszcze komuś?', { kik: 0 }, M('kik', 'kik', 'nie. ale mam tam jakieś 2k oglądających. xd', 'spokojnie, już wyłączyłam')]
    ]]]
  );
  var DM_CYR = cat(
    M('cyr', 'cyr', 'Witam serdecznie. Piszę prywatnie, licząc na Pani dyskrecję i dojrzałość.', 'Gabin to małe miasto pełne zawiści. Jako kandydat na burmistrza jestem celem licznych prowokacji.'),
    [['ch', 'cyr', [
      ['Dlaczego pisze pan akurat do mnie?', { cyr: 0 }, M('cyr', 'cyr', 'Bo jest Pani nowa w tej grupie i nie ma Pani uprzedzeń.')],
      ['Zenobia jest zaginiona. Wolałabym, żeby pan mówił do rzeczy.', { cyr: -1 }, M('cyr', 'cyr', 'Rozumiem emocje. Przejdę zatem do rzeczy.')]
    ]]],
    M('cyr', 'cyr', 'Twierdzenia, jakobym przebywał w barze po 22:00, są kłamstwem.', 'Posiadam opłacony rachunek z godziny 22:08.'),
    [['img', 'cyr', 'cyr', 'f8', 'Rachunek z 22:08'],
     ['clue', 'rachunek', 'Rachunek Cyryla, 22:08', 'Rachunek z baru: 2x Glenfiddich 12YO + woda, 84 zł, godzina 22:08, podpis Marioli. Cyryl twierdził, że wyszedł o 21:30. Ignacy podobno zostawił stolik o 22:00. Coś się nie zgadza.']],
    M('cyr', 'cyr', 'Jeśli Zenobia ma kłopoty, należy powiadomić odpowiednie służby rano, bez angażowania mediów i plotkarzy pokroju Kornelii.'),
    [['ch', 'cyr', [
      ['Rozumiem. Zadzwonimy rano, jeśli się nie odezwie.', { cyr: 1 }, M('cyr', 'cyr', 'Dziękuję. To rozsądne stanowisko.')],
      ['A co z Hortensją? Kiki widziała pański samochód na zapleczu apteki.', { cyr: -2, hor: 0 }, M('cyr', 'cyr', 'Proszę nie powtarzać plotek.', 'Nie mamy już o czym rozmawiać.')]
    ]]]
  );
  SC.push({ id: 's3', t: '23:41', card: ['23:41', 'Rozmowy prywatne', 'Każdy ma swoją wersję. Wysłuchaj ich wszystkich.'], steps: cat(
    [['s', G, 'Prywatne wiadomości: odpowiedz każdej osobie, w dowolnej kolejności'], ['p', 500]],
    [['hub', 5, [
      ['Lola', 'lola', DM_LOLA],
      ['Mariola', 'mar', DM_MAR],
      ['Patryk', 'pat', DM_PAT],
      ['Kiki', 'kik', DM_KIK],
      ['Cyryl', 'cyr', DM_CYR]
    ]]]
  ) });

  /* SCENA 4 */
  SC.push({ id: 's4', t: '00:35', card: ['00:35', 'Niedziela, 9 listopada', 'Awantura na czacie grupowym'], steps: cat(
    [['s', G, 'Napięcie w grupie rośnie'], ['p', 500]],
    M(G, 'mar', 'dzwoniłam do ignacego. stary chuj nie odbiera'),
    M(G, 'cyr', 'Pan Zaspokajski jest człowiekiem starszym i schorowanym, ma prawo spać w nocy!'),
    M(G, 'mar', 'ignacy nigdy nie śpi o tej porze, zwłaszcza gdy po mieście kręci się jego goryl rudolf'),
    M(G, 'lola', 'jaki rudolf?! mariola o czym ty mówisz? 😭'),
    M(G, 'kik', 'omg czy ignacy ma coś wspólnego z zaginięciem zeni??'),
    M(G, 'hor', 'Przestańcie rzucać pomówienia w przestrzeni publicznej. To podlega pod kodeks karny.'),
    M(G, 'mar', 'a ty hortensja tak go nie broń, bo wszyscy wiemy czyj samochód stał na twoim zapleczu o 22:09!'),
    M(G, 'cyr', 'Dość tego! Wypraszam sobie insynuacje!'),
    [['ch', G, [
      ['Spokój! Kłótnia nam nie pomoże. Zajmijmy się faktami.', { pat: 1, hor: 1 }, M(G, 'pat', 'zgoda.'), M(G, 'hor', 'Rozsądnie.'), M(G, 'mar', 'dobra. dobra.')],
      ['Hortensjo, jeśli coś wiesz, to powiedz.', { mar: 1, hor: -1 }, M(G, 'hor', 'Nie będę tego komentować w grupie.'), M(G, 'mar', 'masz rację dziewczyno, niech gada'), M(G, 'cyr', 'Nie ma tu nic do komentowania!')],
      ['Mariolo, miarkuj się. Bez dowodów nikogo nie oskarżamy.', { cyr: 1, mar: -1 }, M(G, 'mar', 'nie pouczaj mnie'), M(G, 'cyr', 'Dziękuję. Przynajmniej jedna rozsądna osoba.')]
    ]]],
    M(G, 'mar', 'a tak w ogóle. w naszej szatni dla personelu wisi mokra czarna kurtka z kapturem. taka sama jak miał ten typ. z kieszeni wystaje brelok z C'),
    [['img', G, 'mar', 'f15', 'Szatnia pracownicza w barze'],
     ['clue', 'szatnia', 'Podrzucona kurtka?', 'W szatni baru wisi mokra czarna kurtka z kapturem, z kieszeni wystaje brelok „C”. Mariola: „za proste. jakby ktoś chciał, żeby ktoś to znalazł”. Czy ktoś chce wrobić Cyryla?']],
    M(G, 'mar', 'za proste. jakby ktoś chciał żebyśmy to znaleźli'),
    [['p', 700]]
  ) });

  /* SCENA 5 */
  SC.push({ id: 's5', t: '00:58', card: ['00:58', 'Prywatnie', 'Hortensja chce rozmawiać bez świadków'], steps: cat(
    [['s', 'hor', 'Hortensja Biczyk napisała do Ciebie'], ['p', 600]],
    M('hor', 'hor', 'Musimy porozmawiać bez świadków.', 'Wiem, że nie jesteś kuzynką Patryka. Patryk jest jedynakiem, a ja przyjaźnię się z jego matką od dwudziestu lat.', 'Powiedz mi prawdę: czy Zenobia wspominała o mnie w wiadomości?'),
    [['ch', 'hor', [
      ['Ani słowem. Bała się kogoś innego.', { hor: 2 }, M('hor', 'hor', 'Rozumiem. Kamień z serca...')],
      ['Powiedziała, że jesteś w to zamieszana po uszy.', { hor: -2 }, M('hor', 'hor', 'To brednie! Chciałam jej tylko pomóc!')]
    ]]],
    M('hor', 'hor', 'Powiem ci coś, czego nie wie nikt w grupie.', 'Skłamałam na temat leków na migrenę. Zenobia nie wzięła nic.', 'Przyszła do apteki w stanie skrajnego załamania. Szukała Cyryla. Cyryl czekał na moim zapleczu.', 'Mamy romans. Gdyby to wyszło na jaw, zniszczyłoby to jego kampanię i moją reputację. Cyryl kazał mi zeznać, że Zenobia po prostu wzięła tabletki i poszła do domu.', 'Ale kiedy wychodziła z apteki, zauważyłam w jej torbie teczkę z pieczęcią archiwum miejskiego z 2016 roku...'),
    [['fl', 'romans', 1], ['clue', 'romans', 'Romans Cyryla i Hortensji', 'Hortensja kłamała o lekach. Zenobia szukała Cyryla, który czekał na zapleczu apteki. Mają romans, a Cyryl kazał jej zeznawać, że Zenobia po prostu poszła do domu. Zenobia miała w torbie teczkę z archiwum z 2016 roku.']],
    [['ch', 'hor', [
      ['Czy zeznasz to przed policją?', { hor: 1 }, M('hor', 'hor', 'Jeśli będzie trzeba... Pomyślę. Nie jestem już pewna, czy chcę chronić Cyryla.')],
      ['Dlaczego mi to mówisz?', { hor: 0 }, M('hor', 'hor', 'Bo ty jedna nie jesteś stąd. Nie masz w tym interesu.')]
    ]]]
  ) });

  /* SCENA 6 */
  SC.push({ id: 's6', t: '01:20', card: ['01:20', 'Przełom', 'Kiki wrzuca powiększenie kadru'], steps: cat(
    [['s', G, 'Kiki wysłała zdjęcie z live'], ['p', 600]],
    M(G, 'kik', 'patrzcie na to!! zbliżenie na kieszeń gościa w czarnej kurtce!'),
    [['img', G, 'kik', 'f2z', 'Zbliżenie: kieszeń mężczyzny'], ['clue', 'brelok', 'Brelok z literą „C”', 'W kieszeni mężczyzny z live (22:41) wisi złoty brelok z literą „C”.']],
    M(G, 'mar', 'cyryl, tłumacz się kurwa w tej chwili. to twój brelok wyborczy!'),
    M(G, 'cyr', 'Rozdałem kilkaset takich gadżetów podczas inauguracji komitetu! Każdy mógł go mieć!'),
    M(G, 'pat', 'rudolf kłos, kierowca pana zaspokajskiego, nosi dokładnie taką kurtkę. mam zrzut z kamery miejskiej z godziny 22:45'),
    M(G, 'lola', 'czy wy sugerujecie że oni zrobili coś zeni?! Boże, ja jadę do niej pod dom!!'),
    [['ch', G, [
      ['Lola, nie jedź nigdzie sama. Proszę.', { lola: 1 }, M(G, 'lola', '...dobrze. ale boję się 😭')],
      ['Cyryl, odpowiedz Marioli. Skąd brelok u człowieka Ignacego?', { cyr: -1, mar: 1 }, M(G, 'cyr', 'Nie mam pojęcia i nie muszę się tłumaczyć.'), M(G, 'mar', 'a jednak się tłumaczysz')],
      ['Rudolf Kłos. Gdzie on teraz jest?', { pat: 1 }, M(G, 'pat', 'sprawdzam. kamery na dworcu i przy rondzie. dam znać')]
    ]]],
    [['clue', 'rudolf', 'Rudolf Kłos', 'Kierowca Ignacego Zaspokajskiego, krępy mężczyzna w czarnej kurtce z kapturem. Patryk ma jego zrzut z kamery miejskiej z 22:45.'], ['p', 700]]
  ) });

  /* SCENA 7 */
  SC.push({ id: 's7', t: '01:48', card: ['01:48', 'Telefon Zenobii', 'Patryk ma zrzut pamięci podręcznej'], steps: cat(
    [['s', 'pat', 'Patryk Szeptun napisał do Ciebie'], ['p', 600]],
    M('pat', 'pat', 'udało mi się pobrać lustrzany zrzut pamięci podręcznej telefonu zenobii z momentu tuż przed utratą zasięgu'),
    [['img', 'pat', 'pat', 'f5', 'Ekran blokady, 22:31']],
    M('pat', 'pat', 'numer nadawcy to prepaid kupiony za gotówkę w kiosku przy dworcu PKP. brak rejestracji na nazwisko', 'ale w pamięci podręcznej jest coś jeszcze... szkic niedokończonej wiadomości zenobii:', '„Wiem co zrobiliście Julkowi na pomostach. Mam protokół sekcji”.'),
    [['clue', 'sms', 'SMS z 22:31', 'Ostatni SMS od nieznanego numeru (prepaid, kupiony za gotówkę): „Przynieś kopię. Młyn. 23:00. Sama.”'],
     ['clue', 'szkic', 'Niewysłany szkic Zenobii', '„Wiem co zrobiliście Julkowi na pomostach. Mam protokół sekcji”. Zenobia miała dowód, że śmierć Julka w 2016 roku nie była wypadkiem.']],
    M('pat', 'pat', 'i jeszcze jedno. w kopii aparatu jest zdjęcie z 23:09. zrobione z ukrycia'),
    [['img', 'pat', 'pat', 'f13', 'Wnętrze młyna, 23:09'],
     ['clue', 'mlyn_wn', 'Ostatnie zdjęcie Zenobii', 'O 23:09 Zenobia sfotografowała z ukrycia wnętrze młyna. Na deskach mokre ślady ciężkich butów prowadzą ku drabinie na strych.']],
    [['ch', 'pat', [
      ['Kto to jest Julek?', { pat: 1 }, M('pat', 'pat', 'chłopak który utonął na balu maturalnym w 2016. miał 18 lat', 'sprawę umorzono po tygodniu. całe miasto wolało zapomnieć')],
      ['Musimy to zgłosić.', { pat: 0 }, M('pat', 'pat', 'komu? posterunkowi? ignacy go ma w kieszeni', 'najpierw dowody')]
    ]]]
  ) });

  /* SCENA 8 */
  SC.push({ id: 's8', t: '02:07', card: ['02:07', 'Powrót „Zenobii”', 'Zenobia jest online'], steps: cat(
    [['s', G, 'Zenobia jest teraz online'], ['p', 900]],
    M(G, 'zen', 'hej wszystkim', 'przepraszam za zamieszanie. bateria mi padła i nie miałam ładowarki', 'jestem bezpieczna u mamy za miastem. nie szukajcie mnie i idźcie spać'),
    M(G, 'lola', 'ZENI BOŻE ŻYJESZ KOCHANIE MOJE 😭😭😭❤️❤️❤️'),
    M(G, 'cyr', 'Mówiłem? Ostrzegałem, że to tylko histeria. Niepotrzebnie nakręcaliście spiralę podejrzeń.'),
    M(G, 'mar', 'zaraz. chwileczkę.'),
    [['ch', G, [
      ['Zenobia, a co z Mruczkiem? Zostawiłaś go bez karmy na noc!', { lola: 1 }, cat([['fl', 'demaskacja', 1], ['fl', 'test_kota', 1]],
        M(G, 'zen', 'mruczek dostał całą miskę przed moim wyjściem, nie martw się'),
        M(G, 'lola', '...co?'),
        M(G, 'lola', 'zeni, mruczek nie je suchej karmy od operacji żołądka w zeszłym miesiącu. karmisz go wyłącznie z ręki'),
        M(G, 'lola', 'KIM TY DO CHOLERY JESTEŚ?!'))],
      ['Twoja mama od pięciu lat mieszka w Gdańsku, a nie pod miastem.', { mar: 1 }, cat([['fl', 'demaskacja', 1]],
        M(G, 'mar', 'dokładnie. zeni nigdy by nie powiedziała „u mamy za miastem”. ktoś przejął jej telefon!'))],
      ['Kłamiesz. Przed chwilą pisała do mnie z młyna nad rzeką!', { lola: -1, cyr: -1, mar: 1 }, cat([['fl', 'demaskacja', 1], ['fl', 'konfrontacja', 1], ['if', 'obiecano_milczenie', [['tr', { zen: -1 }], ['fl', 'zlamana_obietnica', 1]], []]],
        M(G, 'cyr', 'Z jakiego znowu młyna?! Co to za paranoja?!'),
        M(G, 'lola', 'młyn?? jaki młyn?? ty wiedziałaś i nic nam nie powiedziałaś??'))]
    ]]],
    M(G, 'pat', 'sygnał tego wpisu nie pochodzi z mieszkania matki w Gdańsku ani z podmiejskiej wsi', 'urządzenie łączy się przez repeater z wieży ciśnień bezpośrednio nad zakolem rzeki przy starym młynie!'),
    [['s', G, 'Użytkownik Zenobia opuścił grupę'],
     ['clue', 'impostor', 'To nie ona', 'Ktoś piszący z telefonu Zenobii podszywa się pod nią. Sygnał pochodzi z wieży ciśnień przy zakolu rzeki, obok młyna.'], ['p', 900]]
  ) });

  /* SCENA 9 */
  SC.push({ id: 's9', t: '02:09', card: ['02:09', 'Cisza', 'Nowy kontakt'], steps: cat(
    [['s', 'cis', 'Nowy kontakt: CISZA'], ['p', 1000]],
    M('cis', 'cis', 'Brawo.', 'Jesteś bardziej spostrzegawcza niż reszta tego prowincjonalnego kółka wzajemnej adoracji.'),
    [['img', 'cis', 'cis', 'f17', '02:09 · brak lokalizacji'],
     ['clue', 'dlon', 'Dłoń z bransoletką „Z”', 'Cisza przysłała zdjęcie: na deskach pomostu leży bezwładna dłoń z bransoletką z literą „Z”, ze świeżymi otarciami. W tle tablica „MŁYN KRUSZEWSKICH – WSTĘP WZBRONIONY”.']],
    M('cis', 'cis', 'Jej już tam nie ma.', 'Ale jeszcze oddycha. Zegar tyka nieubłaganie.', 'Za godzinę zmuszę cię do podjęcia decyzji, komu z nich rzucisz koło ratunkowe, a kogo poślesz na dno.', 'Wiem doskonale, że nie jesteś żadną kuzynką Patryka ze stolicy. Ciekawe, jak zareagują twoi nowi przyjaciele, gdy dowiedzą się prawdy? 🙂'),
    [['ch', 'cis', [
      ['Kim jesteś, psychopato?! Czego chcesz?!', {}, cat([['fl', 'cisza_a', 1]], M('cis', 'cis', 'Kimś, kto czekał na sprawiedliwość dokładnie dziesięć długich lat.'))],
      ['Gdzie ją wywiozłeś? Powiedz, ile chcesz pieniędzy!', {}, cat([['fl', 'cisza_b', 1]], M('cis', 'cis', 'Pieniądze Ignacego nie naprawią przeszłości. Spójrz uważnie na fotografię. Odpowiedź płynie z prądem rzeki.'))],
      ['Zawiadamiam CBŚ i prokuraturę okręgową.', {}, cat([['fl', 'cisza_c', 1]], M('cis', 'cis', 'Śmiało. Zobaczymy, kto pierwszy zacznie palić archiwa.'))]
    ]]],
    [['p', 900]]
  ) });

  /* SCENA 10 */
  SC.push({ id: 's10', t: '02:21', card: ['02:21', 'Cliffhanger', 'Patryk wie coś, czego nie chcesz usłyszeć'], steps: cat(
    [['s', 'pat', 'Patryk Szeptun napisał do Ciebie'], ['p', 700]],
    M('pat', 'pat', 'słuchaj... mam ciarki na plecach', 'przed sekundą, zanim jej telefon został ostatecznie wyczyszczony ze zdalnego poziomu, jej chmura wyrzuciła ostatni automatyczny backup książki kontaktowej', 'spójrz na ten zrzut ekranu. natychmiast'),
    [['img', 'pat', 'pat', 'f18', 'Kontakty Zenobii'],
     ['clue', 'kontakt', 'Kontakt „Nieznany (kuzyn?)”', 'W telefonie Zenobii mój numer figuruje jako „Nieznany (kuzyn?)”, dodany 18.10.2026, trzy tygodnie temu. Notatka: „Nie dzwonić pod żadnym pozorem. Użyć tylko, jeśli historia z 2016 roku znowu ożyje.”']],
    M('pat', 'pat', 'ona miała twój numer od miesiąca...', 'powiedz mi prosto w oczy: KIM TY KURWA JESTEŚ NAPRAWDĘ?'),
    [['ch', 'pat', [
      ['Przysięgam na wszystko, nie mam pojęcia! Nigdy jej nie spotkałam!', { pat: 0 }, cat([['fl', 'niewinna', 1]], M('pat', 'pat', '...', 'chcę ci wierzyć. naprawdę', 'ale zapamiętam to'))],
      ['Dziesięć lat temu byłam na tym balu nad rzeką...', { pat: -1 }, cat([['fl', 'bal2016', 1], ['clue', 'bal', 'Byłam na balu w 2016', 'Wyznałam Patrykowi, że dziesięć lat temu byłam na balu nad rzeką. Co jeszcze z tamtej nocy pamiętam?']], M('pat', 'pat', 'co?', 'czyli ty też tam byłaś. i zeni to wiedziała', 'nie rozumiem. ale nie wyjdziesz stąd, dopóki mi tego nie wyjaśnisz'))],
      ['Patryk, skup się na ratowaniu jej życia, rozliczysz mnie później!', { pat: 1 }, cat([['fl', 'skupienie', 1]], M('pat', 'pat', 'dobra. masz rację.', 'później mi powiesz. ale powiesz'))]
    ]]],
    [['p', 800]]
  ) });

  /* SCENA 11 */
  SC.push({ id: 's11', t: '02:30', card: ['02:30', 'Połączenie przychodzące', 'Gabin 🌲 ekipa'], steps: cat(
    [['s', G, 'Połączenie głosowe w grupie'], ['p', 500]],
    [['call', G, 'ign', [
      'Dobry wieczór państwu. A właściwie dobrej nocy.',
      'Zostałem obudzony przez serię dość bezczelnych telefonów od pani Pieprznej. Chciałbym uciąć wszelkie spekulacje raz na zawsze.',
      'Nie mam absolutnie nic wspólnego ze zniknięciem pani Rozpalskiej. Pan mecenas Podniecki opuścił mój stolik punktualnie o godzinie dwudziestej drugiej, zostawiając mnie samego w lokalu.',
      'Co do mojego pracownika, Rudolfa... pan Rudolf od wieczora nie odpowiada na wezwania służbowe i nie stawił się w bazie transportowej. Jeżeli ktoś próbuje powiązać moje przedsiębiorstwo z tą sprawą, spotkamy się rano w sądzie rejonowym w obecności mediów.',
      'Radzę wszystkim rozejść się do domów i dobrze zamknąć drzwi. Noce nad rzeką bywają niebezpieczne.'
    ]]],
    M(G, 'mar', 'słyszeliście go? stary skurwiel trzęsie portkami jak nigdy dotąd! rudolf działa na własną rękę albo na jego bezpośredni rozkaz!'),
    [['clue', 'ignacy', 'Ignacy: alibi i zniknięty Rudolf', 'Ignacy twierdzi, że Cyryl zostawił jego stolik o 22:00 (Cyryl mówił: 21:30). Rudolf od wieczora nie odpowiada i nie stawił się w bazie. Ignacy zapowiada sąd i media.'], ['p', 700]]
  ) });

  /* SCENA 12 */
  SC.push({ id: 's12', t: '02:41', card: ['02:41', 'Finał odcinka 1', 'Wielki rozłam'], steps: cat(
    [['s', G, 'Czat grupowy płonie'], ['p', 500]],
    M(G, 'lola', 'ludzie co robimy?!! zeni gdzieś tam jest!! 😭'),
    M(G, 'cyr', 'To szaleństwo. Nikt nie powinien nigdzie jechać. Policja, rano.'),
    M(G, 'mar', 'rano to ona już nie będzie żyć, cyryl'),
    M(G, 'kik', 'ja już nic nie rozumiem. serio. 😶'),
    M(G, 'hor', '...'),
    [['s', 'pat', 'Patryk Szeptun napisał do Ciebie'], ['p', 500]],
    M('pat', 'pat', 'zdążyłem przejąć kamerę stacji transformatorowej nad rzeką. patrz'),
    [['img', 'pat', 'pat', 'f12', 'Młyn Kruszewskich, kamera stacji transformatorowej'],
     ['clue', 'mlyn_zew', 'Młyn z zewnątrz', 'Światło latarki w oknie na drugim piętrze. Na zabitych deskami wrotach świeża, czerwona kreska.']],
    M('pat', 'pat', 'światło w oknie na drugim piętrze. i ta czerwona kreska na wrotach', 'jest tam ktoś. teraz'),
    [['s', 'cis', 'Cisza napisała do Ciebie'], ['p', 700]],
    M('cis', 'cis', 'Ostatnia szansa. Za dwanaście minut stary młyn spłonie albo rzeka zabierze kolejną ofiarę. Wybierz swoją ścieżkę.'),
    [['ch', 'cis', [
      ['Rajd na Młyn z Mariolą. Jadę tam. Teraz.', { }, cat([['fl', 'ending', 'mlyn']], M('mar', 'mar', 'dawaj lokalizację. jadę po ciebie. cztery minuty', 'biorę strzelbę z zaplecza i terenówkę. nie gadaj, wsiadasz i jedziemy', 'jak wejdziemy do tego młyna, to tylko we dwie. reszta niech się modli'), [['s', 'mar', 'Mariola jedzie po Ciebie. Cel: Młyn Kruszewskich.']]), { need: { mar: 2 }, lock: 'Mariola musi Ci ufać' }],
      ['Operacja cyfrowa z Patrykiem. Zostajemy w ukryciu.', { }, cat([['fl', 'ending', 'cyfra']], M('pat', 'pat', 'dobra. zostajemy w ukryciu', 'przejmuję kamery stacji transformatorowej i archiwum miejskiego. ty szukasz, ja kopię', 'jeśli ktoś z nich zabił w 2016, jego twarz gdzieś jest. znajdziemy ją'), [['s', 'pat', 'Patryk udostępnił Ci dostęp do kamer miejskich.']]), { need: { pat: 2 }, lock: 'Patryk musi Ci ufać' }],
      ['Eskorta z Hortensją na policję wojewódzką.', { }, cat([['fl', 'ending', 'policja']], M('hor', 'hor', 'Jadę. Biorę teczkę, którą Zenobia zostawiła u mnie w aptece.', 'Komenda wojewódzka, nie posterunek w Gabinie. Cyryl się dowie. Przestało mnie to obchodzić.', 'Mam samochód pod apteką. Dwie minuty.'), [['s', 'hor', 'Hortensja czeka z samochodem przed apteką.']]), { need: { hor: 2 }, lock: 'Hortensja musi Ci ufać' }],
      ['Nikomu już nie ufam. Działam sama.', { }, cat([['fl', 'ending', 'sama']], M('cis', 'cis', 'Sama? Odważnie. I głupio. 🙂')), { fallback: true }]
    ]]],
    M('cis', 'cis', 'Gra dopiero się rozpoczęła.', 'Do zobaczenia w Odcinku 2: NOC NAD RZEKĄ.'),
    [['p', 1200]]
  ) });

  /* ---------- silnik ---------- */
  var FLAGS = {
    obiecano_milczenie: 'Obiecałaś Zenobii milczeć', zlamana_obietnica: 'Złamałaś obietnicę daną Zenobii', kuzyn: 'Podałaś się za kuzynkę Patryka', prawda: 'Powiedziałaś grupie prawdę',
    nieznajoma: 'Wyparłaś się Zenobii', mar_wie: 'Mariola zna Twój sekret o młynie', romans: 'Znasz romans Cyryla i Hortensji', demaskacja: 'Zdemaskowałaś impostora', test_kota: 'Test z kotem Mruczkiem', konfrontacja: 'Wydałaś Zenobię i jej młyn', bal2016: 'Byłaś na balu w 2016', niewinna: 'Zaprzysięgłaś niewinność', skupienie: 'Skupiłaś się na ratunku'
  };
  var ENDINGS = { mlyn: 'Rajd na Młyn z Mariolą', cyfra: 'Operacja cyfrowa z Patrykiem', policja: 'Eskorta z Hortensją na policję', sama: 'Działasz sama' };

  function mount(el, sub) {
    if (!owner()) { el.innerHTML = '<div class="gb gb-nope"><b>Ta gra jest dostępna tylko dla właściciela.</b><a href="#/gry">Wróć do gier</a></div>'; return; }
    var st = ls.get(), S = null, alive = true, speed = window.__GABIN_FAST || 1, view = 'list', cur = null, P = null, tab = 'chats', HUNT = null;
    var fmt = function (t) { return String(t).replace(/\{nick\}/g, S ? S.nick : ''); };
    var $ = function (q) { return el.querySelector(q); };
    var root = function () { return el.querySelector('.gb') || el; };
    var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms * speed); }); };
    var nameOf = function (c) { return (S && S.names && S.names[c]) || CH[c].n; };
    var short = function (c) { return nameOf(c).split(' ')[0]; };
    function av(c, cls) {
      var m = CH[c], f = (S && S.avs && S.avs[c]) || m.av;
      return '<span class="gb-av ' + (cls || '') + '" style="--c:' + m.col + '">' + (f ? '<img src="' + url(f) + '" alt="" loading="lazy" decoding="async">' : '<b>' + esc(m.i || m.n[0]) + '</b>') + '</span>';
    }
    var trLevel = function (v) { return v <= -2 ? 'wrogo' : v < 0 ? 'nieufnie' : v === 0 ? 'neutralnie' : v === 1 ? 'ostrożnie' : v < 4 ? 'ufa' : 'bardzo ufa'; };
    var trVal = function (k) { return S.tr[k] || 0; };

    /* ---- ekran startowy ---- */
    function gate() {
      var cast = ['av_z', 'av_l', 'av_m', 'av_p', 'av_k', 'av_c', 'av_h'].map(function (f) { return '<span class="gb-av sm"><img src="' + url(f) + '" alt=""></span>'; }).join('');
      var cont = st.save && st.save.ver === VER && st.save.scene < SC.length;
      el.innerHTML = '<div class="gb gb-gate"><div class="gb-gate-bg" style="background-image:url(' + url('f16') + ')"></div><div class="gb-gate-in">' +
        '<small class="gb-eyebrow">Gabin · odcinek 1</small><h1>Zły numer</h1>' +
        '<p class="gb-lead">Wiadomość z nieznanego numeru. Dziewczyna, która pisze, jest w opuszczonym młynie i ktoś wchodzi po schodach. Masz telefon, kilkoro nieznajomych w czacie i jedną noc, żeby dowiedzieć się, komu zaufać.</p>' +
        '<div class="gb-cast">' + cast + '</div>' +
        '<label class="gb-f"><span>Jak masz na imię?</span><input id="gb-nick" maxlength="14" placeholder="np. Ola" value="' + esc(st.nick || '') + '" autocomplete="off"></label>' +
        '<button type="button" class="gb-go" id="gb-go">Zaczynam. Mam skończone 18 lat</button>' +
        (cont ? '<button type="button" class="gb-go gb-go2" id="gb-cont">Kontynuuj · scena ' + (st.save.scene + 1) + ' z ' + SC.length + '</button><button type="button" class="gb-link" id="gb-reset">Zacznij od nowa</button>' : '') +
        '<p class="gb-warn">Treści dla dorosłych: przemoc, wulgaryzmy, napięcie. Wszystkie postacie i wydarzenia są wymyślone.</p>' +
        '<a class="gb-link" href="#/gry">← Wróć do gier</a></div></div>';
      $('#gb-go').onclick = function () { var n = $('#gb-nick').value.trim() || 'Ola'; st = { nick: n }; ls.set(st); start({ ver: VER, nick: n, scene: 0, log: [], tr: {}, fl: {}, clues: [], ev: [], un: {}, names: {}, avs: {}, clock: '23:12', tick: 0 }); };
      if (cont) $('#gb-cont').onclick = function () { start(JSON.parse(JSON.stringify(st.save))); };
      if ($('#gb-reset')) $('#gb-reset').onclick = function () { st.save = null; ls.set(st); gate(); };
    }

    /* ---- szkielet ---- */
    function shell() {
      el.innerHTML = '<div class="gb gb-app" id="gb-app" data-view="list" data-tab="chats">' +
        '<aside class="gb-side"><header class="gb-top"><a class="gb-x" href="#/gry" aria-label="Wyjdź z gry">‹</a><div class="gb-ttl"><b>Gabin</b><small>Odcinek 1 · Zły numer</small></div><span class="gb-clock" id="gb-clock"></span><button type="button" class="gb-sp" id="gb-sp" title="Przyspiesz oczekiwanie" aria-label="Przyspiesz">⏩</button></header>' +
        '<div class="gb-sbody" id="gb-sbody"></div>' +
        '<nav class="gb-nav"><button type="button" data-t="chats" class="is-on"><span>💬</span>Czaty<i id="gb-bd"></i></button><button type="button" data-t="notes"><span>🗂️</span>Dowody<i id="gb-nb"></i></button><button type="button" data-t="trust"><span>🤝</span>Zaufanie</button></nav></aside>' +
        '<section class="gb-main" id="gb-main"></section><div class="gb-toast" id="gb-toast"></div></div>';
      $('#gb-sp').onclick = function () { speed = speed === 1 ? 0.12 : 1; $('#gb-sp').classList.toggle('is-on', speed !== 1); };
      [].forEach.call(el.querySelectorAll('[data-t]'), function (b) { b.onclick = function () { tab = b.dataset.t; view = 'list'; setView(); renderSide(); }; });
    }
    function setView() { var a = $('#gb-app'); if (!a) return; a.dataset.view = view; a.dataset.tab = tab; [].forEach.call(el.querySelectorAll('[data-t]'), function (x) { x.classList.toggle('is-on', x.dataset.t === tab); }); }
    function badge() {
      var n = 0; Object.keys(S.un).forEach(function (k) { n += S.un[k] || 0; }); if (P) n += 1;
      var b = $('#gb-bd'); if (b) { b.textContent = n || ''; b.style.display = n ? '' : 'none'; }
      var nb = $('#gb-nb'); if (nb) { nb.textContent = S.clues.length + S.ev.length ? S.ev.length : ''; nb.style.display = S.ev.length ? '' : 'none'; }
      var c = $('#gb-clock'); if (c) c.textContent = S.clock;
    }

    /* ---- panel boczny ---- */
    function last(c) { for (var i = S.log.length - 1; i >= 0; i--) if (S.log[i].c === c && S.log[i].k !== 's') return S.log[i]; return null; }
    function chatsOrder() { var seen = {}, order = []; for (var i = S.log.length - 1; i >= 0; i--) { var c = S.log[i].c; if (!seen[c]) { seen[c] = 1; order.push(c); } } return order; }
    function renderSide() {
      var b = $('#gb-sbody'); if (!b) return; badge(); setView();
      if (tab === 'notes') {
        var ev = EVORDER.filter(function (f) { return S.ev.indexOf(f) >= 0; });
        b.innerHTML = '<div class="gb-pane"><h2>Dowody <em>' + ev.length + ' / ' + EVORDER.length + '</em></h2>' + (ev.length ? '<div class="gb-evg">' + ev.map(function (f) { return '<button type="button" class="gb-ev" data-lb="' + f + '"><img src="' + url(f) + '" alt="" loading="lazy" decoding="async"><span><b>' + IM[f].e + '</b>' + esc(IM[f].t) + '</span></button>'; }).join('') + '</div>' : '<p class="gb-empty">Jeszcze nie masz żadnych zdjęć ani nagrań.</p>') +
          '<h2>Notatki <em>' + S.clues.length + '</em></h2>' + (S.clues.length ? S.clues.slice().reverse().map(function (c) { return '<div class="gb-clue"><b>' + esc(c[1]) + '</b><p>' + esc(fmt(c[2])) + '</p></div>'; }).join('') : '<p class="gb-empty">Tu pojawią się wskazówki, które zapisujesz w czasie rozmów.</p>') + '</div>';
        [].forEach.call(b.querySelectorAll('[data-lb]'), function (x) { x.onclick = function () { openLight(x.dataset.lb); }; });
        return;
      }
      if (tab === 'trust') { b.innerHTML = '<div class="gb-pane"><h2>Zaufanie</h2><p class="gb-hint">Każda odpowiedź zmienia to, jak widzą Cię inni. Finał odcinka zależy od tego, komu zaufasz i kto zaufa Tobie.</p>' + trustHtml() + '</div>'; return; }
      var rows = chatsOrder().map(function (c) {
        var l = last(c), un = S.un[c] || 0, typ = S.typing && S.typing[c], pend = P && P.chat === c;
        return '<button type="button" class="gb-row' + (cur === c ? ' is-cur' : '') + (un ? ' is-un' : '') + '" data-c="' + c + '">' + av(c) + '<span class="gb-row-t"><b>' + esc(nameOf(c)) + '</b><small>' + (typ ? '<i class="gb-typ">pisze…</i>' : l ? esc((l.k === 'me' ? 'Ty: ' : (CH[c].grp && l.w ? short(l.w) + ': ' : '')) + (l.k === 'img' ? '📷 Zdjęcie' : fmt(l.x))) : '') + '</small></span><span class="gb-row-m">' + (l ? '<time>' + l.t + '</time>' : '') + (pend ? '<em>Odpowiedz</em>' : '') + (un ? '<u>' + un + '</u>' : '') + '</span></button>';
      }).join('');
      b.innerHTML = '<div class="gb-list">' + (P && P.hub ? hubHtml() : '') + (rows || '<p class="gb-empty">Telefon milczy. Za chwilę ktoś się odezwie…</p>') + '</div>';
      [].forEach.call(b.querySelectorAll('[data-c]'), function (x) { x.onclick = function () { openChat(x.dataset.c); }; });
      [].forEach.call(b.querySelectorAll('[data-hub]'), function (x) { x.onclick = function () { var i = +x.dataset.hub, p = P; P = null; p.res(i); }; });
    }
    function hubHtml() { return '<div class="gb-hub"><b>Napisz do każdego z nich</b><small>Wybierz rozmowę. Zostało: ' + P.left + '</small><div class="gb-hub-g">' + P.opts.map(function (o, i) { return '<button type="button" data-hub="' + i + '">' + av(o[1], 'md') + '<span>' + esc(o[0]) + '</span></button>'; }).join('') + '</div></div>'; }
    function trustHtml() {
      return '<div class="gb-trust">' + TRUST.map(function (k) {
        var v = Math.max(-3, Math.min(6, trVal(k))), pct = (v + 3) / 9 * 100, key = ['mar', 'pat', 'hor'].indexOf(k) >= 0;
        return '<div class="gb-tr">' + av(k, 'md') + '<div><div class="gb-tr-h"><b>' + SHORT[k] + '</b><span>' + trLevel(v) + '</span></div><i class="gb-bar"><u style="width:' + pct + '%;background:' + CH[k].col + '"></u>' + (key ? '<s title="próg zaufania potrzebny w finale" style="left:' + (5 / 9 * 100) + '%"></s>' : '') + '</i></div></div>';
      }).join('') + '</div><p class="gb-hint">Znacznik na pasku oznacza próg zaufania potrzebny w finale (Mariola, Patryk, Hortensja).</p>';
    }

    /* ---- panel rozmowy ---- */
    function msgHtml(m, prev) {
      var grp = CH[m.c].grp;
      if (m.k === 's') return '<div class="gb-sys"><span>' + esc(fmt(m.x)) + '</span></div>';
      if (m.k === 'me') return '<div class="gb-m me"><div class="gb-b">' + esc(fmt(m.x)) + '<time>' + m.t + '</time></div></div>';
      var first = !prev || prev.k === 's' || prev.k === 'me' || prev.w !== m.w;
      var head = grp && first ? '<small class="gb-nm" style="color:' + CH[m.w].col + '">' + esc(nameOf(m.w)) + '</small>' : '';
      var body = m.k === 'img' ? imgBubble(m) : m.k === 'v' ? '<span class="gb-vo">🎙</span>' + esc(fmt(m.x)) : esc(fmt(m.x));
      return '<div class="gb-m' + (first ? ' is-first' : '') + (m.k === 'img' ? ' is-img' : '') + '">' + (grp ? '<span class="gb-av-s">' + (first ? av(m.w, 'xs') : '') + '</span>' : '') + '<div class="gb-b" style="--n:' + CH[m.w].col + '">' + head + body + '<time>' + m.t + '</time></div></div>';
    }
    function imgBubble(m) { var d = IM[m.x] || {}; return '<button type="button" class="gb-img' + (d.k === 'screen' ? ' is-scr' : '') + '" data-img="' + m.x + '"><img src="' + url(m.x) + '" alt="' + esc(m.cap || '') + '" loading="lazy" decoding="async"><span>' + (m.cap ? esc(m.cap) : 'Zdjęcie') + '</span></button>'; }
    function renderMain() {
      var main = $('#gb-main'); if (!main) return;
      if (!cur) { main.innerHTML = '<div class="gb-idle" style="background-image:url(' + url('f16') + ')"><div><b>Gabin</b><p>Wybierz rozmowę po lewej.</p></div></div>'; return; }
      var m = CH[cur], list = S.log.filter(function (x) { return x.c === cur; }), html = '', prev = null;
      list.forEach(function (x) { html += msgHtml(x, prev); prev = x; });
      var status = m.grp ? 'Zenobia, Lola, Mariola, Kiki, Cyryl, Hortensja, Patryk i Ty' : cur === 'z' && S.scene > 0 ? 'offline' : cur === 'cis' ? 'nieznany numer' : 'online';
      main.innerHTML = '<div class="gb-chat"><header class="gb-ch-h"><button type="button" class="gb-back" id="gb-back" aria-label="Wróć do listy">‹</button>' + av(cur, 'sm') + '<span><b>' + esc(nameOf(cur)) + '</b><small id="gb-st">' + esc(status) + '</small></span></header>' +
        '<div class="gb-msgs" id="gb-msgs">' + html + '</div><div class="gb-cho" id="gb-cho"></div></div>';
      $('#gb-back').onclick = function () { cur = null; view = 'list'; setView(); renderMain(); renderSide(); };
      bindImgs(); scrollDown(); renderChoice();
    }
    function scrollDown() { var m = $('#gb-msgs'); if (m) m.scrollTop = m.scrollHeight; }
    function bindImgs() { [].forEach.call(el.querySelectorAll('[data-img]'), function (b) { if (!b._b) { b._b = 1; b.onclick = function () { openLight(b.dataset.img); }; } }); }
    function renderChoice() {
      var c = $('#gb-cho'); if (!c) return;
      if (P && P.chat === cur && P.opts) {
        var ok = P.opts.map(function (o) { return !o[3] || !o[3].need || Object.keys(o[3].need).every(function (k) { return trVal(k) >= o[3].need[k]; }); });
        var anyOk = P.opts.some(function (o, i) { return ok[i] && !(o[3] && o[3].fallback); });
        c.innerHTML = '<small class="gb-cho-l">' + (P.opts.some(function (o) { return o[3] && o[3].need; }) ? 'Decyzja, która kończy odcinek' : 'Twoja odpowiedź') + '</small>' + P.opts.map(function (o, i) {
          if (o[3] && o[3].fallback && anyOk) return '';
          if (!ok[i]) return '<button type="button" class="is-lock" disabled><span>' + esc(fmt(o[0])) + '</span><em>🔒 ' + esc(o[3].lock) + '</em></button>';
          return '<button type="button" data-o="' + i + '">' + esc(fmt(o[0])) + '</button>';
        }).join('');
        [].forEach.call(c.querySelectorAll('[data-o]'), function (b) { b.onclick = function () { var i = +b.dataset.o, p = P; P = null; c.innerHTML = ''; p.res(i); }; });
      } else if (HUNT && HUNT.chat === cur) {
        c.innerHTML = '<small class="gb-cho-l">Coś tu nie gra?</small><button type="button" id="gb-look">🔍 Przyjrzyj się zdjęciu</button><button type="button" class="is-sec" id="gb-skip">Pomiń</button>';
        $('#gb-look').onclick = function () { var h = HUNT; openLight(h.id, h.hot).then(function (found) { if (found && HUNT === h) { HUNT = null; renderChoice(); h.res(true); } }); };
        $('#gb-skip').onclick = function () { var h = HUNT; HUNT = null; c.innerHTML = ''; h.res(false); };
      } else c.innerHTML = '';
    }
    function openChat(c) { cur = c; view = 'chat'; S.un[c] = 0; setView(); renderMain(); renderSide(); }

    /* ---- powiadomienia i wiadomości ---- */
    function toastText(t, c) { var e = $('#gb-toast'); if (!e) return; e.innerHTML = t; e.className = 'gb-toast is-on'; e.onclick = c ? function () { openChat(c); e.className = 'gb-toast'; } : null; clearTimeout(toastText.h); toastText.h = setTimeout(function () { e.className = 'gb-toast'; }, 3000 * speed + 500); }
    function toastMsg(c, text) { toastText('<span class="gb-toast-av">' + av(c, 'xs') + '</span><span><b>' + esc(nameOf(c)) + '</b>' + esc(text) + '</span>', c); }
    function tickClock() { S.tick++; if (S.tick % 3 === 0) { var p = S.clock.split(':'), h = +p[0], m = +p[1] + 1; if (m >= 60) { m = 0; h = (h + 1) % 24; } S.clock = ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2); } }
    function addMsg(m) {
      m.t = S.clock; var prev = last(m.c); S.log.push(m);
      if (m.k !== 'me') S.typing[m.c] = false;
      if (m.k === 'img' && IM[m.x] && IM[m.x].e && S.ev.indexOf(m.x) < 0 && m.c !== 'me') { S.ev.push(m.x); }
      if (view === 'chat' && cur === m.c) { var box = $('#gb-msgs'); if (box) { var ty = $('#gb-typing'); if (ty) ty.remove(); box.insertAdjacentHTML('beforeend', msgHtml(m, prev)); bindImgs(); scrollDown(); } renderSide(); }
      else {
        if (m.k !== 'me' && m.k !== 's') { S.un[m.c] = (S.un[m.c] || 0) + 1; toastMsg(m.c, m.k === 'img' ? '📷 Zdjęcie' : fmt(m.x)); }
        else if (m.k === 's' && view !== 'chat') toastText(esc(fmt(m.x)), m.c);
        renderSide();
      }
      badge();
    }
    async function typing(c, w, text) {
      var ms = Math.min(2400, 450 + String(text).length * 26);
      S.typing[c] = true;
      if (view === 'chat' && cur === c) { var box = $('#gb-msgs'); if (box) { box.insertAdjacentHTML('beforeend', '<div class="gb-m"><span class="gb-av-s">' + (CH[c].grp ? av(w, 'xs') : '') + '</span><div class="gb-b gb-tp" id="gb-typing"><i></i><i></i><i></i></div></div>'); scrollDown(); } }
      else if (view === 'list' && tab === 'chats') renderSide();
      await wait(ms);
      var ty = $('#gb-typing'); if (ty) ty.remove();
    }

    /* ---- lightbox i szukanie szczegółu ---- */
    function openLight(id, hot) {
      return new Promise(function (res) {
        var d = IM[id] || {}, lb = document.createElement('div'), closed = false, misses = 0;
        lb.className = 'gb-lb';
        lb.innerHTML = '<button type="button" class="gb-lb-x" aria-label="Zamknij">×</button><div class="gb-lb-st"><div class="gb-lb-fig"><img src="' + url(id) + '" alt=""><i class="gb-ring" hidden></i></div></div><p class="gb-lb-cap">' + (hot ? '🔍 Dotknij miejsca, które wydaje Ci się dziwne.' : esc(d.e ? d.e + ' · ' + d.t : d.t || '')) + '</p>';
        root().appendChild(lb);
        var fig = lb.querySelector('.gb-lb-fig'), im = fig.querySelector('img'), ring = fig.querySelector('.gb-ring'), cap = lb.querySelector('.gb-lb-cap');
        function close(v) { if (closed) return; closed = true; document.removeEventListener('keydown', key); lb.classList.add('is-out'); setTimeout(function () { lb.remove(); }, 180); res(v); }
        function key(e) { if (e.key === 'Escape') close(false); }
        document.addEventListener('keydown', key);
        lb.querySelector('.gb-lb-x').onclick = function () { close(false); };
        if (!hot) lb.onclick = function (e) { if (e.target === lb || e.target.classList.contains('gb-lb-st')) close(false); };
        else fig.onclick = function (e) {
          if (closed) return;
          var r = im.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
          if (Math.hypot((x - hot.x) * r.width, (y - hot.y) * r.height) / r.width < hot.r) {
            ring.style.left = hot.x * 100 + '%'; ring.style.top = hot.y * 100 + '%'; ring.style.width = ring.style.height = hot.r * 2 * 100 + '%'; ring.hidden = false; ring.className = 'gb-ring is-ok';
            cap.textContent = 'Jest. Zapisane w notatniku.';
            setTimeout(function () { if (hot.z) { im.style.opacity = 0; setTimeout(function () { im.src = url(hot.z); ring.hidden = true; im.style.opacity = 1; }, 220); } }, 700);
            fig.onclick = null; setTimeout(function () { close(true); }, hot.z ? 2300 : 1500);
          } else {
            misses++; var rp = document.createElement('i'); rp.className = 'gb-rip'; rp.style.left = x * 100 + '%'; rp.style.top = y * 100 + '%'; fig.appendChild(rp); setTimeout(function () { rp.remove(); }, 700);
            cap.textContent = misses < 3 ? 'Nic tu nie widać. Spróbuj gdzie indziej.' : 'Ciepło... przyjrzyj się dokładniej.';
            if (misses >= 3) { ring.style.left = hot.x * 100 + '%'; ring.style.top = hot.y * 100 + '%'; ring.style.width = ring.style.height = hot.r * 5 * 100 + '%'; ring.hidden = false; ring.className = 'gb-ring is-hint'; }
          }
        };
      });
    }

    /* ---- minigra: PIN ---- */
    function pinGame(code) {
      return new Promise(function (res) {
        var o = document.createElement('div'), val = '', tries = 0, zoomed = false;
        o.className = 'gb-modal gb-pin';
        o.innerHTML = '<div class="gb-card-in"><small class="gb-eyebrow">Kopia zapasowa w chmurze</small><h3>Podaj 4-cyfrowy PIN</h3><p class="gb-hint">Zenobia mogła zapisać go tam, gdzie widzi go codziennie. Przyjrzyj się zdjęciu.</p>' +
          '<button type="button" class="gb-pin-ph" id="gb-pin-ph"><img src="' + url('f4') + '" alt=""><span>🔍 Przybliż lodówkę</span></button>' +
          '<div class="gb-dots" id="gb-dots"><i></i><i></i><i></i><i></i></div><p class="gb-pin-m" id="gb-pin-m">&nbsp;</p>' +
          '<div class="gb-keys">' + '123456789'.split('').map(function (k) { return '<button type="button" data-k="' + k + '">' + k + '</button>'; }).join('') + '<button type="button" data-k="c" class="is-fn">⌫</button><button type="button" data-k="0">0</button><button type="button" data-k="ok" class="is-fn">OK</button></div></div>';
        root().appendChild(o);
        var dots = o.querySelectorAll('#gb-dots i'), msg = o.querySelector('#gb-pin-m'), ph = o.querySelector('#gb-pin-ph');
        ph.onclick = function () { zoomed = !zoomed; ph.querySelector('img').src = url(zoomed ? 'f4z' : 'f4'); ph.querySelector('span').textContent = zoomed ? '↩ Pokaż całe zdjęcie' : '🔍 Przybliż lodówkę'; };
        function draw() { [].forEach.call(dots, function (d, i) { d.className = i < val.length ? 'is-on' : ''; }); }
        function submit() {
          if (val.length < 4) return;
          if (val === code) { msg.textContent = 'ODBLOKOWANO'; msg.className = 'gb-pin-m is-ok'; o.classList.add('is-ok'); setTimeout(function () { o.remove(); res(true); }, 1100); }
          else { tries++; val = ''; draw(); o.classList.add('is-bad'); setTimeout(function () { o.classList.remove('is-bad'); }, 400); msg.className = 'gb-pin-m is-bad'; msg.textContent = tries >= 2 ? 'Błędny PIN. Spójrz na kartkę przy magnesie w kształcie łapki.' : 'Błędny PIN. Spróbuj jeszcze raz.'; }
        }
        [].forEach.call(o.querySelectorAll('[data-k]'), function (b) { b.onclick = function () { var k = b.dataset.k; if (k === 'c') val = val.slice(0, -1); else if (k === 'ok') return submit(); else if (val.length < 4) val += k; draw(); if (val.length === 4) setTimeout(submit, 160); }; });
      });
    }

    /* ---- połączenie głosowe ---- */
    async function callScene(chat, who, lines) {
      var o = document.createElement('div'); o.className = 'gb-modal gb-call';
      o.innerHTML = '<div class="gb-card-in"><small class="gb-eyebrow">Połączenie głosowe · ' + esc(nameOf(chat)) + '</small>' + av(who, 'xl pulse') + '<h3>' + esc(nameOf(who)) + '</h3><div class="gb-wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="gb-call-t" id="gb-call-t"></div></div>';
      root().appendChild(o); var box = o.querySelector('#gb-call-t');
      await wait(1400);
      for (var i = 0; i < lines.length; i++) { var p = document.createElement('p'); p.textContent = fmt(lines[i]); box.appendChild(p); p.scrollIntoView({ block: 'end' }); await wait(1600 + lines[i].length * 38); }
      o.classList.add('is-end'); o.querySelector('small').textContent = 'Rozłączono'; await wait(1100); o.remove();
      lines.forEach(function (x) { addMsg({ c: chat, w: who, k: 'v', x: x }); });
      tickClock();
    }
    async function sceneCard(sc) {
      var o = document.createElement('div'); o.className = 'gb-modal gb-scene'; var c = sc.card;
      o.innerHTML = '<div><time>' + c[0] + '</time><b>' + esc(c[1]) + '</b><span>' + esc(c[2]) + '</span></div>'; root().appendChild(o);
      var done = false, skip = function () { done = true; }; o.onclick = skip;
      for (var t = 0; t < 26 && !done; t++) await wait(100);
      o.classList.add('is-out'); await wait(260); o.remove();
    }

    /* ---- interpreter ---- */
    function applyTr(t) { if (!t) return; Object.keys(t).forEach(function (k) { S.tr[k] = (S.tr[k] || 0) + t[k]; }); }
    async function runSteps(steps) { for (var i = 0; i < steps.length; i++) await exec(steps[i]); }
    async function exec(s) {
      if (!alive || !el.isConnected) throw new Error('stop');
      var op = s[0];
      if (op === 'm') { await typing(s[1], s[2], fmt(s[3])); addMsg({ c: s[1], w: s[2], k: 't', x: s[3] }); tickClock(); await wait(220 + Math.random() * 300); }
      else if (op === 's') { addMsg({ c: s[1], w: 'sys', k: 's', x: s[2] }); await wait(450); }
      else if (op === 'p') { await wait(s[1]); }
      else if (op === 'clock') { S.clock = s[1]; badge(); }
      else if (op === 'ren') { S.names[s[1]] = s[2]; if (s[3]) S.avs[s[1]] = s[3]; renderSide(); if (cur === s[1]) renderMain(); }
      else if (op === 'fl') { S.fl[s[1]] = s[2]; }
      else if (op === 'tr') { applyTr(s[1]); }
      else if (op === 'if') { await runSteps(S.fl[s[1]] ? s[2] : s[3]); }
      else if (op === 'clue') { if (!S.clues.some(function (c) { return c[0] === s[1]; })) { S.clues.push([s[1], s[2], s[3]]); toastText('🗒️ Nowa notatka: <b>' + esc(s[2]) + '</b>'); badge(); } }
      else if (op === 'img') { await wait(500); addMsg({ c: s[1], w: s[2], k: 'img', x: s[3], cap: s[4] }); toastText('📷 Nowy dowód w zakładce Dowody'); await wait(500); }
      else if (op === 'hunt') { var ok = await new Promise(function (res) { HUNT = { chat: s[1], id: s[2], hot: s[3], res: res }; if (view === 'chat' && cur === s[1]) renderChoice(); else { toastText('🔍 Przyjrzyj się zdjęciu od ' + esc(short(s[1])), s[1]); renderSide(); } }); await runSteps(ok ? s[4] : s[5]); }
      else if (op === 'pin') { if (cur !== s[2]) openChat(s[2]); await wait(300); await pinGame(s[1]); addMsg({ c: s[2], w: 'me', k: 'me', x: 'PIN: ' + s[1] }); await wait(400); }
      else if (op === 'call') { await callScene(s[1], s[2], s[3]); }
      else if (op === 'ch') {
        var idx = await new Promise(function (res) { P = { chat: s[1], opts: s[2], res: res }; if (view === 'chat' && cur === s[1]) renderChoice(); else { toastText('✋ Czeka na Twoją odpowiedź: <b>' + esc(nameOf(s[1])) + '</b>', s[1]); renderSide(); } badge(); });
        var o = s[2][idx]; addMsg({ c: s[1], w: 'me', k: 'me', x: o[0] }); applyTr(o[1]); await wait(450); await runSteps(o[2]);
      }
      else if (op === 'hub') {
        var left = s[1], opts = s[2].slice();
        while (left > 0 && opts.length) {
          view = 'list'; tab = 'chats'; cur = null; setView(); renderMain();
          var i2 = await new Promise(function (res) { P = { hub: true, left: left, opts: opts, res: res }; renderSide(); toastText('Wybierz, do kogo odpisujesz.'); badge(); });
          var h = opts.splice(i2, 1)[0]; left--; openChat(h[1]); await wait(400); await runSteps(h[2]); await wait(700);
        }
        view = 'list'; cur = null; setView(); renderMain(); renderSide();
      }
    }
    function save() { st = ls.get(); st.save = JSON.parse(JSON.stringify(S)); ls.set(st); }

    async function play() {
      try {
        while (S.scene < SC.length) {
          var sc = SC[S.scene]; S.clock = sc.t; badge(); await sceneCard(sc);
          await runSteps(sc.steps);
          S.scene++; save();
        }
        end();
      } catch (e) { /* przerwano */ }
    }
    function end() {
      var ev = EVORDER.filter(function (f) { return S.ev.indexOf(f) >= 0; }), fl = Object.keys(FLAGS).filter(function (k) { return S.fl[k]; });
      var o = document.createElement('div'); o.className = 'gb-end';
      o.innerHTML = '<div class="gb-end-bg" style="background-image:url(' + url('f12') + ')"></div><div class="gb-end-in"><small class="gb-eyebrow">Koniec odcinka 1 · 02:53</small><h2>Zły numer</h2>' +
        '<p class="gb-lead">Zenobia zniknęła. Ktoś pisał z jej telefonu. A Cisza wie, kim naprawdę jesteś.</p>' +
        '<div class="gb-sum"><div><b>' + (ENDINGS[S.fl.ending] || '—') + '</b><span>Twoja decyzja</span></div><div><b>' + ev.length + ' / ' + EVORDER.length + '</b><span>dowodów</span></div><div><b>' + S.clues.length + '</b><span>notatek</span></div></div>' +
        '<h3>Zaufanie</h3>' + trustHtml() +
        (fl.length ? '<h3>Twoje wybory</h3><div class="gb-flags">' + fl.map(function (k) { return '<span>' + esc(FLAGS[k]) + '</span>'; }).join('') + '</div>' : '') +
        (ev.length ? '<h3>Zebrane dowody</h3><div class="gb-evs">' + ev.map(function (f) { return '<button type="button" data-lb="' + f + '"><img src="' + url(f) + '" alt="' + esc(IM[f].t) + '" loading="lazy"></button>'; }).join('') + '</div>' : '') +
        '<div class="gb-next"><span>Wkrótce</span><b>Odcinek 2: NOC NAD RZEKĄ</b></div>' +
        '<a class="gb-go" href="#/gry">Wróć do gier</a><button type="button" class="gb-link" id="gb-again">Zagraj odcinek od nowa</button></div>';
      root().appendChild(o);
      [].forEach.call(o.querySelectorAll('[data-lb]'), function (x) { x.onclick = function () { openLight(x.dataset.lb); }; });
      o.querySelector('#gb-again').onclick = function () { st = ls.get(); st.save = null; ls.set(st); gate(); };
    }
    function start(state) {
      S = state; S.typing = {}; shell(); cur = null; view = 'list'; tab = 'chats'; setView(); renderMain(); renderSide();
      play();
    }
    var obs = new MutationObserver(function () { if (!el.isConnected) { alive = false; obs.disconnect(); } }); obs.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('hashchange', function () { alive = false; }, { once: true });
    gate();
  }
  window.GabinGame = { mount: mount, owner: owner };
})();
