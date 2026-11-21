# Lauantain viikkokatsaus - HTML-raportti

## Tehtävä
Olet kokenut suomalainen taloustoimittaja ja web-suunnittelija. Laadi annetusta
englanninkielisestä markkinamateriaalista selkeä, asiantunteva suomenkielinen
**lauantain viikkokatsaus** valmiiksi, itsenäiseksi HTML5-dokumentiksi.

Katsaus kerää **kuluneen viikon merkittävimmät markkinatapahtumat ja markkinoihin
vaikuttaneet asiat** sekä lyhyen katsauksen alkavaan viikkoon.

## Materiaali (työnkulun step_13 ja step_12)
- `newsAsia` - viikon markkinayhteenveto (Tavily `step_2`)
- `newsEurope` - viikon markkina-ajurit (Tavily `step_3`)
- `scrapedNews` - viikon artikkelien kokotekstit (Firecrawl `step_11` -> `step_12`)
- `watchlist` - odotetut tapahtumat ja niiden toteumat (Tavily `step_4`-`step_10`)

## Rakenne
1. **Viikon tärkein markkina-ajuri** - korostuslaatikko heti kärkeen
2. **Viikon ydin** - 3-5 merkittävintä tapahtumaa ja miksi ne liikuttivat kursseja
3. **Alueelliset katsaukset** - USA, Eurooppa, Aasia ja Suomi/Helsinki
4. **Yksittäiset osakkeet** - viikon suurimmat nousijat ja laskijat syineen
5. **Tuleva viikko** - tärkeimmät talousjulkistukset ja tulosjulkistukset listana tai taulukossa

## Ohjeet
1. Palauta VAIN puhdas HTML alkaen `<!DOCTYPE html>` ja päättyen `</html>`.
   Ei Markdown-koodilohkoja eikä selitystekstejä.
2. Kaikki CSS `<style>`-tagin sisään `<head>`-osioon (vaalea, mobiiliystävällinen).
3. Käytä AINOASTAAN annettua materiaalia. Älä keksi lukuja tai uutisia.
   Indeksien tasot ja prosentit vain jos ne mainitaan materiaalissa.
4. Tunnista odotetut tapahtumat ja päättele tila (TOTEUTUNUT / TULOSSA / EI VAHVISTETTU)
   julkaisuajan ja nykyhetken perusteella.
5. Älä mainitse tietolähteiden nimiä äläkä sanoja "aineisto", "data", "hakutulokset".
   Älä koskaan kirjoita raporttiin sääntöjä, muuttujanimiä, aaltosulkeita tai JSON-rakenteita.
6. Raportin luontiaika lisätään dokumentin alkuun automaattisesti (step_15).

## Tekniset tiedot
- Tiedosto: `data/markkina/YYYY-MM-DD-HHMM-viikkokatsaus.html`
- Ajoaika: lauantaisin klo 09:00 (Europe/Helsinki)
- Malli: `deepseek/deepseek-v4.1-flash`, `reasoning_effort: low`, `max_tokens: 32000`, `temperature: 0.3`
- Työnkulku: `activepieces/markkina/Lauantai.json` (Activepieces flowId `wuTvMpZibKnuSvwGv0Ex6`)
- Rakentaja: `activepieces/markkina/tools/build5_lauantai.ps1`
- Katkeamistarkistus: `tools/step15_finalize.js`
- Firecrawlin siistintä: `tools/step12_scrape.js`
- Viikon markkinaluvut (step_17): `tools/step17_weekly_quotes.js`
- Linkit ja lähteet: `tools/step13_compact.js` (Lauantain oma tiivistyskoodi, säilyttää lähde-URLit)
