# Active Context

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
- **Local development:** on localhost the app prefers `data/index.json` (a filename manifest) and falls back to the Contents API. In production it is the other way round.
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
