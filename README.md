# Markkinatilanne

Yksi repositorio, kaksi puolta:

1. **Sivusto** (`docs/`) – staattinen HTML/CSS/JS, julkaistaan GitHub Pagesista.
2. **Raporttien tuotanto** (`activepieces/`) – Activepieces-työnkulut, jotka generoivat
   HTML-raportit ja committoivat ne `data/`-kansioon.

Kumpikaan puoli ei tarvitse omaa repositoriota. Sivusto lukee saman repon `data/`-kansiota,
ja Activepieces committaa samaan repoon. Siksi sivuston muutos ja raportin muutos ovat
saman sopimuksen kaksi päätä ja ne on pidettävä samassa versiossa.

## Kansiorakenne

```text
/
  .clinerules                     Cline-säännöt (koko järjestelmä)
  README.md                       tämä ohje
  memory-bank/                    Cline-muistipankki
  docs/                           GitHub Pagesin lähde
    index.html, style.css, app.js
    feeds.json                    katsausten rekisteri (ainoa paikka, jossa katsaukset luetellaan)
  data/
    <katsaus>/                    yksi kansio per katsausvirta
      YYYY-MM-DD-HHMM-slug.html
      index.json                  vain paikalliseen kehitykseen
  prompts/
    <katsaus>/                    kehotetekstit (versionhallinnassa)
  activepieces/
    Raporttien-ohje.md            työnkulkujen ylläpito-ohje
    markkina/                     markkina-analyysin työnkulut
      *.json
      tools/                      build-, decode-, check- ja import-skriptit
    media/                        mediakatsausten työnkulut (sama rakenne)
    tools/
      import-to-activepieces.ps1  työnkulkujen vienti Activepiecesiin
  tests/
    site-check.mjs                sivuston savutesti (node)
```

## Katsaus (feed)

**Katsaus** on yksi raporttivirta. Sen tunnus on kansioiden nimi:

- `markkina` – markkina-analyysi (Aamuraportti, Kello 11, Kello 18, Sunnuntai)
- `media-se`, `media-de`, … – maakohtaiset mediakatsaukset

Tiedostot ovat aina muotoa `data/<katsaus>/YYYY-MM-DD-HHMM-slug.html`. Aika on Suomen
aikaa, ja slug on kiinteä arvo per aikaväli (ei LLM:n tuottama). Aakkosjärjestys on sama
kuin aikajärjestys, joten lajittelu ei tarvitse tietokantaa.

`docs/feeds.json` kertoo sivustolle, mitkä katsaukset näytetään ja miten ne ryhmitellään:

```json
{
  "defaultFeed": "markkina",
  "groups": [
    {
      "id": "markkina",
      "title": "Markkina-analyysi",
      "feeds": [
        { "id": "markkina", "title": "Markkinakatsaukset", "icon": "📈" }
      ]
    },
    {
      "id": "media",
      "title": "Mediakatsaukset",
      "feeds": [
        { "id": "media-se", "title": "Ruotsi", "icon": "🇸🇪" }
      ]
    }
  ]
}
```

Sivuston koodi ei tunne yksittäisiä katsauksia. Uusi katsaus lisätään tähän tiedostoon,
ei JavaScriptiin. Valintavalikko piilotetaan automaattisesti, jos katsauksia on vain yksi.

## Uuden katsauksen lisääminen

Esimerkki: Ruotsin mediakatsaus.

1. **Luo data-kansio** `data/media-se/` ja sinne `index.json` paikallista testausta varten
   (rakenne: `{ "files": ["..."] }`).
2. **Luo työnkulku** `activepieces/media/media-se-aamu.json`. Helpoin tapa on kopioida
   olemassa oleva markkinatyönkulku ja muuttaa kehote, aikataulu, slug ja commit-polut.
   Commit-polun on oltava `data/media-se/<tiedostonimi>.html`.
3. **Lisää katsaus rekisteriin** `docs/feeds.json`-tiedostoon (ryhmä `media`).
4. **Aja tarkistukset** (ks. alla) ja committoi. Sivusto näyttää uuden katsauksen ilman
   koodimuutoksia.
5. **Vie työnkulku Activepiecesiin** `import-to-activepieces.ps1 -Apply`.

Uusi aihepiiri (esimerkiksi energia) tehdään samalla tavalla: uusi kansio, uusi
`feeds.json`-ryhmä ja uusi työnkulku. Katsauksen tunnuksessa käytetään vain pieniä
kirjaimia, numeroita ja tavuviivaa.

## Nimeämissäännöt

- Katsauksen tunnus: `markkina`, `media-se`, `media-de` (pienet kirjaimet, tavuviiva).
- Raportin tiedosto: `YYYY-MM-DD-HHMM-slug.html`, esim. `2026-11-13-0600-aamukatsaus.html`.
- Slugi: `aamukatsaus`, `eurooppa-avaus`, `paivan-yhteenveto`, `media-aamu`, `media-ilta`.
- Kehotteet: `prompts/<katsaus>/<aikaväli>.md`.

## Paikallinen testaus

```powershell
# Sivuston savutesti (lukee docs/feeds.json ja data/markkina/index.json)
node tests/site-check.mjs

# Syntaksitarkistus
node --check docs/app.js
```

Sivusto kannattaa avata VS Coden Live Serverillä. Localhostissa se lukee ensisijaisesti
`data/<katsaus>/index.json`-tiedostoa ja vasta toissijaisesti GitHubin Contents API:a.
Tuotannossa järjestys on päinvastainen. `index.json` on siis vain kehitystä varten.

## Työnkulkujen muuttaminen ja vienti

```powershell
cd activepieces\markkina\tools

.\check.ps1                     # liitokset ja käyttäjäviestien osiot
node test3.mjs                  # step_9, step_14, step_18
node test14.mjs                 # step_14 eri vastausrakenteilla

cd ..\..\tools                  # activepieces\tools

.\import-to-activepieces.ps1 -ProjectId '<id>' -Offline   # vain tiedostot
.\import-to-activepieces.ps1 -ProjectId '<id>'            # kuiva-ajo
.\import-to-activepieces.ps1 -ProjectId '<id>' -Apply     # vienti ja julkaisu
```

Tarkemmat ohjeet: `activepieces/Raporttien-ohje.md`.

## Kaksi tapaa, joilla tiedosto päätyy repoon

- **Automaatio (tuotanto):** Activepieces committaa raportin suoraan `data/<katsaus>/`-kansioon.
- **Käsin (kehitys):** kopioi tiedosto samaan kansioon ja päivitä `index.json`.

Molemmissa tapauksissa polku ja tiedostonimi ovat samat, joten sivusto ei tiedä eroa.

## Muistipankki

`memory-bank/` on Cline-työkalun muisti. Se kattaa nykyään sekä sivuston että
Activepieces-työnkulut. Kun arkkitehtuuri muuttuu, päivitä `systemPatterns.md` ja
`activeContext.md`.
