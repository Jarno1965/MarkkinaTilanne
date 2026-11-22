# Puola puhuu – dynaaminen kuukausikatsaus (Activepieces)

## Yleiskuvaus

Työnkulku **Puola puhuu** (`c0MqQI410YdGCyHrJvB8v`, `Media`-kansio) kokoaa kerran kuukaudessa
suomenkielisen katsauksen siitä, **mistä Puolassa on kuluneen 30 vuorokauden aikana oikeasti
puhuttu**. Raportin osiot ja otsikot eivät ole etukäteen päätettyjä: ne syntyvät datasta.

- **Aikataulu:** kuukauden 1. päivä klo 08:00, `Europe/Helsinki`
- **Raportti:** `data/media/YYYY-MM-DD-HHMM-puola-puhuu.html`
- **Commit-viesti:** `Puola puhuu – dynaamiset kuukauden puheenaiheet`
- **Julkaistu ja ENABLED** 22.11.2026

## Miksi työnkulku rakennettiin uudelleen

Vanha toteutus (nykyään `Puola puhuu (VANHA 22.11 - ei ajossa)`, `ULRjuv9GtUDQ7Y5OKjM2q`, DISABLED)
teki viisi kiinteää teemahakua (arki ja perhe, hinnat ja toimeentulo, talous ja työ, politiikka,
terveys/koulu/turvallisuus) ja kehote pakotti raportin yhdeksään kiinteään väliotsikkoon kiinteillä
sanamäärillä. Se aiheutti kaksi ongelmaa:

1. **Haku löysi vain sen mitä kysyttiin.** Jos kuukauden suurin puheenaihe oli jotain muuta
   (kriisi, skandaali, lakihanke, viraali ilmiö), se jäi sivuun tai alisteiseksi.
2. **Raportti täyttyi tyhjistä osioista.** Osio, josta ei ollut puhuttu, piti silti kirjoittaa
   sataan sanaan, jolloin malli venytti tai keksi sisältöä.

Uusi malli on kaksivaiheinen: **kartoitus → AI:n tunnistamat teemat → täsmähaut → dynaaminen raportti**.
Sama periaate kuin `Lauantai`/`Sunnuntai`-työnkuluissa (tapahtumapoimija + täsmähaut), mutta
sovitettuna puolankieliseen mediakenttään ja keskustelupalstoihin.

## Rakenne (19 askelta)

| Askel | Tyyppi | Tehtävä |
| --- | --- | --- |
| `trigger` | Schedule `every_month` | Kuukauden 1. päivä klo 08:00 |
| `step_1` | Date Helper | Nykyhetki `YYYY-MM-DD HH:mm:ss` |
| `step_2` | Date Helper | `- 30 day` → aikavälin alku |
| `step_3` | Tavily | **Kartoitus 1/3:** uutisportaalit ja päivälehdet (11 domainia, `topic: news`, `days: 30`) |
| `step_4` | Tavily | **Kartoitus 2/3:** mielipide-, talous- ja aikakausmedia (11 domainia, `topic: general`, `time_range: month`) |
| `step_5` | Firecrawl | **Kartoitus 3/3:** Wykop, Reddit ja keskustelut (`qdr:m`, `includePageContent`) |
| `step_6` | Code | Kartoitus yhdeksi tekstiksi: duplikaatit pois, roskadomainit pois, ikämerkinnät |
| `step_7` | OpenRouter `google/gemini-2.5-flash` | **Aiheidenpoimija:** tunnistaa 5–7 teemaa + 3 täsmähakua + urlit (JSON) |
| `step_8` | Code | Purkaa JSONin: `query_1..3`, `themesText`, `urls`, `socialQuery`; varahaut jos JSON puuttuu |
| `step_9` | Tavily | Täsmähaku 1 (AI:n `query_1`) |
| `step_10` | Tavily | Täsmähaku 2 (`query_2`) |
| `step_11` | Tavily | Täsmähaku 3 (`query_3`) |
| `step_12` | Tavily Extract | Koko teksti AI:n valitsemista artikkeleista (`continueOnFailure`) |
| `step_13` | Firecrawl | Keskustelut tunnistetuista teemoista (`socialQuery`, `continueOnFailure`) |
| `step_14` | Code | Yhdistää aineiston, **pudottaa yli 32 vrk vanhat**, kokoaa lähderekisterin ja `sourcesText` |
| `step_15` | Code | Laadunvartija: teemoja ≥ 3, lähteitä ≥ 8, domaineja ≥ 5, aineistoa ≥ 6 000 merkkiä |
| `step_16` | OpenRouter `anthropic/claude-sonnet-4.6` | Kirjoittaa katsauksen Markdownina dynaamisilla otsikoilla |
| `step_17` | Code | Markdown → itsenäinen HTML5 + Base64 (lisää lähdeluettelon vain jos LLM unohti sen) |
| `step_18` | GitHub | `PUT /contents/data/media/<aikaleima>-puola-puhuu.html` |

## Kartoitusvaiheen lähteet

**Uutisportaalit ja päivälehdet (`step_3`):** onet.pl, wp.pl, interia.pl, gazeta.pl, tvn24.pl,
rmf24.pl, polsatnews.pl, rp.pl, wyborcza.pl, fakt.pl, se.pl.
Haku: `Polska najważniejsze tematy dyskusje kontrowersje wydarzenia opinia publiczna ostatni miesiąc`.

**Mielipide-, talous- ja aikakausmedia (`step_4`):** polityka.pl, newsweek.pl, wprost.pl,
dorzeczy.pl, oko.press, krytykapolityczna.pl, klubjagiellonski.pl, bankier.pl, money.pl, pb.pl,
forsal.pl.
Haku: `Polska debata publiczna spory polityczne gospodarka ceny podatki świadczenia rodziny analizy opinie`.

**Keskustelut (`step_5`):** Firecrawl `search_web`, `lang: pl`, `country: PL`, `timeFilter: qdr:m`,
`includePageContent: true`, `limit: 8`. Haku: `o czym mówią Polacy wykop reddit forum dyskusja
opinie komentarze ostatni miesiąc`.

Näiden tarkoitus on **kattaa eri ääniä**: valtavirta, syvä journalismi ja tavallisten ihmisten
keskustelu. Mitään teemaa ei lukita etukäteen.

## Aiheidenpoimija (`step_7`)

- **Malli:** `google/gemini-2.5-flash` (varamalli `deepseek/deepseek-v4.1-flash`), `temperature: 0.2`,
  `max_tokens: 4000`.
- **Kehote:** `puola_topic_extractor_system.txt` / `_user.txt` (samat tekstit ovat työnkulussa).
- **Tuotos:** puhdas JSON:

```json
{
  "themes": [
    { "title_fi": "…", "why_fi": "…", "keywords_pl": ["…"], "channels_fi": "…" }
  ],
  "queries": [ { "query": "…puolaksi…", "focus_fi": "…" } ],
  "urls": ["https://…"]
}
```

- **Säännöt kehotteessa:** 5–7 teemaa näkyvyysjärjestyksessä, teema on yksilöity ilmiö eikä yleinen
  kategoria (hyvä: ”Kredyt 0% -asuntolainakiista”, huono: ”Asuminen”), älä keksi aiheita, yhdistä
  samasta asiasta eri sanoin kirjoittavat otsikot, tasan 3 puolankielistä täsmähakua, urlit vain
  aineistosta.
- **Miksi Gemini Flash:** nopea, halpa, erinomainen puolan kielen ymmärrys ja luotettava JSON.
  Testattu 22.11.2026: 5 teemaa ja 3 hakua ~14 sekunnissa (kustannus ~0,004 $).

## Täsmähaut ja aineiston yhdistäminen

- `step_9`–`step_11`: `topic: news`, `days: 30`, `language: pl`, `max_results: 12`, `advanced`,
  `include_answer: true`, `filter_by_published_date: true`.
- `step_12`: Tavily Extract AI:n valitsemille urleille (enintään 6).
- `step_13`: Firecrawl hakee keskustelut teemojen avainsanoilla.
- `step_14` kokoaa neljä lohkoa: `teemat` (AI:n teemalista), `uutiset` (täsmähaut),
  `artikkelit` (koko tekstit), `some` (molemmat Firecrawl-haut).
  - **Tuoreussuodatus:** tunnettu julkaisupäivä yli **32 vrk** → pudotetaan ja lohkoon kirjataan
    `(pudotettu N yli 32 vrk vanhaa osumaa)`.
  - Ilman päivämäärää olevat säilytetään merkinnällä `ei päivämäärää`, jotta kirjoittaja kohtelee
    niitä taustana.
  - `sources` (max 30) ja `sourcesText` numeroituna kirjoittajan kehotetta varten.

## Laadunvartija (`step_15`)

Ajo epäonnistuu eikä committia tehdä, jos:

- tunnistettuja teemoja < 3,
- lähteitä < 8,
- eri domaineja < 5,
- täytettyjä aineistolohkoja < 3,
- aineistoa < 6 000 merkkiä.

Virheilmoitus kertoo puuttuvan kohdan ja kerätyt varoitukset, joten ohuen ajon syy näkyy suoraan
ajohistoriasta.

## Raportin kirjoittaja (`step_16`)

- **Malli:** `anthropic/claude-sonnet-4.6`; OpenRouterin varamallit
  `google/gemini-2.5-pro` ja `openai/gpt-4.1` (`route: fallback`).
- **Miksi Claude Sonnet:** paras suomen kielen rytmi ja journalistinen ote tässä projektissa
  testatuista malleista; noudattaa tiukkoja lähde- ja rakenneohjeita eikä tuhlaa tokeneita
  sisäiseen pohdintaan. Kustannus kerran kuukaudessa on muutaman sentin luokkaa.
- **Kehote:** `puola_writer_system.txt` / `_user.txt`.
- **Rakenne:** `## Kuukauden polttavimmat puheenaiheet` → **5–7 dynaamista `##`-osiota aiheen
  omilla nimillä** → `## Kansalaisten ääni: mitä palstoilla ja somessa sanotaan` →
  `## Mitä seuraavaksi` → `## Lähteet`.
- **Kielletyt vakio-otsikot** on lueteltu kehotteessa, jotta malli ei palaa vanhaan muottiin.
- **Dynaamisuussääntö:** jos ehdotettu teema ei saa aineistossa katetta, se pudotetaan; jos
  aineistosta nousee uusi teema, se otetaan mukaan.
- Pituus 1 200–1 800 sanaa, ei HTML:ää eikä `<script>`-tageja.

## Testiajo 22.11.2026

- Ajo `WSx4D8SqbwTTpWi4fbyZU` **SUCCEEDED 223,4 s**.
- Committoi `data/media/2026-11-22-1750-puola-puhuu.html` (22 671 B, 14 lähdettä, tekstiä 14 895
  merkkiä).
- Raportin `##`-otsikot olivat kuukauden todellisia aiheita:
  `Trybunał Konstytucyjny ja perustuslaillinen valtataistelukriisi`,
  `Ulkomaalaisiin kohdistuva väkivalta ja dehumanisaation kieli`,
  `Andziaks-sometähden mikrovero ja julkisuuden henkilöiden verokäytännöt`,
  `Kornelia Wieczorek -kohu ja sananvapaus verkossa`,
  `Puolan talous 2030: energiaa, tekoälyä ja puolustusta`.
- Tarkistukset: 0 kpl `[object Object]`, 0 kpl `reasoning`, 0 kpl `<script>`, dokumentti päättyy
  `</html>`.
- Yksikkötesti `node test_puola_dynamic.mjs` → **29/29 OK**.

## Testaus ja ylläpito

```text
node activepieces/media/tools/test_puola_dynamic.mjs   # koodiaskeleiden yksikkötesti (29)
ap_validate_flow({ flowId: "c0MqQI410YdGCyHrJvB8v" })  # 19/19
ap_test_flow({ flowId: "c0MqQI410YdGCyHrJvB8v" })       # oikea ajo, committaa näyteraportin
ap_lock_and_publish({ flowId: "c0MqQI410YdGCyHrJvB8v" })
```

### Lähteiden lisääminen

- **Uutisportaalit:** lisää domain `step_3`:n `include_domains`-listaan.
- **Mielipide/talousmedia:** lisää domain `step_4`:n `include_domains`-listaan.
- **Keskustelut:** muokkaa `step_5`:n `query`-kenttää (esim. lisää `facebook` tai `x.com`, jos
  haluat mukaan somea — Firecrawl indeksoi ne heikommin kuin Wykopin).
- Aja yksikkötesti, `ap_validate_flow` ja `ap_test_flow`, tarkista lähdeluettelo ja julkaise.

### Mallien vaihto

- **Poimija:** `step_7` → `body.data.model` ja `models`.
- **Kirjoittaja:** `step_16` → `body.data.model` ja `models` (järjestys = fallback-järjestys).
- Huom: `google/gemini-2.5-pro` käyttää runsaasti reasoning-tokeneita. Jos se on päämallina,
  pidä `max_tokens` suurena (≥ 32 000) tai aseta `reasoning: { "effort": "low" }`.

### Kynnysarvojen säätö

- Laadunvartijan rajat: `puola_step15_guard.js` (teemat, lähteet, domainit, lohkot, merkit).
- Tuoreusraja: `puola_step14_compact.js` → `MAX_AGE_DAYS` (oletus 32).
- Aineistolohkojen katot: saman tiedoston `BLOCK_CAP`, `EXTRACT_CAP`, `SOCIAL_CAP`.

## Tunnettuja rajoituksia

- **Wykop ja Reddit:** Firecrawl palauttaa niistä vaihtelevasti sisältöä. Jos `step_5` tai `step_13`
  jää tyhjäksi, raportti syntyy silti, mutta ”Kansalaisten ääni” -osio jää ohuemmaksi ja
  `step_14` kirjaa varoituksen.
- **`topic: news` + `include_domains`** voi palauttaa nollan joidenkin pienempien medioiden osalta.
  Siksi kartoitus 2/3 käyttää `topic: general` + `time_range: month`.
- **Ilman julkaisupäivää olevat osumat** (yleisiä `general`-haussa) merkitään `ei päivämäärää`;
  kehote kieltää esittämästä niitä tuoreina uutisina.
- **Teemojen määrä vaihtelee:** kuukausi, jolloin Puolassa on vähän suuria puheenaiheita, tuottaa
  4–5 osiota. Tämä on tarkoituksellista: kehote kieltää keksimästä teemoja.



