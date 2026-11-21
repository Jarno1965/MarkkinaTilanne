# Puola Viikkokatsaus - Activepieces Workflow Ohjeet

## Yleiskuvaus
Tämä workflow hakee puolankielisiltä uutissivuilta tietoja mistä puolalaiset keskustelevat (2 viikon aika), kääntää ne suomeksi ja luo viikkokatsauksen.

## Workflowin vaiheet

### 1. Trigger (Every Week)
- **Kappale**: Schedule
- **Asetukset**: Every Week (jokaisen viikon)

### 2. Step 1: Get Current Date
- **Kappale**: Date Helper
- **Toiminto**: get_current_date
- **Asetukset**:
  - TimeZone: Europe/Helsinki
  - TimeFormat: YYYY-MM-DD HH:mm:ss
- **Output**: {{steps['step_1'].result}} (muotoa: 2026-11-18 14:42:04)

### 3. Step 2: Tavily Search (Puolankieliset uutiset)
- **Kappale**: Tavily
- **Toiminto**: search
- **Asetukset**:
  - **Query**: "Poland news topics citizens talking about concerns issues what matters Polish people discussion"
  - **Topic**: news
  - **Max Results**: 15
  - **Search Depth**: advanced
  - **Include Answer**: true
  - **Include Images**: false
  - **Language**: pl (puolankieliset tulokset)
  - **Time Range**: 2w (viimeiset 2 viikkoa)

**HUOM**: Jos Tavily ei tue language- tai time_range-parametreja, käytä queryssä:
```
Poland news topics citizens talking about 2026 Polish media discussion language:polish
```

### 4. Step 3: OpenRouter AI (Käännös ja analyysi)
- **Kappale**: Open Router
- **Toiminto**: chat_complete_a_z
- **Model**: deepseek/deepseek-v4.1-flash
- **Max Tokens**: 20000
- **Temperature**: 0.3

**System Prompt**:
```
Olet tiedonhankinnan ja analyysin asiantuntija. Tehtäväsi on etsiä ja tiivistää tuoretta tietoa aiheesta: Puolalaiset keskustelunaiheet ja mielenliikkeet.

Noudata näitä tiukkoja sääntöjä:

1. KIELIRAJAUS: Käytä lähteinä VAIN puolankielisiä verkkosivuja. Jos jokin saamasi hakutulos on muulla kielellä kuin puolaksi, jätä se täysin huomiotta.

2. AIKARAJAUS: Hyväksy vain tiedot ja uutiset, jotka on julkaistu viimeisen kahden viikon aikana (nykyhetki on {{steps['step_1'].result}}). Ohita vanhemmat lähteet, vaikka ne nousisivat hakutuloksissa esiin.

3. KIELI JA MUOTOILU: Käännä ja tiivistä keskeiset havainnot selkeälle suomen kielelle.

4. HTML-MUOTO: Palauta VAIN puhdas HTML-koodi alkaen <!DOCTYPE html> ja päättyen </html>. Älä lisää Markdown-koodilohkoja tai selittävää tekstiä.

5. SISÄLTÖRAKENNE:
   - Raportin otsikko: "Puolalaisten arkiset puheenaiheet – katsaus"
   - Yhteenveto: 2-3 lauseen tiivistelmä tärkeimmistä käänteistä
   - Osiot:
     * Mitä arkisia asioita puolalaiset keskustelevat
     * Missä heidän mielenkiintonsa on
     * Mikä heidän mielialassaan liikuttaa
   - Lähteet: Listaa jokaisen käytetyn lähteen otsikko, julkaisupäivämäärä ja URL

6. TYYPIT: Sisällytä kaikki CSS-tyylit suoraan <style>-tagin sisään <head>-osioon.

7. SÄVY: Käytä neutraalia, ammattimaista ja objektiivista sävyä.

8. YLÄOSA: Lisää raportin yläosaan pieni harmaa laatikko jossa lukee 'Raportti luotu: [päivämäärä]'.

9. TIETOJEN RIITTÄVYYS: Jos dataa ei ole tarpeeksi, kirjoita selkeästi että tietoa ei ole saatavilla.
```

**User Prompt**:
```
Tässä on Tavily-hakukoneen tuloksia puolankielisistä medioista. Tehtäväsi on analysoida nämä tulokset, kääntää keskeiset aiheet suomen kielelle ja luoda viikkokatsaus.

Vastaa seuraavassa muodossa (HTML):
- **Yhteenveto:** 2–3 lauseen tiivistelmä viimeisen kahden viikon tärkeimmistä käänteistä.
- **Keskeiset nostot:** Luettelomerkein tärkeimmät uutiset tai faktat suomeksi.
- **Lähteet:** Listaa jokaisen käytetyn lähteen otsikko, julkaisupäivämäärä ja suora URL-osoite.

DATA:
{{steps['step_2'].result}}
```

### 5. Step 4: GitHub (Tallennus)
- **Kappale**: GitHub
- **Toiminto**: create_or_update_file
- **Asetukset**:
  - **Content**: {{steps['step_3'].result.choices[0].message.content}}
  - **Path**: data/media/{{steps['step_1'].result}}-viikkokatsaus.html
  - **Branch**: main
  - **Commit Message**: Viikkokatsaus {{steps['step_1'].result}}

## Tavily-filtrejä

Jos Tavily tukee näitä parametreja, lisää ne step_2:n inputiin:

```json
{
  "language": "pl",
  "filter_by_language": true,
  "time_range": "2w"
}
```

## Tärkeät huomiot

1. **Kielirajaus**: Tavilyn `language: pl` parametri varmistaa puolankieliset tulokset.

2. **Aikarajaus**: `time_range: 2w` varmistaa että vain viimeisen 2 viikon dataa käytetään.

3. **AI-käännös**: System prompt tiukasti määrittelee että vain puolankielisiä lähteitä käytetään.

4. **Lähteet**: AI:n tulee listata jokaisen käytetyn lähteen otsikko, päivämäärä ja URL.

5. **Scheduling**: Workflow ajautuu viikoittain automaattisesti.

## Testaus

1. Avaa Activepieces
2. Etsi "Puola viikkokatsaus" workflow
3. Klikkaa "Run Now" tai "Test"
4. Tarkista että:
   - Tavily palauttaa puolankielisiä tuloksia
   - AI tuottaa HTML-koodia
   - Raportti tallennetaan GitHubiin

## Vianmääritys

- **Ei puolankielisiä tuloksia**: Tarkista että `language: pl` parametri on oikein
- **Liian vanha data**: Varmista että `time_range: 2w` parametri on asetettu
- **AI ei tuota HTML-koodia**: Tarkista system prompt
- **GitHub-tallennus epäonnistuu**: Tarkista GitHub-yhteys
- **Lähteet puuttuvat**: Varmista että system prompt vaatii lähteiden listauksen