# Markkinaraporttien ohje

Tämä tiedosto kuvaa Activepieces-työnkulut, jotka tuottavat raportit GitHub-sivulle.

Työnkulut sijaitsevat tässä repositoriossa kansiossa `activepieces/<katsaus>/`. Markkina-analyysin
työnkulut ovat kansiossa `activepieces/markkina/` ja niiden apuskriptit alikansiossa
`activepieces/markkina/tools/`. Mediakatsaukset tulevat samalla rakenteeseen
(`activepieces/media/`). Sivuston rakenne ja katsausten rekisteri on kuvattu juuren
`README.md`-tiedostossa.

Raportit committoidaan kansioon `data/<katsaus>/` (markkina-analyysi: `data/markkina/`), ja
sivusto lukee samaa kansiota. Kaikki tässä ohjeessa olevat polut ovat suhteessa repositorion
juureen (`MarkkinaTilanne/`), ellei toisin mainita.

> **Ylläpitosääntö:** kun työnkulkuihin tehdään muutos, tämä ohje päivitetään samalla kertaa. Ohje on ainoa paikka, josta raporttien rakenne, asetukset ja skriptit löytyvät.

## Tiedostot

| Tiedosto | Raportti | Ajoaika (Europe/Helsinki) |
|---|---|---|
| `Aamuraportti.json` | Aamuraportti | joka päivä klo 06:00, ei viikonloppuisin |
| `Kello 11 Eurooppa.json` | Kello 11 Eurooppa | arkisin klo 11:00 |
| `Kello 18 raportti.json` | Kello 18 raportti | arkisin klo 18:00 |
| `Sunnuntai.json` | Sunnuntai | sunnuntaisin klo 07:00 |

**Kello 22 raportti poistettiin käytöstä.** Se on yhä Activepieces-instanssissa, joten pysäytä tai poista se käyttöliittymässä. Tuontiskripti ohittaa sen tiedoston (`$excluded`), joten se ei enää päivity. Vanhat versiot löytyvät git-historiasta.

Erillisiä `.bak`-varmuuskopioita ei enää pidetä: git toimii versionhallintana. Palautus tapahtuu
`git log`- ja `git checkout`-komennoilla.

## Raporttien sijainti repossa

Raportin commit-polku on `data/<katsaus>/<tiedostonimi>.html`, esimerkiksi
`data/markkina/2026-11-13-0600-aamukatsaus.html`. Katsauksen tunnus on sama kuin
`docs/feeds.json`-tiedoston `id`, joten sivusto löytää raportin ilman erillistä asetusta.
Mediakatsauksessa polku on vastaavasti `data/media-se/...`.

## Työnkulun rakenne

Arkiaamun ja päivän raporteissa on sama rakenne:

```
step_1  Get Current Date          pvm ja kellonaika
step_6  Code                      kurssiluvut Yahoo Financesta
step_7  Tavily                    raportin pääuutishaku
step_8  Tavily                    toinen pääuutishaku
step_11 Tavily                    yön ja aamun tapahtumat
step_12 Tavily                    odotetut tapahtumat
step_13 LLM                       poimii enintään 3 tapahtumaa JSON:na
step_14 Code                      JSON -> hakulauseet, tikkerit ja seurantalista
step_15 Tavily                    tapahtuman 1 tulos ja reaktio
step_16 Tavily                    tapahtuman 2 tulos ja reaktio
step_17 Tavily                    tapahtuman 3 tulos ja reaktio
step_18 Code                      tapahtumien kurssit (myös jälki- ja esimarkkina)
step_9  Code                      tiivistys LLM:lle
step_3  LLM                       HTML-raportti
step_10 LLM                       spekulaatio-osio (paitsi Kello 18)
step_5  Code                      HTML + otsikkorivi tiedostoksi
step_4  GitHub                    tallennus
```

Sunnuntaissa ei ole step_6:ää eikä step_18:aa, koska markkinat ovat kiinni eikä raportissa ole kurssitaulukkoa.

## Miksi tämä rakenne

Alkuperäinen ongelma: kello 6:00 ajetussa raportissa luki "Nvidian tulosjulkistus ilman Jensen Huangia on edessä", vaikka tulos oli julkaistu jo yöllä. Syy oli kaksi:

1. Hakulauseet olivat yleisiä, joten tuore tulosuutinen ei mahtunut viiden tuloksen joukkoon. Viisi paikkaa täyttyivät eilisistä ennakkojutuista.
2. Raportin kehote ei tarkistanut uutisten julkaisuaikoja, joten se toisti ennakkouutisen sanamuodon.

Korjaus koostuu kolmesta osasta:

- **Odotettujen tapahtumien seuranta.** Tekoäly valitsee tapahtumat itse, jotta valinta ei ole käyttäjän ennakkokäsitysten värittämä. Se saa kaksi löytöhakua ja palauttaa tapahtumat JSON:na. Jokaisesta haetaan erikseen tulos ja markkinareaktio.
- **Tilalogiikka.** Jokainen tapahtuma saa tilan: TOTEUTUNUT, TULOSSA tai EI VAHVISTETTU. Tila päätellään julkaisuajasta ja nykyhetkestä, ei uutisen sanamuodosta. Paljon ennakkopuhetta saanut ja jo toteutunut tapahtuma nousee raportin kärkeen.
- **Tuoreus.** Uutiset merkitään iän mukaan (TUORE alle 3 h, VANHEMPI muuten), uusin tulee ensin, ja kurssiluvut ratkaisevat markkinareaktion. Tapahtuman kurssi haetaan erikseen numeroina.

## Tavily-krediitit

| Ajo | Krediittejä |
|---|---|
| Aamuraportti | noin 12 |
| Kello 11, 18 ja Sunnuntai | noin 10 |

Advanced-haku maksaa 2 krediittiä ja basic-haku 1 krediitin. Ilmaisessa tilauksessa on 1 000 krediittiä kuussa, joten raja tulee vastaan. Pay as you go maksaa 0,008 $ per krediitti. Tarkista laskutusasetuksista, että ylitys veloitetaan automaattisesti.

Jos kulutusta pitää pienentää, vaihda step_15–17:n `search_depth` arvosta `advanced` arvoon `basic`. Se säästää noin 170 krediittiä kuussa.

## Yleisimmät muutokset

Voit tehdä nämä suoraan `*.json`-tiedostoon tai Activepiecesin käyttöliittymässä.

**Hakulauseen vaihto.** Muokkaa `query`-kenttää askeleessa step_7, step_8, step_11 tai step_12. Kyselyissä ei ole yhtiöiden nimiä tarkoituksella, jotta valinta pysyy neutraalina.

**Aikaväli.** Tavily käyttää `days`-kenttää kokonaisina päivinä (1, 3, 5 tai 7) tai `time_range`-kenttää arvolla `day`, `week`, `month` tai `year`. Käytä vain toista, älä molempia. Älä koskaan aseta kenttää tyhjäksi merkkijonoksi: Tavily vastaa silloin HTTP 400 -virheellä "Invalid time range". Jos kenttää ei tarvita, poista koko kenttä JSON:sta. Skriptit tekevät tämän automaattisesti.

- `time_range = day`: viimeiset 24 tuntia. Käytössä step_7, step_8, step_11 ja step_15–17.
- `days = 5` tai `7`: pidempi ikkuna ilman `time_range`-kenttää. Käytössä step_12, jossa haetaan tulevia tapahtumia.

Tekninen huomautus: askeleissa step_7, step_8 ja step_11 on sekä `days = 1` että `time_range = day`. Tämä toimii, koska molemmat arvot ovat sallittuja, mutta Tavily käyttää silloin `time_range`-arvoa. Jos haluat siivota ne, poista `days`-kenttä. Tarkistin (`check.ps1`) tulostaa tästä huomautuksen, mutta ei pidä sitä virheenä.

**Tuoreusraja.** Step_9 saa `fresh_hours`-arvon. Alle sen oleva uutinen merkitään TUORE. Nykyinen arvo on 3 tuntia.

**Uutislohkojen otsikot.** Step_9 saa `label_asia` ja `label_europe` -arvot. Ne näkyvät uutislohkojen otsikoina.

**Malli.** Step_13 ja step_3 käyttävät mallia `deepseek/deepseek-v4.1-flash` OpenRouterin kautta. Vaihda `model`-kentästä.

## Automaattiskriptit

Älä muokkaa JSON-tiedostoja käsin suurissa muutoksissa. Käytä kansion `activepieces/markkina/tools/` skriptejä, koska ne pitävät rakenteen ehjänä. Skriptit päättelevät työnkulkutiedostojen kansion sijainnistaan (`$root = Split-Path -Parent $PSScriptRoot`, eli `activepieces/markkina/`), joten ne toimivat repositorion sijainnista riippumatta.

| Tiedosto | Tehtävä |
|---|---|
| `activepieces\markkina\tools\build2.ps1` | Rakentaa Kello 11, Kello 18 ja Sunnuntai |
| `activepieces\markkina\tools\build2_core.ps1` | Apufunktiot ja mallipohjat Aamuraportista |
| `activepieces\markkina\tools\build2_config.ps1` | Raporttien asetukset (haut, otsikot, säännöt) |
| `activepieces\markkina\tools\build3.ps1` | Viimeistelee Aamuraportin (step_18 ja säännöt) |
| `activepieces\markkina\tools\decode2.ps1` | Muuttaa kehotetekstit `out_*.txt`-tiedostoiksi |
| `activepieces\markkina\tools\check.ps1` | Tarkistaa liitokset ja käyttäjäviestien osiot |
| `activepieces\tools\import-to-activepieces.ps1` | Vie työnkulut Activepieces-instanssiin (rekursiivinen) |

Työnkulkujen vientiskripti on yhteinen kaikille katsauksille: `activepieces/tools/import-to-activepieces.ps1`. Se lukee `activepieces/`-kansion `*.json`-tiedostot rekursiivisesti, joten myös `markkina/`- ja `media/`-alikansiot tulevat mukaan.

Koodiaskeleet ovat erillisinä tiedostoina kansiossa `activepieces/markkina/tools/`: `step9.js` (tiivistys), `step14.js` (tapahtumien parsinta) ja `step18.js` (kurssit). Skriptit lukevat ne suoraan.

Kehotetekstit ovat kansion `activepieces/markkina/tools/` `txt_*.txt`-tiedostoissa. Niissä ääkköset kirjoitetaan muodossa `\u00E4`, koska Windows PowerShell lukee BOM:ittoman skriptitiedoston ANSI-koodauksena ja rikkoisi literaalit ääkköset. `decode2.ps1` muuttaa ne oikeiksi merkeiksi `out_*.txt`-tiedostoihin.

## Muutoksen ajaminen

```powershell
# 1. Muokkaa tarvittaessa *.js tai txt_*.txt tiedostoja
# 2. Muuta otsikot ja säännöt tiedostoon activepieces\markkina\tools\build2_config.ps1
# 3. Aja järjestyksessä
cd activepieces\markkina\tools
.\decode2.ps1
.\build2.ps1
.\build3.ps1
.\check.ps1
```

Skriptit kirjoittavat JSON-tiedostot UTF-8 BOM -muodossa. Alkuperäisen version saa takaisin gitistä komennolla `git checkout -- <tiedosto>`.

## Testaus

Koodiaskeleet voi testata Nodella ilman Activepiecesiä.

```powershell
cd activepieces\markkina\tools
node test3.mjs      # step_9, step_14 ja step_18
node test14.mjs     # step_14 eri vastausrakenteilla
```

Testit tarkistavat otsikot, TUORE- ja VANHEMPI-merkinnät, lajittelun, aikaleiman, tikkerin validoinnin ja tekevät oikean verkkokutsun Yahoo Financeen. Odotettu lopputulos: kaikki rivit `OK` tai `true`.


## Tuonti Activepiecesiin

Skripti on oletuksena kuiva-ajo. Se ei muuta mitään ilman `-Apply`-valitsinta.

```powershell
cd activepieces\tools
$env:ACTIVE_PIECES_API_KEY = 'sinun-avain'
.\import-to-activepieces.ps1 -Offline -ProjectId 'projektin-id'   # tarkistaa vain tiedostot
.\import-to-activepieces.ps1 -ProjectId 'projektin-id'            # kuiva-ajo
.\import-to-activepieces.ps1 -ProjectId 'projektin-id' -Apply     # tuonti ja julkaisu
```

Skripti hakee työnkulun `metadata.externalId`-arvolla, tuo uuden version ja julkaisee sen. Muutokset astuvat voimaan seuraavasta ajosta alkaen.

## Tunnetut rajoitukset

- **Tavily ei ole reaaliaikainen.** Aikaväli on kokonaisina päivinä, ja uutisten indeksointi voi viivästyä. Siksi ajantasaisuuden perusta on kurssiluvuissa (Yahoo), ja uutiset ovat tuoreuden mukaan merkittyä taustaa. Täydellistä reaaliaikaisuutta ei voi luvata.
- **Yahoon kurssit voivat olla viivästettyjä.** Monella pörssillä viive on noin 15 minuuttia. Siksi jokaisessa kurssirivissä on aikaleima, ja kehote kieltää kutsumasta vanhaa lukua reaaliaikaiseksi.
- **Tikkerit voivat olla väärin.** Uudella listautumisella ei ole tikkeriä. Silloin step_18 palauttaa tekstin "kurssia ei saatavilla", eikä raportti päättele reaktiota uutisesta.
- **Ajoaika kasvaa** noin 1–2 minuuttia. Kello 11:n raportti valmistuu noin klo 11:02.
- **Kello 22 -raportti** on poistettu tästä kansiosta mutta on yhä instanssissa. Pysäytä se käyttöliittymässä.

## Jos jokin menee rikki

1. Aja ensin `activepieces\markkina\tools\check.ps1`. Se tarkistaa ketjun, askeleiden väliset viittaukset ja sen, että käyttäjäviesteissä on tapahtumaosiot. Jos se raportoi ongelmia, korjaa ne ennen muita toimenpiteitä.
2. Tarkista, että ketju on ehjä: `step_1 -> step_6 -> step_7 -> ... -> step_4`. Jos hakuaskeleet eivät näy ketjussa, jokin skripti on katkaissut sen. Palauta tiedosto git-historiasta ja aja skriptit uudelleen järjestyksessä.
3. Tarkista ääkköset: etsi tiedostosta merkkijonoa `Ã`. Jos sitä löytyy, jokin on kirjoitettu ANSI-koodauksena. Aja `decode2.ps1` ja rakenna tiedosto uudelleen.
4. Aja `import-to-activepieces.ps1 -Offline`, joka tarkistaa tiedostojen rakenteen ilman verkkoyhteyttä.

## Tarkistus ajon jälkeen

Katso Activepiecesin historiasta nämä kaksi asiaa. Ne kertovat, toimiko tapahtumaketju.

| Askel | Mitä katsoa |
|---|---|
| step_14 | `parsed_count`. Jos se on 0, poimija ei tuottanut tapahtumia ja `raw_preview` näyttää, mitä malli vastasi. Silloin `q1` on varahaku eikä raportti käsittele tapahtumia. |
| step_9 | `watchlist` ja `eventQuotes`. Niiden pitää olla raportissa mukana. Jos `eventQuotes` on tyhjä, tikkereitä ei löytynyt. |

Jos `parsed_count` on toistuvasti 0, vika on joko step_13:n kehotteessa tai vastauksen luvussa. Katso `raw_preview` ja vertaa sitä kehotteessa pyydettyyn JSON-muotoon.

## Korjatut virheet

### 18.11.2026: Tavily hylkäsi tyhjän time_range-arvon

Kello 18:n ajo epäonnistui askeleessa, jonka Tavily-haussa oli `time_range` tyhjänä merkkijonona. Tavily vastasi: `HTTP 400 ... Invalid time range. Must be 'day', 'week', 'month', 'year' (or 'd', 'w', 'm', 'y')`. Tyhjä merkkijono ei ole sama asia kuin puuttuva kenttä, ja Tavily validoi sen.

Korjaus: skriptit poistavat `time_range`-kentän kokonaan niistä askeleista, joissa sitä ei tarvita, ja tapahtumahauissa (step_15–17) käytetään `time_range = day` ilman `days`-kenttää. Tarkistettu kaikista neljästä tiedostosta.

### 18.11.2026: tapahtumatiedot eivät päässeet raporttiin

Kello 18:n raportti kirjoitti "Tulosjulkistuksen ajankohta on jo ohitettu, mutta vahvistettua tietoa tuloksesta ei ole saatavilla", vaikka tuloksesta oli uutisia. Kaksi syytä:

1. **Käyttäjäviesti oli puutteellinen.** Step_3 ja step_10 saivat vain uutislohkot ja kurssiluvut. Seurantalista (`watchlist`) ja tapahtumien kurssit (`eventQuotes`) tuotettiin step_9:ssä, mutta niitä ei välitetty eteenpäin. LLM noudatti sääntöä "tarkista tapahtuman tila seurantalistasta", mutta seurantalistaa ei ollut mukana. Sama vika oli kaikissa neljässä raportissa.
2. **Poimijan vastauksen luku oli hauras.** Step_14 luki polun `step_13['output']['choices'][0]['message']['content']`. Custom API Call palauttaa vastauksen mahdollisesti rakenteessa `output.body.choices...`, jolloin polku oli vaillinainen ja poimija näytti tuottavan tyhjän.

Korjaus:

- Käyttäjäviesteihin lisättiin osiot "ODOTETUT TAPAHTUMAT" ja "TAPAHTUMIEN KURSSIT".
- Step_14 lukee nyt koko `{{step_13['output']}}` ja etsii JSON-taulukon mistä tahansa vastausrakenteesta. Testattu neljällä eri rakenteella.
- Step_14 palauttaa `parsed_count` ja `raw_preview` diagnostiikkaa varten.
- Step_15–17:stä poistettiin `time_range`, koska `days` riittää ja niiden yhtäaikainen käyttö oli epäselvää.
- Step_11:n hakulauseisiin lisättiin "earnings results reported", jotta edellisillan tulokset löytyvät.
- Uusi tarkistin `activepieces\markkina\tools\check.ps1`, joka olisi löytänyt kohdan 1 heti. Se tarkistaa askeleiden väliset viittaukset ja käyttäjäviestien osiot.


## Hakukoneiden vertailu

Tiedot on tarkistettu palveluiden omilta sivuilta 18.11.2026. Hinnat ja kiintiöt muuttuvat usein, joten tarkista ne ennen tilausta.

### Palvelut

| Palvelu | Ilmainen | Hinta | Activepieces | Tuoreus | Parhaiten |
|---|---|---|---|---|---|
| Tavily | 1 000 krediittiä/kk | 0,008 $/krediitti | Piece | `days` kokonaisina päivinä, `time_range` day/week | Yleishaku, käytössä nyt |
| Exa | 10 $ krediittejä/kk | 4 $ / 1 000 hakua (Auto 7 $) | Piece, 9 toimintoa | `days` ja `time_range` | Hakutulokset ja uutisseuranta |
| Brave Search | jopa 20 $ ilmaisia kutsuja/kk | Etukäteismaksetut krediitit | Piece, Web Search | Uutishaku ja tuoreusparametri | Uutiset ja oma indeksi |
| Perplexity | Maksullinen | Työkalukutsu 0,0025 $, tokenit erikseen | Piece | `search_recency_filter` | Valmis vastaus lähteineen |
| Serper | 2 500 hakua | Edullinen | Ei omaa pieceä, Custom API Call | Google-uutiset ja aikasuodatin | Google-uutiset |
| SerpApi | | | Piece | Google-parametrit | Google-haku |
| Valyu | | | Piece | | Tutkimus ja talousdata |
| Parallel | | | Piece, Pro | | Monimutkaiset haut |
| RSS Feed | Ilmainen | 0 $ | Piece | Uutissyötteen oma aikaleima | Uutissivustot suoraan |
| ScrapeGraphAI, Scrapeless, WebScraping AI, Firecrawl | | | Piecet | Sivun oma aikaleima | Sivun sisällön haku |

Tavily on nyt käytössä, koska se on jo integroitu ja palauttaa valmiin tiivistelmän (`answer`). Tavily ei ole reaaliaikainen: aikaväli on kokonaisina päivinä, joten tunnin tarkkuutta ei ole.

### Miten tuoreus hoidetaan

1. `time_range` rajaa haun karkeasti päivään tai viikkoon.
2. Julkaisuajan tarkistus koodissa (step_9) merkitsee jokaisen uutisen iän ja lajittelee uusimman ensin.
3. Kurssiluvut hakevat tarkan tiedon (step_6 ja step_18). Yli 20 minuuttia vanhaa aikaleimaa ei kutsuta reaaliaikaiseksi.

Ulkomaisten lehtien katsauksessa kohdat 1 ja 2 ovat tärkeämpiä kuin nykyisissä raporteissa, koska niissä ei ole kurssilukuja tukena.

### Activepiecesin hakupiecet

Näillä on oma piece, joten ne toimivat ilman Custom API Call -askelta:

- **Exa** (9 toimintoa): Perform Search (semanttinen tai avainsanahaku), Ask AI, Get Contents, Find Similar Links, Start Agent Run ja Get Agent Run. Lisäksi trigger "New Search Monitor Results", joka ajaa haun ajastuksella ja käynnistää työnkulun uusista tuloksista.
- **Brave Search** (2 toimintoa): Web Search ja Custom API Call. Uutishaku onnistuu Custom API Call -askeleella.
- **Tavily, Perplexity AI, SerpApi, Serpstat, Valyu, Parallel, RSS Feed, ScrapeGraphAI, Scrapeless, WebScraping AI.**

Serperillä ei ole omaa pieceä, mutta se toimii Custom API Call -askeleella samalla tavalla kuin OpenRouter näissä työnkuluissa.

### Ehdotus uutiskatsaukseen

Ulkomaisten lehtien katsaukseen tarvitaan todennäköisesti useita hakuja. Ehdotus, kun kerrot vaatimukset tarkemmin:

1. **RSS Feed** jokaiselle seurattavalle lehdelle. Tämä on ilmainen ja antaa täsmälleen sen, mitä lehti julkaisi, omalla aikaleimalla. Sopii hyvin sivustokohtaiseen katsaukseen.
2. **Exa Perform Search** aihehaussa. Semanttinen haku löytää teeman ympäriltä, ja hinta on selvästi Tavilyä pienempi. `includeDomains` rajaa haun tiettyihin lehtiin.
3. **Tavily** nykyisissä raporteissa, koska se toimii ja on jo testattu.
4. **Yksi LLM-askel**, joka kirjoittaa katsauksen ja merkitsee jokaisen uutisen lehden ja julkaisuajan.

Tavily ja Exa voivat olla rinnakkain: nykyiset raportit jatkavat Tavilylla, ja uusi katsaus käyttää Exaa tai RSS-syötteitä. Uusi hakukone kannattaa lisätä omana askeleena ja testata samalla `test3.mjs`-tyylisellä testillä ennen käyttöönottoa.

### Avoimet asiat

- Exan, Braven ja Serperin tuoreussuodattimien tarkka muoto on tarkistettava dokumentaatiosta ennen toteutusta. Tässä taulukossa ne ovat valmistajien kuvausten varassa.
- Finnhubin ilmaisen tason sisältöä en voinut vahvistaa (hinnoittelusivu ei auennut). Jos haluat rakenteisen tulos- ja listautumiskalenterin uutishaun rinnalle, tarkistan sen erikseen.
- Uutiskatsauksen vaatimukset ovat vielä auki: mitkä lehdet, kuinka monta, kuinka usein ja missä muodossa tulos julkaistaan. Kun ne on sovittu, teen suunnitelman samalla rakenteella kuin näissä raporteissa.

