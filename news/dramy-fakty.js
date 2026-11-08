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
      ] }
  ];
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var TITLES = function (ok, n) { return ok === n ? ['Archiwum Śliskiej', 'Znasz to na pamięć. Pudelek by się nie powstydził.'] : ok >= Math.ceil(n * .6) ? ['Czytasz newsy', 'Wiesz sporo. Jeszcze trochę i będziesz redaktorem.'] : ['Nowy w mieście', 'Dopiero zaczynasz. Przeczytaj artykuły i wróć.']; };
  function shuffle(a, r) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* karty na ekranie wyboru (HTML) */
  function cards(done) {
    return LIST.map(function (d) {
      var s = done && done[d.id];
      return '<button type="button" class="dr-fc" data-fact="' + d.id + '" style="--a:' + d.c[0] + ';--b:' + d.c[1] + '"><span class="dr-fc-t"><small>' + d.tag + ' · ' + d.y + '</small><b>' + esc(d.t) + '</b></span><em>' + (s != null ? s + '/' + d.q.length : 'Zagraj') + '</em></button>';
    }).join('');
  }

  function play(box, H, id, back) {
    var d = LIST.filter(function (x) { return x.id === id; })[0]; if (!d) return;
    var $ = function (s) { return box.querySelector(s); }, i = 0, ok = 0, log = [];
    function pips() { var h = '<i class="dr-pips" aria-hidden="true">'; for (var k = 0; k < d.q.length; k++) h += '<u class="' + (k < i ? 'is-done' : k === i ? 'is-now' : '') + '"></u>'; return h + '</i>'; }
    function bubble(cls, html) { var f = $('#df-feed'); f.insertAdjacentHTML('beforeend', '<div class="dr-b ' + cls + '">' + html + '</div>'); f.scrollTop = f.scrollHeight; }
    var av = '<span class="dr-av nc-av">F</span>';
    box.innerHTML = '<div class="dr-phone nc-phone df"><div class="dr-top"><span class="dr-me"><span class="dr-me-k nc-av">F</span><span><b>' + esc(d.t) + '</b><small>Prawdziwa drama · ' + esc(d.y) + '</small></span></span><span class="dr-day" id="df-step"></span></div>' +
      '<div class="df-note">Fakty z publikacji prasowych i orzeczeń sądów. Gra polega na zgadywaniu, co było dalej. Błędne odpowiedzi to tylko hipotezy, a nie zarzuty wobec kogokolwiek.</div>' +
      '<div class="dr-feed" id="df-feed"></div><div class="dr-ch" id="df-ch"></div></div><div class="dr-bar"><span>' + esc(d.t) + '</span><button type="button" class="btn btn-sm" data-fa="back">Wróć do listy</button></div>';
    bubble('is-day', '<span>' + esc(d.y) + '</span>'); bubble('is-in', av + '<div><small>Tło</small><p>' + esc(d.intro) + '</p></div>');
    function ask() {
      if (i >= d.q.length) return end();
      var q = d.q[i], order = shuffle([0, 1, 2], Math.random);
      $('#df-step').innerHTML = pips() + '<span class="dr-dtx">Pytanie ' + (i + 1) + '/' + d.q.length + '</span>';
      bubble('is-in', av + '<div><small>Fakt</small><p>' + esc(q[0]) + '</p></div>');
      bubble('is-in', av + '<div><small>Pytanie</small><p><b>' + esc(q[1]) + '</b></p></div>');
      $('#df-ch').innerHTML = order.map(function (k) { return '<button type="button" class="dr-opt" data-fo="' + k + '"><span>' + esc(q[2][k]) + '</span></button>'; }).join('');
    }
    function answer(k) {
      var q = d.q[i], good = k === q[3]; if (good) ok++;
      $('#df-ch').innerHTML = '';
      bubble('is-me', '<p>' + esc(q[2][k]) + '</p>');
      bubble('is-re ' + (good ? 'df-ok' : 'df-no'), '<p><b>' + (good ? 'Zgadza się.' : 'Nie tak.') + '</b> ' + (good ? '' : 'Było tak: ') + esc(q[4]) + '</p><span class="df-src">Źródło: ' + esc(q[5]) + '</span>');
      i++; setTimeout(ask, 450);
    }
    function end() {
      var t = TITLES(ok, d.q.length), dd = H.load(); dd.factDone = dd.factDone || {};
      var first = dd.factDone[d.id] == null, bestOk = Math.max(dd.factDone[d.id] || 0, ok); dd.factDone[d.id] = bestOk; H.save(dd);
      if (first) { H.xp('drama'); H.toast('Prawdziwa drama ukończona'); }
      $('#df-step').innerHTML = '<span class="dr-dtx">Koniec</span>';
      bubble('is-end', '<div class="dr-card nc-card"><div class="dr-card-top"><span class="dr-card-av nc-av">F</span><span><b>' + esc(d.t) + '</b><small>Prawdziwa drama · ' + esc(d.y) + '</small></span><i class="dr-lvl">' + ok + '/' + d.q.length + '</i></div><h2>' + esc(t[0]) + '</h2><p>' + esc(t[1]) + '</p>' +
        '<div class="gm-acts"><button type="button" class="btn btn-primary" data-fa="again">Jeszcze raz</button><button type="button" class="btn" data-fa="share">Udostępnij</button><button type="button" class="btn" data-fa="back">Inna drama</button></div></div>');
      box.dataset.shareText = 'Prawdziwa drama „' + d.t + '” na Śliskiej: ' + ok + '/' + d.q.length + ' (' + t[0] + '). Wiesz więcej? 💦\n' + H.LINK;
    }
    box.onclick = function (e) {
      var b = e.target.closest('[data-fo],[data-fa]'); if (!b) return;
      if (b.dataset.fo != null) return answer(+b.dataset.fo);
      var a = b.dataset.fa; if (a === 'back') { box.onclick = null; back(); } else if (a === 'again') { box.onclick = null; play(box, H, id, back); } else if (a === 'share') H.share(box.dataset.shareText);
      e.stopPropagation();
    };
    ask();
  }
  window.DramaFacts = { LIST: LIST, play: play, cards: cards };
})();
