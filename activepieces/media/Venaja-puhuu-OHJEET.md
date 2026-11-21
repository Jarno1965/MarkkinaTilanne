# Venäjä puhuu – Activepieces-työnkulun ohjeet

## Yleiskuvaus

Työnkulku kokoaa kahden viikon välein suomenkielisen katsauksen siitä, mistä **venäläiset ja
valkovenäläiset** puhuvat juuri nyt: arki ja perhe, toimeentulo ja hinnat, talous, politiikka ja
median äänet. Katsaus perustuu **vain paikallisella kielellä** (venäjä; Valko-Venäjän osalta myös
valkovenäjä) julkaistuihin juttuihin, ja mukaan otetaan sekä valtavirran että epäsovinnaisia
(riippumattomia ja maanpaossa toimivia) medioita.

- **Activepieces:** `Media`-kansio, työnkulku **Venäjä puhuu**
  (`c7CM8wDdl4ij1MME4Z7Aj`, https://cloud.activepieces.com/projects/ZsU7pgZptj5ECc57gU3Cx/flows/c7CM8wDdl4ij1MME4Z7Aj)
- **Aikataulu:** maanantai klo 09:00, `Europe/Helsinki` (Puola puhuu ajetaan klo 08:00, jotta ajot eivät osu samaan minuuttiin)
- **Raportti:** `data/media/YYYY-MM-DD-HHMM-venaja-puhuu.html`
- **Commit-viesti:** `Venäjä puhuu`
- **Sivusto:** näkyy Mediakatsaukset-kategoriassa ilman koodimuutoksia (tiedostonimi mahtuu
  `docs/app.js`:n tiedostonimisääntöön).

## Vaiheet

| Vaihe | Tyyppi | Tehtävä |
| --- | --- | --- |
| `trigger` | Schedule `every_week` | Maanantai 09:00, Europe/Helsinki |
| `step_1` | Date Helper `get_current_date` | Nykyhetki `YYYY-MM-DD HH:mm:ss` (Suomen aika) |
| `step_2` | Date Helper `add_subtract_date` | `- 14 day` → `YYYY-MM-DD` (hyväksyttävän aikavälin alku) |
| `step_3` | Tavily `custom_api_call` | Venäjä, valtamedia ja valtavirta |
| `step_4` | Tavily `custom_api_call` | Venäjä, riippumattomat ja maanpaossa toimivat mediat |
| `step_5` | Tavily `custom_api_call` | Valko-Venäjä, paikallismediat |
| `step_9` | Tavily `custom_api_call` | Valko-Venäjä, riippumattomat ja oppositomediat (uutishaku) |
| `step_10` | Tavily `custom_api_call` | Valko-Venäjä, riippumattomat mediat (yleishaku, ei päiväsuodatinta) |
| `step_6` | OpenRouter `custom_api_call` | `deepseek/deepseek-v4.1-flash`, käännös + itsenäinen HTML5-raportti |
| `step_7` | Code | Puhdistaa HTML:n, lisää aikaleimapalkin, Base64-koodaa |
| `step_8` | GitHub `custom_api_call` | `PUT /repos/Jarno1965/MarkkinaTilanne/contents/data/media/<aikaleima>-venaja-puhuu.html` |

Vaiheiden numerointi ei ole juokseva: `step_9` ja `step_10` lisättiin jälkeenpäin `step_5`:n
jälkeen. Template-viittaukset ovat siksi `step_3`, `step_4`, `step_5`, `step_9` ja `step_10`
(kaikki hakutulokset) sekä `step_6` → `step_7` → `step_8`.

## Tavily-haut

Kaikissa hauissa: `search_depth: "advanced"`, `language: "ru"`, `filter_by_language: true`,
`max_results: 15`.

| Vaihe | `topic` | Query (lyhennetty) | Muut |
| --- | --- | --- | --- |
| `step_3` | `news` | `новости Россия общество повседневная жизнь семья цены продукты зарплата пенсия ЖКХ экономика политика о чём говорят россияне` | `start_date` = step_2, `include_published_date`, `filter_by_published_date`, `exclude_domains`: google.com, youtube.com |
| `step_4` | `news` | `«Медуза» «Новая газета Европа» «Радио Свобода» «Важные истории» «Вёрстка» «Proekt» «The Insider» расследование Россия жизнь людей цены работа регионы` | kuten edellä + `exclude_domains`: wikipedia.org |
| `step_5` | `news` | `Беларусь новости общество повседневная жизнь семья цены продукты зарплата пенсия ЖКХ экономика Лукашенко о чём говорят белорусы` | kuten `step_3` |
| `step_9` | `news` | `«Зеркало» «Наша Ніва» «Белсат» «Реформа» «Радыё Свабода» «Еврорадио» Беларусь новости общество цены зарплата жизнь людей` | kuten `step_3` |
| `step_10` | `general` | `Беларусь цены зарплаты пенсии ЖКХ общество жизнь людей новости` | `include_domains`: zerkalo.io, nashaniva.com, svaboda.org, reform.news, euroradio.fm, nn.by |

### Miksi haut on rakennettu näin (opit testiajoista)

1. **`include_domains` + `topic: "news"` palauttaa näille medioille tyhjän tuloksen.** Siksi
   riippumattomat mediat haetaan joko toimittajien nimillä hakulauseessa (`step_4`, `step_9`) tai
   `topic: "general"` + `include_domains` (`step_10`).
2. **`topic: "general"` ei palauta `published_date`-kenttää.** Siksi `step_10` on vain
   lisäaineistoa: prompti sallii siitä vain jutut, joiden julkaisupäivä selviää jutun omasta
   sisällöstä ja osuu 14 vuorokauden aikavälille.
3. **Tavily ei tue valkovenäjän kieltä `language`-parametrissa.** Valko-Venäjän haut tehdään
   venäjäksi (`language: "ru"`), koska venäjä on maan toinen virallinen kieli ja valtaosa maan
   mediasta julkaisee venäjäksi. Prompti hyväksyy myös valkovenäjänkieliset jutut, jos niitä
   hakutuloksiin tulee.
4. **Tavily `country`-parametri ei tue Valko-Venäjää** (`400 Invalid country`), joten maakohtaista
   painotusta ei voi käyttää.
5. **Hakukoneiden uudelleenohjauslinkit** (`google.com/url`) ja Wikipedia rajataan pois, koska
   niistä ei saa kelvollista lähde-URL:ia.

## Raportin rakenne (LLM-prompti)

- Pääotsikko + 14 vrk aikaväli
- Korostuslaatikko: kahden viikon polttavimmat puheenaiheet
- Osa 1 – Venäjä: arki/perhe/yhteiskunta, toimeentulo/hinnat/talous, politiikka, mediakentän äänet
- Osa 2 – Valko-Venäjä: samat alaotsikot
- Käytetyt lähteet kahdessa luettelossa: alkuperäinen otsikko + suomennos, julkaisupäivä,
  lähdetyyppi (valtiollinen tai valtiomyönteinen / riippumaton / maanpaossa toimiva riippumaton /
  kansalaisjärjestö) ja klikattava URL

Prompti kieltää keksimästä uutisia tai lukuja ja vaatii merkitsemään valtiollisen median väitteet
väitteiksi. Lisäksi se hylkää blogit, foorumit ja käyttäjien tuottaman sisällön (esim.
smart-lab.ru, LiveJournal, Telegram) sekä median etusivut ja uutisluettelot, jotta lähteiksi jää
yksilöityjä, päivättyjä juttuja. Jos hyväksyttyjä lähteitä ei löydy, raportti kertoo sen avoimesti
sen sijaan että täyttäisi aukon arvauksilla.

## Testaus ja muokkaus

Työnkulku on rakennettu Activepiecesin MCP-työkaluilla. Muutokset kannattaa tehdä joko
Activepiecesin käyttöliittymässä tai MCP:n kautta (`ap_flow_structure`, `ap_read_step_settings`,
`ap_update_step`, `ap_validate_flow`, `ap_test_flow`, `ap_lock_and_publish`).

```text
1. ap_validate_flow({ flowId: "c7CM8wDdl4ij1MME4Z7Aj" })   # 11/11 valideja
2. ap_test_flow({ flowId: "c7CM8wDdl4ij1MME4Z7Aj" })       # ajaa oikeat haut + commitin
3. ap_lock_and_publish({ flowId: "c7CM8wDdl4ij1MME4Z7Aj" })
```

Testiajo **committaa oikean raportin** repoon (se on tarkoitus: se on samalla ensimmäinen
näyteraportti). Ajo kestää noin 2 minuuttia, koska viisi hakua ja LLM-kutsu ovat hitaita.

### Uusien medioiden lisääminen

- **Venäjä:** lisää toimittajan nimi `«»`-lainausmerkeissä `step_4`:n `query`-kenttään.
- **Valko-Venäjä:** lisää toimittajan nimi `step_9`:n `query`-kenttään ja domain `step_10`:n
  `include_domains`-listaan.
- Aja `ap_validate_flow` ja `ap_test_flow`, tarkista että uusi lähde näkyy raportin
  lähdeluettelossa, ja julkaise.

## Tunnettuja rajoituksia

- Valko-Venäjän riippumattomien medioiden tuoreimmat jutut eivät aina sisällä koneluettavaa
  julkaisupäivää, joten katsaus merkitsee ne taustatiedoksi ja kertoo rajoitteen lukijalle.
- Tavilyn uutisindeksi kattaa valtiolliset ja suuret mediat selvästi paremmin kuin pienet
  maanpaossa toimivat toimitukset. Raportin kattavuus vaihtelee viikoittain.
- Raportin HTML ajetaan sivustolla hiekkalaatikossa ilman skriptejä, joten LLM ei saa tuottaa
  `<script>`-tageja (prompti kieltää ne).

