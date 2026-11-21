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
| `Aamuraportti NEW.json` | Aamuraportti NEW | arkisin klo 06:00 (sama aika, eri työnkulku, ks. oma luku) |
| `Kello 11 Eurooppa.json` | Kello 11 Eurooppa | arkisin klo 11:00 |
| `Kello 18 raportti.json` | Kello 18 raportti | arkisin klo 18:00 |
| `Sunnuntai.json` | Sunnuntai (viikkoennakko) | sunnuntaisin klo 08:00 |
| `Lauantai.json` | Lauantai (viikkokatsaus) | lauantaisin klo 09:00 |

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

## Sunnuntai (viikkoennakko)

`Sunnuntai.json` on **eteenpäin katsova** viikkoennakko: se kertoo, mitä alkavalla viikolla
tapahtuu, mitä markkina odottaa ja millaisia skenaarioita viikosta voi rakentaa. Lauantain
viikkokatsaus katsoo taaksepäin, Sunnuntai eteenpäin — sama runko, eri suunta.

Työnkulku rakennettiin **kloonaamalla toimiva `Lauantai`-työnkulku** Activepiecesin MCP-työkaluilla
(`ap_duplicate_flow`), joten kaikki 17 askelta, koodiaskeleet ja yhteydet (Tavily, OpenRouter,
GitHub, Firecrawl) tulivat mukaan. Sen jälkeen vain sisältö muutettiin eteenpäin katsovaksi.
Työnkulun id on `yltf57XbPcRVIzKKBziRh`.

```
step_1  Date Helper               pvm ja kellonaika
step_2  Tavily                    globaali ja USA:n viikkonäkymä (week ahead)
step_3  Tavily                    Euroopan ja Pohjoismaiden viikkonäkymä
step_4  Tavily                    viikonlopun uutiset ja geopolitiikka (2 vrk)
step_5  Tavily                    alkavan viikon kalenteri ja odotukset
step_6  LLM                       poimii enintään 3 TULEVAA tapahtumaa JSON:na
step_7  Code                      JSON -> hakulauseet, tikkerit ja seurantalista
step_8  Tavily                    tapahtuman 1 ennakko-odotukset
step_9  Tavily                    tapahtuman 2 ennakko-odotukset
step_10 Tavily                    tapahtuman 3 ennakko-odotukset
step_17 Code                      lähtötason kurssit (Yahoo: muutos viikon takaa + linkit + värit)
step_11 Firecrawl                 alkavan viikon ennakot ja strategien näkemykset
step_12 Code                      siistaa Firecrawl-tuloksen
step_13 Code                      tiivistys LLM:lle (eteenpäin katsova sanamuoto)
step_14 LLM                       HTML-raportti + spekulaatio-osio
step_15 Code                      HTML + otsikkorivi tiedostoksi
step_16 GitHub                    tallennus polkuun ...-viikkoennakko.html
```

Ajoaika on **sunnuntaisin klo 08:00** (Europe/Helsinki) ja raportti julkaistaan polkuun
`data/markkina/YYYY-MM-DD-HHMM-viikkoennakko.html` (sama slug kuin vanhalla Sunnuntailla).

### Raportin rakenne

Kehote (`step_14`, tiedosto `tools/txt_sunnuntai_system.txt`) määrää osiot:

a) Alkavan viikon tärkein ajuri ja maanantain avaus (korostuslaatikko)
b) Alkavan viikon talouskalenteri ja keskuspankit
c) Tuloskausi ja yritystapahtumat
d) Yhdysvallat
e) Eurooppa ja Helsingin pörssi
f) Lähtötilanne: viimeisin päätös ja viikon muutos (kurssitaulukko sellaisenaan)
g) **Spekulaatio: skenaariot ja pelikirja alkavalle viikolle**
h) Lähteet

### Spekulaatio-osio

Osio on pakollinen ja se alkaa aina täsmälleen samalla HTML-rakenteella (keltainen katkoviivalaatikko,
`background:#fffbeb`, `border:2px dashed #f59e0b`) ja samalla vastuuvapautuksella kuin Kello 11
-raportin spekulaatio: *"Tämä osio on toimittajan spekulaatiota, ei sijoitusneuvontaa eikä ennuste."*
Sisältö:

- **Kolme skenaariota** alkavalle viikolle: positiivinen (helpotusralli), perusskenaario ja
  negatiivinen (myyntiaallon jatkuminen), jokaisessa edellytykset, eniten liikkuvat indeksit ja
  sektorit sekä kumoutumisehto. Muoto "Jos..., niin...".
- **Yllätyskortti:** yksi alihinnoiteltu riski tai yllätysmahdollisuus.
- **Seurattavat kohteet:** 2–3 spekulatiivista teemaa perusteluineen, aikajänteineen ja riskeineen.

### Alkavan viikon rajaus (tärkeä)

Koska uutishaut palauttavat viikon ajalta myös **menneen** viikon kalenterimerkintöjä, kehotteessa on
erillinen sääntö: *"Alkava viikko tarkoittaa seuraavasta maanantaista alkavaa viikkoa. Tarkista
jokaisen tapahtuman päivämäärä ja vertaa sitä annettuun tämänhetkiseen päivään. Älä koskaan esitä
mennyttä tapahtumaa tulevana."* Sama muistutus on myös käyttäjäviestissä heti päivämäärän alla.

Ilman tätä sääntöä ensimmäinen testiajo esitti keskiviikon 18.11. (mennyt) tulevan viikon
kalenterissa. Korjauksen jälkeen raportti listasi vain 23.–27.11. tapahtumat.


### Lähtötason kurssit (step_17)

`step_17` (`tools/step17_startpoint_quotes.js`) hakee samat 19 instrumenttia kuin Lauantai, mutta
laskee muutoksen **tasan viikon takaiseen päätökseen** aikaleiman perusteella (ei viittä
kaupankäyntipäivää). Näin myös ympärivuorokautiset kohteet kuten Bitcoin antavat oikean viikon
muutoksen. Taulukko liitetään raporttiin sellaisenaan osiossa "Lähtötilanne".

### Linkit, lähteet ja eheys

Samat säännöt kuin Lauantaissa: jokainen indeksi-, raaka-aine- ja valuuttamaininta on linkki Yahoo
Financeen, jokainen uutisväite linkitetään lähteeseensä ja raportin lopussa on "Lähteet"-osio.
`step_15` (`tools/step15_finalize.js`) sisältää katkeamistarkistuksen.

### Sunnuntain omat kooditiedostot

| Tiedosto | Tehtävä | Ero Lauantain vastaavaan |
| --- | --- | --- |
| `tools/step13_compact_sunnuntai.js` | tiivistys LLM:lle | seurantalista kertoo tulevista tapahtumista ja ennakko-odotuksista; `renderResults` muuntaa tapahtumahakujen listat luettavaksi tekstiksi (ei `[object Object]`) |
| `tools/step14_sunnuntai.js` | tapahtumien JSON -> hakulauseet | varahakulauseet katsovat eteenpäin |
| `tools/step17_startpoint_quotes.js` | lähtötason kurssit | viikon vertailu aikaleiman perusteella |

Kehotteet ovat tiedostoissa `tools/txt_sunnuntai_system.txt`, `tools/txt_sunnuntai_user.txt`,
`tools/txt_sunnuntai_extract_system.txt` ja `tools/txt_sunnuntai_extract_user.txt`.

### Työnkulun muuttaminen

Muutokset tehdään Activepiecesin käyttöliittymässä tai MCP-työkaluilla. Paikallinen `Sunnuntai.json`
pidetään synkronissa ajamalla `tools/build6_sunnuntai.ps1`, joka rakentaa tiedoston `Lauantai.json`:stä
ja lukee kehotteet ja koodit `tools/`-kansion tiedostoista. Skripti tarvitsee UTF-8-BOM:in, jotta
PowerShell 5.1 lukee ääkköset oikein (muuten `Lisätty` ja `NÄKYMÄ` vääristyvät).

**Huom `externalId`:** instanssin Sunnuntai on luotu kloonaamalla, joten sen `externalId` on uusi
eikä tiedossa repossa. Tiedostossa on työnkulun historiallinen Sunnuntai-tunnus
(`6mF0HkP7AU5NIFE2FASfv`), joten `import-to-activepieces.ps1` ei osu siihen `externalId`:llä vaan
työnkulun nimellä "Sunnuntai".

Testit: `node tools/test_sunnuntai.mjs` (75 tarkistusta) ja `node tools/test_step13_compact.mjs`
(molempien viikonlopputyönkulkujen tiivistyskoodin yksikkötesti, 22 tarkistusta).

## Lauantai (viikkokatsaus)

`Lauantai.json` on lauantain viikkokatsaus: se kerää kuluneen viikon merkittävimmät
markkinatapahtumat ja markkinoihin vaikuttaneet asiat ja julkaisee ne yhtenä HTML-raporttina.
Rakenne on Sunnuntain kaltainen, mutta mukaan on lisätty ilmainen webscraper **Firecrawl**.

Työnkulku on rakennettu **Activepiecesin MCP-työkaluilla** (kuten mediakatsaukset), joten sen
askeleet on numeroitu juoksevasti `step_1`…`step_16`. Työnkulun id on `wuTvMpZibKnuSvwGv0Ex6`
ja `metadata.externalId` on `d7K78m0VXNgIYpZrQtu8Q`.

```
step_1  Date Helper               pvm ja kellonaika
step_2  Tavily                    viikon markkinayhteenveto (weekly wrap)
step_3  Tavily                    viikon markkina-ajurit
step_4  Tavily                    viikon merkittävimmät tapahtumat
step_5  Tavily                    odotetut tapahtumat (tuleva viikko)
step_6  LLM                       poimii enintään 3 tapahtumaa JSON:na
step_7  Code                      JSON -> hakulauseet, tikkerit ja seurantalista
step_8  Tavily                    tapahtuman 1 tulos ja reaktio
step_9  Tavily                    tapahtuman 2 tulos ja reaktio
step_10 Tavily                    tapahtuman 3 tulos ja reaktio
step_17 Code                      viikon markkinaluvut (Yahoo: viikon muutos + linkit + värit)
step_11 Firecrawl                 viikon artikkelien kokotekstit (search_web + markdown)
step_12 Code                      siistaa Firecrawl-tuloksen
step_13 Code                      tiivistys LLM:lle
step_14 LLM                       HTML-raportti
step_15 Code                      HTML + otsikkorivi tiedostoksi
step_16 GitHub                    tallennus polkuun ...-viikkokatsaus.html
```

Ajoaika on lauantaisin klo 09:00 (Europe/Helsinki). Perjantain USA-kaupankäynti on silloin
päättynyt, joten koko viikko on katsauksessa mukana. Raportissa ei ole erillistä kurssitaulukkoa,
joten indeksien tasot ja prosentit esitetään vain jos ne mainitaan uutisissa.

**Huom `step_13`:n syöteavaimista:** `step_7_answer`, `step_8_answer`, `step_15_answer`,
`step_16_answer` ja `step_17_answer` ovat jaetun `tools/step9.js`-koodin vaatimia avainnimiä.
Vain niiden arvot (viittaukset) noudattavat uutta numerointia.


### Firecrawl: ilmainen webscraper

`step_11` hakee viikon tärkeimmät artikkelit ja niiden **koko sivusisällön markdownina**
yhdellä kutsulla (`search_web`, `includePageContent: true`). Näin LLM saa tiivistelmien
lisäksi artikkelien tarkat yksityiskohdat.

`step_12` (`tools/step12_scrape.js`) lukee Firecrawlin vastauksen **oikeasta polusta**
(`data.news` / `data.web`, myös suora `news`/`web` varalla) ja siivoaa markdownista
linkki- ja kuvasyntaksin sekä navigaatiorivit (valikot, "Skip to content", sisäänkirjautumis-
kehotukset). Ilman tätä siivousta artikkelin alusta olisi tullut pelkkä sivustovalikko.

- **Ilmainen taso:** 1 000 krediittiä/kuukausi, uusiutuu kuukausittain, ei luottokorttia.
  Yksi haettu sivu = 1 krediitti. Lauantaiskatsaus kuluttaa noin 5–6 krediittiä/viikko
  eli alle 30 krediittiä kuukaudessa.
- **Yhteys:** Activepieces tarvitsee Firecrawl-yhteyden (API-avain). Maksuttomalla tasolla
  yhteys luodaan työnkulun sisältä: avaa `step_11` → *Select a connection* →
  *Create a connection* → liitä firecrawl.dev-sivulta kopioitu API-avain. Yhteyden
  externalId on `Vdq5bftNVGbQ5xa1hEqxM` (projektikohtainen).
- **Asetukset `step_11`:** `limit: 5`, `sources: ['news']`, `timeFilter: 'qdr:w'`
  (viimeinen viikko), `includePageContent: true`, `timeout: 120000`.
- **Vikasietoisuus:** `step_11` ja `step_12` on asetettu `continueOnFailure = true`, joten
  jos Firecrawl ei vastaa (esim. krediitit loppuvat), raportti syntyy silti pelkkien
  Tavily-hakujen pohjalta. Raportti ei siis koskaan jää syntymättä scraperin takia.
- **Build-skripti:** `build5_lauantai.ps1` kirjoittaa `step_11`:lle yhteyden
  `{{connections['Vdq5bftNVGbQ5xa1hEqxM']}}`. Yhteyden voi vaihtaa ympäristömuuttujalla
  `FIRECRAWL_CONNECTION_ID` (piece-versio: `FIRECRAWL_PIECE_VERSION`, oletus `0.7.3`).

### Työnkulun muuttaminen

Koska työnkulku on rakennettu MCP:llä, muutokset tehdään Activepiecesin käyttöliittymässä
tai MCP-työkaluilla (`ap_flow_structure`, `ap_read_step_settings`, `ap_update_step`,
`ap_validate_flow`, `ap_test_flow`, `ap_lock_and_publish`). Paikallinen `Lauantai.json` pidetään
synkronissa samalla tavalla (lue nykyinen asetus `ap_read_step_settings`-työkalulla, päivitä
`ap_update_step`-työkalulla ja kopioi sama sisältö tiedostoon).

> **`tools/build5_lauantai.ps1` on vanhentunut (21.11.2026).** Se rakensi `Lauantai.json`:n
> vanhasta 14 askeleen `Sunnuntai.json`-pohjasta ja numeroi askeleet uudelleen. Sunnuntai
> korvattiin samana päivänä uudella 17 askeleen eteenpäin katsovalla työnkululla, joten skriptin
> lähde ei enää vastaa oletusta. Skripti heittää nyt virheen sen sijaan että tuottaisi hiljaa
> väärän tuloksen. Uudelleennumerointi on jo tehty kertaalleen, joten sitä ei enää tarvita.
> Sunnuntain puoli rakennetaan `tools/build6_sunnuntai.ps1`:llä, joka lukee `Lauantai.json`:n
> ja kehotteet/koodit `tools/`-kansiosta.

Vaihtoehtoinen vienti (REST) onnistuu `import-to-activepieces.ps1 -Flow 'Lauantai'`-komennolla,
jos `ACTIVE_PIECES_API_KEY` on asetettu. Työnkulku tunnistetaan `metadata.externalId`-arvolla
`d7K78m0VXNgIYpZrQtu8Q`.

### Viikon markkinaluvut (step_17)

`step_17` (`tools/step17_weekly_quotes.js`) hakee 19 instrumentin päiväkurssit Yahoo Financen
chart-rajapinnasta (`range=1mo`, `interval=1d`) ja laskee **viikon muutoksen** = viimeisin päätös
vs. noin viisi kaupankäyntipäivää aiemmin. Askel tuottaa kaksi kenttää:

- `weeklyData` – tekstirivit LLM:lle (nimi, taso, viikon muutos, päiväys, linkki).
- `weeklyTable` – valmis HTML-taulukko, jossa on klikattavat Yahoo-linkit ja värit
  (nousu vihreä `#1a7f37`, lasku punainen `#c62828`).

Kehote (`step_14`) vaatii, että taulukko liitetään raporttiin **sellaisenaan** ja että
leipätekstin viikkoluvut otetaan vain tästä datasta – uutisista poimittuja päivälukuja ei saa
esittää viikon lukuna. Tämä korjasi 21.11.2026 havaitun virheen, jossa raportti esitti DAXille
1,06 % (päiväluku), vaikka viikon lasku oli 7,28 %.

**Huom:** `step_17` sai nimensä Activepiecesin vapaan numeron mukaan, joten se on ajonumeroltaan
`step_10`:n ja `step_11`:n välissä. Repon `build5_lauantai.ps1` käyttää siksi eksplisiittistä
nimeämiskarttaa (ei juoksevaa numerointia).

### Linkit ja lähteet

Raportti on tarkoituksella **hyvin lähteistetty**, jotta lukija voi tarkistaa jokaisen luvun:

- **Instrumenttilinkit:** jokainen maininta indeksistä, raaka-aineesta tai valuutasta on klikattava
  Yahoo Finance -kurssisivu — myös leipätekstissä ja korostuslaatikossa, ei vain taulukossa.
  Osoitteet tulevat `step_17`:n `weeklyData`-kentästä.
- **Uutislähteet:** uutisrivit sisältävät lähde-URLin. Tämä vaati, että `step_12`
  (`tools/step12_scrape.js`) ja `step_13` (`tools/step13_compact.js`, Lauantain oma kopio jaetusta
  `step9.js`:stä) säilyttävät artikkelin osoitteen. Jaettu `step9.js` pudottaa sen, joten Lauantailla
  on oma versio.
- **Tapahtumahakujen tulokset:** `step_13`:n `renderResults` muuntaa tapahtumahakujen tulokset
  (valmis lista objekteja tai JSON-merkkijono) luettaviksi riveiksi. Ilman sitä tekstissä näkyi
  `[object Object],[object Object],...`. Sama korjaus on Sunnuntaissa.
- **Lähteet-osio:** kehote vaatii raportin loppuun osion "Lähteet", joka listaa käytetyt artikkelit
  otsikolla ja klikattavalla linkillä. Jos väitteelle ei ole suoraa kurssilinkkiä (esim. toimialan
  liike), se linkitetään artikkeliin, josta väite on peräisin.

### Ajantasaisuus ja aikasuodatus (step_2, step_12, step_13, step_14)

21.11.2026 havaittiin, että viikkokatsaus esitti **vanhentuneita tuloskausilukuja** (13,4 % / 27,4 %)
tuoreina. Luvut tulivat pankin maanantaina 16.11. julkaistusta "Market Analysis" -katsauksesta, joka
kertoi viikosta, joka päättyi perjantaina **13.11.** - raportti ajettiin lauantaina 21.11.

**Tavilyn aikaparametrit eivät riitä.** Kokeet osoittivat, että `days: 3` palauttaa silti 5 vrk
vanhan artikkelin, sekä `time_range`-parametrin kanssa että ilman. Aikasuodatus on siksi tehty omaan
koodiin:

- `step_12` (`tools/step12_scrape.js`): tulkitsee artikkelin julkaisuajan (`date`,
  `metadata.publishedTime`, myös "5 days ago" -muoto), järjestää uusin ensin, merkitsee iän ja
  **pudottaa yli `max_age_hours` (oletus 120 h) vanhat artikkelit**. Jos pudotus tyhjentäisi koko
  listan, uusimmat pidetään kuitenkin.
- `step_13` (`tools/step13_compact.js`): sama suodatus ja ikämerkintä Tavilyn uutisille.
- `step_2`: hakulauseeseen lisättiin tuloskausiluvut
  (`... earnings season results revenue growth S&P 500 companies reported`), jotta tuoreet luvut
  löytyvät.

**Kehotteen ajantasaisuussäännöt** (`tools/txt_lauantai_system.txt`):

1. **AJANTASAISUUS - TUOREIN LUKU VOITTAA.** Käytä aina tuoreinta lukua, kerro sen ajankohta
   tekstissä ("perjantain 20.11. tilanteen mukaan") ja sano selvästi, jos tuoreempaa lukua ei ole.
2. **ALKUVIIKON KATSAUS KERTOO EDELLISESTÄ VIIKOSTA.** Maanantain "Weekly Market Recap" /
   "Market Analysis" kuvaa edellistä viikkoa, ei kulunutta.
3. **MENNYT TAPAHTUMA EI OLE TULEVA.** Lauantaina kuluneen viikon tapahtumat ovat jo toteutuneet;
   älä toista ennakkouutisen sanamuotoa.
4. Raportissa on oltava oma osio **TULOSKAUDEN TILANNE**: raportoineiden osuus, liikevaihdon ja
   tuloksen kasvu sekä odotukset ylittäneiden osuus - tuoreimmilla luvuilla, lähde ja ajankohta
   mainiten.

**Huom eri lähteistä:** tuloskausiluvut vaihtelevat lähteittäin (FactSet 31,9 % / 14,4 %,
Zacks 28,9 % / 14,6 %, U.S. Bank 27,4 % / 13,4 %). Siksi luvun lähde ja ajankohta on kerrottava.

### Eurooppa ja Suomi katsauksessa

Katsauksessa on oltava **yhtä huolellinen oma pääosio sekä Yhdysvalloille että Euroopalle ja
Helsingin pörssille**. Tämä varmistetaan kahdella tavalla:

- **Haut:** `step_3` (Tavily) hakee nimenomaan Euroopan ja Pohjoismaiden viikkoyhteenvedon
  (STOXX 600, DAX, FTSE 100, OMX Helsinki, EKP, euroalueen inflaatio) ja `step_11` (Firecrawl)
  hakee sekä globaaleja että eurooppalaisia viikkokommentteja.
- **Kehote:** `step_14`:n sääntö 3 vaatii eksplisiittisesti Euroopan ja Helsingin pörssin
  käsittelyn (indeksit, EKP ja euroalueen makroluvut, eurooppalaiset toimialat ja yhtiöt).

### Raportin eheys (katkeamistarkistus)

`step_15` (`tools/step15_finalize.js`) sisältää **katkeamistarkistuksen**: jos LLM:n HTML
katkeaa tokenirajan takia eikä sisällä `</html>`-lopputagia, työnkulku heittää virheen eikä
julkaise rikkinäistä raporttia. Tämä havaittiin tarpeelliseksi 21.11.2026, kun ensimmäinen
testiajo tuotti katkenneen raportin.

### reasoning_effort ja tokenibudjetti

`step_14` käyttää `reasoning_effort: "low"` ja `max_tokens: 32000`. Ilman matalaa
reasoning-asetusta malli kirjoitti pitkän suunnitteluosion ja itse HTML katkesi kesken
(`finish_reason: length`). Samat arvot ovat käytössä muiden raporttien LLM-askeleissa.




## Miksi tämä rakenne

Alkuperäinen ongelma: kello 6:00 ajetussa raportissa luki "Nvidian tulosjulkistus ilman Jensen Huangia on edessä", vaikka tulos oli julkaistu jo yöllä. Syy oli kaksi:

1. Hakulauseet olivat yleisiä, joten tuore tulosuutinen ei mahtunut viiden tuloksen joukkoon. Viisi paikkaa täyttyivät eilisistä ennakkojutuista.
2. Raportin kehote ei tarkistanut uutisten julkaisuaikoja, joten se toisti ennakkouutisen sanamuodon.

Korjaus koostuu kolmesta osasta:

- **Odotettujen tapahtumien seuranta.** Tekoäly valitsee tapahtumat itse, jotta valinta ei ole käyttäjän ennakkokäsitysten värittämä. Se saa kaksi löytöhakua ja palauttaa tapahtumat JSON:na. Jokaisesta haetaan erikseen tulos ja markkinareaktio.
- **Tilalogiikka.** Jokainen tapahtuma saa tilan: TOTEUTUNUT, TULOSSA tai EI VAHVISTETTU. Tila päätellään julkaisuajasta ja nykyhetkestä, ei uutisen sanamuodosta. Paljon ennakkopuhetta saanut ja jo toteutunut tapahtuma nousee raportin kärkeen.
- **Tuoreus.** Uutiset merkitään iän mukaan (TUORE alle 3 h, VANHEMPI muuten), uusin tulee ensin, ja kurssiluvut ratkaisevat markkinareaktion. Tapahtuman kurssi haetaan erikseen numeroina.

## Aamuraportti NEW: etusivujen kärkiteemat ja avausvaikutus

`Aamuraportti NEW` on erillinen työnkulku, joka jättää vanhan `Aamuraportti`-työnkulun ennalleen.
Sen tarkoitus on mitata, **mistä uutisvirta puhuu ja kuinka näkyvästi**, ja johtaa siitä arvio
siitä, miten tilanne vaikuttaa Helsingin ja Euroopan pörssiavaukseen. Vanha työnkulku vastaa
kysymykseen "mitä tapahtui", uusi lisäksi kysymykseen "kuinka moni tästä puhuu ja mitä se tarkoittaa avaukselle".

### Uudet askeleet

Ketju on sama kuin vanhassa, mutta `step_8`:n jälkeen tulee kolme uutta askelta ja `step_10`:n
jälkeen yksi uusi LLM-askel:

```
step_8    Search Helsinki & Europe (Tavily, vanha)
step_2    Front pages (RSS)                 7 etusivu-/uutissyotetta, ilmainen
step_19   Quality press front page (Tavily) WSJ, Bloomberg, Reuters, FT, CNBC, 2 krediittia
step_20   Prominence score (Code)           laskee teemojen näkyvyyden
step_11   ... (vanha ketju jatkuu)
step_10   Ask LLM (analysis & speculation)  vanha spekulaatio-osio
step_21   Ask LLM (front-page themes & opening impact)   uusi osio
step_22   Add scoring legend (Code)         liittaa pisteytyksen selityksen osion perään
step_5    Code                              liittaa uuden osion ennen spekulaatiota
```

### Pisteytyksen selitys lukijalle (step_22)

Osion perässä on pieni, yhteen taitettava selitys ("Mistä näkyvyyspisteet muodostuvat?"), joka kertoo
osien painot, täysien pisteiden rajat, sanalliset luokat ja sen, että pisteet mittaavat huomiota eikä
suuntaa. Selitys on **kiinteää tekstiä koodissa**, joten se tulee raporttiin riippumatta siitä, mitä
LLM kirjoittaa. Jos painotusta muutetaan `step_20`:ssä, myös `tools/step22_legend.js` on päivitettävä,
muuten selitys ja laskenta eroavat toisistaan: sama tieto on kahdessa paikassa.

### Miksi juuri nämä lähteet

- **WSJ:n oma RSS on kuollut.** `feeds.a.dj.com` palauttaa juttuja tammikuulta 2025, joten sitä ei voi käyttää. WSJ:n sisältö saadaan Google Newsin kautta (jutuissa on lähdeliite, esim. "… - WSJ") ja Tavilylla, joka hakee suoraan wsj.comista tuoreet jutut julkaisupäivineen.
- **CNBC:n RSS palauttaa HTTP 403** Activepiecesin palvelimilta. Siksi CNBC tulee Google Newsin kautta ja Tavilyn kautta.
- **Google News** antaa ilmaiseksi sen, mitä tarvitaan: kuinka moni eri media toistaa samaa aihetta. Google Newsin linkit ovat uudelleenohjauksia, joten niitä **ei koskaan** käytetä raportin lähteinä; ne lasketaan vain näkyvyydeksi. Klikattavat lähteet tulevat suorista osoitteista (Tavily ja julkaisijoiden omat RSS-syötteet).

### Näkyvyyspisteytys (step_20)

Jokainen otsikko ryhmitellään teemaan 13 kiinteän teeman joukosta (tekoäly, listautumiset, korot,
tulokset, öljy, kulta, tullit, Kiina, valuutat, pankit, puolustus, makro, Helsinki). Teeman pisteet
ovat 0–100 ja ne lasketaan neljästä normalisoidusta osasta:

```
pisteet = 100 × ( 0,55 × min(1, eri mediat / 12)
                + 0,20 × min(1, eri syötteet / 4)
                + 0,15 × min(1, uutiset / 20)
                + 0,10 × max(0, 1 − tuoreimman ikä tunteina / 24) )
```

Sanallinen luokka: **vahva** ≥ 60, **kohtalainen** ≥ 40, **heikko** ≥ 25, muuten vähäinen (vähäisiä ei
näytetä kärkiteemoina). Normalisointi on tarkoituksella: ilman sitä jo viisi lähdettä tuoreen uutisen
kanssa tuotti sata pistettä, jolloin suuri ja pieni teema näyttivät samalta.

Duplikaatit poistetaan otsikon kuuden ensimmäisen sanan perusteella, ja yli 30 tuntia vanhat uutiset
jätetään pois. Teemat voivat mennä päällekkäin (sama uutinen voi olla sekä tekoälyä että
listautumista), ja LLM saa ohjeen yhdistää päällekkäiset teemat yhdeksi riviksi. Suorat linkit ovat
blokissa pakollinen lähdeluettelo, jotta jokainen väite on tarkistettavissa.

Blokin kokonaispituus on rajattu noin 6 600 merkkiin, ja **linkkiosio säilytetään aina**: jos teemaosuus
on liian pitkä, `step_20` lyhentää teemaosaa, ei linkkejä. Tämä tehtiin siksi, että ensimmäisessä
versiossa pitkä teemalista söi koko budjetin ja lähdeluettelo katosi ennen kuin LLM näki sen.

Painoarvo **ei ole suunta**: se kertoo huomiosta. Suunnan ratkaisee aina kurssiluku (step_6 ja step_18).
Tämä on kirjoitettu sekä koodiin että kehotteeseen, koska muuten malli alkaisi päätellä nousua uutisten sävystä.

### Raportin uusi osio

`step_21` kirjoittaa osion "Etusivujen kärkiteemat ja niiden vaikutus pörssiavaukseen": taulukko
(teema, näkyvyys, tuoreus, välittyminen, arvio avausvaikutuksesta, mitä avauksessa pitää nähdä),
kappaleet kärkiajureista, **hinnoittelutesti** ("onko jo hinnoiteltu") ja lista siitä, mitä avauksessa
pitää nähdä, jotta tulkinta pitää. Kehote käsittelee erikseen toteutuneet tapahtumat: esimerkiksi
hinnoiteltu anti ei ole tuleva tapahtuma vaan toteutunut tieto, jonka vaikutus mitataan avauskurssista
ja verrokeista.

`step_5` liittää osion HTML:ään ennen spekulaatio-osiota ja committoi tiedoston
`data/markkina/YYYY-MM-DD-HHMM-<viikonpäivä>-aamu-new.html`. Tunniste `aamu-new` on tarkoituksella eri
kuin vanhassa työnkulussa, jotta molemmat voivat olla käytössä samaan aikaan. Kun uusi työnkulku
korvaa vanhan, vaihda `step_5`:n tiedostonimestä `-aamu-new` pois ja poista `aamu-new` `docs/app.js`:n
`CONFIG.slots`-listasta.

### Tunnetut rajoitukset

- **Lähdeluettelo ei ole vielä pakollinen itse kehotteessa.** Blokki sisältää suorat linkit ja käskyn
  näyttää ne, mutta testiajoissa malli jätti lähdeluettelon pois. Kiristetty sääntö 9 on valmiina
  tiedostossa `tools/txt_prominence_system.txt` ("osion loppuun tulee lähdeluettelo"), mutta sitä ei ole
  vielä viety Activepiecesin `step_21`-askeleeseen. Jos lähdeluettelo halutaan varmasti, joko päivitä
  kehote tai liitä lista mekaanisesti `step_5`:ssä.
- **Näkyvyys ei ole suunta.** Pisteet mittaavat huomiota; nousu ja lasku tulevat aina kurssiluvuista.
- **Google Newsin linkit ovat uudelleenohjauksia**, joten niitä ei koskaan käytetä lähteinä.

### Kustannukset ja ajoaika

Uusi työnkulku maksaa **2 Tavily-krediittiä enemmän** kuin vanha (yksi advanced-haku laatulehtiin), eli
noin 14 krediittiä ajoa kohti. RSS on ilmainen. Ajoaika kasvaa noin 15–25 sekuntia. LLM-kutsuja on yksi
enemmän.

### Rakentaminen ja tarkistus

```powershell
cd activepieces\markkina\tools

.\build4_new.ps1          # rakentaa Aamuraportti NEW.json -tiedoston vanhasta + uusista osista
.\check.ps1               # liitokset ja käyttäjäviestien osiot
node test21.mjs           # step_20:n pisteytys 12 tarkistuksella
```

Jos pisteytys ei tuota teemoja, katso Activepiecesin historiasta `step_20`-askeleen `diagnostics`
(esim. `etusivut=100, laatulehdet=10, kaytetyt=57, teemoja=9`). Jos `etusivut` on 0, RSS-syötteet eivät
latautuneet ja `topThemes` on tyhjä.


| Ajo | Krediittejä |
|---|---|
| Aamuraportti | noin 12 |
| Kello 11, 18 ja Sunnuntai | noin 10 |

Advanced-haku maksaa 2 krediittiä ja basic-haku 1 krediitin. Ilmaisessa tilauksessa on 1 000 krediittiä kuussa, joten raja tulee vastaan. Pay as you go maksaa 0,008 $ per krediitti. Tarkista laskutusasetuksista, että ylitys veloitetaan automaattisesti.

Jos kulutusta pitää pienentää, vaihda step_15–17:n `search_depth` arvosta `advanced` arvoon `basic`. Se säästää noin 170 krediittiä kuussa.

## Yhtiötiedotteet (step_2)

Kello 11:n ja kello 18:n raporteissa on `step_2` ("Code (company news)"). Se hakee Nasdaq Helsingin
yritystiedotteet, poimii merkittävät ja antaa LLM:lle valmiiksi seulotun listan. Raportti ei enää
luettele kaikkia osakkeita ja niiden kursseja, vaan kertoo enintään kolme merkittävintä tiedotetta
lyhyesti ja linkittää ne.

**Lähde:** Nasdaq Nordic CNS -rajapinta `https://api.news.eu.nasdaq.com/news/query.action` (JSONP).
Haetaan 24 tunnin ajalta enintään 4 sivua (400 tiedotetta) ja suodatetaan markkinan perusteella
Helsinki / First North Finland. Sama sisältö selattavana:
`https://www.nasdaq.com/fi/european-market-activity/news/company-news`.

**Merkittävyyden pisteytys (kynnys 6 pistettä):**

- Kategoriapainot: sisäpiiritieto +5, pääomatapahtuma ja osavuosikatsaus/tilinpäätös +4,
  yhtiötiedote ja sijoittajauutiset +1.
- Otsikkoavainsanat: tulosvaroitus ja saneeraus +6, yrityskaupat ja osingot +5, toimitusjohtaja-,
  henkilöstö- ja alaskirjausuutiset +4, ohjeistus +3, tilaukset ja investoinnit +2.
- Isot yhtiöt (Nokia, Nordea, Sampo, Kone, Neste, Fortum, UPM, Stora Enso, Wärtsilä, Metso ym.) +2.
- Ristiintarkistus: jos yhtiö näkyy Arvopaperin tai Kauppalehden etusivulla, +4.
- Kova poissulku: johdon liiketoimet, omien osakkeiden omistus, tulosjulkistamisen aikataulu,
  yhtiökokouskutsu, listalleottoesite ja substanssiarvo.
- Enintään 5 tiedotetta, joista raporttiin otetaan enintään 3. Sama yhtiö ja kategoria samana päivänä
  yhdistetään (esim. alkuperäinen tiedote ja sen korjaus).

Jos haku epäonnistuu, `companyNews` kertoo sen eikä raportti keksi tiedotteita. Testi:
`activepieces\markkina\tools\test_company_news.mjs` (kirjoittaa tuloksen `_company_news_result.json`).
Kehotteet: `txt_eurooppa_system.txt`, `txt_eurooppa_user.txt`, `txt_ilta_system.txt`,
`txt_ilta_user.txt`.

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

**Kurssilinkit.** Kello 11, Kello 18 ja Aamuraportti NEW edellyttävät, että jokainen mainittu indeksi, raaka-aine, valuutta, korko ja yksittäinen osake on klikattava linkki **myös leipätekstissä**, ei vain taulukossa. Sääntö on Kello 11:ssä ja Kello 18:ssa step_3:n kohdassa 9, Aamuraportti NEW:ssä step_3:n kohdassa 8 ja spekulaatioaskeleessa step_10 kohdassa 7. Linkki tehdään vain kurssilohkossa annetulla Yahoo Finance -osoitteella muodossa `<a href="..." target="_blank" rel="noopener noreferrer">Nimi</a>`; jos osoitetta ei ole annettu, nimi kirjoitetaan ilman linkkiä. Sivusto näyttää raportin iframessa, jonka `sandbox` sallii `allow-popups`, joten linkit avautuvat uuteen välilehteen.

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
| step_5 | Raportissa saa olla vain yksi `<section>`-lohko eikä lainkaan merkkijonoa `"role"` tai `"reasoning"`. Jos niitä on, spekulaation vastaus tuli reasoning-kenttänä ja vanha koodi sarjoitti viestin JSONiksi. |

Jos `parsed_count` on toistuvasti 0, vika on joko step_13:n kehotteessa tai vastauksen luvussa. Katso `raw_preview` ja vertaa sitä kehotteessa pyydettyyn JSON-muotoon.

## Korjatut virheet

### 20.11.2026: markkinakatsauksen leipätekstissä ei ollut linkkejä

Kello 18 -raportin markkinayhteenveto kertoi indeksit, korot, raaka-aineet ja valuutat pelkkänä tekstinä, vaikka kurssilohkossa oli niille Yahoo Finance -osoitteet. Syy: step_3:n sääntö 9 käski tehdä linkit vain markkinataulukon soluista. Kello 11:n pääraportissa linkit olivat, mutta spekulaatio-osiossa (step_10) ei ollut linkkisääntöä lainkaan, joten STOXX 600, DAX ja FTSE 100 jäivät tekstiksi. Sama taulukkokohtainen sääntö oli Aamuraportti NEW:ssa (sääntö 8), jonka Aasia- ja futuuriosioissa indeksit olivat linkittömiä.

Korjaus:

- **Kello 11 step_3 (sääntö 9)** ja **Kello 18 step_3 (sääntö 9):** linkit kaikkiin osioihin, myös korostuslaatikkoon ja leipätekstiin. Linkitä kunkin kohteen nimi osiossa ensimmäisellä maininnalla, älä keksi osoitteita.
- **Kello 11 step_10** ja **Aamuraportti NEW step_10:** uusi sääntö 7 (LINKIT); LOPETUS siirretty kohdaksi 8.
- **Aamuraportti NEW step_3 (sääntö 8):** linkit myös leipätekstiin, ei vain taulukkoon.
- Muutokset tehty sekä Activepiecesin julkaistuihin työnkulkuihin että kansion JSON-tiedostoihin ja kehotteiden tekstikopioihin `tools/txt_eurooppa_system.txt` ja `tools/txt_ilta_system.txt`.

### 19.11.2026: spekulaatio-osion tilalle tulostui JSON-raakadata

Kello 11:n raportti (143 kB) päättyi lohkoon `{"role":"assistant","content":null,"refusal":null,"reasoning":"Here's a thinking process ..."}`. Syy: OpenRouterin reasoning-malli (`deepseek/deepseek-v4.1-flash`) kirjoitti koko vastauksen `reasoning`-kenttään ja jätti `content`-kentän `null`iksi, koska `reasoning_effort: high` ja `max_tokens: 20000` kuluivat pohdintaan. `step_5`:n `pickText` ei löytänyt sisältöä, joten se sarjoitti koko viestiobjektin JSONiksi ja liitti sen raporttiin. Lopun "viimeinen `>`"-siistintä katkaisi JSONin kesken.

Korjaus:

- **step_10:** `reasoning_effort` `high` → `low` ja `max_tokens` 20 000 → 32 000 (samat arvot kuin step_3:ssa, joka toimi).
- **step_5:** `content`-kenttä otetaan vain, jos se on oikeasti tekstiä. Muuten viimeinen ehjä `<section>…</section>` poimitaan `reasoning`-kentästä. Viestiobjekteja ei enää koskaan sarjoiteta JSONiksi, raaka JSON hylätään ja lopullinen osio validoidaan (alkaa `<`-merkillä, päättyy `>`-merkkiin, enintään yksi section).
- **Testi:** `activepieces\markkina\tools\test5_eurooppa.mjs` (14/14) kattaa `content = null`-, `choices`-, JSON-merkkijono- ja katkennut-HTML-tapaukset.
- **Jo julkaistu raportti korjattu:** `data/markkina/2026-11-19-1100-euroopan-avaus.html` (143 kB → 26,5 kB) sisältää nyt oikean spekulaatio-osion ilman JSON-roskia.

Vastaava riski on kaikissa reasoning-malleissa: pidä `reasoning_effort` matalana ja tokenibudjetti riittävänä, ja tarkista ajon jälkeen, ettei raportissa ole merkkijonoa `"role"`.

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

