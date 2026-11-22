# Progress Log

## 2026-11-22 – "Puola puhuu" uudelleen dynaamiseksi (Media-kansio)
**Done:**
- Käyttäjän havainto: Media-kansion Puola puhuu oli väärin rakennettu – aiheet kovakoodattu, vaikka
  niiden pitäisi syntyä dynaamisesti puolankielisistä lähteistä kuukauden ajalta. Tehtiin suunnitelma
  ja toteutus.
- **Löydös:** käytössä ollut flow `ULRjuv9GtUDQ7Y5OKjM2q` oli juuressa (Uncategorized), ei Media-
  kansiossa; Media-kansiossa oli vanha `Puola puhuu (VANHA - ei ajossa)` (`Hzyd1EzsgqnwkPf1bhQsW`).
- **Uusi työnkulku `Puola puhuu` (`c0MqQI410YdGCyHrJvB8v`)** Media-kansioon, 19 askelta, julkaistu
  ja ENABLED (1. päivä klo 08:00 Europe/Helsinki):
  kartoitus (uutisportaalit + mielipide-/talousmedia + Wykop/Reddit) → `step_7` Gemini 2.5 Flash
  tunnistaa 5–7 teemaa ja 3 puolankielistä täsmähakua JSONina → `step_9`–`step_13` täsmähaut,
  Tavily Extract ja Firecrawl-keskustelut → `step_14` yhdistää ja pudottaa yli 32 vrk vanhat →
  `step_15` laadunvartija → `step_16` Claude Sonnet 4.6 kirjoittaa Markdownin dynaamisilla
  otsikoilla → `step_17` HTML + Base64 → `step_18` GitHub.
- **AI-mallit:** poimija `google/gemini-2.5-flash` (varalla `deepseek/deepseek-v4.1-flash`);
  kirjoittaja `anthropic/claude-sonnet-4.6` (OpenRouter-fallbackit `google/gemini-2.5-pro`,
  `openai/gpt-4.1`). Perustelut: nopea ja halpa JSON-poiminta + paras suomen kieli; 1×/kk-ajo
  tekee laatuluokasta edullisen.
- **Kehote kieltää vanhat vakio-otsikot** ja vaatii yhden `##`-osion jokaiselle aineistosta
  nousevalle teemalle. Pudota teema ilman katetta, lisää aineiston paljastama teema.
- **Kansiosiivous:** vanha `ULRjuv9GtUDQ7Y5OKjM2q` → `Puola puhuu (VANHA 22.11 - ei ajossa)` +
  DISABLED; `Hzyd1EzsgqnwkPf1bhQsW` siirretty pois Media-kansiosta. Media-kansiossa yksi Puola-flow.
- **Uudet tiedostot:** `activepieces/media/Puola-puhuu-OHJEET.md`,
  `tools/puola_step6_discovery.js`, `puola_step8_queries.js`, `puola_step14_compact.js`,
  `puola_step15_guard.js`, `puola_step17_markdown.js`, `puola_topic_extractor_system.txt` /
  `_user.txt`, `puola_writer_system.txt` / `_user.txt`, `test_puola_dynamic.mjs`.
  `Saksa-Ranska-Ruotsi-Viro-OHJEET.md` sai huomautuksen Puolan uudesta mallista.

**Verifiointi:**
- `ap_validate_flow` 19/19; `ap_validate_flow({ folderName: "Media" })` 11 flowta, yhteydet kunnossa.
- Testiajo `WSx4D8SqbwTTpWi4fbyZU` SUCCEEDED 223,4 s → `data/media/2026-11-22-1750-puola-puhuu.html`
  (22 671 B, 14 lähdettä, 14 895 merkkiä tekstiä). Dynaamiset otsikot: Trybunał Konstytucyjny
  -kriisi, ulkomaalaisiin kohdistuva väkivalta, Andziaks-mikrovero, Kornelia Wieczorek -kohu,
  Puolan talous 2030. 0 `[object Object]`, 0 `reasoning`, 0 `<script>`, päättyy `</html>`.
- Yksikkötesti `node activepieces/media/tools/test_puola_dynamic.mjs` **29/29 OK**.
- `node tests/make-manifests.mjs` → media 15 raporttia (uusi raportti haettu repoon ja listattu).

**Next:**
- Seuraa 1.12.2026 klo 08:00 automaattiajoa ja tarkista, että teemat ovat jälleen datasta eivätkä
  toista marraskuun aiheita.
- Jos Wykop/Reddit-aineisto jää usein ohueksi, harkitse `step_5`/`step_13` kyselyjen laajentamista
  tai toista keskustelulähdettä.
- Harkitse saman dynaamisen mallin soveltamista muihin "…puhuu"-katsauksiin (esim. Kiina, Brasilia),
  joissa kiinteät teemat rajaavat kuukauden todellisia aiheita.


## 2026-11-21 – Viikkokatsauksen ajantasaisuus: tuloskausiluvut ja aikasuodatus
**Done:**
- Käyttäjä huomasi, että viikkokatsauksen tuloskausiluvut olivat vanhentuneita (13,4 % / 27,4 % /
  91 %). Tuorein tieto oli liikevaihdon osalta 14,4 % ja tuloksen 31,9 %.
- Juurisyy jäljitettiin Activepiecesin ajolokiin asti: luvut tulivat **U.S. Bankin 16.11.**
  julkaistusta katsauksesta, joka kertoi viikosta, joka päättyi **13.11.**
- **Hakukokeet osoittivat**, että Tavilyn `days`-parametri ei rajaa hakua (5 vrk vanha artikkeli
  tuli läpi sekä `time_range`-parametrin kanssa että ilman). Aikasuodatus tehtiin siksi omaan
  koodiin.
- `step12_scrape.js` ja `step13_compact.js`: julkaisuajan tulkinta, uusin ensin -järjestys,
  ikämerkinnät ja yli 120 h vanhojen artikkelien pudotus (varalla uusimmat, jos lista muuten tyhjenisi).
- `step_14`-kehotteeseen kolme uutta pakollista sääntöä: AJANTASAISUUS (tuorein luku voittaa ja
  luvun ajankohta kerrotaan), ALKUVIIKON KATSAUS KERTOO EDELLISESTÄ VIIKOSTA ja MENNYT TAPAHTUMA
  EI OLE TULEVA. Lisäksi uusi pakollinen osio TULOSKAUDEN TILANNE.
- `step_2`: hakulauseeseen lisättiin tuloskausiluvut, jotta tuoreet luvut löytyvät.
- Uudet tiedostot: `tools/txt_lauantai_system.txt`, `tools/txt_lauantai_user.txt`,
  `tools/sync_lauantai.ps1` (pitää Lauantai.json-peilin ajan tasalla).
- Vanhat virheelliset raportit `2026-11-21-1250-viikkokatsaus.html` ja `2026-11-21-1408-viikkokatsaus.html`
  poistettu GitHubista.

**Verifiointi:** testiajo SUCCEEDED 68,9 s → `data/markkina/2026-11-21-1412-viikkokatsaus.html`
("Tuloskauden tilanne" -osio, oikeat otsikot Nvidian tuloksesta ja Anthropicin listautumisesta,
ei vanhoja lukuja). `test_lauantai.mjs` 55/55 OK, `check.ps1` kunnossa, työnkulku julkaistu.

**Next:**
- Seuraa seuraavaa lauantain ajoa: tarkista että tuloskausiosio tulee joka kerta ja että luvut ovat
  viikon lopulta.
- Harkitse saman aikasuodatuksen ja ajantasaisuussääntöjen viemistä myös Sunnuntai-työnkulkuun
  (viikkoennakossa sama riski: alkuviikon katsaus kertoo edellisestä viikosta).

## 2026-11-21 – Korjattu: sivun uudelleenlataus kaatoi raporttilistan (date.getTime)
**Done:**
- Käyttäjä raportoi: raporttia katsoessa selaimen "Lataa tämä sivu uudelleen" tuotti virheen
  `date.getTime is not a function` ja ilmoituksen "Raporttilistaa ei voitu hakea".
- Juurisyy: `docs/app.js`:n `saveToCache`/`listFromCache` käyttävät `sessionStorage`-välimuistia,
  jossa `JSON.stringify` muuttaa `report.date`-olion merkkijonoksi eikä `JSON.parse` palauta
  tyyppiä. `sessionStorage` säilyy uudelleenlatauksen yli, joten `formatDateLong` teki
  `date.getTime()` merkkijonolle ja heitti `TypeError`in, joka päätyi `selectFeed`-ketjun
  `.catch`-haaraan.
- "Päivitä lista" -nappi ei kaatunut, koska `refresh()` käyttää `force: true` ja ohittaa
  välimuistin.
- Korjaus: (1) `listFromCache` palauttaa `report.date`-kentät `Date`-olioina,
  (2) `formatDateLong` sietää sekä `Date`-olion että merkkijonon.
- Testi: `tests/site-check.mjs` sai välimuistipolun testin (hakee listan toisen kerran
  peräkkäin kuten selaimen reload). Testi kaatui ennen korjausta samaan virheeseen ja menee
  läpi korjauksen jälkeen: **34/34 OK**.

**Next:**
- Tarkista selaimessa (Live Server) että uudelleenlataus toimii myös oikealla sivulla.

## 2026-11-21 – Sivuston paikallispolku, manifestit ja Lauantain renderResults
**Done:**
- Selvitettiin `tests/site-check.mjs`:n kaatuminen git-historiasta: commit `5266142` (18.11.)
  poisti `../`-etuliitteen `docs/app.js`:n paikallisista poluista, kopioi `data/`-kansion `docs/`
  alle ja korvasi dynaamisen valikon yksinkertaisella napilla – mutta testiä ei päivitetty.
- `docs/app.js`: `fetchLocalManifest` ja `reportSourceUrl` lukevat taas juuren `data/`-kansiota
  (`../data/...`); tuotanto käyttää edelleen GitHubin `download_url`-osoitetta. Lisäksi
  `CONFIG.slots` ja `markkina`-syötteen slots saivat `viikkokatsaus` (📅) ja `viikkoennakko` (🔮).
- `tests/site-check.mjs` päivitetty nykyiseen valikkorakenteeseen: **27/27 OK** (aiemmin 4 FAIL
  ja kaatuminen).
- **Uusi `tests/make-manifests.mjs`** pitää `data/<syöte>/index.json`-manifestit ajan tasalla
  (markkina 26, media 13 raporttia). Aiemmin media-manifesti listasi 6 tiedostoa 13:sta.
- **Lauantain `renderResults`-korjaus** (sama kuin Sunnuntaissa): `tools/step13_compact.js`,
  `Lauantai.json`-peili, Activepieces-työnkulku ja julkaisu. Uusi
  `tests/test_step13_compact.mjs` testaa molempien työnkulkujen tiivistyskoodin (22/22 OK) ja
  `test_lauantai.mjs` sai oman tarkistuksen (46/46 OK). `ap_test_step step_13` SUCCEEDED.
- **`build5_lauantai.ps1` sai vartion:** se lukee lähdetiedostonaan `Sunnuntai.json`:ia, joka
  korvattiin uudella 17 askeleen versiolla, joten skripti olisi tuottanut hiljaa väärän tuloksen.
  Nyt se heittää selkeän virheen. Uudelleennumerointia ei enää tarvita.
- `docs/data/` (15 tiedostoa: 13 vanhaa näyteraporttia + 2 manifestia) todettiin käyttämättömäksi
  jäänteeksi ja **poistettiin käyttäjän pyynnöstä**. Kohde varmistettiin tarkalla polulla, ja
  kaikki tiedostot olivat git-seurattuja, joten ne löytyvät historiasta. `docs/` sisältää nyt vain
  sivuston omat tiedostot. Savutesti edelleen 27/27.
- Dokumentaatio päivitetty: `README.md` (paikallinen testaus, manifestit, docs/data-huomio,
  testikomennot), `activepieces/Raporttien-ohje.md` (build5-vanhennusilmoitus, renderResults).

**Verifiointi:** `site-check.mjs` 27/27 · `test_sunnuntai.mjs` 75/75 · `test_lauantai.mjs` 46/46 ·
`test_step13_compact.mjs` 22/22 · `check.ps1` kunnossa · Lauantai julkaistu uudelleen.

**Next:**
- Harkitse `build5_lauantai.ps1`:n täyttä uudelleenkirjoitusta: "päivitä Lauantai.json
  `tools/`-kansion tiedostoista" (vaatii Lauantain kehotteiden tallentamisen txt-tiedostoihin).
- Seuraa ensimmäistä oikeaa sunnuntaiajoa klo 08:00.

## 2026-11-21 – Sunnuntai-viikkoennakko (eteenpäin katsova spekulaatioraportti)
**Done:**
- Rakennettu Activepieces-työnkulku **Sunnuntai** (`yltf57XbPcRVIzKKBziRh`): eteenpäin katsova
  viikkoennakko, joka kertoo mitä alkavalla viikolla tapahtuu, mitä markkina odottaa ja millaisia
  skenaarioita viikosta voi rakentaa. Ajo sunnuntaisin klo 08:00, julkaistu ja ENABLED.
- Toteutus **kloonaamalla toimiva Lauantai-työnkulku** (`ap_duplicate_flow`), jolloin kaikki
  17 askelta, koodiaskeleet ja yhteydet (Tavily, OpenRouter, GitHub, Firecrawl) säilyivät.
  Sen jälkeen muutettiin vain sisältö: haut, poimija, tiivistys, kehotteet ja tallennuspolku.
- Raportin uusi rakenne: kärjessä "Alkavan viikon tärkein ajuri ja maanantain avaus", sitten
  talouskalenteri, tuloskausi, USA, Eurooppa ja Helsinki, lähtötilanne-taulukko sekä **pakollinen
  spekulaatio-osio** (kolme skenaariota, yllätyskortti, seurattavat kohteet) ja Lähteet.
- Uudet tiedostot: `tools/build6_sunnuntai.ps1`, `tools/txt_sunnuntai_*.txt` (4 kpl),
  `tools/step13_compact_sunnuntai.js`, `tools/step14_sunnuntai.js`,
  `tools/step17_startpoint_quotes.js`, `tools/test_sunnuntai.mjs`,
  `tools/test_step13_sunnuntai.mjs`, `prompts/markkina/viikkoennakko.md`.
- **Korjattu bugi 1 (menneet päivät):** ensimmäinen testiajo esitti keskiviikon 18.11. tulevan
  viikon kalenterissa. Kehotteeseen lisättiin sääntö alkavan viikon rajauksesta ja
  päivämäärätarkistuksesta; korjauksen jälkeen kalenterissa oli vain 23.–27.11. tapahtumat.
- **Korjattu bugi 2 (`[object Object]`, periytyi Lauantaista):** tiivistys liitti tapahtumahakujen
  tulokset tekstiin suoralla liitoksella. Uusi `renderResults` purkaa listat ja JSON-merkkijonot
  luettaviksi riveiksi. Sama bugi on yhä Lauantaissa (harmiton, korjattavissa samalla koodilla).
- **Korjattu bugi 3 (PowerShell 5.1 + BOM):** ilman UTF-8-BOM:ia `build6_sunnuntai.ps1` luki
  ääkköset väärin, jolloin `Lisätty` ja `NÄKYMÄ` vääristyivät tiedostoon.
- `check.ps1` päivitetty hyväksymään sekä "ODOTETUT TAPAHTUMAT (seurantalista" että
  "ALKAVAN VIIKON TAPAHTUMAT (seurantalista".
- Dokumentaatio: `Raporttien-ohje.md` sai luvun "Sunnuntai (viikkoennakko)", README päivitettiin
  (slugit, testikomennot) ja `prompts/markkina/viikkoennakko.md` luotiin.

**Verifiointi:** testiajo SUCCEEDED 148,3 s → `data/markkina/2026-11-21-1313-viikkoennakko.html`
(35,1 kB, 49 Yahoo-linkkiä, Lähteet-osio, spekulaatio-laatikko, ei roskaa). `test_sunnuntai.mjs`
75/75 OK, `test_step13_sunnuntai.mjs` 11/11 OK, `test_lauantai.mjs` 45/45 OK, `check.ps1` kunnossa.

**Next:**
- Seuraa ensimmäistä oikeaa sunnuntaiajoa klo 08:00 ja tarkista
  `data/markkina/...-viikkoennakko.html`.
- Harkitse saman `renderResults`-korjauksen viemistä myös Lauantain `step13_compact.js`:ään.
- Jos kalenteri joskus vielä näyttää menneitä päiviä, tiukenna sääntöä 6 tai rajaa `step_5`:n
  hakua lyhyempään aikaikkunaan.

## 2026-11-21 – Lauantai-viikkokatsaus ja ilmainen webscraper (Firecrawl)
**Done:**
- Rakennettu uusi Activepieces-työnkulku **Lauantai** (viikkokatsaus): kerää kuluneen viikon
  merkittävimmät markkinatapahtumat ja markkinoihin vaikuttaneet asiat, ajo lauantaisin klo 09:00.
- Webscraperiksi valittu **Firecrawl** (ilmainen taso: 1 000 krediittiä/kk, 1 sivu = 1 krediitti).
  Uusi askel `step_19` (`search_web`, `includePageContent: true`) hakee viikon artikkelien
  kokotekstit markdownina; `step_20` (Code) siistii tuloksen LLM:lle.
- Firecrawl-kulutusarvio: n. 5–6 krediittiä/viikko eli alle 30 krediittiä kuukaudessa.
- `step_19` ja `step_20` asetettu `continueOnFailure = true`: jos scraper ei vastaa, raportti
  syntyy silti Tavily-hakujen pohjalta.
- Tiedostot: `activepieces/markkina/Lauantai.json` (rakennettu `tools/build5_lauantai.ps1`:llä
  `Sunnuntai.json`-pohjasta), `tools/step21_scrape.js`, `tools/test_lauantai.mjs`,
  `prompts/markkina/viikkokatsaus.md`.
- Kehotteet muutettu: "sunnuntain viikkoennakko" -> "lauantain viikkokatsaus", kärkilaatikko
  "Viikon tärkein markkina-ajuri", uusi osio "VIIKON ARTIKKELIEN KOKOTEKSTIT".
- Tallennus: `data/markkina/YYYY-MM-DD-HHMM-viikkokatsaus.html`.
- Päivitetty `activepieces/Raporttien-ohje.md` (uusi luku "Lauantai (viikkokatsaus)" ja
  Firecrawl-osio), `README.md` ja `tools/check.ps1`.

**Verification:**
- `node test_lauantai.mjs` 28/28 OK.
- `check.ps1` kaikki liitokset kunnossa (myös Lauantai.json).
- Build-skripti kirjoittaa tiedoston UTF-8 BOM -koodauksella.

**Next:**
- Työnkulku on julkaistu ja ENABLED (flowId `wuTvMpZibKnuSvwGv0Ex6`). Seuraa ensimmäistä
  lauantaiajoa klo 09:00 ja tarkista `data/markkina/...-viikkokatsaus.html`.
- Firecrawl pysyy vain Lauantaissa (ei arkiraporteissa): krediittiraja ja arkiraporteilla on jo
  RSS, Nasdaq Nordic -tiedotteet ja Yahoo-kurssit. Katso perustelut `activeContext.md`:stä.
- Viikkoluvut (step_17) ja Eurooppa-osio ovat nyt pakollisia; tarkista seuraavasta ajosta,
  että taulukko ja värit säilyvät ja että uutisten päivälukuja ei esitetä viikon lukuna.
- Linkit ja lähteet (step_13_compact.js + kehotteen sääntö): tarkista, että indeksit ovat linkkejä
  myös leipätekstissä ja että "Lähteet"-osio syntyy joka ajossa.

**Korjattu (ennalta olemassa oleva este):** vientiskripti `activepieces/tools/import-to-activepieces.ps1`
kaatui tiedostoon `media/Polish-Media-Monitoring.json` (tyhjä `flows`), ja kaksi mediakansion
luonnosta jakoi `externalId`:n `markkina/Aamuraportti.json`:n kanssa. Skripti ohittaa nyt
varoituksella tiedostot, joilta puuttuu displayName tai joiden externalId on jo käytössä, ja
käsittelee `markkina`-kansion ensin. `-Offline` läpäisee (6 työnkulkua, Lauantai mukana).

## 2026-11-13 – Planning Session
**Done:**
- Decided on architecture: Activepieces + OpenRouter + GitHub Pages.
- Drafted three report prompts (morning, Europe open, midday).
- Chose automatic commit strategy (Activepieces GitHub integration preferred).
- Defined frontend approach (GitHub Contents API + iframe rendering).
- Created Memory Bank files (projectbrief, activeContext, systemPatterns, techContext, progress).

## 2026-11-14 – Frontend Scaffold and Example Data
**Done:**
- Created three realistic standalone Finnish example reports in `data/` (06:00, 10:00, 12:00 on 2026-11-13), each with its own distinct styling to prove iframe isolation.
- Created `docs/index.html`: semantic layout with sidebar, report list, responsive iframe viewer, placeholder/error states, print and open-in-new-tab actions, skip link.
- Created `docs/style.css`: mobile-first, sidebar becomes a slide-in panel under 900 px, dark mode via `prefers-color-scheme`, print styles. Braces verified balanced (72/72).
- Created `docs/app.js`: CONFIG block, filename regex parsing, descending sort, day grouping (Tänään/Eilen/date), GitHub Contents API listing with sessionStorage cache, localhost fallback to `data/index.json`, sandboxed `srcdoc` rendering, hash-based deep links, error handling, Finnish date formatting via `Intl` with `Europe/Helsinki`.
- Created `data/index.json` as a local-development filename manifest.
- Settled the open questions: file naming convention (`YYYY-MM-DD-HHMM-slug.html`) and rendering method (`iframe srcdoc`).
- Updated `activeContext.md` and `systemPatterns.md` to match the implemented design.

**Verification:**
- `node --check docs/app.js` passes.
- 20/20 unit checks pass (filename parsing, invalid-name rejection, sorting, day labels, slot labels, and the structure of the three example reports).
- 20/20 end-to-end checks pass against a local static server (all assets and reports served with HTTP 200, list parsing, newest-first order, and the `srcdoc` transformation).
- `srcdoc` transformation bug found and fixed: `lang="fi"` was added twice to reports that already declared `lang`; the attribute is now only added when missing.
- All 12 element IDs referenced by `app.js` exist in `index.html`; CSS braces balanced (72/72).

**Next:**
- `git init` + create and push the public GitHub repository.
- Enable GitHub Pages (branch `main`, folder `/docs`) and verify the live site.
- Build the first Activepieces workflow (morning report) and run a test commit.
## 2026-11-14 – Repository Published and GitHub Pages Enabled
**Done:**
- Verified and completed the git setup: branch `main`, all project files staged, first commit created as `c9fa1a0` (15 files, 1432 insertions).
- Added `.gitignore` (OS/editor junk, `tmp-*` scratch files, secret patterns).
- Ran a secret scan on the staged content with `git grep` – no API keys or tokens found.
- Set a **repository-local** git identity `Jarno1965 <124132330+Jarno1965@users.noreply.github.com>`, because the global config contained the placeholder `you@example.com`.
- Pushed to https://github.com/Jarno1965/MarkkinaTilanne (public, `main`, upstream tracked). The commit message was amended to proper Finnish UTF-8 and force-pushed with `--force-with-lease` while the repo was still brand new.
- Enabled GitHub Pages: source branch `main`, folder `/docs`. Live: https://jarno1965.github.io/MarkkinaTilanne/
- Verified the production assumptions: the Pages site, `style.css` and `app.js` all return HTTP 200; the public Contents API lists `data/` with `download_url` values; raw report URLs return `text/plain; charset=utf-8` with `access-control-allow-origin: *`; the Pages site returns 404 for `/data/...`, exactly as the architecture expects.

**Next:**
- Build the Activepieces workflow for the 06:00 morning report and run a test commit.
- Create `prompts/` and move the three prompts there.

## 2026-11-18 – Projektien yhdistäminen viimeistelty
**Done:**
- Yhdistettiin Activepieces-projekti (`ActivePieces/.build`) ja markkinasivusto yhteen repositorioon `MarkkinaTilanne`. Työnkulut ovat nyt kansiossa `activepieces/markkina/`, apuskriptit `activepieces/markkina/tools/` ja yhteinen vientiskripti `activepieces/tools/`.
- `activepieces/Raporttien-ohje.md` päivitettiin uuteen rakenteeseen: poistettiin vanhat `.build`-, `c:\Omia ohjelmia\ActivePieces`- ja `.bak`-viittaukset, yhdistettiin kaksi päällekkäistä johdantoa, ja kaikki skriptipolut ovat nyt suhteessa repositorion juureen (`activepieces\markkina\tools\...`, `activepieces\tools\import-to-activepieces.ps1`).
- Poistettiin juuresta kaksoiskappale `Raporttien-ohje.md` ja kertakäyttöiset `tmp-fix-ohje*`-skriptit. `tmp-check.mjs` siirrettiin nimellä `tests/site-check.mjs` (README viittaa siihen).
- `build2.ps1` ei enää luo `.bak`-varmuuskopioita (git hoitaa versionhallinnan).
- README:n vientiohje korjattiin: `import-to-activepieces.ps1` ajetaan kansiosta `activepieces\tools`.

**Verification:** `node tests/site-check.mjs` 20/20, `node --check docs/app.js`, `check.ps1` "Kaikki liitokset kunnossa", `test14.mjs` kaikki OK, `import-to-activepieces.ps1 -Offline` löytää 4 työnkulkua, `tests/parse-check.ps1` ei jäsennysvirheitä.

**Next / avoimet asiat:**
- Muutokset ovat vielä committoimatta (git status näyttää poistetut vanhat `data/*.html`, uuden `data/markkina/`, `activepieces/`, `docs/feeds.json`, `README.md`, `tests/`).
- Activepieces-työnkulkujen JSON:t on viety instanssiin vasta, kun `import-to-activepieces.ps1 -Apply` on ajettu.
- `prompts/` puuttuu yhä.

## 2026-11-18 – Polish mediakatsaus viikkokatsaus luotu

**Done:**
- Luotu toimiva Polish viikkokatsaus -työnkulku
- Kaikki komponentit testattu ja toimivat
- Sivusto päivitetty ja testit läpäisty
## 2026-11-18 – Polish mediakatsaus viikkokatsaus luotu

**Done:**
- Luotu toimiva Polish viikkokatsaus -työnkulku
- Kaikki komponentit testattu ja toimivat
- Sivusto päivitetty ja testit läpäisty

### Tehdyt muutokset

#### 1. Polish mediakatsaus -työnkulun luonti
- **Tiedosto**: `activepieces/media/Puola viikkokatsaus.json`
- **Ajastus**: Maanantaisin klo 08:00
- **Rakenne**: Perustuu olemassa olevaan Sunnuntai-työnkulkuun

#### 2. Koodikomponentit
Luotu kolme erillistä JavaScript-moduulia `activepieces/media/tools/`-kansioon:

1. **`parse_trends.js`** - Google Trends RSS:n jäsentäminen
2. **`process_articles.js`** - Artikkeleiden käsittely ja suodatus
3. **`extract_json.js`** - LLM-vastauksen JSON:n purkaminen (perustuu step14.js:ään)

#### 3. Build-skripti
- **`build-pl.ps1`** - Luo ja päivittää työnkulun automaattisesti
- Kloonaa olemassa olevan Sunnuntai-työnkulun pohjalta
- Päivittää kaikki hakukyselyt Polish markkinoille
- Asettaa oikean ajastuksen (maanantai 08:00)

#### 4. Testaus
### Tärkeimmät ominaisuudet

#### Työnkulku
- Weekly trigger (maanantai 08:00)
- Polish market trend analysis
## 2026-11-18 – Korjattu: Polish mediakatsaus viikkokatsaus (media focus)

**Done:**
- Korjattu toteutus fokusoida "mitä puolalaiset mediat kirjoittavat" eikä "Puolan markkinakatsaus"
- Luotu uudet koodikomponentit mediakontekstiin
- Kaikki komponentit testattu ja toimivat
- Sivusto päivitetty ja testit läpäisty
### Tehdyt muutokset

#### 1. Polish mediakatsaus -työnkulun korjaus
- **Tiedosto**: `activepieces/media-pl.json`
- **Ajastus**: Maanantaisin klo 08:00
- **Fokus**: Mitä puolalaiset mediat kirjoittavat Puolassa

#### 2. Uudet koodikomponentit
Luotu kolme erillistä JavaScript-moduulia `activepieces/media/tools/`-kansioon:

1. **`parse_polish_media.js`** - Puolalaisten medioiden RSS-syötteiden jäsentäminen
2. **`translate_to_finnish.js`** - Artikkeleiden kääntäminen suomeksi
3. **`summarize_polish_media.js`** - Käännettyjen artikkeleiden tiivistäminen

#### 3. Build-skripti
- **`build-media-pl.ps1`** - Luo ja päivittää mediakatsaus-työnkulun
- Kloonaa olemassa olevan Sunnuntai-työnkulun pohjalta
- Päivittää kaikki hakukyselyt puolalaisten medioiden seuraamiseen
### Tärkeimmät ominaisuudet

#### Työnkulku
- Weekly trigger (maanantai 08:00)
- Puolalaisten medioiden seuranta ja analyysi
- Tavily-haut puolalaisiin medioihin
- Käännös suomeksi ja tiivistelmä
- Automaattinen GitHub commit `data/media-pl/`-kansioon

#### Koodikomponentit
- **Modulaariset .js-tiedostot** (ei inline-koodia)
- **Testattavat erikseen** (node test-media.mjs)
- **Fokus: Mediakonteksti** ei markkinakonteksti

#### Nimeäminen
- Tiedosto: `YYYY-MM-DD-0800-viikkokatsaus.html`
- Polku: `data/media-pl/`

### Seuraavat askeleet
1. ✅ **Manuaalinen ajo** - Käynnistä työnkulku kerran käsin varmistaaksesi toiminnan
2. ✅ **Activepieces -deploy** - Vie työnkulku Activepiecesiin `import-to-activepieces.ps1` -skriptillä
3. Monitoroi ensimmäistä automaattista ajokertaa

### Tekninen yhteensopivuus
- ✅ Kaikki piece-versiot oikein
- ✅ Tavily API -kutsut validoidut
- ✅ GitHub commit -konfiguraatio oikein
- ✅ Sivuston syöteregisteri päivitetty
- ✅ Kaikki testit läpäisevät

### Huomiot
- Korjattu fokus: "mitä puolalaiset mediat kirjoittavat" vs "Puolan markkinat"
- Hakukyselyt spesifiset puolalaisten medioiden seurantaan
- Käännös suomeksi keskeinen osa prosessia
- Asettaa oikean ajastuksen (maanantai 08:00)

#### 4. Testaus
- **`test-media.mjs`** - Testaa kaikki kolme uutta koodikomponenttia
- Kaikki testit läpäisevät

#### 5. Syöteregisteri
- **`docs/feeds.json`** - Jo sisältää Polish viikkokatsaus -syötteen
- Sisältää oikean slot-määrityksen viikkokatsaukselle
- Tavily-haut viikottaisille uutisille
- LLM-pohjainen raportin generointi
- Automaattinen GitHub commit `data/media-pl/`-kansioon

#### Koodikomponentit
- **Modulaariset .js-tiedostot** (ei inline-koodia)
- **Testattavat erikseen** (node test-parse.mjs)
- **Perustuu olemassa oleviin malleihin** (step14.js)

#### Nimeäminen
- Tiedosto: `YYYY-MM-DD-0800-viikkokatsaus.html`
- Polku: `data/media-pl/`

### Seuraavat askeleet
1. ✅ **Manuaalinen ajo** - Käynnistä työnkulku kerran käsin varmistaaksesi toiminnan
2. ✅ **Activepieces -deploy** - Vie työnkulku Activepiecesiin `import-to-activepieces.ps1` -skriptillä
3. Monitoroi ensimmäistä automaattista ajokertaa

### Tekninen yhteensopivuus
- ✅ Kaikki piece-versiot oikein
- ✅ Tavily API -kutsut validoidut
- ✅ GitHub commit -konfiguraatio oikein
- ✅ Sivuston syöteregisteri päivitetty
- ✅ Kaikki testit läpäisevät

### Huomiot
- Polish market queries ovat nyt oikein (korvattu aiemmat "market" queries)
- Time_range asetettu viikoksi, days-parametri poistettu duplikaattien välttämiseksi
- Kaikki hakukyselyt spesifiset Polish markkinoille
- **`test-parse.mjs`** - Testaa kaikki kolme koodikomponenttia
- Kaikki testit läpäisevät

#### 5. Syöteregisteri
- **`docs/feeds.json`** - Päivitetty sisältämään Polish viikkokatsaus -syötteen
- Sisältää oikean slot-määrityksen viikkokatsaukselle


## 2026-11-18 – Activepieces MCP Connection & "Puola puhuu" Flow Built in Media Folder
**Done:**
- Configured Activepieces Cloud MCP server (`https://cloud.activepieces.com/mcp`, `streamableHttp`, timeout 180s) in Cline (`cline_mcp_settings.json`).
- Built the **"Puola puhuu"** flow (`Hzyd1EzsgqnwkPf1bhQsW`) directly in the **`Media`** folder (`BQoUk5xxI9N7FWMQxkW7d`) via Activepieces MCP:
  - **Trigger:** Weekly schedule (Monday 08:00 `Europe/Helsinki`).
  - **Step 1 & 2 (Date Helper):** Current date/time (`Europe/Helsinki`) + `- 14 day` formatted as `YYYY-MM-DD`.
  - **Step 3 (Tavily Custom API Call `POST /search`):** Polish everyday/social/economic/political/family topics with `topic: "news"`, `search_depth: "advanced"`, `language: "pl"`, `filter_by_language: true`, `start_date`, `include_published_date: true`, `filter_by_published_date: true`, and `exclude_domains: ["google.com", "youtube.com"]`.
  - **Step 4 (OpenRouter `deepseek/deepseek-v4.1-flash`):** Verifies Polish language and 14-day publication window, translates key findings into clear Finnish HTML5, and lists all used sources with original title, Finnish title translation, publication date, and clickable URL.
  - **Step 5 & 6 (Code + GitHub Custom API Call):** Cleans HTML, adds creation timestamp banner, Base64-encodes, and commits to `data/media/YYYY-MM-DD-HHMM-puola-puhuu.html` with commit message `"Puola puhuu"`.
- Tested flow execution with sample trigger data (`gA7LQkR6F5SAm7VqAlWMG` SUCCEEDED), validated folder (`ap_validate_flow`), and published/enabled the flow (`ap_lock_and_publish`).

## 2026-11-18 – "Venäjä puhuu" Flow Built in Media Folder
**Done:**
- Cloned the "Puola puhuu" architecture via Activepieces MCP into a new flow **"Venäjä puhuu"** (`c7CM8wDdl4ij1MME4Z7Aj`) in the `Media` folder: weekly Monday 09:00 `Europe/Helsinki`, Date Helper (-14 d), five Tavily searches, one OpenRouter call, one Code step, one GitHub commit.
- Search design (all Russian-language, `filter_by_language`, `advanced`, 15 results):
  - `step_3` Russia mainstream news; `step_4` Russia independent/exile outlets by name in the query.
  - `step_5` Belarus local news; `step_9` Belarus independent/opposition outlets by name; `step_10` Belarus independent outlets with `topic: "general"` + `include_domains`.
- Diagnosed Tavily behaviour with direct `ap_run_action` probes before finalising: `include_domains` + `topic: "news"` → 0 results for these outlets; outlet names in the query → works; `topic: "general"` + `include_domains` → good Russian content but no `published_date`; `country: "by"` → HTTP 400.
- Prompt: two country sections, everyday-life emphasis, source-type labelling (state / independent / exile-independent / NGO), explicit no-invention rule, honest reporting of gaps, no `<script>`, standalone HTML5.
- End-to-end test run `ofVqfD98nOQcydFDDt1hO` SUCCEEDED (134.6 s) → committed `data/media/2026-11-18-2019-venaja-puhuu.html` (23.6 kB, 17 sources, both countries, independent outlets included).
- Deleted two weaker intermediate test reports (2010 and 2015) via the GitHub API; kept the 2019 one as the sample.
- Final prompt guard: blog/forum/UGC sources and section front pages are rejected. A re-test with the final prompt (`LqO04KbK3NHyhhzJWaEeY`, 80.5 s) produced a thinner source set (only 8 links), so that 2025 report was deleted too; the 2019 report remains the sample.
- Added `activepieces/media/Venaja-puhuu-OHJEET.md` (maintenance guide) and registered the report in `data/media/index.json`.

**Verification:**
- `ap_validate_flow` → 11/11 steps valid; `ap_lock_and_publish` → published and ENABLED.
- Report checked after download: `<!DOCTYPE html>` … `</html>`, zero `<script>` tags, 17 clickable sources, both country sections present, Belarus section transparently flags independent sources without machine-readable dates.

**Next:**
- Monitor the first automatic Monday 09:00 run.
- Optionally add more outlets to `step_4` / `step_9` + `step_10` and re-test.
- The local working tree still holds uncommitted memory-bank/doc changes.

## 2026-11-19 – "Aamuraportti NEW": etusivujen kärkiteemat ja avausvaikutus

**Done:**
- Rakennettiin uusi työnkulku `Aamuraportti NEW` (Activepieces `LXNbIZEZQmW5wkUA7KHyZ`) vanhan `Aamuraportin` kopiosta. Vanha jäi draftiksi ja pois käytöstä, jotta malleja voi verrata.
- Uusi mittausketju: `step_2` RSS (Google News Business US/FI, Technology, MarketWatch, Nasdaq, FT, Yle) → `step_19` Tavily laatulehdet (wsj, bloomberg, reuters, ft, cnbc) → `step_20` Code (näkyvyyspisteet + välittymistaulukko) → `step_21` LLM (osion kirjoitus) → `step_5` liittää osion ennen spekulaatiota.
- Selvitettiin lähdetilanne kokeilemalla: WSJ:n RSS kuollut (27.1.2025), CNBC:n RSS 403, MarketWatch MarketPulse jäässä; Google News -topic-syötteet, MarketWatch Top Stories, Nasdaq, FT ja Yle toimivat.
- Pisteytys normalisoitiin 0–100 (0,55 mediat + 0,20 syötteet + 0,15 uutismäärä + 0,10 tuoreus), koska ensimmäinen versio kyllääntyi sataan.
- Uusi kehote (`txt_prominence_system.txt`, `txt_prominence_user.txt`) kieltää päättelemästä suuntaa uutisen sävystä, käsittelee toteutuneet tapahtumat toteutuneena tietona, vaatii hinnoittelutestin ja pakollisen lähdeluettelon.
- `docs/app.js`: uusi slotti `'aamu-new'` (🆕 Aamuraportti NEW).
- Korjattiin MCP-rakentamisen sudenkuoppa: OpenRouterin Custom API Call tarvitsee `actionName`-kentän ja `body_type: json`, muuten `body.data`-skeema jää tyhjäksi ja pyyntö lähtee ilman viestejä (400).

**Verification:**
- `ap_validate_flow` → 23/23 askelta valid (step_22 mukana). `node test21.mjs` → 12/12. `check.ps1` → kaikki liitokset kunnossa.
- Ajo `mHqzd8gdW0EKKvSSgbfCQ` SUCCEEDED → committoi `data/markkina/2026-11-19-0825-torstai-aamu-new.html` (21,6 kB), 0 `<script>`-tagia, loppuu `</html>`, pisteytyksen selitys (`<details>`) mukana.
- Raportin uusi osio: taulukko 6 rivillä, teemapisteet mitattuina (tekoäly 14 mediaa / 8 syötettä / 24 uutista), päällekkäiset teemat yhdistetty, Anthropicin anti käsitelty toteutuneena tapahtumana ja avausreaktio jätetty avoimeksi.
- Raportin loppuun lisätty `step_22` (kiinteä selitys pisteytyksestä, taitettava `<details>`), jotta satunnainen lukija ymmärtää pisteet. Selitys ei ole LLM:n varassa.
- Raportin uusi osio: taulukko 6 rivillä, teemapisteet mitattuina (tekoäly 14 mediaa / 8 syötettä / 24 uutista), päällekkäiset teemat yhdistetty, Anthropicin anti käsitelty toteutuneena tapahtumana ja avausreaktio jätetty avoimeksi.

**Next:**
- Julkaise työnkulku (LOCK_AND_PUBLISH) ja seuraa ensimmäistä arkiaamun 06:00 ajoa.
- Harkitse `step_9`:n `[object Object]` -roskan korjausta molemmissa aamuraporteissa.
- `tests/site-check.mjs` odottaa manifestipoluksi `../data/...`, mutta `app.js` hakee `data/...`; testi on vanhentunut (ei liity tähän muutokseen).

## 2026-11-18 – "Saksa/Ranska/Ruotsi/Viro puhuvat" Flows Built and Published

**Done:**
- Created four single-country weekly flows in the `Media` folder via MCP, all cloned from the "Venäjä puhuu" pattern (Date Helper ×2 → Tavily ×2 → OpenRouter → Code → GitHub): Saksa 10:00 (`de`), Ranska 11:00 (`fr`), Ruotsi 12:00 (`sv`), Viro 13:00 (`et`).
- Probed Tavily per market before finalising, because one strategy does not fit all:
  - DE: short concrete news query works; the long "worüber Deutsche sprechen" phrasing returned associations/foundations.
  - FR: general news query works as-is.
  - SE: `include_domains` + `news` → 0 results; `general` + `include_domains` on mainstream → election compass. Mainstream queried by outlet names, independents via `general` + `include_domains`.
  - EE: `include_domains` + `news` works with a narrow query; widening it → 0 results.
  - `country` param accepts "germany"/"estonia" but does not improve relevance.
- Prompts enforce local language only, 14-day window, source-type labelling, rejection of neighbouring-country outlets (AT/CH for DE, BE/CH/CA for FR, FI/NO/DK for SE, LV/LT/FI for EE), blogs/UGC, Wikipedia and search-engine redirect URLs.
- **Failure found and fixed:** the German report was truncated twice by the model (17–20k chars) and the Code step refused to publish. Added a hard length cap (~700–800 words, ≤10 sources, ≤45 CSS lines) to Saksa, Ranska and Viro; the Saksa re-run finished in 23.8 s and published a complete report.
- Sample reports committed: ranska 2034 (19.7 kB, 11 sources), viro 2059 (18.3 kB, 11 sources), ruotsi 2100 (12.1 kB), saksa 2104 (9.7 kB, 10 sources). Deleted the weak first German test report (2033).
- All four published & ENABLED; `ap_validate_flow({ folderName: "Media" })` → 6 flows, connections OK.
- Repo: `data/media/index.json` now lists six media reports; guide `activepieces/media/Saksa-Ranska-Ruotsi-Viro-OHJEET.md` added.

**Verification:**
- Each report checked after download: complete `<!DOCTYPE html>` … `</html>`, zero `<script>` tags, 6–11 clickable sources from the correct country.
- Filename pattern and newest-first sorting verified for all six `data/media/` reports.

**Next:**
- Monitor the first automatic Monday runs (10:00–13:00).
- Consider re-testing Ranska and Viro once with the final (length-capped) prompts.



## 2026-11-19 – "Kello 11 Eurooppa": reasoning-vastauksen JSON-roska korjattu

**Done:**
- Diagnosoitu tuotantoajon `0MgsuKP7hSMUaDwWnea30` (322,8 s) vika: `step_10` (OpenRouter `deepseek/deepseek-v4.1-flash`, `reasoning_effort: high`, `max_tokens: 20000`) palautti `content: null` ja koko valmis HTML-fragmentti oli `reasoning`-kentässä. `step_5` sarjoitti viestin JSONiksi raporttiin ja katkaisi sen viimeiseen `>`-merkkiin.
- `step_10`: `reasoning_effort` → `low`, `max_tokens` → `32000` (samat kuin toimivassa `step_3`:ssa). Koko input annettiin `ap_update_step`-työkalulle, koska työkalu validoi kentät eikä tue osittaista input-päivitystä.
- `step_5`: uusi koodi (myös `activepieces/markkina/tools/step5_eurooppa.js`): content vain jos tekstiä, muuten viimeinen ehjä `<section>…</section>` reasoning-kentästä; viestiobjekteja ei koskaan sarjoiteta JSONiksi; raaka JSON ja vajaa fragmentti hylätään; lopullinen osio validoidaan.
- Uusi testi `tools/test5_eurooppa.mjs` → 14/14 (content=null, choices-rakenne, JSON-merkkijono, ei sectionia, katkennut pää-HTML).
- Testiajo `fvdimEuknwPMViMlmMK5y` SUCCEEDED 123,3 s → `data/markkina/2026-11-19-1702-euroopan-avaus.html` (27,1 kB, 1 `<section>`, 0 `<script>`, ei JSONia). Testiraportti poistettu.
- Julkaistu rikkinäinen `data/markkina/2026-11-19-1100-euroopan-avaus.html` korjattu paikallisesti (143 107 B → 26 521 B): JSON-roskan tilalle reasoningista kaivettu spekulaatio-osio. Git-diff vain 10 lisäystä / 1 poisto.
- Paikallinen `activepieces/markkina/Kello 11 Eurooppa.json` synkronoitu (step_5-koodi + step_10-asetukset).
- Ohje päivitetty: `activepieces/Raporttien-ohje.md` → "Korjatut virheet" ja "Tarkistus ajon jälkeen".

**Verification:**
- `ap_validate_flow` → 18/18 askelta valid.
- Testiraportin lataus GitHubista: ei `"role"`/`"reasoning"`-merkkijonoja, loppuu `</html>`, 0 `<script>`.
- Korjatun 1100-raportin tarkistus: 26 521 merkkiä, 1 `<section>`, 18 `<p>`, ei JSONia, loppuu `</html>`.

**Next:**
- Seuraa seuraavaa arkiaamun 11:00-automaattiajoa ja varmista, ettei raportissa ole JSONia.
- Harkitse saman `reasoning_effort`-tarkistuksen tekemistä muille reasoning-malleja käyttäville työnkuluille.
## 2026-11-19 – Kello 11 ja Kello 18: osakelistat pois, merkittävät yhtiötiedotteet tilalle

**Done:**
- Kartoitettu Nasdaqin yritystiedotesivun taustalla oleva CNS-rajapinta (`api.news.eu.nasdaq.com/news/query.action`, JSONP) ja varmistettu, että se toimii myös koodiaskeleesta ilman erityisotsakkeita.
- Uusi `step_2` "Code (company news)" molempiin työnkulkuihin (`step_18` → `step_2` → `step_9`):
  - hakee Helsingin tiedotteet 24 h ajalta (enintään 4 sivua × 100),
  - hakee Arvopaperin ja Kauppalehden etusivujen otsikot,
  - pisteyttää merkittävyyden (kategoria + avainsanat + isot yhtiöt + etusivuosuma) ja hylkää rutiinit kovalla poissululla,
  - palauttaa enintään 5 ehdokasta tekstilohkona + linkin "Kaikki tiedotteet".
- Kehotteet uusittu: `txt_eurooppa_system.txt` (5,4 kB), `txt_eurooppa_user.txt`, `txt_ilta_system.txt` (5,3 kB), `txt_ilta_user.txt`. Kello 11:stä poistettu osaketaulukko ja kaikkien osakkeiden luettelo; kello 18:n taulukossa vain indeksit, korot, raaka-aineet ja valuutat. Molemmissa uusi osio "Merkittävät yhtiötiedotteet" (enintään 3, linkki mukaan).
- Paikalliset flow-JSONit synkronoitu: uusi `step_2`, uudet kehotteet, ketju tarkistettu.

**Verification:**
- `node test_company_news.mjs` → 200 tiedotetta, 4 merkittävää; Componentan 155 M€ puolustustilaus, Enersensen tulosvaroitus, LeadDeskin liiketoimintamyynti, Auroora (Arvopaperin etusivulla).
- `ap_validate_flow` 19/19 ja 18/18.
- Testiajo kello 11: 247,1 s, 17,5 kB, 0 taulukkoa, 3 tiedotetta + 3 tiedotelinkkiä + "Kaikki tiedotteet".
- Testiajo kello 18: 90,8 s, 12,0 kB, 1 markkinataulukko, samat 3 tiedotetta linkkeineen.
- Molemmat julkaistu ja ENABLED.

**Next:**
- Seuraa ensimmäiset automaattiajot (11:00 ja 18:00) ja tarkista, ettei mukaan tule rutiinitiedotteita.
- Säädä pisteytyskerrointa, jos kynnys 6 tuottaa liikaa tai liian vähän osumia eri päivinä.

## 2026-11-19 – "Marokko puhuu" -mediakatsaus (ranska + arabia)

**Done:**
- Luotu uusi Activepieces-työnkulku `Marokko puhuu` (id `K9PIWWToDiTzrB7uIbeYD`) Media-kansioon, aikataulu maanantai 14:00 Europe/Helsinki.
- Rakenne kopioitu työnkulusta "Ranska puhuu": Date Helper ×2, Tavily ×2, OpenRouter `deepseek/deepseek-v4.1-flash`, Code (HTML + Base64), GitHub PUT `data/media/{timestamp}-marokko-puhuu.html`.
- Kaksi kielihaarukkaa: `step_3` ranskankieliset marokkolaiset mediat, `step_4` arabiankieliset mediat. Molemmissa `topic: "general"` + maakohtainen `include_domains`.
- Kehote kirjoitettu suomeksi: hyväksyy ranskan ja arabian, hylkää englanninkieliset versiot ja naapurimaiden/kansainväliset mediat, sallii päivämäärän päättelyn sisällöstä/URL:stä.

**Verification:**
- `ap_validate_flow` 8/8.
- Ensimmäinen testiajo tuotti vain 1 lähteen (jobsquare.ma) → raportti poistettu commitilla `13d2c03`.
- Toinen testiajo `gviNU3cv7Z7MkWgs41zL7` SUCCEEDED 40,1 s → `data/media/2026-11-19-1935-marokko-puhuu.html` (12,4 kB), 10 lähdettä: fr.hespress.com, fr.le360.ma, barlamane.com/fr, lopinion.ma, al3omk.com, hespress.com, ahdath.info.
- Flow julkaistu (LOCK_AND_PUBLISH) ja ENABLED.

**Next:**
- Seuraa ensimmäinen maanantain 14:00-automaattiajo ja tarkista lähdeluettelo.
- Harkitse paikallisen flow-JSONin vientiä repoon, kun Activepieces-API-avain on käytettävissä.

## 2026-11-19 – Mediakatsausten hakuikkuna kuukauteen (30 vrk)

**Done:**
- Kaikki 7 "…puhuu"-työnkulkua (Puola, Venäjä, Saksa, Ranska, Ruotsi, Viro, Marokko) päivitetty: `step_2` `- 14 day` → `- 30 day`.
- Tavily-askelten nimet "(14 vrk)" → "(30 vrk)".
- Kehotteet päivitetty: 14 vrk → 30 vrk, "Kahden viikon polttavimmat puheenaiheet" → "Kuukauden polttavimmat puheenaiheet"; Ruotsin ja Venäjän yleishakujen päivämääräpäättely 30 vrk:iin.
- Marokon vanha 14 vrk:n testiraportti poistettu (commit 99a78b0).

**Verification:**
- ap_validate_flow 7/7, 11/11, 8/8, 8/8, 8/8, 8/8, 8/8.
- Kaikki julkaistu ja ENABLED.
- Testiajo SBGHcRbQw5BdTOc8Irh9f SUCCEEDED 62,5 s: step_2 = 2026-10-20, raportti data/media/2026-11-19-1949-marokko-puhuu.html (11,9 kB), otsikko 20.10.–19.11.2026, 10 lähdettä.

**Next:**
- Seuraa seuraavat maanantain ajot ja tarkista, ettei kuukausi-ikkuna tuo liikaa vanhentuneita aiheita.

## 2026-11-19 – "Brasilia puhuu" ja "Argentiina puhuu" -mediakatsaukset

**Done:**
- Luotu kaksi uutta työnkulkua Media-kansioon: Brasilia puhuu (`rbCrjv7PYWAsZdPuwVn6L`, ma 15:00) ja Argentiina puhuu (`fZ2g3mAAdJa9Czu6K8PAO`, ma 16:00), 30 vrk ikkunalla.
- Rakenne 1:1 Saksa/Ranska: Date Helper ×2, Tavily valtamedia + riippumattomat mediat, OpenRouter `deepseek/deepseek-v4.1-flash`, Code, GitHub PUT `data/media/`.
- Hakustrategia: `topic: general` + `time_range: month` + `include_domains`. `start_date` jätetty pois, koska Tavily palauttaa 400:n jos `time_range` ja `start_date`/`end_date` ovat yhtä aikaa.
- Promptit: portugali (Brasilia) / espanja (Argentiina); hylkää englanninkieliset versiot sekä Portugalin, Espanjan, Meksikon, Kolumbian, Chilen ja Uruguayn mediat.

**Verification:**
- `ap_validate_flow` 8/8 kummallekin; Media-kansio 9/9 ja yhteydet ok.
- Testiajo Brasilia `weqLBK87fyTZGv71uGUQq` SUCCEEDED 56,9 s → `2026-11-19-2000-brasilia-puhuu.html` (12,3 kB), 10 lähdettä.
- Testiajo Argentiina `LA2r7Jv7CrexDXuqqpy3C` SUCCEEDED 71,3 s → `2026-11-19-2002-argentiina-puhuu.html` (12,9 kB), 10 lähdettä.
- Molemmat julkaistu ja ENABLED.

**Next:**
- Seuraa maanantain 15:00 ja 16:00 ajoja; tarkista erityisesti El Destapen lifestyle-osumien määrä.

## 2026-11-19 – Mediakatsaukset kuukausiajoon

**Done:**
- Kaikki 9 Media-kansion "…puhuu"-työnkulkua vaihdettu triggeriin `every_month`, `day_of_the_month: 1`, Europe/Helsinki; porrastetut tunnit 08–16 säilytetty.
- Triggerien nimeksi "Kuukausittain (1. päivä klo HH:00)".
- Hakuikkuna säilyy 30 vrk:nä (`step_2` −30 day; Brasilia/Argentiina `time_range: month`).

**Verification:**
- `ap_validate_flow({folderName: "Media"})` → 9 työnkulkua, yhteydet ok.
- Kaikki 9 julkaistu ja ENABLED.
- Marokon trigger tarkistettu: `every_month`, day 1, hour 14, Europe/Helsinki.

**Next:**
- Ensimmäinen kuukausiajo 1.12.2026 klo 08–16; tarkista silloin, että kaikki 9 raporttia syntyvät.

## 2026-11-20 – "Kiina puhuu" -mediakatsaus (kiina, manner-Kiina)

**Done:**
- Luotu uusi Activepieces-työnkulku `Kiina puhuu` (id `zbIbozMotgMxBmITVtQ3D`) Media-kansioon, aikataulu kuukauden 1. päivä klo 17:00 Europe/Helsinki (porrastus jatkuu Argentiinan 16:00 jälkeen).
- Rakenne kopioitu `ap_duplicate_flow`-kutsulla työnkulusta "Saksa puhuu": Date Helper ×2, Tavily ×2, OpenRouter `deepseek/deepseek-v4.1-flash`, Code (HTML + Base64 + aikaleimapalkki), GitHub PUT `data/media/{timestamp}-kiina-puhuu.html`. Yhteydet säilyivät duplikaatissa.
- `step_3` = uutisportaalit ja puolueen media (thepaper, sina, 163, qq, sohu, ifeng, chinanews, cctv, people, news.cn); `step_4` = talous-, aikakaus- ja teknologiamedia (caixin, yicai, jiemian, infzm, lifeweek, latepost, nbd, eeo, stcn, cls, caijing, 36kr, huxiu, tmtpost, 21jingji). Molemmissa `topic: general` + `time_range: month` + `language: zh`.
- Kehote kirjoitettu suomeksi: vain manner-Kiinan kiinankieliset mediat; hylkää englanninkieliset versiot ja Hongkongin, Taiwanin, Singaporen sekä ulkomaisten toimittajien kiinankieliset palvelut, koonti- ja listasivut sekä vanhat uudelleenjulkaisut. Merkitsee lähdetyypin ja kertoo avoimesti valtion ohjauksesta.

**Verification:**
- `ap_validate_flow` 8/8 valid.
- Tavily-testit: `topic: news` + `start_date` → vain 2 tulosta (puolueen tiedotteita); `topic: general` + `time_range: month` + `include_domains` → 10–15 käyttökelpoista tulosta. `guancha.cn` pudotettu, koska `user.guancha.cn` palautti itsejulkaisuja ilman päivämäärää (sisältöä vuodelta 2021).
- `ap_test_flow` `6iItvhyaJWnJXHZNCXXAE` SUCCEEDED 119,4 s → `data/media/2026-11-20-0949-kiina-puhuu.html` (10,0 kB), 10 lähdettä (news.cn, finance.cctv.com, sc.people.com.cn, sohu, 163, finance.sina.com.cn ×2, huxiu ×2, 21jingji), aikaväli 21.10.–20.11.2026, ei `<script>`-tageja.
- Julkaistu (LOCK_AND_PUBLISH) ja ENABLED.

**Next:**
- Seuraa 1.12.2026 klo 17:00 automaattiajo (kymmenes katsaus); tarkista lähdeluettelo ja ettei mukaan tule päiväämättömiä itsejulkaisuja.
- Tarkista testiraportin yksittäiset luvut (esim. PPI) ja tiukenna kehotetta tarvittaessa.

**Lisäys 20.11.2026 – Weibo mukaan, LIHKG pois:**
- Lisätty `step_8` (Tavily, `include_domains`: weibo.com, weibo.cn) `step_4`:n ja `step_5`:n väliin; ketju on nyt `step_4` → `step_8` → `step_5` (`ap_validate_flow` 9/9).
- Kehote: uusi sääntö 11 (Weibo enintään 3 lähdettä, aina anekdotaalisesti, ei faktoina; haku- ja koontisivut, mainosraportit ja päiväämättömät postaukset hylätään) sekä lähderaja "tasan 10, enintään 2 per media".
- Syy kiristykseen: ensimmäinen Weibo-ajo (`Qa7ymRh9v69ae8X7wRAZg`) tuotti 12 lähdettä, joista 6 huxiu/21jingji-ketjusta.
- Testiajo `muJ1SXI896mtRJtiB5c63` SUCCEEDED 63,6 s → `data/media/2026-11-20-1018-kiina-puhuu.html` (10,0 kB), tasan 10 lähdettä, 1 Weibo-lähde, max 2 per media.
- **LIHKG (lihkg.com) jätettiin pois:** Hongkongin foorumi, kantonikiina; Tavily palautti 1–2 ketjua kuukaudessa ilman `published_date`-kenttää ja ilman aikarajausta vain vuosia vanhoja ketjuja (thread-ID 357k–386k). Jos Hongkong halutaan mukaan, tehdään oma "Hongkong puhuu" -katsaus.
- Julkaistu uudelleen (LOCK_AND_PUBLISH) ja ENABLED.
## 2026-11-20 – Markkinakatsausten linkit leipätekstiin
**Done:**
- Kello 18 (`TR0JVsYppLuOlRMEjadTI`) step_3 sääntö 9: linkit taulukon lisäksi korostuslaatikkoon ja kaikkeen leipätekstiin (Wall Street, Eurooppa/Helsinki, korot, raaka-aineet, valuutat).
- Kello 11 (`wjAQ4F3wSRVcgmMP40k2H`) step_3 sääntö 9: linkit kaikkiin osioihin ja myös yksittäisiin osakkeisiin; step_10: uusi sääntö 7 (LINKIT), LOPETUS → 8.
- Aamuraportti NEW (`LXNbIZEZQmW5wkUA7KHyZ`): step_3 sääntö 8 laajennettu leipätekstiin; step_10: uusi sääntö 7 (LINKIT), LOPETUS → 8.
- Sääntöjen muoto: vain annetut Yahoo Finance -osoitteet, ei keksittyjä linkkejä; kunkin kohteen nimi linkitetään osiossa ensimmäisellä maininnalla.
- Paikalliset JSON-tiedostot ja `tools/txt_eurooppa_system.txt` / `txt_ilta_system.txt` päivitetty vastaamaan julkaistuja kehotteita. `Raporttien-ohje.md`: uusi kohta "Kurssilinkit" + korjatut virheet 20.11.2026.

**Verification:**
- `ap_validate_flow` Kello 11: 19/19 valid, Kello 18: 18/18 valid; molemmat LOCK_AND_PUBLISH.
- Kehotteet tarkistettu `ap_read_step_settings`-kutsulla (uusi sääntö näkyy julkaistussa versiossa).
- `ap_test_step` Kello 18 step_3 SUCCEEDED, mutta testiajo käytti tyhjiä esimerkkitietoja, joten se ei todentanut linkkejä; oikea varmistus tulee klo 18:00 automaattiajosta.

**Next:**
- Tarkista 20.11.2026 klo 18:00 raportista (`data/markkina/…-ilta.html`), että indeksit/korot/raaka-aineet/valuutat ovat linkkejä myös leipätekstissä.
- Jos malli jättää linkin pois jostain osiosta, kiristä kyseisen step_3:n sääntöä (esim. vaadi linkki jokaiseen kappaleeseen, jossa kohde mainitaan).