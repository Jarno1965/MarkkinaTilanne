# Progress Log

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



