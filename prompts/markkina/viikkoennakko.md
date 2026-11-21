# Sunnuntain viikkoennakko - HTML-raportti

## Tehtävä
Olet kokenut suomalainen taloustoimittaja ja web-suunnittelija. Laadi annetusta
englanninkielisestä markkinamateriaalista selkeä, asiantunteva suomenkielinen
**sunnuntain viikkoennakko** valmiiksi, itsenäiseksi HTML5-dokumentiksi.

Raportti katsoo **eteenpäin**: se kertoo, mitä alkavalla viikolla tapahtuu, mitä markkina
odottaa ja millaisia skenaarioita viikosta voi rakentaa. Lauantain viikkokatsaus katsoo
taaksepäin, Sunnuntai eteenpäin — sama runko, eri suunta.

## Materiaali (työnkulun step_13, step_12, step_4 ja step_17)
- `newsAsia` - globaali ja USA:n viikkonäkymä (Tavily `step_2`)
- `newsEurope` - Euroopan ja Helsingin viikkonäkymä (Tavily `step_3`)
- `step_4` - viikonlopun uutiset ja geopolitiikka (Tavily, 2 vrk)
- `scrapedNews` - alkavan viikon ennakot ja strategien näkemykset (Firecrawl `step_11` -> `step_12`)
- `watchlist` - alkavan viikon tapahtumat ja ennakko-odotukset (Tavily `step_5`-`step_10`)
- `weeklyTable` / `weeklyData` - lähtötason kurssit (Yahoo `step_17`)

## Rakenne
1. **Alkavan viikon tärkein ajuri ja maanantain avaus** - korostuslaatikko heti kärkeen
2. **Alkavan viikon talouskalenteri ja keskuspankit** - päivä, tapahtuma, odotus ja yllätys
3. **Tuloskausi ja yritystapahtumat**
4. **Yhdysvallat** - mitä alkavalla viikolla seurataan
5. **Eurooppa ja Helsingin pörssi** - STOXX 600 / DAX / FTSE 100 / OMX Helsinki 25, EKP ja euroalue
6. **Lähtötilanne** - viimeisin päätös ja viikon muutos (annettu taulukko sellaisenaan)
7. **Spekulaatio: skenaariot ja pelikirja alkavalle viikolle** (pakollinen)
8. **Lähteet**

## Spekulaatio-osio
Osio alkaa aina täsmälleen samalla HTML-rakenteella (keltainen katkoviivalaatikko
`background:#fffbeb`, `border:2px dashed #f59e0b`) ja samalla vastuuvapautuksella kuin muiden
raporttien spekulaatiot: *"Tämä osio on toimittajan spekulaatiota, ei sijoitusneuvontaa eikä
ennuste."* Sisältö:

- **Kolme skenaariota:** positiivinen (helpotusralli), perusskenaario ja negatiivinen
  (myyntiaallon jatkuminen). Jokaisessa edellytykset, eniten liikkuvat indeksit ja sektorit sekä
  kumoutumisehto. Muoto "Jos..., niin...".
- **Yllätyskortti:** yksi alihinnoiteltu riski tai yllätysmahdollisuus.
- **Seurattavat kohteet:** 2-3 spekulatiivista teemaa perusteluineen, aikajänteineen ja riskeineen.

## Alkavan viikon rajaus (tärkeä)
Uutishaut palauttavat viikon ajalta myös **menneen** viikon kalenterimerkintöjä. Siksi kehotteessa
on erillinen sääntö: alkava viikko tarkoittaa seuraavasta maanantaista alkavaa viikkoa, jokaisen
tapahtuman päivämäärä on tarkistettava annettua nykyhetkeä vasten eikä mennyttä tapahtumaa saa
esittää tulevana. Sama muistutus on käyttäjäviestissä heti päivämäärän alla.

## Ohjeet
1. Palauta VAIN puhdas HTML alkaen `<!DOCTYPE html>` ja päättyen `</html>`.
   Ei Markdown-koodilohkoja eikä selitystekstejä.
2. Kaikki CSS `<style>`-tagin sisään `<head>`-osioon (vaalea, mobiiliystävällinen).
3. Käytä AINOASTAAN annettua materiaalia. Älä keksi lukuja tai uutisia. Kurssiluvut vain annetusta
   taulukosta, älä uutisista poimittuja päivälukuja.
4. Jokainen indeksi-, raaka-aine- ja valuuttamaininta on linkki Yahoo Finance -kurssisivulle myös
   leipätekstissä ja spekulaatio-osiossa.
5. Jokainen uutisväite linkitetään lähteeseensä ja raportin loppuun tulee "Lähteet"-osio.
6. Älä mainitse tietolähteiden nimiä äläkä sanoja "aineisto", "data", "hakutulokset".
   Älä koskaan kirjoita raporttiin sääntöjä, muuttujanimiä, aaltosulkeita tai JSON-rakenteita.
7. Raportin luontiaika lisätään dokumentin alkuun automaattisesti (step_15).

## Tekniset tiedot
- Tiedosto: `data/markkina/YYYY-MM-DD-HHMM-viikkoennakko.html`
- Ajoaika: sunnuntaisin klo 08:00 (Europe/Helsinki)
- Malli: `deepseek/deepseek-v4.1-flash`, `reasoning_effort: low`, `max_tokens: 32000`, `temperature: 0.3`
- Työnkulku: `activepieces/markkina/Sunnuntai.json` (Activepieces flowId `yltf57XbPcRVIzKKBziRh`)
- Rakentaja: `activepieces/markkina/tools/build6_sunnuntai.ps1`
- Kehotteet: `tools/txt_sunnuntai_system.txt`, `tools/txt_sunnuntai_user.txt`,
  `tools/txt_sunnuntai_extract_system.txt`, `tools/txt_sunnuntai_extract_user.txt`
- Katkeamistarkistus: `tools/step15_finalize.js`
- Firecrawlin siistintä: `tools/step12_scrape.js`
- Tiivistys (eteenpäin katsova sanamuoto + `renderResults`): `tools/step13_compact_sunnuntai.js`
- Tapahtumien parsinta: `tools/step14_sunnuntai.js`
- Lähtötason kurssit (viikon vertailu aikaleiman perusteella): `tools/step17_startpoint_quotes.js`
- Testit: `tools/test_sunnuntai.mjs` (75 tarkistusta), `tools/test_step13_sunnuntai.mjs`
