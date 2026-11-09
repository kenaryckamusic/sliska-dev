/* Śliska News – Redaktor Naczelny (gra fabularna, tydzień w redakcji).
 * Ładowana po gry.js; rejestruje window.NaczelnySim.mount(el, H). H to zestaw pomocników z gry.js (G, K, esc, shell, submit, xp, played, share, load, save, toast, LINK).
 * 5 dni po 2 tematy (10 z 20 losowych). Cztery paski: Klikalność, Wiarygodność, Pozwy, Nerwy. Rekord = wynik końcowy 0–100.
 * Zakończenia i osiągnięcia zapisują się lokalnie (load()/save() z gry.js), rekord – na koncie jak w innych grach. */
(function () {
  'use strict';
  var RUN_KEY = 'sn-nac-run';
  /* paski: k = Klikalność (wyżej lepiej), w = Wiarygodność (wyżej lepiej), p = Pozwy (niżej lepiej), n = Nerwy (niżej lepiej) */
  var STATS = [['k', 'Klikalność', 1], ['w', 'Wiarygodność', 1], ['p', 'Pozwy', 0], ['n', 'Nerwy', 0]];
  var DAYS = 5, PER = 2;

  /* [kto/skąd, treść, [[wybór, {efekty}, skutek], ...]] */
  var TOPICS = [
    ['Forum', 'Anonim pisze, że raper Wikos zdradził żonę. Nikt tego nie potwierdził, ale post ma 4 tys. polubień.', [
      ['Publikuję od razu', { k: 18, w: -12, p: 14 }, 'Klikalność w kosmosie. Prawnik Wikosa pisał już, zanim skończyłeś kawę.'],
      ['Dzwonię po potwierdzenie', { k: 4, w: 8, n: 6 }, 'Management zdementował. Dobrze, że nie poszło na stronę.'],
      ['Do kosza', { k: -4, w: 2, n: -4 }, 'Cisza. Nikt nie pyta o temat, którego nie było.']]],
    ['Stażysta', 'Fan przysłał pliki z nowym albumem gwiazdy, który ma wyjść dopiero za miesiąc. Całość jest w sieci.', [
      ['Publikuję cały wyciek', { k: 16, w: -6, p: 16 }, 'Wytwórnia już dzwoni. Nie z gratulacjami.'],
      ['Piszę o wycieku, bez linków', { k: 9, w: 4, p: 2 }, 'Dobry kompromis. Dużo wejść i nikt nie jest zły.'],
      ['Dzwonię do wytwórni', { k: 3, w: 6, n: 4 }, 'Dostajesz komentarz i wyłączność na premierę. Skromnie, ale uczciwie.']]],
    ['Agencja', 'Zespół odwołał koncert z powodu „bólu gardła”. Fani na forum piszą o kłótni.', [
      ['Tytuł: „Kłótnia w zespole”', { k: 14, w: -8, p: 8 }, 'Klik, klik, klik. A zespół właśnie zapowiada sprostowanie.'],
      ['Piszę tylko o odwołaniu', { k: -2, w: 4 }, 'Poprawnie i nudno. Nikt się nie czepia.'],
      ['Czekam na oświadczenie', { k: 2, w: 7, n: 5 }, 'Oświadczenie przyszło wieczorem. Ty też byłeś pierwszy w kolejce.']]],
    ['Marketing', 'Marka energetyków płaci 5000 zł za „niezależną recenzję” nowego singla ich ambasadora.', [
      ['Biorę kasę, bez oznaczenia', { k: 6, w: -14, p: 8, n: -3 }, 'Pieniądze są. Czytelnicy zauważyli. Ty też zauważysz w komentarzach.'],
      ['Z oznaczeniem „Sponsorowane”', { k: 2, w: 3, n: -4 }, 'Czysto i profesjonalnie. Reklamodawca też się cieszy.'],
      ['Odmawiam', { k: -3, w: 8, n: 5 }, 'Szef wzdycha, ale redakcja ma twarz.']]],
    ['Prawnik', 'Prawnik raperki żąda usunięcia artykułu o jej koncertowej wpadce.', [
      ['Usuwam od razu', { p: -12, w: -8, n: -6 }, 'Spokój. Ale redakcja już wie, że łatwo Cię złamać.'],
      ['Odpisuję i dodaję sprostowanie', { p: -4, w: 5, n: 4 }, 'Uczciwie i po ludzku. Prawnik odpuszcza.'],
      ['Publikuję jego list jako news', { k: 14, p: 14, w: -3 }, 'Hit tygodnia! Prawnik odpisuje jeszcze dłuższym listem.']]],
    ['Korekta', 'Stażysta napisał tekst z pięcioma literówkami w samym tytule.', [
      ['Poprawiam po cichu', { w: 2, n: 3 }, 'Nikt nie zauważył. Chyba.'],
      ['Zostawiam, niech żyje memami', { k: 10, w: -8, n: -3 }, 'Screeny krążą po sieci. Klikalność rośnie, godność maleje.'],
      ['Sprostowanie z żartem', { k: 6, w: 4, n: 2 }, 'Czytelnicy lubią, gdy się przyznajesz. Zero pretensji.']]],
    ['TikTok', 'Gwiazda TikToka płacze na żywo. Pół internetu pyta, czy to PR.', [
      ['Tytuł: „Łzy czy chwyt?”', { k: 12, w: -6, p: 5 }, 'Bardzo klikalne. Mniej sympatyczne.'],
      ['Piszę ze współczuciem', { k: 4, w: 5, n: -3 }, 'Ciepły tekst, spokojne komentarze.'],
      ['Pomijam temat', { k: -3, n: -5 }, 'Cisza po Twojej stronie. Mniej pracy.']]],
    ['Czytelnik', 'Czytelnik wysyła zrzut ekranu prywatnej rozmowy rapera. Wygląda na prawdziwy.', [
      ['Publikuję', { k: 15, w: -12, p: 18 }, 'Dramat na pół kraju. Pozew przyjdzie szybciej niż komentarze.'],
      ['Pytam artystę o komentarz', { k: 5, w: 7, n: 6 }, 'Artysta odpisał jednym zdaniem, ale to wystarczy na uczciwy tekst.'],
      ['Blokuję nadawcę', { w: 2, k: -2, n: -6 }, 'Święty spokój.']]],
    ['Dział czytelników', 'Sondaż „najgorszy wers roku”: 4000 głosów. Podejrzanie dużo z jednego adresu IP.', [
      ['Publikuję wyniki', { k: 10, w: -10, p: 2 }, 'Boty wygrały sondaż. Czytelnicy to wyczuli.'],
      ['Sprawdzam głosy', { k: -4, w: 8, n: 8 }, 'Sprzątanie zajęło popołudnie, ale wynik jest uczciwy.'],
      ['Piszę żart o botach', { k: 8, w: 2, n: -4 }, 'Czytelnicy się śmieją. Boty nie mają poczucia humoru.']]],
    ['Dwie strony', 'Dwaj raperzy w beefie wysyłają Ci „ekskluzywne” materiały przeciwko sobie.', [
      ['Publikuję obie strony', { k: 12, w: 6, p: 6, n: 8 }, 'Uczciwie, głośno i męcząco. Obaj są trochę obrażeni.'],
      ['Biorę klikalniejszą stronę', { k: 16, w: -10, p: 10 }, 'Klików masa. Druga strona już się odgraża.'],
      ['Niech się kłócą sami', { k: -3, n: -3 }, 'Spokój. Wszyscy piszą o tym beefie poza Tobą.']]],
    ['Konkurencja', 'Konkurencyjny portal skopiował Twój artykuł słowo w słowo.', [
      ['Oburzony wpis w mediach', { k: 9, w: 2, n: 4, p: 2 }, 'Internet ma ulubioną aferę. Tym razem jest o Was.'],
      ['Wysyłam to prawnikowi', { w: 4, n: 2, p: 6 }, 'Pismo poszło. Powiedzą, że to był „przypadek”.'],
      ['Ignoruję', { n: -4, k: -2 }, 'Kopiowanie to też forma komplementu. Podobno.']]],
    ['Redakcja', 'Redaktorka prosi o urlop w środku tygodnia. Ruch jest duży.', [
      ['Zgoda', { n: -8, k: -3 }, 'Wraca wypoczęta za trzy dni. Zespół Cię lubi.'],
      ['Odmawiam', { n: 12, w: -2 }, 'Zostaje, ale cała redakcja patrzy na Ciebie krzywo.'],
      ['Dwa dni zdalnie', { n: -3, k: -1 }, 'Pół urlopu, pół pracy, pełna sprawiedliwość.']]],
    ['Gala', 'Znana gwiazda wysyła kosz kwiatów i prosi o „miłe słowa” w recenzji płyty.', [
      ['Przyjmuję i piszę miło', { k: 4, w: -9, n: -3 }, 'Płyta dostaje dziewiątkę. Ludzie się dziwią.'],
      ['Oddaję kwiaty', { w: 6, n: 2 }, 'Kurier wrócił z bukietem. Cała redakcja jest dumna.'],
      ['Piszę szczerą recenzję', { k: 5, w: 7, p: 6 }, 'Czytelnicy lubią szczerość. Gwiazda nie bardzo.']]],
    ['Plotka', 'Plotka: znany kompozytor został skreślony z listy festiwalu.', [
      ['Tytuł: „Na pewno wypadł!”', { k: 14, w: -10, p: 10 }, 'Festiwal zdementował po godzinie. Sprostowanie boli.'],
      ['Tytuł: „Nieoficjalnie…”', { k: 8, w: -2, p: 4 }, 'Bezpieczne słówko, które ratuje skórę.'],
      ['Pytam organizatorów', { k: 2, w: 6, n: 4 }, 'Odpowiedź przyszła po południu. Tekst jest czysty.']]],
    ['Poczta', 'Do redakcji przychodzi paczka z podejrzanym proszkiem i liścikiem „napiszcie o mnie”.', [
      ['Zgłaszam sprawę', { w: 3, n: 6 }, 'Poszedł protokół. Zrobiło się trochę nerwowo, ale poprawnie.'],
      ['Robię z tego newsa', { k: 13, w: -5, n: 4, p: 5 }, 'Rekord kliknięć. Prawnik krzywi się w kącie.'],
      ['Wyrzucam', { n: -3 }, 'Szybko i spokojnie. Może to był cukier puder.']]],
    ['Management', 'Raperka zgodzi się na wywiad, jeśli zobaczy pytania i tekst do autoryzacji.', [
      ['Pełna autoryzacja', { w: -3, n: -4, p: -6, k: 2 }, 'Spokojne wywiady to spokojne życie. Czytelnicy tego nie czują.'],
      ['Tylko pytania', { w: 3, k: 4, n: 2 }, 'Złoty środek. Wywiad idzie jak w zegarku.'],
      ['Odmawiam', { k: -3, w: 5, p: 6, n: 4 }, 'Wywiadu nie będzie, ale masz twarz.']]],
    ['Serwer', 'Serwer padł w szczycie ruchu. Wszyscy odświeżają stronę.', [
      ['Płacę za mocniejszy serwer', { n: 8, k: 10 }, 'Znów działa. Księgowa już się denerwuje.'],
      ['Przepraszam w mediach', { k: 6, w: 4, n: 2 }, 'Czytelnicy lubią szczerość. Wracają do odświeżania.'],
      ['Czekam, aż samo przejdzie', { k: -12, n: 4 }, 'Nie przeszło. Ruch trafił do konkurencji.']]],
    ['Komentarze', 'Pod artykułem ktoś pisze pod prawdziwym nazwiskiem hejt na artystę.', [
      ['Zostawiam: wolność słowa', { k: 10, w: -6, p: 12 }, 'Komentarze rosną. Artysta już wie, kto napisał.'],
      ['Usuwam komentarze', { w: 3, n: 5, k: -4, p: -6 }, 'Czysto, ale ktoś płacze o cenzurze.'],
      ['Włączam slow-mode', { w: 4, k: -2, n: 2 }, 'Czytelnicy muszą się chwilę zastanowić. Działa.']]],
    ['Artysta', 'Artysta przysyła filmik, który ma dowodzić jego niewinności. Wygląda na zmontowany.', [
      ['Publikuję', { k: 9, w: -9, p: 8 }, 'Internet rozkłada film na klatki w kwadrans.'],
      ['Daję do sprawdzenia ekspertowi', { k: -3, w: 9, n: 7 }, 'Ekspert potwierdził montaż. Masz pewny tekst.'],
      ['Piszę o wątpliwościach', { k: 8, w: 4, p: 4, n: 3 }, 'Rozsądny ton. Artysta nie jest zachwycony.']]],
    ['Właściciel', 'Szef prosi o „lekki tekst o prezentach” z okazji świąt.', [
      ['Piszę lekki tekst', { k: 6, w: 1, n: -3 }, 'Przyjemny, krótki i dobrze się czyta.'],
      ['Wciskam w niego reklamę', { k: 2, w: -6, p: 2 }, 'Czytelnicy mają nos do kryptoreklamy.'],
      ['Odmawiam', { n: 6, w: 3 }, 'Szef się obraził. Redakcja się cieszy.']]],
    /* pikantne (postacie wyłącznie fikcyjne) */
    ['Paparazzo', 'Zdjęcie: fikcyjna gwiazda pop Lola Wilgotna wychodzi o 6 rano z hotelu w cudzej koszuli. Pod spodem jej mąż, prezes klubu żeglarskiego, „nic nie wie”.', [
      ['Tytuł: „Koszula Loli. Czyja?”', { k: 20, w: -10, p: 14, n: 4 }, 'Rekord wejść. Prawnik Loli napisał pozew szybciej niż Ty tytuł.'],
      ['Piszę elegancko o „porannym spacerze”', { k: 8, w: 3, p: 2 }, 'Wszyscy wiedzą, o co chodzi, nikt nie może Cię pozwać. Mistrzostwo aluzji.'],
      ['Odsprzedaję zdjęcie konkurencji', { k: 6, w: -8, p: 6, n: -2 }, 'Kasa wpadła, szacunek wypadł. Redakcja udaje, że nic nie widziała.']]],
    ['Influencerka', 'Fikcyjna Kasia Kuszyńska wrzuca „kulisy sesji bielizny” i prosi, żebyś napisał, że to „sztuka”. W tle widać Twojego szefa.', [
      ['Piszę: „Sztuka. Niesamowita sztuka”', { k: 14, w: -6, p: 2, n: -3 }, 'Szef nagle ma pochwałę dla całego zespołu. Rzadko się to zdarza.'],
      ['Wycinam szefa z kadru', { k: 10, w: 2, n: 4 }, 'Kadr czysty, a szef i tak wie, że wiesz. Awansu nie będzie.'],
      ['Odrzucam. To reklama', { k: -2, w: 8, n: 3 }, 'Pozostajesz nieskazitelny. Kasia poszła do konkurencji.']]],
    ['Tajemniczy mail', 'Anonim: „Wiem, z kim spał fikcyjny jury-gwiazdor Tomasz Pikantny. Wyślę ci skan, jeśli napiszesz, że jestem Twoim źródłem w kilku tekstach”.', [
      ['Płacę i publikuję', { k: 18, w: -14, p: 18, n: 6 }, 'Okazało się, że skan to zdjęcie psa. Pozew za zniesławienie jest za darmo.'],
      ['Odpisuję: „Najpierw dowody”', { k: 2, w: 10, n: 3 }, 'Anonim zniknął. Zostałeś redaktorem, którego nie da się oszukać.'],
      ['Zgłaszam to prawnikom', { k: -2, w: 7, p: -4, n: 5 }, 'Wyszło, że ktoś chciał Cię wkręcić. Dobra decyzja, zero dymu.']]],
    ['Wydawca', 'Sponsor oferuje fortunę za okładkę numeru „Seks, kłamstwa i playback” z fikcyjnym duetem Mokra i Mokry. Duet jeszcze nie wie.', [
      ['Okładka idzie do druku', { k: 22, w: -12, p: 16, n: 5 }, 'Nakład wyprzedany, menedżer duetu dzwoni od rana. Z groźbami.'],
      ['Zmieniam na „Miłość, kłamstwa i playback”', { k: 9, w: 3, p: 3 }, 'Mniej pikantnie, ale też sprzedaje. Wszyscy żyją.'],
      ['Odmawiam sponsorowi', { k: -6, w: 10, n: 4 }, 'Sponsor wycofał budżet. Honor zostaje, premia znika.']]],
    ['Czytelnik', 'Czytelnik pisze, że zna „gorący sekret” fikcyjnego rapera Wuja Dropsa z afterparty. Prosi o 500 zł i dyskrecję.', [
      ['Płacę i drążę', { k: 12, w: -4, p: 8, n: 4 }, 'Sekret okazał się plotką z podstawówki. Straciłeś 500 zł.'],
      ['Proszę o dowody na piśmie', { k: 3, w: 9, n: 2 }, 'Czytelnik się obraził. Ty nie, bo to było rozsądne.'],
      ['Wrzucam bez płacenia, jako „głosy z sieci”', { k: 15, w: -10, p: 12 }, 'Wuj Drops zapowiedział proces. Ludzie pytają o „głosy z sieci”.']]],
    ['Wywiad', 'Fikcyjna aktorka Zuzanna Gorąca na wywiadzie odpowiada na wszystko: „A to nie Twoja sprawa, kochanie”. Zostało 8 minut nagrania.', [
      ['Wycinam i publikuję najostrzejsze fragmenty', { k: 17, w: -7, p: 7, n: 3 }, 'Wywiad viralowy. Aktorka wściekła, ale wpisu nie usunęła.'],
      ['Publikuję całość bez cięć', { k: 8, w: 8, p: 1 }, 'Uczciwie i długo. Czytelnicy zostają do końca.'],
      ['Pytam o zgodę na cytaty', { k: 3, w: 7, n: 4 }, 'Zgodę dała z pocałunkiem w policzek. Zero skandalu, pełne autoryzacje.']]],
    ['Szef', 'Szef chce tytułu: „SZOK! Gwiazda w negliżu!”. Chodzi o fikcyjnego Maćka Sauna, który wyszedł z sauny w ręczniku na konferencji.', [
      ['Dajemy: „SZOK! Maciek w negliżu!”', { k: 19, w: -9, p: 6, n: -2 }, 'Klikalność jak z reaktora. Maciek śmieje się w poście, a Ty dostajesz opinię clickbaitera.'],
      ['Dajemy: „Maciek Saun w ręczniku”', { k: 7, w: 4 }, 'Prawdziwe, krótkie, zabawne. Szef kręci nosem.'],
      ['Proponuję szefowi, żeby sam napisał tytuł', { k: 2, w: 2, n: 5 }, 'Szef napisał, nie spodobało mu się. Dyskusji nie będzie.']]],
    ['Prawnik', 'Fikcyjny celebryta Dawid Dymiący żąda usunięcia tekstu o jego „dwóch randkach naraz”. Masz zdjęcia z obu.', [
      ['Nie usuwam. Publikuję drugą część', { k: 16, w: -4, p: 14, n: 5 }, 'Pozew rośnie, a Ty masz rozmowę w sądzie i materiał na trzecią część.'],
      ['Ugoda: usuwam jedno zdjęcie', { k: 4, w: 5, p: -2, n: 2 }, 'Kompromis. Dawid jest zadowolony, a Ty masz święty spokój.'],
      ['Usuwam wszystko i przepraszam', { k: -8, w: 6, p: -6, n: -4 }, 'Cisza. Ale kasa za prawnika zostaje w kieszeni.']]]
  ];

  /* zakończenia: [id, nazwa, opis, ikona, kolory] */
  var ENDS = [
    ['legenda', 'Legenda Redakcji', 'Klikalność, wiarygodność i spokój. Wszyscy Ci zazdroszczą.', 'trophy', ['#ffe27a', '#f0a81a']],
    ['zloty', 'Złoty Naczelny', 'Świetny tydzień. Szef daje Ci premię w kawie.', 'star', ['#ffd37a', '#ff9a3a']],
    ['solidny', 'Solidny Naczelny', 'Dobra robota, bez fajerwerków.', 'check', ['#9be4b7', '#1fa95b']],
    ['klik', 'Klikbajtowy Król', 'Wejść jak lodów w lipcu, ale wiarygodności jak na lekarstwo.', 'bolt', ['#ff9aa6', '#ff3b3b']],
    ['powazny', 'Poważny, ale nieczytany', 'Fakty się zgadzają. Szkoda tylko, że nikt tego nie czyta.', 'book', ['#9cc6ff', '#2b6fe8']],
    ['pozew', 'Człowiek-Pozew', 'Prawnik zna Cię z imienia i zaprasza na kolację.', 'paper', ['#d7b8ff', '#7c3aed']],
    ['kawa', 'Kawa i Płacz', 'Redakcja działa dzięki ekspresowi i Twojej cierpliwości.', 'cup', ['#e6c2a0', '#9a6a3a']],
    ['ledwo', 'Ledwo żywy', 'Tydzień minął. Reszty nikt nie pamięta.', 'zzz', ['#c8c3d6', '#6b657c']],
    ['f_k', 'Zero czytelników', 'Klikalność spadła do zera. Zostałeś sam z drukarką.', 'down', ['#8f8aa0', '#3b3650']],
    ['f_w', 'Portal bez twarzy', 'Nikt Ci już nie wierzy. Nawet mama.', 'mask', ['#8f8aa0', '#3b3650']],
    ['f_p', 'Pozew zbiorowy', 'Do redakcji wchodzi sąd z tabliczką. Koniec.', 'paper', ['#ff8f8f', '#a30f22']],
    ['f_n', 'Wypalenie', 'Zamykasz laptopa i wychodzisz w piżamie. Bez słowa.', 'zzz', ['#ffb2a0', '#c24630']]
  ];
  var ENDID = function (id) { return ENDS.filter(function (e) { return e[0] === id; })[0]; };
  /* osiągnięcia: [id, nazwa, opis, ikona, test(wynik)] – test dostaje { st, score, end, played } */
  var ACH = [
    ['n_first', 'Pierwszy tydzień', 'Dokończ tydzień w redakcji', 'check', function (r) { return !!r.finished; }],
    ['n_legend', 'Legenda Redakcji', 'Zdobądź zakończenie „Legenda Redakcji”', 'trophy', function (r) { return r.end === 'legenda'; }],
    ['n_clean', 'Czyste ręce', 'Skończ tydzień z Pozwami ≤ 10', 'shield', function (r) { return r.finished && r.st.p <= 10; }],
    ['n_honest', 'Wiarygodny', 'Skończ tydzień z Wiarygodnością ≥ 90', 'star', function (r) { return r.finished && r.st.w >= 90; }],
    ['n_click', 'Król klików', 'Skończ tydzień z Klikalnością ≥ 90', 'bolt', function (r) { return r.finished && r.st.k >= 90; }],
    ['n_zen', 'Zen naczelny', 'Skończ tydzień z Nerwami ≤ 15', 'cup', function (r) { return r.finished && r.st.n <= 15; }],
    ['n_five', 'Stały bywalec', 'Dokończ 5 tygodni', 'book', function (r) { return r.played >= 5; }],
    ['n_all', 'Wszystkie zakończenia', 'Odkryj 8 zakończeń tygodnia i 4 porażki', 'trophy', function (r) { return r.ends >= ENDS.length; }]
  ];
  var ICO = {
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v4M8.5 20h7"/>', star: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.3 6L12 16.5 6.6 19.4l1.3-6L3.4 9.3l6-.7z"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    bolt: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>', book: '<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM8 20a3 3 0 0 1-3-3"/>', paper: '<path d="M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6"/>',
    cup: '<path d="M5 9h11v6a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5zM16 10h2a2 2 0 0 1 0 4h-2M8 3v3M12 3v3"/>', zzz: '<path d="M5 6h6l-6 6h6M13 13h5l-5 5h5"/>', down: '<path d="M4 6l6 6 4-4 6 6M20 10v4h-4"/>', mask: '<path d="M4 6h16v6a8 8 0 0 1-16 0zM8 11h2M14 11h2M9 15c1 1 5 1 6 0"/>',
    shield: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/>', lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', play: '<path d="M8 5l11 7-11 7z"/>'
  };
  var ic = function (k, n) { return '<svg viewBox="0 0 24 24" width="' + (n || 18) + '" height="' + (n || 18) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICO[k] || ICO.star) + '</svg>'; };
  var clamp = function (v) { return Math.max(0, Math.min(100, v)); };

  function mount(el, H) {
    var g = H.G('naczelny'), $ = function (s) { return el.querySelector(s); }, esc = H.esc, run = null;
    H.shell(el, g, '<div class="dr nc" id="nc"></div>', { side: '<section class="gp-box"><h3>Zakończenia <small id="nc-ec"></small></h3><div class="dr-ends" id="nc-ends"></div></section><section class="gp-box ach-box"><h3>Osiągnięcia <small id="nc-ac"></small></h3><ul class="gp-ach" id="nc-ach"></ul></section>' });
    function data() { var d = H.load(); d.nacEnds = d.nacEnds || []; d.nacAch = d.nacAch || []; d.nacPlayed = d.nacPlayed || 0; return d; }
    function boxes() {
      var d = data();
      $('#nc-ec').textContent = d.nacEnds.length + '/' + ENDS.length;
      $('#nc-ends').innerHTML = ENDS.map(function (e) { var on = d.nacEnds.indexOf(e[0]) >= 0; return '<span class="dr-end' + (on ? ' is-on' : '') + '" title="' + (on ? esc(e[1]) : 'Jeszcze nie odkryte') + '">' + (on ? '<span class="dr-ico is-end" style="--a:' + e[4][0] + ';--b:' + e[4][1] + '"><svg class="dr-art" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ICO[e[3]] || '') + '</svg></span>' : '<i>?</i>') + '<b>' + (on ? e[1] : '???') + '</b></span>'; }).join('');
      $('#nc-ac').textContent = d.nacAch.length + '/' + ACH.length;
      $('#nc-ach').innerHTML = ACH.map(function (a) { var on = d.nacAch.indexOf(a[0]) >= 0; return '<li class="' + (on ? 'is-on' : '') + '"><span class="ach-i">' + ic(on ? a[3] : 'lock', 17) + '</span><div><b>' + a[1] + '</b><small>' + a[2] + '</small></div></li>'; }).join('');
    }
    function saveRun() { try { if (run && !run.done) localStorage.setItem(RUN_KEY, JSON.stringify(run)); else localStorage.removeItem(RUN_KEY); } catch (e) { /* - */ } }
    function loadRun() { try { var r = JSON.parse(localStorage.getItem(RUN_KEY)); return r && r.t && !r.done ? r : null; } catch (e) { return null; } }
    var calm = function () { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

    function pick() {
      var saved = loadRun(), d = data();
      $('#nc').innerHTML = '<div class="dr-pick nc-pick">' +
        (saved ? '<button type="button" class="dr-cont" data-act="cont"><span class="dr-cont-k nc-av">N</span><span><small>Masz niedokończony tydzień</small><b>Dzień ' + (Math.floor(saved.i / PER) + 1) + '/' + DAYS + ' · temat ' + (saved.i + 1) + '/' + DAYS * PER + '</b></span><i>' + ic('play', 18) + ' Kontynuuj</i></button>' : '') +
        '<h2>Tydzień w redakcji</h2><p class="dr-lead">Przez 5 dni dostajesz 10 tematów. Każdy temat to wybór: klik, prawda albo święty spokój. Zero Klikalności lub Wiarygodności, 100 Pozwów albo 100 Nerwów kończą grę. Im lepszy bilans na koniec tygodnia, tym wyższy wynik (maks. 100).</p>' +
        '<div class="nc-legend">' + STATS.map(function (s) { return '<span class="is-' + s[0] + '"><b>' + s[1] + '</b><small>' + (s[2] ? 'wyżej lepiej' : 'niżej lepiej') + '</small></span>'; }).join('') + '</div>' +
        '<button type="button" class="btn btn-primary nc-start" data-act="start">Zaczynam tydzień' + (d.nacPlayed ? ' (ukończone: ' + d.nacPlayed + ')' : '') + '</button></div>';
    }
    function begin() {
      var idx = TOPICS.map(function (_, i) { return i; }); for (var i = idx.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
      run = { t: idx.slice(0, DAYS * PER), i: 0, st: { k: 50, w: 50, p: 20, n: 30 }, log: [], done: false };
      phone(); next(); saveRun();
    }
    function phone() {
      $('#nc').innerHTML = '<div class="dr-phone nc-phone"><div class="dr-top"><span class="dr-me"><span class="dr-me-k nc-av">N</span><span><b>Redaktor Naczelny</b><small>Śliska News · redakcja</small></span></span><span class="dr-day" id="nc-step"></span></div>' +
        '<div id="nc-meters"></div><div class="dr-feed" id="nc-feed" aria-live="polite">' + run.log.join('') + '</div><div class="dr-ch" id="nc-ch"></div></div>' +
        '<div class="dr-bar"><span>Tydzień w redakcji</span><button type="button" class="btn btn-sm" data-act="quit">Przerwij tydzień</button></div>';
      var f = $('#nc-feed'); f.scrollTop = f.scrollHeight;
    }
    function meters(delta) {
      $('#nc-meters').innerHTML = '<div class="dr-m">' + STATS.map(function (s) {
        var v = run.st[s[0]], dl = delta && delta[s[0]], good = dl && ((dl > 0) === !!s[2]), warn = s[2] ? v <= 20 : v >= 75;
        return '<div class="dr-mt nc-m is-' + s[0] + (dl ? ' is-flash ' + (good ? 'f-up' : 'f-dn') : '') + (warn ? ' is-warn' : '') + '"><span>' + s[1] + '<em>' + v + (dl ? '<sup class="' + (good ? 'up' : 'dn') + '">' + (dl > 0 ? '+' : '') + dl + '</sup>' : '') + '</em></span><i><b style="width:' + v + '%"></b></i></div>';
      }).join('') + '</div>';
    }
    function bubble(cls, html) { var f = $('#nc-feed'), b = '<div class="dr-b ' + cls + '">' + html + '</div>'; f.insertAdjacentHTML('beforeend', b); run.log.push(b); if (run.log.length > 40) run.log = run.log.slice(-40); f.scrollTop = f.scrollHeight; }
    var av = function (c) { return '<span class="dr-av nc-av">' + c + '</span>'; };
    var pips = function () { var h = '<i class="dr-pips" aria-hidden="true">'; for (var i = 0; i < DAYS; i++) h += '<u class="' + (i < Math.floor(run.i / PER) ? 'is-done' : i === Math.floor(run.i / PER) ? 'is-now' : '') + '"></u>'; return h + '</i>'; };
    function next() {
      if (run.i >= DAYS * PER) return finish(null);
      var day = Math.floor(run.i / PER), tp = TOPICS[run.t[run.i]];
      $('#nc-step').innerHTML = pips() + '<span class="dr-dtx">Dzień ' + (day + 1) + '/' + DAYS + '</span>';
      meters(); saveRun();
      if (run.i % PER === 0 && run.lastDay !== day) { run.lastDay = day; bubble('is-day', '<span>Dzień ' + (day + 1) + '</span>'); }
      $('#nc-ch').innerHTML = '';
      var mine = run, render = function () {
        if (run !== mine || !$('#nc-feed')) return;
        var tpn = $('#nc-typing'); if (tpn) tpn.remove();
        bubble('is-in', av(tp[0].charAt(0)) + '<div><small>' + esc(tp[0]) + ' · temat ' + (run.i + 1) + '/' + DAYS * PER + '</small><p>' + esc(tp[1]) + '</p></div>');
        $('#nc-ch').innerHTML = tp[2].map(function (c, i) { return '<button type="button" class="dr-opt" data-c="' + i + '"><span>' + esc(c[0]) + '</span><span class="dr-hint">' + STATS.map(function (s) { return c[1][s[0]] ? '<span title="Zmienia: ' + s[1] + '"><i class="nc-dot is-' + s[0] + '"></i></span>' : ''; }).join('') + '</span></button>'; }).join('');
        run.pend = 1; saveRun();
      };
      if (calm()) return render();
      var f = $('#nc-feed'); f.insertAdjacentHTML('beforeend', '<div class="dr-b is-in" id="nc-typing">' + av(tp[0].charAt(0)) + '<div class="dr-tp"><i></i><i></i><i></i></div></div>'); f.scrollTop = f.scrollHeight;
      setTimeout(render, 600);
    }
    function choose(ci) {
      var tp = TOPICS[run.t[run.i]], c = tp[2][ci]; if (!c) return; run.pend = 0;
      $('#nc-ch').innerHTML = '';
      var delta = {}; STATS.forEach(function (s) { var v = c[1][s[0]]; if (v) { var nv = clamp(run.st[s[0]] + v); delta[s[0]] = nv - run.st[s[0]]; run.st[s[0]] = nv; } });
      bubble('is-me', '<p>' + esc(c[0]) + '</p>');
      bubble('is-re', '<p><i>' + esc(c[2]) + '</i></p><span class="nc-chips">' + STATS.map(function (s) { var dl = delta[s[0]]; if (!dl) return ''; var good = (dl > 0) === !!s[2]; return '<em class="' + (good ? 'up' : 'dn') + '"><i class="nc-dot is-' + s[0] + '"></i>' + s[1] + ' ' + (dl > 0 ? '+' : '') + dl + '</em>'; }).join('') + '</span>');
      run.i++; meters(delta);
      var fail = run.st.k <= 0 ? 'f_k' : run.st.w <= 0 ? 'f_w' : run.st.p >= 100 ? 'f_p' : run.st.n >= 100 ? 'f_n' : null;
      if (fail) return setTimeout(function () { finish(fail); }, calm() ? 0 : 700);
      setTimeout(next, calm() ? 0 : 500);
    }
    function scoreOf(st) { return Math.round((st.k + st.w + (100 - st.p) + (100 - st.n)) / 4); }
    function endOf(st, sc) {
      return st.k >= 75 && st.w >= 75 && st.p <= 35 ? 'legenda' : sc >= 70 ? 'zloty' : st.k >= 80 && st.w < 40 ? 'klik' : st.w >= 80 && st.k < 40 ? 'powazny' : st.p >= 70 ? 'pozew' : st.n >= 75 ? 'kawa' : sc >= 55 ? 'solidny' : 'ledwo';
    }
    function finish(fail) {
      var st = run.st, finished = !fail, sc = finished ? scoreOf(st) : 0, id = fail || endOf(st, sc), e = ENDID(id);
      run.done = true; saveRun();
      var d = data(), nb = false, firstEnd = d.nacEnds.indexOf(id) < 0;
      if (firstEnd) d.nacEnds.push(id);
      if (finished) { d.nacPlayed++; }
      H.save(d);
      if (finished) { nb = H.submit('naczelny', Math.max(1, sc)); H.played('naczelny'); }
      var fresh = []; d = data();
      ACH.forEach(function (a) { if (d.nacAch.indexOf(a[0]) < 0 && a[4]({ st: st, score: sc, end: id, finished: finished, played: d.nacPlayed, ends: d.nacEnds.length })) { d.nacAch.push(a[0]); fresh.push(a); } });
      if (fresh.length) { H.save(d); fresh.forEach(function (a) { H.toast('🏆 ' + a[1]); }); }
      boxes();
      var bars = STATS.map(function (s) { return '<div class="dr-bar-r nc-r is-' + s[0] + '"><span>' + s[1] + '</span><i><b style="width:' + st[s[0]] + '%"></b></i><em>' + st[s[0]] + '</em></div>'; }).join('');
      bubble('is-end', '<div class="dr-card nc-card"><div class="dr-card-top"><span class="dr-card-av nc-av">N</span><span><b>Redaktor Naczelny</b><small>Tydzień w redakcji</small></span>' + (finished ? '<i class="dr-lvl">Wynik ' + sc + '</i>' : '<i class="dr-lvl is-hard">Porażka</i>') + '</div>' +
        '<span class="dr-ico is-end dr-ek" style="--a:' + e[4][0] + ';--b:' + e[4][1] + '"><svg class="dr-art" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ICO[e[3]] || '') + '</svg></span>' +
        '<h2>' + esc(e[1]) + '</h2><p>' + esc(e[2]) + '</p><div class="dr-bars">' + bars + '</div>' +
        (finished ? (nb ? '<span class="gry-new">Nowy rekord!</span>' : '') : '') +
        (fresh.length ? '<div class="gm-ach"><small>Nowe osiągnięcia</small>' + fresh.map(function (a) { return '<span>' + ic(a[3], 15) + a[1] + '</span>'; }).join('') + '</div>' : '') +
        '<div class="gm-acts"><button type="button" class="btn btn-primary" data-act="again">Jeszcze jeden tydzień</button><button type="button" class="btn" data-act="share">Udostępnij</button></div></div>');
      $('#nc-ch').innerHTML = ''; $('#nc-step').innerHTML = '<span class="dr-dtx">Koniec tygodnia</span>';
      var card = $('#nc-feed .nc-card'); if (card) $('#nc-feed').scrollTop = card.offsetTop - 12;
      run.shareText = 'Redaktor Naczelny na Śliskiej: ' + e[1] + (finished ? ' (' + sc + '/100)' : '') + ' 📰 Dasz radę lepiej?\n' + H.LINK;
    }
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act],[data-c]'); if (!b || !el.contains(b)) return;
      if (b.dataset.c != null) return choose(+b.dataset.c);
      var a = b.dataset.act;
      if (a === 'start' || a === 'again') begin();
      else if (a === 'cont') { run = loadRun(); if (run) { if (run.pend) { run.log.pop(); run.pend = 0; } phone(); meters(); next(); } }
      else if (a === 'quit') { if (confirm('Przerwać tydzień? Postęp zostanie utracony.')) { run = null; try { localStorage.removeItem(RUN_KEY); } catch (er) { /* - */ } pick(); } }
      else if (a === 'share' && run) H.share(run.shareText);
    });
    boxes(); pick();
  }
  window.NaczelnySim = { mount: mount, ends: ENDS.length };
})();
