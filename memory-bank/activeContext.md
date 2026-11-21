# Active Context

## Update 2026-11-21 (3): Raporttilistan välimuisti kaatoi sivun (date.getTime)

**Käyttäjän havainto:** Kun raporttia katsoi ja painoi selaimen "Lataa tämä sivu uudelleen",
sivulle tuli virhe **`date.getTime is not a function`** ja ilmoitus *"Raporttilistaa ei voitu hakea"*.

**Juurisyy:** `docs/app.js` tallentaa raporttilistan `sessionStorage`-välimuistiin
(`saveToCache`, `JSON.stringify`) ja lukee sen takaisin `JSON.parse`-funktiolla
(`listFromCache`). **`JSON.stringify` muuttaa `Date`-olion merkkijonoksi eikä `JSON.parse`
palauta tyyppiä.** `sessionStorage` säilyy selaimen uudelleenlatauksen yli, joten toisella
latauksella `report.date` oli merkkijono. Kun `selectReportFile` kutsui `formatDateLong(report.date)`,
funktio teki `date.getTime()` ja heitti `TypeError`in. Virhe tapahtui `selectFeed`-ketjun
`.then`-osassa, joten se päätyi `.catch`-haaraan, joka näytti "Raporttilistaa ei voitu hakea".

**Miksi "Päivitä lista" -nappi toimi mutta selaimen reload ei:** `refresh()` käyttää
`force: true`, joka ohittaa välimuistin kokonaan. Vain selaimen oma uudelleenlataus osui
välimuistipolkuun.

**Korjaus (kaksi varmistusta):**
1. `listFromCache` muuntaa jokaisen `report.date`-kentän takaisin `Date`-olioksi
   (`new Date(report.date)`), jolloin välimuistista luettu lista vastaa tuoretta hakua.
2. `formatDateLong` sietää sekä `Date`-olion että merkkijonon:
   `var d = (date instanceof Date) ? date : new Date(date);`

**Testi:** `tests/site-check.mjs` sai välimuistipolun testin, joka hakee listan toisen kerran
peräkkäin (kuten selaimen reload) ja tarkistaa, että `date` on käyttökelpoinen, `formatDateLong`
toimii eikä virhetekstiä näy. **Testi kaatui ennen korjausta täsmälleen samaan virheeseen**
(`[object String]`, `date.getTime is not a function`) ja menee läpi korjauksen jälkeen.
Tulos: **34/34 OK**.

**Opiksi:** `sessionStorage`/`localStorage` + `JSON.stringify` hävittää aina `Date`-oliot.
Kun välimuistiin tallennetaan olioita, joiden kenttiä käytetään metodeina, tyypit on
palautettava lukuvaiheessa.

## Update 2026-11-21 (2): Sivuston paikallispolku, manifestit ja Lauantain renderResults

**Tausta:** Käyttäjä huomasi kaksi avointa asiaa: `tests/site-check.mjs` kaatui ja Sunnuntain
`externalId` oli tuntematon. Selvityksessä löytyi kolmas: `build5_lauantai.ps1` oli rikkoutunut,
koska se lukee lähdetiedostonaan `Sunnuntai.json`:ia, jonka korvasin uudella versiolla.

**1. Sivuston paikallispolku (juurisyy git-historiasta).** Commit `5266142` ("Korjattu valikko ja
mediakatsaukset", 18.11.2026) poisti `../`-etuliitteen `fetchLocalManifest`- ja
`reportSourceUrl`-funktioista ja kopioi `data/`-kansion `docs/`-kansion alle. Samalla dynaaminen
`renderFeeds`-valikko korvattiin `index.html`:n yksinkertaisella kahden napin valikolla, mutta
`tests/site-check.mjs` jäi päivittämättä. Siksi savutesti kaatui (`../data/...` vs `data/...`) ja
`renderFeeds`-tarkistukset osoittivat poistettuun `feed-list`-elementtiin.

Korjaus:
- `docs/app.js`: `fetchLocalManifest` ja `reportSourceUrl` lukevat taas **juuren** `data/`-kansiota
  (`../data/...`). Tuotanto ei muutu, koska siellä käytetään aina GitHubin Contents API:a ja
  `download_url`-osoitetta.
- `docs/app.js`: `CONFIG.slots` ja `markkina`-syötteen slots saivat `viikkokatsaus` (📅) ja
  `viikkoennakko` (🔮), jotta valikon nimikkeet ovat suomeksi.
- `tests/site-check.mjs`: vanhat `feed-list`-tarkistukset korvattu `applyFeeds`-, `slotInfo`- ja
  `reportSourceUrl`-tarkistuksilla sekä `index.html`:n valikkonappien tarkistuksella.
  **Tulos 27/27 OK** (oli 4 FAIL + kaatuminen).
- **Uusi `tests/make-manifests.mjs`**: päivittää `data/<syöte>/index.json`-manifestit levyn
  sisällön mukaan. Estää toistumisen: `data/media/index.json` listasi 6 tiedostoa vaikka kansiossa
  oli 13.

**2. `docs/data/` poistettu.** 15 tiedostoa (13 vanhaa näyteraporttia + 2 manifestia) 18.11.
kokeilusta, jossa `docs/` oli sivuston juuri. Mikään koodi ei lukenut sitä. Käyttäjän pyynnöstä
kansio poistettiin 21.11.2026; kohde varmistettiin ensin tarkalla polulla ja kaikki tiedostot
olivat git-seurattuja, joten ne löytyvät historiasta. `docs/` sisältää nyt vain `index.html`,
`style.css`, `app.js` ja `feeds.json`. Poiston jälkeen `tests/site-check.mjs` on edelleen 27/27.

**3. Lauantain `renderResults`.** Sama `[object Object]`-korjaus kuin Sunnuntaissa vietiin
Lauantain `tools/step13_compact.js`:ään, työnkulkuun (`ap_update_step`), `Lauantai.json`-peiliin
ja julkaistiin. Uusi `tests/test_step13_compact.mjs` testaa molempien työnkulkujen tiivistyskoodin
(22/22 OK); `test_lauantai.mjs` sai oman tarkistuksen (46/46 OK). `ap_test_step step_13`
SUCCEEDED (ajettiin mock-triggerilla, joten se todentaa että koodi ajautuu, ei sisältöä).

**4. `build5_lauantai.ps1` vanhentui.** Se rakensi `Lauantai.json`:n vanhasta 14 askeleen
Sunnuntai-pohjasta ja numerointi askeleet uudelleen. Koska `Sunnuntai.json` korvattiin, skripti
olisi tuottanut hiljaa väärän tuloksen. Lisätty vartio: skripti heittää nyt selkeän virheen, jos
lähdetiedostossa ei ole 14 askelta. Uudelleennumerointi on jo tehty kertaalleen, joten sitä ei enää
tarvita. Sunnuntai rakennetaan `build6_sunnuntai.ps1`:llä. Täysi uudelleenkirjoitus (Lauantai.json:n
päivitys `tools/`-kansion tiedostoista) on mahdollinen jatkotyö.

**Verifiointi:** `tests/site-check.mjs` 27/27 · `test_sunnuntai.mjs` 75/75 ·
`test_lauantai.mjs` 46/46 · `test_step13_compact.mjs` 22/22 · `check.ps1` kunnossa ·
Lauantain `step_13` SUCCEEDED ja työnkulku julkaistu uudelleen.

## Update 2026-11-21: Sunnuntai-viikkoennakko (eteenpäin katsova spekulaatioraportti)

**Käyttäjän pyyntö:** Suunnittele sunnuntain raportti. Sen pitäisi olla eteenpäin katsova eli sen
pitäisi spekuloida, mitä tulee tapahtumaan.

**Ratkaisu:** Rakennettiin **Sunnuntai**-työnkulku kloonaamalla toimiva `Lauantai`-työnkulku
(`ap_duplicate_flow`), jolloin kaikki 17 askelta, koodiaskeleet ja yhteydet (Tavily, OpenRouter,
GitHub, Firecrawl) tulivat mukaan ja vain sisältö muutettiin eteenpäin katsovaksi. FlowId
`yltf57XbPcRVIzKKBziRh`, julkaistu ja ENABLED, ajo **sunnuntaisin klo 08:00** Europe/Helsinki.
Raportti: `data/markkina/YYYY-MM-DD-HHMM-viikkoennakko.html` (sama slug kuin vanhalla Sunnuntailla).

**Työnjako:** Lauantai = taaksepäin katsova viikkokatsaus (`-viikkokatsaus.html`), Sunnuntai =
eteenpäin katsova viikkoennakko (`-viikkoennakko.html`). Sama runko, eri suunta.

**Raportin rakenne (step_14:n kehote):** a) Alkavan viikon tärkein ajuri ja maanantain avaus
(korostuslaatikko), b) talouskalenteri ja keskuspankit, c) tuloskausi ja yritystapahtumat,
d) Yhdysvallat, e) Eurooppa ja Helsingin pörssi, f) lähtötilanne (kurssitaulukko sellaisenaan),
g) **spekulaatio-osio**, h) Lähteet.

**Spekulaatio-osio (pakollinen):** keltainen katkoviivalaatikko (`#fffbeb`,
`border:2px dashed #f59e0b`) samalla vastuuvapautuksella kuin Kello 11 -raportissa, sisältönä
kolme skenaariota (helpotusralli / perusskenaario / myyntiaallon jatkuminen) edellytyksineen ja
kumoutumisehtoineen, yllätyskortti sekä 2–3 seurattavaa spekulatiivista kohdetta.

**Muutetut haut:** step_2 globaali/USA week ahead, step_3 Eurooppa/Pohjoismaat week ahead,
step_4 viikonlopun uutiset ja geopolitiikka (days 2), step_5 alkavan viikon kalenteri,
step_6 poimii TULEVIA tapahtumia ja hakee ennakko-odotuksia (ei tuloksia), step_8–10
`time_range: week`, step_11 Firecrawl hakee week ahead -ennakoita.

**Uudet tiedostot:**

| Tiedosto | Tehtävä |
| --- | --- |
| `tools/build6_sunnuntai.ps1` | rakentaa `Sunnuntai.json`:n `Lauantai.json`:stä |
| `tools/txt_sunnuntai_system.txt` / `_user.txt` | HTML-raportin kehote |
| `tools/txt_sunnuntai_extract_system.txt` / `_user.txt` | tapahtumapoimijan kehote |
| `tools/step13_compact_sunnuntai.js` | tiivistys LLM:lle (eteenpäin katsova sanamuoto + `renderResults`) |
| `tools/step14_sunnuntai.js` | tapahtumien JSON -> hakulauseet (eteenpäin katsovat varahaut) |
| `tools/step17_startpoint_quotes.js` | lähtötason kurssit, viikon vertailu aikaleiman perusteella |
| `tools/test_sunnuntai.mjs` | 75 tarkistusta |
| `tools/test_step13_sunnuntai.mjs` | tiivistyskoodin yksikkötesti (11 tarkistusta) |
| `prompts/markkina/viikkoennakko.md` | kehotedokumentti |

**Kaksi korjattua bugia:**
1. **Menneet päivät kalenterissa.** Ensimmäinen testiajo esitti keskiviikon 18.11. (mennyt)
   tulevan viikon kalenterissa, koska uutishaut palauttavat viikon ajalta myös edellisen viikon
   kalenterimerkintöjä. Korjaus: kehotteeseen sääntö 6 (alkava viikko = seuraavasta maanantaista
   alkava viikko, tarkista jokaisen tapahtuman päivämäärä annettua nykyhetkeä vasten) sekä sama
   muistutus käyttäjäviestissä heti päivämäärän alla. Korjauksen jälkeen raportti listasi vain
   23.–27.11. tapahtumat (mm. Thanksgiving to 26.11.).
2. **`[object Object]` tiivistyksessä (periytyi Lauantaista).** `step13_compact` liitti
   tapahtumahakujen tulokset tekstiin suoralla merkkijonoliitoksella, jolloin Activepiecesin
   lista-viittaus tuotti `[object Object],[object Object],...`. Korjaus: `renderResults`-funktio,
   joka purkaa listan ja JSON-merkkijonot luettaviksi riveiksi. Sama bugi on yhä Lauantaissa
   (harmiton, koska LLM jättää roskan pois, mutta korjattavissa samalla koodilla).

**Verifiointi:** testiajo SUCCEEDED 148,3 s → `data/markkina/2026-11-21-1313-viikkoennakko.html`
(35,1 kB): 49 Yahoo-linkkiä, 65 linkkiä, "Lähteet"-osio, spekulaatio-laatikko, ei
`[object Object]`-roskaa, ei menneitä päiviä. `test_sunnuntai.mjs` 75/75 OK,
`test_step13_sunnuntai.mjs` 11/11 OK, `test_lauantai.mjs` 45/45 OK, `check.ps1` kunnossa.
Vanhempi näyteraportti (1310) poistettu GitHubista.

**Huom:** instanssin Sunnuntai on klooni, joten sen `externalId` on uusi eikä tiedossa repossa.
`Sunnuntai.json`:ssa on työnkulun historiallinen tunnus `6mF0HkP7AU5NIFE2FASfv`, joten
`import-to-activepieces.ps1` osuu siihen työnkulun nimellä.

**Huom 2:** `build6_sunnuntai.ps1` tarvitsee UTF-8-BOM:in, muuten PowerShell 5.1 lukee ääkköset
väärin ja `Lisätty`/`NÄKYMÄ` vääristyvät tiedostoon (havaittiin testissä).

## Update 2026-11-21: Lauantai-viikkokatsaus ja ilmainen webscraper (Firecrawl)

**Käyttäjän pyyntö:** Tee Activepieces-suunnitelma lauantaille. Sen pitäisi kerätä merkittävimmät
asiat, mitä markkinoilla tapahtui viime viikolla ja mitkä asiat vaikuttivat markkinoihin.
Kysymys: voisiko siinä käyttää jotain ilmaista webscraper-työkalua Activepiecesissä?

**Ratkaisu:** Uusi työnkulku **Lauantai** (viikkokatsaus), joka rakennettiin `Sunnuntai.json`-pohjasta.
Sunnuntai-työnkulkua ei enää ole Activepieces-instanssissa, joten se jätettiin huomiotta.

**Webscraper-valinta: Firecrawl**
- Ilmainen taso 1 000 krediittiä/kk, uusiutuu kuukausittain, ei luottokorttia (tarkistettu
  firecrawl.dev/pricing 21.11.2026). 1 krediitti = 1 haettu sivu.
- Activepieces-piece: `@activepieces/piece-firecrawl`, toiminnot `search_web`, `scrape_url`,
  `crawl`, `map`, `extract`.
- Vaihtoehdot (Apify 5 $/kk, Scrapeless, Browserless, WebScraping.AI, Dumpling AI) hylättiin,
  koska Firecrawlin ilmaistaso on selkein ja sen `search_web` + `includePageContent` tekee
  haun ja sivusisällön yhdellä kutsulla.

**Työnkulun rakenne (Lauantai, ajo lauantaisin klo 09:00 Europe/Helsinki):**
```
step_1  Date Helper   pvm ja kellonaika
step_7  Tavily        viikon markkinayhteenveto (time_range: week)
step_8  Tavily        viikon markkina-ajurit
step_11 Tavily        viikon merkittävimmät tapahtumat
step_12 Tavily        odotetut tapahtumat
step_13 LLM           poimii enintään 3 tapahtumaa JSON:na
step_14 Code          JSON -> hakulauseet, tikkerit, seurantalista
step_15-17 Tavily     tapahtumien tulokset
step_19 Firecrawl     search_web + includePageContent (viikon artikkelien kokotekstit)
step_20 Code          siistaa Firecrawl-tuloksen (tools/step21_scrape.js)
step_9  Code          tiivistys LLM:lle
step_3  LLM           HTML-raportti
step_5  Code          HTML + otsikkorivi
step_4  GitHub        tallennus data/markkina/...-viikkokatsaus.html
```
Ei step_6:ää eikä step_18:aa (ei kurssitaulukkoa). `step_19` ja `step_20` ovat
`continueOnFailure = true`, joten scraperin puuttuminen ei estä raportin syntymistä.

**Tiedostot:**
| Tiedosto | Muutos |
| --- | --- |
| `activepieces/markkina/Lauantai.json` | uusi työnkulku |
| `activepieces/markkina/tools/build5_lauantai.ps1` | rakentaa Lauantai.json:n Sunnuntai-pohjasta |
| `activepieces/markkina/tools/step21_scrape.js` | Firecrawl-tuloksen siistintä |
| `activepieces/markkina/tools/test_lauantai.mjs` | 28 tarkistusta |
| `activepieces/markkina/tools/check.ps1` | Lauantai.json lisätty tarkistuslistaan |
| `prompts/markkina/viikkokatsaus.md` | kehotedokumentti |
| `activepieces/Raporttien-ohje.md` | uusi luku "Lauantai (viikkokatsaus)" + Firecrawl-osio |
| `README.md` | katsauslista päivitetty |

**Verification:** `node test_lauantai.mjs` 28/28 OK; `check.ps1` kaikki liitokset kunnossa.
Firecrawlin piece-versio instanssissa on `0.7.3` (luettu Activepiecesista).

**Valmis (2026-11-21):** Firecrawl-yhteys luotu ja ACTIVE (externalId `Vdq5bftNVGbQ5xa1hEqxM`).
**"Lauantai"-työnkulku on rakennettu Activepiecesin MCP-työkaluilla** (kuten mediakatsaukset) ja
**julkaistu + ENABLED**: flowId `wuTvMpZibKnuSvwGv0Ex6`, externalId `d7K78m0VXNgIYpZrQtu8Q`.

Koska MCP nimeää askeleet juoksevasti, koko työnkulku numeroitiin uudelleen `step_1`…`step_16`
sekä instanssissa että repossa:

| Askel | Tehtävä |
| --- | --- |
| step_1 | Date Helper: pvm ja kellonaika |
| step_2–step_5 | Tavily: viikon wrap, ajurit, tapahtumat, tuleva viikko |
| step_6 | LLM: poimii enintään 3 tapahtumaa JSON:na |
| step_7 | Code: JSON -> hakulauseet, seurantalista |
| step_8–step_10 | Tavily: tapahtumien tulokset |
| step_11 | Firecrawl `search_web` + `includePageContent` |
| step_12 | Code: siistaa artikkelit |
| step_13 | Code: tiivistys LLM:lle (jaettu step9.js) |
| step_14 | LLM: HTML-raportti |
| step_15 | Code: tiedostonimi + Base64 |
| step_16 | GitHub PUT: `data/markkina/...-viikkokatsaus.html` |

`build5_lauantai.ps1` numeroi askeleet juoksevasti ja kirjoittaa viittaukset uusiksi
(token-korvaus, jotta numerot eivät kaskadoi). `step_13`:n syöteavaimet (`step_7_answer` ym.)
säilyvät jaetun `step9.js`-koodin vaatimina nimiä.

**Testiajo:** `ap_test_flow` SUCCEEDED 91,0 s → committoi
`data/markkina/2026-11-21-1146-viikkokatsaus.html` (11,7 kB), viesti "Lisätty lauantain
viikkokatsaus". Raportti on siisti itsenäinen HTML (oma `<style>`, korostuslaatikko, taulukot,
ei JSON-roskia).

**Korjaukset (2026-11-21, kayttajan havaintojen jalkeen):**
- **Firecrawl ei tuonut lisäarvoa ensimmäisessä ajossa:** `step_12` luki väärän polun
  (`scraped.news`), mutta Firecrawl käärii tuloksen muotoon `{success, data:{news, web}}` →
  `scrapedCount: 0`. Korjattu: `tools/step12_scrape.js` lukee `root.data.news` / `root.data.web`
  ja siivoaa markdownista linkki- ja navigaatiorivit (muuten artikkelin alusta tuli pelkkä valikko).
- **Eurooppa ja Helsinki puuttuivat:** kaikki haut olivat USA-painotteisia. Korjattu:
  `step_3` hakee Euroopan/Pohjoismaiden viikkoyhteenvedon, `step_11` (Firecrawl) hakee myös
  eurooppalaisia viikkokommentteja, ja `step_14`:n sääntö 3 vaatii eksplisiittisesti Euroopan ja
  Helsingin pörssin käsittelyn (indeksit, EKP, euroalueen makroluvut, eurooppalaiset yhtiöt).
- **Raportti katkesi kesken:** `finish_reason: length`. Syy: `step_14` ilman `reasoning_effort`-
  asetusta → malli kirjoitti pitkän suunnitteluosion ja HTML katkesi 8 781 merkissä.
  Korjattu: `reasoning_effort: "low"` + `max_tokens: 32000`.
- **Katkeamistarkistus:** `step_15` (`tools/step15_finalize.js`) heittää nyt virheen, jos HTML
  katkeaa (ei `</html>`), joten rikkinäistä raporttia ei julkaista.

**Verifiointi (2026-11-21):** testiajo `TP9ji5qDSllVXNDlZmx0v` SUCCEEDED 45,1 s →
`data/markkina/2026-11-21-1213-viikkokatsaus.html` (13,2 kB) sisältää Eurooppa-osion (Helsinki,
euroalueen inflaatio 4,0 %, EKP, Ubisoft/Investec/JD Sports, kaivosteollisuus) ja päättyy ehjästi.
Rikkinäinen näyte `2026-11-21-1146-viikkokatsaus.html` poistettu GitHubista. `test_lauantai.mjs`
39/39 OK. Työnkulku julkaistu ja ENABLED.

**Lisäys (2026-11-21): viikon markkinaluvut (step_17).** Käyttäjä huomasi, että raportti esitti
DAXille 1,06 % (päiväluku), vaikka viikon lasku oli ~7 %. Syy: Lauantaissa ei ollut kurssiaskelta,
joten LLM poimi prosentit uutissirpaleista. Korjaus: uusi `step_17`
(`tools/step17_weekly_quotes.js`) hakee 19 instrumentin päiväkurssit Yahoo Financesta
(`range=1mo&interval=1d`) ja laskee viikon muutoksen (viimeisin päätös vs. 5 kaupankäyntipäivää
aiemmin). Se tuottaa `weeklyData` (teksti LLM:lle) ja `weeklyTable` (valmis HTML-taulukko, jossa
klikattavat Yahoo-linkit ja värit: nousu vihreä, lasku punainen). `step_14`:n kehote vaatii
taulukon sellaisenaan ja kieltää päivälukujen esittämisen viikon lukuna. `step_17` sai nimensä
Activepiecesin vapaan numeron mukaan (step_10:n ja step_11:n väliin), joten `build5_lauantai.ps1`
käyttää eksplisiittistä nimeämiskarttaa juoksevan numeroinnin sijaan.

**Lisäys (2026-11-21): raportti lähteistetään (linkit ja Lähteet-osio).** Käyttäjän pyyntö:
indeksimaininnat linkeiksi kaikkialla, uutisväitteille lähdelinkit ja loppuun lähdeluettelo, jotta
luvut voi tarkistaa helposti. Toteutus:

- `step_12` (`tools/step12_scrape.js`) ja uusi `step_13` (`tools/step13_compact.js`) säilyttävät
  artikkelin URLin uutisrivillä. Jaettu `step9.js` pudottaa osoitteen, joten Lauantailla on oma kopio.
- `step_14`:n kehote sai säännön **"LINKIT JA LÄHTEET (pakollinen)"**: jokainen maininta indeksistä,
  raaka-aineesta tai valuutasta on linkki Yahoo Finance -kurssisivulle kaikkialla (myös leipätekstissä
  ja korostuslaatikossa, ei vain taulukossa), jokainen uutisväite linkitetään lähteeseensä, ja raportin
  loppuun tulee osio **"Lähteet"** otsikoilla ja klikattavilla linkeillä. Jos väitteelle ei ole suoraa
  kurssilinkkiä (esim. toimialan liike), se linkitetään artikkeliin.

**Verifiointi:** testiajo SUCCEEDED 82,5 s → `data/markkina/2026-11-21-1250-viikkokatsaus.html`
(27,1 kB): **38 Yahoo-kurssilinkkiä** (myös leipätekstissä: DAX, STOXX 600, Nasdaq, Kuparifutuurit,
Kulta, Brent…), 67 linkkiä yhteensä, **"Lähteet"-osio 12 lähteellä** (Reuters, CNBC, BlackRock, XTB,
Syz Group, swissinfo, El-Erian…). `test_lauantai.mjs` 45/45 OK, `check.ps1` kunnossa, työnkulku
julkaistu ja ENABLED. Vanhemmat näyteraportit on poistettu GitHubista (vain 1250 jäljellä).

**Korjattu (ennalta olemassa oleva este):** `activepieces\tools\import-to-activepieces.ps1` kaatui
tiedostoon `activepieces/media/Polish-Media-Monitoring.json` (tyhjä `flows`, displayName puuttui),
mikä esti kaikkien työnkulkujen viennin. Lisäksi `media/Puola viikkokatsaus clean.json` ja
`media/Puola-viikkokatsaus-NEW.json` jakoivat `externalId`:n `markkina/Aamuraportti.json`:n kanssa,
joten `-Apply` olisi ylikirjoittanut oikean Aamuraportti-työnkulun.

Skriptiä kovennettiin:
- tiedosto ilman `displayName`-kenttää ohitetaan varoituksella (ennen: kaatoi koko ajon),
- tiedosto, jonka `externalId` on jo käytössä toisessa tiedostossa, ohitetaan varoituksella,
- `markkina`-kansion tiedostot käsitellään ensin, joten ne ovat ensisijaisia.

`-Offline`-tarkistus läpäisee nyt: 6 työnkulkua (Aamuraportti, Aamuraportti NEW, Kello 11,
Kello 18, Lauantai, Sunnuntai); mediakansion luonnokset ohitetaan varoituksin.


## Update 2026-11-20: markkinakatsausten linkit eläviksi myös leipätekstissä

**Käyttäjän pyyntö:** Kello 11 Eurooppa- ja Kello 18 -raporteissa markkinoiden kokonaiskuva
(indeksit, korot, raaka-aineet, valuutat, yksittäiset osakkeet) pitää olla klikattavia linkkejä.

**Löydetty syy:**

- Kello 18 (`TR0JVsYppLuOlRMEjadTI`) step_3:n sääntö 9 käski tehdä linkit vain markkinataulukon
  soluista → leipäteksti, korostuslaatikko ja korko-/raaka-aine-/valuuttaosio jäivät linkittömiksi.
- Kello 11 (`wjAQ4F3wSRVcgmMP40k2H`) step_3:ssa linkkisääntö oli yleinen, mutta spekulaatio-osion
  tuottavassa step_10:ssä ei ollut linkkisääntöä lainkaan.
- Samassa mallissa oli Aamuraportti NEW (`LXNbIZEZQmW5wkUA7KHyZ`): step_3:n sääntö 8 rajasi linkit
  taulukkoon ja step_10:ssä ei ollut linkkisääntöä.

**Muutos (julkaistu Activepiecesiin ja päivitetty tämän repon JSON-tiedostoihin):**

| Työnkulku | Askel | Muutos |
| --- | --- | --- |
| Kello 11 Eurooppa | step_3 sääntö 9 | linkit kaikkiin osioihin, myös korostuslaatikkoon ja leipätekstiin; yksittäiset osakkeet mukaan; vain annetut Yahoo-osoitteet |
| Kello 11 Eurooppa | step_10 | uusi sääntö 7 (LINKIT), LOPETUS → 8 |
| Kello 18 raportti | step_3 sääntö 9 | taulukkokohtaisesta säännöstä kaikkeen leipätekstiin |
| Aamuraportti NEW | step_3 sääntö 8 | taulukkokohtaisesta säännöstä kaikkeen leipätekstiin |
| Aamuraportti NEW | step_10 | uusi sääntö 7 (LINKIT), LOPETUS → 8 |

Kehotteiden tekstikopiot `activepieces/markkina/tools/txt_eurooppa_system.txt` ja
`txt_ilta_system.txt` päivitetty vastaamaan työnkulkuja. `ap_validate_flow` 19/19 ja 18/18 valid,
molemmat työnkulut julkaistu uudelleen (LOCK_AND_PUBLISH). Dokumentaatio: `activepieces/Raporttien-ohje.md`
(uusi kohta "Kurssilinkit" ja korjattu virhe 20.11.2026).

**Huom:** Sivuston iframe käyttää `sandbox="allow-popups allow-popups-to-escape-sandbox ..."`,
joten `target="_blank"` -linkit avautuvat uuteen välilehteen myös GitHub Pages -sivustolla.

**Seuraava tarkistus:** 20.11.2026 klo 18:00 automaattiajo → varmista, että
`data/markkina/…-ilta.html` sisältää `<a href="https://finance.yahoo.com/…">` myös leipätekstissä,
ei vain taulukossa.


## Update 2026-11-20: "Kiina puhuu" – uusi kuukausikatsaus manner-Kiinasta

**Tavoite (käyttäjän pyyntö):** Tee DeepSeekillä työnkulku "Kiina puhuu". Lähteet saavat olla mitä
tahansa keskusteluita, kunhan ne ovat kiinankielisiä.

**Työnkulku (Media-kansio, julkaistu ja ENABLED):**

| Työnkulku | Flow ID | Aikataulu | Tiedosto |
| --- | --- | --- | --- |
| Kiina puhuu | `zbIbozMotgMxBmITVtQ3D` | 1. päivä klo 17:00 | `…-kiina-puhuu.html` |

Rakenne 1:1 Saksa/Venäjä-mallin kanssa (`ap_duplicate_flow` Saksa puhuu -työnkulusta):
`trigger` every_month → `step_1` Date Helper → `step_2` −30 vrk → `step_3` Tavily uutisportaalit +
puolueen media → `step_4` Tavily talous-, aikakaus- ja teknologiamedia → `step_8` Tavily
Weibo-keskustelut → `step_5` OpenRouter `deepseek/deepseek-v4.1-flash` → `step_6` Code (HTML +
Base64) → `step_7` GitHub PUT `data/media/`. Ajo klo 17:00 täydentää porrastuksen (Puola 08 …
Argentiina 16). Huom: Weibo-vaihe on nimeltään `step_8`, koska se lisättiin jälkikäteen `step_4`:n ja
`step_5`:n väliin.

**Hakustrategia (testattu 20.11.2026):**
- `topic: "news"` + `start_date` + kiinankieliset domainit palautti vain 2 tulosta ja ne olivat
  puolueen tiedotteita → ei toiminut.
- Toimiva: `topic: "general"` + `time_range: "month"` + `include_domains` + `language: "zh"`
  (sama malli kuin Brasilia/Argentiina). `start_date` jätetty pois, koska `time_range` +
  `start_date` = HTTP 400.
- `guancha.cn` pudotettu: `user.guancha.cn` palautti itsejulkaisuja ilman päivämäärää ja jopa
  vuodelta 2021. Tilalle otettu 36kr, huxiu, tmtpost ja 21jingji.
- `step_3` domainit: thepaper.cn, sina.com.cn, 163.com, qq.com, sohu.com, ifeng.com,
  chinanews.com.cn, cctv.com, people.com.cn, news.cn; query
  `物价 菜价 房租 工资 就业 裁员 养老金 医保 教育 育儿 消费 民生`.
- `step_4` domainit: caixin.com, yicai.com, jiemian.com, infzm.com, lifeweek.com.cn, latepost.com,
  nbd.com.cn, eeo.com.cn, stcn.com, cls.cn, caijing.com.cn, 36kr.com, huxiu.com, tmtpost.com,
  21jingji.com; query `年轻人 收入 房价 消费 婚育 养老 生活成本 就业压力`.

**Kehotteen rajaukset:** vain manner-Kiinan kiinankieliset mediat; hylkää englanninkieliset versiot
(chinadaily, globaltimes, scmp, sixthtone) sekä Hongkongin, Taiwanin, Singaporen ja ulkomaisten
toimittajien kiinankieliset palvelut (hk01, mingpao, theinitium, udn, cna.com.tw, zaobao,
BBC/DW/VOA/RFI/NYT Chinese), koonti- ja listasivut sekä vanhat uudelleenjulkaisut. Jokaisen lähteen
tyyppi merkitään (puolueen tai valtion media / valtion omistama uutisportaali / yksityinen
alustamedia / talous- tai aikakauslehti / alustan itsejulkaisu). Raportti kertoo avoimesti, että
valtaosa Kiinan mediasta on valtion ohjaamaa, eikä esitä yhden median väitettä omana faktana.

**Weibo ja LIHKG (lisätty 20.11.2026):**
- `step_8` = Tavily Weibo-haku (`include_domains`: weibo.com, weibo.cn; query
  `微博 网友 热搜 讨论 物价 房价 工资 就业 年轻人 生活成本 消费`). Weibo on manner-Kiinaa ja
  kiinankielistä, joten se sopii "mistä puhutaan" -aineistoksi.
- Promptin sääntö 11: Weibo-lähteitä enintään 3, aina anekdotaalisesti ("Weibossa käyttäjät
  kirjoittavat…"), ei koskaan faktana; haku- ja koontisivut, mainosraportit ja päiväämättömät
  postaukset hylätään. Lähdetyyppi on "sosiaalinen media (Weibo)".
- Lähdemäärä kiristettiin: tasan enintään 10 lähdettä ja enintään 2 samasta mediasta (ensimmäinen
  Weibo-ajo tuotti 12 lähdettä, joista 6 samasta mediasta).
- **LIHKG jätettiin pois:** se on Hongkongin foorumi (kantonikiina, ei mandariini) eikä ole Tavilylla
  käytännössä indeksoitu – 1–2 ketjua kuukaudessa, kaikki ilman `published_date`-kenttää; ilman
  aikarajausta tulokset olivat vuosia vanhoja ketjuja. Jos Hongkong halutaan mukaan, se tehdään
  omana katsauksenaan ("Hongkong puhuu").

**Verifiointi:**
- `ap_validate_flow` 9/9 valid (Weibo-vaiheen jälkeen).
- `ap_test_flow` `6iItvhyaJWnJXHZNCXXAE` SUCCEEDED 119,4 s → committoi
  `data/media/2026-11-20-0949-kiina-puhuu.html` (10,0 kB).
- `ap_test_flow` `muJ1SXI896mtRJtiB5c63` SUCCEEDED 63,6 s → committoi
  `data/media/2026-11-20-1018-kiina-puhuu.html` (10,0 kB): tasan 10 lähdettä (Xinhua, People's
  Daily, Sohu, NetEase, Sina ×2, Huxiu ×2, 21jingji, Weibo), enintään 2 per media, ei
  `<script>`-tageja, loppuu `</html>`.
- Julkaistu (`ap_lock_and_publish`) ja ENABLED.

**Tiedostot:** `activepieces/media/Saksa-Ranska-Ruotsi-Viro-OHJEET.md` (otsikko, taulukko, ajot,
uusi Kiina-osio, oppi #7).

**Huom:** Testiraportin yksittäiset luvut kannattaa silmämääräisesti tarkistaa (esim. PPI-luku),
koska malli voi tulkita tilastolauseen väärin; kehotetta voi tarvittaessa tiukentaa.

## Update 2026-11-19: Mediakatsaukset ajetaan nyt kerran kuukaudessa

**Tavoite (käyttäjän pyyntö):** Kaikki Media-kansion "…puhuu"-työnkulut ajetaan kerran kuukaudessa
viikoittaisen aikataulun sijaan.

**Muutos:** jokaisen 9 työnkulun trigger vaihdettiin `every_week` → **`every_month`**.
`day_of_the_month: 1`, `timezone: Europe/Helsinki`; porrastetut tunnit säilytettiin, jotta ajot
eivät osu samalle hetkelle. Triggerin nimeksi tuli "Kuukausittain (1. päivä klo HH:00)".

| Työnkulku | Flow ID | Ajo (1. päivä) |
| --- | --- | --- |
| Puola puhuu | `Hzyd1EzsgqnwkPf1bhQsW` | klo 08:00 |
| Venäjä puhuu | `c7CM8wDdl4ij1MME4Z7Aj` | klo 09:00 |
| Saksa puhuu | `1rupk7xKt3Cf1tFkMcQD2` | klo 10:00 |
| Ranska puhuu | `H94npyNLno8P53BP0dZRe` | klo 11:00 |
| Ruotsi puhuu | `GrfJLcVyE01gxBZiqXGqU` | klo 12:00 |
| Viro puhuu | `6Qz8lfbtXFVBl7Ljkqz5N` | klo 13:00 |
| Marokko puhuu | `K9PIWWToDiTzrB7uIbeYD` | klo 14:00 |
| Brasilia puhuu | `rbCrjv7PYWAsZdPuwVn6L` | klo 15:00 |
| Argentiina puhuu | `fZ2g3mAAdJa9Czu6K8PAO` | klo 16:00 |

**Verifiointi:**
- `ap_validate_flow({ folderName: "Media" })` → 9 työnkulkua, yhteydet kunnossa.
- Kaikki 9 julkaistu (`LOCK_AND_PUBLISH`) ja ENABLED.
- Marokon triggerin asetukset tarkistettu: `every_month`, `day_of_the_month: 1`,
  `hour_of_the_day: 14`, `Europe/Helsinki`.

**Huom:** Hakuikkuna on edelleen 30 vrk (`step_2` = −30 day; Brasilia/Argentiina käyttävät
`time_range: "month"`), joten kuukausiajo kattaa käytännössä kuluneen kuukauden. Raporttien
tiedostonimet ja aikaleimat säilyvät ennallaan, eikä sivuston frontendiin tarvinnut koskea.

**Tiedostot:** `activepieces/media/Saksa-Ranska-Ruotsi-Viro-OHJEET.md` (aikataulut, trigger-rivi,
`every_month`-kuvaus).

## Update 2026-11-19: "Brasilia puhuu" ja "Argentiina puhuu" – kaksi uutta mediakatsausta

**Tavoite (käyttäjän pyyntö):** Samanlaiset työnkulut kuin muut "…puhuu"-katsaukset, mutta
Brasiliasta (portugali) ja Argentiinasta (espanja).

**Työnkulut (Media-kansio, molemmat julkaistu ja ENABLED):**

| Työnkulku | Flow ID | Aikataulu | Tiedosto |
| --- | --- | --- | --- |
| Brasilia puhuu | `rbCrjv7PYWAsZdPuwVn6L` | maanantai 15:00 | `…-brasilia-puhuu.html` |
| Argentiina puhuu | `fZ2g3mAAdJa9Czu6K8PAO` | maanantai 16:00 | `…-argentiina-puhuu.html` |

Rakenne 1:1 Saksa/Ranska-mallin kanssa: `step_1` Date Helper → `step_2` −30 vrk → `step_3` Tavily
valtamedia → `step_4` Tavily riippumattomat mediat → `step_5` OpenRouter
`deepseek/deepseek-v4.1-flash` → `step_6` Code (HTML + Base64) → `step_7` GitHub PUT.

**Hakustrategia (testattu 19.11.2026):**
- `topic: "news"` ei toiminut: Brasilian valtamedia palautti englanninkielisiä Folha International
  -juttuja, Argentiina `clarin.com/filer/...`-roskaosumia tai nollan.
- Toimiva: **`topic: "general"` + `time_range: "month"` + `include_domains`**.
- **Tavily-rajoitus:** `time_range` ja `start_date`/`end_date` eivät voi olla yhtä aikaa (HTTP 400).
  Siksi `start_date` on jätetty pois ja kuukausirajaus tulee `time_range`-parametrista; `step_2`
  toimii edelleen kehotteen aikavälinä.
- Brasilia: g1.globo.com, folha.uol.com.br, oglobo.globo.com, estadao.com.br, uol.com.br,
  valor.globo.com, agenciabrasil.ebc.com.br, metropoles.com, poder360.com.br, infomoney.com.br;
  riippumattomat brasildefato.com.br, cartacapital.com.br, intercept.com.br, apublica.org, ponte.org,
  outraspalavras.net, revistaforum.com.br, nexojornal.com.br, diplomatique.org.br.
- Argentiina: clarin.com, lanacion.com.ar, infobae.com, pagina12.com.ar, ambito.com, cronista.com,
  perfil.com, tn.com.ar, lavoz.com.ar; riippumattomat eldestapeweb.com, tiempoar.com.ar,
  elcohetealaluna.com, revistaanfibia.com, cosecharoja.org, pacourondo.com.ar,
  revistacrisis.com.ar, largantapoderosa.com.
- Kehotteet hylkäävät englanninkieliset versiot, Portugalin mediat (Brasilia) sekä Espanjan,
  Meksikon, Kolumbian, Chilen ja Uruguayn mediat ja kansainväliset espanjankieliset mediat
  (Argentiina).

**Verifiointi:**
- `ap_validate_flow` 8/8 molemmille; koko Media-kansio 9/9.
- Testiajo Brasilia `weqLBK87fyTZGv71uGUQq` SUCCEEDED 56,9 s → `2026-11-19-2000-brasilia-puhuu.html`
  (12,3 kB): 10 lähdettä (G1 ×4, Agência Brasil ×2, Folha, Nexo, Agência Pública, Brasil de Fato),
  aikaväli 20.10.–19.11.2026.
- Testiajo Argentiina `LA2r7Jv7CrexDXuqqpy3C` SUCCEEDED 71,3 s → `2026-11-19-2002-argentiina-puhuu.html`
  (12,9 kB): 10 lähdettä (La Nación, Infobae ×3, Página/12, El Destape ×5), aikaväli 20.10.–19.11.2026.
- Molemmat julkaistu (`LOCK_AND_PUBLISH`) ja ENABLED.

**Tiedostot:** `activepieces/media/Saksa-Ranska-Ruotsi-Viro-OHJEET.md` (uudet rivit, hakustrategiat,
`time_range`-rajoitus ja rajoitukset).

## Update 2026-11-19: Kaikki mediakatsaukset hakevat nyt kuukauden ajalta (30 vrk)

**Tavoite (käyttäjän pyyntö):** Kaikki "…puhuu"-mediakatsaukset hakevat aiheita **kuukauden**
ajalta 14 vuorokauden sijaan. Aikataulu (maanantai) ja muut asetukset pysyvät ennallaan.

**Muutetut työnkulut (7 kpl, kaikki Media-kansiossa):**

| Työnkulku | Flow ID | LLM-askel |
| --- | --- | --- |
| Puola puhuu | `Hzyd1EzsgqnwkPf1bhQsW` | `step_4` |
| Venäjä puhuu | `c7CM8wDdl4ij1MME4Z7Aj` | `step_6` |
| Saksa puhuu | `1rupk7xKt3Cf1tFkMcQD2` | `step_5` |
| Ranska puhuu | `H94npyNLno8P53BP0dZRe` | `step_5` |
| Ruotsi puhuu | `GrfJLcVyE01gxBZiqXGqU` | `step_5` |
| Viro puhuu | `6Qz8lfbtXFVBl7Ljkqz5N` | `step_5` |
| Marokko puhuu | `K9PIWWToDiTzrB7uIbeYD` | `step_5` |

**Mitä muuttui:**
- `step_2` (Date Helper): `expression` `- 14 day` → **`- 30 day`**, nimeksi "Laske päivämäärä -30 vrk".
- Tavily-askelten nimet: "(14 vrk)" → **"(30 vrk)"** (Puola, Venäjä ×2, Saksa, Ranska, Ruotsi, Viro,
  Marokko ×2).
- Kehotteet: "VIIMEISET 14 VUOROKAUTTA" → 30, "viimeisen 14 vrk" → 30, "katsauksen kattama 14 vrk
  aikaväli" → 30, "Kahden viikon polttavimmat puheenaiheet" → **"Kuukauden polttavimmat
  puheenaiheet"**. Ruotsin ja Venäjän yleishakujen päivämääräpäättely rajattu 30 vrk:iin.
- Hakuikkuna tulee edelleen `step_2`:n tuloksesta (`start_date`), joten kaikki Tavily-haut ja
  kehotteiden `{{step_2['output']['result']}}` -viittaukset päivittyivät automaattisesti.

**Verifiointi:**
- `ap_validate_flow` kaikille: 7/7, 11/11, 8/8, 8/8, 8/8, 8/8, 8/8 validia.
- Kaikki 7 julkaistu (`LOCK_AND_PUBLISH`) ja ENABLED.
- Testiajo Marokko `SBGHcRbQw5BdTOc8Irh9f` SUCCEEDED 62,5 s: `step_2` = `2026-10-20` (30 vrk),
  raportti `data/media/2026-11-19-1949-marokko-puhuu.html` (11,9 kB) – otsikko
  "Katsaus marokkolaiseen arkeen, talouteen ja julkiseen keskusteluun 20.10.–19.11.2026",
  korostuslaatikko "Kuukauden polttavimmat puheenaiheet", 10 lähdettä (Le360, Le Matin, Yabiladi,
  Hespress FR, L'Opinion ×2, Hespress AR ×2, Al3omk, Médias24).

**Tiedostot:** `activepieces/media/Saksa-Ranska-Ruotsi-Viro-OHJEET.md` päivitetty (30 vrk -ikkuna,
`step_2`-rivi ja raportin rakenne).

## Update 2026-11-19: "Marokko puhuu" – uusi mediakatsaus (ranska + arabia)

**Tavoite (käyttäjän pyyntö):** Samanlainen viikkokatsaus kuin "Ranska puhuu", mutta Marokosta.
Marokon pääkielet ovat ranska ja arabia, joten katsaus hakee molemmilla kielillä. Nimi: "Marokko puhuu".

**Työnkulku:** `K9PIWWToDiTzrB7uIbeYD` ("Marokko puhuu"), **Media**-kansio, maanantai 14:00
Europe/Helsinki, julkaistu ja ENABLED. Rakenne 1:1 "Ranska puhuu" -työnkulun kanssa:
`trigger` → `step_1` Date Helper (nykyhetki) → `step_2` Date Helper (−30 vrk) →
`step_3` Tavily (ranskankieliset mediat) → `step_4` Tavily (arabiankieliset mediat) →
`step_5` OpenRouter `deepseek/deepseek-v4.1-flash` → `step_6` Code (HTML + Base64) →
`step_7` GitHub `PUT data/media/{timestamp}-marokko-puhuu.html`.

**Hakustrategia (testattu 19.11.2026):** `topic: "news"` ei toimi Marokolle – arabiankielinen haku
palautti nollan ja ranskankielinen pääosin ei-marokkolaisia sivuja. Toimiva ratkaisu on
`topic: "general"` + `include_domains`:
- `step_3` (ranska): lematin.ma, leconomiste.com, medias24.com, telquel.ma, le360.ma,
  aujourdhui.ma, lopinion.ma, lavieeco.com, challenge.ma, fr.hespress.com, yabiladi.com,
  barlamane.com, lakome2.com. Query: `Maroc prix salaires santé éducation emploi logement vie quotidienne`.
- `step_4` (arabia): hespress.com, le360.ma, ahdath.info, almassae.press.ma, alalam.ma,
  assabah.press.ma, alittihad.press.ma, barlamane.com, rue20.com, tanja24.com, al3omk.com.
  Query: `المغرب أسعار الأجور التقاعد الصحة التعليم السكن البطالة`.

**Kehote:** suomenkielinen, hyväksyy ranskan- ja arabiankieliset marokkolaiset lähteet ja hylkää
englanninkieliset versiot (esim. en.hespress.com), Ranskan/Belgian/Sveitsin/Kanadan mediat sekä
Algerian, Tunisian ja Egyptin mediat. Lisäksi hylätään Jeune Afrique, RFI, France 24, Al Jazeera,
BBC ja Wikipedia. Koska `general`-haku ei anna `published_date`-kenttää luotettavasti, prompti saa
hyväksyä jutun, jos julkaisupäivä selviää sisällöstä tai URL-osoitteesta. Pituus 700–800 sanaa,
enintään 10 lähdettä, CSS enintään ~45 riviä, puna-vihreä aksentti Marokon lipusta.

**Verifiointi:**
- `ap_validate_flow` 8/8 validi.
- Ensimmäinen testiajo SUCCEEDED, mutta tuotti vain yhden lähteen (jobsquare.ma); raportti poistettiin
  reposta commitilla `13d2c03`.
- Toinen testiajo `gviNU3cv7Z7MkWgs41zL7` SUCCEEDED 40,1 s → `data/media/2026-11-19-1935-marokko-puhuu.html`
  (12,4 kB). Kymmenen lähdettä sekä ranskan- että arabiankielisistä marokkolaisista medioista:
  fr.hespress.com (3), fr.le360.ma, barlamane.com/fr, lopinion.ma, al3omk.com, hespress.com (2),
  ahdath.info. Raportissa kaikki osiot ja lähdeluettelo.
- Flow julkaistu ja käytössä.

**Tiedostot:** `activepieces/media/Saksa-Ranska-Ruotsi-Viro-OHJEET.md` (uusi Marokko-osio,
hakustrategiarivi ja rajoitukset). Paikallista flow-JSONia ei luotu, koska vienti vaatii
Activepieces-API-avaimen; flow on versioitu Activepiecesissa.

## Update 2026-11-19: Kello 11 ja Kello 18 – ei osakelistaa, merkittävät yhtiötiedotteet tilalle

**Tavoite (käyttäjän pyyntö):** Raporteista pois kaikkien osakkeiden ja kurssien luettelo. Sen sijaan
vain merkittävät suomalaisten yhtiöiden tiedotteet Nasdaqin yritystiedotesivulta, linkki mukaan.
Mitätöntä ainesta ei mainita. Jos yhtiö on Arvopaperin tai Kauppalehden etusivulla, se on todennäköisesti
kiinnostava.

**Uusi askel `step_2` ("Code (company news)") molemmissa työnkuluissa** (kello 11: `wjAQ4F3wSRVcgmMP40k2H`,
kello 18: `TR0JVsYppLuOlRMEjadTI`), sijoitettu `step_18` → `step_2` → `step_9`.
- Hakee Nasdaq Nordic CNS -rajapinnan kautta Helsingin tiedotteet 24 h ajalta (JSONP, enintään 4 sivua).
- Hakee Arvopaperin ja Kauppalehden etusivujen otsikot ristiintarkistusta varten.
- Pisteyttää merkittävyyden (kategoria + otsikkoavainsanat + isot yhtiöt + etusivuosuma) ja hylkää
  rutiinit kovalla poissululla (johdon liiketoimet, omien osakkeiden omistus, tulosjulkistamisen
  aikataulu, yhtiökokouskutsu, listalleottoesite, substanssiarvo).
- Palauttaa `companyNews`-tekstilohkon (enintään 5 ehdokasta + linkki "Kaikki tiedotteet") ja `stats`.

**Kehotteet uusittu** (`txt_eurooppa_system.txt` 5,4 kB, `txt_ilta_system.txt` 5,3 kB):
- Kello 11: ei enää osaketaulukkoa eikä kaikkien osakkeiden luetteloa; kärkilaatikossa OMXH25 ja
  enintään 3 + 3 suurinta liikkujaa.
- Kello 18: markkinataulukossa vain indeksit, korot, raaka-aineet ja valuutat.
- Molemmissa uusi osio "Merkittävät yhtiötiedotteet": enintään 3 kappaletta, lyhyt perustelu ja linkki.
- Pituustavoite 450–650 sanaa.

**Verifiointi:** `ap_validate_flow` 19/19 (kello 11) ja 18/18 (kello 18). Testiajot:
- Kello 11 `abLrZGx92bsGuYvfwpMRt` SUCCEEDED 247,1 s → `2026-11-19-1730-euroopan-avaus.html`
  (17,5 kB): 0 taulukkoa, 3 tiedotetta (Componenta, Enersense, LeadDesk) + 3 tiedotelinkkiä +
  "Kaikki tiedotteet" -linkki.
- Kello 18 `0yPreukN4mx3nCuBQhg2h` SUCCEEDED 90,8 s → `2026-11-19-1732-torstai-ilta.html`
  (12,0 kB): 1 markkinataulukko, samat 3 tiedotetta linkkeineen.

Molemmat työnkulut julkaistu ja käytössä. Testiraportit jätettiin repoon esimerkkinä uudesta
muodosta; ne voi poistaa vapaasti.

**Tiedostot:** `activepieces/markkina/tools/company_news.js` (lähde), `test_company_news.mjs`,
`txt_eurooppa_*.txt`, `txt_ilta_*.txt`; paikalliset flow-JSONit synkronoitu (`step_2` + uudet kehotteet).
Ohje: `activepieces/Raporttien-ohje.md` → "Yhtiötiedotteet (step_2)".

## Update 2026-11-19: "Kello 11 Eurooppa" – reasoning-vastauksen JSON-roskan korjaus

**Ongelma:** Kello 11:n tuotantoajo (`0MgsuKP7hSMUaDwWnea30`) tuotti 143 kB raportin, jonka loppuun
liitettiin `{"role":"assistant","content":null,"refusal":null,"reasoning":"Here's a thinking process ..."}`.
OpenRouterin `deepseek/deepseek-v4.1-flash` kirjoitti koko vastauksen `reasoning`-kenttään ja jätti
`content`:n `null`iksi: `reasoning_effort: high` ja `max_tokens: 20000` kuluivat pohdintaan.
`step_5`:n `pickText` ei löytänyt contentia, joten se sarjoitti koko viestiobjektin JSONiksi, ja lopun
"viimeinen `>`"-siistintä katkaisi JSONin kesken.

**Korjaus (draft → julkaistu):**

| Askel | Muutos |
|---|---|
| `step_10` | `reasoning_effort` `high` → `low`, `max_tokens` 20000 → 32000 (samat kuin toimivassa `step_3`:ssa) |
| `step_5` | `content` otetaan vain jos se on tekstiä; muuten viimeinen ehjä `<section>…</section>` poimitaan `reasoning`-kentästä. Viestiobjektia ei enää koskaan sarjoiteta JSONiksi, raaka JSON ja vajaa fragmentti hylätään, ja osio validoidaan. |

**Tiedostot:** `activepieces/markkina/tools/step5_eurooppa.js` (uusi lähdetiedosto),
`activepieces/markkina/tools/test5_eurooppa.mjs` (14/14 testiä), `activepieces/markkina/Kello 11 Eurooppa.json`
synkronoitu. Ohje: `activepieces/Raporttien-ohje.md` → "Korjatut virheet".

**Verifiointi:** `ap_validate_flow` 18/18. Testiajo `fvdimEuknwPMViMlmMK5y` SUCCEEDED 123,3 s
(ennen 322,8 s) → `data/markkina/2026-11-19-1702-euroopan-avaus.html` (27,1 kB): 1 `<section>`,
0 `<script>`, ei merkkijonoja `"role"`/`"reasoning"`, loppuu `</html>`. Testiraportti poistettu.
Julkaistu `data/markkina/2026-11-19-1100-euroopan-avaus.html` korjattu 143 107 B → 26 521 B:
JSON-roskan tilalla on reasoning-kentästä kaivettu oikea spekulaatio-osio.

**Opiksi:** reasoning-malleilla `reasoning_effort` kannattaa pitää `low`-tasolla ja tokenibudjetti
riittävänä. Ajon jälkeen kannattaa tarkistaa, ettei raportissa ole merkkijonoa `"role"`.

## Update 2026-11-19: "Aamuraportti NEW" – etusivujen kärkiteemat ja vaikutus avaukseen

Uusi **erillinen** työnkulku `Aamuraportti NEW` (Activepieces id `LXNbIZEZQmW5wkUA7KHyZ`, 22 askelta),
kopio vanhasta `Aamuraportista`. Vanha `Aamuraportti` (`r6YBOd0I2lTEyMz9vOIwf`) jätettiin ennalleen
(draft, pois käytöstä), jotta sitä voi verrata ja ottaa tarvittaessa takaisin käyttöön.

**Mitä uusi tekee:** mittaa, mistä uutisvirta puhuu ja kuinka näkyvästi, ja johtaa siitä arvion
Helsingin ja Euroopan pörssiavaukseen. Uudet askeleet:

| Askel | Tyyppi | Sisältö |
|---|---|---|
| `step_2` | RSS `rss_read_multiple_feeds` (piece 0.8.1) | Google News Business (US + FI), Google News Technology, MarketWatch Top Stories, Nasdaq Markets, FT Home, Yle Pääuutiset. Ilmainen. |
| `step_19` | Tavily `search` (advanced, `time_range: day`) | `include_domains`: wsj.com, bloomberg.com, reuters.com, ft.com, cnbc.com. 2 krediittiä. |
| `step_20` | Code (`tools/step21.js`) | Näkyvyyspisteet: 13 teemaa, normalisoitu 0–100, duplikaattien poisto, tuoreusraja 30 h, suorat linkit. |
| `step_21` | OpenRouter `custom_api_call` | Kirjoittaa osion "Etusivujen kärkiteemat ja niiden vaikutus pörssiavaukseen" (`tools/txt_prominence_system.txt` + `txt_prominence_user.txt`). |
| `step_5` | Code | Liittää uuden osion HTML:ään ennen spekulaatio-osiota; tiedostonimi `...-aamu-new.html`. |
| `step_22` | Code | Liittää osion perään kiinteän, taitettavan selityksen näkyvyyspisteistä (`tools/step22_legend.js`). |

**Löydökset lähteistä:** WSJ:n oma RSS (`feeds.a.dj.com`) on kuollut (jutut 27.1.2025), CNBC:n RSS
palauttaa HTTP 403 Activepiecesin IP:stä, MarketWatch MarketPulse on jäässä. Toimivat: Google News
-topic-syötteet, MarketWatch Top Stories, Nasdaq Markets, FT Home, Yle. Siksi WSJ/CNBC haetaan
Google Newsin kautta (lähde otsikon perässä, esim. "… - WSJ") ja Tavilylla suoraan.

**Pisteytys:** `100 × (0,55·min(1, mediat/12) + 0,20·min(1, syötteet/4) + 0,15·min(1, uutiset/20) +
0,10·tuoreus)`. Luokat: vahva ≥ 60, kohtalainen ≥ 40, heikko ≥ 25. Ensimmäinen versio (painot 8/6/3
pistettä) kyllääntyi sataan liian helposti, minkä vuoksi normalisointi tehtiin.

**Raportin osio:** taulukko (teema, näkyvyys, tuoreus, välittyminen, arvio avausvaikutuksesta, mitä
avauksessa pitää nähdä), kappaleet kärkiajureista, "Onko jo hinnoiteltu?" -kappale, "Mitä avauksessa
pitää nähdä" -lista ja pakollinen lähdeluettelo. Kehote kieltää päättelemästä suuntaa uutisen sävystä:
suunnan ratkaisee kurssiluku.

**Korjattu virhe:** `ap_add_step` loi OpenRouterin Custom API Call -askeleelle
`propertySettings.body.schema = {}`, jolloin pyyntö lähti ilman viestejä → `400 Input required:
specify "prompt" or "messages"`. Korjaus: aseta `actionName` ja `body_type: json`, anna
`body.data`-rakenne, jonka jälkeen skeema tallentuu oikein. Tarkista sama, jos vastaava askel
rakennetaan joskus uudelleen.

**Ajo:** `m4pvOt28n4g3WFlOaTeb2` SUCCEEDED (160,6 s) → committoi
`data/markkina/2026-11-19-0758-torstai-aamu-new.html` (26,6 kB, 0 `<script>`-tagia). Teemat menivät
oikein: tekoäly 14 mediaa / 8 syötettä / 24 uutista, listautumiset 6 mediaa, korot 4 mediaa. LLM yhdisti
päällekkäiset teemat yhdeksi riviksi ja käsitteli Anthropicin annin toteutuneena tapahtumana.

**Paikalliset tiedostot:** `activepieces/markkina/Aamuraportti NEW.json` (rakennetaan skriptillä
`tools/build4_new.ps1`), `tools/step21.js`, `tools/step5_new.js`, `tools/txt_prominence_system.txt`,
`tools/txt_prominence_user.txt`, testi `tools/test21.mjs` (12/12). `docs/app.js`: uusi slotti
`'aamu-new'` (🆕 Aamuraportti NEW).

**Avoin havainto:** vanha `step_9` tuottaa tapahtumahakujen tuloksista `[object Object],…` -roskaa
(`flatten` ei käsittele objektitaulukoita). Vika on peritty vanhasta työnkulusta eikä estä toimintaa,
mutta se kuluttaa tokeneita ja kannattaa korjata molemmista.

**Avoin havainto 2:** uuden osion lähdeluettelo ei tullut raporttiin, vaikka blokki sisältää suorat
linkit ja käskyn näyttää ne. Kiristetty sääntö 9 on valmiina `tools/txt_prominence_system.txt`:ssä,
mutta sitä ei ole viety Activepiecesin `step_21`-kehotteeseen (ison kehotteen vienti MCP:llä on
virhealtis). Seuraava askel: joko päivitä kehote huolellisesti UI:ssa tai liitä lista mekaanisesti
`step_5`:ssä.

**Julkaisu:** `ap_lock_and_publish` → Aamuraportti NEW on julkaistu ja ENABLED (arkisin 06:00
Europe/Helsinki). Vanha Aamuraportti on edelleen draft ja pois käytöstä.

## Current State (as of 2026-11-14)
The **frontend is published and live**. The repository is at https://github.com/Jarno1965/MarkkinaTilanne (public, branch `main`), and GitHub Pages serves the site from `docs/` at https://jarno1965.github.io/MarkkinaTilanne/. The first commit is `c9fa1a0`. What remains is the Activepieces automation.

## Update 2026-11-18: Activepieces MCP connected & "Puola puhuu" flow published
- Connected Activepieces official MCP server (`https://cloud.activepieces.com/mcp`, `streamableHttp`, OAuth, timeout 180s) to Cline.
- Built, tested, validated, and published the **"Puola puhuu"** workflow (`id: Hzyd1EzsgqnwkPf1bhQsW`) directly into the **`Media`** folder (`id: BQoUk5xxI9N7FWMQxkW7d`) on Activepieces Cloud via MCP.
- Workflow schedule: Mondays at 08:00 `Europe/Helsinki`. Calculates `-14 day` (`YYYY-MM-DD`) via Date Helper, queries Tavily `POST /search` (`language: "pl"`, `filter_by_language: true`, `start_date`, `include_published_date: true`, `filter_by_published_date: true`, `topic: "news"`, `search_depth: "advanced"`), synthesizes a standalone Finnish HTML5 report via OpenRouter (`deepseek/deepseek-v4.1-flash`) with verified Polish sources, dates, and URLs, and commits to `data/media/YYYY-MM-DD-HHMM-puola-puhuu.html` with commit message `"Puola puhuu"`.

## Update 2026-11-18: "Venäjä puhuu" flow published (Media folder)
- Built, tested and published the **"Venäjä puhuu"** workflow (`id: c7CM8wDdl4ij1MME4Z7Aj`) in the **`Media`** folder via Activepieces MCP, modelled on "Puola puhuu" but covering two countries.
- Schedule: Mondays 09:00 `Europe/Helsinki` (Poland runs at 08:00 so the two runs do not overlap).
- Five Tavily `POST /search` calls, all `language: "ru"`, `filter_by_language: true`, `search_depth: "advanced"`, `max_results: 15`:
  `step_3` Russia mainstream (`topic: news`, `start_date` = -14 d); `step_4` Russia independent/exile outlets named in the query (Meduza, Novaja Gazeta Europe, Radio Svoboda, Važnyje istorii, Verstka, Proekt, The Insider); `step_5` Belarus local media (`topic: news`); `step_9` Belarus independent/opposition outlets named in the query; `step_10` Belarus independent outlets via `topic: general` + `include_domains` (zerkalo.io, nashaniva.com, svaboda.org, reform.news, euroradio.fm, nn.by).
- One OpenRouter step (`deepseek/deepseek-v4.1-flash`) produces a standalone Finnish HTML5 report with two country sections, a "top topics" box, a media-landscape section per country, and a source list that labels every outlet as state/state-aligned, independent, exile-independent or NGO. Code step re-used unchanged from "Puola puhuu"; GitHub commit goes to `data/media/YYYY-MM-DD-HHMM-venaja-puhuu.html` with message `Venäjä puhuu`.
- Lessons baked into the design: `include_domains` + `topic: "news"` returns **zero** results for these outlets; `topic: "general"` returns good Russian-language content but no `published_date`; Tavily rejects `country: "by"` and has no Belarusian `language` value, so Belarus is searched in Russian (second official language, dominant in Belarusian media).
- Run `ofVqfD98nOQcydFDDt1hO` SUCCEEDED (134.6 s) and committed the sample report `data/media/2026-11-18-2019-venaja-puhuu.html` (17 sources: RIA, AiF, News.ru, MK, Vedomosti, Expert, Mail.ru, Kavkaz-Uzel, iStories, Novaja Gazeta Baltia, News.by, SB.by, Reform.news, Zerkalo, Naša Niva). Two weaker intermediate test reports (2010, 2015) were deleted from the repository.
- Final prompt adds a blog/forum/UGC exclusion (e.g. smart-lab.ru, LiveJournal, Telegram) and a ban on citing section front pages. A re-test with it (`LqO04KbK3NHyhhzJWaEeY`, 80.5 s) returned a thinner source set, so that 2025 report was deleted and the richer 2019 report stays as the sample. Published draft = final prompt version (11/11 valid, published & ENABLED).
- Local repo: `data/media/index.json` lists both media reports; maintenance guide added as `activepieces/media/Venaja-puhuu-OHJEET.md`.

## Update 2026-11-18: "Saksa/Ranska/Ruotsi/Viro puhuvat" flows published (Media folder)
- Built four single-country weekly flows in the **`Media`** folder via Activepieces MCP, all modelled on "Venäjä puhuu" (Date Helper ×2 → 2 Tavily searches → OpenRouter → Code → GitHub commit):
  `Saksa puhuu` (`1rupk7xKt3Cf1tFkMcQD2`, Mon 10:00, `de`), `Ranska puhuu` (`H94npyNLno8P53BP0dZRe`, Mon 11:00, `fr`), `Ruotsi puhuu` (`GrfJLcVyE01gxBZiqXGqU`, Mon 12:00, `sv`), `Viro puhuu` (`6Qz8lfbtXFVBl7Ljkqz5N`, Mon 13:00, `et`). Schedules are staggered one hour apart after Poland 08:00 and Venäjä 09:00.
- Reports commit to `data/media/YYYY-MM-DD-HHMM-<maa>-puhuu.html` with commit message `<Maa> puhuu`; all four are published & ENABLED and folder validation passes (6 flows, connections OK).
- Search strategies differ per market because Tavily behaves differently (probed with direct `ap_run_action` calls):
  - **Saksa:** short concrete news query (long "what people talk about" phrasing returned associations/foundations); independent outlets by name in the query.
  - **Ranska:** the general news query works as-is (mainstream + Mediapart).
  - **Ruotsi:** `include_domains` + `topic: "news"` returns **zero**; `general` + `include_domains` on mainstream outlets hits the election compass. So mainstream is queried by outlet names (`«Dagens Nyheter» … «SVT»`), independents via `topic: "general"` + `include_domains` (etc.se, arbetet.se, flamman.se, syre.se, dagensarena.se, kvartal.se) with a "date must be visible in the text" rule.
  - **Viro:** `include_domains` + `topic: "news"` works well but the query must stay narrow (`hinnad palgad pensionid tervishoid`); adding words returns zero.
- **Length guard is mandatory:** `deepseek/deepseek-v4.1-flash` truncated the German report twice (~17–20k chars) and the Code step correctly refused to publish (run FAILED). Prompt now caps the report at ~700–800 words, 2–3 paragraphs per section, ≤10 sources and ≤45 CSS lines; the re-run finished in 23.8 s with a complete document. The same cap was added to Ranska and Viro.
- Sample reports committed: `2026-11-18-2034-ranska-puhuu.html` (11 sources incl. Mediapart, franceinfo, TF1, Les Échos), `…-2059-viro-puhuu.html` (11 sources: Äripäev, Postimees, ERR), `…-2100-ruotsi-puhuu.html` (SVT, nyheter24, dagensps), `…-2104-saksa-puhuu.html` (10 sources: Focus, SZ, taz, fr.de, moz.de). The weak first German test report (2033) was deleted.
- Repo: `data/media/index.json` lists all six media reports; guide `activepieces/media/Saksa-Ranska-Ruotsi-Viro-OHJEET.md` documents schedules, search strategies, length guard and maintenance.

## Update 2026-11-18: projects merged
The Activepieces project and the site now live in one repository. Flows: `activepieces/markkina/*.json` (they commit to `data/markkina/`), helper scripts: `activepieces/markkina/tools/`, shared import script: `activepieces/tools/import-to-activepieces.ps1`, guide: `activepieces/Raporttien-ohje.md`. Feeds are registered in `docs/feeds.json`; reports live in `data/<feed>/`. The merge is **not committed yet**. Note: the real filename slugs produced by the flows (`<weekday>-aamu`, `<weekday>-ilta`, `euroopan-avaus`, `viikkoennakko`) differ from the example slugs above; they still match the filename regex, so the site shows them.

## Key Decisions (latest session, 2026-11-14)
- **File naming:** `data/YYYY-MM-DD-HHMM-slug.html` (Finnish time), e.g. `2026-11-13-0600-aamukatsaus.html`. The slug is a fixed per-slot value, NOT generated by the LLM. Alphabetical order equals chronological order.
- **Sorting without a database:** filenames are parsed with `^(\d{4})-(\d{2})-(\d{2})-(\d{4})-([a-z0-9-]+)\.html$` and sorted descending by the concatenated sort key.
- **Adding time slots later:** the time comes from the filename, so a new slot (e.g. 16:00) requires **no frontend changes**. `CONFIG.slots` only maps a slug to a label and icon; unknown slugs are auto-formatted.
- **Report rendering:** the HTML is fetched as text and injected into a **sandboxed iframe (srcdoc)**. Reason: GitHub Pages publishes only `docs/`, and raw.githubusercontent.com serves HTML as text/plain with nosniff, so a direct iframe src would show source code. The sandbox has no allow-scripts, so AI-generated HTML cannot run scripts.
- **Data discovery:** GitHub Contents API, one request per session, cached in sessionStorage for 5 minutes. Owner and repo are derived from the Pages URL. Report bodies come from download_url (no API quota).
- **Local development:** on localhost the app prefers `../data/<feed>/index.json` (a filename manifest in the repo root `data/`) and falls back to the Contents API. In production it is the other way round, and report bodies always come from `download_url`. (Updated 21.11.2026; the old `docs/data/` copy was deleted.)
- **GitHub Pages:** Deploy from a branch, `main` / `/docs`.
- **Limit awareness:** the Contents API returns at most 1000 entries per directory (about 11 months at 3 reports/day). Migration path: `data/YYYY/MM/` subfolders or the Git Trees API.

## Verified in This Session
- `node --check docs/app.js` passes.
- 20/20 unit checks pass for filename parsing, sorting, day grouping, slot labels and the structure of the three example reports (doctype, own `<style>`, no `<script>`, viewport meta, `lang="fi"`).
- All five assets were served with HTTP 200 from a local static server.
- CSS braces balanced (72/72); all 12 element IDs referenced by `app.js` exist in `index.html`.

## Published (2026-11-14)
- Repository: https://github.com/Jarno1965/MarkkinaTilanne (public, branch `main`, first commit `c9fa1a0`).
- GitHub Pages: source `main` / `/docs`, live at https://jarno1965.github.io/MarkkinaTilanne/ (verified HTTP 200).
- Secret scan before the first commit (`git grep` on the index) found no keys or tokens. A `.gitignore` was added for OS/editor junk, `tmp-*` scratch files and secret patterns.
- Repository-local git identity: `Jarno1965 <124132330+Jarno1965@users.noreply.github.com>` (the global config contained the placeholder `you@example.com`, which was deliberately not used).
- Confirmed the two platform assumptions in production: raw report URLs return `text/plain; charset=utf-8` with `access-control-allow-origin: *`, and `docs/`-Pages does **not** serve the sibling `data/` folder (404). Both are exactly why the frontend fetches the report as text into `srcdoc`.

## Immediate Next Steps
1.  Build the Activepieces workflow for the 06:00 morning report and run one test commit.
2.  Create `prompts/` and move the three report prompts there.
3.  Optional: delete the three example reports once real reports start arriving.
4.  Optional: remove the local `data/index.json` test manifest when it is no longer needed.
5.  Optional: persist the Activepieces instruction into the repository (e.g. `activepieces/README.md`).

## Report Prompts (unchanged drafts, still to be moved into `prompts/`)
Three detailed prompts exist for the three daily reports. They ask the LLM to:
- Include a timestamp in the format `dd.mm.yyyy HH:mm` (Finnish time).
- Focus on specific regions (US/Asia morning, Europe at open, midday summary).
- Include index movements (S&P 500, Nasdaq, Dow Jones, Nikkei 225, Hang Seng, Shanghai Composite, KOSPI, ASX 200).
- List key market-moving news with brief reasoning.
- Add a section on Finnish news and a "watchlist" section for the next trading day, separated into Europe and Finland.
- Output the entire response as clean, ready-to-render HTML.

## Open Questions / Things to Resolve
- **Repository slugs:** `CONFIG.owner` / `CONFIG.repo` in `docs/app.js` are empty and rely on auto-detection from the Pages URL.
- **Keep or drop `data/index.json`:** it is only needed for local testing before the repo is on GitHub.
- **Activepieces GitHub piece:** verify whether "Create or Update File" exists on the chosen tier; otherwise use a Custom API Call to `PUT /repos/{owner}/{repo}/contents/{path}`.
