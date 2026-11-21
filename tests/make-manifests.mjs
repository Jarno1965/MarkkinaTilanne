// Päivittää data/<syöte>/index.json -manifestit vastaamaan levyllä olevia raportteja.
//
// Manifesti on vain paikallista kehitystä varten: localhostilla sivusto lukee sen
// ensisijaisesti (../data/<syöte>/index.json) ja vasta toissijaisesti GitHubin
// Contents API:a. Tuotannossa järjestys on päinvastainen, joten tämä tiedosto ei
// vaikuta julkaistuun sivustoon.
//
// Aja aina kun raportteja on lisätty tai poistettu, muuten paikallinen lista jää
// vanhentuneeksi (näin kävi 21.11.2026, kun data/media/index.json listasi 6 tiedostoa
// vaikka kansiossa oli 13).
//
//   node tests/make-manifests.mjs
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'data');
const FILE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})-(\d{4})-([a-z0-9-]+)\.html$/;

const feeds = readdirSync(dataDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (feeds.length === 0) {
  console.error('Kansiosta ' + dataDir + ' ei löytynyt yhtään syötettä.');
  process.exit(1);
}

let total = 0;
for (const feed of feeds) {
  const feedDir = join(dataDir, feed);
  const files = readdirSync(feedDir).filter((name) => FILE_PATTERN.test(name)).sort();
  const manifestPath = join(feedDir, 'index.json');

  let comment = '';
  if (existsSync(manifestPath)) {
    try {
      comment = JSON.parse(readFileSync(manifestPath, 'utf8'))._comment || '';
    } catch (e) {
      comment = '';
    }
  }
  if (!comment) {
    comment = 'Vain paikalliseen kehitykseen. Sisältää data/' + feed +
      '/-kansion tiedostonimet, jotta sivustoa voi testata ennen kuin repositorio on ' +
      'julkaistu GitHubissa. Tämä tiedosto ei ole käytössä tuotannossa. Jokaisella syötteellä on oma index.json.';
  }

  const payload = { _comment: comment, files: files };
  writeFileSync(manifestPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');

  total += files.length;
  console.log('  ' + feed.padEnd(12) + files.length + ' raporttia');
}

console.log('\nYhteensä ' + total + ' raporttia ' + feeds.length + ' syötteessä.');
