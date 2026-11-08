/* Śliska News – wątki poboczne redakcji w „Prawdziwych dramach”. Postacie (Szef, Ola, Wrona, Marta, Kleszcz, Kuba, mec. Paragraf) pojawiają się wyłącznie w historii o redakcji
 * i nie mówią nic o prawdziwych osobach. Prawdziwe osoby występują tylko w faktach z dramy-fakty.js. */
(function () {
  'use strict';
  /* klucze efektów: k,w,p,n = paski; szef,ola,wrona,marta = relacje (0–100) */
  var CAST = { szef: ['redaktor', 'Zbyszek, Szef'], pr: ['detektyw', 'Mec. Paragraf'], kuba: ['ziomek', 'Kuba, stażysta'], ola: ['zakochana', 'Ola z działu foto'], wrona: ['diabelek', 'Wrona'], marta: ['imprezowa', 'Marta z Plotek24'], kleszcz: ['gwiazdor', 'Dyrektor Kleszcz'], sl: ['sliska', 'Śliska'], anon: ['szlafrok', 'Nieznany numer'] };
  /* sceny na dni: DAYS[d] = lista scen; scena = [kto, tekst, [[opcja, efekty, skutek] ×3]] */
  var DAYS = [
    [ ['ola', 'Ola zostaje po godzinach „przy zdjęciach” i przysuwa krzesło bliżej Twojego monitora. Pachnie kawą i kłopotami.', [
        ['Proponuję kolację', { ola: 22, n: -6, w: -2 }, 'Kolacja trwa dłużej niż zdjęcia. Rano oboje udajecie, że rozmawialiście o kadrowaniu.'],
        ['Profesjonalnie dziękuję za pomoc', { ola: 5, w: 3 }, 'Ola unosi brew. „Profesjonalnie”, powtarza. Zapamiętała.'],
        ['Mówię, że mam deadline', { ola: -8, k: 2, n: 4 }, 'Wychodzi z kawą i miną, która obiecuje kolejną rozmowę.']]],
      ['kuba', 'Kuba wrzucił wczorajszy tekst na niewłaściwe konto firmowe. Wszyscy to widzą.', [
        ['Robię z tego mema', { k: 8, n: -3, szef: -3 }, 'Mem trafia w dziesiątkę. Szef wzdycha, ale się uśmiecha.'],
        ['Naprawiam po cichu', { w: 2, n: 3, szef: 2 }, 'Nikt nie zauważył. Kuba płaci kawą.'],
        ['Robię mu awanturę', { n: 6, szef: 4, k: -1 }, 'Kuba blednie. Redakcja milknie. Szef kiwa głową.']]],
      ['szef', 'Szef rzuca pomysł: transmisja na żywo z redakcji podczas pisania tekstu.', [
        ['Zgadzam się', { k: 12, w: -4, n: 4, szef: 6 }, 'Stream ma 8 tys. widzów. Pół z nich pyta, czy to Twoja prawdziwa twarz.'],
        ['Proponuję krótką relację', { k: 6, w: 2, szef: 2 }, 'Szef się waha, ale kupuje kompromis.'],
        ['Odmawiam', { szef: -7, w: 4, n: 2 }, 'Szef mamrocze o „kreatywności”. Pamięta.']]] ],
    [ ['wrona', 'Anonimowy informator „Wrona” pisze do Ciebie: ma ciekawy materiał na dziś, chce wyłączności i dyskrecji.', [
        ['Płacę bez pytania', { wrona: 18, w: -6, k: 10, p: 6 }, 'Materiał jest dobry, ale paragon do księgowości nie będzie.'],
        ['Proszę o dowody', { wrona: 8, w: 6 }, 'Wrona wysyła zdjęcie z godziną i miejscem. Rzeczowy facet.'],
        ['Odmawiam', { wrona: -10, w: 2, n: 2 }, 'Wrona znika. Po godzinie pojawia się na czyimś innym profilu.']]],
      ['marta', 'Marta z Plotek24 proponuje wspólne śledztwo i szeroko się uśmiecha. Zbyt szeroko.', [
        ['Zgadzam się', { marta: -12, k: 5, p: 3 }, 'Współpraca ma zalety. Marta podpisuje się dwa razy większą czcionką.'],
        ['Podkradam jej temat', { marta: 20, k: 9, w: -6, p: 4 }, 'Twój tekst wychodzi pierwszy. Marta wysyła Ci jedną emotkę: 🔪.'],
        ['Ignoruję', { marta: 6, n: -2 }, 'Marta wzrusza ramionami i prowadzi swoją wersję.']]],
      ['pr', 'Mec. Paragraf: „Proszę o zabezpieczenie na tekst i pełną dokumentację rozmów. Teraz.”', [
        ['Robię wszystko od ręki', { w: 6, p: -6, n: 4, szef: 3 }, 'Dokumentacja grubości książki. Prawnik wzrusza się.'],
        ['Negocjuję skróconą wersję', { w: 2, p: -2, n: 2 }, 'Prawnik zgadza się na dwie strony. I tak je przeczyta.'],
        ['Mówię, że zrobię jutro', { p: 8, n: -3, szef: -2 }, 'Jutro okazuje się „wczoraj”. Paragraf ma doskonałą pamięć.']]] ],
    [ ['kleszcz', 'Dyrektor Kleszcz, sponsor, dzwoni: prosi, żeby tekst nie wspominał o jednym z jego partnerów biznesowych.', [
        ['Zgadzam się', { k: 4, w: -10, szef: 8 }, 'Kleszcz jest szczęśliwy, a Ty trochę mniej.'],
        ['Negocjuję', { w: 2, szef: 3, n: 5 }, 'Kleszcz mruczy. „Zobaczymy, jak to będzie wyglądać”.'],
        ['Odmawiam', { w: 10, szef: -10, k: 4, n: 4 }, 'Kleszcz odkłada słuchawkę. Szef patrzy na Ciebie jak na dyrektora w ogniu.']]],
      ['ola', 'Ola pokazuje zdjęcie z poprzedniej sesji. „Wygląda romantycznie, prawda? To tylko światło”.', [
        ['Przyznaję, że wygląda romantycznie', { ola: 18, n: -4 }, '„To tylko światło”, powtarza Ola, patrząc nie w obiektyw.'],
        ['Mówię, że wygląda profesjonalnie', { ola: 6, w: 2 }, 'Ola kiwa głową. Zapisuje Cię w kategorii „ostrożny”.'],
        ['Zmieniam temat na deadline', { ola: -8, n: 3 }, 'Ola wychodzi z kawą i westchnieniem.']]],
      ['kuba', 'Czytelnicy żądają sesji AMA z autorem tekstu. Kuba już założył wydarzenie.', [
        ['Robię AMA na żywo', { k: 10, w: 2, n: 6, p: 4 }, 'Padają pytania o wszystko. Jedno o Twój ulubiony kolor. Odpowiadasz.'],
        ['Odpowiadam tylko pisemnie', { k: 4, w: 4, n: 2 }, 'Spokojnie i bezpiecznie. Czytelnicy rzadko się czepiają.'],
        ['Odwołuję wydarzenie', { k: -3, szef: -4 }, 'Kuba usuwa wydarzenie. Wygląda na urażonego.']]] ],
    [ ['wrona', 'Wrona przesyła zdjęcie biurka szefa z dopiskiem: „Zobacz szuflady”.', [
        ['Zaglądam do szuflad', { wrona: 8, szef: -14, w: -4 }, 'Znajdujesz paczkę ciastek i zapomnianą premię. Szef widzi kamerę.'],
        ['Mówię szefowi, że ktoś próbuje mnie wkręcić', { szef: 8, wrona: -10 }, 'Szef dziękuje. Po godzinie zmienia hasło do biurka.'],
        ['Ignoruję', { n: -2 }, 'Szuflady zostają zamknięte. Wrona pisze: „Nudziarz”.']]],
      ['marta', 'Marta organizuje „wieczór dziennikarzy” i zaprasza Cię publicznie, przy wszystkich.', [
        ['Przychodzę', { marta: -8, k: 3, n: 4, ola: -4 }, 'Wieczór trwa za długo. Rano znajdujesz wizytówkę Marty w kieszeni.'],
        ['Odmawiam grzecznie', { marta: 4, szef: 2 }, 'Marta pisze: „Szkoda. Będziemy rywalami do końca”.'],
        ['Zapraszam ją do siebie na kawę', { marta: -14, ola: -6, n: 6 }, 'Ola widzi to z korytarza i milknie.']]],
      ['anon', 'Nocą dostajesz wiadomość z nieznanego numeru: „Wiemy, gdzie piszesz”.', [
        ['Blokuję numer', { n: 3 }, 'Cisza. Ale kawę pijesz przy oknie, patrząc na parking.'],
        ['Odpisuję: „Kim jesteś?”', { n: 8, k: 2, w: 2 }, 'Odpowiedź: „Czytelnik. Chcę tylko podziękować”. Uff.'],
        ['Przekazuję prawnikowi', { w: 3, p: -3, n: 4, szef: 2 }, 'Prawnik dopisuje numer do swojej kolekcji. Dziwnie zadowolony.']]] ],
    [ ['ola', 'Ola proponuje wspólny wyjazd na konferencję dziennikarską: „Dwa pokoje. Albo jeden”.', [
        ['Jeden', { ola: 24, n: -8, szef: -4, w: -2 }, 'Konferencja okazuje się bardzo owocna. Notatki nie powstają.'],
        ['Dwa, ale blisko', { ola: 10, n: -2 }, 'Pokoje obok siebie. Ściany są cienkie, rozmowa też.'],
        ['Odmawiam, mam deadline', { ola: -10, n: 4 }, 'Ola zabiera bilet. „Szkoda”.']]],
      ['szef', 'Szef daje wybór: urlop albo dodatkowy temat na dziś wieczór.', [
        ['Biorę dodatkowy temat', { k: 6, szef: 10, n: 8 }, 'Szef kiwa z aprobatą. Redakcja patrzy na Ciebie z podziwem i litością.'],
        ['Idę na urlop', { n: -12, szef: -6 }, 'Ale ta kawa była pyszna. Zbyszek patrzy na Ciebie jak na dezertera.'],
        ['Proponuję temat Kuby', { szef: 4, n: 2 }, 'Kuba dostaje szansę. Ma w oczach łzy wdzięczności.']]],
      ['kuba', 'Automat do kawy zepsuty od tygodnia. Redakcja na skraju załamania.', [
        ['Naprawiam własnymi rękami', { szef: 6, n: 4, k: 1 }, 'Kawa leci. Redakcja klaszcze. Zbyszek też.'],
        ['Kupuję espresso z własnej kieszeni', { szef: 3, n: -3 }, 'Rano witają Cię jak bohatera.'],
        ['Piszę skargę do administracji', { w: 2, n: 3 }, 'Skarga zostaje „przyjęta do rozpatrzenia”. Czyli nigdy.']]] ]
  ];
  var SPECIAL = {
    X1: ['Romans w redakcji', 'Po sprawie „{t}” w redakcji mówi się tylko o Tobie i Oli. Zdjęcia do tekstu były wyjątkowo dopieszczone, a Szef udaje, że niczego nie widzi.'],
    X2: ['Człowiek Wrony', 'Po sprawie „{t}” Wrona zostawia Ci kopertę z kolejnym materiałem. Jesteś najlepiej poinformowanym reporterem w mieście i nikt nie wie, skąd to masz.'],
    X3: ['Wojna z Plotek24', 'Po sprawie „{t}” Marta publicznie nazywa Cię „złodziejem tematów”. W sieci krążą dwie wersje tej historii, a wojna dopiero się rozkręca.'],
    X4: ['Zastępca Szefa', 'Po sprawie „{t}” Zbyszek robi Cię swoim zastępcą. Dostajesz gabinet z widokiem na parking i prawo do podpisywania sprostowań.']
  };
  window.DramaWatki = { CAST: CAST, DAYS: DAYS, SPECIAL: SPECIAL };
})();
