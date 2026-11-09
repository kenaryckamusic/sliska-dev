/* GABIN – odcinek 1 „Zły numer”. Gra-thriller w czacie (styl Duskwood). TYLKO DLA WŁAŚCICIELA (dev.sliska.pl): nie kopiować do wersji publicznej.
 * Wszystkie postacie i wydarzenia są wymyślone. Treści 18+ (napięcie erotyczne, przemoc, wulgaryzmy). */
(function () {
  'use strict';
  var KEY = 'sn-gabin';
  var owner = function () { return !!window.__GABIN_TEST || (document.documentElement.classList.contains('is-dev') && typeof isOwnerRole === 'function' && isOwnerRole()); };   // tylko dev i tylko konto z rolą Właściciel
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var ls = { get: function () { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }, set: function (o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) { /* - */ } } };

  /* ---------- postacie ---------- */
  var CH = {
    z: { n: 'Nieznany numer', c: ['#7b2ff7', '#f107a3'], i: '?' },
    g: { n: 'Gabin 🌲 ekipa', c: ['#134e4a', '#0f766e'], i: '🌲', grp: 1 },
    lola: { n: 'Lola Mokrzycka', c: ['#ff6aa8', '#c4102a'], i: 'L' },
    mar: { n: 'Mariola Pieprzna', c: ['#f97316', '#b91c1c'], i: 'M' },
    pat: { n: 'Patryk Szeptun', c: ['#38bdf8', '#1d4ed8'], i: 'P' },
    kik: { n: 'Kiki Rozbierańska', c: ['#facc15', '#ec4899'], i: 'K' },
    cyr: { n: 'Cyryl Podniecki', c: ['#64748b', '#0f172a'], i: 'C' },
    hor: { n: 'Hortensja Biczyk', c: ['#a78bfa', '#4c1d95'], i: 'H' },
    cis: { n: 'Cisza', c: ['#111827', '#000'], i: '·' }
  };
  var TRUST = [['lola', 'Lola'], ['mar', 'Mariola'], ['pat', 'Patryk'], ['kik', 'Kiki'], ['cyr', 'Cyryl'], ['hor', 'Hortensja'], ['z', 'Zenobia']];

  /* ---------- obrazy (SVG) ---------- */
  var IMG = {
    pin: '<svg viewBox="0 0 400 300"><rect width="400" height="300" fill="#10202b"/><path d="M-10 210 C80 170 140 250 230 200 S360 140 420 170" stroke="#2c6a8a" stroke-width="26" fill="none"/><path d="M-10 210 C80 170 140 250 230 200 S360 140 420 170" stroke="#3b8fb8" stroke-width="3" fill="none" opacity=".6"/><g fill="#1b3342"><rect x="40" y="60" width="60" height="40"/><rect x="120" y="40" width="50" height="50"/><rect x="300" y="50" width="70" height="40"/><rect x="250" y="240" width="90" height="40"/></g><g transform="translate(205 140)"><path d="M0 0 C-22 -30 -26 -52 0 -62 C26 -52 22 -30 0 0Z" fill="#e11d48"/><circle cx="0" cy="-42" r="8" fill="#fff"/></g><text x="195" y="162" fill="#cbd5e1" font-size="11" font-family="sans-serif">Młyn Kruszewskich</text><text x="12" y="290" fill="#64748b" font-size="10" font-family="sans-serif">lokalizacja · 23:12 · bateria 4%</text></svg>',
    live: '<svg viewBox="0 0 400 300"><defs><radialGradient id="lg" cx="50%" cy="30%" r="60%"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".9"/><stop offset="1" stop-color="#0b1020" stop-opacity="0"/></radialGradient></defs><rect width="400" height="300" fill="#0b1020"/><rect y="230" width="400" height="70" fill="#141a2b"/><rect x="20" y="60" width="140" height="170" fill="#1b2238"/><rect x="40" y="90" width="40" height="40" fill="#fbbf24" opacity=".8"/><rect x="100" y="90" width="40" height="40" fill="#fbbf24" opacity=".5"/><text x="30" y="52" fill="#f472b6" font-size="14" font-family="sans-serif">BAR POD RYBĄ</text><rect x="196" y="40" width="6" height="190" fill="#222a44"/><circle cx="199" cy="40" r="10" fill="#ffe9a8"/><ellipse cx="199" cy="120" rx="110" ry="120" fill="url(#lg)"/><g><ellipse cx="160" cy="230" rx="28" ry="6" fill="#000" opacity=".4"/><rect x="146" y="150" width="28" height="78" rx="12" fill="#be185d"/><circle cx="160" cy="138" r="15" fill="#f1c9a5"/><path d="M143 134 C145 110 175 110 177 134 C170 124 150 124 143 134Z" fill="#2b1a12"/></g><g><ellipse cx="250" cy="232" rx="30" ry="6" fill="#000" opacity=".4"/><rect x="234" y="146" width="34" height="84" rx="12" fill="#0b0b0f"/><circle cx="251" cy="132" r="16" fill="#2a1d18"/><rect x="262" y="190" width="3" height="14" fill="#d4a017"/><circle cx="263.5" cy="208" r="6" fill="#d4a017"/><text x="259.5" y="211" fill="#7c2d12" font-size="7" font-family="sans-serif" font-weight="bold">C</text></g><text x="14" y="290" fill="#94a3b8" font-size="10" font-family="sans-serif">● LIVE · kiki.dymek · 22:41</text></svg>',
    hand: '<svg viewBox="0 0 400 300"><defs><linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0f1a"/><stop offset="1" stop-color="#1a2a3a"/></linearGradient></defs><rect width="400" height="300" fill="url(#fg)"/><ellipse cx="200" cy="110" rx="260" ry="50" fill="#9bb3c7" opacity=".12"/><ellipse cx="120" cy="170" rx="220" ry="40" fill="#9bb3c7" opacity=".1"/><path d="M0 220 C80 205 150 235 260 215 S380 200 400 205 L400 300 L0 300Z" fill="#162231"/><path d="M0 250 C90 238 160 262 270 244 S380 236 400 240 L400 300 L0 300Z" fill="#0e1722"/><g transform="translate(70 222) rotate(-8)"><path d="M0 0 C20 -16 60 -18 96 -6 L120 -2 L120 14 L90 20 C50 26 20 24 0 16Z" fill="#e8c4a0"/><rect x="92" y="-6" width="9" height="20" rx="3" fill="#e8c4a0"/><rect x="104" y="-4" width="8" height="19" rx="3" fill="#e8c4a0"/><rect x="114" y="-2" width="7" height="17" rx="3" fill="#e8c4a0"/><circle cx="96" cy="8" r="5" fill="none" stroke="#fbbf24" stroke-width="2.5"/><path d="M-4 6 L12 0" stroke="#b91c1c" stroke-width="4" opacity=".7"/></g><text x="12" y="290" fill="#64748b" font-size="10" font-family="sans-serif">02:09 · brak lokalizacji</text></svg>'
  };

  /* ---------- scenariusz ---------- */
  var M = function (c, w) { var t = [].slice.call(arguments, 2); return t.map(function (x) { return ['m', c, w, x]; }); };
  var cat = function () { return [].concat.apply([], arguments); };
  var SC = [];

  /* Scena 1: nieznany numer */
  SC.push({ id: 's1', t: '23:12', steps: cat(
    [['s', 'z', 'Wiadomość od nieznanego numeru']],
    M('z', 'z', 'halo', 'jest tam ktoś??', 'proszę odpisz'),
    [['ch', 'z', [
      ['kto to?', {}, cat(M('z', 'z', 'uff. nie wiem', 'nie wiem kim jesteś. ale odpisał{eś|aś}, to już coś'))],
      ['chyba pomyłka numeru', {}, cat(M('z', 'z', 'wiem. wiem że pomyłka', 'ale błagam nie rozłączaj się'))],
      ['ej, spokojnie. co się dzieje?', { z: 1 }, cat(M('z', 'z', 'nie umiem spokojnie sorry', 'mam 4% baterii i ktoś chodzi po młynie'))]
    ]]],
    M('z', 'z', 'dobra. słuchaj, będzie szybko', 'wpisałam zły numer. nie znam cię. ale nie mam do kogo', 'jestem w gabinie. w starym młynie nad rzeką, za cmentarzem', 'ktoś tu jest. słyszałam kroki. i drzwi na dole'),
    [['ch', 'z', [
      ['dzwonię na policję', { z: -1 }, cat(M('z', 'z', 'NIE', 'błagam nie dzwoń', 'nie teraz. nie wiem komu mogę ufać w tym mieście. jedyny policjant który tu pracuje siedzi u ignacego co sobotę'))],
      ['spokojnie. opowiedz po kolei', { z: 1 }, cat(M('z', 'z', 'okej. okej. oddycham', 'wyszłam z baru bo dostałam wiadomość. poszłam tu bo... długo by tłumaczyć'))],
      ['gdzie dokładnie? wyślij lokalizację', { z: 1 }, cat(M('z', 'z', 'czekaj'), [['img', 'z', 'z', 'pin']]) ]
    ]]],
    M('z', 'z', 'dobra. nie dam rady dłużej', 'dodałam cię do naszej grupy. „Gabin ekipa”, to moi znajomi', 'napisz że jesteś kuzynem Patryka z warszawy. on będzie wiedział że to ode mnie. reszta nie', 'i NIKOMU nie mów gdzie jestem. ani loli ani cyrylowi. nikomu', 'bateria 1%', 'dzięki że odpisał{eś|aś}, nieznajomy'),
    [['s', 'z', 'Ten numer jest teraz offline'],
     ['clue', 'mlyn', 'Młyn nad rzeką', 'Zenobia napisała z młyna za cmentarzem w Gabinie. Słyszała czyjeś kroki. Prosi, żeby nie mówić nikomu, gdzie jest, a przed ekipą mam udawać kuzyna Patryka z Warszawy.'],
     ['p', 900]]
  ) });

  /* Scena 2: grupa */
  SC.push({ id: 's2', t: '23:19', steps: cat(
    [['s', 'g', 'Zenobia dodała Cię do grupy „Gabin 🌲 ekipa”'], ['p', 700]],
    M('g', 'kik', 'kto to', 'serio zeni dodaje randomów o 23?? xd'),
    M('g', 'mar', '??', 'kim jesteś człowieku'),
    M('g', 'lola', 'zeni gdzie ty jesteś, odbierz w końcu 😭'),
    [['ch', 'g', [
      ['Hej. Jestem kuzynem Patryka z Warszawy. Zenobia mnie dodała.', { pat: 0 }, cat(
        M('g', 'pat', 'hm', 'ok.'),
        M('g', 'kik', 'patryk ty masz kuzyna?? 😂'),
        M('g', 'pat', 'no. mam. przyjechał niespodziewanie'),
        M('g', 'mar', 'to cześć kuzynku {nick}'),
        [['fl', 'told', 0]]
      )],
      ['Cześć. Zenobia napisała do mnie przez pomyłkę. Prosiła o pomoc.', { lola: 1, mar: 1, cyr: -1 }, cat(
        M('g', 'cyr', 'co?', 'kiedy'),
        M('g', 'lola', 'pomoc?? jaką pomoc'),
        M('g', 'kik', 'ok to nie jest śmieszne'),
        M('g', 'hor', 'kiedy dokładnie pisała i co napisała?'),
        M('g', 'mar', 'to ty jesteś z policji czy co'),
        [['fl', 'told', 1]]
      )]
    ]]],
    [['p', 600]],
    M('g', 'lola', 'ludzie... zostawiłam ją o 22:30 na parkingu. powiedziała że głowa jej pęka i jedzie do domu'),
    M('g', 'mar', 'mi mówiła że idzie na papierosa za bar. i nie wróciła'),
    M('g', 'kik', 'ja mam ją na live o 22:41. śmieje się z jakimś gościem pod lampą. nie wyglądało jak ktoś kto jedzie do domu'),
    M('g', 'cyr', 'nie widziałem jej od 21:30. siedziałem z Ignacym przy stoliku, mogę dać słowo'),
    M('g', 'hor', 'dałam jej koło 22 tabletki na migrenę. była bardzo spięta. myślałam że przez kłótnię z cyrylem'),
    M('g', 'cyr', 'hortensja, serio? teraz?'),
    M('g', 'hor', 'mówię fakty'),
    M('g', 'pat', 'próbuję namierzyć jej telefon'),
    M('g', 'lola', 'dzwońmy na policję!!'),
    M('g', 'cyr', 'poczekajmy do rana. ona często znika na kilka godzin jak się wkurzy'),
    M('g', 'mar', 'no tak ale nigdy bez telefonu'),
    [['ch', 'g', [
      ['Policja ma sens, ale najpierw zbierzmy fakty.', { hor: 1, lola: 1, cyr: -1 }, cat(M('g', 'hor', 'rozsądnie.'), M('g', 'lola', 'okej... okej, to co robimy'))],
      ['Cyryl ma rację. Poczekajmy do rana.', { cyr: 1, mar: -1, lola: -1 }, cat(M('g', 'cyr', 'dzięki'), M('g', 'mar', 'serio? dla ciebie to takie proste?'), M('g', 'lola', '😢'))],
      ['Nikt nie dzwoni na policję, dopóki nie sprawdzimy kilku rzeczy.', { pat: 1 }, cat(M('g', 'pat', 'zgoda'), M('g', 'kik', 'ale macie klimat jak w serialu xd'), M('g', 'mar', 'kiki. nie teraz.'))]
    ]]],
    [['clue', 'oś', 'Kto, gdzie, kiedy', '22:30 Lola widziała Zenobię na parkingu (jedzie do domu) · 22:41 Zenobia na live Kiki, pod lampą z jakimś mężczyzną · 21:30 Cyryl ostatni raz ją widział, siedział z Ignacym · 22:00 Hortensja dała jej tabletki, Zenobia była spięta.'],
     ['p', 700]]
  ) });

  /* Scena 3: rozmowy prywatne (wybierasz 2 z 4) */
  var DM_LOLA = cat(
    M('lola', 'lola', 'hej, to ty? kuzyn pata?', 'przepraszam że piszę ale jestem na skraju', 'my z zenią jesteśmy jak siostry. serio. nigdy się tak nie wyłączała'),
    [['ch', 'lola', [
      ['Co ci ostatnio mówiła?', { lola: 1 }, cat(
        M('lola', 'lola', 'dziwnie była. rozkojarzona', 'wczoraj płakała w toalecie w barze. mówiła że „wszystko się wyda”', 'nie powiedziała co. a ja nie dopytywałam, jestem beznadziejna 😭'),
        [['clue', 'wyda', '„Wszystko się wyda”', 'Wczoraj Zenobia płakała w toalecie baru i powiedziała Loli, że „wszystko się wyda”. Nie wiadomo, co.']]
      )],
      ['Co dokładnie robiłyście o 22:30?', { lola: 0 }, cat(
        M('lola', 'lola', 'stałyśmy na parkingu. dostała smsa, spojrzała na telefon i zbladła', 'powiedziała że jedzie do domu', 'ale jej auto stoi dalej pod barem, widzę je z okna. więc nie pojechała autem'),
        [['clue', 'auto', 'Auto Zenobii stoi pod barem', 'Zenobia powiedziała Loli, że jedzie do domu, ale jej samochód nadal stoi pod barem. Dostała wtedy SMS-a i zbladła.']]
      )],
      ['Z kimś się kłóciła?', { cyr: -1 }, cat(
        M('lola', 'lola', 'z cyrylem. ale to normalne, od trzech lat się kłócą', 'tylko dziś miał taki wzrok jakby ją chciał...', 'nie wiem. zapomnij'),
        M('lola', 'lola', 'nie mów mu że ci to napisałam proszę')
      )]
    ]]],
    M('lola', 'lola', 'przepraszam że tyle ci mówię', 'po prostu muszę z kimś pogadać. tobie jakoś ufam 🙈', 'masz ładny sposób pisania. skąd ty jesteś naprawdę?'),
    [['ch', 'lola', [
      ['Z warszawy. Jak mówiłem.', { lola: 0 }, cat(M('lola', 'lola', 'aha. ok 🙂'))],
      ['Z daleka. Opowiem, jak ją znajdziemy.', { lola: 1 }, cat(M('lola', 'lola', 'to mi się podoba 🥺', 'obiecujesz?'))],
      ['Nie ważne. Skup się na Zenobii.', { lola: -1 }, cat(M('lola', 'lola', 'ostry jesteś', 'ale okej. masz rację'))]
    ]]]
  );
  var DM_MAR = cat(
    M('mar', 'mar', 'ej kuzynku', 'gadaj co wiesz bo ja zaraz wyjebię tą kasę w powietrze'),
    [['ch', 'mar', [
      ['Spokojnie. Widziałaś coś w barze?', { mar: 1 }, cat(
        M('mar', 'mar', 'widziałam że koło 22:20 jakiś typ w czarnej kurtce o nią pytał', 'nie stąd. gabinian znam po twarzach, tego nie znałam', 'kazałam mu spierdalać bo wyglądał jak ktoś kto za dużo chce'),
        [['clue', 'kurtka', 'Facet w czarnej kurtce', 'Około 22:20 w barze Mariola widziała obcego mężczyznę w czarnej kurtce, który pytał o Zenobię. Nie jest z Gabina.']]
      )],
      ['Macie kamery w barze?', { mar: 0 }, cat(
        M('mar', 'mar', 'mamy. nad wejściem', 'ale nagrywa na dysk w biurze', 'a klucze do biura ma ignacy. to jego lokal, ja tylko prowadzę'),
        [['clue', 'kamera', 'Kamera w barze', 'Bar ma kamerę nad wejściem, ale nagrania są na dysku w biurze, do którego klucze ma Ignacy Zaspokajski, właściciel lokalu.']]
      )],
      ['Co sądzisz o Cyrylu?', { cyr: -1, mar: 1 }, cat(
        M('mar', 'mar', 'złoty chłopiec', 'uśmiech do kamery, wszystko wypolerowane', 'od kiedy startuje na burmistrza to się boi własnego cienia. ale żeby ją skrzywdzić? nie wiem. kurwa, nie wiem')
      )]
    ]]],
    M('mar', 'mar', 'dobra. mówię ci od razu', 'jak coś pierdolisz, to to wyczuję. mam nos do ściemy'),
    [['ch', 'mar', [
      ['Nie ściemniam. Chcę jej pomóc.', { mar: 1 }, cat(M('mar', 'mar', 'okej', 'to się lubimy'))],
      ['Mogłabyś mówić trochę łagodniej.', { mar: -1 }, cat(M('mar', 'mar', 'a ty mógłbyś nie pouczać obcej baby o 23 w nocy xd', 'ale ok. nie gniewam się'))],
      ['Lubię takie ostre babki.', { mar: 1 }, cat(M('mar', 'mar', 'haha', 'uważaj bo cię zjem', 'nie, serio. wracamy do tematu 😏'))]
    ]]]
  );
  var DM_PAT = cat(
    M('pat', 'pat', 'hej', 'ja nie mam kuzyna w warszawie xd'),
    [['ch', 'pat', [
      ['Skąd wiesz, że to Zenobia mnie dodała?', { pat: 1 }, cat(M('pat', 'pat', 'bo nikt inny by nie dodał obcego numeru bez pytania', 'tylko ona robi takie rzeczy'))],
      ['Masz rację. Nie jestem twoim kuzynem.', { pat: 1 }, cat(M('pat', 'pat', 'wiem', 'spoko. to co jesteś? bo piszesz jak ktoś kto zna się na rzeczy'))],
      ['Pomożesz mi?', { pat: 1 }, cat(M('pat', 'pat', 'to zależy. ale tak. chyba tak'))]
    ]]],
    M('pat', 'pat', 'namierzyłem jej telefon', 'ostatni sygnał 23:14. młyn kruszewskich. potem martwy', 'więc rozładowany albo wyłączony'),
    [['clue', 'sygnal', 'Ostatni sygnał telefonu', 'Patryk namierzył telefon Zenobii: ostatni sygnał o 23:14 przy młynie. Potem martwy (rozładowany albo wyłączony).']],
    M('pat', 'pat', 'tylko nie mów nikomu w grupie że mam ten dostęp. serio', 'to nie do końca legalne 🙂'),
    [['ch', 'pat', [
      ['Jestem reporterem.', { pat: 0 }, cat(M('pat', 'pat', 'no tak. to mnie nie dziwi', 'ale mnie nie cytuj'))],
      ['Jestem kimś, kto chce pomóc.', { pat: 1 }, cat(M('pat', 'pat', 'dobra odpowiedź'))],
      ['Nikt ważny.', { pat: 0 }, cat(M('pat', 'pat', 'ok. to się zgadza z tym jak piszesz xd'))]
    ]]]
  );
  var DM_KIK = cat(
    M('kik', 'kik', 'hej hej! nowy 😍', 'ok sorry za to że byłam taka w grupie, ja jak się stresuję to sarkastyczna', 'mam to nagranie z live. wysłać ci?'),
    [['ch', 'kik', [
      ['Jasne, wyślij.', { kik: 1 }, cat(M('kik', 'kik', 'wysyłam', 'tylko nie udostępniaj bo mnie zabiją'))],
      ['Wyślij i opowiedz, co widziałaś.', { kik: 1 }, cat(M('kik', 'kik', 'okej'))]
    ]]],
    [['img', 'kik', 'kik', 'live']],
    M('kik', 'kik', 'ona się tam śmieje z tym gościem', 'ale ja nie wiem kto to. stał tyłem. czarna kurtka', 'a potem wyszłam z live bo bateria mi padła, serio nic więcej nie widziałam'),
    [['clue', 'live', 'Nagranie z live Kiki', 'O 22:41 Zenobia stoi pod lampą przed barem i śmieje się z mężczyzną w czarnej kurtce, który stoi tyłem.']],
    M('kik', 'kik', 'a słuchaj. jesteś singlem? 👀', 'bo kuzyn patryka z warszawy to brzmi jak materiał na romans xd'),
    [['ch', 'kik', [
      ['Nie teraz, Kiki.', { kik: 0 }, cat(M('kik', 'kik', 'ok ok 😂 ale zapamiętam'))],
      ['Zobaczymy po tej nocy.', { kik: 1 }, cat(M('kik', 'kik', 'oooo 😍'))]
    ]]]
  );
  SC.push({ id: 's3', t: '23:41', steps: cat(
    [['s', 'g', 'Prywatne wiadomości'], ['p', 500]],
    [['hub', 2, [
      ['Napisz do Loli', 'lola', DM_LOLA],
      ['Napisz do Marioli', 'mar', DM_MAR],
      ['Napisz do Patryka', 'pat', DM_PAT],
      ['Napisz do Kiki', 'kik', DM_KIK]
    ]]]
  ) });

  /* Scena 4: Cyryl i Hortensja */
  SC.push({ id: 's4', t: '01:20', steps: cat(
    [['clock', '01:20'], ['s', 'g', 'Kiki wysłała zdjęcie z live']],
    M('g', 'kik', 'sorry ale nie wytrzymam. wrzucam kadr', 'jak dla mnie ten facet jest dziwnie znajomy'),
    [['img', 'g', 'kik', 'live']],
    [['zoom', 'live',
      cat([['clue', 'brelok', 'Brelok z literą C', 'W kieszeni mężczyzny z live wisi złoty brelok z literą „C”. Takie breloki rozdawał Cyryl Podniecki w kampanii.']],
          M('g', 'mar', 'zaraz. to nie jest brelok z kampanii cyryla?')),
      cat(M('g', 'mar', 'co on ma w kieszeni?', 'jakiś brelok?'))]],
    M('g', 'cyr', 'ludzie, po tym jednym zdjęciu? wielu ludzi ma takie breloki', 'rozdałem ich kilkaset'),
    [['ch', 'g', [
      ['Cyryl, gdzie dokładnie byłeś o 22:41?', { cyr: -1, mar: 1 }, cat(M('g', 'cyr', 'przy stoliku z Ignacym. powtarzam to po raz piąty', 'zapytaj go'), M('g', 'hor', 'zapytamy.'))],
      ['Nie oskarżajmy nikogo po jednym zdjęciu.', { cyr: 1, lola: 1 }, cat(M('g', 'cyr', 'dziękuję. przynajmniej ktoś ma głowę'), M('g', 'mar', 'to ty od początku masz najwięcej do ukrycia, więc nie dziękuj za wcześnie'))],
      ['Sprawdźmy kamerę z baru. Klucze ma Ignacy.', { mar: 1, pat: 1 }, cat(M('g', 'mar', 'nareszcie ktoś mówi sensownie', 'dzwonię do ignacego'), M('g', 'cyr', 'on śpi. jutro.'))]
    ]]],
    [['p', 800], ['s', 'hor', 'Hortensja Biczyk napisała do Ciebie']],
    M('hor', 'hor', 'mam do ciebie pytanie. prywatne', 'nie jesteś kuzynem patryka', 'patryk jest jedynakiem. byłam u niego na komunii'),
    [['ch', 'hor', [
      ['Masz rację. Nie jestem.', { hor: 1 }, cat(
        M('hor', 'hor', 'lubię ludzi którzy mówią prawdę', 'są tacy... rzadcy. zwłaszcza w nocy', 'nie powiem reszcie. na razie'),
        [['fl', 'hortKnows', 1]]
      )],
      ['Nie wiem, o czym mówisz.', { hor: -1 }, cat(
        M('hor', 'hor', 'oczywiście', 'jak chcesz. ale ja takie rzeczy zapamiętuję. bardzo dokładnie'),
        [['fl', 'hortKnows', 1]]
      )],
      ['A po co ci ta wiedza?', { hor: 0 }, cat(
        M('hor', 'hor', 'bo lubię wiedzieć, z kim rozmawiam', 'zwłaszcza kiedy ktoś pisze do mnie po północy', 'a ty piszesz w sposób... który zostaje w głowie 🙂')
      )]
    ]]]
  ) });

  /* Scena 5: kłamstwo i cliffhanger */
  SC.push({ id: 's5', t: '02:07', steps: cat(
    [['clock', '02:07'], ['ren', 'z', 'Zenobia'], ['s', 'g', 'Zenobia jest online']],
    M('g', 'z', 'tu zeni', 'wszystko ok. jestem u mamy. nie martwcie się i nie szukajcie mnie'),
    M('g', 'lola', 'ZENI 😭😭😭', 'żyjesz??'),
    M('g', 'cyr', 'no widzicie. mówiłem żeby poczekać'),
    M('g', 'kik', 'uff'),
    M('g', 'mar', 'czekaj. jaka mama'),
    [['ch', 'g', [
      ['Zenobia, jak masz na imię twój kot?', { lola: 0 }, cat(
        M('g', 'z', 'nie mam kota'),
        M('g', 'lola', 'zeni... masz kota od trzech lat. mruczek. pokazywałaś mi go wczoraj', 'kto to jest'),
        [['fl', 'imposter', 1], ['clue', 'imposter', 'To nie ona', 'Osoba piszącą z numeru Zenobii nie zna imienia jej kota. Ktoś ma jej telefon.']]
      )],
      ['To nie ona. Pisała do mnie z młyna.', { lola: -1, cyr: -1, mar: 1 }, cat(
        M('g', 'cyr', 'co ty gadasz', 'skąd wiesz gdzie jest'),
        M('g', 'lola', 'młyn?? jaki młyn'),
        M('g', 'hor', 'czyli jednak pisała do ciebie wcześniej. dużo wcześniej niż mówiłeś'),
        [['fl', 'imposter', 1], ['fl', 'revealed', 1]]
      )],
      ['Cieszę się. A mama gdzie mieszka?', { mar: 1 }, cat(
        M('g', 'z', 'za miastem'),
        M('g', 'mar', 'zeni. mama mieszka w gdańsku. od 5 lat. kto to pisze'),
        [['fl', 'imposter', 1]]
      )]
    ]]],
    M('g', 'pat', 'nie wiem kto to', 'ale numer jest jej. łączy się z nadajnikiem nad młynem'),
    [['p', 1000], ['s', 'cis', 'Nowa wiadomość: Cisza']],
    M('cis', 'cis', 'brawo', 'pierwszy który to zauważył'),
    [['img', 'cis', 'cis', 'hand']],
    M('cis', 'cis', 'jej już tam nie ma', 'ale jeszcze oddycha', 'za godzinę będziesz musiał wybrać komu ufasz. a potem nie będziesz miał czasu', 'ja wiem że nie jesteś kuzynem patryka. pytanie czy oni też się dowiedzą 🙂'),
    [['p', 1200]]
  ) });

  /* ---------- silnik ---------- */
  function mount(el, sub) {
    if (!owner()) { el.innerHTML = '<div class="gb-nope"><b>Ta gra jest dostępna tylko dla właściciela.</b><a href="#/gry">Wróć do gier</a></div>'; return; }
    var st = ls.get(), S = null, alive = true, speed = 1, view = 'list', cur = null, P = null, tab = 'chats';
    var fmt = function (t) { return String(t).replace(/\{nick\}/g, S ? S.nick : '').replace(/\{([^{}|]*)\|([^{}|]*)\}/g, function (_, a, b) { return S && S.g === 'f' ? b : a; }); };
    var $ = function (q) { return el.querySelector(q); };
    var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms * speed); }); };
    var nameOf = function (c) { return (S && S.names && S.names[c]) || CH[c].n; };
    var av = function (c, cls) { var m = CH[c]; return '<span class="gb-av ' + (cls || '') + '" style="--a:' + m.c[0] + ';--b:' + m.c[1] + '">' + m.i + '</span>'; };

    function gate() {
      el.innerHTML = '<div class="gb gb-gate"><div class="gb-gate-in"><small>GABIN · odcinek 1</small><h1>Zły numer</h1>' +
        '<p>Thriller w czacie. Rozmawiasz z mieszkańcami małego miasteczka, szukasz zaginionej dziewczyny i decydujesz, komu zaufać. Odpowiedzi mają znaczenie.</p>' +
        '<p class="gb-warn">Uwaga: treści dla dorosłych (przemoc, napięcie erotyczne, wulgaryzmy). Wszystkie postacie są wymyślone.</p>' +
        '<label class="gb-f"><span>Twoje imię w grze</span><input id="gb-nick" maxlength="14" placeholder="np. Kuba" value="' + esc(st.nick || '') + '" autocomplete="off"></label>' +
        '<div class="gb-g"><button type="button" class="is-on" data-g="m">On</button><button type="button" data-g="f">Ona</button></div>' +
        '<button type="button" class="gb-go" id="gb-go">Mam skończone 18 lat. Zaczynam</button>' +
        (st.save ? '<button type="button" class="gb-go gb-go2" id="gb-cont">Kontynuuj (scena ' + (st.save.scene + 1) + ' z ' + SC.length + ')</button><button type="button" class="gb-link" id="gb-reset">Zacznij od nowa</button>' : '') +
        '<a class="gb-link" href="#/gry">← Wróć</a></div></div>';
      var g = 'm';
      [].forEach.call(el.querySelectorAll('[data-g]'), function (b) { b.onclick = function () { g = b.dataset.g; [].forEach.call(el.querySelectorAll('[data-g]'), function (x) { x.classList.toggle('is-on', x === b); }); }; });
      $('#gb-go').onclick = function () { var n = $('#gb-nick').value.trim() || 'Kuba'; st = { nick: n, g: g, ok: 1 }; ls.set(st); start({ nick: n, g: g, scene: 0, log: [], tr: {}, fl: {}, clues: [], un: {}, names: {}, clock: '23:12', tick: 0 }); };
      if ($('#gb-cont')) $('#gb-cont').onclick = function () { start(JSON.parse(JSON.stringify(st.save))); };
      if ($('#gb-reset')) $('#gb-reset').onclick = function () { st.save = null; ls.set(st); gate(); };
    }

    function shell() {
      el.innerHTML = '<div class="gb"><div class="gb-phone"><header class="gb-top"><a class="gb-x" href="#/gry" aria-label="Wyjdź">‹</a><b>GABIN</b><span class="gb-clock" id="gb-clock"></span><button type="button" class="gb-sp" id="gb-sp" title="Przyspiesz oczekiwanie">⏩</button></header>' +
        '<div class="gb-toast" id="gb-toast"></div><main class="gb-main" id="gb-main"></main>' +
        '<nav class="gb-tabs"><button type="button" data-t="chats" class="is-on">Czaty<i id="gb-bd"></i></button><button type="button" data-t="notes">Notatnik<i id="gb-nb"></i></button></nav></div></div>';
      $('#gb-sp').onclick = function () { speed = speed === 1 ? 0.15 : 1; $('#gb-sp').classList.toggle('is-on', speed !== 1); };
      [].forEach.call(el.querySelectorAll('[data-t]'), function (b) { b.onclick = function () { tab = b.dataset.t; if (tab === 'chats') { view = cur ? 'chat' : 'list'; } else view = 'notes'; render(); }; });
    }

    function badge() {
      var n = 0; Object.keys(S.un).forEach(function (k) { n += S.un[k] || 0; }); if (P) n += 1;
      var b = $('#gb-bd'); if (b) b.textContent = n ? n : '';
      var nb = $('#gb-nb'); if (nb) nb.textContent = S.clues.length ? S.clues.length : '';
      var c = $('#gb-clock'); if (c) c.textContent = S.clock;
      [].forEach.call(el.querySelectorAll('[data-t]'), function (x) { x.classList.toggle('is-on', x.dataset.t === (view === 'notes' ? 'notes' : 'chats')); });
    }
    function last(c) { for (var i = S.log.length - 1; i >= 0; i--) if (S.log[i].c === c && S.log[i].k !== 's') return S.log[i]; return null; }
    function chatsOrder() {
      var seen = {}, order = [];
      for (var i = S.log.length - 1; i >= 0; i--) { var c = S.log[i].c; if (!seen[c]) { seen[c] = 1; order.push(c); } }
      return order;
    }
    function msgHtml(m, grp) {
      if (m.k === 's') return '<div class="gb-sys">' + esc(fmt(m.x)) + '</div>';
      if (m.k === 'me') return '<div class="gb-m me"><div class="gb-b">' + esc(fmt(m.x)) + '<time>' + m.t + '</time></div></div>';
      var body = m.k === 'img' ? '<button type="button" class="gb-img" data-img="' + m.x + '">' + IMG[m.x] + '<span>' + (m.cap ? esc(m.cap) : 'Zdjęcie') + '</span></button>' : esc(fmt(m.x));
      return '<div class="gb-m"><div class="gb-b">' + (grp ? '<small style="color:' + CH[m.w].c[0] + '">' + esc(nameOf(m.w)) + '</small>' : '') + body + '<time>' + m.t + '</time></div></div>';
    }
    function render() {
      var main = $('#gb-main'); if (!main) return; badge();
      if (view === 'notes') {
        main.innerHTML = '<div class="gb-notes"><h2>Notatnik</h2>' + (S.clues.length ? S.clues.map(function (c) { return '<div class="gb-clue"><b>' + esc(c[1]) + '</b><p>' + esc(fmt(c[2])) + '</p></div>'; }).join('') : '<p class="gb-empty">Jeszcze nic nie wiesz. Rozmawiaj z ludźmi.</p>') + trustHtml() + '</div>'; return;
      }
      if (view === 'list') {
        var rows = chatsOrder().map(function (c) {
          var l = last(c), un = S.un[c] || 0, typ = S.typing && S.typing[c], pend = P && P.chat === c;
          return '<button type="button" class="gb-row" data-c="' + c + '">' + av(c) + '<span class="gb-row-t"><b>' + esc(nameOf(c)) + '</b><small>' + (typ ? '<i class="gb-typ">pisze…</i>' : l ? esc((l.k === 'me' ? 'Ty: ' : '') + (l.k === 'img' ? '📷 Zdjęcie' : fmt(l.x))) : '') + '</small></span><span class="gb-row-m">' + (pend ? '<em>✋</em>' : '') + (un ? '<u>' + un + '</u>' : '') + '</span></button>';
        }).join('');
        main.innerHTML = '<div class="gb-list">' + (P && P.hub ? hubHtml() : '') + (rows || '<p class="gb-empty">Brak rozmów.</p>') + '</div>';
        [].forEach.call(main.querySelectorAll('[data-c]'), function (b) { b.onclick = function () { openChat(b.dataset.c); }; });
        [].forEach.call(main.querySelectorAll('[data-hub]'), function (b) { b.onclick = function () { var i = +b.dataset.hub; var p = P; P = null; p.res(i); }; });
        return;
      }
      var m = CH[cur];
      main.innerHTML = '<div class="gb-chat"><header class="gb-ch-h"><button type="button" class="gb-back" id="gb-back">‹</button>' + av(cur, 'sm') + '<span><b>' + esc(nameOf(cur)) + '</b><small id="gb-st">' + (m.grp ? '7 osób' : 'online') + '</small></span></header>' +
        '<div class="gb-msgs" id="gb-msgs">' + S.log.filter(function (x) { return x.c === cur; }).map(function (x) { return msgHtml(x, m.grp); }).join('') + '</div><div class="gb-cho" id="gb-cho"></div></div>';
      $('#gb-back').onclick = function () { cur = null; view = 'list'; render(); };
      bindImgs(); scrollDown(); renderChoice();
    }
    function hubHtml() { return '<div class="gb-hub"><b>Do kogo teraz piszesz?</b><small>Wybierz rozmowę (zostało ' + P.left + ')</small>' + P.opts.map(function (o, i) { return '<button type="button" data-hub="' + i + '">' + esc(o[0]) + '</button>'; }).join('') + '</div>'; }
    function trustHtml() {
      return '<h2>Zaufanie</h2><div class="gb-trust">' + TRUST.map(function (t) { var v = Math.max(-3, Math.min(6, S.tr[t[0]] || 0)); return '<div><span>' + t[1] + '</span><i><u style="width:' + ((v + 3) / 9 * 100) + '%"></u></i></div>'; }).join('') + '</div>';
    }
    function scrollDown() { var m = $('#gb-msgs'); if (m) m.scrollTop = m.scrollHeight; }
    function renderChoice() {
      var c = $('#gb-cho'); if (!c) return;
      if (P && P.chat === cur && P.opts) {
        c.innerHTML = P.opts.map(function (o, i) { return '<button type="button" data-o="' + i + '">' + esc(fmt(o[0])) + '</button>'; }).join('');
        [].forEach.call(c.querySelectorAll('[data-o]'), function (b) { b.onclick = function () { var i = +b.dataset.o, p = P; P = null; c.innerHTML = ''; p.res(i); }; });
      } else if (Z && Z.chat === cur) {
        c.innerHTML = '<button type="button" id="gb-look">🔍 Przyjrzyj się zdjęciu</button><button type="button" id="gb-skip">Pomiń</button>';
        $('#gb-look').onclick = function () { openLight(Z.id, true); }; $('#gb-skip').onclick = function () { var z = Z; Z = null; c.innerHTML = ''; z.res(false); };
      } else c.innerHTML = '';
    }
    function openChat(c) { cur = c; view = 'chat'; tab = 'chats'; S.un[c] = 0; render(); }

    function tickClock() { S.tick++; if (S.tick % 3 === 0) { var p = S.clock.split(':'), h = +p[0], m = +p[1] + 1; if (m >= 60) { m = 0; h = (h + 1) % 24; } S.clock = ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2); } }
    function toast(c, text) {
      var t = $('#gb-toast'); if (!t) return; t.innerHTML = '<b>' + esc(nameOf(c)) + '</b> ' + esc(text); t.className = 'gb-toast is-on'; t.onclick = function () { openChat(c); t.className = 'gb-toast'; };
      clearTimeout(toast.h); toast.h = setTimeout(function () { t.className = 'gb-toast'; }, 3200 * speed + 400);
    }
    function addMsg(m) {
      m.t = S.clock; S.log.push(m);
      if (m.k !== 'me') { S.typing[m.c] = false; }
      if (view === 'chat' && cur === m.c) { var box = $('#gb-msgs'); if (box) { var ty = $('#gb-typing'); if (ty) ty.remove(); box.insertAdjacentHTML('beforeend', msgHtml(m, CH[m.c].grp)); bindImgs(); scrollDown(); } }
      else { if (m.k !== 'me' && m.k !== 's') { S.un[m.c] = (S.un[m.c] || 0) + 1; toast(m.c, m.k === 'img' ? '📷 Zdjęcie' : fmt(m.x)); } if (view === 'list') render(); else badge(); }
      badge();
    }
    async function typing(c, text) {
      var ms = Math.min(2600, 500 + String(text).length * 32);
      S.typing[c] = true;
      if (view === 'chat' && cur === c) { var box = $('#gb-msgs'); if (box) { box.insertAdjacentHTML('beforeend', '<div class="gb-m"><div class="gb-b gb-tp" id="gb-typing"><i></i><i></i><i></i></div></div>'); scrollDown(); } }
      else if (view === 'list') render();
      await wait(ms);
      var ty = $('#gb-typing'); if (ty) ty.remove();
    }
    function bindImgs() { [].forEach.call(el.querySelectorAll('[data-img]'), function (b) { b.onclick = function () { openLight(b.dataset.img, false); }; }); }
    var Z = null;
    function openLight(id, search) {
      var lb = document.createElement('div'); lb.className = 'gb-lb'; lb.innerHTML = '<div class="gb-lb-in">' + IMG[id] + '<p>' + (search ? 'Dotknij miejsca, które wydaje Ci się dziwne.' : '') + '</p><button type="button">Zamknij</button></div>';
      el.appendChild(lb); var closed = false;
      function close(found) { if (closed) return; closed = true; lb.remove(); if (search && Z) { var z = Z; if (found) { Z = null; renderChoice(); z.res(true); } } }
      lb.querySelector('button').onclick = function () { close(false); };
      if (search && id === 'live') lb.querySelector('svg').onclick = function (e) {
        var r = this.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 400, y = (e.clientY - r.top) / r.height * 300;
        if (Math.hypot(x - 263, y - 205) < 26) { lb.querySelector('p').textContent = 'Jest. Brelok z literą C.'; setTimeout(function () { close(true); }, 900); } else lb.querySelector('p').textContent = 'Nic tu nie widać. Spróbuj gdzie indziej.';
      };
    }

    /* interpreter */
    async function exec(s) {
      if (!alive || !el.isConnected) throw new Error('stop');
      var op = s[0];
      if (op === 'm') { await typing(s[1], fmt(s[3])); addMsg({ c: s[1], w: s[2], k: 't', x: s[3] }); tickClock(); await wait(250 + Math.random() * 350); }
      else if (op === 's') { addMsg({ c: s[1], w: 'sys', k: 's', x: s[2] }); await wait(500); }
      else if (op === 'p') { await wait(s[1]); }
      else if (op === 'clock') { S.clock = s[1]; badge(); }
      else if (op === 'ren') { S.names[s[1]] = s[2]; render(); }
      else if (op === 'fl') { S.fl[s[1]] = s[2]; }
      else if (op === 'clue') { if (!S.clues.some(function (c) { return c[0] === s[1]; })) { S.clues.push([s[1], s[2], s[3]]); toastClue(s[2]); badge(); } }
      else if (op === 'img') { await wait(600); addMsg({ c: s[1], w: s[2], k: 'img', x: s[3], cap: s[4] }); await wait(500); }
      else if (op === 'zoom') { var img = s[1], chat = 'g'; Z = null; var found = await new Promise(function (res) { Z = { id: img, chat: chat, res: res }; if (view === 'chat' && cur === chat) renderChoice(); else { toastText('🔍 Zdjęcie w grupie. Przyjrzyj się mu.'); badge(); } }); await runSteps(found ? s[2] : s[3]); }
      else if (op === 'ch') { var idx = await new Promise(function (res) { P = { chat: s[1], opts: s[2], res: res }; if (view === 'chat' && cur === s[1]) renderChoice(); else { if (view === 'list') render(); else badge(); toastText('✋ Czeka na Twoją odpowiedź: ' + nameOf(s[1])); } badge(); }); var o = s[2][idx]; addMsg({ c: s[1], w: 'me', k: 'me', x: o[0] }); applyTr(o[1]); await wait(500); await runSteps(o[2]); }
      else if (op === 'hub') { var left = s[1], opts = s[2].slice(); while (left > 0 && opts.length) { view = 'list'; cur = null; var i2 = await new Promise(function (res) { P = { hub: true, left: left, opts: opts, res: res }; render(); toastText('Wybierz, do kogo piszesz.'); }); var h = opts.splice(i2, 1)[0]; left--; openChat(h[1]); await wait(400); await runSteps(h[2]); await wait(500); } view = 'list'; cur = null; render(); }
    }
    function applyTr(t) { if (!t) return; Object.keys(t).forEach(function (k) { S.tr[k] = (S.tr[k] || 0) + t[k]; }); }
    function toastText(t) { var e = $('#gb-toast'); if (!e) return; e.textContent = t; e.className = 'gb-toast is-on'; e.onclick = null; clearTimeout(toast.h); toast.h = setTimeout(function () { e.className = 'gb-toast'; }, 2600 * speed + 800); }
    function toastClue(t) { toastText('🗒️ Nowa wskazówka: ' + t); }
    async function runSteps(steps) { for (var i = 0; i < steps.length; i++) await exec(steps[i]); }
    function save() { st = ls.get(); st.save = JSON.parse(JSON.stringify(S)); ls.set(st); }

    async function play() {
      try {
        while (S.scene < SC.length) {
          var sc = SC[S.scene]; S.clock = sc.t; badge();
          await runSteps(sc.steps);
          S.scene++; save();
        }
        end();
      } catch (e) { /* przerwano */ }
    }
    function end() {
      view = 'notes'; render(); var main = $('#gb-main');
      if (main) main.innerHTML = '<div class="gb-end"><small>Koniec odcinka 1</small><h2>Zły numer</h2><p>Zenobia zniknęła. Ktoś pisze z jej telefonu. A Cisza wie, kim naprawdę jesteś.</p>' + trustHtml() +
        '<p class="gb-sum">Znalezione wskazówki: <b>' + S.clues.length + '</b> · ' + (S.fl.imposter ? 'Wykryłeś podszywającego się pod Zenobię.' : 'Nie rozpoznałeś jeszcze, że to nie ona.') + '</p>' +
        '<div class="gb-next"><b>Odcinek 2: „Noc nad rzeką”</b><span>Wkrótce</span></div><a class="gb-go" href="#/gry">Wróć do gier</a><button type="button" class="gb-link" id="gb-again">Zagraj odcinek od nowa</button></div>';
      var a = $('#gb-again'); if (a) a.onclick = function () { st = ls.get(); st.save = null; ls.set(st); gate(); };
    }
    function start(state) {
      S = state; S.typing = {}; shell(); cur = null; view = 'list';
      if (S.scene > 0 || S.log.length) { render(); } else render();
      play();
    }
    el.addEventListener('DOMNodeRemoved', function () { /* ignoruj */ });
    var obs = new MutationObserver(function () { if (!el.isConnected) { alive = false; obs.disconnect(); } }); obs.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('hashchange', function () { alive = false; }, { once: true });
    gate();
  }
  window.GabinGame = { mount: mount, owner: owner };
})();
