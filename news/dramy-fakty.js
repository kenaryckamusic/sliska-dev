/* Śliska News – „Prawdziwe dramy” w Drama Simulatorze. Ładowane po drama.js; udostępnia window.DramaFacts.play(box, H, id, back) oraz .LIST.
 * ZASADY TREŚCI (ważne prawnie): wyłącznie fakty z publikacji prasowych i orzeczeń, każdy z oznaczonym źródłem. Gracz nie wciela się w prawdziwe osoby
 * i nie podejmuje „ich” decyzji. Gra polega na zgadywaniu, co wydarzyło się dalej. Błędne odpowiedzi to neutralne hipotezy, nigdy zarzuty. Żadnych
 * zmyślonych scen, dialogów ani wątków intymnych. Nowe dramy dopisuj tylko z potwierdzonymi źródłami (data, rzecz, źródło). */
(function () {
  'use strict';
  /* pytanie: [kontekst (fakt, który już znamy), pytanie, [opcje], numer prawidłowej (0..2), „tak było” (fakt), źródło] */
  var LIST = [
    { id: 'nergal', t: 'Nergal i podarta Biblia', y: '2007–2013', tag: 'Sąd', c: ['#2b0f2a', '#a30f22'],
      intro: '2007 rok. Na koncercie zespołu Behemoth w gdyńskim klubie Ucho Adam „Nergal” Darski drze Biblię i rzuca kartki w publiczność. Ta scena trafia do sieci i zaczyna się sprawa, która trwa lata.',
      q: [
        ['Nagranie z koncertu ogląda się w internecie.', 'Kto złożył zawiadomienie do prokuratury?', ['Pomorscy posłowie PiS i szef Komitetu Obrony przed Sektami', 'Wyłącznie kuria metropolitalna', 'Organizator koncertu'], 0, 'Zawiadomienie złożyło kilku pomorskich posłów PiS oraz Ryszard Nowak z Ogólnopolskiego Komitetu Obrony przed Sektami i Przemocą, po obejrzeniu nagrania w sieci.', 'tvn24.pl'],
        ['Maj 2010. Prokuratura wnosi akt oskarżenia.', 'O co oskarżono Nergala?', ['O obrazę uczuć religijnych', 'O zakłócenie porządku publicznego', 'O znieważenie symboli państwowych'], 0, 'Zarzut brzmiał: obraza uczuć religijnych.', 'tvn24.pl'],
        ['2011 rok. Pierwszy wyrok sądu w Gdyni.', 'Jak zakończył się pierwszy proces?', ['Uniewinnieniem', 'Grzywną 10 tys. zł', 'Umorzeniem bez wyroku'], 0, 'Sąd w Gdyni uniewinnił Nergala, uznając, że nie działał z zamiarem bezpośrednim. Prokuratura i oskarżyciel odwołali się.', 'tvn24.pl'],
        ['Październik 2012. Sprawa trafia do Sądu Najwyższego, bo sąd w Gdańsku zadał pytanie prawne.', 'Co uznał Sąd Najwyższy?', ['Że przestępstwo może popełnić też ten, kto godzi się na jego skutek', 'Że obraza uczuć religijnych nie dotyczy koncertów', 'Że sprawa jest przedawniona'], 0, 'SN uznał, że obrazę uczuć religijnych można popełnić także z zamiarem ewentualnym, a nie tylko bezpośrednim. W styczniu 2013 sąd w Gdańsku uchylił uniewinnienie i skierował sprawę do ponownego rozpoznania.', 'tvn24.pl'],
        ['3 czerwca 2013. Ponowny proces w Gdyni. Prokurator wnosi o 5 tys. zł grzywny.', 'Jak skończył się ponowny proces?', ['Ponownym uniewinnieniem', 'Grzywną 5 tys. zł', 'Karą w zawieszeniu'], 0, 'Sąd ponownie uniewinnił Nergala. Sędzia uznał, że działał z zamiarem ewentualnym, ale wobec uczestników koncertu, a nie wobec osób, które złożyły zawiadomienie. Ryszard Nowak zapowiedział apelację.', 'tvn24.pl'],
      ] },
    { id: 'doda', t: 'Doda i dinozaury', y: '2009–2022', tag: 'Sąd', c: ['#5c0716', '#ff3b3b'],
      intro: '2009 rok. Doda (Dorota Rabczewska) udziela wywiadu prasowego. Jedno zdanie o Biblii sprawia, że gwiazda trafia na salę sądową, a sprawa kończy się dopiero w Strasburgu.',
      q: [
        ['W wywiadzie z 2009 roku Doda mówi o Biblii.', 'Co powiedziała?', ['Że bardziej wierzy w dinozaury niż w Biblię', 'Że Biblia to jej ulubiona książka z dzieciństwa', 'Że Biblię powinno się wycofać ze szkół'], 0, 'Powiedziała, że „bardziej wierzy w dinozaury niż w Biblię”, bo „ciężko wierzyć w coś, co spisał jakiś napruty winem i palący jakieś zioła”.', 'oko.press, gazetaprawna.pl'],
        ['Po publikacji wywiadu do prokuratury trafia zawiadomienie.', 'Kto je złożył?', ['Szef komitetu obrony przed sektami i były senator PiS', 'Rzecznik Praw Obywatelskich', 'Konferencja Episkopatu'], 0, 'Zawiadomienie złożyli Ryszard Nowak z Ogólnopolskiego Komitetu Obrony przed Sektami oraz Stanisław Kogut, były senator PiS. Podstawą był art. 196 k.k., czyli obraza uczuć religijnych.', 'oko.press'],
        ['Początek 2012 roku. Pierwszy wyrok sądu rejonowego w Warszawie.', 'Jak sąd rozstrzygnął sprawę?', ['Uznał Dodę za winną i wymierzył 5 tys. zł grzywny', 'Uniewinnił ją', 'Wymierzył 10 tys. zł grzywny'], 0, 'Sąd uznał ją za winną i wymierzył grzywnę 5 tys. zł. Prokurator żądał 10 tys. zł. Sąd nazwał jej słowa „obiektywnie obraźliwymi”.', 'gazetaprawna.pl, oko.press'],
        ['2015 rok. Skarga Dody na przepis o obrazie uczuć religijnych trafia do Trybunału Konstytucyjnego.', 'Co orzekł Trybunał?', ['Że art. 196 k.k. jest zgodny z konstytucją', 'Że art. 196 k.k. jest niezgodny z konstytucją', 'Że sprawa nie może być rozpoznana'], 0, 'Trybunał Konstytucyjny uznał art. 196 Kodeksu karnego za zgodny z konstytucją.', 'oko.press'],
        ['15 września 2022. Sprawa „Rabczewska przeciwko Polsce” w Strasburgu.', 'Co stwierdził Europejski Trybunał Praw Człowieka?', ['Naruszenie wolności wypowiedzi (art. 10 Konwencji)', 'Że skarga jest niedopuszczalna', 'Że Polska nie naruszyła Konwencji'], 0, 'ETPCz stwierdził, że Polska naruszyła art. 10 Konwencji, czyli wolność wypowiedzi.', 'oko.press'],
      ] },
    { id: 'opole', t: 'Opole 2017: Kayah, Rodowicz i Dr Misio', y: 'maj 2017', tag: 'TVP', c: ['#1d1038', '#6b3fd9'],
      intro: 'Maj 2017. Tuż przed festiwalem w Opolu wybucha spór wokół telewizji publicznej, której prezesem jest wtedy Jacek Kurski. Artyści odwołują występy, a w mediach pada słowo „cenzura”.',
      q: [
        ['13 maja 2017. „Gazeta Wyborcza” publikuje tekst o Kayah.', 'Co napisała gazeta?', ['Że Kayah nie wystąpi na jubileuszu Maryli Rodowicz', 'Że Kayah zakończyła karierę', 'Że Kayah poprowadzi festiwal'], 0, 'Według „Wyborczej” Kayah miała nie wystąpić na jubileuszowym koncercie Maryli Rodowicz. Jej menedżer Tomasz Grewiński potwierdził to i przytoczył słowa, które miał usłyszeć od prezesa TVP.', 'oko.press'],
        ['17 maja. Kayah komentuje sprawę.', 'Co ogłosiła?', ['Że nie wystąpi w Opolu i to jej własna decyzja', 'Że wystąpi mimo wszystko', 'Że przeniesie koncert do Sopotu'], 0, 'Kayah ogłosiła, że nie zagra w Opolu, i podkreśliła, że to jej własna decyzja. TVP zapewniała, że nie ingeruje w dobór artystów.', 'oko.press'],
        ['19 maja. Maryla Rodowicz podejmuje decyzję.', 'Co zrobiła?', ['Odwołała jubileuszowy koncert, powołując się m.in. na polityczny skandal i śmierć matki', 'Wystąpiła razem z Kayah', 'Przesunęła koncert o rok'], 0, 'Rodowicz odwołała jubileuszowy koncert w Opolu. Jako powody podała polityczny skandal i śmierć matki.', 'oko.press'],
        ['19 maja. Festiwal wycofuje z konkursu Premier zespół Dr Misio.', 'Jaki był oficjalny powód?', ['Teledysk „Pismo”, który kpi z księży, nie nadaje się do emisji', 'Brak praw autorskich do utworu', 'Zgłoszenie po terminie'], 0, 'Oficjalnie chodziło o teledysk „Pismo”, który nie nadawał się do emisji. Lider zespołu Arkadiusz Jakubiak nazwał to cenzurą.', 'oko.press'],
        ['22 maja. Wiceminister sprawiedliwości Patryk Jaki twierdzi, że cenzury nie było. Dziennikarze liczą rezygnacje.', 'Ile osób zrezygnowało z występu w Opolu według zestawienia „Wyborczej”?', ['Około 40', 'Około 5', 'Około 120'], 0, 'Zespół danych „Wyborczej” naliczył około 40 rezygnacji. Według OKO.press teza o braku cenzury była fałszywa, bo wycofanie Dr Misio było oficjalne, a zakaz dla Kayah potwierdzało wiele źródeł.', 'oko.press'],
      ] },
    { id: 'janoszek', t: 'Natalia Janoszek kontra Stanowski', y: 'maj 2023', tag: 'Internet', c: ['#3a0a33', '#ff2d77'],
      intro: 'Maj 2023. W sieci pojawia się film, który wywołuje burzę wokół kariery Natalii Janoszek, znanej do tej pory jako polska aktorka i tancerka z Indii. Zaczyna się medialny spór.',
      q: [
        ['Druga połowa maja 2023.', 'Kto opublikował film w sieci i co w nim było?', ['Krzysztof Stanowski, który zakwestionował jej zawodowe osiągnięcia', 'Jej agent, który ogłosił nowy projekt', 'Telewizja, która zapowiedziała program o niej'], 0, 'Krzysztof Stanowski opublikował na YouTube materiał, w którym zakwestionował osiągnięcia zawodowe Janoszek. To jego tezy i materiały, nie rozstrzygnięcie sądu.', 'rozrywka.spidersweb.pl'],
        ['Przed filmem wielu odbiorców miało wyrobiony obraz tej kariery.', 'Jak ją postrzegano?', ['Jako gwiazdę Bollywood z rosnącą karierą w Indiach', 'Jako polską raperkę', 'Jako trenerkę fitness'], 0, 'Wiele osób uważało ją za gwiazdę Bollywood z rosnącą karierą w Indiach.', 'rozrywka.spidersweb.pl'],
        ['Po publikacji filmu Janoszek zabiera głos.', 'Jak zareagowała?', ['Zagroziła Stanowskiemu pozwami i krokami prawnymi', 'Przeprosiła widzów', 'Zniknęła z sieci bez komentarza'], 0, 'Janoszek zagroziła Stanowskiemu pozwami i sądem.', 'rozrywka.spidersweb.pl'],
        ['Burza trwa, ale pojawiają się kolejne propozycje.', 'Co zrobiła stacja TVN?', ['Obsadziła ją w nowym programie „Królowa przetrwania”', 'Zerwała z nią współpracę', 'Zawiesiła emisję wszystkich jej programów'], 0, 'TVN obsadziło Janoszek jako uczestniczkę nowego programu „Królowa przetrwania”.', 'rozrywka.spidersweb.pl'],
      ] },
    { id: 'sylwester', t: 'Sylwester z Dwójką i playback', y: 'sylwester 2025/26', tag: 'Telewizja', c: ['#0b2a5c', '#1fb5c9'],
      intro: 'Noc sylwestrowa 2025/26. Na antenie TVP2 mnóstwo gwiazd, wielki koncert i… burza w komentarzach po północy. Pytanie brzmi: czy wszystko było na żywo?',
      q: [
        ['Sylwester z Dwójką w noc 2025/26.', 'Gdzie odbył się koncert?', ['Pod Spodkiem w Katowicach', 'W Zakopanem', 'Na Stadionie Narodowym'], 0, 'Koncert odbył się pod Spodkiem w Katowicach i był transmitowany na żywo w TVP2. Wystąpili m.in. Maryla Rodowicz, Kayah, Michał Szpak, Cleo, Justyna Steczkowska, Blanka, Sting i Doda.', 'eska.pl'],
        ['Po transmisji widzowie komentują występy w sieci.', 'O co oskarżano artystów?', ['O śpiewanie z playbacku', 'O spóźnienie na scenę', 'O zmianę listy utworów'], 0, 'Widzowie oskarżali artystów o występy z playbacku. Wśród krytykowanych była także Doda.', 'eska.pl'],
        ['2 stycznia 2026. Doda odpowiada na krytykę w rozmowie z „Telemagazynem”.', 'Co wyjaśniła?', ['Że nie każdy występ był playbackiem, ale podkłady były nagrane, a instrumentaliści grali do nich', 'Że cały koncert był na żywo', 'Że w ogóle nie występowała'], 0, 'Doda wyjaśniła, że nie każdy występ był playbackiem, ale wszystkie podkłady były nagrane, a muzycy grali do playbacku. Dodała, że organizatorzy często proszą o pełny playback, żeby uniknąć problemów technicznych.', 'eska.pl (2 stycznia 2026)'],
        ['W tej samej wypowiedzi Doda wymieniła kilka przyczyn.', 'Co wskazała jako problem?', ['Zimno, przez które gitary się rozstrajają', 'Zbyt głośną publiczność', 'Awarię prądu na scenie'], 0, 'Wskazała też, że wykonawcy zmieniają się co kilka minut i nie da się za każdym razem na nowo podłączać sprzętu, a zimno rozstraja gitary. Zaznaczyła, że część artystów śpiewa na żywo i widać to na ekranie.', 'eska.pl (2 stycznia 2026)'],
      ] },
    { id: 'kazik', t: 'Kazik i piosenka zdjęta z Trójki', y: 'maj 2020', tag: 'Radio', c: ['#1f1f2e', '#c4102a'],
      intro: 'Maj 2020. Piosenka Kazika Staszewskiego i Wojtka Jabłońskiego trafia na szczyt listy Programu Trzeciego Polskiego Radia. Chwilę po wyniku z serwisu stacji znikają informacje o liście. Zaczyna się jedna z największych burz wokół radia publicznego.',
      q: [
        ['Piątek, maj 2020. Lista przebojów Trójki.', 'Jak nazywał się utwór, który wygrał listę?', ['„Twój ból jest lepszy niż mój”', '„Polska jest najważniejsza”', '„Baranek”'], 0, 'Utwór Kazika Staszewskiego i Wojtka Jabłońskiego „Twój ból jest lepszy niż mój” został ogłoszony numerem jeden. Wkrótce po audycji z serwisu stacji zniknęły odnośniki do listy i informacje o piosence.', 'notesfrompoland.com'],
        ['Po weekendzie szef stacji tłumaczy sytuację.', 'Jak Tomasz Kowalczewski wyjaśnił unieważnienie notowania?', ['Że złamano regulamin, a prowadzący zmanipulował listę', 'Że piosenka była za długa', 'Że piosenka zawierała wulgaryzmy'], 0, 'Najpierw mówił, że regulamin został złamany przez dodanie utworu spoza listy, potem, że prowadzący Marek Niedźwiecki przesunął piosenkę z czwartego na pierwsze miejsce. Unieważnił ostatnie notowanie i przeprosił.', 'notesfrompoland.com'],
        ['W proteście przeciw decyzji odchodzą ludzie związani ze stacją.', 'Kto zrezygnował po 35 latach pracy?', ['Marek Niedźwiecki', 'Wojciech Mann', 'Kuba Wojewódzki'], 0, 'Marek Niedźwiecki zrezygnował po 35 latach, o czym poinformował kompozytor Zbigniew Preisner. Marcin Kydryński ogłosił, że kolejna „Siesta” będzie ostatnia, bo odchodzi ze stacji razem z Hirkiem Wroną.', 'notesfrompoland.com'],
        ['Reakcje artystów i polityków.', 'Co zapowiedział Dawid Podsiadło?', ['Że nie chce, żeby stacja grała jego piosenki', 'Że zagra koncert dla Trójki', 'Że nagra własną wersję utworu'], 0, 'Podsiadło napisał na Facebooku, że nie chce, żeby stacja grała jego piosenki. Bojkot ogłosili też m.in. Organek, Kayah, Artur Rojek, Muniek Staszczyk, Krzysztof Zalewski, Maria Peszek i Fisz. Minister kultury Piotr Gliński publicznie skrytykował usunięcie.', 'notesfrompoland.com'],
      ] },
    { id: 'blanka', t: 'Eurowizja 2023: Blanka i Jann', y: '2023–2024', tag: 'Eurowizja', c: ['#241b52', '#e63b8a'],
      intro: '26 lutego 2023. Finał polskich preselekcji „Tu bije serce Europy”. Zwyciężczyni zostaje wskazana po połączeniu głosów jury i telewidzów, a w sieci wybucha dyskusja o uczciwości wyników, która trwa kolejny rok.',
      q: [
        ['Finał preselekcji w studiu w Warszawie.', 'Kto wygrał i jak liczono wynik?', ['Blanka, a wynik to 50% jury i 50% widzowie', 'Jann, bo miał najwięcej SMS-ów', 'Ahlena, decyzją komisji'], 0, 'Wygrała Blanka z piosenką „Solo” (22 pkt), drugi był Jann (19 pkt). Wynik składał się po połowie z głosów pięcioosobowego jury i głosowania publiczności.', 'wikipedia (Poland in the Eurovision Song Contest 2023)'],
        ['Publiczność nie kryje emocji.', 'Co było największym zarzutem widzów?', ['Że Jann miał najwięcej głosów widzów, ale tylko 7 punktów od jury', 'Że finał trwał za długo', 'Że nie było dogrywki'], 0, 'Jann zdobył najwięcej głosów telewidzów (18 665), ale jury przyznało mu tylko 7 punktów. Podczas głosowania jury publiczność buczała, a w sieci pojawiły się podejrzenia o układy.', 'wikipedia (Poland in the Eurovision Song Contest 2023)'],
        ['Fani próbują zmienić decyzję.', 'Co zrobili po finale?', ['Zebrali dwie petycje i łącznie ponad 87 tys. podpisów', 'Zorganizowali protest pod TVP', 'Zebrali pieniądze na wyjazd Janna'], 0, 'Dwie petycje o zmianę reprezentanta zebrały łącznie ponad 87 tys. podpisów. TVP zaprzeczyła nieprawidłowościom i podkreśliła, że głosowanie odbyło się zgodnie z regulaminem i pod nadzorem notariusza.', 'wikipedia (Poland in the Eurovision Song Contest 2023)'],
        ['Maj 2023. Blanka występuje w Liverpoolu.', 'Jak wypadła w finale Eurowizji?', ['19. miejsce na 26 uczestników, 93 punkty', 'Wygrała półfinał, w finale 3. miejsce', 'Nie weszła do finału'], 0, 'W półfinale (11 maja) Polska zajęła 3. miejsce ze 124 punktami, a w finale (13 maja) 19. miejsce z 93 punktami.', 'wikipedia (Poland in the Eurovision Song Contest 2023)'],
        ['OGAE Polska składa skargę w lipcu 2023.', 'O co walczyli fani przed sądem?', ['O ujawnienie szczegółowych wyników głosowania', 'O unieważnienie Eurowizji', 'O odszkodowanie dla Janna'], 0, 'W czerwcu 2024 Wojewódzki Sąd Administracyjny w Warszawie uznał, że szczegółowe wyniki są informacją publiczną, i nakazał TVP ich ujawnienie. OGAE Polska opublikowała wyniki głosowania SMS 6 grudnia 2024.', 'wikipedia (Poland in the Eurovision Song Contest 2023)'],
      ] },
    { id: 'pazura', t: 'Pazura kontra Pudelek', y: '2009–2012', tag: 'Sąd', c: ['#3b2a08', '#e8a317'],
      intro: 'Plotkarski portal pisze kilkanaście tekstów o życiu prywatnym znanego aktora. Aktor idzie do sądu. Sprawa trwa kilka lat i kończy się prawomocnym wyrokiem.',
      q: [
        ['Kto złożył pozew i przeciwko komu?', 'Kim byli strony sporu?', ['Aktor Cezary Pazura kontra wydawca portalu pudelek.pl', 'Cezary Pazura kontra „Fakt”', 'Wydawca Pudelka kontra TVN'], 0, 'Powodem był Cezary Pazura, pozwanym wydawca portalu pudelek.pl. Chodziło o naruszenie dóbr osobistych.', 'e-prawnik.pl (18.04.2012)'],
        ['Sąd analizuje serię publikacji.', 'Ile artykułów sąd uznał za naruszające dobra osobiste?', ['17', '3', '40'], 0, 'Sąd uznał, że 17 artykułów, zdjęcia domu oraz część informacji (niektóre fałszywe) naruszyły prywatność, wizerunek, spokój domowy i dobre imię aktora.', 'e-prawnik.pl (18.04.2012)'],
        ['Kwiecień 2012. Sąd Apelacyjny w Warszawie.', 'Co orzekł w sprawie apelacji wydawcy?', ['Oddalił ją, więc wyrok z 2009 roku stał się prawomocny', 'Uniewinnił portal', 'Zwrócił sprawę do pierwszej instancji'], 0, 'Sąd Apelacyjny w Warszawie oddalił apelację, a wyrok z 2009 roku stał się prawomocny.', 'e-prawnik.pl (18.04.2012)'],
        ['Skutki wyroku dla portalu.', 'Co musiał zrobić wydawca?', ['Przeprosić, usunąć artykuły z archiwum i zapłacić 50 tys. zł zadośćuczynienia', 'Tylko przeprosić', 'Zapłacić 5 mln zł'], 0, 'Wydawca musiał przeprosić, usunąć artykuły z archiwum i zapłacić 50 tys. zł zadośćuczynienia wraz z odsetkami.', 'e-prawnik.pl (18.04.2012)'],
      ] },
    { id: 'blachara', t: 'Doda kontra Grupa Operacyjna', y: '2007–2011', tag: 'Sąd', c: ['#2a1038', '#d04fa8'],
      intro: 'Zespół hip-hopowy publikuje piosenkę i „list otwarty”, w których pada kilka obraźliwych określeń pod adresem gwiazdy. Gwiazda idzie do sądu. Pytanie: gdzie kończy się satyra, a zaczyna naruszenie dobrego imienia?',
      q: [
        ['Wrzesień 2007.', 'Kto pozwał kogo?', ['Doda pozwała Mieszka Sibilskiego z Grupy Operacyjnej', 'Grupa Operacyjna pozwała Dodę', 'Doda pozwała stację radiową'], 0, 'Dorota Rabczewska pozwała rapera Mieszka Sibilskiego, uznając, że piosenka i wpis na stronie zespołu naruszają jej cześć i dobre imię.', 'tvn24.pl'],
        ['Marzec 2010. Wyrok pierwszej instancji.', 'Jak sąd chciał, żeby przeprosiny zostały opublikowane?', ['Na portalu Onet.pl, co kosztowałoby ok. 32 mln zł', 'W gazecie lokalnej', 'W telewizji publicznej'], 0, 'Wcześniejszy wyrok zobowiązywał Sibilskiego do przeprosin m.in. na Onet.pl, a koszt według artykułu wynosiłby ok. 32 mln zł. Sąd Najwyższy częściowo uchylił ten wyrok.', 'tvn24.pl'],
        ['2011. Sąd apelacyjny w Poznaniu.', 'Za co Sibilski musiał przeprosić?', ['Za „List otwarty”, ale nie za tekst piosenki', 'Za tekst piosenki, ale nie za list', 'Za oba teksty'], 0, 'Musiał przeprosić za wpis na stronie, a przeprosiny miały wisieć miesiąc. Za tekst piosenki z określeniem „blachara” przepraszać nie musiał, bo sąd uznał, że mieści się w satyrycznej konwencji zespołu.', 'tvn24.pl'],
      ] }
  ];
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var TITLES = function (ok, n) { return ok === n ? ['Archiwum Śliskiej', 'Znasz to na pamięć. Pudelek by się nie powstydził.'] : ok >= Math.ceil(n * .6) ? ['Czytasz newsy', 'Wiesz sporo. Jeszcze trochę i będziesz redaktorem.'] : ['Nowy w mieście', 'Dopiero zaczynasz. Przeczytaj artykuły i wróć.']; };
  function shuffle(a, r) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* ====== SILNIK v3: Kariera reportera ====== */
  var ST = [['k', 'Klikalność', '🔥'], ['w', 'Wiarygodność', '🛡️'], ['p', 'Pozwy', '⚖️'], ['n', 'Nerwy', '😰']];
  var RELS = [['szef', '🧔', 'Szef'], ['ola', '📸', 'Ola'], ['wrona', '🐦', 'Wrona'], ['marta', '💼', 'Marta']];
  var FX = [{ k: 14, w: -8, p: 12, n: 2 }, { k: 6, w: 4, p: 2, n: 1 }, { k: -2, w: 10, p: -4, n: 3 }];
  var cl = function (v) { return Math.max(0, Math.min(100, Math.round(v))); };
  var BOSS = [['Kliki! Tak się robi newsy, {n}! 🔥', 'Licznik wariuje. Kawa na mój koszt ☕', 'Tego chcieliśmy. Prawnika nie pytaj.'], ['Ładnie, {n}. Elegancko i zjadliwie.', 'Dobry balans. Szanuję.', 'Nie boli, a klika. Może być.'], ['Hmm… rzetelnie. Nudno, ale rzetelnie.', 'Szkoda, że bez mocniejszego tytułu. Ale czytelnicy docenią.', 'Czysto. Prawnik się uśmiecha, ja nie.']];
  var LAW = [['Szefie, ten tytuł mi się nie podoba. Przygotowuję sprostowanie na wszelki wypadek. ⚖️', 'Zapisałem godzinę publikacji. Przyda się w sądzie.', 'Nie śpij spokojnie, {n}.'], ['Do obrony. Dziękuję. ⚖️', 'Mogło być gorzej. Jest dobrze.', 'Tak się to robi, {n}.'], ['Wzorowo. Wydrukuję i powieszę na ścianie.', 'Zero uwag. To się rzadko zdarza.', 'Dzięki, {n}. Śpię dziś spokojnie.']];
  var NET = [['mocne, szanuję 🍿', 'CO?! serio tak napisali?', 'kliknąłem i nie żałuję', 'clickbait, ale dobry', 'sprawdzę w innym źródle…', 'ktoś tu szuka pozwu 😬', 'xD nie mogę'], ['ciekawy tekst', 'czekam na ciąg dalszy', 'Śliska pisze po ludzku', 'w końcu ktoś bez krzyku', 'dobra robota, {n}'], ['rzetelnie, dzięki', 'czytam do końca', 'ktoś tu umie pracować', 'zapisuję do zakładek', 'trochę nudne, ale zaufam', '{n} szacun']];
  var USERS = ['@mokra_ola', '@ziomek_z_bloku', '@hejter3000', '@kasia.plotkara', '@sliski_fan', '@bartek_wjazd', '@anka.drama', '@fan_nr1', '@wiecznie_offline', '@pani_basia', '@kuba.memiarz', '@tylko_popcorn'];
  var EVS = [
    ['kuba', 'Twój tekst trafił na TikToka. Ktoś zmontował z niego film z dramatyczną muzyką. 🎵', { k: 12, w: -2, n: 4 }],
    ['kuba', 'Ktoś przesłał screeny z naszego czatu redakcyjnego. Na szczęście nic wstydliwego. Chyba.', { w: -4, n: 8 }],
    ['pr', 'Dzwonię o 3 w nocy: pewna kancelaria pyta o Twój tekst. Na razie tylko pytają. ⚖️', { p: 8, n: 6 }],
    ['szef', 'Konkurencja skopiowała Twój tekst z dopiskiem „źródło: Śliska”. Dobrze, że podali nas. 😎', { k: 6, w: 6 }],
    ['kuba', 'Czytelnik poprawił Cię w komentarzu. Miał rację. Wstyd, ale uczciwie dziękujesz.', { w: 6, n: 4 }],
    ['szef', 'Premia za wyniki. Księgowa prosi, żebym nie mówił, że chodzi o kliknięcia. 💰', { k: 2, n: -8 }],
    ['kuba', 'Na Twoim profilu fala hejtu. Połowa nawet nie przeczytała tekstu.', { n: 10, k: 4 }],
    ['kuba', 'Kawa wylała się na klawiaturę. Pół godziny pracy do kosza.', { n: 6 }],
    ['szef', 'Zaprosili Cię na panel o rzetelności w mediach. Obiecali nie krytykować. 🎤', { w: 8, k: 2 }],
    ['ola', 'Zrobiłam Ci zdjęcie do profilu autora. Wyszedłeś nieprzyzwoicie dobrze. 📸', { ola: 8, k: 3 }],
    ['marta', 'Widziałam Twój tekst. Gratuluję. Nie mogę się doczekać, jak go „zainspiruję”.', { marta: 8, n: 4 }]
  ];
  var rnd = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  var SPD = function () { return window.__DF_FAST ? 0.01 : 1; };
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms * SPD()); }); };
  var RANKS = [[0, 'Praktykant'], [3, 'Stażysta'], [8, 'Reporter'], [16, 'Wydawca'], [30, 'Redaktor'], [50, 'Legenda Śliskiej']];
  var rankOf = function (n) { var r = RANKS[0], nx = null; RANKS.forEach(function (x) { if (n >= x[0]) r = x; }); nx = RANKS.filter(function (x) { return x[0] > n; })[0]; return { name: r[1], next: nx ? nx[0] : null }; };
  var CKEY = 'sn-drama-career';
  var ldC = function () { try { var c = JSON.parse(localStorage.getItem(CKEY)); return c && c.order && c.idx < c.order.length ? c : null; } catch (e) { return null; } };
  var svC = function (c) { try { if (c) localStorage.setItem(CKEY, JSON.stringify(c)); else localStorage.removeItem(CKEY); } catch (e) { /* - */ } };
  function endOf(S, R, bonusOk) {
    if (S.p >= 70 || S.w <= 20 || S.n >= 85) return 'F';
    if (S.w >= 75 && S.k >= 62) return 'L';
    var sp = [['X1', R.ola >= 65 ? R.ola : 0], ['X2', R.wrona >= 60 ? R.wrona : 0], ['X3', R.marta >= 60 ? R.marta : 0], ['X4', R.szef >= 75 ? R.szef : 0]].filter(function (x) { return x[1]; }).sort(function (a, b) { return b[1] - a[1]; });
    if (sp.length && bonusOk !== false) return sp[0][0];
    if (S.w >= 68) return 'R';
    if (S.k >= 72 && S.w < 60) return 'K';
    return 'S';
  }
  var endText = function (d, key) { var ST0 = window.DramaStory[d.id], W = window.DramaWatki; if (ST0.E[key]) return ST0.E[key]; var s = W.SPECIAL[key]; return [s[0], s[1].replace(/\{t\}/g, d.t)]; };
  var ALLK = ['L', 'R', 'K', 'S', 'F', 'X1', 'X2', 'X3', 'X4'];

  /* ---- ekran główny (hub) ---- */
  function hub(box, H, back) {
    var d = H.load(), fe = d.dramaEnd || {}, tot = 0; Object.keys(fe).forEach(function (x) { tot += fe[x].length; });
    var rk = rankOf(tot), car = ldC(), cdone = d.dramaCareerDone || 0;
    box.innerHTML = '<div class="dv"><div class="dv-hero"><div><small>Twoja kariera</small><b>' + rk.name + '</b><span>' + tot + ' z ' + (LIST.length * ALLK.length) + ' zakończeń' + (rk.next ? ' · następny stopień od ' + rk.next : ' · najwyższy stopień') + '</span></div><i class="dv-bar"><u style="width:' + Math.min(100, Math.round(tot / (LIST.length * ALLK.length) * 100)) + '%"></u></i></div>' +
      '<label class="dr-nick dv-nick"><span>Twoja ksywka reportera</span><input type="text" id="dr-nick" maxlength="16" placeholder="np. Mokry Mati" value="' + esc(d.dramaNick || '') + '" autocomplete="off"></label>' +
      (car ? '<button type="button" class="dv-cont" data-h="cont"><b>Kontynuuj karierę</b><span>Sprawa ' + (car.idx + 1) + ' z ' + car.order.length + ' · ' + esc(LIST.filter(function (x) { return x.id === car.order[car.idx]; })[0].t) + '</span></button>' : '') +
      '<h2>Tryb kariery</h2><p class="dr-lead">Kilka spraw pod rząd. Zostają Ci relacje z ekipą (Szef, Ola, Wrona, Marta), a pozwy i nerwy tylko częściowo się resetują. Na końcu dostajesz zakończenie kariery.</p>' +
      '<div class="dv-modes"><button type="button" class="dv-mode" data-h="car3"><b>Krótki sezon</b><span>3 sprawy · ok. 15 minut</span></button><button type="button" class="dv-mode" data-h="car6"><b>Długi sezon</b><span>6 spraw · ok. 30 minut</span></button><button type="button" class="dv-mode" data-h="car9"><b>Pełny sezon</b><span>wszystkie 9 · ok. godzina' + (cdone ? ' · ukończone ' + cdone + '×' : '') + '</span></button></div>' +
      '<h2>Pojedyncza sprawa</h2><p class="dr-lead">Wybierz dramę, zagraj jedną sprawę od początku do końca i poluj na wszystkie 9 zakończeń.</p><div class="dr-fcs">' + LIST.map(function (x) {
        var n = (fe[x.id] || []).length; return '<button type="button" class="dr-fc" data-fact="' + x.id + '" style="--a:' + x.c[0] + ';--b:' + x.c[1] + '"><span class="dr-fc-t"><small>' + x.tag + ' · ' + x.y + '</small><b>' + esc(x.t) + '</b></span><em>' + (n ? n + '/9' : 'Zagraj') + '</em></button>';
      }).join('') + '</div></div>';
    var nick = function () { var v = (box.querySelector('#dr-nick') || {}).value || ''; v = v.trim().slice(0, 16); var dd = H.load(); dd.dramaNick = v; H.save(dd); return v; };
    box.onclick = function (e) {
      var b = e.target.closest('[data-fact],[data-h]'); if (!b) return; window.scrollTo(0, 0);
      if (b.dataset.fact) { var nk = nick(); box.onclick = null; return chapter(box, H, b.dataset.fact, { nick: nk, back: back }); }
      var h = b.dataset.h, nk2 = nick();
      if (h === 'cont') { var c = ldC(); if (c) { box.onclick = null; return runCareer(box, H, c, back); } return; }
      var n = +h.slice(3), ids = shuffle(LIST.map(function (x) { return x.id; }), Math.random).slice(0, n);
      var c2 = { n: n, order: ids, idx: 0, rel: { szef: 50, ola: 30, wrona: 25, marta: 20 }, last: null, scores: [], fails: 0, nick: nk2 || 'Reporter', tot: 0 }; svC(c2); box.onclick = null; runCareer(box, H, c2, back);
    };
  }

  /* ---- kariera: kolejne rozdziały ---- */
  function runCareer(box, H, c, back) {
    var id = c.order[c.idx];
    chapter(box, H, id, { nick: c.nick, back: back, career: c, onEnd: function (res) {
      c.scores.push(res.score); c.rel = res.R; c.last = res.S; c.tot += 1; if (res.key === 'F') c.fails++; c.idx++;
      if (c.idx >= c.order.length) { svC(null); return careerEnd(box, H, c, back); }
      svC(c); runCareer(box, H, c, back);
    } });
  }
  function careerEnd(box, H, c, back) {
    var avg = Math.round(c.scores.reduce(function (a, b) { return a + b; }, 0) / c.scores.length), R = c.rel, E;
    if (c.fails >= Math.ceil(c.n / 2)) E = ['Wywalony z Plotek24 i ze Śliskiej', 'Zbyt wiele wpadek. Zbyszek wyłącza światło w gabinecie i mówi „idź na urlop. Długi”.'];
    else if (R.ola >= 70 && avg >= 50) E = ['Para roku redakcji', 'Ty i Ola jesteście tematem numer jeden na korytarzu. Wspólne zdjęcia z konferencji lądują w gablocie. Szef kręci głową z uśmiechem.'];
    else if (R.szef >= 75 && avg >= 60) E = ['Redaktor naczelny', 'Zbyszek odchodzi na emeryturę i przekazuje Ci klucz do gabinetu z widokiem na parking. Pierwszą decyzją jest naprawa ekspresu do kawy.'];
    else if (R.wrona >= 60 && avg >= 55) E = ['Człowiek z siatką informatorów', 'Wrona zostaje Twoim stałym informatorem. Dostajesz wyłączności i zero pytań. To brzmi za dobrze, by być prawdą.'];
    else if (avg >= 75) E = ['Legenda Śliskiej', 'Twoje teksty są wzorem dla młodych reporterów. Prawnik wiesza je w ramce, Szef dopisuje Cię do tytułu portalu.'];
    else if (R.marta >= 65) E = ['Wróg Plotek24', 'Marta nie odpuszcza. Wasza rywalizacja jest legendą branży, a oboje zarabiacie na tej wojnie.'];
    else if (avg >= 55) E = ['Solidny reporter', 'Nikt Cię nie zwalnia i nikt na Ciebie nie czeka z kwiatami. Ale pensję dostajesz regularnie.'];
    else E = ['Wolny strzelec', 'Po sezonie Zbyszek proponuje umowę zlecenie. „Na razie”, dodaje. Znasz ten ton.'];
    var dd = H.load(); dd.dramaCareerDone = (dd.dramaCareerDone || 0) + 1; H.save(dd); H.toast('Sezon ukończony: ' + E[0]);
    box.innerHTML = '<div class="dv"><div class="dv-end"><small>Koniec sezonu · ' + c.n + ' spraw</small><h2>' + esc(E[0]) + '</h2><p>' + esc(E[1]) + '</p><div class="dv-sc"><span><b>' + avg + '</b>średni wynik</span><span><b>' + c.fails + '</b>wpadek</span><span><b>' + R.szef + '</b>zaufanie Szefa</span><span><b>' + R.ola + '</b>Ola</span><span><b>' + R.wrona + '</b>Wrona</span><span><b>' + R.marta + '</b>rywalizacja z Martą</span></div><div class="gm-acts"><button type="button" class="btn btn-primary" data-h="again">Nowy sezon</button><button type="button" class="btn" data-h="share">Udostępnij</button></div></div></div>';
    box.onclick = function (e) { var b = e.target.closest('[data-h]'); if (!b) return; if (b.dataset.h === 'again') { box.onclick = null; back(); } else H.share('Śliska Drama Simulator: ukończyłem sezon (' + c.n + ' spraw) i zostałem: „' + E[0] + '”, średni wynik ' + avg + ' 💦\n' + H.LINK); };
  }

  /* ---- jeden rozdział (sprawa) ---- */
  function chapter(box, H, id, ctx) {
    var d = LIST.filter(function (x) { return x.id === id; })[0], ST0 = window.DramaStory && window.DramaStory[id], W = window.DramaWatki; if (!d || !ST0 || !W) return;
    var nick = (ctx.nick || '').trim() || 'Reporter', car = ctx.career, n = d.q.length;
    var AVf = (window.DramaSim && window.DramaSim.AV) || function () { return 'F'; };
    var P = car && car.last ? car.last : null;
    var S = P ? { k: cl((P.k + 50) / 2), w: cl((P.w + 50) / 2), p: cl(P.p / 2 + 5), n: cl(P.n / 2 + 10) } : { k: 50, w: 50, p: 10, n: 20 };
    var R = car ? { szef: car.rel.szef, ola: car.rel.ola, wrona: car.rel.wrona, marta: car.rel.marta } : { szef: 50, ola: 30, wrona: 25, marta: 20 };
    var $ = function (s) { return box.querySelector(s); }, i = 0, alive = true, views = 0, coms = 0, used = {}, resolver = null;
    var T = function (s) { return String(s).replace(/\{n\}/g, nick); };
    function bars() { return ST.map(function (s) { var v = S[s[0]], bad = s[0] === 'p' || s[0] === 'n'; return '<span class="df-st"><small>' + s[2] + ' ' + s[1] + '</small><i><u style="width:' + v + '%" class="' + (bad ? 'is-bad' : '') + '"></u></i></span>'; }).join(''); }
    function rels() { return RELS.map(function (r) { return '<span class="df-rl" title="' + r[2] + '"><b>' + r[1] + '</b><i><u style="width:' + R[r[0]] + '%"></u></i></span>'; }).join(''); }
    function pips() { var h = '<i class="dr-pips" aria-hidden="true">'; for (var k = 0; k < n; k++) h += '<u class="' + (k < i ? 'is-done' : k === i ? 'is-now' : '') + '"></u>'; return h + '</i>'; }
    function bubble(cls, html) { var f = $('#df-feed'); if (!f) return; f.insertAdjacentHTML('beforeend', '<div class="dr-b ' + cls + '">' + html + '</div>'); f.scrollTop = f.scrollHeight; }
    function av(w) { var x = W.CAST[w] || W.CAST.sl; return '<span class="dr-av">' + AVf(x[0]) + '</span>'; }
    function say(w, text, cls) {
      var f = $('#df-feed'); if (!f || !alive) return Promise.resolve();
      f.insertAdjacentHTML('beforeend', '<div class="dr-b is-in" id="df-typ">' + av(w) + '<div class="dr-tp"><i></i><i></i><i></i></div></div>'); f.scrollTop = f.scrollHeight;
      return wait(500 + Math.min(700, text.length * 8)).then(function () { var t = $('#df-typ'); if (t) t.remove(); if (!alive) return; bubble('is-in ' + (cls || ''), av(w) + '<div><small>' + esc((W.CAST[w] || W.CAST.sl)[1]) + '</small><p>' + esc(T(text)) + '</p></div>'); return wait(250); });
    }
    function refresh() {
      var st = $('#df-stats'); if (!st) return; st.innerHTML = bars(); $('#df-rel').innerHTML = rels();
      $('#df-step').innerHTML = pips() + '<span class="dr-dtx">Dzień ' + Math.min(i + 1, n) + '/' + n + (car ? ' · ' + (car.idx + 1) + '/' + car.order.length : '') + '</span>';
      var m = $('#df-meta'); if (m) m.innerHTML = '<span>👁 ' + views.toLocaleString('pl-PL') + '</span><span>💬 ' + coms.toLocaleString('pl-PL') + '</span><span class="' + (S.p >= 45 ? 'is-hot' : '') + '">⚖️ ryzyko pozwu ' + S.p + '%</span>';
    }
    function fx(e) { Object.keys(e).forEach(function (m) { if (m in S) S[m] = cl(S[m] + e[m]); else if (m in R) R[m] = cl(R[m] + e[m]); }); }
    function choose(labels) {
      var order = shuffle(labels.map(function (_, k) { return k; }), Math.random);
      $('#df-ch').innerHTML = order.map(function (k) { return '<button type="button" class="dr-opt" data-fo="' + k + '"><span>' + esc(T(labels[k])) + '</span></button>'; }).join('');
      return new Promise(function (r) { resolver = r; });
    }
    var fail = function () { return endOf(S, R) === 'F'; };
    box.innerHTML = '<div class="dr-phone nc-phone df"><div class="dr-top"><span class="dr-me"><span class="dr-me-k">' + AVf('sliska') + '</span><span><b>' + esc(d.t) + '</b><small>' + esc(d.tag) + ' · ' + esc(d.y) + ' · ' + esc(nick) + '</small></span></span><span class="dr-day" id="df-step"></span></div>' +
      '<div class="df-stats" id="df-stats"></div><div class="df-rels" id="df-rel"></div><div class="df-meta" id="df-meta"></div>' +
      '<div class="df-note">Wydarzenia i źródła z prasy są prawdziwe. Redakcja, wątki i Twoje wybory to gra. Prawdziwym osobom nie przypisujemy niczego poza udokumentowanymi faktami.</div>' +
      '<div class="dr-feed" id="df-feed"></div><div class="dr-ch" id="df-ch"></div></div><div class="dr-bar"><span>' + esc(d.t) + '</span><button type="button" class="btn btn-sm" data-fa="back">Wróć do listy</button></div>';
    refresh();
    async function run() {
      bubble('is-day', '<span>' + esc(d.y) + '</span>'); bubble('is-in', av('sl') + '<div><small>Tło</small><p>' + esc(d.intro) + '</p></div>');
      await say('kuba', car && car.idx ? '{n}, kolejna sprawa na biurku. Zbyszek już chodzi po redakcji. 👀' : 'Szefie, {n} dostał temat na biurko. Wszyscy czekają, aż coś opublikuje. 👀');
      for (i = 0; i < n && alive; i++) {
        var s0 = { k: S.k, w: S.w, p: S.p, n: S.n }, q = d.q[i], s = ST0.s[i];
        refresh(); bubble('is-day dv-dayb', '<span>DZIEŃ ' + (i + 1) + '</span>');
        bubble('is-in', av('sl') + '<div><small>Fakt</small><p>' + esc(q[0]) + '</p></div>');
        await say('szef', s[0]); if (!alive) return;
        var k = await choose([s[1][0], s[2][0], s[3][0]]); if (!alive) return; $('#df-ch').innerHTML = '';
        fx(FX[k]); var dv = Math.round((2000 + Math.random() * 3000) * (k === 0 ? 3.2 : k === 1 ? 1.6 : 0.8)); views += dv; coms += Math.round(dv / (20 + Math.random() * 15));
        bubble('is-me', '<p>' + esc(s[k + 1][0]) + '</p>'); await say('sl', s[k + 1][1], 'is-re'); if (!alive) return;
        bubble('is-cm', '<p><b>' + rnd(USERS) + '</b> ' + esc(T(rnd(NET[k]))) + '</p><p><b>' + rnd(USERS) + '</b> ' + esc(T(rnd(NET[k]))) + '</p>'); refresh(); await wait(450);
        await say('szef', rnd(BOSS[k])); if (k !== 1 || Math.random() < .6) await say('pr', rnd(LAW[k]));
        bubble('is-in df-ok', av('sl') + '<div><small>Tak było naprawdę</small><p>' + esc(q[4]) + '</p><span class="df-src">Źródło: ' + esc(q[5]) + '</span></div>'); await wait(650);
        if (fail()) break;
        /* wątek poboczny z redakcji */
        var pool = W.DAYS[Math.min(i, W.DAYS.length - 1)], sc = rnd(pool); if (sc) {
          bubble('is-day', '<span>Redakcja</span>'); await say(sc[0], sc[1]); if (!alive) return;
          var j = await choose([sc[2][0][0], sc[2][1][0], sc[2][2][0]]); if (!alive) return; $('#df-ch').innerHTML = '';
          fx(sc[2][j][1]); bubble('is-me', '<p>' + esc(sc[2][j][0]) + '</p>'); await say(sc[0], sc[2][j][2], 'is-re'); refresh(); await wait(300);
        }
        if (fail()) break;
        if (i < n - 1 && Math.random() < .55) {
          var ev = rnd(EVS); fx(ev[2]); if (ev[2].k > 8) { views += 9000; coms += 260; } refresh();
          await say(ev[0], ev[1], 'is-ev');
          bubble('is-re', '<p>' + Object.keys(ev[2]).map(function (m) { var l = { k: 'Klikalność', w: 'Wiarygodność', p: 'Pozwy', n: 'Nerwy', szef: 'Szef', ola: 'Ola', wrona: 'Wrona', marta: 'Marta' }[m]; return (ev[2][m] > 0 ? '+' : '') + ev[2][m] + ' ' + l; }).join(' · ') + '</p>'); await wait(450);
        }
        if (fail()) break;
        var dl = ST.map(function (x) { var v = S[x[0]] - s0[x[0]]; return v ? '<i class="' + ((x[0] === 'p' || x[0] === 'n' ? v > 0 : v < 0) ? 'is-bad' : 'is-good') + '">' + (v > 0 ? '+' : '') + v + ' ' + x[1] + '</i>' : ''; }).join('');
        bubble('is-eve', '<b>Wieczór, dzień ' + (i + 1) + '</b><div class="dr-dl">' + dl + '</div>'); await wait(500);
      }
      if (alive) end();
    }
    function end() {
      i = n; refresh();
      var key = endOf(S, R), E = endText(d, key), dd = H.load(); dd.dramaEnd = dd.dramaEnd || {}; var got = dd.dramaEnd[d.id] = dd.dramaEnd[d.id] || [];
      var isNew = got.indexOf(key) < 0, first = !got.length; if (isNew) got.push(key);
      var total = 0; Object.keys(dd.dramaEnd).forEach(function (x) { total += dd.dramaEnd[x].length; }); dd.factDone = dd.factDone || {}; dd.factDone[d.id] = got.length; H.save(dd);
      H.submit('drama', Math.min(30, total), true); H.played('drama');
      if (isNew) H.toast('Nowe zakończenie: ' + E[0]);
      var score = Math.round((S.k + S.w + (100 - S.p) + (100 - S.n)) / 4);
      $('#df-step').innerHTML = '<span class="dr-dtx">Koniec</span>'; $('#df-ch').innerHTML = '';
      var line = key === 'F' ? '{n}… zbierz swoje rzeczy z biurka. Rozmowa w moim gabinecie. Teraz.' : key === 'L' ? '{n}, dziś stawiam szampana. Całe miasto cytuje Twój tekst. 🍾' : key === 'K' ? '{n}, kliknęło się świetnie. Prawnik chce z Tobą pogadać. W cztery oczy.' : key[0] === 'X' ? '{n}, zrobiłeś coś więcej niż wymagałem. Chyba muszę o tym pomyśleć.' : key === 'R' ? '{n}, dobra robota. Bezpiecznie i uczciwie. Może następnym razem coś odważniejszego?' : '{n}, przeszło. Bez fajerwerków, ale przeszło.';
      say('szef', line).then(function () {
        var nextBtn = car ? '<button type="button" class="btn btn-primary" data-fa="next">' + (car.idx + 1 >= car.order.length ? 'Podsumuj sezon' : 'Następna sprawa') + '</button>' : '<button type="button" class="btn btn-primary" data-fa="again">Zagraj inaczej</button>';
        bubble('is-end', '<div class="dr-card nc-card"><div class="dr-card-top"><span class="dr-card-av">' + AVf('sliska') + '</span><span><b>' + esc(nick) + '</b><small>' + esc(d.t) + ' · ' + esc(d.y) + '</small></span><i class="dr-lvl">' + score + ' pkt</i></div><h2>' + esc(E[0]) + '</h2><p>' + esc(E[1]) + '</p>' +
          '<p class="dr-sum">👁 ' + views.toLocaleString('pl-PL') + ' wyświetleń · 💬 ' + coms.toLocaleString('pl-PL') + ' komentarzy<br>Zakończenia tej dramy: <b>' + got.length + '/9</b>' + (isNew ? ' (nowe!)' : '') + '</p>' +
          '<div class="gm-acts">' + nextBtn + '<button type="button" class="btn" data-fa="share">Udostępnij</button>' + (car ? '' : '<button type="button" class="btn" data-fa="back">Inna drama</button>') + '</div></div>');
        box.dataset.shareText = 'Śliska Drama Simulator: jako ' + nick + ' w sprawie „' + d.t + '” wyszedłem z zakończeniem „' + E[0] + '” (' + got.length + '/9), ' + views.toLocaleString('pl-PL') + ' wyświetleń 💦\n' + H.LINK;
        box.__res = { score: score, S: S, R: R, key: key };
      });
    }
    box.onclick = function (e) {
      var b = e.target.closest('[data-fo],[data-fa]'); if (!b) return;
      if (b.dataset.fo != null) { var r = resolver; resolver = null; if (r) r(+b.dataset.fo); return; }
      var a = b.dataset.fa;
      if (a === 'back') { alive = false; box.onclick = null; if (car) { box.onclick = null; } ctx.back(); }
      else if (a === 'again') { alive = false; box.onclick = null; chapter(box, H, id, ctx); }
      else if (a === 'next') { alive = false; box.onclick = null; ctx.onEnd(box.__res); }
      else if (a === 'share') H.share(box.dataset.shareText);
      e.stopPropagation();
    };
    run();
  }
  window.DramaFacts = { LIST: LIST, hub: hub };
})();
